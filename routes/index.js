const express = require("express");
const router = express.Router();
const Room = require("../models/room");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.jwt;

router.get("/", async (req, res) => {
  const { token } = req.cookies;
  if (verifyToken(token) === false) {
    res.redirect("/login");
  }
  let rooms;
  try {
    rooms = await Room.find().sort({ createAt: "desc" }).limit(10).exec();
    res.render("index", { rooms: rooms });
  } catch {
    rooms = [];
  }
});

//new
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

module.exports = router;
