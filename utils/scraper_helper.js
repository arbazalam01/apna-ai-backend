const axios = require("axios");
const { Firecrawl } = require("firecrawl");
const { saveFileContent } = require("./aws_helper");
const urlsToExclude = require("./urls_to_exclude");
const urlsToInclude = require("./urls_to_include");
const Relation = require("../models/Relation");
const { backOff } = require("exponential-backoff");
const FormData = require("form-data");

const SCRAPER_API = process.env.FAST_API;
const KNOWLEDGE_BASE_API = process.env.KNOWLEDGE_BASE_API;

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

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
    return await firecrawl.scrape(url, {
      waitFor: 5000,
      excludeTags: ["link", "a", "img"],
    });
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

// Crawls the site (plus its homepage) and uploads the grouped markdown to S3
const crawlCompany = async (url, companyId) => {
  const job = await firecrawl.crawl(url, {
    excludePaths: urlsToExclude,
    includePaths: urlsToInclude,
    maxDiscoveryDepth: 3,
    limit: 100,
    scrapeOptions: {
      waitFor: 5000,
      excludeTags: ["link", "a", "img"],
    },
  });
  console.log(`Firecrawl crawl ${job.id}: ${job.status}`);
  if (job.status !== "completed") {
    throw new Error("Scraping failed or job not found");
  }

  const homePageData = await scrapeHomepage(url);
  if (homePageData) job.data.push(homePageData);

  await uploadScrapedData(job, companyId);
};

const waitForBlogScrapingCompletion = async (job, companyId) => {
  if (job.status === "completed") {
    await uploadBlogScrapedData(job, companyId);
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
    await crawlCompany(url, companyId);
    console.log("Scraping completed successfully!", companyId);

    const { runAllPromptHelper } = require("./company_helper");
    await runAllPromptHelper(companyId);
    console.log("GPT prompts run successfully!");
  } catch (error) {
    console.error("Error in scraping workflow:", error);
  }
};

const handleBlogScrapingWorkflow = async (url, companyId) => {
  try {
    console.log("Blog Scraping Started !!!!");
    const blogJob = await blogScraper(url);
    console.log(`Blog crawl ${blogJob.id}: ${blogJob.status}`);
    await waitForBlogScrapingCompletion(blogJob, companyId);
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

  return firecrawl.crawl(url, {
    includePaths: urls_to_include,
    excludePaths: urls_to_exclude,
    maxDiscoveryDepth: 4,
    limit: 15,
    scrapeOptions: {
      onlyMainContent: true,
      waitFor: 5000,
    },
  });
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
