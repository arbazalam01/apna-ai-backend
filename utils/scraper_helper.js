const axios = require("axios");
const { saveFileContent, isScrapingCompleted } = require("./aws_helper");
const urlsToExclude = require("./urls_to_exclude");
const urlsToInclude = require("./urls_to_include");
const Relation = require("../models/Relation");
const { backOff } = require("exponential-backoff");
const AWS = require("aws-sdk");
const FormData = require("form-data");

const SCRAPER_API = process.env.FAST_API;
const fireCrawlApiEndpoint = process.env.FIRECRAWL_API_ENDPOINT;
const fireCrawlApiKey = process.env.FIRECRAWL_API_KEY;
const KNOWLEDGE_BASE_API = process.env.KNOWLEDGE_BASE_API;
const fireCrawlDeployedApiEndpoint =
  process.env.FIRECRAWL_DEPLOYED_API_ENDPOINT;
// Configure AWS SDK with your credentials and region
AWS.config.update({
  accessKeyId: process.env.ACCESSKEY,
  secretAccessKey: process.env.SECRETKEY,
  region: process.env.REGION,
});

const s3 = new AWS.S3();

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
    /\/leadership/,
    /\/management/,
    /\/executive/,
  ],

  services: [
    /\/services/,
    /\/platform/,
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

const scrapeHomepage = async (url) => {
  try {
    console.log(`Scraping homepage for ${url} !!!!`);
    const reqBody = {
      url,
      waitFor: 5000,
    };
    const reqOptions = {
      headers: {
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      },
    };
    const fireCrawlRes = await axios.post(
      `${fireCrawlApiEndpoint}/scrape`,
      reqBody,
      reqOptions
    );

    const { data } = fireCrawlRes;

    // console.log("Homepage data:", data);

    return data.data;
  } catch (error) {
    console.error("Error in scraping workflow:", error);
  }
};

const scrapeCompany = (companyId, companyUrl) => {
  axios.get(`${SCRAPER_API}/scrape?companyId=${companyId}&url=${companyUrl}`);
  return;
};

const startScraping = async (url, companyId) => {
  const response = await await axios.get(`${SCRAPER_API}/scrape`, {
    params: { companyId, url },
  });
  return response.data.job_id;
};

const startScrapingV2 = async (url, firecrawlType = "hosted") => {
  const FIRECRAWL_API_ENDPOINT =
    firecrawlType === "hosted"
      ? fireCrawlApiEndpoint
      : fireCrawlDeployedApiEndpoint;

  const reqBody = {
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

  const reqOptions = {
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
    },
  };

  const response = await axios.post(
    `${FIRECRAWL_API_ENDPOINT}/crawl`,
    reqBody,
    reqOptions
  );
  console.log("Firecrawl response", response.data.id);
  return response.data.id;
};

const checkJobStatusV2 = async (
  jobId,
  companyId,
  firecrawlType = "hosted",
  type = null,
  url = null
) => {
  const FIRECRAWL_API_ENDPOINT =
    firecrawlType === "hosted"
      ? fireCrawlApiEndpoint
      : fireCrawlDeployedApiEndpoint;

  const reqOptions = {
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
    },
  };
  let response = await axios.get(
    `${FIRECRAWL_API_ENDPOINT}/crawl/${jobId}`,
    reqOptions
  );

  if (url != null) {
    const homePageData = await scrapeHomepage(url);
    // console.log("Other data --->", response.data.data[0]);
    response.data.data.push(homePageData);
  }

  if (response.data.status === "completed") {
    if (type == "blogs") {
      await uploadBlogScrapedData(response.data, companyId);
    } else {
      await uploadScrapedData(response.data, companyId);
    }
  }
  return response.data.status;
};

const waitForScrapingCompletionV2 = async (jobId, companyId, url) => {
  let status = "scraping";
  while (status === "scraping") {
    console.log(`Waiting for scraping to complete for ${companyId}...`);
    await new Promise((resolve) => setTimeout(resolve, 5000)); // wait for 5 seconds
    status = await checkJobStatusV2(jobId, companyId, "hosted", null, url);
  }
  if (status === "completed") {
    // check if data is present or not
    const scrapingDone = await isScrapingCompleted(companyId);
    if (!scrapingDone) {
      // re-run via deployed API
      console.log("Re-running via deployed API... for", companyId);
      const newJobId = await startScrapingV2(url, "deployed");

      // check for status

      let newStatus = "scraping";

      while (newStatus === "scraping") {
        console.log("Waiting for scraping to complete...");
        await new Promise((resolve) => setTimeout(resolve, 1000)); // wait for 10 seconds
        newStatus = await checkJobStatusV2(
          newJobId,
          companyId,
          "deployed",
          null,
          url
        );
      }
    }
    console.log("Scraping completed successfully!", companyId);
    const { runAllPromptHelper } = require("./company_helper");
    await runAllPromptHelper(companyId);
    return;
  } else {
    throw new Error("Scraping failed or job not found");
  }
};

const waitForBlogScrapingCompletion = async (jobId, companyId) => {
  let status = "scraping";
  while (status === "scraping") {
    console.log("Waiting for blog scraping to complete...");
    await new Promise((resolve) => setTimeout(resolve, 5000)); // wait for 5 seconds
    status = await checkJobStatusV2(jobId, companyId, "hosted", "blogs", null);
  }
  if (status === "completed") {
    const MAX_POLLING_TIME = 2 * 60 * 1000; // 4 minutes in milliseconds
    const POLLING_INTERVAL = 5000; // 5 seconds
    const pollingStartTime = Date.now();
    while (true) {
      const {
        fetchCompanyData,
        runASinglePrompt,
      } = require("./company_helper");
      const companyData = await fetchCompanyData(companyId);

      if (companyData.assistantId) {
        console.log("AssistantId found. Processing Blog prompt...");
        try {
          await runASinglePrompt(companyId, "blogs", companyData.assistantId);
          return;
        } catch (error) {
          console.error("Error in runASinglePrompt for blog:", error);
          throw error;
        }
      } else {
        console.log("AssistantId not found for blog. Polling...");

        if (Date.now() - pollingStartTime > MAX_POLLING_TIME) {
          throw new Error("Timed out waiting for assistantId");
        }

        await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
      }
    }
  } else {
    throw new Error("Scraping failed or job not found");
  }
};

const handleScrapingWorkflow = async (url, companyId) => {
  try {
    console.log(`Scraping Started  for ${url} !!!!`);
    const jobId = await startScrapingV2(url);
    console.log("Scraping job started with jobId:", jobId);
    await waitForScrapingCompletionV2(jobId, companyId, url);

    console.log("GPT prompts run successfully!");
  } catch (error) {
    console.error("Error in scraping workflow:", error);
  }
};

const handleBlogScrapingWorkflow = async (url, companyId) => {
  try {
    console.log("Blog Scraping Started !!!!");
    const blogJobId = await blogScraper(url);
    console.log("Blog scraping job started with jobId:", blogJobId);
    await waitForBlogScrapingCompletion(blogJobId, companyId);
    console.log("Blog GPT prompts run successfully!");
  } catch (error) {
    console.error("Error in blog scraping workflow:", error);
  }
};

const uploadScrapedData = async (scrapedData, companyId) => {
  const groupedContent = {
    about: "",
    products: "",
    leadership: "",
    services: "",
    topclients: "",
  };
  let combinedMarkdown = "";
  let homepageContent = "";

  // Function to check if a URL is likely a homepage
  const isHomePage = (url) => {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.pathname === "/" ||
      parsedUrl.pathname === "" ||
      parsedUrl.pathname.endsWith("/index.html") ||
      parsedUrl.pathname.endsWith("/index.php")
    );
  };

  for (const data of scrapedData.data) {
    const {
      markdown,
      metadata: { sourceURL },
    } = data;

    if (isHomePage(sourceURL)) {
      console.log(`Adding homepage content for URL: ${sourceURL}`);
      homepageContent += markdown + "\n\n";
    } else {
      const matchingGroups = Object.entries(groups)
        .filter(([_, patterns]) =>
          patterns.some((pattern) => pattern.test(sourceURL))
        )
        .map(([group]) => group);

      if (matchingGroups.length > 0) {
        console.log(
          `Adding content to groups: ${matchingGroups.join(
            ", "
          )} for URL: ${sourceURL}`
        );
        matchingGroups.forEach((group) => {
          groupedContent[group] += markdown + "\n\n";
        });
      } else {
        console.log(`No matching group found for URL: ${sourceURL}`);
      }

      combinedMarkdown += markdown + "\n\n";
    }
  }

  if (homepageContent) {
    combinedMarkdown = `# Homepage\n\n${homepageContent}\n${combinedMarkdown}`;
  }

  const savePromises = Object.entries(groupedContent).map(([group, content]) =>
    saveFileContent(companyId, `${group}.md`, content.trim())
  );

  savePromises.push(
    saveFileContent(companyId, `combined.md`, combinedMarkdown.trim())
  );

  // Convert s3.getObject to a promise
  // const data = await s3
  //   .getObject({
  //     Bucket: process.env.BUCKETNAME,
  //     Key: `${companyId}/combined.md`,
  //   })
  //   .promise();
  await Promise.all(savePromises);

  const formData = new FormData();
  formData.append("file", combinedMarkdown.trim(), "combined.md"); // Use Buffer and filename
  formData.append("company_id", companyId.toString());

  await axios.post(`${KNOWLEDGE_BASE_API}/create-embeddings`, formData, {
    headers: formData.getHeaders(), // Pass correct headers for multipart/form-data
  });

  console.log(`Upload completed for company ${companyId}`);
};

const uploadBlogScrapedData = async (scrapedData, companyId) => {
  const blogsPattern = [/\/resource/, /\/blog/, /\/insight/];
  let blogsMarkdown = "";

  for (const data of scrapedData.data) {
    const {
      markdown,
      metadata: { sourceURL },
    } = data;

    if (blogsPattern.some((pattern) => pattern.test(sourceURL))) {
      console.log(`Adding blog content from: ${sourceURL}`);
      blogsMarkdown += markdown + "\n\n";
    } else {
      console.log(`Skipping non-blog content from: ${sourceURL}`);
    }
  }

  // Save the combined markdown content to a single file
  try {
    const filePath = await saveFileContent(
      companyId,
      "blogs.md",
      blogsMarkdown.trim()
    );
    console.log(`Blog content saved successfully to ${filePath}`);
  } catch (error) {
    console.error(`Error saving blog content for company ${companyId}:`, error);
    throw error;
  }
};

const blogScraper = async (url) => {
  const blogUrls = [
    "blog",
    "blogs",
    "resource",
    "resources",
    "insight",
    "insights",
  ];

  // exclude all urls except blogUrls
  const allUrlsToExclude = urlsToExclude.filter(
    (url) => !blogUrls.includes(url)
  );

  const urls_to_include = blogUrls.map((url) => `/${url}/*`);
  const urls_to_exclude = allUrlsToExclude.map((url) => `/${url}/*`);

  const reqBody = {
    url,
    includePaths: urls_to_include,
    excludePaths: urls_to_exclude,
    maxDepth: 4,
    limit: 15,
    scrapeOptions: {
      onlyMainContent: true,
      waitFor: 5000,
    },
  };

  const response = await axios.post(`${fireCrawlApiEndpoint}/crawl`, reqBody);
  return response.data.id;
};

const scrapeAllCompanies = async (companyId) => {
  try {
    const allCompanies = await Relation.find({ companyId })
      .populate("companyId", "websiteUrl")
      .populate("competitorsId", "websiteUrl");

    // set isReportStatus to 1
    await Relation.findOneAndUpdate(
      { companyId: companyId },
      { $set: { isReportDone: 1 } }
    );

    let CompanyIds = [];

    CompanyIds.push({
      id: allCompanies[0].companyId._id,
      weburl: allCompanies[0].companyId.websiteUrl,
    });
    allCompanies[0].competitorsId.forEach((val) => {
      if (val.websiteUrl.length != 0) {
        CompanyIds.push({ id: val._id, weburl: val.websiteUrl });
      }
    });

    const scrapingPromises = CompanyIds.map(async (company) => {
      try {
        // Run both workflows concurrently for each company
        await Promise.all([
          handleScrapingWorkflow(company.weburl, company.id),
          // handleBlogScrapingWorkflow(company.weburl, company.id),
        ]);
        console.log(`Scraping completed for company ${company.id}`);
      } catch (error) {
        console.error(`Error scraping company ${company.id}:`, error);
        // Optionally, you might want to throw the error again if you want to fail the entire process
        // throw error;
      }
    });

    await Promise.all(scrapingPromises);

    // await handleScrapingWorkflow(companyData.websiteUrl, companyId);

    // update Relation model with isScrapingDone = true
    await Relation.findOneAndUpdate(
      { companyId: companyId },
      { $set: { isReportDone: 2 } }
    );
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  scrapeCompany,
  handleScrapingWorkflow,

  handleBlogScrapingWorkflow,
  scrapeAllCompanies,
};
