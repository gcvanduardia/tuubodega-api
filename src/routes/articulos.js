const express = require("express");
const router = express.Router();
const articulosController = require("../controllers/articulos");
const auth = require("../middleware/jwt");

router.route("/all").get(articulosController.all);

router
  .route("/presearch")
  .post(articulosController.presearch)
  .get(articulosController.presearch);

  router
  .route("/search")
  .post(articulosController.search)
  .get(articulosController.search);

router
  .route("/search-admin")
  .post(auth,articulosController.searchAdmin)
  .get(auth,articulosController.searchAdmin);

router
  .route("/articulo")
  .post(articulosController.article)
  .get(articulosController.article);

router
  .route("/all-denario-products")
  .get(articulosController.allDenarioProducts);


  router
  .route("/getDenarioArticle/:id")
  .get(articulosController.getArticle);

module.exports = router;

module.exports = router;
