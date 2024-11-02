require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const serverless = require("serverless-http");

const app = express();
app.use(cors());
// app.use(express.json()); <-- uncomment to run on local

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const personSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  occupation: { type: String },
  imageUrl: { type: String },
  ethnicity: { type: String },
  nativeName: { type: String },
  birthDate: { type: String },
  birthPlace: { type: String },
  deathDate: { type: String },
  notableWork: { type: String },
  gender: { type: String },
});
const Person = mongoose.model("AsianPeople", personSchema, "AsianPeople");

const visitorSchema = new mongoose.Schema({
  ip: { type: String, required: true, unique: true },
  visitedAt: { type: Date, default: Date.now },
});
const Visitor = mongoose.model("Visitor", visitorSchema, "Visitors");

app.use(async (req, res, next) => {
  const ip = req.ip;
  try {
    const existingVisitor = await Visitor.findOne({ ip });
    if (!existingVisitor) {
      const newVisitor = new Visitor({ ip });
      await newVisitor.save();
    }
  } catch (err) {
    console.error("Error saving visitor:", err);
  }
  next();
});

app.get("/random", async (req, res) => {
  try {
    const person = await Person.aggregate([{ $sample: { size: 1 } }]);
    res.json(person);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/random/:count", async (req, res) => {
  const count = parseInt(req.params.count, 10);
  try {
    const people = await Person.aggregate([{ $sample: { size: count } }]);
    res.json(people);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/people", async (req, res) => {
  const filters = {};
  const limit = parseInt(req.query.limit, 10) || 0;

  if (req.query.name) filters.name = req.query.name;
  if (req.query.ethnicity) filters.ethnicity = req.query.ethnicity;
  if (req.query.gender) filters.gender = req.query.gender;
  if (req.query.occupation) filters.occupation = req.query.occupation;

  try {
    const people = await Person.aggregate([
      { $match: filters },
      { $sample: { size: limit || 1 } },
    ]);
    res.json(people);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/visitor-count", async (req, res) => {
  try {
    const count = await Visitor.countDocuments({});
    res.json({ uniqueVisitorCount: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports.handler = serverless(app);

// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// }); uncomment to run on local
