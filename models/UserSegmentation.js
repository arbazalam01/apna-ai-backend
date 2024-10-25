const mongoose = require("mongoose");

const UserSegmentsSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId, // Use proper type declaration
      ref: "Company", // Add quotes around the model reference name
    },
    name: {
      type: String,
      required: true, // Optional: Add validation if needed
    },
    Segments: [
      { Title:String,
        Demographics: String,
        Product_Preferences: String,
        Buying_Patterns: String,
        Description: String,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Enables createdAt and updatedAt timestamps automatically
  }
);

const UserSegment = mongoose.model("UserSegment", UserSegmentsSchema); // Use a singular name for the model

module.exports = UserSegment;
