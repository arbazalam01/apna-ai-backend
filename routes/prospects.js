const express = require("express");
const {
  uploadProfiles,
  getAllProspects,
  createPersona,
  downloadEmails,
  getProspectEmail,
  createEmails,
  downloadPersona,
} = require("../controllers/prospects");
const multer = require("multer");
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/uploadProfiles", upload.single("file"), uploadProfiles);
router.get("/getAllProspects", getAllProspects);
router.post("/createPersona", createPersona);
router.get("/downloadEmails", downloadEmails);
router.get("/prospectEmail", getProspectEmail);
router.post("/createEmails", createEmails);
router.get("/downloadPersona", downloadPersona);

module.exports = router;
