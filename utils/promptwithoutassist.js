const SectionsWithoutAssistance = [
    {
        section: "userpersona",
        Prompt: `I want you to create a persona for the following person:
        Name: $name
        Age : $age 
        Job Description : $jobdescription
        Industry: $industry
        Years of Experience : $yearofexperience
        Location : $location
        I want you to include Demographic, Psychographic details along with Pain Points, Motivations, Challenges and Interests.`,
        json_format: `{"Demographic": "Array of string", "Psychographic": "Array of string", "PainPoints": "Array of string", "Motivations": "Array of string", "Challenges": "Array of string", "Interests": "Array of string"}`,
        thread_id: "",
      }

    ]
    module.exports = SectionsWithoutAssistance;