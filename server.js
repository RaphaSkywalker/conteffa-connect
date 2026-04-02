import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// O Hostinger usará portas fornecidas nas variáveis de ambiente.

// Servir arquivos estáticos contidos na pasta dist 
// (essa é a pasta otimizada gerada pelo vite)
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Routing: Redireciona qualquer requisição que não seja um arquivo (ex: /admin) 
// para o index.html gerenciar a rota via React Router
app.get('/:path(.*)', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
