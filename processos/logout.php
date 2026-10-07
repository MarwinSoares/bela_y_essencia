<?php
require_once __DIR__ . "/sessao.php";

iniciarSessao();
session_unset();
session_destroy();

header("Location: ../belayessencia/html/index.html?logout=sucesso");
exit;
