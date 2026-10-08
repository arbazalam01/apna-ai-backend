const { InitialMessage, getAllPrompts } = require("../lib/function_calling");
const Company = require("../models/Company");
const Relation = require("../models/Relation");
const {
  fetchFileFromS3,
  ensureDirectoryExists,
  s3,
} = require("./aws_helper");
const { createThreadAndRunonKnowledgeBase } = require("./openai_helper");
const { default: axios } = require("axios");
const fs = require("fs");
const { Upload } = require("@aws-sdk/lib-storage");
const { Blogs } = require("../lib/function_calling");

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
      { returnDocument: "after" }
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

const runAllPromptHelper = async (companyId) => {
  const allPrompts = getAllPrompts();
  const companyData = await fetchCompanyData(companyId);

  console.log("inside");

  // Ensure assistant exists before running prompts
  // const { assistantId } = await isAssistantExist(companyId);

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
    runASinglePrompt(companyId, section.dbKey)
  );
  await Promise.all(firstHalfPromises);

  const secondHalfPromises = secondHalf.map((section) =>
    runASinglePrompt(companyId, section.dbKey)
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
    await updateCompanyData(companyId, { isScrapingDone: true });

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

        try {
          const { Location } = await new Upload({ client: s3, params }).done();

          // Delete the temporarily saved file
          fs.unlinkSync(localFilePath);

          // Send the S3 URL as the response
          console.log("File uploaded successfully.", Location);
          resolve(Location);
        } catch (err) {
          console.error(err);
          reject(err);
        }
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

const runASinglePrompt = async (companyId, type, customPrompt = null) => {
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
    { returnDocument: "after" }
  );
};

module.exports = {
  addCompany,
  addRelation,
  isCompanyScrapingDone,
  updateCompanyData,
  fetchCompanyData,
  saveAIOutput,
  dateFormatter,
  runAllPromptHelper,
  isReportDone,
  downloadCompanyLogo,
  runASinglePrompt,
};
