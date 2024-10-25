const csvParser = require("csv-parser");
const xlsx = require("xlsx");
const csvtojson = require("csvtojson");
const fs = require("fs");

// Helper function to parse CSV
function parseCSV(buffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    require("stream")
      .Readable.from(buffer.toString("utf8"))
      .pipe(csvParser())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
}

// Helper function to parse XLS/XLSX
function parseExcel(buffer) {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(sheet);
}

const csvToJson = async (csvFile) => {
  const jsonArray = await csvtojson().fromFile(csvFile);
  return jsonArray;
};

module.exports = {
  parseCSV,
  parseExcel,
  csvToJson,
};
