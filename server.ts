import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import midtransClient from "midtrans-client";

dotenv.config();
const JWT_SECRET = "my_dearest_secret_777";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  app.use(express.json({ limit: "10mb" }));

  const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY || "",
    clientKey: process.env.VITE_MIDTRANS_CLIENT_KEY || "",
  });

  let memoryUsers: any[] = [];
  let memoryTasks: any[] = [];
  let memoryCourses: any[] = [];
  let memorySchedules: any[] = [];
  let memoryNotes: any[] = [];
  let pool: mysql.Pool | null = null;

  if (process.env.DB_HOST) {
    try {
      pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "dearplanner",
        ssl: { rejectUnauthorized: false },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
      console.log("✅ Connected to MySQL Cloud Database");

      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(36) PRIMARY KEY, username VARCHAR(50) UNIQUE, password VARCHAR(255),
          profile_pic LONGTEXT, is_premium BOOLEAN DEFAULT FALSE, theme VARCHAR(20) DEFAULT 'pink'
        )
      `);

      const tables = [
        `CREATE TABLE IF NOT EXISTS tasks (id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36), title VARCHAR(255), completed BOOLEAN, dueDate DATE, course VARCHAR(100))`,
        `CREATE TABLE IF NOT EXISTS courses (id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36), name VARCHAR(255), code VARCHAR(50), instructor VARCHAR(100))`,
        `CREATE TABLE IF NOT EXISTS schedules (id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36), title VARCHAR(255), time VARCHAR(50), day VARCHAR(50), type VARCHAR(50))`,
        `CREATE TABLE IF NOT EXISTS notes (id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36), title VARCHAR(255), content TEXT, date VARCHAR(100))`,
      ];
      for (const query of tables) await pool.query(query);

      const patchTables = ["tasks", "courses", "schedules", "notes"];
      for (const table of patchTables) {
        try {
          await pool.query(
            `ALTER TABLE ${table} ADD COLUMN user_id VARCHAR(36)`,
          );
        } catch (err: any) {}
      }
      try {
        await pool.query(
          `ALTER TABLE users ADD COLUMN is_premium BOOLEAN DEFAULT FALSE`,
        );
      } catch (err: any) {}
      try {
        await pool.query(
          `ALTER TABLE users ADD COLUMN theme VARCHAR(20) DEFAULT 'pink'`,
        );
      } catch (err: any) {} // Auto-patch tabel tema

      const [users]: any = await pool.query(
        "SELECT * FROM users WHERE username = 'youngest333daughter'",
      );
      if (users.length === 0) {
        const hashedPassword = await bcrypt.hash("777starryeyes", 10);
        await pool.query(
          "INSERT INTO users (id, username, password, profile_pic, is_premium, theme) VALUES (?, ?, ?, ?, ?, ?)",
          [uuidv4(), "youngest333daughter", hashedPassword, "", false, "pink"],
        );
      }
    } catch (error) {
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
      is_premium: false,
      theme: "pink",
    });
  }

  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Access Denied." });
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Invalid Session." });
      req.user = user;
      next();
    });
  };

  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      let user = pool
        ? (
            (await pool.query("SELECT * FROM users WHERE username = ?", [
              username,
            ])) as any
          )[0][0]
        : memoryUsers.find((u) => u.username === username);
      if (!user) return res.status(400).json({ error: "Username not found" });
      if (!(await bcrypt.compare(password, user.password)))
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
          is_premium: user.is_premium,
          theme: user.theme || "pink",
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Server error during login" });
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password)
        return res.status(400).json({ error: "Required" });
      let existingUser = pool
        ? (
            (await pool.query("SELECT * FROM users WHERE username = ?", [
              username,
            ])) as any
          )[0][0]
        : memoryUsers.find((u) => u.username === username);
      if (existingUser)
        return res.status(400).json({ error: "Username already taken!" });

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUserId = uuidv4();
      if (pool) {
        await pool.query(
          "INSERT INTO users (id, username, password, profile_pic, is_premium, theme) VALUES (?, ?, ?, ?, ?, ?)",
          [newUserId, username, hashedPassword, "", false, "pink"],
        );
      } else {
        memoryUsers.push({
          id: newUserId,
          username,
          password: hashedPassword,
          profile_pic: "",
          is_premium: false,
          theme: "pink",
        });
      }

      const token = jwt.sign({ id: newUserId, username }, JWT_SECRET);
      res
        .status(201)
        .json({
          token,
          user: {
            id: newUserId,
            username,
            profile_pic: "",
            is_premium: false,
            theme: "pink",
          },
        });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.put(
    "/api/user/profile",
    authenticateToken,
    async (req: any, res: any) => {
      try {
        const { newPassword, profile_pic, theme } = req.body;
        const userId = req.user.id;

        if (pool) {
          if (newPassword)
            await pool.query("UPDATE users SET password = ? WHERE id = ?", [
              await bcrypt.hash(newPassword, 10),
              userId,
            ]);
          if (profile_pic !== undefined)
            await pool.query("UPDATE users SET profile_pic = ? WHERE id = ?", [
              profile_pic,
              userId,
            ]);
          if (theme !== undefined)
            await pool.query("UPDATE users SET theme = ? WHERE id = ?", [
              theme,
              userId,
            ]);

          const [rows]: any = await pool.query(
            "SELECT id, username, profile_pic, is_premium, theme FROM users WHERE id = ?",
            [userId],
          );
          return res.json(rows[0]);
        } else {
          const uIdx = memoryUsers.findIndex((u) => u.id === userId);
          if (newPassword)
            memoryUsers[uIdx].password = await bcrypt.hash(newPassword, 10);
          if (profile_pic !== undefined)
            memoryUsers[uIdx].profile_pic = profile_pic;
          if (theme !== undefined) memoryUsers[uIdx].theme = theme;
          return res.json({
            id: memoryUsers[uIdx].id,
            username: memoryUsers[uIdx].username,
            profile_pic: memoryUsers[uIdx].profile_pic,
            is_premium: memoryUsers[uIdx].is_premium,
            theme: memoryUsers[uIdx].theme,
          });
        }
      } catch (error) {
        res.status(500).json({ error: "Server error" });
      }
    },
  );

  app.post(
    "/api/premium/checkout",
    authenticateToken,
    async (req: any, res) => {
      try {
        const transaction = await snap.createTransaction({
          transaction_details: {
            order_id: `PREM-${req.user.id}-${Date.now()}`,
            gross_amount: 15000,
          },
          customer_details: { first_name: req.user.username },
          item_details: [
            {
              id: "PREMIUM-PLAN",
              price: 15000,
              quantity: 1,
              name: "My Dear Planner Premium 👑",
            },
          ],
        });
        res.json({ token: transaction.token });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.post("/api/midtrans/webhook", async (req, res) => {
    try {
      const statusResponse = await snap.transaction.notification(req.body);
      if (
        statusResponse.transaction_status === "capture" ||
        statusResponse.transaction_status === "settlement"
      ) {
        const userId = statusResponse.order_id.split("-")[1];
        if (pool)
          await pool.query("UPDATE users SET is_premium = true WHERE id = ?", [
            userId,
          ]);
        else {
          const uIdx = memoryUsers.findIndex((u) => u.id === userId);
          if (uIdx > -1) memoryUsers[uIdx].is_premium = true;
        }
      }
      res.status(200).send("OK");
    } catch (error) {
      res.status(500).send("Error");
    }
  });

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
    } catch (e) {
      res.status(500).json({ error: "Error" });
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
    } catch (e) {
      res.status(500).json({ error: "Error" });
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
    } catch (e) {
      res.status(500).json({ error: "Error" });
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
    } catch (e) {
      res.status(500).json({ error: "Error" });
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
    } catch (e) {
      res.status(500).json({ error: "Error" });
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
    } catch (e) {
      res.status(500).json({ error: "Error" });
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
    } catch (e) {
      res.status(500).json({ error: "Error" });
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
    } catch (e) {
      res.status(500).json({ error: "Error" });
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
    } catch (e) {
      res.status(500).json({ error: "Error" });
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
    } catch (e) {
      res.status(500).json({ error: "Error" });
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
    } catch (e) {
      res.status(500).json({ error: "Error" });
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
    } catch (e) {
      res.status(500).json({ error: "Error" });
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
    } catch (e) {
      res.status(500).json({ error: "Error" });
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
