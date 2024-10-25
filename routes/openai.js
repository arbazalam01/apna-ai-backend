const express = require("express");
const {
  runPrompt,
  runStatus,
  cancel,
  deleteLocalFile,
  deleteThread,
  modifyAssistantController,
  getAssistantController,
  runAPrompt,
} = require("../controllers/openai");
const { startPolling, stopPolling } = require("../utils/polling_service");
const { modifyAssistant } = require("../utils/openai_helper");

const router = express.Router();

router.post("/runprompt", runPrompt);

router.post("/runstatus", runStatus);

router.post("/cancelrun", cancel);
router.post("/deletefile", deleteLocalFile);
router.post("/deletethread", deleteThread);

router.get("/startpolling", (req, res) => {
  startPolling();
  res.status(200).json({ message: "Started polling" });
});

router.get("/stoppolling", (req, res) => {
  stopPolling();
  res.status(200).json({ message: "stopped polling" });
});

router.put("/modifyassistant", modifyAssistantController);
router.get("/assistant", getAssistantController);

router.post("/runaprompt", runAPrompt);

module.exports = router;
