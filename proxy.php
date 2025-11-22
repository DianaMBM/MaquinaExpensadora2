<?php
// proxy.php - Generic proxy to fetch and stream external resources (images, etc.)
// Usage: /proxy.php?url=<encoded-url>

if (!isset($_GET['url'])) {
    http_response_code(400);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'url parameter required';
    exit;
}

$url = $_GET['url'];
// Basic validation - allow only http or https
if (!preg_match('#^https?://#i', $url)) {
    http_response_code(400);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Invalid URL';
    exit;
}

$ch = curl_init($url);

// CORS headers - allow requests from any origin (adjust in production)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 20);

$response = curl_exec($ch);
if ($response === false) {
    http_response_code(502);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Failed to fetch resource: ' . curl_error($ch);
    curl_close($ch);
    exit;
}

$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$header_raw = substr($response, 0, $header_size);
$body = substr($response, $header_size);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

if ($content_type) {
    header('Content-Type: ' . $content_type);
} else {
    header('Content-Type: application/octet-stream');
}
http_response_code($status);

echo $body;
