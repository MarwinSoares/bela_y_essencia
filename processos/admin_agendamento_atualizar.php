<?php
define("JSON_RESPONSE", true);

require_once __DIR__ . "/conexao.php";
require_once __DIR__ . "/admin_guard.php";

function validarAdminDataHorario(string $data, string $horario): void
{
    $dataObj = DateTime::createFromFormat("Y-m-d", $data);
    $dataValida = $dataObj && $dataObj->format("Y-m-d") === $data;

    if (!$dataValida) {
        responderAdminJson(422, [
            "ok" => false,
            "message" => "Informe uma data válida.",
        ]);
    }

    if (!preg_match("/^(08|09|10|11|12|13|14|15|16|17|18):00$/", $horario)) {
        responderAdminJson(422, [
            "ok" => false,
            "message" => "Selecione um horário válido.",
        ]);
    }
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responderAdminJson(405, [
        "ok" => false,
        "message" => "Envio inválido.",
    ]);
}

$admin = exigirAdminJson($pdo);
$idAgendamento = filter_var($_POST["id_agendamento"] ?? null, FILTER_VALIDATE_INT);
$acao = trim($_POST["acao"] ?? "");

if (!$idAgendamento || !in_array($acao, ["alterar", "cancelar"], true)) {
    responderAdminJson(422, [
        "ok" => false,
        "message" => "Informe um agendamento válido.",
    ]);
}

$idServico = null;
$data = "";
$horario = "";

if ($acao === "alterar") {
    $idServico = filter_var($_POST["id_servico"] ?? null, FILTER_VALIDATE_INT);
    $data = trim($_POST["data"] ?? "");
    $horario = trim($_POST["horario"] ?? "");

    if (!$idServico || $data === "" || $horario === "") {
        responderAdminJson(422, [
            "ok" => false,
            "message" => "Selecione procedimento, data e horário.",
        ]);
    }

    validarAdminDataHorario($data, $horario);
}

try {
    $pdo->beginTransaction();

    $consulta = $pdo->prepare(
        "SELECT *
         FROM agendamentos
         WHERE id_agendamento = :id_agendamento
         LIMIT 1
         FOR UPDATE"
    );
    $consulta->execute([
        ":id_agendamento" => $idAgendamento,
    ]);
    $agendamento = $consulta->fetch();

    if (!$agendamento) {
        $pdo->rollBack();
        responderAdminJson(404, [
            "ok" => false,
            "message" => "Agendamento não encontrado.",
        ]);
    }

    if ($acao === "cancelar") {
        if ($agendamento["status"] === "concluido") {
            $pdo->rollBack();
            responderAdminJson(409, [
                "ok" => false,
                "message" => "Agendamentos concluídos não podem ser cancelados.",
            ]);
        }

        if ($agendamento["status"] === "cancelado") {
            $pdo->commit();
            responderAdminJson(200, [
                "ok" => true,
                "message" => "Este agendamento já estava cancelado.",
            ]);
        }

        $cancelar = $pdo->prepare(
            "UPDATE agendamentos
             SET status = 'cancelado',
                 observacao = CONCAT(COALESCE(observacao, ''), CASE WHEN observacao IS NULL OR observacao = '' THEN '' ELSE '\n' END, 'Cancelado pela administração.')
             WHERE id_agendamento = :id_agendamento"
        );
        $cancelar->execute([
            ":id_agendamento" => $idAgendamento,
        ]);

        $pdo->commit();

        responderAdminJson(200, [
            "ok" => true,
            "message" => "Agendamento cancelado com sucesso.",
        ]);
    }

    if (in_array($agendamento["status"], ["cancelado", "concluido"], true)) {
        $pdo->rollBack();
        responderAdminJson(409, [
            "ok" => false,
            "message" => "Este agendamento não pode mais ser alterado.",
        ]);
    }

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
        $pdo->rollBack();
        responderAdminJson(422, [
            "ok" => false,
            "message" => "Selecione um procedimento disponível.",
        ]);
    }

    $inicio = DateTime::createFromFormat("H:i", $horario);
    $fim = clone $inicio;
    $fim->modify("+" . (int) $servico["duracao_minutos"] . " minutes");

    $ocupado = $pdo->prepare(
        "SELECT id_agendamento
         FROM agendamentos
         WHERE data_agendamento = :data_agendamento
           AND hora_inicio = :hora_inicio
           AND status <> 'cancelado'
           AND id_agendamento <> :id_agendamento
         LIMIT 1
         FOR UPDATE"
    );
    $ocupado->execute([
        ":data_agendamento" => $data,
        ":hora_inicio" => $inicio->format("H:i:s"),
        ":id_agendamento" => $idAgendamento,
    ]);

    if ($ocupado->fetch()) {
        $pdo->rollBack();
        responderAdminJson(409, [
            "ok" => false,
            "message" => "Este horário já está ocupado. Escolha outro horário.",
        ]);
    }

    $atualizar = $pdo->prepare(
        "UPDATE agendamentos
         SET id_servico = :id_servico,
             data_agendamento = :data_agendamento,
             hora_inicio = :hora_inicio,
             hora_fim = :hora_fim,
             valor = :valor,
             status = 'agendado'
         WHERE id_agendamento = :id_agendamento"
    );
    $atualizar->execute([
        ":id_servico" => (int) $servico["id_servico"],
        ":data_agendamento" => $data,
        ":hora_inicio" => $inicio->format("H:i:s"),
        ":hora_fim" => $fim->format("H:i:s"),
        ":valor" => $servico["valor"],
        ":id_agendamento" => $idAgendamento,
    ]);

    $pdo->commit();

    responderAdminJson(200, [
        "ok" => true,
        "message" => "Agendamento alterado com sucesso.",
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    responderAdminJson(500, [
        "ok" => false,
        "message" => "Não foi possível atualizar o agendamento agora.",
    ]);
}
