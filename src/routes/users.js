const express = require('express');
const router = express.Router();
const userController = require('../controllers/users');
const auth = require('../middleware/jwt');

router.route('/userById').post(auth,userController.userById);


module.exports = router;