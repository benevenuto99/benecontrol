function login() {
    const senha = document.getElementById("senha").value;
    const confirmar = document.getElementById("confirmarSenha").value;

    if (!localStorage.getItem("senha")) {
        if (senha === confirmar && senha !== "") {
            localStorage.setItem("senha", senha);
            abrirMenu();
        } else {
            alert("Senhas não conferem");
        }
    } else {
        if (senha === localStorage.getItem("senha")) {
            abrirMenu();
        } else {
            alert("Senha incorreta");
        }
    }
}

function abrirMenu() {
    esconderTodas();
    const menu = document.getElementById("menuScreen");
    if (menu) menu.classList.add("active");
}

function openScreen(id) {
    esconderTodas();

    const tela = document.getElementById(id);

    if (!tela) {
        console.error("Tela não encontrada:", id);
        alert("Erro: tela não encontrada -> " + id);
        return;
    }

    tela.classList.add("active");
}

function voltar() {
    abrirMenu();
}

function esconderTodas() {
    document.querySelectorAll(".screen").forEach(el => {
        el.classList.remove("active");
    });
}