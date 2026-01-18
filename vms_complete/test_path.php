<?php
// Simple path test
require_once __DIR__ . '/config/config.php';

echo "<h1>Path Configuration Test</h1>";
echo "<p><strong>BASE_URL:</strong> " . BASE_URL . "</p>";
echo "<p><strong>__DIR__:</strong> " . __DIR__ . "</p>";
echo "<p><strong>Auth Login Path:</strong> " . BASE_URL . "/auth/login.php</p>";

// Check if files exist
$authLoginPath = __DIR__ . '/auth/login.php';
echo "<p><strong>Auth login.php exists:</strong> " . (file_exists($authLoginPath) ? 'YES' : 'NO') . "</p>";
echo "<p><strong>Full path:</strong> " . $authLoginPath . "</p>";

// Generate test link
echo "<hr>";
echo "<a href='" . BASE_URL . "/auth/login.php' style='display:inline-block; padding:10px 20px; background:#FFB81C; color:#111; text-decoration:none; border-radius:5px; font-weight:bold;'>Test Login Link</a>";
?>
