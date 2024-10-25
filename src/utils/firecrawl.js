import axios from "axios";

const SELF_HOSTED_API = process.env.FIRECRAWL_HOSTED_API;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_API = process.env.FIRECRAWL_API;

const startCrawler = async (url, crawlerType = "hosted") => {
  const CRAWLER_API_ENDPOINT =
    crawlerType === "hosted" ? SELF_HOSTED_API : FIRECRAWL_API;

  const requestBody = {
    url,
    excludePaths: urlsToExclude,
    includePaths: urlsToInclude,
    maxDepth: 3,
    limit: 100,
    scrapeOptions: {
      waitFor: 5000,
      excludeTags: ["link", "a", "img"],
    },
  };

  const requestOptions = {
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
    },
  };

  try {
    const response = await axios.post(
      `${CRAWLER_API_ENDPOINT}/crawl`,
      requestBody,
      requestOptions
    );
    return response.data.id;
  } catch (error) {
    console.error("Error starting crawler", error);
    throw error;
  }
};

const checkCrawlerStatus = async (jobId, crawlerType = "hosted") => {
  const CRAWLER_API_ENDPOINT =
    crawlerType === "hosted" ? SELF_HOSTED_API : FIRECRAWL_API;

  const requestOptions = {
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
    },
  };

  try {
    const response = await axios.get(
      `${CRAWLER_API_ENDPOINT}/crawl/${jobId}`,
      requestOptions
    );
    return response.data;
  } catch (error) {
    console.error("Error checking crawler status", error);
    throw error;
  }
};
