const express = require("express");
const {
  createPersona,
  getAllPersonas,
  downloadPersona,
  deletePersona,
  refreshPersona,
  createPersonav2
} = require("../controllers/personas");

const router = express.Router();


router.get("/getAllPersonas", getAllPersonas);
router.post("/createPersona", createPersona);
router.post("/createPersonav2", createPersonav2);
router.get("/downloadPersona", downloadPersona);
router.delete("/deletePersona/:id", deletePersona);
router.get("/refreshPersona/:id", refreshPersona);


module.exports = router;
