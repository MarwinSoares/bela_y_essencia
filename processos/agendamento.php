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

iniciarSessao();

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responderJson(405, [
        "ok" => false,
        "message" => "Envio inválido. Use o formulário de agendamento.",
    ]);
}

if (empty($_SESSION["usuario_id"])) {
    responderJson(401, [
        "ok" => false,
        "message" => "Entre na sua conta para agendar um horário.",
        "redirect" => "../belayessencia/html/login.html?erro=sessao",
    ]);
}

$idUsuario = (int) $_SESSION["usuario_id"];
$idServico = filter_var($_POST["id_servico"] ?? null, FILTER_VALIDATE_INT);
$data = trim($_POST["data"] ?? "");
$horario = trim($_POST["horario"] ?? "");

if (!$idServico || $data === "" || $horario === "") {
    responderJson(422, [
        "ok" => false,
        "message" => "Selecione procedimento, data e horário para continuar.",
    ]);
}

$dataObj = DateTime::createFromFormat("Y-m-d", $data);
$dataValida = $dataObj && $dataObj->format("Y-m-d") === $data;

if (!$dataValida) {
    responderJson(422, [
        "ok" => false,
        "message" => "Informe uma data válida.",
    ]);
}

$hoje = new DateTime("today");
if ($dataObj < $hoje) {
    responderJson(422, [
        "ok" => false,
        "message" => "Escolha uma data a partir de hoje.",
    ]);
}

if (!preg_match("/^(08|09|10|11|12|13|14|15|16|17|18):00$/", $horario)) {
    responderJson(422, [
        "ok" => false,
        "message" => "Selecione um horário válido.",
    ]);
}

require_once __DIR__ . "/conexao.php";

try {
    $servicoConsulta = $pdo->prepare(
        "SELECT id_servico, nome, duracao_minutos, valor
         FROM servicos
         WHERE id_servico = :id_servico
           AND status = 'ativo'
         LIMIT 1"
    );
    $servicoConsulta->execute([
        ":id_servico" => $idServico,
    ]);
    $servico = $servicoConsulta->fetch();

    if (!$servico) {
        responderJson(422, [
            "ok" => false,
            "message" => "Selecione um procedimento disponível.",
        ]);
    }

    $usuarioConsulta = $pdo->prepare(
        "SELECT id_usuario
         FROM usuarios
         WHERE id_usuario = :id_usuario
           AND status = 'ativo'
         LIMIT 1"
    );
    $usuarioConsulta->execute([
        ":id_usuario" => $idUsuario,
    ]);

    if (!$usuarioConsulta->fetch()) {
        responderJson(401, [
            "ok" => false,
            "message" => "Sua sessão não está mais válida. Entre novamente.",
            "redirect" => "../belayessencia/html/login.html?erro=sessao",
        ]);
    }

    $inicio = DateTime::createFromFormat("H:i", $horario);
    $fim = clone $inicio;
    $fim->modify("+" . (int) $servico["duracao_minutos"] . " minutes");

    $pdo->beginTransaction();

    $ocupado = $pdo->prepare(
        "SELECT id_agendamento
         FROM agendamentos
         WHERE data_agendamento = :data_agendamento
           AND hora_inicio = :hora_inicio
           AND status <> 'cancelado'
         LIMIT 1
         FOR UPDATE"
    );
    $ocupado->execute([
        ":data_agendamento" => $data,
        ":hora_inicio" => $inicio->format("H:i:s"),
    ]);

    if ($ocupado->fetch()) {
        $pdo->rollBack();
        responderJson(409, [
            "ok" => false,
            "message" => "Este horário acabou de ser preenchido. Escolha outro horário.",
        ]);
    }

    $cadastro = $pdo->prepare(
        "INSERT INTO agendamentos
            (id_usuario, id_servico, data_agendamento, hora_inicio, hora_fim, valor, status)
         VALUES
            (:id_usuario, :id_servico, :data_agendamento, :hora_inicio, :hora_fim, :valor, 'agendado')"
    );
    $cadastro->execute([
        ":id_usuario" => $idUsuario,
        ":id_servico" => (int) $servico["id_servico"],
        ":data_agendamento" => $data,
        ":hora_inicio" => $inicio->format("H:i:s"),
        ":hora_fim" => $fim->format("H:i:s"),
        ":valor" => $servico["valor"],
    ]);

    $idAgendamento = (int) $pdo->lastInsertId();
    $pdo->commit();

    responderJson(201, [
        "ok" => true,
        "message" => "Agendamento registrado com sucesso.",
        "id" => $idAgendamento,
        "servico" => [
            "id" => (int) $servico["id_servico"],
            "nome" => $servico["nome"],
            "duracao_minutos" => (int) $servico["duracao_minutos"],
            "valor" => (float) $servico["valor"],
        ],
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    responderJson(500, [
        "ok" => false,
        "message" => "Não foi possível salvar seu agendamento agora.",
    ]);
}
