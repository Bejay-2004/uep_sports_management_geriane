<?php
session_start();
require_once "../config/db.php";
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/recaptcha.php';

// Check if user is already logged in (unless force parameter is set)
if (isset($_SESSION['user']) && isset($_SESSION['user']['user_id']) && !isset($_GET['force'])) {
  $role = trim($_SESSION['user']['user_role'] ?? '');
  
  // Redirect based on role (case-insensitive)
  if (strcasecmp($role, 'admin') === 0 || 
      strcasecmp($role, 'administrator') === 0 || 
      strcasecmp($role, 'system administrator') === 0 ||
      strcasecmp($role, 'system_administrator') === 0) {
    header("Location: " . BASE_URL . "/system_administrator/dashboard.php");
    exit;
  } elseif (strcasecmp($role, 'coach') === 0) {
    header("Location: " . BASE_URL . "/coach/dashboard.php");
    exit;
  } elseif (strcasecmp($role, 'Tournament manager') === 0) {
    header("Location: " . BASE_URL . "/tournament_manager/dashboard.php");
    exit;
  } elseif (strcasecmp($role, 'sports director') === 0 || strcasecmp($role, 'sports director') === 0) {
    header("Location: " . BASE_URL . "/sports_director/dashboard.php");
    exit;
  } elseif (strcasecmp($role, 'athlete/player') === 0 || strcasecmp($role, 'athlete') === 0) {
    header("Location: " . BASE_URL . "/athlete/dashboard.php");
    exit;
  } elseif (strcasecmp($role, 'trainee') === 0) {
    header("Location: " . BASE_URL . "/trainee/dashboard.php");
    exit;
  } elseif (strcasecmp($role, 'trainor') === 0) {
    header("Location: " . BASE_URL . "/trainor/dashboard.php");
    exit;
  } elseif (strcasecmp($role, 'umpire') === 0) {
    header("Location: " . BASE_URL . "/umpire/dashboard.php");
    exit;
  } elseif (strcasecmp($role, 'scorer') === 0) {
    header("Location: " . BASE_URL . "/scorer/dashboard.php");
    exit;
  } elseif (strcasecmp($role, 'Spectator') === 0) {
    header("Location: " . BASE_URL . "/spectator/dashboard.php");
    exit;
  }
}

// Check for logout success message
$success = isset($_GET['logout']) && $_GET['logout'] === 'success' 
  ? 'You have been logged out successfully.' 
  : '';

$error = "";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $username  = trim($_POST['username'] ?? '');
  $password  = trim($_POST['password'] ?? '');
  $recaptcha_response = $_POST['g-recaptcha-response'] ?? '';

  // Verify reCAPTCHA first
  if (RECAPTCHA_ENABLED) {
    $recaptcha_result = verify_recaptcha($recaptcha_response);
    if (!$recaptcha_result['success']) {
      $error = $recaptcha_result['error'];
    }
  }

  if (!$username || !$password) {
    $error = "Username and password are required.";
  } elseif (!$error) {

    $stmt = $pdo->prepare("
      SELECT 
        u.user_id,
        u.person_id,
        u.username,
        u.password,
        u.user_role,
        u.is_active,
        p.f_name,
        p.l_name
      FROM tbl_users u
      JOIN tbl_person p ON p.person_id = u.person_id
      WHERE u.username = :username
      LIMIT 1
    ");
    $stmt->execute(['username' => $username]);
    $user = $stmt->fetch();

    // ==========================================
    // ENHANCED PASSWORD VERIFICATION
    // Handles both hashed AND plain-text passwords
    // ==========================================
    
    $password_valid = false;
    $needs_rehash = false;
    
    if ($user) {
      $stored_password = $user['password'];
      
      // Check if password is hashed (bcrypt hashes start with $2y$ and are 60 chars)
      if (strlen($stored_password) === 60 && substr($stored_password, 0, 4) === '$2y$') {
        // This is a hashed password - use password_verify
        $password_valid = password_verify($password, $stored_password);
        
        // Check if it needs rehashing (algorithm changed)
        if ($password_valid && password_needs_rehash($stored_password, PASSWORD_DEFAULT)) {
          $needs_rehash = true;
        }
      } else {
        // This is a plain-text password - direct comparison
        $password_valid = ($password === $stored_password);
        
        // Mark for rehashing since it's plain text
        if ($password_valid) {
          $needs_rehash = true;
        }
      }
    }

    // Check credentials
    if (!$user || !$password_valid) {
      $error = "Invalid username or password.";
    } elseif ($user['is_active'] != 1) {
      $error = "Your account has been deactivated.";
    } else {
      
      // ==========================================
      // AUTOMATIC PASSWORD REHASHING
      // Converts plain-text to hashed on successful login
      // ==========================================
      
      if ($needs_rehash) {
        try {
          $new_hash = password_hash($password, PASSWORD_DEFAULT);
          $update_stmt = $pdo->prepare("UPDATE tbl_users SET password = ? WHERE user_id = ?");
          $update_stmt->execute([$new_hash, $user['user_id']]);
          error_log("Password rehashed for user: {$user['username']}");
        } catch (PDOException $e) {
          // Log error but don't block login
          error_log("Failed to rehash password for user {$user['username']}: " . $e->getMessage());
        }
      }
      
      // ==========================================
      // SPORT DETECTION (FOLLOWING GUARD.PHP RULES)
      // ==========================================
      
      $role = trim($user['user_role']);
      $sports_id = null;

      // Normalize role for comparison (EXACT same as guard.php)
      $normalized_role = strtolower(str_replace(['/', ' '], '_', $role));

      // ==========================================
      // ROLES THAT DON'T NEED SPORTS_ID
      // (MUST match guard.php exactly!)
      // ==========================================
      $no_sport_roles = [
        'Tournament manager',
        'sports director',      // Handles both 'sports director' and 'sports_director'
        'admin',                // System administrator (short form)
        'administrator',        // Alias for admin
        'system_administrator', // Handles 'system_administrator' from DB
        'spectator'             // Spectators can view ALL sports
      ];

      // ==========================================
      // ROLES THAT DO NEED SPORTS_ID
      // (MUST match guard.php exactly!)
      // ==========================================
      $sport_required_roles = [
        'coach',
        'athlete',
        'athlete_player',  // Handles 'athlete/player' from DB
        'trainee',
        'trainor',
        'umpire',
        'scorer'
      ];

      // Check if this role requires a sport
      if (in_array($normalized_role, $no_sport_roles)) {
        // This role does NOT need sports_id - set to null
        $sports_id = null;
        
      } elseif (in_array($normalized_role, $sport_required_roles)) {
        // This role DOES need sports_id - try to detect it
        
        // Try to get sport from various tables based on role
        if ($normalized_role === 'coach') {
          // Get coach's sport from tbl_sports_team
          $sport_stmt = $pdo->prepare("
            SELECT sports_id 
            FROM tbl_sports_team 
            WHERE coach_id = :pid
            LIMIT 1
          ");
          $sport_stmt->execute(['pid' => $user['person_id']]);
          $sport_row = $sport_stmt->fetch();
          if ($sport_row) {
            $sports_id = (int)$sport_row['sports_id'];
          }
        } 
        elseif (in_array($normalized_role, ['athlete', 'athlete_player'])) {
          // Get athlete's sport from tbl_team_athletes
          $sport_stmt = $pdo->prepare("
            SELECT sports_id 
            FROM tbl_team_athletes 
            WHERE person_id = :pid AND is_active = 1
            LIMIT 1
          ");
          $sport_stmt->execute(['pid' => $user['person_id']]);
          $sport_row = $sport_stmt->fetch();
          if ($sport_row) {
            $sports_id = (int)$sport_row['sports_id'];
          }
        }
        elseif ($normalized_role === 'trainee') {
          // Get trainee's sport from tbl_team_trainees
          $sport_stmt = $pdo->prepare("
            SELECT st.sports_id
            FROM tbl_team_trainees tt
            JOIN tbl_sports_team st ON st.team_id = tt.team_id
            WHERE tt.trainee_id = :pid AND tt.is_active = 1
            ORDER BY st.tour_id DESC
            LIMIT 1
          ");
          $sport_stmt->execute(['pid' => $user['person_id']]);
          $sport_row = $sport_stmt->fetch();
          if ($sport_row) {
            $sports_id = (int)$sport_row['sports_id'];
          }
        }
        elseif ($normalized_role === 'trainor') {
          // Get trainor's sport from tbl_sports_team
          $sport_stmt = $pdo->prepare("
            SELECT sports_id
            FROM tbl_sports_team
            WHERE trainor1_id = ? 
               OR trainor2_id = ? 
               OR trainor3_id = ?
            ORDER BY tour_id DESC
            LIMIT 1
          ");
          $sport_stmt->execute([$user['person_id'], $user['person_id'], $user['person_id']]);
          $sport_row = $sport_stmt->fetch();
          if ($sport_row) {
            $sports_id = (int)$sport_row['sports_id'];
          }
        }
        elseif ($normalized_role === 'umpire') {
          // Get umpire's sport from match assignments
          $sport_stmt = $pdo->prepare("
            SELECT sports_id 
            FROM tbl_match 
            WHERE match_umpire_id = :pid 
            ORDER BY sked_date DESC
            LIMIT 1
          ");
          $sport_stmt->execute(['pid' => $user['person_id']]);
          $sport_row = $sport_stmt->fetch();
          if ($sport_row) {
            $sports_id = (int)$sport_row['sports_id'];
          }
        }
        elseif ($normalized_role === 'scorer') {
          // Scorer might be assigned through matches or tournaments
          // Try to find from recent match activity
          $sport_stmt = $pdo->prepare("
            SELECT sports_id 
            FROM tbl_match 
            WHERE match_sports_manager_id = :pid 
            ORDER BY sked_date DESC
            LIMIT 1
          ");
          $sport_stmt->execute(['pid' => $user['person_id']]);
          $sport_row = $sport_stmt->fetch();
          if ($sport_row) {
            $sports_id = (int)$sport_row['sports_id'];
          }
        }

        // If sport not found for a role that requires it, show error
        if ($sports_id === null || $sports_id <= 0) {
          $error = "Your account is not assigned to any sport. Please contact administrator.";
        }
        
      } else {
        // Unknown role - treat as no sport required
        $sports_id = null;
      }

      // If no errors, create session
      if (!$error) {
        // Regenerate session ID to prevent session fixation
        session_regenerate_id(true);

        // Store user data in session
        $_SESSION['user'] = [
          'user_id'   => $user['user_id'],
          'person_id' => $user['person_id'],
          'full_name' => $user['f_name'] . ' ' . $user['l_name'],
          'user_role' => $user['user_role'], // Keep original case from DB
          'sports_id' => $sports_id,
          'login_time' => time()
        ];

        // Redirect based on role (case-insensitive comparison)
        if (strcasecmp($role, 'admin') === 0 || 
            strcasecmp($role, 'administrator') === 0 || 
            strcasecmp($role, 'system administrator') === 0 ||
            strcasecmp($role, 'system_administrator') === 0) {
          header("Location: " . BASE_URL . "/system_administrator/dashboard.php");
          exit;
        } elseif (strcasecmp($role, 'coach') === 0) {
          header("Location: " . BASE_URL . "/coach/dashboard.php");
          exit;
        } elseif (strcasecmp($role, 'Tournament manager') === 0 || strcasecmp($role, 'Tournament manager') === 0) {
          header("Location: " . BASE_URL . "/tournament_manager/dashboard.php");
          exit;
        } elseif (strcasecmp($role, 'sports director') === 0 || strcasecmp($role, 'sports director') === 0) {
          header("Location: " . BASE_URL . "/sports_director/dashboard.php");
          exit;
        } elseif (strcasecmp($role, 'athlete/player') === 0 || strcasecmp($role, 'athlete') === 0 || strcasecmp($role, 'athlete_player') === 0) {
          header("Location: " . BASE_URL . "/athlete/dashboard.php");
          exit;
        } elseif (strcasecmp($role, 'trainee') === 0) {
          header("Location: " . BASE_URL . "/trainee/dashboard.php");
          exit;
        } elseif (strcasecmp($role, 'trainor') === 0) {
          header("Location: " . BASE_URL . "/trainor/dashboard.php");
          exit;
        } elseif (strcasecmp($role, 'umpire') === 0) {
          header("Location: " . BASE_URL . "/umpire/dashboard.php");
          exit;
        } elseif (strcasecmp($role, 'scorer') === 0) {
          header("Location: " . BASE_URL . "/scorer/dashboard.php");
          exit;
        } elseif (strcasecmp($role, 'Spectator') === 0 || strcasecmp($role, 'spectator') === 0) {
          header("Location: " . BASE_URL . "/spectator/dashboard.php");
          exit;
        } else {
          $error = "Unknown user role: $role";
        }
      }
    }
  }
}
?>
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Login - UEP Sports Management</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <?php if (RECAPTCHA_ENABLED): ?>
  <script src="https://www.google.com/recaptcha/api.js" async defer></script>
  <?php endif; ?>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    background: linear-gradient(135deg, #003f87 0%, #0066cc 50%, #4a90e2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    color: #111827;
    position: relative;
    overflow: hidden;
  }
  
  body::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="%23FFB81C" opacity="0.1"/></svg>');
    animation: rotate 60s linear infinite;
  }
  
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .logo-container {
    text-align: center;
    margin-bottom: 24px;
  }
  .logo-image {
    width: 90px;
    height: 90px;
    margin: 0 auto 12px;
    background: white;
    border-radius: 50%;
    padding: 10px;
    box-shadow: 0 8px 20px rgba(0, 63, 135, 0.3);
  }
  .logo-image img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .header { text-align: center; margin-bottom: 20px; }
  .header h1 { 
    margin: 0; 
    font-size: 24px; 
    font-weight: 700; 
    color: #003f87;
    background: linear-gradient(135deg, #003f87, #0066cc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .header p { margin-top: 6px; font-size: 14px; color: #6b7280; font-weight: 500; }
  .card {
    width: 100%;
    max-width: 420px;
    background: #ffffff;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    border: 3px solid rgba(255, 184, 28, 0.2);
    position: relative;
    z-index: 1;
    animation: slideUp 0.4s ease;
  }
  
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  label {
    display: block;
    margin-top: 16px;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }
  input[type="text"],
  input[type="password"] {
    width: 100%;
    margin-top: 8px;
    padding: 12px 14px;
    font-size: 15px;
    font-family: inherit;
    border-radius: 8px;
    border: 2px solid #d1d5db;
    background: #ffffff;
    color: #111827;
    transition: all 0.2s ease;
  }
  input[type="text"]:focus,
  input[type="password"]:focus { 
    outline: none; 
    border-color: #0066cc; 
    box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
  }
  .show-password {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
  }
  .show-password input[type="checkbox"] {
    width: auto;
    margin: 0;
    cursor: pointer;
  }
  .show-password label {
    margin: 0;
    font-size: 13px;
    font-weight: 400;
    color: #6b7280;
    cursor: pointer;
    user-select: none;
  }
  button {
    width: 100%;
    margin-top: 24px;
    padding: 14px 16px;
    font-size: 15px;
    font-weight: 700;
    font-family: inherit;
    border-radius: 8px;
    border: none;
    background: linear-gradient(135deg, #FFB81C 0%, #E6A817 100%);
    color: #111827;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(255, 184, 28, 0.4);
    transition: all 0.2s ease;
  }
  button:hover { 
    background: linear-gradient(135deg, #E6A817 0%, #D39615 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 184, 28, 0.5);
  }
  button:active {
    transform: translateY(0);
  }
  .msg {
    margin-top: 16px;
    padding: 12px 14px;
    font-size: 14px;
    border-radius: 8px;
    border: 2px solid transparent;
    font-weight: 500;
  }
  .err { 
    color: #991b1b; 
    background: #fee2e2; 
    border-color: #ef4444;
    border-left: 4px solid #dc2626;
  }
  .success { 
    color: #065f46; 
    background: #d1fae5; 
    border-color: #10b981;
    border-left: 4px solid #059669;
  }
  .back-home {
    text-align: center;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 2px solid #e5e7eb;
  }
  .back-home a {
    color: #0066cc;
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
  }
  .back-home a:hover { 
    color: #003f87;
    transform: translateX(-2px);
  }
  .recaptcha-container {
    margin: 20px 0;
    display: flex;
    justify-content: center;
  }
  .recaptcha-container > div {
    margin: 0 auto;
  }
</style>
</head>
<body>
  <form class="card" method="post">
    <div class="logo-container">
      <div class="logo-image">
        <img src="<?= BASE_URL ?>/assets/images/uep1.png" alt="UEP Logo">
      </div>
    </div>

    <div class="header">
      <h1>UEP Sports Management</h1>
      <p>Sign in to your account</p>
    </div>

    <label>Username</label>
    <input type="text" name="username" id="username" required autocomplete="username">

    <label>Password</label>
    <input type="password" name="password" id="password" required autocomplete="current-password">
    
    <div class="show-password">
      <input type="checkbox" id="showPassword" onclick="togglePassword()">
      <label for="showPassword">Show password</label>
    </div>

    <?php if (RECAPTCHA_ENABLED): ?>
    <div class="recaptcha-container">
      <div class="g-recaptcha" data-sitekey="<?= htmlspecialchars(RECAPTCHA_SITE_KEY) ?>"></div>
    </div>
    <?php endif; ?>

    <button type="submit">Login</button>

    <?php if ($success): ?>
      <div class="msg success"><?= htmlspecialchars($success) ?></div>
    <?php endif; ?>
    
    <?php if ($error): ?>
      <div class="msg err"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>

    <div class="back-home">
      <a href="<?= BASE_URL ?>/index.php">← Back to Home</a>
    </div>
  </form>

  <script>
    function togglePassword() {
      const passwordInput = document.getElementById('password');
      const checkbox = document.getElementById('showPassword');
      
      if (checkbox.checked) {
        passwordInput.type = 'text';
      } else {
        passwordInput.type = 'password';
      }
    }
  </script>
</body>
</html>