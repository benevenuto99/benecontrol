// =======================
// LOGIN
// =======================
function login() {
  const senha = document.getElementById("senha").value;
  const confirmar = document.getElementById("confirmarSenha").value;
  const mensagem = document.getElementById("mensagem");

  // Primeira vez (criar senha)
  if (!localStorage.getItem("senha")) {
    if (!senha || !confirmar) {
      mensagem.innerText = "Preencha os dois campos.";
      return;
    }

    if (senha !== confirmar) {
      mensagem.innerText = "As senhas não coincidem.";
      return;
    }

    localStorage.setItem("senha", senha);
    mensagem.innerText = "Senha criada com sucesso!";
    return;
  }

  // Login normal
  if (senha === localStorage.getItem("senha")) {
    openScreen("home");
  } else {
    mensagem.innerText = "Senha incorreta.";
  }
}

// =======================
// NAVEGAÇÃO
// =======================
function openScreen(nome) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));

  if (nome === "home") document.getElementById("home-screen").classList.add("active");
  if (nome === "felipe") document.getElementById("felipe-screen").classList.add("active");
  if (nome === "beneapps") document.getElementById("beneapps-screen").classList.add("active");
  if (nome === "projetos") document.getElementById("projetos-screen").classList.add("active");
}

function goHome() {
  openScreen("home");
}

// =======================
// FINANCEIRO
// =======================
let saldo = 0;

function addTransacao(tipo) {
  const valor = parseFloat(document.getElementById("valor").value);

  if (!valor) return;

  if (tipo === "entrada") saldo += valor;
  else saldo -= valor;

  document.getElementById("saldo").innerText = saldo.toFixed(2);
}

// =======================
// BENEAPPS
// =======================
function gastoEmpresa() {
  const valor = document.getElementById("gastoEmpresa").value;
  alert("Gasto registrado: R$ " + valor);
}

// =======================
// PROJETOS
// =======================
function addProjeto() {
  const nome = document.getElementById("nomeProjeto").value;
  alert("Projeto salvo: " + nome);
}

function copiarCodigo() {
  const codigo = document.getElementById("codigoHTML").value;

  navigator.clipboard.writeText(codigo).then(() => {
    alert("Código copiado!");
  });
}

function limparCodigo() {
  document.getElementById("codigoHTML").value = "";
}

function executarHTML() {
  const codigo = document.getElementById("codigoHTML").value;
  const iframe = document.getElementById("previewFrame");

  iframe.srcdoc = codigo;
}