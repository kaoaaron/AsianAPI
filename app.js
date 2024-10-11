require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());

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
    const people = await Person.find(filters).limit(limit);
    res.json(people);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
