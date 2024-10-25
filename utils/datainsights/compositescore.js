const { readGoogleSheet } = require("../google_sheet");

const CompositescoreInsights = async (sheetId, startDate, endDate) => {
  const sheetData = await readGoogleSheet(sheetId, "Sheet2");

  const analytics = {
    monthlyData: {},
    awarenessScore: {},
    engagementScore: {},
    compositeScore: {},
  };

  // Assuming the sheet data comes as an array of objects where each row corresponds to a metric
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "June",
    "July",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Define which metrics contribute to awareness and engagement
  const awarenessMetrics = [
    "Unique Impressions",
    "Unique Visitors",
    "Organic Search",
  ];
  const engagementMetrics = [
    "New Followers",
    "Custom Botton Clicks",
    "Total Engagements",
    "Organic Social",
  ];

  const startMonth = startDate.getMonth();
  const endMonth = endDate.getMonth();

  // Process only the first 7 rows of the sheet data
  const first7Rows = sheetData.slice(0, 7);

  // Filter the months based on startMonth and endMonth
  const monthRange = months.slice(startMonth, endMonth + 1);

  first7Rows.forEach((row) => {
    const metric = row["Metrics"];
    const weightage = parseFloat(row["Weightage"]);

    if (!analytics.monthlyData[metric]) {
      analytics.monthlyData[metric] = {};
    }

    // Find the max value across the filtered months for the current metric
    const values = monthRange.map((month) => parseFloat(row[month]) || 0);
    const maxValue = Math.max(...values);

    // Calculate the net result for each filtered month
    monthRange.forEach((month) => {
      const value = parseFloat(row[month]) || 0;
      if (maxValue > 0) {
        const netResult = (value / maxValue) * weightage;
        analytics.monthlyData[metric][month] = netResult;
      } else {
        analytics.monthlyData[metric][month] = null; // Handle case if max value is zero or data is missing
      }

      // Calculate Awareness Score and Engagement Score
      if (!analytics.awarenessScore[month]) {
        analytics.awarenessScore[month] = 0;
      }
      if (!analytics.engagementScore[month]) {
        analytics.engagementScore[month] = 0;
      }

      // Awareness Score
      if (awarenessMetrics.includes(metric)) {
        analytics.awarenessScore[month] += analytics.monthlyData[metric][month]; // Sum the metric value directly
      }

      // Engagement Score
      if (engagementMetrics.includes(metric)) {
        analytics.engagementScore[month] +=
          analytics.monthlyData[metric][month]; // Sum the metric value directly
      }
    });
  });

  // Calculate Composite Score for each month (sum of awarenessScore and engagementScore)
  monthRange.forEach((month) => {
    analytics.compositeScore[month] =
      (analytics.awarenessScore[month] || 0) +
      (analytics.engagementScore[month] || 0);
  });

  return analytics;
};

module.exports = {
  CompositescoreInsights,
};
