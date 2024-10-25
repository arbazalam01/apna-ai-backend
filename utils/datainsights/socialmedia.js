const { readGoogleSheet } = require("../google_sheet");

const SocialMediaInsights = async (sheetId, startDate, endDate) => {
  const sheetName = "SocialMediaPosts";
  const sheetData = await readGoogleSheet(sheetId, sheetName);

  // Initialize analytics object
  let analytics = {
    totalPosts: {},
    monthlyData: {},
    currentMonthPosts: {}, // New property for current month's data
  };

  const processCurrentMonthData = (rows) => {
    rows.forEach((row) => {
      const platform = row.Platform;
      if (!analytics.currentMonthPosts[platform]) {
        analytics.currentMonthPosts[platform] = 0;
      }
      Object.keys(row).forEach((key) => {
        if (key !== "Platform") {
          const date = new Date(key);
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          const postCount = parseInt(row[key], 10) || 0;
  
          // Check if the date is in the current month
          if (
            date.getMonth() === currentMonth &&
            date.getFullYear() === currentYear
          ) {
            analytics.currentMonthPosts[platform] += postCount;
          }
        }
      });
    });
  };

  // Process the entire sheet data for current month data
processCurrentMonthData(sheetData);

  // Helper function to process rows and update platform data
  const processRows = (rows) => {
    rows.forEach((row) => {
      const platform = row.Platform;
      if (!analytics.totalPosts[platform]) {
        analytics.totalPosts[platform] = 0;
      }
      if (!analytics.monthlyData[platform]) {
        analytics.monthlyData[platform] = {};
      }
      // if (!analytics.currentMonthPosts[platform]) {
      //   analytics.currentMonthPosts[platform] = 0;
      // }
      Object.keys(row).forEach((key) => {
        if (key !== "Platform") {
          const date = new Date(key);
          const month = `${date.getFullYear()}-${date.getMonth() + 1}`;
          // const currentMonth = new Date().getMonth();
          // const currentYear = new Date().getFullYear();
          if (
            date >=
              new Date(startDate.getFullYear(), startDate.getMonth(), 1) &&
            date <= new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0)
          ) {
            const postCount = parseInt(row[key], 10) || 0;
            analytics.totalPosts[platform] += postCount;
            if (!analytics.monthlyData[platform][month]) {
              analytics.monthlyData[platform][month] = 0;
            }
            analytics.monthlyData[platform][month] += postCount;

            // // Check if the date is in the current month
            // if (
            //   date.getMonth() === currentMonth &&
            //   date.getFullYear() === currentYear
            // ) {
            //   analytics.currentMonthPosts[platform] += postCount;
            // }
          }
        }
      });
    });
  };

  const filterByDateRange = (rows) => {
    return rows.map((row) => {
      const filteredRow = { Platform: row.Platform };
      Object.keys(row).forEach((key) => {
        if (key !== "Platform") {
          const date = new Date(key);

          if (
            date >=
              new Date(startDate.getFullYear(), startDate.getMonth(), 1) &&
            date <= new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0)
          ) {
            filteredRow[key] = row[key];
          }
        }
      });
      return filteredRow;
    });
  };

  const filteredSheetData = filterByDateRange(sheetData);

  // Process the filtered data
  processRows(filteredSheetData);

  return analytics;
};

module.exports = {
  SocialMediaInsights,
};
