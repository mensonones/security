const express = require('express');

const router = express.Router();

const users = {
  1: { id: 1, name: 'Alice Silva', email: 'alice.silva@email.com', role: 'Paciente' },
  2: { id: 2, name: 'Bob Souza', email: 'bob.souza@email.net', role: 'Paciente' }
};

const documents = {
  101: {
    id: 101,
    ownerId: 1,
    title: 'Relatório de Hemograma',
    date: '10/07/2026',
    clinic: 'Lab Rápido Diagnósticos',
    content: 'Glóbulos vermelhos: 4.8 M/uL (Normal), Glóbulos brancos: 6.5 K/uL (Normal), Plaquetas: 250 K/uL (Normal). Paciente saudável.'
  },
  102: {
    id: 102,
    ownerId: 2,
    title: 'Resultado de Biópsia Pulmonar [CONFIDENCIAL]',
    date: '12/07/2026',
    clinic: 'Centro Oncológico Avançado',
    content: 'ATENÇÃO: Presença de células neoplásicas atípicas compatíveis com adenocarcinoma de pulmão. Recomenda-se encaminhamento oncológico urgente.'
  }
};

function parseDocumentId(id) {
  if (!/^\d+$/.test(id)) {
    return null;
  }
  return Number(id);
}

function checkAuth(req, res, next) {
  const userId = req.cookies.session_user_id;
  if (!userId || !users[userId]) {
    return res.status(401).json({ error: 'Não autenticado. Por favor, faça login na interface do Lab.' });
  }
  req.userId = Number(userId);
  req.user = users[userId];
  next();
}

router.post('/login', (req, res) => {
  const { userId } = req.body;
  if (!users[userId]) {
    return res.status(400).json({ error: 'Usuário inválido.' });
  }
  res.cookie('session_user_id', userId.toString(), {
    httpOnly: true,
    sameSite: 'strict'
  });
  res.json({ message: `Autenticado com sucesso como ${users[userId].name}`, user: users[userId] });
});

router.get('/me', (req, res) => {
  const userId = req.cookies.session_user_id;
  if (!userId || !users[userId]) {
    return res.json({ loggedIn: false });
  }
  res.json({ loggedIn: true, user: users[userId] });
});

router.post('/logout', (req, res) => {
  res.clearCookie('session_user_id');
  res.json({ message: 'Sessão encerrada.' });
});

router.get('/vulnerable/documents/:id', checkAuth, (req, res) => {
  const docId = parseDocumentId(req.params.id);
  if (docId === null) {
    return res.status(400).json({ error: 'ID de documento inválido.' });
  }

  const doc = documents[docId];
  if (!doc) {
    return res.status(404).json({ error: 'Documento não encontrado.' });
  }

  res.json({
    _warning: 'ENDPOINT VULNERÁVEL: Nenhuma validação de propriedade realizada.',
    document: doc
  });
});

router.get('/secure/documents/:id', checkAuth, (req, res) => {
  const docId = parseDocumentId(req.params.id);
  if (docId === null) {
    return res.status(400).json({ error: 'ID de documento inválido.' });
  }

  const doc = documents[docId];
  if (!doc) {
    return res.status(404).json({ error: 'Documento não encontrado.' });
  }

  if (doc.ownerId !== req.userId) {
    return res.status(403).json({
      error: 'Acesso Negado: Você não tem autorização para visualizar este documento.'
    });
  }

  res.json({
    message: 'Acesso autorizado.',
    document: doc
  });
});

module.exports = router;
