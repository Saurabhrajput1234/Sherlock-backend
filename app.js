const express = require("express");
const app = express();
require('dotenv').config();
require("./db/conn");
const router = require('./routes/router');
const cors = require("cors");
const PORT = process.env.PORT || 3001

// app.get("/",(req,res)=>{
//   res.status(201).json("server created")
// });
app.use(cors());
app.use(express.json());
app.use(router);


app.listen(PORT,()=>{
  console.log(`server start at port no :${PORT}`)
})

