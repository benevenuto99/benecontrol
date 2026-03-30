function login() {
  const senha = document.getElementById("senha").value;
  const confirmar = document.getElementById("confirmarSenha").value;

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

function abrirMenu() {
  esconderTodas();
  document.getElementById("menuScreen").classList.add("active");
}

function openScreen(id) {
  esconderTodas();
  document.getElementById(id).classList.add("active");
}

function voltar() {
  abrirMenu();
}

function esconderTodas() {
  document.querySelectorAll(".screen").forEach(el => {
    el.classList.remove("active");
  });
}