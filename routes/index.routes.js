const router = require("express").Router();
const authRoutes = require("./auth.routes");
const exchangeAccountsRoutes = require("./accounts.routes");

/* GET home page */
router.get("/", (req, res, next) => {
  res.json("All good in here");
});

router.use("/auth", authRoutes);
router.use("/accounts", exchangeAccountsRoutes);

module.exports = router;
