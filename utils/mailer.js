const nodemailer = require("nodemailer");

// SMTP_HOST set (e.g. Mailpit locally) = plain SMTP; otherwise Gmail.
module.exports = nodemailer.createTransport(
  process.env.SMTP_HOST
    ? { host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT) || 1025 }
    : {
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      }
);
