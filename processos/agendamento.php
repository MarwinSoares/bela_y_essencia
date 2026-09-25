<?php
define("JSON_RESPONSE", true);

function responderJson(int $status, array $dados): void
{
    http_response_code($status);
    header("Content-Type: application/json; charset=utf-8");
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}

function prepararTabelaSolicitacoes(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS solicitacoes_agendamento (
            id_solicitacao INT AUTO_INCREMENT PRIMARY KEY,
            nome VARCHAR(150) NOT NULL,
            whatsapp VARCHAR(20) NOT NULL,
            procedimento VARCHAR(100) NOT NULL,
            data_agendamento DATE NOT NULL,
            horario TIME NOT NULL,
            status ENUM('pendente', 'confirmado', 'cancelado') NOT NULL DEFAULT 'pendente',
            data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_solicitacoes_data_horario (data_agendamento, horario),
            INDEX idx_solicitacoes_status (status)
        )"
    );
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responderJson(405, [
        "ok" => false,
        "message" => "Envio inválido. Use o formulário de agendamento.",
    ]);
}

$nome = trim($_POST["nome"] ?? "");
$whatsapp = trim($_POST["whatsapp"] ?? "");
$procedimento = trim($_POST["procedimento"] ?? "");
$data = trim($_POST["data"] ?? "");
$horario = trim($_POST["horario"] ?? "");

if ($nome === "" || $whatsapp === "" || $procedimento === "" || $data === "" || $horario === "") {
    responderJson(422, [
        "ok" => false,
        "message" => "Preencha todos os campos do agendamento.",
    ]);
}

$procedimentosPermitidos = [
    "Botox",
    "Preenchedores",
    "Bioestimuladores",
    "Peeling",
    "Microagulhamento",
    "Limpeza de pele",
    "Tratamento capilar",
    "Enzimas",
    "Drenagem",
    "Massagem",
];

if (!in_array($procedimento, $procedimentosPermitidos, true)) {
    responderJson(422, [
        "ok" => false,
        "message" => "Selecione um procedimento válido.",
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

$whatsappDigitos = preg_replace("/\D+/", "", $whatsapp);
if (strlen($whatsappDigitos) < 10 || strlen($whatsappDigitos) > 11) {
    responderJson(422, [
        "ok" => false,
        "message" => "Informe um WhatsApp válido com DDD.",
    ]);
}

require_once __DIR__ . "/conexao.php";

try {
    prepararTabelaSolicitacoes($pdo);

    $duplicado = $pdo->prepare(
        "SELECT id_solicitacao
         FROM solicitacoes_agendamento
         WHERE whatsapp = :whatsapp
           AND data_agendamento = :data_agendamento
           AND horario = :horario
           AND status = 'pendente'
         LIMIT 1"
    );
    $duplicado->execute([
        ":whatsapp" => $whatsapp,
        ":data_agendamento" => $data,
        ":horario" => $horario . ":00",
    ]);

    if ($duplicado->fetch()) {
        responderJson(409, [
            "ok" => false,
            "message" => "Já existe uma solicitação pendente para este WhatsApp nesse dia e horário.",
        ]);
    }

    $cadastro = $pdo->prepare(
        "INSERT INTO solicitacoes_agendamento
            (nome, whatsapp, procedimento, data_agendamento, horario)
         VALUES
            (:nome, :whatsapp, :procedimento, :data_agendamento, :horario)"
    );
    $cadastro->execute([
        ":nome" => $nome,
        ":whatsapp" => $whatsapp,
        ":procedimento" => $procedimento,
        ":data_agendamento" => $data,
        ":horario" => $horario . ":00",
    ]);

    responderJson(201, [
        "ok" => true,
        "message" => "Solicitação de agendamento recebida com sucesso.",
        "id" => (int) $pdo->lastInsertId(),
    ]);
} catch (PDOException $e) {
    if ($e->getCode() === "42S02") {
        responderJson(500, [
            "ok" => false,
            "message" => "A tabela de solicitações de agendamento ainda não foi criada no banco.",
        ]);
    }

    responderJson(500, [
        "ok" => false,
        "message" => "Não foi possível salvar sua solicitação agora.",
    ]);
}
