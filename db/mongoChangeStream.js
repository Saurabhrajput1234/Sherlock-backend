// mongoChangeStream.js

const { MongoClient } = require('mongodb');

let connectedClients = [];

async function connectToMongoDB() {
  try {
    const DB = "mongodb+srv://saurabhrajput30072002:hQ3D5bHX8YZ8TUFL@studentdata.kv8ukp1.mongodb.net/sherlock?retryWrites=true&w=majority"; // Update this line with your MongoDB connection URI
    const client = new MongoClient(DB, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    console.log('Connected to MongoDB');

    const database = client.db('sherlock');
    const collection = database.collection('userdbauth12');

    const changeStream = collection.watch();

    changeStream.on('change', (change) => {
      console.log('Change:', change);
      if (change.operationType === 'update' && change.updateDescription && change.updateDescription.updatedFields) {
        const updatedUserData = change.fullDocument; // Get the updated user data
        sendSSE(updatedUserData);
      }
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

function sendSSE(data) {
  connectedClients.forEach(client => {
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

module.exports = {
  connectToMongoDB,
  sendSSE,
  connectedClients
};
