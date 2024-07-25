const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart");
const auth = require("../middleware/jwt");

// router.route("/articulo/integrity-signature").get(auth,paymentsController.integritySignature);
// router.route("/records").get(auth,paymentsController.recordsList);

router
  .route("/article")
  .post(cartController.presearch)
  //.get(articulosController.presearch);

module.exports = router;