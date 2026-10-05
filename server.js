// FixIt backend: npm init -y && npm install express
// Run: node server.js   ->  open http://localhost:3000
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const DB_FILE = path.join(__dirname, "complaints.json");

app.use(express.json());
app.use(express.static(__dirname)); // serves index.html

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const seed = [
      { id: 1, category: "Electrical", location: "Block A, Room 102", priority: "High", description: "Ceiling fan is not working.", status: "Pending" },
      { id: 2, category: "Plumbing", location: "Block B, Second Floor Restroom", priority: "Medium", description: "Water tap is leaking.", status: "In Progress" },
      { id: 3, category: "Furniture", location: "Block C, Room 205", priority: "Low", description: "One classroom chair is damaged.", status: "Resolved" }
    ];
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
    return seed;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Get all complaints
app.get("/api/complaints", (req, res) => {
  res.json(readDB());
});

// Receive a new complaint
app.post("/api/complaints", (req, res) => {
  const { category, location, priority, description } = req.body;

  if (!category || !location || !priority || !description) {
    return res.status(400).json({ error: "All fields are required." });
  }
  if (!["Low", "Medium", "High"].includes(priority)) {
    return res.status(400).json({ error: "Invalid priority." });
  }

  const data = readDB();
  const complaint = {
    id: data.length ? Math.max(...data.map(c => c.id)) + 1 : 1,
    category: String(category).trim().slice(0, 50),
    location: String(location).trim().slice(0, 100),
    priority,
    description: String(description).trim().slice(0, 500),
    status: "Pending",
    createdAt: new Date().toISOString()
  };

  data.push(complaint);
  writeDB(data);
  res.status(201).json(complaint);
});

// Update status (for admin use)
app.patch("/api/complaints/:id", (req, res) => {
  const data = readDB();
  const item = data.find(c => c.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: "Not found." });

  if (["Pending", "In Progress", "Resolved"].includes(req.body.status)) {
    item.status = req.body.status;
  }
  writeDB(data);
  res.json(item);
});

app.listen(3000, () => console.log("FixIt running at http://localhost:3000"));
