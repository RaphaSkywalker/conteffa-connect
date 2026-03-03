const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Database setup
const db = new sqlite3.Database('database.sqlite');

// Promisify db runs
const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

const dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

// Create tables
const initDb = async () => {
    await dbRun(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT,
            association TEXT,
            cargo TEXT,
            status TEXT,
            photo TEXT,
            phone TEXT
        )
    `);

    await dbRun(`
        CREATE TABLE IF NOT EXISTS news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            date TEXT,
            summary TEXT,
            status TEXT,
            photo TEXT
        )
    `);

    await dbRun(`
        CREATE TABLE IF NOT EXISTS speakers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            cargo TEXT,
            bio TEXT,
            photo TEXT
        )
    `);

    await dbRun(`
        CREATE TABLE IF NOT EXISTS programming (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            label TEXT,
            items TEXT
        )
    `);

    await dbRun(`
        CREATE TABLE IF NOT EXISTS albums (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            date TEXT,
            location TEXT,
            cover TEXT,
            photos TEXT,
            count INTEGER
        )
    `);

    await dbRun(`
        CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    `);

    // Initial admin user if not exists
    const admin = await dbGet('SELECT * FROM users WHERE email = ? OR name = ?', ['admin@conteffa.com.br', 'Admin']);
    if (!admin) {
        await dbRun(`
            INSERT INTO users (name, email, password, role, association, cargo, status, phone)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            'Admin',
            'admin@conteffa.com.br',
            'Conteffa01',
            'admin',
            'ANTEFFA',
            'Administrador do Sistema',
            'Ativo',
            '(00) 00000-0000'
        ]);
    } else if (admin.name !== 'Admin' && admin.email === 'admin@conteffa.com.br') {
        // Update name to 'Admin' for easier login
        await dbRun('UPDATE users SET name = ? WHERE id = ?', ['Admin', admin.id]);
    }
};

initDb().catch(console.error);

// API Endpoints

// Auth
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(`Login attempt: ${username}`);

        // Use COLLATE NOCASE for case-insensitive comparison
        const user = await dbGet('SELECT * FROM users WHERE email = ? COLLATE NOCASE OR name = ? COLLATE NOCASE', [username, username]);

        if (user && user.password === password) {
            console.log(`Login successful for: ${username}`);
            const { password, ...userWithoutPassword } = user;
            res.json({ success: true, user: userWithoutPassword });
        } else {
            console.log(`Login failed for: ${username} - ${user ? 'Wrong password' : 'User not found'}`);
            res.status(401).json({ success: false, message: 'Usuário ou senha incorretos' });
        }
    } catch (e) {
        console.error(`Login error: ${e.message}`);
        res.status(500).json({ error: e.message });
    }
});

// Users
app.get('/api/users', async (req, res) => {
    try {
        const users = await dbAll('SELECT * FROM users');
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/users', async (req, res) => {
    const { name, email, password, role, association, cargo, status, photo, phone } = req.body;
    try {
        const result = await dbRun(`
            INSERT INTO users (name, email, password, role, association, cargo, status, photo, phone)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [name, email, password || 'Conteffa01', role || 'editor', association, cargo, status || 'Ativo', photo, phone]);
        res.json({ id: result.lastID });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, role, association, cargo, status, photo, phone, password } = req.body;

    try {
        if (password) {
            await dbRun(`
                UPDATE users SET name=?, email=?, role=?, association=?, cargo=?, status=?, photo=?, phone=?, password=?
                WHERE id=?
            `, [name, email, role, association, cargo, status, photo, phone, password, id]);
        } else {
            await dbRun(`
                UPDATE users SET name=?, email=?, role=?, association=?, cargo=?, status=?, photo=?, phone=?
                WHERE id=?
            `, [name, email, role, association, cargo, status, photo, phone, id]);
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        await dbRun('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// News
app.get('/api/news', async (req, res) => {
    try {
        const rows = await dbAll('SELECT * FROM news ORDER BY id DESC');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/news', async (req, res) => {
    const { title, date, summary, status, photo } = req.body;
    try {
        const result = await dbRun(`
            INSERT INTO news (title, date, summary, status, photo)
            VALUES (?, ?, ?, ?, ?)
        `, [title, date, summary, status, photo]);
        res.json({ id: result.lastID });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/news/:id', async (req, res) => {
    const { title, date, summary, status, photo } = req.body;
    try {
        await dbRun(`
            UPDATE news SET title=?, date=?, summary=?, status=?, photo=?
            WHERE id=?
        `, [title, date, summary, status, photo, req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/news/:id', async (req, res) => {
    try {
        await dbRun('DELETE FROM news WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Speakers
app.get('/api/speakers', async (req, res) => {
    try {
        const rows = await dbAll('SELECT * FROM speakers');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/speakers', async (req, res) => {
    const { name, cargo, bio, photo } = req.body;
    try {
        const result = await dbRun(`
            INSERT INTO speakers (name, cargo, bio, photo)
            VALUES (?, ?, ?, ?)
        `, [name, cargo, bio, photo]);
        res.json({ id: result.lastID });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/speakers/:id', async (req, res) => {
    const { name, cargo, bio, photo } = req.body;
    try {
        await dbRun(`
            UPDATE speakers SET name=?, cargo=?, bio=?, photo=?
            WHERE id=?
        `, [name, cargo, bio, photo, req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/speakers/:id', async (req, res) => {
    try {
        await dbRun('DELETE FROM speakers WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Programming
app.get('/api/programming', async (req, res) => {
    try {
        const data = await dbAll('SELECT * FROM programming');
        res.json(data.map(d => ({ ...d, items: JSON.parse(d.items) })));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/programming', async (req, res) => {
    const { date, label, items } = req.body;
    try {
        const result = await dbRun(`
            INSERT INTO programming (date, label, items)
            VALUES (?, ?, ?)
        `, [date, label, JSON.stringify(items)]);
        res.json({ id: result.lastID });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/programming/:id', async (req, res) => {
    const { date, label, items } = req.body;
    try {
        await dbRun(`
            UPDATE programming SET date=?, label=?, items=?
            WHERE id=?
        `, [date, label, JSON.stringify(items), req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/programming/:id', async (req, res) => {
    try {
        await dbRun('DELETE FROM programming WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Albums
app.get('/api/albums', async (req, res) => {
    try {
        const data = await dbAll('SELECT * FROM albums ORDER BY date DESC');
        res.json(data.map(d => ({ ...d, photos: JSON.parse(d.photos) })));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/albums', async (req, res) => {
    const { title, date, location, cover, photos, count } = req.body;
    try {
        const result = await dbRun(`
            INSERT INTO albums (title, date, location, cover, photos, count)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [title, date, location, cover, JSON.stringify(photos || []), count || 0]);
        res.json({ id: result.lastID });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/albums/:id', async (req, res) => {
    const { title, date, location, cover, photos, count } = req.body;
    try {
        await dbRun(`
            UPDATE albums SET title=?, date=?, location=?, cover=?, photos=?, count=?
            WHERE id=?
        `, [title, date, location, cover, JSON.stringify(photos || []), count, req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/albums/:id', async (req, res) => {
    try {
        await dbRun('DELETE FROM albums WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Config
app.get('/api/config/:key', async (req, res) => {
    try {
        const row = await dbGet('SELECT value FROM config WHERE key = ?', [req.params.key]);
        res.json(row ? JSON.parse(row.value) : null);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/config/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const value = JSON.stringify(req.body);
        await dbRun('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)', [key, value]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
