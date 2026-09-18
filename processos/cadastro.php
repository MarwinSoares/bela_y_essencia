<?php
$host = "localhost";
$dbname = "estetica";
$user = "root";
$password = "";
 
try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8",
        $user,
        $password
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO:: EXCEPTION);
} catch (PDOException $e){
    die("Erro na conexão com o banco: ". $e->getMessage());
}


?>