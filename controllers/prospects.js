const {
  saveProspects,
  generateProspectId,
  generateEmail,
  createCampaign,
  generateCampaignEmails,
} = require("../utils/prospects_helper");
const { parseCSV, parseExcel } = require("../utils/csv_parser");
const Prospect = require("../models/Prospect");
const { generatePersona } = require("../utils/prospects_helper");
const { createObjectCsvWriter } = require("csv-writer");
const { saveFileContent, fetchFileFromS3 } = require("../utils/aws_helper");
const fs = require("fs");
const Campaign = require("../models/Campaign");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const defaultCompanyId = process.env.DEFAULT_COMPANY_ID;

const uploadProfiles = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }
  // res.json({ message: "File uploaded successfully. We're working on it!!!" });
  const buffer = req.file.buffer;
  // const companyId = req.body.companyId || defaultCompanyId;
  // const campaignGuidlines = req.body;
  // console.log("CampaignGuidlines--->", JSON.stringify(campaignGuidlines));
  // const companyId = defaultCompanyId;
  try {
    let results;
    if (req.file.originalname.endsWith(".csv")) {
      results = await parseCSV(buffer);
    } else if (
      [".xls", ".xlsx"].some((ext) => req.file.originalname.endsWith(ext))
    ) {
      results = parseExcel(buffer);
    } else {
      return res.status(400).json({ error: "Unsupported file format." });
    }

    // save all prospects data to the database
    const prospects = await saveProspects(results, req.body);
    // create campaign

    // const campaign = await Campaign.create({
    //   name: "New Campaign",
    //   companyId,
    // });

    // const campaignId = campaign._id;

    res.json({
      message: "File uploaded successfully. We're working on it!!!",
      prospects,
      // campaignId,
    });

    // const prospects = await Promise.all(
    //   results.map(async (prospect) => {
    //     const prospect_name =
    //       prospect["First Name"] + " " + prospect["Last Name"];
    //     console.log("ProspectName------>", prospect_name);
    //     const prospect_title = prospect["Title"];
    //     const prospect_company = prospect["Company Name"];
    //     const prospect_email = prospect["Email"];
    //     const prospect_linkedin = prospect["Prospect Linkedin URL"];
    //     const company_linkedin = prospect["Company Linkedin URL"];

    //     return {
    //       name: prospect_name,
    //       title: prospect_title,
    //       companyName: prospect_company,
    //       email: prospect_email,
    //       linkedin: prospect_linkedin,
    //       companyLinkedin: company_linkedin,
    //     };
    //   })
    // );

    // await generateCampaignEmails(prospects, campaignId, companyId, campaignGuidlines);
  } catch (error) {
    console.log("Error--->", error);
    res.status(500).json({ error: "Failed to process the file." });
  }
};

const getAllProspects = async (req, res) => {
  const prospect_list = await Prospect.find();
  res.json(prospect_list);
};

const createPersona = async (req, res) => {
  const { userId } = req.body;
  const persona = await generatePersona(userId);
  res.json({ Success: "Persona created successfully" });
};

const downloadEmails = async (req, res) => {
  // const { companyId } = req.query;
  const companyId = defaultCompanyId;
  const s3FilePath = `${companyId}/emails.csv`;
  const localDir = companyId;
  const downloadedFile = await fetchFileFromS3(s3FilePath, localDir);
  res.download(downloadedFile);
};

const getProspectEmail = async (req, res) => {
  const { userId } = req.params;
  const email = await generateEmail(userId);
  res.json(email);
};

const createEmails = async (req, res) => {
  try {
    const { prospectIds, companyId, campaignGuidlines } = req.body;

    const prospects = await Prospect.find({ _id: { $in: prospectIds } });
    const campaign = await createCampaign(companyId);
    const campaignId = campaign._id;
    const userEmail = req.cookies.email;

    // Find the user by decoded user ID (replace with actual database query)
    //  const user = await User.findById(decodedToken._id).exec();

    // res.json({ message: "Emails created successfully", campaignId });

    await generateCampaignEmails(
      prospects,
      campaignId,
      companyId,
      campaignGuidlines,
      userEmail
    );
    res.json({ message: "Emails created successfully", campaignId });
  } catch (error) {
    console.log("Error--->", error);
    res.status(500).json({ error: "Failed to create emails." });
  }
};

const downloadPersona = async (req, res) => {
  const { prospectId } = req.query;

  const isPersonaExist = await isFileExistS3(`Users/${prospectId}/persona.md`);
  if (!isPersonaExist) {
    return res.status(404).json({ message: "Persona not found" });
  }

  const s3FilePath = `Users/${prospectId}/persona.md`;
  const localDir = `Users/${prospectId}`;
  const downloadedFile = await fetchFileFromS3(s3FilePath, localDir);
  res.download(downloadedFile);
};

module.exports = {
  uploadProfiles,
  getAllProspects,
  createPersona,
  downloadEmails,
  getProspectEmail,
  createEmails,
  downloadPersona,
};
