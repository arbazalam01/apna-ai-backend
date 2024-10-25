const express = require("express");
const { getReportData, getReportStatus } = require("../controllers/report");

const router = express.Router();

router.get("/:companyId/status", getReportStatus);
router.get("/:companyId/:tabType", getReportData);

module.exports = router;
