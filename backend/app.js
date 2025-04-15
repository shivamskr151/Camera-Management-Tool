require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Import MQTT client functionality
const { createMqttClient, subscribe } = require('./mqtt-client');

// Import routes
const routes = require('./routes');

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method !== 'GET') {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Add a root route handler for health checks
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API server is running' });
});

// Add a HEAD route handler for the root path
app.head('/', (req, res) => {
  res.status(200).end();
});

// Initialize MQTT client if credentials are available
let mqttClient = null;
if (process.env.MQTT_USERNAME && process.env.MQTT_PASSWORD) {
  mqttClient = createMqttClient();
  
  // Make MQTT client available to routes
  app.set('mqttClient', mqttClient);
  
  // Subscribe to example topics when connected
 
  
  // Handle incoming messages
  mqttClient.on('message', (topic, message) => {
    console.log(`[MQTT] Received on ${topic}: ${message.toString()}`);
    // Process messages based on topic
  });
}

// Mount all routes
app.use('/', routes);

// Error handling middleware
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  
  if (mqttClient) {
    console.log('Closing MQTT connection');
    mqttClient.end();
  }
  
  process.exit();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
