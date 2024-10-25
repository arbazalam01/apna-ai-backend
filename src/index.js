// src/index.js
dotenv.config();
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import connectDB from "./config/db";

const pdfRouter = require("./routes/pdf.js");
const customerRouter = require("./routes/customer.js");
const calendarRouter = require("./routes/calendar.js");
const authRoutes = require("./routes/auth.js");
const campaignRoutes = require("./routes/campaign.js");
const { isAuthenticated } = require("./controllers/auth.js");


const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

// Enable CORS
app.use(cors());

// for parsing application/json
app.use(bodyParser.json());

// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true }));
//form-urlencoded

// Middleware to parse JSON bodies
app.use(express.json());

// Define a simple route
app.get("/", (req, res) => {
  res.send("Hello, Express with Babel and ES6!");
});

app.use("/calendar", calendarRouter);
app.use("/api", authRoutes);
app.use("/customer", isAuthenticated, customerRouter);
app.use("/pdf", isAuthenticated, pdfRouter);
app.use("/campaign", isAuthenticated, campaignRoutes);


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
