<?php
// athlete/api.php - Updated to handle coach as trainor

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../auth/guard.php';

// Accept both 'athlete' and 'athlete/player' roles
$user_role = $_SESSION['user']['user_role'] ?? '';
$normalized_role = strtolower(str_replace(['/', ' '], '_', trim($user_role)));

if ($normalized_role !== 'athlete' && $normalized_role !== 'athlete_player') {
    http_response_code(403);
    out(['ok' => false, 'message' => 'Access denied. Athletes only.']);
}

header("Content-Type: application/json; charset=utf-8");

$user_id = (int)$_SESSION['user']['user_id'];
$person_id = (int)$_SESSION['user']['person_id'];
$sports_id = (int)($_SESSION['user']['sports_id'] ?? 0);

$action = $_GET['action'] ?? '';

function out($data) {
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

// Read JSON input for POST/PUT/DELETE requests
$input = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT' || $_SERVER['REQUEST_METHOD'] === 'DELETE') {
  $raw_input = file_get_contents('php://input');
  if ($raw_input) {
    $input = json_decode($raw_input, true) ?? [];
  }
}

// ==========================================
// OVERVIEW ATTENDANCE RATE
// ==========================================

if ($action === 'overview_attendance_rate') {
  try {
    error_log("OVERVIEW_ATTENDANCE_RATE: coach_id={$coach_person_id}, sports_id={$sports_id}");
    
    // Get all teams for this coach
    $teams_stmt = $pdo->prepare("
      SELECT team_id 
      FROM tbl_sports_team 
      WHERE coach_id = :coach_id AND sports_id = :sports_id
    ");
    $teams_stmt->execute([
      'coach_id' => $coach_person_id,
      'sports_id' => $sports_id
    ]);
    $coach_teams = $teams_stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (empty($coach_teams)) {
      out(['avg_attendance_rate' => 0]);
      return;
    }
    
    $team_ids_placeholders = implode(',', array_map('intval', $coach_teams));
    
    // Calculate average attendance rate across all sessions
    $stmt = $pdo->prepare("
      SELECT 
        COUNT(DISTINCT sp.person_id, ts.sked_id) as total_expected,
        COUNT(DISTINCT CASE WHEN ta.is_present = 1 THEN CONCAT(ta.person_id, '-', ta.sked_id) END) as total_present
      FROM tbl_train_sked ts
      LEFT JOIN tbl_train_sked_participants sp ON sp.sked_id = ts.sked_id
      LEFT JOIN tbl_train_attend ta ON ta.sked_id = ts.sked_id AND ta.person_id = sp.person_id
      WHERE ts.team_id IN ({$team_ids_placeholders})
        AND ts.is_active = 1
    ");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $total_expected = (int)$result['total_expected'];
    $total_present = (int)$result['total_present'];
    
    $avg_attendance_rate = $total_expected > 0 
      ? round(($total_present / $total_expected) * 100) 
      : 0;
    
    error_log("OVERVIEW_ATTENDANCE_RATE: expected={$total_expected}, present={$total_present}, rate={$avg_attendance_rate}%");
    
    out(['avg_attendance_rate' => $avg_attendance_rate]);
  } catch (PDOException $e) {
    error_log("OVERVIEW_ATTENDANCE_RATE ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// ATHLETE ENDPOINTS - FILTERED BY SPORTS_ID
// ==========================================

// ==========================================
// ATHLETE RATINGS & SCORES
// ==========================================

// Replace the my_ratings action in api.php with this fixed version

if ($action === 'my_ratings') {
  try {
    error_log("MY_RATINGS: person_id={$person_id}, sports_id={$sports_id}");
    
    // Get athlete's training performance ratings with evaluator
    $stmt = $pdo->prepare("
      SELECT 
        tp.perf_id,
        tp.rating,
        tp.date_eval,
        tp.team_id,
        ta.activity_name,
        ta.duration,
        ta.repetition,
        t.team_name,
        s.sports_name
      FROM tbl_train_perf tp
      JOIN tbl_training_activity ta ON ta.activity_id = tp.activitity_id
      JOIN tbl_sports s ON s.sports_id = ta.sports_id
      LEFT JOIN tbl_team t ON t.team_id = tp.team_id
      WHERE tp.person_id = :person_id
        AND ta.sports_id = :sports_id
      ORDER BY tp.date_eval DESC
      LIMIT 100
    ");
    $stmt->execute([
      'person_id' => $person_id,
      'sports_id' => $sports_id
    ]);
    $ratings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Now get evaluator for each rating
    foreach ($ratings as &$rating) {
      $evaluator_name = 'N/A';
      
      if ($rating['team_id']) {
        // Team sport - get coach/trainor from tbl_sports_team
        // Use the same logic as my_teams to get the BEST record
        $eval_stmt = $pdo->prepare("
          SELECT 
            CASE 
              WHEN coach.person_id IS NOT NULL 
              THEN TRIM(CONCAT(coach.f_name, ' ', coach.l_name))
              WHEN p1.person_id IS NOT NULL 
              THEN TRIM(CONCAT(p1.f_name, ' ', p1.l_name))
              WHEN p2.person_id IS NOT NULL 
              THEN TRIM(CONCAT(p2.f_name, ' ', p2.l_name))
              WHEN p3.person_id IS NOT NULL 
              THEN TRIM(CONCAT(p3.f_name, ' ', p3.l_name))
              ELSE 'N/A'
            END as evaluator_name
          FROM (
            -- Get the BEST tbl_sports_team record (prioritize non-NULL coach_id)
            SELECT team_id, sports_id, coach_id, trainor1_id, trainor2_id, trainor3_id
            FROM tbl_sports_team
            WHERE team_id = :team_id 
              AND sports_id = :sports_id
              AND (team_id, sports_id, COALESCE(coach_id, 0)) IN (
                SELECT team_id, sports_id, MAX(COALESCE(coach_id, 0))
                FROM tbl_sports_team
                WHERE team_id = :team_id2 
                  AND sports_id = :sports_id2
                GROUP BY team_id, sports_id
              )
            LIMIT 1
          ) st
          LEFT JOIN tbl_person coach ON coach.person_id = st.coach_id
          LEFT JOIN tbl_person p1 ON p1.person_id = st.trainor1_id
          LEFT JOIN tbl_person p2 ON p2.person_id = st.trainor2_id
          LEFT JOIN tbl_person p3 ON p3.person_id = st.trainor3_id
          LIMIT 1
        ");
        $eval_stmt->execute([
          'team_id' => $rating['team_id'],
          'team_id2' => $rating['team_id'],
          'sports_id' => $sports_id,
          'sports_id2' => $sports_id
        ]);
        $eval_result = $eval_stmt->fetch();
        
        if ($eval_result && $eval_result['evaluator_name'] !== 'N/A') {
          $evaluator_name = $eval_result['evaluator_name'];
        }
      }
      
      $rating['evaluator_name'] = $evaluator_name;
    }
    unset($rating); // Break reference
    
    error_log("MY_RATINGS: Found " . count($ratings) . " ratings");
    out(['ratings' => $ratings]);
  } catch (PDOException $e) {
    error_log("MY_RATINGS ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}



// Replace the my_scores action in api.php with this:

if ($action === 'my_scores') {
  try {
    error_log("MY_SCORES: person_id={$person_id}, sports_id={$sports_id}");
    
    // First, get all teams this athlete belongs to
    $teams_stmt = $pdo->prepare("
      SELECT DISTINCT team_id 
      FROM tbl_team_athletes 
      WHERE person_id = :person_id 
        AND is_active = 1
    ");
    $teams_stmt->execute(['person_id' => $person_id]);
    $team_ids = $teams_stmt->fetchAll(PDO::FETCH_COLUMN);
    
    error_log("MY_SCORES: Athlete is in teams: " . json_encode($team_ids));
    
    // Build the query based on whether athlete has teams
    if (empty($team_ids)) {
      // No teams - only check individual scores filtered by sports_id
      $where_clause = "WHERE cs.athlete_id = :person_id AND m.sports_id = :sports_id";
      $score_type_case = "
        CASE 
          WHEN cs.athlete_id = :person_id2 THEN 'Individual'
          ELSE 'Unknown'
        END as score_type
      ";
      $params = [
        'person_id' => $person_id,
        'person_id2' => $person_id,
        'sports_id' => $sports_id
      ];
    } else {
      // Has teams - check both individual scores AND team scores, filtered by sports_id
      $team_placeholders = implode(',', array_map('intval', $team_ids));
      $where_clause = "WHERE (cs.athlete_id = :person_id OR cs.team_id IN ({$team_placeholders})) AND m.sports_id = :sports_id";
      $score_type_case = "
        CASE 
          WHEN cs.athlete_id = :person_id2 THEN 'Individual'
          WHEN cs.team_id IS NOT NULL THEN 'Team'
          ELSE 'Unknown'
        END as score_type
      ";
      $params = [
        'person_id' => $person_id,
        'person_id2' => $person_id,
        'sports_id' => $sports_id
      ];
    }
    
    // Get competition scores - both individual and team
    $sql = "
      SELECT 
        cs.competetors_score_id,
        cs.score,
        cs.rank_no,
        cs.medal_type,
        cs.match_id,
        cs.tour_id,
        cs.team_id,
        cs.athlete_id,
        m.sked_date,
        m.sked_time,
        m.match_type,
        m.sports_id as match_sports_id,
        m.sports_type,
        m.game_no,
        s.sports_name,
        tour.tour_name,
        t.team_name,
        v.venue_name,
        CASE 
          WHEN cs.medal_type = 'gold' THEN '🥇 Gold'
          WHEN cs.medal_type = 'silver' THEN '🥈 Silver'
          WHEN cs.medal_type = 'bronze' THEN '🥉 Bronze'
          ELSE 'No Medal'
        END as medal_display,
        {$score_type_case}
      FROM tbl_comp_score cs
      LEFT JOIN tbl_match m ON m.match_id = cs.match_id
      LEFT JOIN tbl_tournament tour ON tour.tour_id = cs.tour_id
      LEFT JOIN tbl_sports s ON s.sports_id = m.sports_id
      LEFT JOIN tbl_team t ON t.team_id = cs.team_id
      LEFT JOIN tbl_game_venue v ON v.venue_id = m.venue_id
      {$where_clause}
      GROUP BY cs.competetors_score_id
      ORDER BY 
        COALESCE(m.game_no, 999999) ASC,
        COALESCE(m.sked_date, '9999-12-31') ASC, 
        COALESCE(m.sked_time, '00:00:00') ASC,
        cs.competetors_score_id ASC
      LIMIT 100
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $scores = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("MY_SCORES: Found " . count($scores) . " total scores (individual + team)");
    
    // Debug: Log sample data
    if (count($scores) > 0) {
      error_log("MY_SCORES SAMPLE: " . json_encode($scores[0]));
    } else {
      // Additional debug - check raw data
      $debug_stmt = $pdo->prepare("SELECT * FROM tbl_comp_score LIMIT 5");
      $debug_stmt->execute();
      $debug_scores = $debug_stmt->fetchAll(PDO::FETCH_ASSOC);
      error_log("MY_SCORES DEBUG - Sample tbl_comp_score records: " . json_encode($debug_scores));
      
      if (!empty($team_ids)) {
        $team_placeholders_check = implode(',', array_map('intval', $team_ids));
        $team_check = $pdo->prepare("SELECT COUNT(*) as cnt FROM tbl_comp_score WHERE team_id IN ({$team_placeholders_check})");
        $team_check->execute();
        $team_count = $team_check->fetch()['cnt'];
        error_log("MY_SCORES DEBUG - Scores for athlete's teams: {$team_count}");
      }
    }
    
    out(['scores' => $scores]);
  } catch (PDOException $e) {
    error_log("MY_SCORES ERROR: " . $e->getMessage());
    error_log("MY_SCORES ERROR TRACE: " . $e->getTraceAsString());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}



if ($action === 'my_performance_stats') {
  try {
    error_log("MY_PERFORMANCE_STATS: person_id={$person_id}, sports_id={$sports_id}");
    
    // Calculate average rating
    $rating_stmt = $pdo->prepare("
      SELECT AVG(tp.rating) as avg_rating, COUNT(*) as total_evaluations
      FROM tbl_train_perf tp
      JOIN tbl_training_activity ta ON ta.activity_id = tp.activitity_id
      WHERE tp.person_id = :person_id
        AND ta.sports_id = :sports_id
    ");
    $rating_stmt->execute([
      'person_id' => $person_id,
      'sports_id' => $sports_id
    ]);
    $rating_data = $rating_stmt->fetch();
    
    // Count medals
    $medal_stmt = $pdo->prepare("
      SELECT 
        COUNT(CASE WHEN medal_type = 'gold' THEN 1 END) as gold_count,
        COUNT(CASE WHEN medal_type = 'silver' THEN 1 END) as silver_count,
        COUNT(CASE WHEN medal_type = 'bronze' THEN 1 END) as bronze_count,
        COUNT(*) as total_competitions
      FROM tbl_comp_score cs
      JOIN tbl_match m ON m.match_id = cs.match_id
      WHERE cs.athlete_id = :person_id
        AND m.sports_id = :sports_id
    ");
    $medal_stmt->execute([
      'person_id' => $person_id,
      'sports_id' => $sports_id
    ]);
    $medal_data = $medal_stmt->fetch();
    
    out([
      'avg_rating' => round($rating_data['avg_rating'] ?? 0, 1),
      'total_evaluations' => (int)($rating_data['total_evaluations'] ?? 0),
      'gold_medals' => (int)($medal_data['gold_count'] ?? 0),
      'silver_medals' => (int)($medal_data['silver_count'] ?? 0),
      'bronze_medals' => (int)($medal_data['bronze_count'] ?? 0),
      'total_competitions' => (int)($medal_data['total_competitions'] ?? 0)
    ]);
  } catch (PDOException $e) {
    error_log("MY_PERFORMANCE_STATS ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'match_participants') {
  try {
    $match_id = (int)($_GET['match_id'] ?? 0);
    
    if ($match_id <= 0) {
      http_response_code(400);
      out(['ok' => false, 'message' => 'Invalid match ID']);
    }

    error_log("MATCH_PARTICIPANTS: match_id={$match_id}, person_id={$person_id}");

    // Get match info to verify it's accessible to this athlete
    $match_stmt = $pdo->prepare("
      SELECT m.sports_id, m.sports_type 
      FROM tbl_match m
      WHERE m.match_id = :match_id
    ");
    $match_stmt->execute(['match_id' => $match_id]);
    $match = $match_stmt->fetch();
    
    if (!$match) {
      http_response_code(404);
      out(['ok' => false, 'message' => 'Match not found']);
    }

    // Get all participants for this match
    $stmt = $pdo->prepare("
      SELECT 
        mp.participant_id,
        mp.athlete_id,
        mp.team_id,
        mp.status,
        CONCAT(p.f_name, ' ', p.l_name) as athlete_name,
        t.team_name,
        CASE WHEN mp.athlete_id = :person_id THEN 1 ELSE 0 END as is_current_user
      FROM tbl_match_participants mp
      LEFT JOIN tbl_person p ON p.person_id = mp.athlete_id
      LEFT JOIN tbl_team t ON t.team_id = mp.team_id
      WHERE mp.match_id = :match_id
      ORDER BY is_current_user DESC, athlete_name, team_name
    ");
    $stmt->execute([
      'match_id' => $match_id,
      'person_id' => $person_id
    ]);
    $participants = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("MATCH_PARTICIPANTS: Found " . count($participants) . " participants");
    out($participants);
    
  } catch (PDOException $e) {
    error_log("MATCH_PARTICIPANTS ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// Replace the my_teams action in api.php with this fixed version

// Replace the my_teams action in api.php with this fixed version

if ($action === 'my_teams') {
  try {
    error_log("MY_TEAMS: person_id={$person_id}, sports_id={$sports_id}");
    
    // First, try to find coach from tbl_sports_team
    // IMPORTANT: Use subquery to get the BEST sports_team record (one with coach_id first)
    $stmt = $pdo->prepare("
      SELECT 
        ta.team_id,
        ta.sports_id,
        ta.is_captain,
        t.team_name,
        s.sports_name,
        CASE 
          WHEN coach.person_id IS NOT NULL 
          THEN TRIM(CONCAT(COALESCE(coach.f_name, ''), ' ', COALESCE(coach.l_name, '')))
          ELSE 'TBA'
        END AS coach_name,
        TRIM(BOTH ', ' FROM CONCAT(
          CASE WHEN p1.person_id IS NOT NULL THEN TRIM(CONCAT(p1.f_name, ' ', p1.l_name)) ELSE '' END,
          CASE WHEN p2.person_id IS NOT NULL THEN CONCAT(', ', TRIM(CONCAT(p2.f_name, ' ', p2.l_name))) ELSE '' END,
          CASE WHEN p3.person_id IS NOT NULL THEN CONCAT(', ', TRIM(CONCAT(p3.f_name, ' ', p3.l_name))) ELSE '' END
        )) AS trainor_names
      FROM tbl_team_athletes ta
      JOIN tbl_team t ON t.team_id = ta.team_id
      JOIN tbl_sports s ON s.sports_id = ta.sports_id
      LEFT JOIN (
        -- Get the BEST tbl_sports_team record (prioritize non-NULL coach_id)
        SELECT team_id, sports_id, coach_id, trainor1_id, trainor2_id, trainor3_id
        FROM tbl_sports_team
        WHERE (team_id, sports_id, COALESCE(coach_id, 0)) IN (
          SELECT team_id, sports_id, MAX(COALESCE(coach_id, 0))
          FROM tbl_sports_team
          GROUP BY team_id, sports_id
        )
        GROUP BY team_id, sports_id
      ) st ON st.team_id = ta.team_id AND st.sports_id = ta.sports_id
      LEFT JOIN tbl_person coach ON coach.person_id = st.coach_id
      LEFT JOIN tbl_person p1 ON p1.person_id = st.trainor1_id
      LEFT JOIN tbl_person p2 ON p2.person_id = st.trainor2_id
      LEFT JOIN tbl_person p3 ON p3.person_id = st.trainor3_id
      WHERE ta.person_id = :person_id
        AND ta.sports_id = :sports_id
        AND ta.is_active = 1
      ORDER BY t.team_name
    ");
    $stmt->execute(['person_id' => $person_id, 'sports_id' => $sports_id]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // DEBUG: Log all raw results
    error_log("MY_TEAMS DEBUG: Total rows from SQL = " . count($results));
    foreach ($results as $idx => $row) {
      error_log("MY_TEAMS DEBUG Row {$idx}: team_id={$row['team_id']}, team_name={$row['team_name']}, coach_id=" . ($row['coach_id'] ?? 'NULL') . ", coach_name='{$row['coach_name']}', trainor_names='{$row['trainor_names']}'");
    }
    
    // Remove duplicates by team_id, keeping the one WITH coach info
    $uniqueTeams = [];
    $teamData = [];
    
    foreach ($results as $row) {
      $teamId = $row['team_id'];
      
      // Clean coach name
      $row['coach_name'] = trim($row['coach_name']);
      if (empty($row['coach_name']) || $row['coach_name'] === ' ') {
        $row['coach_name'] = 'TBA';
      }
      
      // Clean trainor names
      $row['trainor_names'] = trim($row['trainor_names']);
      if (empty($row['trainor_names'])) {
        $row['trainor_names'] = '';
      }
      
      // If we haven't seen this team yet, add it
      if (!isset($teamData[$teamId])) {
        $teamData[$teamId] = $row;
      } else {
        // We've seen this team - keep the one with better coach info
        $existing = $teamData[$teamId];
        
        // If current row has a real coach name and existing doesn't, replace it
        if ($row['coach_name'] !== 'TBA' && $existing['coach_name'] === 'TBA') {
          error_log("MY_TEAMS: Replacing TBA with real coach for team_id={$teamId}");
          $teamData[$teamId] = $row;
        }
        // If current row has trainor names and existing doesn't, replace it
        else if (!empty($row['trainor_names']) && empty($existing['trainor_names'])) {
          error_log("MY_TEAMS: Replacing with better trainor info for team_id={$teamId}");
          $teamData[$teamId] = $row;
        } else {
          error_log("MY_TEAMS: Skipping duplicate team_id={$teamId} (keeping existing)");
        }
      }
    }
    
    // Convert associative array back to indexed array
    $uniqueTeams = array_values($teamData);
    
    error_log("MY_TEAMS: Found " . count($uniqueTeams) . " unique teams (from " . count($results) . " total rows)");
    if (count($uniqueTeams) > 0) {
      error_log("MY_TEAMS SAMPLE: " . json_encode($uniqueTeams[0]));
    }
    
    out($uniqueTeams);
  } catch (PDOException $e) {
    error_log("MY_TEAMS ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// Replace the team_players action in api.php with this:

if ($action === 'team_players') {
  try {
    $team_id = isset($_GET['team_id']) ? (int)$_GET['team_id'] : null;
    
    error_log("TEAM_PLAYERS: person_id={$person_id}, sports_id={$sports_id}, team_id={$team_id}");

    // First, get all teams this athlete belongs to
    $athlete_teams_stmt = $pdo->prepare("
      SELECT DISTINCT team_id 
      FROM tbl_team_athletes 
      WHERE person_id = :person_id 
        AND sports_id = :sports_id 
        AND is_active = 1
    ");
    $athlete_teams_stmt->execute([
      'person_id' => $person_id,
      'sports_id' => $sports_id
    ]);
    $athlete_team_ids = $athlete_teams_stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // If athlete has no teams, return empty
    if (empty($athlete_team_ids)) {
      error_log("TEAM_PLAYERS: Athlete not in any teams");
      out([]);
      exit;
    }

    // Build the WHERE clause
    if ($team_id) {
      // Verify the athlete is actually in this team
      if (!in_array($team_id, $athlete_team_ids)) {
        error_log("TEAM_PLAYERS: Athlete not authorized to view team_id={$team_id}");
        out([]);
        exit;
      }
      
      // Show only the selected team
      $where_clause = "AND ta.team_id = :team_id";
      $params = [
        'sports_id' => $sports_id,
        'team_id' => $team_id
      ];
    } else {
      // Show all players from athlete's teams
      $placeholders = implode(',', array_fill(0, count($athlete_team_ids), '?'));
      $where_clause = "AND ta.team_id IN ($placeholders)";
      $params = array_merge([$sports_id], $athlete_team_ids);
    }

    $sql = "
      SELECT DISTINCT
        ta.person_id,
        CONCAT(p.f_name, ' ', p.l_name) AS player_name,
        t.team_name,
        ta.is_captain,
        s.sports_name,
        p.f_name
      FROM tbl_team_athletes ta
      JOIN tbl_person p ON p.person_id = ta.person_id
      JOIN tbl_team t ON t.team_id = ta.team_id
      JOIN tbl_sports s ON s.sports_id = ta.sports_id
      WHERE ta.is_active = 1
        AND ta.sports_id = ?
        {$where_clause}
      GROUP BY ta.person_id, ta.team_id, ta.sports_id, p.f_name
      ORDER BY p.f_name ASC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $results = $stmt->fetchAll();
    
    error_log("TEAM_PLAYERS: Found " . count($results) . " players");
    out($results);
  } catch (PDOException $e) {
    error_log("TEAM_PLAYERS ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// Replace the my_matches action in api.php with this:

// Replace the my_matches action in api.php with this:

if ($action === 'my_matches') {
  try {
    error_log("MY_MATCHES: person_id={$person_id}, sports_id={$sports_id}");
    
    // Get all teams this athlete belongs to
    $athlete_teams_stmt = $pdo->prepare("
      SELECT DISTINCT team_id 
      FROM tbl_team_athletes 
      WHERE person_id = :person_id 
        AND sports_id = :sports_id 
        AND is_active = 1
    ");
    $athlete_teams_stmt->execute([
      'person_id' => $person_id,
      'sports_id' => $sports_id
    ]);
    $team_ids = $athlete_teams_stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (empty($team_ids)) {
      error_log("MY_MATCHES: No teams found for athlete");
      out([]);
      return;
    }
    
    $team_ids_placeholders = implode(',', array_map('intval', $team_ids));
    
    // Modified query to get matches with scores
    $stmt = $pdo->prepare("
      SELECT DISTINCT
        m.match_id,
        m.game_no,
        m.sked_date,
        m.sked_time,
        m.match_type,
        m.sports_type,
        s.sports_name,
        m.team_a_id,
        m.team_b_id,
        ta.team_name AS team_a_name,
        tb.team_name AS team_b_name,
        v.venue_name,
        v.venue_building,
        v.venue_room,
        m.winner_team_id,
        m.winner_athlete_id,
        tour.tour_name,
        mp.status as participation_status,
        CASE 
          WHEN m.team_a_id IN ({$team_ids_placeholders}) THEN m.team_a_id
          WHEN m.team_b_id IN ({$team_ids_placeholders}) THEN m.team_b_id
          ELSE mp.team_id
        END as my_team_id,
        CASE 
          WHEN m.team_a_id IN ({$team_ids_placeholders}) THEN ta.team_name
          WHEN m.team_b_id IN ({$team_ids_placeholders}) THEN tb.team_name
          ELSE mt.team_name
        END as my_team_name,
        -- Get scores for team A
        (SELECT cs.score FROM tbl_comp_score cs 
         WHERE cs.match_id = m.match_id 
           AND (cs.team_id = m.team_a_id OR (cs.athlete_id IS NOT NULL AND m.sports_type = 'individual'))
         LIMIT 1) as team_a_score,
        -- Get scores for team B
        (SELECT cs.score FROM tbl_comp_score cs 
         WHERE cs.match_id = m.match_id 
           AND (cs.team_id = m.team_b_id OR (cs.athlete_id IS NOT NULL AND m.sports_type = 'individual'))
         ORDER BY cs.competetors_score_id DESC
         LIMIT 1) as team_b_score
      FROM tbl_match m
      JOIN tbl_sports s ON s.sports_id = m.sports_id
      LEFT JOIN tbl_team ta ON ta.team_id = m.team_a_id
      LEFT JOIN tbl_team tb ON tb.team_id = m.team_b_id
      LEFT JOIN tbl_game_venue v ON v.venue_id = m.venue_id
      LEFT JOIN tbl_tournament tour ON tour.tour_id = m.tour_id
      LEFT JOIN tbl_match_participants mp ON mp.match_id = m.match_id 
        AND mp.athlete_id = :person_id
      LEFT JOIN tbl_team mt ON mt.team_id = mp.team_id
      WHERE m.sports_id = :sports_id
        AND (
          -- Team matches where athlete's team is participating
          (m.sports_type = 'team' AND (
            m.team_a_id IN ({$team_ids_placeholders}) 
            OR m.team_b_id IN ({$team_ids_placeholders})
          ))
          -- Individual matches where athlete is registered
          OR (m.sports_type = 'individual' AND mp.athlete_id = :person_id2)
        )
      ORDER BY 
        COALESCE(m.game_no, 999999) ASC,
        m.sked_date ASC,
        m.sked_time ASC
    ");
    
    $stmt->execute([
      'person_id' => $person_id,
      'person_id2' => $person_id,
      'sports_id' => $sports_id
    ]);
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate match result in PHP
    foreach ($result as &$match) {
      // Determine match result
      if ($match['winner_athlete_id'] == $person_id) {
        $match['match_result'] = 'Won';
      } else if ($match['winner_team_id'] == $match['my_team_id'] && $match['my_team_id']) {
        $match['match_result'] = 'Won';
      } else if ($match['winner_team_id'] || $match['winner_athlete_id']) {
        $match['match_result'] = 'Lost';
      } else {
        $match['match_result'] = 'Pending';
      }
      
      // Set defaults
      $match['team_a_name'] = $match['team_a_name'] ?? 'TBA';
      $match['team_b_name'] = $match['team_b_name'] ?? 'TBA';
      $match['venue_name'] = $match['venue_name'] ?? 'TBA';
      $match['match_type'] = $match['match_type'] ?? 'Match';
    }
    unset($match); // Break reference
    
    error_log("MY_MATCHES: Found " . count($result) . " matches");
    out($result);
    
  } catch (PDOException $e) {
    error_log("MY_MATCHES ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'training_schedule') {
  try {
    error_log("TRAINING_SCHEDULE: person_id={$person_id}, sports_id={$sports_id}");
    
    // Get athlete's teams
    $teams_stmt = $pdo->prepare("
      SELECT DISTINCT team_id 
      FROM tbl_team_athletes 
      WHERE person_id = :person_id 
        AND sports_id = :sports_id 
        AND is_active = 1
    ");
    $teams_stmt->execute([
      'person_id' => $person_id,
      'sports_id' => $sports_id
    ]);
    $team_ids = $teams_stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (empty($team_ids)) {
      out([]);
      exit;
    }
    
    $placeholders = implode(',', array_fill(0, count($team_ids), '?'));
    
    // Only show sessions where this athlete is a participant
    $stmt = $pdo->prepare("
      SELECT DISTINCT
        ts.sked_id,
        ts.team_id,
        ts.sked_date,
        ts.sked_time,
        t.team_name,
        IFNULL(v.venue_name, 'TBA') as venue_name,
        v.venue_building,
        v.venue_room,
        ta_attend.is_present,
        CONCAT(
          IFNULL(trainor.f_name, ''), 
          ' ', 
          IFNULL(trainor.l_name, '')
        ) as trainor_names
      FROM tbl_train_sked ts
      JOIN tbl_team t ON t.team_id = ts.team_id
      LEFT JOIN tbl_person trainor ON trainor.person_id = ts.trainor_id
      LEFT JOIN tbl_game_venue v ON v.venue_id = ts.venue_id
      LEFT JOIN tbl_train_attend ta_attend ON ta_attend.sked_id = ts.sked_id 
        AND ta_attend.person_id = ?
      -- Check if athlete is a participant in this session
      LEFT JOIN tbl_train_sked_participants tsp ON tsp.sked_id = ts.sked_id 
        AND tsp.person_id = ?
      WHERE ts.team_id IN ($placeholders)
        AND ts.is_active = 1
        AND (
          -- Either athlete is explicitly listed as participant
          tsp.person_id IS NOT NULL
          -- OR session has no specific participants (team-wide session)
          OR NOT EXISTS (
            SELECT 1 FROM tbl_train_sked_participants 
            WHERE sked_id = ts.sked_id
          )
        )
      ORDER BY ts.sked_date DESC, ts.sked_time DESC
    ");
    
    $params = array_merge([$person_id, $person_id], $team_ids);
    $stmt->execute($params);
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("TRAINING_SCHEDULE: Found " . count($result) . " sessions for this athlete");
    out($result);
  } catch (PDOException $e) {
    error_log("TRAINING_SCHEDULE ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'rankings') {
  try {
    $team_id = (int)($_GET['team_id'] ?? 0);
    
    if ($team_id <= 0) {
      http_response_code(400);
      out(['ok' => false, 'message' => 'Invalid team ID']);
    }

    error_log("RANKINGS: team_id={$team_id}, sports_id={$sports_id}");

    // First verify the athlete is in this team
    $verify_stmt = $pdo->prepare("
      SELECT 1 
      FROM tbl_team_athletes 
      WHERE person_id = :person_id 
        AND team_id = :team_id 
        AND sports_id = :sports_id 
        AND is_active = 1
    ");
    $verify_stmt->execute([
      'person_id' => $person_id,
      'team_id' => $team_id,
      'sports_id' => $sports_id
    ]);
    
    if (!$verify_stmt->fetch()) {
      error_log("RANKINGS: Athlete not authorized to view team_id={$team_id}");
      http_response_code(403);
      out(['ok' => false, 'message' => 'You are not authorized to view rankings for this team']);
    }

    // Get ONLY this team's ranking/standing
    $stmt = $pdo->prepare("
      SELECT 
        ts.team_id,
        t.team_name,
        s.sports_name,
        ts.no_games_played,
        ts.no_win,
        ts.no_loss,
        ts.no_draw,
        ts.no_gold,
        ts.no_silver,
        ts.no_bronze
      FROM tbl_team_standing ts
      JOIN tbl_team t ON t.team_id = ts.team_id
      JOIN tbl_sports s ON s.sports_id = ts.sports_id
      WHERE ts.team_id = :team_id
        AND ts.sports_id = :sports_id
      LIMIT 1
    ");
    $stmt->execute([
      'team_id' => $team_id,
      'sports_id' => $sports_id
    ]);
    $result = $stmt->fetch();
    
    if ($result) {
      error_log("RANKINGS: Found ranking for team_id={$team_id}");
      out([$result]); // Return as array with single item
    } else {
      error_log("RANKINGS: No ranking found for team_id={$team_id}");
      out([]); // Return empty array
    }
  } catch (PDOException $e) {
    error_log("RANKINGS ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// TRAINEE ENDPOINTS
// ==========================================

if ($action === 'trainee_stats') {
  try {
    // Get all teams this athlete belongs to (filtered by sports_id)
    $athlete_teams_stmt = $pdo->prepare("
      SELECT DISTINCT team_id 
      FROM tbl_team_athletes 
      WHERE person_id = :person_id 
        AND sports_id = :sports_id 
        AND is_active = 1
    ");
    $athlete_teams_stmt->execute([
      'person_id' => $person_id,
      'sports_id' => $sports_id
    ]);
    $team_ids = $athlete_teams_stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (empty($team_ids)) {
      out([
        'sessions_attended' => 0,
        'attendance_rate' => 0,
        'streak' => 0,
        'total_hours' => 0
      ]);
      exit;
    }
    
    $team_ids_placeholders = implode(',', array_map('intval', $team_ids));
    
    // 1. SESSIONS THIS MONTH - Count attended sessions in current month
    $sessions_stmt = $pdo->prepare("
      SELECT COUNT(DISTINCT ta.sked_id) as count 
      FROM tbl_train_attend ta
      JOIN tbl_train_sked ts ON ts.sked_id = ta.sked_id
      WHERE ta.person_id = :person_id
        AND ta.is_present = 1
        AND ts.team_id IN ({$team_ids_placeholders})
        AND MONTH(ts.sked_date) = MONTH(CURRENT_DATE())
        AND YEAR(ts.sked_date) = YEAR(CURRENT_DATE())
        AND ts.is_active = 1
    ");
    $sessions_stmt->execute(['person_id' => $person_id]);
    $sessions_this_month = (int)$sessions_stmt->fetch()['count'];
    
    // 2. ATTENDANCE RATE - Calculate percentage
    $total_stmt = $pdo->prepare("
      SELECT COUNT(DISTINCT ta.sked_id) as count 
      FROM tbl_train_attend ta
      JOIN tbl_train_sked ts ON ts.sked_id = ta.sked_id
      WHERE ta.person_id = :person_id
        AND ts.team_id IN ({$team_ids_placeholders})
    ");
    $total_stmt->execute(['person_id' => $person_id]);
    $total_sessions = (int)$total_stmt->fetch()['count'];
    
    $present_stmt = $pdo->prepare("
      SELECT COUNT(DISTINCT ta.sked_id) as count 
      FROM tbl_train_attend ta
      JOIN tbl_train_sked ts ON ts.sked_id = ta.sked_id
      WHERE ta.person_id = :person_id
        AND ta.is_present = 1
        AND ts.team_id IN ({$team_ids_placeholders})
    ");
    $present_stmt->execute(['person_id' => $person_id]);
    $present_sessions = (int)$present_stmt->fetch()['count'];
    
    $attendance_rate = $total_sessions > 0 
      ? round(($present_sessions / $total_sessions) * 100) 
      : 0;
    
    // 3. CURRENT STREAK - Count consecutive attendances
    $streak_stmt = $pdo->prepare("
      SELECT ta.is_present, ts.sked_date, ts.sked_time
      FROM tbl_train_attend ta
      JOIN tbl_train_sked ts ON ts.sked_id = ta.sked_id
      WHERE ta.person_id = :person_id
        AND ts.team_id IN ({$team_ids_placeholders})
        AND ts.sked_date <= CURRENT_DATE()
      ORDER BY ts.sked_date DESC, ts.sked_time DESC
      LIMIT 100
    ");
    $streak_stmt->execute(['person_id' => $person_id]);
    $attendance_records = $streak_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $streak = 0;
    foreach ($attendance_records as $record) {
      if ($record['is_present'] == 1) {
        $streak++;
      } else {
        break;
      }
    }
    
    // 4. TOTAL SESSIONS - All attended sessions (lifetime)
    $total_attended_stmt = $pdo->prepare("
      SELECT COUNT(DISTINCT ta.sked_id) as count 
      FROM tbl_train_attend ta
      JOIN tbl_train_sked ts ON ts.sked_id = ta.sked_id
      WHERE ta.person_id = :person_id
        AND ta.is_present = 1
        AND ts.team_id IN ({$team_ids_placeholders})
    ");
    $total_attended_stmt->execute(['person_id' => $person_id]);
    $total_attended = (int)$total_attended_stmt->fetch()['count'];
    
    error_log("TRAINEE_STATS: person_id={$person_id}, sessions_month={$sessions_this_month}, rate={$attendance_rate}%, streak={$streak}, total={$total_attended}");
    
    out([
      'sessions_attended' => $sessions_this_month,
      'attendance_rate' => $attendance_rate,
      'streak' => $streak,
      'total_hours' => $total_attended
    ]);
  } catch (PDOException $e) {
    error_log("TRAINEE_STATS ERROR: " . $e->getMessage());
    http_response_code(500);
    out([
      'ok' => false, 
      'error' => $e->getMessage(),
      'sessions_attended' => 0,
      'attendance_rate' => 0,
      'streak' => 0,
      'total_hours' => 0
    ]);
  }
}

if ($action === 'upcoming_sessions') {
  try {
    error_log("UPCOMING_SESSIONS: person_id={$person_id}, sports_id={$sports_id}");
    
    // Get only the teams where this athlete is a member (filtered by sports_id)
    $teams_stmt = $pdo->prepare("
      SELECT DISTINCT team_id 
      FROM tbl_team_athletes 
      WHERE person_id = :person_id 
        AND sports_id = :sports_id 
        AND is_active = 1
    ");
    $teams_stmt->execute([
      'person_id' => $person_id,
      'sports_id' => $sports_id
    ]);
    $team_ids = $teams_stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (empty($team_ids)) {
      out([]);
      exit;
    }
    
    $placeholders = implode(',', array_fill(0, count($team_ids), '?'));
    
    // Only show sessions where this athlete is a participant
    $stmt = $pdo->prepare("
      SELECT DISTINCT
        ts.sked_id,
        ts.sked_date as training_date,
        ts.sked_time as start_time,
        '' as end_time,
        CONCAT(
          IFNULL(gv.venue_name, 'TBA'),
          CASE 
            WHEN gv.venue_building IS NOT NULL AND gv.venue_building != '' 
            THEN CONCAT(' - ', gv.venue_building)
            ELSE ''
          END
        ) as location,
        '' as description,
        t.team_name,
        'Training Session' as training_type,
        CONCAT(
          IFNULL(trainor.f_name, ''), 
          ' ', 
          IFNULL(trainor.l_name, '')
        ) as trainor_name
      FROM tbl_train_sked ts
      JOIN tbl_team t ON t.team_id = ts.team_id
      LEFT JOIN tbl_person trainor ON trainor.person_id = ts.trainor_id
      LEFT JOIN tbl_game_venue gv ON gv.venue_id = ts.venue_id
      -- Check if athlete is a participant in this session
      LEFT JOIN tbl_train_sked_participants tsp ON tsp.sked_id = ts.sked_id 
        AND tsp.person_id = ?
      WHERE ts.team_id IN ($placeholders)
        AND ts.sked_date >= CURRENT_DATE()
        AND ts.is_active = 1
        AND (
          -- Either athlete is explicitly listed as participant
          tsp.person_id IS NOT NULL
          -- OR session has no specific participants (team-wide session)
          OR NOT EXISTS (
            SELECT 1 FROM tbl_train_sked_participants 
            WHERE sked_id = ts.sked_id
          )
        )
      ORDER BY ts.sked_date, ts.sked_time
      LIMIT 5
    ");
    
    $params = array_merge([$person_id], $team_ids);
    $stmt->execute($params);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("UPCOMING_SESSIONS: Found " . count($results) . " sessions for this athlete");
    out($results);
  } catch (PDOException $e) {
    error_log("UPCOMING_SESSIONS ERROR: " . $e->getMessage());
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

if ($action === 'all_sessions') {
  try {
    // Get athlete's teams only (no trainee lookup needed since trainees are now athletes)
    $teams_stmt = $pdo->prepare("
      SELECT DISTINCT team_id 
      FROM tbl_team_athletes 
      WHERE person_id = :person_id 
        AND sports_id = :sports_id 
        AND is_active = 1
    ");
    $teams_stmt->execute([
      'person_id' => $person_id,
      'sports_id' => $sports_id
    ]);
    $team_ids = $teams_stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (empty($team_ids)) {
      out([]);
      exit;
    }
    
    $placeholders = implode(',', array_fill(0, count($team_ids), '?'));
    
    $stmt = $pdo->prepare("
      SELECT DISTINCT
        ts.sked_id,
        ts.sked_date as training_date,
        ts.sked_time as start_time,
        '' as end_time,
        CONCAT(
          IFNULL(gv.venue_name, 'TBA'),
          CASE 
            WHEN gv.venue_building IS NOT NULL AND gv.venue_building != '' 
            THEN CONCAT(' - ', gv.venue_building)
            ELSE ''
          END
        ) as location,
        '' as description,
        t.team_name,
        'Training Session' as training_type,
        CONCAT(
          IFNULL(CONCAT(coach.f_name, ' ', coach.l_name), ''),
          CASE 
            WHEN p1.person_id IS NOT NULL AND (coach.person_id IS NULL OR coach.person_id != p1.person_id)
            THEN CONCAT(CASE WHEN coach.person_id IS NOT NULL THEN ', ' ELSE '' END, p1.f_name, ' ', p1.l_name)
            ELSE ''
          END,
          CASE 
            WHEN p2.person_id IS NOT NULL AND (coach.person_id IS NULL OR coach.person_id != p2.person_id) AND (p1.person_id IS NULL OR p1.person_id != p2.person_id)
            THEN CONCAT(', ', p2.f_name, ' ', p2.l_name)
            ELSE ''
          END,
          CASE 
            WHEN p3.person_id IS NOT NULL AND (coach.person_id IS NULL OR coach.person_id != p3.person_id) AND (p1.person_id IS NULL OR p1.person_id != p3.person_id) AND (p2.person_id IS NULL OR p2.person_id != p3.person_id)
            THEN CONCAT(', ', p3.f_name, ' ', p3.l_name)
            ELSE ''
          END
        ) as trainor_name
      FROM tbl_train_sked ts
      JOIN tbl_team t ON t.team_id = ts.team_id
      LEFT JOIN tbl_sports_team st ON st.team_id = ts.team_id
      LEFT JOIN tbl_person coach ON coach.person_id = st.coach_id
      LEFT JOIN tbl_game_venue gv ON gv.venue_id = ts.venue_id
      LEFT JOIN tbl_person p1 ON p1.person_id = st.trainor1_id
      LEFT JOIN tbl_person p2 ON p2.person_id = st.trainor2_id
      LEFT JOIN tbl_person p3 ON p3.person_id = st.trainor3_id
      WHERE ts.team_id IN ($placeholders)
        AND ts.is_active = 1
      ORDER BY ts.sked_date DESC, ts.sked_time DESC
      LIMIT 50
    ");
    $stmt->execute($team_ids);
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    error_log("ALL_SESSIONS ERROR: " . $e->getMessage());
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

if ($action === 'my_attendance') {
  try {
    error_log("MY_ATTENDANCE: person_id={$person_id}, sports_id={$sports_id}");
    
    // First get the athlete's team IDs
    $teams_stmt = $pdo->prepare("
      SELECT DISTINCT team_id 
      FROM tbl_team_athletes 
      WHERE person_id = :person_id 
        AND sports_id = :sports_id 
        AND is_active = 1
    ");
    $teams_stmt->execute([
      'person_id' => $person_id,
      'sports_id' => $sports_id
    ]);
    $team_ids = $teams_stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (empty($team_ids)) {
      error_log("MY_ATTENDANCE: No teams found for athlete");
      out([]);
      return;
    }
    
    $placeholders = implode(',', array_fill(0, count($team_ids), '?'));
    
    // Fixed query - get trainor from tbl_train_sked.trainor_id
    $stmt = $pdo->prepare("
      SELECT 
        ts.sked_id,
        ts.sked_date as training_date,
        ts.sked_time as start_time,
        ta.is_present,
        CASE 
          WHEN ta.is_present = 1 THEN 'present'
          ELSE 'absent'
        END as status,
        'Training Session' as training_type,
        CONCAT(
          IFNULL(trainor.f_name, ''), 
          ' ', 
          IFNULL(trainor.l_name, '')
        ) as trainor_name,
        'N/A' as duration
      FROM tbl_train_attend ta
      JOIN tbl_train_sked ts ON ts.sked_id = ta.sked_id
      LEFT JOIN tbl_person trainor ON trainor.person_id = ts.trainor_id
      WHERE ta.person_id = ?
        AND ts.team_id IN ($placeholders)
        AND ts.is_active = 1
      GROUP BY ts.sked_id, ta.is_present
      ORDER BY ts.sked_date DESC, ts.sked_time DESC
      LIMIT 100
    ");
    
    $params = array_merge([$person_id], $team_ids);
    $stmt->execute($params);
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("MY_ATTENDANCE: Found " . count($result) . " attendance records");
    out($result);
  } catch (PDOException $e) {
    error_log("MY_ATTENDANCE ERROR: " . $e->getMessage());
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

if ($action === 'my_programs') {
  try {
    $stmt = $pdo->prepare("
      SELECT 
        activity_id as program_id,
        activity_name as program_name,
        CONCAT(IFNULL(duration, ''), ' / ', IFNULL(repetition, '')) as description,
        4 as duration_weeks,
        'Improve fitness and skills' as goals,
        is_active
      FROM tbl_training_activity
      WHERE sports_id = ?
      AND is_active = 1
      ORDER BY activity_name
    ");
    $stmt->execute([$sports_id]);
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    out([]);
  }
}


// ==========================================
// USER ACCOUNT MANAGEMENT
// ==========================================

if ($action === 'get_account_info') {
  try {
    error_log("GET_ACCOUNT_INFO: user_id={$user_id}, person_id={$person_id}");
    
    $stmt = $pdo->prepare("
      SELECT 
        u.user_id,
        u.username,
        u.user_role,
        u.is_active,
        p.person_id,
        CONCAT(p.f_name, ' ', p.l_name) as full_name,
        p.f_name,
        p.l_name,
        p.m_name,
        p.college_code,
        p.course,
        c.college_name
      FROM tbl_users u
      JOIN tbl_person p ON p.person_id = u.person_id
      LEFT JOIN tbl_college c ON c.college_code = p.college_code
      WHERE u.user_id = :user_id
    ");
    $stmt->execute(['user_id' => $user_id]);
    $account = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$account) {
      http_response_code(404);
      out(['ok' => false, 'message' => 'Account not found']);
    }
    
    // Remove sensitive data
    unset($account['password']);
    
    out(['ok' => true, 'account' => $account]);
  } catch (PDOException $e) {
    error_log("GET_ACCOUNT_INFO ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'update_username') {
  try {
    $new_username = trim($input['new_username'] ?? '');
    
    if (empty($new_username)) {
      out(['ok' => false, 'message' => 'Username cannot be empty']);
    }
    
    // Validate username format
    if (!preg_match('/^[a-zA-Z0-9_]{3,30}$/', $new_username)) {
      out(['ok' => false, 'message' => 'Username must be 3-30 characters and contain only letters, numbers, and underscores']);
    }
    
    error_log("UPDATE_USERNAME: user_id={$user_id}, new_username={$new_username}");
    
    $pdo->beginTransaction();
    
    // Check if username already exists
    $stmt = $pdo->prepare("SELECT user_id FROM tbl_users WHERE username = ? AND user_id != ?");
    $stmt->execute([$new_username, $user_id]);
    
    if ($stmt->fetch()) {
      $pdo->rollBack();
      out(['ok' => false, 'message' => 'Username already taken. Please choose a different username.']);
    }
    
    // Get old username for logging
    $stmt = $pdo->prepare("SELECT username FROM tbl_users WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $old_username = $stmt->fetch()['username'];
    
    // Update username
    $stmt = $pdo->prepare("UPDATE tbl_users SET username = ? WHERE user_id = ?");
    $stmt->execute([$new_username, $user_id]);
    
    // Log the change
    $stmt = $pdo->prepare("
      INSERT INTO tbl_logs (
        user_id, log_event, log_date, module_name, action_type,
        target_table, target_id, old_data, new_data, can_revert
      ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, 1)
    ");
    $stmt->execute([
      $user_id,
      "Username changed from '{$old_username}' to '{$new_username}'",
      'User Management',
      'UPDATE',
      'tbl_users',
      $user_id,
      json_encode(['username' => $old_username]),
      json_encode(['username' => $new_username])
    ]);
    
    $pdo->commit();
    
    out(['ok' => true, 'message' => 'Username updated successfully', 'new_username' => $new_username]);
  } catch (PDOException $e) {
    $pdo->rollBack();
    error_log("UPDATE_USERNAME ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

if ($action === 'update_password') {
  try {
    $current_password = $input['current_password'] ?? '';
    $new_password = $input['new_password'] ?? '';
    $confirm_password = $input['confirm_password'] ?? '';
    
    if (empty($current_password) || empty($new_password) || empty($confirm_password)) {
      out(['ok' => false, 'message' => 'All password fields are required']);
    }
    
    if ($new_password !== $confirm_password) {
      out(['ok' => false, 'message' => 'New password and confirmation do not match']);
    }
    
    if (strlen($new_password) < 6) {
      out(['ok' => false, 'message' => 'Password must be at least 6 characters long']);
    }
    
    error_log("UPDATE_PASSWORD: user_id={$user_id}");
    
    $pdo->beginTransaction();
    
    // Verify current password
    $stmt = $pdo->prepare("SELECT password, username FROM tbl_users WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();
    
    if (!$user) {
      $pdo->rollBack();
      out(['ok' => false, 'message' => 'User not found']);
    }
    
    if (!password_verify($current_password, $user['password'])) {
      $pdo->rollBack();
      out(['ok' => false, 'message' => 'Current password is incorrect']);
    }
    
    // Hash new password
    $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
    
    // Update password
    $stmt = $pdo->prepare("UPDATE tbl_users SET password = ? WHERE user_id = ?");
    $stmt->execute([$hashed_password, $user_id]);
    
    // Log the change
    $stmt = $pdo->prepare("
      INSERT INTO tbl_logs (
        user_id, log_event, log_date, module_name, action_type,
        target_table, target_id, new_data, can_revert
      ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, 0)
    ");
    $stmt->execute([
      $user_id,
      "Password changed for user '{$user['username']}'",
      'User Management',
      'UPDATE',
      'tbl_users',
      $user_id,
      json_encode(['password_changed' => true, 'timestamp' => date('Y-m-d H:i:s')])
    ]);
    
    $pdo->commit();
    
    out(['ok' => true, 'message' => 'Password updated successfully']);
  } catch (PDOException $e) {
    $pdo->rollBack();
    error_log("UPDATE_PASSWORD ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}


http_response_code(404);
out(['ok' => false, 'message' => 'Unknown action: ' . $action]);