const express = require("express");
const router = express.Router();
const paymentsController = require("../controllers/payments");
const auth = require("../middleware/jwt");

router.route("/articulo/integrity-signature").get(auth,paymentsController.integritySignature);
router.route("/records").get(auth,paymentsController.recordsList);

module.exports = router;