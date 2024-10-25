const mongoose = require("mongoose");
const Company = require("./Company");
const Schema = mongoose.Schema;

// Define Campaign schema
const campaignSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    prospectIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Prospect",
      },
    ],
    companyId: {
      type: mongoose.ObjectId,
      ref: Company,
    },
  },
  {
    timestamps: true,
  }
);

// Create Campaign model
const Campaign = mongoose.model("Campaign", campaignSchema);

module.exports = Campaign;
