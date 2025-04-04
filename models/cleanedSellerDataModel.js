const mongoose = require("mongoose");

const cleanedSellerDataSchema = new mongoose.Schema(
  {
    commodity: {
      type: String,
      required: true,
    },
    commodity_id: {
      type: String,
      required: true,
    },
    week: {
      type: String,
      required: true,
    },
    original_price: {
      type: Number,
      required: true,
    },
    cleaned_price: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true, // Optionally track createdAt and updatedAt
  }
);

const CleanedSellerData = mongoose.model("CleanedSellerData", cleanedSellerDataSchema);

module.exports = CleanedSellerData;
