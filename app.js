/* =============================================
   BENECONTROL - app.js v2.0
   Phases 1-7 complete upgrade
   Desenvolvido por BeneApps
============================================= */

'use strict';

// ─── STORAGE KEYS ─────────────────────────────
const KEYS = {
  password:        'bctl_password',
  accounts:        'bctl_accounts',
  transactions:    'bctl_transactions',
  bills:           'bctl_bills',
  currentMonthKey: 'bctl_current_month',
  projects:        'bctl_projects',
  goals:           'bctl_goals',
  ideas:           'bctl_ideas',
  progress:        'bctl_progress',
};

// ─── ACCOUNT DEFINITIONS ─────────────────────
const ACCOUNT_DEFS = [
  { id: 'corrente', name: 'Conta Corrente Itaú', icon: '🏦' },
  { id: 'poupanca', name: 'Poupança Itaú',        icon: '🏧' },
  { id: 'bradesco', name: 'Bradesco',              icon: '🏦' },
  { id: 'sicoob',   name: 'Sicoob',               icon: '🤝' },
  { id: 'cofre',    name: 'Cofre',                icon: '🔐' },
  { id: 'outros',   name: 'Outros',               icon: '💼' },
];

// ─── APP STATE ────────────────────────────────
let state = {
  accounts:             {},
  transactions:         [],
  bills:                {},
  currentMonthKey:      '',
  projects:             [],
  goals:                [],
  ideas:                [],
  progress:             20,
  currentProjectFilter: 'todos',
  currentGoalFilter:    'todos',
  currentIdeaFilter:    'todos',
  currentBillFilter:    'todas',
  pendingBillId:        null,
  editingProjectId:     null,
  editingGoalId:        null,
  editingIdeaId:        null,
  adjustingAccountId:   null,
  previousScreen:       'screen-home',
};

// ─── UTILS ───────────────────────────────────
const $  = id => document.getElementById(id);
const fmt = val => 'R$ ' + Number(val || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const uid = () => '_' + Math.random().toString(36).substr(2, 9);
const monthKey   = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
const monthLabel = key => {
  const [y, m] = key.split('-');
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  return `${months[parseInt(m)-1]} ${y}`;
};
const today  = () => new Date().toISOString().split('T')[0];
const todayD = () => new Date();

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg) {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ─── PHASE 4: OVERDUE DETECTION ──────────────
/**
 * Detects if a bill is overdue based on its due day and current date.
 * A bill is overdue if unpaid AND the due date has passed this month.
 */
function isBillOverdue(bill) {
  if (bill.paid) return false;
  if (!bill.dueDay) return false;
  const now = todayD();
  const [y, m] = state.currentMonthKey.split('-').map(Number);
  const dueDate = new Date(y, m - 1, bill.dueDay);
  return now > dueDate;
}

function getBillPaymentStatus(bill) {
  if (bill.paid) return 'pago';
  if (isBillOverdue(bill)) return 'vencida';
  return 'pendente';
}

// ─── PERSISTENCE ─────────────────────────────
function save() {
  try {
    localStorage.setItem(KEYS.accounts,        JSON.stringify(state.accounts));
    localStorage.setItem(KEYS.transactions,    JSON.stringify(state.transactions));
    localStorage.setItem(KEYS.bills,           JSON.stringify(state.bills));
    localStorage.setItem(KEYS.currentMonthKey, state.currentMonthKey);
    localStorage.setItem(KEYS.projects,        JSON.stringify(state.projects));
    localStorage.setItem(KEYS.goals,           JSON.stringify(state.goals));
    localStorage.setItem(KEYS.ideas,           JSON.stringify(state.ideas));
    localStorage.setItem(KEYS.progress,        state.progress);
  } catch(e) { console.error('Save error:', e); }
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
    if (!state.bills[state.currentMonthKey]) state.bills[state.currentMonthKey] = [];

    const proj = localStorage.getItem(KEYS.projects);
    state.projects = proj ? JSON.parse(proj) : [];

    const goals = localStorage.getItem(KEYS.goals);
    state.goals = goals ? JSON.parse(goals) : [];

    const ideas = localStorage.getItem(KEYS.ideas);
    state.ideas = ideas ? JSON.parse(ideas) : [];

    const prog = localStorage.getItem(KEYS.progress);
    state.progress = prog ? parseInt(prog) : 20;
  } catch(e) { console.error('Load error:', e); }
}

// ─── NAVIGATION (Phase 2: fixed) ─────────────
function hideAllScreens() {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
}

function openScreen(id) {
  const prev = document.querySelector('.screen.active');
  if (prev) state.previousScreen = prev.id;
  hideAllScreens();
  const el = document.getElementById(id);
  if (!el) { console.warn('Screen not found:', id); return; }
  el.style.display = (id === 'screen-login') ? 'flex' : 'block';
  el.classList.add('active');
  // Scroll to top
  el.scrollTop = 0;
  window.scrollTo(0, 0);
  renderScreen(id);
}

function goBack() {
  openScreen(state.previousScreen || 'screen-home');
}

function renderScreen(id) {
  try {
    if      (id === 'screen-home')        renderHome();
    else if (id === 'screen-pessoal')     renderPessoal();
    else if (id === 'screen-contas')      renderContas();
    else if (id === 'screen-projetos')    renderProjects();
    else if (id === 'screen-planejamento') renderPlanning();
    else if (id === 'screen-ideias')      renderIdeas();
  } catch(e) { console.error('Render error in', id, ':', e); }
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
  const stored       = localStorage.getItem(KEYS.password);
  const subtitle     = $('login-subtitle');
  const confirmGroup = $('login-confirm-group');
  const btn          = $('login-btn');

  if (stored) {
    if (subtitle)     subtitle.textContent = 'Entre com sua senha';
    if (confirmGroup) confirmGroup.classList.add('hidden');
    if (btn)          btn.textContent = 'Entrar';
  } else {
    if (subtitle)     subtitle.textContent = 'Crie sua senha de acesso';
    if (confirmGroup) confirmGroup.classList.remove('hidden');
    if (btn)          btn.textContent = 'Criar senha';
  }

  const passInput = $('login-pass');
  if (passInput) {
    // Remove old listeners by replacing element clone trick isn't needed — just add once
    passInput.onkeydown = e => { if (e.key === 'Enter') handleLogin(); };
  }
  const confirmInput = $('login-confirm');
  if (confirmInput) {
    confirmInput.onkeydown = e => { if (e.key === 'Enter') handleLogin(); };
  }
}

function handleLogin() {
  const stored = localStorage.getItem(KEYS.password);
  const pass   = ($('login-pass') || {}).value || '';

  if (!pass) { showToast('⚠️ Digite sua senha'); return; }

  if (stored) {
    if (pass === stored) {
      load();
      const ls = $('screen-login');
      if (ls) { ls.classList.remove('active'); ls.style.display = 'none'; }
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
    const ls = $('screen-login');
    if (ls) { ls.classList.remove('active'); ls.style.display = 'none'; }
    openScreen('screen-home');
  }
}

function doLogout() {
  save();
  hideAllScreens();
  const s = $('screen-login');
  if (s) { s.style.display = 'flex'; s.classList.add('active'); }
  const p = $('login-pass');    if (p) p.value = '';
  const c = $('login-confirm'); if (c) c.value = '';
  initLogin();
}

// ─── PHASE 3: DASHBOARD ──────────────────────
function renderDashboard() {
  const bills = state.bills[state.currentMonthKey] || [];
  const allAccounts = ACCOUNT_DEFS.reduce((sum, a) => sum + (state.accounts[a.id] || 0), 0);

  const totalBills   = bills.reduce((s, b) => s + Number(b.value || 0), 0);
  const paidBills    = bills.filter(b => b.paid).reduce((s, b) => s + Number(b.value || 0), 0);
  const pendingBills = bills.filter(b => !b.paid && !isBillOverdue(b)).reduce((s, b) => s + Number(b.value || 0), 0);
  const overdueBills = bills.filter(b => isBillOverdue(b)).reduce((s, b) => s + Number(b.value || 0), 0);

  const elBalance  = $('dash-total-balance');
  const elPaid     = $('dash-paid');
  const elPending  = $('dash-pending');
  const elOverdue  = $('dash-overdue');

  if (elBalance) elBalance.textContent  = fmt(allAccounts);
  if (elPaid)    elPaid.textContent     = fmt(paidBills);
  if (elPending) elPending.textContent  = fmt(pendingBills);
  if (elOverdue) elOverdue.textContent  = fmt(overdueBills);

  renderUpcomingBills();
}

function renderUpcomingBills() {
  const el = $('upcoming-bills');
  if (!el) return;

  const bills = (state.bills[state.currentMonthKey] || [])
    .filter(b => !b.paid)
    .sort((a, b) => (a.dueDay || 99) - (b.dueDay || 99))
    .slice(0, 5);

  if (!bills.length) {
    el.innerHTML = `<div class="card" style="color:var(--green);font-size:0.85rem;text-align:center;padding:12px">✅ Nenhuma conta pendente!</div>`;
    return;
  }

  const nowDay = todayD().getDate();
  el.innerHTML = bills.map(b => {
    const status = getBillPaymentStatus(b);
    const isOverdue = status === 'vencida';
    const isSoon    = b.dueDay && (b.dueDay - nowDay) <= 3 && (b.dueDay - nowDay) >= 0;
    const dueLabel  = b.dueDay ? `Vence dia ${b.dueDay}` : 'Sem vencimento';
    const cls       = isOverdue ? 'overdue' : isSoon ? 'due-soon' : '';
    const badge     = isOverdue
      ? `<span class="badge badge-red">Vencida</span>`
      : isSoon
        ? `<span class="badge badge-yellow">Vence em breve</span>`
        : `<span class="badge badge-gray">Pendente</span>`;
    return `<div class="upcoming-bill ${cls}">
      <div class="ub-left">
        <div class="ub-name">${esc(b.name)}</div>
        <div class="ub-date">${dueLabel} &nbsp; ${badge}</div>
      </div>
      <div class="ub-right">
        <div class="ub-value">${fmt(b.value)}</div>
        <button class="btn btn-sm btn-success" onclick="requestPayBill('${b.id}')">Pagar</button>
      </div>
    </div>`;
  }).join('');
}

// ─── HOME ─────────────────────────────────────
function renderHome() {
  renderDashboard();
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
    const cls = bal > 0 ? 'positive' : bal < 0 ? 'negative' : 'zero';
    return `<div class="account-card" onclick="openAdjustBalance('${a.id}')">
      <div class="account-icon">${a.icon}</div>
      <div class="account-name">${a.name}</div>
      <div class="account-balance ${cls}">${fmt(bal)}</div>
      <div class="account-tap-hint">Toque para ajustar</div>
    </div>`;
  }).join('');
}

function renderTransactions() {
  const el = $('tx-list');
  if (!el) return;

  const search     = (($('tx-search') || {}).value || '').toLowerCase().trim();
  const typeFilter = ($('tx-filter-type')    || {}).value || 'todos';
  const accFilter  = ($('tx-filter-account') || {}).value || 'todas';

  let txs = state.transactions.slice().reverse();

  if (typeFilter !== 'todos') txs = txs.filter(t => t.type === typeFilter);
  if (accFilter  !== 'todas') txs = txs.filter(t => t.account === accFilter);
  if (search)                 txs = txs.filter(t => (t.desc || '').toLowerCase().includes(search));

  txs = txs.slice(0, 30); // Show last 30 matching

  if (!txs.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-sub">Nenhuma transação encontrada</div></div>`;
    return;
  }

  el.innerHTML = txs.map(tx => {
    const acc  = ACCOUNT_DEFS.find(a => a.id === tx.account);
    const icon = tx.type === 'entrada' ? '💰' : '💸';
    const cat  = tx.category ? ` · ${tx.category}` : '';
    return `<div class="transaction-item">
      <div class="tx-left">
        <div class="tx-icon ${tx.type}">${icon}</div>
        <div class="tx-info">
          <div class="tx-desc">${esc(tx.desc)}</div>
          <div class="tx-meta">${acc ? acc.name : tx.account}${cat} · ${tx.date || ''}</div>
        </div>
      </div>
      <div class="tx-amount ${tx.type}">${tx.type === 'entrada' ? '+' : '-'}${fmt(tx.value)}</div>
    </div>`;
  }).join('');
}

function renderBillsPreview() {
  const el = $('bills-preview-home');
  if (!el) return;
  const bills   = state.bills[state.currentMonthKey] || [];
  const pending = bills.filter(b => !b.paid);
  const overdue = pending.filter(b => isBillOverdue(b));

  if (!pending.length) {
    el.innerHTML = `<div class="card" style="color:var(--green);font-size:0.85rem;text-align:center;padding:12px">✅ Todas as contas pagas!</div>`;
    return;
  }

  const total = pending.reduce((s, b) => s + Number(b.value || 0), 0);
  const overdueTotal = overdue.reduce((s, b) => s + Number(b.value || 0), 0);

  el.innerHTML = `<div class="card" style="padding:14px 16px">
    <div class="flex-between mb-8">
      <span style="font-size:0.85rem;color:var(--text-2)">${pending.length} conta(s) pendente(s)</span>
      <span style="color:var(--yellow);font-weight:800;font-size:0.9rem">${fmt(total)}</span>
    </div>
    ${overdue.length ? `<div class="flex-between"><span style="font-size:0.78rem;color:var(--red)">⚠️ ${overdue.length} vencida(s)</span><span style="font-size:0.78rem;color:var(--red);font-weight:700">${fmt(overdueTotal)}</span></div>` : ''}
  </div>`;
}

// ─── TRANSACTION ACTIONS ─────────────────────
function openAddTransaction(type) {
  const sel = $('tx-type'); if (sel) sel.value = type;
  const dt  = $('tx-date'); if (dt)  dt.value  = today();
  const d   = $('tx-desc'); if (d)   d.value   = '';
  const v   = $('tx-value'); if (v)  v.value   = '';
  const cat = $('tx-category'); if (cat) cat.value = '';
  openModal('modal-transaction');
}

function saveTransaction() {
  const type    = ($('tx-type')     || {}).value || 'saida';
  const desc    = (($('tx-desc')    || {}).value || '').trim();
  const value   = parseFloat(($('tx-value') || {}).value) || 0;
  const account = ($('tx-account')  || {}).value || 'corrente';
  const date    = ($('tx-date')     || {}).value || today();
  const category= ($('tx-category') || {}).value || '';

  if (!desc)  { showToast('⚠️ Informe uma descrição'); return; }
  if (!value || value <= 0) { showToast('⚠️ Informe um valor válido'); return; }

  const tx = { id: uid(), type, desc, value, account, date, category };
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

// ─── ADJUST BALANCE (Phase 2) ────────────────
function openAdjustBalance(accountId) {
  state.adjustingAccountId = accountId;
  const acc  = ACCOUNT_DEFS.find(a => a.id === accountId);
  const name = $('adjust-account-name');
  if (name) name.textContent = acc ? `${acc.icon} ${acc.name} — saldo atual: ${fmt(state.accounts[accountId] || 0)}` : '';
  const inp = $('adjust-balance-val');
  if (inp) inp.value = (state.accounts[accountId] || 0).toFixed(2);
  openModal('modal-adjust-balance');
}

function confirmAdjustBalance() {
  const id  = state.adjustingAccountId;
  const val = parseFloat(($('adjust-balance-val') || {}).value);
  if (!id) return;
  if (isNaN(val)) { showToast('⚠️ Valor inválido'); return; }
  state.accounts[id] = val;
  save();
  closeModal('modal-adjust-balance');
  renderAccountsGrid();
  renderDashboard();
  showToast('✅ Saldo ajustado!');
}

// ─── CONTAS MENSAIS ──────────────────────────
function renderContas() {
  const label = $('current-month-label');
  if (label) label.textContent = monthLabel(state.currentMonthKey);
  renderBillsList();
  renderBillsSummary();
}

function renderBillsList() {
  const el = $('bills-list');
  if (!el) return;

  const allBills = state.bills[state.currentMonthKey] || [];
  const filter   = state.currentBillFilter;

  let bills = allBills;
  if (filter === 'pendente') bills = allBills.filter(b => !b.paid && !isBillOverdue(b));
  else if (filter === 'vencida') bills = allBills.filter(b => isBillOverdue(b));
  else if (filter === 'pago')    bills = allBills.filter(b => b.paid);

  if (!bills.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📄</div><div class="empty-title">Nenhuma conta${filter !== 'todas' ? ' aqui' : ''}</div><div class="empty-sub">Adicione contas com o botão abaixo</div></div>`;
    return;
  }

  // Sort: overdue first, then by due day, paid last
  bills = [...bills].sort((a, b) => {
    if (a.paid && !b.paid) return 1;
    if (!a.paid && b.paid) return -1;
    if (isBillOverdue(a) && !isBillOverdue(b)) return -1;
    if (!isBillOverdue(a) && isBillOverdue(b)) return 1;
    return (a.dueDay || 99) - (b.dueDay || 99);
  });

  el.innerHTML = bills.map(b => {
    const status    = getBillPaymentStatus(b);
    const isOverdue = status === 'vencida';
    const typeBadge = b.billType === 'fixa'
      ? `<span class="badge badge-blue">Fixa</span>`
      : `<span class="badge badge-yellow">Variável</span>`;
    const statusBadge = b.paid
      ? `<span class="badge badge-green">✅ Pago</span>`
      : isOverdue
        ? `<span class="badge badge-red">🚨 Vencida</span>`
        : `<span class="badge badge-gray">⏳ Pendente</span>`;
    const dueTxt = b.dueDay ? `Vence dia ${b.dueDay}` : '';
    const paidTxt = b.paid && b.paymentDate ? `Pago em ${b.paymentDate}` : '';
    const paidFrom = b.paid && b.paidFrom && b.paidFrom !== 'nenhum'
      ? ` · ${ACCOUNT_DEFS.find(a => a.id === b.paidFrom)?.name || b.paidFrom}` : '';

    return `<div class="bill-item${b.paid ? ' paid' : ''}${isOverdue ? ' overdue' : ''}">
      <div class="bill-left">
        <div class="bill-check ${b.paid ? 'checked' : ''}" onclick="requestPayBill('${b.id}')">${b.paid ? '✓' : ''}</div>
        <div style="min-width:0">
          <div class="bill-name">${esc(b.name)}</div>
          <div style="margin-top:3px;display:flex;gap:4px;flex-wrap:wrap">${typeBadge} ${statusBadge}</div>
          ${(dueTxt || paidTxt) ? `<div class="bill-meta">${paidTxt || dueTxt}${paidFrom}</div>` : ''}
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
  const bills   = state.bills[state.currentMonthKey] || [];
  const total   = bills.reduce((s, b) => s + Number(b.value || 0), 0);
  const paid    = bills.filter(b => b.paid).reduce((s, b) => s + Number(b.value || 0), 0);
  const overdue = bills.filter(b => isBillOverdue(b)).reduce((s, b) => s + Number(b.value || 0), 0);
  const pending = total - paid - overdue;

  const tEl   = $('bills-total');     if (tEl)   tEl.textContent   = fmt(total);
  const pEl   = $('bills-paid');      if (pEl)   pEl.textContent   = fmt(paid);
  const pdEl  = $('bills-pending');   if (pdEl)  pdEl.textContent  = fmt(Math.max(0, pending));
  const ovEl  = $('bills-overdue-val'); if (ovEl) ovEl.textContent = fmt(overdue);
}

function filterBills(filter, elBtn) {
  state.currentBillFilter = filter;
  document.querySelectorAll('#screen-contas .status-tab').forEach(t => t.classList.remove('active'));
  if (elBtn) elBtn.classList.add('active');
  renderBillsList();
}

function saveBill() {
  const name     = (($('bill-name')    || {}).value || '').trim();
  const value    = parseFloat(($('bill-value') || {}).value) || 0;
  const billType = ($('bill-type')     || {}).value || 'fixa';
  const dueDay   = parseInt(($('bill-due-day') || {}).value) || null;

  if (!name)  { showToast('⚠️ Informe o nome da conta'); return; }
  if (!value || value <= 0) { showToast('⚠️ Informe um valor válido'); return; }

  const bill = {
    id: uid(), name, value, billType, dueDay,
    paid: false, paidFrom: null, paymentDate: null, amountPaid: null,
  };
  if (!state.bills[state.currentMonthKey]) state.bills[state.currentMonthKey] = [];
  state.bills[state.currentMonthKey].push(bill);

  save();
  closeModal('modal-new-bill');
  const bn = $('bill-name'); if (bn) bn.value = '';
  const bv = $('bill-value'); if (bv) bv.value = '';
  const bd = $('bill-due-day'); if (bd) bd.value = '';
  renderContas();
  showToast('✅ Conta adicionada!');
}

function deleteBill(id) {
  state.bills[state.currentMonthKey] = (state.bills[state.currentMonthKey] || []).filter(b => b.id !== id);
  save();
  renderContas();
  showToast('🗑 Conta removida');
}

// ─── PHASE 4: PAYMENT FLOW ───────────────────
function requestPayBill(id) {
  const bills = state.bills[state.currentMonthKey] || [];
  const bill  = bills.find(b => b.id === id);
  if (!bill) return;

  // Toggle unpay
  if (bill.paid) {
    bill.paid = false; bill.paidFrom = null; bill.paymentDate = null; bill.amountPaid = null;
    // Reverse account deduction
    if (bill.paidFrom && bill.paidFrom !== 'nenhum') {
      state.accounts[bill.paidFrom] = (state.accounts[bill.paidFrom] || 0) + Number(bill.amountPaidVal || bill.value || 0);
    }
    save();
    renderContas();
    renderBillsPreview();
    renderDashboard();
    showToast('↩ Pagamento desfeito');
    return;
  }

  state.pendingBillId = id;

  // Set pay date to today
  const pd = $('pay-date'); if (pd) pd.value = today();

  const variableField = $('modal-pay-variable-val');
  const varInput      = $('pay-variable-val');
  if (bill.billType === 'variavel') {
    if (variableField) variableField.classList.remove('hidden');
    if (varInput) { varInput.value = ''; varInput.placeholder = fmt(bill.value); }
  } else {
    if (variableField) variableField.classList.add('hidden');
  }

  openModal('modal-pay-bill');
}

function confirmPayBill(source) {
  const id   = state.pendingBillId;
  if (!id) return;
  const bills = state.bills[state.currentMonthKey] || [];
  const bill  = bills.find(b => b.id === id);
  if (!bill) { closeModal('modal-pay-bill'); return; }

  let finalValue = bill.value;
  if (bill.billType === 'variavel') {
    const varInput = $('pay-variable-val');
    const v = parseFloat((varInput || {}).value);
    if (v && v > 0) { finalValue = v; bill.value = v; }
  }

  const payDate = ($('pay-date') || {}).value || today();

  // Phase 4: record all payment metadata
  bill.paid        = true;
  bill.paidFrom    = source;
  bill.paymentDate = payDate;
  bill.amountPaid  = finalValue;
  bill.amountPaidVal = finalValue;

  // Deduct from account and create transaction
  if (source !== 'nenhum') {
    state.accounts[source] = (state.accounts[source] || 0) - finalValue;
    state.transactions.push({
      id:      uid(),
      type:    'saida',
      desc:    'Conta: ' + bill.name,
      value:   finalValue,
      account: source,
      date:    payDate,
      category: 'contas',
    });
  }

  save();
  closeModal('modal-pay-bill');
  state.pendingBillId = null;
  renderContas();
  renderBillsPreview();
  renderDashboard();
  showToast('✅ Pagamento registrado!');
}

// ─── CLOSE MONTH ─────────────────────────────
function openCloseMonth() {
  const bills   = state.bills[state.currentMonthKey] || [];
  const pending = bills.filter(b => !b.paid);
  const infoEl  = $('close-month-pending-info');
  const txtEl   = $('close-month-pending-text');
  if (pending.length > 0) {
    if (infoEl) infoEl.style.display = '';
    if (txtEl)  txtEl.textContent = `⚠️ Atenção: ${pending.length} conta(s) ainda pendente(s) (${fmt(pending.reduce((s,b)=>s+Number(b.value||0),0))})`;
  } else {
    if (infoEl) infoEl.style.display = 'none';
  }
  openModal('modal-close-month');
}

function confirmCloseMonth() {
  const currentBills = state.bills[state.currentMonthKey] || [];
  const [y, m]  = state.currentMonthKey.split('-').map(Number);
  const nextDate = new Date(y, m, 1);
  const nextKey  = monthKey(nextDate);

  if (state.bills[nextKey]) {
    showToast('ℹ️ Próximo mês já existe');
    closeModal('modal-close-month');
    return;
  }

  // Copy fixed bills to next month (Phase 4: reset paid status)
  const nextBills = currentBills
    .filter(b => b.billType === 'fixa')
    .map(b => ({
      id: uid(), name: b.name, value: b.value,
      billType: 'fixa', dueDay: b.dueDay,
      paid: false, paidFrom: null, paymentDate: null, amountPaid: null,
    }));

  state.bills[nextKey]    = nextBills;
  state.currentMonthKey   = nextKey;

  save();
  closeModal('modal-close-month');
  renderContas();
  showToast(`✅ Mês encerrado! Bem-vindo a ${monthLabel(state.currentMonthKey)}`);
}

// ─── WHATSAPP SHARE ──────────────────────────
function openShareModal() {
  const bills   = state.bills[state.currentMonthKey] || [];
  const total   = bills.reduce((s, b) => s + Number(b.value || 0), 0);
  const paid    = bills.filter(b => b.paid).reduce((s, b) => s + Number(b.value || 0), 0);
  const pending = total - paid;
  const overdue = bills.filter(b => isBillOverdue(b)).reduce((s, b) => s + Number(b.value || 0), 0);

  let text = `📊 *Resumo Financeiro — ${monthLabel(state.currentMonthKey)}*\n\n`;
  text += `💰 *Total:* ${fmt(total)}\n`;
  text += `✅ *Pago:* ${fmt(paid)}\n`;
  text += `⏳ *Pendente:* ${fmt(pending)}\n`;
  if (overdue > 0) text += `🚨 *Vencidas:* ${fmt(overdue)}\n`;
  text += `\n📋 *Contas:*\n`;
  bills.forEach(b => {
    const status = b.paid ? '✅' : isBillOverdue(b) ? '🚨' : '⏳';
    text += `${status} ${b.name}: ${fmt(b.value)}\n`;
  });
  text += `\n🏦 *Saldos:*\n`;
  ACCOUNT_DEFS.forEach(a => {
    const bal = state.accounts[a.id] || 0;
    if (bal !== 0) text += `${a.icon} ${a.name}: ${fmt(bal)}\n`;
  });
  const allBal = ACCOUNT_DEFS.reduce((s, a) => s + (state.accounts[a.id] || 0), 0);
  text += `\n💼 *Saldo Total: ${fmt(allBal)}*\n`;
  text += `\n_Enviado via BeneControl • BeneApps_`;

  const preview = $('share-preview');
  if (preview) preview.textContent = text;
  openModal('modal-share');
}

function sendWhatsApp() {
  const bills   = state.bills[state.currentMonthKey] || [];
  const total   = bills.reduce((s, b) => s + Number(b.value || 0), 0);
  const paid    = bills.filter(b => b.paid).reduce((s, b) => s + Number(b.value || 0), 0);
  const pending = total - paid;

  let text = `📊 *Resumo — ${monthLabel(state.currentMonthKey)}*\n\n`;
  text += `💰 Total: ${fmt(total)}\n✅ Pago: ${fmt(paid)}\n⏳ Pendente: ${fmt(pending)}\n\n`;
  text += `📋 Contas:\n`;
  bills.forEach(b => {
    const st = b.paid ? '✅' : isBillOverdue(b) ? '🚨' : '⏳';
    text += `${st} ${b.name}: ${fmt(b.value)}\n`;
  });
  text += `\n_BeneControl by BeneApps_`;
  window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
}

// ─── PROJECTS (Phase 5: added notes) ─────────
function renderProjects() {
  const filter = state.currentProjectFilter;
  const el     = $('projects-list');
  if (!el) return;

  const search = (($('proj-search') || {}).value || '').toLowerCase().trim();
  let list = state.projects;
  if (filter !== 'todos') list = list.filter(p => p.status === filter);
  if (search)             list = list.filter(p => (p.title + ' ' + p.desc).toLowerCase().includes(search));

  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🚀</div><div class="empty-title">Nenhum projeto${filter !== 'todos' ? ' aqui' : ''}</div><div class="empty-sub">Crie um novo projeto abaixo</div></div>`;
    return;
  }

  const statusMap = {
    planejamento: ['badge-blue',   '🗂️ Planejamento'],
    andamento:    ['badge-yellow', '🚀 Em Andamento'],
    concluido:    ['badge-green',  '✅ Concluído'],
    pausado:      ['badge-gray',   '⏸️ Pausado'],
  };

  el.innerHTML = list.map(p => {
    const [cls, lbl] = statusMap[p.status] || ['badge-gray', p.status];
    return `<div class="card">
      <div class="card-header">
        <div style="flex:1;min-width:0">
          <div class="card-title">${esc(p.title)}</div>
          <div class="mt-8"><span class="badge ${cls}">${lbl}</span></div>
        </div>
        <div class="card-actions">
          <button class="btn btn-icon btn-secondary" onclick="openEditProject('${p.id}')">✏️</button>
          <button class="btn btn-icon btn-danger" onclick="deleteProject('${p.id}')">🗑</button>
        </div>
      </div>
      ${p.desc  ? `<div class="card-body">${esc(p.desc)}</div>` : ''}
      ${p.notes ? `<div class="card-notes">📝 ${esc(p.notes)}</div>` : ''}
    </div>`;
  }).join('');
}

function filterProjects(filter, el) {
  state.currentProjectFilter = filter;
  document.querySelectorAll('#proj-tabs .status-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  renderProjects();
}

function openAddProject() {
  state.editingProjectId = null;
  const t = $('modal-project-title'); if (t) t.textContent = 'Novo Projeto';
  const ti = $('proj-title'), d = $('proj-desc'), s = $('proj-status'), n = $('proj-notes');
  if (ti) ti.value = ''; if (d) d.value = ''; if (s) s.value = 'planejamento'; if (n) n.value = '';
  openModal('modal-new-project');
}

function openEditProject(id) {
  const p = state.projects.find(x => x.id === id);
  if (!p) return;
  state.editingProjectId = id;
  const t = $('modal-project-title'); if (t) t.textContent = 'Editar Projeto';
  const ti = $('proj-title'), d = $('proj-desc'), s = $('proj-status'), n = $('proj-notes');
  if (ti) ti.value = p.title; if (d) d.value = p.desc || ''; if (s) s.value = p.status; if (n) n.value = p.notes || '';
  openModal('modal-new-project');
}

function saveProject() {
  const title  = (($('proj-title')  || {}).value || '').trim();
  const desc   = (($('proj-desc')   || {}).value || '').trim();
  const status = ($('proj-status')  || {}).value || 'planejamento';
  const notes  = (($('proj-notes')  || {}).value || '').trim();

  if (!title) { showToast('⚠️ Informe o título do projeto'); return; }

  if (state.editingProjectId) {
    const p = state.projects.find(x => x.id === state.editingProjectId);
    if (p) { p.title = title; p.desc = desc; p.status = status; p.notes = notes; }
    showToast('✏️ Projeto atualizado');
  } else {
    state.projects.push({ id: uid(), title, desc, status, notes });
    showToast('✅ Projeto criado!');
  }

  save();
  closeModal('modal-new-project');
  state.editingProjectId = null;
  renderProjects();
}

function deleteProject(id) {
  state.projects = state.projects.filter(p => p.id !== id);
  save(); renderProjects(); showToast('🗑 Projeto removido');
}

// ─── PLANNING / GOALS ────────────────────────
function renderPlanning() {
  const filter = state.currentGoalFilter;
  const el     = $('goals-list');
  if (!el) return;

  const search = (($('goal-search') || {}).value || '').toLowerCase().trim();
  let list = state.goals;
  if (filter !== 'todos') list = list.filter(g => g.cat === filter);
  if (search)             list = list.filter(g => (g.title + ' ' + g.desc).toLowerCase().includes(search));

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
        <div style="flex:1;min-width:0">
          <div class="card-title">${icon} ${esc(g.title)}</div>
          <div class="mt-8"><span class="badge ${cls}">${lbl}</span></div>
        </div>
        <div class="card-actions">
          <button class="btn btn-icon btn-secondary" onclick="openEditGoal('${g.id}')">✏️</button>
          <button class="btn btn-icon btn-danger"    onclick="deleteGoal('${g.id}')">🗑</button>
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
  renderPlanning();
}

function openAddGoal() {
  state.editingGoalId = null;
  const t = $('modal-goal-title'); if (t) t.textContent = 'Nova Meta';
  const ti = $('goal-title'), d = $('goal-desc'), s = $('goal-status'), c = $('goal-cat');
  if (ti) ti.value = ''; if (d) d.value = ''; if (s) s.value = 'pendente'; if (c) c.value = 'financeiro';
  openModal('modal-new-goal');
}

function openEditGoal(id) {
  const g = state.goals.find(x => x.id === id);
  if (!g) return;
  state.editingGoalId = id;
  const t = $('modal-goal-title'); if (t) t.textContent = 'Editar Meta';
  const ti = $('goal-title'), d = $('goal-desc'), s = $('goal-status'), c = $('goal-cat');
  if (ti) ti.value = g.title; if (d) d.value = g.desc || ''; if (s) s.value = g.status; if (c) c.value = g.cat;
  openModal('modal-new-goal');
}

function saveGoal() {
  const title  = (($('goal-title')  || {}).value || '').trim();
  const desc   = (($('goal-desc')   || {}).value || '').trim();
  const status = ($('goal-status')  || {}).value || 'pendente';
  const cat    = ($('goal-cat')     || {}).value || 'financeiro';

  if (!title) { showToast('⚠️ Informe o título da meta'); return; }

  if (state.editingGoalId) {
    const g = state.goals.find(x => x.id === state.editingGoalId);
    if (g) { g.title = title; g.desc = desc; g.status = status; g.cat = cat; }
  } else {
    state.goals.push({ id: uid(), title, desc, status, cat });
  }

  save(); closeModal('modal-new-goal'); state.editingGoalId = null; renderPlanning();
  showToast('✅ Meta salva!');
}

function deleteGoal(id) {
  state.goals = state.goals.filter(g => g.id !== id);
  save(); renderPlanning(); showToast('🗑 Meta removida');
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
      <div style="flex:1;min-width:0">
        <div class="card-title">${esc(i.title)}</div>
        <div class="mt-8"><span class="badge ${cls}">${lbl}</span></div>
      </div>
      ${!compact ? `<div class="card-actions">
        <button class="btn btn-icon btn-secondary" onclick="openEditIdea('${i.id}')">✏️</button>
        <button class="btn btn-icon btn-danger"    onclick="deleteIdea('${i.id}')">🗑</button>
      </div>` : ''}
    </div>
    ${i.desc ? `<div class="card-body">${esc(i.desc)}</div>` : ''}
  </div>`;
}

function renderIdeas() {
  const filter = state.currentIdeaFilter;
  const el     = $('ideas-list');
  if (!el) return;

  const search = (($('idea-search') || {}).value || '').toLowerCase().trim();
  let list = state.ideas;
  if (filter !== 'todos') list = list.filter(i => i.status === filter);
  if (search)             list = list.filter(i => (i.title + ' ' + i.desc).toLowerCase().includes(search));

  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">💡</div><div class="empty-title">Nenhuma ideia${filter !== 'todos' ? ' aqui' : ''}</div><div class="empty-sub">Registre suas ideias abaixo</div></div>`;
    return;
  }
  el.innerHTML = list.slice().reverse().map(i => ideaCardHTML(i, false)).join('');
}

function filterIdeas(filter, el) {
  state.currentIdeaFilter = filter;
  document.querySelectorAll('#screen-ideias .status-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  renderIdeas();
}

function openAddIdea() {
  state.editingIdeaId = null;
  const t = $('modal-idea-title'); if (t) t.textContent = 'Nova Ideia';
  const ti = $('idea-title'), d = $('idea-desc'), s = $('idea-status');
  if (ti) ti.value = ''; if (d) d.value = ''; if (s) s.value = 'pendente';
  openModal('modal-new-idea');
}

function openEditIdea(id) {
  const i = state.ideas.find(x => x.id === id);
  if (!i) return;
  state.editingIdeaId = id;
  const t = $('modal-idea-title'); if (t) t.textContent = 'Editar Ideia';
  const ti = $('idea-title'), d = $('idea-desc'), s = $('idea-status');
  if (ti) ti.value = i.title; if (d) d.value = i.desc || ''; if (s) s.value = i.status;
  openModal('modal-new-idea');
}

function saveIdea() {
  const title  = (($('idea-title')  || {}).value || '').trim();
  const desc   = (($('idea-desc')   || {}).value || '').trim();
  const status = ($('idea-status')  || {}).value || 'pendente';

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
  save(); renderIdeas(); renderHomeIdeas(); showToast('🗑 Ideia removida');
}

// ─── BOOT ────────────────────────────────────
window.addEventListener('load', function() {
  initLogin();
});
