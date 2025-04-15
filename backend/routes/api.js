const express = require('express');
const router = express.Router();

// Welcome endpoint
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});

// User routes
router.get('/users', (req, res) => {
  // Sample data - would come from a database in a real app
  const users = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Bob Johnson' }
  ];
  res.json(users);
});

router.post('/users', (req, res) => {
  const newUser = req.body;
  // In a real app, would save to database here
  res.status(201).json({ message: 'User created', user: newUser });
});

// Add any additional API routes here

module.exports = router; 