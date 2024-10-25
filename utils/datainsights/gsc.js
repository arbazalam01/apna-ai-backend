const { readGoogleSheet } = require("../google_sheet");
const GoogleSearchConsoleInsight = async (sheetId, startDate, endDate) => {
  const sheetData = await readGoogleSheet(sheetId, "GSC");
  const analytics = {
    totalUrlClicks: 0,
    totalImpressions: 0,
    clickThroughRate: 0,
    averagePosition: 0,
    monthlyData: {},
    mostPopularLandingPage: {},
    PopularQueries: {},
    CountriesWithHT: {},
  };

  const filteredData = sheetData.filter((row) => {
    const date = new Date(row.date);
    return (
      date >= new Date(startDate.getFullYear(), startDate.getMonth(), 1) &&
      date <= new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0)
    );
  });

  const landingPages = {};
  const queries = {};
  const countries = {};

  filteredData.forEach((row) => {
    const { date, clicks, impressions, ctr, position, page, query, country } =
      row;

    const month = `${new Date(date).getFullYear()}-${
      new Date(date).getMonth() + 1
    }`;
    const clickCount = parseInt(clicks);
    const impressionCount = parseInt(impressions);
    const ctrValue = parseFloat(ctr);
    const positionValue = parseFloat(position);

    // Global totals
    analytics.totalUrlClicks += clickCount;
    analytics.totalImpressions += impressionCount;
    analytics.clickThroughRate += ctrValue;
    analytics.averagePosition += positionValue;

    // Monthly data aggregation
    if (!analytics.monthlyData[month]) {
      analytics.monthlyData[month] = {
        totalUrlClicks: 0,
        totalImpressions: 0,
        clickThroughRate: 0,
        averagePosition: 0,
        count: 0,
      };
    }

    const monthly = analytics.monthlyData[month];
    monthly.totalUrlClicks += clickCount;
    monthly.totalImpressions += impressionCount;
    monthly.clickThroughRate += ctrValue;
    monthly.averagePosition += positionValue;
    monthly.count += 1;

    // Landing page aggregation
    if (!landingPages[page]) {
      landingPages[page] = {
        totalUrlClicks: 0,
        totalImpressions: 0,
        clickThroughRate: 0,
        averagePosition: 0,
        count: 0,
      };
    }

    if (!queries[query]) {
      queries[query] = {
        totalUrlClicks: 0,
        totalImpressions: 0,
        clickThroughRate: 0,
        averagePosition: 0,
        count: 0,
      };
    }

    if (!countries[country]) {
      countries[country] = {
        totalUrlClicks: 0,
        totalImpressions: 0,
        clickThroughRate: 0,
        averagePosition: 0,
        count: 0,
      };
    }

    const pageData = landingPages[page];
    pageData.totalUrlClicks += clickCount;
    pageData.totalImpressions += impressionCount;
    pageData.clickThroughRate += ctrValue;
    pageData.averagePosition += positionValue;
    pageData.count += 1;

    const queryData = queries[query];
    queryData.totalUrlClicks += clickCount;
    queryData.totalImpressions += impressionCount;
    queryData.clickThroughRate += ctrValue;
    queryData.averagePosition += positionValue;
    queryData.count += 1;

    const countryData = countries[country];
    countryData.totalUrlClicks += clickCount;
    countryData.totalImpressions += impressionCount;
    countryData.clickThroughRate += ctrValue;
    countryData.averagePosition += positionValue;
    countryData.count += 1;
  });

  // Calculate averages for overall data
  const totalCount = filteredData.length;
  analytics.clickThroughRate /= totalCount;
  analytics.averagePosition /= totalCount;

  // Calculate averages for each month
  for (const month in analytics.monthlyData) {
    const monthly = analytics.monthlyData[month];
    monthly.clickThroughRate /= monthly.count;
    monthly.averagePosition /= monthly.count;
  }

  // Calculate averages for each landing page
  for (const page in landingPages) {
    const pageData = landingPages[page];
    pageData.clickThroughRate /= pageData.count;
    pageData.averagePosition /= pageData.count;
  }

  // Calculate averages for each landing page
  for (const query in queries) {
    const queryData = queries[query];
    queryData.clickThroughRate /= queryData.count;
    queryData.averagePosition /= queryData.count;
  }

  for (const country in countries) {
    const countryData = countries[country];
    countryData.clickThroughRate /= countryData.count;
    countryData.averagePosition /= countryData.count;
  }

  const sortMonths = (data) => {
    return Object.fromEntries(
      Object.entries(data).sort(
        ([a], [b]) => new Date(`${a}-01`) - new Date(`${b}-01`)
      )
    );
  };

  analytics.monthlyData = sortMonths(analytics.monthlyData);

  // Set most popular landing pages in analytics
  analytics.mostPopularLandingPage = landingPages;
  analytics.PopularQueries = queries;
  analytics.CountriesWithHT = countries;

  return analytics;
};

module.exports = {
  GoogleSearchConsoleInsight,
};
