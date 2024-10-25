const { Schema, model } = require("mongoose");

const contactSchema = new Schema({
  email: {
    type: String,
  },
  mobile_number: {
    type: String,
  },
});

const userSchema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
      minLength: 4,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minLength: 8,
    },
    image: {
      type: String,
      required: true,
      default: "DUMMY_PROFILE_LOGO.png",
    },
    is_premium_user: {
      type: Boolean,
      required: true,
      default: false,
    },
    verified: {
      type: Boolean,
      required: true,
      default: false,
    },
    address: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      required: true,
      enum: ["buyer", "guest", "seller", "admin"],
    },
    contact: contactSchema,
  },
  {
    timestamps: true,
  }
);
module.exports = model("User", userSchema);
