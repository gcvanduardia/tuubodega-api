const express = require("express");
const router = express.Router();
const wompiEventsController = require("../controllers/wompiEvents");

router.route("/transactions").post(wompiEventsController.updateTransaction);

module.exports = router;