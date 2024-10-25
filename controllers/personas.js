
  const Persona = require("../models/Persona");
  const { generatePersona , generatePersonav2} = require("../utils/persona_helper");
  const { createObjectCsvWriter } = require("csv-writer");
  const fs = require('fs');



  const getAllPersonas = async (req, res) => {
    const { companyId } = req.query;
    console.log(companyId);
    const persona_list = await Persona.find({ companyId }).sort({ createdAt: -1 });
    res.json(persona_list);
  };
  
  const createPersona = async (req, res) => {
    const {
      companyId,
      designation,
      businessSize,
      OrganisationType,
      city,
      country,
    } = req.body;

    res.json({ Success: "Persona created successfully" });

    
    const persona = await generatePersona(
      companyId,
      businessSize,
      designation,
      city,
      country,
      OrganisationType
    );

   
  };


  const createPersonav2 = async (req, res) => {
    const personas = req.body.personas;

    await generatePersonav2(personas, req.body.country, req.body.companyId);

    res.json({ Success: "Persona created successfully" });
  };

  const downloadPersona = async (req, res) => {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).send('companyId is required');
    }
  
    try {
      const personas = await Persona.find({ companyId });
  
      if (!personas.length) {
        return res.status(404).send('No personas found for the provided companyId');
      }
  
      // Create a temporary file
     
      const filePath = "./tmp/personas.csv"
  
      // Define the CSV writer
      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
          { id: "name", title: "Name" },
          { id: "designation", title: "Designation" },
          { id: "organisation", title: "Organisation" },
          { id: "age", title: "Age" },
          { id: "gender", title: "Gender" },
          { id: "jobdescription", title: "Job Description" },
          { id: "yopofexperience", title: "Years of Experience" },
          { id: "location", title: "Location" },
          { id: "Motivations", title: "Motivations" },
          { id: "KPIs", title: "KPIs" },
          { id: "PainPoints", title: "Pain Points" },
          {id:'Questions',title:'Questions'},
          { id: "city", title: "City" },
          { id: "country", title: "Country" },
        ],
      });
  
      // Format data for CSV
      const records = personas.map(persona => ({
        name: persona.name,
        businessfunction: persona.businessfunction,
        designation: persona.designation,
        organisation: persona.organisation,
        age: persona.age,
        gender: persona.gender,
        jobdescription: persona.jobdescription,
        yopofexperience: persona.yopofexperience,
        location: persona.location,
        Motivations: persona.Motivations.join(';'), // Joining arrays with a semicolon
        KPIs: persona.KPIs.join(';'),
        PainPoints: persona.PainPoints.join(';'),
        Questions: persona.Questions.join(';'),
        city: persona.city,
        country: persona.country
      }));
  
      // Write records to CSV file
      await csvWriter.writeRecords(records);
  
      // Send the CSV file as a downloadable response
      res.download(filePath, 'personas.csv', (err) => {
        if (err) {
          console.error('Error downloading the file:', err);
          res.status(500).send('Server error');
        }
        
      });
  
    } catch (error) {
      console.error('Error retrieving personas:', error);
      res.status(500).send('Server error');
    }
  };


  const  deletePersona = async (req, res) => {
    try {
      const { id } = req.params;
      await Persona.findByIdAndDelete(id);
      res.json({ message: "Persona deleted successfully" });
    } catch (err) {
      res.status(500).send("Server error");
    }
  };


  const refreshPersona = async (req, res) => {
    try {
      const { id } = req.params;
      const personadata = await Persona.findById(id);
      const {
        companyId,
        businessSize,
        designation,
        country,
        organisation,
        product,
      } = personadata;
      const persona = await generatePersona(
        companyId,
        businessSize,
        designation,
        country,
        organisation,
        product,
        id
      );

      res.json({ Success: "Persona refreshed successfully" });
    } catch (err) {
      res.status(500).send("Server error");
    }
  }


  
  module.exports = {
    createPersona,
    getAllPersonas,
    downloadPersona,
    deletePersona,
    refreshPersona,
    createPersonav2
  };
  