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
  const { textdata } = req.body;
  const file = req.file;

  try {
    if (!file && !textdata) {
      return res.status(422).json({ error: "Fill at least one field" });
    }

    if (file) {
      const cloudinaryResponse = await cloudinary.uploader.upload(file.path);
      req.body.file = cloudinaryResponse.secure_url;
    }

    const savedData = await filedb.create(req.body);
    res.status(200).json({ data: savedData });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/filedata/:id", async (req, res) => {
  const id = req.params.id; // Get the id from request parameters

  try {
    // Find document by _id
    const data = await filedb.findById(id);

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

// Endpoint for updating data by ID
router.post("/update/filedata/:id", async (req, res) => {
  const id = req.params.id; // Get the id from request parameters
  console.log(req.body)
  const { resultdata } = req.body;

  try {
    // Check if id is provided
    if (!id) {
      return res.status(422).json({ error: "ID is required" });
    }

    // Check if resultdata is provided
    if (!resultdata) {
      return res.status(422).json({ error: "Resultdata is required for update" });
    }

    // Find existing data by id
    let existingData = await filedb.findById(id);

    // If data with the given id doesn't exist, return 404 error
    if (!existingData) {
      return res.status(404).json({ error: "Data not found" });
    }

    // Update the resultdata field
    existingData.resultdata = resultdata;

    // Save the updated data
    const savedData = await existingData.save();

    // Respond with the updated data
    return res.status(200).json({ data: savedData });
  } catch (error) {
    // Handle any errors
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
