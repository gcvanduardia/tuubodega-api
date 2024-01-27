const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const auth = require('../middleware/jwt');

router.post('/hash', authController.hashService);
router.post('/login', authController.login);
router.route('/sesion').get(auth,authController.sesion);


module.exports = router;