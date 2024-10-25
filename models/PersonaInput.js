const mongoose = require("mongoose");

const PersonaInputSchema = new mongoose.Schema(
  {
    businessSize:String,
    designation:String,
    companyId: {
        type: mongoose.ObjectId,
        ref: "Company",
      }
  }
);

const PersonaInput = mongoose.model("PersonaInput", PersonaInputSchema);

module.exports = PersonaInput;
