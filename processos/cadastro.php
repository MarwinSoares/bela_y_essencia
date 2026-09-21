<?php
require_once __DIR__ . "/conexao.php";

function voltarCadastro(string $codigo): void
{
    header("Location: ../belayessencia/html/cadastro.html?erro=" . urlencode($codigo));
    exit;
}

function irParaLogin(): void
{
    header("Location: ../belayessencia/html/login.html?sucesso=cadastro");
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    voltarCadastro("metodo");
}

$nome = trim($_POST["fullName"] ?? "");
$telefone = trim($_POST["phone"] ?? "");
$email = trim($_POST["email"] ?? "");
$senha = $_POST["password"] ?? "";
$confirmarSenha = $_POST["confirmPassword"] ?? "";
$aceitouTermos = isset($_POST["terms"]);

if ($nome === "" || $telefone === "" || $email === "" || $senha === "" || $confirmarSenha === "") {
    voltarCadastro("campos");
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    voltarCadastro("email");
}

if (strlen($senha) < 6) {
    voltarCadastro("senha_curta");
}

if ($senha !== $confirmarSenha) {
    voltarCadastro("senhas");
}

if (!$aceitouTermos) {
    voltarCadastro("termos");
}

try {
    $consulta = $pdo->prepare("SELECT id_usuario FROM usuarios WHERE email = :email LIMIT 1");
    $consulta->execute([
        ":email" => $email,
    ]);

    if ($consulta->fetch()) {
        voltarCadastro("email_existente");
    }

    $senhaCriptografada = password_hash($senha, PASSWORD_DEFAULT);

    $cadastro = $pdo->prepare(
        "INSERT INTO usuarios (nome, telefone, email, senha)
         VALUES (:nome, :telefone, :email, :senha)"
    );

    $cadastro->execute([
        ":nome" => $nome,
        ":telefone" => $telefone,
        ":email" => $email,
        ":senha" => $senhaCriptografada,
    ]);

    irParaLogin();
} catch (PDOException $e) {
    if ($e->getCode() === "23000") {
        voltarCadastro("email_existente");
    }

    voltarCadastro("banco");
}
