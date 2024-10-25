const { DataInsight } = require("../lib/function_calling");
const Company = require("../models/Company");
const { fetchCompanyData } = require("./company_helper");
const { google } = require("googleapis");
const {
  createThreadAndRun,
  createThreadAndRunonKnowledgeBase,
} = require("./openai_helper");
const { readGoogleSheet } = require("./google_sheet");

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

const getPostAnalysis = async (companyId, page, pageSize) => {
  const company = await fetchCompanyData(companyId);
  const googleSpreadSheetUrl = company.about.googleSheetUrl;
  const googleSheetClient = await _getGoogleSheetClient();

  // Retrieve the sheet data as JSON
  const filteredSheetData = await googleSheetClient.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID, // Replace this with your actual SPREADSHEET_ID
    range: googleSpreadSheetUrl, // Assuming sheet name is the same as the title
  });

  // Convert the sheet data to JSON format
  const headers = filteredSheetData.data.values[0]; // Assuming the first row contains headers
  const Metrics = [
    "Post: Title",
    "Post: Commentary",
    "Performance: Impressions",
    "Performance: Shares",
    "Performance: Engagement",
    "Performance: Likes",
    "Performance: Comments",
  ];

  // check if dashboard result is present in company data

  const dashboardResult = company.about.dashboardResult;
  const analysisPosts = dashboardResult?.posts;
  // check if analysisPosts is present for given page and pageSize
  const startIndex = (page - 1) * pageSize;
  const endIndex = page * pageSize;

  const totalPosts = analysisPosts.length;

  const paginatedUpdatedData = analysisPosts.slice(startIndex, endIndex);

  const totalSheetPosts = filteredSheetData.data.values.length - 1;

  let analysisReData;

  console.log("Total Posts:", totalPosts);
  console.log("End Index:", endIndex);
  console.log("Start Index:", startIndex);

  if (totalPosts >= endIndex) {
    analysisReData = paginatedUpdatedData;
  } else {
    // Slice the data based on the page number
    console.log("Running LLM");
    const paginatedData = filteredSheetData.data.values.slice(
      totalPosts,
      endIndex
    );
    let markdown = "";

    const assistantV2Id = company.assistantV2Id;
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
    const prompt =
      DataInsight.Prompt +
      `\n Do not include any explanations, only provide JSON response following this format without deviation.:\n ${DataInsight.json_format}\n. The posts data is as follows :- \n ${markdown}\n The JSON response:`;

    const result = await createThreadAndRunonKnowledgeBase(companyId, prompt);

    const analysisUpdatedData = await Company.findByIdAndUpdate(
      companyId,
      {
        $push: {
          "about.dashboardResult.posts": {
            $each: result.posts,
          },
        },
      },
      { new: true }
    );

    const newPostsData = analysisUpdatedData.about.dashboardResult.posts;

    analysisReData = newPostsData.slice(startIndex, endIndex);
  }

  //   const updatedSheetData = filteredSheetData.data.values.map((row, idx) => {
  //     const post = analysisReData?.find((post) => post.id == idx + 1);
  //     // make row array to object
  //     let obj = {};
  //     row.forEach((value, index) => {
  //       obj[headers[index]] = value;
  //     });
  //     if (post) {
  //       return {
  //         ...obj,
  //         ...post,
  //       };
  //     }
  //     return obj;
  //   });

  const updatedSheetData = analysisReData.map((post, idx) => {
    const rowId = post.id;
    const row = filteredSheetData.data.values[rowId];
    let obj = {};
    row.forEach((value, index) => {
      obj[headers[index]] = value;
    });
    return {
      ...obj,
      ...post,
    };
  });

  return {
    items: updatedSheetData,
    totalCount: totalSheetPosts,
  };
};

const getPostAnalysisV2 = async (
  companyId,
  startDate,
  endDate,
  page,
  pageSize = 10
) => {
  const company = await fetchCompanyData(companyId);
  const startIndex = (page - 1) * pageSize;
  const endIndex = page * pageSize;
  const sheetId = company.about.googleSheetUrl;

  const sheetData = await readGoogleSheet(sheetId, "Linkedin- Posts");

  const filterByDateRange = (rows, dateKey) => {
    return rows
      .filter((row) => {
        const date = new Date(row[dateKey]);
        return (
          date >= new Date(startDate.getFullYear(), startDate.getMonth(), 1) &&
          date <= new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0)
        );
      })
      .sort((a, b) => new Date(b[dateKey]) - new Date(a[dateKey]));
  };

  const filteredSheetData = filterByDateRange(sheetData, "Post: Published at");

  const Metrics = [
    "Post: Title",
    "Post: Commentary",
    // "Performance: Impressions",
    // "Performance: Shares",
    // "Performance: Engagement",
    "Engagement: Reactions - Like",
    "Engagement: Comments",
  ];

  const actualPosts = filteredSheetData;
  const totalSheetPosts = filteredSheetData.length;
  const paginatedData = actualPosts.slice(startIndex, endIndex);

  // check if dashboard result is present in company data
  const dashboardResult = company.about.dashboardResult;
  const analysisPosts = dashboardResult?.posts;

  // check analysisPosts id present for givend startIndex and endIndex
  const postsExist = analysisPosts
    .filter((post) => post.id >= startIndex && post.id < endIndex)
    .filter(
      (post, index, self) => index === self.findIndex((p) => p.id === post.id)
    );

  let analysisReData = [];

  if (postsExist.length > 0) {
    console.log("Posts Exist");
    analysisReData = postsExist;
  } else {
    console.log("Running LLM");
    let markdown = "";
    // Iterate over each row of data
    paginatedData.forEach((row, idx) => {
      let postTitle = `Post ${startIndex + idx}`;
      markdown += `\`\`\`${postTitle}\n`;

      Metrics.forEach((metric) => {
        // let valueIndex = headers.indexOf(metric);
        let value = row[metric] || "";
        markdown += `**${metric}**: ${value}\n`;
      });

      markdown += `**Id**: ${startIndex + idx}\n\`\`\`\n\n`; // Add an Id field to each
    });

    const prompt =
      DataInsight.Prompt +
      `\n Do not include any explanations, only provide JSON response following this format without deviation.:\n ${DataInsight.json_format}\n. The posts data is as follows :- \n ${markdown}\n The JSON response:`;

    // console.log("Prompt--->", prompt);
    // return;
    const result = await createThreadAndRunonKnowledgeBase(companyId, prompt);

    const analysisUpdatedData = await Company.findByIdAndUpdate(
      companyId,
      {
        $push: {
          "about.dashboardResult.posts": {
            $each: result.posts,
          },
        },
      },
      { new: true }
    );

    const newPostsData = analysisUpdatedData.about.dashboardResult.posts;

    analysisReData = newPostsData
      .filter((post) => post.id >= startIndex && post.id < endIndex)
      .filter(
        (post, index, self) => index === self.findIndex((p) => p.id === post.id)
      );
  }

  const updatedSheetData = analysisReData.map((post) => {
    const rowId = post.id;
    const numericRowId = Number(rowId);
    const row = actualPosts[numericRowId];
    let obj = {};
    if (row && typeof row === "object") {
      Object.keys(row).forEach((key) => {
        obj[key] = row[key];
      });
    } else {
      obj = row;
      console.error(`Row with id ${numericRowId} is not an object:`, row);
    }
    return {
      ...obj,
      ...post,
    };
  });

  return {
    items: updatedSheetData,
    totalCount: totalSheetPosts,
  };
};

module.exports = { getPostAnalysis, getPostAnalysisV2 };
