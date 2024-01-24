const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

router.post('/hash', authController.hashService);
router.post('/login', authController.login);


module.exports = router;