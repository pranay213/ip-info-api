const { Schema, model } = require("mongoose");

const subcategorySchema = new Schema(
  {
    name: { type: String, required: true },
    status: {
      type: Boolean,
      required: true,
      default: false,
    },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    brands: [{ type: Schema.Types.ObjectId, ref: "Brand", required: true }],
    user_id: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model("SubCategory", subcategorySchema);
