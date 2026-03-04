const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

// Listar todas as tabelas
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("Tabelas no banco:", tables.map(t => t.name).join(', '));

    // Se existir a tabela registrations, contar registros
    if (tables.some(t => t.name === 'registrations')) {
        db.get('SELECT COUNT(*) as count FROM registrations', (err, row) => {
            if (err) console.error("Erro ao contar inscritos:", err);
            else console.log("Total de INSCRITOS no Banco Local:", row.count);
            db.close();
        });
    } else {
        console.log("Tabela 'registrations' não existe no banco local.");
        db.close();
    }
});
