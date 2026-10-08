const express = require("express");
const {
  addCustomer,
  addAssets,
  getAllCustomers,
  getCompetitors,
  addCompanyData,
  getCompanyData,
  scrapCompanyData,
  getPrompt,
  getNotificationData,
  getScrapeDate,
  uploadProspect,
  getDymanicPromptResponse,
  getCompanyCompetitors,
  getTopTrends,
  runAllPrompt,
  updateCompetitors,
  runAPrompt,
  getAllUsers,
  deleteUser,
  editUser,
  getUser,
  addProspect,
  generatePersona,
  generateEmail,
  getAlldata,
  createContactList,
  getAllDataV2,
  uploadIcon,
  addReportUrl,
  deleteAsset
} = require("../controllers/customers");
const multer = require("multer");
const multerS3 = require('multer-s3')
const { s3 } = require("../utils/aws_helper");
const router = express.Router();
// Multer configuration for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const uploads = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.BUCKETNAME,
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: (req, file, cb) => {
      const companyId = req.params.companyId;
      const fileName = file.originalname.replace(/\s+/g, '_');
      cb(null, `${companyId}/brandassets/${fileName}`);
    },
  }),
});



router.post("/addcustomer", addCustomer);
router.post("/addassets/:companyId", uploads.array('files',10), addAssets);
router.delete("/deleteasset/:fileId", deleteAsset);
router.get("/getallcustomers", getAllCustomers);
router.get("/:companyId/getcompetitors", getCompetitors);
router.post("/:companyId/updatecompetitors", updateCompetitors);
router.post("/:companyId/adddata", addCompanyData);
router.get("/:companyId/:tabType/getdata", getCompanyData);
router.get("/:companyId/getAlldata", getAlldata);
router.get("/:tabType/getprompt", getPrompt);
router.post("/scrapdata", scrapCompanyData);
router.post("/runAllPrompt", runAllPrompt);
router.post("/run-assistance", runAPrompt);
router.get("/:companyId/getnotificationdata", getNotificationData);
router.get("/:companyId/getScrapingDate", getScrapeDate);
router.post("/uploadProspect", upload.single("file"), uploadProspect);
router.post("/:companyId/getDymanicPromptResponse", getDymanicPromptResponse);
router.post("/:companyId/getCompanyCompetitors", getCompanyCompetitors);
router.get("/:companyId/getTopTrends", getTopTrends);
router.get("/getAllUsers", getAllUsers);
router.get("/:userId/deleteUser", deleteUser);
router.put("/:userId/editUser", editUser);
router.get("/:userId/getUser", getUser);

router.get("/deleteUser", deleteUser);
router.post("/addprospect", addProspect);

router.get("/generatepersona", generatePersona);
router.post("/getemail", generateEmail);
router.post("/createcontactlist", createContactList);
router.get("/:companyId/getAlldataV2", getAllDataV2);
router.post("/:companyId/uploadIcon", upload.single("file"), uploadIcon);

router.get("/profile-picture", async (req, res) => {
  const { companyId, linkedinUrl } = req.query;
  const { downloadCompanyLogo } = require("../utils/company_helper");
  const data = await downloadCompanyLogo(companyId, linkedinUrl,"companyLogo");
  res.send(data);
});

router.post('/:companyId/addReportUrl',addReportUrl);

module.exports = router;
