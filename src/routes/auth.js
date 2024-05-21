const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const auth = require('../middleware/jwt');

router.route('/hash').post(authController.hashService);
router.route('/loginAdmin').post(authController.loginAdmin);
router.route('/login').post(authController.login);
router.route('/sesion').get(authController.sesion);


module.exports = router;