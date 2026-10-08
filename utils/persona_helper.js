const schedule = require("node-schedule");
const Persona = require("../models/Persona");
const { defaultPersonas,promptforAvatar,MultiplePersonas } = require("../lib/function_calling");
const { createThreadAndRun,createImage, createThreadAndRunonKnowledgeBase } = require("./openai_helper");
const {downloadCompanyLogo} = require ("../utils/company_helper");
const {fetchCompanyData} = require("../utils/company_helper");

const generatePersona = async (
  companyId,
  businessSize,
  designation,
  country,
  OrganisationType,
  product,
  updateid=null
) => {
  try {
    const companyData = await fetchCompanyData(companyId);


    let prompt = defaultPersonas.prompt.replaceAll("$designation", designation);
    prompt = prompt.replaceAll("$businessSize", businessSize);
    prompt = prompt.replaceAll("$OrganisationType", OrganisationType);
    prompt = prompt.replaceAll("$country", country);
    prompt = prompt.replaceAll("$product", product);
    prompt = prompt.replaceAll("$company_name", companyData.name);

    let changed_prompt = {
      ...defaultPersonas,
      prompt: prompt,
    };

    // let jsonData = await runSinglePrompt(assistantId, threadId, changed_prompt);
    const finalPrompt = `${changed_prompt.prompt}\nDo not include any explanations, only provide JSON response following this format without deviation.:\n ${changed_prompt.json_format}\n The JSON response:`;

    let jsonData = await createThreadAndRunonKnowledgeBase(companyId, finalPrompt);



    let Avatar = promptforAvatar.prompt.replaceAll("$designation", designation);

    if (jsonData.gender == "Male") {
      Avatar += ` [
  "Hard Hat Worker.png",
  "Businessman.png",
  "Hygiene Specialist.png",
  "Agricultural Worker.png",
  "Professor.png",
  "Hospitality Worker.png",
  "Policeman.png",
  "Doctor.png",
  "Marine Worker.png",
  "Pilot.png",
  "Developer.png",
  "Security Agent.png",
  "Student.png",
  "Lawyer.png",
  "Customer Service Agent.png",
  "Firefighter.png",
  "Engineer.png",
  "Salesman.png",
  "Technician.png"
    ]`;
    } else {
      Avatar += ` [
  "Hard Hat Worker.png",
  "Hygiene Specialist.png",
  "Agricultural Worker.png",
  "Professor.png",
  "Policewoman.png",
  "Hospitality Worker.png",
  "Doctor.png",
  "Businesswoman.png",
  "Marine Worker.png",
  "Pilot.png",
  "Security Agent.png",
  "Student.png",
  "Nurse.png",
  "Lawyer.png",
  "Customer Service Agent.png",
  "Firefighter.png",
  "Engineer.png",
  "Tech Developer.png",
  "Technician.png",
  "Saleswoman.png"

    ]`;
    }

    Avatar+=`\nDo not include any explanations, only provide JSON response following this format without deviation.:\n ${promptforAvatar.json_format}\n The JSON response:`;

    
    const imageUrl = await createThreadAndRunonKnowledgeBase(companyId, Avatar);
  
    jsonData = {
      ...jsonData,
      businessSize: businessSize,
      designation: designation,
      organisation: OrganisationType,
      companyId: companyId,
      country: country,
      avatar:imageUrl.name,
    };

  
    await addPersonaData(companyId, jsonData,updateid);

    return true;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const formatProducts = (products) => {
  if (products.length === 0) return "";
  if (products.length === 1) return products[0];
  return products.slice(0, -1).join(", ") + ", and " + products[products.length - 1];
};


// Helper function to prepare prompt for persona
const getMultiplePersonasPrompt = (designation, businessSize, OrganisationType, country, product) => {
  return MultiplePersonas.prompt
    .replaceAll("$designation", designation)
    .replaceAll("$businessSize", businessSize)
    .replaceAll("$OrganisationType", OrganisationType)
    .replaceAll("$country", country)
    .replaceAll("$product", formatProducts(product));
};

// Helper function to prepare avatar prompt based on gender
const getAvatarPrompt = (designation, gender) => {
  let avatarPrompt = promptforAvatar.prompt.replaceAll("$designation", designation);

  const avatarOptions = gender === "Male" ? [
    "Hard Hat Worker.png", "Businessman.png", "Hygiene Specialist.png", "Agricultural Worker.png", "Professor.png",
    "Hospitality Worker.png", "Policeman.png", "Doctor.png", "Marine Worker.png", "Pilot.png", "Developer.png",
    "Security Agent.png", "Student.png", "Lawyer.png", "Customer Service Agent.png", "Firefighter.png", "Engineer.png",
    "Salesman.png", "Technician.png"
  ] : [
    "Hard Hat Worker.png", "Hygiene Specialist.png", "Agricultural Worker.png", "Professor.png", "Policewoman.png",
    "Hospitality Worker.png", "Doctor.png", "Businesswoman.png", "Marine Worker.png", "Pilot.png", "Security Agent.png",
    "Student.png", "Nurse.png", "Lawyer.png", "Customer Service Agent.png", "Firefighter.png", "Engineer.png",
    "Tech Developer.png", "Technician.png", "Saleswoman.png"
  ];

  return `${avatarPrompt} [${avatarOptions.join(", ")}]`;
};


const generatePersonav2 = async (personas,country,companyId) => {
  try {
    const results = [];

    // Loop through each persona in the array
    for (const persona of personas) {
      const {
        businessSize,
        designation,
        OrganisationType,
        product,
        updateid = null
      } = persona;

      // Fetch company data and generate prompt in parallel to optimize speed
      const [companyData, promptTemplate] = await Promise.all([
        fetchCompanyData(companyId),
        getMultiplePersonasPrompt(designation, businessSize, OrganisationType, country, product)
      ]);

      const prompt = promptTemplate.replaceAll("$company_name", companyData.name);
      
      const finalPrompt = `${prompt}\nDo not include any explanations, only provide JSON response following this format without deviation.:\n ${MultiplePersonas.json_format}\n The JSON response:`;

      // Execute the final prompt
      let jsonData = await createThreadAndRunonKnowledgeBase(companyId, finalPrompt);

      let Avatar = promptforAvatar.prompt.replaceAll("$designation", designation);

    if (jsonData.gender == "Male") {
      Avatar += ` [
  "Hard Hat Worker.png",
  "Businessman.png",
  "Hygiene Specialist.png",
  "Agricultural Worker.png",
  "Professor.png",
  "Hospitality Worker.png",
  "Policeman.png",
  "Doctor.png",
  "Marine Worker.png",
  "Pilot.png",
  "Developer.png",
  "Security Agent.png",
  "Student.png",
  "Lawyer.png",
  "Customer Service Agent.png",
  "Firefighter.png",
  "Engineer.png",
  "Salesman.png",
  "Technician.png"
    ]`;
    } else {
      Avatar += ` [
  "Hard Hat Worker.png",
  "Hygiene Specialist.png",
  "Agricultural Worker.png",
  "Professor.png",
  "Policewoman.png",
  "Hospitality Worker.png",
  "Doctor.png",
  "Businesswoman.png",
  "Marine Worker.png",
  "Pilot.png",
  "Security Agent.png",
  "Student.png",
  "Nurse.png",
  "Lawyer.png",
  "Customer Service Agent.png",
  "Firefighter.png",
  "Engineer.png",
  "Tech Developer.png",
  "Technician.png",
  "Saleswoman.png"

    ]`;
    }

    Avatar+=`\nDo not include any explanations, only provide JSON response following this format without deviation.:\n ${promptforAvatar.json_format}\n The JSON response:`;

  
    
    const imageUrl = await createThreadAndRunonKnowledgeBase(companyId, Avatar);

      // Combine all the persona data
      jsonData = {
        ...jsonData,
        businessSize,
        designation,
        organisation: OrganisationType,
        companyId,
        product:product,
        country,
        avatar: imageUrl.name,
      };

      console.log("jsonData",jsonData)

      // Store persona data
      await addPersonaData(companyId, jsonData, updateid);

      // Collect result
      results.push(jsonData);
    }

    // Return all created personas
    return results;
  } catch (err) {
    console.error("Error generating personas:", err);
    return null;
  }
};







const addPersonaData = async (companyId, updateFields,updateid) => {
 
  try {
    if(updateid){

      const newPersona = await Persona.findByIdAndUpdate(
        updateid,
        updateFields,
        {
          returnDocument: "after",
        }
      );
      if (!newPersona) {
        return null;
      }
      return newPersona;
      
    }
    else
    {
      const newPersona = new Persona({
        age: updateFields.age,
        avatar: updateFields.avatar,
        gender: updateFields.gender,
        name: updateFields.name,
        jobdescription: updateFields.jobdescription,
        yopofexperience: updateFields.yopofexperience,
        location: updateFields.location,
        Motivations: updateFields.Motivations,
        PainPoints: updateFields.PainPoints,
        Needs: updateFields.Needs,
        Challenges: updateFields.Challenges,
        companyId: updateFields.companyId,
        designation: updateFields.designation,
        organisation: updateFields.organisation,
        KPIs: updateFields.KPIs,
        Questions:updateFields.Questions,
        product:updateFields.product,
        country:updateFields.country,
        businessSize:updateFields.businessSize
      });
      await newPersona.save();
  
      if (!newPersona) {
        return null;
      }
      return newPersona;

    }
   
  } catch (err) {
    console.log("Error DB--->", err);
    return null;
  }
};

module.exports = {
  generatePersona,
  addPersonaData,
  generatePersonav2 
};
