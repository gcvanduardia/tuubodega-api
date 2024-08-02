const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order");
const auth = require("../middleware/jwt");

router
  .route("/")
  .post(auth,orderController.store)

module.exports = router;