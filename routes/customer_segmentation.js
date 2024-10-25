const express = require("express");
const {
  getUserSegments,
  createUserSegment
} = require("../controllers/customer_segmentation");

const router = express.Router();

router.get("/getUserSegments/:companyId", getUserSegments);
router.post("/createUserSegment",  createUserSegment);

module.exports = router;
