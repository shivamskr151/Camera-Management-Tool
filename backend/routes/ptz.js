const express = require("express");
const router = express.Router();
const { publish } = require("../mqtt-client");

// Middleware to log all requests
router.use((req, res, next) => {
  console.log('PTZ Request:', {
    method: req.method,
    url: req.url,
    body: req.body,
    headers: req.headers
  });
  next();
});

// Publish message to MQTT topic
router.post("/move", (req, res) => {
  console.log("Received PTZ move request:", {
    body: req.body,
    contentType: req.headers['content-type']
  });
  
  const { pan, tilt, zoom, velocity = 1, sensor_id } = req.body;
  
  // Validate required parameters
  if (pan === undefined || tilt === undefined || zoom === undefined || !sensor_id) {
    const error = {
      error: "Missing required parameters",
      received: { pan, tilt, zoom, sensor_id },
      headers: req.headers
    };
    console.error("Validation error:", error);
    return res.status(400).json(error);
  }

  const mqttClient = req.app.get("mqttClient");
  if (!mqttClient) {
    console.error("MQTT client not configured");
    return res.status(500).json({ 
      error: "MQTT client not configured",
      message: "The MQTT client is not properly configured"
    });
  }
  
  let topic = `${sensor_id}/control`;
  console.log(`Publishing to MQTT topic: ${topic}`);
  
  try {
    const message = {
      command: "move",
      pan: Number(pan),
      tilt: Number(tilt),
      zoom: Number(zoom),
      velocity: Number(velocity) || 1,
    };
    
    console.log("Publishing MQTT message:", message);
    
    publish(
      mqttClient,
      topic,
      JSON.stringify(message)
    );
    
    console.log("MQTT message published successfully");
    
    const response = {
      success: true,
      message: "Camera movement command sent successfully",
      data: message
    };
    
    console.log("Sending response:", response);
    res.json(response);
  } catch (error) {
    console.error("Error in PTZ move:", {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    return res.status(500).json({ 
      error: "Failed to process camera movement",
      message: error.message
    });
  }
});

router.post("/create-preset", (req, res) => {
  console.log("Received create preset request:", {
    body: req.body,
    contentType: req.headers['content-type']
  });
  
  const { preset_name, sensor_id, pan, tilt, zoom } = req.body;

  // Validate required parameters
  if (!preset_name || !sensor_id || pan === undefined || tilt === undefined || zoom === undefined) {
    const error = {
      error: "Missing required parameters",
      received: { preset_name, sensor_id, pan, tilt, zoom },
      headers: req.headers
    };
    console.error("Validation error:", error);
    return res.status(400).json(error);
  }

  const mqttClient = req.app.get("mqttClient");
  if (!mqttClient) {
    console.error("MQTT client not configured");
    return res.status(500).json({ 
      error: "MQTT client not configured",
      message: "The MQTT client is not properly configured"
    });
  }
  
  let topic = `${sensor_id}/control`;
  console.log(`Publishing to MQTT topic: ${topic}`);
  
  try {
    const message = {
      command: "create_preset",
      preset_name: preset_name,
      pan: Number(pan),
      tilt: Number(tilt),
      zoom: Number(zoom)
    };
    
    console.log("Publishing MQTT message:", message);
    
    publish(
      mqttClient,
      topic,
      JSON.stringify(message)
    );
    
    console.log("MQTT message published successfully");
    
    const response = {
      success: true,
      message: "Preset creation command sent successfully",
      data: message
    };
    
    console.log("Sending response:", response);
    res.json(response);
  } catch (error) {
    console.error("Error in create preset:", {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    return res.status(500).json({ 
      error: "Failed to process preset creation",
      message: error.message
    });
  }
});

router.post("/stop-ptz", (req, res) => {
  const { sensor_id } = req.body;
  const mqttClient = req.app.get("mqttClient");
  if (!mqttClient) {
    return res.status(500).json({ error: "MQTT client not configured" });
  }
  let topic = `${sensor_id}/control`;
  mqttClient.on("connect", () => {
    
    subscribe(mqttClient, topic);
  });

  try {
    publish(
      mqttClient,
      topic,
      JSON.stringify({
        command: "stop_ptz",
      })
    );
  } catch (error) {
    console.error("Error publishing MQTT message:", error);
    return res.status(500).json({ error: "Failed to publish MQTT message" });
  }

  res.json({ success: true });
});

router.post("/test", (req, res) => {
  const { sensor_id } = req.body;

  const mqttClient = req.app.get("mqttClient");
  if (!mqttClient) {
    return res.status(500).json({ error: "MQTT client not configured" });
  }

  let topic = `${sensor_id}/control`;
  mqttClient.on("connect", () => {
    
    subscribe(mqttClient, topic);
  });

  try {
    publish(
      mqttClient,
      topic,
      JSON.stringify({
        command: "test",
      })
    );
  } catch (error) {
    console.error("Error publishing MQTT message:", error);
    return res.status(500).json({ error: "Failed to publish MQTT message" });
  }

  res.json({ success: true });
});

router.post("/go-to-preset", (req, res) => {
  const { preset_name, sensor_id } = req.body;

  const mqttClient = req.app.get("mqttClient");
  if (!mqttClient) {
    return res.status(500).json({ error: "MQTT client not configured" });
  }
  let topic = `${sensor_id}/control`;
  mqttClient.on("connect", () => {
    subscribe(mqttClient, topic);
  });

  try {
    publish(
      mqttClient,
      topic,
      JSON.stringify({
        command: "go-to-preset",
        preset_name: preset_name,
      })
    );
  } catch (error) {
    console.error("Error publishing MQTT message:", error);
    return res.status(500).json({ error: "Failed to publish MQTT message" });
  }

  res.json({ success: true });
});

router.post("/start-patrol", (req, res) => {
  const { presets, sensor_id } = req.body;

  const mqttClient = req.app.get("mqttClient");
  if (!mqttClient) {
    return res.status(500).json({ error: "MQTT client not configured" });
  }

  let topic = `${sensor_id}/control`;
  mqttClient.on("connect", () => {
    
    subscribe(mqttClient, topic);
  });

  try {
    publish(
      mqttClient,
      topic,
      JSON.stringify({
        command: "start_patrol",
        presets: presets,
      })
    );
  } catch (error) {
    console.error("Error publishing MQTT message:", error);
    return res.status(500).json({ error: "Failed to publish MQTT message" });
  }

  res.json({ success: true, topic });
});

router.post("/stop-patrol", (req, res) => {
  const { sensor_id } = req.body;

  const mqttClient = req.app.get("mqttClient");
  if (!mqttClient) {
    return res.status(500).json({ error: "MQTT client not configured" });
  }

  let topic = `${sensor_id}/control`;
  mqttClient.on("connect", () => {
   
    subscribe(mqttClient, topic);
  });

  try {
    publish(
      mqttClient,
      topic,
      JSON.stringify({
        command: "stop_patrol",
      })
    );
  } catch (error) {
    console.error("Error publishing MQTT message:", error);
    return res.status(500).json({ error: "Failed to publish MQTT message" });
  }

  res.json({ success: true, topic });
});

router.post("/set-fpsbr", (req, res) => {
  console.log(req.body);
  const { fps, width, height, bitrate, sensor_id } = req.body;

  const mqttClient = req.app.get("mqttClient");
  if (!mqttClient) {
    return res.status(500).json({ error: "MQTT client not configured" });
  }

  let topic = `${sensor_id}/control`;
  mqttClient.on("connect", () => {
    
    subscribe(mqttClient, topic);
  });

  try {
    publish(
      mqttClient,
      topic,
      JSON.stringify({
        command: "set_fpsbr",
        fps: fps,
        width: width,
        height: height,
        bitrate: bitrate,
      })
    );
  } catch (error) {
    console.error("Error publishing MQTT message:", error);
    return res.status(500).json({ error: "Failed to publish MQTT message" });
  }

  res.json({ success: true });
});

router.post("/set-time", (req, res) => {
  const { timezone, ntp_server, sensor_id } = req.body;

  const mqttClient = req.app.get("mqttClient");
  if (!mqttClient) {
    return res.status(500).json({ error: "MQTT client not configured" });
  }

  let topic = `${sensor_id}/control`;
  mqttClient.on("connect", () => {
    
    subscribe(mqttClient, topic);
  });

  try {
    publish(
      mqttClient,
      topic,
      JSON.stringify({
        command: "set_time",
        timezone: timezone,
        ntp_server: ntp_server,
      })
    );
  } catch (error) {
    console.error("Error publishing MQTT message:", error);
    return res.status(500).json({ error: "Failed to publish MQTT message" });
  }

  res.json({ success: true });
});

router.post("/update-configuration", (req, res) => {
  const { sensor_id } = req.body;

  const mqttClient = req.app.get("mqttClient");
  if (!mqttClient) {
    return res.status(500).json({ error: "MQTT client not configured" });
  }

  let topic = `${sensor_id}/control`;
  mqttClient.on("connect", () => {
    subscribe(mqttClient, topic);
  });

  try {
    publish(
      mqttClient,
      topic,
      JSON.stringify({
        command: "update_configuration",
        sensor_id: sensor_id,
      })
    );
  } catch (error) {
    console.error("Error publishing MQTT message:", error);
    return res.status(500).json({ error: "Failed to publish MQTT message" });
  }

  res.json({ success: true });
});

router.post("/start-stream", (req, res) => {
  const { rtmp_url, stream_timer, streaming_fps, sensor_id } = req.body;

  const mqttClient = req.app.get("mqttClient");
  if (!mqttClient) {
    return res.status(500).json({ error: "MQTT client not configured" });
  }

  let topic = `${sensor_id}/control`;
  mqttClient.on("connect", () => {
   
    subscribe(mqttClient, topic);
  });

  try {
    publish(
      mqttClient,
      topic,
      JSON.stringify({
        command: "start_stream",
        rtmp_url: rtmp_url,
        stream_timer: stream_timer,
        streaming_fps: streaming_fps,
      })
    );
  } catch (error) {
    console.error("Error publishing MQTT message:", error);
    return res.status(500).json({ error: "Failed to publish MQTT message" });
  }

  res.json({ success: true });
});

router.post("/stop-stream", (req, res) => {
  const { sensor_id } = req.body;

  const mqttClient = req.app.get("mqttClient");
  if (!mqttClient) {
    return res.status(500).json({ error: "MQTT client not configured" });
  }

  let topic = `${sensor_id}/control`;
  mqttClient.on("connect", () => {
    subscribe(mqttClient, topic);
  });

  try {
    publish(
      mqttClient,
      topic,
      JSON.stringify({
        command: "stop_stream",
      })
    );
  } catch (error) {
    console.error("Error publishing MQTT message:", error);
    return res.status(500).json({ error: "Failed to publish MQTT message" });
  }

  res.json({ success: true });
});

router.post("/start-on-demand-stream", (req, res) => {
  const { rtmp_url, video_file, sensor_id } = req.body;

  const mqttClient = req.app.get("mqttClient");
  if (!mqttClient) {
    return res.status(500).json({ error: "MQTT client not configured" });
  }
  let topic = `${sensor_id}/control`;
  mqttClient.on("connect", () => {
    subscribe(mqttClient, topic);
  });

  try {
    publish(
      mqttClient,
      topic,
      JSON.stringify({
        command: "start_on_demand_stream",
        rtmp_url: rtmp_url,
        video_file: video_file,
      })
    );
  } catch (error) {
    console.error("Error publishing MQTT message:", error);
    return res.status(500).json({ error: "Failed to publish MQTT message" });
  }

  res.json({ success: true });
});

router.post("/stop-on-demand-stream", (req, res) => {
  const { sensor_id } = req.body;

  const mqttClient = req.app.get("mqttClient");
  if (!mqttClient) {
    return res.status(500).json({ error: "MQTT client not configured" });
  }
  let topic = `${sensor_id}/control`;
  mqttClient.on("connect", () => {
    subscribe(mqttClient, topic);
  });

  try {
    publish(
      mqttClient,
      topic,
      JSON.stringify({
        command: "stop_on_demand_stream",
      })
    );
  } catch (error) {
    console.error("Error publishing MQTT message:", error);
    return res.status(500).json({ error: "Failed to publish MQTT message" });
  }

  res.json({ success: true });
});

// Get MQTT connection status
router.get("/status", (req, res) => {
  const mqttClient = req.app.get("mqttClient");

  if (!mqttClient) {
    return res.json({
      connected: false,
      message: "MQTT client not configured",
    });
  }

  res.json({
    connected: mqttClient.connected,
    connectionState: mqttClient.connected ? "connected" : "disconnected",
  });
});

module.exports = router;
