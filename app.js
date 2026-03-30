/* =============================================
   BENECONTROL - app.js
   Desenvolvido por BeneApps
============================================= */

'use strict';

// ─── STORAGE KEYS ─────────────────────────────
const KEYS = {
  password: 'bctl_password',
  accounts: 'bctl_accounts',
  transactions: 'bctl_transactions',
  bills: 'bctl_bills',
  currentMonthKey: 'bctl_current_month',
  projects: 'bctl_projects',
  goals: 'bctl_goals',
  ideas: 'bctl_ideas',
  progress: 'bctl_progress',
};

// ─── ACCOUNT DEFINITIONS ─────────────────────
const ACCOUNT_DEFS = [
  { id: 'corrente', name: 'Conta Corrente Itaú', icon: '🏦' },
  { id: 'poupanca', name: 'Poupança Itaú',       icon: '🏧' },
  { id: 'bradesco', name: 'Bradesco',             icon: '🏦' },
  { id: 'sicoob',   name: 'Sicoob',              icon: '🤝' },
  { id: 'cofre',    name: 'Cofre',               icon: '🔐' },
  { id: 'outros',   name: 'Outros',              icon: '💼' },
];

// ─── APP STATE ────────────────────────────────
let state = {
  accounts: {},
  transactions: [],
  bills: {},
  currentMonthKey: '',
  projects: [],
  goals: [],
  ideas: [],
  progress: 20,
  currentProjectFilter: 'todos',
  currentGoalFilter: 'todos',
  currentIdeaFilter: 'todos',
  pendingBillId: null,
  editingProjectId: null,
  editingGoalId: null,
  editingIdeaId: null,
  previousScreen: 'screen-home',
};

// ─── UTILS ───────────────────────────────────
const $ = id => document.getElementById(id);
const fmt = val => 'R$ ' + Number(val).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const uid = () => '_' + Math.random().toString(36).substr(2, 9);
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const monthLabel = (key) => {
  const [y, m] = key.split('-');
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  return `${months[parseInt(m) - 1]} ${y}`;
};
const today = () => new Date().toISOString().split('T')[0];

function showToast(msg) {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ─── PERSISTENCE ─────────────────────────────
function save() {
  try {
    localStorage.setItem(KEYS.accounts, JSON.stringify(state.accounts));
    localStorage.setItem(KEYS.transactions, JSON.stringify(state.transactions));
    localStorage.setItem(KEYS.bills, JSON.stringify(state.bills));
    localStorage.setItem(KEYS.currentMonthKey, state.currentMonthKey);
    localStorage.setItem(KEYS.projects, JSON.stringify(state.projects));
    localStorage.setItem(KEYS.goals, JSON.stringify(state.goals));
    localStorage.setItem(KEYS.ideas, JSON.stringify(state.ideas));
    localStorage.setItem(KEYS.progress, state.progress);
  } catch (e) { console.error('Save error:', e); }
}

function load() {
  try {
    const acc = localStorage.getItem(KEYS.accounts);
    state.accounts = acc ? JSON.parse(acc) : {};
    ACCOUNT_DEFS.forEach(a => { if (!(a.id in state.accounts)) state.accounts[a.id] = 0; });

    const tx = localStorage.getItem(KEYS.transactions);
    state.transactions = tx ? JSON.parse(tx) : [];

    const bills = localStorage.getItem(KEYS.bills);
    state.bills = bills ? JSON.parse(bills) : {};

    state.currentMonthKey = localStorage.getItem(KEYS.currentMonthKey) || monthKey(new Date());
    if (!state.bills[state.currentMonthKey]) {
      state.bills[state.currentMonthKey] = [];
    }

    const proj = localStorage.getItem(KEYS.projects);
    state.projects = proj ? JSON.parse(proj) : [];

    const goals = localStorage.getItem(KEYS.goals);
    state.goals = goals ? JSON.parse(goals) : [];

    const ideas = localStorage.getItem(KEYS.ideas);
    state.ideas = ideas ? JSON.parse(ideas) : [];

    const prog = localStorage.getItem(KEYS.progress);
    state.progress = prog ? parseInt(prog) : 20;
  } catch (e) { console.error('Load error:', e); }
}

// ─── NAVIGATION ──────────────────────────────
function hideAllScreens() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
}

function openScreen(id) {
  const prev = document.querySelector('.screen.active');
  if (prev) state.previousScreen = prev.id;
  hideAllScreens();
  const el = $(id);
  if (el) {
    el.classList.add('active');
    el.scrollTop = 0;
    renderScreen(id);
  }
}

function goBack() {
  openScreen(state.previousScreen || 'screen-home');
}

function renderScreen(id) {
  try {
    if (id === 'screen-home') renderHome();
    else if (id === 'screen-pessoal') renderPessoal();
    else if (id === 'screen-contas') renderContas();
    else if (id === 'screen-projetos') renderProjects();
    else if (id === 'screen-planejamento') renderPlanning();
    else if (id === 'screen-ideias') renderIdeas();
  } catch (e) { console.error('Render error:', e); }
}

// ─── MODAL ───────────────────────────────────
function openModal(id) {
  const el = $(id);
  if (el) el.classList.remove('hidden');
}

function closeModal(id) {
  const el = $(id);
  if (el) el.classList.add('hidden');
}

// Close modal on overlay click
document.addEventListener('click', function(e) {
  if (e.target && e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
  }
});

// ─── LOGIN ───────────────────────────────────
function initLogin() {
  const stored = localStorage.getItem(KEYS.password);
  const subtitle = $('login-subtitle');
  const confirmGroup = $('login-confirm-group');
  const btn = $('login-btn');

  if (stored) {
    if (subtitle) subtitle.textContent = 'Entre com sua senha';
    if (confirmGroup) confirmGroup.classList.add('hidden');
    if (btn) btn.textContent = 'Entrar';
  } else {
    if (subtitle) subtitle.textContent = 'Crie sua senha de acesso';
    if (confirmGroup) confirmGroup.classList.remove('hidden');
    if (btn) btn.textContent = 'Criar senha';
  }

  const passInput = $('login-pass');
  if (passInput) {
    passInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  }
}

function handleLogin() {
  const stored = localStorage.getItem(KEYS.password);
  const pass = ($('login-pass') || {}).value || '';

  if (!pass) { showToast('⚠️ Digite sua senha'); return; }

  if (stored) {
    if (pass === stored) {
      load();
      openScreen('screen-home');
    } else {
      showToast('❌ Senha incorreta');
      const p = $('login-pass');
      if (p) p.value = '';
    }
  } else {
    const confirm = ($('login-confirm') || {}).value || '';
    if (pass.length < 4) { showToast('⚠️ Senha deve ter pelo menos 4 caracteres'); return; }
    if (pass !== confirm) { showToast('⚠️ As senhas não coincidem'); return; }
    localStorage.setItem(KEYS.password, pass);
    showToast('✅ Senha criada com sucesso!');
    load();
    openScreen('screen-home');
  }
}

function doLogout() {
  save();
  hideAllScreens();
  const s = $('screen-login');
  if (s) s.classList.add('active');
  const p = $('login-pass');
  if (p) p.value = '';
  const c = $('login-confirm');
  if (c) c.value = '';
  initLogin();
}

// ─── HOME ─────────────────────────────────────
function renderHome() {
  renderProgress();
  renderHomeIdeas();
}

function renderProgress() {
  const bar = $('progress-bar');
  const txt = $('progress-pct-text');
  const pct = Math.max(0, Math.min(100, state.progress));
  if (bar) bar.style.width = pct + '%';
  if (txt) txt.textContent = pct + '%';
}

function updateProgress(delta) {
  state.progress = Math.max(0, Math.min(100, state.progress + delta));
  save();
  renderProgress();
  showToast('Progresso: ' + state.progress + '%');
}

function renderHomeIdeas() {
  const el = $('home-ideas-preview');
  if (!el) return;
  const recent = state.ideas.slice(-3).reverse();
  if (!recent.length) {
    el.innerHTML = `<div class="empty-state" style="padding:20px 0"><div class="empty-icon">💡</div><div class="empty-sub">Nenhuma ideia ainda</div></div>`;
    return;
  }
  el.innerHTML = recent.map(i => ideaCardHTML(i, true)).join('');
}

// ─── PESSOAL / FINANCEIRO ─────────────────────
function renderPessoal() {
  renderAccountsGrid();
  renderTransactions();
  renderBillsPreview();
}

function renderAccountsGrid() {
  const el = $('accounts-grid');
  if (!el) return;
  el.innerHTML = ACCOUNT_DEFS.map(a => {
    const bal = state.accounts[a.id] || 0;
    const cls = bal > 0 ? 'positive' : 'zero';
    return `<div class="account-card">
      <div class="account-icon">${a.icon}</div>
      <div class="account-name">${a.name}</div>
      <div class="account-balance ${cls}">${fmt(bal)}</div>
    </div>`;
  }).join('');
}

function renderTransactions() {
  const el = $('tx-list');
  if (!el) return;
  const txs = state.transactions.slice(-20).reverse();
  if (!txs.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-sub">Nenhuma transação ainda</div></div>`;
    return;
  }
  el.innerHTML = txs.map(tx => {
    const acc = ACCOUNT_DEFS.find(a => a.id === tx.account);
    const icon = tx.type === 'entrada' ? '💰' : '💸';
    return `<div class="transaction-item">
      <div class="tx-left">
        <div class="tx-icon ${tx.type}">${icon}</div>
        <div class="tx-info">
          <div class="tx-desc">${esc(tx.desc)}</div>
          <div class="tx-meta">${acc ? acc.name : tx.account} · ${tx.date || ''}</div>
        </div>
      </div>
      <div class="tx-amount ${tx.type}">${tx.type === 'entrada' ? '+' : '-'}${fmt(tx.value)}</div>
    </div>`;
  }).join('');
}

function renderBillsPreview() {
  const el = $('bills-preview-home');
  if (!el) return;
  const bills = state.bills[state.currentMonthKey] || [];
  const pending = bills.filter(b => !b.paid);
  if (!pending.length) {
    el.innerHTML = `<div class="card" style="color:var(--green);font-size:0.85rem;text-align:center;padding:12px">✅ Todas as contas pagas!</div>`;
    return;
  }
  const total = pending.reduce((s, b) => s + Number(b.value || 0), 0);
  el.innerHTML = `<div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px">
    <span style="font-size:0.85rem;color:var(--text-2)">${pending.length} conta(s) pendente(s)</span>
    <span style="font-family:var(--font-display);color:var(--yellow);font-weight:800">${fmt(total)}</span>
  </div>`;
}

// Transactions
function openAddTransaction(type) {
  const sel = $('tx-type');
  if (sel) sel.value = type;
  const dt = $('tx-date');
  if (dt) dt.value = today();
  const d = $('tx-desc');
  if (d) d.value = '';
  const v = $('tx-value');
  if (v) v.value = '';
  openModal('modal-transaction');
}

function saveTransaction() {
  const type = ($('tx-type') || {}).value;
  const desc = (($('tx-desc') || {}).value || '').trim();
  const value = parseFloat(($('tx-value') || {}).value) || 0;
  const account = ($('tx-account') || {}).value;
  const date = ($('tx-date') || {}).value || today();

  if (!desc) { showToast('⚠️ Informe uma descrição'); return; }
  if (!value || value <= 0) { showToast('⚠️ Informe um valor válido'); return; }

  const tx = { id: uid(), type, desc, value, account, date };
  state.transactions.push(tx);

  if (type === 'entrada') {
    state.accounts[account] = (state.accounts[account] || 0) + value;
  } else {
    state.accounts[account] = (state.accounts[account] || 0) - value;
  }

  save();
  closeModal('modal-transaction');
  renderPessoal();
  showToast(type === 'entrada' ? '💰 Entrada registrada!' : '💸 Saída registrada!');
}

// ─── CONTAS MENSAIS ───────────────────────────
function renderContas() {
  const label = $('current-month-label');
  if (label) label.textContent = monthLabel(state.currentMonthKey);
  renderBillsList();
  renderBillsSummary();
}

function renderBillsList() {
  const el = $('bills-list');
  if (!el) return;
  const bills = state.bills[state.currentMonthKey] || [];
  if (!bills.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📄</div><div class="empty-title">Nenhuma conta cadastrada</div><div class="empty-sub">Adicione contas com o botão abaixo</div></div>`;
    return;
  }

  el.innerHTML = bills.map(b => {
    const typeBadge = b.billType === 'fixa'
      ? `<span class="badge badge-blue">Fixa</span>`
      : `<span class="badge badge-yellow">Variável</span>`;
    const statusBadge = b.paid
      ? `<span class="badge badge-green">Pago</span>`
      : `<span class="badge badge-gray">Pendente</span>`;
    return `<div class="bill-item${b.paid ? ' paid' : ''}">
      <div class="bill-left">
        <div class="bill-check ${b.paid ? 'checked' : ''}" onclick="requestPayBill('${b.id}')">${b.paid ? '✓' : ''}</div>
        <div>
          <div class="bill-name">${esc(b.name)}</div>
          <div class="bill-type" style="margin-top:2px">${typeBadge} ${statusBadge}</div>
        </div>
      </div>
      <div class="bill-right">
        <div class="bill-value">${fmt(b.value)}</div>
        <button class="btn btn-icon btn-danger" onclick="deleteBill('${b.id}')">🗑</button>
      </div>
    </div>`;
  }).join('');
}

function renderBillsSummary() {
  const bills = state.bills[state.currentMonthKey] || [];
  const total = bills.reduce((s, b) => s + Number(b.value || 0), 0);
  const paid = bills.filter(b => b.paid).reduce((s, b) => s + Number(b.value || 0), 0);
  const pending = total - paid;
  const tEl = $('bills-total');
  const pEl = $('bills-paid');
  const pdEl = $('bills-pending');
  if (tEl) tEl.textContent = fmt(total);
  if (pEl) pEl.textContent = fmt(paid);
  if (pdEl) pdEl.textContent = fmt(pending);
}

function saveBill() {
  const name = (($('bill-name') || {}).value || '').trim();
  const value = parseFloat(($('bill-value') || {}).value) || 0;
  const billType = ($('bill-type') || {}).value || 'fixa';

  if (!name) { showToast('⚠️ Informe o nome da conta'); return; }
  if (!value || value <= 0) { showToast('⚠️ Informe um valor válido'); return; }

  const bill = { id: uid(), name, value, billType, paid: false, paidFrom: null };
  if (!state.bills[state.currentMonthKey]) state.bills[state.currentMonthKey] = [];
  state.bills[state.currentMonthKey].push(bill);

  save();
  closeModal('modal-new-bill');
  const bn = $('bill-name'), bv = $('bill-value');
  if (bn) bn.value = ''; if (bv) bv.value = '';
  renderContas();
  showToast('✅ Conta adicionada!');
}

function deleteBill(id) {
  state.bills[state.currentMonthKey] = (state.bills[state.currentMonthKey] || []).filter(b => b.id !== id);
  save();
  renderContas();
  showToast('🗑 Conta removida');
}

// Payment flow
function requestPayBill(id) {
  const bills = state.bills[state.currentMonthKey] || [];
  const bill = bills.find(b => b.id === id);
  if (!bill) return;
  if (bill.paid) {
    // toggle unpay
    bill.paid = false;
    bill.paidFrom = null;
    save();
    renderContas();
    showToast('↩ Pagamento desfeito');
    return;
  }
  state.pendingBillId = id;

  const variableField = $('modal-pay-variable-val');
  const varInput = $('pay-variable-val');
  if (bill.billType === 'variavel') {
    if (variableField) variableField.classList.remove('hidden');
    if (varInput) { varInput.value = ''; varInput.placeholder = fmt(bill.value); }
  } else {
    if (variableField) variableField.classList.add('hidden');
  }
  openModal('modal-pay-bill');
}

function confirmPayBill(source) {
  const id = state.pendingBillId;
  if (!id) return;
  const bills = state.bills[state.currentMonthKey] || [];
  const bill = bills.find(b => b.id === id);
  if (!bill) { closeModal('modal-pay-bill'); return; }

  let finalValue = bill.value;
  if (bill.billType === 'variavel') {
    const varInput = $('pay-variable-val');
    const v = parseFloat((varInput || {}).value);
    if (v && v > 0) {
      finalValue = v;
      bill.value = v;
    }
  }

  bill.paid = true;
  bill.paidFrom = source;

  if (source !== 'nenhum') {
    state.accounts[source] = (state.accounts[source] || 0) - finalValue;
    const tx = {
      id: uid(),
      type: 'saida',
      desc: 'Conta: ' + bill.name,
      value: finalValue,
      account: source,
      date: today(),
    };
    state.transactions.push(tx);
  }

  save();
  closeModal('modal-pay-bill');
  state.pendingBillId = null;
  renderContas();
  showToast('✅ Pagamento registrado!');
}

// Close month
function openCloseMonth() {
  const bills = state.bills[state.currentMonthKey] || [];
  const pending = bills.filter(b => !b.paid);
  const infoEl = $('close-month-pending-info');
  const txtEl = $('close-month-pending-text');
  if (pending.length > 0) {
    if (infoEl) infoEl.style.display = '';
    if (txtEl) txtEl.textContent = `⚠️ Atenção: ${pending.length} conta(s) ainda pendente(s) (${fmt(pending.reduce((s,b)=>s+Number(b.value||0),0))})`;
  } else {
    if (infoEl) infoEl.style.display = 'none';
  }
  openModal('modal-close-month');
}

function confirmCloseMonth() {
  const currentBills = state.bills[state.currentMonthKey] || [];

  // Generate next month key
  const [y, m] = state.currentMonthKey.split('-').map(Number);
  const nextDate = new Date(y, m, 1);
  const nextKey = monthKey(nextDate);

  if (state.bills[nextKey]) {
    showToast('ℹ️ Próximo mês já existe');
    closeModal('modal-close-month');
    return;
  }

  // Copy fixed bills to next month
  const nextBills = currentBills
    .filter(b => b.billType === 'fixa')
    .map(b => ({ id: uid(), name: b.name, value: b.value, billType: 'fixa', paid: false, paidFrom: null }));

  state.bills[nextKey] = nextBills;
  state.currentMonthKey = nextKey;
  if (!state.bills[state.currentMonthKey]) state.bills[state.currentMonthKey] = [];

  save();
  closeModal('modal-close-month');
  renderContas();
  showToast(`✅ Mês encerrado! Bem-vindo a ${monthLabel(state.currentMonthKey)}`);
}

// WhatsApp share
function openShareModal() {
  const bills = state.bills[state.currentMonthKey] || [];
  const total = bills.reduce((s, b) => s + Number(b.value || 0), 0);
  const paid = bills.filter(b => b.paid).reduce((s, b) => s + Number(b.value || 0), 0);
  const pending = total - paid;

  let text = `📊 *Resumo Financeiro - ${monthLabel(state.currentMonthKey)}*\n\n`;
  text += `💰 *Total:* ${fmt(total)}\n`;
  text += `✅ *Pago:* ${fmt(paid)}\n`;
  text += `⏳ *Pendente:* ${fmt(pending)}\n\n`;
  text += `📋 *Contas:*\n`;
  bills.forEach(b => {
    text += `${b.paid ? '✅' : '⏳'} ${b.name}: ${fmt(b.value)}\n`;
  });
  text += `\n🏦 *Saldos:*\n`;
  ACCOUNT_DEFS.forEach(a => {
    const bal = state.accounts[a.id] || 0;
    if (bal !== 0) text += `${a.icon} ${a.name}: ${fmt(bal)}\n`;
  });
  text += `\n_Enviado via BeneControl_`;

  const preview = $('share-preview');
  if (preview) preview.textContent = text;
  openModal('modal-share');
}

function sendWhatsApp() {
  const bills = state.bills[state.currentMonthKey] || [];
  const total = bills.reduce((s, b) => s + Number(b.value || 0), 0);
  const paid = bills.filter(b => b.paid).reduce((s, b) => s + Number(b.value || 0), 0);
  const pending = total - paid;

  let text = `📊 *Resumo Financeiro - ${monthLabel(state.currentMonthKey)}*\n\n`;
  text += `💰 Total: ${fmt(total)}\n✅ Pago: ${fmt(paid)}\n⏳ Pendente: ${fmt(pending)}\n\n`;
  text += `📋 Contas:\n`;
  bills.forEach(b => { text += `${b.paid ? '✅' : '⏳'} ${b.name}: ${fmt(b.value)}\n`; });
  text += `\n_BeneControl by BeneApps_`;
  window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
}

// ─── PROJECTS ─────────────────────────────────
function renderProjects(filter) {
  filter = filter || state.currentProjectFilter;
  const el = $('projects-list');
  if (!el) return;

  let list = state.projects;
  if (filter !== 'todos') list = list.filter(p => p.status === filter);

  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🚀</div><div class="empty-title">Nenhum projeto${filter !== 'todos' ? ' aqui' : ''}</div><div class="empty-sub">Crie um novo projeto abaixo</div></div>`;
    return;
  }

  const statusMap = {
    planejamento: ['badge-blue',  '🗂️ Planejamento'],
    andamento:    ['badge-yellow','🚀 Em Andamento'],
    concluido:    ['badge-green', '✅ Concluído'],
    pausado:      ['badge-gray',  '⏸️ Pausado'],
  };

  el.innerHTML = list.map(p => {
    const [cls, lbl] = statusMap[p.status] || ['badge-gray', p.status];
    return `<div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">${esc(p.title)}</div>
          <div class="mt-8"><span class="badge ${cls}">${lbl}</span></div>
        </div>
        <div class="card-actions">
          <button class="btn btn-icon btn-secondary" onclick="openEditProject('${p.id}')">✏️</button>
          <button class="btn btn-icon btn-danger" onclick="deleteProject('${p.id}')">🗑</button>
        </div>
      </div>
      ${p.desc ? `<div class="card-body">${esc(p.desc)}</div>` : ''}
    </div>`;
  }).join('');
}

function filterProjects(filter, el) {
  state.currentProjectFilter = filter;
  document.querySelectorAll('#proj-tabs .status-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  renderProjects(filter);
}

function openAddProject() {
  state.editingProjectId = null;
  const t = $('modal-project-title');
  if (t) t.textContent = 'Novo Projeto';
  const ti = $('proj-title'), d = $('proj-desc'), s = $('proj-status');
  if (ti) ti.value = ''; if (d) d.value = ''; if (s) s.value = 'planejamento';
  openModal('modal-new-project');
}

function openEditProject(id) {
  const p = state.projects.find(x => x.id === id);
  if (!p) return;
  state.editingProjectId = id;
  const t = $('modal-project-title');
  if (t) t.textContent = 'Editar Projeto';
  const ti = $('proj-title'), d = $('proj-desc'), s = $('proj-status');
  if (ti) ti.value = p.title; if (d) d.value = p.desc; if (s) s.value = p.status;
  openModal('modal-new-project');
}

function saveProject() {
  const title = (($('proj-title') || {}).value || '').trim();
  const desc = (($('proj-desc') || {}).value || '').trim();
  const status = ($('proj-status') || {}).value || 'planejamento';

  if (!title) { showToast('⚠️ Informe o título do projeto'); return; }

  if (state.editingProjectId) {
    const p = state.projects.find(x => x.id === state.editingProjectId);
    if (p) { p.title = title; p.desc = desc; p.status = status; }
  } else {
    state.projects.push({ id: uid(), title, desc, status });
  }

  save();
  closeModal('modal-new-project');
  state.editingProjectId = null;
  renderProjects();
  showToast(state.editingProjectId ? '✏️ Projeto atualizado' : '✅ Projeto criado!');
}

function deleteProject(id) {
  state.projects = state.projects.filter(p => p.id !== id);
  save();
  renderProjects();
  showToast('🗑 Projeto removido');
}

// ─── PLANNING / GOALS ─────────────────────────
function renderPlanning(filter) {
  filter = filter || state.currentGoalFilter;
  const el = $('goals-list');
  if (!el) return;

  let list = state.goals;
  if (filter !== 'todos') list = list.filter(g => g.cat === filter);

  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🎯</div><div class="empty-title">Nenhuma meta${filter !== 'todos' ? ' aqui' : ''}</div><div class="empty-sub">Adicione suas metas abaixo</div></div>`;
    return;
  }

  const statusMap = {
    pendente:  ['badge-gray',   '⏳ Pendente'],
    andamento: ['badge-yellow', '🚀 Em Andamento'],
    concluido: ['badge-green',  '✅ Concluído'],
  };
  const catIcons = { financeiro: '💰', pessoal: '🧠', treino: '💪', estudos: '📚' };

  el.innerHTML = list.map(g => {
    const [cls, lbl] = statusMap[g.status] || ['badge-gray', g.status];
    const icon = catIcons[g.cat] || '🎯';
    return `<div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">${icon} ${esc(g.title)}</div>
          <div class="mt-8"><span class="badge ${cls}">${lbl}</span></div>
        </div>
        <div class="card-actions">
          <button class="btn btn-icon btn-secondary" onclick="openEditGoal('${g.id}')">✏️</button>
          <button class="btn btn-icon btn-danger" onclick="deleteGoal('${g.id}')">🗑</button>
        </div>
      </div>
      ${g.desc ? `<div class="card-body">${esc(g.desc)}</div>` : ''}
    </div>`;
  }).join('');
}

function filterGoals(cat, el) {
  state.currentGoalFilter = cat;
  document.querySelectorAll('.planning-cats .cat-chip').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
  renderPlanning(cat);
}

function openAddGoal() {
  state.editingGoalId = null;
  const t = $('modal-goal-title');
  if (t) t.textContent = 'Nova Meta';
  const ti = $('goal-title'), d = $('goal-desc'), s = $('goal-status'), c = $('goal-cat');
  if (ti) ti.value = ''; if (d) d.value = ''; if (s) s.value = 'pendente'; if (c) c.value = 'financeiro';
  openModal('modal-new-goal');
}

function openEditGoal(id) {
  const g = state.goals.find(x => x.id === id);
  if (!g) return;
  state.editingGoalId = id;
  const t = $('modal-goal-title');
  if (t) t.textContent = 'Editar Meta';
  const ti = $('goal-title'), d = $('goal-desc'), s = $('goal-status'), c = $('goal-cat');
  if (ti) ti.value = g.title; if (d) d.value = g.desc; if (s) s.value = g.status; if (c) c.value = g.cat;
  openModal('modal-new-goal');
}

function saveGoal() {
  const title = (($('goal-title') || {}).value || '').trim();
  const desc = (($('goal-desc') || {}).value || '').trim();
  const status = ($('goal-status') || {}).value || 'pendente';
  const cat = ($('goal-cat') || {}).value || 'financeiro';

  if (!title) { showToast('⚠️ Informe o título da meta'); return; }

  if (state.editingGoalId) {
    const g = state.goals.find(x => x.id === state.editingGoalId);
    if (g) { g.title = title; g.desc = desc; g.status = status; g.cat = cat; }
  } else {
    state.goals.push({ id: uid(), title, desc, status, cat });
  }

  save();
  closeModal('modal-new-goal');
  state.editingGoalId = null;
  renderPlanning();
  showToast('✅ Meta salva!');
}

function deleteGoal(id) {
  state.goals = state.goals.filter(g => g.id !== id);
  save();
  renderPlanning();
  showToast('🗑 Meta removida');
}

// ─── IDEAS ────────────────────────────────────
function ideaCardHTML(i, compact) {
  const statusMap = {
    pendente:  ['badge-gray',   '💡 Pendente'],
    andamento: ['badge-yellow', '🔧 Em andamento'],
    concluido: ['badge-green',  '✅ Concluído'],
  };
  const [cls, lbl] = statusMap[i.status] || ['badge-gray', i.status];
  return `<div class="card">
    <div class="card-header">
      <div>
        <div class="card-title">${esc(i.title)}</div>
        <div class="mt-8"><span class="badge ${cls}">${lbl}</span></div>
      </div>
      ${!compact ? `<div class="card-actions">
        <button class="btn btn-icon btn-secondary" onclick="openEditIdea('${i.id}')">✏️</button>
        <button class="btn btn-icon btn-danger" onclick="deleteIdea('${i.id}')">🗑</button>
      </div>` : ''}
    </div>
    ${i.desc ? `<div class="card-body">${esc(i.desc)}</div>` : ''}
  </div>`;
}

function renderIdeas(filter) {
  filter = filter || state.currentIdeaFilter;
  const el = $('ideas-list');
  if (!el) return;

  let list = state.ideas;
  if (filter !== 'todos') list = list.filter(i => i.status === filter);

  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">💡</div><div class="empty-title">Nenhuma ideia${filter !== 'todos' ? ' aqui' : ''}</div><div class="empty-sub">Registre suas ideias abaixo</div></div>`;
    return;
  }
  el.innerHTML = list.map(i => ideaCardHTML(i, false)).join('');
}

function filterIdeas(filter, el) {
  state.currentIdeaFilter = filter;
  document.querySelectorAll('#screen-ideias .status-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  renderIdeas(filter);
}

function openAddIdea() {
  state.editingIdeaId = null;
  const t = $('modal-idea-title');
  if (t) t.textContent = 'Nova Ideia';
  const ti = $('idea-title'), d = $('idea-desc'), s = $('idea-status');
  if (ti) ti.value = ''; if (d) d.value = ''; if (s) s.value = 'pendente';
  openModal('modal-new-idea');
}

function openEditIdea(id) {
  const i = state.ideas.find(x => x.id === id);
  if (!i) return;
  state.editingIdeaId = id;
  const t = $('modal-idea-title');
  if (t) t.textContent = 'Editar Ideia';
  const ti = $('idea-title'), d = $('idea-desc'), s = $('idea-status');
  if (ti) ti.value = i.title; if (d) d.value = i.desc; if (s) s.value = i.status;
  openModal('modal-new-idea');
}

function saveIdea() {
  const title = (($('idea-title') || {}).value || '').trim();
  const desc = (($('idea-desc') || {}).value || '').trim();
  const status = ($('idea-status') || {}).value || 'pendente';

  if (!title) { showToast('⚠️ Informe o título da ideia'); return; }

  if (state.editingIdeaId) {
    const i = state.ideas.find(x => x.id === state.editingIdeaId);
    if (i) { i.title = title; i.desc = desc; i.status = status; }
  } else {
    state.ideas.push({ id: uid(), title, desc, status });
  }

  save();
  closeModal('modal-new-idea');
  state.editingIdeaId = null;
  renderIdeas();
  renderHomeIdeas();
  showToast('💡 Ideia salva!');
}

function deleteIdea(id) {
  state.ideas = state.ideas.filter(i => i.id !== id);
  save();
  renderIdeas();
  renderHomeIdeas();
  showToast('🗑 Ideia removida');
}

// ─── SECURITY ─────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── SHARE OVERRIDE ───────────────────────────
// Override the modal open for share to build content first
const _origOpenModal = openModal;
window.openModal = function(id) {
  if (id === 'modal-share') {
    openShareModal();
    return;
  }
  if (id === 'modal-close-month') {
    openCloseMonth();
    return;
  }
  _origOpenModal(id);
};

// ─── BOOT ────────────────────────────────────
window.addEventListener('load', function() {
  initLogin();
});
