const express = require("express");
const owner = require("../models/owner");
const router = express.Router();
const Owner = require("../models/owner");
const Room = require("../models/room");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.jwt;

//all owners route or search route
router.get("/", async (req, res) => {
  const { token } = req.cookies;
  if (verifyToken(token) === false) {
    res.redirect("/login");
  }
  let searchOptions = {};
  if (req.query.name != null && req.query.name != "") {
    searchOptions.name = new RegExp(req.query.name, "i");
  }
  try {
    const owners = await Owner.find(searchOptions);
    res.render("owners/index", {
      owners: owners,
      searchOptions: req.query,
    });
  } catch {
    res.redirect("/");
  }
});

//new owner
router.get("/new", (req, res) => {
  const { token } = req.cookies;
  if (verifyToken(token) === false) {
    res.redirect("/login");
  }
  res.render("owners/new", { owner: new Owner() });
});

//create owner route
router.post("/", async (req, res) => {
  const { token } = req.cookies;
  if (verifyToken(token) === false) {
    res.redirect("/login");
  }
  const owner = new Owner({
    name: req.body.name,
    phone: req.body.phone,
    email: req.body.email,
  });
  try {
    const newOwner = await owner.save();
    // res.redirect(`authors/${newAuthor.id}`)
    res.redirect("/owners");
  } catch {
    res.render("owners/new", {
      owner: owner,
      errorMessage: "Error creating Owner",
    });
  }
});

//view
router.get("/:id", async (req, res) => {
  const { token } = req.cookies;
  if (verifyToken(token) === false) {
    res.redirect("/login");
  }
  try {
    const owner = await Owner.findById(req.params.id);
    const rooms = await Room.find({ owner: owner.id }).limit(6).exec();
    console.log();
    res.render("owners/show", {
      owner: owner,
      roomsOfOwner: rooms,
    });
  } catch (err) {
    console.log(err);
    res.redirect("/");
  }
});
//display edit page
router.get("/:id/edit", async (req, res) => {
  const { token } = req.cookies;
  if (verifyToken(token) === false) {
    res.redirect("/login");
  }
  try {
    const owner = await Owner.findById(req.params.id);
    res.render("owners/edit", { owner: owner });
  } catch {
    res.redirect("/owners");
  }
});
//update the owner
router.put("/:id", async (req, res) => {
  const { token } = req.cookies;
  if (verifyToken(token) === false) {
    res.redirect("/login");
  }
  let owner;
  try {
    owner = await Owner.findById(req.params.id);
    owner.name = req.body.name;
    owner.phone = req.body.phone;
    owner.email = req.body.email;
    await owner.save();
    res.redirect(`/owners/${owner.id}`);
  } catch {
    if (owner == null) {
      res.redirect("/");
    } else {
      res.render("owners/edit", {
        owner: owner,
        errorMessage: "Error updating Owner",
      });
    }
  }
});
// delete route
router.delete("/:id", async (req, res) => {
  const { token } = req.cookies;
  if (verifyToken(token) === false) {
    res.redirect("/login");
  }
  let owner;
  try {
    owner = await Owner.findById(req.params.id);
    await owner.remove();
    res.redirect("/owners");
  } catch {
    if (owner == null) {
      res.redirect("/");
    } else {
      res.redirect(`/owners/${owner.id}`);
    }
  }
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

module.exports = router;
