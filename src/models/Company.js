import mongoose from "mongoose";

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
    name: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    about: AboutSchema,
    products: [ProductandServiceSchema],
    services: [ProductandServiceSchema],
    industries: [String],
    marketposition: MarketpositionSchema,
    swotanalysis: SwotanalysisSchema,
    topseos: [String],
    dateofScrape: Date,
  },
  { timestamps: true }
);

const Company = mongoose.model("Company", CompanySchema);

module.exports = Company;