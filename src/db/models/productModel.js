const { Schema, model } = require("mongoose");

const specificationSchema = new Schema({
  weight: {
    type: Number,
  },
  dimensions: {
    type: String, // "10 x 5 x 2 inches"
  },
  color: {
    type: String,
  },
  battery_life: {
    type: Number,
  },
});

const imageSchema = new Schema(
  {
    image_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
    },
  },
  {
    _id: false,
  }
);

const stockSchema = new Schema({
  available: {
    type: Number,
    required: true,
  },
  warehouse_location: {
    type: String,
    required: true,
  },
});

const contactSchema = new Schema({
  email: {
    type: String,
  },
  mobile_number: {
    type: String,
  },
});

const sellerSchema = new Schema({
  seller_id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  contact: {
    type: contactSchema,
    required: true,
  },
});

const productSchema = new Schema(
  {
    product_id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    sub_category: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    features: {
      type: [String],
      required: true,
    },
    specifications: specificationSchema,
    images: [imageSchema],
    reviews: {
      type: Array,
      ref: "Review",
    },
    stock: stockSchema,
    seller: sellerSchema,
    is_premium: {
      type: Boolean,
      default: false,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model("Product", productSchema);
