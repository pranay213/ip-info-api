const { Schema, model } = require("mongoose");

const orderSchema = new Schema(
  {
    productInfo: {
      type: Schema.ObjectId,
      ref: "Product",
      required: true,
    },
    buyer_id: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = model("Order", orderSchema);
