const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

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

// Multer storage config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

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

    await dbRun(`
        CREATE TABLE IF NOT EXISTS registrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nomeCompleto TEXT,
            email TEXT,
            telefone TEXT,
            celularWhatsapp TEXT,
            endereco TEXT,
            bairro TEXT,
            cidade TEXT,
            cep TEXT,
            ateffa TEXT,
            cargo TEXT,
            formaDeslocamento TEXT,
            problemaSaude TEXT,
            qualSaude TEXT,
            cuidadosEspeciais TEXT,
            quaisCuidados TEXT,
            acompanhantes TEXT,
            parentesco TEXT,
            quantosAcompanhantes TEXT,
            nomeAcompanhante TEXT,
            foto TEXT,
            data TEXT,
            status TEXT,
            cpf TEXT,
            dataNascimento TEXT,
            tamanhoCamiseta TEXT,
            hotel TEXT,
            qualHotel TEXT,
            acompanhantesNames TEXT
        )
    `);

    // Migration for new fields
    const columns = [
        { name: 'cpf', type: 'TEXT' },
        { name: 'dataNascimento', type: 'TEXT' },
        { name: 'tamanhoCamiseta', type: 'TEXT' },
        { name: 'hotel', type: 'TEXT' },
        { name: 'qualHotel', type: 'TEXT' },
        { name: 'acompanhantesNames', type: 'TEXT' }
    ];

    for (const col of columns) {
        try {
            await dbRun(`ALTER TABLE registrations ADD COLUMN ${col.name} ${col.type}`);
            console.log(`Column ${col.name} added to registrations table`);
        } catch (err) {
            // Column probably already exists
        }
    }

    await dbRun(`
        CREATE TABLE IF NOT EXISTS guests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            cargo TEXT,
            category TEXT,
            bio TEXT,
            photo TEXT
        )
    `);

    await dbRun(`
        CREATE TABLE IF NOT EXISTS metrics (
            id TEXT PRIMARY KEY,
            count INTEGER DEFAULT 0
        )
    `);

    await dbRun(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            content TEXT,
            type TEXT DEFAULT 'info',
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await dbRun(`
        CREATE TABLE IF NOT EXISTS regulamentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            fileUrl TEXT
        )
    `);

    await dbRun(`
        CREATE TABLE IF NOT EXISTS cadernos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            items TEXT
        )
    `);

    // Initialize metrics if not exists
    await dbRun("INSERT OR IGNORE INTO metrics (id, count) VALUES ('ad_clicks', 0)");

    // Initialize default goal
    await dbRun("INSERT OR IGNORE INTO config (key, value) VALUES ('registration_goal', '200')");

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

// Photo upload endpoint
app.post('/api/upload', upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    const photoUrl = `http://localhost:3001/uploads/${req.file.filename}`;
    res.json({ success: true, url: photoUrl });
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

// Config
app.get('/api/config/:key', async (req, res) => {
    try {
        const row = await dbGet('SELECT value FROM config WHERE key = ?', [req.params.key]);
        if (row && row.value) {
            let val = row.value;

            // Auto-correção para o formato de "mapa de caracteres" corrompido
            if (typeof val === 'string' && val.startsWith('{"0":')) {
                try {
                    const data = JSON.parse(val);
                    if (data && typeof data === 'object' && '0' in data) {
                        val = Object.values(data).join('');
                    }
                } catch (e) { console.error("Falha ao reconstruir config:", e); }
            }

            try {
                res.json(JSON.parse(val));
            } catch (e) {
                res.json(val);
            }
        } else {
            res.json(null);
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/config/:key', async (req, res) => {
    try {
        const value = typeof req.body === 'object' ? JSON.stringify(req.body) : String(req.body);
        await dbRun(`
            INSERT INTO config (key, value) 
            VALUES (?, ?) 
            ON CONFLICT(key) DO UPDATE SET value = ?
        `, [req.params.key, value, value]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Messages
app.get('/api/messages', async (req, res) => {
    try {
        const rows = await dbAll('SELECT * FROM messages ORDER BY created_at DESC');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/messages/read-all', async (req, res) => {
    try {
        await dbRun('UPDATE messages SET is_read = 1');
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

// Guests
app.get('/api/guests', async (req, res) => {
    try {
        const rows = await dbAll('SELECT * FROM guests');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/guests', async (req, res) => {
    const { name, cargo, category, bio, photo } = req.body;
    try {
        const result = await dbRun(`
            INSERT INTO guests (name, cargo, category, bio, photo)
            VALUES (?, ?, ?, ?, ?)
        `, [name, cargo, category, bio, photo]);
        res.json({ id: result.lastID });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/guests/:id', async (req, res) => {
    const { name, cargo, category, bio, photo } = req.body;
    try {
        await dbRun(`
            UPDATE guests SET name=?, cargo=?, category=?, bio=?, photo=?
            WHERE id=?
        `, [name, cargo, category, bio, photo, req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/guests/:id', async (req, res) => {
    try {
        await dbRun('DELETE FROM guests WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Registrations
app.get('/api/registrations', async (req, res) => {
    try {
        const rows = await dbAll('SELECT * FROM registrations ORDER BY id DESC');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/registrations', async (req, res) => {
    const fields = [
        'nomeCompleto', 'email', 'telefone', 'celularWhatsapp', 'endereco',
        'bairro', 'cidade', 'cep', 'ateffa', 'cargo', 'formaDeslocamento',
        'problemaSaude', 'qualSaude', 'cuidadosEspeciais', 'quaisCuidados',
        'acompanhantes', 'parentesco', 'quantosAcompanhantes', 'nomeAcompanhante',
        'foto', 'data', 'status', 'cpf', 'dataNascimento', 'tamanhoCamiseta', 'hotel',
        'qualHotel', 'acompanhantesNames'
    ];

    const placeholders = fields.map(() => '?').join(', ');
    const values = fields.map(field => req.body[field]);

    console.log(`Creating registration for: ${req.body.nomeCompleto}`);

    try {
        const result = await dbRun(`
            INSERT INTO registrations (${fields.join(', ')})
            VALUES (${placeholders})
        `, values);
        console.log(`Registration created with ID: ${result.lastID}`);
        res.json({ id: result.lastID });
    } catch (e) {
        console.error('Error saving registration:', e);
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/registrations/:id', async (req, res) => {
    const fields = [
        'nomeCompleto', 'email', 'telefone', 'celularWhatsapp', 'endereco',
        'bairro', 'cidade', 'cep', 'ateffa', 'cargo', 'formaDeslocamento',
        'problemaSaude', 'qualSaude', 'cuidadosEspeciais', 'quaisCuidados',
        'acompanhantes', 'parentesco', 'quantosAcompanhantes', 'nomeAcompanhante',
        'foto', 'data', 'status', 'cpf', 'dataNascimento', 'tamanhoCamiseta', 'hotel',
        'qualHotel', 'acompanhantesNames'
    ];

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => req.body[field]);
    values.push(req.params.id);

    console.log(`Updating registration ID: ${req.params.id}`);

    try {
        const result = await dbRun(`UPDATE registrations SET ${setClause} WHERE id = ?`, values);
        if (result.changes === 0) {
            console.warn(`No registration found with ID: ${req.params.id} to update`);
        } else {
            console.log(`Registration ID: ${req.params.id} updated successfully`);
        }
        res.json({ success: true, changes: result.changes });
    } catch (e) {
        console.error(`Error updating registration ${req.params.id}:`, e);
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/registrations/:id', async (req, res) => {
    try {
        const result = await dbRun('DELETE FROM registrations WHERE id = ?', [req.params.id]);
        console.log(`Deleted registration ID: ${req.params.id}`);
        res.json({ success: true, changes: result.changes });
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
        console.log(`Config ${key} updated`);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Metrics
app.get('/api/metrics/:id', async (req, res) => {
    try {
        const row = await dbGet('SELECT count FROM metrics WHERE id = ?', [req.params.id]);
        res.json(row || { count: 0 });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/metrics/increment/:id', async (req, res) => {
    try {
        await dbRun(`
            INSERT INTO metrics (id, count) 
            VALUES (?, 1) 
            ON CONFLICT(id) DO UPDATE SET count = count + 1
        `, [req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Regulamentos
app.get('/api/regulamentos', async (req, res) => {
    try {
        const rows = await dbAll('SELECT * FROM regulamentos ORDER BY id DESC');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/regulamentos', async (req, res) => {
    const { name, fileUrl } = req.body;
    console.log(`Creating regulamento: ${name}`);
    try {
        const result = await dbRun('INSERT INTO regulamentos (name, fileUrl) VALUES (?, ?)', [name, fileUrl]);
        console.log(`Regulamento created with ID: ${result.lastID}`);
        res.json({ id: result.lastID });
    } catch (e) {
        console.error('Error creating regulamento:', e);
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/regulamentos/:id', async (req, res) => {
    const { name, fileUrl } = req.body;
    console.log(`Updating regulamento ID: ${req.params.id}`);
    try {
        const result = await dbRun('UPDATE regulamentos SET name = ?, fileUrl = ? WHERE id = ?', [name, fileUrl, req.params.id]);
        if (result.changes === 0) {
            console.warn(`No regulamento found with ID: ${req.params.id} to update. Falling back to INSERT.`);
            const insertResult = await dbRun('INSERT INTO regulamentos (name, fileUrl) VALUES (?, ?)', [name, fileUrl]);
            return res.json({ success: true, id: insertResult.lastID, note: 'Inserted as new because ID not found' });
        }
        res.json({ success: true });
    } catch (e) {
        console.error('Error updating regulamento:', e);
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/regulamentos/:id', async (req, res) => {
    try {
        await dbRun('DELETE FROM regulamentos WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Cadernos
app.get('/api/cadernos', async (req, res) => {
    try {
        const rows = await dbAll('SELECT * FROM cadernos ORDER BY id DESC');
        res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items || '[]') })));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/cadernos', async (req, res) => {
    const { name, items } = req.body;
    console.log(`Creating caderno: ${name}`);
    try {
        const result = await dbRun('INSERT INTO cadernos (name, items) VALUES (?, ?)', [name, JSON.stringify(items || [])]);
        console.log(`Caderno created with ID: ${result.lastID}`);
        res.json({ id: result.lastID });
    } catch (e) {
        console.error('Error creating caderno:', e);
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/cadernos/:id', async (req, res) => {
    const { name, items } = req.body;
    console.log(`Updating caderno ID: ${req.params.id}`);
    try {
        const result = await dbRun('UPDATE cadernos SET name = ?, items = ? WHERE id = ?', [name, JSON.stringify(items || []), req.params.id]);
        if (result.changes === 0) {
            console.warn(`No caderno found with ID: ${req.params.id} to update. Falling back to INSERT.`);
            const insertResult = await dbRun('INSERT INTO cadernos (name, items) VALUES (?, ?)', [name, JSON.stringify(items || [])]);
            return res.json({ success: true, id: insertResult.lastID, note: 'Inserted as new because ID not found' });
        }
        res.json({ success: true });
    } catch (e) {
        console.error('Error updating caderno:', e);
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/cadernos/:id', async (req, res) => {
    try {
        await dbRun('DELETE FROM cadernos WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
