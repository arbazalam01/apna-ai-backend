const mongoose = require("mongoose");
const Company = require("./Company");


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
  toptrends:[String],
  isReportDone: {
    type: Number,
    default: 0,
  },
});

const Relation = mongoose.model("Relation", RelationSchema);

module.exports = Relation;
