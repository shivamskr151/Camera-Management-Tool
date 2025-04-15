# Simple Express Backend

A basic Express.js backend application without MVC architecture or database connection, with MQTT client support.

## Features

- Simple API endpoints for demonstration
- Static file serving
- JSON request parsing
- Error handling middleware
- MQTT client with authentication support

## Setup

1. Make sure you have Node.js installed
2. Clone this repository
3. Install dependencies:
   ```
   npm install
   ```
4. Copy the example environment file and configure your settings:
   ```
   cp .env.example .env
   ```
   Then edit the `.env` file with your MQTT credentials.

## Running the Application

Start the server:
```
npm start
```

For development with auto-restart:
```
npm run dev
```

## API Endpoints

- `GET /` - Welcome message
- `GET /api/users` - Get list of sample users
- `POST /api/users` - Create a new user

## Static Files

Static files are served from the `public` directory. Visit the root URL in your browser to see the HTML documentation page.

## MQTT Client

The application includes MQTT client functionality:

- Authentication using username/password
- Auto-reconnection support
- Event-based message handling
- Helper functions for publishing and subscribing

### MQTT Example

Run the MQTT example:
```
node mqtt-example.js
```

This example:
- Connects to the MQTT broker using credentials from environment variables
- Subscribes to sample topics
- Publishes random sensor data every 5 seconds
- Processes control messages with custom logic 