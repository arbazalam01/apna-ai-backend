const Company = require("../models/Company");
const Relation = require("../models/Relation");

const pdf = async (req, res) => {
  const { companyId } = req.params;
  const {
    competitorsId: competitors,
    companyId: company,
    industryLeaderId: industryLeader,
  } = await Relation.findOne({ companyId })
    .populate(
      "companyId",
      "name products services leadership industries topclients marketposition summary swotanalysis -_id"
    )
    .populate(
      "competitorsId",
      "name products services leadership industries topclients marketposition summary swotanalysis -_id"
    )
    .populate(
      "industryLeaderId",
      "name products services leadership industries topclients marketposition summary swotanalysis -_id"
    );

  
  res.json({ company, competitors, industryLeader,ceo:"" });
};

module.exports = { pdf };
