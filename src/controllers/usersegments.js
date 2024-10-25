const express = require("express");
const router = express.Router();
const UserSegment = require("../models/UserSegment"); // Adjust the path as per your project structure

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


const createUserSegment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "CSV file is required." });
    }

    const segments = [];

    // Parse the uploaded CSV file
    fs.createReadStream(path.join(__dirname, "../", req.file.path))
      .pipe(csv())
      .on("data", (row) => {
        const { companyId, name, description } = row;

        if (!companyId || !name) {
          throw new Error("Each row must contain companyId and name.");
        }

        segments.push({ companyId, name, description });
      })
      .on("end", async () => {
        try {
          const savedSegments = [];

          // Process each segment using `createThreadAndRunonKnowledgeBase`
          for (const segment of segments) {
            const finalPrompt = `Create segment for: ${segment.name}`;
            const jsonData = await createThreadAndRunonKnowledgeBase(
              req.body.companyId,
              finalPrompt
            );

            // Save the result to the database
            const newSegment = new UserSegment({
              companyId: jsonData.companyId,
              name: segment.name,
              description: segment.description || jsonData.segmentData,
            });

            const savedSegment = await newSegment.save();
            savedSegments.push(savedSegment);
          }

          res.status(201).json(savedSegments);
        } catch (error) {
          res.status(500).json({ error: error.message });
        } finally {
          // Clean up the uploaded file
          fs.unlink(req.file.path, (err) => {
            if (err) console.error("Failed to delete file:", err);
          });
        }
      })
      .on("error", (error) => {
        res.status(500).json({ error: error.message });
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST a new segment

module.exports = {
 getUserSegments,
 createUserSegment
};
