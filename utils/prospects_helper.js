const Prospect = require("../models/Prospect");
const {
  fetchFileFromS3,
  fetchDataFromS3,
  saveFileContent,
  isFileExistS3,
} = require("./aws_helper");
const {
  uploadFile,
  runProspect,
  emailGeneratePrompt,
  newProspectGenerate,
  threadAndRunV2,
  createThreadAndRunonKnowledgeBase
} = require("./openai_helper");
const {
  getAllPrompts,
  prospectPrompt,
  newPersonaPrompt,
  emailPrompt,
  ProductEngagementProspectPrompt,
  BrandAwarenessProspectPrompt,
  EventLedProspectPrompt,
  newEmailPromptForBrandAwareness,
  newEmailPromptForEventLed,
  newEmailPromptForProductEngagement,
} = require("../lib/function_calling");
const { default: axios } = require("axios");
const Company = require("../models/Company");
const { isAssistantExist, isAssistantV2Exist } = require("./company_helper");
const fs = require("fs");
const Campaign = require("../models/Campaign");
const { createObjectCsvWriter } = require("csv-writer");
const { csvToJson } = require("./csv_parser");
const FormData = require("form-data");
const nodemailer = require("nodemailer");
const AWS = require("aws-sdk");


// Configure AWS SDK with your credentials and region
AWS.config.update({
  accessKeyId: process.env.ACCESSKEY,
  secretAccessKey: process.env.SECRETKEY,
  region: process.env.REGION,
});

const s3 = new AWS.S3();


const scrapeLinkedinProfile = async (linkedin_url, userId) => {
  try {
    const response = await axios.get(`${process.env.FAST_API}/linkedinurl`, {
      params: {
        linkedin_url,
        userId,
      },
    });
    return response.data;
  } catch (err) {
    console.log(err);
  }
};

const scrapeLinkedinCompany = async (linkedin_url, userId) => {
  try {
    const response = await axios.get(
      `${process.env.FAST_API}/linkedincompany`,
      {
        params: {
          linkedin_url,
          userId,
        },
      }
    );
    return response.data;
  } catch (err) {
    console.log(err);
  }
};

const scrapeLinkedinProfileProxyCurl = async (linkedin_url, userId) => {
  try {
    const apiRes = await axios.get(
      `${process.env.PROXY_CURL_API_ENDPOINT}/api/v2/linkedin`,
      {
        params: {
          url: linkedin_url,
          fallback_to_cache: "on-error",
          skills: "include",
          extra: "include",
          use_cache: "if-present",
        },
        headers: {
          Authorization: `Bearer ${process.env.PROXY_CURL_API_KEY}`,
        },
      }
    );

  const { data } = apiRes;
    // Convert JSON data to a markdown-friendly format
  const markdownContent = `# User Profile\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
  
  await saveFileContent(
    `Users/${userId}`,
    `user_profile.md`,
    markdownContent
  );

    return data;
  } catch (err) {
    console.log(err);
  }
};

const scrapeLinkedinCompanyProxyCurl = async (linkedin_url, userId) => {
  try {
    const apiRes = await axios.get(
      `${process.env.PROXY_CURL_API_ENDPOINT}/api/linkedin/company`,
      {
        params: {
          url: linkedin_url,
          fallback_to_cache: "on-error",
          extra: "include",
          use_cache: "if-present",
          categories: "include",
        },
        headers: {
          Authorization: `Bearer ${process.env.PROXY_CURL_API_KEY}`,
        },
      }
    );
    const { data } = apiRes;
    await saveFileContent(
      `Users/${userId}`,
      `company_profile.json`,
      JSON.stringify(data)
    );
    return data;
  } catch (err) {
    console.log(err);
  }
};

const saveProspects = async (prospects , campaigninfo) => {
  let prsopectList = [];
  for (const prospect of prospects) {
    const prospect_name = prospect["First Name"] + " " + prospect["Last Name"];
    const prospect_linkedin = prospect["Prospect Linkedin URL"];
    const company_linkedin = prospect["Company Linkedin URL"];
    const prospect_title = prospect["Title"];
    const prospect_email = prospect["Email"];
    const prospect_industry = prospect["Industry"];
    const prospect_company = prospect["Company"];
    
    
    const prospectDetail = {
      name: prospect_name,
      linkedin: prospect_linkedin,
      companyLinkedin: company_linkedin,
      title: prospect_title,
      email: prospect_email,
      companyName: prospect["Company Name"],
      industry: prospect_industry,
      companyName: prospect_company,
      objective:campaigninfo.objectives,
      numberOfEmails:campaigninfo.numberOfEmails
    };

    // Include the product key if the objective is "Product Engagement"
    if (campaigninfo.objectives === "Product Engagement") {
      prospectDetail.product = campaigninfo.product;
    }


    // check if already exist in db
    const existingProspect = await Prospect.findOne({ email: prospect_email });
    if (existingProspect) {
      // Update the existing prospect's numberOfEmails and objective
      existingProspect.numberOfEmails = campaigninfo.numberOfEmails;
      existingProspect.objective = campaigninfo.objectives;

      if (campaigninfo.objectives === "Product Engagement") {
        existingProspect.product = campaigninfo.product;
      }

      // Save the updated prospect
      await existingProspect.save();
      prospectDetail._id = existingProspect._id;
      prsopectList.push(prospectDetail);
    } else {
      // await scrapeLinkedinProfile(prospect_linkedin, newProspect._id);
      // await scrapeLinkedinCompany(company_linkedin, newProspect._id);
      const newProspect = new Prospect({
        name: prospect_name,
        linkedin: prospect_linkedin,
        companyLinkedin: company_linkedin,
        title: prospect_title,
        email: prospect_email,
        industry: prospect_industry,
        companyName: prospect_company,
        objective:campaigninfo.objectives,
        numberOfEmails:campaigninfo.numberOfEmails
      });

      // Include the product key if the objective is "Product Engagement"
      if (campaigninfo.objectives === "Product Engagement") {
        newProspect.product = campaigninfo.product;
      }

      console.log(
        "Scraping linkedin profile using proxy curl-->",
        prospect_linkedin
      );
      const proxyCurlProfileData = await scrapeLinkedinProfileProxyCurl(
        prospect_linkedin,
        newProspect._id
      );

      newProspect.proxycurl = proxyCurlProfileData;

      await newProspect.save();

      prospectDetail._id = newProspect._id;
      prsopectList.push(prospectDetail);
    }
  }
  return prsopectList;
};

const generatePersona = async (userId, companyData) => {
  const isPersonaExist = await isFileExistS3(`Users/${userId}/persona.md`);
  if (isPersonaExist) {
    console.log("Persona already exist in s3");
    return;
  }
  const user_profile = `Users/${userId}/user_profile.md`;
  // const company_profile = `Users/${userId}/company_profile.json`;
  const prospectJsonData = await Prospect.findOne({ _id: userId });

  const getObjectParams = {
    Bucket: process.env.BUCKETNAME,
    Key: `Users/${userId}/user_profile.md`,
  };
  const data = await s3.getObject(getObjectParams).promise();

 
  const formData = new FormData() 
  formData.append("file",data.Body,user_profile); // Use Buffer and filename
  formData.append("company_id", (companyData._id).toString());

  // Upload to the external API
  await axios.post(`${process.env.KNOWLEDGE_BASE_API}/upload`, formData);
  

  let prompt;
  
  let objective=prospectJsonData.objective;
  if (objective == "Product Engagement") {
    prompt = ProductEngagementProspectPrompt.prompt.replaceAll(
      "$name",
      prospectJsonData.name
    );

    prompt = prompt.replaceAll("$product", prospectJsonData.product);
  } else if (objective == "Brand Awareness") {
    prompt = BrandAwarenessProspectPrompt.prompt.replaceAll(
      "$name",
      prospectJsonData.name
    );
  } else {
    prompt = EventLedProspectPrompt.prompt.replaceAll(
      "$name",
      prospectJsonData.name
    );
  }


 prompt = prompt.replaceAll("$no_of_question", prospectJsonData.numberOfEmails);

  // prompt = prompt.replaceAll("$user_persona", fileContent);
  prompt = prompt.replaceAll("$company_name", companyData.name);


  prompt+=`\nDo not include any explanations, only provide JSON response following this format without deviation.:\n ${ProductEngagementProspectPrompt.json_format}\n The JSON response:`;


  console.log("prompt for persona", prompt);

  // const gptRes = await newProspectGenerate(assistantId, threadId, prompt);
  const gptRes = await createThreadAndRunonKnowledgeBase(companyData._id, prompt);


  console.log("gptRes", gptRes);

 

  if(gptRes){
     
   await Prospect.findByIdAndUpdate(userId, {
      $set: {
        Questions: gptRes.Questions
      },
    })

  }

  await saveFileContent(`Users/${userId}`, `persona.md`, JSON.stringify(gptRes));
};

// const generatePersonaJson = async (userId) => {
//   try {
//     const user_profile = `Users/${userId}/user_profile.md`;
//   const company_profile = `Users/${userId}/company_profile.json`;
//   const prospectJsonData = await Prospect.findOne({ _id: userId });

//     const prospectPrompt =

//   }
//   catch (err) {
//     console.log(err);
//     return null;
//   }
// };

const generateProspectId = async (prospect) => {
  const prospect_name = prospect.name;
  const prospect_linkedin = prospect.linkedin;
  const company_linkedin = prospect.companyLinkedin;
  const prospect_title = prospect.title;
  const prospect_email = prospect.email;
  const prospect_company = prospect.companyName;

  // check if already exist in db
  const existingProspect = await Prospect.findOne({ email: prospect_email });
  if (existingProspect) {
    console.log("Prospect already exist in db");
    return existingProspect._id;
  }

  const newProspect = new Prospect({
    name: prospect_name,
    linkedin: prospect_linkedin,
    companyLinkedin: company_linkedin,
    title: prospect_title,
    email: prospect_email,
    companyName: prospect_company,
  });
  await newProspect.save();
  // await scrapeLinkedinProfile(prospect_linkedin, newProspect._id);
  // await scrapeLinkedinCompany(company_linkedin, newProspect._id);

  await scrapeLinkedinProfileProxyCurl(prospect_linkedin, newProspect._id);
  // await scrapeLinkedinCompanyProxyCurl(company_linkedin, newProspect._id);
  return newProspect._id;
};

const generateEmail = async (
  userId,
  companyData,
  campaignGuidlines
) => {
  try {
    const { product, wordCount , objectives , date , eventName , eventTheme } = campaignGuidlines;
    const userData = await Prospect.findOne({ _id: userId });


    const getObjectParams = {
      Bucket: process.env.BUCKETNAME,
      Key: `Users/${userId}/persona.md`,
    };
    const data = await s3.getObject(getObjectParams).promise();
  


    if (!data) {
      console.log("Persona file not found");
      return null;
    }


    const formData = new FormData();
    formData.append("file", data.Body,`Users/${userId}/persona.md`); // Use Buffer and filename
    formData.append("company_id", (companyData._id).toString());


    // Upload to the external API
    await axios.post(`${process.env.KNOWLEDGE_BASE_API}/upload`, formData);

    // const persona_fileId = await uploadFile(personaFile);

    let prompt="";

    if (objectives == "Brand Awareness") {
      prompt = newEmailPromptForBrandAwareness.prompt.replaceAll(
        "$company_name",
        companyData.name
      );
    } else if (objectives == "Product Engagement") {
      prompt = newEmailPromptForProductEngagement.prompt.replaceAll(
        "$company_name",
        companyData.name
      );
      prompt = prompt.replaceAll("$product", product);
    } else if (objectives == "Event Led") {
      prompt = newEmailPromptForEventLed.prompt.replaceAll(
        "$company_name",
        companyData.name
      );
    
      prompt = prompt.replaceAll("$event_name", eventName);
      prompt = prompt.replaceAll("$event_theme", eventTheme);
      prompt = prompt.replaceAll("$date", date);
    }


    
    prompt = prompt.replaceAll("$prospect_name", userData.name);
    prompt = prompt.replaceAll("$question", userData.Questions);
    prompt = prompt.replaceAll("$word_count", wordCount);
    prompt = prompt.replaceAll("$no_of_question",userData.numberOfEmails);
    prompt = prompt.replaceAll(
      "$additional_instructions",
      campaignGuidlines?.additionalInstructions
    );

    const json_format = newEmailPromptForBrandAwareness.json_format;

    const finalPrompt = `${prompt}.\nDo not include any explanations, only provide JSON response following this format without deviation.:\n ${json_format}\n The JSON response:`;

    console.log("finalPrompt", finalPrompt);
    const gptRes = await createThreadAndRunonKnowledgeBase(
      companyData._id,
      finalPrompt
    );

    return gptRes;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const createCampaign = async (name, prospectIds, companyId) => {
  try {
    const newCampaign = await Campaign.create({ name, prospectIds, companyId });
    return newCampaign._id;
  } catch (error) {
    return null;
  }
};

function sendCustomEmails(email, csvContent) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "faizamu19@gmail.com",
      pass: "oxeb ikre zmpc wukj",
    },
  });

  const mailOptions = {
    from: "faizamu19@gmail.com",
    to: email,
    subject: "Download Email Campaigns",
    text: `Please download the csv to get list of email campaigns`,
    attachments: [
      {
        filename: "emails.csv",
        content: csvContent,
      },
    ],
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
}

const generateCampaignEmails = async (
  prospects,
  campaignId,
  companyId,
  campaignGuidlines,
  userEmail
) => {
  let prospectIds = []

  const csvWriter = createObjectCsvWriter({
    path: "./tmp/emails.csv",
    header: [
      { id: "name", title: "Name" },
      { id: "title", title: "Title" },
      { id: "company", title: "Company" },
      { id: "email", title: "Email" },
      { id: "subject", title: "Subject" },
      { id: "body", title: "Body" },
    ],
  });

  const companyData = await Company.findOne({ _id: companyId });
  // const { assistantV2Id } = await isAssistantV2Exist(companyId);

  const generateEmailForProspect = async (prospect) => {
    const userId = await generateProspectId(prospect);
    prospectIds.push(userId);

    await generatePersona(userId, companyData);

    const email = await generateEmail(
      userId,
      companyData,
      campaignGuidlines
    );

    let result = [];
    email?.emails?.forEach((element) => {
      result.push({
        name: prospect.name,
        title: prospect.title,
        company: prospect?.companyName || "",
        email: prospect.email,
        subject: element.subject || "",
        body: element.body || "",
      });
    });
    
    return result;
    
  };

  const emails = await Promise.all(prospects.map(generateEmailForProspect));

  const flattenedEmails = emails.flat();

  await csvWriter.writeRecords(flattenedEmails);

  await Campaign.findByIdAndUpdate(campaignId, { prospectIds });

  const csvContent = fs.readFileSync("./tmp/emails.csv");
  await saveFileContent(`Campaign/${campaignId}`, "emails.csv", csvContent);

  // Send CSV to the user email address
   sendCustomEmails(userEmail, csvContent);

  console.log("Emails generated successfully");
};

const campaignEmailJson = async (campaignId) => {
  try {
    const localDir = `Campaign/${campaignId}`;
    const emailFile = await fetchFileFromS3(
      `Campaign/${campaignId}/emails.csv`,
      localDir
    );
    const jsonData = await csvToJson(emailFile);
    return jsonData;
  } catch (err) {
    console.log("Error fetching campaign emails from s3:", err);
    return null;
  }
};

module.exports = {
  saveProspects,
  generatePersona,
  generateProspectId,
  generateEmail,
  createCampaign,
  generateCampaignEmails,
  campaignEmailJson,
};
