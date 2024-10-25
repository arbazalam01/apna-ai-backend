
const PersonaInput = require("../models/PersonaInput");

const addPersonaInput = async (req, res) => {
  try {
    const { companyId, persona } = req.body;
    const savedPersonas = [];
  
    for (let i = 0; i < persona.length; i++) {
      let personaData = {
        ...persona[i],
        companyId
      };
  
      const personaInput = new PersonaInput(personaData);
      const savedPersonaInput = await personaInput.save();
      savedPersonas.push(savedPersonaInput); 
    }

    res.status(201).json(savedPersonas);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
  
};

function groupByBusinessFunction(personaInputs) {
  const groupedPersonas = {};

  personaInputs.forEach(persona => {
    const { businessFunction, designation, ...rest } = persona;

    if (!groupedPersonas[businessFunction]) {
      groupedPersonas[businessFunction] = { ...rest, businessFunction, designations: [] };
    }

    groupedPersonas[businessFunction].designations.push(designation);
  });

  return Object.values(groupedPersonas);
}

const getPersonaInput = async (req, res) => {
    try {
        const { companyId } = req.params;
        const personaInputs = await PersonaInput.find({ companyId });

        // let result=groupByBusinessFunction(personaInputs);

        res.status(200).json(personaInputs);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


const deletePersonaInput = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedPersonaInput = await PersonaInput.findByIdAndDelete(id);
        if (!deletedPersonaInput) {
          return res.status(404).json({ message: "Persona input not found" });
        }
        res.status(200).json({ message: "Persona input deleted successfully" });
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
};



module.exports = {
    addPersonaInput,
    getPersonaInput,
    deletePersonaInput
};
