const express = require("express");
const router = express.Router();
const axios = require("axios");
const { OpenAI } = require("openai");
const cheerio = require("cheerio");
const { s3 } = require("../utils/aws_helper");

const openaiapi = process.env.OPEN_API_KEY;

router.get("/", (req, res) => {
  res.send("<h1>Working fine!!!</h1>");
});
// For Customer About
router.post("/storeinfo", (req, res) => {
  const { key, otherData } = req.body;

  // Generate the S3 folder name from the company name
  const folderName = key.split("-"); // Replace spaces with hyphens

  let keyname = "";
  folderName.forEach((element) => {
    keyname += `${element}` + "/";
  });

  // Create or update the folder and JSON file in S3
  const s3Params = {
    Bucket: process.env.BUCKETNAME,
    Key: `${keyname}data.json`,
    Body: JSON.stringify(otherData),
    ContentType: "application/json",
  };

  s3.putObject(s3Params, (err) => {
    if (err) {
      console.error("Error storing data in S3:", err);
      res.status(500).json({ error: "Failed to store data in S3" });
    } else {
      console.log(`Data stored in S3 bucket`);
      res.json({ message: "Data stored in S3" });
    }
  });
});

// ... (previous code)

router.get("/getinfo/:key", (req, res) => {
  const keyName = req.params.key;

  // Generate the S3 folder name from the company name
  const folderName = keyName.split("-"); // Replace spaces with hyphens

  let keyname = "";
  folderName.forEach((element) => {
    keyname += `${element}` + "/";
  });

  const s3FolderKey = `${keyname}data.json`;

  const s3Params = {
    Bucket: process.env.BUCKETNAME,
    Key: s3FolderKey,
  };

  s3.getObject(s3Params, async (err, data) => {
    if (err) {
      console.error("Error getting data from S3:", err);
      res.status(500).json({ error: "Failed to retrieve data from S3" });
    } else {
      const jsonData = JSON.parse(await data.Body.transformToString());
      res.json(jsonData);
    }
  });
});

// ... (remaining code)

router.get("/getcompletedata/:company_name/:type", (req, res) => {
  const company = req.params.company_name;
  const type = req.params.type;
  const folderPath = `${company}`; // Replace with your folder path
  const params = { Bucket: process.env.BUCKETNAME, Prefix: folderPath };

  s3.listObjectsV2(params, (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Internal Server Error" });
    }

    const allData = {};
    const swotData = [];
    const marketposData = [];
    const servicesData = [];
    const productsData = [];
    const industriesData = [];
    const topClientData = [];
    const blogData = [];
    const userpersonaData = [];
    const aboutData = [];
    let count = 0;

    s3.getObject(
      {
        Bucket: process.env.BUCKETNAME,
        Key: `customers/${company}/data.json`,
      },
      async (err, data) => {
        if (err) {
          console.error("Error retrieving company details from S3:", err);
          res.status(500).send("Internal Server Error");
        } else {
          companyDetails = JSON.parse(await data.Body.transformToString());
        }
      }
    );

    // Loop through each object in the S3 bucket
    const contents = data.Contents ?? [];
    contents.forEach((obj) => {
      // Check if the object is a JSON file
      if (obj.Key.endsWith(".json")) {
        const getObjectParams = {
          Bucket: process.env.BUCKETNAME,
          Key: obj.Key,
        };

        // Get the content of the JSON file
        s3.getObject(getObjectParams, async (err, jsonData) => {
          if (err) {
            console.error(`Error reading ${obj.Key} from S3: ${err.message}`);
            return;
          }

          try {
            const parsedData = JSON.parse(await jsonData.Body.transformToString());

            // Extract the folder names
            const folderNames = obj.Key.split("/");
            const topLevelFolder = folderNames[1]; // Assuming the top level is Abiliti

            // Initialize an object for the top-level folder if not present
            if (!allData[topLevelFolder]) {
              allData[topLevelFolder] = {};
            }

            // Add parsed data to the result object

            allData[topLevelFolder][folderNames[2]] = parsedData;

            count++;
            if (type == "swotanalysis" && folderNames[2] == "swotanalysis") {
              if (topLevelFolder != undefined && topLevelFolder == "customer") {
                swotData.push({
                  id: 1,
                  title: companyDetails.company.name,
                  columnData: parsedData,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor1"
              ) {
                swotData.push({
                  id: 2,
                  title: companyDetails.competitors[0].name,
                  columnData: parsedData,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor2"
              ) {
                swotData.push({
                  id: 3,
                  title: companyDetails.competitors[1].name,
                  columnData: parsedData,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor3"
              ) {
                swotData.push({
                  id: 4,
                  title: companyDetails.competitors[2].name,
                  columnData: parsedData,
                });
              }
            }
            if (
              type == "marketpositioning" &&
              folderNames[2] == "marketpositioning"
            ) {
              if (topLevelFolder != undefined && topLevelFolder == "customer") {
                marketposData.push({
                  id: 1,
                  title: companyDetails.company.name,
                  columnData: parsedData,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor1"
              ) {
                marketposData.push({
                  id: 2,
                  title: companyDetails.competitors[0].name,
                  columnData: parsedData,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor2"
              ) {
                marketposData.push({
                  id: 3,
                  title: companyDetails.competitors[1].name,
                  columnData: parsedData,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor3"
              ) {
                marketposData.push({
                  id: 4,
                  title: companyDetails.competitors[2].name,
                  columnData: parsedData,
                });
              }
            }
            if (type == "services" && folderNames[2] == "services") {
              if (topLevelFolder != undefined && topLevelFolder == "customer") {
                servicesData.push({
                  id: 1,
                  title: companyDetails.company.name,
                  columnData: parsedData.services,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor1"
              ) {
                servicesData.push({
                  id: 2,
                  title: companyDetails.competitors[0].name,
                  columnData: parsedData.services,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor2"
              ) {
                servicesData.push({
                  id: 3,
                  title: companyDetails.competitors[1].name,
                  columnData: parsedData.services,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor3"
              ) {
                servicesData.push({
                  id: 4,
                  title: companyDetails.competitors[2].name,
                  columnData: parsedData.services,
                });
              }
            }
            if (type == "products" && folderNames[2] == "products") {
              if (topLevelFolder != undefined && topLevelFolder == "customer") {
                productsData.push({
                  id: 1,
                  title: companyDetails.company.name,
                  columnData: parsedData.products,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor1"
              ) {
                productsData.push({
                  id: 2,
                  title: companyDetails.competitors[0].name,
                  columnData: parsedData.products,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor2"
              ) {
                productsData.push({
                  id: 3,
                  title: companyDetails.competitors[1].name,
                  columnData: parsedData.products,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor3"
              ) {
                productsData.push({
                  id: 4,
                  title: companyDetails.competitors[2].name,
                  columnData: parsedData.products,
                });
              }
            }
            if (type == "industries" && folderNames[2] == "industries") {
              if (topLevelFolder != undefined && topLevelFolder == "customer") {
                industriesData.push({
                  id: 1,
                  title: companyDetails.company.name,
                  columnData: parsedData.industries,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor1"
              ) {
                industriesData.push({
                  id: 2,
                  title: companyDetails.competitors[0].name,
                  columnData: parsedData.industries,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor2"
              ) {
                industriesData.push({
                  id: 3,
                  title: companyDetails.competitors[1].name,
                  columnData: parsedData.industries,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor3"
              ) {
                industriesData.push({
                  id: 4,
                  title: companyDetails.competitors[2].name,
                  columnData: parsedData.industries,
                });
              }
            }
            if (type == "topclients" && folderNames[2] == "topclients") {
              if (topLevelFolder != undefined && topLevelFolder == "customer") {
                topClientData.push({
                  id: 1,
                  title: companyDetails.company.name,
                  columnData: parsedData.industries,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor1"
              ) {
                topClientData.push({
                  id: 2,
                  title: companyDetails.competitors[0].name,
                  columnData: parsedData.industries,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor2"
              ) {
                topClientData.push({
                  id: 3,
                  title: companyDetails.competitors[1].name,
                  columnData: parsedData.industries,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor3"
              ) {
                topClientData.push({
                  id: 4,
                  title: companyDetails.competitors[2].name,
                  columnData: parsedData.industries,
                });
              }
            }
            if (type == "blogdata" && folderNames[2] == "blogdata") {
              if (topLevelFolder != undefined && topLevelFolder == "customer") {
                blogData.push({
                  id: 1,
                  title: companyDetails.company.name,
                  columnData: parsedData,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor1"
              ) {
                blogData.push({
                  id: 2,
                  title: companyDetails.competitors[0].name,
                  columnData: parsedData,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor2"
              ) {
                blogData.push({
                  id: 3,
                  title: companyDetails.competitors[1].name,
                  columnData: parsedData,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor3"
              ) {
                blogData.push({
                  id: 4,
                  title: companyDetails.competitors[2].name,
                  columnData: parsedData,
                });
              }
            }
            if (type == "userpersona" && folderNames[2] == "userpersona") {
              if (topLevelFolder != undefined && topLevelFolder == "customer") {
                userpersonaData.push({
                  id: 1,
                  title: companyDetails.company.name,
                  columnData: parsedData.userPersona,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor1"
              ) {
                userpersonaData.push({
                  id: 2,
                  title: companyDetails.competitors[0].name,
                  columnData: parsedData.userPersona,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor2"
              ) {
                userpersonaData.push({
                  id: 3,
                  title: companyDetails.competitors[1].name,
                  columnData: parsedData.userPersona,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor3"
              ) {
                userpersonaData.push({
                  id: 4,
                  title: companyDetails.competitors[2].name,
                  columnData: parsedData.userPersona,
                });
              }
            }
            if (type == "about" && folderNames[2] == "about") {
              if (topLevelFolder != undefined && topLevelFolder == "customer") {
                aboutData.push({
                  id: 1,
                  title: companyDetails.company.name,
                  columnData: parsedData,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor1"
              ) {
                aboutData.push({
                  id: 2,
                  title: companyDetails.competitors[0].name,
                  columnData: parsedData,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor2"
              ) {
                aboutData.push({
                  id: 3,
                  title: companyDetails.competitors[1].name,
                  columnData: parsedData,
                });
              } else if (
                topLevelFolder != undefined &&
                topLevelFolder == "competitor3"
              ) {
                aboutData.push({
                  id: 4,
                  title: companyDetails.competitors[2].name,
                  columnData: parsedData,
                });
              }
            }
          } catch (parseError) {
            console.error(`Error parsing ${obj.Key}: ${parseError.message}`);
          }

          // If this is the last obfject, send the response
          if (count === contents.length || count === contents.length - 1) {
            if (type == "swotanalysis") {
              res.json(swotData);
            } else if (type == "marketpositioning") {
              res.json(marketposData);
            } else if (type == "services") {
              res.json(servicesData);
            } else if (type == "products") {
              res.json(productsData);
            } else if (type == "industries") {
              res.json(industriesData);
            } else if (type == "topclients") {
              res.json(topClientData);
            } else if (type == "blogdata") {
              res.json(blogData);
            } else if (type == "userpersona") {
              res.json(userpersonaData);
            } else if (type == "about") {
              res.json(aboutData);
            }
          }
        });
      }
    });
  });
});

router.post("/gptoutput", async (req, res) => {
  const { companyurl, prompt } = req.body;
  try {
    // const response = await axios.post(
    //   "https://api.openai.com/v1/engines/text-davinci-002/completions",
    //   {
    //     prompt: userInput,
    //     max_tokens: 500,
    //     temperature: 0.9, // You can adjust this as needed
    //   },
    //   {
    //     headers: {
    //       Authorization: `Bearer ${openaiapi}`,
    //       "Content-Type": "application/json",
    //     },
    //   }
    // );

    let scrapped_data = "";
    axios
      .get(companyurl, { responseType: "text" })
      .then(async function ({ data: html }) {
        const $ = cheerio.load(html);
        $("body")
          .find("*")
          .each(function async() {
            // Check if the element is a text node
            if (
              $(this).children().length === 0 &&
              scrapped_data.length < 8000
            ) {
              // Get the text content of the element
              scrapped_data += $(this).text(); /////////,
            }
          });

        const openai = new OpenAI({ apiKey: openaiapi });
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "user", content: `${prompt} based on ${scrapped_data}` },
          ],
        });

        res.json({
          message: completion.choices[0]?.message?.content,
        });
      })
      .catch(function (err) {
        console.log("error while parsing", err);
      });
  } catch (error) {
    console.error("Error while communicating with ChatGPT:", error);
  }
});

// Endpoint to handle POST requests with customer mapping data
router.post("/store-customer-data", (req, res) => {
  const customerData = req.body;

  // Create a unique folder name based on the company name
  const folderName = `customers/${customerData.company.name.replace(
    /\s/g,
    "-"
  )}`;

  // Create JSON string from the customer data
  const jsonData = JSON.stringify(customerData);

  // Set parameters for S3 upload
  const params = {
    Bucket: process.env.BUCKETNAME,
    Key: `${folderName}/data.json`,
    Body: jsonData,
    ContentType: "application/json",
  };

  // Upload data to S3
  s3.putObject(params, (err) => {
    if (err) {
      console.error("Error uploading data to S3:", err);
      res.status(500).send("Internal Server Error");
    } else {
      console.log("Data uploaded successfully:", params.Key);
      res.status(200).send("Data uploaded successfully");
    }
  });
});

// Endpoint to retrieve details of a specific company
router.get("/get-company-details/:companyName", (req, res) => {
  const companyName = req.params.companyName;

  const params = {
    Bucket: process.env.BUCKETNAME,
    Key: `customers/${companyName}/data.json`,
  };

  s3.getObject(params, async (err, data) => {
    if (err) {
      console.error("Error retrieving company details from S3:", err);
      res.status(500).send("Internal Server Error");
    } else {
      const companyDetails = JSON.parse(await data.Body.transformToString());
      res.status(200).json(companyDetails);
    }
  });
});

// Endpoint to retrieve all customer data
router.get("/get-all-customers", (req, res) => {
  const params = {
    Bucket: process.env.BUCKETNAME,
    Prefix: "customers/", // Prefix to filter objects within the "customers" "folder"
  };

  s3.listObjectsV2(params, (err, data) => {
    if (err) {
      console.error("Error retrieving customer data from S3:", err);
      res.status(500).send("Internal Server Error");
    } else {
      const customerData = (data.Contents ?? []).map((item) => {
        // Extract company name from the S3 key
        const companyName = item.Key.replace("customers/", "").replace(
          "/data.json",
          ""
        );

        // Return an object with company name and S3 URL
        return companyName;
      });

      res.status(200).json(customerData);
    }
  });
});

module.exports = router;
