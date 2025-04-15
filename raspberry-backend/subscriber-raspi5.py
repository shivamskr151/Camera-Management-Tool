import json
import time
import threading
import ssl
import paho.mqtt.client as mqtt
from onvif import ONVIFCamera
import pymongo
import subprocess
import os
import logging
from logging.handlers import RotatingFileHandler
import signal
import sys
from threading import Lock
from pathlib import Path

current_dir = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = current_dir  # Changed to use the same directory as the script

# MQTT Connection Types
MQTT_CONNECTION_TYPES = {
    "CREDENTIALS": "credentials",
    "CERTIFICATE": "certificate"
}

# MQTT Credentials - Default values (will be overridden by environment variables if available)
MQTT_HOST = os.environ.get("MQTT_HOST", "sd320117.ala.asia-southeast1.emqxsl.com")
MQTT_PORT = int(os.environ.get("MQTT_PORT", "8883"))
MQTT_USERNAME = os.environ.get("MQTT_USERNAME", "variphi")
MQTT_PASSWORD = os.environ.get("MQTT_PASSWORD", "Variphi@2025")
MQTT_KEEPALIVE = int(os.environ.get("MQTT_KEEPALIVE", "60"))
MQTT_CONNECT_TIMEOUT = int(os.environ.get("MQTT_CONNECT_TIMEOUT", "30"))
MQTT_CONNECTION_TYPE = os.environ.get("MQTT_CONNECTION_TYPE", MQTT_CONNECTION_TYPES["CREDENTIALS"])
MQTT_CLIENT_ID = os.environ.get("MQTT_CLIENT_ID", "variphi_client2")
# Certificate paths (if using certificate-based authentication)
MQTT_CA_CERT = os.environ.get("MQTT_CA_CERT", "")
MQTT_CLIENT_CERT = os.environ.get("MQTT_CLIENT_CERT", "")
MQTT_CLIENT_KEY = os.environ.get("MQTT_CLIENT_KEY", "")

# Global variables for configurations
config = None
camera_details = None
mqtt_topics = None
mongo_db = None
system_settings = None

# Active Patrol Tracking
subscriber = None
active_patrols = {}

# ---------------------------------------------------
# 🛠️ Setup Logging
# ---------------------------------------------------

def setup_logging():
    """Set up logging with rotation."""
    root_dir = str(os.path.dirname(__file__))
    log_dir = os.path.join(root_dir, "logs")
    log_file = os.path.join(log_dir, "service.log")

    if not os.path.exists(log_dir):
        os.makedirs(log_dir)  # Ensure log directory exists

    handler = RotatingFileHandler(log_file, maxBytes=10 * 1024 * 1024, backupCount=5)  # 10MB per log, keep 5 backups
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)

    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    logger.addHandler(handler)


# ---------------------------------------------------
# 📄 Configuration Handling
# ---------------------------------------------------

def load_config():
    """Load and validate configuration from file."""
    try:
        with open(f"{ROOT_DIR}/configuration.json", "r") as file:
            config_data = json.load(file)

        if not validate_config(config_data):
            raise ValueError("Configuration validation failed")

        logging.info("Configuration loaded and validated successfully")
        return config_data
    except Exception as e:
        logging.error(f"Failed to load configuration: {e}")
        sys.exit(1)


def validate_config(config_data):
    """Validate configuration structure and required fields."""
    required_fields = { 
        "camera_details": ["host", "http_port", "username", "password"],
        "mqtt_topics": ["control", "response"],
        "mongo_db_client": ["uri", "database", "collection"],
        "system": ["configurations_folder_path", "services_to_restart", "all_configuration_sufix", "auto_update_interval"]
    }

    try:
        for section, fields in required_fields.items():
            if section not in config_data["service_settings"]:
                raise ValueError(f"Missing required section: {section}")

            for field in fields:
                if field not in config_data["service_settings"][section]:
                    raise ValueError(f"Missing field {field} in section {section}")

        return True
    except Exception as e:
        logging.error(f"Configuration validation failed: {e}")
        return False


# ---------------------------------------------------
# 🌐 MQTT Subscriber Class
# ---------------------------------------------------

class MQTTSubscriber:
    """Handles MQTT connection, message processing, and camera control."""

    def __init__(self, sensor_id):
        """Initialize MQTT client and other components."""
        self.sensor_id = sensor_id
        # Create MQTT client with client ID
        self.client = mqtt.Client(client_id=MQTT_CLIENT_ID)
        
        # Set up MQTT connection based on connection type
        self._setup_mqtt_connection()
        
        # Enable debug messages
        self.client.on_log = self.on_log
        
        # Set callbacks
        self.client.on_connect = self.on_connect
        self.client.on_disconnect = self.on_disconnect
        self.client.on_message = self.on_message
        
        # Set connection parameters
        self.client.connect(MQTT_HOST, MQTT_PORT, keepalive=MQTT_KEEPALIVE)
        
        #camera state
        self.camera = None
        self.ptz_service = None
        self.profile_token = None
        self.camera_auth_check=None

        # Threading and process management
        self.ffmpeg_processes = {}
        self._shutdown_events = {}
        self._patrol_threads = {}
        self._patrol_lock = Lock()
        self._ffmpeg_lock = Lock()
        self._active_patrols = {}
        
    def _setup_mqtt_connection(self):
        """Set up MQTT connection based on the connection type."""
        if MQTT_CONNECTION_TYPE == MQTT_CONNECTION_TYPES["CREDENTIALS"]:
            # Username/password authentication
            self.client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
            
            # Set up SSL/TLS
            self.client.tls_set(cert_reqs=ssl.CERT_NONE)  # Temporarily disable certificate verification for testing
            self.client.tls_insecure_set(True)  # Allow self-signed certificates
            
        elif MQTT_CONNECTION_TYPE == MQTT_CONNECTION_TYPES["CERTIFICATE"]:
            # Certificate-based authentication
            if not all([MQTT_CA_CERT, MQTT_CLIENT_CERT, MQTT_CLIENT_KEY]):
                logging.error("Certificate paths not provided for certificate-based authentication")
                raise ValueError("Missing certificate paths for certificate-based authentication")
                
            # Set up SSL/TLS with certificates
            self.client.tls_set(
                ca_certs=MQTT_CA_CERT,
                certfile=MQTT_CLIENT_CERT,
                keyfile=MQTT_CLIENT_KEY,
                cert_reqs=ssl.CERT_REQUIRED
            )
            self.client.tls_insecure_set(False)  # Enforce certificate verification
            
        else:
            # Default to username/password authentication
            logging.warning(f"Unknown connection type: {MQTT_CONNECTION_TYPE}. Using default credentials.")
            self.client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
            self.client.tls_set(cert_reqs=ssl.CERT_NONE)
            self.client.tls_insecure_set(True)

    # ---------------------------------------------------
    # 📡 MQTT Event Handlers
    # ---------------------------------------------------

    def on_connect(self, client, userdata, flags, rc):
        """Handle successful connection to MQTT broker."""
        if rc == 0:
            print("✅ Connected to MQTT broker")
            control_topic = mqtt_topics["control"].format(sensor_id=self.sensor_id)
            response_topic = mqtt_topics["response"].format(sensor_id=self.sensor_id)

            self.client.subscribe([(control_topic, 0), (response_topic, 0)])
            print(f"📡 Subscribed to topics: {control_topic}, {response_topic}")
        else:
            print(f"❌ Connection failed with code {rc}")

    def on_disconnect(self, client, userdata, rc):
        """Handle unexpected disconnections and attempt full reconnection."""
        print("❌ Disconnected from MQTT broker. Attempting to reconnect...")

        # Properly disconnect and clean up
        try:
            client.loop_stop()  # Stop MQTT loop
            client.disconnect()  # Disconnect the client
            print("🔌 MQTT client fully disconnected.")
        except Exception as e:
            print(f"⚠️ Error during disconnect: {e}")

        # Retry mechanism for reconnection
        max_retries = 5
        for attempt in range(max_retries):
            try:
                print(f"🔄 Reconnecting... Attempt {attempt + 1}/{max_retries}")
                self.start()  # Restart the MQTT connection
                print("✅ Successfully reconnected!")
                return  # Exit if successful
            except Exception as e:
                print(f"⚠️ Reconnection attempt {attempt + 1} failed: {e}")
                time.sleep(5)  # Wait before retrying

        print("🚨 Could not reconnect after multiple attempts. Manual intervention required.")

    def on_log(self, client, userdata, level, buf):
        """Callback for MQTT client logging."""
        logging.info(f"MQTT Log: {buf}")

    def on_message(self, client, userdata, msg):
        """Handle incoming MQTT messages."""
        try:
            topic = msg.topic
            payload = json.loads(msg.payload.decode())
            command = payload.get("command")

            logging.info(f"[{self.sensor_id}] Received command: {command}")

            command_methods = {
                "move": lambda: self.move_camera(payload.get("pan", 0), payload.get("tilt", 0), payload.get("zoom", 0), payload.get("velocity", 0.5)),
                "stop_ptz": lambda: self.stop_camera(),
                "test": lambda: self.testing_function(),
                "create_preset": lambda: self.create_preset(payload.get("preset_name")),
                "go-to-preset": lambda: self.move_to_preset(payload.get("preset_name")),
                "start_patrol": lambda: self.start_patrol(payload.get("presets", [])),
                "stop_patrol": self.stop_patrol(),
                "set_fpsbr": lambda: self.set_fpsbr(payload.get("fps", None),payload.get("width", None),payload.get("height", None),payload.get("BitrateLimit", None)),
                "set_time": lambda: self.set_time(payload.get("timezone", "UTC"), payload.get("ntp_server", "pool.ntp.org")),
                "update_configuration": lambda: self.update_local_config(payload.get("sensor_id")),
                "start_stream": lambda: self.start_streaming(payload.get("rtmp_url"), payload.get("stream_timer"), payload.get("streaming_fps")),
                "stop_stream": self.stop_streaming,
                "start_on_demand_stream": lambda: self.start_on_demand_stream(payload.get("rtmp_url"), payload.get("video_file")),
                "stop_on_demand_stream": self.stop_on_demand_stream
                # ,
                # "update_model": lambda: self.update_model(payload.get("model_url"), payload.get("type"))
            }

            if command in command_methods:
                command_methods[command]()
            else:
                logging.warning(f"Unknown command received: {command}")

        except Exception as e:
            logging.error(f"Error processing message: {e}")
    
    def testing_function(self):
        print ("successfull")


    def init_camera(self):
        """Initialize ONVIF Camera and return PTZ & media services."""
        try:
            cam_config = camera_details
            if not cam_config:
                print(f"⚠️ Camera {self.sensor_id} not found in configuration.")
                return None, None, None

            print(f"🎥 Initializing ONVIF Camera: {self.sensor_id} ({cam_config['host']})...")
            
            if (self.camera == None or self.ptz_service == None or self.profile_token == None):
                
                host=str(cam_config["host"])
                http_port=cam_config["http_port"]
                username=cam_config["onvifusername"]
                password=cam_config["onvifpassword"]
                # Connect to camera
                self.camera = ONVIFCamera(str(host),int(http_port),str(username),str(password),no_cache=True)
                time.sleep(1)

                # Create PTZ and media services
                self.ptz_service = self.camera.create_ptz_service()
                media_service = self.camera.create_media_service()
                
                # Fetch media profile
                profiles = media_service.GetProfiles()
                if not profiles:
                    print(f"⚠️ No media profiles found for {self.sensor_id}.")
                    return None, None, None
                self.profile_token = profiles[0].token

                print("Yes Bro")
                # media_profile = profiles[0].token  # Use the first profile
            
            
            print(f"✅ ONVIF Camera initialized: {self.sensor_id} (Profile: {self.profile_token})")
            return self.camera, self.ptz_service, self.profile_token

        except Exception as e:
            print(f"❌ Error initializing camera {self.sensor_id}: {e}")
            self.camera = None 
            self.ptz_service = None 
            self.profile_token = None
            return None, None, None


    def cleanup(self):
        """Enhanced cleanup with timeout and error handling."""
        try:
            logging.info(f"[{self.sensor_id}] Starting cleanup...")
            cleanup_timeout = 10  # seconds
            cleanup_start = time.time()
            
            # Set shutdown event
            for sensor_id in self._shutdown_events.keys():
                self._shutdown_events[sensor_id].set()
            
            # Stop all patrols
            with self._patrol_lock:
                self._active_patrols[self.sensor_id] = False
                
                for thread in self._patrol_threads.values():
                    thread_timeout = max(0, cleanup_timeout - (time.time() - cleanup_start))
                    if thread.is_alive():
                        thread.join(timeout=thread_timeout)
            
            # Stop all streams
            with self._ffmpeg_lock:
                for sensor_id in list(self.ffmpeg_processes.keys()):
                    try:
                        logging.info(f"Stopping stream for {sensor_id}")
                        stop_on_demand_stream()
                    except Exception as e:
                        logging.error(f"Error stopping stream for {sensor_id}: {e}")
            
            # Stop MQTT client
            try:
                logging.info("Stopping MQTT client...")
                self.client.loop_stop()
                self.client.disconnect()
            except Exception as e:
                logging.error(f"Error disconnecting MQTT client: {e}")
            
            logging.info("Cleanup completed successfully")
            
        except Exception as e:
            logging.error(f"Error during cleanup: {e}")
        finally:
            # Ensure all handlers are closed
            for handler in logging.handlers[:]:
                handler.close()
                logging.removeHandler(handler)

    # MongoDB Connection
    def get_mongo_client_setup(self):
        try:
            client = pymongo.MongoClient(mongo_db_client["uri"], tls=True, tlsAllowInvalidCertificates=True)
            logging.info("MongoDB connection established")
            return client
        except Exception as e:
            logging.error(f"MongoDB Connection Error: {e}")
            return None

    # Fetch Config from MongoDB
    def fetch_config(self,sensor_id):
        try:
            mongodb_client = self.get_mongo_client_setup()
            print(mongodb_client)
            if not mongodb_client:
                return None

            db = mongodb_client[mongo_db_client["database"]]
            collection = db[mongo_db_client["collection"]]
            db_data = collection.find_one({"_id": sensor_id})
            print(db_data)

            if not db_data:
                logging.warning(f"No config found for {sensor_id} in MongoDB")
                return None

            logging.info(f"Configuration fetched from MongoDB for {sensor_id}")
            print(db_data)
            return db_data

        except Exception as e:
            logging.error(f"Error fetching config: {e}")
            return None

    # Update Local Config File
    def update_local_config(self,sensor_id):
        global camera_details
        new_config = self.fetch_config(sensor_id)["config_content"]
        if new_config:
        # ✅ If config_content is stored as a string, parse it back to JSON
            if isinstance(new_config, str):  
                new_config = json.loads(new_config)  
                print("✅ Converted JSON String to Normal JSON:", json.dumps(new_config, indent=4))

        else:
            print(f"❌ No configuration found for {sensor_id}")
            return

        try:
            config_path = f"{ROOT_DIR}/configuration.json"  
            with open(config_path, "w") as file:
                json.dump(new_config, file, indent=4)

            logging.info(f"Configuration updated at {config_path}")

            # camera_details = new_config.get("camera_details", {})
            self.restart_services()

        except Exception as e:
            logging.error(f"Error updating config file: {e}")


    # Restart Services
    def restart_services(self,service_name=None):
        try:
            if service_name:
                logging.info(f"Restarting service: {service_name}")
                subprocess.run(["sudo","systemctl", "restart", service_name], check=True)
                logging.info(f"Service restarted: {service_name}")
            else:
                logging.info("Restarting all services")
                for service in system_settings["services_to_restart"]:
                    subprocess.run(["sudo","systemctl", "restart", service], check=True)
                    logging.info(f"Restarted service: {service}")

        except subprocess.CalledProcessError as e:
            logging.error(f"Error restarting service: {service_name or 'ALL'} - {e}")
        except Exception as e:
            logging.error(f"Unexpected error during service restart: {e}")
    def start_streaming(self, rtmp_url, stream_timer, fps=15):
        if not isinstance(fps, int):
            fps = 15
        if not isinstance(stream_timer, int):
            stream_timer = 5
        """Update config with RTMP URL, FPS, Timer, and restart streaming service."""
        config_path = f"{ROOT_DIR}/configuration.json"  

        try:
            with open(config_path, "r") as file:
                config_data = json.load(file)

            config_data["service_settings"]["camera_details"]["RTMP_URL"] = rtmp_url
            config_data["streaming_service"]["live_streaming"] = "True"
            config_data["streaming_service"]["stream_timer"] = stream_timer
            config_data["streaming_service"]["streaming_fps"] = fps

            with open(config_path, "w") as file:
                json.dump(config_data, file, indent=4)

            print(f"✅ [{self.sensor_id}] Streaming started. RTMP: {rtmp_url}, FPS: {fps}, Duration: {stream_timer} mins")
            self.restart_services("cam_stream.service")

            # Schedule auto-stop if not "always"
            if isinstance(stream_timer, int):
                threading.Timer(stream_timer * 60, self.stop_streaming).start()

        except Exception as e:
            print(f"❌ [{self.sensor_id}] Error updating RTMP config: {e}")

    def stop_streaming(self):
        """Disable streaming by updating config and restarting service."""
        config_path = f"{ROOT_DIR}/configuration.json"  

        try:
            with open(config_path, "r") as file:
                config_data = json.load(file)

            config_data["streaming_service"]["live_streaming"] = "False"
            config_data["streaming_service"]["stream_timer"] = 5
            config_data["streaming_service"]["streaming_fps"] = 15

            with open(config_path, "w") as file:
                json.dump(config_data, file, indent=4)

            print(f"🛑 [{self.sensor_id}] Stopping RTMP stream...")
            restart_services("cam_stream.service")

        except Exception as e:
            print(f"❌ [{self.sensor_id}] Error stopping stream: {e}")

    def start_on_demand_stream(self, rtmp_url, video_file):
        """Start streaming video to RTMP using FFmpeg."""
        if self.sensor_id in self.ffmpeg_processes:
            print(f"⚠️ [{self.sensor_id}] Stream already running. Stop it first!")
            return

        if not os.path.exists(video_file):
            print(f"❌ [{self.sensor_id}] Video file not found: {video_file}")
            return

        ffmpeg_cmd = [
            "ffmpeg", "-re", "-i", video_file, "-c:v", "libx264", "-preset", "ultrafast",
            "-tune", "zerolatency", "-b:v", "800k", "-maxrate", "800k", "-bufsize", "1600k",
            "-vf", "scale=1280:720", "-c:a", "aac", "-b:a", "128k", "-f", "flv", rtmp_url
        ]

        try:
            process = subprocess.Popen(ffmpeg_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            self.ffmpeg_processes[self.sensor_id] = process
            print(f"🎥 [{self.sensor_id}] Started streaming {video_file} to {rtmp_url}")

        except Exception as e:
            print(f"❌ [{self.sensor_id}] Error starting stream: {e}")

    def stop_on_demand_stream(self):
        """Stop FFmpeg streaming for this camera."""
        if self.sensor_id in self.ffmpeg_processes:
            process = self.ffmpeg_processes[self.sensor_id]
            process.terminate()  # Send SIGTERM to stop FFmpeg
            process.wait()
            del self.ffmpeg_processes[self.sensor_id]
            print(f"🛑 [{self.sensor_id}] Stopped video stream.")

        else:
            print(f"⚠️ [{self.sensor_id}] No active stream to stop.")

    def move_camera(self, pan, tilt, zoom, velocity=0.5):
        """Move PTZ camera with velocity indefinitely until a stop command is received."""
        print(f"🎥 Moving {self.sensor_id} - Pan: {pan}, Tilt: {tilt}, Zoom: {zoom}, Velocity: {velocity}")

        # Ensure velocity is within safe limits
        velocity = max(0.1, min(velocity, 1.0))

        # Initialize camera & PTZ service
        camera, ptz_service, profile_token = self.init_camera()
        if not ptz_service:
            print(f"⚠️ PTZ service unavailable. Cannot move camera.")
            return
        print(camera,ptz_service,profile_token)
        # Create movement request
        move_request = ptz_service.create_type("ContinuousMove")
        move_request.ProfileToken = profile_token
        move_request.Velocity = {
            "PanTilt": {"x": pan * velocity, "y": tilt * velocity},
            "Zoom": {"x": zoom * velocity}
        }

        # Start movement
        ptz_service.ContinuousMove(move_request)
        print(f"✅ [{self.sensor_id}] Camera is moving... Send 'stop' command to halt.")

        # except Exception as e:
        #     print(f"❌ Error moving camera {self.sensor_id}: {e}")

    def stop_camera(self):
        """Stop PTZ camera movement."""
        try:
            print(f"🛑 Stopping camera movement for {self.sensor_id}...")

            # Initialize camera & PTZ service
            camera, ptz_service, profile_token = self.init_camera()
            if not ptz_service:
                print(f"⚠️ PTZ service unavailable. Cannot stop camera.")
                return

            # Create stop request
            stop_request = ptz_service.create_type("Stop")
            stop_request.ProfileToken = profile_token
            stop_request.PanTilt = True
            stop_request.Zoom = True

            # Stop movement
            ptz_service.Stop(stop_request)
            print(f"✅ [{self.sensor_id}] Camera movement stopped.")

        except Exception as e:
            print(f"❌ Error stopping camera {self.sensor_id}: {e}")


    def move_to_preset(self, preset_name):
        """Move camera to a preset position by name."""
        try:
            print(f"🎯 Looking for preset: {preset_name}...")

            # Ensure "presets" exist in camera details
            if "presets" not in camera_details or not camera_details["presets"]:
                print(f"⚠️ No presets found for sensor {self.sensor_id}.")
                return

            # Find the preset token by name
            preset_token = next((p["token"] for p in camera_details["presets"] if p["name"] == preset_name), None)
            if not preset_token:
                print(f"⚠️ Preset '{preset_name}' not found.")
                return

            # Initialize camera & PTZ service
            camera, ptz_service, profile_token = self.init_camera()
            if not ptz_service:
                print(f"⚠️ PTZ service unavailable. Cannot move to preset '{preset_name}'.")
                return

            # Create request to move to preset
            preset_request = ptz_service.create_type("GotoPreset")
            preset_request.ProfileToken = profile_token
            preset_request.PresetToken = preset_token

            # Execute preset move
            ptz_service.GotoPreset(preset_request)
            print(f"✅ [{self.sensor_id}] Successfully moved to preset '{preset_name}'")

        except Exception as e:
            print(f"❌ Error moving to preset '{preset_name}': {e}")



    def create_preset(self, preset_name):
        """Save the current PTZ position as a preset and update the local configuration."""

        try:
            config_path = f"{ROOT_DIR}/configuration.json"  

            # Load existing configuration
            with open(config_path, "r") as file:
                config_data = json.load(file)

            # Initialize camera & PTZ service
            print(f"📌 Creating preset: {preset_name}...")
            camera, ptz_service, profile_token = self.init_camera()

            if not ptz_service:
                print("⚠️ PTZ service unavailable. Cannot create preset.")
                return

            # Get current presets from the camera
            existing_presets = ptz_service.GetPresets({"ProfileToken": profile_token})
            existing_preset_map = {p.Name: p.token for p in existing_presets}  # Map preset names to tokens
            print(existing_preset_map)

            # ✅ **Remove non-existing presets from config**
            if "camera_details" in config_data["service_settings"] and "presets" in config_data["service_settings"]["camera_details"]:
                saved_presets = config_data["service_settings"]["camera_details"]["presets"]
                updated_presets = [p for p in saved_presets if p["name"] in existing_preset_map.keys() and p["token"] == existing_preset_map[p["name"]]]
                print(saved_presets,updated_presets)

                if len(updated_presets) != len(saved_presets):  # Only update if something changed
                    config_data["service_settings"]["camera_details"]["presets"] = updated_presets
                    with open(config_path, "w") as file:
                        json.dump(config_data, file, indent=4)
                    print("🔄 Removed presets that are no longer available in the camera.")

            # 🔍 Check if preset already exists
            if preset_name in existing_preset_map:
                preset_token = existing_preset_map[preset_name]
                print(f"✅ Preset '{preset_name}' already exists with token: {preset_token}")

                # Update local config if missing
                existing_preset_tokens = {p["name"]: p["token"] for p in config_data["camera_details"].get("presets", [])}

                if preset_name not in existing_preset_tokens:
                    config_data["service_settings"]["camera_details"]["presets"].append({"name": preset_name, "token": preset_token})
                    
                    # Save updated config
                    with open(config_path, "w") as file:
                        json.dump(config_data, file, indent=4)
                    
                    print(f"✅ Preset '{preset_name}' added to local config.")
                else:
                    print(f"📌 Preset '{preset_name}' already exists in local config.")
                
                return  # Exit without creating a duplicate preset

            # If the preset does not exist, create a new one
            print(f"📌 Creating new preset: {preset_name}...")

            # Create preset request
            preset_request = ptz_service.create_type("SetPreset")
            print(preset_request)
            preset_request.ProfileToken = profile_token
            preset_request.PresetName = preset_name
            print(preset_request)

            # Execute preset creation
            response = ptz_service.SetPreset(preset_request)
            print(response)
            # 🔥 Fix: Use response as token if it's an integer or string
            if isinstance(response, (str, int)):  
                preset_token = str(response)  # Convert to string for consistency
            else:
                print("❌ Unexpected response format:", response)
                return

            # Store preset details
            camera_details["presets"].append({"name": preset_name, "token": preset_token})
            config_data["service_settings"]["camera_details"]["presets"] = camera_details["presets"]

            # Save updated config
            with open(config_path, "w") as file:
                json.dump(config_data, file, indent=4)

            print(f"✅ Preset '{preset_name}' saved successfully with token: {preset_token}")


        except FileNotFoundError:
            print(f"❌ Config file not found: {config_path}")
        except json.JSONDecodeError:
            print(f"❌ Error reading JSON from {config_path}")
        except Exception as e:
            print(f"❌ Unexpected error while creating preset '{preset_name}': {e}")


    def start_patrol(self, preset_names):
        """Start patrolling between given presets with proper locking and error handling."""
        print("I am running")
        with self._patrol_lock:
            if not camera_details:
                logging.error(f"❌ No camera config found for sensor {self.sensor_id}")
                return
            
            
            # Map preset names to tokens
            presets = {p["name"]: p["token"] for p in camera_details.get("presets", [])}
            
            print(preset_names)
            # Validate and filter preset names
            selected_presets = [name for name in preset_names if name in presets]

            if not selected_presets:
                logging.warning(f"⚠️ No valid presets found for sensor {self.sensor_id}")
                return
            
            # Prevent multiple patrols from starting
            if self._active_patrols.get(self.sensor_id, False):
                logging.warning(f"⚠️ Patrol already running for {self.sensor_id}")
                return

            # Mark patrol as active
            # ✅ Initialize shutdown event per camera
            self._shutdown_events[self.sensor_id] = threading.Event()
            self._active_patrols[self.sensor_id] = True

            def patrol():
                logging.info(f"🚀 Patrol started for {self.sensor_id}")
                try:
                    while self._active_patrols.get(self.sensor_id) and not self._shutdown_events[self.sensor_id].is_set():
                        for preset_name in selected_presets:
                            if not self._active_patrols.get(self.sensor_id) or self._shutdown_events[self.sensor_id].is_set():
                                logging.info(f"🛑 Patrol stopping for {self.sensor_id}")
                                return
                            try:
                                logging.info(f"📌 Moving to preset {preset_name} for {self.sensor_id}")
                                self.move_to_preset(preset_name)
                                time.sleep(5)  # Adjust patrol wait time as needed
                            except Exception as e:
                                logging.error(f"❌ Error moving to preset {preset_token}: {e}")
                                return
                finally:
                    logging.info(f"✅ Patrol completed for {self.sensor_id}")
                    self._active_patrols[self.sensor_id] = False

            # Create and start patrol thread
            patrol_thread = threading.Thread(target=patrol, daemon=True)
            self._patrol_threads[self.sensor_id] = patrol_thread
            patrol_thread.start()

    def stop_patrol(self):
        """Stop the patrol sequence for the given sensor."""

        # ✅ Ensure the patrol is actually running before stopping
        if not self._active_patrols.get(self.sensor_id, False):
            logging.warning(f"⚠️ No active patrol to stop for {self.sensor_id}")
            return

        logging.info(f"🛑 Stopping patrol for {self.sensor_id}")

        # ✅ Ensure `self._shutdown_events[self.sensor_id]` exists before calling `.set()`
        if self.sensor_id in self._shutdown_events and self._shutdown_events[self.sensor_id]:
            self._shutdown_events[self.sensor_id].set()  # Stop patrol thread
        else:
            logging.error(f"❌ Cannot stop patrol: Shutdown event missing for {self.sensor_id}")
            return

        self._active_patrols[self.sensor_id] = False

        # ✅ Ensure patrol thread exists before trying to join
        if self.sensor_id in self._patrol_threads:
            try:
                self._patrol_threads[self.sensor_id].join(timeout=5.0)
                del self._patrol_threads[self.sensor_id]
                logging.info(f"✅ Patrol thread cleaned up for {self.sensor_id}")
            except Exception as e:
                logging.error(f"❌ Error stopping patrol thread: {e}")

        # ✅ Remove shutdown event for cleanup
        if self.sensor_id in self._shutdown_events:
            del self._shutdown_events[self.sensor_id]

        logging.info(f"✅ Patrol stopped for {self.sensor_id}")


    def set_fpsbr(self, fps=None, width=None, height=None, BitrateLimit=None):
        """Set the frame rate (FPS), resolution, and bitrate for the camera's video stream."""

        # ✅ Return immediately if all parameters are None (nothing to update)
        if fps is None and width is None and height is None and BitrateLimit is None:
            print(f"⚠️ [{self.sensor_id}] No changes requested (FPS, Resolution, Bitrate all None). Exiting.")
            return

        try:
            # ✅ Initialize camera and media service
            camera, ptz_service, profile_token = self.init_camera()
            if not camera:
                print(f"❌ [{self.sensor_id}] Camera initialization failed.")
                return

            media_service = camera.create_media_service()
            if not media_service:
                print(f"❌ [{self.sensor_id}] Failed to connect to media service.")
                return

            # ✅ Retrieve available video encoder configurations
            video_configs = media_service.GetVideoEncoderConfigurations()
            if not video_configs:
                print(f"❌ [{self.sensor_id}] No video encoder configurations found.")
                return

            # ✅ Select the first encoder configuration (most cameras have only one)
            video_config = video_configs[0]

            # ✅ Create request to modify video settings
            request = media_service.create_type("SetVideoEncoderConfiguration")
            request.Configuration = video_config  # Use existing config
            request.Configuration.Name = video_config.Name  # Preserve name

            # ✅ Update FPS if provided
            if fps is not None:
                if hasattr(request.Configuration.RateControl, "FrameRateLimit"):
                    request.Configuration.RateControl.FrameRateLimit = fps
                else:
                    print(f"⚠️ [{self.sensor_id}] FrameRateLimit attribute missing in RateControl.")
                    return

            # ✅ Update Resolution if width and height are provided
            if width is not None and height is not None:
                request.Configuration.Resolution.Width = width
                request.Configuration.Resolution.Height = height

            # ✅ Update BitrateLimit if provided
            if BitrateLimit is not None:
                if hasattr(request.Configuration.RateControl, "BitrateLimit"):
                    request.Configuration.RateControl.BitrateLimit = BitrateLimit
                else:
                    print(f"⚠️ [{self.sensor_id}] BitrateLimit attribute missing in RateControl.")
                    return

            # ✅ Ensure ForcePersistence is set (prevents ONVIF errors)
            if hasattr(request, "ForcePersistence"):
                request.ForcePersistence = True
            else:
                print(f"⚠️ [{self.sensor_id}] ForcePersistence attribute missing. Trying without it.")

            print(request)

            # ✅ Apply the changes
            print(f"🎥 [{self.sensor_id}] Updating settings: FPS={fps}, Resolution=({width}x{height}), Bitrate={BitrateLimit}")
            media_service.SetVideoEncoderConfiguration(request)

            print(f"✅ [{self.sensor_id}] Camera settings updated successfully.")

        except Exception as e:
            print(f"❌ [{self.sensor_id}] Error updating camera settings: {e}")

    def set_time(self, timezone, ntp_server):
        """Set camera time settings."""
        camera, time_service, _ = self.init_camera()
        if not time_service:
            return

        request = time_service.create_type("SetSystemDateAndTime")
        request.DateTimeType = "NTP"
        request.DaylightSavings = False
        request.TimeZone = {"TZ": timezone}
        request.UTCDateTime = {"Time": {"Hour": 12, "Minute": 0, "Second": 0}}

        time_service.SetSystemDateAndTime(request)

        # Set NTP Server
        ntp_request = time_service.create_type("SetNTP")
        ntp_request.NTPManual = [{"Type": "IPv4", "IPv4Address": ntp_server}]
        time_service.SetNTP(ntp_request)

        print(f"⏳ [{self.sensor_id}] Time updated to {timezone} using {ntp_server}")

    def start(self):
        """Start MQTT client connection."""
        try:
            # Set connection timeout
            self.client.connect(MQTT_HOST, MQTT_PORT, keepalive=MQTT_KEEPALIVE)
            
            # Start the MQTT loop in a separate thread
            self.client.loop_start()
            
            # Log connection details
            connection_type = "Certificate-based" if MQTT_CONNECTION_TYPE == MQTT_CONNECTION_TYPES["CERTIFICATE"] else "Username/Password"
            print(f"🔄 Connecting to MQTT broker at {MQTT_HOST}:{MQTT_PORT} using {connection_type} authentication with client ID: {MQTT_CLIENT_ID}")
            
            # Wait for connection to establish
            connection_timeout = MQTT_CONNECT_TIMEOUT
            start_time = time.time()
            
            while not self.client.is_connected() and time.time() - start_time < connection_timeout:
                time.sleep(0.5)
                
            if not self.client.is_connected():
                raise TimeoutError(f"Failed to connect to MQTT broker within {connection_timeout} seconds")
                
        except Exception as e:
            print(f"❌ Failed to connect to MQTT broker: {e}")
            raise

# ---------------------------------------------------
# 🏁 Main Execution
# ---------------------------------------------------
def handle_exit(signum, frame):
    """Gracefully handle shutdown signals (SIGTERM, SIGINT)."""
    logging.info(f"Received shutdown signal ({signum}). Stopping service...")
    if subscriber:
        subscriber.cleanup()
    sys.exit(0)

if __name__ == "__main__":
    setup_logging()
    logging.info("Logging setup complete.")

    try:
        # Load configuration
        config = load_config()
        if not config:
            raise ValueError("Failed to load configuration")

        # Set global variables
        camera_details = config["service_settings"]["camera_details"]
        mqtt_topics = config["service_settings"]["mqtt_topics"]
        mongo_db_client = config["service_settings"]["mongo_db_client"]
        system_settings = config["service_settings"]["system"]

        # Override MQTT settings from configuration if available
        if "mqtt_settings" in config["service_settings"]:
            mqtt_config = config["service_settings"]["mqtt_settings"]
            MQTT_HOST = mqtt_config.get("host", MQTT_HOST)
            MQTT_PORT = int(mqtt_config.get("port", MQTT_PORT))
            MQTT_USERNAME = mqtt_config.get("username", MQTT_USERNAME)
            MQTT_PASSWORD = mqtt_config.get("password", MQTT_PASSWORD)
            MQTT_CONNECTION_TYPE = mqtt_config.get("connection_type", MQTT_CONNECTION_TYPE)
            MQTT_CLIENT_ID = mqtt_config.get("client_id", MQTT_CLIENT_ID)
            
            # Certificate paths if using certificate-based authentication
            if MQTT_CONNECTION_TYPE == MQTT_CONNECTION_TYPES["CERTIFICATE"]:
                MQTT_CA_CERT = mqtt_config.get("ca_cert", MQTT_CA_CERT)
                MQTT_CLIENT_CERT = mqtt_config.get("client_cert", MQTT_CLIENT_CERT)
                MQTT_CLIENT_KEY = mqtt_config.get("client_key", MQTT_CLIENT_KEY)
                
                # Log certificate paths for debugging
                logging.info(f"Using certificate-based authentication with:")
                logging.info(f"CA Cert: {MQTT_CA_CERT}")
                logging.info(f"Client Cert: {MQTT_CLIENT_CERT}")
                logging.info(f"Client Key: {MQTT_CLIENT_KEY}")

        if not camera_details:
            raise ValueError("No cameras configured")

        # Handle system signals for safe exit
        signal.signal(signal.SIGTERM, handle_exit)
        signal.signal(signal.SIGINT, handle_exit)

        # Initialize subscriber
        sensor_id = config["sensor_id"]
        logging.info(f"Initializing subscriber for sensor {sensor_id} with connection type: {MQTT_CONNECTION_TYPE}")
        subscriber = MQTTSubscriber(sensor_id)
        
        # Run the subscriber infinitely with reconnection handling
        while True:
            try:
                subscriber.start()
                logging.info(f"Initialized subscriber for sensor {sensor_id}")
                
                # Keep the main thread alive
                while True:
                    time.sleep(60)  # Check connection status every minute
                    
                    # If the client is not connected, break the inner loop to reconnect
                    if not subscriber.client.is_connected():
                        logging.warning("MQTT connection lost. Attempting to reconnect...")
                        break
                        
            except Exception as e:
                logging.error(f"Error in subscriber: {e}")
                logging.info("Attempting to reconnect in 10 seconds...")
                time.sleep(10)  # Wait before reconnecting
    
    except Exception as e:
        logging.critical(f"Fatal error: {e}")
        sys.exit(1) 
