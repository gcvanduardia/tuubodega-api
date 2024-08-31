const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order");
const auth = require("../middleware/jwt");

router
  .route("/")
  .post(auth,orderController.store);

router
  .route("/getCotizacion/:idCotizacion")
  .get(auth, orderController.getCotizacionById);

router
  .route("/updateOrdenMethods/:idOrden")
  .put(auth, orderController.updateOrdenMethods);

router
  .route("/getProductos/:idCotizacion")
  .get(auth, orderController.getProductByOrdenId);

  router
  .route("/createCotizacion/:idUser")
  .get(auth, orderController.createCotizacion);
module.exports = router;