const express = require("express");
const owner = require("../models/user");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const salt = 10;
const jwt = require("jsonwebtoken");
// var cookieParser = require("cookie-parser");
require("dotenv").config();
const JWT_SECRET = process.env.jwt;

// router.get("/new", (req, res) => {
//   res.render(res, new Room());
// });
router.post("/signup", async (req, res) => {
  // geting our data from frontend
  const { email, password: plainTextPassword } = req.body;
  //checking data
  if (email == "" || email == undefined) {
    return res.render("forms/signup", {
      emptyEmail: true,
      emptyPassword: false,
    });
  }
  if (plainTextPassword == "" || plainTextPassword == undefined) {
    return res.render("forms/signup", {
      emptyPassword: true,
      emptyEmail: false,
    });
  }

  // encrypting our password to store in database
  const password = await bcrypt.hash(plainTextPassword, salt);
  try {
    // storing our user data into database
    const response = await User.create({
      email,
      password,
    });
    return res.redirect("/");
  } catch (error) {
    console.log(JSON.stringify(error));
    if (error.code === 11000) {
      return res.send({ status: "error", error: "email already exists" });
    }
    throw error;
  }
});

const verifyUserLogin = async (email, password) => {
  try {
    const user = await User.findOne({ email }).lean();
    if (!user) {
      return { status: "error", error: "user not found" };
    }
    if (await bcrypt.compare(password, user.password)) {
      // creating a JWT token
      token = jwt.sign(
        { id: user._id, username: user.email, type: "user" },
        JWT_SECRET,
        { expiresIn: "2h" }
      );
      return { status: "ok", data: token };
    }
    return { status: "error", error: "invalid password" };
  } catch (error) {
    console.log(error);
    return { status: "error", error: "timed out" };
  }
};

// login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (email == "" || email == undefined) {
    return res.render("forms/signin", {
      emptyEmail: true,
      emptyPassword: false,
    });
  }
  if (password == "" || password == undefined) {
    return res.render("forms/signin", {
      emptyPassword: true,
      emptyEmail: false,
    });
  }
  // console.log("agekdj");

  // we made a function to verify our user login
  const response = await verifyUserLogin(email, password);
  if (response.status === "ok") {
    // storing our JWT web token as a cookie in our browser
    res.cookie("token", token, { maxAge: 2 * 60 * 60 * 1000, httpOnly: true }); // maxAge: 2 hours
    res.redirect("/");
  } else {
    res.json(response);
  }
});

router.get("/logout", (req, res) => {
  return res.clearCookie("token").status(200).redirect("/login");
});

const verifyToken = (token) => {
  try {
    const verify = jwt.verify(token, JWT_SECRET);
    if (verify.type === "user") {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log(JSON.stringify(error), "error");
    return false;
  }
};
router.get("/login", (req, res) => {
  res.render("forms/signin", { emptyEmail: false, emptyPassword: false });
});

router.get("/signup", (req, res) => {
  res.render("forms/signup", { emptyEmail: false, emptyPassword: false });
});
module.exports = router;
