<?php
header("Content-Type: application/json");

$remoteBase = "http://138.68.24.136:3000/api/v1";

if (!isset($_GET['endpoint'])) {
    echo json_encode(["error" => "No endpoint"]);
    exit;
}

$endpoint = trim($_GET['endpoint'], "/");

$url = "$remoteBase/$endpoint";

$resp = @file_get_contents($url);

if ($resp === false) {
    http_response_code(502);
    echo json_encode([
        "error" => "Bad Gateway: no se pudo conectar a la API remota",
        "url" => $url
    ]);
    exit;
}

echo $resp;
