const express = require("express");
const router = express.Router();
const registerController = require("../controllers/register");
const auth = require("../middleware/jwt");

router
  .route("/")
  .post(auth,registerController.store)

module.exports = router;