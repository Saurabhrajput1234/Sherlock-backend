const mongoose = require("mongoose");

const schema = new mongoose.Schema({

  name: { type:String,uppercase:true,requires:true,trim:true},
  
  file: {type:String,required:true}

});

const filedb = mongoose.model("filedatas", schema);
module.exports = filedb;