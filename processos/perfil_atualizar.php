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

function validarUploadFoto(array $arquivo, int $idUsuario): ?string
{
    if (($arquivo["error"] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if (($arquivo["error"] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        responderJson(422, [
            "ok" => false,
            "message" => "Não foi possível receber a foto enviada.",
        ]);
    }

    if (($arquivo["size"] ?? 0) > 2 * 1024 * 1024) {
        responderJson(422, [
            "ok" => false,
            "message" => "Envie uma foto com até 2 MB.",
        ]);
    }

    $tmp = $arquivo["tmp_name"] ?? "";

    if ($tmp === "" || !is_uploaded_file($tmp)) {
        responderJson(422, [
            "ok" => false,
            "message" => "Foto inválida. Envie uma imagem JPG, PNG ou WEBP.",
        ]);
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($tmp);
    $extensoes = [
        "image/jpeg" => "jpg",
        "image/png" => "png",
        "image/webp" => "webp",
    ];

    if (!isset($extensoes[$mime])) {
        responderJson(422, [
            "ok" => false,
            "message" => "Use uma imagem JPG, PNG ou WEBP.",
        ]);
    }

    $diretorio = dirname(__DIR__) . DIRECTORY_SEPARATOR . "uploads" . DIRECTORY_SEPARATOR . "perfis";

    if (!is_dir($diretorio) && !mkdir($diretorio, 0775, true)) {
        responderJson(500, [
            "ok" => false,
            "message" => "Não foi possível preparar o envio da foto.",
        ]);
    }

    $nomeArquivo = "perfil_" . $idUsuario . "_" . bin2hex(random_bytes(8)) . "." . $extensoes[$mime];
    $destino = $diretorio . DIRECTORY_SEPARATOR . $nomeArquivo;

    if (!move_uploaded_file($tmp, $destino)) {
        responderJson(500, [
            "ok" => false,
            "message" => "Não foi possível salvar a foto.",
        ]);
    }

    return "uploads/perfis/" . $nomeArquivo;
}

iniciarSessao();

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responderJson(405, [
        "ok" => false,
        "message" => "Envio inválido.",
    ]);
}

if (empty($_SESSION["usuario_id"])) {
    responderJson(401, [
        "ok" => false,
        "message" => "Entre na sua conta para atualizar seus dados.",
        "redirect" => "../belayessencia/html/login.html?erro=sessao",
    ]);
}

$idUsuario = (int) $_SESSION["usuario_id"];
$nome = trim($_POST["nome"] ?? "");
$telefone = trim($_POST["telefone"] ?? "");
$localizacao = trim($_POST["localizacao"] ?? "");

if ($nome === "" || strlen($nome) > 150) {
    responderJson(422, [
        "ok" => false,
        "message" => "Informe seu nome com até 150 caracteres.",
    ]);
}

if ($telefone === "" || strlen($telefone) > 20) {
    responderJson(422, [
        "ok" => false,
        "message" => "Informe seu telefone com até 20 caracteres.",
    ]);
}

if (strlen($localizacao) > 255) {
    responderJson(422, [
        "ok" => false,
        "message" => "Informe uma localização com até 255 caracteres.",
    ]);
}

require_once __DIR__ . "/conexao.php";

try {
    $fotoPerfil = validarUploadFoto($_FILES["foto_perfil"] ?? [], $idUsuario);

    $atualizar = $pdo->prepare(
        "UPDATE usuarios
         SET nome = :nome,
             telefone = :telefone,
             localizacao = :localizacao,
             foto_perfil = COALESCE(:foto_perfil, foto_perfil)
         WHERE id_usuario = :id_usuario
           AND status = 'ativo'"
    );
    $atualizar->execute([
        ":nome" => $nome,
        ":telefone" => $telefone,
        ":localizacao" => $localizacao !== "" ? $localizacao : null,
        ":foto_perfil" => $fotoPerfil,
        ":id_usuario" => $idUsuario,
    ]);

    $_SESSION["usuario_nome"] = $nome;

    $consulta = $pdo->prepare(
        "SELECT id_usuario, nome, email, telefone, localizacao, foto_perfil
         FROM usuarios
         WHERE id_usuario = :id_usuario
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
        "message" => "Dados atualizados com sucesso.",
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
} catch (Throwable $e) {
    responderJson(500, [
        "ok" => false,
        "message" => "Não foi possível atualizar seus dados agora.",
    ]);
}
