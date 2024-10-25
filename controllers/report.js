const Company = require("../models/Company");
const Relation = require("../models/Relation");
const { isReportDone } = require("../utils/company_helper");
const getBlogs = require("../utils/getBlogs");

const getReportData = async (req, res) => {
  const { companyId, tabType } = req.params;

  // get all data of company and it's competitor type based on tabType for example tabType="about"

  if (tabType === "blogs") {
    const allData = await Relation.findOne({ companyId })
      .populate("companyId", "name blogs")
      .populate("competitorsId", "name blogs")
      .populate("industryLeaderId", "name blogs");

    const company = await getBlogs(allData.companyId?.blogs);
    const industry = await getBlogs(allData.industryLeaderId?.blogs);

    const allCompetitors = allData.competitorsId;
    const competitors = [];
    for (let i = 0; i < allCompetitors.length; i++) {
      const data = await getBlogs(allCompetitors[i].blogs);
      competitors.push({ data, name: allCompetitors[i].name });
    }

    const resData = {
      companyId: {
        name: allData.companyId.name,
        data: company,
      },
      industryLeaderId: {
        name: allData.industryLeaderId.name,
        data: industry,
      },
      competitorsId: competitors,
    };

    return res.json(resData);
  }

  const allData = await Relation.findOne({ companyId })
    .populate("companyId", `name ${tabType}`)
    .populate("competitorsId", `name ${tabType}`)
    .populate("industryLeaderId", `name ${tabType}`);

  res.json(allData);
};

const getReportStatus = async (req, res) => {
  const { companyId } = req.params;
  const status = await isReportDone(companyId);
  res.json({ status });
};

module.exports = { getReportData, getReportStatus };
