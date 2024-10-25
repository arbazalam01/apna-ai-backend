const { readGoogleSheet } = require("../google_sheet");

const WebsiteInsight = async (sheetId, startDate, endDate) => {
  const sheetData = await readGoogleSheet(sheetId, "GA");
  const analytics = {
    totalUsers: 0,
    newUsers: 0,
    totalSessions: 0,
    engagedSessions: 0,
    averageSessionDuration: 0,
    sessionPerUser: 0,
    engagementRate: 0,
    bounceRate: 0,
    monthlyData: {},
    topSections: [],
    topCountries: [],
    countryMonthlyData: {},
    topChannels: [],
    channelMonthlyData: {},
    topSessionsByCountry: [],
    topSessionsByChannel: [],
    topTotalSessions: [],
    topSessionsPerUser: [],
  };

  const filteredData = sheetData.filter((row) => {
    const date = new Date(row["Report: Date"]);
    return (
      date >= new Date(startDate.getFullYear(), startDate.getMonth(), 1) &&
      date <= new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0)
    );
  });

  filteredData.forEach((row) => {
    const date = new Date(row["Report: Date"]);
    const month = `${date.getFullYear()}-${date.getMonth() + 1}`;

    if (!analytics.monthlyData[month]) {
      analytics.monthlyData[month] = {
        totalUsers: 0,
        newUsers: 0,
        totalSessions: 0,
        engagedSessions: 0,
        averageSessionDuration: 0,
        sessionPerUser: 0,
        engagementRate: 0,
        bounceRate: 0,
        count: 0,
      };
    }

    analytics.totalUsers += parseInt(row["Acquisition: Total users"]);
    analytics.newUsers += parseInt(row["Acquisition: New users"]);
    analytics.totalSessions += parseInt(row["Engagement: Sessions"]);
    analytics.engagedSessions += parseInt(row["Engagement: Engaged sessions"]);
    analytics.averageSessionDuration += parseFloat(
      row["Session: Average session duration"]
    );
    analytics.sessionPerUser += parseFloat(
      row["Engagement: Sessions per user"]
    );
    analytics.engagementRate += parseFloat(row["Engagement: Engagement rate"]);
    analytics.bounceRate += parseFloat(row["Performance: Bounce rate"]);

    analytics.monthlyData[month].totalUsers += parseInt(
      row["Acquisition: Total users"]
    );
    analytics.monthlyData[month].newUsers += parseInt(
      row["Acquisition: New users"]
    );
    analytics.monthlyData[month].totalSessions += parseInt(
      row["Engagement: Sessions"]
    );
    analytics.monthlyData[month].engagedSessions += parseInt(
      row["Engagement: Engaged sessions"]
    );
    analytics.monthlyData[month].averageSessionDuration += parseFloat(
      row["Session: Average session duration"]
    );
    analytics.monthlyData[month].sessionPerUser += parseFloat(
      row["Engagement: Sessions per user"]
    );
    analytics.monthlyData[month].engagementRate += parseFloat(
      row["Engagement: Engagement rate"]
    );
    analytics.monthlyData[month].bounceRate += parseFloat(
      row["Performance: Bounce rate"]
    );
    analytics.monthlyData[month].count += 1;
  });

  // Calculate averages
  const totalCount = filteredData.length;
  analytics.averageSessionDuration /= totalCount;
  analytics.sessionPerUser /= totalCount;
  analytics.engagementRate /= totalCount;
  analytics.bounceRate /= totalCount;

  for (const month in analytics.monthlyData) {
    const data = analytics.monthlyData[month];
    data.averageSessionDuration /= data.count;
    data.sessionPerUser /= data.count;
    data.engagementRate /= data.count;
    data.bounceRate /= data.count;
  }

  // Top sections by total users
  const sections = {};
  const countries = {};
  const channels = {};

  filteredData.forEach((row) => {
    const section = row["Page: Page path"];
    const country = row["Audience: Country"];
    const channel = row["First user primary channel group"];
    const date = new Date(row["Report: Date"]);
    const month = `${date.getFullYear()}-${date.getMonth() + 1}`;

    if (!sections[section]) {
      sections[section] = {
        totalUsers: 0,
        totalSessions: 0,
        sessionsPerUser: 0,
      };
    }
    sections[section].totalUsers += parseInt(row["Acquisition: Total users"]);
    sections[section].totalSessions += parseInt(row["Engagement: Sessions"]);
    sections[section].sessionsPerUser += parseFloat(
      row["Engagement: Sessions per user"]
    );

    if (!countries[country]) {
      countries[country] = {
        totalUsers: 0,
        totalSessions: 0,
        monthlyData: {},
      };
    }
    countries[country].totalUsers += parseInt(row["Acquisition: Total users"]);
    countries[country].totalSessions += parseInt(row["Engagement: Sessions"]);

    if (!countries[country].monthlyData[month]) {
      countries[country].monthlyData[month] = {
        totalUsers: 0,
        newUsers: 0,
        totalSessions: 0,
        engagedSessions: 0,
        averageSessionDuration: 0,
        sessionPerUser: 0,
        engagementRate: 0,
        bounceRate: 0,
        count: 0,
      };
    }

    countries[country].monthlyData[month].totalUsers += parseInt(
      row["Acquisition: Total users"]
    );
    countries[country].monthlyData[month].newUsers += parseInt(
      row["Acquisition: New users"]
    );
    countries[country].monthlyData[month].totalSessions += parseInt(
      row["Engagement: Sessions"]
    );
    countries[country].monthlyData[month].engagedSessions += parseInt(
      row["Engagement: Engaged sessions"]
    );
    countries[country].monthlyData[month].averageSessionDuration += parseFloat(
      row["Session: Average session duration"]
    );
    countries[country].monthlyData[month].sessionPerUser += parseFloat(
      row["Engagement: Sessions per user"]
    );
    countries[country].monthlyData[month].engagementRate += parseFloat(
      row["Engagement: Engagement rate"]
    );
    countries[country].monthlyData[month].bounceRate += parseFloat(
      row["Performance: Bounce rate"]
    );
    countries[country].monthlyData[month].count += 1;

    if (!channels[channel]) {
      channels[channel] = {
        totalUsers: 0,
        totalSessions: 0,
        monthlyData: {},
      };
    }
    channels[channel].totalUsers += parseInt(row["Acquisition: Total users"]);
    channels[channel].totalSessions += parseInt(row["Engagement: Sessions"]);

    if (!channels[channel].monthlyData[month]) {
      channels[channel].monthlyData[month] = {
        totalUsers: 0,
        newUsers: 0,
        totalSessions: 0,
        engagedSessions: 0,
        averageSessionDuration: 0,
        sessionPerUser: 0,
        engagementRate: 0,
        bounceRate: 0,
        count: 0,
      };
    }

    channels[channel].monthlyData[month].totalUsers += parseInt(
      row["Acquisition: Total users"]
    );
    channels[channel].monthlyData[month].newUsers += parseInt(
      row["Acquisition: New users"]
    );
    channels[channel].monthlyData[month].totalSessions += parseInt(
      row["Engagement: Sessions"]
    );
    channels[channel].monthlyData[month].engagedSessions += parseInt(
      row["Engagement: Engaged sessions"]
    );
    channels[channel].monthlyData[month].averageSessionDuration += parseFloat(
      row["Session: Average session duration"]
    );
    channels[channel].monthlyData[month].sessionPerUser += parseFloat(
      row["Engagement: Sessions per user"]
    );
    channels[channel].monthlyData[month].engagementRate += parseFloat(
      row["Engagement: Engagement rate"]
    );
    channels[channel].monthlyData[month].bounceRate += parseFloat(
      row["Performance: Bounce rate"]
    );
    channels[channel].monthlyData[month].count += 1;
  });

  const sortMonthlyData = (data) => {
    return Object.fromEntries(
      Object.entries(data).sort(
        ([a], [b]) => new Date(`${a}-01`) - new Date(`${b}-01`)
      )
    );
  };

  // Calculate averages for country and channel monthly data
  for (const country in countries) {
    for (const month in countries[country].monthlyData) {
      const data = countries[country].monthlyData[month];
      data.averageSessionDuration /= data.count;
      data.sessionPerUser /= data.count;
      data.engagementRate /= data.count;
      data.bounceRate /= data.count;
    }
  }

  for (const channel in channels) {
    for (const month in channels[channel].monthlyData) {
      const data = channels[channel].monthlyData[month];
      data.averageSessionDuration /= data.count;
      data.sessionPerUser /= data.count;
      data.engagementRate /= data.count;
      data.bounceRate /= data.count;
    }
  }

  analytics.monthlyData = sortMonthlyData(analytics.monthlyData);

  for (const country in countries) {
    countries[country].monthlyData = sortMonthlyData(
      countries[country].monthlyData
    );
  }

  for (const channel in channels) {
    channels[channel].monthlyData = sortMonthlyData(
      channels[channel].monthlyData
    );
  }

  analytics.topSections = Object.entries(sections)
    .sort((a, b) => b[1].totalUsers - a[1].totalUsers)
    .slice(0, 10)
    .map(([section, data]) => ({
      section,
      totalUsers: data.totalUsers,
    }));

  analytics.topCountries = Object.entries(countries)
    .sort((a, b) => b[1].totalUsers - a[1].totalUsers)
    .slice(0, 5)
    .map(([country, data]) => ({
      country,
      totalUsers: data.totalUsers,
      totalSessions: data.totalSessions,
      monthlyData: data.monthlyData,
    }));

  analytics.topChannels = Object.entries(channels)
    .sort((a, b) => b[1].totalUsers - a[1].totalUsers)
    .slice(0, 5)
    .map(([channel, data]) => ({
      channel,
      totalUsers: data.totalUsers,
      totalSessions: data.totalSessions,
      monthlyData: data.monthlyData,
    }));

  analytics.topSessionsByCountry = Object.entries(countries)
    .sort((a, b) => b[1].totalSessions - a[1].totalSessions)
    .slice(0, 5)
    .map(([country, data]) => ({
      country,
      totalSessions: data.totalSessions,
      monthlyData: data.monthlyData,
    }));

  analytics.topSessionsByChannel = Object.entries(channels)
    .sort((a, b) => b[1].totalSessions - a[1].totalSessions)
    .slice(0, 5)
    .map(([channel, data]) => ({
      channel,
      totalSessions: data.totalSessions,
      monthlyData: data.monthlyData,
    }));

  // Top 10 most total sessions
  analytics.topTotalSessions = Object.entries(sections)
    .sort((a, b) => b[1].totalSessions - a[1].totalSessions)
    .slice(0, 10)
    .map(([section, data]) => ({
      section,
      totalSessions: data.totalSessions,
    }));

  // Top 10 most sessions per user
  analytics.topSessionsPerUser = Object.entries(sections)
    .sort((a, b) => b[1].sessionsPerUser - a[1].sessionsPerUser)
    .slice(0, 10)
    .map(([section, data]) => ({
      section,
      sessionsPerUser: data.sessionsPerUser,
    }));

  return analytics;
};

module.exports = {
  WebsiteInsight,
};
