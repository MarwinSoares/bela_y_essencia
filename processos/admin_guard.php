<?php
require_once __DIR__ . "/sessao.php";

function responderAdminJson(int $status, array $dados): void
{
    http_response_code($status);
    header("Content-Type: application/json; charset=utf-8");
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}

function exigirAdminJson(PDO $pdo): array
{
    iniciarSessao();

    if (empty($_SESSION["usuario_id"])) {
        responderAdminJson(401, [
            "ok" => false,
            "message" => "Entre como administradora para continuar.",
            "redirect" => "../belayessencia/html/admin-login.html?erro=sessao",
        ]);
    }

    $consulta = $pdo->prepare(
        "SELECT id_usuario, nome, email, telefone, tipo_usuario, status
         FROM usuarios
         WHERE id_usuario = :id_usuario
         LIMIT 1"
    );
    $consulta->execute([
        ":id_usuario" => (int) $_SESSION["usuario_id"],
    ]);
    $usuario = $consulta->fetch();

    if (!$usuario || $usuario["status"] !== "ativo" || $usuario["tipo_usuario"] !== "admin") {
        responderAdminJson(403, [
            "ok" => false,
            "message" => "Acesso permitido apenas para administradores.",
            "redirect" => "../belayessencia/html/admin-login.html?erro=permissao",
        ]);
    }

    return $usuario;
}
