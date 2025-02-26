const mongoose = require("mongoose");

const adminSmaLogsSchema = new mongoose.Schema(
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
    prices: {
      type: [Number], // Array of prices for calculating SMA
      required: true,
    },
    sum: {
      type: Number, // Sum of the prices used in SMA calculation
      required: true,
    },
    sma: {
      type: Number, // The calculated Simple Moving Average
      required: true,
    },
  },
  {
    timestamps: true, // Optionally track createdAt and updatedAt
  }
);

const AdminSmaLogs = mongoose.model("AdminSmaLogs", adminSmaLogsSchema);

module.exports = AdminSmaLogs;
