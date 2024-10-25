const express = require("express");
const router = express.Router();
const UserSegment = require("../models/UserSegmentation.js");
const FormData = require("form-data");
const fs = require("fs");
const axios = require("axios");
const Company = require("../models/Company");
const {
  createThreadAndRunonKnowledgeBase,
} = require("../utils/openai_helper.js");
const KNOWLEDGE_BASE_API = process.env.KNOWLEDGE_BASE_API;

// GET all segments by companyId

const getUserSegments = async (req, res) => {
  try {
    const { companyId } = req.params;
    const segments = await UserSegment.find({ companyId });

    if (!segments.length) {
      return res
        .status(404)
        .json({ message: "No segments found for this company." });
    }

    res.status(200).json(segments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST a new segment
const createUserSegment = async (req, res) => {
  console.log("tetsinhds");
  try {
    const { companyId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Excel file is required." });
    }

    const fileBuffer = req.file.buffer;

    // Prepare form data with the Excel file
    const formData = new FormData();
    const uniqueFileName = companyId + "-users";
    formData.append(
      "file",
      fileBuffer, // Attach the file directly
      req.file.originalname
    );
    formData.append("company_id", uniqueFileName.toString());

    // Upload Excel to the knowledge base API
    const uploadResponse = await axios.post(
      `${KNOWLEDGE_BASE_API}/create-embeddings`,
      formData,
      { headers: formData.getHeaders() }
    );

    console.log("uploadResponse-->", uploadResponse);

    if (uploadResponse.status !== 200) {
      return res
        .status(500)
        .json({ message: "Failed to upload to the knowledge base." });
    }

    const companyName = await Company.findById(companyId);

    let finalPrompt = `CREATE A CUSTOMER CATEGORY USING THE FILE I'VE ATTACHED, CONSIDER THIS FOR INDIA, ALONG WITH SEGMENTATION, AND DEFINE THEM 
BASED ON THIS, GENERATE A DESCRIPTION for ${companyName.name}`;

    finalPrompt += `
\nDo not include any explanations. Only provide a JSON response following this exact format without deviation:
segments:"Array of object and each object title , demographics , product_preferences , buying_patterns and description like[
  {
    "Title": "String representing the title",
    "Demographics": "String describing the demographics",
    "Product_Preferences": "String listing the product preferences",
    "Buying_Patterns": "String summarizing the buying patterns",
    "Description": "String with a detailed description"
  }
    ]
The JSON response:
`;

    console.log("finalPrompt-->", finalPrompt);

    // Call the second API to process the knowledge base entry
    const jsonData = await createThreadAndRunonKnowledgeBase(
      uniqueFileName,
      finalPrompt
    );

    const savedSegment = await UserSegment.create({
      name: req.file.originalname,
      segments: jsonData.segments,
      companyId,
    });

    res.status(201).json(savedSegment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getUserSegments,
  createUserSegment,
};
