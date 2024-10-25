const { Router } = require("express");
const {
  signout,
  signup,
  signin,
  sendResetPassword,
  confirmResetPassword,
  googleSignin,
  getUserdata,
  isSignedIn,
  sendotp,
  isAuthenticated
} = require("../controllers/auth.js");
const { check } = require("express-validator");


const router = Router();

router.post(
  "/signup",
  check("name").isLength({ min: 3 }).withMessage("Name must be atleast 3 chars"),
  check("lastname").isLength({ min: 3 }).withMessage("Lastname must be atleast 3 chars"),
  check("email").isEmail().withMessage("Email must be atleast 3 chars"),
  signup
);

router.post(
  "/googleSignin",
  googleSignin
);

router.post(
  "/signin",
  check("email").isEmail().withMessage("Must be Email"),
  signin
);

router.post(
  "/sendotp",
  check("email").isEmail().withMessage("Must be Email"),
  sendotp
);

router.post("/reset-password/request",
check("email").isEmail().withMessage("Must be Email"),
sendResetPassword 
);

router.post("/reset-password/confirm",
confirmResetPassword 
);

router.get("/signout", signout);

router.post("/getuserdata", getUserdata);

router.get("/test", isSignedIn, (req, res) => {
  res.send("Protected Route");
});



module.exports = router;
