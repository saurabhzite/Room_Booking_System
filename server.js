const express = require("express");

//new code
// const bodyparser = require("body-parser");
const jwt = require("jsonwebtoken");
var cookieParser = require("cookie-parser");
// const bcrypt = require("bcryptjs");
// const salt = 10;

const app = express();
const expressLayouts = require("express-ejs-layouts");
const methodOverride = require("method-override");
require("dotenv").config();

const indexRouter = require("./routes/index");
const ownerRouter = require("./routes/owners");
const roomRouter = require("./routes/rooms");
const userRouter = require("./routes/user");
const customerRouter = require("./routes/customer");

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.set("layout", "layouts/layout");
app.use(methodOverride("_method"));
app.use("/", expressLayouts);
app.use(express.static("public"));
app.use(express.urlencoded({ limit: "10mb", extended: false }));
//new
app.use(express.json());
app.use(cookieParser());
const JWT_SECRET = process.env.jwt;

app.use("/", indexRouter);
app.use("/owners", ownerRouter);
app.use("/rooms", roomRouter);
app.use("/customer", customerRouter);
app.use("/", userRouter);

const connectDB = require("./db/connect");
const port = 3000;
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log("Successfully connected to database");
    app.listen(port, () => {
      console.log(`Listening on port ${port}...`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
