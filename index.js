// Importing necessary modules
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const appRouter = require("./routes/route.js");
const customerRouter = require("./routes/customer.js");
const authRoutes = require("./routes/auth.js");
const campaignRoutes = require("./routes/campaign.js");
const prospectsRouter = require("./routes/prospects.js");
const calendarRouter = require("./routes/calendar.js");
const userSegments = require("./routes/customer_segmentation.js");
const cookieParser = require("cookie-parser");
const { isAuthenticated } = require("./controllers/auth.js");
const path = require("path");
const fs = require("fs");
const app = express();
const tmpDir = path.join(__dirname, "tmp");

const corsOptions = {
  origin: true, // This allows requests from any domain
  credentials: true, // This allows cookies to be sent
};

// Setting up middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
// Express 5 leaves req.body undefined when there is no body; keep Express 4's {}
app.use((req, res, next) => {
  req.body ??= {};
  next();
});
app.use(cookieParser());
app.use(cors(corsOptions));

// connect to mongo db
mongoose.connect(process.env.MONGO_DB);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("Connected to MongoDB"));

if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir);
}

app.use("/app", isAuthenticated, appRouter);
app.use("/customer", isAuthenticated, customerRouter);
app.use("/api", authRoutes);
app.use("/campaign", isAuthenticated, campaignRoutes);
app.use("/prospects", isAuthenticated, prospectsRouter);
app.use("/calendar", calendarRouter);
app.use("/usersegments", userSegments);

// Starting the server
const port = process.env.PORT || 3000; // Using the provided PORT or default to 3001
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
