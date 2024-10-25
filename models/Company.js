const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema({
  name: String,
  description: String,
});

const ProductandServiceSchema = new mongoose.Schema({
  name: String,
  description: [String],
});

const AboutSchema = new mongoose.Schema({
  description: String,
  mission: String,
  companyLogo: String,
  facebook: {
    type: {
      followers: String,
      handle: String,
    },
  },
  instagram: {
    type: {
      followers: String,
      handle: String,
    },
  },
  linkedin: {
    type: {
      followers: String,
      handle: String,
    },
  },
  googleSheetUrl: String,
  compositeScoreUrl: String,
  dashboardResult: {
    posts: [Object],
    general_analysis: Object,
  },
});
const LeadershipSchema = new mongoose.Schema({
  name: String,
  designation: String,
  linkedin: String,
});
const BlogSchema = new mongoose.Schema({
  url: String,
  titles: [
    {
      type: {
        title: String,
        blogtype: String,
      },
    },
  ],
  instructionalPercent: Number,
  thoughtLeadershipPercent: Number,
  keywordDrivenPercent: Number,
  companyUpdatePercent: Number,
  othersPercent: Number,
});
const LinkedinSchema = new mongoose.Schema({
  posttitle: String,
  engagement: Number,
});

const BlogdataSchema = new mongoose.Schema({
  title: String,
  count: Number,
});
const SwotanalysisSchema = new mongoose.Schema({
  strengths: [ItemSchema],
  weaknesses: [ItemSchema],
  opportunities: [ItemSchema],
  threats: [ItemSchema],
});

const MarketpositionSchema = new mongoose.Schema({
  corepurpose: [ItemSchema],
  positioning: [ItemSchema],
  keydifferentiators: [ItemSchema],
  brandpersonality: [ItemSchema],
});

const CompanySchema = new mongoose.Schema(
  {
    name: String,
    websiteUrl: String,
    about: AboutSchema,
    products: [ProductandServiceSchema],
    services: [ProductandServiceSchema],
    industries: [String],
    leadership: [LeadershipSchema],
    blogs: BlogSchema,
    linkedin: [LinkedinSchema],
    topclients: [String],
    marketposition: MarketpositionSchema,
    swotanalysis: SwotanalysisSchema,
    topseos: [String],
    Employees: Number,
    CompanyAddress: String,
    CompanyCity: String,
    CompanyState: String,
    CompanyCountry: String,
    CompanyPhone: String,
    SEODescription: String,
    Technologies: String,
    AnnualRevenue: Number,
    TotalFunding: Number,
    LatestFunding: String,
    LatestFundingAmount: Number,
    LastRaisedAt: String,
    dateofScrape: Date,
    summary: String,
    BrandVoice: String,
    assistantId: String,
    assistantV2Id: String,
    fileId: [String],
    threadId: String,
    isScrapingDone: {
      type: Boolean,
      default: false,
    },
    proxycurl: Object,
    isPrimaryCompany: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Company = mongoose.model("Company", CompanySchema);

module.exports = Company;
