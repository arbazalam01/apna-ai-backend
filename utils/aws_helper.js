const AWS = require("aws-sdk");
const Company = require("../models/Company");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

const s3 = new AWS.S3();
const defaultBucket = process.env.BUCKETNAME;

let directoryLock = false;

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

// Function to ensure directory exists
const ensureDirectoryExists = async (directoryPath) => {
  if (!directoryLock) {
    directoryLock = true; // Acquire lock
    try {
      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }
    } finally {
      directoryLock = false; // Release lock
    }
  } else {
    // Wait and try again if another invocation is creating the directory
    await new Promise((resolve) => {
      setTimeout(resolve, 100); // Wait for 100ms
    });
    await ensureDirectoryExists(directoryPath); // Retry
  }
};

// Helper function to split buffer into chunks
function splitArrayBuffer(buffer, chunkSize) {
  const chunks = [];
  for (let i = 0; i < buffer.length; i += chunkSize) {
    chunks.push(buffer.slice(i, i + chunkSize));
  }
  return chunks;
}
const fetchMultipleFileFromS3 = async (key, bucketName = defaultBucket) => {
  try {
    const getObjectParams = {
      Bucket: bucketName,
      Key: `${key}/CONSOLIDATED_WEBSITE.md`,
    };
    const downloadStream = s3.getObject(getObjectParams).createReadStream();

    const chunks = [];
    let totalLength = 0;

    downloadStream.on("data", (chunk) => {
      chunks.push(chunk);
      totalLength += chunk.length;
    });

    return new Promise((resolve, reject) => {
      downloadStream.on("end", async () => {
        let chunkSize = 70 * 1024; // 50 KB
        // if (totalLength <= 250 * 1024) {
        // If total size is less than or equal to 250 KB, create a single chunk
        //  chunkSize = 50 * 1024; // 50 KB

        // } else {
        // If total size is more than 250 KB, divide into 5 equal parts
        //   chunkSize = Math.ceil(totalLength / 5);
        // }

        // calculate total number of files based on chunkSize

        let noOfFiles = Math.ceil(totalLength / chunkSize);

        if (noOfFiles > 12) {
          chunkSize = Math.ceil(totalLength / 12);
        }

        const chunkedContents = splitArrayBuffer(
          Buffer.concat(chunks),
          chunkSize
        );

        const directoryPath = `./tmp/${key}`;
        ensureDirectoryExists(directoryPath);

        const filePaths = [];
        for (let i = 0; i < chunkedContents.length; i++) {
          const filePath = `${directoryPath}/${key}_${i + 1}.md`;
          await fs.promises.writeFile(filePath, chunkedContents[i]);
          filePaths.push(filePath);
        }

        console.log("File divided and saved successfully.");
        resolve(filePaths);
      });

      downloadStream.on("error", (err) => {
        console.error("Error downloading file from S3:", err);
        reject(err);
      });
    });
  } catch (error) {
    console.error("Error fetching and dividing file from S3:", error);
  }
};

const fetchFileFromS3 = async (key, localDir, bucketName = defaultBucket) => {
  const localPath = path.join("./tmp", localDir, key);

  try {
    await mkdir(path.dirname(localPath), { recursive: true });

    const getObjectParams = {
      Bucket: bucketName,
      Key: key,
    };

    let data;
    try {
      data = await s3.getObject(getObjectParams).promise();
    } catch (s3Error) {
      console.log("Error fetching file from S3:", s3Error);
      return null;
    }

    if (!data.Body || data.Body.length === 0) {
      console.log("File is empty");
      return null;
    }

    await writeFile(localPath, data.Body);
    console.log("File downloaded successfully.");
    return localPath;
  } catch (error) {
    console.log("Error in file operation:", error);
    return null;
  }
};

const fetchDataFromS3 = async (folder,file) => {
  try {
    const bucketName = defaultBucket;
    const key = `${folder}/${file}`;

    console.log("key",key);

    const getObjectParams = {
      Bucket: bucketName,
      Key: key,
    };
    const data = await s3.getObject(getObjectParams).promise();
    return data;
  } catch (error) {
    console.error("Error fetching data from S3 in fetchDataFromS3:", error);
    return null;
  }
};

const deleteDirectory = async (directoryPath) => {
  try {
    await fs.rm(directoryPath, { recursive: true, force: true });
    console.log(`Directory '${directoryPath}' deleted successfully.`);
  } catch (error) {
    console.error(`Error deleting directory '${directoryPath}':`, error);
    throw error;
  }
};
const deleteFile = async (filePath) => {
  console.log("File Path-->", filePath);
  try {
    // Check if the file exists
    // Check if the file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error("File does not exist");
        return;
      }

      // Delete the file
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
          return;
        }
        console.log("File deleted successfully");
      });
    });
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error("File does not exist");
    } else {
      console.error("Error deleting file:", err);
    }
  }
};

const saveFileContent = async (folderName, fileName, content) => {
  console.log("SAVING TO S3", folderName, fileName);
  try {
    // Construct the full path for the file
    const filePath = `${folderName}/${fileName}`;

    const utf8EncodedContent = Buffer.from(content, "utf-8");

    // Save the content to the file in S3
    await s3
      .putObject({
        Body: utf8EncodedContent,
        Bucket: defaultBucket,
        Key: filePath,
      })
      .promise();

    console.log("Content saved successfully to", filePath);
    return `Content saved successfully to ${fileName}!`;
  } catch (error) {
    console.error("An error occurred while saving content:", error);
    return `An error occurred while saving content: ${error.message}`;
  }
};

const isFileExistS3 = async (key, bucketName = defaultBucket) => {
  try {
    const headObjectParams = {
      Bucket: bucketName,
      Key: key,
    };
    const { Metadata } = await s3.headObject(headObjectParams).promise();
    console.log("Metadata:", Metadata);
    return Metadata;
  } catch (error) {
    console.error("Error checking if file exists in S3 in isFileExistS3:", error);
    return null;
  }
};

const deleteFileFromS3 = async (bucketName, fileKey) => {
  const params = {
    Bucket: bucketName,
    Key: fileKey,
  };

  s3.deleteObject(params, function (err, data) {
    if (err) {
      console.log("Error deleting file:", err.message);
    } else {
      console.log("Successfully deleted file from bucket");
    }
  });
};

const uploadFileToS3 = async (bucketName, filePath, content) => {
  const params = {
    Bucket: bucketName,
    Key: filePath,
    Body: content,
    ContentType: "text/markdown",
  };

  s3.upload(params, function (err, data) {
    if (err) {
      console.log("Error uploading data: ", err);
    } else {
      console.log("Successfully uploaded data to " + data.Location);
    }
  });
};

const createCompanyReport = async (companyId) => {
  try {
    // Retrieve the company from the database
    const company = await Company.findById(companyId);

    // Start building the Markdown content
    let markdownContent = `# Company Report for ${company.name}\n\n`;

    // About

    markdownContent += `## About\n${company?.about.description || "N/A"}\n\n`;
    markdownContent += `## Mission\n${company.about?.mission || "N/A"}\n\n`;

    // Industry of the company
    markdownContent += `## Industry\n${
      company?.proxycurl?.industry || "N/A"
    }\n\n`;

    // Industries served by the company
    markdownContent += `## Industries Served\n${company.industries.join(
      ", "
    )}\n\n`;

    // Top Clients of the company
    markdownContent += `## Top Clients\n${company.topclients.join(", ")}\n\n`;

    // Top SEOs of the company
    markdownContent += `## Top SEOs\n${company.topseos.join(", ")}\n\n`;

    // Company Specialities
    markdownContent += `## Specialities\n${company?.proxycurl?.specialities.join(
      ", "
    )}\n\n`;

    // Tagline of the company
    markdownContent += `## Tagline\n${company?.proxycurl?.tagline}\n\n`;

    // Products
    markdownContent += `## Products\n`;
    company.products.forEach((product) => {
      markdownContent += `- ${product.name}: ${product.description}\n`;
    });
    markdownContent += `\n`;

    // Services
    markdownContent += `## Services\n`;
    company.services.forEach((service) => {
      markdownContent += `- ${service.name}: ${service.description}\n`;
    });
    markdownContent += `\n`;

    // Summary
    markdownContent += `## Summary\n${company.summary || "N/A"}\n\n`;

    // SWOT Analysis
    markdownContent += `## SWOT Analysis\n`;
    markdownContent += `### Strengths\n`;
    company.swotanalysis.strengths.forEach((item) => {
      markdownContent += `- ${item.name}: ${item.description}\n`;
    });
    markdownContent += `### Weaknesses\n`;
    company.swotanalysis.weaknesses.forEach((item) => {
      markdownContent += `- ${item.name}: ${item.description}\n`;
    });
    markdownContent += `### Opportunities\n`;
    company.swotanalysis.opportunities.forEach((item) => {
      markdownContent += `- ${item.name}: ${item.description}\n`;
    });
    markdownContent += `### Threats\n`;
    company.swotanalysis.threats.forEach((item) => {
      markdownContent += `- ${item.name}: ${item.description}\n`;
    });
    markdownContent += `\n`;

    // Market Positioning
    markdownContent += `## Market Positioning\n`;
    markdownContent += `### Core Purpose\n`;
    company.marketposition.corepurpose.forEach((item) => {
      markdownContent += `- ${item.name}: ${item.description}\n`;
    });

    markdownContent += `### Positioning\n`;
    company.marketposition.positioning.forEach((item) => {
      markdownContent += `- ${item.name}: ${item.description}\n`;
    });

    markdownContent += `### Key Differentiators\n`;
    company.marketposition.keydifferentiators.forEach((item) => {
      markdownContent += `- ${item.name}: ${item.description}\n`;
    });

    markdownContent += `### BrandPersonality\n`;
    company.marketposition.brandpersonality.forEach((item) => {
      markdownContent += `- ${item.name}: ${item.description}\n`;
    });
    markdownContent += `\n`;

    await uploadFileToS3(
      defaultBucket,
      `${companyId}/CompanyReport.md`,
      markdownContent
    );

    console.log("Markdown file created successfully!");
  } catch (error) {
    console.error("Error generating company report:", error);
  }
};

const fetchCompanyReport = async (companyId) => {
  try {
    const s3FilePath = `${companyId}/CompanyReport.md`;
    const localDir = `${companyId}`;
    const isCompanyReportExist = await isFileExistS3(s3FilePath);

    if (!isCompanyReportExist) {
      await createCompanyReport(companyId);
      // wait for 5 seconds
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    const filePath = await fetchFileFromS3(s3FilePath, localDir);

    return filePath;
  } catch (error) {
    console.error("Error fetching company report:", error);
    return null;
  }
};

const isScrapingCompleted = async (companyId) => {
  try {
    const s3FilePath = `${companyId}/combined.md`;

    const isScrapedFileExist = await isFileExistS3(s3FilePath);

    if (!isScrapedFileExist) {
      return false;
    }

    const headObjectParams = {
      Bucket: defaultBucket,
      Key: s3FilePath,
    };
    const { ContentLength } = await s3.headObject(headObjectParams).promise();

    // check if the content length is greater than 12KB
    if (ContentLength > 12 * 1024) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error checking if scraping is completed:", error);
    return false;
  }
};

module.exports = {
  fetchFileFromS3,
  fetchDataFromS3,
  fetchMultipleFileFromS3,
  deleteDirectory,
  deleteFile,
  saveFileContent,
  isFileExistS3,
  createCompanyReport,
  fetchCompanyReport,
  ensureDirectoryExists,
  isScrapingCompleted,
};
