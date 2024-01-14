const express = require('express');
const router = express.Router();
const articulosController = require('../controllers/articulos');
const auth = require('../middleware/jwt');

router.route('/all')
    .get(articulosController.all)

router.route('/search')
    .post(articulosController.search)
    .get(articulosController.search)

module.exports = router;