<?php
define("JSON_RESPONSE", true);

require_once __DIR__ . "/conexao.php";
require_once __DIR__ . "/admin_guard.php";

try {
    $admin = exigirAdminJson($pdo);

    $servicos = $pdo
        ->query(
            "SELECT id_servico, nome, descricao, duracao_minutos, valor
             FROM servicos
             WHERE status = 'ativo'
             ORDER BY nome"
        )
        ->fetchAll();

    $agendamentos = $pdo
        ->query(
            "SELECT
                a.id_agendamento,
                a.id_usuario,
                a.id_servico,
                a.data_agendamento,
                DATE_FORMAT(a.hora_inicio, '%H:%i') AS hora_inicio,
                DATE_FORMAT(a.hora_fim, '%H:%i') AS hora_fim,
                a.valor,
                a.status,
                a.observacao,
                a.data_criacao,
                s.nome AS servico_nome,
                s.duracao_minutos,
                u.nome AS usuario_nome,
                u.email AS usuario_email,
                u.telefone AS usuario_telefone,
                u.localizacao AS usuario_localizacao
             FROM agendamentos a
             INNER JOIN servicos s ON s.id_servico = a.id_servico
             INNER JOIN usuarios u ON u.id_usuario = a.id_usuario
             ORDER BY
                a.data_agendamento DESC,
                a.hora_inicio DESC"
        )
        ->fetchAll();

    responderAdminJson(200, [
        "ok" => true,
        "admin" => [
            "id" => (int) $admin["id_usuario"],
            "nome" => $admin["nome"],
            "email" => $admin["email"],
        ],
        "servicos" => array_map(static function (array $servico): array {
            return [
                "id" => (int) $servico["id_servico"],
                "nome" => $servico["nome"],
                "descricao" => $servico["descricao"],
                "duracao_minutos" => (int) $servico["duracao_minutos"],
                "valor" => (float) $servico["valor"],
            ];
        }, $servicos),
        "agendamentos" => array_map(static function (array $agendamento): array {
            return [
                "id" => (int) $agendamento["id_agendamento"],
                "id_usuario" => (int) $agendamento["id_usuario"],
                "id_servico" => (int) $agendamento["id_servico"],
                "servico_nome" => $agendamento["servico_nome"],
                "duracao_minutos" => (int) $agendamento["duracao_minutos"],
                "data" => $agendamento["data_agendamento"],
                "hora_inicio" => $agendamento["hora_inicio"],
                "hora_fim" => $agendamento["hora_fim"],
                "valor" => (float) $agendamento["valor"],
                "status" => $agendamento["status"],
                "observacao" => $agendamento["observacao"],
                "data_criacao" => $agendamento["data_criacao"],
                "cliente" => [
                    "nome" => $agendamento["usuario_nome"],
                    "email" => $agendamento["usuario_email"],
                    "telefone" => $agendamento["usuario_telefone"],
                    "localizacao" => $agendamento["usuario_localizacao"],
                ],
            ];
        }, $agendamentos),
    ]);
} catch (PDOException $e) {
    responderAdminJson(500, [
        "ok" => false,
        "message" => "Não foi possível carregar os agendamentos agora.",
    ]);
}
