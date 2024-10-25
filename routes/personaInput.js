const express = require("express");
const {
  addPersonaInput,
  getPersonaInput,
  deletePersonaInput,
} = require("../controllers/personaInput.js");

const router = express.Router();

router.post("/persona-input", addPersonaInput);
router.get("/persona-inputs/:companyId", getPersonaInput);
router.delete("/persona-input/:id", deletePersonaInput);

module.exports = router;
