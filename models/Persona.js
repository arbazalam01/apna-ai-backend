const mongoose = require("mongoose");

const PersonaSchema = new mongoose.Schema(
  {
    name:String,
    designation: String,
    organisation: String,
    age: Number,
    gender: String,
    jobdescription: String,
    yopofexperience: String,
    Motivations: [String],
    KPIs:[String],
    PainPoints:[String],
    Questions:[
      {
        type: {
          productName: String,
          question: [String],
        },
      },
    ],
    product:[String],
    country:String,
    avatar:String,
    businessSize:String,
    companyId: {
        type: mongoose.ObjectId,
        ref: "Company",
      }
  },
  { timestamps: true }
);

const Persona = mongoose.model("Persona", PersonaSchema);

module.exports = Persona;
