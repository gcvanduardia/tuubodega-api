const express = require("express");
const router = express.Router();
const paymentsController = require("../controllers/payments");
const auth = require("../middleware/jwt");

router.route("/articulo/integrity-signature").get(auth,paymentsController.integritySignature);
router.route("/records").get(auth,paymentsController.recordsList);
router.route("/cotizaciones").post(auth, paymentsController.createCotizacion);
router.route("/cotizaciones/:cod").get(auth, paymentsController.getCotizacionById);
router.route("/cotizaciones/:cod").put(auth, paymentsController.updateCotizacion);

module.exports = router;