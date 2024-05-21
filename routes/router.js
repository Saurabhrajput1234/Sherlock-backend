const express = require("express");
const router = express.Router();
const FilePairModel = require("../models/userSchema");
const authenticate = require("../middleware/authenticate");
const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcryptjs");
const upload = require("../middleware/upload");

// // Route for SSE events
// router.get('/events', (req, res) => {
//   res.setHeader('Content-Type', 'text/event-stream');
//   res.setHeader('Cache-Control', 'no-cache');
//   res.setHeader('Connection', 'keep-alive');
//   res.flushHeaders();

//   const clientId = Date.now();
//   connectedClients.push({ id: clientId, res });

//   req.on('close', () => {
//     console.log(`Connection ${clientId} closed`);
//     connectedClients = connectedClients.filter(c => c.id !== clientId);
//   });
// });

// Configure Cloudinary with yo
cloudinary.config({
  cloud_name: "dcnblai32",
  api_key: "322754248918634",
  api_secret: "hPd5b4MA8UToPXSpFgZ4BUAFYcc",
});

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

// user validation
router.get("/validuser", authenticate, async (req, res) => {
  console.log("hellll", req.userId);
  try {
    const validUserOne = await FilePairModel.findOne({ _id: req.userId });
    res.status(201).json({ status: 201, validUserOne });
    console.log("hellll", validUserOne);
  } catch (error) {
    res.status(401).json({ status: 401, error });
  }
});

//routes for storing filepair data
router.post("/filedata",authenticate,
  upload.fields([{ name: "file" }, { name: "resultdata" },{ name: "report" }]),
  async (req, res) => {
    const { entity, status, filePairId, sharedFileEmailsData } = req.body;
    const files = req.files;
    const userId = req.userId;

    try {
      if (!files["file"] && !entity && !files["resultdata"] ) {
        return res.status(422).json({ error: "Fill at least one field" });
      }

      let filePairData = {};

      if (files["file"]) {
        const cloudinaryFileResponse = await cloudinary.uploader.upload(
          files["file"][0].path,
          { resource_type: "raw" }
        );
        filePairData.inputFile = cloudinaryFileResponse.secure_url; // Save file URL
      } 

      if (files["resultdata"]) {
        const cloudinaryResultDataResponse = await cloudinary.uploader.upload(
          files["resultdata"][0].path,
          { resource_type: "raw" }
        );
        filePairData.resultdata = cloudinaryResultDataResponse.secure_url; // Save resultdata URL
      } 


      if (files["report"]) {
        const cloudinaryReportDataResponse = await cloudinary.uploader.upload(
          files["resultdata"][0].path,
          { resource_type: "raw" }
        );
        filePairData.report = cloudinaryReportDataResponse.secure_url; // Save resultdata URL
      } 

      if (filePairId) {
        filePairData.filePairId = filePairId;
      } else {
        console.log("require");
      }
      if (entity) {
        filePairData.entity = entity;
      } 
      if (sharedFileEmailsData) {
        filePairData.sharedFileEmailsData = sharedFileEmailsData;
      } 
      if (status) {
        filePairData.status = status;
      } 

      const user = await FilePairModel.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const filePair = user.filePairs.create(filePairData);

      user.filePairs.push(filePairData);
      await user.save();

      res
        .status(200)
        .json({ message: "File pair saved successfully", filePair: filePair });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.post("/update/filepair/:filePairId",
  upload.fields([
    { name: "inputFile" },
    { name: "resultdata" },
    { name: "report" },
  ]),
  async (req, res) => {
    const filePairId = req.params.filePairId;
    const { entity, status, sharedFileEmail } = req.body;
    const files = req.files;

    try {
      if (!filePairId) {
        return res.status(422).json({ error: "File Pair ID is required" });
      }

      const users = await FilePairModel.find({ "filePairs.filePairId": filePairId });
      if (!users.length) {
        return res.status(404).json({ error: "File pair not found" });
      }

      let updatedFilePairs = [];

      // Iterate through all users containing the matching file pair
      for (const user of users) {
        // Find the file pair within the user's filePairs array
        const filePair = user.filePairs.find(pair => pair.filePairId === filePairId);
        if (filePair) {
          // Update entity and status if provided
          if (entity) filePair.entity = entity;
          if (status) filePair.status = status;
          if (sharedFileEmail) {
            if (!Array.isArray(filePair.sharedFileEmailsData)) {
              filePair.sharedFileEmailsData = [];
            }
            filePair.sharedFileEmailsData.push(sharedFileEmail);
          }

          // Handle file uploads if provided
          if (files) {
            if (files["inputFile"]) {
              const cloudinaryResponse = await cloudinary.uploader.upload(files["inputFile"][0].path,{ resource_type: "raw" });
              filePair.inputFile = cloudinaryResponse.secure_url;
            }

            if (files["report"]) {
              const cloudinaryResponse = await cloudinary.uploader.upload(files["report"][0].path, { resource_type: "raw" });
              filePair.report = cloudinaryResponse.secure_url;
            }

            if (files["resultdata"]) {
              const cloudinaryResponse = await cloudinary.uploader.upload(files["resultdata"][0].path, { resource_type: "raw" });
              filePair.resultdata = cloudinaryResponse.secure_url;
            }
          }

          // Save the updated user
          await user.save();

          updatedFilePairs.push(filePair);
        }
      }

      return res.status(200).json({ success: true, message: "File pairs updated successfully", updatedData: updatedFilePairs });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.post("/share-file-pair", async (req, res) => {
  try {
    // Extract the necessary data from the request body
    const { filePairId, sharedFromEmail, sharedToEmail } = req.body;
    console.log(filePairId);
    console.log(sharedFromEmail);
    console.log(sharedToEmail);

    // Find the sender in the database by email
    const sender = await FilePairModel.findOne({ email: sharedFromEmail });
    if (!sender) {
      return res.status(404).send("Sender not found.");
    }

    // Find the receiver in the database by email
    const receiver = await FilePairModel.findOne({ email: sharedToEmail });
    if (!receiver) {
      return res.status(404).send("Receiver not found.");
    }

    // Retrieve the shared file pair object from the sender's filePairs array
    const filePair = sender.filePairs.find(
      (pair) => pair.filePairId === filePairId
    );
    if (!filePair) {
      return res.status(404).send("File pair not found.");
    }

    // Create a new shared file pair instance
    const sharedFilePair = {
      filePairId,
      sharedFrom: sender._id,
      sharedTo: receiver._id,
    };

    // Add the shared file pair to the sender's sharedFilePairs array
    // sender.sharedFilePairs.push(sharedFilePair);
    // await sender.save();

    // Add the shared file pair to the receiver's sharedFilePairs array
    receiver.sharedFilePairs.push(sharedFilePair);

    // Add the file pair to the receiver's filePairs array if it doesn't already exist
    if (!receiver.filePairs.some((pair) => pair.filePairId === filePairId)) {
      receiver.filePairs.push(filePair);
    }

    await receiver.save();

    res.status(201).send("File pair shared successfully.");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal server error");
  }
});

// Route to find a user by ID
router.get("/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await FilePairModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
