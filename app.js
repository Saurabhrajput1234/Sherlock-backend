const express = require("express");
const app = express();
require('dotenv').config();
require("./db/conn");
const router = require('./routes/router');
const cors = require("cors");
const port = 3000;

// app.get("/",(req,res)=>{
//   res.status(201).json("server created")
// });
app.use(express.json());
app.use(router);
app.use(cors());

app.listen(process.env.PORT,()=>{
  console.log(`server start at port no :${port}`)
})

