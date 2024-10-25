const Function_Info = [
  {
    section: "about",
    parameters: {
      type: "function",
      function: {
        name: "getAbout",
        description: "Get about information",
        parameters: {
          type: "object",
          properties: {
            description: {
              type: "string",
              description: "Description of company",
            },
            mission: { type: "string", description: "Mission of company" },
          },
          required: ["description", "mission"],
        },
      },
    },
  },
  {
    section: "products",
    parameters: {
      type: "function",
      function: {
        name: "getProducts",
        description: "Get all products that company offers.",
        parameters: {
          type: "object",
          properties: {
            products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Name/Title of product",
                  },
                  description: {
                    type: "string",
                    description: "Description of product",
                  },
                },
                required: ["name", "description"],
              },
            },
          },
          required: ["products"],
        },
      },
    },
  },
  {
    section: "services",
    parameters: {
      type: "function",
      function: {
        name: "getServices",
        description: "Get all services that company offers.",
        parameters: {
          type: "object",
          properties: {
            services: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Name/Title of service",
                  },
                  description: {
                    type: "string",
                    description: "Description of service",
                  },
                },
                required: ["name", "description"],
              },
            },
          },
          required: ["services"],
        },
      },
    },
  },
  {
    section: "leadership",
    parameters: {
      type: "function",
      function: {
        name: "getLeadership",
        description: "Get all leadership of company.",
        parameters: {
          type: "object",
          properties: {
            leadership: {
              type: "array",
              description: "Array of leadership",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "name of leadership people",
                  },
                  designation: {
                    type: "string",
                    description: "designation of people",
                  },
                  linkedin: {
                    type: "string",
                    description: "linkedin url of people",
                  },
                },
                required: ["name", "designation", "linkedin"],
              },
            },
          },
          required: ["leadership"],
        },
      },
    },
  },
  {
    section: "blogs",
    type: "function",
    function: {
      name: "getBlogs",
      description: "Get blogs information",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "link of blog listed on website",
          },
          titles: {
            type: "array",
            description: "Array of titles of blogs",
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "name of blog",
                },
                blogtype: {
                  type: "string",
                  description: "type of blog based on prompt",
                },
              },
            },
          },
        },

        required: ["url", "titles"],
      },
    },
  },
  {
    section: "swotanalysis",
    parameters: {
      type: "function",
      function: {
        name: "getSWOTAnalysis",
        description: "Get SWOT analysis",
        parameters: {
          type: "object",
          properties: {
            strengths: {
              type: "array",
              description: "Strengths of company",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Title/Name of strength",
                  },
                  description: {
                    type: "string",
                    description: "Description of strength",
                  },
                },
              },
            },
            weaknesses: {
              type: "array",
              description: "Weaknesses of company",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Title/Name of weakness",
                  },
                  description: {
                    type: "string",
                    description: "Description of weakness",
                  },
                },
              },
            },
            opportunities: {
              type: "array",
              description: "Opportunities for company",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Title/Name of opportunity",
                  },
                  description: {
                    type: "string",
                    description: "Description of opportunity",
                  },
                },
              },
            },
            threats: {
              type: "array",
              description: "Threats for company",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Title/Name of threat",
                  },
                  description: {
                    type: "string",
                    description: "Description of threat",
                  },
                },
              },
            },
          },

          required: ["strengths", "weaknesses", "opportunities", "threats"],
        },
      },
    },
  },
  {
    section: "marketposition",
    parameters: {
      type: "function",
      function: {
        name: "getMarketPositioning",
        description: "Get Market Positioning",
        parameters: {
          type: "object",
          properties: {
            corepurpose: {
              type: "array",
              description: "Array of items for core purpose",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Title for core purpose item",
                  },
                  description: {
                    type: "string",
                    description: "Description for core purpose item",
                  },
                },
                required: ["name", "description"],
              },
            },
            positioning: {
              type: "array",
              description: "Array of items for positioning",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Title for positioning item",
                  },
                  description: {
                    type: "string",
                    description: "Description for positioning item",
                  },
                },
                required: ["name", "description"],
              },
            },
            keydifferentiators: {
              type: "array",
              description: "Array of items for key differentiators",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Title for key differentiator item",
                  },
                  description: {
                    type: "string",
                    description: "Description for key differentiator item",
                  },
                },
                required: ["name", "description"],
              },
            },
            brandpersonality: {
              type: "array",
              description: "Array of items for brand personality",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Title for brand personality item",
                  },
                  description: {
                    type: "string",
                    description: "Description for brand personality item",
                  },
                },
                required: ["name", "description"],
              },
            },
          },
          required: [
            "corepurpose",
            "positioning",
            "keydifferentiators",
            "brandpersonality",
          ],
        },
      },
    },
  },
  {
    section: "industries",
    parameters: {
      type: "function",
      function: {
        name: "getIndustries",
        description: "Get industries served by company.",
        parameters: {
          type: "object",
          properties: {
            industries: {
              type: "array",
              items: {
                type: "string",
                description: "Name of industry",
              },
            },
          },
          required: ["industries"],
        },
      },
    },
  },
  {
    section: "topclients",
    parameters: {
      type: "function",
      function: {
        name: "getTopClients",
        description: "Get top clients",
        parameters: {
          type: "object",
          properties: {
            topclients: {
              type: "array",
              description: "Array of topclients",
              items: {
                type: "string",
                description: "Name of client",
              },
            },
          },
          required: ["topclients"],
        },
      },
    },
  },
  {
    section: "toptrends",
    parameters: {
      type: "object",
      properties: {
        toptrends: {
          type: "array",
          description: "Array of toptrends",
          items: {
            type: "string",
          },
        },
      },
      required: ["toptrends"],
    },
  },
  {
    section: "summary",
    parameters: {
      type: "function",
      function: {
        name: "getSummary",
        description: "Get Summary",
        parameters: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              description: "Summary of products and services",
            },
          },
          required: ["summary"],
        },
      },
    },
  },
  {
    section: "userpersona",
    parameters: {
      type: "function",
      function: {
        name: "getUserPersona",
        description: "Get User Persona of users",
        parameters: {
          type: "object",
          properties: {
            Demographic: {
              type: "array",
              description: "Array of demographics",
              items: {
                type: "string",
              },
            },
            Psychographic: {
              type: "array",
              description: "Array of Psychographic",
              items: {
                type: "string",
              },
            },
            PainPoints: {
              type: "array",
              description: "Array of PainPoints",
              items: {
                type: "string",
              },
            },
            Motivations: {
              type: "array",
              description: "Array of Motivations",
              items: {
                type: "string",
              },
            },
            Challenges: {
              type: "array",
              description: "Array of Challenges",
              items: {
                type: "string",
              },
            },
            Interests: {
              type: "array",
              description: "Array of Challenges",
              items: {
                type: "string",
              },
            },
          },
          required: [
            "Demographic",
            "Psychographic",
            "PainPoints",
            "Challenges",
            "Motivations",
            "Interests",
          ],
        },
      },
    },
  },
];
module.exports = Function_Info;
