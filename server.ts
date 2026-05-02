import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "db.json");

// Ensure mock DB exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({
    students: [],
    progress: [],
    subjects: ["Math", "English", "Science", "Social Studies"],
    attendance: [],
    users: [
      { email: "teacher@rural.edu", password: "password", name: "Teacher User" }
    ]
  }, null, 2));
}

app.use(express.json());

// API Helpers
const readDB = () => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  if (!data.users) data.users = [];
  if (!data.students) data.students = [];
  if (!data.progress) data.progress = [];
  if (!data.subjects) data.subjects = ["Math", "English", "Science", "Social Studies"];
  if (!data.attendance) data.attendance = [];
  return data;
};
const writeDB = (data: any) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// Auth Routes
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find((u: any) => u.email === email && u.password === password);
  
  if (user) {
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.post("/api/auth/signup", (req, res) => {
  const { email, password, name } = req.body;
  const db = readDB();
  
  if (db.users.some((u: any) => u.email === email)) {
    return res.status(400).json({ error: "User already exists" });
  }

  const newUser = { email, password, name };
  db.users.push(newUser);
  writeDB(db);

  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

// API Routes
app.get("/api/dashboard/stats", (req, res) => {
  const db = readDB();
  const totalStudents = db.students.length;
  const lessonsCompleted = db.progress.filter((p: any) => p.status === "Completed").length;
  const avgScore = db.progress.filter((p: any) => p.score > 0).reduce((acc: number, p: any) => acc + p.score, 0) / (db.progress.filter((p: any) => p.score > 0).length || 1);
  
  res.json({
    totalStudents,
    lessonsCompleted,
    averageScore: Math.round(avgScore)
  });
});

app.get("/api/students", (req, res) => {
  const db = readDB();
  res.json(db.students);
});

app.post("/api/students", (req, res) => {
  const db = readDB();
  const newStudent = { id: Date.now().toString(), ...req.body };
  db.students.push(newStudent);
  writeDB(db);
  res.status(201).json(newStudent);
});

app.put("/api/students/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.students.findIndex((s: any) => s.id === id);
  if (index !== -1) {
    db.students[index] = { ...db.students[index], ...req.body };
    writeDB(db);
    res.json(db.students[index]);
  } else {
    res.status(404).json({ error: "Student not found" });
  }
});

app.delete("/api/students/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.students = db.students.filter((s: any) => s.id !== id);
  db.progress = db.progress.filter((p: any) => p.studentId !== id);
  writeDB(db);
  res.status(204).send();
});

// Subjects Routes
app.get("/api/subjects", (req, res) => {
  const db = readDB();
  res.json(db.subjects);
});

app.post("/api/subjects", (req, res) => {
  const { name } = req.body;
  const db = readDB();
  if (!db.subjects.includes(name)) {
    db.subjects.push(name);
    writeDB(db);
  }
  res.json(db.subjects);
});

app.get("/api/progress", (req, res) => {
  const db = readDB();
  res.json(db.progress);
});

app.post("/api/progress", (req, res) => {
  const db = readDB();
  const newProgress = { id: Date.now().toString(), ...req.body, date: new Date().toISOString().split('T')[0] };
  db.progress.push(newProgress);
  writeDB(db);
  res.status(201).json(newProgress);
});

app.post("/api/progress/batch", (req, res) => {
  const db = readDB();
  const { studentId, entries, lesson } = req.body;
  const date = new Date().toISOString().split('T')[0];
  
  const newEntries = entries.map((entry: any, index: number) => ({
    id: (Date.now() + index).toString(),
    studentId,
    lesson,
    date,
    ...entry
  }));
  
  db.progress.push(...newEntries);
  writeDB(db);
  res.status(201).json(newEntries);
});

app.get("/api/attendance", (req, res) => {
  const { date } = req.query;
  const db = readDB();
  if (date) {
    res.json(db.attendance.filter((a: any) => a.date === date));
  } else {
    res.json(db.attendance);
  }
});

app.post("/api/attendance", (req, res) => {
  const db = readDB();
  const records = req.body; // Array of { studentId, date, status }
  
  records.forEach((record: any) => {
    const index = db.attendance.findIndex((a: any) => a.studentId === record.studentId && a.date === record.date);
    if (index !== -1) {
      db.attendance[index] = { ...db.attendance[index], ...record };
    } else {
      db.attendance.push({ id: Math.random().toString(36).substr(2, 9), ...record });
    }
  });
  
  writeDB(db);
  res.json({ success: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
