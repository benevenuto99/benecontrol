let saldo = 0;

function login() {
  const senha = document.getElementById("password").value;

  if (!localStorage.getItem("senha")) {
    localStorage.setItem("senha", senha);
  }

  if (senha === localStorage.getItem("senha")) {
    openScreen("home");
  } else {
    alert("Senha incorreta");
  }
}

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

function addTransacao(tipo) {
  const valor = parseFloat(document.getElementById("valor").value);

  if (tipo === "entrada") saldo += valor;
  else saldo -= valor;

  document.getElementById("saldo").innerText = saldo.toFixed(2);
}

function gastoEmpresa() {
  const valor = document.getElementById("gastoEmpresa").value;
  alert("Gasto registrado: R$ " + valor);
}

function addProjeto() {
  const nome = document.getElementById("nomeProjeto").value;
  alert("Projeto salvo: " + nome);
}