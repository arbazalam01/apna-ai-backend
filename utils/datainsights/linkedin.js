const { readGoogleSheet } = require("../google_sheet");

const sortMonths = (data) => {
  return Object.fromEntries(
    Object.entries(data).sort(
      ([a], [b]) => new Date(`${a}-01`) - new Date(`${b}-01`)
    )
  );
};

// Helper function to get the latest month
const getLatestMonth = (data) => {
  const allMonths = Object.values(data).flatMap(Object.keys);
  return allMonths.sort().pop();
};

// Helper function to sanitize sheet names
const sanitizeSheetName = (name) => {
  return `'${name.replace(/'/g, "")}'`;
};

// Helper function to initialize month data
const initializeMonthData = () => ({
  posts: 0,
  impressions: 0,
  uniqueImpressions: 0,
  pageViews: 0,
  uniquePageViews: 0,
  clicks: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  organicFollowers: 0,
  paidFollowers: 0,
  totalFollowerGain: 0,
  engagementRate: 0,
});

// Helper function to process rows and update month data
const processRows = (rows, dateKey, dataKey, monthData, updateFn) => {
  rows.forEach((row) => {
    const date = new Date(row[dateKey]);
    const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
    if (!monthData[monthYear]) {
      monthData[monthYear] = initializeMonthData();
    }
    updateFn(monthData[monthYear], row[dataKey]);
  });

  // // Calculate engagement rate for each month
  // Object.keys(monthData).forEach((month) => {
  //   const data = monthData[month];
  //   if (data.engagementRateCount > 0) {
  //     data.engagementRate /= data.engagementRateCount;
  //   } else {
  //     data.engagementRate = 0;
  //   }
  // });
};
// Function to calculate and store average engagement rate for each month

const calculateFollowerGain = (rows, dateKey, dimensionKey, dataKey) => {
  const data = {};
  rows.forEach((row) => {
    const date = new Date(row[dateKey]);
    const monthYear = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    const dimension = row[dimensionKey];
    const totalFollowers = parseInt(row[dataKey], 10) || 0;

    if (!data[dimension]) {
      data[dimension] = {};
    }
    data[dimension][monthYear] = totalFollowers;
  });

  const latestMonth = getLatestMonth(data);
  const sortedDimensions = Object.keys(data).sort((a, b) => {
    return (data[b][latestMonth] || 0) - (data[a][latestMonth] || 0);
  });

  const topDimensions = sortedDimensions.slice(0, 9);
  const otherDimensions = sortedDimensions.slice(9);

  const dimensionFollowerGain = {};
  topDimensions.forEach((dimension) => {
    const months = Object.keys(data[dimension]).sort();
    dimensionFollowerGain[dimension] = months.reduce((acc, month, index) => {
      if (index > 0) {
        const prevMonth = months[index - 1];
        acc[prevMonth] = data[dimension][month] - data[dimension][prevMonth];
      } else {
        // If no previous month, consider the total followers as the gain
        acc[month] = data[dimension][month];
      }
      return acc;
    }, {});
    // Ensure the latest month has a gain of 0
    const lastMonth = months[months.length - 1];
    dimensionFollowerGain[dimension][lastMonth] = 0;
  });

  const otherFollowerGain = {};
  otherDimensions.forEach((dimension) => {
    const months = Object.keys(data[dimension]).sort();
    months.forEach((month, index) => {
      if (!otherFollowerGain[month]) {
        otherFollowerGain[month] = 0;
      }
      if (index > 0) {
        const prevMonth = months[index - 1];
        otherFollowerGain[prevMonth] +=
          data[dimension][month] - data[dimension][prevMonth];
      } else {
        // If no previous month, consider the total followers as the gain
        otherFollowerGain[month] += data[dimension][month];
      }
    });
    // Ensure the latest month has a gain of 0
    const lastMonth = months[months.length - 1];
    otherFollowerGain[lastMonth] = 0;
  });

  dimensionFollowerGain["Others"] = otherFollowerGain;
  return dimensionFollowerGain;
};

const calculateTopViews = (rows, dimensionKey, dataKey) => {
  const data = {};
  rows.forEach((row) => {
    const dimension = row[dimensionKey];
    const views = parseInt(row[dataKey], 10) || 0;
    if (!data[dimension]) {
      data[dimension] = 0;
    }
    data[dimension] += views;
  });

  const sortedDimensions = Object.entries(data).sort(([, a], [, b]) => b - a);
  const topDimensions = sortedDimensions.slice(0, 9);
  const otherDimensions = sortedDimensions.slice(9);

  const topViews = Object.fromEntries(topDimensions);
  const otherViewsTotal = otherDimensions.reduce(
    (acc, [, views]) => acc + views,
    0
  );

  if (otherViewsTotal > 0) {
    topViews["Others"] = otherViewsTotal;
  }

  return topViews;
};

// ... existing code ...
// ... existing code ...
const LinkedinInsight = async (sheetId, startDate, endDate) => {
  const sheetNames = [
    "Linkedin- Posts",
    "Linkedin- Cumulative perofmance insight",
    "Linkedin- Page performance insights",
    "Linkedin- Views by country",
    "Linkedin- Views by industry",
    "Linkedin- Follower gain",
    "Linkedin- Followers by country",
    "Linkedin- Followers by industry",
  ];

  const [
    totalPostRows,
    cumulativePerformanceRows,
    pagePerformanceRows,
    countryViewsRows,
    industryViewsRows,
    followersInsightRows,
    followersByCountryRows,
    followersByIndustryRows,
  ] = await Promise.all(
    sheetNames.map((name) => readGoogleSheet(sheetId, sanitizeSheetName(name)))
  );

  const filterByDateRange = (rows, dateKey) => {
    return rows.filter((row) => {
      const date = new Date(row[dateKey]);
      return (
        date >= new Date(startDate.getFullYear(), startDate.getMonth(), 1) &&
        date <= new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0)
      );
    });
  };

  const filteredTotalPostRows = filterByDateRange(
    totalPostRows,
    "Post: Published at"
  );
  const filteredCumulativePerformanceRows = filterByDateRange(
    cumulativePerformanceRows,
    "Report: Date"
  );
  const filteredPagePerformanceRows = filterByDateRange(
    pagePerformanceRows,
    "Report: Date"
  );
  const filteredCountryViewsRows = filterByDateRange(
    countryViewsRows,
    "Row Updated At"
  );
  const filteredIndustryViewsRows = filterByDateRange(
    industryViewsRows,
    "Row Updated At"
  );
  const filteredFollowersInsightRows = filterByDateRange(
    followersInsightRows,
    "Report: Date"
  );
  const filteredFollowersByCountryRows = filterByDateRange(
    followersByCountryRows,
    "Row Updated At"
  );
  const filteredFollowersByIndustryRows = filterByDateRange(
    followersByIndustryRows,
    "Row Updated At"
  );

  const monthData = {};

  // Calculate total posts
  processRows(
    filteredTotalPostRows,
    "Post: Published at",
    null,
    monthData,
    (data) => {
      data.posts += 1;
    }
  );

  // Calculate impressions and unique impressions
  processRows(
    filteredCumulativePerformanceRows,
    "Report: Date",
    "Performance: Impressions",
    monthData,
    (data, value) => {
      data.impressions += parseInt(value, 10) || 0;
    }
  );

  processRows(
    filteredCumulativePerformanceRows,
    "Report: Date",
    "Performance: Unique impressions",
    monthData,
    (data, value) => {
      data.uniqueImpressions += parseInt(value, 10) || 0;
    }
  );

  // Calculate page views and unique page views
  processRows(
    filteredPagePerformanceRows,
    "Report: Date",
    "Views: All page views",
    monthData,
    (data, value) => {
      data.pageViews += parseInt(value, 10) || 0;
    }
  );
  processRows(
    filteredPagePerformanceRows,
    "Report: Date",
    "Views: Unique all page views",
    monthData,
    (data, value) => {
      data.uniquePageViews += parseInt(value, 10) || 0;
    }
  );

  // Calculate engagement rate, clicks, likes, comments, shares

  processRows(
    filteredCumulativePerformanceRows,
    "Report: Date",
    "Performance: Engagement rate",
    monthData,
    (data, value) => {
      const engagementValue = parseFloat(value) || 0;
      data.engagementRate += engagementValue;
      if (!data.engagementRateCount) {
        data.engagementRateCount = 0;
      }
      data.engagementRateCount += engagementValue > 0 ? 1 : 0;
    }
  );

  // Calculate average engagement rate for each month
  Object.keys(monthData).forEach((month) => {
    const data = monthData[month];
    if (data.engagementRateCount > 0) {
      data.engagementRate /= data.engagementRateCount;
    } else {
      data.engagementRate = 0;
    }
  });

  // console.log("monthData", monthData);

  processRows(
    filteredCumulativePerformanceRows,
    "Report: Date",
    "Performance: Clicks",
    monthData,
    (data, value) => {
      data.clicks += parseInt(value, 10) || 0;
    }
  );
  processRows(
    filteredCumulativePerformanceRows,
    "Report: Date",
    "Engagement: Likes",
    monthData,
    (data, value) => {
      data.likes += parseInt(value, 10) || 0;
    }
  );
  processRows(
    filteredCumulativePerformanceRows,
    "Report: Date",
    "Engagement: Comments",
    monthData,
    (data, value) => {
      data.comments += parseInt(value, 10) || 0;
    }
  );
  processRows(
    filteredCumulativePerformanceRows,
    "Report: Date",
    "Engagement: Reposts",
    monthData,
    (data, value) => {
      data.shares += parseInt(value, 10) || 0;
    }
  );

  // Calculate follower gain, organic and paid followers
  processRows(
    filteredFollowersInsightRows,
    "Report: Date",
    "Followers: Organic",
    monthData,
    (data, value) => {
      data.organicFollowers += parseInt(value, 10) || 0;
    }
  );
  processRows(
    filteredFollowersInsightRows,
    "Report: Date",
    "Followers: Paid",
    monthData,
    (data, value) => {
      data.paidFollowers += parseInt(value, 10) || 0;
    }
  );
  processRows(
    filteredFollowersInsightRows,
    "Report: Date",
    "Total Follower Gain",
    monthData,
    (data, value) => {
      data.totalFollowerGain += parseInt(value, 10) || 0;
    }
  );

  const countryFollowerGain = calculateFollowerGain(
    filteredFollowersByCountryRows,
    "Row Updated At",
    "Dimension: Country",
    "Followers: Total"
  );
  const industryFollowerGain = calculateFollowerGain(
    filteredFollowersByIndustryRows,
    "Row Updated At",
    "Dimension: Industry",
    "Followers: Total"
  );

  // const industryViewsGain = calculateFollowerGain(
  //   filteredIndustryViewsRows,
  //   "Row Updated At",
  //   "Dimension: Industry",
  //   "Views: All page views"
  // );
  // const countryViewsGain = calculateFollowerGain(
  //   filteredCountryViewsRows,
  //   "Row Updated At",
  //   "Dimension: Country",
  //   "Views: All page views"
  // );

  const topIndustryViews = calculateTopViews(
    filteredIndustryViewsRows,
    "Dimension: Industry",
    "Views: All page views"
  );

  const topCountryViews = calculateTopViews(
    filteredCountryViewsRows,
    "Dimension: Country",
    "Views: All page views"
  );

  const totalImpressions = Object.values(monthData).reduce(
    (acc, data) => acc + data.impressions,
    0
  );
  const totalUniqueImpressions = Object.values(monthData).reduce(
    (acc, data) => acc + data.uniqueImpressions,
    0
  );
  const totalPageViews = Object.values(monthData).reduce(
    (acc, data) => acc + data.pageViews,
    0
  );
  const totalUniquePageViews = Object.values(monthData).reduce(
    (acc, data) => acc + data.uniquePageViews,
    0
  );
  const totalClicks = Object.values(monthData).reduce(
    (acc, data) => acc + data.clicks,
    0
  );
  const totalLikes = Object.values(monthData).reduce(
    (acc, data) => acc + data.likes,
    0
  );
  const totalComments = Object.values(monthData).reduce(
    (acc, data) => acc + data.comments,
    0
  );
  const totalShares = Object.values(monthData).reduce(
    (acc, data) => acc + data.shares,
    0
  );
  const totalOrganicFollowers = Object.values(monthData).reduce(
    (acc, data) => acc + data.organicFollowers,
    0
  );
  const totalPaidFollowers = Object.values(monthData).reduce(
    (acc, data) => acc + data.paidFollowers,
    0
  );
  const totalFollowerGain = Object.values(monthData).reduce(
    (acc, data) => acc + data.totalFollowerGain,
    0
  );

  // const engagementRate =
  //   totalImpressions > 0
  //     ? (totalLikes + totalComments + totalShares) / totalImpressions
  //     : 0;
  // Remove the manual calculation of engagementRate

  const engagementRate =
    Object.values(monthData).reduce(
      (acc, data) => acc + data.engagementRate,
      0
    ) / Object.keys(monthData).length;

  return {
    totalPosts: filteredTotalPostRows.length,
    totalImpressions,
    totalUniqueImpressions,
    totalPageViews,
    totalUniquePageViews,
    engagementRate,
    totalClicks,
    totalLikes,
    totalComments,
    totalShares,
    totalOrganicFollowers,
    totalPaidFollowers,
    totalFollowerGain,
    monthData: sortMonths(monthData), // Sort the monthData
    countryFollowerGain: sortMonths(countryFollowerGain), // Sort the countryFollowerGain
    industryFollowerGain: sortMonths(industryFollowerGain), // Sort the industryFollowerGain
    // industryViewsGain: sortMonths(industryViewsGain), // Sort the industryViewsGain
    // countryViewsGain: sortMonths(countryViewsGain), // Sort the countryViewsGain
    industryViewsGain: topIndustryViews,
    countryViewsGain: topCountryViews,
  };
};

module.exports = {
  LinkedinInsight,
};
