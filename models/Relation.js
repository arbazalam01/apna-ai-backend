const mongoose = require("mongoose");
const Company = require("./Company");


const UserPersonaSchema = new mongoose.Schema({
  userinfo: {
    type: {
      name:String,
      age: String,
      jobdescription:String,
      industry:String,
      yearofexperience:Number,
      location: String,
    },
  },
  gptoutput:{
    Demographic:[String],
    Psychographic:[String],
    PainPoints:[String],
    Motivations:[String],
    Challenges:[String],
    Interests:[String]
  }
});

const RelationSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.ObjectId,
    ref: Company,
  },
  competitorsId: [
    {
      type: mongoose.ObjectId,
      ref: Company,
    },
  ],
  industryLeaderId: {
    type: mongoose.ObjectId,
    ref: Company,
  },
  userpersona:[UserPersonaSchema],
  toptrends:[String],
  isReportDone: {
    type: Number,
    default: 0,
  },
});

const Relation = mongoose.model("Relation", RelationSchema);

module.exports = Relation;
