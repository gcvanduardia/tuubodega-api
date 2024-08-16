const express = require("express");
const router = express.Router();
const registerController = require("../controllers/register");

router.route("/").post(registerController.store);
router.route("/code").post(registerController.generateCode);
router.route("/verification-code").post(registerController.verificationCode);
// router.route("/cotizaciones").post( registerController.createOrUpdateCotizacion);
// router.route("/cotizaciones/:idCotizacion").get( registerController.getCotizacionById);
// router.route("/cotizaciones/:idCotizacion").put( registerController.updateCotizacionMethods);

module.exports = router;