const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const idorRoutes = require('./labs/idor/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Cabeçalhos de Segurança (Boas Práticas)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=()');
  next();
});

app.use('/api/idor', idorRoutes);
app.use('/labs/idor', express.static(path.join(__dirname, 'labs/idor')));
app.use(express.static(path.join(__dirname, 'public')));

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` Servidor de Segurança iniciado com sucesso!`);
  console.log(` Acesse a Home em: http://localhost:${PORT}`);
  console.log(`==================================================`);
});
