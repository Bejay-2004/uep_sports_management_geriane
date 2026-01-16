<?php
// coach/api.php - Enhanced with training functionality

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../auth/guard.php';

require_role('coach');

header("Content-Type: application/json; charset=utf-8");

$coach_person_id = (int)$_SESSION['user']['person_id'];
$sports_id       = (int)$_SESSION['user']['sports_id'];

$action = $_GET['action'] ?? '';

function out($data) {
  echo json_encode($data);
  exit;
}

// ==========================================
// VENUES
// ==========================================

if ($action === 'venues') {
  try {
    $stmt = $pdo->prepare("
      SELECT 
        venue_id,
        venue_name,
        venue_building,
        venue_room
      FROM tbl_game_venue
      WHERE is_active = 1
      ORDER BY venue_name
    ");
    $stmt->execute();
    out($stmt->fetchAll());
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// TEAMS
// ==========================================

// ==========================================
// TEAMS - FILTERED BY COACH'S SPORT
// ==========================================

// ==========================================
// TEAMS - FILTERED BY COACH'S SPORT
// ==========================================

if ($action === 'teams') {
  try {
    // Only show teams where:
    // 1. Coach is assigned (coach_id matches)
    // 2. Sport matches the coach's assigned sport (sports_id matches)
    
    $stmt = $pdo->prepare("
      SELECT 
        st.tour_id, 
        st.team_id, 
        t.team_name,
        st.coach_id, 
        st.asst_coach_id, 
        st.sports_id,
        s.sports_name,
        tr.tour_name as tournament_name,
        CONCAT(cp.f_name,' ',cp.l_name) AS coach_name,
        CONCAT(ap.f_name,' ',ap.l_name) AS asst_coach_name
      FROM tbl_sports_team st
      JOIN tbl_team t ON t.team_id = st.team_id
      LEFT JOIN tbl_sports s ON s.sports_id = st.sports_id
      LEFT JOIN tbl_tournament tr ON tr.tour_id = st.tour_id
      LEFT JOIN tbl_person cp ON cp.person_id = st.coach_id
      LEFT JOIN tbl_person ap ON ap.person_id = st.asst_coach_id
      WHERE st.coach_id = :coach_id
        AND st.sports_id = :sports_id
      ORDER BY t.team_name
    ");
    $stmt->execute([
      'coach_id' => $coach_person_id,
      'sports_id' => $sports_id
    ]);
    
    $results = $stmt->fetchAll();
    
    error_log("TEAMS: Found " . count($results) . " teams for sport_id={$sports_id}");
    
    out($results);
  } catch (PDOException $e) {
    error_log("TEAMS ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// PLAYERS
// ==========================================


// ==========================================
// SESSION DETAILS
// ==========================================

if ($action === 'session_details') {
  try {
    $sked_id = (int)($_GET['sked_id'] ?? 0);
    
    if ($sked_id <= 0) {
      out(['ok' => false, 'message' => 'Invalid session ID']);
    }
    
    error_log("SESSION_DETAILS: sked_id={$sked_id}, coach_id={$coach_person_id}, sports_id={$sports_id}");
    
    // Verify coach owns this session
    $verify = $pdo->prepare("
      SELECT 
        ts.sked_id,
        ts.team_id,
        ts.sked_date,
        ts.sked_time,
        ts.venue_id,
        t.team_name,
        v.venue_name,
        v.venue_building,
        v.venue_room,
        CONCAT(c.f_name, ' ', c.l_name) as coach_name
      FROM tbl_train_sked ts
      JOIN tbl_team t ON t.team_id = ts.team_id
      JOIN tbl_sports_team st ON st.team_id = ts.team_id
      LEFT JOIN tbl_game_venue v ON v.venue_id = ts.venue_id
      LEFT JOIN tbl_person c ON c.person_id = st.coach_id
      WHERE ts.sked_id = ? AND st.coach_id = ? AND st.sports_id = ?
    ");
    $verify->execute([$sked_id, $coach_person_id, $sports_id]);
    $session = $verify->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
      error_log("SESSION_DETAILS ERROR: Session not found or access denied");
      out(['ok' => false, 'message' => 'Session not found or access denied']);
    }
    
    // Get activities
    $activities_stmt = $pdo->prepare("
      SELECT 
        sa.sequence_order, 
        ta.activity_name, 
        ta.duration, 
        ta.repetition
      FROM tbl_train_sked_activities sa
      JOIN tbl_training_activity ta ON ta.activity_id = sa.activity_id
      WHERE sa.sked_id = ?
      ORDER BY sa.sequence_order
    ");
    $activities_stmt->execute([$sked_id]);
    $session['activities'] = $activities_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get participants
    $participants_stmt = $pdo->prepare("
      SELECT 
        p.person_id,
        CONCAT(p.f_name, ' ', IFNULL(p.m_name, ''), ' ', p.l_name) as full_name,
        sp.participant_type
      FROM tbl_train_sked_participants sp
      JOIN tbl_person p ON p.person_id = sp.person_id
      WHERE sp.sked_id = ?
      ORDER BY sp.participant_type, p.l_name, p.f_name
    ");
    $participants_stmt->execute([$sked_id]);
    $session['participants'] = $participants_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("SESSION_DETAILS SUCCESS: Returning session data");
    out($session);
    
  } catch (PDOException $e) {
    error_log("SESSION_DETAILS ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// PLAYERS - FILTERED BY COACH'S SPORT
// ==========================================

if ($action === 'players') {
  try {
    // Only show players from teams that belong to:
    // 1. This coach (coach_id matches)
    // 2. The coach's assigned sport (sports_id matches)
    
    $stmt = $pdo->prepare("
      SELECT 
        p.person_id, 
        CONCAT(p.f_name,' ',p.l_name) AS player_name,
        t.team_name, 
        ta.is_captain
      FROM tbl_team_athletes ta
      JOIN tbl_person p ON p.person_id = ta.person_id
      JOIN tbl_team t ON t.team_id = ta.team_id
      JOIN tbl_sports_team st ON st.team_id = ta.team_id 
        AND st.tour_id = ta.tour_id 
        AND st.sports_id = ta.sports_id
      WHERE ta.sports_id = :sports_id
        AND st.coach_id = :coach_id
        AND ta.is_active = 1
        AND p.is_active = 1
      ORDER BY p.l_name ASC, p.f_name ASC
    ");
    $stmt->execute([
      'sports_id' => $sports_id, 
      'coach_id' => $coach_person_id
    ]);
    
    $results = $stmt->fetchAll();
    
    error_log("PLAYERS: Found " . count($results) . " players for sport_id={$sports_id}");
    
    out($results);
  } catch (PDOException $e) {
    error_log("PLAYERS ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// STANDINGS
// ==========================================

if ($action === 'standings') {
  try {
    $stmt = $pdo->prepare("
      SELECT ts.tour_id, tr.tour_name, ts.team_id, t.team_name,
             ts.no_games_played, ts.no_win, ts.no_loss, ts.no_draw,
             ts.no_gold, ts.no_silver, ts.no_bronze
      FROM tbl_team_standing ts
      JOIN tbl_tournament tr ON tr.tour_id = ts.tour_id
      JOIN tbl_team t ON t.team_id = ts.team_id
      WHERE ts.sports_id = :sports_id
      ORDER BY tr.tour_date DESC, ts.no_win DESC
    ");
    $stmt->execute(['sports_id'=>$sports_id]);
    out($stmt->fetchAll());
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// MATCHES
// ==========================================

// ==========================================
// MATCHES (TEAM AND INDIVIDUAL SPORTS)
// ==========================================

// ==========================================
// MATCHES (TEAM AND INDIVIDUAL SPORTS)
// ==========================================

// ==========================================
// MATCHES (TEAM AND INDIVIDUAL SPORTS)
// ==========================================

if ($action === 'matches') {
  try {
    error_log("MATCHES: sports_id={$sports_id}, coach_id={$coach_person_id}");
    
    // Get coach's athletes for individual sports
    $coach_athletes_stmt = $pdo->prepare("
      SELECT ta.person_id 
      FROM tbl_team_athletes ta
      JOIN tbl_sports_team st ON st.team_id = ta.team_id 
        AND st.tour_id = ta.tour_id 
        AND st.sports_id = ta.sports_id
      WHERE st.coach_id = :coach_id 
        AND st.sports_id = :sports_id
        AND ta.is_active = 1
    ");
    $coach_athletes_stmt->execute([
      'coach_id' => $coach_person_id,
      'sports_id' => $sports_id
    ]);
    $coach_athlete_ids = $coach_athletes_stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Get all matches with their participants
    $stmt = $pdo->prepare("
      SELECT 
        m.match_id,
        m.sked_date, 
        m.sked_time, 
        m.game_no, 
        m.match_type,
        m.sports_type,
        v.venue_name,
        m.team_a_id,
        m.team_b_id,
        m.winner_team_id,
        m.winner_athlete_id,
        ta.team_name AS team_a,
        tb.team_name AS team_b,
        tw.team_name AS winner_team_name,
        CONCAT(pw.f_name, ' ', IFNULL(pw.l_name, '')) AS winner_athlete_name
      FROM tbl_match m
      LEFT JOIN tbl_game_venue v ON v.venue_id = m.venue_id
      LEFT JOIN tbl_team ta ON ta.team_id = m.team_a_id
      LEFT JOIN tbl_team tb ON tb.team_id = m.team_b_id
      LEFT JOIN tbl_team tw ON tw.team_id = m.winner_team_id
      LEFT JOIN tbl_person pw ON pw.person_id = m.winner_athlete_id
      WHERE m.sports_id = :sports_id
      ORDER BY m.sked_date ASC, m.sked_time ASC
    ");
    $stmt->execute(['sports_id' => $sports_id]);
    $matches = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // For each match, get participants if it's individual sport
    foreach ($matches as &$match) {
      if ($match['sports_type'] === 'individual') {
        // Get all participants for this match
        $participants_stmt = $pdo->prepare("
          SELECT 
            mp.athlete_id,
            CONCAT(p.f_name, ' ', IFNULL(p.l_name, '')) AS athlete_name,
            mp.team_id,
            t.team_name
          FROM tbl_match_participants mp
          JOIN tbl_person p ON p.person_id = mp.athlete_id
          LEFT JOIN tbl_team t ON t.team_id = mp.team_id
          WHERE mp.match_id = ?
          ORDER BY mp.participant_id
        ");
        $participants_stmt->execute([$match['match_id']]);
        $participants = $participants_stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Build participants string and check if coach's athlete is involved
        $participant_names = [];
        $is_coach_match = false;
        
        foreach ($participants as $participant) {
          $participant_names[] = $participant['athlete_name'];
          if (in_array($participant['athlete_id'], $coach_athlete_ids)) {
            $is_coach_match = true;
          }
        }
        
        $match['participants'] = implode(' vs ', $participant_names);
        $match['is_coach_match'] = $is_coach_match;
        $match['participant_list'] = $participants;
      }
    }
    
    error_log("MATCHES: Found " . count($matches) . " matches for sport {$sports_id}");
    
    out($matches);
  } catch (PDOException $e) {
    error_log("MATCHES ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// COACH MATCH HISTORY
// ==========================================

// ==========================================
// COACH MATCH HISTORY
// ==========================================

// ==========================================
// COACH MATCH HISTORY - COMPLETE FIXED VERSION
// ==========================================
// ==========================================
// COACH MATCH HISTORY - COMPLETE FIXED VERSION
// ==========================================
// ==========================================
// COACH MATCH HISTORY - COMPLETE FIXED VERSION
// ==========================================
if ($action === 'coach_match_history') {
  try {
    error_log("COACH_MATCH_HISTORY START: coach_id={$coach_person_id}, sports_id={$sports_id}");
    
    // Step 1: Get coach's team IDs
    $team_stmt = $pdo->prepare("SELECT team_id FROM tbl_sports_team WHERE coach_id = ? AND sports_id = ?");
    $team_stmt->execute([$coach_person_id, $sports_id]);
    $coach_teams = $team_stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Step 2: Get coach's athlete IDs
    $athlete_stmt = $pdo->prepare("
      SELECT DISTINCT ta.person_id 
      FROM tbl_team_athletes ta
      INNER JOIN tbl_sports_team st ON st.team_id = ta.team_id 
        AND st.tour_id = ta.tour_id 
        AND st.sports_id = ta.sports_id
      WHERE st.coach_id = ? AND st.sports_id = ? AND ta.is_active = 1
    ");
    $athlete_stmt->execute([$coach_person_id, $sports_id]);
    $coach_athletes = $athlete_stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (empty($coach_teams) && empty($coach_athletes)) {
      out([]);
      return;
    }
    
    $all_matches = [];
    
    // Get team sport matches
    if (!empty($coach_teams)) {
      $placeholders = implode(',', array_fill(0, count($coach_teams), '?'));
      $sql = "SELECT m.*, v.venue_name, s.sports_name, 
                ta.team_name AS team_a_name, tb.team_name AS team_b_name,
                csa.score AS team_a_score, csb.score AS team_b_score
              FROM tbl_match m
              LEFT JOIN tbl_game_venue v ON v.venue_id = m.venue_id
              LEFT JOIN tbl_sports s ON s.sports_id = m.sports_id
              LEFT JOIN tbl_team ta ON ta.team_id = m.team_a_id
              LEFT JOIN tbl_team tb ON tb.team_id = m.team_b_id
              LEFT JOIN tbl_comp_score csa ON csa.match_id = m.match_id AND csa.team_id = m.team_a_id
              LEFT JOIN tbl_comp_score csb ON csb.match_id = m.match_id AND csb.team_id = m.team_b_id
              WHERE m.sports_id = ? 
                AND (m.team_a_id IN ($placeholders) OR m.team_b_id IN ($placeholders))";
      
      $stmt = $pdo->prepare($sql);
      $params = array_merge([$sports_id], $coach_teams, $coach_teams);
      $stmt->execute($params);
      $all_matches = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Get individual sport matches
    if (!empty($coach_athletes)) {
      $placeholders = implode(',', array_fill(0, count($coach_athletes), '?'));
      $sql = "SELECT DISTINCT m.*, v.venue_name, s.sports_name,
                NULL AS team_a_name, NULL AS team_b_name,
                NULL AS team_a_score, NULL AS team_b_score
              FROM tbl_match m
              INNER JOIN tbl_match_participants mp ON mp.match_id = m.match_id
              LEFT JOIN tbl_game_venue v ON v.venue_id = m.venue_id
              LEFT JOIN tbl_sports s ON s.sports_id = m.sports_id
              WHERE m.sports_id = ? AND mp.athlete_id IN ($placeholders)";
      
      $stmt = $pdo->prepare($sql);
      $params = array_merge([$sports_id], $coach_athletes);
      $stmt->execute($params);
      $individual = $stmt->fetchAll(PDO::FETCH_ASSOC);
      $all_matches = array_merge($all_matches, $individual);
    }
    
    // Process matches
    foreach ($all_matches as &$m) {
      if ($m['sports_type'] === 'individual') {
        // Get participants with scores from tbl_comp_score
        $ps = $pdo->prepare("
          SELECT 
            mp.athlete_id, 
            CONCAT(p.f_name,' ',p.l_name) AS athlete_name, 
            t.team_name,
            cs.score,
            cs.medal_type,
            cs.rank_no
          FROM tbl_match_participants mp
          JOIN tbl_person p ON p.person_id = mp.athlete_id
          LEFT JOIN tbl_team t ON t.team_id = mp.team_id
          LEFT JOIN tbl_comp_score cs ON cs.match_id = mp.match_id AND cs.athlete_id = mp.athlete_id
          WHERE mp.match_id = ?
          ORDER BY COALESCE(cs.rank_no, 999) ASC, cs.score DESC
        ");
        $ps->execute([$m['match_id']]);
        $m['participant_list'] = $ps->fetchAll(PDO::FETCH_ASSOC);
        
        // Find coach's athlete
        $coach_ath = null;
        foreach ($m['participant_list'] as $p) {
          if (in_array($p['athlete_id'], $coach_athletes)) {
            $coach_ath = $p;
            break;
          }
        }
        
        if ($coach_ath) {
          $m['coach_athlete_name'] = $coach_ath['athlete_name'];
          $m['coach_athlete_score'] = $coach_ath['score'] ?? 'No score';
          $m['coach_athlete_rank'] = $coach_ath['rank_no'] ?? null;
          $m['medal_won'] = $coach_ath['medal_type'];
          
          // Determine match result for individual sports
          if ($m['winner_athlete_id']) {
            $m['match_result'] = ($m['winner_athlete_id'] == $coach_ath['athlete_id']) ? 'WON' : 'LOST';
          } else if ($coach_ath['medal_type'] && in_array(strtolower($coach_ath['medal_type']), ['gold', 'silver', 'bronze'])) {
            // If they got a medal, consider it a win
            $m['match_result'] = 'WON';
          } else {
            $m['match_result'] = 'PENDING';
          }
        } else {
          $m['coach_athlete_name'] = 'Your Athlete';
          $m['coach_athlete_score'] = 'No score';
          $m['coach_athlete_rank'] = null;
          $m['medal_won'] = null;
          $m['match_result'] = 'PENDING';
        }
      } else {
        // Team sport
        $coach_tid = in_array($m['team_a_id'], $coach_teams) ? $m['team_a_id'] : 
                     (in_array($m['team_b_id'], $coach_teams) ? $m['team_b_id'] : null);
        
        $m['coach_team_id'] = $coach_tid;
        $m['coach_team_name'] = $coach_tid == $m['team_a_id'] ? $m['team_a_name'] : $m['team_b_name'];
        $m['opponent_name'] = $coach_tid == $m['team_a_id'] ? $m['team_b_name'] : $m['team_a_name'];
        
        // Get scores
        $m['coach_team_scores'] = $coach_tid == $m['team_a_id'] ? $m['team_a_score'] : $m['team_b_score'];
        $m['opponent_scores'] = $coach_tid == $m['team_a_id'] ? $m['team_b_score'] : $m['team_a_score'];
        
        // Check for team medals in tbl_comp_score
        $medal_check = $pdo->prepare("
          SELECT medal_type FROM tbl_comp_score 
          WHERE match_id = ? AND team_id = ? 
          LIMIT 1
        ");
        $medal_check->execute([$m['match_id'], $coach_tid]);
        $medal_row = $medal_check->fetch(PDO::FETCH_ASSOC);
        $m['medal_won'] = $medal_row ? $medal_row['medal_type'] : null;
        
        $m['match_result'] = $m['winner_team_id'] ? 
          ($m['winner_team_id'] == $coach_tid ? 'WON' : 'LOST') : 'PENDING';
      }
    }
    
    // Sort by date descending (most recent first)
    usort($all_matches, function($a, $b) {
      $dateA = strtotime($a['sked_date'] . ' ' . ($a['sked_time'] ?? '00:00:00'));
      $dateB = strtotime($b['sked_date'] . ' ' . ($b['sked_time'] ?? '00:00:00'));
      return $dateB - $dateA;
    });
    
    out($all_matches);
  } catch (Exception $e) {
    error_log("MATCH_HISTORY ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => $e->getMessage()]);
  }
}

// ==========================================
// TRAINING LIST
// ==========================================

if ($action === 'training_list') {
  try {
    // First check if trainor_id column exists
    $cols = $pdo->query("SHOW COLUMNS FROM tbl_train_sked LIKE 'trainor_id'")->fetch();
    
    if ($cols) {
      // New schema with trainor_id
      $stmt = $pdo->prepare("
        SELECT 
          sk.sked_id,
          t.team_name,
          sk.sked_date,
          sk.sked_time,
          v.venue_name,
          sk.is_active
        FROM tbl_train_sked sk
        JOIN tbl_team t ON t.team_id = sk.team_id
        JOIN tbl_sports_team st ON st.team_id = sk.team_id
        LEFT JOIN tbl_game_venue v ON v.venue_id = sk.venue_id
        WHERE sk.trainor_id = :coach_id AND st.sports_id = :sports_id
        ORDER BY sk.sked_date DESC, sk.sked_time DESC
      ");
    } else {
      // Old schema - use sports_team join
      $stmt = $pdo->prepare("
        SELECT 
          sk.sked_id,
          t.team_name,
          sk.sked_date,
          sk.sked_time,
          v.venue_name,
          sk.is_active
        FROM tbl_train_sked sk
        JOIN tbl_team t ON t.team_id = sk.team_id
        JOIN tbl_sports_team st ON st.team_id = sk.team_id
        LEFT JOIN tbl_game_venue v ON v.venue_id = sk.venue_id
        WHERE st.coach_id = :coach_id AND st.sports_id = :sports_id
        ORDER BY sk.sked_date DESC, sk.sked_time DESC
      ");
    }
    
    $stmt->execute(['coach_id'=>$coach_person_id, 'sports_id'=>$sports_id]);
    $results = $stmt->fetchAll();
    
    error_log("TRAINING_LIST: Found " . count($results) . " sessions for coach {$coach_person_id}");
    
    out($results);
  } catch (PDOException $e) {
    error_log("TRAINING_LIST ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
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
        COUNT(DISTINCT CONCAT(sp.person_id, '-', sp.sked_id)) as total_expected,
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
// TRAINING TEAMS
// ==========================================

if ($action === 'training_teams') {
  try {
    // CRITICAL: Only return teams for THIS coach's assigned sport
    $stmt = $pdo->prepare("
      SELECT 
        st.team_id, 
        st.tour_id,
        t.team_name,
        s.sports_name,
        st.sports_id,
        t.team_name as display_name
      FROM tbl_sports_team st
      JOIN tbl_team t ON t.team_id = st.team_id
      LEFT JOIN tbl_sports s ON s.sports_id = st.sports_id
      WHERE st.coach_id = :coach_id
        AND st.sports_id = :sports_id
      ORDER BY t.team_name ASC
    ");
    $stmt->execute([
      'coach_id' => $coach_person_id,
      'sports_id' => $sports_id
    ]);
    
    $results = $stmt->fetchAll();
    
    error_log("TRAINING_TEAMS: Found " . count($results) . " teams for coach {$coach_person_id} in sport {$sports_id}");
    
    out($results);
  } catch (PDOException $e) {
    error_log("TRAINING_TEAMS ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}



// ==========================================
// TRAINING CREATE
// ==========================================

if ($action === 'migrate_session_participants') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $sked_id = (int)($_POST['sked_id'] ?? 0);
    
    if ($sked_id <= 0) {
      out(['ok' => false, 'message' => 'Invalid session ID']);
    }
    
    // Verify coach owns this session
    $verify = $pdo->prepare("
      SELECT ts.team_id 
      FROM tbl_train_sked ts
      JOIN tbl_sports_team st ON st.team_id = ts.team_id
      WHERE ts.sked_id = ? AND st.coach_id = ? AND st.sports_id = ?
    ");
    $verify->execute([$sked_id, $coach_person_id, $sports_id]);
    $session = $verify->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
      out(['ok' => false, 'message' => 'Session not found or access denied']);
    }
    
    $team_id = $session['team_id'];
    
    // Check if participants already exist
    $check = $pdo->prepare("SELECT COUNT(*) as cnt FROM tbl_train_sked_participants WHERE sked_id = ?");
    $check->execute([$sked_id]);
    $existing = $check->fetch(PDO::FETCH_ASSOC);
    
    if ($existing['cnt'] > 0) {
      out(['ok' => true, 'message' => 'Participants already assigned', 'count' => $existing['cnt']]);
    }
    
    // Get all athletes for this team
    $athletes = $pdo->prepare("
      SELECT person_id 
      FROM tbl_team_athletes 
      WHERE team_id = ? AND sports_id = ? AND is_active = 1
    ");
    $athletes->execute([$team_id, $sports_id]);
    
    // Get all trainees for this team - UPDATED to use person_id
    $trainees = $pdo->prepare("
      SELECT person_id 
      FROM tbl_team_trainees 
      WHERE team_id = ? AND is_active = 1
    ");
    $trainees->execute([$team_id]);
    
    $stmt = $pdo->prepare("
      INSERT INTO tbl_train_sked_participants (sked_id, person_id, participant_type)
      VALUES (?, ?, ?)
    ");
    
    $count = 0;
    
    // Add athletes
    while ($athlete = $athletes->fetch(PDO::FETCH_ASSOC)) {
      $stmt->execute([$sked_id, $athlete['person_id'], 'athlete']);
      $count++;
    }
    
    // Add trainees
    while ($trainee = $trainees->fetch(PDO::FETCH_ASSOC)) {
      $stmt->execute([$sked_id, $trainee['person_id'], 'trainee']);
      $count++;
    }
    
    out(['ok' => true, 'message' => "Successfully assigned {$count} participants", 'count' => $count]);
    
  } catch (PDOException $e) {
    error_log("MIGRATE_PARTICIPANTS ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}



// Add this endpoint to auto-migrate all sessions
if ($action === 'migrate_all_sessions') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    // Get all sessions for this coach that don't have participants
    $sessions = $pdo->prepare("
      SELECT ts.sked_id, ts.team_id
      FROM tbl_train_sked ts
      JOIN tbl_sports_team st ON st.team_id = ts.team_id
      WHERE st.coach_id = ? AND st.sports_id = ?
      AND NOT EXISTS (
        SELECT 1 FROM tbl_train_sked_participants 
        WHERE sked_id = ts.sked_id
      )
    ");
    $sessions->execute([$coach_person_id, $sports_id]);
    
    $insert_stmt = $pdo->prepare("
      INSERT INTO tbl_train_sked_participants (sked_id, person_id, participant_type)
      VALUES (?, ?, ?)
    ");
    
    $total_sessions = 0;
    $total_participants = 0;
    
    while ($session = $sessions->fetch(PDO::FETCH_ASSOC)) {
      $sked_id = $session['sked_id'];
      $team_id = $session['team_id'];
      
      // Get athletes
      $athletes = $pdo->prepare("
        SELECT person_id FROM tbl_team_athletes 
        WHERE team_id = ? AND sports_id = ? AND is_active = 1
      ");
      $athletes->execute([$team_id, $sports_id]);
      
      while ($athlete = $athletes->fetch(PDO::FETCH_ASSOC)) {
        $insert_stmt->execute([$sked_id, $athlete['person_id'], 'athlete']);
        $total_participants++;
      }
      
      // Get trainees
      $trainees = $pdo->prepare("
        SELECT trainee_id as person_id FROM tbl_team_trainees 
        WHERE team_id = ? AND is_active = 1
      ");
      $trainees->execute([$team_id]);
      
      while ($trainee = $trainees->fetch(PDO::FETCH_ASSOC)) {
        $insert_stmt->execute([$sked_id, $trainee['person_id'], 'trainee']);
        $total_participants++;
      }
      
      $total_sessions++;
    }
    
    out([
      'ok' => true, 
      'message' => "Migrated {$total_sessions} sessions with {$total_participants} total participants",
      'sessions' => $total_sessions,
      'participants' => $total_participants
    ]);
    
  } catch (PDOException $e) {
    error_log("MIGRATE_ALL ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}



// Replace the training_create section in api.php with this improved version

if ($action === 'training_create') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $team_id  = (int)($_POST['team_id'] ?? 0);
    $date     = $_POST['sked_date'] ?? '';
    $time     = $_POST['sked_time'] ?? '';
    $venue_id = (int)($_POST['venue_id'] ?? 0);

    if ($team_id <= 0 || !$date || !$time || $venue_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Missing fields']);
    }

    // Validate team belongs to coach + sport
    $chk = $pdo->prepare("
      SELECT 1 FROM tbl_sports_team
      WHERE team_id = :team_id AND coach_id = :coach_id AND sports_id = :sports_id
      LIMIT 1
    ");
    $chk->execute([
      'team_id'=>$team_id,
      'coach_id'=>$coach_person_id,
      'sports_id'=>$sports_id
    ]);
    if (!$chk->fetch()) {
      http_response_code(403);
      out(['ok'=>false,'message'=>'You are not assigned to this team/sport']);
    }

    // Validate venue exists and active
    $vchk = $pdo->prepare("
      SELECT 1 FROM tbl_game_venue
      WHERE venue_id = :venue_id AND is_active = 1
      LIMIT 1
    ");
    $vchk->execute(['venue_id'=>$venue_id]);
    if (!$vchk->fetch()) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Invalid venue']);
    }

    // Check if tbl_train_sked has trainor_id column
    $cols = $pdo->query("SHOW COLUMNS FROM tbl_train_sked LIKE 'trainor_id'")->fetch();
    
    if ($cols) {
      // New schema with trainor_id
      $ins = $pdo->prepare("
        INSERT INTO tbl_train_sked (team_id, trainor_id, sked_date, sked_time, venue_id, is_active)
        VALUES (:team_id, :trainor_id, :sked_date, :sked_time, :venue_id, 1)
      ");
      $ins->execute([
        'team_id'=>$team_id,
        'trainor_id'=>$coach_person_id,
        'sked_date'=>$date,
        'sked_time'=>$time,
        'venue_id'=>$venue_id
      ]);
    } else {
      // Old schema without trainor_id
      $ins = $pdo->prepare("
        INSERT INTO tbl_train_sked (team_id, sked_date, sked_time, venue_id, is_active)
        VALUES (:team_id, :sked_date, :sked_time, :venue_id, 1)
      ");
      $ins->execute([
        'team_id'=>$team_id,
        'sked_date'=>$date,
        'sked_time'=>$time,
        'venue_id'=>$venue_id
      ]);
    }
    
    $sked_id = $pdo->lastInsertId();
    error_log("TRAINING_CREATE: Created session sked_id={$sked_id}");

    out(['ok'=>true,'message'=>'Training schedule saved', 'sked_id' => $sked_id]);
  } catch (PDOException $e) {
    error_log("TRAINING_CREATE ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}



// ==========================================
// TRAINEES
// ==========================================

// ==========================================
// TRAINEES (Athletes & Team Members) - ROBUST VERSION
// ==========================================

if ($action === 'trainees') {
  try {
    error_log("TRAINEES: coach_id={$coach_person_id}, sports_id={$sports_id}");
    
    // UNION approach with proper tour_id matching
    $stmt = $pdo->prepare("
      -- Get official athletes (matching tour_id between team_athletes and sports_team)
      SELECT 
        p.person_id,
        CONCAT(IFNULL(p.f_name, ''), ' ', IFNULL(p.l_name, '')) as trainee_name,
        t.team_name,
        COALESCE(ats.semester, 'N/A') as semester,
        COALESCE(ats.school_year, 'N/A') as school_year,
        'Current Semester' as date_applied,
        ta.is_active,
        p.role_type,
        'Athlete (Official)' as member_type
      FROM tbl_team_athletes ta
      JOIN tbl_person p ON p.person_id = ta.person_id
      JOIN tbl_team t ON t.team_id = ta.team_id
      JOIN tbl_sports_team st ON st.team_id = ta.team_id 
        AND st.tour_id = ta.tour_id
        AND st.sports_id = ta.sports_id
      LEFT JOIN tbl_ath_status ats ON ats.person_id = p.person_id
      WHERE ta.sports_id = :sports_id1
        AND st.coach_id = :coach_id1
        AND ta.is_active = 1
        AND p.is_active = 1
      
      UNION
      
      -- Get trainees (team_trainees doesn't have tour_id, so match via team_id only)
      SELECT 
        p.person_id,
        CONCAT(IFNULL(p.f_name, ''), ' ', IFNULL(p.l_name, '')) as trainee_name,
        t.team_name,
        COALESCE(tt.semester, 'N/A') as semester,
        COALESCE(tt.school_year, 'N/A') as school_year,
        COALESCE(DATE_FORMAT(tt.date_applied, '%Y-%m-%d'), 'N/A') as date_applied,
        tt.is_active,
        p.role_type,
        'Athlete (Trainee)' as member_type
      FROM tbl_team_trainees tt
      JOIN tbl_person p ON p.person_id = tt.person_id
      JOIN tbl_team t ON t.team_id = tt.team_id
      JOIN tbl_sports_team st ON st.team_id = tt.team_id
      WHERE st.sports_id = :sports_id2
        AND st.coach_id = :coach_id2
        AND tt.is_active = 1
        AND p.is_active = 1
      
      ORDER BY member_type DESC, team_name, trainee_name
    ");
    
    $stmt->execute([
      'coach_id1' => $coach_person_id,
      'sports_id1' => $sports_id,
      'coach_id2' => $coach_person_id,
      'sports_id2' => $sports_id
    ]);
    
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("TRAINEES: Found " . count($results) . " members for sport_id={$sports_id}");
    
    // Log sample data for debugging
    if (count($results) > 0) {
      error_log("TRAINEES: Sample record: " . json_encode($results[0]));
    }
    
    out($results);
    
  } catch (PDOException $e) {
    error_log("TRAINEES ERROR: " . $e->getMessage());
    error_log("TRAINEES ERROR CODE: " . $e->getCode());
    error_log("TRAINEES TRACE: " . $e->getTraceAsString());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error: ' . $e->getMessage(), 'error' => $e->getMessage()]);
  }
}

// ==========================================
// ACTIVITIES (GET ALL)
// ==========================================

if ($action === 'activities') {
  try {
    $stmt = $pdo->prepare("
      SELECT 
        activity_id,
        activity_name,
        duration,
        repetition,
        is_active
      FROM tbl_training_activity
      WHERE sports_id = :sports_id
      ORDER BY activity_name
    ");
    $stmt->execute(['sports_id' => $sports_id]);
    out($stmt->fetchAll());
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// SAVE ACTIVITY
// ==========================================

if ($action === 'save_activity') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $activity_id = (int)($_POST['activity_id'] ?? 0);
    $activity_name = trim($_POST['activity_name'] ?? '');
    $duration = trim($_POST['duration'] ?? '');
    $repetition = trim($_POST['repetition'] ?? '');
    $is_active = isset($_POST['is_active']) ? 1 : 0;

    if (empty($activity_name)) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Activity name is required']);
    }

    if ($activity_id > 0) {
      // Update existing
      $stmt = $pdo->prepare("
        UPDATE tbl_training_activity
        SET activity_name = :activity_name,
            duration = :duration,
            repetition = :repetition,
            is_active = :is_active
        WHERE activity_id = :activity_id AND sports_id = :sports_id
      ");
      $stmt->execute([
        'activity_id' => $activity_id,
        'activity_name' => $activity_name,
        'duration' => $duration ?: null,
        'repetition' => $repetition ?: null,
        'is_active' => $is_active,
        'sports_id' => $sports_id
      ]);
      out(['ok'=>true,'message'=>'Activity updated successfully']);
    } else {
      // Insert new
      $stmt = $pdo->prepare("
        INSERT INTO tbl_training_activity 
        (activity_name, sports_id, duration, repetition, is_active)
        VALUES (:activity_name, :sports_id, :duration, :repetition, :is_active)
      ");
      $stmt->execute([
        'activity_name' => $activity_name,
        'sports_id' => $sports_id,
        'duration' => $duration ?: null,
        'repetition' => $repetition ?: null,
        'is_active' => $is_active
      ]);
      out(['ok'=>true,'message'=>'Activity created successfully']);
    }
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// GET ACTIVITY
// ==========================================

if ($action === 'get_activity') {
  try {
    $activity_id = (int)($_GET['activity_id'] ?? 0);
    
    if ($activity_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Invalid activity ID']);
    }
    
    $stmt = $pdo->prepare("
      SELECT 
        activity_id,
        activity_name,
        duration,
        repetition,
        is_active
      FROM tbl_training_activity
      WHERE activity_id = :activity_id AND sports_id = :sports_id
      LIMIT 1
    ");
    $stmt->execute(['activity_id' => $activity_id, 'sports_id' => $sports_id]);
    $activity = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($activity) {
      out($activity);
    } else {
      out(['ok' => false, 'message' => 'Activity not found']);
    }
  } catch (PDOException $e) {
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

// ==========================================
// DELETE ACTIVITY (DEACTIVATE)
// ==========================================

if ($action === 'delete_activity') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $activity_id = (int)($_POST['activity_id'] ?? 0);

    if ($activity_id <= 0) {
      out(['ok' => false, 'message' => 'Invalid activity ID']);
    }

    // Deactivate instead of delete
    $stmt = $pdo->prepare("
      UPDATE tbl_training_activity
      SET is_active = 0
      WHERE activity_id = :activity_id AND sports_id = :sports_id
    ");
    $stmt->execute(['activity_id' => $activity_id, 'sports_id' => $sports_id]);

    if ($stmt->rowCount() > 0) {
      out(['ok' => true, 'message' => 'Activity deactivated successfully']);
    } else {
      out(['ok' => false, 'message' => 'Activity not found']);
    }
  } catch (PDOException $e) {
    out(['ok' => false, 'message' => $e->getMessage()]);
  }
}

// ==========================================
// REPORT: ATTENDANCE
// ==========================================


// ==========================================
// REPORT: SESSION DETAILS
// ==========================================

if ($action === 'report_session_details') {
  try {
    $sked_id = (int)($_GET['sked_id'] ?? 0);
    
    if ($sked_id <= 0) {
      out(['ok' => false, 'message' => 'Invalid session ID']);
    }
    
    error_log("REPORT_SESSION_DETAILS: sked_id={$sked_id}, coach_id={$coach_person_id}, sports_id={$sports_id}");
    
    // Verify coach owns this session
    $verify = $pdo->prepare("
      SELECT ts.sked_id, ts.team_id, ts.sked_date, ts.sked_time,
             t.team_name, v.venue_name, v.venue_building, v.venue_room,
             CONCAT(c.f_name, ' ', c.l_name) as coach_name
      FROM tbl_train_sked ts
      JOIN tbl_team t ON t.team_id = ts.team_id
      JOIN tbl_sports_team st ON st.team_id = ts.team_id
      LEFT JOIN tbl_game_venue v ON v.venue_id = ts.venue_id
      LEFT JOIN tbl_person c ON c.person_id = st.coach_id
      WHERE ts.sked_id = ? AND st.coach_id = ? AND st.sports_id = ?
    ");
    $verify->execute([$sked_id, $coach_person_id, $sports_id]);
    $session = $verify->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
      error_log("REPORT_SESSION_DETAILS ERROR: Session not found or access denied");
      out(['ok' => false, 'message' => 'Session not found or access denied']);
    }
    
    // Get activities
    $activities_stmt = $pdo->prepare("
      SELECT sa.sequence_order, ta.activity_name, ta.duration, ta.repetition
      FROM tbl_train_sked_activities sa
      JOIN tbl_training_activity ta ON ta.activity_id = sa.activity_id
      WHERE sa.sked_id = ?
      ORDER BY sa.sequence_order
    ");
    $activities_stmt->execute([$sked_id]);
    $session['activities'] = $activities_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get participants with attendance
    $participants_stmt = $pdo->prepare("
      SELECT 
        CONCAT(p.f_name, ' ', IFNULL(p.m_name, ''), ' ', p.l_name) as full_name,
        sp.participant_type,
        IFNULL(ta.is_present, 0) as is_present,
        p.date_birth,
        p.blood_type,
        p.course
      FROM tbl_train_sked_participants sp
      JOIN tbl_person p ON p.person_id = sp.person_id
      LEFT JOIN tbl_train_attend ta ON ta.sked_id = sp.sked_id AND ta.person_id = sp.person_id
      WHERE sp.sked_id = ?
      ORDER BY sp.participant_type, p.l_name, p.f_name
    ");
    $participants_stmt->execute([$sked_id]);
    $session['participants'] = $participants_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate attendance stats
    $total = count($session['participants']);
    $present = 0;
    $athletes_present = 0;
    $trainees_present = 0;
    $athletes_total = 0;
    $trainees_total = 0;
    
    foreach ($session['participants'] as $p) {
      if ($p['is_present'] == 1) {
        $present++;
        if ($p['participant_type'] === 'athlete') {
          $athletes_present++;
        } else {
          $trainees_present++;
        }
      }
      if ($p['participant_type'] === 'athlete') {
        $athletes_total++;
      } else {
        $trainees_total++;
      }
    }
    
    $session['stats'] = [
      'total_participants' => $total,
      'total_present' => $present,
      'total_absent' => $total - $present,
      'attendance_rate' => $total > 0 ? round(($present / $total) * 100, 1) : 0,
      'athletes_total' => $athletes_total,
      'athletes_present' => $athletes_present,
      'trainees_total' => $trainees_total,
      'trainees_present' => $trainees_present
    ];
    
    error_log("REPORT_SESSION_DETAILS: Successfully generated report");
    
    out($session);
  } catch (PDOException $e) {
    error_log("REPORT_SESSION_DETAILS ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// REPORT: ALL SESSIONS LIST
// ==========================================

if ($action === 'report_sessions_list') {
  try {
    error_log("REPORT_SESSIONS_LIST: coach_id={$coach_person_id}, sports_id={$sports_id}");
    
    $stmt = $pdo->prepare("
      SELECT 
        ts.sked_id,
        ts.sked_date,
        ts.sked_time,
        t.team_name,
        v.venue_name,
        COUNT(DISTINCT sp.person_id) as total_participants,
        COUNT(DISTINCT CASE WHEN ta.is_present = 1 THEN ta.person_id END) as present_count
      FROM tbl_train_sked ts
      JOIN tbl_team t ON t.team_id = ts.team_id
      JOIN tbl_sports_team st ON st.team_id = ts.team_id
      LEFT JOIN tbl_game_venue v ON v.venue_id = ts.venue_id
      LEFT JOIN tbl_train_sked_participants sp ON sp.sked_id = ts.sked_id
      LEFT JOIN tbl_train_attend ta ON ta.sked_id = ts.sked_id AND ta.person_id = sp.person_id
      WHERE st.coach_id = ? AND st.sports_id = ?
      GROUP BY ts.sked_id, ts.sked_date, ts.sked_time, t.team_name, v.venue_name
      ORDER BY ts.sked_date DESC, ts.sked_time DESC
    ");
    $stmt->execute([$coach_person_id, $sports_id]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("REPORT_SESSIONS_LIST: Found " . count($results) . " sessions");
    
    out($results);
  } catch (PDOException $e) {
    error_log("REPORT_SESSIONS_LIST ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// ==========================================
// REPORT: ATTENDANCE
// ==========================================
if ($action === 'report_attendance') {
  try {
    $date_from = $_GET['date_from'] ?? '';
    $date_to = $_GET['date_to'] ?? '';
    $team_id = (int)($_GET['team_id'] ?? 0);
    
    error_log("REPORT_ATTENDANCE START: coach_id={$coach_person_id}, sports_id={$sports_id}, team_id={$team_id}");
    
    // If team_id provided, verify it belongs to this coach's sport
    if ($team_id > 0) {
      $verify = $pdo->prepare("
        SELECT team_id 
        FROM tbl_sports_team 
        WHERE team_id = ? AND coach_id = ? AND sports_id = ?
      ");
      $verify->execute([$team_id, $coach_person_id, $sports_id]);
      
      if (!$verify->fetch()) {
        error_log("REPORT_ATTENDANCE BLOCKED: Team {$team_id} not assigned to coach {$coach_person_id} for sport {$sports_id}");
        out([]);
        return;
      }
    }
    
    // Get training sessions only for teams where:
    // 1. This coach is assigned (coach_id matches)
    // 2. The coach's assigned sport (sports_id matches)
    // 3. Only count participants who are verified athletes/trainees for THIS sport
    // 4. Only include sessions that have at least 1 verified participant
    $sql = "
      SELECT 
        ts.sked_id,
        ts.sked_date,
        ts.sked_time,
        t.team_name,
        s.sports_name,
        v.venue_name,
        COUNT(DISTINCT CASE 
          WHEN (sp.participant_type = 'athlete' AND ta_check.person_id IS NOT NULL AND ta_check.is_active = 1)
            OR (sp.participant_type = 'trainee' AND tt_check.person_id IS NOT NULL AND tt_check.is_active = 1)
          THEN sp.person_id 
        END) as total_members,
        COUNT(DISTINCT CASE 
          WHEN ta.is_present = 1 
            AND (
              (sp.participant_type = 'athlete' AND ta_check.person_id IS NOT NULL AND ta_check.is_active = 1)
              OR (sp.participant_type = 'trainee' AND tt_check.person_id IS NOT NULL AND tt_check.is_active = 1)
            )
          THEN ta.person_id 
        END) as present_count,
        ROUND(
          (COUNT(DISTINCT CASE 
            WHEN ta.is_present = 1 
              AND (
                (sp.participant_type = 'athlete' AND ta_check.person_id IS NOT NULL AND ta_check.is_active = 1)
                OR (sp.participant_type = 'trainee' AND tt_check.person_id IS NOT NULL AND tt_check.is_active = 1)
              )
            THEN ta.person_id 
          END) / 
           NULLIF(COUNT(DISTINCT CASE 
             WHEN (sp.participant_type = 'athlete' AND ta_check.person_id IS NOT NULL AND ta_check.is_active = 1)
               OR (sp.participant_type = 'trainee' AND tt_check.person_id IS NOT NULL AND tt_check.is_active = 1)
             THEN sp.person_id 
           END), 0)) * 100, 
          1
        ) as attendance_rate
      FROM tbl_train_sked ts
      INNER JOIN tbl_sports_team st ON st.team_id = ts.team_id 
        AND st.coach_id = :coach_id 
        AND st.sports_id = :sports_id
      INNER JOIN tbl_team t ON t.team_id = ts.team_id
      INNER JOIN tbl_sports s ON s.sports_id = st.sports_id
      LEFT JOIN tbl_game_venue v ON v.venue_id = ts.venue_id
      LEFT JOIN tbl_train_sked_participants sp ON sp.sked_id = ts.sked_id
      LEFT JOIN tbl_train_attend ta ON ta.sked_id = ts.sked_id AND ta.person_id = sp.person_id
      LEFT JOIN tbl_team_athletes ta_check ON ta_check.person_id = sp.person_id
        AND ta_check.team_id = ts.team_id
        AND ta_check.sports_id = :sports_id2
      LEFT JOIN tbl_team_trainees tt_check ON tt_check.person_id = sp.person_id
        AND tt_check.team_id = ts.team_id
      WHERE 1=1
    ";
    
    $params = [
      'coach_id' => $coach_person_id,
      'sports_id' => $sports_id,
      'sports_id2' => $sports_id
    ];
    
    if (!empty($date_from)) {
      $sql .= " AND ts.sked_date >= :date_from";
      $params['date_from'] = $date_from;
    }
    
    if (!empty($date_to)) {
      $sql .= " AND ts.sked_date <= :date_to";
      $params['date_to'] = $date_to;
    }
    
    if ($team_id > 0) {
      $sql .= " AND ts.team_id = :team_id";
      $params['team_id'] = $team_id;
    }
    
    $sql .= " GROUP BY ts.sked_id, ts.sked_date, ts.sked_time, t.team_name, s.sports_name, v.venue_name
              HAVING total_members > 0
              ORDER BY ts.sked_date DESC, ts.sked_time DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("REPORT_ATTENDANCE SUCCESS: " . count($results) . " sessions for coach sport {$sports_id}");
    
    out($results);
  } catch (PDOException $e) {
    error_log("REPORT_ATTENDANCE ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error']);
  }
}

// ==========================================
// REPORT: PERFORMANCE
// ==========================================
// ==========================================
// REPORTS - PERFORMANCE SUMMARY GROUPED BY ACTIVITY
// ==========================================

if ($action === 'report_performance') {
  try {
    $date_from = $_GET['date_from'] ?? '';
    $date_to = $_GET['date_to'] ?? '';
    $team_id = isset($_GET['team_id']) && $_GET['team_id'] !== '' ? (int)$_GET['team_id'] : null;

    $sql = "
      SELECT 
        ta.activity_id,
        ta.activity_name,
        ta.duration,
        ta.repetition,
        p.person_id,
        CONCAT(p.f_name, ' ', p.l_name) as player_name,
        t.team_name,
        tp.perf_id,
        tp.rating,
        tp.remarks,
        tp.date_eval
      FROM tbl_train_perf tp
      JOIN tbl_training_activity ta ON ta.activity_id = tp.activity_id
      JOIN tbl_person p ON p.person_id = tp.person_id
      JOIN tbl_team t ON t.team_id = tp.team_id
      WHERE tp.team_id IN (
        SELECT st.team_id 
        FROM tbl_sports_team st 
        WHERE st.coach_id = :coach_id AND st.sports_id = :sports_id
      )
    ";

    $params = ['coach_id' => $coach_person_id, 'sports_id' => $sports_id];

    if ($date_from) {
      $sql .= " AND tp.date_eval >= :date_from";
      $params['date_from'] = $date_from;
    }

    if ($date_to) {
      $sql .= " AND tp.date_eval <= :date_to";
      $params['date_to'] = $date_to;
    }

    if ($team_id !== null) {
      $sql .= " AND tp.team_id = :team_id";
      $params['team_id'] = $team_id;
    }

    $sql .= " ORDER BY tp.date_eval DESC, ta.activity_name, p.l_name, p.f_name";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Group by activity
    $grouped = [];
    foreach ($results as $row) {
      $activityKey = $row['activity_id'];
      if (!isset($grouped[$activityKey])) {
        $grouped[$activityKey] = [
          'activity_id' => $row['activity_id'],
          'activity_name' => $row['activity_name'],
          'duration' => $row['duration'],
          'repetition' => $row['repetition'],
          'evaluations' => [],
          'latest_date' => $row['date_eval']
        ];
      }
      $grouped[$activityKey]['evaluations'][] = [
        'perf_id' => $row['perf_id'],
        'player_name' => $row['player_name'],
        'team_name' => $row['team_name'],
        'rating' => $row['rating'],
        'remarks' => $row['remarks'],
        'date_eval' => $row['date_eval']
      ];
    }
    
    // Sort groups by latest evaluation date
    usort($grouped, function($a, $b) {
      return strcmp($b['latest_date'], $a['latest_date']);
    });
    
    out(array_values($grouped));
  } catch (PDOException $e) {
    http_response_code(500);
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}



// ==========================================
// ADD ACTIVITIES TO SESSION
// ==========================================

if ($action === 'session_add_activities') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $sked_id = (int)($_POST['sked_id'] ?? 0);
    $activity_ids = json_decode($_POST['activity_ids'] ?? '[]', true);
    
    if ($sked_id <= 0 || empty($activity_ids) || !is_array($activity_ids)) {
      out(['ok' => false, 'message' => 'Invalid parameters']);
    }
    
    // Verify coach owns this session
    $verify = $pdo->prepare("
      SELECT 1 FROM tbl_train_sked ts
      JOIN tbl_sports_team st ON st.team_id = ts.team_id
      WHERE ts.sked_id = ? AND st.coach_id = ? AND st.sports_id = ?
    ");
    $verify->execute([$sked_id, $coach_person_id, $sports_id]);
    
    if (!$verify->fetch()) {
      out(['ok' => false, 'message' => 'Session not found or access denied']);
    }
    
    // Clear existing activities
    $pdo->prepare("DELETE FROM tbl_train_sked_activities WHERE sked_id = ?")->execute([$sked_id]);
    
    // Add new activities
    $stmt = $pdo->prepare("
      INSERT INTO tbl_train_sked_activities (sked_id, activity_id, sequence_order)
      VALUES (?, ?, ?)
    ");
    
    $sequence = 1;
    foreach ($activity_ids as $activity_id) {
      $stmt->execute([$sked_id, (int)$activity_id, $sequence]);
      $sequence++;
    }
    
    out(['ok' => true, 'message' => 'Activities added successfully']);
  } catch (PDOException $e) {
    error_log("ADD_ACTIVITIES ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// SESSION EQUIPMENT - GET (Add this to api.php)
// ==========================================

// ==========================================
// SESSION EQUIPMENT - GET (Add this to api.php)
// ==========================================

if ($action === 'session_equipment') {
  try {
    $sked_id = (int)($_GET['sked_id'] ?? 0);
    
    if ($sked_id <= 0) {
      out(['ok' => false, 'message' => 'Invalid session ID']);
    }
    
    // Verify coach owns this session (optional security check)
    $verify = $pdo->prepare("
      SELECT 1 FROM tbl_train_sked ts
      JOIN tbl_sports_team st ON st.team_id = ts.team_id
      WHERE ts.sked_id = ? AND st.coach_id = ? AND st.sports_id = ?
    ");
    $verify->execute([$sked_id, $coach_person_id, $sports_id]);
    
    if (!$verify->fetch()) {
      out(['ok' => false, 'message' => 'Access denied']);
    }
    
    // Get equipment for this session
    $stmt = $pdo->prepare("
      SELECT 
        se.sked_equip_id,
        se.equip_id, 
        se.quantity_used, 
        se.notes,
        e.equip_name, 
        e.description,
        e.equip_image,
        e.quantity as total_available
      FROM tbl_train_sked_equipment se
      JOIN tbl_team_equipment e ON e.equip_id = se.equip_id
      WHERE se.sked_id = ?
      ORDER BY e.equip_name
    ");
    $stmt->execute([$sked_id]);
    $equipment = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    out($equipment);
  } catch (PDOException $e) {
    error_log("SESSION_EQUIPMENT ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// EQUIPMENT FOR SESSIONS
// ==========================================

// ==========================================
// EQUIPMENT FOR SESSIONS
// ==========================================

if ($action === 'equipment_list') {
  try {
    $stmt = $pdo->prepare("
      SELECT 
        e.equip_id,
        e.equip_name,
        e.description,
        e.quantity,
        e.is_functional,
        e.equip_image,
        COALESCE(SUM(tse.quantity_used), 0) as total_borrowed
      FROM tbl_team_equipment e
      LEFT JOIN tbl_train_sked_equipment tse ON tse.equip_id = e.equip_id
      LEFT JOIN tbl_train_sked ts ON ts.sked_id = tse.sked_id
      WHERE e.is_functional = 1
      GROUP BY e.equip_id, e.equip_name, e.description, e.quantity, e.is_functional, e.equip_image
      ORDER BY e.equip_name
    ");
    $stmt->execute();
    $equipment = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate available quantity for each equipment
    foreach ($equipment as &$equip) {
      $equip['total_borrowed'] = (int)$equip['total_borrowed'];
      $equip['available'] = max(0, (int)$equip['quantity'] - (int)$equip['total_borrowed']);
      $equip['in_stock'] = $equip['available'] > 0;
    }
    
    out($equipment);
  } catch (PDOException $e) {
    error_log("EQUIPMENT_LIST ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}
// ==========================================
// SESSION EQUIPMENT (Add/View)
// ==========================================

// ==========================================
// SESSION ADD EQUIPMENT (With Stock Validation)
// ==========================================

if ($action === 'session_add_equipment') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $sked_id = (int)($_POST['sked_id'] ?? 0);
    $equipment = json_decode($_POST['equipment'] ?? '[]', true);
    
    error_log("SESSION_ADD_EQUIPMENT: sked_id={$sked_id}, equipment=" . json_encode($equipment));
    
    if ($sked_id <= 0 || !is_array($equipment)) {
      out(['ok' => false, 'message' => 'Invalid parameters']);
    }
    
    // Verify coach owns this session
    $verify = $pdo->prepare("
      SELECT ts.sked_date, ts.team_id
      FROM tbl_train_sked ts
      JOIN tbl_sports_team st ON st.team_id = ts.team_id
      WHERE ts.sked_id = ? AND st.coach_id = ? AND st.sports_id = ?
    ");
    $verify->execute([$sked_id, $coach_person_id, $sports_id]);
    $session = $verify->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
      out(['ok' => false, 'message' => 'Session not found or access denied']);
    }
    
    $session_date = $session['sked_date'];
    error_log("SESSION_ADD_EQUIPMENT: session_date={$session_date}");
    
    // Validate stock availability for each equipment
    $stock_errors = [];
    
    foreach ($equipment as $equip) {
      $equip_id = (int)($equip['equip_id'] ?? 0);
      $requested_qty = (int)($equip['quantity'] ?? 1);
      
      if ($equip_id <= 0 || $requested_qty <= 0) {
        continue;
      }
      
      // Get equipment details and calculate available quantity
      $check_stock = $pdo->prepare("
        SELECT 
          e.equip_name,
          e.quantity as total_quantity,
          COALESCE(SUM(CASE 
            WHEN ts.sked_date = ? AND ts.sked_id != ?
            THEN tse.quantity_used 
            ELSE 0 
          END), 0) as borrowed_on_date
        FROM tbl_team_equipment e
        LEFT JOIN tbl_train_sked_equipment tse ON tse.equip_id = e.equip_id
        LEFT JOIN tbl_train_sked ts ON ts.sked_id = tse.sked_id
        WHERE e.equip_id = ? AND e.is_functional = 1
        GROUP BY e.equip_id, e.equip_name, e.quantity
      ");
      $check_stock->execute([$session_date, $sked_id, $equip_id]);
      $stock_info = $check_stock->fetch(PDO::FETCH_ASSOC);
      
      if (!$stock_info) {
        $stock_errors[] = "Equipment ID {$equip_id} not found or not functional";
        continue;
      }
      
      $available = (int)$stock_info['total_quantity'] - (int)$stock_info['borrowed_on_date'];
      
      error_log("STOCK CHECK: {$stock_info['equip_name']} - total={$stock_info['total_quantity']}, borrowed={$stock_info['borrowed_on_date']}, available={$available}, requested={$requested_qty}");
      
      if ($requested_qty > $available) {
        $stock_errors[] = "{$stock_info['equip_name']}: Only {$available} available (you requested {$requested_qty})";
      }
    }
    
    // If there are stock errors, return them
    if (!empty($stock_errors)) {
      error_log("STOCK ERRORS: " . json_encode($stock_errors));
      out([
        'ok' => false, 
        'message' => 'Equipment not available in requested quantities',
        'errors' => $stock_errors
      ]);
    }
    
    // Start transaction
    $pdo->beginTransaction();
    
    try {
      // Get existing equipment for this session to handle updates
      $existing_stmt = $pdo->prepare("
        SELECT equip_id, quantity_used 
        FROM tbl_train_sked_equipment 
        WHERE sked_id = ?
      ");
      $existing_stmt->execute([$sked_id]);
      $existing_equipment = $existing_stmt->fetchAll(PDO::FETCH_KEY_PAIR);
      
      // Return previously borrowed equipment to inventory (mark as "in")
      foreach ($existing_equipment as $old_equip_id => $old_quantity) {
        // Record return transaction in inventory
        $return_stmt = $pdo->prepare("
          INSERT INTO tbl_equip_inventory 
          (equip_id, trans_type, transdate, trans_by, rec_rel_by, equip_cond)
          VALUES (?, 'in', NOW(), ?, ?, 'Good')
        ");
        $return_stmt->execute([
          $old_equip_id,
          $coach_person_id,
          $coach_person_id
        ]);
        
        error_log("RETURNED EQUIPMENT: equip_id={$old_equip_id}, qty={$old_quantity}");
      }
      
      // Clear existing equipment assignments
      $pdo->prepare("DELETE FROM tbl_train_sked_equipment WHERE sked_id = ?")->execute([$sked_id]);
      
      // Add new equipment assignments and record inventory transactions
      if (!empty($equipment)) {
        $stmt = $pdo->prepare("
          INSERT INTO tbl_train_sked_equipment (sked_id, equip_id, quantity_used)
          VALUES (?, ?, ?)
        ");
        
        $inventory_stmt = $pdo->prepare("
          INSERT INTO tbl_equip_inventory 
          (equip_id, trans_type, transdate, trans_by, rec_rel_by, equip_cond)
          VALUES (?, 'out', NOW(), ?, ?, 'Good')
        ");
        
        foreach ($equipment as $equip) {
          $equip_id = (int)($equip['equip_id'] ?? 0);
          $quantity = (int)($equip['quantity'] ?? 1);
          
          if ($equip_id > 0 && $quantity > 0) {
            // Record equipment assignment to session
            $stmt->execute([$sked_id, $equip_id, $quantity]);
            
            // Record inventory transaction (borrowing - "out")
            // Note: We insert one record per unit borrowed for proper tracking
            for ($i = 0; $i < $quantity; $i++) {
              $inventory_stmt->execute([
                $equip_id,
                $coach_person_id,
                $coach_person_id
              ]);
            }
            
            error_log("BORROWED EQUIPMENT: sked_id={$sked_id}, equip_id={$equip_id}, qty={$quantity}");
          }
        }
      }
      
      $pdo->commit();
      out(['ok' => true, 'message' => 'Equipment assigned successfully']);
      
    } catch (Exception $e) {
      $pdo->rollBack();
      throw $e;
    }
    
  } catch (PDOException $e) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }
    error_log("ADD_EQUIPMENT ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// CHECK EQUIPMENT AVAILABILITY FOR SPECIFIC DATE
// ==========================================

if ($action === 'check_equipment_availability') {
  try {
    $date = $_GET['date'] ?? '';
    $sked_id = (int)($_GET['sked_id'] ?? 0);
    
    if (!$date) {
      out(['ok' => false, 'message' => 'Date is required']);
    }
    
    error_log("CHECK_EQUIPMENT_AVAILABILITY: date={$date}, sked_id={$sked_id}");
    
    $stmt = $pdo->prepare("
      SELECT 
        e.equip_id,
        e.equip_name,
        e.description,
        e.quantity as total_quantity,
        -- Calculate total borrowed on specific date (excluding current session if editing)
        COALESCE(SUM(CASE 
          WHEN ts.sked_date = :check_date AND ts.sked_id != :sked_id
          THEN tse.quantity_used 
          ELSE 0 
        END), 0) as borrowed_on_date,
        -- Calculate total currently out from inventory (overall stock level)
        (
          SELECT COALESCE(
            (SELECT COUNT(*) FROM tbl_equip_inventory WHERE equip_id = e.equip_id AND trans_type = 'out') -
            (SELECT COUNT(*) FROM tbl_equip_inventory WHERE equip_id = e.equip_id AND trans_type = 'in'),
            0
          )
        ) as currently_out
      FROM tbl_team_equipment e
      LEFT JOIN tbl_train_sked_equipment tse ON tse.equip_id = e.equip_id
      LEFT JOIN tbl_train_sked ts ON ts.sked_id = tse.sked_id
      WHERE e.is_functional = 1
      GROUP BY e.equip_id, e.equip_name, e.description, e.quantity
      ORDER BY e.equip_name
    ");
    $stmt->execute([
      'check_date' => $date,
      'sked_id' => $sked_id
    ]);
    $equipment = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($equipment as &$equip) {
      $equip['total_quantity'] = (int)$equip['total_quantity'];
      $equip['borrowed_on_date'] = (int)$equip['borrowed_on_date'];
      $equip['currently_out'] = (int)$equip['currently_out'];
      
      // Available = Total - Currently Out in Inventory - Borrowed on this specific date
      $equip['available'] = max(0, $equip['total_quantity'] - $equip['currently_out'] - $equip['borrowed_on_date']);
      $equip['in_stock'] = $equip['available'] > 0;
      
      error_log("EQUIPMENT {$equip['equip_name']}: total={$equip['total_quantity']}, currently_out={$equip['currently_out']}, borrowed_on_date={$equip['borrowed_on_date']}, available={$equip['available']}");
    }
    
    error_log("CHECK_EQUIPMENT_AVAILABILITY: Found " . count($equipment) . " equipment items");
    
    out(['ok' => true, 'equipment' => $equipment]);
  } catch (PDOException $e) {
    error_log("CHECK_EQUIPMENT_AVAILABILITY ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// Add this new action to api.php
if ($action === 'return_session_equipment') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $sked_id = (int)($_POST['sked_id'] ?? 0);
    
    if ($sked_id <= 0) {
      out(['ok' => false, 'message' => 'Invalid session ID']);
    }
    
    // Verify coach owns this session
    $verify = $pdo->prepare("
      SELECT 1 FROM tbl_train_sked ts
      JOIN tbl_sports_team st ON st.team_id = ts.team_id
      WHERE ts.sked_id = ? AND st.coach_id = ? AND st.sports_id = ?
    ");
    $verify->execute([$sked_id, $coach_person_id, $sports_id]);
    
    if (!$verify->fetch()) {
      out(['ok' => false, 'message' => 'Session not found or access denied']);
    }
    
    $pdo->beginTransaction();
    
    try {
      // Get all equipment for this session
      $equipment_stmt = $pdo->prepare("
        SELECT equip_id, quantity_used 
        FROM tbl_train_sked_equipment 
        WHERE sked_id = ?
      ");
      $equipment_stmt->execute([$sked_id]);
      $equipment_list = $equipment_stmt->fetchAll(PDO::FETCH_ASSOC);
      
      if (empty($equipment_list)) {
        $pdo->rollBack();
        out(['ok' => false, 'message' => 'No equipment found for this session']);
      }
      
      // Record return transaction for each equipment
      $return_stmt = $pdo->prepare("
        INSERT INTO tbl_equip_inventory 
        (equip_id, trans_type, transdate, trans_by, rec_rel_by, equip_cond)
        VALUES (?, 'in', NOW(), ?, ?, ?)
      ");
      
      foreach ($equipment_list as $equip) {
        // Insert one "in" transaction per unit borrowed
        for ($i = 0; $i < $equip['quantity_used']; $i++) {
          $return_stmt->execute([
            $equip['equip_id'],
            $coach_person_id,
            $coach_person_id,
            $_POST['equip_cond'] ?? 'Good' // Can pass condition: Good, Damaged, etc.
          ]);
        }
      }
      
      $pdo->commit();
      out(['ok' => true, 'message' => 'Equipment returned successfully']);
      
    } catch (Exception $e) {
      $pdo->rollBack();
      throw $e;
    }
    
  } catch (PDOException $e) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }
    error_log("RETURN_EQUIPMENT ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// ADD PARTICIPANTS TO SESSION
// ==========================================

if ($action === 'session_add_participants') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $sked_id = (int)($_POST['sked_id'] ?? 0);
    $participants = json_decode($_POST['participants'] ?? '[]', true);
    
    if ($sked_id <= 0 || empty($participants) || !is_array($participants)) {
      out(['ok' => false, 'message' => 'Invalid parameters']);
    }
    
    // Verify coach owns this session
    $verify = $pdo->prepare("
      SELECT 1 FROM tbl_train_sked ts
      JOIN tbl_sports_team st ON st.team_id = ts.team_id
      WHERE ts.sked_id = ? AND st.coach_id = ? AND st.sports_id = ?
    ");
    $verify->execute([$sked_id, $coach_person_id, $sports_id]);
    
    if (!$verify->fetch()) {
      out(['ok' => false, 'message' => 'Session not found or access denied']);
    }
    
    // Clear existing participants
    $pdo->prepare("DELETE FROM tbl_train_sked_participants WHERE sked_id = ?")->execute([$sked_id]);
    
    // Add new participants
    $stmt = $pdo->prepare("
      INSERT INTO tbl_train_sked_participants (sked_id, person_id, participant_type)
      VALUES (?, ?, ?)
    ");
    
    foreach ($participants as $participant) {
      $person_id = (int)($participant['person_id'] ?? 0);
      $type = $participant['type'] ?? 'athlete';
      
      if ($person_id > 0 && in_array($type, ['athlete', 'trainee'])) {
        $stmt->execute([$sked_id, $person_id, $type]);
      }
    }
    
    out(['ok' => true, 'message' => 'Participants added successfully']);
  } catch (PDOException $e) {
    error_log("ADD_PARTICIPANTS ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// GET AVAILABLE TEAM MEMBERS (for a specific session)
// ==========================================

// ==========================================
// GET AVAILABLE TEAM MEMBERS (for a specific session)
// ==========================================

// ==========================================
// GET AVAILABLE TEAM MEMBERS (for a specific session)
// ==========================================

if ($action === 'session_available_members') {
  try {
    $team_id = (int)($_GET['team_id'] ?? 0);
    
    if ($team_id <= 0) {
      out(['ok' => false, 'message' => 'Invalid team ID']);
    }
    
    // Get the sports_id for this team
    $team_query = $pdo->prepare("
      SELECT sports_id 
      FROM tbl_sports_team 
      WHERE team_id = ? AND coach_id = ?
      LIMIT 1
    ");
    $team_query->execute([$team_id, $coach_person_id]);
    $team_data = $team_query->fetch(PDO::FETCH_ASSOC);
    
    if (!$team_data) {
      out(['ok' => false, 'message' => 'Team not found or access denied']);
    }
    
    $team_sports_id = $team_data['sports_id'];
    
    error_log("AVAILABLE_MEMBERS: team_id={$team_id}, sports_id={$team_sports_id}");
    
    // Get athletes for this team
    $athletes_stmt = $pdo->prepare("
      SELECT 
        p.person_id,
        CONCAT(p.f_name, ' ', IFNULL(p.l_name, '')) as full_name,
        'athlete' as member_type,
        IFNULL(ta.is_captain, 0) as is_captain
      FROM tbl_team_athletes ta
      JOIN tbl_person p ON p.person_id = ta.person_id
      WHERE ta.team_id = ? 
        AND ta.sports_id = ? 
        AND ta.is_active = 1
      ORDER BY p.l_name, p.f_name
    ");
    $athletes_stmt->execute([$team_id, $team_sports_id]);
    $athletes = $athletes_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("AVAILABLE_MEMBERS: Found " . count($athletes) . " athletes");
    
    // Get trainees for this team - NOW USING person_id instead of trainee_id
    $trainees_stmt = $pdo->prepare("
      SELECT 
        p.person_id,
        CONCAT(p.f_name, ' ', IFNULL(p.l_name, '')) as full_name,
        'trainee' as member_type,
        0 as is_captain
      FROM tbl_team_trainees tt
      JOIN tbl_person p ON p.person_id = tt.person_id
      WHERE tt.team_id = ? 
        AND tt.is_active = 1
      ORDER BY p.l_name, p.f_name
    ");
    $trainees_stmt->execute([$team_id]);
    $trainees = $trainees_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("AVAILABLE_MEMBERS: Found " . count($trainees) . " trainees");
    
    out([
      'ok' => true,
      'athletes' => $athletes,
      'trainees' => $trainees
    ]);
  } catch (PDOException $e) {
    error_log("AVAILABLE_MEMBERS ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// Update the training_create endpoint to return sked_id
if ($action === 'training_create') {
  // ... existing validation code ...
  
  // After the INSERT, add this before out():
  $sked_id = $pdo->lastInsertId();
  out(['ok'=>true,'message'=>'Training schedule saved', 'sked_id' => $sked_id]);
}

// Update session_attendance to use participants table
if ($action === 'session_attendance_v2') {
  try {
    $sked_id = (int)($_GET['sked_id'] ?? 0);

    if ($sked_id <= 0) {
      out(['ok' => false, 'message' => 'Invalid session ID']);
    }

    error_log("SESSION_ATTENDANCE_V2: sked_id={$sked_id}, coach_id={$coach_person_id}, sports_id={$sports_id}");

    // Verify coach owns this session
    $verify = $pdo->prepare("
      SELECT ts.sked_id, ts.team_id, t.team_name
      FROM tbl_train_sked ts
      JOIN tbl_sports_team st ON st.team_id = ts.team_id
      JOIN tbl_team t ON t.team_id = ts.team_id
      WHERE ts.sked_id = ? AND st.coach_id = ? AND st.sports_id = ?
    ");
    $verify->execute([$sked_id, $coach_person_id, $sports_id]);
    $session = $verify->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
      error_log("SESSION_ATTENDANCE_V2 ERROR: Session not found or access denied");
      out(['ok' => false, 'message' => 'Session not found or access denied']);
    }

    error_log("SESSION_ATTENDANCE_V2: Found session for team_id={$session['team_id']}");

    // Get assigned participants for this session
    $participants_stmt = $pdo->prepare("
      SELECT 
        sp.person_id,
        CONCAT(p.f_name, ' ', IFNULL(p.m_name, ''), ' ', p.l_name) as full_name,
        sp.participant_type as member_type,
        IFNULL(ta.is_present, 0) as is_present
      FROM tbl_train_sked_participants sp
      JOIN tbl_person p ON p.person_id = sp.person_id
      LEFT JOIN tbl_train_attend ta ON ta.sked_id = sp.sked_id AND ta.person_id = sp.person_id
      WHERE sp.sked_id = ?
      ORDER BY p.l_name, p.f_name
    ");
    $participants_stmt->execute([$sked_id]);
    $participants = $participants_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("SESSION_ATTENDANCE_V2: Found " . count($participants) . " participants");
    
    if (count($participants) === 0) {
      // Check if there are team members who could be assigned
      $team_members_check = $pdo->prepare("
        SELECT COUNT(*) as cnt FROM (
          SELECT person_id FROM tbl_team_athletes 
          WHERE team_id = ? AND sports_id = ? AND is_active = 1
          UNION
          SELECT person_id FROM tbl_team_trainees 
          WHERE team_id = ? AND is_active = 1
        ) as members
      ");
      $team_members_check->execute([$session['team_id'], $sports_id, $session['team_id']]);
      $members_count = $team_members_check->fetch(PDO::FETCH_ASSOC);
      
      error_log("SESSION_ATTENDANCE_V2: Team has {$members_count['cnt']} total members");
      
      if ($members_count['cnt'] > 0) {
        out([
          'ok' => false, 
          'message' => "No participants assigned to this session yet. This session has no participants assigned, but the team \"{$session['team_name']}\" has {$members_count['cnt']} members. Click the 'Migrate All Sessions' button above to auto-assign team members to this session.",
          'can_migrate' => true,
          'sked_id' => $sked_id
        ]);
      } else {
        out([
          'ok' => false, 
          'message' => "The team \"{$session['team_name']}\" has no active members (athletes or trainees). Please add team members before tracking attendance.",
          'can_migrate' => false
        ]);
      }
    }
    
    out($participants);
  } catch (PDOException $e) {
    error_log("SESSION_ATTENDANCE_V2 ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}
// ==========================================
// REPORT: SESSIONS
// ==========================================

if ($action === 'report_sessions') {
  try {
    $date_from = $_GET['date_from'] ?? '';
    $date_to = $_GET['date_to'] ?? '';
    $team_id = (int)($_GET['team_id'] ?? 0);
    
    error_log("REPORT_SESSIONS START: coach_id={$coach_person_id}, sports_id={$sports_id}, team_id={$team_id}");
    
    // If team_id provided, verify it belongs to this coach's sport
    if ($team_id > 0) {
      $verify = $pdo->prepare("
        SELECT team_id 
        FROM tbl_sports_team 
        WHERE team_id = ? AND coach_id = ? AND sports_id = ?
      ");
      $verify->execute([$team_id, $coach_person_id, $sports_id]);
      
      if (!$verify->fetch()) {
        error_log("REPORT_SESSIONS BLOCKED: Team {$team_id} not assigned to coach {$coach_person_id} for sport {$sports_id}");
        out([]);
        return;
      }
    }
    
    // Get session summary only for:
    // 1. Teams where this coach is assigned for THIS sport
    // 2. Sessions that have participants verified as athletes/trainees for THIS sport
    $sql = "
      SELECT 
        t.team_name,
        s.sports_name,
        COUNT(DISTINCT ts.sked_id) as total_sessions,
        COUNT(DISTINCT DATE_FORMAT(ts.sked_date, '%Y-%m')) as months_active,
        MIN(ts.sked_date) as first_session,
        MAX(ts.sked_date) as last_session
      FROM tbl_train_sked ts
      INNER JOIN tbl_sports_team st ON st.team_id = ts.team_id 
        AND st.coach_id = :coach_id 
        AND st.sports_id = :sports_id
      INNER JOIN tbl_team t ON t.team_id = ts.team_id
      INNER JOIN tbl_sports s ON s.sports_id = st.sports_id
      WHERE 1=1
        AND EXISTS (
          SELECT 1 
          FROM tbl_train_sked_participants sp
          LEFT JOIN tbl_team_athletes ta_check ON ta_check.person_id = sp.person_id
            AND ta_check.team_id = ts.team_id
            AND ta_check.sports_id = :sports_id2
          LEFT JOIN tbl_team_trainees tt_check ON tt_check.person_id = sp.person_id
            AND tt_check.team_id = ts.team_id
          WHERE sp.sked_id = ts.sked_id
            AND (
              (sp.participant_type = 'athlete' AND ta_check.person_id IS NOT NULL AND ta_check.is_active = 1)
              OR
              (sp.participant_type = 'trainee' AND tt_check.person_id IS NOT NULL AND tt_check.is_active = 1)
            )
        )
    ";
    
    $params = [
      'coach_id' => $coach_person_id,
      'sports_id' => $sports_id,
      'sports_id2' => $sports_id
    ];
    
    if (!empty($date_from)) {
      $sql .= " AND ts.sked_date >= :date_from";
      $params['date_from'] = $date_from;
    }
    
    if (!empty($date_to)) {
      $sql .= " AND ts.sked_date <= :date_to";
      $params['date_to'] = $date_to;
    }
    
    if ($team_id > 0) {
      $sql .= " AND ts.team_id = :team_id";
      $params['team_id'] = $team_id;
    }
    
    $sql .= " GROUP BY t.team_name, s.sports_name
              ORDER BY total_sessions DESC, t.team_name";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("REPORT_SESSIONS SUCCESS: " . count($results) . " team summaries for coach sport {$sports_id}");
    
    out($results);
  } catch (PDOException $e) {
    error_log("REPORT_SESSIONS ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error']);
  }
}

// ==========================================
// REPORT: PLAYER ATTENDANCE DETAIL
// ==========================================
if ($action === 'report_player_attendance') {
  try {
    $date_from = $_GET['date_from'] ?? '';
    $date_to = $_GET['date_to'] ?? '';
    $team_id = (int)($_GET['team_id'] ?? 0);
    
    error_log("REPORT_PLAYER_ATTENDANCE START: coach_id={$coach_person_id}, sports_id={$sports_id}, team_id={$team_id}");
    
    // If team_id provided, verify it belongs to this coach's sport
    if ($team_id > 0) {
      $verify = $pdo->prepare("
        SELECT team_id 
        FROM tbl_sports_team 
        WHERE team_id = ? AND coach_id = ? AND sports_id = ?
      ");
      $verify->execute([$team_id, $coach_person_id, $sports_id]);
      
      if (!$verify->fetch()) {
        error_log("REPORT_PLAYER_ATTENDANCE BLOCKED: Team {$team_id} not assigned to coach {$coach_person_id} for sport {$sports_id}");
        out([]);
        return;
      }
    }
    
    // Get detailed player attendance only for:
    // 1. Teams where this coach is assigned (coach_id matches)
    // 2. The coach's assigned sport (sports_id matches)
    // 3. Only participants who are athletes in THIS specific sport
    $sql = "
      SELECT 
        p.person_id,
        CONCAT(p.f_name, ' ', p.l_name) as player_name,
        t.team_name,
        s.sports_name,
        sp.participant_type as member_type,
        COUNT(DISTINCT ts.sked_id) as total_sessions,
        COUNT(DISTINCT CASE WHEN ta.is_present = 1 THEN ts.sked_id END) as sessions_attended,
        COUNT(DISTINCT CASE WHEN ta.is_present = 0 OR ta.is_present IS NULL THEN ts.sked_id END) as sessions_missed,
        ROUND(
          (COUNT(DISTINCT CASE WHEN ta.is_present = 1 THEN ts.sked_id END) / 
           NULLIF(COUNT(DISTINCT ts.sked_id), 0)) * 100, 
          1
        ) as attendance_rate
      FROM tbl_train_sked_participants sp
      INNER JOIN tbl_train_sked ts ON ts.sked_id = sp.sked_id
      INNER JOIN tbl_sports_team st ON st.team_id = ts.team_id 
        AND st.coach_id = :coach_id 
        AND st.sports_id = :sports_id
      INNER JOIN tbl_person p ON p.person_id = sp.person_id
      INNER JOIN tbl_team t ON t.team_id = ts.team_id
      INNER JOIN tbl_sports s ON s.sports_id = st.sports_id
      LEFT JOIN tbl_train_attend ta ON ta.sked_id = ts.sked_id AND ta.person_id = sp.person_id
      LEFT JOIN tbl_team_athletes ta_check ON ta_check.person_id = p.person_id
        AND ta_check.team_id = ts.team_id
        AND ta_check.sports_id = :sports_id2
      LEFT JOIN tbl_team_trainees tt_check ON tt_check.person_id = p.person_id
        AND tt_check.team_id = ts.team_id
      WHERE 1=1
        AND (
          (sp.participant_type = 'athlete' AND ta_check.person_id IS NOT NULL AND ta_check.is_active = 1)
          OR
          (sp.participant_type = 'trainee' AND tt_check.person_id IS NOT NULL AND tt_check.is_active = 1)
        )
    ";
    
    $params = [
      'coach_id' => $coach_person_id,
      'sports_id' => $sports_id,
      'sports_id2' => $sports_id
    ];
    
    if (!empty($date_from)) {
      $sql .= " AND ts.sked_date >= :date_from";
      $params['date_from'] = $date_from;
    }
    
    if (!empty($date_to)) {
      $sql .= " AND ts.sked_date <= :date_to";
      $params['date_to'] = $date_to;
    }
    
    if ($team_id > 0) {
      $sql .= " AND ts.team_id = :team_id";
      $params['team_id'] = $team_id;
    }
    
    $sql .= " GROUP BY p.person_id, player_name, t.team_name, s.sports_name, sp.participant_type
              ORDER BY attendance_rate DESC, player_name";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("REPORT_PLAYER_ATTENDANCE SUCCESS: " . count($results) . " players for coach sport {$sports_id}");
    
    out($results);
  } catch (PDOException $e) {
    error_log("REPORT_PLAYER_ATTENDANCE ERROR: " . $e->getMessage());
    error_log("REPORT_PLAYER_ATTENDANCE TRACE: " . $e->getTraceAsString());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// GET PLAYER
// ==========================================

if ($action === 'get_player') {
  try {
    $person_id = (int)($_GET['person_id'] ?? 0);
    
    error_log("GET_PLAYER: Starting - person_id={$person_id}, coach_id={$coach_person_id}, sports_id={$sports_id}");
    
    if ($person_id <= 0) {
      error_log("GET_PLAYER ERROR: Invalid person_id");
      http_response_code(400);
      out(['ok'=>false,'message'=>'Invalid person ID']);
    }
    
    // Verify person exists
    $check_person = $pdo->prepare("SELECT person_id, role_type FROM tbl_person WHERE person_id = :pid LIMIT 1");
    $check_person->execute(['pid' => $person_id]);
    $person_exists = $check_person->fetch(PDO::FETCH_ASSOC);
    
    if (!$person_exists) {
      error_log("GET_PLAYER ERROR: Person {$person_id} not found in tbl_person");
      http_response_code(404);
      out(['ok'=>false,'message'=>'Person not found']);
    }
    
    error_log("GET_PLAYER: Person exists with role=" . $person_exists['role_type']);
    
    // Verify player belongs to coach's team
    $verify = $pdo->prepare("
      SELECT 
        ta.team_ath_id, 
        ta.team_id, 
        ta.tour_id, 
        ta.person_id,
        ta.sports_id
      FROM tbl_team_athletes ta
      INNER JOIN tbl_sports_team st 
        ON st.team_id = ta.team_id 
        AND st.tour_id = ta.tour_id 
        AND st.sports_id = ta.sports_id
      WHERE ta.person_id = :person_id 
        AND ta.sports_id = :sports_id
        AND ta.is_active = 1
        AND st.coach_id = :coach_id
      LIMIT 1
    ");
    
    $verify->execute([
      'person_id' => $person_id,
      'coach_id' => $coach_person_id,
      'sports_id' => $sports_id
    ]);
    
    $verification = $verify->fetch(PDO::FETCH_ASSOC);
    
    if (!$verification) {
      error_log("GET_PLAYER ERROR: Player {$person_id} not in coach {$coach_person_id}'s team for sport {$sports_id}");
      http_response_code(403);
      out(['ok'=>false,'message'=>'Player not in your team']);
    }
    
    error_log("GET_PLAYER: Verification passed");
    
    // Get player data
    $stmt = $pdo->prepare("
      SELECT 
        p.person_id,
        p.f_name,
        p.l_name,
        IFNULL(p.m_name, '') as m_name,
        p.date_birth,
        IFNULL(p.blood_type, '') as blood_type,
        IFNULL(p.course, '') as course
      FROM tbl_person p
      WHERE p.person_id = :person_id
      LIMIT 1
    ");
    
    $stmt->execute(['person_id' => $person_id]);
    $player = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$player) {
      error_log("GET_PLAYER ERROR: Failed to fetch person data");
      http_response_code(500);
      out(['ok'=>false,'message'=>'Failed to retrieve player data']);
    }
    
    // Get latest vital signs
    $vital_stmt = $pdo->prepare("
      SELECT 
        IFNULL(height, '') as height,
        IFNULL(weight, '') as weight,
        IFNULL(b_pressure, '') as b_pressure,
        IFNULL(b_sugar, '') as b_sugar,
        IFNULL(b_choles, '') as b_choles
      FROM tbl_vital_signs
      WHERE person_id = :person_id
      ORDER BY date_taken DESC
      LIMIT 1
    ");
    
    $vital_stmt->execute(['person_id' => $person_id]);
    $vitals = $vital_stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($vitals) {
      $player['height'] = $vitals['height'];
      $player['weight'] = $vitals['weight'];
      $player['b_pressure'] = $vitals['b_pressure'];
      $player['b_sugar'] = $vitals['b_sugar'];
      $player['b_choles'] = $vitals['b_choles'];
    } else {
      $player['height'] = '';
      $player['weight'] = '';
      $player['b_pressure'] = '';
      $player['b_sugar'] = '';
      $player['b_choles'] = '';
    }
    
    error_log("GET_PLAYER SUCCESS: Returning player data");
    out($player);
    
  } catch (PDOException $e) {
    error_log("GET_PLAYER PDO ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error: ' . $e->getMessage()]);
  } catch (Exception $e) {
    error_log("GET_PLAYER EXCEPTION: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Error: ' . $e->getMessage()]);
  }
}

// ==========================================
// UPDATE PLAYER
// ==========================================

if ($action === 'update_player') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $person_id = (int)($_POST['person_id'] ?? 0);
    
    if ($person_id <= 0) {
      http_response_code(400);
      out(['ok'=>false,'message'=>'Invalid person ID']);
    }
    
    // Verify player belongs to coach's team
    $verify = $pdo->prepare("
      SELECT 1 FROM tbl_team_athletes ta
      WHERE ta.person_id = :person_id 
      AND ta.sports_id = :sports_id
      AND ta.is_active = 1
      AND EXISTS (
        SELECT 1 FROM tbl_sports_team st 
        WHERE st.team_id = ta.team_id 
        AND st.tour_id = ta.tour_id 
        AND st.sports_id = ta.sports_id
        AND st.coach_id = :coach_id
      )
      LIMIT 1
    ");
    $verify->execute([
      'person_id'=>$person_id,
      'coach_id'=>$coach_person_id,
      'sports_id'=>$sports_id
    ]);
    
    if (!$verify->fetch()) {
      http_response_code(403);
      out(['ok'=>false,'message'=>'Player not in your team']);
    }
    
    $pdo->beginTransaction();
    
    // Update tbl_person
    $stmt = $pdo->prepare("
      UPDATE tbl_person 
      SET f_name = :f_name,
          l_name = :l_name,
          m_name = :m_name,
          date_birth = :date_birth,
          blood_type = :blood_type,
          course = :course
      WHERE person_id = :person_id
    ");
    
    $stmt->execute([
      'person_id' => $person_id,
      'f_name' => trim($_POST['f_name']),
      'l_name' => trim($_POST['l_name']),
      'm_name' => trim($_POST['m_name'] ?? ''),
      'date_birth' => $_POST['date_birth'],
      'blood_type' => !empty($_POST['blood_type']) ? $_POST['blood_type'] : null,
      'course' => trim($_POST['course'] ?? '')
    ]);
    
    // Check if vital signs record exists
    $check_vital = $pdo->prepare("SELECT vital_id FROM tbl_vital_signs WHERE person_id = :person_id ORDER BY date_taken DESC LIMIT 1");
    $check_vital->execute(['person_id'=>$person_id]);
    $vital_exists = $check_vital->fetch();
    
    // Only update/insert vital signs if at least one field has a value
    $has_vital_data = !empty($_POST['height']) || !empty($_POST['weight']) || 
                      !empty($_POST['b_pressure']) || !empty($_POST['b_sugar']) || !empty($_POST['b_choles']);
    
    if ($has_vital_data) {
      if ($vital_exists) {
        $stmt = $pdo->prepare("
          UPDATE tbl_vital_signs 
          SET height = :height,
              weight = :weight,
              b_pressure = :b_pressure,
              b_sugar = :b_sugar,
              b_choles = :b_choles,
              date_taken = CURDATE()
          WHERE vital_id = :vital_id
        ");
        $stmt->execute([
          'vital_id' => $vital_exists['vital_id'],
          'height' => !empty($_POST['height']) ? $_POST['height'] : null,
          'weight' => !empty($_POST['weight']) ? $_POST['weight'] : null,
          'b_pressure' => !empty($_POST['b_pressure']) ? trim($_POST['b_pressure']) : null,
          'b_sugar' => !empty($_POST['b_sugar']) ? trim($_POST['b_sugar']) : null,
          'b_choles' => !empty($_POST['b_choles']) ? trim($_POST['b_choles']) : null
        ]);
      } else {
        $stmt = $pdo->prepare("
          INSERT INTO tbl_vital_signs 
          (person_id, height, weight, b_pressure, b_sugar, b_choles, date_taken)
          VALUES 
          (:person_id, :height, :weight, :b_pressure, :b_sugar, :b_choles, CURDATE())
        ");
        $stmt->execute([
          'person_id' => $person_id,
          'height' => !empty($_POST['height']) ? $_POST['height'] : null,
          'weight' => !empty($_POST['weight']) ? $_POST['weight'] : null,
          'b_pressure' => !empty($_POST['b_pressure']) ? trim($_POST['b_pressure']) : null,
          'b_sugar' => !empty($_POST['b_sugar']) ? trim($_POST['b_sugar']) : null,
          'b_choles' => !empty($_POST['b_choles']) ? trim($_POST['b_choles']) : null
        ]);
      }
    }
    
    $pdo->commit();
    
    out(['ok'=>true,'message'=>'Player information updated successfully']);
    
  } catch (PDOException $e) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
  }
}

// ==========================================
// SESSION ATTENDANCE
// ==========================================

if ($action === 'session_attendance') {
  try {
    $sked_id = (int)($_GET['sked_id'] ?? 0);

    if ($sked_id <= 0) {
      error_log("SESSION_ATTENDANCE ERROR: Invalid sked_id={$sked_id}");
      out(['ok' => false, 'message' => 'Invalid session ID']);
    }

    error_log("SESSION_ATTENDANCE: sked_id={$sked_id}, coach_id={$coach_person_id}, sports_id={$sports_id}");

    // First, get the session details
    $session_query = $pdo->prepare("
      SELECT ts.sked_id, ts.team_id, ts.sked_date, ts.sked_time
      FROM tbl_train_sked ts
      WHERE ts.sked_id = ?
    ");
    $session_query->execute([$sked_id]);
    $session = $session_query->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
      error_log("SESSION_ATTENDANCE ERROR: Session {$sked_id} not found in tbl_train_sked");
      out(['ok' => false, 'message' => 'Session not found']);
    }
    
    $team_id = $session['team_id'];
    error_log("SESSION_ATTENDANCE: Found session - team_id={$team_id}");

    // Verify this coach owns this team
    $coach_check = $pdo->prepare("
      SELECT st.team_id, st.coach_id, st.sports_id
      FROM tbl_sports_team st
      WHERE st.team_id = ? AND st.coach_id = ? AND st.sports_id = ?
    ");
    $coach_check->execute([$team_id, $coach_person_id, $sports_id]);
    $coach_team = $coach_check->fetch(PDO::FETCH_ASSOC);
    
    if (!$coach_team) {
      error_log("SESSION_ATTENDANCE ERROR: Coach {$coach_person_id} does not own team {$team_id} for sport {$sports_id}");
      out(['ok' => false, 'message' => 'You can only view attendance for your own team sessions']);
    }

    error_log("SESSION_ATTENDANCE: Coach verified for team {$team_id}");

    // Get ALL people associated with this team - BOTH athletes AND trainees
    // UNION to combine tbl_team_athletes and tbl_team_trainees
    $players_query = $pdo->prepare("
      SELECT DISTINCT
        p.person_id,
        p.f_name,
        p.m_name,
        p.l_name,
        'athlete' as member_type
      FROM tbl_team_athletes ta
      JOIN tbl_person p ON p.person_id = ta.person_id
      WHERE ta.team_id = ?
      AND ta.sports_id = ?
      AND ta.is_active = 1
      
      UNION
      
      SELECT DISTINCT
        p.person_id,
        p.f_name,
        p.m_name,
        p.l_name,
        'trainee' as member_type
      FROM tbl_team_trainees tt
      JOIN tbl_person p ON p.person_id = tt.trainee_id
      WHERE tt.team_id = ?
      AND tt.is_active = 1
      
      ORDER BY l_name, f_name
    ");
    $players_query->execute([$team_id, $sports_id, $team_id]);
    $players = $players_query->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("SESSION_ATTENDANCE: Found " . count($players) . " members (athletes + trainees) in team {$team_id}");

    if (count($players) === 0) {
      // Debug: Check both tables
      $debug_athletes = $pdo->prepare("SELECT COUNT(*) as cnt FROM tbl_team_athletes WHERE team_id = ?");
      $debug_athletes->execute([$team_id]);
      $athletes_count = $debug_athletes->fetch(PDO::FETCH_ASSOC);
      
      $debug_trainees = $pdo->prepare("SELECT COUNT(*) as cnt FROM tbl_team_trainees WHERE team_id = ?");
      $debug_trainees->execute([$team_id]);
      $trainees_count = $debug_trainees->fetch(PDO::FETCH_ASSOC);
      
      error_log("SESSION_ATTENDANCE DEBUG: Athletes in team: " . $athletes_count['cnt'] . ", Trainees: " . $trainees_count['cnt']);
      
      out(['ok' => false, 'message' => 'No active members found in this team. Please add athletes or trainees to this team first.']);
    }

    // Now get attendance records for this session
    $attendance_query = $pdo->prepare("
      SELECT person_id, is_present
      FROM tbl_train_attend
      WHERE sked_id = ?
    ");
    $attendance_query->execute([$sked_id]);
    $attendance_records = $attendance_query->fetchAll(PDO::FETCH_ASSOC);
    
    // Create a map of attendance
    $attendance_map = [];
    foreach ($attendance_records as $record) {
      $attendance_map[$record['person_id']] = (int)$record['is_present'];
    }
    
    error_log("SESSION_ATTENDANCE: Found " . count($attendance_records) . " attendance records");

    // Combine players with attendance status
    $result = [];
    foreach ($players as $player) {
      $person_id = $player['person_id'];
      $middle = $player['m_name'] ? ' ' . $player['m_name'] . ' ' : ' ';
      
      $result[] = [
        'person_id' => $person_id,
        'player_name' => $player['f_name'] . $middle . $player['l_name'],
        'member_type' => $player['member_type'],
        'is_present' => isset($attendance_map[$person_id]) ? $attendance_map[$person_id] : 0
      ];
    }
    
    error_log("SESSION_ATTENDANCE SUCCESS: Returning " . count($result) . " records");
    out($result);
    
  } catch (PDOException $e) {
    error_log("SESSION_ATTENDANCE PDO ERROR: " . $e->getMessage());
    error_log("SESSION_ATTENDANCE TRACE: " . $e->getTraceAsString());
    out(['ok' => false, 'error' => $e->getMessage(), 'message' => 'Database error: ' . $e->getMessage()]);
  } catch (Exception $e) {
    error_log("SESSION_ATTENDANCE EXCEPTION: " . $e->getMessage());
    out(['ok' => false, 'error' => $e->getMessage(), 'message' => 'Error: ' . $e->getMessage()]);
  }
}

// ==========================================
// MARK ATTENDANCE
// ==========================================

if ($action === 'mark_attendance') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $sked_id = (int)($_POST['sked_id'] ?? 0);
    $person_id_player = (int)($_POST['person_id'] ?? 0);
    $is_present = (int)($_POST['is_present'] ?? 0);

    if ($sked_id <= 0 || $person_id_player <= 0) {
      out(['ok' => false, 'message' => 'Invalid parameters']);
    }

    // Verify coach owns this session
    $verify = $pdo->prepare("
      SELECT ts.sked_id 
      FROM tbl_train_sked ts
      JOIN tbl_sports_team st ON st.team_id = ts.team_id
      WHERE ts.sked_id = ? AND st.coach_id = ? AND st.sports_id = ?
    ");
    $verify->execute([$sked_id, $coach_person_id, $sports_id]);
    
    if (!$verify->fetch()) {
      out(['ok' => false, 'message' => 'You can only mark attendance for your own sessions']);
    }

    // Check if attendance record exists
    $check = $pdo->prepare("
      SELECT * FROM tbl_train_attend 
      WHERE sked_id = ? AND person_id = ?
    ");
    $check->execute([$sked_id, $person_id_player]);
    
    if ($check->fetch()) {
      // Update existing
      $stmt = $pdo->prepare("
        UPDATE tbl_train_attend
        SET is_present = ?
        WHERE sked_id = ? AND person_id = ?
      ");
      $stmt->execute([$is_present, $sked_id, $person_id_player]);
    } else {
      // Insert new
      $stmt = $pdo->prepare("
        INSERT INTO tbl_train_attend (sked_id, person_id, is_present)
        VALUES (?, ?, ?)
      ");
      $stmt->execute([$sked_id, $person_id_player, $is_present]);
    }

    out(['ok' => true, 'message' => 'Attendance saved successfully']);
  } catch (PDOException $e) {
    out(['ok' => false, 'message' => $e->getMessage()]);
  }
}

// ==========================================
// TRAINING ACTIVITIES
// ==========================================

if ($action === 'training_activities') {
  try {
    $stmt = $pdo->prepare("
      SELECT 
        activity_id,
        activity_name,
        duration,
        repetition,
        is_active
      FROM tbl_training_activity
      WHERE sports_id = ?
      AND is_active = 1
      ORDER BY activity_name
    ");
    $stmt->execute([$sports_id]);
    $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
    out($activities);
  } catch (PDOException $e) {
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}
// ==========================================
// PERFORMANCE LIST - FILTERED BY COACH'S ATHLETES
// ==========================================

if ($action === 'performance_list') {
  try {
    error_log("PERFORMANCE_LIST: coach_id={$coach_person_id}, sports_id={$sports_id}");
    
    // Only show performance ratings for athletes that belong to:
    // 1. Teams coached by this coach
    // 2. The coach's assigned sport
    
    $stmt = $pdo->prepare("
      SELECT 
        tp.perf_id,
        tp.person_id,
        CONCAT(p.f_name, ' ', p.l_name) as player_name,
        ta.activity_name,
        t.team_name,
        tp.rating,
        tp.date_eval,
        tp.activitity_id as activity_id,
        tp.team_id
      FROM tbl_train_perf tp
      JOIN tbl_person p ON p.person_id = tp.person_id
      JOIN tbl_training_activity ta ON ta.activity_id = tp.activitity_id
      JOIN tbl_team t ON t.team_id = tp.team_id
      JOIN tbl_sports_team st ON st.team_id = tp.team_id
      WHERE st.coach_id = :coach_id 
        AND st.sports_id = :sports_id
        AND ta.sports_id = :sports_id2
      ORDER BY tp.date_eval DESC, p.l_name, p.f_name
    ");
    $stmt->execute([
      'coach_id' => $coach_person_id, 
      'sports_id' => $sports_id,
      'sports_id2' => $sports_id
    ]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("PERFORMANCE_LIST SUCCESS: Found " . count($results) . " ratings");
    out($results);
  } catch (PDOException $e) {
    error_log("PERFORMANCE_LIST ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error: ' . $e->getMessage(), 'error' => $e->getMessage()]);
  }
}

// ==========================================
// SAVE PERFORMANCE - VALIDATE COACH'S ATHLETE
// ==========================================

if ($action === 'save_performance') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $perf_id = (int)($_POST['perf_id'] ?? 0);
    $person_id_param = (int)($_POST['person_id'] ?? 0);
    $activity_id = (int)($_POST['activity_id'] ?? 0);
    $team_id = (int)($_POST['team_id'] ?? 0);
    $rating = floatval($_POST['rating'] ?? 0);
    $date_eval = $_POST['date_eval'] ?? '';

    error_log("SAVE_PERFORMANCE: perf_id={$perf_id}, person_id={$person_id_param}, activity_id={$activity_id}, team_id={$team_id}, rating={$rating}, date={$date_eval}");

    // Validation
    if (!$person_id_param || !$activity_id || !$team_id || !$rating || !$date_eval) {
      error_log("SAVE_PERFORMANCE ERROR: Missing required fields");
      out(['ok' => false, 'message' => 'All fields are required']);
    }

    if ($rating < 1 || $rating > 10) {
      error_log("SAVE_PERFORMANCE ERROR: Invalid rating={$rating}");
      out(['ok' => false, 'message' => 'Rating must be between 1 and 10']);
    }

    // Verify team belongs to coach AND is the correct sport
    $verify_team = $pdo->prepare("
      SELECT team_id 
      FROM tbl_sports_team 
      WHERE team_id = ? AND coach_id = ? AND sports_id = ?
    ");
    $verify_team->execute([$team_id, $coach_person_id, $sports_id]);
    
    if (!$verify_team->fetch()) {
      error_log("SAVE_PERFORMANCE ERROR: Coach {$coach_person_id} not authorized for team {$team_id}");
      out(['ok' => false, 'message' => 'You are not authorized for this team']);
    }
    
    // Verify athlete belongs to this team
    $verify_athlete = $pdo->prepare("
      SELECT ta.person_id 
      FROM tbl_team_athletes ta
      WHERE ta.person_id = ? 
        AND ta.team_id = ? 
        AND ta.sports_id = ?
        AND ta.is_active = 1
      LIMIT 1
    ");
    $verify_athlete->execute([$person_id_param, $team_id, $sports_id]);
    
    if (!$verify_athlete->fetch()) {
      error_log("SAVE_PERFORMANCE ERROR: Athlete {$person_id_param} not in team {$team_id}");
      out(['ok' => false, 'message' => 'This athlete is not in the selected team']);
    }
    
    // Verify activity belongs to this sport
    $verify_activity = $pdo->prepare("
      SELECT activity_id 
      FROM tbl_training_activity 
      WHERE activity_id = ? AND sports_id = ? AND is_active = 1
    ");
    $verify_activity->execute([$activity_id, $sports_id]);
    
    if (!$verify_activity->fetch()) {
      error_log("SAVE_PERFORMANCE ERROR: Activity {$activity_id} not for sport {$sports_id}");
      out(['ok' => false, 'message' => 'This activity is not for your sport']);
    }

    if ($perf_id > 0) {
      // Update existing - verify ownership first
      $verify_perf = $pdo->prepare("
        SELECT tp.perf_id 
        FROM tbl_train_perf tp
        JOIN tbl_sports_team st ON st.team_id = tp.team_id
        WHERE tp.perf_id = ? AND st.coach_id = ? AND st.sports_id = ?
      ");
      $verify_perf->execute([$perf_id, $coach_person_id, $sports_id]);
      
      if (!$verify_perf->fetch()) {
        out(['ok' => false, 'message' => 'Performance record not found or access denied']);
      }
      
      error_log("SAVE_PERFORMANCE: Updating existing perf_id={$perf_id}");
      $stmt = $pdo->prepare("
        UPDATE tbl_train_perf
        SET person_id = ?,
            activitity_id = ?,
            rating = ?,
            date_eval = ?,
            team_id = ?
        WHERE perf_id = ?
      ");
      $stmt->execute([
        $person_id_param,
        $activity_id,
        $rating,
        $date_eval,
        $team_id,
        $perf_id
      ]);
      error_log("SAVE_PERFORMANCE SUCCESS: Updated perf_id={$perf_id}");
      out(['ok' => true, 'message' => 'Performance rating updated successfully']);
    } else {
      // Insert new
      error_log("SAVE_PERFORMANCE: Inserting new record");
      $stmt = $pdo->prepare("
        INSERT INTO tbl_train_perf 
        (person_id, activitity_id, rating, date_eval, team_id)
        VALUES (?, ?, ?, ?, ?)
      ");
      $stmt->execute([
        $person_id_param,
        $activity_id,
        $rating,
        $date_eval,
        $team_id
      ]);
      $new_id = $pdo->lastInsertId();
      error_log("SAVE_PERFORMANCE SUCCESS: Inserted new perf_id={$new_id}");
      out(['ok' => true, 'message' => 'Performance rating saved successfully']);
    }
  } catch (PDOException $e) {
    error_log("SAVE_PERFORMANCE PDO ERROR: " . $e->getMessage());
    http_response_code(500);
    out(['ok' => false, 'message' => 'Database error: ' . $e->getMessage(), 'error' => $e->getMessage()]);
  }
}

// ==========================================
// GET PERFORMANCE - VALIDATE OWNERSHIP
// ==========================================

if ($action === 'get_performance') {
  try {
    $perf_id = (int)($_GET['perf_id'] ?? 0);
    
    if ($perf_id <= 0) {
      out(['ok' => false, 'message' => 'Invalid performance ID']);
    }
    
    // Only return if coach owns this performance record
    $stmt = $pdo->prepare("
      SELECT 
        tp.perf_id,
        tp.person_id,
        tp.activitity_id as activity_id,
        tp.team_id,
        tp.rating,
        tp.date_eval
      FROM tbl_train_perf tp
      JOIN tbl_sports_team st ON st.team_id = tp.team_id
      WHERE tp.perf_id = ?
        AND st.coach_id = ? 
        AND st.sports_id = ?
      LIMIT 1
    ");
    $stmt->execute([$perf_id, $coach_person_id, $sports_id]);
    $perf = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($perf) {
      out($perf);
    } else {
      out(['ok' => false, 'message' => 'Performance record not found']);
    }
  } catch (PDOException $e) {
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

// ==========================================
// DELETE PERFORMANCE - VALIDATE OWNERSHIP
// ==========================================

if ($action === 'delete_performance') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    out(['ok'=>false,'message'=>'Method not allowed']);
  }

  try {
    $perf_id = (int)($_POST['perf_id'] ?? 0);

    if ($perf_id <= 0) {
      out(['ok' => false, 'message' => 'Invalid performance ID']);
    }

    // Delete only if coach owns the team
    $stmt = $pdo->prepare("
      DELETE tp FROM tbl_train_perf tp
      JOIN tbl_sports_team st ON st.team_id = tp.team_id
      WHERE tp.perf_id = ?
        AND st.coach_id = ? 
        AND st.sports_id = ?
    ");
    $stmt->execute([$perf_id, $coach_person_id, $sports_id]);

    if ($stmt->rowCount() > 0) {
      out(['ok' => true, 'message' => 'Performance rating deleted successfully']);
    } else {
      out(['ok' => false, 'message' => 'Performance record not found or you do not have permission']);
    }
  } catch (PDOException $e) {
    out(['ok' => false, 'message' => $e->getMessage()]);
  }
}

http_response_code(404);
out(['ok'=>false,'message'=>'Unknown action']);