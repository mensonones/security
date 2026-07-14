# Security Labs - Centro de Treinamento Prático

Este repositório contém um ambiente interativo para o aprendizado prático de vulnerabilidades comuns de segurança em aplicações web (OWASP Top 10).

Cada laboratório simula uma falha em uma API Node.js/Express e fornece um frontend interativo para demonstrar a exploração e a sua respectiva correção.

---

## Estrutura do Repositório

```text
security/
├── package.json          # Dependências do servidor central
├── server.js             # Servidor central Express (middleware global e montagem dos labs)
├── README.md             # Guia geral de uso
├── public/               # Landing page central (Painel de Labs)
│   ├── index.html
│   └── style.css
└── labs/                 # Pasta contendo os laboratórios práticos
    └── idor/             # Laboratório: Insecure Direct Object Reference
        ├── index.html    # Frontend do simulador
        ├── style.css     # Estilos específicos do simulador (Developer theme)
        ├── app.js        # Script de simulação de requisições
        └── routes.js     # API e dados simulados do laboratório
```

---

## Laboratórios Disponíveis

### 1. IDOR (Insecure Direct Object Reference)
- **Caminho**: `/labs/idor/`
- **Descrição**: Aprenda a explorar falhas onde IDs na URL ou corpo de requisições podem ser alterados para acessar dados sigilosos de outros usuários. Entenda a importância de validar a propriedade (controle de acesso a nível de objeto).

---

## Como Executar o Projeto

1. Certifique-se de ter o **Node.js** (versão 14+) instalado.
2. Instale as dependências na pasta raiz do projeto:
   ```bash
   npm install
   ```
3. Inicie o servidor central com:
   ```bash
   npm start
   ```
4. Acesse o painel central de laboratórios no seu navegador:
   [http://localhost:3000](http://localhost:3000)

Use o painel para navegar para o laboratório de IDOR ativo.

---

## Como Adicionar um Novo Lab

1. Crie uma pasta em `labs/<slug>/` com `index.html`, `style.css`, `app.js` e `routes.js`.
2. No `routes.js`, exporte um `express.Router()` com as rotas específicas do lab.
3. No `server.js`, monte a API em `/api/<slug>` e os arquivos estáticos em `/labs/<slug>`.
