const mongoose = require("mongoose");
const Company = require("./Company");

const ItemSchema = new mongoose.Schema({
    Date: Date,
    Platform: String,
    ContentType: String,
    Theme: String,
    Topic: String,
    ContentDetail: String,
    Segment:String
  });

const CalendarSchema = new mongoose.Schema({
  startDate: Date,
  endDate: Date,
  companyId: {
    type: mongoose.ObjectId,
    ref: Company,
  },
  gptoutput:[ItemSchema],
  objective:String,
  segments: [String]
});

const Calendar = mongoose.model("Calendar", CalendarSchema);

module.exports = Calendar;
