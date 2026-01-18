<?php
// Quick Database Test
$host = "localhost";
$port = "3308";
$dbname = "uep_sports_management";
$user = "root";
$pass = "garinbellyjoe2004";

echo "<h1>Database Import Test</h1>";
echo "<pre>";

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $user, $pass);
    echo "✅ Connected to MySQL successfully!\n\n";
    
    // Count tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "✅ Found " . count($tables) . " tables in the database\n\n";
    
    // List some tables
    echo "📋 Sample Tables:\n";
    foreach (array_slice($tables, 0, 10) as $table) {
        echo "   - $table\n";
    }
    echo "\n";
    
    // Count users
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM tbl_users");
    $userCount = $stmt->fetch()['count'];
    echo "✅ Found $userCount users in tbl_users\n";
    
    // Count tournaments
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM tbl_tournament");
    $tournamentCount = $stmt->fetch()['count'];
    echo "✅ Found $tournamentCount tournaments in tbl_tournament\n";
    
    echo "\n🎉 DATABASE IMPORT SUCCESSFUL!\n";
    echo "\nYou can now proceed to:\n";
    echo "http://localhost/uep_sports_management_geriane/vms_complete/auth/login.php\n";
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "\nTroubleshooting:\n";
    echo "1. Make sure WAMP is running (green icon)\n";
    echo "2. Verify MySQL is using port 3308\n";
    echo "3. Check your password is correct\n";
    echo "4. Make sure you've created the database\n";
}
echo "</pre>";
?>
