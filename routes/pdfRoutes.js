const express = require("express");
const { pdf } = require("../controllers/pdf");

const router = express.Router();

router.get("/:companyId", pdf);

module.exports = router;
