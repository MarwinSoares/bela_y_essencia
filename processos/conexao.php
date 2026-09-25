<?php
$host = "localhost";
$dbname = "estetica";
$user = "root";
$password = "";
 
try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $user,
        $password
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e){
    if (defined("JSON_RESPONSE") && JSON_RESPONSE) {
        http_response_code(500);
        header("Content-Type: application/json; charset=utf-8");
        echo json_encode([
            "ok" => false,
            "message" => "Não foi possível conectar ao banco de dados agora.",
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    die("Erro na conexão com o banco: ". $e->getMessage());
}
