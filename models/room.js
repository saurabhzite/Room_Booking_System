const mongoose = require("mongoose");
const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  roomType: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  image1: {
    type: Buffer,
    required: true,
  },
  image1Type: {
    type: String,
    required: true,
  },
  image2: {
    type: Buffer,
    required: true,
  },
  image2Type: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  description: {
    type: String,
  },
  isAvailable: {
    type: Boolean,
    required: true,
    default: true,
  },
  checkinDate: {
    type: Date,
  },
  checkoutDate: {
    type: Date,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Owner",
  },
});

roomSchema.virtual("image1Path").get(function () {
  if (this.image1 != null && this.image1Type != null) {
    return `data:${this.image1Type};charset=utf-8;base64,${this.image1.toString(
      "base64"
    )}`;
  }
});
roomSchema.virtual("image2Path").get(function () {
  if (this.image2 != null && this.image2Type != null) {
    return `data:${this.image2Type};charset=utf-8;base64,${this.image2.toString(
      "base64"
    )}`;
  }
});

module.exports = mongoose.model("Room", roomSchema);
