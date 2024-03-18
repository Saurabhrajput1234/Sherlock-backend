const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  textdata: { type: String, required: false }, // Changed 'requires' to 'required'
  file: { type: String, required: false }
});

const filedb = mongoose.model("filedatas", schema);
module.exports = filedb;
