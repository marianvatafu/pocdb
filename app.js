const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.json());

const mongoUsername = 'vatafumarian';
const mongoPassword = 'your_password';
const mongoHost = 'localhost';
const mongoPort = '27017';
const databaseName = 'your_database_name';

const mongoURI = `mongodb+srv://vatafumarian:1EboyHD4xhSsZXGy@cluster0.daubyrz.mongodb.net/`;
const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

let currentAmount = 0;
const amountsCollectionName = 'amounts';
const namesCollectionName = 'names';

async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
  }
}

async function loadData() {
    try {
      const db = client.db();
      const amountsCollection = db.collection(amountsCollectionName);
      const namesCollection = db.collection(namesCollectionName);
  
      const result = await amountsCollection.findOne({}); // Assuming there's only one document
  
      if (result) {
        currentAmount = result.value || 0;
      }
  
      const namesResult = await namesCollection.find({}).toArray();
      const namesList = namesResult.map((entry) => entry.name);
  
      console.log('Names List:', namesList); // Add this line for debugging
  
      return namesList;
    } catch (error) {
      console.error('Error reading data from MongoDB:', error.message);
      return [];
    }
  }
  

  async function saveData(amount, name) {
    try {
      const db = client.db();
      const amountsCollection = db.collection(amountsCollectionName);
      const namesCollection = db.collection(namesCollectionName);
  
      await amountsCollection.updateOne({}, { $set: { value: currentAmount + amount } }, { upsert: true });
      await namesCollection.insertOne({ name });
  
      currentAmount += amount;
    } catch (error) {
      console.error('Error writing data to MongoDB:', error.message);
    }
  }
  
  async function removeData(amount) {
    try {
      const db = client.db();
      const amountsCollection = db.collection(amountsCollectionName);
  
      // Subtract the amount directly from the stored value
      await amountsCollection.updateOne({}, { $inc: { value: -amount } }, { upsert: true });
  
      currentAmount -= amount;
    } catch (error) {
      console.error('Error writing data to MongoDB:', error.message);
    }
  }
  
  


app.get('/', async (req, res) => {
  const namesList = await loadData();
  res.render('index', { currentAmount, namesList });
});

app.post('/addmoney', async (req, res) => {
  const { amount, name } = req.body;
  await saveData(amount, name);
  res.redirect('/');
});

app.post('/removemoney', async (req, res) => {
    const { amount } = req.body;
    if (currentAmount >= amount) {
      await removeData(amount);
      res.redirect('/');
    } else {
      res.status(400).send('Not enough funds to remove.');
    }
  });
  
  
  

// Start the server, connect to the database, and load initial data
app.listen(port, async () => {
  await connectToDatabase();
  console.log(`Server listening at http://localhost:${port}`);
});

