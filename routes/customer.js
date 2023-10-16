const express = require("express");
const router = express.Router();
const Customer = require("../models/customer");
const Room = require("../models/room");
const bcrypt = require("bcryptjs");
const salt = 10;
const jwt = require("jsonwebtoken");
const room = require("../models/room");
require("dotenv").config();
const JWT_SECRET = process.env.jwt;

router.post("/signup", async (req, res) => {
  // geting our data from frontend
  const { email, password: plainTextPassword, name, phoneNumber } = req.body;
  //checking data
  if (name == "" || name == undefined) {
    return res.render("customer/forms/signup", {
      emptyPassword: false,
      emptyEmail: false,
      emptyName: true,
      emptyPhoneNumber: false,
    });
  }
  if (phoneNumber == "" || phoneNumber == undefined) {
    return res.render("customer/forms/signup", {
      emptyPassword: false,
      emptyEmail: false,
      emptyName: false,
      emptyPhoneNumber: true,
    });
  }
  if (email == "" || email == undefined) {
    return res.render("customer/forms/signup", {
      emptyEmail: true,
      emptyPassword: false,
      emptyName: false,
      emptyPhoneNumber: false,
    });
  }
  if (plainTextPassword == "" || plainTextPassword == undefined) {
    return res.render("customer/forms/signup", {
      emptyPassword: true,
      emptyEmail: false,
      emptyName: false,
      emptyPhoneNumber: false,
    });
  }

  // encrypting our password to store in database
  const password = await bcrypt.hash(plainTextPassword, salt);
  try {
    // storing our user data into database
    const response = await Customer.create({
      email,
      password,
      name,
      phoneNumber,
    });
    return res.redirect("/customer");
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
    const customer = await Customer.findOne({ email }).lean();
    if (!customer) {
      return { status: "error", error: "customer not found" };
    }
    if (await bcrypt.compare(password, customer.password)) {
      // creating a JWT token
      token = jwt.sign(
        { id: customer._id, customername: customer.email, type: "customer" },
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
    return res.render("customer/forms/signin", {
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
    res.redirect("/customer");
  } else {
    res.json(response);
  }
});

router.get("/login", (req, res) => {
  res.render("customer/forms/signin", {
    emptyEmail: false,
    emptyPassword: false,
  });
});

router.get("/signup", (req, res) => {
  res.render("customer/forms/signup", {
    emptyEmail: false,
    emptyPassword: false,
    emptyPhoneNumber: false,
    emptyName: false,
  });
});

router.get("/logout", (req, res) => {
  return res.clearCookie("token").status(200).redirect("/customer/login");
});

// router.get("/", (req, res) => {
//   const { token } = req.cookies;
//   const verifiedToken = verifyToken(token);
//   if (verifiedToken.status === false) {
//     return res.redirect("/customer/login");
//   }
//   //   res.send(verifiedToken.content.id);
// });

router.get("/", async (req, res) => {
  const { token } = req.cookies;
  const verifiedToken = verifyToken(token);
  // console.log(verifiedToken);
  if (verifiedToken.status === false) {
    return res.redirect("/customer/login");
  }
  let query = Room.find();
  if (req.query.name != null && req.query.name != "") {
    query = query.regex("name", new RegExp(req.query.name.trim()), "i");
  }
  if (req.query.roomType != null && req.query.roomType != "") {
    query = query.regex("roomType", new RegExp(req.query.roomType.trim()), "i");
  }
  if (req.query.state != null && req.query.state != "") {
    query = query.regex("state", new RegExp(req.query.state.trim()), "i");
  }
  if (req.query.city != null && req.query.city != "") {
    query = query.regex("city", new RegExp(req.query.city.trim()), "i");
  }

  try {
    const rooms = await query.exec();

    res.render("customer/rooms/index", {
      rooms: rooms,
      searchOptions: req.query,
      roomTypes: ["Single", "Double", "Triple", "Suite", "Queen", "King"],
    });
  } catch {
    res.redirect("/customer");
  }
});

router.get("/rooms/:id", async (req, res) => {
  const { token } = req.cookies;
  const verifiedToken = verifyToken(token);
  if (verifiedToken.status === false) {
    return res.redirect("/customer/login");
  }
  try {
    const room = await Room.findById(req.params.id).exec();
    // console.log(room);
    res.render("customer/rooms/show", {
      room: room,
      bookedSuccessfully: false,
    });
  } catch {
    res.redirect("/customer/login");
  }
});
router.put("/book/:id", async (req, res) => {
  const { token } = req.cookies;
  const verifiedToken = verifyToken(token);
  if (verifiedToken.status === false) {
    return res.redirect("/customer/login");
  }
  try {
    let room = await Room.findById(req.params.id);
    room.checkinDate = new Date(req.body.checkinDate);
    room.checkoutDate = new Date(req.body.checkoutDate);
    room.isAvailable = false;
    room.customer = verifiedToken.content.id;
    await room.save();
    res.render("customer/rooms/show", { room: room, bookedSuccessfully: true });
    // console.log(room);
  } catch (error) {
    console.log(error);
  }
});

const verifyToken = (token) => {
  try {
    const verify = jwt.verify(token, JWT_SECRET);
    if (verify.type === "customer") {
      return { status: true, content: verify };
    }
    //  else {
    //   return { status: false };
    // }
  } catch (error) {
    console.log(JSON.stringify(error), "error");
    return { status: false };
  }
};

module.exports = router;
