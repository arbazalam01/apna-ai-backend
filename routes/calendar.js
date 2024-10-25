const express = require("express");
const {
  calendar,
  postCalendarInput,
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
} = require("../controllers/calendar");

const router = express.Router();

router.get("/:companyId/getCalendarInputFields", calendar);
router.put("/:calendarId/updateCalendarInput", updateCalendarInput);
router.get("/:calendarId/getCalendarInput", getCalendarInput);
router.delete("/:calendarId/deleteCalendarInput", deleteCalendarInput);
router.get("/:companyId/getAllCalendar", getAllCalendarsByCompany);
router.post("/createCalendar", createCalendarV3);
router.get("/:companyId/getCalendar", getCalendarData);
router.get("/downloadCalendar", downloadCalendar);
router.get("/getSummaryData", getSummaryData );
router.post("/getThemes",getThemes);

module.exports = router;
