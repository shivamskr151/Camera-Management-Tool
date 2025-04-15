const express = require('express');
const router = express.Router();
const apiRoutes = require('./api');

const ptzRoutes = require('./ptz');
// Mount routes with their respective prefixes
router.use('/api', apiRoutes);
router.use('/api/ptz', ptzRoutes);

module.exports = router;