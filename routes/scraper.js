const express = require("express");
const axios = require("axios");
const fs = require("fs");

const router = express.Router();

const fireCrawlApiEndpoint = process.env.FIRECRAWL_API_ENDPOINT;
const fireCrawlEndpoint = process.env.FIRECRAWL_API_ENDPOINT;
const fireCrawlApiKey = process.env.FIRECRAWL_API_KEY;

// Define the grouping keywords as regex patterns
const groups = {
  about: [/\/about/, /\/overview/, /\/company/, /\/about-us/],
  products: [
    /\/product/, // This will cover both 'product' and 'products' in URLs
    /\/catalog/,
    /\/store/,
    /\/inventory/,
    /\/items/,
    /\/shop/,
    /\/accessories/,
    /\/solution/,
  ],
  leadership: [
    /\/about/,
    /\/who-we-are/,
    /\/company/,
    /\/people/,
    /\/team/,
    /\/our-team/,
  ],
  blogs: [/\/resource/, /\/blog/, /\/insight/],
  services: [
    /\/services/,
    /\/platform/,
    /\/solutions/,
    /\/resources/,
    /\/solutions/,
    /\/professional-services/,
    /\/our-services/,
    /\/portfolio/,
    /\/service-offerings/,
    /\/capabilities/,
    /\/offerings/,
  ],
  topclients: [/\/about/, /\/partners/, /\/customers/, /\/topclients/],
};

// Initialize an object to hold the combined markdown content for each group
const groupedContent = {
  about: "",
  products: "",
  leadership: "",
  blogs: "",
  services: "",
  topclients: "",
  summary: "",
};

// Function to determine the group based on URL regex patterns
function getGroup(url) {
  for (const [group, patterns] of Object.entries(groups)) {
    for (const pattern of patterns) {
      if (pattern.test(url)) {
        return group;
      }
    }
  }
  return null;
}

router.post("/firecrawlScrape", async (req, res) => {
  const reqBody = req.body;
  const fireCrawlRes = await axios.post(`${fireCrawlEndpoint}/crawl`, reqBody);
  res.json(fireCrawlRes.data);
});

router.get("/firecrawlStatus", async (req, res) => {
  const jobId = req.query.jobId;
  console.log(jobId);
  const fireCrawlRes = await axios.get(`${fireCrawlEndpoint}/crawl/${jobId}`);

  // if (fireCrawlRes.data.status === "completed") {
  //   const fireCrawlResData = fireCrawlRes.data;
  //   fireCrawlResData.data.forEach((data) => {
  //     const markdownContent = data.markdown;
  //     const sourceUrl = data.metadata.sourceURL;

  //     const group = getGroup(sourceUrl);
  //     if (group) {
  //       console.log(`Adding content to group: ${sourceUrl}`);
  //       groupedContent[group] += markdownContent + "\n";
  //     } else {
  //       console.log(`No matching group for URL: ${sourceUrl}`);
  //     }
  //   });

  //   // Write the grouped content to respective files
  //   for (const [group, content] of Object.entries(groupedContent)) {
  //     fs.writeFile(`./tmp/${group}.md`, content, (err) => {
  //       if (err) {
  //         console.error(err);
  //         return;
  //       }
  //       console.log(`File ${group}.md has been created`);
  //     });
  //   }
  // }

  res.json(fireCrawlRes.data);
});

router.post("/firecrawlScrapeV2", async (req, res) => {
  const reqBody = req.body;

  const crawlResult = await axios.post(
    `${fireCrawlApiEndpoint}/crawl`,
    reqBody
  );

  res.json(crawlResult.data);
});

router.get("/firecrawlStatusV2", async (req, res) => {
  const jobId = req.query.jobId;

  const fireCrawlRes = await axios.get(
    `${fireCrawlApiEndpoint}/crawl/${jobId}`
  );

  res.json(fireCrawlRes.data);
});

module.exports = router;
