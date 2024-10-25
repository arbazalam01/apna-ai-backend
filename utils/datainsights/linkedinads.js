const { readGoogleSheet } = require("../google_sheet");

const LinkedinAdsInsights = async (sheetId, startDate, endDate) => {
  const sheetData = await readGoogleSheet(sheetId, "Linkedin ads");
  const sheetDataByCountry = await readGoogleSheet(
    sheetId,
    "Linkedin ads- performance by country"
  );
  const sheetDataByIndustry = await readGoogleSheet(
    sheetId,
    "Linkedin ads- performance by industry"
  );
  const sheetDataByJobTitle = await readGoogleSheet(
    sheetId,
    "Linkedin ads- performance by job title"
  );

  // Initialize analytics object
  let analytics = {
    totalAmountSpent: 0,
    totalReach: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalLandingPageClicks: 0,
    totalCompanyPageClicks: 0,
    totalEngagements: 0,
    totalCTR: 0,
    totalEngagementRate: 0,
    frequency: 0,
    cpm: 0,
    cpc: 0,
    totalReactions: 0,
    totalComments: 0,
    totalShares: 0,
    totalConversions: 0,
    totalPostClickConversions: 0,
    totalPostViewConversions: 0,
    monthlyData: {},
    dataByIndustry: {},
    dataByCountry: {},
    dataByJobTitle: {},
    campaignData: {}, // New field for campaign-specific data
  };

  let ctrSum = 0;
  let cpmSum = 0;
  let cpcSum = 0;
  let engagementRateSum = 0;
  let ctrCount = 0;
  let cpmCount = 0;
  let cpcCount = 0;
  let engagementRateCount = 0;

  const filteredData = sheetData.filter((row) => {
    const date = new Date(row["Report: Date"]);
    return (
      date >= new Date(startDate.getFullYear(), startDate.getMonth(), 1) &&
      date <= new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0)
    );
  });

  // Loop through the sheet data and calculate metrics
  filteredData.forEach((row) => {
    const date = new Date(row["Report: Date"]);
    const month = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const campaignName = row["Campaign: Campaign name"]; // Extract campaign name

    if (!analytics.monthlyData[month]) {
      analytics.monthlyData[month] = {
        amountSpent: 0,
        reach: 0,
        impressions: 0,
        clicks: 0,
        ctrSum: 0,
        cpmSum: 0,
        cpcSum: 0,
        ctrCount: 0,
        cpmCount: 0,
        cpcCount: 0,
        engagementRateSum: 0,
        engagementRateCount: 0,
        totalReactions: 0,
        totalComments: 0,
        totalShares: 0,
        totalConversions: 0,
        totalPostClickConversions: 0,
        totalPostViewConversions: 0,
      };
    }

    if (!analytics.campaignData[campaignName]) {
      analytics.campaignData[campaignName] = {
        amountSpent: 0,
        impressions: 0,
        leadFormOpens: 0,
        leads: 0,
        costPerLead: 0,
        leadFormOpenRate: 0,
        leadFormCompletionRate: 0,
      };
    }

    // Aggregate total metrics
    analytics.totalAmountSpent += parseFloat(row["Cost: Amount spend"]) || 0;
    analytics.totalReach += parseInt(row["Performance: Reach"]) || 0;
    analytics.totalImpressions +=
      parseInt(row["Performance: Impressions"]) || 0;
    analytics.totalClicks += parseInt(row["Performance: Clicks"]) || 0;
    analytics.totalLandingPageClicks +=
      parseInt(row["Clicks: Landing page clicks"]) || 0; // Replace if you have specific column
    analytics.totalCompanyPageClicks +=
      parseInt(row["Clicks: Company page clicks"]) || 0; // Replace if you have specific column
    analytics.totalEngagements += parseInt(row["Performance: Engagements"]) || 0; // Replace if you have specific column
    analytics.totalReactions += parseInt(row["Engagement: Reactions"]) || 0; // New field for Reactions
    analytics.totalComments += parseInt(row["Engagement: Comments"]) || 0; // New field for Comments
    analytics.totalShares += parseInt(row["Engagement: Shares"]) || 0; // New field for Shares

    // Aggregate campaign-specific metrics
    analytics.campaignData[campaignName].amountSpent +=
      parseFloat(row["Cost: Amount spend"]) || 0;
    analytics.campaignData[campaignName].impressions +=
      parseInt(row["Performance: Impressions"]) || 0;
    analytics.campaignData[campaignName].leadFormOpens +=
      parseInt(row["Engagement: One click lead form opens"]) || 0;
    analytics.campaignData[campaignName].leads +=
      parseInt(row["Performance: One click leads"]) || 0;

    // Calculate CTR
    if (row["CTR"]) {
      const ctr = parseFloat(row["CTR"]);
      ctrSum += ctr;
      ctrCount++;
      analytics.monthlyData[month].ctrSum += ctr;
      analytics.monthlyData[month].ctrCount++;
    }

    // Calculate CPM
    if (row["CPM"]) {
      const cpm = parseFloat(row["CPM"]);
      cpmSum += cpm;
      cpmCount++;
      analytics.monthlyData[month].cpmSum += cpm;
      analytics.monthlyData[month].cpmCount++;
    }

    // Calculate CPC
    if (row["CPC"]) {
      const cpc = parseFloat(row["CPC"]);
      cpcSum += cpc;
      cpcCount++;
      analytics.monthlyData[month].cpcSum += cpc;
      analytics.monthlyData[month].cpcCount++;
    }

    // Calculate Engagement Rate
    if (row["Engagement Rate"]) {
      const engagementRate = parseFloat(row["Engagement Rate"]);
      engagementRateSum += engagementRate;
      engagementRateCount++;
      analytics.monthlyData[month].engagementRateSum += engagementRate;
      analytics.monthlyData[month].engagementRateCount++;
    }

    // Update monthly totals for new fields
    analytics.monthlyData[month].totalReactions +=
      parseInt(row["Engagement: Reactions"]) || 0;
    analytics.monthlyData[month].totalComments +=
      parseInt(row["Engagement: Comments"]) || 0;
    analytics.monthlyData[month].totalShares +=
      parseInt(row["Engagement: Shares"]) || 0;
    analytics.monthlyData[month].totalConversions +=
      parseInt(row["Performance: Conversions"]) || 0;
    analytics.monthlyData[month].totalPostClickConversions +=
      parseInt(row["Post Click Conversions"]) || 0;
    analytics.monthlyData[month].totalPostViewConversions +=
      parseInt(row["Post View Conversions"]) || 0;
    analytics.monthlyData[month].amountSpent +=
      parseFloat(row["Cost: Amount spend"]) || 0;
    analytics.monthlyData[month].reach +=
      parseInt(row["Performance: Reach"]) || 0;
    analytics.monthlyData[month].impressions +=
      parseInt(row["Performance: Impressions"]) || 0;
    analytics.monthlyData[month].clicks +=
      parseInt(row["Performance: Clicks"]) || 0;
  });

  // Calculate total CTR, CPM, CPC averages
  analytics.totalCTR = ctrCount ? ctrSum / ctrCount : 0;
  analytics.cpm = cpmCount ? cpmSum / cpmCount : 0;
  analytics.cpc = cpcCount ? cpcSum / cpcCount : 0;
  analytics.totalEngagementRate = engagementRateCount
    ? engagementRateSum / engagementRateCount
    : 0;

  // Calculate monthly averages and MoM for new fields
  for (let month in analytics.monthlyData) {
    const monthData = analytics.monthlyData[month];

    // Average CTR for the month
    monthData.ctr = monthData.ctrCount
      ? monthData.ctrSum / monthData.ctrCount
      : 0;

    // Average CPM for the month
    monthData.cpm = monthData.cpmCount
      ? monthData.cpmSum / monthData.cpmCount
      : 0;

    // Average CPC for the month
    monthData.cpc = monthData.cpcCount
      ? monthData.cpcSum / monthData.cpcCount
      : 0;

    // Average Engagement Rate for the month
    monthData.engagementRate = monthData.engagementRateCount
      ? monthData.engagementRateSum / monthData.engagementRateCount
      : 0;

    // Month-over-month data for Reactions, Comments, Shares
    monthData.reactions = monthData.totalReactions; // Placeholder logic for MoM
    monthData.comments = monthData.totalComments; // Placeholder logic for MoM
    monthData.shares = monthData.totalShares; // Placeholder logic for MoM
    monthData.conversionsMOM = monthData.totalConversions; // Placeholder logic for MoM
    monthData.postClickConversionsMOM = monthData.totalPostClickConversions; // MoM placeholder for Post Click Conversions
    monthData.postViewConversionsMOM = monthData.totalPostViewConversions; // MoM placeholder for Post View Conversions
  }
  // Calculate campaign-specific metrics
  for (let campaign in analytics.campaignData) {
    const campaignData = analytics.campaignData[campaign];
    campaignData.costPerLead = campaignData.leads
      ? campaignData.amountSpent / campaignData.leads
      : 0;
    campaignData.leadFormOpenRate = campaignData.impressions
      ? (campaignData.leadFormOpens / campaignData.impressions) * 100
      : 0;
    campaignData.leadFormCompletionRate = campaignData.leadFormOpens
      ? (campaignData.leads / campaignData.leadFormOpens) * 100
      : 0;
  }

  sheetDataByIndustry.forEach((row) => {
    const industry = row["Audience: Industry"]; // Assuming the column name for industry is "Industry"

    // Initialize data for each industry if not already present
    if (!analytics.dataByIndustry[industry]) {
      analytics.dataByIndustry[industry] = {
        totalImpressions: 0,
        totalClicks: 0,
        ctrSum: 0,
        ctrCount: 0,
      };
    }

    // Aggregate Impressions and Clicks
    analytics.dataByIndustry[industry].totalImpressions +=
      parseInt(row["Performance: Impressions"]) || 0;
    analytics.dataByIndustry[industry].totalClicks +=
      parseInt(row["Performance: Clicks"]) || 0;

    // Calculate and aggregate CTR
    if (row["CTR"]) {
      const ctr = parseFloat(row["CTR"]);
      analytics.dataByIndustry[industry].ctrSum += ctr;
      analytics.dataByIndustry[industry].ctrCount++;
    }
  });

  // Calculate average CTR for each industry
  Object.keys(analytics.dataByIndustry).forEach((industry) => {
    const data = analytics.dataByIndustry[industry];
    data.averageCTR = data.ctrCount ? data.ctrSum / data.ctrCount : 0;
  });

  sheetDataByCountry.forEach((row) => {
    const country = row["Audience: Country"]; // Assuming the column name for industry is "Industry"

    // Initialize data for each industry if not already present
    if (!analytics.dataByCountry[country]) {
      analytics.dataByCountry[country] = {
        totalImpressions: 0,
        totalClicks: 0,
        ctrSum: 0,
        ctrCount: 0,
      };
    }

    // Aggregate Impressions and Clicks
    analytics.dataByCountry[country].totalImpressions +=
      parseInt(row["Performance: Impressions"]) || 0;
    analytics.dataByCountry[country].totalClicks +=
      parseInt(row["Performance: Clicks"]) || 0;

    // Calculate and aggregate CTR
    if (row["CTR"]) {
      const ctr = parseFloat(row["CTR"]);
      analytics.dataByCountry[country].ctrSum += ctr;
      analytics.dataByCountry[country].ctrCount++;
    }
  });

  // Calculate average CTR for each industry
  Object.keys(analytics.dataByCountry).forEach((country) => {
    const data = analytics.dataByCountry[country];
    data.averageCTR = data.ctrCount ? data.ctrSum / data.ctrCount : 0;
  });

  sheetDataByJobTitle.forEach((row) => {
    const job = row["Audience: Job title"]; // Assuming the column name for industry is "Industry"

    // Initialize data for each industry if not already present
    if (!analytics.dataByJobTitle[job]) {
      analytics.dataByJobTitle[job] = {
        totalImpressions: 0,
        totalClicks: 0,
        ctrSum: 0,
        ctrCount: 0,
      };
    }

    // Aggregate Impressions and Clicks
    analytics.dataByJobTitle[job].totalImpressions +=
      parseInt(row["Performance: Impressions"]) || 0;
    analytics.dataByJobTitle[job].totalClicks +=
      parseInt(row["Performance: Clicks"]) || 0;

    // Calculate and aggregate CTR
    if (row["CTR"]) {
      const ctr = parseFloat(row["CTR"]);
      analytics.dataByJobTitle[job].ctrSum += ctr;
      analytics.dataByJobTitle[job].ctrCount++;
    }
  });

  // Calculate average CTR for each industry
  Object.keys(analytics.dataByJobTitle).forEach((job) => {
    const data = analytics.dataByJobTitle[job];
    data.averageCTR = data.ctrCount ? data.ctrSum / data.ctrCount : 0;
  });

  const sortMonths = (data) => {
    return Object.fromEntries(
      Object.entries(data).sort(
        ([a], [b]) => new Date(`${a}-01`) - new Date(`${b}-01`)
      )
    );
  };

  analytics.monthlyData = sortMonths(analytics.monthlyData);

  return analytics;
};

module.exports = {
  LinkedinAdsInsights,
};
