const schedule = require("node-schedule");
const Company = require("../models/Company");
const { s3 } = require("./aws_helper");
const { runAllPromptHelper, updateCompanyData } = require("./company_helper");

let intervalId;

async function doesPathExist(bucketName, path) {
  try {
    const response = await s3.listObjectsV2({
      Bucket: bucketName,
      Prefix: path,
    });
    return response.KeyCount > 0;
  } catch (error) {
    console.error("Error checking path existence:", error);
    throw error; // Re-throw the error to handle it outside
  }
}

async function getScrapingStatus(companyId) {
  try {
    return await doesPathExist(
      process.env.BUCKETNAME,
      `${companyId}/CONSOLIDATED_WEBSITE.md`
    );
  } catch (err) {
    console.error("Error getting scraping status:", err);
    return false;
  }
}

const runAllPromptFunction = async (companyId) => {
  try {
    await updateCompanyData(companyId, { isScrapingDone: true });
    await runAllPromptHelper(companyId);
  } catch (err) {
    console.log("err", err);
  }
};

async function pollFunction() {
  console.log("Polling Running!!!");
  let allScrape = true;
  const companies = await Company.find({ isScrapingDone: false });

  if (companies && companies.length > 0) {
    for (const company of companies) {
      const isScrapingFile = await getScrapingStatus(company._id);
      console.log(company.name, isScrapingFile);
      if (!isScrapingFile) {
        allScrape = false;
        break; // No need to continue checking if one file is missing
      }
    }

    if (allScrape) {
      clearInterval(intervalId);
      for (const company of companies) {
        await runAllPromptFunction(company._id);
        await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
      }
    }
  }
}

const startPolling = () => {
  console.log("Polling Started!!!");
  intervalId = setInterval(pollFunction, 60 * 1000);
};
const stopPolling = () => {
  console.log("Polling Stopped!!!");
  clearInterval(intervalId);
};
module.exports = { startPolling, stopPolling };
