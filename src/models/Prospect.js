const mongoose = require("mongoose");

const ProspectSchema = new mongoose.Schema({
  name: String,
  industry: String,
  yearofexperience: Number,
  location: String,
  linkedin: String,
  companyLinkedin: String,
  title: String,
  email: String,
  companyName: String,
  Demographic: [String],
  Psychographic: [String],
  PainPoints: [String],
  Motivations: [String],
  Challenges: [String],
  Interests: [String],
  TonOfVoice: String,
  product:String,
  objective:String,
  numberOfEmails:Number,
  companyId: {
    type: mongoose.ObjectId,
    ref: "Company",
  },
  Questions:[String],
  proxycurl: Object,

});

const Prospect = mongoose.model("Prospect", ProspectSchema);

module.exports = Prospect
