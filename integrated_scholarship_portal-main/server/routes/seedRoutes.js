const express = require('express');
const router = express.Router();
const { seedDatabase } = require('../controllers/seedController');

// Public seed endpoint to initialize demo data easily
router.post('/', seedDatabase);
router.get('/', seedDatabase);

module.exports = router;
