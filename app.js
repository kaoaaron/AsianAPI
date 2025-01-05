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

const gameSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  totalGames: { type: Number, default: 0 },
});

const Game = mongoose.model("Game", gameSchema, "Games");

const leaderboardSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  scored: { type: Number, required: true },
  total: { type: Number, required: true },
  completedAt: { type: Date, default: Date.now },
});
const Leaderboard = mongoose.model(
  "Leaderboard",
  leaderboardSchema,
  "Leaderboard"
);

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

app.post("/increment-games", async (req, res) => {
  try {
    const game = await Game.findOne();

    if (game) {
      game.totalGames += 1;
      await game.save();
    } else {
      const newGame = new Game({ totalGames: 1 });
      await newGame.save();
    }

    res.json({ success: true, totalGames: game ? game.totalGames : 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/game-count", async (req, res) => {
  try {
    const gameCount = await Game.findOne();

    res.status(200).json({ count: gameCount ? gameCount.totalGames : 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/is-leader", async (req, res) => {
  try {
    const { scored, total } = req.body;
    const data = await Leaderboard.aggregate([
      {
        $addFields: {
          ratio: { $divide: ["$scored", "$total"] },
        },
      },
      {
        $sort: { ratio: 1 },
      },
      { $limit: 10 },
    ]);
    if (data.length < 10) return res.json(true);

    return res.json(data[0].ratio <= scored / total);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/leaderboard", async (req, res) => {
  try {
    const data = await Leaderboard.aggregate([
      {
        $addFields: {
          ratio: { $divide: ["$scored", "$total"] },
        },
      },
      {
        $sort: { ratio: -1 },
      },
      { $limit: 10 },
    ]);

    const topIds = data.map((item) => item._id);
    await Leaderboard.deleteMany({
      _id: { $nin: topIds },
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/leaderboard", async (req, res) => {
  const { name, scored, total } = req.body;
  try {
    const existingUser = await Leaderboard.findOne({ name });
    if (existingUser) {
      return res.json({
        result: false,
        msg: "Existing user! Enter different name",
      });
    } else {
      const newLeader = new Leaderboard({ name, scored, total });
      await newLeader.save();
      return res.json({ result: true });
    }
  } catch (err) {
    console.error("Error saving leaderboard score:", err);
  }
});

module.exports.handler = serverless(app);

// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// }); uncomment to run on local
