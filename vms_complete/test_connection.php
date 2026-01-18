<?php
/**
 * Database Connection Test Script
 * Use this to verify your WAMP MySQL connection on port 3308
 * 
 * Access: http://localhost/uep_sports_management_geriane/vms_complete/test_connection.php
 */

// Prevent caching
header('Cache-Control: no-cache, must-revalidate');
header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Connection Test - UEP Sports Management</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #003f87 0%, #0066cc 50%, #4a90e2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            max-width: 700px;
            width: 100%;
            background: white;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            border: 3px solid #FFB81C;
        }
        h1 {
            color: #003f87;
            margin-bottom: 10px;
            font-size: 28px;
        }
        .subtitle {
            color: #6b7280;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .test-section {
            margin: 20px 0;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #e5e7eb;
        }
        .success {
            background: #d1fae5;
            border-left-color: #10b981;
            color: #065f46;
        }
        .error {
            background: #fee2e2;
            border-left-color: #ef4444;
            color: #991b1b;
        }
        .info {
            background: #dbeafe;
            border-left-color: #3b82f6;
            color: #1e40af;
        }
        .warning {
            background: #fef3c7;
            border-left-color: #f59e0b;
            color: #92400e;
        }
        .label {
            font-weight: 700;
            margin-bottom: 8px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .value {
            font-size: 15px;
            line-height: 1.6;
        }
        .value code {
            background: rgba(0, 0, 0, 0.1);
            padding: 2px 8px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
        }
        .grid {
            display: grid;
            grid-template-columns: 140px 1fr;
            gap: 12px;
            margin-top: 10px;
        }
        .grid-label {
            font-weight: 600;
            color: #6b7280;
        }
        .icon {
            font-size: 32px;
            margin-bottom: 10px;
        }
        .btn {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 24px;
            background: linear-gradient(135deg, #FFB81C, #E6A817);
            color: #111827;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 700;
            transition: all 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255, 184, 28, 0.5);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔌 Database Connection Test</h1>
        <p class="subtitle">UEP Sports Management System - WAMP Server Port 3308</p>

        <?php
        // Configuration (WAMP on port 3308 to avoid XAMPP conflict)
        $host = "localhost";
        $port = "3308"; // WAMP port (3308 to avoid XAMPP on 3306)
        $dbname = "uep_sports_management";
        $user = "root";
        $pass = ""; // WAMP default (empty password)
        $charset = "utf8mb4";

        echo '<div class="test-section info">';
        echo '<div class="icon">⚙️</div>';
        echo '<div class="label">Configuration</div>';
        echo '<div class="grid">';
        echo '<div class="grid-label">Host:</div><div><code>' . htmlspecialchars($host) . '</code></div>';
        echo '<div class="grid-label">Port:</div><div><code>' . htmlspecialchars($port) . '</code></div>';
        echo '<div class="grid-label">Database:</div><div><code>' . htmlspecialchars($dbname) . '</code></div>';
        echo '<div class="grid-label">Username:</div><div><code>' . htmlspecialchars($user) . '</code></div>';
        echo '<div class="grid-label">Password:</div><div><code>' . (empty($pass) ? '(empty)' : '********') . '</code></div>';
        echo '</div>';
        echo '</div>';

        // Test 1: Check if MySQL extension is loaded
        echo '<div class="test-section">';
        if (extension_loaded('pdo_mysql')) {
            echo '<div class="success">';
            echo '<div class="icon">✅</div>';
            echo '<div class="label">PDO MySQL Extension</div>';
            echo '<div class="value">PDO MySQL extension is loaded and available.</div>';
            echo '</div>';
        } else {
            echo '<div class="error">';
            echo '<div class="icon">❌</div>';
            echo '<div class="label">PDO MySQL Extension</div>';
            echo '<div class="value">PDO MySQL extension is NOT loaded. Please enable it in php.ini</div>';
            echo '</div>';
        }
        echo '</div>';

        // Test 2: Try to connect
        $dsn = "mysql:host=$host;port=$port;charset=$charset";
        
        echo '<div class="test-section">';
        try {
            $pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
            
            echo '<div class="success">';
            echo '<div class="icon">✅</div>';
            echo '<div class="label">MySQL Connection</div>';
            echo '<div class="value">Successfully connected to MySQL server on port <code>' . htmlspecialchars($port) . '</code>!</div>';
            echo '</div>';
            
            // Test 3: Check if database exists
            echo '</div><div class="test-section">';
            $stmt = $pdo->query("SHOW DATABASES LIKE '$dbname'");
            if ($stmt->rowCount() > 0) {
                echo '<div class="success">';
                echo '<div class="icon">✅</div>';
                echo '<div class="label">Database Found</div>';
                echo '<div class="value">Database <code>' . htmlspecialchars($dbname) . '</code> exists and is accessible.</div>';
                echo '</div>';
                
                // Test 4: Connect to specific database and check tables
                echo '</div><div class="test-section">';
                try {
                    $pdo->exec("USE `$dbname`");
                    $stmt = $pdo->query("SHOW TABLES");
                    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
                    
                    if (count($tables) > 0) {
                        echo '<div class="success">';
                        echo '<div class="icon">✅</div>';
                        echo '<div class="label">Database Tables</div>';
                        echo '<div class="value">Found <strong>' . count($tables) . ' tables</strong> in the database:<br><br>';
                        echo '<code>' . implode('</code>, <code>', array_slice($tables, 0, 10)) . '</code>';
                        if (count($tables) > 10) {
                            echo ' <em>... and ' . (count($tables) - 10) . ' more</em>';
                        }
                        echo '</div></div>';
                        
                        // Check for important tables
                        $requiredTables = ['tbl_users', 'tbl_sports', 'tbl_team', 'tbl_tournament'];
                        $missingTables = array_diff($requiredTables, $tables);
                        
                        echo '</div><div class="test-section">';
                        if (empty($missingTables)) {
                            echo '<div class="success">';
                            echo '<div class="icon">✅</div>';
                            echo '<div class="label">Required Tables</div>';
                            echo '<div class="value">All required tables are present. Your database is ready!</div>';
                            echo '</div>';
                        } else {
                            echo '<div class="warning">';
                            echo '<div class="icon">⚠️</div>';
                            echo '<div class="label">Missing Tables</div>';
                            echo '<div class="value">Some required tables are missing: <code>' . implode('</code>, <code>', $missingTables) . '</code><br>';
                            echo 'Please import the SQL file: <code>uep_sports_management (5).sql</code></div>';
                            echo '</div>';
                        }
                    } else {
                        echo '<div class="warning">';
                        echo '<div class="icon">⚠️</div>';
                        echo '<div class="label">Empty Database</div>';
                        echo '<div class="value">Database exists but contains no tables. Please import the SQL file.</div>';
                        echo '</div>';
                    }
                } catch (PDOException $e) {
                    echo '<div class="error">';
                    echo '<div class="icon">❌</div>';
                    echo '<div class="label">Database Access Error</div>';
                    echo '<div class="value">' . htmlspecialchars($e->getMessage()) . '</div>';
                    echo '</div>';
                }
                
            } else {
                echo '<div class="error">';
                echo '<div class="icon">❌</div>';
                echo '<div class="label">Database Not Found</div>';
                echo '<div class="value">Database <code>' . htmlspecialchars($dbname) . '</code> does not exist.<br><br>';
                echo '<strong>To create it:</strong><br>';
                echo '1. Open phpMyAdmin: <code>http://localhost/phpmyadmin/</code><br>';
                echo '2. Click "New" to create database<br>';
                echo '3. Name it: <code>uep_sports_management</code><br>';
                echo '4. Import the SQL file: <code>uep_sports_management (5).sql</code>';
                echo '</div></div>';
            }
            
        } catch (PDOException $e) {
            echo '<div class="error">';
            echo '<div class="icon">❌</div>';
            echo '<div class="label">Connection Failed</div>';
            echo '<div class="value"><strong>Error:</strong> ' . htmlspecialchars($e->getMessage()) . '<br><br>';
            echo '<strong>Common solutions:</strong><br>';
            echo '• Make sure WAMP Server is running (icon should be GREEN)<br>';
            echo '• Verify MySQL is using port 3308<br>';
            echo '• Check username and password in <code>config/db.php</code><br>';
            echo '• Try empty password: <code>$pass = "";</code> (WAMP default)';
            echo '</div></div>';
        }
        echo '</div>';

        // Summary
        echo '<div class="test-section info">';
        echo '<div class="icon">📋</div>';
        echo '<div class="label">Next Steps</div>';
        echo '<div class="value">';
        if (isset($pdo) && !empty($tables) && empty($missingTables)) {
            echo '<strong>🎉 Everything looks good!</strong><br><br>';
            echo 'You can now access your application at:<br>';
            echo '<code>http://localhost/uep_sports_management_geriane/vms_complete/</code>';
            echo '<br><br><a href="index.php" class="btn">Go to Application →</a>';
        } else {
            echo '<strong>Action Required:</strong><br><br>';
            echo '1. Ensure WAMP is running (green icon)<br>';
            echo '2. Create database in phpMyAdmin<br>';
            echo '3. Import SQL file<br>';
            echo '4. Refresh this page to test again<br>';
            echo '<br><a href="test_connection.php" class="btn">🔄 Test Again</a>';
        }
        echo '</div></div>';
        ?>

        <div class="test-section info" style="margin-top: 30px; font-size: 13px;">
            <strong>💡 Tip:</strong> If you see any errors, check the <code>WAMP_SETUP_GUIDE.md</code> file for detailed troubleshooting steps.
        </div>
    </div>
</body>
</html>
