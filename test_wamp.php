<?php
echo "<h1>WAMP Test - If you see this, the file is accessible!</h1>";
echo "<p>Current file location: " . __FILE__ . "</p>";
echo "<p>Current directory: " . __DIR__ . "</p>";
echo "<p>Document root: " . $_SERVER['DOCUMENT_ROOT'] . "</p>";
?>
