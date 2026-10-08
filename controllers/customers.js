const Company = require("../models/Company");
const Relation = require("../models/Relation");
const User = require("../models/User");
const Prompt = require("../models/Prompt");
const { Upload } = require("@aws-sdk/lib-storage");
const fs = require("fs");
const Sections = require("../utils/prompt");
const SectionsWithoutAssistance = require("../utils/promptwithoutassist");
const checkConfig = require("../utils/config");
const axios = require("axios");
const { parseCSV, parseExcel } = require("../utils/csv_parser");
const {
  generateText,
  generateJSON,
  createThreadAndRunonKnowledgeBase,
  indexFile,
  deleteDocument,
} = require("../utils/openai_helper");
const {
  addCompany,
  addRelation,
  isReportDone,
  runAllPromptHelper,
  runASinglePrompt,
} = require("../utils/company_helper");
const { scrapeAllCompanies } = require("../utils/scraper_helper");
const { getAllPrompts } = require("../lib/function_calling");
const { startPolling } = require("../utils/polling_service");
const Prospect = require("../models/Prospect");
const { fetchFileFromS3, s3 } = require("../utils/aws_helper");

const addCustomer = async (req, res) => {
  try {
    const { company, competitors, userpersona } = req.body;

    const companyData = {
      ...company,
      isPrimaryCompany: true,
      about: {
        linkedin: {
          handle: company.linkedinUrl,
        },
      },
    };

    const { _id: companyId } = await addCompany(companyData);

    const addCompetitorsPromise = competitors.map(async (competitor) => {
      const competitorData = {
        ...competitor,
        about: {
          linkedin: {
            handle: competitor.linkedinUrl,
          },
        },
      };
      const { _id } = await addCompany(competitorData);
      return _id;
    });

    const competitorsId = await Promise.all(addCompetitorsPromise);

    await addRelation({ companyId, competitorsId });

    await User.findByIdAndUpdate(req.user._id, {
      firstTimeLogin: false,
      companyId: companyId,
    });

    res.status(200).json({ message: companyId });

    await scrapeAllCompanies(companyId);
  } catch (err) {
    res.json({ message: err.message });
  }
};

const addAssets = async (req, res) => {
  try {
    const { companyId } = req.params;
    const rerunPrompts = req.query.rerun;

    const uploadPromises = req.files.map(async (file) => {
      try {
        const data = await s3.getObject({
          Bucket: process.env.BUCKETNAME,
          Key: file.key,
        });

        await indexFile(
          companyId,
          file.key,
          Buffer.from(await data.Body.transformToByteArray()),
          file.originalname
        );

        return file.location; // Return the S3 location
      } catch (err) {
        console.error("Error processing file:", err);
        throw new Error("Error adding file to the knowledge base");
      }
    });

    const assets = await Promise.all(uploadPromises);

    res.json({ message: "Assets added successfully", assets });
  } catch (dbErr) {
    console.error("Database Error:", dbErr);
    res.status(500).json({ message: dbErr.message });
  }
};

const deleteAsset = async (req, res) => {
  try {
    const { fileId } = req.params;
    await deleteDocument(fileId);

    res.status(200).json({ message: "Asset deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getAllCustomers = async (req, res) => {
  try {
    // only get all the companies not competitors from Relation model
    const relations = await Relation.find().populate(
      "companyId",
      "name isScrapingDone updatedAt createdAt"
    );

    const allCompanies = await Promise.all(
      relations.map(async (relation) => {
        const reportStatus = await isReportDone(relation.companyId._id);
        return {
          companyName: relation.companyId.name,
          companyId: relation.companyId._id,
          isScrapingDone: relation.companyId.isScrapingDone,
          createdAt: relation.companyId.createdAt,
          updatedAt: relation.companyId.updatedAt,
          reportStatus,
        };
      })
    );

    res.json(allCompanies);
  } catch (err) {
    res.json({ message: err.message });
  }
};

const getCompetitors = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { type } = req.query;

    let query = { companyId };

    if (type === "competitor") {
      query = { competitorsId: companyId };
    } else if (type === "industryLeader") {
      query = { industryLeaderId: companyId };
    }

    // Fetch companies from the database
    let allCompanies = await Relation.find(query)
      .populate("companyId", "name websiteUrl industries about")
      .populate("competitorsId", "name websiteUrl industries about")
      .populate("industryLeaderId", "name websiteUrl industries about");

    res.json({ data: allCompanies });
  } catch (err) {
    res.json({ message: err.message });
  }
};

const updateCompetitors = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { company, competitors, userpersona } = req.body;
    let query = { companyId };
    const allCompanies = await Relation.find(query)
      .populate("companyId", "name websiteUrl")
      .populate("competitorsId", "name websiteUrl")
      .populate("industryLeaderId", "name websiteUrl");

    if (company.websiteUrl) {
      await Company.findByIdAndUpdate(allCompanies[0].companyId._id, {
        name: company.name,
        websiteUrl: company.websiteUrl,
      });
    }
    let data = [];
    competitors.forEach(async (val) => {
      if (val._id) {
        const result = await Company.findByIdAndUpdate(val._id, {
          websiteUrl: val.websiteUrl,
          name: val.name,
        });
        data.push(val._id);
      } else {
        const newCompetitor = new Company({
          websiteUrl: val.websiteUrl,
          name: val.name,
        });

        const { _id } = await newCompetitor.save();

        const newRelation = await Relation.findOneAndUpdate(
          { companyId: allCompanies[0].companyId._id },
          { $set: { competitorsId: [...data, _id] } }
        );
      }
    });

    const sectionInfo = SectionsWithoutAssistance.find(
      (info) => info.section === "userpersona"
    );
    const updatePromises = userpersona.map(async (item) => {
      let prompt = sectionInfo.Prompt.replace("$name", item.userinfo.name)
        .replace("$age", item.userinfo.age)
        .replace("$jobdescription", item.userinfo.jobdescription)
        .replace("$industry", item.userinfo.industry)
        .replace("$yearofexperience", item.userinfo.yearofexperience)
        .replace("$location", item.userinfo.location);

      try {
        item.gptoutput = await generateJSON(
          `${prompt}\nDo not include any explanations, only provide JSON response following this format without deviation.:\n ${sectionInfo.json_format}\n The JSON response:`
        );
      } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Failed to process the request." });
      }
    });

    // Wait for all promises to resolve
    await Promise.all(updatePromises);
    let id = allCompanies[0].companyId._id;

    const updateddata = await Relation.findOneAndUpdate(
      { companyId: id },
      { $set: { userpersona: userpersona } }
    );

    res.json({ data: "Companies updated" });
  } catch (err) {
    res.json({ message: err.message });
  }
};

const updateCheckConfig = async (companyId) => {
  const company = await Company.findById(companyId);

  const updateField = (config, path) => {
    const fieldValue = path
      .split(".")
      .reduce(
        (obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined),
        company
      );

    if (
      fieldValue === undefined ||
      fieldValue == null ||
      (Array.isArray(fieldValue) && fieldValue.length === 0)
    ) {
      return false;
    }

    return true;
  };

  const recursivelyUpdateFields = (config, path = "") => {
    for (const key in config) {
      const currentPath = path ? `${path}.${key}` : key;

      config[key] = updateField(config, currentPath);
      // if (typeof config[key] === "object") {
      //   recursivelyUpdateFields(config[key], currentPath);
      // } else if (config[key] === true) {
      //   config[key] = updateField(config, currentPath);
      // }
    }
  };

  recursivelyUpdateFields(checkConfig);

  return checkConfig;
};

const getNotificationData = async (req, res) => {
  try {
    const { companyId } = req.params;
    const updatedConfig = await updateCheckConfig(companyId);

    res.json({ data: updatedConfig });
  } catch (err) {
    res.json({ message: err.message });
  }
};

const getScrapeDate = async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await Company.findById(companyId);
    const data = company["dateofScrape"];

    res.json({ data: data });
  } catch (err) {
    res.json({ message: err.message });
  }
};

const addCompanyData = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { type, data } = req.body;

    if (type == "userpersona") {
      const sectionInfo = SectionsWithoutAssistance.find(
        (info) => info.section === type
      );
      const updatePromises = data.map(async (item) => {
        let prompt = sectionInfo.Prompt.replace("$name", item.userinfo.name)
          .replace("$age", item.userinfo.age)
          .replace("$jobdescription", item.userinfo.jobdescription)
          .replace("$industry", item.userinfo.industry)
          .replace("$yearofexperience", item.userinfo.yearofexperience)
          .replace("$location", item.userinfo.location);

        try {
          item.gptoutput = await generateJSON(
            `${prompt}\nDo not include any explanations, only provide JSON response following this format without deviation.:\n ${sectionInfo.json_format}\n The JSON response:`
          );
        } catch (error) {
          console.error("Error:", error);
          res.status(500).json({ error: "Failed to process the request." });
        }
      });

      // Wait for all promises to resolve
      await Promise.all(updatePromises);

      //Update the document after the loop is completed
      await Relation.findOneAndUpdate(
        { companyId: companyId },
        { $set: { userpersona: data } }
      );
    } else {
      await Company.findByIdAndUpdate(companyId, { [type]: data });
    }

    res.json({ message: "Successfully added company data" });
  } catch (err) {
    res.json({ message: err.message });
  }
};

const scrapCompanyData = async (req, res) => {
  try {
    const { companyId } = req.body;
    res.send({ message: `Scraping process started for company ${companyId}` });
    await scrapeAllCompanies(companyId);
  } catch (err) {
    console.log("Final Error is ----->", err);
    res.json({ message: err.message });
  }
};

const runAllPrompt = async (req, res) => {
  try {
    const { companyId } = req.body;
    await runAllPromptHelper(companyId);
    res.json({ success: "Completed" });
  } catch (err) {
    console.log("Api error->", err);
    res.json({ status: "error", message: err.message, data: [] });
  }
};

const getCompanyData = async (req, res) => {
  try {
    const { companyId, tabType } = req.params;
    let data = {};

    //const prompt=await Prompt.find()
    if (tabType == "userpersona") {
      const company = await Relation.find({ companyId: companyId });
      data = company[0][tabType];
    } else {
      if (tabType == "blogs") {
        const company = await Company.findById(companyId);

        data = company[tabType];

        const titles = data.titles;
        const totalTitles = titles.length;

        // Initialize counters for each blog type
        let instructionalCount = 0;
        let thoughtLeadershipCount = 0;
        let keywordDrivenCount = 0;
        let companyUpdateCount = 0;
        let othersCount = 0;

        // Count occurrences of each blog type
        titles.forEach((title) => {
          switch (title.blogtype) {
            case "Instructional":
              instructionalCount++;
              break;
            case "Thought Leadership":
              thoughtLeadershipCount++;
              break;
            case "Keyword Driven":
              keywordDrivenCount++;
              break;
            case "Company Update":
              companyUpdateCount++;
              break;
            default:
              othersCount++;
              break;
          }
        });

        // Calculate percentages and set them in the data object
        data["instructionalPercent"] = (instructionalCount / totalTitles) * 100;
        data["thoughtLeadershipPercent"] =
          (thoughtLeadershipCount / totalTitles) * 100;
        data["keywordDrivenPercent"] = (keywordDrivenCount / totalTitles) * 100;
        data["companyUpdatePercent"] = (companyUpdateCount / totalTitles) * 100;
        data["othersPercent"] = (othersCount / totalTitles) * 100;
      } else {
        const company = await Company.findById(companyId);
        data = company[tabType];
      }
    }

    res.json({
      status: "success",
      message: "Successfully fetched data",
      data,
    });

    // res.json({...data,"prompt":prompt[tabType]});
  } catch (err) {
    res.json({ status: "error", message: err.message, data: [] });
  }
};

const getAlldata = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId);

    // find realtion whether companyId or competitorsId matches with companyId
    const relation = await Relation.find({
      $or: [{ companyId }, { competitorsId: companyId }],
    });

    if (!company)
      return res.json({
        status: "error",
        message: "No data found",
        data: [],
      });

    res.json({
      status: "success",
      message: "Successfully fetched data",
      company,
      toptrends: relation[0]?.toptrends,
    });
  } catch (err) {
    res.json({ status: "error", message: err.message, data: [] });
  }
};

const getPrompt = async (req, res) => {
  try {
    const { tabType } = req.params;

    const prompt = await Prompt.find();
    const data = prompt[0][tabType];

    if (!data)
      return res.json({
        status: "error",
        message: "No data found",
        data: null,
      });

    res.json({ status: "success", message: "Successfully fetched data", data });
  } catch (err) {
    res.json({ status: "error", message: err.message, data: [] });
  }
};

const runAPrompt = async (req, res) => {
  try {
    const { companyId, type } = req.body;

    let Prompt = "";
    if (req.body.gptprompt) {
      Prompt = req.body.gptprompt;
    } else {
      const allPrompts = getAllPrompts();
      Prompt = allPrompts.find((item) => item.dbKey == type).prompt;
    }

    await runASinglePrompt(companyId, type, Prompt);
    res.json({ message: "Success" });
  } catch (err) {
    console.log(err);
    res.json({ message: err.message });
  }
};

const uploadProspect = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }
  const buffer = req.file.buffer;
  try {
    let results;
    if (req.file.originalname.endsWith(".csv")) {
      results = await parseCSV(buffer);
    } else if (
      [".xls", ".xlsx"].some((ext) => req.file.originalname.endsWith(ext))
    ) {
      results = parseExcel(buffer);
    } else {
      return res.status(400).json({ error: "Unsupported file format." });
    }

    const concurrentLimit = 3; // Number of concurrent scraping processes
    let concurrentCount = 0;

    await Promise.all(
      results.map(async (company) => {
        if (concurrentCount >= concurrentLimit) {
          // Wait for one scraping process to complete
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Check if user exists by Email or any other unique field
        const existingCompany = await Company.findOne({
          name: company["Company"],
        });

        if (existingCompany) {
          // If user exists, update the user details
          const updatedCompany = {
            name: company["Company"],
            websiteUrl: company["Company's Website"],
          };

          await Company.findByIdAndUpdate(existingCompany._id, updatedCompany);
        } else {
          if (company["Competitor 1"].length != 0) {
            const newCompany = new Company({
              name: company["Company"],
              websiteUrl: company["Company's Website"],
            });
            const { _id: companyId } = await newCompany.save();

            console.log("newCompany", newCompany);

            const competitorsId = [];
            const industryTrends = [];
            let competitors = [];

            // pushing competitor 1
            competitors.push({
              name: company["Competitor 1"],
              websiteUrl: company["Competitor 1's Website"],
            });
            // pushing competitor 2
            competitors.push({
              name: company["Competitor 2"],
              websiteUrl: company["Competitor 2's Website"],
            });

            await Promise.all(
              competitors.map(async (competitor) => {
                const newCompetitor = new Company({
                  name: competitor.name,
                  websiteUrl: competitor.websiteUrl,
                });

                const { _id } = await newCompetitor.save();
                competitorsId.push(_id);
              })
            );

            const newRelation = new Relation({
              companyId,
              competitorsId,
              industryTrends,
            });

            const relationData = await newRelation.save();
            const isScrapingFile = await getScrapingStatus(companyId);
            if (!isScrapingFile) {
              scrapeAllCompanies(companyId).then(() => {
                concurrentCount--;
              });
              concurrentCount++;
            }
          }
        }
      })
    );
    startPolling();
    res.json("File processing started");
  } catch (error) {
    console.log("Error--->", error);
    res.status(500).json({ error: "Failed to process the file." });
  }
};

const getDatafromS3 = async (section, companyId) => {
  // Set up parameters for the getObject operation
  const params = {
    Bucket: process.env.BUCKETNAME,
    Key: `promptoutput/${companyId}/${section}.txt`,
  };

  try {
    const data = await s3.getObject(params);
    return await data.Body.transformToString("utf-8");
  } catch (err) {
    console.error(`Error fetching file from S3: ${err}`);
  }
};

const getDymanicPromptResponse = async (req, res) => {
  try {
    let { gptprompt, inputs } = req.body;

    for (const val of inputs) {
      const regex = new RegExp(`\\$${val}`, "g"); // Create a RegExp for each value
      let replacementContent = await getDatafromS3(val, req.params.companyId);
      gptprompt = gptprompt.replace(regex, replacementContent); // Replace with replacementContent
    }

    try {
      const content = await generateText(gptprompt);
      // same shape as the old chat message so the frontend keeps reading output.content
      res.json({ output: { role: "assistant", content } });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Failed to process the request." });
    }
  } catch (err) {
    res.json({ message: err.message });
  }
};

const getCompanyCompetitors = async (req, res) => {
  try {
    const { gptprompt, companyName, companyUrl } = req.body;

    let prompt = gptprompt.replace("$company_name", companyName);
    prompt = prompt.replace("$company_website", companyUrl);
    try {
      res.json({ data: await generateText(prompt) });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Failed to process the request." });
    }
  } catch (err) {
    res.json({ message: err.message });
  }
};

const getTopTrends = async (req, res) => {
  try {
    // Scrap prospect company data
    let existingCompany = await Relation.findOne({
      companyId: req.params.companyId,
    });

    if (existingCompany) {
      res.json({ data: existingCompany.toptrends });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to process the request." });
  }
};

async function doesPathExist(bucketName, path) {
  try {
    // List the objects in the specified path
    const response = await s3.listObjectsV2({
      Bucket: bucketName,
      Prefix: path,
    });

    // Check if there are any objects in the response
    return response.KeyCount > 0;
  } catch (error) {
    console.error("Error checking path existence:", error);
    return false;
  }
}

const getScrapingStatus = async (req, res) => {
  try {
    doesPathExist(
      process.env.BUCKETNAME,
      `${req.params.companyId}/CONSOLIDATED_WEBSITE.md`
    ).then((exists) => {
      if (!exists) {
        res.json({ data: false });
      } else {
        res.json({ data: true });
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to process the request." });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { companyId } = req.query;
    console.log(companyId);
    const allUsers = await User.find({ companyId });
    res.json(allUsers);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to process the request." });
  }
};

const deleteUser = async (req, res) => {
  const { userId } = req.params;
  await User.findByIdAndDelete(userId);
  res.json({ message: "User deleted successfully" });
};

const editUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndUpdate(userId, {
      ...req.body,
    });
    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.log("error", err);
  }
};

const getUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const allUsers = await User.find({ _id: userId });
    res.json(allUsers);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to process the request." });
  }
};
const addProspect = async (req, res) => {
  const { companyId, name, linkedin } = req.body;

  const newProspect = new Prospect({
    companyId,
    name,
    linkedin,
  });
  await newProspect.save();

  res.json({ message: "Prospect added successfully" });
};

const generatePersona = async (req, res) => {
  try {
    const { userId } = req.query;
    const filePath = `Users/${userId}.json`;

    const prospectJsonData = await Prospect.findOne({ _id: userId }).populate(
      "name"
    );
    // const { assistantId, threadId } = await isAssistantExist(companyId);
    const prospectJsonFile = await fetchFileFromS3(filePath);
    const prospectJson = fs.readFileSync(prospectJsonFile, "utf8");
    const allPrompts = getAllPrompts();

    const prospectPrompt = allPrompts.find((item) => item.dbKey == "prospect");

    const prompt = prospectPrompt.prompt.replaceAll(
      "$name",
      prospectJsonData.name
    );
    const json_format = prospectPrompt.json_format;
    const finalPrompt = `${prompt}\nBelow is the prospect data\n${prospectJson}\nDo not include any explanations, only provide a RFC8259 compliant JSON response following this format without deviation.:\n ${json_format}\n The JSON response:`;
    const gptRes = await generateJSON(finalPrompt);

    await Prospect.findByIdAndUpdate(
      userId,
      {
        Demographic: gptRes.Demographic,
        Psychographic: gptRes.Psychographic,
        Motivations: gptRes.Motivations,
        Challenges: gptRes.Challenges,
        Interests: gptRes.Interests,
        TonOfVoice: gptRes.TonOfVoice,
        PainPoints: gptRes.PainPoints,
      },
      { returnDocument: "after" }
    );

    return res.json({ message: "Succes" });
  } catch (err) {
    console.log(err);
    return res.json({ message: "Failed" });
  }
};

const generateEmail = async (req, res) => {
  try {
    const { userId, companyId } = req.body;
    const userData = await Prospect.findOne({ _id: userId });
    const companyData = await Company.findOne({ _id: companyId });

    const personaFile = await fetchFileFromS3(
      `Users/${userId}/persona.md`,
      `Users/${userId}`
    );

    // read personaFile and store it in a variable
    const fileStream = fs.readFileSync(personaFile, "utf8");

    // const personaFileId = await uploadFile(personaFile);

    // Create a writable stream to save the downloaded file
    const allPrompts = getAllPrompts();
    const prospectEmailPrompt = allPrompts.find(
      (item) => item.dbKey == "email"
    );
    let prompt = prospectEmailPrompt.prompt.replaceAll(
      "$company_name",
      companyData.name
    );
    prompt = prompt.replaceAll("$prospect_name", userData.name);

    const json_format = prospectEmailPrompt.json_format;

    // const userPersonaData = `Below is the user persona data for ${
    //   userData.name
    // }:\n${JSON.stringify(userData)}\n The products of ${
    //   companyData.name
    // } are ${JSON.stringify(companyData.products)}`;

    const finalPrompt = `${prompt}\nBelow is the user persona data\n${fileStream}.\nDo not include any explanations, only provide a RFC8259 compliant JSON response following this format without deviation.:\n ${json_format}\n The JSON response:`;
    const gptRes = await createThreadAndRunonKnowledgeBase(
      companyId,
      finalPrompt
    );

    await Company.findByIdAndUpdate(companyId, {
      customEmails: gptRes,
    });
    res.json({ message: "Success", email: gptRes });
  } catch (err) {
    console.log(err);
    return res.json({ message: "Failed" });
  }
};

const createContactList = async (req, res) => {
  const { payload } = req.body;

  console.log("payload", payload);

  if (!payload) {
    return res.status(400).json({ error: "Payload  required." });
  }

  const url = process.env.HUBSPOT_API_ENDPOINT;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.HUBPOT_API_KEY}`,
  };

  axios
    .post(url, payload, { headers })
    .then((response) => {
      res.status(response.status).json(response.data);
    })
    .catch((error) => {
      res.status(error.response.status || 500).json({ error: error.message });
    });
};

const getAllDataV2 = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId);
    const relation = await Relation.findOne({ companyId });
    const competitorsIds = relation.competitorsId;
    // get all competitors Data from company model
    const competitors = await Company.find({ _id: { $in: competitorsIds } });

    // Make the external API call
    // const response = await axios.get(
    //   `${KNOWLEDGE_BASE_API}/files?company_id=${companyId}`
    // );
    // const externalData = response.data; // Assuming the response data is an object

    if (!company)
      return res.json({
        status: "error",
        message: "No data found",
        data: [],
      });

    res.json({
      status: "success",
      message: "Successfully fetched data",
      company,
      competitors,
      toptrends: relation?.toptrends,
    });
  } catch (err) {}
};

const uploadIcon = async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded.");

  const file = req.file;
  const companyId = req.params.companyId;
  const key = ` ${req.params.companyId}/logo-${file.originalname}`;

  const params = {
    Bucket: process.env.BUCKETNAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read",
  };

  try {
    const data = await new Upload({ client: s3, params }).done();

    await Company.findByIdAndUpdate(companyId, {
      "about.companyLogo": data.Location ? data.Location : "",
    });

    res.status(201).send({ url: data.Location });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error uploading file.");
  }
};

const addReportUrl = async (req, res) => {
  const { companyId } = req.params;
  const { googleSheetUrl, compositeScoreUrl } = req.body;

  try {
    // Find the document by companyId
    const company = await Company.findOne({ _id: companyId });

    if (!company) {
      return res.status(404).send("Company not found");
    }

    if (googleSheetUrl) {
      company.about.googleSheetUrl = googleSheetUrl;
    }

    if (compositeScoreUrl) {
      company.about.compositeScoreUrl = compositeScoreUrl;
    }

    // Save the changes
    await company.save();

    res.status(200).send("Report URLs updated successfully");
  } catch (err) {
    res.status(500).send("Server error");
  }
};

module.exports = {
  addCustomer,
  addAssets,
  getAllCustomers,
  getCompetitors,
  addCompanyData,
  getCompanyData,
  scrapCompanyData,
  runAPrompt,
  getPrompt,
  getNotificationData,
  getScrapeDate,
  uploadProspect,
  getDymanicPromptResponse,
  getCompanyCompetitors,
  getTopTrends,
  runAllPrompt,
  updateCompetitors,
  getScrapingStatus,
  doesPathExist,
  getAllUsers,
  deleteUser,
  editUser,
  getUser,
  addProspect,
  generatePersona,
  generateEmail,
  getAlldata,
  createContactList,
  getAllDataV2,
  uploadIcon,
  addReportUrl,
  deleteAsset,
};
