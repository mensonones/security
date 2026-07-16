let currentMode = 'vulnerable';

// Objeto para acompanhar o estado do roteiro do laboratório
const completedSteps = {
  step1: false, // Enviar comentário comum no modo vulnerável
  step2: false, // Executar XSS com sucesso no modo vulnerável
  step3: false, // Enviar payload no modo seguro e ver que foi escapado
  step4: false  // Analisar o código seguro no visualizador
};
const suppressStoredXssReplayKey = 'xssLab.suppressStoredXssReplay';

// Carregar os comentários ao iniciar a página
document.addEventListener('DOMContentLoaded', () => {
  setupXssInterception();
  fetchComments();
});

// Define uma função global para interceptar a execução controlada do payload XSS.
function setupXssInterception() {
  window.triggerXSSAlert = function(msg) {
    showXssModal(msg || 'triggerXSSAlert()');
  };
}

// Exibe o modal de sucesso do XSS
function showXssModal(payloadText) {
  if (sessionStorage.getItem(suppressStoredXssReplayKey) === 'true') {
    return;
  }

  const modal = document.getElementById('xss-alert-modal');
  const codeEl = document.getElementById('executed-payload-code');
  
  codeEl.textContent = payloadText;
  modal.classList.add('active');
  
  // Marca o passo 2 (Exploitation) como completo
  if (currentMode === 'vulnerable') {
    markStepComplete('step-2', 'step2');
  }
}

// Fecha o modal do XSS
function closeXssModal() {
  const modal = document.getElementById('xss-alert-modal');
  modal.classList.remove('active');
}

// Controla a alternância entre modo vulnerável e seguro
function setMode(mode) {
  currentMode = mode;
  
  const toggleVuln = document.getElementById('toggle-vulnerable');
  const toggleSec = document.getElementById('toggle-secure');
  const urlRoutePrefix = document.getElementById('url-route-prefix');
  
  if (mode === 'vulnerable') {
    toggleVuln.classList.add('active');
    toggleSec.classList.remove('active');
    urlRoutePrefix.textContent = 'vulnerable';
    urlRoutePrefix.classList.remove('secure-mode');
  } else {
    toggleVuln.classList.remove('active');
    toggleSec.classList.add('active');
    urlRoutePrefix.textContent = 'secure';
    urlRoutePrefix.classList.add('secure-mode');
  }

  // Atualiza a lista de comentários para o modo selecionado
  fetchComments();

  // Limpa o painel de resposta HTTP
  const responseOutput = document.getElementById('response-output');
  const responseStatus = document.getElementById('response-status');
  responseOutput.textContent = '// Envie um comentário para ver a resposta HTTP da API';
  responseStatus.className = 'status-badge status-none';
  responseStatus.textContent = '---';
}

// Busca os comentários do servidor
async function fetchComments() {
  const wall = document.getElementById('comments-wall');
  
  try {
    const response = await fetch(`/api/xss/${currentMode}/comments`);
    const data = await response.json();
    
    if (currentMode === 'vulnerable') {
      renderCommentsVuln(data.comments);
    } else {
      renderCommentsSecure(data.comments);
    }
  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    wall.innerHTML = '<div class="loading-placeholder" style="color: var(--color-vuln);">Erro ao carregar comentários do servidor.</div>';
  }
}

// Renderiza comentários de forma VULNERÁVEL (usando innerHTML)
function renderCommentsVuln(comments) {
  const wall = document.getElementById('comments-wall');
  wall.innerHTML = '';

  if (comments.length === 0) {
    wall.innerHTML = '<div class="loading-placeholder">Nenhum comentário publicado.</div>';
    return;
  }

  comments.forEach(comment => {
    const el = document.createElement('div');
    el.className = 'comment-item';
    
    // VULNERABILIDADE: innerHTML insere a string contendo tags HTML sem sanitização
    el.innerHTML = `
      <div class="comment-meta">
        <span class="comment-author">${comment.author}</span>
      </div>
      <div class="comment-body">${comment.text}</div>
    `;
    wall.appendChild(el);

    // Se o comentário contiver tags script ou handlers de eventos, eles serão executados pelo browser.
    // Para scripts injetados de forma estática (tags script inseridas via innerHTML não executam por padrão),
    // atacantes usam elementos como <img src=x onerror="..."> ou <iframe src="javascript:...">
    // que disparam eventos de erro imediatamente após serem montados na DOM.
  });
}

// Renderiza comentários de forma SEGURA (usando textContent)
function renderCommentsSecure(comments) {
  const wall = document.getElementById('comments-wall');
  wall.innerHTML = '';

  if (comments.length === 0) {
    wall.innerHTML = '<div class="loading-placeholder">Nenhum comentário publicado.</div>';
    return;
  }

  comments.forEach(comment => {
    const el = document.createElement('div');
    el.className = 'comment-item';

    const meta = document.createElement('div');
    meta.className = 'comment-meta';
    
    const authorSpan = document.createElement('span');
    authorSpan.className = 'comment-author';
    // DEFESA: textContent trata a entrada estritamente como texto literal, não interpretando tags HTML
    authorSpan.textContent = comment.author;
    meta.appendChild(authorSpan);

    const body = document.createElement('div');
    body.className = 'comment-body';
    // DEFESA: textContent escapa automaticamente caracteres como < e >
    body.textContent = comment.text;

    el.appendChild(meta);
    el.appendChild(body);
    wall.appendChild(el);
  });
}

// Envia um comentário para a API
async function submitComment() {
  const authorInput = document.getElementById('comment-author');
  const textInput = document.getElementById('comment-text');
  const responseOutput = document.getElementById('response-output');
  const responseStatus = document.getElementById('response-status');
  
  const author = authorInput.value.trim();
  const text = textInput.value.trim();

  if (!author || !text) {
    alert('Por favor, preencha o autor e o texto do comentário.');
    return;
  }

  responseOutput.textContent = '// Enviando dados...';

  try {
    const response = await fetch(`/api/xss/${currentMode}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ author, text })
    });

    const data = await response.json();

    // Atualiza o painel de resposta HTTP
    responseStatus.textContent = `HTTP ${response.status} ${response.statusText || (response.status === 201 ? 'Created' : 'OK')}`;
    responseStatus.className = `status-badge status-${response.status}`;
    responseOutput.textContent = JSON.stringify(data, null, 2);

    // Limpa apenas o campo do comentário
    textInput.value = '';

    // Atualiza o mural
    await fetchComments();

    // Valida o progresso do checklist
    checkProgress(text);

  } catch (error) {
    responseStatus.textContent = 'ERRO';
    responseStatus.className = 'status-badge status-500';
    responseOutput.textContent = `Erro ao enviar comentário: ${error.message}`;
  }
}

// Verifica e avança as tarefas do checklist
function checkProgress(submittedText) {
  const hasHtmlSymbols = /<|>|onerror|javascript|script/i.test(submittedText);

  // Passo 1: Comentário inofensivo no modo vulnerável (sem scripts ou tags HTML)
  if (currentMode === 'vulnerable' && !hasHtmlSymbols && !completedSteps.step1) {
    markStepComplete('step-1', 'step1');
  }

  // Passo 3: Enviar payload no modo seguro e ver que foi neutralizado
  if (currentMode === 'secure' && hasHtmlSymbols && !completedSteps.step3) {
    markStepComplete('step-3', 'step3');
  }
}

// Marca a etapa como concluída
function markStepComplete(elementId, stateKey) {
  if (!completedSteps[stateKey]) {
    completedSteps[stateKey] = true;
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.remove('todo');
      element.classList.add('completed');
    }

    if (isLabComplete()) {
      sessionStorage.setItem(suppressStoredXssReplayKey, 'true');
    }
  }
}

function isLabComplete() {
  return Object.values(completedSteps).every(Boolean);
}

// Controla as abas do visualizador de código fonte
function showCodeTab(tab) {
  const tabVuln = document.getElementById('tab-vulnerable');
  const tabSec = document.getElementById('tab-secure');
  
  const codeVuln = document.getElementById('code-vulnerable');
  const codeSec = document.getElementById('code-secure');
  
  if (tab === 'vulnerable') {
    tabVuln.classList.add('active');
    tabSec.classList.remove('active');
    codeVuln.classList.add('active');
    codeSec.classList.remove('active');
  } else {
    tabVuln.classList.remove('active');
    tabSec.classList.add('active');
    codeVuln.classList.remove('active');
    codeSec.classList.add('active');
    
    // Passo 4: Visualizar o código seguro
    markStepComplete('step-4', 'step4');
  }
}

// Reseta a base de dados simulada
async function resetDatabase() {
  try {
    const response = await fetch('/api/xss/reset', { method: 'POST' });
    const data = await response.json();
    sessionStorage.removeItem(suppressStoredXssReplayKey);
    alert(data.message || 'Mural de comentários reiniciado.');
    window.location.reload();
  } catch (error) {
    console.error('Erro ao resetar banco de dados:', error);
  }
}
