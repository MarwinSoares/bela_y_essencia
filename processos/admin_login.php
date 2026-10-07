<?php
require_once __DIR__ . "/conexao.php";
require_once __DIR__ . "/sessao.php";

function voltarAdminLogin(string $codigo): void
{
    header("Location: ../belayessencia/html/admin-login.html?erro=" . urlencode($codigo));
    exit;
}

function garantirAdminPadrao(PDO $pdo): void
{
    $consulta = $pdo->prepare("SELECT id_usuario FROM usuarios WHERE email = :email LIMIT 1");
    $consulta->execute([
        ":email" => "admin@belayessencia.com",
    ]);

    if ($consulta->fetch()) {
        return;
    }

    $cadastro = $pdo->prepare(
        "INSERT INTO usuarios (nome, telefone, email, senha, tipo_usuario, status)
         VALUES (:nome, :telefone, :email, :senha, 'admin', 'ativo')"
    );
    $cadastro->execute([
        ":nome" => "Administrador Bela Y Essencia",
        ":telefone" => "(11) 00000-0000",
        ":email" => "admin@belayessencia.com",
        ":senha" => '$2y$10$bvIdH1TDPLZ3lE0XqMojLeCSRgVPnd.W4d7gZ5t224l7tjoy6DmOa',
    ]);
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    voltarAdminLogin("metodo");
}

$email = trim($_POST["email"] ?? "");
$senha = $_POST["password"] ?? "";

if ($email === "" || $senha === "") {
    voltarAdminLogin("campos");
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    voltarAdminLogin("email");
}

try {
    garantirAdminPadrao($pdo);

    $consulta = $pdo->prepare(
        "SELECT id_usuario, nome, email, senha, tipo_usuario, status
         FROM usuarios
         WHERE email = :email
         LIMIT 1"
    );
    $consulta->execute([":email" => $email]);
    $usuario = $consulta->fetch();

    if (!$usuario || !password_verify($senha, $usuario["senha"])) {
        voltarAdminLogin("credenciais");
    }

    if ($usuario["status"] !== "ativo") {
        voltarAdminLogin("inativo");
    }

    if ($usuario["tipo_usuario"] !== "admin") {
        voltarAdminLogin("permissao");
    }

    iniciarSessao();
    session_regenerate_id(true);

    $_SESSION["usuario_id"] = $usuario["id_usuario"];
    $_SESSION["usuario_nome"] = $usuario["nome"];
    $_SESSION["usuario_email"] = $usuario["email"];
    $_SESSION["usuario_tipo"] = $usuario["tipo_usuario"];

    header("Location: ../belayessencia/html/admin-agendamentos.html?login=sucesso");
    exit;
} catch (PDOException $e) {
    voltarAdminLogin("banco");
}
