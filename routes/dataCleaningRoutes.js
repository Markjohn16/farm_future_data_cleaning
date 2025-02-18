const router = require("express").Router();
const { model } = require("mongoose");
const DataCleaningAlgo = require("../controllers/DataCleaningAlgo");

router.post("/clean-data-now", DataCleaningAlgo.data_cleaning);

module.exports = router;
