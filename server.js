const path = require('path');
const result = require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cron = require('node-cron');
const { exec, spawn } = require('child_process');
const crypto = require('crypto');
const { Resend } = require('resend');

const PORT = 3000;
const app = express()

app.use(express.json());

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

const JWT_SECRET = process.env.JWT_SECRET;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT),
});

const security = {
    decryptString: (str) => str,
    encryptFile: async (filePath) => {
        console.log(`The file ${filePath} is protected!`);
        return filePath;
    }
};

function verifyTokenFromCookies(cookieHeader) {
    if (!cookieHeader) return null;

    const cookies = Object.fromEntries(
        cookieHeader.split('; ').map(cookie => {
            const [key, ...v] = cookie.split('=');
            return [key, v.join('=')];
        })
    );

    const token = cookies.token;

    if (!token) return null;

    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}

function verifyToken(req, res, next) {

    const decodedUser = verifyTokenFromCookies(req.headers.cookie);

    if (!decodedUser) {
        return res.status(401).json({ error: "Access denied. Authorization failed." });
    }

    req.userId = decodedUser.id;
    next();
}

async function checkTaskOwnership(req, res, next) {
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) {
        return res.status(400).json({ error: "Incorrect ID of task" });
    }

    try {
        const result = await pool.query(
            "SELECT * FROM backup_tasks WHERE id = $1",
            [taskId]
        );
        const task = result.rows[0];

        if (!task) {
            return res.status(404).json({ error: "Task isn't found" });
        }

        if (task.user_id !== req.userId) {
            return res.status(403).json({ error: "Access is denied. You are not the owner of this task." });
        }

        req.currentTask = task;
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Access rights verification failed" });
    }
}

async function initDatabase() {
    try {
        await pool.query('SELECT NOW()');
        console.log('--> Successfully connected to PostgreSQL!');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS backup_tasks (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                db_type VARCHAR(50) NOT NULL,
                connection_string TEXT NOT NULL,
                cron_schedule VARCHAR(50) NOT NULL,
                status VARCHAR(20) DEFAULT 'active',
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS verification_codes (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                code VARCHAR(10) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                attempts VARCHAR(10) NOT NULL,
            );
        `);
        console.log('--> Table structure in PostgreSQL checked and created!');
    } catch (error) {
        console.error('PostgreSQL initialization error:', error.message);
    }
}
initDatabase();

app.post("/api/task", verifyToken, async (req, res) => {
    const { db_type, connection_string, cron_schedule } = req.body;
    if (!db_type || !connection_string || !cron_schedule) {
        return res.status(400).json({ message: "These fields are mandatory" })
    }
    try {
        // const encryptedUri = security.encryptString(connection_string);
        await pool.query(
            "INSERT INTO backup_tasks (user_id, db_type, connection_string, cron_schedule) VALUES ($1, $2, $3, $4)",
            [req.userId, db_type, connection_string, cron_schedule]
        );
        res.status(200).json({ message: "Backup successfully created!" })
    } catch (error) {
        console.error("Error creating backup: ", error.message);
        res.status(500).json({ error: "Server error!" })
    }
});

app.get("/api/tasks", verifyToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT id, db_type, cron_schedule, status FROM backup_tasks WHERE user_id = $1", [req.userId]);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Server error while retrieving tasks" });
    }
});

app.post('/api/verification/code', async (req, res) => {
    try {
        const resend = new Resend(process.env.API_KEY);

        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Enter your email address' });

        const code = crypto.randomInt(100000, 999999).toString();

        await pool.query(
            'DELETE FROM verification_codes WHERE email = $1',
            [email]
        );

        await pool.query(
            'INSERT INTO verification_codes (email, code, created_at, attempts) VALUES ($1, $2, $3, $4)',
            [email, code, new Date(), 0]
        );

        const targetEmail = email;

        const { error } = await resend.emails.send({
            from: 'Acme <onboarding@resend.dev>',
            to: targetEmail,
            subject: 'Verification Code',
            html: `<p>Your code is <strong>${code}</strong></p>`,
        });

        if (error) {
            console.error('Resend Error:', error);
            return res.status(500).json({ success: false, message: 'Email sending error' });
        }

        return res.status(200).json({ success: true, message: 'Code sent' });
    } catch (err) {
        console.error('Critical server error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/verification/verify', async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ success: false, message: 'all fields must be filled' });
        }

        const recordResult = await pool.query(
            'SELECT id, code, attempts FROM verification_codes WHERE email = $1',
            [email]
        );
        const record = recordResult.rows[0];

        const recordTimeResult = await pool.query(
            'SELECT id, code, attempts FROM verification_codes WHERE created_at > $1',
            [new Date(Date.now() - 5 * 60 * 1000)]
        );
        const recordTime = recordTimeResult.rows[0];


        if (!record) {
            return res.status(404).json({ success: false, message: 'verification code not found' });
        }
        if (!recordTime) {
            return res.status(404).json({ success: false, message: 'verification code expired' });
        }
        const MAX_ATTEMPTS = 3;
        if (record.attempts >= MAX_ATTEMPTS) {
            return res.status(403).json({ success: false, message: 'too many attempts. request a new code' });
        }

        if (record.code !== code) {

            await pool.query(
                'UPDATE verification_codes SET attempts = attempts + 1 WHERE id = $1',
                [record.id]
            );

            const remaining = MAX_ATTEMPTS - (record.attempts + 1);
            return res.status(400).json({
                success: false,
                message: `invalid code. attempts remaining: ${remaining}`
            });
        }

        await pool.query('DELETE FROM verification_codes WHERE id = $1', [record.id]);

        return res.status(200).json({ success: true, message: "Verification completed" });

    } catch (error) {
        console.error('Verification error: ', error.message);
        return res.status(500).json({ success: false, message: 'internal server error' });
    }
});

app.post("/api/auth/register", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." })
    }
    try {
        const postUser = await pool.query("SELECT * FROM users WHERE email = $1", [email])
        if (postUser.rows.length > 0) {
            return res.status(400).json({ error: "A user with this email already exists." })
        }
        const Raund = 10;
        const hashpass = await bcrypt.hash(password, Raund);
        await pool.query("INSERT INTO users (email, password_hash) VALUES ($1, $2)", [email, hashpass]);
        res.status(201).json({ message: "User successfully created" });
    } catch (error) {
        console.error('Ошибка: ', error.message);
    }
});

app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." })
    }
    try {
        const postUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        const user = postUser.rows[0];
        if (!user) {
            return res.status(401).json({ error: "Invalid username or password!" })
        }
        const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordCorrect) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 60 * 60 * 1000
        })
        return res.status(200).json({
            message: "Successful login",
            token: token
        });

    } catch (error) {
        console.error("Server error: ", error.message);
        res.status(500).json({ error: "Server error" })
    }


});

app.post("/api/task/:id/backup", verifyToken, checkTaskOwnership, async (req, res) => {
    const postId = parseInt(req.params.id);
    try {
        const task = req.currentTask;

        const decryptedUri = security.decryptString(task.connection_string);
        const outputFileName = `./backups/backup_${task.db_type}_${Date.now()}.dump`;
        let child;

        if (task.db_type === "postgres") {
            child = spawn('pg_dump', [decryptedUri, '-F', 'c', '-b', '-f', outputFileName]);

        } else if (task.db_type === "mysql") {
            child = spawn('mysqldump', [`--uri=${decryptedUri}`, '-r', outputFileName]);

        } else if (task.db_type === "mongodb") {
            child = spawn('mongodump', [`--uri=${decryptedUri}`, `--archive=${outputFileName}`]);

        } else {
            return res.status(400).json({ error: "This type of database is not supported." });
        }
        child.on('error', (err) => {
            console.error("Error starting process:", err);
            return res.status(500).json({ error: "Error launching backup utility" });
        });

        child.on('close', async (code) => {
            if (code !== 0) {
                return res.status(500).json({ error: `Dump creation failed. Error code: ${code}` });
            }
            await security.encryptFile(outputFileName);
            res.status(200).json({ message: "The backup has been successfully created and encrypted!" });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" })
    }

});

app.post("/api/task/:id/restore", verifyToken, checkTaskOwnership, async (req, res) => {
    const taskId = parseInt(req.params.id);
    try {
        const result = await pool.query("SELECT * FROM backup_tasks WHERE id = $1", [taskId]);
        const task = result.rows[0];
        if (!task) {
            return res.status(404).json({ error: "Task not found" })
        }
        const backupFile = "./backups/temp_restore.dump";
        let child;

        if (task.db_type === "postgres") {
            child = spawn('pg_restore', ['-d', decryptedUri, '-v', backupFile]);

        } else if (task.db_type === "mysql") {
            child = spawn('mysql', [`--user=${dbUser}`, `--password=${dbPass}`, dbName, '-e', `source ${backupFile}`]);

        } else if (task.db_type === "mongodb") {
            child = spawn('mongorestore', [`--uri=${decryptedUri}`, `--archive=${backupFile}`]);
        }
        child.on('close', (code) => {
            if (code !== 0) return res.status(500).json({ error: "Database recovery error" });
            res.status(200).json({ message: "The database has been successfully restored!" });
        });

    } catch (error) {
        console.error('Server error: ', error.message);
        res.status(500).json({ error: "Server error." })
    }
});

app.delete("/api/tasks/:id", verifyToken, checkTaskOwnership, async (req, res) => {
    try {
        await pool.query("DELETE FROM backup_tasks WHERE id = $1", [req.params.id]);
        res.status(200).json({ message: "The task has been successfully deleted." });
    } catch (error) {
        res.status(500).json({ error: "Deletion error" });
    }
});

app.put("/api/tasks/:id", verifyToken, checkTaskOwnership, async (req, res) => {
    const { cron_schedule, status } = req.body;
    if (!cron_schedule || !status) return res.status(400).json({ error: "Incomplete data" });

    try {
        await pool.query(
            "UPDATE backup_tasks SET cron_schedule = $1, status = $2 WHERE id = $3",
            [cron_schedule, status, req.params.id]
        );
        res.status(200).json({ message: "Settings updated" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

app.get("/api/auth/me", verifyToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT id, email, created_at FROM users WHERE id = $1", [req.userId]);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Authorization error" });
    }
});




cron.schedule('* * * * *', async () => {
    console.log('[Scheduler] Checking active backup tasks...');
    try {
        const result = await pool.query("SELECT * FROM backup_tasks WHERE status = 'active'");
        const tasks = result.rows;


        const now = new Date();
        const currentMinute = now.getMinutes();
        const currentHour = now.getHours();

        tasks.forEach(task => {
            const cronParts = task.cron_schedule.split(' ');

            const taskMinute = parseInt(cronParts[0]);
            const taskHour = parseInt(cronParts[1]);


            if (currentMinute === taskMinute && currentHour === taskHour) {

                console.log(`[Scheduler] Starting backup for task ID: ${task.id}`);

                const decryptedUri = security.decryptString(task.connection_string);
                const outputFileName = `./backups/backup_auto_${task.db_type}_task${task.id}_${Date.now()}.dump`;

                let command = "";
                if (task.db_type === "postgres") {
                    command = `pg_dump ${decryptedUri} -F c -b -f ${outputFileName}`;
                }

                if (command) {
                    exec(command, async (error) => {
                        if (error) {
                            console.error(`Backup error for the task ${task.id}:`, error.message);
                            return;
                        }
                        console.log(`[Scheduler] Auto-backup successfully created: ${outputFileName}`);
                        await security.encryptFile(outputFileName);
                    });
                }
            }
        });
    } catch (err) {
        console.error('Scheduler error:', err.message);
    }
});



app.listen(PORT, () => {
    console.log(` Server run: http://localhost:${PORT}`);
    console.log(`==================================================`);
});
