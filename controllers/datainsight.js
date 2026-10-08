const { google } = require("googleapis");
const { DataInsight } = require("../lib/function_calling");
const { fetchCompanyData } = require("../utils/company_helper");
const { createThreadAndRunonKnowledgeBase } = require("../utils/openai_helper");
const { getPostAnalysisV2 } = require("../utils/post_analysis");
const { WebsiteInsight } = require("../utils/datainsights/website");
const { GoogleSearchConsoleInsight } = require("../utils/datainsights/gsc");
const { BlogsInsights } = require("../utils/datainsights/blogs");
const { LinkedinInsight } = require("../utils/datainsights/linkedin");
const {
  CompositescoreInsights,
} = require("../utils/datainsights/compositescore");
const { LinkedinAdsInsights } = require("../utils/datainsights/linkedinads");
const { readGoogleSheet } = require("../utils/google_sheet");
const { SocialMediaInsights } = require("../utils/datainsights/socialmedia");
const SPREADSHEET_ID = process.env.DATAINSIGHT_SPREADSHEET_ID;

async function _getGoogleSheetClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const authClient = await auth.getClient();
  return google.sheets({
    version: "v4",
    auth: authClient,
  });
}

const getInsightdata = async (req, res) => {
  // try {
  //   const companyId = req.params.companyId;
  //   const { page, pageSize } = req.query;

  //   const company = await fetchCompanyData(companyId);
  //   const googleSpreadSheetUrl = company.about.googleSheetUrl;
  //   const dashboardResult = company.about.dashboardResult;
  //   const googleSheetClient = await _getGoogleSheetClient();

  //   const { data } = await googleSheetClient.spreadsheets.get({
  //     spreadsheetId: SPREADSHEET_ID, // Replace this with your actual SPREADSHEET_ID
  //   });

  //   // Find the sheet where the title matches googleSheetUrl
  //   const matchingSheet = data.sheets.find(
  //     (sheet) => sheet.properties.title === googleSpreadSheetUrl
  //   );

  //   if (matchingSheet) {
  //     // Fetch the data of the matching sheet using the sheetId
  //     const sheetData = await googleSheetClient.spreadsheets.values.get({
  //       spreadsheetId: SPREADSHEET_ID, // Replace this with your actual SPREADSHEET_ID
  //       range: matchingSheet.properties.title, // Assuming sheet name is the same as the title
  //     });
  //     const analysisPosts = dashboardResult?.posts;

  //     const headers = sheetData.data.values[0]; // Assuming the first row contains headers
  //     const updatedSheetData = sheetData.data.values.map((row, idx) => {
  //       const post = analysisPosts?.find((post) => post.id == idx + 1);
  //       // make row array to object
  //       let obj = {};
  //       row.forEach((value, index) => {
  //         obj[headers[index]] = value;
  //       });
  //       if (post) {
  //         return {
  //           ...obj,
  //           ...post,
  //         };
  //       }
  //       return obj;
  //     });

  //     return res.status(200).json(updatedSheetData);
  //   } else {
  //     // Handle case where no matching sheet is found
  //     return res
  //       .status(404)
  //       .send("No matching sheet found for the provided Google Sheet URL");
  //   }
  // } catch (error) {
  //   res.status(400).json({ message: error.message });
  // }

  try {
    const companyId = req.params.companyId;
    const { startDate, endDate, page, pageSize } = req.query;

    let start, end;
    if (!startDate || !endDate) {
      const currentDate = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(currentDate.getMonth() - 6);
      start = sixMonthsAgo;
      end = currentDate;
    } else {
      start = new Date(startDate);
      end = new Date(endDate);
    }

    // convert page and pageSize to integer

    const pageInt = parseInt(page);
    const pageSizeInt = parseInt(pageSize);

    const company = await fetchCompanyData(companyId);
    const spreadsheetUrl = company.about.googleSheetUrl;

    if (!spreadsheetUrl) {
      return res.status(404).json({
        message: "No matching sheet found for the provided Google Sheet URL",
      });
    }

    const anlaysisRes = await getPostAnalysisV2(
      companyId,
      start,
      end,
      pageInt,
      pageSizeInt
    );

    return res.status(200).json(anlaysisRes);
  } catch (error) {
    console.error("Error in getInsightdata:", error.message);
    return res.status(400).json({ message: error.message });
  }
};

const createInsight = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const pageNumber = parseInt(req.params.pageNumber) || 1;
    const pageSize = 10;
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const company = await fetchCompanyData(companyId);
    const sheetId = company.about.googleSheetUrl;
    const sheetData = await readGoogleSheet(sheetId, "Linkedin- Posts");

    // Convert the sheet data to JSON format
    const headers = sheetData.data.values[0]; // Assuming the first row contains headers
    const Metrics = [
      "Post: Title",
      "Post: Commentary",
      "Performance: Impressions",
      "Performance: Shares",
      "Performance: Engagement",
      "Performance: Likes",
      "Performance: Comments",
    ];

    // Slice the data based on the page number
    const paginatedData = sheetData.data.values.slice(
      startIndex + 1,
      endIndex + 1
    );
    let markdown = "";

    // Iterate over each row of data
    paginatedData.forEach((row, idx) => {
      let postTitle = `Post ${startIndex + idx + 1}`;
      markdown += `\`\`\`${postTitle}\n`;

      Metrics.forEach((metric) => {
        let valueIndex = headers.indexOf(metric);
        let value = row[valueIndex] || "";
        markdown += `**${metric}**: ${value}\n`;
      });

      markdown += `**Id**: ${startIndex + idx + 1}\n\`\`\`\n\n`; // Add an Id field to each post
    });

    // const companyData = await isAssistantV2Exist(companyId);
    // const { assistantV2Id } = companyData;
    const prompt =
      DataInsight.Prompt +
      `\n Do not include any explanations, only provide JSON response following this format without deviation.:\n ${DataInsight.json_format}\n. The posts data is as follows :- \n ${markdown}\n The JSON response:`;

    const result = await createThreadAndRunonKnowledgeBase(companyId, prompt);

    // console.log("Result from OpenAI:", result);

    if (result) {
      if (pageNumber == 1) {
        company.about.dashboardResult = result.dashboardResult;
      } else if (pageNumber > 1) {
        // Merge existing posts with new ones
        const existingPosts = company.about.dashboardResult.posts || [];
        const newPosts = result.dashboardResult.posts;

        const updatedPosts = newPosts.map((newPost) => {
          const existingPostIndex = existingPosts.findIndex(
            (post) => post.id === newPost.id
          );
          if (existingPostIndex !== -1) {
            // Update existing post
            existingPosts[existingPostIndex] = newPost;
          } else {
            // Add new post if it doesn't exist
            existingPosts.push(newPost);
          }
          return newPost;
        });

        company.about.dashboardResult.posts = existingPosts;
      }
      await company.save();
    }

    const dashboardResult = company.about.dashboardResult;
    const analysisPosts = dashboardResult?.posts;

    const updatedSheetData = sheetData.data.values.map((row, idx) => {
      const post = analysisPosts?.find((post) => post.id == idx + 1);
      let obj = {};
      row.forEach((value, index) => {
        obj[headers[index]] = value;
      });
      if (post) {
        return {
          ...obj,
          ...post,
        };
      }
      return obj;
    });

    // Slice the updatedSheetData based on pagination
    const paginatedUpdatedData = updatedSheetData.slice(startIndex, endIndex);

    res.status(200).json({
      data: paginatedUpdatedData,
      totalCount: company.about.dashboardResult.posts.length,
    });
  } catch (error) {
    console.error("Error in createInsight:", error.message);
    res.status(400).json({ message: error.message });
  }
};

const getInsightDataV2 = async (req, res) => {
  const { sheetId, tab, startDate, endDate } = req.query;
  const currentDate = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(currentDate.getMonth() - 6);

  // If startDate and endDate are not provided, default to the last 6 months
  const start = startDate ? new Date(startDate) : sixMonthsAgo;
  const end = endDate ? new Date(endDate) : currentDate;

  try {
    let analytics = {};

    if (tab == "GA") {
      analytics = await WebsiteInsight(sheetId, start, end);
    } else if (tab == "GSC") {
      analytics = await GoogleSearchConsoleInsight(sheetId, start, end);
    } else if (tab == "LINKEDIN") {
      analytics = await LinkedinInsight(sheetId, start, end);
    } else if (tab == "BLOGS") {
      analytics = await BlogsInsights(sheetId, start, end);
    } else if (tab == "COMPOSITESCORE") {
      analytics = await CompositescoreInsights(sheetId, start, end);
    } else if (tab == "LINKEDINADS") {
      analytics = await LinkedinAdsInsights(sheetId, start, end);
    } else if (tab == "SOCIALMEDIA") {
      analytics = await SocialMediaInsights(sheetId, start, end);
    }

    res.json(analytics);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch ", error });
  }
};
module.exports = {
  getInsightdata,
  createInsight,
  getInsightDataV2,
};
