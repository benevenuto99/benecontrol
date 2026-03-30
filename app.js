let saldo = 0;

function login() {
  const senha = document.getElementById("senha").value;
  const confirmar = document.getElementById("confirmarSenha").value;
  const mensagem = document.getElementById("mensagem");

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

  if (senha === localStorage.getItem("senha")) {
    openScreen("home");
  } else {
    mensagem.innerText = "Senha incorreta.";
  }
}

  if (!localStorage.getItem("senha")) {
    localStorage.setItem("senha", senha);
  }

  if (senha === localStorage.getItem("senha")) {
    openScreen("home");
  } else {
    alert("Senha incorreta");

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

textarea {
  min-height: 120px;
  resize: vertical;
}

#codigoHTML {
  min-height: 180px;
  font-family: monospace;
}

.botoes {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 10px;
}

#preview {
  margin-top: 20px;
  border: 1px solid #334155;
  border-radius: 10px;
  overflow: hidden;
}

#preview iframe {
  width: 100%;
  height: 200px;
  background: white;
}