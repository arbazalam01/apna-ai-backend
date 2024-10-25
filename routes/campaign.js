const express = require("express");
const {
  campaignProspects,
  createCampaign,
  getCampaignbyId,
  deleteCampaign,
  getAllCampaigns,
  downloadEmails,
  getCampaignData,
} = require("../controllers/campaign");
const { campaignEmailJson } = require("../utils/prospects_helper");

const router = express.Router();

router.get("/getCampaign/:id", getCampaignbyId);
router.get("/getCampaign", getAllCampaigns);
router.post("/createCampaign", createCampaign);
router.delete("/deleteCampaign/:id", deleteCampaign);
router.post("/campaignProspects", campaignProspects);
router.get("/downloadEmails", downloadEmails);
router.get("/campaignEmailJson", getCampaignData);

module.exports = router;
