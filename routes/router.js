const express = require("express");
const router = express.Router();
const FilePairModel = require("../models/userSchema");
const authenticate = require("../middleware/authenticate");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcryptjs");

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: "dcnblai32",
  api_key: "322754248918634",
  api_secret: "hPd5b4MA8UToPXSpFgZ4BUAFYcc",
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// Endpoint for storing files
router.post(
  "/filedata",
  upload.fields([{ name: "file" }, { name: "resultdata" }]),
  async (req, res) => {
    const { entity, status } = req.body;
    const files = req.files;
    const userId = req.body.userId;

    try {
      if (!files["file"] && !entity && !files["resultdata"]) {
        return res.status(422).json({ error: "Fill at least one field" });
      }

      let filePairData = {};

      if (files["file"]) {
        const cloudinaryFileResponse = await cloudinary.uploader.upload(
          files["file"][0].path,
          { resource_type: "raw" }
        );
        filePairData.inputFile = cloudinaryFileResponse.secure_url; // Save file URL
      } else {
        filePairData.inputFile = null;
      }

      if (files["resultdata"]) {
        const cloudinaryResultDataResponse = await cloudinary.uploader.upload(
          files["resultdata"][0].path,
          { resource_type: "raw" }
        );
        filePairData.resultdata = cloudinaryResultDataResponse.secure_url; // Save resultdata URL
      } else {
        filePairData.resultdata = null; // Store null if 'resultdata' field is not provided
      }

      // If 'entity' field exists, save its value
      if (entity) {
        filePairData.entity = entity;
      } else {
        filePairData.entity = null;
      }
      if (status) {
        filePairData.status = status;
      } else {
        filePairData.status = null;
      }

      const user = await FilePairModel.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      user.filePairs.push(filePairData);
      await user.save();

      res.status(200).json({ message: "File pair saved successfully" });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

//filepair data
router.post(
  "/update/filepair/:id",
  upload.fields([{ name: "inputFile" }, { name: "resultdata" }]),
  async (req, res) => {
    const id = req.params.id; 
    const { entity, status } = req.body;
    const files = req.files;
    console.log(req.body);
    try {
      if (!id) {
        return res.status(422).json({ error: "ID is required" });
      }

      const filePair = await FilePairModel.findOne({ "filePairs._id": id });
      console.log(filePair);

      if (!filePair) {
        return res.status(404).json({ error: "File pair not found" });
      }

      const index = filePair.filePairs.findIndex(
        (pair) => pair._id.toString() === id
      );

      if (entity) {
        filePair.filePairs[index].entity = entity;
      }
      if (status) {
        filePair.filePairs[index].status = status;
      }
      if (files["inputFile"]) {
        const cloudinaryResponse = await cloudinary.uploader.upload(
          files["inputFile"][0].path,
          { resource_type: "raw" }
        );
        filePair.filePairs[index].inputFile = cloudinaryResponse.secure_url;
      }
      if (files["resultdata"]) {
        const cloudinaryResponse = await cloudinary.uploader.upload(
          files["resultdata"][0].path,
          { resource_type: "raw" }
        );
        filePair.filePairs[index].resultdata = cloudinaryResponse.secure_url;
      }

      const updatedData = await filePair.save();

      return res.status(200).json({ success: true, updatedData });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// authentication

router.post("/register", async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword, role } =
    req.body;

  if (
    !firstName ||
    !lastName ||
    !email ||
    !password ||
    !confirmPassword ||
    !role
  ) {
    kmm;
    return res.status(422).json({ error: "Fill all details" });
  }

  try {
    const preuser = await FilePairModel.findOne({ email });
    if (preuser) {
      return res.status(422).json({ error: "This email already exists" });
    }

    if (password !== confirmPassword) {
      return res
        .status(422)
        .json({ error: "Password and confirm password do not match" });
    }

    const finalUser = new FilePairModel({
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      role, // Set role
    });

    await finalUser.save();

    return res.status(200).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//user Login
router.post("/login", async (req, res) => {
  console.log(req.body);
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(422).json({ error: "fill all the datails" });
  }
  try {
    const userValid = await FilePairModel.findOne({ email: email });
    console.log(userValid);
    if (userValid) {
      const isMatch = await bcrypt.compare(password, userValid.password);
      if (!isMatch) {
        res.status(422).json({ error: "invalid details" });
      } else {
        // token generate
        const token = await userValid.generateAuthtoken();

        console.log("token", token);
        // cookiegenerate
        res.cookie("usercookie", token, {
          expires: new Date(Date.now() + 9000000),
          httpOnly: true,
        });
        const result = {
          userValid,
          token,
        };
        res.status(201).json({ status: 201, result });
      }
    }
  } catch (error) {
    res.status(422).json(error);
  }
});

// user valid
router.get("/validuser", authenticate, async (req, res) => {
  try {
    const validUserOne = await FilePairModel.findOne({ _id: req.userId });
    res.status(201).json({ status: 201, validUserOne });
  } catch (error) {
    res.status(401).json({ status: 401, error });
  }
});

module.exports = router;
