const express = require("express");
const {
  getUserSegments,
  createUserSegment
} = require("../controllers/customer_segmentation");
const multer = require("multer");
const path = require("path");
// Configure Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "tmp/"); // Ensure the 'uploads/' folder exists
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
  });
  
  const upload = multer({ storage: storage });

const router = express.Router();

router.get("/getUserSegments/:companyId", getUserSegments);
router.post("/createUserSegment",upload.single("file"),  createUserSegment);

module.exports = router;
