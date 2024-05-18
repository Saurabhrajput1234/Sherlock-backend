const express = require("express");
const app = express();
require('dotenv').config();
require("./db/conn");
const router = require('./routes/router');
const cors = require("cors");
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(router);

// const { connectToMongoDB } = require('./db/mongoChangeStream');

// // Start MongoDB change stream and SSE logic
// connectToMongoDB();

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});