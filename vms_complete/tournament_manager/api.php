<?php
// tournament_manager/api.php - FIXED VERSION

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../auth/guard.php';

require_role('Tournament manager');

header("Content-Type: application/json; charset=utf-8");

$user_id = (int)$_SESSION['user']['user_id'];
$person_id = (int)$_SESSION['user']['person_id'];

$action = $_GET['action'] ?? '';

function out($data) {
  echo json_encode($data);
  exit;
}

// Helper function to verify tournament manager has access to sport/tournament
function verifyTournamentManagerAccess($pdo, $person_id, $tour_id, $sports_id = null, $team_id = null) {
  try {
    $sql = "SELECT COUNT(*) as has_access
            FROM tbl_sports_team
            WHERE tour_id = ? AND tournament_manager_id = ?";
    
    $params = [$tour_id, $person_id];
    
    if ($sports_id !== null) {
      $sql .= " AND sports_id = ?";
      $params[] = $sports_id;
    }
    
    if ($team_id !== null) {
      $sql .= " AND team_id = ?";
      $params[] = $team_id;
    }
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $result = $stmt->fetch();
    
    return $result['has_access'] > 0;
  } catch (PDOException $e) {
    return false;
  }
}

// Helper function to deny access
function denyAccess($message = 'Access denied. You are not assigned to manage this.') {
  http_response_code(403);
  out(['ok' => false, 'error' => $message]);
}

// ==========================================
// TOURNAMENTS
// ==========================================

if ($action === 'tournaments') {
  try {
    // Only show tournaments where this person is assigned as tournament manager
    $stmt = $pdo->prepare("
      SELECT DISTINCT t.tour_id, t.tour_name, t.school_year, t.tour_date, t.is_active
      FROM tbl_tournament t
      INNER JOIN tbl_sports_team st ON st.tour_id = t.tour_id
      WHERE st.tournament_manager_id = ?
      ORDER BY t.tour_date DESC, t.tour_id DESC
    ");
    $stmt->execute([$person_id]);
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'create_tournament') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $tour_name = trim($_POST['tour_name'] ?? '');
    $school_year = trim($_POST['school_year'] ?? '');
    $tour_date = $_POST['tour_date'] ?? '';

    if (!$tour_name || !$school_year || !$tour_date) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Missing required fields']);
    }

    $stmt = $pdo->prepare("
      INSERT INTO tbl_tournament (tour_name, school_year, tour_date, is_active)
      VALUES (:tour_name, :school_year, :tour_date, 1)
    ");
    $stmt->execute([
      'tour_name' => $tour_name,
      'school_year' => $school_year,
      'tour_date' => $tour_date
    ]);

    out(['ok'=>true,'message'=>'Tournament created successfully']);
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'toggle_tournament') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $tour_id = (int)($_POST['tour_id'] ?? 0);
    $is_active = (int)($_POST['is_active'] ?? 0);

    if ($tour_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Invalid tournament ID']);
    }

    $stmt = $pdo->prepare("
      UPDATE tbl_tournament
      SET is_active = :is_active
      WHERE tour_id = :tour_id
    ");
    $stmt->execute(['is_active' => $is_active, 'tour_id' => $tour_id]);

    out(['ok'=>true,'message'=>'Tournament updated']);
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// SPORTS
// ==========================================

if ($action === 'all_sports') {
  try {
    $stmt = $pdo->query("
      SELECT sports_id, sports_name, team_individual, weight_class, 
             men_women, num_req_players, num_res_players, is_active
      FROM tbl_sports
      WHERE is_active = 1
      ORDER BY sports_name
    ");
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'tournament_sports') {
  try {
    $tour_id = (int)($_GET['tour_id'] ?? 0);
    
    if ($tour_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Invalid tournament ID']);
    }

    // Get sports selected for this tournament
    $stmt = $pdo->prepare("
      SELECT DISTINCT s.sports_id, s.sports_name, s.team_individual, 
             s.weight_class, s.men_women, s.num_req_players, s.num_res_players
      FROM tbl_tournament_sports_selection tss
      JOIN tbl_sports s ON s.sports_id = tss.sports_id
      WHERE tss.tour_id = :tour_id AND s.is_active = 1
      ORDER BY s.sports_name
    ");
    $stmt->execute(['tour_id' => $tour_id]);
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    // If table doesn't exist, return empty array
    if (strpos($e->getMessage(), "doesn't exist") !== false) {
      out([]);
    } else {
      http_response_code(500);
      out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
    }
  }
}

if ($action === 'add_tournament_sports') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $pdo->beginTransaction();
    
    // Create table if doesn't exist
    $pdo->exec("
      CREATE TABLE IF NOT EXISTS tbl_tournament_sports_selection (
        tour_id INT NOT NULL,
        sports_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (tour_id, sports_id),
        FOREIGN KEY (tour_id) REFERENCES tbl_tournament(tour_id) ON DELETE CASCADE,
        FOREIGN KEY (sports_id) REFERENCES tbl_sports(sports_id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    ");
    
    $tour_id = (int)($_POST['tour_id'] ?? 0);
    $sport_ids = $_POST['sport_ids'] ?? '';

    if ($tour_id <= 0 || !$sport_ids) {
      $pdo->rollBack();
      http_response_code(400);
      out(['ok'=>false,'message'=>'Missing required fields']);
    }

    $sport_ids_array = array_map('intval', explode(',', $sport_ids));
    $sport_ids_array = array_filter($sport_ids_array, function($id) { return $id > 0; });
    
    // Get current sports
    $currentStmt = $pdo->prepare("
      SELECT DISTINCT sports_id 
      FROM tbl_tournament_sports_selection 
      WHERE tour_id = :tour_id
    ");
    $currentStmt->execute(['tour_id' => $tour_id]);
    $currentSports = array_column($currentStmt->fetchAll(PDO::FETCH_ASSOC), 'sports_id');
    
    // Add new sports
    $sportsToAdd = array_diff($sport_ids_array, $currentSports);
    $sportsToRemove = array_diff($currentSports, $sport_ids_array);
    
    // Remove deselected sports
    foreach ($sportsToRemove as $sport_id) {
      $deleteStmt = $pdo->prepare("
        DELETE FROM tbl_tournament_sports_selection 
        WHERE tour_id = :tour_id AND sports_id = :sports_id
      ");
      $deleteStmt->execute(['tour_id' => $tour_id, 'sports_id' => $sport_id]);
      
      // Also remove teams for this sport
      $deleteTeamsStmt = $pdo->prepare("
        DELETE FROM tbl_sports_team 
        WHERE tour_id = :tour_id AND sports_id = :sports_id
      ");
      $deleteTeamsStmt->execute(['tour_id' => $tour_id, 'sports_id' => $sport_id]);
    }
    
    // Add new sports
    foreach ($sportsToAdd as $sport_id) {
      $insertStmt = $pdo->prepare("
        INSERT IGNORE INTO tbl_tournament_sports_selection (tour_id, sports_id)
        VALUES (:tour_id, :sports_id)
      ");
      $insertStmt->execute(['tour_id' => $tour_id, 'sports_id' => $sport_id]);
    }
    
    $pdo->commit();
    out(['ok'=>true,'message'=>'Sports selection updated successfully']);
  } catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}



// ==========================================
// ATHLETE APPROVAL & DISQUALIFICATION
// ==========================================

// Get pending athletes for approval (is_active = 0)
if ($action === 'pending_athletes') {
  try {
    $tour_id = isset($_GET['tour_id']) ? (int)$_GET['tour_id'] : 0;
    
    $sql = "SELECT 
              ta.team_ath_id,
              ta.tour_id,
              ta.team_id,
              ta.sports_id,
              ta.person_id,
              ta.is_captain,
              ta.is_active,
              p.f_name,
              p.l_name,
              p.m_name,
              p.college_code,
              p.course,
              p.date_birth,
              t.team_name,
              s.sports_name,
              tour.tour_name,
              CONCAT(coach.f_name, ' ', coach.l_name) as coach_name
            FROM tbl_team_athletes ta
            INNER JOIN tbl_person p ON p.person_id = ta.person_id
            INNER JOIN tbl_team t ON t.team_id = ta.team_id
            INNER JOIN tbl_sports s ON s.sports_id = ta.sports_id
            INNER JOIN tbl_tournament tour ON tour.tour_id = ta.tour_id
            INNER JOIN tbl_sports_team st ON st.tour_id = ta.tour_id 
                                           AND st.team_id = ta.team_id 
                                           AND st.sports_id = ta.sports_id
                                           AND st.tournament_manager_id = :person_id
            LEFT JOIN tbl_person coach ON coach.person_id = st.coach_id
            WHERE ta.is_active = 0";
    
    $params = ['person_id' => $person_id];
    
    if ($tour_id > 0) {
      $sql .= " AND ta.tour_id = :tour_id";
      $params['tour_id'] = $tour_id;
    }
    
    $sql .= " ORDER BY ta.tour_id DESC, s.sports_name, t.team_name, p.l_name, p.f_name";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

function ensureMatchParticipantsTable($pdo) {
  try {
    $pdo->exec("
      CREATE TABLE IF NOT EXISTS tbl_match_participants (
        participant_id INT PRIMARY KEY AUTO_INCREMENT,
        match_id INT NOT NULL,
        athlete_id INT NOT NULL,
        team_id INT,
        status ENUM('registered', 'competed', 'disqualified', 'absent') DEFAULT 'registered',
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        FOREIGN KEY (match_id) REFERENCES tbl_match(match_id) ON DELETE CASCADE,
        FOREIGN KEY (athlete_id) REFERENCES tbl_person(person_id) ON DELETE CASCADE,
        FOREIGN KEY (team_id) REFERENCES tbl_team(team_id) ON DELETE SET NULL,
        UNIQUE KEY unique_participant (match_id, athlete_id)
      ) ENGINE=InnoDB
    ");
  } catch (PDOException $e) {
    error_log("Warning: Could not create match_participants table: " . $e->getMessage());
  }
}

// Call this once at the start of your API
ensureMatchParticipantsTable($pdo);

// Get approved athletes
if ($action === 'approved_athletes') {
  try {
    $tour_id = isset($_GET['tour_id']) ? (int)$_GET['tour_id'] : 0;
    
    $sql = "SELECT 
              ta.team_ath_id,
              ta.tour_id,
              ta.team_id,
              ta.sports_id,
              ta.person_id,
              ta.is_captain,
              ta.is_active,
              p.f_name,
              p.l_name,
              p.m_name,
              p.college_code,
              p.course,
              p.date_birth,
              t.team_name,
              s.sports_name,
              tour.tour_name,
              CONCAT(coach.f_name, ' ', coach.l_name) as coach_name
            FROM tbl_team_athletes ta
            INNER JOIN tbl_person p ON p.person_id = ta.person_id
            INNER JOIN tbl_team t ON t.team_id = ta.team_id
            INNER JOIN tbl_sports s ON s.sports_id = ta.sports_id
            INNER JOIN tbl_tournament tour ON tour.tour_id = ta.tour_id
            INNER JOIN tbl_sports_team st ON st.tour_id = ta.tour_id 
                                           AND st.team_id = ta.team_id 
                                           AND st.sports_id = ta.sports_id
                                           AND st.tournament_manager_id = :person_id
            LEFT JOIN tbl_person coach ON coach.person_id = st.coach_id
            WHERE ta.is_active = 1";
    
    $params = ['person_id' => $person_id];
    
    if ($tour_id > 0) {
      $sql .= " AND ta.tour_id = :tour_id";
      $params['tour_id'] = $tour_id;
    }
    
    $sql .= " ORDER BY ta.tour_id DESC, s.sports_name, t.team_name, p.l_name, p.f_name";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// Approve athlete
if ($action === 'approve_athlete') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $team_ath_id = (int)($_POST['team_ath_id'] ?? 0);
    
    if ($team_ath_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Invalid athlete ID']);
    }
    
    // Verify tournament manager has access
    $checkStmt = $pdo->prepare("
      SELECT ta.tour_id, ta.team_id, ta.sports_id
      FROM tbl_team_athletes ta
      INNER JOIN tbl_sports_team st ON st.tour_id = ta.tour_id 
                                     AND st.team_id = ta.team_id 
                                     AND st.sports_id = ta.sports_id
                                     AND st.tournament_manager_id = :person_id
      WHERE ta.team_ath_id = :team_ath_id
    ");
    $checkStmt->execute(['team_ath_id' => $team_ath_id, 'person_id' => $person_id]);
    $athlete = $checkStmt->fetch();
    
    if (!$athlete) {
      http_response_code(403);
      out(['ok'=>false,'message'=>'Access denied or athlete not found']);
    }
    
    // Approve the athlete
    $stmt = $pdo->prepare("
      UPDATE tbl_team_athletes
      SET is_active = 1
      WHERE team_ath_id = :team_ath_id
    ");
    $stmt->execute(['team_ath_id' => $team_ath_id]);
    
    out(['ok'=>true,'message'=>'Athlete approved successfully']);
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// Bulk approve athletes
if ($action === 'bulk_approve_athletes') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $team_ath_ids = $_POST['team_ath_ids'] ?? '';
    
    if (!$team_ath_ids) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'No athletes selected']);
    }
    
    $ids = array_map('intval', explode(',', $team_ath_ids));
    $ids = array_filter($ids, function($id) { return $id > 0; });
    
    if (count($ids) === 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Invalid athlete IDs']);
    }
    
    $pdo->beginTransaction();
    
    $approved = 0;
    foreach ($ids as $team_ath_id) {
      // Verify access
      $checkStmt = $pdo->prepare("
        SELECT 1
        FROM tbl_team_athletes ta
        INNER JOIN tbl_sports_team st ON st.tour_id = ta.tour_id 
                                       AND st.team_id = ta.team_id 
                                       AND st.sports_id = ta.sports_id
                                       AND st.tournament_manager_id = :person_id
        WHERE ta.team_ath_id = :team_ath_id
      ");
      $checkStmt->execute(['team_ath_id' => $team_ath_id, 'person_id' => $person_id]);
      
      if ($checkStmt->fetch()) {
        $stmt = $pdo->prepare("
          UPDATE tbl_team_athletes
          SET is_active = 1
          WHERE team_ath_id = :team_ath_id
        ");
        $stmt->execute(['team_ath_id' => $team_ath_id]);
        $approved++;
      }
    }
    
    $pdo->commit();
    
    out(['ok'=>true,'message'=>"$approved athlete(s) approved successfully"]);
  } catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// Disqualify athlete
if ($action === 'disqualify_athlete') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $team_ath_id = (int)($_POST['team_ath_id'] ?? 0);
    $reason = trim($_POST['reason'] ?? '');
    
    if ($team_ath_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Invalid athlete ID']);
    }
    
    // Verify tournament manager has access
    $checkStmt = $pdo->prepare("
      SELECT ta.tour_id, ta.team_id, ta.sports_id
      FROM tbl_team_athletes ta
      INNER JOIN tbl_sports_team st ON st.tour_id = ta.tour_id 
                                     AND st.team_id = ta.team_id 
                                     AND st.sports_id = ta.sports_id
                                     AND st.tournament_manager_id = :person_id
      WHERE ta.team_ath_id = :team_ath_id
    ");
    $checkStmt->execute(['team_ath_id' => $team_ath_id, 'person_id' => $person_id]);
    $athlete = $checkStmt->fetch();
    
    if (!$athlete) {
      http_response_code(403);
      out(['ok'=>false,'message'=>'Access denied or athlete not found']);
    }
    
    // Disqualify the athlete (set is_active = 0)
    $stmt = $pdo->prepare("
      UPDATE tbl_team_athletes
      SET is_active = 0
      WHERE team_ath_id = :team_ath_id
    ");
    $stmt->execute(['team_ath_id' => $team_ath_id]);
    
    // Log the disqualification
    if ($reason) {
      $logStmt = $pdo->prepare("
        INSERT INTO tbl_logs (user_id, log_event, log_date, module_name)
        VALUES (:user_id, :log_event, NOW(), 'Tournament Management')
      ");
      $logStmt->execute([
        'user_id' => $user_id,
        'log_event' => "Disqualified athlete (team_ath_id: $team_ath_id). Reason: $reason"
      ]);
    }
    
    out(['ok'=>true,'message'=>'Athlete disqualified successfully']);
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// TEAMS
// ==========================================

if ($action === 'available_teams_for_sport') {
  try {
    $tour_id = isset($_GET['tour_id']) ? (int)$_GET['tour_id'] : 0;
    $sports_id = isset($_GET['sports_id']) ? (int)$_GET['sports_id'] : 0;
    
    // Get all active teams
    $stmt = $pdo->query("
      SELECT team_id, team_name, school_id, is_active
      FROM tbl_team
      WHERE is_active = 1
      ORDER BY team_name
    ");
    $allTeams = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // If tournament and sport specified, mark registered teams
    if ($tour_id > 0 && $sports_id > 0) {
      $registeredStmt = $pdo->prepare("
        SELECT team_id 
        FROM tbl_sports_team 
        WHERE tour_id = :tour_id AND sports_id = :sports_id
      ");
      $registeredStmt->execute(['tour_id' => $tour_id, 'sports_id' => $sports_id]);
      $registered = array_column($registeredStmt->fetchAll(PDO::FETCH_ASSOC), 'team_id');
      
      foreach ($allTeams as &$team) {
        $team['is_registered'] = in_array($team['team_id'], $registered);
      }
    }
    
    out($allTeams);
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'tournament_sport_teams') {
  try {
    $tour_id = (int)($_GET['tour_id'] ?? 0);
    $sports_id = (int)($_GET['sports_id'] ?? 0);
    
    if ($tour_id <= 0 || $sports_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Missing tour_id or sports_id']);
    }

    $stmt = $pdo->prepare("
      SELECT 
        st.tour_id,
        st.team_id,
        st.sports_id,
        t.team_name,
        t.school_id,
        CONCAT(COALESCE(pc.f_name, ''), ' ', COALESCE(pc.l_name, '')) AS coach_name,
        CONCAT(COALESCE(pac.f_name, ''), ' ', COALESCE(pac.l_name, '')) AS asst_coach_name,
        (SELECT COUNT(*) FROM tbl_team_athletes ta 
         WHERE ta.tour_id = st.tour_id 
         AND ta.team_id = st.team_id 
         AND ta.sports_id = st.sports_id 
         AND ta.is_active = 1) AS num_players
      FROM tbl_sports_team st
      JOIN tbl_team t ON t.team_id = st.team_id
      LEFT JOIN tbl_person pc ON pc.person_id = st.coach_id
      LEFT JOIN tbl_person pac ON pac.person_id = st.asst_coach_id
      WHERE st.tour_id = :tour_id AND st.sports_id = :sports_id
      ORDER BY t.team_name
    ");
    $stmt->execute(['tour_id' => $tour_id, 'sports_id' => $sports_id]);
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'add_teams_to_tournament_sport') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $pdo->beginTransaction();
    
    $tour_id = (int)($_POST['tour_id'] ?? 0);
    $sports_id = (int)($_POST['sports_id'] ?? 0);
    $team_ids = $_POST['team_ids'] ?? '';

    if ($tour_id <= 0 || $sports_id <= 0) {
      $pdo->rollBack();
      http_response_code(400);
      out(['ok'=>false,'message'=>'Missing tour_id or sports_id']);
    }

    // Parse team IDs
    $team_ids_array = array_map('intval', explode(',', $team_ids));
    $team_ids_array = array_filter($team_ids_array, function($id) { return $id > 0; });
    
    // Get current teams
    $currentStmt = $pdo->prepare("
      SELECT team_id 
      FROM tbl_sports_team 
      WHERE tour_id = :tour_id AND sports_id = :sports_id
    ");
    $currentStmt->execute(['tour_id' => $tour_id, 'sports_id' => $sports_id]);
    $currentTeams = array_column($currentStmt->fetchAll(PDO::FETCH_ASSOC), 'team_id');
    
    $teamsToAdd = array_diff($team_ids_array, $currentTeams);
    $teamsToRemove = array_diff($currentTeams, $team_ids_array);
    
    $added = 0;
    $removed = 0;
    
    // Remove deselected teams
    foreach ($teamsToRemove as $team_id) {
      $deleteStmt = $pdo->prepare("
        DELETE FROM tbl_sports_team 
        WHERE tour_id = :tour_id AND sports_id = :sports_id AND team_id = :team_id
      ");
      $deleteStmt->execute([
        'tour_id' => $tour_id,
        'sports_id' => $sports_id,
        'team_id' => $team_id
      ]);
      $removed++;
    }
    
    // Add new teams
    foreach ($teamsToAdd as $team_id) {
      $insertStmt = $pdo->prepare("
        INSERT INTO tbl_sports_team (
          tour_id, team_id, sports_id, 
          coach_id, asst_coach_id, trainor1_id, trainor2_id, trainor3_id
        ) VALUES (
          :tour_id, :team_id, :sports_id,
          NULL, NULL, NULL, NULL, NULL
        )
      ");
      $insertStmt->execute([
        'tour_id' => $tour_id,
        'team_id' => $team_id,
        'sports_id' => $sports_id
      ]);
      $added++;
    }
    
    $pdo->commit();
    
    $message = "Success: {$added} team(s) added, {$removed} team(s) removed";
    out(['ok'=>true, 'message'=>$message, 'added'=>$added, 'removed'=>$removed]);
    
  } catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}


if ($action === 'remove_tournament_team') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $tour_id = (int)($_POST['tour_id'] ?? 0);
    $sports_id = (int)($_POST['sports_id'] ?? 0);
    $team_id = (int)($_POST['team_id'] ?? 0);

    if ($tour_id <= 0 || $sports_id <= 0 || $team_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Missing required fields']);
    }

    $stmt = $pdo->prepare("
      DELETE FROM tbl_sports_team 
      WHERE tour_id = :tour_id AND sports_id = :sports_id AND team_id = :team_id
    ");
    $stmt->execute([
      'tour_id' => $tour_id,
      'sports_id' => $sports_id,
      'team_id' => $team_id
    ]);

    out(['ok'=>true,'message'=>'Team removed successfully']);
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// COACHES & STAFF
// ==========================================

if ($action === 'coaches') {
  try {
    $stmt = $pdo->query("
      SELECT person_id, CONCAT(f_name, ' ', l_name) AS full_name
      FROM tbl_person
      WHERE role_type = 'coach' AND is_active = 1
      ORDER BY l_name, f_name
    ");
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'umpires') {
  try {
    $stmt = $pdo->query("
      SELECT person_id, CONCAT(f_name, ' ', l_name) AS full_name
      FROM tbl_person
      WHERE role_type = 'umpire' AND is_active = 1
      ORDER BY l_name, f_name
    ");
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// VENUES
// ==========================================

if ($action === 'venues') {
  try {
    $stmt = $pdo->query("
      SELECT venue_id, venue_name, venue_building, venue_room, venue_description, is_active
      FROM tbl_game_venue
      WHERE is_active = 1
      ORDER BY venue_name
    ");
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'create_venue') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $venue_name = trim($_POST['venue_name'] ?? '');
    $venue_building = trim($_POST['venue_building'] ?? '');
    $venue_room = trim($_POST['venue_room'] ?? '');
    $venue_description = trim($_POST['venue_description'] ?? '');

    if (!$venue_name) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Venue name is required']);
    }

    $stmt = $pdo->prepare("
      INSERT INTO tbl_game_venue (venue_name, venue_building, venue_room, venue_description, is_active)
      VALUES (:venue_name, :venue_building, :venue_room, :venue_description, 1)
    ");
    $stmt->execute([
      'venue_name' => $venue_name,
      'venue_building' => $venue_building,
      'venue_room' => $venue_room,
      'venue_description' => $venue_description
    ]);

    out(['ok'=>true,'message'=>'Venue created successfully']);
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// MATCHES
// ==========================================

// ==========================================
// MATCHES - FIXED TO SHOW INDIVIDUAL SPORTS
// ==========================================

if ($action === 'matches') {
  try {
    $tour_id = isset($_GET['tour_id']) ? (int)$_GET['tour_id'] : 0;
    $sports_id = isset($_GET['sports_id']) ? (int)$_GET['sports_id'] : 0;

    // Modified SQL to handle both team and individual sports with participant counts
    $sql = "
      SELECT 
        m.match_id,
        m.game_no,
        m.sked_date,
        m.sked_time,
        m.match_type,
        m.sports_type,
        m.sports_id,
        s.sports_name,
        m.tour_id,
        tour.tour_name,
        m.team_a_id,
        m.team_b_id,
        ta.team_name AS team_a_name,
        tb.team_name AS team_b_name,
        m.venue_id,
        v.venue_name,
        m.match_umpire_id,
        CONCAT(COALESCE(pu.f_name, ''), ' ', COALESCE(pu.l_name, '')) AS umpire_name,
        m.winner_team_id,
        m.winner_athlete_id,
        CASE 
          WHEN m.winner_team_id IS NOT NULL THEN m.winner_team_id
          WHEN m.winner_athlete_id IS NOT NULL THEN m.winner_athlete_id
          ELSE NULL
        END AS winner_id,
        CASE 
          WHEN m.winner_team_id IS NOT NULL THEN tw.team_name
          WHEN m.winner_athlete_id IS NOT NULL THEN CONCAT(COALESCE(pw.f_name, ''), ' ', COALESCE(pw.l_name, ''))
          ELSE NULL
        END AS winner_name,
        -- Participant counts for individual sports
        (SELECT COUNT(*) FROM tbl_match_participants mp WHERE mp.match_id = m.match_id) AS total_participants,
        (SELECT COUNT(*) FROM tbl_match_participants mp WHERE mp.match_id = m.match_id AND mp.status = 'registered') AS registered_count,
        (SELECT COUNT(*) FROM tbl_match_participants mp WHERE mp.match_id = m.match_id AND mp.status = 'competed') AS competed_count,
        (SELECT COUNT(*) FROM tbl_match_participants mp WHERE mp.match_id = m.match_id AND mp.status = 'absent') AS absent_count,
        (SELECT COUNT(*) FROM tbl_match_participants mp WHERE mp.match_id = m.match_id AND mp.status = 'disqualified') AS disqualified_count
      FROM tbl_match m
      -- Check if tournament manager is assigned to this sport in ANY team
      INNER JOIN tbl_sports_team st ON st.tour_id = m.tour_id 
                                     AND st.sports_id = m.sports_id
                                     AND st.tournament_manager_id = :person_id
      LEFT JOIN tbl_sports s ON s.sports_id = m.sports_id
      LEFT JOIN tbl_tournament tour ON tour.tour_id = m.tour_id
      LEFT JOIN tbl_team ta ON ta.team_id = m.team_a_id
      LEFT JOIN tbl_team tb ON tb.team_id = m.team_b_id
      LEFT JOIN tbl_game_venue v ON v.venue_id = m.venue_id
      LEFT JOIN tbl_person pu ON pu.person_id = m.match_umpire_id
      LEFT JOIN tbl_team tw ON tw.team_id = m.winner_team_id
      LEFT JOIN tbl_person pw ON pw.person_id = m.winner_athlete_id
      WHERE 1=1
    ";

    $params = ['person_id' => $person_id];
    
    if ($tour_id > 0) {
      $sql .= " AND m.tour_id = :tour_id";
      $params['tour_id'] = $tour_id;
    }
    
    if ($sports_id > 0) {
      $sql .= " AND m.sports_id = :sports_id";
      $params['sports_id'] = $sports_id;
    }
    
    // Group by match_id to avoid duplicates when manager is assigned to multiple teams in same sport
    $sql .= " GROUP BY m.match_id";
    $sql .= " ORDER BY m.sked_date DESC, m.sked_time DESC, m.game_no";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}



// ==========================================
// FIXED CREATE MATCH - SUPPORTS BOTH TEAM AND INDIVIDUAL SPORTS
// Replace the create_match action in tournament_manager/api.php
// ==========================================

// Add this as an alias to create_match for consistency with frontend
if ($action === 'schedule_match') {
  $action = 'create_match';
}

if ($action === 'create_match') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $tour_id = (int)($_POST['tour_id'] ?? 0);
    $sports_id = (int)($_POST['sports_id'] ?? 0);
    $game_no = trim($_POST['game_no'] ?? '');
    $sked_date = $_POST['sked_date'] ?? '';
    $sked_time = $_POST['sked_time'] ?? '';
    $venue_id = (int)($_POST['venue_id'] ?? 0);
    $match_umpire_id = isset($_POST['umpire_id']) ? (int)$_POST['umpire_id'] : (int)($_POST['match_umpire_id'] ?? 0);
    $match_type = trim($_POST['match_type'] ?? '');
    $sports_type = trim($_POST['sports_type'] ?? '');
    $team_a_id = isset($_POST['team_a_id']) && $_POST['team_a_id'] !== '' ? (int)$_POST['team_a_id'] : null;
    $team_b_id = isset($_POST['team_b_id']) && $_POST['team_b_id'] !== '' ? (int)$_POST['team_b_id'] : null;
    
    // Get selected athletes for individual sports
    $athletes_json = $_POST['athletes'] ?? null;
    $selected_athletes = [];
    
    if ($athletes_json) {
      $selected_athletes = json_decode($athletes_json, true);
      if (!is_array($selected_athletes)) {
        $selected_athletes = [];
      }
    }

    if ($tour_id <= 0 || $sports_id <= 0 || !$game_no || !$sked_date || !$sked_time || !$match_type || !$sports_type) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Missing required fields']);
    }

    // Check for duplicate matches
    $duplicateCheck = $pdo->prepare("
      SELECT COUNT(*) as count 
      FROM tbl_match 
      WHERE tour_id = ? 
        AND sports_id = ? 
        AND game_no = ? 
        AND sked_date = ? 
        AND sked_time = ?
    ");
    $duplicateCheck->execute([$tour_id, $sports_id, $game_no, $sked_date, $sked_time]);
    $duplicate = $duplicateCheck->fetch();
    
    if ($duplicate['count'] > 0) {
      http_response_code(409);
      out(['ok' => false, 'message' => 'A match with this game number, date, and time already exists for this sport.']);
    }

    // Verify manager is assigned to this sport
    $checkStmt = $pdo->prepare("
      SELECT COUNT(*) as has_access
      FROM tbl_sports_team
      WHERE tour_id = ? AND sports_id = ? AND tournament_manager_id = ?
    ");
    $checkStmt->execute([$tour_id, $sports_id, $person_id]);
    $access = $checkStmt->fetch();
    
    if ($access['has_access'] == 0) {
      http_response_code(403);
      out(['ok' => false, 'message' => 'Access denied. You are not assigned to manage this sport.']);
    }

    if (!in_array($match_type, ['EL', 'QF', 'SF', 'F'])) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Invalid match type']);
    }

    // Validation based on sports type
    if ($sports_type === 'team') {
      // For team sports, both teams are required
      if (!$team_a_id || !$team_b_id) {
        http_response_code(400);
        out(['ok'=>false,'message'=>'Both teams required for team sports']);
      }

      if ($team_a_id === $team_b_id) {
        http_response_code(400);
        out(['ok'=>false,'message'=>'Teams cannot be the same']);
      }
    } else if ($sports_type === 'individual') {
      // For individual sports, teams are optional (will be NULL)
      $team_a_id = null;
      $team_b_id = null;
      
      // Validate at least one athlete is selected for individual sports
      if (count($selected_athletes) === 0) {
        http_response_code(400);
        out(['ok'=>false,'message'=>'At least one athlete must be selected for individual sports']);
      }
    }

    // Begin transaction for match creation and athlete assignment
    $pdo->beginTransaction();

    try {
      // Insert match
      $stmt = $pdo->prepare("
        INSERT INTO tbl_match (
          game_no, sked_date, sked_time, venue_id, match_umpire_id, 
          match_sports_manager_id, match_type, sports_id, sports_type, 
          team_a_id, team_b_id, tour_id, winner_team_id, winner_athlete_id
        ) VALUES (
          :game_no, :sked_date, :sked_time, :venue_id, :match_umpire_id,
          NULL, :match_type, :sports_id, :sports_type,
          :team_a_id, :team_b_id, :tour_id, NULL, NULL
        )
      ");
      
      $stmt->execute([
        'game_no' => $game_no,
        'sked_date' => $sked_date,
        'sked_time' => $sked_time,
        'venue_id' => $venue_id > 0 ? $venue_id : null,
        'match_umpire_id' => $match_umpire_id > 0 ? $match_umpire_id : null,
        'match_type' => $match_type,
        'sports_id' => $sports_id,
        'sports_type' => $sports_type,
        'team_a_id' => $team_a_id,
        'team_b_id' => $team_b_id,
        'tour_id' => $tour_id
      ]);

      $match_id = $pdo->lastInsertId();

      // ✅ NEW: Register athletes in tbl_match_participants for individual sports
      $athletes_registered = 0;
      
      if ($sports_type === 'individual' && count($selected_athletes) > 0) {
        $insertParticipant = $pdo->prepare("
          INSERT INTO tbl_match_participants 
          (match_id, athlete_id, team_id, status, notes)
          VALUES 
          (:match_id, :athlete_id, :team_id, 'registered', NULL)
        ");
        
        foreach ($selected_athletes as $athlete_id) {
          $athlete_id = (int)$athlete_id;
          
          // Verify athlete is registered for this sport in this tournament
          $checkAthlete = $pdo->prepare("
            SELECT ta.team_id, ta.person_id
            FROM tbl_team_athletes ta
            WHERE ta.tour_id = ? 
              AND ta.sports_id = ? 
              AND ta.person_id = ? 
              AND ta.is_active = 1
          ");
          $checkAthlete->execute([$tour_id, $sports_id, $athlete_id]);
          $athleteData = $checkAthlete->fetch();
          
          if ($athleteData) {
            // Insert into tbl_match_participants
            $insertParticipant->execute([
              'match_id' => $match_id,
              'athlete_id' => $athlete_id,
              'team_id' => $athleteData['team_id'] // Store team for reference
            ]);
            
            $athletes_registered++;
          }
        }
      }

      $pdo->commit();

      if ($sports_type === 'individual') {
        if ($athletes_registered > 0) {
          $message = "Individual match created successfully! {$athletes_registered} athlete(s) registered for this match.";
        } else {
          $message = 'Individual match created successfully! Athletes can be registered later.';
        }
      } else {
        $message = 'Team match created successfully!';
      }

      out([
        'ok' => true, 
        'message' => $message,
        'match_id' => $match_id,
        'athletes_registered' => $athletes_registered
      ]);
      
    } catch (Exception $e) {
      $pdo->rollBack();
      throw $e;
    }
    
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// NEW: GET MATCH PARTICIPANTS
// ==========================================
// ==========================================
// MATCH PARTICIPANTS - COMPLETE CRUD
// ==========================================

if ($action === 'match_participants') {
  try {
    $match_id = (int)($_GET['match_id'] ?? 0);
    
    if ($match_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Invalid match ID']);
    }

    // Verify access to this match
    $matchCheck = $pdo->prepare("
      SELECT m.tour_id, m.sports_id, m.sports_type
      FROM tbl_match m
      INNER JOIN tbl_sports_team st ON st.tour_id = m.tour_id 
                                     AND st.sports_id = m.sports_id
                                     AND st.tournament_manager_id = :person_id
      WHERE m.match_id = :match_id
    ");
    $matchCheck->execute(['match_id' => $match_id, 'person_id' => $person_id]);
    $match = $matchCheck->fetch();
    
    if (!$match) {
      http_response_code(403);
      out(['ok'=>false,'message'=>'Access denied or match not found']);
    }

    $stmt = $pdo->prepare("
      SELECT 
        mp.participant_id,
        mp.match_id,
        mp.athlete_id,
        mp.team_id,
        mp.status,
        mp.registered_at,
        mp.notes,
        p.f_name,
        p.l_name,
        CONCAT(p.f_name, ' ', p.l_name) AS athlete_name,
        t.team_name,
        ta.is_captain,
        cs.score,
        cs.rank_no,
        cs.medal_type
      FROM tbl_match_participants mp
      JOIN tbl_person p ON p.person_id = mp.athlete_id
      LEFT JOIN tbl_team t ON t.team_id = mp.team_id
      LEFT JOIN tbl_team_athletes ta ON ta.person_id = mp.athlete_id 
        AND ta.team_id = mp.team_id
      LEFT JOIN tbl_comp_score cs ON cs.match_id = mp.match_id 
        AND cs.athlete_id = mp.athlete_id
      WHERE mp.match_id = :match_id
      ORDER BY 
        CASE mp.status
          WHEN 'competed' THEN 1
          WHEN 'registered' THEN 2
          WHEN 'absent' THEN 3
          WHEN 'disqualified' THEN 4
          ELSE 5
        END,
        cs.rank_no ASC,
        mp.registered_at ASC
    ");
    $stmt->execute(['match_id' => $match_id]);
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
    
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// NEW: ADD PARTICIPANT TO MATCH
// ==========================================

if ($action === 'add_match_participant') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $match_id = (int)($_POST['match_id'] ?? 0);
    $athlete_id = (int)($_POST['athlete_id'] ?? 0);

    if ($match_id <= 0 || $athlete_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Missing required fields']);
    }

    // Get match details
    $matchStmt = $pdo->prepare("
      SELECT tour_id, sports_id, sports_type 
      FROM tbl_match 
      WHERE match_id = ?
    ");
    $matchStmt->execute([$match_id]);
    $match = $matchStmt->fetch();
    
    if (!$match) {
      http_response_code(404);
      out(['ok'=>false,'message'=>'Match not found']);
    }

    if ($match['sports_type'] !== 'individual') {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Can only add participants to individual sport matches']);
    }

    // Check if already registered
    $checkStmt = $pdo->prepare("
      SELECT COUNT(*) as count 
      FROM tbl_match_participants 
      WHERE match_id = ? AND athlete_id = ?
    ");
    $checkStmt->execute([$match_id, $athlete_id]);
    if ($checkStmt->fetch()['count'] > 0) {
      http_response_code(409);
      out(['ok'=>false,'message'=>'Athlete already registered for this match']);
    }

    // Get athlete's team
    $athleteStmt = $pdo->prepare("
      SELECT ta.team_id
      FROM tbl_team_athletes ta
      WHERE ta.tour_id = ? 
        AND ta.sports_id = ? 
        AND ta.person_id = ? 
        AND ta.is_active = 1
    ");
    $athleteStmt->execute([$match['tour_id'], $match['sports_id'], $athlete_id]);
    $athleteData = $athleteStmt->fetch();

    if (!$athleteData) {
      http_response_code(404);
      out(['ok'=>false,'message'=>'Athlete not registered for this sport in this tournament']);
    }

    // Insert participant
    $stmt = $pdo->prepare("
      INSERT INTO tbl_match_participants 
      (match_id, athlete_id, team_id, status)
      VALUES (:match_id, :athlete_id, :team_id, 'registered')
    ");
    $stmt->execute([
      'match_id' => $match_id,
      'athlete_id' => $athlete_id,
      'team_id' => $athleteData['team_id']
    ]);

    out(['ok'=>true,'message'=>'Athlete registered for match successfully']);
    
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// NEW: UPDATE PARTICIPANT STATUS
// ==========================================

if ($action === 'update_participant_status') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $participant_id = (int)($_POST['participant_id'] ?? 0);
    $status = trim($_POST['status'] ?? '');

    if ($participant_id <= 0 || !$status) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Missing required fields']);
    }

    $validStatuses = ['registered', 'competed', 'disqualified', 'absent'];
    if (!in_array($status, $validStatuses)) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Invalid status']);
    }

    $stmt = $pdo->prepare("
      UPDATE tbl_match_participants
      SET status = :status
      WHERE participant_id = :participant_id
    ");
    $stmt->execute([
      'status' => $status,
      'participant_id' => $participant_id
    ]);

    out(['ok'=>true,'message'=>'Participant status updated successfully']);
    
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// NEW: REMOVE PARTICIPANT FROM MATCH
// ==========================================

if ($action === 'remove_match_participant') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $participant_id = (int)($_POST['participant_id'] ?? 0);

    if ($participant_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Invalid participant ID']);
    }

    $stmt = $pdo->prepare("
      DELETE FROM tbl_match_participants
      WHERE participant_id = :participant_id
    ");
    $stmt->execute(['participant_id' => $participant_id]);

    out(['ok'=>true,'message'=>'Participant removed from match successfully']);
    
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// MODIFIED: GET AVAILABLE ATHLETES FOR MATCH
// ==========================================

if ($action === 'available_athletes_for_match') {
  try {
    $tour_id = (int)($_GET['tour_id'] ?? 0);
    $sports_id = (int)($_GET['sports_id'] ?? 0);
    $match_id = isset($_GET['match_id']) ? (int)$_GET['match_id'] : 0;
    
    if ($tour_id <= 0 || $sports_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Missing required parameters']);
    }

    $sql = "
      SELECT 
        ta.person_id as athlete_id,
        CONCAT(p.f_name, ' ', p.l_name) AS athlete_name,
        t.team_id,
        t.team_name
      FROM tbl_team_athletes ta
      JOIN tbl_person p ON p.person_id = ta.person_id
      LEFT JOIN tbl_team t ON t.team_id = ta.team_id
      WHERE ta.tour_id = :tour_id 
        AND ta.sports_id = :sports_id 
        AND ta.is_active = 1
    ";
    
    // If match_id provided, exclude already registered athletes
    if ($match_id > 0) {
      $sql .= "
        AND ta.person_id NOT IN (
          SELECT athlete_id 
          FROM tbl_match_participants 
          WHERE match_id = :match_id
        )
      ";
    }
    
    $sql .= " ORDER BY p.l_name, p.f_name";
    
    $stmt = $pdo->prepare($sql);
    $params = ['tour_id' => $tour_id, 'sports_id' => $sports_id];
    if ($match_id > 0) {
      $params['match_id'] = $match_id;
    }
    
    $stmt->execute($params);
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
    
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'update_match') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $match_id = (int)($_POST['match_id'] ?? 0);
    $game_no = trim($_POST['game_no'] ?? '');
    $sked_date = $_POST['sked_date'] ?? '';
    $sked_time = $_POST['sked_time'] ?? '';
    $venue_id = (int)($_POST['venue_id'] ?? 0);
    $match_umpire_id = (int)($_POST['match_umpire_id'] ?? 0);
    $match_type = trim($_POST['match_type'] ?? '');
    $team_a_id = isset($_POST['team_a_id']) && $_POST['team_a_id'] !== '' ? (int)$_POST['team_a_id'] : null;
    $team_b_id = isset($_POST['team_b_id']) && $_POST['team_b_id'] !== '' ? (int)$_POST['team_b_id'] : null;

    if ($match_id <= 0 || !$game_no || !$sked_date || !$sked_time || !$match_type) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Missing required fields']);
    }

    $stmt = $pdo->prepare("
      UPDATE tbl_match 
      SET game_no = :game_no,
          sked_date = :sked_date,
          sked_time = :sked_time,
          venue_id = :venue_id,
          match_umpire_id = :match_umpire_id,
          match_type = :match_type,
          team_a_id = :team_a_id,
          team_b_id = :team_b_id
      WHERE match_id = :match_id
    ");
    
    $stmt->execute([
      'match_id' => $match_id,
      'game_no' => $game_no,
      'sked_date' => $sked_date,
      'sked_time' => $sked_time,
      'venue_id' => $venue_id > 0 ? $venue_id : null,
      'match_umpire_id' => $match_umpire_id > 0 ? $match_umpire_id : null,
      'match_type' => $match_type,
      'team_a_id' => $team_a_id,
      'team_b_id' => $team_b_id
    ]);

    out(['ok'=>true,'message'=>'Match updated successfully']);
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'delete_match') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $match_id = (int)($_POST['match_id'] ?? 0);

    if ($match_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Invalid match ID']);
    }

    // Delete scores first
    $deleteScores = $pdo->prepare("DELETE FROM tbl_comp_score WHERE match_id = :match_id");
    $deleteScores->execute(['match_id' => $match_id]);

    // Delete match
    $stmt = $pdo->prepare("DELETE FROM tbl_match WHERE match_id = :match_id");
    $stmt->execute(['match_id' => $match_id]);

    out(['ok'=>true,'message'=>'Match deleted successfully']);
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// SCORING & STANDINGS
// ==========================================

if ($action === 'match_athletes') {
  try {
    $tour_id = (int)($_GET['tour_id'] ?? 0);
    $sports_id = (int)($_GET['sports_id'] ?? 0);
    
    if ($tour_id <= 0 || $sports_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Missing parameters']);
    }

    $stmt = $pdo->prepare("
      SELECT DISTINCT
        ta.person_id AS athlete_id,
        CONCAT(p.f_name, ' ', p.l_name) AS athlete_name,
        ta.team_id,
        t.team_name
      FROM tbl_team_athletes ta
      JOIN tbl_person p ON p.person_id = ta.person_id
      JOIN tbl_team t ON t.team_id = ta.team_id
      WHERE ta.tour_id = :tour_id 
        AND ta.sports_id = :sports_id
        AND ta.is_active = 1
      ORDER BY t.team_name, p.l_name, p.f_name
    ");
    $stmt->execute(['tour_id' => $tour_id, 'sports_id' => $sports_id]);
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'match_scores') {
  try {
    $match_id = (int)($_GET['match_id'] ?? 0);
    
    if ($match_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Invalid match ID']);
    }

    $stmt = $pdo->prepare("
      SELECT 
        cs.competetors_score_id,
        cs.tour_id,
        cs.match_id,
        cs.team_id,
        cs.athlete_id,
        cs.score,
        cs.rank_no,
        cs.medal_type,
        t.team_name,
        CONCAT(COALESCE(p.f_name, ''), ' ', COALESCE(p.l_name, '')) AS athlete_name
      FROM tbl_comp_score cs
      LEFT JOIN tbl_team t ON t.team_id = cs.team_id
      LEFT JOIN tbl_person p ON p.person_id = cs.athlete_id
      WHERE cs.match_id = :match_id
      ORDER BY cs.rank_no ASC, cs.score DESC
    ");
    $stmt->execute(['match_id' => $match_id]);
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'save_score') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $tour_id = (int)($_POST['tour_id'] ?? 0);
    $match_id = (int)($_POST['match_id'] ?? 0);
    $team_id = isset($_POST['team_id']) && $_POST['team_id'] !== '' ? (int)$_POST['team_id'] : null;
    $athlete_id = isset($_POST['athlete_id']) && $_POST['athlete_id'] !== '' ? (int)$_POST['athlete_id'] : null;
    $score = $_POST['score'] ?? '';
    
    error_log("=== SAVE SCORE DEBUG ===");
    error_log("tour_id: " . $tour_id);
    error_log("match_id: " . $match_id);
    error_log("team_id: " . var_export($team_id, true));
    error_log("athlete_id: " . var_export($athlete_id, true));
    error_log("score: " . $score);

    // Validation
    if ($tour_id <= 0 || $match_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Missing required fields (tour_id, match_id)']);
    }

    if ($team_id === null && $athlete_id === null) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Either team or athlete must be specified']);
    }

    if (!$score) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Score is required']);
    }

    // Get match details INCLUDING sports_name
    $matchStmt = $pdo->prepare("
      SELECT m.sports_id, m.sports_type, m.match_type, s.sports_name 
      FROM tbl_match m 
      LEFT JOIN tbl_sports s ON m.sports_id = s.sports_id 
      WHERE m.match_id = ?
    ");
    $matchStmt->execute([$match_id]);
    $match = $matchStmt->fetch();
    
    if (!$match) {
      http_response_code(404);
      out(['ok'=>false,'message'=>'Match not found']);
    }
    
    error_log("Match Type: " . $match['match_type'] . ", Sports Type: " . $match['sports_type']);
    
    // Verify tournament manager has access
    if (!verifyTournamentManagerAccess($pdo, $person_id, $tour_id, $match['sports_id'])) {
      denyAccess('You are not assigned to manage this sport.');
    }

    // Additional validation based on sport type
    if ($match['sports_type'] === 'team' && $team_id === null) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Team ID required for team sports']);
    }

    if ($match['sports_type'] === 'individual' && $athlete_id === null) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Athlete ID required for individual sports']);
    }

    // Check for existing score
    $checkStmt = $pdo->prepare("
      SELECT competetors_score_id 
      FROM tbl_comp_score 
      WHERE match_id = ? 
        AND team_id <=> ?
        AND athlete_id <=> ?
    ");
    $checkStmt->execute([$match_id, $team_id, $athlete_id]);
    $existing = $checkStmt->fetch();

    if ($existing) {
      // Update existing score - NO RANK/MEDAL YET
      error_log("🔄 Updating existing score (ID: " . $existing['competetors_score_id'] . ")");
      
      $stmt = $pdo->prepare("
        UPDATE tbl_comp_score 
        SET score = ?, 
            rank_no = NULL, 
            medal_type = NULL
        WHERE competetors_score_id = ?
      ");
      
      $result = $stmt->execute([
        $score,
        $existing['competetors_score_id']
      ]);
      
      if (!$result) {
        error_log("❌ Update failed");
        out(['ok'=>false,'message'=>'Failed to update score']);
      }
      
    } else {
      // Insert new score - NO RANK/MEDAL YET
      error_log("➕ Inserting new score");
      
      $stmt = $pdo->prepare("
        INSERT INTO tbl_comp_score 
        (tour_id, match_id, team_id, athlete_id, score, rank_no, medal_type)
        VALUES (?, ?, ?, ?, ?, NULL, NULL)
      ");
      
      $result = $stmt->execute([
        $tour_id,
        $match_id,
        $team_id,
        $athlete_id,
        $score
      ]);
      
      if (!$result) {
        error_log("❌ Insert failed");
        out(['ok'=>false,'message'=>'Failed to insert score']);
      }
    }

    error_log("✅ Score saved successfully (without rank/medal)");
    
    // ✅ STEP 1: Recalculate ALL ranks for this match based on actual scores
    error_log("📊 STEP 1: Recalculating ranks...");
    recalculateMatchRanks($pdo, $match_id, $match['sports_name'], $match['sports_type']);
    
    // ✅ STEP 2: Check if all competitors have been scored
    error_log("🔍 STEP 2: Checking if all competitors scored...");
    $allScored = checkIfAllCompetitorsScored($pdo, $match_id, $match['sports_type']);
    
    if ($allScored) {
      error_log("🎉 ALL COMPETITORS SCORED! Assigning medals...");
      
      // ✅ STEP 3: Assign medals based on match type and scores
      error_log("🏅 STEP 3: Assigning medals...");
      assignMedalsForMatch($pdo, $match_id, $match['match_type'], $match['sports_type']);
      
      // ✅ STEP 4: Auto-declare winner
      error_log("🏆 STEP 4: Declaring winner...");
      autoCalculateAndDeclareWinner($pdo, $match_id, $match['sports_type']);
      
      // Get final results to show in response
      $finalScoresStmt = $pdo->prepare("
        SELECT competetors_score_id, team_id, athlete_id, score, rank_no, medal_type
        FROM tbl_comp_score
        WHERE match_id = ?
        ORDER BY rank_no ASC
      ");
      $finalScoresStmt->execute([$match_id]);
      $finalScores = $finalScoresStmt->fetchAll(PDO::FETCH_ASSOC);
      
      error_log("📋 FINAL RESULTS:");
      foreach ($finalScores as $fs) {
        $competitor = $fs['team_id'] ? "Team {$fs['team_id']}" : "Athlete {$fs['athlete_id']}";
        error_log("  Rank {$fs['rank_no']}: $competitor - Score: {$fs['score']} - Medal: " . ($fs['medal_type'] ?: 'None'));
      }
      
      out([
        'ok' => true,
        'message' => '✅ Score saved! All competitors scored - medals assigned and winner declared.',
        'all_scored' => true,
        'final_results' => $finalScores
      ]);
    } else {
      error_log("⏳ Waiting for more scores...");
      
      out([
        'ok' => true,
        'message' => 'Score saved successfully. Waiting for all competitors to be scored.',
        'all_scored' => false
      ]);
    }
    
  } catch (PDOException $e) {
    error_log("❌ Database error in save_score: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// NEW HELPER FUNCTION: Recalculate ranks based on actual scores
// ==========================================

function recalculateMatchRanks($pdo, $match_id, $sports_name, $sports_type) {
  try {
    error_log("🔄 RECALCULATING RANKS for match $match_id - Sport: $sports_name");
    
    // Get all scores for this match
    $stmt = $pdo->prepare("
      SELECT competetors_score_id, team_id, athlete_id, score
      FROM tbl_comp_score
      WHERE match_id = ?
      ORDER BY competetors_score_id ASC
    ");
    $stmt->execute([$match_id]);
    $scores = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($scores) === 0) {
      error_log("⚠️ No scores found for match $match_id");
      return;
    }
    
    error_log("📊 Found " . count($scores) . " scores to rank");
    
    // Determine sport-specific sorting
    $sportLower = strtolower(trim($sports_name));
    $isTimeBased = in_array($sportLower, ['swimming', 'athletics', 'track and field']);
    $isDistanceBased = in_array($sportLower, ['shot put', 'javelin throw', 'long jump', 'high jump', 'discus throw']);
    $isSetBased = in_array($sportLower, ['volleyball', 'tennis', 'badminton', 'table tennis']);
    
    // Sort scores based on sport type
    if ($isTimeBased) {
      // Time-based: LOWER is BETTER (faster time wins)
      error_log("⏱️ Time-based sport - sorting by LOWEST time");
      usort($scores, function($a, $b) {
        $timeA = parseTimeToMilliseconds($a['score']);
        $timeB = parseTimeToMilliseconds($b['score']);
        return $timeA - $timeB; // Ascending (lower is better)
      });
    } else if ($isDistanceBased) {
      // Distance-based: HIGHER is BETTER (farther/higher wins)
      error_log("📏 Distance-based sport - sorting by HIGHEST distance");
      usort($scores, function($a, $b) {
        $distA = (float)$a['score'];
        $distB = (float)$b['score'];
        return $distB - $distA; // Descending (higher is better)
      });
    } else if ($isSetBased && count($scores) == 2) {
      // Set-based HEAD-TO-HEAD: Compare who won more sets
      error_log("🏐 Set-based sport (head-to-head) - comparing set wins");
      
      $scoreA = $scores[0]['score'];
      $scoreB = $scores[1]['score'];
      
      $competitorA = $scores[0]['team_id'] ? "Team {$scores[0]['team_id']}" : "Athlete {$scores[0]['athlete_id']}";
      $competitorB = $scores[1]['team_id'] ? "Team {$scores[1]['team_id']}" : "Athlete {$scores[1]['athlete_id']}";
      
      error_log("   Comparing: $competitorA ($scoreA) vs $competitorB ($scoreB)");
      
      $setsA = array_map('intval', explode('-', $scoreA));
      $setsB = array_map('intval', explode('-', $scoreB));
      
      $setsWonA = 0;
      $setsWonB = 0;
      
      // Compare each set head-to-head
      for ($i = 0; $i < min(count($setsA), count($setsB)); $i++) {
        if ($setsA[$i] > 0 && $setsB[$i] > 0) { // Only count played sets
          if ($setsA[$i] > $setsB[$i]) {
            $setsWonA++;
            error_log("      Set " . ($i+1) . ": $competitorA wins ({$setsA[$i]} vs {$setsB[$i]})");
          } else if ($setsB[$i] > $setsA[$i]) {
            $setsWonB++;
            error_log("      Set " . ($i+1) . ": $competitorB wins ({$setsB[$i]} vs {$setsA[$i]})");
          } else {
            error_log("      Set " . ($i+1) . ": Tie ({$setsA[$i]} vs {$setsB[$i]})");
          }
        }
      }
      
      error_log("   Final: $competitorA won $setsWonA sets, $competitorB won $setsWonB sets");
      
      // Sort by who won more sets (winner first)
      if ($setsWonB > $setsWonA) {
        // B wins, swap order
        $scores = [$scores[1], $scores[0]];
        error_log("   🏆 WINNER: $competitorB (won more sets)");
      } else {
        error_log("   🏆 WINNER: $competitorA (won more sets)");
      }
    } else if ($isSetBased && count($scores) > 2) {
      // Multi-competitor set-based: Count sets won for each
      error_log("🏐 Set-based sport (multi-competitor) - counting sets won");
      foreach ($scores as &$score) {
        $sets = explode('-', $score['score']);
        $nonZero = array_filter($sets, function($s) { return (int)$s > 0; });
        $score['sets_won'] = count($nonZero);
      }
      usort($scores, function($a, $b) {
        return $b['sets_won'] - $a['sets_won']; // Descending (more sets won = better)
      });
    } else {
      // Default: HIGHER score is BETTER
      error_log("🎯 Point-based sport - sorting by HIGHEST score");
      usort($scores, function($a, $b) {
        // Handle different score formats
        $scoreA = extractNumericScore($a['score']);
        $scoreB = extractNumericScore($b['score']);
        return $scoreB - $scoreA; // Descending (higher is better)
      });
    }
    
    // Update ranks
    $updateStmt = $pdo->prepare("
      UPDATE tbl_comp_score
      SET rank_no = ?
      WHERE competetors_score_id = ?
    ");
    
    foreach ($scores as $rank => $score) {
      $rankNumber = $rank + 1;
      $updateStmt->execute([$rankNumber, $score['competetors_score_id']]);
      
      $competitor = $score['team_id'] ? "Team ID: {$score['team_id']}" : "Athlete ID: {$score['athlete_id']}";
      error_log("🏅 Rank $rankNumber → $competitor (Score: {$score['score']})");
    }
    
    error_log("✅ Ranks recalculated successfully");
    
  } catch (PDOException $e) {
    error_log("❌ Error recalculating ranks: " . $e->getMessage());
  }
}

// Helper function to parse time strings to milliseconds
function parseTimeToMilliseconds($timeStr) {
  if (!$timeStr) return PHP_INT_MAX;
  
  // Format: "MM:SS.mmm" or "SS.mmm" or "SS.mmms"
  $timeStr = str_replace('s', '', $timeStr); // Remove 's' if present
  
  if (strpos($timeStr, ':') !== false) {
    // Has minutes: "MM:SS.mmm"
    list($minutes, $rest) = explode(':', $timeStr);
    $minutes = (int)$minutes;
    
    if (strpos($rest, '.') !== false) {
      list($seconds, $milliseconds) = explode('.', $rest);
      $seconds = (int)$seconds;
      $milliseconds = (int)$milliseconds;
    } else {
      $seconds = (int)$rest;
      $milliseconds = 0;
    }
  } else {
    // Only seconds: "SS.mmm"
    $minutes = 0;
    
    if (strpos($timeStr, '.') !== false) {
      list($seconds, $milliseconds) = explode('.', $timeStr);
      $seconds = (int)$seconds;
      $milliseconds = (int)$milliseconds;
    } else {
      $seconds = (int)$timeStr;
      $milliseconds = 0;
    }
  }
  
  return ($minutes * 60 * 1000) + ($seconds * 1000) + $milliseconds;
}

// Helper function to extract numeric score from various formats
function extractNumericScore($scoreStr) {
  if (!$scoreStr) return 0;
  
  // Handle basketball/football format: "95 (25-23-22-25)"
  if (strpos($scoreStr, '(') !== false) {
    preg_match('/^(\d+)/', $scoreStr, $matches);
    return (float)($matches[1] ?? 0);
  }
  
  // Handle set-based format: "25-21-23"
  if (strpos($scoreStr, '-') !== false) {
    $parts = explode('-', $scoreStr);
    $nonZero = array_filter($parts, function($p) { return (int)$p > 0; });
    return count($nonZero); // Number of sets won
  }
  
  // Handle distance/measurement: "8.75m" or "8.75"
  $scoreStr = str_replace(['m', 'cm', 'kg'], '', $scoreStr);
  return (float)$scoreStr;
}
// ==========================================
// FIXED HELPER FUNCTION: Assign medals for a match
// Replace the assignMedalsForMatch function in api.php (around line 450)
// ==========================================

// ==========================================
// FIXED HELPER FUNCTION: Assign medals for a match (SUPPORTS INDIVIDUAL SPORTS)
// ==========================================

function assignMedalsForMatch($pdo, $match_id, $match_type, $sports_type) {
  try {
    error_log("🏅 ASSIGNING MEDALS - Match: $match_id, Type: $match_type, Sport Type: $sports_type");
    
    // Get all scores for this match, ordered by rank (rank is already correctly calculated)
    $stmt = $pdo->prepare("
      SELECT competetors_score_id, team_id, athlete_id, rank_no, score
      FROM tbl_comp_score
      WHERE match_id = ?
      ORDER BY rank_no ASC
    ");
    $stmt->execute([$match_id]);
    $scores = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($scores) === 0) {
      error_log("⚠️ No scores found for match $match_id");
      return;
    }
    
    error_log("📊 Found " . count($scores) . " scores to process");
    
    // Medal assignment based on match type
    $medalAssignments = [];
    
    switch (strtoupper($match_type)) {
      case 'F': // Final
        error_log("🏆 Final match - Assigning medals based on rankings");
        // Rank 1 = Gold (Winner)
        // Rank 2 = Silver (Loser in 1v1, or 2nd place in multi-competitor finals)
        // Rank 3+ = Bronze (only in multi-competitor finals like swimming heats)
        
        if (count($scores) >= 1 && $scores[0]['rank_no'] == 1) {
          $medalAssignments[$scores[0]['competetors_score_id']] = 'gold';
          error_log("   🥇 Rank 1 (Winner) → GOLD");
        }
        
        if (count($scores) >= 2 && $scores[1]['rank_no'] == 2) {
          $medalAssignments[$scores[1]['competetors_score_id']] = 'silver';
          error_log("   🥈 Rank 2 (Loser/2nd Place) → SILVER");
        }
        
        // For multi-competitor finals (3+ participants), rank 3 gets bronze
        if (count($scores) >= 3 && $scores[2]['rank_no'] == 3) {
          $medalAssignments[$scores[2]['competetors_score_id']] = 'bronze';
          error_log("   🥉 Rank 3 (3rd Place) → BRONZE");
        }
        break;
        
      case 'SF': // Semi-Final
        error_log("🥉 Semi-Final - Bronze for winner (Rank 1), loser gets no medal");
        // In a 1v1 semi-final:
        // Rank 1 = Winner (gets bronze)
        // Rank 2 = Loser (no medal)
        
        // Assign bronze to rank 1 (the winner)
        foreach ($scores as $score) {
          if ($score['rank_no'] == 1) {
            $medalAssignments[$score['competetors_score_id']] = 'bronze';
            error_log("   🥉 Rank 1 (Winner) → BRONZE");
          } else if ($score['rank_no'] == 2) {
            error_log("   ❌ Rank 2 (Loser) → NO MEDAL");
          }
        }
        break;
        
      case 'QF': // Quarter-Final
      case 'EL': // Elimination
        error_log("ℹ️ Quarter-Final/Elimination - Winner advances, loser eliminated, no medals");
        // No medals for earlier rounds
        // Just track winners/losers
        foreach ($scores as $score) {
          if ($score['rank_no'] == 1) {
            error_log("   ⭐ Rank 1 (Winner) → Advances");
          } else {
            error_log("   ❌ Rank {$score['rank_no']} (Eliminated) → No medal");
          }
        }
        break;
        
      default:
        error_log("⚠️ Unknown match type: $match_type");
        break;
    }
    
    // Apply medal assignments to tbl_comp_score
    $updateStmt = $pdo->prepare("
      UPDATE tbl_comp_score 
      SET medal_type = ?
      WHERE competetors_score_id = ?
    ");
    
    $medalsAwarded = 0;
    foreach ($scores as $score) {
      $scoreId = $score['competetors_score_id'];
      $medal = isset($medalAssignments[$scoreId]) ? $medalAssignments[$scoreId] : null;
      
      $updateStmt->execute([$medal, $scoreId]);
      
      $competitorType = $score['team_id'] ? "Team ID: {$score['team_id']}" : "Athlete ID: {$score['athlete_id']}";
      $medalText = $medal ? strtoupper($medal) : 'NO MEDAL';
      error_log("🏅 Rank {$score['rank_no']} ($competitorType) → $medalText");
      
      if ($medal) {
        $medalsAwarded++;
      }
    }
    
    error_log("✅ Medals assigned successfully: $medalsAwarded medal(s) awarded");
    
    // Update team/athlete standings
    updateTeamStandings($pdo, $match_id, $scores, $medalAssignments, $sports_type);
    
  } catch (PDOException $e) {
    error_log("❌ Error assigning medals: " . $e->getMessage());
  }
}

// ==========================================
// NEW HELPER FUNCTION: Update team standings with medals
// Add this function after assignMedalsForMatch
// ==========================================

// ==========================================
// FIXED HELPER FUNCTION: Update team/athlete standings with medals
// ==========================================

function updateTeamStandings($pdo, $match_id, $scores, $medalAssignments, $sports_type) {
  try {
    error_log("📊 Updating standings with medals (Sport Type: $sports_type)...");
    
    // Get match details
    $matchStmt = $pdo->prepare("
      SELECT tour_id, sports_id, sports_type 
      FROM tbl_match 
      WHERE match_id = ?
    ");
    $matchStmt->execute([$match_id]);
    $match = $matchStmt->fetch();
    
    if (!$match) {
      error_log("⚠️ Match not found");
      return;
    }
    
    foreach ($scores as $score) {
      if (!isset($medalAssignments[$score['competetors_score_id']])) {
        error_log("⏭️ Skipping score ID {$score['competetors_score_id']} - no medal assigned");
        continue;
      }
      
      $medal = $medalAssignments[$score['competetors_score_id']];
      $medalColumn = "no_" . $medal;
      
      if ($sports_type === 'team' && $score['team_id']) {
        // ✅ Update TEAM standing
        error_log("🔄 Updating TEAM standing for team_id: {$score['team_id']}");
        
        $updateStmt = $pdo->prepare("
          INSERT INTO tbl_team_standing 
            (tour_id, sports_id, team_id, $medalColumn, no_games_played) 
          VALUES 
            (?, ?, ?, 1, 0)
          ON DUPLICATE KEY UPDATE 
            $medalColumn = $medalColumn + 1
        ");
        $updateStmt->execute([
          $match['tour_id'],
          $match['sports_id'],
          $score['team_id']
        ]);
        
        error_log("✅ Updated team standing: Team {$score['team_id']} - $medal medal");
        
      } else if ($sports_type === 'individual' && $score['athlete_id']) {
        // ✅ Update ATHLETE standing
        error_log("🔄 Updating ATHLETE standing for athlete_id: {$score['athlete_id']}");
        
        // First, check if athlete record exists
        $checkStmt = $pdo->prepare("
          SELECT athlete_id FROM tbl_team_standing 
          WHERE tour_id = ? AND sports_id = ? AND athlete_id = ?
        ");
        $checkStmt->execute([
          $match['tour_id'],
          $match['sports_id'],
          $score['athlete_id']
        ]);
        $exists = $checkStmt->fetch();
        
        if ($exists) {
          // Update existing record
          error_log("📝 Updating existing athlete record");
          $updateStmt = $pdo->prepare("
            UPDATE tbl_team_standing 
            SET $medalColumn = $medalColumn + 1
            WHERE tour_id = ? AND sports_id = ? AND athlete_id = ?
          ");
          $updateStmt->execute([
            $match['tour_id'],
            $match['sports_id'],
            $score['athlete_id']
          ]);
        } else {
          // Insert new record
          error_log("➕ Inserting new athlete record");
          $insertStmt = $pdo->prepare("
            INSERT INTO tbl_team_standing 
              (tour_id, sports_id, athlete_id, $medalColumn, no_games_played) 
            VALUES 
              (?, ?, ?, 1, 0)
          ");
          $insertStmt->execute([
            $match['tour_id'],
            $match['sports_id'],
            $score['athlete_id']
          ]);
        }
        
        error_log("✅ Updated athlete standing: Athlete {$score['athlete_id']} - $medal medal");
      }
    }
    
    error_log("✅ All standings updated successfully");
    
  } catch (PDOException $e) {
    error_log("❌ Error updating standings: " . $e->getMessage());
    error_log("❌ Stack trace: " . $e->getTraceAsString());
  }
}

// ==========================================
// NEW HELPER FUNCTION: Auto-calculate and declare winner
// ==========================================

function checkIfAllCompetitorsScored($pdo, $match_id, $sports_type) {
  try {
    error_log("🔍 Checking if all competitors scored for match $match_id ($sports_type)");
    
    if ($sports_type === 'team') {
      // For team sports, check if both teams have scores
      $stmt = $pdo->prepare("
        SELECT m.team_a_id, m.team_b_id,
               (SELECT COUNT(*) FROM tbl_comp_score WHERE match_id = m.match_id AND team_id = m.team_a_id) as team_a_scored,
               (SELECT COUNT(*) FROM tbl_comp_score WHERE match_id = m.match_id AND team_id = m.team_b_id) as team_b_scored
        FROM tbl_match m
        WHERE m.match_id = ?
      ");
      $stmt->execute([$match_id]);
      $result = $stmt->fetch();
      
      if (!$result) {
        error_log("⚠️ Match not found");
        return false;
      }
      
      $allScored = ($result['team_a_scored'] > 0 && $result['team_b_scored'] > 0);
      error_log($allScored ? "✅ Both teams scored" : "⏳ Waiting for both teams to be scored");
      
      return $allScored;
      
    } else {
      // ✅ FIXED: For individual sports, check if all participants have scores
      // We don't require status='competed' because that might not be set yet
      $stmt = $pdo->prepare("
        SELECT 
          (SELECT COUNT(*) FROM tbl_match_participants WHERE match_id = ?) as total_participants,
          (SELECT COUNT(*) FROM tbl_comp_score WHERE match_id = ?) as scored_count
      ");
      $stmt->execute([$match_id, $match_id]);
      $result = $stmt->fetch();
      
      if (!$result) {
        error_log("⚠️ Could not get participant counts");
        return false;
      }
      
      $totalParticipants = (int)$result['total_participants'];
      $scored = (int)$result['scored_count'];
      
      error_log("📊 Total Participants: $totalParticipants, Scored: $scored");
      
      // ✅ FIX: If there are participants registered, check if all have scores
      // If no participants registered yet, check if there are at least 2 scores
      if ($totalParticipants > 0) {
        $allScored = ($scored >= $totalParticipants);
        
        if ($allScored) {
          error_log("✅ All $totalParticipants athletes have been scored");
        } else {
          error_log("⏳ Waiting for " . ($totalParticipants - $scored) . " more athlete(s) to be scored");
        }
      } else {
        // No participants registered - check if we have at least 2 scores (minimum for a competition)
        $allScored = ($scored >= 2);
        
        if ($allScored) {
          error_log("✅ At least 2 athletes scored (no pre-registered participants)");
        } else {
          error_log("⏳ Need at least 2 scores for competition");
        }
      }
      
      return $allScored;
    }
  } catch (PDOException $e) {
    error_log("❌ Error checking if all scored: " . $e->getMessage());
    return false;
  }
}

// ==========================================
// ALSO ADD: Auto-declare winner function
// Add this function after checkIfAllCompetitorsScored
// ==========================================

function autoCalculateAndDeclareWinner($pdo, $match_id, $sports_type) {
  try {
    error_log("🏆 AUTO-DECLARING WINNER - Match: $match_id");
    
    // Get top-ranked score
    $stmt = $pdo->prepare("
      SELECT team_id, athlete_id, rank_no, score
      FROM tbl_comp_score
      WHERE match_id = ?
      ORDER BY rank_no ASC
      LIMIT 1
    ");
    $stmt->execute([$match_id]);
    $winner = $stmt->fetch();
    
    if (!$winner) {
      error_log("⚠️ No winner found");
      return false;
    }
    
    $winner_id = null;
    $winner_field = null;
    
    if ($sports_type === 'team') {
      $winner_id = $winner['team_id'];
      $winner_field = 'winner_team_id';
    } else {
      $winner_id = $winner['athlete_id'];
      $winner_field = 'winner_athlete_id';
    }
    
    if (!$winner_id) {
      error_log("❌ Invalid winner ID");
      return false;
    }
    
    // Update match with winner
    $updateStmt = $pdo->prepare("
      UPDATE tbl_match
      SET $winner_field = ?
      WHERE match_id = ?
    ");
    $updateStmt->execute([$winner_id, $match_id]);
    
    error_log("✅ Winner declared: $winner_field = $winner_id (Rank: {$winner['rank_no']}, Score: {$winner['score']})");
    return true;
    
  } catch (PDOException $e) {
    error_log("❌ Error declaring winner: " . $e->getMessage());
    return false;
  }
}


if ($action === 'standings') {
  try {
    $tour_id = (int)($_GET['tour_id'] ?? 0);
    $sports_id = (int)($_GET['sports_id'] ?? 0);

    if ($tour_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Invalid tournament ID']);
    }

    // Verify manager has access to this tournament
    $accessCheck = $pdo->prepare("
      SELECT COUNT(DISTINCT sports_id) as has_access
      FROM tbl_sports_team
      WHERE tour_id = ? AND tournament_manager_id = ?
    ");
    $accessCheck->execute([$tour_id, $person_id]);
    $access = $accessCheck->fetch();
    
    if ($access['has_access'] == 0) {
      http_response_code(403);
      out(['ok'=>false,'message'=>'Access denied. You are not assigned to manage any sport in this tournament.']);
    }

    // Build query - only show standings for sports this manager is assigned to
    // Added GROUP BY to prevent duplicates from multiple team assignments
    $sql = "
      SELECT 
        ts.tour_id,
        ts.sports_id,
        ts.team_id,
        ts.athlete_id,
        t.team_name,
        s.sports_name,
        ts.no_games_played,
        ts.no_win,
        ts.no_loss,
        ts.no_draw,
        ts.no_gold,
        ts.no_silver,
        ts.no_bronze,
        CONCAT(COALESCE(p.f_name, ''), ' ', COALESCE(p.l_name, '')) AS athlete_name,
        s.team_individual
      FROM tbl_team_standing ts
      INNER JOIN tbl_sports_team st ON st.tour_id = ts.tour_id 
                                     AND st.sports_id = ts.sports_id 
                                     AND st.tournament_manager_id = :person_id
      LEFT JOIN tbl_team t ON t.team_id = ts.team_id
      INNER JOIN tbl_sports s ON s.sports_id = ts.sports_id
      LEFT JOIN tbl_person p ON p.person_id = ts.athlete_id
      WHERE ts.tour_id = :tour_id
    ";

    $params = ['person_id' => $person_id, 'tour_id' => $tour_id];
    
    if ($sports_id > 0) {
      $sql .= " AND ts.sports_id = :sports_id";
      $params['sports_id'] = $sports_id;
    }
    
    // Group by the standing record to prevent duplicates
    $sql .= " GROUP BY ts.tour_id, ts.sports_id, ts.team_id, ts.athlete_id";
    
    // Order by wins, then gold medals
    $sql .= " ORDER BY ts.no_win DESC, ts.no_gold DESC, ts.no_silver DESC, ts.no_bronze DESC, t.team_name, athlete_name";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // If no results, return empty array instead of error
    out($results ?: []);
    
  } catch (PDOException $e) {
    error_log("Standings error: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}



// ==========================================
// ADDITIONAL ENDPOINTS
// ==========================================

if ($action === 'available_teams_for_sport') {
  try {
    // Get all active teams
    $stmt = $pdo->query("
      SELECT team_id, team_name
      FROM tbl_team
      WHERE is_active = 1
      ORDER BY team_name
    ");
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'team_players') {
  try {
    $tour_id = (int)($_GET['tour_id'] ?? 0);
    $sports_id = (int)($_GET['sports_id'] ?? 0);
    $team_id = (int)($_GET['team_id'] ?? 0);
    
    if ($tour_id <= 0 || $sports_id <= 0 || $team_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Missing parameters']);
    }

    $stmt = $pdo->prepare("
      SELECT 
        ta.team_ath_id,
        ta.person_id,
        CONCAT(p.f_name, ' ', COALESCE(p.m_name, ''), ' ', p.l_name) AS player_name,
        ta.is_captain,
        p.college_code,
        p.course
      FROM tbl_team_athletes ta
      JOIN tbl_person p ON p.person_id = ta.person_id
      WHERE ta.tour_id = :tour_id 
        AND ta.sports_id = :sports_id 
        AND ta.team_id = :team_id
        AND ta.is_active = 1
      ORDER BY ta.is_captain DESC, p.l_name, p.f_name
    ");
    $stmt->execute([
      'tour_id' => $tour_id,
      'sports_id' => $sports_id,
      'team_id' => $team_id
    ]);
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'team_coaches') {
  try {
    $tour_id = (int)($_GET['tour_id'] ?? 0);
    $sports_id = (int)($_GET['sports_id'] ?? 0);
    $team_id = (int)($_GET['team_id'] ?? 0);
    
    if ($tour_id <= 0 || $sports_id <= 0 || $team_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Missing parameters']);
    }

    $stmt = $pdo->prepare("
      SELECT 
        CONCAT(COALESCE(pc.f_name, ''), ' ', COALESCE(pc.l_name, '')) AS coach_name,
        CONCAT(COALESCE(pac.f_name, ''), ' ', COALESCE(pac.l_name, '')) AS asst_coach_name
      FROM tbl_sports_team st
      LEFT JOIN tbl_person pc ON pc.person_id = st.coach_id
      LEFT JOIN tbl_person pac ON pac.person_id = st.asst_coach_id
      WHERE st.tour_id = :tour_id 
        AND st.sports_id = :sports_id 
        AND st.team_id = :team_id
    ");
    $stmt->execute([
      'tour_id' => $tour_id,
      'sports_id' => $sports_id,
      'team_id' => $team_id
    ]);
    
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    out($result ? $result : ['coach_name' => '', 'asst_coach_name' => '']);
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'sports_managers') {
  try {
    $stmt = $pdo->query("
      SELECT person_id, CONCAT(f_name, ' ', l_name) AS full_name
      FROM tbl_person
      WHERE role_type = 'Tournament manager' AND is_active = 1
      ORDER BY l_name, f_name
    ");
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'tournament_teams_by_sport') {
  try {
    $tour_id = (int)($_GET['tour_id'] ?? 0);
    $sports_id = (int)($_GET['sports_id'] ?? 0);
    
    if ($tour_id <= 0 || $sports_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Missing parameters']);
    }

    $stmt = $pdo->prepare("
      SELECT DISTINCT
        t.team_id,
        t.team_name
      FROM tbl_sports_team st
      JOIN tbl_team t ON t.team_id = st.team_id
      WHERE st.tour_id = :tour_id AND st.sports_id = :sports_id
      ORDER BY t.team_name
    ");
    $stmt->execute(['tour_id' => $tour_id, 'sports_id' => $sports_id]);
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'available_teams') {
  try {
    $stmt = $pdo->query("
      SELECT team_id, team_name, school_id, is_active
      FROM tbl_team
      WHERE is_active = 1
      ORDER BY team_name
    ");
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'tournament_teams') {
  try {
    $tour_id = (int)($_GET['tour_id'] ?? 0);
    
    if ($tour_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Invalid tournament ID']);
    }

    $stmt = $pdo->prepare("
      SELECT DISTINCT
        t.team_id,
        t.team_name,
        s.sports_name
      FROM tbl_sports_team st
      JOIN tbl_team t ON t.team_id = st.team_id
      JOIN tbl_sports s ON s.sports_id = st.sports_id
      WHERE st.tour_id = :tour_id
      ORDER BY s.sports_name, t.team_name
    ");
    $stmt->execute(['tour_id' => $tour_id]);
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'add_teams_to_tournament_sport') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $pdo->beginTransaction();
    
    $tour_id = (int)($_POST['tour_id'] ?? 0);
    $sports_id = (int)($_POST['sports_id'] ?? 0);
    $team_ids = $_POST['team_ids'] ?? '';

    if ($tour_id <= 0 || $sports_id <= 0 || !$team_ids) {
      $pdo->rollBack();
      http_response_code(400);
      out(['ok'=>false,'message'=>'Missing required fields']);
    }

    $team_ids_array = array_map('intval', explode(',', $team_ids));
    $team_ids_array = array_filter($team_ids_array, function($id) { return $id > 0; });
    
    $added = 0;
    foreach ($team_ids_array as $team_id) {
      // Check if already exists
      $checkStmt = $pdo->prepare("
        SELECT 1 FROM tbl_sports_team 
        WHERE tour_id = :tour_id AND sports_id = :sports_id AND team_id = :team_id
      ");
      $checkStmt->execute([
        'tour_id' => $tour_id,
        'sports_id' => $sports_id,
        'team_id' => $team_id
      ]);
      
      if (!$checkStmt->fetch()) {
        $insertStmt = $pdo->prepare("
          INSERT INTO tbl_sports_team (tour_id, team_id, sports_id, coach_id, asst_coach_id, trainor1_id, trainor2_id, trainor3_id)
          VALUES (:tour_id, :team_id, :sports_id, NULL, NULL, NULL, NULL, NULL)
        ");
        $insertStmt->execute([
          'tour_id' => $tour_id,
          'team_id' => $team_id,
          'sports_id' => $sports_id
        ]);
        $added++;
      }
    }
    
    $pdo->commit();
    out(['ok'=>true,'message'=>"Added $added team(s) successfully"]);
  } catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'medal_tally') {
  try {
    $tour_id = (int)($_GET['tour_id'] ?? 0);
    
    if ($tour_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Invalid tournament ID']);
    }
    
    // Verify manager has access to this tournament
    $accessCheck = $pdo->prepare("
      SELECT COUNT(DISTINCT sports_id) as has_access
      FROM tbl_sports_team
      WHERE tour_id = ? AND tournament_manager_id = ?
    ");
    $accessCheck->execute([$tour_id, $person_id]);
    $access = $accessCheck->fetch();
    
    if ($access['has_access'] == 0) {
      http_response_code(403);
      out(['ok'=>false,'message'=>'Access denied. You are not assigned to manage any sport in this tournament.']);
    }

    // ✅ FIXED: Use subquery to prevent duplicates from multiple team assignments
    $stmt = $pdo->prepare("
      SELECT 
        t.team_id,
        t.team_name,
        SUM(COALESCE(ts.no_gold, 0)) AS total_gold,
        SUM(COALESCE(ts.no_silver, 0)) AS total_silver,
        SUM(COALESCE(ts.no_bronze, 0)) AS total_bronze,
        (SUM(COALESCE(ts.no_gold, 0)) + 
         SUM(COALESCE(ts.no_silver, 0)) + 
         SUM(COALESCE(ts.no_bronze, 0))) AS total_medals
      FROM tbl_team_standing ts
      INNER JOIN tbl_team t ON t.team_id = ts.team_id
      WHERE ts.tour_id = :tour_id
        AND ts.team_id IS NOT NULL
        -- ✅ Only include teams where manager is assigned to at least one sport
        AND EXISTS (
          SELECT 1 
          FROM tbl_sports_team st 
          WHERE st.tour_id = ts.tour_id 
            AND st.team_id = ts.team_id
            AND st.tournament_manager_id = :person_id
        )
      GROUP BY t.team_id, t.team_name
      HAVING total_medals > 0
      ORDER BY total_gold DESC, total_silver DESC, total_bronze DESC, t.team_name
    ");
    
    $stmt->execute(['tour_id' => $tour_id, 'person_id' => $person_id]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Return empty array if no medals yet
    out($results ?: []);
    
  } catch (PDOException $e) {
    error_log("Medal tally error: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'toggle_venue') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $venue_id = (int)($_POST['venue_id'] ?? 0);
    $is_active = (int)($_POST['is_active'] ?? 0);

    if ($venue_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Invalid venue ID']);
    }

    $stmt = $pdo->prepare("
      UPDATE tbl_game_venue
      SET is_active = :is_active
      WHERE venue_id = :venue_id
    ");
    $stmt->execute(['is_active' => $is_active, 'venue_id' => $venue_id]);

    out(['ok'=>true,'message'=>'Venue updated']);
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'scores') {
  try {
    $match_id = isset($_GET['match_id']) ? (int)$_GET['match_id'] : 0;

    $sql = "
      SELECT 
        cs.competetors_score_id AS score_id,
        cs.tour_id,
        cs.match_id,
        cs.team_id,
        cs.athlete_id,
        cs.score,
        cs.rank_no,
        cs.medal_type,
        t.team_name,
        CONCAT(COALESCE(p.f_name, ''), ' ', COALESCE(p.l_name, '')) AS athlete_name,
        m.game_no,
        s.sports_name,
        m.sports_type,
        CASE 
          WHEN m.sports_type = 'individual' THEN CONCAT(s.sports_name, ' - Game ', m.game_no)
          ELSE CONCAT(s.sports_name, ': ', ta.team_name, ' vs ', tb.team_name)
        END as match_info
      FROM tbl_comp_score cs
      LEFT JOIN tbl_team t ON t.team_id = cs.team_id
      LEFT JOIN tbl_person p ON p.person_id = cs.athlete_id
      LEFT JOIN tbl_match m ON m.match_id = cs.match_id
      LEFT JOIN tbl_sports s ON s.sports_id = m.sports_id
      LEFT JOIN tbl_team ta ON ta.team_id = m.team_a_id
      LEFT JOIN tbl_team tb ON tb.team_id = m.team_b_id
      WHERE 1=1
    ";

    $params = [];
    
    if ($match_id > 0) {
      $sql .= " AND cs.match_id = :match_id";
      $params['match_id'] = $match_id;
    }
    
    $sql .= " ORDER BY cs.match_id DESC, cs.rank_no ASC, cs.score DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'delete_score') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $score_id = (int)($_POST['score_id'] ?? 0);

    if ($score_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Invalid score ID']);
    }

    $stmt = $pdo->prepare("DELETE FROM tbl_comp_score WHERE competetors_score_id = :score_id");
    $stmt->execute(['score_id' => $score_id]);

    out(['ok'=>true,'message'=>'Score deleted successfully']);
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// DECLARE WINNER - SUPPORTS BOTH TEAM AND INDIVIDUAL SPORTS
// Replace the declare_winner action in api.php
// ==========================================

// ==========================================
// FIXED DECLARE WINNER - SUPPORTS BOTH TEAM AND INDIVIDUAL SPORTS
// Replace the declare_winner action in api.php (around line 850)
// ==========================================

// ==========================================
// FIXED DECLARE WINNER WITH BETTER DEBUGGING
// Replace the declare_winner action in api.php (around line 850)
// ==========================================

if ($action === 'declare_winner') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $match_id = isset($_POST['match_id']) ? (int)$_POST['match_id'] : 0;
    $winner_id = isset($_POST['winner_id']) ? (int)$_POST['winner_id'] : 0;
    $winner_type = isset($_POST['winner_type']) ? trim($_POST['winner_type']) : 'team';
    $sports_type = isset($_POST['sports_type']) ? trim($_POST['sports_type']) : 'team';

    error_log("=== MANUAL DECLARE WINNER ===");
    error_log("match_id: " . $match_id);
    error_log("winner_id: " . $winner_id);
    error_log("winner_type: " . $winner_type);
    error_log("sports_type: " . $sports_type);

    if ($match_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Invalid match ID']);
    }

    if ($winner_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Invalid winner ID. Please select a valid winner.']);
    }

    // Get match details
    $matchStmt = $pdo->prepare("
      SELECT m.sports_id, m.tour_id, m.sports_type, m.team_a_id, m.team_b_id, m.match_type
      FROM tbl_match m
      WHERE m.match_id = ?
    ");
    $matchStmt->execute([$match_id]);
    $match = $matchStmt->fetch();
    
    if (!$match) {
      http_response_code(404);
      out(['ok'=>false,'message'=>'Match not found']);
    }
    
    // Verify access
    if (!verifyTournamentManagerAccess($pdo, $person_id, $match['tour_id'], $match['sports_id'])) {
      denyAccess('You are not assigned to manage this sport.');
    }

    // ✅ IMPORTANT: Check if all competitors have been scored
    $allScored = checkIfAllCompetitorsScored($pdo, $match_id, $sports_type);
    
    if (!$allScored) {
      http_response_code(400);
      out([
        'ok' => false, 
        'message' => 'Cannot declare winner yet. All competitors must be scored first.'
      ]);
    }

    // Declare winner based on sports type
    if ($sports_type === 'individual' && $winner_type === 'athlete') {
      // Verify athlete is registered
      $verifyStmt = $pdo->prepare("
        SELECT COUNT(*) as count
        FROM tbl_team_athletes
        WHERE tour_id = ? AND sports_id = ? AND person_id = ? AND is_active = 1
      ");
      $verifyStmt->execute([$match['tour_id'], $match['sports_id'], $winner_id]);
      $verify = $verifyStmt->fetch();
      
      if ($verify['count'] == 0) {
        http_response_code(400);
        out(['ok'=>false,'message'=>'Selected athlete is not registered for this sport']);
      }
      
      // Update match with athlete winner
      $stmt = $pdo->prepare("
        UPDATE tbl_match
        SET winner_athlete_id = :winner_id, winner_team_id = NULL
        WHERE match_id = :match_id
      ");
      $stmt->execute(['winner_id' => $winner_id, 'match_id' => $match_id]);
      
      // Get athlete name
      $athleteStmt = $pdo->prepare("
        SELECT CONCAT(f_name, ' ', l_name) as name
        FROM tbl_person WHERE person_id = ?
      ");
      $athleteStmt->execute([$winner_id]);
      $athlete = $athleteStmt->fetch();
      $winnerName = $athlete['name'] ?? 'Unknown';
      
      error_log("✅ Individual winner declared: " . $winnerName);
      
      // ✅ Ensure medals are assigned
      assignMedalsForMatch($pdo, $match_id, $match['match_type'], $sports_type);
      
      out(['ok'=>true,'message'=>"Winner declared: {$winnerName}. Medals assigned."]);
      
    } else {
      // Team sport - verify team is in match
      $verifyStmt = $pdo->prepare("
        SELECT COUNT(*) as count
        FROM tbl_match
        WHERE match_id = ? AND (team_a_id = ? OR team_b_id = ?)
      ");
      $verifyStmt->execute([$match_id, $winner_id, $winner_id]);
      $verify = $verifyStmt->fetch();
      
      if ($verify['count'] == 0) {
        http_response_code(400);
        out(['ok'=>false,'message'=>'Selected team is not part of this match']);
      }
      
      // Update match with team winner
      $stmt = $pdo->prepare("
        UPDATE tbl_match
        SET winner_team_id = :winner_id, winner_athlete_id = NULL
        WHERE match_id = :match_id
      ");
      $stmt->execute(['winner_id' => $winner_id, 'match_id' => $match_id]);
      
      // Get team name
      $teamStmt = $pdo->prepare("SELECT team_name FROM tbl_team WHERE team_id = ?");
      $teamStmt->execute([$winner_id]);
      $team = $teamStmt->fetch();
      $winnerName = $team['team_name'] ?? 'Unknown';
      
      error_log("✅ Team winner declared: " . $winnerName);
      
      // ✅ Ensure medals are assigned
      assignMedalsForMatch($pdo, $match_id, $match['match_type'], $sports_type);
      
      out(['ok'=>true,'message'=>"Winner declared: {$winnerName}. Medals assigned."]);
    }

  } catch (PDOException $e) {
    error_log("❌ Database error: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// COMPLETE TEAMS & PLAYERS API ENDPOINTS
// Copy this entire section and paste at the END of your api.php
// (before the final "Unknown action" line)
// ==========================================

// ==========================================
// TEAMS MANAGEMENT
// ==========================================

if ($action === 'get_all_teams') {
  try {
    $stmt = $pdo->query("
      SELECT t.school_id, t.team_id, t.team_name, t.is_active,
             s.school_name
      FROM tbl_team t
      LEFT JOIN tbl_school s ON t.school_id = s.school_id
      ORDER BY t.team_name
    ");
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'get_schools') {
  try {
    $stmt = $pdo->query("
      SELECT school_id, school_name, school_address, school_head, 
             school_sports_director, sports_dir_cp, sports_dir_email
      FROM tbl_school
      ORDER BY school_name
    ");
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'register_team') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $school_id = (int)($_POST['school_id'] ?? 0);
    $team_name = trim($_POST['team_name'] ?? '');
    $is_active = (int)($_POST['is_active'] ?? 1);

    if ($school_id <= 0 || !$team_name) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Missing required fields']);
    }

    // Check if team already exists for this school
    $check = $pdo->prepare("
      SELECT team_id FROM tbl_team 
      WHERE school_id = :school_id AND team_name = :team_name
    ");
    $check->execute(['school_id' => $school_id, 'team_name' => $team_name]);
    
    if ($check->fetch()) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Team already exists for this school']);
    }

    // Get next GLOBAL team_id (across all schools) - FIX FOR PRIMARY KEY ISSUE
    $maxIdStmt = $pdo->query("SELECT COALESCE(MAX(team_id), 0) as max_id FROM tbl_team");
    $result = $maxIdStmt->fetch(PDO::FETCH_ASSOC);
    $nextId = ($result['max_id'] ?? 0) + 1;

    // Insert the team
    $stmt = $pdo->prepare("
      INSERT INTO tbl_team (school_id, team_id, team_name, is_active)
      VALUES (:school_id, :team_id, :team_name, :is_active)
    ");
    
    $stmt->execute([
      'school_id' => $school_id,
      'team_id' => $nextId,
      'team_name' => $team_name,
      'is_active' => $is_active
    ]);

    out(['ok'=>true,'message'=>'Team registered successfully', 'team_id' => $nextId]);
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error: ' . $e->getMessage()]);
  }
}

if ($action === 'update_team') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $old_school_id = (int)($_POST['old_school_id'] ?? 0);
    $old_team_id = (int)($_POST['old_team_id'] ?? 0);
    $team_name = trim($_POST['team_name'] ?? '');
    $is_active = (int)($_POST['is_active'] ?? 1);

    if ($old_school_id <= 0 || $old_team_id <= 0 || !$team_name) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Missing required fields']);
    }

    $stmt = $pdo->prepare("
      UPDATE tbl_team
      SET team_name = :team_name, is_active = :is_active
      WHERE school_id = :school_id AND team_id = :team_id
    ");
    $stmt->execute([
      'team_name' => $team_name,
      'is_active' => $is_active,
      'school_id' => $old_school_id,
      'team_id' => $old_team_id
    ]);

    out(['ok'=>true,'message'=>'Team updated successfully']);
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'toggle_team_status') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $school_id = (int)($_POST['school_id'] ?? 0);
    $team_id = (int)($_POST['team_id'] ?? 0);
    $is_active = (int)($_POST['is_active'] ?? 0);

    if ($school_id <= 0 || $team_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Invalid team identifiers']);
    }

    $stmt = $pdo->prepare("
      UPDATE tbl_team
      SET is_active = :is_active
      WHERE school_id = :school_id AND team_id = :team_id
    ");
    $stmt->execute([
      'is_active' => $is_active,
      'school_id' => $school_id,
      'team_id' => $team_id
    ]);

    out(['ok'=>true,'message'=>'Team status updated']);
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// PLAYERS MANAGEMENT  
// ==========================================

if ($action === 'get_all_players') {
  try {
    $team_id = isset($_GET['team_id']) ? (int)$_GET['team_id'] : 0;
    
    $sql = "
      SELECT p.person_id, p.l_name, p.f_name, p.m_name, p.role_type, 
             p.title, p.date_birth, p.college_code, p.course, 
             p.blood_type, p.is_active,
             c.college_name
      FROM tbl_person p
      LEFT JOIN tbl_college c ON p.college_code = c.college_code
      WHERE p.role_type = 'athlete'
    ";
    
    $params = [];
    if ($team_id > 0) {
      $sql .= " AND p.person_id IN (
        SELECT person_id FROM tbl_team_athletes WHERE team_id = :team_id
      )";
      $params['team_id'] = $team_id;
    }
    
    $sql .= " ORDER BY p.l_name, p.f_name";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'get_colleges') {
  try {
    $stmt = $pdo->query("
      SELECT college_id, college_code, college_name, college_dean, is_active
      FROM tbl_college
      WHERE is_active = 1
      ORDER BY college_name
    ");
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'register_player') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $l_name = trim($_POST['l_name'] ?? '');
    $f_name = trim($_POST['f_name'] ?? '');
    $m_name = trim($_POST['m_name'] ?? '');
    $role_type = trim($_POST['role_type'] ?? '');
    $title = trim($_POST['title'] ?? '');
    $date_birth = $_POST['date_birth'] ?? null;
    $college_code = trim($_POST['college_code'] ?? '');
    $course = trim($_POST['course'] ?? '');
    $blood_type = trim($_POST['blood_type'] ?? '');
    $is_active = (int)($_POST['is_active'] ?? 1);

    if (!$l_name || !$f_name || !$role_type) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Missing required fields (last name, first name, role type)']);
    }

    $stmt = $pdo->prepare("
      INSERT INTO tbl_person (l_name, f_name, m_name, role_type, title, 
                              date_birth, college_code, course, blood_type, is_active)
      VALUES (:l_name, :f_name, :m_name, :role_type, :title, 
              :date_birth, :college_code, :course, :blood_type, :is_active)
    ");
    $stmt->execute([
      'l_name' => $l_name,
      'f_name' => $f_name,
      'm_name' => $m_name,
      'role_type' => $role_type,
      'title' => $title,
      'date_birth' => $date_birth ?: null,
      'college_code' => $college_code ?: null,
      'course' => $course ?: null,
      'blood_type' => $blood_type ?: null,
      'is_active' => $is_active
    ]);

    $person_id = $pdo->lastInsertId();
    
    out(['ok'=>true,'message'=>'Player registered successfully', 'person_id' => $person_id]);
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'update_player') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $person_id = (int)($_POST['person_id'] ?? 0);
    $l_name = trim($_POST['l_name'] ?? '');
    $f_name = trim($_POST['f_name'] ?? '');
    $m_name = trim($_POST['m_name'] ?? '');
    $role_type = trim($_POST['role_type'] ?? '');
    $title = trim($_POST['title'] ?? '');
    $date_birth = $_POST['date_birth'] ?? null;
    $college_code = trim($_POST['college_code'] ?? '');
    $course = trim($_POST['course'] ?? '');
    $blood_type = trim($_POST['blood_type'] ?? '');
    $is_active = (int)($_POST['is_active'] ?? 1);

    if ($person_id <= 0 || !$l_name || !$f_name || !$role_type) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Missing required fields']);
    }

    $stmt = $pdo->prepare("
      UPDATE tbl_person
      SET l_name = :l_name, f_name = :f_name, m_name = :m_name, 
          role_type = :role_type, title = :title, date_birth = :date_birth,
          college_code = :college_code, course = :course, 
          blood_type = :blood_type, is_active = :is_active
      WHERE person_id = :person_id
    ");
    $stmt->execute([
      'l_name' => $l_name,
      'f_name' => $f_name,
      'm_name' => $m_name,
      'role_type' => $role_type,
      'title' => $title,
      'date_birth' => $date_birth ?: null,
      'college_code' => $college_code ?: null,
      'course' => $course ?: null,
      'blood_type' => $blood_type ?: null,
      'is_active' => $is_active,
      'person_id' => $person_id
    ]);

    out(['ok'=>true,'message'=>'Player updated successfully']);
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'toggle_player_status') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $person_id = (int)($_POST['person_id'] ?? 0);
    $is_active = (int)($_POST['is_active'] ?? 0);

    if ($person_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Invalid person ID']);
    }

    $stmt = $pdo->prepare("
      UPDATE tbl_person
      SET is_active = :is_active
      WHERE person_id = :person_id
    ");
    $stmt->execute([
      'is_active' => $is_active,
      'person_id' => $person_id
    ]);

    out(['ok'=>true,'message'=>'Player status updated']);
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// TOURNAMENT MANAGER ENDPOINTS
// ==========================================

// Get teams registered in a tournament
if ($action === 'get_tournament_teams') {
  try {
    $tour_id = (int)$_GET['tour_id'];
    
    // Only show teams where this manager is assigned to at least one sport
    $sql = "SELECT DISTINCT
              tt.tour_team_id,
              tt.tour_id,
              tt.team_id,
              t.team_name,
              tt.registration_date,
              tt.is_active,
              (SELECT COUNT(DISTINCT sports_id) 
               FROM tbl_sports_team 
               WHERE tour_id = tt.tour_id AND team_id = tt.team_id 
                 AND tournament_manager_id = ?) as num_sports,
              (SELECT COUNT(DISTINCT person_id) 
               FROM tbl_team_athletes 
               WHERE tour_id = tt.tour_id AND team_id = tt.team_id AND is_active = 1) as num_athletes
            FROM tbl_tournament_teams tt
            JOIN tbl_team t ON t.team_id = tt.team_id
            INNER JOIN tbl_sports_team st ON st.tour_id = tt.tour_id 
                                           AND st.team_id = tt.team_id 
                                           AND st.tournament_manager_id = ?
            WHERE tt.tour_id = ? AND tt.is_active = 1
            ORDER BY t.team_name";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$person_id, $person_id, $tour_id]);
    out($stmt->fetchAll());
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

// Get sports for a team in a tournament
if ($action === 'get_team_sports') {
  try {
    $tour_id = (int)$_GET['tour_id'];
    $team_id = (int)$_GET['team_id'];
    
    // Verify access to this tournament
    $checkStmt = $pdo->prepare("
      SELECT COUNT(*) as has_access
      FROM tbl_sports_team
      WHERE tour_id = ? AND tournament_manager_id = ?
    ");
    $checkStmt->execute([$tour_id, $person_id]);
    $access = $checkStmt->fetch();
    
    if ($access['has_access'] == 0) {
      http_response_code(403);
      out(['ok' => false, 'error' => 'Access denied. You are not assigned to this tournament.']);
      return;
    }
    
    // Only show sports where this tournament manager is assigned
    $sql = "SELECT 
              st.tour_id,
              st.team_id,
              st.sports_id,
              s.sports_name,
              s.team_individual,
              s.men_women,
              CONCAT(COALESCE(coach.f_name, ''), ' ', COALESCE(coach.l_name, '')) as coach_name,
              CONCAT(COALESCE(tm.f_name, ''), ' ', COALESCE(tm.l_name, '')) as tournament_manager_name,
              (SELECT COUNT(DISTINCT person_id) 
               FROM tbl_team_athletes 
               WHERE tour_id = st.tour_id 
                 AND team_id = st.team_id 
                 AND sports_id = st.sports_id 
                 AND is_active = 1) as num_athletes
            FROM tbl_sports_team st
            JOIN tbl_sports s ON s.sports_id = st.sports_id
            LEFT JOIN tbl_person coach ON coach.person_id = st.coach_id
            LEFT JOIN tbl_person tm ON tm.person_id = st.tournament_manager_id
            WHERE st.tour_id = ? AND st.team_id = ? AND st.tournament_manager_id = ?
            ORDER BY s.sports_name";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$tour_id, $team_id, $person_id]);
    out($stmt->fetchAll());
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

// Get athletes for a sport in a team in a tournament
if ($action === 'get_sport_athletes') {
  try {
    $tour_id = (int)$_GET['tour_id'];
    $team_id = (int)$_GET['team_id'];
    $sports_id = (int)$_GET['sports_id'];
    
    // Verify this tournament manager is assigned to this specific sport
    $checkStmt = $pdo->prepare("
      SELECT COUNT(*) as has_access
      FROM tbl_sports_team
      WHERE tour_id = ? AND team_id = ? AND sports_id = ? AND tournament_manager_id = ?
    ");
    $checkStmt->execute([$tour_id, $team_id, $sports_id, $person_id]);
    $access = $checkStmt->fetch();
    
    if ($access['has_access'] == 0) {
      http_response_code(403);
      out(['ok' => false, 'error' => 'Access denied. You are not assigned to manage this sport.']);
      return;
    }
    
    $sql = "SELECT 
              ta.team_ath_id,
              ta.tour_id,
              ta.team_id,
              ta.sports_id,
              ta.person_id,
              ta.is_captain,
              p.f_name,
              p.l_name,
              p.m_name,
              p.role_type,
              p.college_code,
              p.course,
              CONCAT(p.f_name, ' ', p.l_name) as full_name,
              COALESCE(vs.height, 0) as height,
              COALESCE(vs.weight, 0) as weight,
              ast.scholarship_name
            FROM tbl_team_athletes ta
            JOIN tbl_person p ON p.person_id = ta.person_id
            LEFT JOIN tbl_vital_signs vs ON vs.person_id = p.person_id
            LEFT JOIN tbl_ath_status ast ON ast.person_id = p.person_id
            WHERE ta.tour_id = ? AND ta.team_id = ? AND ta.sports_id = ? AND ta.is_active = 1
            ORDER BY ta.is_captain DESC, p.l_name, p.f_name";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$tour_id, $team_id, $sports_id]);
    out($stmt->fetchAll());
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

// Get all sports (for adding to teams)
if ($action === 'all_sports') {
  try {
    $sql = "SELECT sports_id, sports_name, team_individual, men_women, 
                   num_req_players, num_res_players
            FROM tbl_sports 
            WHERE is_active = 1
            ORDER BY sports_name";
    
    $stmt = $pdo->query($sql);
    out($stmt->fetchAll());
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

// Get tournament manager's assignments
if ($action === 'my_assignments') {
  try {
    $sql = "SELECT DISTINCT
              t.tour_id,
              t.tour_name,
              tm.team_id,
              team.team_name,
              st.sports_id,
              s.sports_name,
              s.team_individual,
              s.men_women,
              st.tournament_manager_id
            FROM tbl_sports_team st
            JOIN tbl_tournament t ON t.tour_id = st.tour_id
            JOIN tbl_team team ON team.team_id = st.team_id
            JOIN tbl_sports s ON s.sports_id = st.sports_id
            LEFT JOIN tbl_tournament_teams tm ON tm.tour_id = st.tour_id AND tm.team_id = st.team_id
            WHERE st.tournament_manager_id = ?
            ORDER BY t.tour_name, team.team_name, s.sports_name";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$person_id]);
    
    error_log("My assignments for person_id " . $person_id . ": " . count($stmt->fetchAll()) . " records");
    
    // Re-execute to get the data (fetchAll consumed it)
    $stmt->execute([$person_id]);
    out($stmt->fetchAll());
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

// ==========================================
// GET MATCH PARTICIPANTS
// ==========================================



http_response_code(404);
out(['ok'=>false,'message'=>'Unknown action']);