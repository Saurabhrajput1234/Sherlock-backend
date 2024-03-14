const express = require("express");
const router = express.Router();
const filedb = require("../models/schema"); 
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: 'dcnblai32',
  api_key: '322754248918634',
  api_secret: 'hPd5b4MA8UToPXSpFgZ4BUAFYcc'
});

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Destination folder for storing uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use original file name
  }
});

const upload = multer({ storage: storage });

// Endpoint for storing files
router.post("/filedata", upload.single('file'), async (req, res) => {

  const { name,textdata } = req.body;
  const file = req.file;

  if (!name || !file || !textdata) { // Check if name or file is missing
    return res.status(422).json({ error: "Fill all fields" });
  }

  try {
    // Check if the name already exists
    const prename = await filedb.findOne({ name });
    if (prename) {
      return res.status(422).json({ error: "This name already exists" });
    }

    // Upload file to Cloudinary
    const cloudinaryResponse = await cloudinary.uploader.upload(file.path);

    // Create new document with Cloudinary URL
    const finalData = new filedb({
      name,
      textdata,
      file: cloudinaryResponse.secure_url // Store Cloudinary URL
    });

    // Save data to the database
    console.log(finalData)
    await finalData.save();
    console.log(finalData)

    // Respond with success message
    return res.status(200).json({ message: "Data saved successfully" });
  } catch (error) {
    // Handle errors
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/filedata/:name", async (req, res) => {
  const name = req.params.name;
  console.log(name);

  try {
    // Find document by name
    const data = await filedb.findOne({ name });

    if (!data) {
      return res.status(404).json({ error: "Data not found" });
    }

    // Respond with data
    return res.status(200).json(data);
  } catch (error) {
    // Handle errors
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
