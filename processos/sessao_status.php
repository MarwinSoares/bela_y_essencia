<?php
define("JSON_RESPONSE", true);

require_once __DIR__ . "/sessao.php";
require_once __DIR__ . "/conexao.php";

header("Content-Type: application/json; charset=utf-8");

iniciarSessao();

function montarFotoPerfilUrl(?string $caminho): ?string
{
    if (!$caminho) {
        return null;
    }

    return "../../" . ltrim(str_replace("\\", "/", $caminho), "/");
}

if (empty($_SESSION["usuario_id"])) {
    echo json_encode([
        "ok" => true,
        "autenticado" => false,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $consulta = $pdo->prepare(
        "SELECT id_usuario, nome, email, telefone, tipo_usuario, foto_perfil
         FROM usuarios
         WHERE id_usuario = :id_usuario
           AND status = 'ativo'
         LIMIT 1"
    );
    $consulta->execute([
        ":id_usuario" => (int) $_SESSION["usuario_id"],
    ]);
    $usuario = $consulta->fetch();

    if (!$usuario) {
        session_unset();
        session_destroy();

        echo json_encode([
            "ok" => true,
            "autenticado" => false,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode([
        "ok" => true,
        "autenticado" => true,
        "usuario" => [
            "id" => (int) $usuario["id_usuario"],
            "nome" => $usuario["nome"],
            "email" => $usuario["email"],
            "telefone" => $usuario["telefone"],
            "tipo" => $usuario["tipo_usuario"],
            "foto_perfil" => $usuario["foto_perfil"],
            "foto_url" => montarFotoPerfilUrl($usuario["foto_perfil"]),
        ],
    ], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "ok" => false,
        "message" => "Não foi possível verificar a sessão agora.",
    ], JSON_UNESCAPED_UNICODE);
}
