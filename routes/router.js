const express = require("express");
const router = express.Router();
const FilePairModel = require("../models/userSchema");
const authenticate = require("../middleware/authenticate");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcryptjs");

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: 'dcnblai32',
  api_key: '322754248918634',
  api_secret: 'hPd5b4MA8UToPXSpFgZ4BUAFYcc'
});

// Multer storage configurationf
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
router.post('/filedata', upload.single('file'), async (req, res) => {
  const { textdata } = req.body;
  const file = req.file;
  const userId = req.body.userId; // Assuming userId is sent in the request body

  try {
    // Check if at least one field is filled
    if (!file && !textdata) {
      return res.status(422).json({ error: 'Fill at least one field' });
    }

    // Upload file to Cloudinary if exists
    let filePairData = {};
    if (file) {
      const cloudinaryResponse = await cloudinary.uploader.upload(file.path);
      filePairData.file = cloudinaryResponse.secure_url; // Save file URL
    }
    if (textdata) {
      filePairData.textdata = textdata; // Save text data
    }

    // Find the user by userId and update their filePairs array
    const user = await FilePairModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.filePairs.push(filePairData); // Push the new filePairData into the filePairs array
    await user.save(); // Save the updated user document

    res.status(200).json({ message: 'File pair saved successfully' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint for updating data by ID
router.post("/update/filedata/:id", upload.single('file'), async (req, res) => {
  const id = req.params.id; // Get the id from request parameters
  const { textdata } = req.body;
  const file = req.file;

  try {
    // Check if id is provided
    if (!id) {
      return res.status(422).json({ error: "ID is required" });
    }

    // Find existing data by id
    let existingData = await FilePairModel.findById(id);

    // If data with the given id doesn't exist, return 404 error
    if (!existingData) {
      return res.status(404).json({ error: "Data not found" });
    }

    // Create a new file pair instance
    let filePairData = {};
    if (file) {
      const cloudinaryResponse = await cloudinary.uploader.upload(file.path);
      filePairData.file = cloudinaryResponse.secure_url; // Save file URL
    }
    if (textdata) {
      filePairData.textdata = textdata; // Save text data
    }

    // Append the new file pair to existing file pairs
    existingData.filePairs.push(filePairData);

    // Save the updated data
    await existingData.save();

    // Respond with success message
    return res.status(200).json({ success: true });
  } catch (error) {
    // Handle any errors
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint for getting data by ID
router.get("/filedata/:id", async (req, res) => {
  const id = req.params.id; // Get the id from request parameters

  try {
    // Find document by _id
    const data = await FilePairModel.findById(id);

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

/// Endpoint for appending resultdata by ID
router.post("/update/resultdata/:id", async (req, res) => {
  const id = req.params.id; // Get the id from request parameters
  const { resultdata } = req.body; // Get the resultdata from the request body
  console.log('Received resultdata:', resultdata); // Log the resultdata received from the frontend

  try {
    // Check if id is provided
    if (!id) {
      return res.status(422).json({ error: "ID is required" });
    }

    // Find the file pair containing the matching ID
    const filePair = await FilePairModel.findOne({ "filePairs.id": id });
    

    // If file pair with the given id doesn't exist, return 404 error
    if (!filePair) {
      return res.status(404).json({ error: "File pair not found" });
    }

    // Find the index of the file pair in the array
    const index = filePair.filePairs.findIndex(pair => pair.id.toString() === id);

    // Append resultdata to the file pair
    filePair.filePairs[index].resultdata = resultdata;

    // Save the updated file pair
     const updatedData = await filePair.save();
     console.log(updatedData)

    // Respond with success message
    return res.status(200).json({ success: true });
  } catch (error) {
    // Handle any errors
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});




//authentication


// authentication

router.post("/register", async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword, role } = req.body;
  

  if (!firstName || !lastName || !email || !password || !confirmPassword || !role) {
    return res.status(422).json({ error: "Fill all details" });
  }

  try {
    // Check if the email already exists
    const preuser = await FilePairModel.findOne({ email });
    if (preuser) {
      return res.status(422).json({ error: "This email already exists" });
    }

    // Check if password and confirm password match
    if (password !== confirmPassword) {
      return res.status(422).json({ error: "Password and confirm password do not match" });
    }

    // Upload file to Cloudinary
   

    // Create new user document with Cloudinary URL
    const finalUser = new FilePairModel({
      firstName,
      lastName,
      email,
      password,
      confirmPassword, // Store Cloudinary URL
      role // Set role
    });

    // Save user to the database
    await finalUser.save();

    // Respond with success message
    return res.status(200).json({ message: "User registered successfully" });
  } catch (error) {
    // Handle registration errors
    console.error("Error registering user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


//user Login
router.post("/login",async(req,res)=>{
  console.log(req.body);
  const{ email,password}= req.body;
  if(!email || !password){
    res.status(422).json({error:"fill all the datails"})
  }
   try {
    const userValid = await FilePairModel.findOne({email:email});
    console.log(userValid)
     if (userValid){
      const isMatch = await bcrypt.compare(password,userValid.password);
      if(!isMatch){
        res.status(422).json({error:"invalid details"})

      }
      else{
        // token generate
        const token = await userValid.generateAuthtoken();
        
        console.log("token",token);
        // cookiegenerate
        res.cookie("usercookie",token,{
          expires:new Date(Date.now()+9000000),
          httpOnly:true
        });
        const result = {
          userValid,
          token
        }
        res.status(201).json({status:201,result})
      }
     }
   } catch (error) {
    res.status(422).json(error)
    
   }
 });

 // user valid
 router.get("/validuser",authenticate,async(req,res)=>{
 try{
  const validUserOne = await FilePairModel.findOne({_id:req.userId});
  res.status(201).json({status:201,validUserOne});
 } catch (error){
  res.status(401).json({status:401,error});

 }

 })


module.exports = router;
