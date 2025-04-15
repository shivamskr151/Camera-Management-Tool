const mqtt = require('mqtt');

// Instead of enum, use object constants
const MQTT_CONNECTION_TYPES = {
    CREDENTIALS: 'credentials',
    CERTIFICATE: 'certificate'
};

const getOptions = () => {
    switch (process.env.MQTT_CONNECTION_TYPE) {
        case MQTT_CONNECTION_TYPES.CREDENTIALS:
            return {
                host: process.env.MQTT_HOST,
                port: process.env.MQTT_PORT,
                username: process.env.MQTT_USERNAME,
                password: process.env.MQTT_PASSWORD,
                clientId: process.env.CLIENT_ID,
                connectTimeout: 5000,
                reconnectPeriod: 1000,
                rejectUnauthorized: false // Allow self-signed certificates
            }
        case MQTT_CONNECTION_TYPES.CERTIFICATE:
            return {
                host: process.env.MQTT_HOST,
                port: process.env.MQTT_PORT,
                clientId: process.env.CLIENT_ID,
                ca: [process.env.MQTT_CA_CERT],
                cert: process.env.MQTT_CLIENT_CERT,
                key: process.env.MQTT_CLIENT_KEY,
                rejectUnauthorized: true,
                connectTimeout: 5000,
                reconnectPeriod: 1000,
            }
        default:
            return {
                host: process.env.MQTT_HOST,
                port: process.env.MQTT_PORT,
                username: process.env.MQTT_USERNAME,
                password: process.env.MQTT_PASSWORD,
                clientId: process.env.CLIENT_ID,
                connectTimeout: 5000,
                reconnectPeriod: 1000,
                rejectUnauthorized: false
            }
    }
}

// Create MQTT client
const createMqttClient = () => {
    // Get configuration options
    const options = getOptions();

    // Construct URL with protocol, host and port
    const connectUrl = `mqtts://${options.host}:${options.port}`;

    // Create client with options
    const client = mqtt.connect(connectUrl, options);

    // Set up event handlers
    client.on('connect', () => {
        console.log('MQTT client connected to', connectUrl);
    });

    client.on('error', (err) => {
        console.error('MQTT connection error:', err);
        client.end();
    });

    client.on('reconnect', () => {
        console.log('MQTT client reconnecting to', connectUrl);
    });

    client.on('disconnect', () => {
        console.log('MQTT client disconnected from', connectUrl);
    });

    client.on('close', () => {
        console.log('MQTT connection closed');
    });

    client.on('message', (topic, message) => {
        console.log(`Received message on topic ${topic}: ${message.toString()}`);
    });

    return client;
};

// Subscribe to a topic
const subscribe = (client, topic) => {
    client.subscribe(topic, (err) => {
        if (err) {
            console.error(`Error subscribing to ${topic}:`, err);
            return;
        }
        console.log(`Subscribed to ${topic}`);
    });
};

// Publish message to a topic
const publish = (client, topic, message) => {
    client.publish(topic, message, { qos: 1, retain: false }, (err) => {
        if (err) {
            console.error(`Error publishing to ${topic}:`, err);
            return;
        }
        console.log(`Published to ${topic}: ${message}`);
    });
};

module.exports = { createMqttClient, subscribe, publish }; 