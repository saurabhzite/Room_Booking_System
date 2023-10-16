const express = require("express");
const { model } = require("mongoose");
const router = express.Router();
const Owner = require("../models/owner");
// const room = require("../models/room")
const Room = require("../models/room");
const imageMimeTypes = ["image/jpeg", "image/png", "image/gif"];
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.jwt;

//all room routes
router.get("/", async (req, res) => {
  const { token } = req.cookies;
  if (verifyToken(token) === false) {
    res.redirect("/login");
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

    res.render("rooms/index", {
      rooms: rooms,
      searchOptions: req.query,
      roomTypes: ["Single", "Double", "Triple", "Suite", "Queen", "King"],
    });
  } catch {
    res.redirect("/");
  }
});

//new route
router.get("/new", (req, res) => {
  const { token } = req.cookies;
  if (verifyToken(token) === false) {
    res.redirect("/login");
  }
  renderNewPage(res, new Room());
});

//create room route
router.post("/", async (req, res) => {
  const { token } = req.cookies;
  if (verifyToken(token) === false) {
    res.redirect("/login");
  }
  const room = new Room({
    name: req.body.name.trim(),
    owner: req.body.owner.trim(),
    roomType: req.body.roomType.trim(),
    price: req.body.price.trim(),
    state: req.body.state.trim(),
    city: req.body.city.trim(),
    address: req.body.address.trim(),
    description: req.body.description.trim(),
  });
  saveImage1(room, req.body.image1);
  saveImage2(room, req.body.image2);
  try {
    const newRoom = await room.save();
    // res.redirect(`books/${newRoom.id}`)
    res.redirect("/rooms");
  } catch (err) {
    console.log(err);
    renderNewPage(res, room, true);
  }
});
// Show Room Route
router.get("/:id", async (req, res) => {
  const { token } = req.cookies;
  if (verifyToken(token) === false) {
    res.redirect("/login");
  }
  try {
    const room = await Room.findById(req.params.id).populate("owner").exec();
    const roomWithCustomer = await Room.findById(req.params.id)
      .populate("customer")
      .exec();
    res.render("rooms/show", {
      room: room,
      roomWithCustomer: roomWithCustomer,
    });
  } catch {
    res.redirect("/");
  }
});
// Edit Room Route:Just Display
router.get("/:id/edit", async (req, res) => {
  const { token } = req.cookies;
  if (verifyToken(token) === false) {
    res.redirect("/login");
  }
  try {
    const room = await Room.findById(req.params.id);
    renderEditPage(res, room);
  } catch {
    res.redirect("/");
  }
});

// Update Room Route
router.put("/:id", async (req, res) => {
  const { token } = req.cookies;
  if (verifyToken(token) === false) {
    res.redirect("/login");
  }
  let room;

  try {
    room = await Room.findById(req.params.id);
    room.name = req.body.name;
    room.owner = req.body.owner;
    room.roomType = req.body.roomType;
    room.price = req.body.price;
    room.state = req.body.state;
    room.city = req.body.city;
    room.address = req.body.address;
    room.description = req.body.description;
    if (req.body.image1 != null && req.body.image1 !== "") {
      saveImage1(room, req.body.image1);
    }
    if (req.body.image2 != null && req.body.image2 !== "") {
      saveImage2(room, req.body.image2);
    }
    await room.save();
    res.redirect(`/rooms/${room.id}`);
  } catch (err) {
    if (room != null) {
      console.log(err);
      renderEditPage(res, room, true);
    } else {
      redirect("/");
    }
  }
});

// Delete Book Page
router.delete("/:id", async (req, res) => {
  const { token } = req.cookies;
  if (verifyToken(token) === false) {
    res.redirect("/login");
  }
  let room;
  try {
    room = await Room.findById(req.params.id);
    await room.remove();
    res.redirect("/rooms");
  } catch {
    if (book != null) {
      res.render("rooms/show", {
        room: room,
        errorMessage: "Could not remove Room",
      });
    } else {
      res.redirect("/");
    }
  }
});

async function renderNewPage(res, room, hasError = false) {
  renderFormPage(res, room, "new", hasError);
}

async function renderEditPage(res, room, hasError = false) {
  renderFormPage(res, room, "edit", hasError);
}

async function renderFormPage(res, room, form, hasError = false) {
  try {
    const owners = await Owner.find({});
    const params = {
      owners: owners,
      room: room,
      roomTypes: ["Single", "Double", "Triple", "Suite", "Queen", "King"],
    };
    if (hasError) {
      if (form === "edit") {
        params.errorMessage = "Error Updating Room";
      } else {
        params.errorMessage = "Error Creating Room";
      }
    }
    res.render(`rooms/${form}`, params);
  } catch {
    res.redirect("/rooms");
  }
}

function saveImage1(room, image1Encoded) {
  if (image1Encoded == null) return;
  const image1 = JSON.parse(image1Encoded);
  if (image1 != null && imageMimeTypes.includes(image1.type)) {
    room.image1 = new Buffer.from(image1.data, "base64");
    room.image1Type = image1.type;
  }
}
function saveImage2(room, image2Encoded) {
  if (image2Encoded == null) return;
  const image2 = JSON.parse(image2Encoded);
  if (image2 != null && imageMimeTypes.includes(image2.type)) {
    room.image2 = new Buffer.from(image2.data, "base64");
    room.image2Type = image2.type;
  }
}
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
