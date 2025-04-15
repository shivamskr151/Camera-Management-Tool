import paho.mqtt.client as mqtt

# Replace with your EMQX serverless info
MQTT_BROKER = "sd320117.ala.asia-southeast1.emqxsl.com"   # EMQX Serverless endpoint
MQTT_PORT = 8883                               # Use 1883 for TCP or 8883 for TLS
MQTT_USERNAME = "variphi"
MQTT_PASSWORD = "Variphi@2025"
TOPIC = "device/temperature"
CLIENT_ID = "device-client-002"

# Callback when connected
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ Connected to EMQX!")
        client.subscribe(TOPIC)
    else:
        print(f"❌ Failed to connect, return code {rc}")

# Callback when message received
def on_message(client, userdata, msg):
    print(f"📩 Received message from topic {msg.topic}: {msg.payload.decode()}")

# Setup client
client = mqtt.Client(client_id=CLIENT_ID, protocol=mqtt.MQTTv311, transport="tcp", callback_api_version=1)

client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
client.tls_set()  # Enable TLS if using port 8883

client.on_connect = on_connect
client.on_message = on_message

# Connect and loop
client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
client.loop_start()

# Publish a test message
import time
time.sleep(2)  # Wait for connection to establish
client.publish(TOPIC, payload="23.5°C", qos=1)

# Keep running
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("🔌 Disconnected")
    client.loop_stop()
    client.disconnect()