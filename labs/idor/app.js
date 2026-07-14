let currentMode = 'vulnerable';
let currentUserId = 1;

// Objeto para acompanhar o estado do roteiro do laboratório
const completedSteps = {
  step1: false, // Ler documento de Alice (101) no modo vulnerável
  step2: false, // Ler documento de Bob (102) no modo vulnerável (IDOR!)
  step3: false, // Ler documento de Bob (102) no modo seguro (Acesso Negado)
  step4: false  // Analisar o código seguro no visualizador
};

// Ao carregar a página, realiza o login padrão como Alice (ID 1)
document.addEventListener('DOMContentLoaded', () => {
  loginAs(1);
});

// Simula a autenticação de um usuário no backend
async function loginAs(userId) {
  try {
    const response = await fetch('/api/idor/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });
    
    if (response.ok) {
      currentUserId = userId;
      
      // Atualiza o estado visual dos botões de login
      document.getElementById('btn-user-1').classList.toggle('active', userId === 1);
      document.getElementById('btn-user-2').classList.toggle('active', userId === 2);
      
      // Limpa a saída anterior ao trocar de usuário
      const responseOutput = document.getElementById('response-output');
      const responseStatus = document.getElementById('response-status');
      responseOutput.textContent = `// Sessão iniciada como ${userId === 1 ? 'Alice' : 'Bob'}. Ajuste o ID do documento na URL acima e envie.`;
      responseStatus.className = 'status-badge status-none';
      responseStatus.textContent = '---';
    }
  } catch (error) {
    console.error('Erro ao efetuar login simulado:', error);
  }
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
}

// Envia a requisição HTTP simulada para a API Node.js
async function sendSimulatedRequest() {
  const docIdInput = document.getElementById('document-id-input');
  const docId = docIdInput.value.trim();
  
  const responseOutput = document.getElementById('response-output');
  const responseStatus = document.getElementById('response-status');
  
  if (!docId) {
    alert('Por favor, insira um ID de documento válido.');
    return;
  }
  
  responseOutput.textContent = '// Aguardando resposta...';
  
  try {
    const url = `/api/idor/${currentMode}/documents/${docId}`;
    const response = await fetch(url);
    const data = await response.json();
    
    // Atualizar badge de status HTTP
    responseStatus.textContent = `HTTP ${response.status} ${response.statusText || getStatusText(response.status)}`;
    responseStatus.className = `status-badge status-${response.status}`;
    
    // Formatar corpo da resposta como JSON legível
    responseOutput.textContent = JSON.stringify(data, null, 2);
    
    // Validar progresso do checklist
    checkProgress(response.status, docId);
  } catch (error) {
    responseStatus.textContent = 'ERRO';
    responseStatus.className = 'status-badge status-500';
    responseOutput.textContent = `Erro de rede/conexão: ${error.message}`;
  }
}

function getStatusText(status) {
  const statusTexts = {
    200: 'OK',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error'
  };
  return statusTexts[status] || '';
}

// Analisa as ações do usuário para riscar as tarefas resolvidas
function checkProgress(status, docId) {
  // Passo 1: Acessar a fatura própria (ID 101) como Alice (User 1) no modo vulnerável
  if (currentMode === 'vulnerable' && currentUserId === 1 && docId === '101' && status === 200) {
    markStepComplete('step-1', 'step1');
  }
  
  // Passo 2: Acessar a fatura de Bob (ID 102) como Alice (User 1) no modo vulnerável -> IDOR com sucesso!
  if (currentMode === 'vulnerable' && currentUserId === 1 && docId === '102' && status === 200) {
    markStepComplete('step-2', 'step2');
  }
  
  // Passo 3: Tentar acessar o documento de Bob (102) no modo seguro como Alice (User 1) -> 403 Acesso Negado!
  if (currentMode === 'secure' && currentUserId === 1 && docId === '102' && status === 403) {
    markStepComplete('step-3', 'step3');
  }
}

// Marca a etapa como concluída no front-end
function markStepComplete(elementId, stateKey) {
  if (!completedSteps[stateKey]) {
    completedSteps[stateKey] = true;
    const element = document.getElementById(elementId);
    element.classList.remove('todo');
    element.classList.add('completed');
  }
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
    
    // Passo 4 do checklist: Clicar na aba do código seguro para aprender a corrigir
    markStepComplete('step-4', 'step4');
  }
}
