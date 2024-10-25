const mongoose = require("mongoose");
const Company = require("./Company");


const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      maxlength: 32,
      trim: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 32,
      trim: true,
    },
    lastname: {
      type: String,
      maxlength: 32,
      trim: true,
    },
    role: {
      type: Number,
      default: "0",
    },
    companyId: {
      type: mongoose.ObjectId,
      ref: Company,
    },
    firstTimeLogin :  {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String, // Store OTP as a string
      default: null,
    },
    otpExpires: {
      type: Date, // OTP expiration time
      default: null,
    },
  },
  { timestamps: true }
);




const User = mongoose.model("User", userSchema);

module.exports = User;
