import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const JWT_SECRET = "my_dearest_secret_777";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // --- IN-MEMORY FALLBACK DATA ---
  let memoryUsers: any[] = [];
  let memoryTasks: any[] = [];
  let memoryCourses: any[] = [];
  let memorySchedules: any[] = [];
  let memoryNotes: any[] = [];

  // --- DATABASE CONFIGURATION ---
  let pool: mysql.Pool | null = null;

  if (process.env.DB_HOST) {
    try {
      pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "dearplanner",
        ssl: { rejectUnauthorized: false }, // Wajib untuk Cloud Database
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
      console.log("✅ Connected to MySQL Database (XAMPP)");

      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(36) PRIMARY KEY,
          username VARCHAR(50) UNIQUE,
          password VARCHAR(255),
          profile_pic LONGTEXT
        )
      `);

      const tables = [
        `CREATE TABLE IF NOT EXISTS tasks (id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36), title VARCHAR(255), completed BOOLEAN, dueDate DATE, course VARCHAR(100))`,
        `CREATE TABLE IF NOT EXISTS courses (id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36), name VARCHAR(255), code VARCHAR(50), instructor VARCHAR(100))`,
        `CREATE TABLE IF NOT EXISTS schedules (id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36), title VARCHAR(255), time VARCHAR(50), day VARCHAR(50), type VARCHAR(50))`,
        `CREATE TABLE IF NOT EXISTS notes (id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36), title VARCHAR(255), content TEXT, date VARCHAR(100))`,
      ];
      for (const query of tables) await pool.query(query);

      // 🛠️ AUTO-PATCH: Tambahkan kolom user_id ke tabel lama jika belum ada
      const patchTables = ["tasks", "courses", "schedules", "notes"];
      for (const table of patchTables) {
        try {
          await pool.query(
            `ALTER TABLE ${table} ADD COLUMN user_id VARCHAR(36)`,
          );
          console.log(`🔧 Patched table '${table}' with user_id column.`);
        } catch (err: any) {
          // Abaikan error jika kolom sudah ada
        }
      }

      const [users]: any = await pool.query(
        "SELECT * FROM users WHERE username = 'youngest333daughter'",
      );
      if (users.length === 0) {
        const hashedPassword = await bcrypt.hash("777starryeyes", 10);
        await pool.query(
          "INSERT INTO users (id, username, password, profile_pic) VALUES (?, ?, ?, ?)",
          [uuidv4(), "youngest333daughter", hashedPassword, ""],
        );
        console.log("✅ Default user 'youngest333daughter' created in DB!");
      }
    } catch (error) {
      console.error(
        "❌ Failed to connect to MySQL. Using In-Memory Fallback.",
        error,
      );
      pool = null;
    }
  }

  if (!pool) {
    const hashedPassword = await bcrypt.hash("777starryeyes", 10);
    memoryUsers.push({
      id: uuidv4(),
      username: "youngest333daughter",
      password: hashedPassword,
      profile_pic: "",
    });
    console.log("⚠️ Using In-Memory Database. Default user created.");
  }

  // --- MIDDLEWARE ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token)
      return res.status(401).json({ error: "Access Denied. Please login." });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Invalid Session." });
      req.user = user;
      next();
    });
  };

  // --- AUTHENTICATION API ---
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      let user = null;

      if (pool) {
        const [rows]: any = await pool.query(
          "SELECT * FROM users WHERE username = ?",
          [username],
        );
        user = rows[0];
      } else {
        user = memoryUsers.find((u) => u.username === username);
      }

      if (!user) return res.status(400).json({ error: "Username not found" });

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword)
        return res.status(400).json({ error: "Invalid password" });

      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
      );
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          profile_pic: user.profile_pic,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Server error during login" });
    }
  });

  // --- REGISTER API ---
  app.post("/api/register", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Username and password are required (＞﹏＜)" });
      }

      let existingUser = null;
      if (pool) {
        const [rows]: any = await pool.query(
          "SELECT * FROM users WHERE username = ?",
          [username],
        );
        existingUser = rows[0];
      } else {
        existingUser = memoryUsers.find((u) => u.username === username);
      }

      if (existingUser) {
        return res
          .status(400)
          .json({ error: "Username already taken! Try another one 🥺" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUserId = uuidv4();

      if (pool) {
        await pool.query(
          "INSERT INTO users (id, username, password, profile_pic) VALUES (?, ?, ?, ?)",
          [newUserId, username, hashedPassword, ""],
        );
      } else {
        memoryUsers.push({
          id: newUserId,
          username,
          password: hashedPassword,
          profile_pic: "",
        });
      }

      const token = jwt.sign({ id: newUserId, username }, JWT_SECRET);

      res.status(201).json({
        token,
        user: {
          id: newUserId,
          username,
          profile_pic: "",
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Server error during registration" });
    }
  });

  app.put(
    "/api/user/profile",
    authenticateToken,
    async (req: any, res: any) => {
      try {
        const { newPassword, profile_pic } = req.body;
        const userId = req.user.id;

        if (pool) {
          if (newPassword) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await pool.query("UPDATE users SET password = ? WHERE id = ?", [
              hashedPassword,
              userId,
            ]);
          }
          if (profile_pic !== undefined) {
            await pool.query("UPDATE users SET profile_pic = ? WHERE id = ?", [
              profile_pic,
              userId,
            ]);
          }
          const [rows]: any = await pool.query(
            "SELECT id, username, profile_pic FROM users WHERE id = ?",
            [userId],
          );
          return res.json(rows[0]);
        } else {
          const userIndex = memoryUsers.findIndex((u) => u.id === userId);
          if (userIndex > -1) {
            if (newPassword)
              memoryUsers[userIndex].password = await bcrypt.hash(
                newPassword,
                10,
              );
            if (profile_pic !== undefined)
              memoryUsers[userIndex].profile_pic = profile_pic;
            return res.json({
              id: memoryUsers[userIndex].id,
              username: memoryUsers[userIndex].username,
              profile_pic: memoryUsers[userIndex].profile_pic,
            });
          }
          res.status(404).json({ error: "User not found" });
        }
      } catch (error) {
        res.status(500).json({ error: "Server error updating profile" });
      }
    },
  );

  // --- CRUD API ---
  app.get("/api/tasks", authenticateToken, async (req: any, res) => {
    try {
      if (pool) {
        const [rows]: any = await pool.query(
          "SELECT * FROM tasks WHERE user_id = ?",
          [req.user.id],
        );
        return res.json(
          rows.map((r: any) => ({ ...r, completed: !!r.completed })),
        );
      }
      res.json(memoryTasks.filter((t) => t.user_id === req.user.id));
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });
  app.post("/api/tasks", authenticateToken, async (req: any, res) => {
    try {
      const newTask = {
        id: uuidv4(),
        user_id: req.user.id,
        ...req.body,
        completed: false,
      };
      if (pool) {
        await pool.query(
          "INSERT INTO tasks (id, user_id, title, completed, dueDate, course) VALUES (?, ?, ?, ?, ?, ?)",
          [
            newTask.id,
            newTask.user_id,
            newTask.title,
            newTask.completed,
            newTask.dueDate,
            newTask.course,
          ],
        );
      } else memoryTasks.push(newTask);
      res.status(201).json(newTask);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });
  app.put("/api/tasks/:id", authenticateToken, async (req: any, res) => {
    try {
      if (pool) {
        await pool.query(
          "UPDATE tasks SET title=?, completed=?, dueDate=?, course=? WHERE id=? AND user_id=?",
          [
            req.body.title,
            req.body.completed,
            req.body.dueDate,
            req.body.course,
            req.params.id,
            req.user.id,
          ],
        );
      } else {
        const idx = memoryTasks.findIndex(
          (t) => t.id === req.params.id && t.user_id === req.user.id,
        );
        if (idx > -1) memoryTasks[idx] = { ...memoryTasks[idx], ...req.body };
      }
      res.json({ id: req.params.id, ...req.body });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });
  app.delete("/api/tasks/:id", authenticateToken, async (req: any, res) => {
    try {
      if (pool)
        await pool.query("DELETE FROM tasks WHERE id=? AND user_id=?", [
          req.params.id,
          req.user.id,
        ]);
      else
        memoryTasks = memoryTasks.filter(
          (t) => !(t.id === req.params.id && t.user_id === req.user.id),
        );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get("/api/courses", authenticateToken, async (req: any, res) => {
    try {
      if (pool) {
        const [rows] = (await pool.query(
          "SELECT * FROM courses WHERE user_id = ?",
          [req.user.id],
        )) as any;
        return res.json(rows);
      }
      res.json(memoryCourses.filter((c) => c.user_id === req.user.id));
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });
  app.post("/api/courses", authenticateToken, async (req: any, res) => {
    try {
      const newCourse = { id: uuidv4(), user_id: req.user.id, ...req.body };
      if (pool) {
        await pool.query(
          "INSERT INTO courses (id, user_id, name, code, instructor) VALUES (?, ?, ?, ?, ?)",
          [
            newCourse.id,
            newCourse.user_id,
            newCourse.name,
            newCourse.code,
            newCourse.instructor,
          ],
        );
      } else memoryCourses.push(newCourse);
      res.status(201).json(newCourse);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });
  app.delete("/api/courses/:id", authenticateToken, async (req: any, res) => {
    try {
      if (pool)
        await pool.query("DELETE FROM courses WHERE id=? AND user_id=?", [
          req.params.id,
          req.user.id,
        ]);
      else
        memoryCourses = memoryCourses.filter(
          (c) => !(c.id === req.params.id && c.user_id === req.user.id),
        );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get("/api/schedules", authenticateToken, async (req: any, res) => {
    try {
      if (pool) {
        const [rows] = (await pool.query(
          "SELECT * FROM schedules WHERE user_id = ?",
          [req.user.id],
        )) as any;
        return res.json(rows);
      }
      res.json(memorySchedules.filter((s) => s.user_id === req.user.id));
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });
  app.post("/api/schedules", authenticateToken, async (req: any, res) => {
    try {
      const newSchedules = { id: uuidv4(), user_id: req.user.id, ...req.body };
      if (pool) {
        await pool.query(
          "INSERT INTO schedules (id, user_id, title, time, day, type) VALUES (?, ?, ?, ?, ?, ?)",
          [
            newSchedules.id,
            newSchedules.user_id,
            newSchedules.title,
            newSchedules.time,
            newSchedules.day,
            newSchedules.type,
          ],
        );
      } else memorySchedules.push(newSchedules);
      res.status(201).json(newSchedules);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });
  app.delete("/api/schedules/:id", authenticateToken, async (req: any, res) => {
    try {
      if (pool)
        await pool.query("DELETE FROM schedules WHERE id=? AND user_id=?", [
          req.params.id,
          req.user.id,
        ]);
      else
        memorySchedules = memorySchedules.filter(
          (s) => !(s.id === req.params.id && s.user_id === req.user.id),
        );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get("/api/notes", authenticateToken, async (req: any, res) => {
    try {
      if (pool) {
        const [rows] = (await pool.query(
          "SELECT * FROM notes WHERE user_id = ? ORDER BY date DESC",
          [req.user.id],
        )) as any;
        return res.json(rows);
      }
      res.json(
        memoryNotes
          .filter((n) => n.user_id === req.user.id)
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          ),
      );
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });
  app.post("/api/notes", authenticateToken, async (req: any, res) => {
    try {
      const newNote = {
        id: uuidv4(),
        user_id: req.user.id,
        date: new Date().toISOString(),
        ...req.body,
      };
      if (pool) {
        await pool.query(
          "INSERT INTO notes (id, user_id, title, content, date) VALUES (?, ?, ?, ?, ?)",
          [
            newNote.id,
            newNote.user_id,
            newNote.title,
            newNote.content,
            newNote.date,
          ],
        );
      } else memoryNotes.unshift(newNote);
      res.status(201).json(newNote);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });
  app.delete("/api/notes/:id", authenticateToken, async (req: any, res) => {
    try {
      if (pool)
        await pool.query("DELETE FROM notes WHERE id=? AND user_id=?", [
          req.params.id,
          req.user.id,
        ]);
      else
        memoryNotes = memoryNotes.filter(
          (n) => !(n.id === req.params.id && n.user_id === req.user.id),
        );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () =>
    console.log(`Server running on http://localhost:${PORT}`),
  );
}

startServer();
