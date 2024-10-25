const checkConfig = {
  about: {
    description: true,
    mission: true,
    facebook: {
      followers: true,
      handle: true,
    },
    instagram: {
      followers: true,
      handle: true,
    },
    linkedin: {
      followers: true,
      handle: true,
    },

    googleSheetUrl: true,

    compositeScoreUrl: true,
  },
  summary: true,
  products: true,
  services: true,
  industries: true,
  leadership: true,
  blogs: {
    url: true,
    titles: true,
  },
  linkedin: true,
  topclients: true,
  marketposition: {
    corepurpose: true,
    positioning: true,
    keydifferentiators: true,
    brandpersonality: true,
  },
  swotanalysis: {
    strengths: true,
    weaknesses: true,
    opportunities: true,
    threats: true,
  },
  userpersona: true,
};
module.exports = checkConfig;
