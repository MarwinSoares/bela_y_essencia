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

if (empty($_SESSION["usuario_id"])) {
    responderJson(401, [
        "ok" => false,
        "message" => "Entre na sua conta para ver seus agendamentos.",
        "redirect" => "../belayessencia/html/login.html?erro=sessao",
    ]);
}

require_once __DIR__ . "/conexao.php";

$idUsuario = (int) $_SESSION["usuario_id"];

try {
    $usuarioConsulta = $pdo->prepare(
        "SELECT id_usuario, nome, email, telefone
         FROM usuarios
         WHERE id_usuario = :id_usuario
           AND status = 'ativo'
         LIMIT 1"
    );
    $usuarioConsulta->execute([
        ":id_usuario" => $idUsuario,
    ]);
    $usuario = $usuarioConsulta->fetch();

    if (!$usuario) {
        responderJson(401, [
            "ok" => false,
            "message" => "Sua sessão não está mais válida. Entre novamente.",
            "redirect" => "../belayessencia/html/login.html?erro=sessao",
        ]);
    }

    $servicos = $pdo
        ->query(
            "SELECT id_servico, nome, descricao, duracao_minutos, valor
             FROM servicos
             WHERE status = 'ativo'
             ORDER BY nome"
        )
        ->fetchAll();

    $agendamentosConsulta = $pdo->prepare(
        "SELECT
            a.id_agendamento,
            a.id_servico,
            a.data_agendamento,
            DATE_FORMAT(a.hora_inicio, '%H:%i') AS hora_inicio,
            DATE_FORMAT(a.hora_fim, '%H:%i') AS hora_fim,
            a.valor,
            a.status,
            a.observacao,
            a.data_criacao,
            s.nome AS servico_nome,
            s.duracao_minutos
         FROM agendamentos a
         INNER JOIN servicos s ON s.id_servico = a.id_servico
         WHERE a.id_usuario = :id_usuario
         ORDER BY
            FIELD(a.status, 'agendado', 'confirmado', 'concluido', 'cancelado'),
            a.data_agendamento ASC,
            a.hora_inicio ASC"
    );
    $agendamentosConsulta->execute([
        ":id_usuario" => $idUsuario,
    ]);

    responderJson(200, [
        "ok" => true,
        "usuario" => [
            "id" => (int) $usuario["id_usuario"],
            "nome" => $usuario["nome"],
            "email" => $usuario["email"],
            "telefone" => $usuario["telefone"],
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
            ];
        }, $agendamentosConsulta->fetchAll()),
    ]);
} catch (PDOException $e) {
    responderJson(500, [
        "ok" => false,
        "message" => "Não foi possível carregar seus agendamentos agora.",
    ]);
}
