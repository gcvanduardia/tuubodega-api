const express = require("express");
const router = express.Router();
const paymentsController = require("../controllers/payments");
const auth = require("../middleware/jwt");

router.route("/articulo/integrity-signature").get(paymentsController.integritySignature);
router.route("/records").get(paymentsController.recordsList);

module.exports = router;