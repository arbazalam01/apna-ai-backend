const Sections = [
  {
    section: "about",
    Prompt: "Give me detailed information about $company_name",
    thread_id: "",
  },
  {
    section: "products",
    Prompt:
      "What are the products that $company_name offer ?  Give me the names of the individual product and detailed description of that product .",
    thread_id: "",
  },
  {
    section: "services",
    Prompt:
      "What are the services that $company_name offer ? Give me the names of the individual services and detailed description of that service .",
    thread_id: "",
  },
  {
    section: "industries",
    Prompt: "What are the industry verticals served by $company_name?",
    thread_id: "",
  },
  {
    section: "leadership",
    Prompt: "Get me names, designations and links to linkedin profile of everyone that features on the leadership or About Us page of $company_name.",
    thread_id: "",
  },
  {
    section: "topclients",
    Prompt: "Give me top clients names of $company_name as listed on its website?",
    thread_id: "",
  },
  {
    section: "swotanalysis",
    Prompt: `I want you to act as a Business Consultant from a top management company that speaks and writes fluent English. I want a SWOT analysis on $company_name Layout the SWOT Analysis in the following format. Give reasons why a point is included in the SWOT Analysis. Make the list compelling and professional. # (1) $company_name ## SWOT Analysis [introduction and definition about (1) $company_name ### Strengths [list of key strengths, bold - minimum of 4] ### Weaknesses [list of key weaknesses, bold - minimum of 4] ### Opportunities [list of key opportunities, bold - minimum of 4] ### Threats [list of key threats, bold - minimum of 4] [conclusion about (1) $company_name`,
    thread_id: "",
  },
  {
    section: "blogs",
    Prompt: `Read through all the blogs on $company_name website. Then 
    1. Give me the titles of all the blogs on the $company_name website.
    2. Categorize the blog into one of these five Keyword Driven, Thought Leadership, Instructional, Company update, other`,
    thread_id: "",
  },
  {
    section: "marketposition",
    Prompt: `Ignore all previous instructions. Read through all the bullet points
        and make sure you understand all the bullet points before you start working. Act as a
        subject matter expert, Long-Content Positioning Generator, high-end business writer
        with fluent English* and a business executive with 20 years of experience. An effective
        positioning statement should articulate what differentiates a brand from its
        competition. You need to create a position map for $company_name basis the core messaging, Positioning, brand voice, key differentiators.
        Create an effective positioning map $company_name that will get the imagination flowing. Please write in English language.`,
    thread_id: "",
  },
  {
    section: "summary",
    Prompt: `Can you summarise the product, service or solution that the firm offers in 50 words or fewer. There is no need to preface your response with any acknowledgements`,
    thread_id: "",
  },
  
  // {
  //   section: "BrandVoice",
  //   Prompt: `You are an experienced B2C email marketing copywriter. You have to identify and write about the brand voice of $company_name. Then, write a list answering the 12 sequential questions to find the brand voice through this site https://medium.com/purple-rock-scissors/https-medium-com-heyerinb-finding-your-brand-voice-with-12-sequential-questions-101971f1dd1c.Finally, write a brief conclusion about your findings in English.`,
  //   thread_id: "",
  // },
];

module.exports = Sections;
