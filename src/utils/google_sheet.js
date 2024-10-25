const { google } = require("googleapis");
const sheets = google.sheets("v4");
const { GoogleAuth } = require("google-auth-library");

async function readGoogleSheet(sheetId, sheetName) {
  const auth = new GoogleAuth({
    keyFile: "credentials.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const authClient = await auth.getClient();

  try {
    const response = await sheets.spreadsheets.values.get({
      auth: authClient,
      spreadsheetId: sheetId,
      range: sheetName,
    });

    const rows = response.data.values;
    if (rows && rows.length) {
      const headers = rows[0];
      const data = rows.slice(1).map((row) => {
        let obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });
      return data;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error reading Google Sheet:", error);
    throw error;
  }
}

module.exports = {
  readGoogleSheet,
};
