// ===============================
// LOGIN
// ===============================

function login() {
  const senhaInput = document.getElementById("senha");
  const confirmarInput = document.getElementById("confirmarSenha");

  const senha = senhaInput ? senhaInput.value : "";
  const confirmar = confirmarInput ? confirmarInput.value : "";

  const senhaSalva = localStorage.getItem("senha");

  if (!senhaSalva) {
    if (senha === confirmar && senha !== "") {
      localStorage.setItem("senha", senha);
      abrirMenu();
    } else {
      alert("Senhas não conferem");
    }
  } else {
    if (senha === senhaSalva) {
      abrirMenu();
    } else {
      alert("Senha incorreta");
    }
  }
}

// ===============================
// NAVEGAÇÃO SEGURA
// ===============================

function abrirMenu() {
  esconderTodas();

  const menu = document.getElementById("menuScreen");

  if (menu) {
    menu.classList.add("active");
  } else {
    console.error("menuScreen não encontrado");
  }
}

function openScreen(id) {
  esconderTodas();

  const tela = document.getElementById(id);

  if (tela) {
    tela.classList.add("active");
  } else {
    console.error("Tela não encontrada:", id);
  }
}

function voltar() {
  abrirMenu();
}

// ===============================
// CONTROLE DE TELAS
// ===============================

function esconderTodas() {
  const telas = document.querySelectorAll(".screen");

  if (!telas || telas.length === 0) {
    console.warn("Nenhuma tela encontrada com .screen");
    return;
  }

  telas.forEach((el) => {
    el.classList.remove("active");
  });
}

// ===============================
// DEBUG (opcional, ajuda MUITO)
// ===============================

console.log("App carregado com sucesso");