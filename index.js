// Importing necessary modules
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const appRouter = require("./routes/route.js");
const pdfRouter = require("./routes/pdfRoutes.js");
const customerRouter = require("./routes/customer.js");
const reportRouter = require("./routes/report.js");
const openaiRouter = require("./routes/openai.js");
const authRoutes = require("./routes/auth.js");
const roleRoutes = require("./routes/role.js");
const campaignRoutes = require("./routes/campaign.js");
const prospectsRouter = require("./routes/prospects.js");
const personasRouter = require("./routes/persona.js");
const calendarRouter = require("./routes/calendar.js");
const personaInputRouter = require("./routes/personaInput.js");
const datainsight = require("./routes/datainsight.js");
const userSegments = require("./routes/customer_segmentation.js");
const cookieParser = require("cookie-parser");
const { startCronJob } = require("./cron-jobs/companyUpdate.js");
const { isAuthenticated } = require("./controllers/auth.js");
const path = require("path");
const fs = require("fs");
const app = express();
const tmpDir = path.join(__dirname, 'tmp');

const corsOptions = {
  origin: true, // This allows requests from any domain
  credentials: true, // This allows cookies to be sent
};

// Setting up middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors(corsOptions));






// connect to mongo db
mongoose.connect(process.env.MONGO_DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("Connected to MongoDB"));



if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir);
}


app.use("/app", isAuthenticated, appRouter);
app.use("/customer", isAuthenticated, customerRouter);
app.use("/pdf", isAuthenticated, pdfRouter);
app.use("/report", isAuthenticated, reportRouter);
app.use("/openai", isAuthenticated, openaiRouter);
app.use("/api", authRoutes);
app.use("/roles", isAuthenticated, roleRoutes);
app.use("/campaign", isAuthenticated, campaignRoutes);
app.use("/prospects", isAuthenticated, prospectsRouter);
app.use("/personas", isAuthenticated, personasRouter);
app.use("/calendar", calendarRouter);
app.use("/scrape", isAuthenticated, require("./routes/scraper.js"));
app.use("/datainsight", datainsight);
app.use("/personaInput", isAuthenticated, personaInputRouter);
app.use("/usersegments",userSegments)

startCronJob(); // Starting the cron job

// Starting the server
const port = process.env.PORT || 3001; // Using the provided PORT or default to 3001
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
