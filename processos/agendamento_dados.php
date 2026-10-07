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
        "message" => "Entre na sua conta para agendar um horário.",
        "redirect" => "../belayessencia/html/login.html?erro=sessao",
    ]);
}

require_once __DIR__ . "/conexao.php";

$idUsuario = (int) $_SESSION["usuario_id"];
$data = trim($_GET["data"] ?? "");
$horariosOcupados = [];

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

    $dataObj = DateTime::createFromFormat("Y-m-d", $data);
    $dataValida = $dataObj && $dataObj->format("Y-m-d") === $data;

    if ($dataValida) {
        $agendaConsulta = $pdo->prepare(
            "SELECT DATE_FORMAT(hora_inicio, '%H:%i') AS horario
             FROM agendamentos
             WHERE data_agendamento = :data_agendamento
               AND status <> 'cancelado'
             ORDER BY hora_inicio"
        );
        $agendaConsulta->execute([
            ":data_agendamento" => $data,
        ]);
        $horariosOcupados = array_column($agendaConsulta->fetchAll(), "horario");
    }

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
        "horarios_ocupados" => $horariosOcupados,
    ]);
} catch (PDOException $e) {
    responderJson(500, [
        "ok" => false,
        "message" => "Não foi possível carregar os dados de agendamento agora.",
    ]);
}
