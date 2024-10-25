const express = require("express");
const {
  getInsightdata,
  createInsight,
  getInsightDataV2,
} = require("../controllers/datainsight");
const { readGoogleSheet } = require("../utils/google_sheet");

const router = express.Router();

router.get("/insight/:companyId", getInsightdata);
router.post("/insight/:companyId/:pageNumber", createInsight);

router.get("/test", async (req, res) => {
  const { sheetId, sheetName } = req.query;

  const sheetData = await readGoogleSheet(sheetId, sheetName);

  res.json(sheetData);
});

router.get("/analytics", getInsightDataV2);

module.exports = router;
