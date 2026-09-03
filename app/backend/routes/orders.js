const { getStatistics, updateOrder, searchOrders, getPerMonthStats } = require("../controllers/orders");

const router = require("express").Router();

router.get("/stats", getStatistics);
router.get("/monthly/stats", getPerMonthStats);
router.get("/", searchOrders);
router.put("/:id", updateOrder);
module.exports = router;