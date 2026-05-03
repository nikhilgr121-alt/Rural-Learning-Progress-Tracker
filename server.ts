import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "db.json");

// Ensure mock DB exists
const seedDB = () => {
  const db = {
    students: [
      { id: "1714670000000", name: "Amit Kumar", age: 10, class: "Grade 4" },
      { id: "1714670000001", name: "Priya Singh", age: 9, class: "Grade 3" },
      { id: "1714670000002", name: "Rahul Sharma", age: 11, class: "Grade 5" },
      { id: "1714670000003", name: "Sita Devi", age: 8, class: "Grade 2" },
      { id: "1714670000004", name: "Vikram Mehra", age: 12, class: "Grade 6" }
    ],
    progress: [
      { id: "1", studentId: "1714670000000", subject: "Math", score: 85, lesson: "Basic Addition", status: "Completed", date: "2024-04-20" },
      { id: "2", studentId: "1714670000000", subject: "English", score: 78, lesson: "Grammar Basics", status: "Completed", date: "2024-04-22" },
      { id: "3", studentId: "1714670000001", subject: "Science", score: 92, lesson: "Water Cycle", status: "Completed", date: "2024-04-21" },
      { id: "4", studentId: "1714670000002", subject: "Math", score: 65, lesson: "Fractions", status: "Completed", date: "2024-04-23" },
      { id: "5", studentId: "1714670000003", subject: "English", score: 88, lesson: "Alphabet Mastery", status: "Completed", date: "2024-04-24" }
    ],
    subjects: ["Math", "English", "Science", "Social Studies", "Art", "Physical Education"],
    attendance: [
      { id: "a1", studentId: "1714670000000", date: "2024-04-25", status: "Present" },
      { id: "a2", studentId: "1714670000001", date: "2024-04-25", status: "Present" },
      { id: "a3", studentId: "1714670000002", date: "2024-04-25", status: "Absent" },
      { id: "a4", studentId: "1714670000003", date: "2024-04-25", status: "Present" },
      { id: "a5", studentId: "1714670000004", date: "2024-04-25", status: "Late" }
    ],
    users: [
      { email: "teacher@rural.edu", password: "password", name: "Regional Educator" }
    ]
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
};

if (!fs.existsSync(DATA_FILE)) {
  seedDB();
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

app.post("/api/students/bulk", (req, res) => {
  const db = readDB();
  const students = req.body; // Array of { name, age, class }
  const newStudents = students.map((s: any, idx: number) => ({
    id: (Date.now() + idx).toString(),
    ...s
  }));
  db.students.push(...newStudents);
  writeDB(db);
  res.status(201).json(newStudents);
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
