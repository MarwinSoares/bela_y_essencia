<?php
require_once __DIR__ . "/conexao.php";

function voltarCadastro(string $status, string $codigo): void
{
    header("Location: ../belayessencia/html/cadastro.html?$status=$codigo");
    exit;
}

function irParaLoginComSucesso(): void
{
    header("Location: ../belayessencia/html/login.html?sucesso=cadastro");
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    voltarCadastro("erro", "metodo");
}

$nome = trim($_POST["fullName"] ?? "");
$telefone = trim($_POST["phone"] ?? "");
$email = trim($_POST["email"] ?? "");
$senha = $_POST["password"] ?? "";
$confirmarSenha = $_POST["confirmPassword"] ?? "";
$aceitouTermos = isset($_POST["terms"]);

if ($nome === "" || $telefone === "" || $email === "" || $senha === "" || $confirmarSenha === "") {
    voltarCadastro("erro", "campos");
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    voltarCadastro("erro", "email");
}

if (strlen($senha) < 6) {
    voltarCadastro("erro", "senha_curta");
}

if ($senha !== $confirmarSenha) {
    voltarCadastro("erro", "senhas");
}

if (!$aceitouTermos) {
    voltarCadastro("erro", "termos");
}

try {
    $consulta = $pdo->prepare("SELECT id_usuario FROM usuarios WHERE email = :email LIMIT 1");
    $consulta->execute([":email" => $email]);

    if ($consulta->fetch()) {
        voltarCadastro("erro", "email_existente");
    }

    $senhaHash = password_hash($senha, PASSWORD_DEFAULT);

    $cadastro = $pdo->prepare(
        "INSERT INTO usuarios (nome, telefone, email, senha)
         VALUES (:nome, :telefone, :email, :senha)"
    );

    $cadastro->execute([
        ":nome" => $nome,
        ":telefone" => $telefone,
        ":email" => $email,
        ":senha" => $senhaHash,
    ]);

    irParaLoginComSucesso();
} catch (PDOException $e) {
    if ($e->getCode() === "23000") {
        voltarCadastro("erro", "email_existente");
    }

    voltarCadastro("erro", "banco");
}
