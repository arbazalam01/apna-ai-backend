const mongoose = require("mongoose");

const promptSchema = new mongoose.Schema({
    about:String,
    products:String,
    services:String,
    industries:String,
    leadership:String,
    blogs:String,
    linkedin:String,
    topclients:String,
    blogdata:String,
    marketposition:String,
    swotanalysis:String,
    userpersona:String,
    summary:String,
    topseos:String
  });


const Prompt = mongoose.model("Prompt", promptSchema);

module.exports = Prompt;