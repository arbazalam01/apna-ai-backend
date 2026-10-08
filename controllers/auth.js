const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { expressjwt } = require("express-jwt");
const transporter = require("../utils/mailer");
const { validationResult } = require("express-validator");
const crypto = require("crypto");

const signout = (req, res) => {
  // Clear both cookies with the same attributes used when they were set
  res.clearCookie("token", { path: "/" });
  res.clearCookie("email", { path: "/" });
  res.json({
    message: "user signout successfull",
  });
};

// Utility function to generate OTP
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    // check if user already exists
    const user = await User.findOne({
      email: req.body.email,
    });
    if (user) {
      return res.status(402).json({
        error: "Email already exists",
      });
    }

    // Generate OTP and set expiry to 5 minutes
    const otp = generateOtp();
    const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

    req.body={
      ...req.body,
      otp:otp,
      otpExpires:otpExpires
    }


    const newUser = new User(req.body);
    data = await newUser.save();

    await sendOtpEmail(newUser.email, otp);
   
    res.json(data);
  } catch (err) {
    console.log(err);
  }
};

const googleSignin = async (req, res) => {
  const { credential } = req.body;

  // Check if the user already exists in the database
  let user = await User.findOne({ email: credential.email });

  if (!user) {
    // If the user does not exist, create a new user
    user = new User({
      name: payload.family_name,
      role: 1,
      email: payload.email,
      password: "Test@123", // Consider a more secure approach to handling passwords
    });
    await user.save();
  }

  const token = jwt.sign(
    {
      _id: user._id,
    },
    process.env.SECRET
  );
  res.cookie("token", token, {
    expire: new Date() + 9999,
  });
  res.cookie("email", user.email, {
    expire: new Date() + 9999,
  });

  const { _id, name, role, companyId, email } = user;
  return res.json({
    token,
    user: {
      _id,
      name,
      email,
      role,
      companyId,
    },
  });
};

const signin = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

  
    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(400).json({
        error: "User not found",
      });
    }

    // Check if OTP is valid and not expired
    if (!user.otp || user.otp !== otp || Date.now() > user.otpExpires) {
      return res.status(400).json({
        error: "Invalid or expired OTP",
      });
    }


    // Generate JWT
    const token = jwt.sign({ _id: user._id }, process.env.SECRET);

    res.cookie("token", token, {
      expire: new Date() + 9999,
    });
    res.cookie("email", user.email, {
      expire: new Date() + 9999,
    });

    const { _id, name, role, companyId, firstTimeLogin } = user;

    // Clear OTP and email after successful signin
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    return res.json({
      token,
      user: {
        _id,
        name,
        email,
        role,
        companyId,
        firstTimeLogin,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

const sendotp = async (req, res) => {
  const { email } = req.body;
  try {
    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ msg: "User not found, please sign up first." });
    }

    // Generate OTP and set expiry to 5 minutes
    const otp = generateOtp();
    const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

   
    user.otp = otp;
    user.otpExpires = otpExpires;
  

    await user.save();
    
    await sendOtpEmail(email, otp);

    res.status(200).json({ msg: "OTP sent to your email for login." });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

const isSignedIn = expressjwt({
  secret: process.env.SECRET,
  userProperty: "auth",
  algorithms: ["HS256"],
});

const isAuthenticated = (req, res, next) => {
  // Get the token from the Authorization header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Extract the token from 'Bearer <token>'

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  // Verify the token
  jwt.verify(token, process.env.SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    // If valid, attach the user to the request object and proceed
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.profile.role === 0) {
    return res.status(403).json({
      error: "You are not admin",
    });
  }
  next();
};

const sendResetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Find user by email (replace with actual database query)
    const user = await User.findOne({ email }).exec();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate a reset token
    const resetToken = jwt.sign({ userId: user.id }, process.env.SECRET, {
      expiresIn: "1h",
    });

    // Send reset link to user's email (replace with actual email sending logic)
    sendResetEmail(user.email, resetToken);

    res.json({ message: "Reset link sent to your email" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const confirmResetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.SECRET);

    // Find the user by decoded user ID (replace with actual database query)
    const user = await User.findById(decoded.userId).exec();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the user's password (replace with actual password update logic)
    user.encry_password = user.getSecurePass(newPassword);

    // Save the updated user
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Function to send reset email (replace with actual email sending logic)
function sendResetEmail(email, token) {
  const resetLink = `${process.env.CLIENT_URL}/resetpassword?token=${token}`;

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Password Reset",
    html: `
      <h2>Password Reset Request</h2>
      <p>We received a request to reset your password. Click the button below to reset your password:</p>
      <a href="${resetLink}" style="
        display: inline-block;
        padding: 10px 20px;
        font-size: 16px;
        color: #ffffff;
        background-color: #007bff;
        text-decoration: none;
        border-radius: 5px;
      ">Reset Password</a>
      <p>If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
      <p>Thank you!</p>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
}


const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    html: `
      <h1>Welcome to Apna Content</h1>
      <p>Thank you for signing up! Please use the otp to login. It will expire in 5 minutes:</p>
      <p>${otp}</p>
      <p>If you did not sign up for this account, please ignore this email.</p>
    `,
  };


  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
    
};

const getUserdata = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({
      email,
    });
    if (!user) {
      return res.status(400).json({
        error: "Email and password do not match",
      });
    }

    res.json({ message: user });
  } catch (err) {
    throw err;
  }
};

module.exports = {
  signin,
  signup,
  signout,
  isSignedIn,
  isAuthenticated,
  isAdmin,
  sendResetPassword,
  confirmResetPassword,
  googleSignin,
  getUserdata,
  sendotp,
};
