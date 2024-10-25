const cron = require("node-cron");
const mongoose = require("mongoose"); // Adjust the path as needed
const Relation = require("../models/Relation"); // Adjust the path as needed
const { scrapeAllCompanies } = require("../utils/scraper_helper");
const { fetchCompanyData } = require("../utils/company_helper");

// MongoDB connection string
const uri = process.env.MONGO_DB;

// Function to check and update companies
async function checkAndUpdateCompanies() {
  try {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    // Find all relations where the report is done (isReportDone = 2)
    const completedRelations = await Relation.find({
      isReportDone: 2,
    }).populate("companyId competitorsId industryLeaderId");

    for (const relation of completedRelations) {
      const companyId = relation.companyId;
      const company = fetchCompanyData(companyId);

      if (company.updatedAt < fifteenDaysAgo) {
        try {
          // Call the API for each company
          await scrapeAllCompanies(companyId);
        } catch (error) {
          console.error(
            `Error updating company ${company._id}:`,
            error.message
          );
        }
      }
    }
  } catch (error) {
    console.error("Error in checkAndUpdateCompanies:", error);
  }
}

// Function to start the cron job
function startCronJob() {
  mongoose
    .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB Cron Job"))
    .catch((err) => console.error("MongoDB connection error:", err));

  // Schedule the cron job to run at midnight every day
  cron.schedule("0 0 * * *", () => {
    console.log("Running the company update cron job at midnight");
    checkAndUpdateCompanies();
  });

  console.log("Company update cron job scheduled");
}

module.exports = { startCronJob };
