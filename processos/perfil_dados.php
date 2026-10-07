<?php
define("JSON_RESPONSE", true);

require_once __DIR__ . "/sessao.php";

function responderJson(int $status, array $dados): void
{
    http_response_code($status);
    header("Content-Type: application/json; charset=utf-8");
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}

function montarFotoPerfilUrl(?string $caminho): ?string
{
    if (!$caminho) {
        return null;
    }

    return "../../" . ltrim(str_replace("\\", "/", $caminho), "/");
}

iniciarSessao();

if (empty($_SESSION["usuario_id"])) {
    responderJson(401, [
        "ok" => false,
        "message" => "Entre na sua conta para ver seus dados.",
        "redirect" => "../belayessencia/html/login.html?erro=sessao",
    ]);
}

require_once __DIR__ . "/conexao.php";

$idUsuario = (int) $_SESSION["usuario_id"];

try {
    $consulta = $pdo->prepare(
        "SELECT id_usuario, nome, email, telefone, localizacao, foto_perfil
         FROM usuarios
         WHERE id_usuario = :id_usuario
           AND status = 'ativo'
         LIMIT 1"
    );
    $consulta->execute([
        ":id_usuario" => $idUsuario,
    ]);
    $usuario = $consulta->fetch();

    if (!$usuario) {
        responderJson(401, [
            "ok" => false,
            "message" => "Sua sessão não está mais válida. Entre novamente.",
            "redirect" => "../belayessencia/html/login.html?erro=sessao",
        ]);
    }

    responderJson(200, [
        "ok" => true,
        "usuario" => [
            "id" => (int) $usuario["id_usuario"],
            "nome" => $usuario["nome"],
            "email" => $usuario["email"],
            "telefone" => $usuario["telefone"],
            "localizacao" => $usuario["localizacao"],
            "foto_perfil" => $usuario["foto_perfil"],
            "foto_url" => montarFotoPerfilUrl($usuario["foto_perfil"]),
        ],
    ]);
} catch (PDOException $e) {
    responderJson(500, [
        "ok" => false,
        "message" => "Não foi possível carregar seus dados agora.",
    ]);
}
