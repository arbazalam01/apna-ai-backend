const express = require("express");
const router = express.Router();
const UserSegment = require("../models/UserSegmentation.js");
// GET all segments by companyId

const getUserSegments = async (req, res) => {
    try {
      const { companyId } = req.params;
      const segments = await UserSegment.find({ companyId });
      
      if (!segments.length) {
        return res.status(404).json({ message: "No segments found for this company." });
      }
  
      res.status(200).json(segments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  // POST a new segment
const createUserSegment = async (req, res) => {
    try {
      const { companyId, name, description } = req.body;
  
      if (!companyId || !name) {
        return res.status(400).json({ message: "companyId and name are required." });
      }
  
      const newSegment = new UserSegment({ companyId, name, description });
      const savedSegment = await newSegment.save();
  
      res.status(201).json(savedSegment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  module.exports = {
    getUserSegments,
    createUserSegment
  };