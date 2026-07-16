const express = require('express');
const router = express.Router();

const initialComments = () => [
  { id: 1, author: 'Alice Silva', text: 'Muito bom o laboratório de IDOR! Ansiosa por mais.' },
  { id: 2, author: 'Bob Souza', text: 'Excelente! Vamos ver como funciona o XSS.' }
];

// Cada modo mantém seu próprio mural para o roteiro ficar previsível:
// o payload explorado no modo vulnerável não aparece no modo seguro antes do aluno reenviá-lo.
let vulnerableComments = initialComments();
let secureComments = initialComments();
let vulnerableCommentIdCounter = 3;
let secureCommentIdCounter = 3;

const escapeHtml = (str) => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

const encodeCommentForOutput = (comment) => ({
  ...comment,
  author: escapeHtml(comment.author),
  text: escapeHtml(comment.text)
});

// Rotas no modo Vulnerável
router.get('/vulnerable/comments', (req, res) => {
  res.json({
    _warning: 'ENDPOINT VULNERÁVEL: Dados de entrada não sanitizados serão retornados.',
    comments: vulnerableComments
  });
});

router.post('/vulnerable/comments', (req, res) => {
  const { author, text } = req.body;
  if (!author || !text) {
    return res.status(400).json({ error: 'Autor e texto do comentário são obrigatórios.' });
  }

  // Stored XSS: Salva o texto bruto sem qualquer sanitização no backend
  const newComment = {
    id: vulnerableCommentIdCounter++,
    author,
    text
  };

  vulnerableComments.push(newComment);
  res.status(201).json({
    message: 'Comentário publicado com sucesso (Vulnerável).',
    comment: newComment
  });
});

// Rotas no modo Seguro
router.get('/secure/comments', (req, res) => {
  res.json({
    message: 'Codificação de saída ativada.',
    comments: secureComments.map(encodeCommentForOutput)
  });
});

router.post('/secure/comments', (req, res) => {
  const { author, text } = req.body;
  if (!author || !text) {
    return res.status(400).json({ error: 'Autor e texto do comentário são obrigatórios.' });
  }

  const newComment = {
    id: secureCommentIdCounter++,
    author,
    text
  };

  secureComments.push(newComment);
  res.status(201).json({
    message: 'Comentário publicado com sucesso (Seguro).',
    comment: encodeCommentForOutput(newComment)
  });
});

// Rota de reinicialização para facilitar testes
router.post('/reset', (req, res) => {
  vulnerableComments = initialComments();
  secureComments = initialComments();
  vulnerableCommentIdCounter = 3;
  secureCommentIdCounter = 3;
  res.json({ message: 'Banco de dados do lab resetado.' });
});

module.exports = router;
