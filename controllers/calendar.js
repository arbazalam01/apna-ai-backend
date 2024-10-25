const Relation = require("../models/Relation");
const Calendar = require("../models/Calendar");
const Company = require("../models/Company");
const Persona = require("../models/Persona");
const { google } = require("googleapis");
const {
  Calendarprompt,
  Calendarpromptv1,
  Calendarprompt_of_Brandawareness_and_ThoughtLeadership,
  Calendarprompt_of_ProductEngagement_and_ProductAwareness,
  IncludetypeofContent,
  IncludeProduct,
  IncludeService,
  IncludePersona,
  IncludeKPI,
  IncludeThemes,
  IncludeMotivation,
  IncludeAdditional,
  IncludePainPoints,
  Platform,
  BrandAwarenessCalendar,
  Themes,
} = require("../lib/function_calling");
const { createObjectCsvWriter } = require("csv-writer");
const {
  isAssistantExist,
  dateFormatter,
  isAssistantV2Exist,
} = require("../utils/company_helper");
const {
  runSinglePrompt,
  createThreadAndRun,
  createThreadAndRunonKnowledgeBase,
} = require("../utils/openai_helper");
const { saveFileContent, fetchFileFromS3 } = require("../utils/aws_helper");
const { json } = require("body-parser");
const fs = require("fs");
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

const calendar = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { type } = req.query;

    let query = { companyId };

    if (type === "competitor") {
      query = { competitorsId: companyId };
    } else if (type === "industryLeader") {
      query = { industryLeaderId: companyId };
    }
    const userpersona = await Persona.find({ companyId: companyId });
    const allCompanies = await Relation.find(query)
      .populate(
        "companyId",
        "name websiteUrl industries products services swotanalysis marketposition"
      )
      .populate("competitorsId", "name websiteUrl industries toptrends");

    res.json({ data: allCompanies, persona: userpersona });
  } catch (err) {
    res.json({ message: err.message });
  }
};

async function _getGoogleSheetClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const authClient = await auth.getClient();
  return google.sheets({
    version: "v4",
    auth: authClient,
  });
}

async function overRideData(data, sheetName) {
  const googleSheetClient = await _getGoogleSheetClient();

  // Check if the sheet exists
  const sheetExists = await _checkSheetExists(googleSheetClient, sheetName);

  if (!sheetExists) {
    // If the sheet does not exist, create it
    await googleSheetClient.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      },
    });
  }

  // Header row
  const headerRow = [
    "weekNo",
    "Date",
    "Platform",
    "ContentType",
    "Theme",
    "Topic",
    "ContentDetail",
    "Objective",
  ];

  // Map data to rows
  const dataRows = data.map((obj) => [
    obj.weekNo,
    obj.Date,
    obj.Platform,
    obj.ContentType,
    obj.Theme,
    obj.Topic,
    obj.ContentDetail,
    obj.Objective,
  ]);

  // Combine header row with data rows
  const resultArray = [headerRow, ...dataRows];

  console.log("resultArray", resultArray);

  // Append data to the specified sheet
  await googleSheetClient.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:H`, // Specify the sheet name
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    resource: {
      majorDimension: "ROWS",
      values: resultArray,
    },
  });
}

async function _checkSheetExists(googleSheetClient, sheetName) {
  const { data } = await googleSheetClient.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });

  const sheets = data.sheets.map((sheet) => sheet.properties.title);

  return sheets.includes(sheetName);
}

//Create content calendar
const createCalendar = async (req, res) => {
  try {
    const item = req.body;

    const company = await Company.findById(item.companyId);
    let userPersona = null;
    if (item.userPersona.length) {
      userPersona = await Persona.findById(item?.userPersona);
    }

    let products = "";
    item.products.forEach((val) => {
      products += val + ",";
    });

    let services = "";
    item.services.forEach((val, index) => {
      index != item.services.length - 1
        ? (services += val + ",")
        : (services += val);
    });

    let themes = "";
    item.themes.forEach((val, index) => {
      index != item.themes.length - 1 ? (themes += val + ",") : (themes += val);
    });

    let platforms = "";
    item.platforms.forEach((val, index) => {
      index != item.platforms.length - 1
        ? (platforms += val + ",")
        : (platforms += val);
    });

    try {
      // const companyData = await isAssistantV2Exist(item.companyId);

      // const { assistantV2Id } = companyData;

      item.startDate = dateFormatter(item.startDate);
      item.endDate = dateFormatter(item.endDate);
      let personasAttribute = [];

      let prompt = Calendarpromptv1.Prompt.replace(
        "$company_name",
        company.name
      )
        .replace("$start_date", item.startDate)
        .replace("$end_date", item.endDate)
        .replace(
          "$awarenessPercent",
          item.contentObjectivesDistribution.awarenessPercent
        )
        .replace(
          "$engagementPercent",
          item.contentObjectivesDistribution.engagementPercent
        )
        .replace(
          "$thoughtLeadPercent",
          item.contentObjectivesDistribution.thoughtLeadPercent
        );

      if (item.products.length) {
        prompt += IncludeProduct;
        prompt = prompt.replace("$product", products);
      }
      if (item.services.length) {
        prompt += IncludeService;
        prompt = prompt.replace("$service", services);
      }
      if (item.userPersona.length) {
        prompt += IncludePersona;
        prompt = prompt.replace("$user_persona", userPersona?.name);
      }
      if (item.KPI.length) {
        prompt += IncludeKPI;
        prompt = prompt.replace("$KPI", item.KPI);
        personasAttribute.push("KPIs");
      }
      if (item.Motivation.length) {
        prompt += IncludeMotivation;
        prompt = prompt.replace("$Motivation", item.Motivation);
        personasAttribute.push("Motivations");
      }

      if (item.PainPoints.length) {
        prompt += IncludePainPoints;
        prompt = prompt.replace("$PainPoints", item.PainPoints);
        personasAttribute.push("Pain Points");
      }

      if (item.additionalInstructions.length) {
        prompt += IncludeAdditional;
        prompt = prompt.replace("$otherDetails", item.additionalInstructions);
      }

      if (item.platforms.length) {
        prompt += IncludetypeofContent;
        prompt = prompt.replace("$platforms", platforms);
      }

      if (item.themes.length) {
        prompt += IncludeThemes;
        prompt = prompt.replace("$themes", themes);
      }

      prompt += Platform;

      if (item.userPersona.length) {
        let markdownContent = ` Persona for ${userPersona.name}\n\n`;

        markdownContent += ` age\n${userPersona.age}\n\n`;
        markdownContent += `jobdescription\n${userPersona.jobdescription}\n\n`;
        markdownContent += `yopofexperience\n${userPersona.yopofexperience}\n\n`;
        markdownContent += `gender\n${userPersona.gender}\n\n`;

        // Add Motivations section
        markdownContent += "## Motivations\n";
        userPersona.Motivations.forEach((motivation) => {
          markdownContent += `- ${motivation}\n`;
        });
        markdownContent += "\n";

        // Add KPIs section
        markdownContent += "## KPIs\n";
        userPersona.KPIs.forEach((kpi) => {
          markdownContent += `- ${kpi}\n`;
        });
        markdownContent += "\n";

        prompt += markdownContent;
      }

      let changed_prompt = {
        ...Calendarprompt,
        prompt: prompt,
      };

      console.log("prompt", prompt);

      // let jsonData = await runSinglePrompt(
      //   assistantId,
      //   threadId,
      //   changed_prompt
      // );

      const finalPrompt = `${changed_prompt.prompt}\nDo not include any explanations, only provide JSON response following this format without deviation.:\n ${changed_prompt.json_format}\n The JSON response:`;

      let jsonData = await createThreadAndRunonKnowledgeBase(
        item.companyId,
        finalPrompt
      );

      jsonData.calendar.forEach((val) => {
        let formatted_date = dateFormatter(val.Date);
        val.Date = formatted_date;
      });

      console.log("gptoutput", jsonData.calendar);

      const newCalendarInput = new Calendar({
        ...req.body,
        companyId: item.companyId,
        gptoutput: jsonData.calendar,
        platforms: item.platforms,
        personasAttribute: personasAttribute,
      });
      const savedCalendarInput = await newCalendarInput.save();

      await uploadCalendar(savedCalendarInput._id);

      //await overRideData(jsonData.calendar, `${item.userPersona}'s Calendar`);

      res.status(200).json({
        message: `Added calendar with data as: ${savedCalendarInput}`,
      });
    } catch (error) {
      console.log(error);
      res.json({ error: error });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

async function processPersonas(data) {
  try {
    const targetPersonas = [];

    // Fetch all personas concurrently
    const personaPromises = data.selectedPersonas?.map((personaId) =>
      Persona.findById(personaId)
    );
    const personas = await Promise.all(personaPromises);

    // Process each persona
    personas.forEach((userPersona, index) => {
      const personaId = data.selectedPersonas[index];

      // Check if the persona data exists before accessing its properties
      if (
        userPersona &&
        (data.Objective == "Product Engagement" ||
          data.Objective == "Product Awareness")
      ) {
        // Process pain points
        if (data.PainPoints && data.PainPoints[personaId]) {
          data.PainPoints[personaId].forEach((painPoint) => {
            if (painPoint.length) {
              targetPersonas.push({
                Persona_name: userPersona.name,
                Persona_attribute: "Painpoint",
                attribute_value: painPoint,
                designation: userPersona.designation,
              });
            }
          });
        }

        // Process motivations
        if (data.Motivations && data.Motivations[personaId]) {
          data.Motivations[personaId].forEach((motivation) => {
            if (motivation.length) {
              targetPersonas.push({
                Persona_name: userPersona.name,
                Persona_attribute: "Motivation",
                attribute_value: motivation,
                designation: userPersona.designation,
              });
            }
          });
        }

        // Process KPIs
        if (data.KPIs && data.KPIs[personaId]) {
          data.KPIs[personaId].forEach((Kpi) => {
            if (Kpi.length) {
              targetPersonas.push({
                Persona_name: userPersona.name,
                Persona_attribute: "KPI",
                attribute_value: Kpi,
                designation: userPersona.designation,
              });
            }
          });
        }
      } else if (userPersona && data.Objective == "Brand Awareness") {
        targetPersonas.push({
          Persona_name: userPersona.name,
          designation: userPersona.designation,
        });
      } else {
        console.warn(`Persona not found for ID: ${personaId}`);
      }
    });

    return targetPersonas;
  } catch (error) {
    console.error("Error processing personas:", error);
  }
}

const createCalendarV2 = async (req, res) => {
  try {
    const item = req.body;
    console.log("item", item);

    const companyId = item.companyId;
    const company = await Company.findById(companyId);
    const Personas = item.selectedPersonas;

    try {
      // const companyData = await isAssistantV2Exist(companyId);
      delete item.companyId;

      // const { assistantV2Id } = companyData;

      item.startDate = dateFormatter(item.startDate);
      item.endDate = dateFormatter(item.endDate);
      let prompt = "";

      if (
        item.Objective == "Brand Awareness" ||
        item.Objective == "Thought Leadership"
      ) {
        prompt =
          Calendarprompt_of_Brandawareness_and_ThoughtLeadership.Prompt.replace(
            "$company_name",
            company.name
          );

        const result = await processPersonas(item);

        delete item.selectedPersonas;
        item.targetPersonas = result;

        prompt += "\n";
        prompt += JSON.stringify(item);
        prompt += "\n";
      } else if (
        item.Objective == "Product Engagement" ||
        item.Objective == "Product Awareness"
      ) {
        prompt =
          Calendarprompt_of_ProductEngagement_and_ProductAwareness.Prompt.replace(
            "$company_name",
            company.name
          );

        const result = await processPersonas(item);

        delete item.KPIs;
        delete item.Motivations;
        delete item.PainPoints;
        delete item.selectedPersonas;
        item.targetPersonas = result;

        prompt += "\n";
        prompt += JSON.stringify(item);
        prompt += "\n";
      }

      let userPersona = null;

      for (const val of Personas) {
        userPersona = await Persona.findById(val);

        let markdownContent = ` Persona for ${userPersona.name}\n\n`;

        markdownContent += ` age :-${userPersona.age}\n\n`;
        markdownContent += `jobdescription:-${userPersona.jobdescription}\n\n`;
        markdownContent += `yopofexperience:-${userPersona.yopofexperience}\n\n`;
        markdownContent += `gender:-${userPersona.gender}\n\n`;

        // Add Motivations section
        markdownContent += "## Motivations\n";
        userPersona.Motivations.forEach((motivation) => {
          markdownContent += `- ${motivation}\n`;
        });
        markdownContent += "\n";

        // Add KPIs section
        markdownContent += "## KPIs\n";
        userPersona.KPIs.forEach((kpi) => {
          markdownContent += `- ${kpi}\n`;
        });
        markdownContent += "\n";

        // Add KPIs section
        markdownContent += "## PainPoints\n";
        userPersona.PainPoints.forEach((painpoint) => {
          markdownContent += `- ${painpoint}\n`;
        });
        markdownContent += "\n";

        prompt += markdownContent;
        prompt += "\n";
      }

      prompt += Platform;

      let changed_prompt = {};

      if (
        item.Objective == "Brand Awareness" ||
        item.Objective == "Thought Leadership"
      ) {
        changed_prompt = {
          ...Calendarprompt_of_Brandawareness_and_ThoughtLeadership,
          prompt: prompt,
        };
      } else if (
        item.Objective == "Product Engagement" ||
        item.Objective == "Product Awareness"
      ) {
        changed_prompt = {
          ...Calendarprompt_of_ProductEngagement_and_ProductAwareness,
          prompt: prompt,
        };
      }

      const finalPrompt = `${changed_prompt.prompt}\n Do not include any explanations, only provide JSON response following this format without deviation.:\n ${changed_prompt.json_format}\n The JSON response:`;

      console.log("finalprompt", finalPrompt);

      let jsonData = await createThreadAndRunonKnowledgeBase(
        companyId,
        finalPrompt
      );

      console.log("jsonData", jsonData);

      jsonData.calendar?.forEach((val) => {
        let formatted_date = dateFormatter(val.Date);
        val.Date = formatted_date;
      });

      console.log("gptoutput", jsonData.calendar);

      const newCalendarInput = new Calendar({
        startDate: item.startDate,
        endDate: item.endDate,
        companyId: companyId,
        gptoutput: jsonData.calendar,
        objective: item.Objective,
        products: Array.isArray(item.product) ? item.product : [item.product],
      });
      const savedCalendarInput = await newCalendarInput.save();

      await uploadCalendar(savedCalendarInput._id);

      //await overRideData(jsonData.calendar, `${item.userPersona}'s Calendar`);

      res.status(200).json({
        message: `Added calendar with data as: ${savedCalendarInput}`,
      });
    } catch (error) {
      console.log(error);
      res.json({ error: error });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCalendarV3 = async (req, res) => {
  try {
    const {
      contentMix,
      contentformat,
      start_date,
      end_date,
      themes,
      companyId,
    } = req.body;

    const company = await Company.findById(companyId);

    try {
      // Format the start and end dates
      const formattedStartDate = dateFormatter(start_date);
      const formattedEndDate = dateFormatter(end_date);

      // Prepare themes list
      const formattedThemes = themes
        .map((theme, index) => `${index + 1}) ${theme}`)
        .join("\n");

      // Prepare content formats list
      const formattedContentFormats = contentformat.length
        ? contentformat.join(", ")
        : "No specific formats provided";

      // Prepare content mix details
      const formattedContentMix = Object.entries(contentMix)
        .map(
          ([theme, formats]) =>
            `  Theme: ${theme}\n${Object.entries(formats)
              .map(([format, quantity]) => `  Numbers of ${format}: ${quantity}`)
              .join("\n")}`
        )
        .join("\n\n");

      finalPrompt = BrandAwarenessCalendar.prompt.replaceAll(
        "$company_name",
        company.name
      );
      finalPrompt = finalPrompt.replaceAll("$start_date", formattedStartDate);
      finalPrompt = finalPrompt.replaceAll("$end_date", formattedEndDate);
      finalPrompt = finalPrompt.replaceAll("$contentmix", formattedContentMix);
      finalPrompt = finalPrompt.replaceAll(
        "$contentformat",
        formattedContentFormats
      );
      finalPrompt = finalPrompt.replaceAll("$themes", formattedThemes);
      finalPrompt = finalPrompt.replaceAll("$company_name", company.name);

      const final = `${finalPrompt}\n Do not include any explanations, only provide JSON response following this format without deviation.:\n ${BrandAwarenessCalendar.json_format}\n The JSON response:`;


      console.log("final",final);

      // Call the GPT function
      let jsonData = await createThreadAndRunonKnowledgeBase(
        companyId,
        final
      );
      console.log("jsonData", jsonData);

      // Format the dates in the calendar output
      jsonData.calendar?.forEach((val) => {
        val.Date = dateFormatter(val.Date);
      });

      console.log("GPT Output:", jsonData.calendar);

      // Save the new calendar
      const newCalendarInput = new Calendar({
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        companyId: companyId,
        gptoutput: jsonData.calendar,
        objective: "Brand Awareness",
        themes: themes,
      });
      const savedCalendarInput = await newCalendarInput.save();

      // Upload the calendar
      await uploadCalendar(savedCalendarInput._id);

      // Send success response
      res.status(200).json({
        message: `Added calendar with data: ${savedCalendarInput}`,
      });

    } catch (error) {
      console.error("Error in processing:", error);
      res.status(500).json({ error: error.message });
    }
  } catch (error) {
    console.error("Error in fetching company:", error);
    res.status(500).json({ message: error.message });
  }
};


// Update an existing calendar input by ID
const updateCalendarInput = async (req, res) => {
  try {
    const updatedCalendarInput = await Calendar.findByIdAndUpdate(
      req.params.calendarId,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedCalendarInput);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific calendar input by ID
const getCalendarInput = async (req, res) => {
  const calendarId = req.query.calendarId;
  console.log("calendarId", calendarId);
  try {
    const calendarInput = await Calendar.findById(calendarId);
    if (!calendarInput) {
      res.status(404).json({ message: "Calendar input not found" });
      return;
    }
    let userPersona = null;
    if (calendarInput.userPersona.length) {
      userPersona = await Persona.findById(calendarInput?.userPersona);
    }

    res.status(200).json({
      ...calendarInput._doc,
      userPersona: `${userPersona.designation} in ${userPersona.businessfunction}`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a list of calendars of a company
const getAllCalendarsByCompany = async (req, res) => {
    try {
      const calendarInput = await Calendar.find({
        companyId: req.params.companyId,
      });
  
      if (!calendarInput || calendarInput.length === 0) {
        res.status(404).json({ message: "Calendar input not found" });
        return;
      }
  
      // Sort the calendars based on startDate in descending order
      calendarInput.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  
      // Transform the data into the desired structure
      let calendarData=[];
  
      calendarInput.forEach((calendar) => {
        let content = [];
        calendarData.push({
          CampaignId: calendar._id
        })
        calendar.gptoutput.forEach((entry) => {
          // Format the date as "Day, DD Month YYYY"
          const formattedDate = new Date(entry.Date).toLocaleDateString('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
  
          // Find if the date already exists in the content array
          let existingDateEntry = content.find((item) => item.date === formattedDate);
  
          // Create a new platform entry
          const platformEntry = {
            platform: entry.Platform,
            Title: entry.Topic || " ",
            Theme: entry.ContentDetail || "",
            
          };
  
          // If the date already exists, push the platform entry to its platforms array
          if (existingDateEntry) {
            existingDateEntry.platforms.push(platformEntry);
          } else {
            // Otherwise, create a new date entry with the platform entry
            content.push({
              date: formattedDate,
              platforms: [platformEntry],
            });
          }
        });
        calendarData[calendarData.length - 1].content = content;
      });
  
      // Send the response
      res.status(200).json(calendarData);
    } catch (error) {
      console.error("Error fetching calendars:", error);
      res.status(500).json({ message: error.message });
    }
};

// Delete a specific calendar input by ID
const deleteCalendarInput = async (req, res) => {
  const calendarId = req.query.calendarId;
  console.log("calendarId", calendarId);
  try {
    const deletedCalendarInput = await Calendar.findByIdAndDelete(calendarId);
    if (!deletedCalendarInput) {
      res.status(404).json({ message: "Calendar input not found" });
      return;
    }
    res.status(200).json({ message: "Calendar input deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCalendarData = async (req, res) => {
  try {
    let { dateStart, dateEnd } = req.query;
    const { companyId } = req.params;

    // Validate dateStart and dateEnd inputs
    if (!dateStart || !dateEnd) {
      return res.status(400).json({
        message: "Both dateStart and dateEnd are required query parameters.",
      });
    }

    dateStart = dateFormatter(dateStart);
    dateEnd = dateFormatter(dateEnd);

    console.log("dateStart", dateStart);
    console.log("dateEnd", dateEnd);

    try {
      // Query the database to find calendars with dates between dateStart and dateEnd and matching companyId
      const calendars = await Calendar.find({
        startDate: { $gte: dateStart },
        endDate: { $lte: dateEnd },
        companyId: companyId,
      });

      let temp = [];

      calendars.forEach((val) => {
        val.gptoutput.forEach((item) => {
          let value = item;
          temp.push({ value });
        });
      });

      res.json({ calendars: temp });
    } catch (err) {
      console.error("Error fetching calendar data:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  } catch (err) {
    console.error("Error fetching calendar data:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const uploadCalendar = async (calendarId) => {
  try {
    const csvPath = './tmp/calendar.csv';

    // Create a CSV writer instance
    const csvWriter = createObjectCsvWriter({
      path: csvPath,
      header: [
        { id: 'Date', title: 'Date' },
        { id: 'Platform', title: 'Platform' },
        { id: 'ContentType', title: 'ContentType' },
        { id: 'Theme', title: 'Theme' },
        { id: 'Topic', title: 'Topic' },
        { id: 'ContentDetail', title: 'ContentDetail' },
        { id: 'Objective', title: 'Objective' },
        { id: 'TargetPersona', title: 'TargetPersona' },
      ],
    });

    // Fetch the calendar by ID
    const calendar = await Calendar.findById(calendarId);
    if (!calendar || !calendar.gptoutput) {
      throw new Error('Calendar data not found or gptoutput is empty.');
    }

    // Prepare records for the CSV writer
    const records = calendar.gptoutput.map((event) => ({
      Date: event.Date,
      Platform: event.Platform,
      ContentType: event.ContentType,
      Theme: event.Theme,
      Topic: event.Topic,
      ContentDetail: event.ContentDetail,
      Objective: event.Objective,
      TargetPersona: event.TargetPersona,
    }));

    // Write records to the CSV file
    await csvWriter.writeRecords(records);
    console.log('CSV file written successfully.');

    // Read the CSV content
    const csvContent = await fs.readFile(csvPath);
    
    // Save the CSV content to a persistent location
    await saveFileContent(`CalendarCampaign/${calendarId}`, 'calendar.csv', csvContent);

    fs.unlinkSync(csvPath);

    console.log('Temporary CSV file removed successfully.');
  } catch (err) {
    console.error('Error uploading calendar data:', err);
  }
};

const downloadCalendar = async (req, res) => {
  const { calendarId } = req.query;
  const s3FilePath = `CalendarCampaign/${calendarId}/calendar.csv`;
  const localDir = `CalendarCampaign/${calendarId}`;
  const downloadedFile = await fetchFileFromS3(s3FilePath, localDir);
  res.download(downloadedFile);
};

const getSummaryData = async (req, res) => {
  const { calendarId } = req.query;

  try {
    const data = await Calendar.findById(calendarId);

    const contentMix = [];
    const personaSet = new Set();

    const contentTypeMap = data.gptoutput.reduce((acc, entry) => {
      const { ContentType, Product, TargetPersona } = entry;
      if (!acc[ContentType]) {
        acc[ContentType] = {
          count: 0,
          productCounts: [0, 0],
          personaCounts: {},
        };
      }

      acc[ContentType].count += 1;
      const productIndex = data.products.indexOf(Product);
      if (productIndex > -1) {
        acc[ContentType].productCounts[productIndex] += 1;
      }

      if (!acc[ContentType].personaCounts[TargetPersona]) {
        personaSet.add(TargetPersona);
        acc[ContentType].personaCounts[TargetPersona] = 0;
      }
      acc[ContentType].personaCounts[TargetPersona] += 1;

      return acc;
    }, {});

    for (const [contentType, details] of Object.entries(contentTypeMap)) {
      contentMix.push({
        name: contentType,
        count: details.count,
        productCounts: details.productCounts,
        personaCounts: Object.values(details.personaCounts),
      });
    }

    let response = {
      contentMix,
      startDate: data.startDate,
      endDate: data.endDate,
      products: data.products,
      persona: Array.from(personaSet),
    };

    console.log("response", response);

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getThemes = async (req, res) => {
  const { segment, companyId } = req.body;
  try {
    const company = await Company.findById(companyId);
    

    
    let prompt = Themes.prompt.replaceAll("$company_name", company.name);

    prompt = prompt.replaceAll("$segment", segment);

    const finalPrompt = `${prompt}\n Do not include any explanations, only provide JSON response following this format without deviation.:\n ${Themes.json_format}\n The JSON response:`;

    console.log("finalprompt", finalPrompt);

    let jsonData = await createThreadAndRunonKnowledgeBase(
      companyId,
      finalPrompt
    );

    res.status(200).json(jsonData);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  calendar,
  updateCalendarInput,
  getCalendarInput,
  deleteCalendarInput,
  getAllCalendarsByCompany,
  createCalendar,
  createCalendarV2,
  createCalendarV3,
  getCalendarData,
  downloadCalendar,
  getSummaryData,
  getThemes
};
