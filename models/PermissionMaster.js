const mongoose = require("mongoose");

const PermissionMasterSchema = new mongoose.Schema({
    name: String,
    status:Boolean,
    
  });
  

const PermissionMaster = mongoose.model("PermissionMaster", PermissionMasterSchema);

module.exports=PermissionMaster;