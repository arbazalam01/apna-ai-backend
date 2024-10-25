const About = {
  json_format: `{ "description": "About the company description", "mission": "Mission of the company"}`,
  prompt:
    "Act like a head of marketing for $company_name . From the information available to you, write a mission statement and text for About section such that this information can be used in all marketing communication later targeted towards potential customers and other stakeholders. Do not use long sentences and superfluous words. Go through what you have written 3 times, fine tune it and only share once you are totally happy with your response.",
  dbKey: "about",
};

const SWOTAnalysis = {
  json_format: `{ "strengths": "Array of object and each object conatains name and description like [{"name":"Name of strength","description":"Description of this strength"}], "weaknesses": "Array of object and each object conatains name and description like [{"name":"Name of weakness","description":"Description of this weakness"}], "opportunities": "Array of object and each object conatains name and description like [{"name":"Name of opportunity","description":"Description of this opportunity"}], "threats": "Array of object and each object conatains name and description like [{"name":"Name of threat","description":"Description of this threat"}] }`,
  prompt: `I am seeking a comprehensive SWOT analysis for  $company_name. Please provide a detailed examination of  $company_name internal strengths and weaknesses, as well as the external opportunities and threats it faces. The analysis should be structured as follows:

 $company_name SWOT Analysis
Introduction: Briefly introduce $company_name, including its industry, size, and market position.

Strengths:

[Strength 1]: Describe the first strength and explain why it's considered a strength.
[Strength 2]: Describe the second strength and provide reasons for its inclusion.
[Strength 3]: Describe the third strength and provide reasons for its inclusion.
[Strength 4]: Describe the fourth strength and provide reasons for its inclusion.

Weaknesses:

[Weakness 1]: Identify a key weakness and explain its impact on  $company_name.
[Weakness 2]: Outline another weakness and the reason it's selected.
[Weakness 3]: Identify a third key weakness and explain its impact on  $company_name.
[Weakness 4]: Identify a fourth key weakness and explain its impact on  $company_name.

Opportunities:

[Opportunity 1]: Highlight a first significant opportunity and why it's relevant for  $company_name.
[Opportunity 2]: Highlight a second significant opportunity and why it's relevant for  $company_name.
[Opportunity 3]: Highlight a third significant opportunity and why it's relevant for  $company_name.
[Opportunity 4]: Highlight a fourth significant opportunity and why it's relevant for  $company_name.

Threats:

[Threat 1]: Point out a major threat and its implications for  $company_name.
[Threat 2]: Describe a second significant threat and why it poses a risk.
[Threat 3]: Describe a third significant threat and why it poses a risk.
[Threat 4]: Describe a fourth significant threat and why it poses a risk.


Conclusion: Summarize the key points from the SWOT analysis and what they mean for $company_name strategic direction.
`,
  dbKey: "swotanalysis",
};

const Marketposition = {
  json_format: `{ "corepurpose": "Array of object and each object contains name and description like [{"name":"Name of corepurpose","description":"Description of this corepurpose"}], "positioning": "Array of object and each object conatains name and description like [{"name":"Name of positioning","description":"Description of this positioning"}], "keydifferentiators": "Array of object and each object conatains name and description like [{"name":"Name of keydifferentiators","description":"Description of this keydifferentiators"}], "brandpersonality": "Array of object and each object conatains name and description like [{"name":"Name of brandpersonality","description":"Description of this brandpersonality"}] }`,
  prompt: `Act as a subject matter expert with 20 years of experience in business writing, and I need a comprehensive analysis for $company_name. Please provide a detailed position map focusing on four key areas. For each area, list exactly four points with a title and a detailed description. The areas are:

Core Purpose: Define $company_name fundamental reason for existence beyond profit-making.

Positioning: Describe how $company_name differentiates itself in the market and its unique stance within the industry.

Key Differentiator: Identify what sets $company_name apart from its competitors in terms of attributes or services.

Brand Personality: Characterize $company_name brand personality and the tone it conveys to its audience.

Please ensure each point is detailed and provides insight into $company_name strategy and character.`,
  dbKey: "marketposition",
};

const TopClients = {
  json_format: `{ "topclients":"Array of string , each string is a client name like ["Name of Clients"] }`,
  prompt: `Go through the provided data and assess the impressive companies $company_name has partnered with!  Identify all the clients they've served and create a list that highlights their diverse clientele.`,
  dbKey: "topclients",
};

const Industries = {
  json_format: `{ "industries":"Array of string , each string is a industry name like ["Name of Industry"] }`,
  prompt:
    "Go through the information available to you. I need to pull out the industry verticals or company type $company_name does business with. These should be unique and identifiable as stand alone industry types. They can also not be too generic. It is important that you understand their business before you provide answers and then evaluate the answers you provide against the business they do.",
  dbKey: "industries",
};

const Products = {
  json_format: `{ "products":"Array of object and each object contains name and description for example- [{"name":"Name of product","description":["Description of this product"]}] }`,
  prompt: `Act as an expert business analyst. You must understand the difference between products and services and not confuse the two.
          Go through the information available to you. I am developing a product catalog. Extract all product names mentioned in the information available to you for $company_name. For each product, provide in a bulleted list a description of its features. I want you to revalidate the names of products from the information available till the time you're completely satisfied with your response. If you don't find names of products then don't output any names.`,
  dbKey: "products",
};
const Services = {
  json_format: `{ "services":"Array of object and each object contains name and description for example- [{"name":"Name of service","description":["Description of this service"]}] }`,
  prompt: `Act as an expert business analyst. You must understand the difference between products and services and not confuse the two.
Go through the information available to you. I am developing a services catalog. Extract all service names mentioned in the information available to you for $company_name. For each service, provide in a bulleted list a description of its features. I want you to revalidate the names of services from the information available till the time you're completely satisfied with your response. If you don't find names of services then don't output any names.`,
  dbKey: "services",
};

const Leadership = {
  json_format: `{ "leadership":"Array of object and each object contains name,designation and linkedin url like [{"name":"Name of persona","designation":"Description of this persona","linkedin":"Linkedin url of this person, if given in the provided file"}] }`,
  prompt:
    "The information shared with you contains names and designations of the leadership team at $company_name. I want you to extract all names and designations and provide them in a list. You have to make sure you are not giving names that do not feature in the information and you have to make sure you share all names shared in the information share. Any miss or wrongful addition can lead to unacceptable errors. Also be careful about including names that are not part of Bruviti. Exclude names from partner and customer companies. Therefore evaluate your response against the information shared and be sure to share complete and accurate data.Dont miss any leadership names while answering . It can lead to inappropriate results",
  dbKey: "leadership",
};

const Summary = {
  json_format: `{"summary":"Summary of the company" }`,
  prompt: `I want you to go through all the information available to you. Act as a business analyst.Summarise the products, services or solution that the firm offers in 50 words or fewer. There is no need to preface your response with any acknowledgements`,
  dbKey: "summary",
};

const Blogs = {
  json_format: `{ "url":"url of the webpage that contains all blogs", "titles": Array of object and each object contains title and blogtype like [{"title":"Title of blogs","blogtype":"category of the blog"}]}`,
  prompt: ` Imagine youre a journalist and must uncover information. Go through the information available to you on $company_name decipher them. Classify them into certain keyword such as Keyword Driven, Thought Leadership, Instructional, Company update, other.`,
  dbKey: "blogs",
};

const InitialMessage = {
  json_format: `{"Summary": Name of the Company: "About": CEO of the company: "Products of the company": "Top Clients of the company":}`,
  prompt: `Can you please read the provided file and give the information?`,
  dbKey: "initial",
};

const prospectPrompt = {
  json_format: `{"Demographic": "Array of string , each string is a demographic detail of the person", "Psychographic": "Array of string , each string is a psychographic detail of the person", "PainPoints": "Array of string , each string is a painpoint of the person", "Motivations": "Array of string , each string is a motivation of the person", "Challenges": "Array of string , each string is a challenge of the person", "Interests": "Array of string , each string is an interest of the person", "TonOfVoice": "Tone of voice of the person"}`,
  prompt: `I want you to go through the attached document. Generate a persona for $name providing the following information:
  1. His pain points 
  2. His motivations
  3. His interests 
  4. His buying behaviours 
  Also indicate in what tone of voice would John like to be spoken in.`,
  dbKey: "prospect",
};

const ProductEngagementProspectPrompt = {
  json_format: `{"age": Exact age of person in number (eg:40),"name":"Name of the person", "gender": "Gender of person" , "jobdescription": "Job Description of Person" , "yopofexperience":"Year of Experience","Motivations":" Array of string , each string is a motivation of the person ", "PainPoints":"Array of PainPoints , each string is a painpoint of the person", "Questions":"Array of string , each string is a question of the person"}`,
  prompt: `Go through the detailed information made available to you about $name. $company_name wants to position it's product $product using it's core features, key differentiators and strengths to $name. Create a set of $no_of_question questions that $name will have about $product from $company_name that will allow them to evaluate $product based on their roles and responsibilities. Also based on the user data give me a detailed user persona in context of how $company_name can be relevant to this persona, include Psychographics, buying behaviour, motivations and painpoints for $name along with a tone of voice this persona would like to be spoken in.`,
  dbKey: "productEngagementProspect",
};

const BrandAwarenessProspectPrompt = {
  json_format: `{"age": Exact age of person in number (eg:40),"name":"Name of the person", "gender": "Gender of person" , "jobdescription": "Job Description of Person" , "yopofexperience":"Year of Experience","Motivations":" Array of string , each string is a motivation of the person ","PainPoints":"Array of PainPoints , each string is a painpoint of the person", "Questions":"Array of string , each string is a question of the person"}`,
  prompt: `Go through the detailed information made available to you about $name. $company_name wants to position itself favourably to $name using it's core purpose, differentiators, strengths and positioning. Create 5KPIs and 5 pain points for $name such that these are relevant for $company_name. Now convert these KPIs and Pain points into $no_of_question questions that $name would have for $company_name. Also based on the user data give me a detailed user persona in context of how $company_name can be relevant to this persona, include Psychographics, buying behaviour, motivations and painpoints for $name along with a tone of voice this persona would like to be spoken in.`,
  dbKey: "brandAwarenessProspect",
};

const EventLedProspectPrompt = {
  json_format: `{"age": Exact age of person in number (eg:40),"name":"Name of the person", "gender": "Gender of person" , "jobdescription": "Job Description of Person" , "yopofexperience":"Year of Experience","Motivations":" Array of string , each string is a motivation of the person " , "PainPoints":"Array of PainPoints , each string is a painpoint of the person", "Questions":"Array of string , each string is a question of the person"}`,
  prompt: `Go through the detailed information made available to you about $name. Given the persona for $name, create a set of KPIs and motivations and pain points. $company_name would like to publicise an event that it is participating in to $name. The KPIs, Painpoints and motivations have to be converted into a set of $no_of_question questions that $company_name can address in a way that encourage $name to attend the event. Also based on the user data give me a detailed user persona in context of how $company_name can be relevant to this persona, include Psychographics, buying behaviour, motivations and painpoints for $name along with a tone of voice this persona would like to be spoken in.`,
  dbKey: "eventLedProspectPrompt",
};


const emailPrompt = {
  json_format: `{"subject": "subject of the email", "body": "body of the email", "from": "CEO of the company", "to": "Name of the person", "company": "Name of the company", "prospect_name": "Name of the person", "company_name": "Name of the company}`,
  prompt: `I want you to act as a expert copy writer. I want you to craft an email in first person as follows.
  
  1. A compelling subject line that starts with the first name of the prospect and makes the prospect open the email. It should incorporate the tone of voice the prospect would like to be spoken to. 
  2. The first paragraph in the email should address and elaborate the pain points of the prospect as he navigates the company in the industry the company operates in.
  3. The second paragraph should introduce $company_name's products and talk of the clear benefit it delivers
  3. The third paragraph should have a clear call to action of getting the prospect to fix up a demo by clicking on a link.
  4. The email is from the CEO of $company_name`,
  dbKey: "email",
};
const newEmailPromptForBrandAwareness = {
  json_format: `{emails: "Array of objects with the following structure: [{"subject":"subject of the email , it needs to be different for each mail generated" , "body": "body of the email , it needs to be different for each mail generated", "from": "CEO of the company", "to": "Name of the person", "company": "Name of the company", "prospect_name": "Name of the person", "company_name": "Name of the company}}"]`,

  prompt: `I want you to act as a expert B2B email copywriter. The purpose of the email campaign is to create brand awareness among $prospect_name through $no_of_question emails. An email should flow from the previous email. I want you to talk about brand attributes from positioning, strengths, core purpose and differentiators of $company_name. Use these to address the questions that the prospect has based on the persona. Do take into consideration any special instructions that are being given to you. Follow these instructions explicitly. Each email should be $word_count words. The email is being sent by CEO of the company

           Prospect Questions : $question
           Special Instruction : $additional_instructions

          Here are some rules for writing the emails:
          1. Each email has to have a compelling story line which makes the prospect want to open it
          2. The first paragraph should have a strong hook and should be short.
          3. Do not start the email by introducing the sender
          4. Use short sentences and avoid the use of superfluous words and adjectives
          5. Use a tone of voice as determined from the persona
          6. Write the emails like a person is talking to the receiver
          7. The second paragraph should directly address the question being answered
          8. The third para should have a strong closing

          After the emails have been written, read the emails to ensure that they serve the intended purpose. Refine them till the time you are satisfied. Also measure them against the rules set. Rules should never be broken.`,
          dbKey: "email",
};

const newEmailPromptForEventLed = {
  json_format: `{emails: "Array of objects with the following structure: [{"subject":"subject of the email , it needs to be different for each mail generated" , "body": "body of the email , it needs to be different for each mail generated", "from": "CEO of the company", "to": "Name of the person", "company": "Name of the company", "prospect_name": "Name of the person", "company_name": "Name of the company}}"]`,
  prompt: `Go through all of the information below:

          Event Name: $event_name
          Event Theme: $event_theme
          Other Information: $additional_instructions
          Date: $date

          I want you to act as a expert B2B email copywriter and create an email campaign around this event. The purpose of the email campaign is to encourage the $prospect_name to attend the event above in which $company_name is participating. I want you to look at the questions around KPIs, pain points and motivations for $prospect_name and then talk about how this event would benefit the $prospect_name. Address one such question in each of the $no_of_question emails
          Follow these instructions explicitly. Each email should be $word_count words. The email is being sent by CEO  of the company

          Here are some rules for writing the emails:
          1. Each email has to have a compelling story line which makes the prospect want to open it
          2. The first paragraph should have a strong hook and should be short.
          3. Do not start the email by introducing the sender
          4. Use short sentences and avoid the use of superfluous words and adjectives
          5. Use a tone of voice as determined from the persona
          6. Write the emails like a person is talking to the receiver
          7. The second paragraph should directly address the question being answered
          8. The third para should have a strong closing
          After the emails have been written, read the emails to ensure that they serve the intended purpose. Refine them till the time you are satisfied. Also measure them against the rules set. Rules should never be broken.`,
  dbKey: "email"

};

const newEmailPromptForProductEngagement = {
  json_format: `{emails: "Array of objects with the following structure: [{"subject":"subject of the email , it needs to be different for each mail generated" , "body": "body of the email , it needs to be different for each mail generated", "from": "CEO of the company", "to": "Name of the person", "company": "Name of the company", "prospect_name": "Name of the person", "company_name": "Name of the company}}"]`,
  prompt: `I want you to act as a expert B2B email copywriter. The purpose of the email campaign is to create engagement for $product among $prospect_name through $no_of_question emails. An email should flow from the previous email. I want you to talk about product features. Use these to address the questions that $prospect_name has for this product. Do not make information up. You could do a comparative analysis with my competitors, only if you are able to. 
           Do take into consideration any special instructions that are being given to you. Follow these instructions explicitly. Each email should be $word_count words. The email is being sent by CEO of the company

           Prospect Questions : $question
           Special Instruction : $additional_instructions

           Here are some rules for writing the emails:
           1. Each email has to have a compelling story line which makes the prospect want to open it
           2. The first paragraph should have a strong hook and should be short.
           3. Do not start the email by introducing the sender
           4. Use short sentences and avoid the use of superfluous words and adjectives
           5. Use a tone of voice as determined from the persona
           6. Write the emails like a person is talking to the receiver
           7. The second paragraph should directly address the question being answered
           8. The third para should have a strong closing

           After the emails have been written, read the emails to ensure that they serve the intended purpose. Refine them till the time you are satisfied. Also measure them against the rules set. Rules should never be broken.`,
  dbKey: "email",
};


const newPersonaPrompt = {
  prompt: `Create a detailed persona based on the LinkedIn profile data of $name and the data of the company where they are currently employed. Incorporate both the user's professional background and achievements as well as insights into the company's culture, industry, and values.

  User Profile Data:
  
  Name: [User's Name]
  LinkedIn Headline: [User's LinkedIn Headline]
  Current Position: [User's Current Position]
  Company: [User's Current Company]
  Industry: [User's Current Company Industry]
  Location: [User's Location]
  Summary/Bio: [User's LinkedIn Summary/Bio]
  Skills & Expertise: [List of User's Skills & Expertise]
  Experience: [User's Previous Work Experience, if relevant]
  Education: [User's Educational Background]
  Professional Achievements: [User's Notable Achievements or Projects]
  Company Data:
  
  Company Name: [User's Current Company Name]
  Industry: [Company's Industry]
  Size: [Company's Size: Small/Medium/Large]
  Location: [Company's Location]
  Mission Statement: [Company's Mission Statement, if available]
  Company Culture: [Insights into the company's culture, values, and work environment]
  Products/Services: [Description of the products/services offered by the company]
  Market Position: [Company's position in the market, any notable achievements or recognitions]
  Key Competitors: [Main competitors of the company]
  Notable Projects/Initiatives: [Any significant projects or initiatives undertaken by the company]
  Persona Description:
  [Based on the provided data, craft a detailed persona that incorporates insights into the user's professional background, skills, aspirations, as well as the company's culture, industry standing, and values. Provide a narrative that paints a vivid picture of the individual's role within the company and their contributions to its success.]`,
};

const defaultPersonas = {
  json_format: `{"age": Exact age of person in number (eg:40),"name":"Name of the person", "gender": "Gender of person" , "jobdescription": "Job Description of Person" , "yopofexperience":"Year of Experience","Motivations":" Array of string , each string is a motivation of the person ", "KPIs":" Array of string , each string is a key Performance Index of Person" , "PainPoints":"Array of PainPoints , each string is a painpoint of the person", "Questions":"Array of string , each string is a question of the person"}`,
  prompt: `Create a persona to include demographics , a job description in 100 words , 5 KPIs , 5 Painpoints , 5 Motivations and 5 questions this persona will have for $company_name . The persona should be based upon $designation in $businessSize $OrganisationType  based out of $city , $country .`,
  dbKey: "genericpersona",
};


const MultiplePersonas = {
  json_format: `{
    "age": Exact age of person in number (e.g., 40),
    "name": "Name of the person",
    "gender": "Gender of person",
    "jobdescription": "Job Description of Person",
    "yopofexperience": "Year of Experience",
    "Motivations": "Array of strings, each string is a motivation of the person",
    "KPIs": "Array of strings, each string is a Key Performance Indicator of Person",
    "PainPoints": "Array of PainPoints, each string is a pain point of the person",
    "Questions": "Array of objects with the following structure: [{ "productName":"", "question": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5" ...] }], where productName is the name of the selected product and question is the list of question that the persona will have for that product"
  }`,
  prompt: `I want you to act as an expert business analyst with a specialty in organisational behaviour who is working for a product manager of the following products: $product. I want you to create a persona for $designation in $OrganisationType based out of $country. As part of the persona, include:
  
  1. A 3-sentence job description
  2. A set of 5 pain points
  3. A set of 5 KPIs
  4. For product $product, generate 8 questions that this persona will have for the product manager about the product in a manner that they would like to evaluate the product for use in $OrganisationType.
  
  Output the pain points, KPIs, and questions in a numbered list, categorizing the questions under each respective product.

  Once you have generated the persona, I want you to act as the product manager for each product in $product and see if you have all the relevant information you need to be able to craft and share information about each product that will allow you to effectively pitch the product to the persona by addressing their pain points and answering the questions they ask of you. I want you to refine this list at least 3 times till you are completely satisfied with the output. This is very important as the information contained as part of the persona is going to be used to create all communication to be sent to the persona.`,
  dbKey: "multiplepersonas",
};

const promptforAvatar = {
  json_format: `{"name": Name of Avatar}`,
  prompt: `Which avatar would I choose for $designation . The names of avatar are `,
  dbKey: "avatar",
};

const Calendarprompt = {
  json_format: `{ "calendar":"Array of object and each object contains for example- [ {"weekNo": "week no","Date": "date of posting","Platform": "platform of posting","ContentType": "type of content","Theme": "theme of content","Topic": "topic of content","ContentDetail": "detail of content", "Objective": "objective of content" ,"Product": "Target Product", "Industry": "Target Industry"}] }`,
  Prompt: `Create a daily based content calendar for $company_name with start date as $start_date and end date as $end_date , targeting persona(s) of $user_persona . Target product are $product . Target Industry are $industry . The Industry themes to be incorporated are $industryThemes" . Use $Motivation  as Motivation , $PainPoints as PainPoints and  $KPI as key performance index. The objective of the content has to be creating $awarenessPercent %
       Awareness, $engagementPercent % engagement, $thoughtLeadPercent % thought leadership .  Also consider other inputs provided that is $otherDetails.  The content calendar should contains objective and the platform where it should be posted ,`,
  dbKey: "calendar",
};

const Calendarpromptv1 = {
  json_format: `{ "calendar":"Array of object and each object contains for example- [ {"weekNo": "week no","Date": "date of posting in DD/MM/YYYY format","Platform": "platform of posting content","ContentType": "type of content","Theme": "theme of content","Topic": "topic of content","ContentDetail": "detail of content", "Objective": "objective of content","Product": "Target Product", "Industry": "Target Industry"}] }`,
  Prompt: `Create a content calendar for $company_name with start date as $start_date and end date as $end_date ,  The objective of the content has to be creating $awarenessPercent %
  Awareness, $engagementPercent % engagement, $thoughtLeadPercent % thought leadership  .`,
  dbKey: "calendar",
};

const DataInsight = {
  // json_format: `{ "dashboardResult" : {"posts":"Array of object and each object contains for example- [{"id":"Id of the posts", "working_aspects":"Aspect describing what do you like about the post" , "non_working_aspects":"Aspect describing how the post can be improved"}]", general_analysis": {"working_aspect":"type string" , "non_working_aspects": "type string" , "recommendations": "type string"} } }`,
  json_format: `{"posts":"Array of object and each object contains for example- [{"id":"Id of the posts", "working_aspects":"Aspect describing what do you like about the post" , "non_working_aspects":"Aspect describing how the post can be improved"}]" }`,

  Prompt: `Act as a social media content expert , Please provide a critical analysis taking into account the post details shared with you.`,
  dbKey: "datainsight",
};

const Calendarprompt_of_Brandawareness_and_ThoughtLeadership = {
  json_format: `{ "calendar":"Array of object and each object contains for example- [ {"weekNo": "week no","Date": "date of posting in DD/MM/YYYY format","Platform": "platform of posting content","ContentType": "type of content","Theme": "theme of content","Topic": "topic of content","ContentDetail": "detail of content", "Objective": "objective of content" ,"Product": "Target Product","TargetPersona":"Designation of the targeted persona", "Industry": "Target Industry"}] }`,
  Prompt: `Create a campaign calendar for $company_name based on the information below .`,
  dbKey: "calendar",
};

const Calendarprompt_of_ProductEngagement_and_ProductAwareness = {
  json_format: `{ "calendar":"Array of object and each object contains for example- [ {"weekNo": "week no","Date": "date of posting","Platform": "platform of posting content","ContentType": "type of content","Theme": "theme of content","Topic": "topic of content","ContentDetail": "detail of content", "Objective": "objective of content" ,"Product": "Target Product", "TargetPersona":"Designation of the targeted persona", "Industry": "Target Industry" }] }`,
  Prompt: `Create a campaign calendar for $company_name based on the information below . Ensure each content type is for one persona at a time.`,
  dbKey: "calendar",
};

const IncludetypeofContent = "The different types of content are $platforms .";
const IncludeProduct = "Take target products as $product .";
const IncludeService = "Take target service as $service .";
const IncludePersona = "You need to target User persona of $user_persona .";
const IncludeKPI = "The KPI of $user_persona is $KPI .";
const IncludePainPoints = "The PainPoints of $user_persona is $PainPoints .";
const IncludeThemes = "The themes to be incorporated are $themes .";
const IncludeMotivation = "The Motivation of $user_persona is $Motivation";
const IncludeAdditional = "$otherDetails .";
const Platform =
  "Create content for Linkedin, Twitter , Instagram or Website platforms only";

const TopSEOS = {
  json_format: `{ "topseos":"Array of string , each string is a seo keyword like ["Name of SEO Keyword"] }`,
  prompt:
    "Act as an SEO expert, analyse the information provided to you for $company_name and its two competitors. Now come up with a set of keywords which will drive traffic to $company_name website away from it's competitors. While listing these keywords, highlight SEP keywords for $company_name. Sort them by search volume.",
  dbKey: "topseos",
};

const Themes={
  json_format: `{ "themes":"Array of string , each string is a theme like ["Name of Theme"] }`,
  prompt:"Act as an expert marketer. Review the core purpose, differentiators, strengths, and positioning statements for $company_name. Using any two from differentiators, strengths, positioning, and core purpose, generate a list of five themes for a brand awareness campaign focused on top-of-funnel content. This campaign will target specific customer segments. The target segment being \n $segment  .  \n Ensure the themes align with the interests, pain points, and motivations of these segments. Each theme should be 6-8 words long.",
  dbKey:"themes"
}


const BrandAwarenessCalendar = {
  json_format: `{ "calendar":"Array of object and each object contains for example- [ {"Date": "date of posting in DD/MM/YYYY format","Platform": "platform of posting content","ContentType": "type of content","Theme": "associated theme of content","Topic": "topic of content","ContentDetail": "detail of content", "Objective": "objective of content", "Segment": "Segmentation of the user"}] }`,
  prompt: `I need you to create a day wise campaign calendar between $start_date and $end_date .Assume that you are creating this content calendar for India . Take care of any festival occuring during this period as well while creating the calendar.  No content is to be published on weekends. I need to you take into consideration the following rules while creating the campaign calendar:
         1. Objective of the Campaign : Brand Awareness
         2. Themes for the campaign : $themes
         3. Content formats in which content is to be created for each theme : $contentformat
         4. Quantities against each content format for each theme: $contentmix

         The calendar needs to ensure that all of the above rules are followed and you can include multiple posts in a single day and  ensure that number of content is same as mentioned. 

         The campaign calendar needs to have the following fields:
         1. Title of the content , should be unique for each content piece
         2. Associated Theme of content
         3. Detail of the content
         4. Associated content format
         5. Date to be published on
         6. Segment name of the user
        
         Create content for Linkedin, Twitter , Instagram or Website platforms only .
`,
  dbKey: "brandAwarenessCalendar",
};


const getAllPrompts = () => {
  const allPrompts = [
    About,
    Products,
    Services,
    Industries,
    // Leadership,
    // TopClients,
    Summary,
    Marketposition,
    SWOTAnalysis,
    // Blogs,
    TopSEOS,
    // prospectPrompt,
    // emailPrompt,
  ];
  return allPrompts;
};

module.exports = {
  About,
  SWOTAnalysis,
  Marketposition,
  TopClients,
  Industries,
  Products,
  Services,
  Leadership,
  Summary,
  getAllPrompts,
  InitialMessage,
  Blogs,
  prospectPrompt,
  emailPrompt,
  newPersonaPrompt,
  ProductEngagementProspectPrompt,
  BrandAwarenessProspectPrompt,
  EventLedProspectPrompt,
  newEmailPromptForBrandAwareness,
  newEmailPromptForProductEngagement,
  newEmailPromptForEventLed,
  defaultPersonas,
  promptforAvatar,
  Calendarprompt,
  Calendarpromptv1,
  Calendarprompt_of_Brandawareness_and_ThoughtLeadership,
  Calendarprompt_of_ProductEngagement_and_ProductAwareness,
  IncludetypeofContent,
  IncludeProduct,
  IncludeService,
  IncludePersona,
  IncludeKPI,
  IncludeThemes,
  IncludeMotivation,
  IncludePainPoints,
  IncludeAdditional,
  Platform,
  DataInsight,
  MultiplePersonas,
  Themes,
  BrandAwarenessCalendar
};
