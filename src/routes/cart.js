const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart");
const auth = require("../middleware/jwt");

router
  .route("/article")
  .get(auth,cartController.list)
  .post(auth,cartController.store)
  .put(auth,cartController.update)
  .delete(auth,cartController.destroy);

router.route("/summary").get(auth,cartController.summary)
router.route("/empty").get(auth,cartController.emptyCart)
router.route("/count").get(auth,cartController.countArticlesInCart)

module.exports = router;