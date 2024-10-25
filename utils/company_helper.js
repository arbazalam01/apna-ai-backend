const { InitialMessage, getAllPrompts } = require("../lib/function_calling");
const Company = require("../models/Company");
const Relation = require("../models/Relation");
const { OpenAI } = require("openai");
const {
  fetchFileFromS3,
  fetchCompanyReport,
  ensureDirectoryExists,
} = require("./aws_helper");
const {
  uploadFile,
  createVectorStore,
  createAssistantV2,
  createThreadAndRun,
  createThreadAndRunonKnowledgeBase,
  threadAndRunV2,
} = require("./openai_helper");
const {
  scrapeLinkedinCompanyProxyCurl,
  fetchCompanyLogoProxyCurl,
} = require("./scraper_helper");
const Function_Info = require("./functions_info");
const { default: axios } = require("axios");
const AWS = require("aws-sdk");
const fs = require("fs");
const openaiapi = process.env.OPEN_API_KEY;
const GPT_MODEL = process.env.GPT_MODEL;
const KNOWLEDGE_BASE_API = process.env.KNOWLEDGE_BASE_API;
const { Blogs } = require("../lib/function_calling");

const s3 = new AWS.S3();

const addCompany = async (data) => {
  const newCompany = new Company(data);
  const saveCompany = await newCompany.save();
  return saveCompany;
};

const addRelation = async (data) => {
  const newRelation = new Relation(data);
  const saveRelation = await newRelation.save();
  return saveRelation;
};

const isCompanyScrapingDone = async (companyId) => {
  const companyData = await Company.findById(companyId, "isScrapingDone");
  return companyData.isScrapingDone;
};

const updateCompanyData = async (companyId, updateFields) => {
  try {
    const updateDocument = await Company.findByIdAndUpdate(
      companyId,
      updateFields,
      { new: true }
    );

    if (!updateDocument) {
      return null;
    }
    return updateDocument;
  } catch (err) {
    console.log("Error DB--->", err);
    return null;
  }
};

const fetchCompanyData = async (companyId) => {
  const companyData = await Company.findById(companyId);
  return companyData;
};

const fetchRelationData = async (companyId) => {
  const relationData = await Relation.find({ companyId: companyId });
  return relationData;
};

async function generateJSONFromtext(prompt, type) {
  const openai = new OpenAI({
    apiKey: openaiapi,
  });

  const sectionInfo = Function_Info.find((info) => info.section === type);

  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-1106",
    messages: [{ role: "user", content: prompt }],
    functions: [
      {
        name: "format_json",
        description: "Convert text into json",
        parameters: sectionInfo.parameters,
      },
    ],
    function_call: "auto",
  });

  try {
    if (chatCompletion.choices[0].message?.function_call?.arguments) {
      if (
        JSON.parse(chatCompletion.choices[0].message?.function_call?.arguments)
          .type?.length != 0
      ) {
        let val = JSON.parse(
          chatCompletion.choices[0].message.function_call.arguments
        );

        return val.toptrends;
      }
    }
  } catch (err) {
    console.log("error", err);
    return;
  }
}

const fetchTopTrends = async (websiteUrl) => {
  // running top industry trends prompts
  const openai = new OpenAI({
    apiKey: openaiapi,
  });
  openai.chat.completions
    .create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "user",
          content: `Give me the name of the industry the company whose is ${websiteUrl} and then give me the top five themes and trends for this industry `,
        },
      ],
    })
    .then(async (response) => {
      let messageText = response.choices[0].message.content;

      const res = await generateJSONFromtext(`${messageText}`, "toptrends");

      return res;
    })
    .catch((error) => {
      console.error("Error:", error);
      res.status(500).json({ error: "Failed to process the request." });
    });
};

const isAssistantExist = async (companyId) => {
  let companyData = await fetchCompanyData(companyId);
  const isScrapingDone = companyData.isScrapingDone;
  if (!isScrapingDone) {
    const s3FilePath = `${companyId}/combined.md`;
    const localDir = `${companyId}`;
    const scrapedFilePath = await fetchFileFromS3(s3FilePath, localDir);
    const openAiFileId = await uploadFile(scrapedFilePath);
    const vectorStoreId = await createVectorStore(companyData.name, [
      openAiFileId,
    ]);

    const assistantId = await createAssistantV2(
      vectorStoreId,
      "Company Info Extractor"
    );
    // const threadId = await createEmptyThread();
    const updateFields = {
      assistantId,
      fileId: openAiFileId,
      isScrapingDone: true,
    };
    companyData = await updateCompanyData(companyId, updateFields);

    // const promptSection = InitialMessage;
    // await runSinglePrompt(assistantId, threadId, promptSection);
  }
  return companyData;
};

const isAssistantV2Exist = async (companyId) => {
  const assistantV2Instruction = process.env.ASSISTANT_INSTRUCTION_V2;
  let companyData = await fetchCompanyData(companyId);
  const isAssistantV2Exist = companyData.assistantV2Id;
  if (!isAssistantV2Exist) {
    // const scrapedFilePath = await fetchMultipleFileFromS3(companyId);
    const filePath = await fetchCompanyReport(companyId);

    // Make the external API call
    const response = await axios.get(
      `${KNOWLEDGE_BASE_API}/files?company_id=${companyId}`
    );
    const assets = response.data.files; // Assuming the response data is an object

    // Get a list of file paths from the S3 URLs
    const filePaths = await Promise.all(
      assets.map(async (asset) => {
        const s3FilePath = `${companyId}/assets/${asset.filename}`;
        const localDir = `${companyId}`;
        const filePath = await fetchFileFromS3(s3FilePath, localDir);
        return filePath;
      })
    );

    const openAiFileIds = await Promise.all(
      filePaths.map(async (filePath) => {
        return await uploadFile(filePath);
      })
    );

    const openAiFileId = await uploadFile(filePath);

    const vectorStoreId = await createVectorStore(
      `${companyData.name}_Information`,
      [...openAiFileIds, openAiFileId]
    );
    const assistantId = await createAssistantV2(
      vectorStoreId,
      "Company AI Assistant",
      assistantV2Instruction
    );
    const updateFields = {
      assistantV2Id: assistantId,
    };
    companyData = await updateCompanyData(companyId, updateFields);
  }
  return companyData;
};

const saveAIOutput = async (companyId, aiOutput, section) => {
  try {
    const newDatatoUpdate = {};
    const { dbKey } = section;
    if (
      dbKey == "about" ||
      dbKey == "blogs" ||
      dbKey == "marketposition" ||
      dbKey == "swotanalysis"
    ) {
      newDatatoUpdate[dbKey] = aiOutput;
    } else {
      const tmpData = aiOutput[dbKey];
      newDatatoUpdate[dbKey] = tmpData;
    }

    console.log("newDatatoUpdate-->", newDatatoUpdate);
    await updateCompanyData(companyId, newDatatoUpdate);
  } catch (err) {
    console.log("eroorr-->", err);
  }
};

const dateFormatter = (date) => {
  let [day, month, year] = date.split("/");
  let dateObject = new Date(`${year}-${month}-${day}`);
  return dateObject;
};

const companyLinkedInInfo = async (companyId, prevAboutData) => {
  try {
    const companyData = await fetchCompanyData(companyId);
    // check if linkedinUrl is present in companyData
    const linkedinUrl = prevAboutData.linkedin?.handle || null;
    if (linkedinUrl) {
      // fetch linkedindata from proxy curl
      // let linkedinData = companyData?.proxycurl || null;
      // if (!linkedinData) {
      let linkedinData = await scrapeLinkedinCompanyProxyCurl(linkedinUrl);
      await updateCompanyData(companyId, { proxycurl: linkedinData });
      // }

      const profile_img_url = await fetchCompanyLogoProxyCurl(linkedinUrl);
      const aws_profile_img = await downloadCompanyLogo(
        companyId,
        profile_img_url,
        "companyLogo"
      );
      const linkedin_followers = linkedinData?.follower_count || null;

      await Company.findByIdAndUpdate(companyId, {
        $set: {
          "about.linkedin.followers": linkedin_followers,
          "about.companyLogo": aws_profile_img,
          "about.linkedin.handle": linkedinUrl,
        },
      });
    }
  } catch (err) {
    console.log("Error-->", err);
  }
};

const runAllPromptHelper = async (companyId) => {
  const allPrompts = getAllPrompts();
  const companyData = await fetchCompanyData(companyId);

  console.log("inside");

  // Ensure assistant exists before running prompts
  const { assistantId } = await isAssistantExist(companyId);

  // const allPromptsPromise = allPrompts.map((section) =>
  //   runASinglePrompt(companyId, section.dbKey, assistantId)
  // );

  // await Promise.all(allPromptsPromise);

  // divide in two parts and then run the prompts
  const totalNoOfPrompts = allPrompts.length;
  const half = Math.ceil(totalNoOfPrompts / 2);
  const firstHalf = allPrompts.slice(0, half);
  const secondHalf = allPrompts.slice(half, totalNoOfPrompts);

  // run concurrently
  const firstHalfPromises = firstHalf.map((section) =>
    runASinglePrompt(companyId, section.dbKey, assistantId)
  );
  await Promise.all(firstHalfPromises);

  const secondHalfPromises = secondHalf.map((section) =>
    runASinglePrompt(companyId, section.dbKey, assistantId)
  );
  await Promise.all(secondHalfPromises);

  // run one by one prompt
  // for (section of allPrompts) {
  //   await runASinglePrompt(companyId, section.dbKey, assistantId);
  // }

  // remove duplicates from services and products
  await removeDuplicateProductsAndServices(companyId);

  const isPrimaryCompany = companyData.isPrimaryCompany;

  if (isPrimaryCompany) {
    // running top industry trends prompts
    const topTrendsPrompt = {
      prompt: `Give me the name of the industry the company whose is ${companyData.website} and then give me the top five themes and trends for this industry `,
      json_format: `{"toptrends" : "Array of string" }`,
    };
    // const newAssistantId = process.env.OPENAI_ASSISTANT_ID;
    const newCompanyData = await isAssistantExist(companyId);

    const finalPrompt = `${topTrendsPrompt.prompt}.\nDo not include any explanations, only provide JSON response following this format without deviation.:\n ${topTrendsPrompt.json_format}\n The JSON response:`;
    let jsonData = await createThreadAndRunonKnowledgeBase(
      companyId,
      finalPrompt
    );

    // save jsonData in relation
    await Relation.findOneAndUpdate(
      { companyId },
      { toptrends: jsonData.toptrends }
    );

    await isAssistantV2Exist(companyId);
  }
};

const isReportDone = async (companyId) => {
  const company = await Relation.findOne({ companyId });
  if (!company) {
    return false;
  }

  const isReportDone = company.isReportDone;
  return isReportDone;
};

const downloadCompanyLogo = async (companyId, profile_pic_url, type) => {
  try {
    // download profile pic from url as image
    const response = await axios({
      url: profile_pic_url,
      responseType: "stream",
    });

    let filename = "";

    // Generate a unique filename
    if (type === "companyLogo") {
      filename = `${companyId}_logo.jpg`;
    } else {
      filename = `${companyId}_${type}.jpg`;
    }

    await ensureDirectoryExists(`./tmp/${companyId}`);

    // local file path
    const localFilePath = `./tmp/${companyId}/${filename}`;

    // Save the image temporarily
    const writer = fs.createWriteStream(localFilePath);
    response.data.pipe(writer);

    const ImgPromise = new Promise((resolve, reject) => {
      writer.on("finish", async () => {
        // Read the file
        const fileContent = fs.readFileSync(localFilePath);

        // Upload the image to S3
        const params = {
          Bucket: process.env.BUCKETNAME,
          Key: `images/${filename}`, // File path in S3
          Body: fileContent,
          ContentType: "image/jpeg",
        };

        s3.upload(params, (err, data) => {
          if (err) {
            console.error(err);
            reject(err);
          }

          // Delete the temporarily saved file
          fs.unlinkSync(localFilePath);

          // Send the S3 URL as the response
          console.log("File uploaded successfully.", data.Location);
          resolve(data.Location);
        });
      });

      writer.on("error", (err) => {
        console.error(err);
        reject(err);
      });
    });

    return ImgPromise;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const runASinglePrompt = async (
  companyId,
  type,
  assistantId,
  customPrompt = null
) => {
  const allPrompts = getAllPrompts();
  let section = allPrompts.find((item) => item.dbKey == type);
  if (type == "blogs") {
    section = Blogs;
  }
  const companyData = await fetchCompanyData(companyId);
  const { name, about } = companyData;

  const currentPrompt = customPrompt || section.prompt;

  const updatedPrompt = {
    ...section,
    prompt: currentPrompt.replaceAll("$company_name", name),
  };

  const finalPrompt = `${updatedPrompt.prompt}.\nDo not include any explanations, only provide JSON response following this format without deviation.:\n ${updatedPrompt.json_format}\n The JSON response:`;
  let jsonData = null;
  if (
    type == "swotanalysis" ||
    type == "marketposition" ||
    type == "summary" ||
    type == "industries" ||
    type == "topseos"
  ) {
    jsonData = await createThreadAndRunonKnowledgeBase(companyId, finalPrompt);
  } else {
    let assistantFile = await fetchFileFromS3(
      `${companyId}/${type}.md`,
      `${companyId}`
    );

    if (assistantFile == null) {
      jsonData = await createThreadAndRunonKnowledgeBase(
        companyId,
        finalPrompt
      );
    } else {
      jsonData = await createThreadAndRunonKnowledgeBase(
        companyId,
        finalPrompt
      );
    }
  }

  await saveAIOutput(companyId, jsonData, section);

  if (type == "products") {
    await removeDuplicateProductsAndServices(companyId);
  }
  return;
};

const removeDuplicateProductsAndServices = async (companyId) => {
  const companyData = await fetchCompanyData(companyId);
  const { products, services } = companyData;

  // remove all services which are present in products by name
  const uniqueProducts = products.filter(
    (product) => !services.find((service) => service.name === product.name)
  );

  // now update products

  await Company.findByIdAndUpdate(
    companyId,
    {
      $set: {
        products: uniqueProducts,
      },
    },
    { new: true }
  );
};

module.exports = {
  addCompany,
  addRelation,
  isCompanyScrapingDone,
  updateCompanyData,
  fetchCompanyData,
  isAssistantExist,
  saveAIOutput,
  fetchTopTrends,
  dateFormatter,
  isAssistantV2Exist,
  companyLinkedInInfo,
  runAllPromptHelper,
  isReportDone,
  downloadCompanyLogo,
  runASinglePrompt,
};
