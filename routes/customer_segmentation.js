const express = require("express");
const {
  getUserSegments,
  createUserSegment
} = require("../controllers/customer_segmentation");
const multer = require("multer");
const path = require("path");
// Configure Multer storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router.get("/getUserSegments/:companyId", getUserSegments);
router.post("/createUserSegment",upload.single("file"),  createUserSegment);

module.exports = router;
