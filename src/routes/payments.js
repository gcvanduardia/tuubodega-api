const express = require("express");
const router = express.Router();
const paymentsController = require("../controllers/payments");
const auth = require("../middleware/jwt");

router.route("/articulo/integrity-signature").get(auth,paymentsController.integritySignature);
router.route("/records").get(auth,paymentsController.recordsList);
router.route("/cotizaciones").post(auth, paymentsController.createOrUpdateCotizacion);
router.route("/cotizaciones/:idCotizacion").get(auth, paymentsController.getCotizacionById);
router.route("/cotizaciones/:idCotizacion").put(auth, paymentsController.updateCotizacionMethods);
router.route('/cotizaciones/getIdUser/:idCotizacion').get(auth, paymentsController.getUserById);
router.route("/orden/buyNow/:id").get(auth, paymentsController.buyNowOrden);

module.exports = router;