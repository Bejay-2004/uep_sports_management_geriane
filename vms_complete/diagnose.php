<?php
// Diagnostic script to find the correct BASE_URL
echo "<h1>🔍 WAMP Path Diagnostic</h1>";
echo "<hr>";

echo "<h2>Server Information:</h2>";
echo "<p><strong>DOCUMENT_ROOT:</strong> " . $_SERVER['DOCUMENT_ROOT'] . "</p>";
echo "<p><strong>SCRIPT_FILENAME:</strong> " . $_SERVER['SCRIPT_FILENAME'] . "</p>";
echo "<p><strong>REQUEST_URI:</strong> " . $_SERVER['REQUEST_URI'] . "</p>";
echo "<p><strong>PHP_SELF:</strong> " . $_SERVER['PHP_SELF'] . "</p>";

echo "<hr>";
echo "<h2>File System:</h2>";
echo "<p><strong>__FILE__:</strong> " . __FILE__ . "</p>";
echo "<p><strong>__DIR__:</strong> " . __DIR__ . "</p>";

echo "<hr>";
echo "<h2>Calculated Paths:</h2>";

// Calculate relative path from document root
$docRoot = $_SERVER['DOCUMENT_ROOT'];
$scriptFile = __FILE__;

// Normalize paths
$docRoot = str_replace('\\', '/', $docRoot);
$scriptFile = str_replace('\\', '/', $scriptFile);

// Get relative path
$relativePath = str_replace($docRoot, '', dirname($scriptFile));
$relativePath = trim($relativePath, '/');

echo "<p><strong>Relative path from DOCUMENT_ROOT:</strong> /" . $relativePath . "</p>";

// Calculate BASE_URL
$baseUrl = '/' . $relativePath;
echo "<p><strong>Suggested BASE_URL:</strong> <code>" . $baseUrl . "</code></p>";

echo "<hr>";
echo "<h2>Current Config:</h2>";
if (file_exists(__DIR__ . '/config/config.php')) {
    require_once __DIR__ . '/config/config.php';
    echo "<p><strong>Current BASE_URL:</strong> " . (defined('BASE_URL') ? BASE_URL : 'NOT DEFINED') . "</p>";
} else {
    echo "<p>❌ config.php not found!</p>";
}

echo "<hr>";
echo "<h2>File Checks:</h2>";
$filesToCheck = [
    'index.php',
    'auth/login.php',
    'config/config.php',
    'config/db.php'
];

foreach ($filesToCheck as $file) {
    $fullPath = __DIR__ . '/' . $file;
    $exists = file_exists($fullPath);
    echo "<p>" . ($exists ? "✅" : "❌") . " <code>$file</code> - " . ($exists ? "EXISTS" : "NOT FOUND") . "</p>";
}

echo "<hr>";
echo "<h2>Test Links:</h2>";
echo "<p><a href='" . $baseUrl . "/index.php'>Index Page</a></p>";
echo "<p><a href='" . $baseUrl . "/auth/login.php'>Login Page</a></p>";
echo "<p><a href='" . $baseUrl . "/test_connection.php'>Test Connection</a></p>";

echo "<hr>";
echo "<h2>📋 Instructions:</h2>";
echo "<p>Copy the <strong>Suggested BASE_URL</strong> above and update it in:</p>";
echo "<p><code>config/config.php</code></p>";
?>
