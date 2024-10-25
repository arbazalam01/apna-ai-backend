const express = require("express");
const router = express.Router();
const Campaign = require("../models/Campaign");
const Prospect = require("../models/Prospect");
const { fetchFileFromS3 } = require("../utils/aws_helper");
const {
  generateCampaignEmails,
  campaignEmailJson,
} = require("../utils/prospects_helper");

// Create Campaign
const createCampaign = async (req, res) => {
  try {
    const { name, prospectIds } = req.body;
    const newCampaign = await Campaign.create({ name, prospectIds });
    res.status(201).json(newCampaign);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get Campaign by ID
const getCampaignbyId = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Campaign
const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    res.json({ message: "Campaign deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Campaigns
const getAllCampaigns = async (req, res) => {
  try {
    const { companyId } = req.query;
    const campaigns = await Campaign.find({ companyId });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const campaignProspects = async (req, res) => {
  try {
    const { campaignIds, companyId } = req.body;

    const campaigns = await Campaign.find({ _id: { $in: campaignIds } });
    const prospectIds = campaigns
      .map((campaign) => campaign.prospectIds)
      .flat();
    const prospects = await Prospect.find({ _id: { $in: prospectIds } });

    // const newCampaign = await Campaign.create({
    //   name: "New Campaign",
    //   prospectIds,
    //   companyId,
    // });

    // const campaignId = newCampaign._id;
    // res.status(200).json({
    //   message: "Campaign created successfully",
    //   campaignId,
    //   prospects,
    // });

    // await generateCampaignEmails(prospects, campaignId, companyId);
    res.json({
      message: "Campaign created successfully",
      prospects,
      campaignId: "662fa63ac69bfad14c93a734",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const downloadEmails = async (req, res) => {
  const { campaignId } = req.query;
  // const companyId = defaultCompanyId;
  const s3FilePath = `Campaign/${campaignId}/emails.csv`;
  const localDir = `Campaign/${campaignId}`;
  const downloadedFile = await fetchFileFromS3(s3FilePath, localDir);
  res.download(downloadedFile);
};

const getCampaignData = async (req, res) => {
  try {
    const { campaignId } = req.query;
    if (!campaignId || campaignId == "null" || campaignId === "") {
      return res.status(400).json({ message: "Campaign ID is required" });
    }
    const jsonData = await campaignEmailJson(campaignId);
    if (!jsonData) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    res.json(jsonData);
  } catch (error) {
    console.log("Error--->", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCampaign,
  getCampaignbyId,
  deleteCampaign,
  getAllCampaigns,
  campaignProspects,
  downloadEmails,
  getCampaignData,
};
