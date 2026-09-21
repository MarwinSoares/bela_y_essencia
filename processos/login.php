<?php
require_once __DIR__ . "/conexao.php";

function voltarLogin(string $status, string $codigo): void
{
    header("Location: ../belayessencia/html/login.html?$status=$codigo");
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    voltarLogin("erro", "metodo");
}

$email = trim($_POST["email"] ?? "");
$senha = $_POST["password"] ?? "";

if ($email === "" || $senha === "") {
    voltarLogin("erro", "campos");
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    voltarLogin("erro", "email");
}

try {
    $consulta = $pdo->prepare(
        "SELECT id_usuario, nome, email, senha, tipo_usuario, status
         FROM usuarios
         WHERE email = :email
         LIMIT 1"
    );
    $consulta->execute([":email" => $email]);
    $usuario = $consulta->fetch();

    if (!$usuario || !password_verify($senha, $usuario["senha"])) {
        voltarLogin("erro", "credenciais");
    }

    if ($usuario["status"] !== "ativo") {
        voltarLogin("erro", "inativo");
    }

    session_start();
    session_regenerate_id(true);

    $_SESSION["usuario_id"] = $usuario["id_usuario"];
    $_SESSION["usuario_nome"] = $usuario["nome"];
    $_SESSION["usuario_email"] = $usuario["email"];
    $_SESSION["usuario_tipo"] = $usuario["tipo_usuario"];

    header("Location: ../belayessencia/html/index.html?login=sucesso");
    exit;
} catch (PDOException $e) {
    voltarLogin("erro", "banco");
}
