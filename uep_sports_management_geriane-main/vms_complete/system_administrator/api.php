<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../auth/guard.php';

// Only admin/administrator/system administrator role
$user_role = $_SESSION['user']['user_role'] ?? '';
$normalized_role = strtolower(str_replace(['/', ' '], '_', trim($user_role)));

if ($normalized_role !== 'admin' && 
    $normalized_role !== 'administrator' && 
    $normalized_role !== 'system_administrator') {
    http_response_code(403);
    out(['ok' => false, 'message' => 'Access denied']);
}

header("Content-Type: application/json; charset=utf-8");

$user_id = (int)$_SESSION['user']['user_id'];
$person_id = (int)$_SESSION['user']['person_id'];

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];

function out($data) {
  echo json_encode($data);
  exit;
}

// Replace the logActivity function in system_administrator/api.php

function logActivity($pdo, $user_id, $person_id, $action_type, $description, $module = 'System Administration', $options = []) {
  try {
    // Get user info for detailed logging
    $stmt = $pdo->prepare("
      SELECT u.username, u.user_role, p.f_name, p.l_name, p.role_type 
      FROM tbl_users u 
      JOIN tbl_person p ON p.person_id = u.person_id 
      WHERE u.user_id = ?
    ");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
      $full_name = trim(($user['f_name'] ?? '') . ' ' . ($user['l_name'] ?? ''));
      $user_role = $user['user_role'] ?? 'Unknown';
      
      // Build enhanced log event with full context
      $enhanced_description = "[{$user_role}] {$full_name} {$description}";
    } else {
      $enhanced_description = $description;
    }
    
    // Insert enhanced log
    $stmt = $pdo->prepare("
      INSERT INTO tbl_logs 
      (user_id, log_event, log_date, module_name, action_type, target_table, target_id, old_data, new_data, can_revert) 
      VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
      $user_id,
      $enhanced_description,
      $module,
      $action_type,
      $options['target_table'] ?? null,
      $options['target_id'] ?? null,
      isset($options['old_data']) ? json_encode($options['old_data']) : null,
      isset($options['new_data']) ? json_encode($options['new_data']) : null,
      $options['can_revert'] ?? 0
    ]);
    
    return $pdo->lastInsertId();
  } catch (PDOException $e) {
    error_log("LOG_ACTIVITY ERROR: " . $e->getMessage());
    return false;
  }
}

// ==========================================
// ADMIN STATISTICS
// ==========================================

if ($action === 'admin_stats') {
  try {
    $total_users = $pdo->query("SELECT COUNT(*) as count FROM tbl_users")->fetch()['count'];
    $active_users = $pdo->query("SELECT COUNT(*) as count FROM tbl_users WHERE is_active=1")->fetch()['count'];
    $total_athletes = $pdo->query("SELECT COUNT(*) as count FROM tbl_person WHERE role_type IN ('athlete','athlete/player') AND is_active=1")->fetch()['count'];
    $active_sports = $pdo->query("SELECT COUNT(*) as count FROM tbl_sports WHERE is_active=1")->fetch()['count'];
    
    out([
      'total_users' => $total_users,
      'active_users' => $active_users,
      'total_athletes' => $total_athletes,
      'active_sports' => $active_sports
    ]);
  } catch (PDOException $e) {
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

// ==========================================
// USER MANAGEMENT
// ==========================================

if ($action === 'users') {
  try {
    $stmt = $pdo->query("
      SELECT 
        u.user_id,
        u.person_id,
        u.username,
        u.user_role,
        u.is_active,
        p.f_name,
        p.l_name,
        p.m_name,
        p.title,
        p.date_birth,
        p.college_code,
        p.course,
        p.blood_type,
        p.role_type,
        c.college_name
      FROM tbl_users u
      JOIN tbl_person p ON p.person_id = u.person_id
      LEFT JOIN tbl_college c ON c.college_code = p.college_code
      ORDER BY u.user_id DESC
    ");
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

if ($action === 'create_user') {
  try {
    // Validation
    if (empty($input['f_name']) || empty($input['l_name'])) {
      out(['ok' => false, 'error' => 'First name and last name are required']);
    }
    
    if (empty($input['username']) || empty($input['password'])) {
      out(['ok' => false, 'error' => 'Username and password are required']);
    }
    
    if (empty($input['role_type']) || empty($input['user_role'])) {
      out(['ok' => false, 'error' => 'Role type and user role are required']);
    }
    
    // Check if username already exists
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM tbl_users WHERE username = ?");
    $stmt->execute([$input['username']]);
    if ($stmt->fetch()['count'] > 0) {
      out(['ok' => false, 'error' => 'Username already exists']);
    }
    
    $pdo->beginTransaction();
    
    $college_code = !empty($input['college_code']) ? $input['college_code'] : null;
    $role_type = $input['role_type'];
    $user_role = $input['user_role'];
    
    // Capture the data being created
    $person_data = [
      'f_name' => $input['f_name'],
      'l_name' => $input['l_name'],
      'm_name' => $input['m_name'] ?? null,
      'role_type' => $role_type,
      'title' => $input['title'] ?? null,
      'date_birth' => $input['date_birth'] ?? null,
      'college_code' => $college_code,
      'course' => $input['course'] ?? null,
      'blood_type' => $input['blood_type'] ?? null,
      'is_active' => 1
    ];
    
    // 1. INSERT into tbl_person
    $stmt = $pdo->prepare("
      INSERT INTO tbl_person 
      (f_name, l_name, m_name, role_type, title, date_birth, college_code, course, blood_type, is_active) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    ");
    $stmt->execute([
      $input['f_name'],
      $input['l_name'],
      $input['m_name'] ?? null,
      $role_type,
      $input['title'] ?? null,
      $input['date_birth'] ?? null,
      $college_code,
      $input['course'] ?? null,
      $input['blood_type'] ?? null
    ]);
    $new_person_id = $pdo->lastInsertId();
    
    error_log("CREATE_USER: Created person_id={$new_person_id}");
    
    // 2. INSERT into tbl_users
    $stmt = $pdo->prepare("
      INSERT INTO tbl_users (username, password, user_role, person_id, is_active) 
      VALUES (?, ?, ?, ?, 1)
    ");
    $stmt->execute([
      $input['username'],
      password_hash($input['password'], PASSWORD_DEFAULT),
      $user_role,
      $new_person_id
    ]);
    $new_user_id = $pdo->lastInsertId();
    
    error_log("CREATE_USER: Created user_id={$new_user_id}");
    
    // 3. Team assignment if applicable
    $team_assigned = false;
    
    if (!empty($input['assign_to_team']) && !empty($input['team_assignment'])) {
      $team_data = $input['team_assignment'];
      
      error_log("CREATE_USER: Team assignment requested - " . json_encode($team_data));
      
      if (!empty($team_data['team_id']) && !empty($team_data['sports_id'])) {
        // Get tour_id - use provided or get latest active
        $tour_id = $team_data['tour_id'];
        
        if (empty($tour_id)) {
          $stmt = $pdo->query("
            SELECT tour_id 
            FROM tbl_tournament 
            WHERE is_active = 1 
            ORDER BY tour_id DESC 
            LIMIT 1
          ");
          $latest_tour = $stmt->fetch(PDO::FETCH_ASSOC);
          $tour_id = $latest_tour['tour_id'] ?? null;
          
          error_log("CREATE_USER: No tour_id provided, using latest active: " . ($tour_id ?? 'NONE'));
        }
        
        if ($tour_id) {
          // Check if this assignment already exists
          $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM tbl_team_athletes 
            WHERE person_id = ? AND team_id = ? AND sports_id = ? AND tour_id = ?
          ");
          $stmt->execute([$new_person_id, $team_data['team_id'], $team_data['sports_id'], $tour_id]);
          
          if ($stmt->fetch()['count'] == 0) {
            // Insert into tbl_team_athletes
            $stmt = $pdo->prepare("
              INSERT INTO tbl_team_athletes 
              (tour_id, team_id, sports_id, person_id, is_captain, is_active) 
              VALUES (?, ?, ?, ?, ?, 1)
            ");
            $stmt->execute([
              $tour_id,
              $team_data['team_id'],
              $team_data['sports_id'],
              $new_person_id,
              $team_data['is_captain'] ?? 0
            ]);
            
            $team_assignment_id = $pdo->lastInsertId();
            $team_assigned = true;
            
            error_log("CREATE_USER: Team assigned - team_ath_id={$team_assignment_id}");
          } else {
            error_log("CREATE_USER: Team assignment already exists, skipping");
            $team_assigned = true; // Consider it assigned
          }
        } else {
          error_log("CREATE_USER ERROR: No active tournament found for team assignment");
        }
      } else {
        error_log("CREATE_USER ERROR: Missing team_id or sports_id in team_assignment");
      }
    }
    
    // Verify the person and user were created
    $stmt = $pdo->prepare("
      SELECT p.*, u.user_id, u.username 
      FROM tbl_person p 
      JOIN tbl_users u ON u.person_id = p.person_id 
      WHERE p.person_id = ?
    ");
    $stmt->execute([$new_person_id]);
    $created_user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$created_user) {
      throw new Exception("User creation verification failed");
    }
    
    // Verify team assignment if it was supposed to happen
    if (!empty($input['assign_to_team']) && !empty($input['team_assignment'])) {
      $stmt = $pdo->prepare("
        SELECT COUNT(*) as count 
        FROM tbl_team_athletes 
        WHERE person_id = ? AND is_active = 1
      ");
      $stmt->execute([$new_person_id]);
      $assignment_count = $stmt->fetch()['count'];
      
      error_log("CREATE_USER: Verification - person_id={$new_person_id}, team_assignments={$assignment_count}");
      
      if ($assignment_count == 0 && $team_assigned) {
        error_log("CREATE_USER WARNING: Team assignment was marked as created but verification failed");
      }
    }
    
    $pdo->commit();
    
    // Enhanced logging with full details
    $college_text = $college_code ? " from college '{$college_code}'" : '';
    $team_text = $team_assigned ? " and assigned to team" : "";
    
    logActivity($pdo, $user_id, $person_id, 'create', 
      "created new user account '{$input['username']}' with role type '{$role_type}' and system access as '{$user_role}' for {$input['f_name']} {$input['l_name']}{$college_text}{$team_text}",
      'User Management',
      [
        'target_table' => 'tbl_users',
        'target_id' => $new_user_id,
        'new_data' => [
          'user_id' => $new_user_id,
          'person_id' => $new_person_id,
          'username' => $input['username'],
          'user_role' => $user_role,
          'person_data' => $person_data,
          'team_assigned' => $team_assigned
        ],
        'can_revert' => 1
      ]
    );
    
    out([
      'ok' => true, 
      'user_id' => $new_user_id, 
      'person_id' => $new_person_id,
      'team_assigned' => $team_assigned,
      'message' => 'User created successfully' . ($team_assigned ? ' and assigned to team' : '')
    ]);
    
  } catch (PDOException $e) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }
    error_log("CREATE_USER ERROR: " . $e->getMessage());
    error_log("CREATE_USER ERROR TRACE: " . $e->getTraceAsString());
    out(['ok' => false, 'error' => 'Database error: ' . $e->getMessage()]);
  } catch (Exception $e) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }
    error_log("CREATE_USER ERROR: " . $e->getMessage());
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

if ($action === 'update_user') {
  try {
    // ... existing validation code ...
    
    $pdo->beginTransaction();
    
    // Get OLD data before update
    $stmt = $pdo->prepare("
      SELECT u.*, p.* 
      FROM tbl_users u 
      JOIN tbl_person p ON p.person_id = u.person_id 
      WHERE u.user_id = ?
    ");
    $stmt->execute([$input['user_id']]);
    $old_data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $college_code = !empty($input['college_code']) ? $input['college_code'] : null;
    $role_type = $input['role_type'];
    $user_role = $input['user_role'];
    
    // Update tbl_person
    $stmt = $pdo->prepare("
      UPDATE tbl_person 
      SET f_name=?, l_name=?, m_name=?, role_type=?, title=?, date_birth=?, 
          college_code=?, course=?, blood_type=?
      WHERE person_id=(SELECT person_id FROM tbl_users WHERE user_id=?)
    ");
    $stmt->execute([
      $input['f_name'],
      $input['l_name'],
      $input['m_name'] ?? null,
      $role_type,
      $input['title'] ?? null,
      $input['date_birth'] ?? null,
      $college_code,
      $input['course'] ?? null,
      $input['blood_type'] ?? null,
      $input['user_id']
    ]);
    
    // Update tbl_users
    $stmt = $pdo->prepare("
      UPDATE tbl_users 
      SET username=?, user_role=? 
      WHERE user_id=?
    ");
    $stmt->execute([
      $input['username'],
      $user_role,
      $input['user_id']
    ]);
    
    $pdo->commit();
    
    // Build detailed change description
    $changes = [];
    if ($old_data['username'] !== $input['username']) {
      $changes[] = "username from '{$old_data['username']}' to '{$input['username']}'";
    }
    if ($old_data['user_role'] !== $user_role) {
      $changes[] = "system role from '{$old_data['user_role']}' to '{$user_role}'";
    }
    if ($old_data['role_type'] !== $role_type) {
      $changes[] = "role type from '{$old_data['role_type']}' to '{$role_type}'";
    }
    if ($old_data['f_name'] !== $input['f_name'] || $old_data['l_name'] !== $input['l_name']) {
      $changes[] = "name from '{$old_data['f_name']} {$old_data['l_name']}' to '{$input['f_name']} {$input['l_name']}'";
    }
    
    $change_text = !empty($changes) ? 'Changed: ' . implode(', ', $changes) : 'Updated user details';
    
    logActivity($pdo, $user_id, $person_id, 'update',
      "updated user account '{$input['username']}'. {$change_text}",
      'User Management',
      [
        'target_table' => 'tbl_users',
        'target_id' => $input['user_id'],
        'old_data' => $old_data,
        'new_data' => $input,
        'can_revert' => 1
      ]
    );
    
    out(['ok' => true, 'message' => 'User updated successfully']);
    
  } catch (PDOException $e) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }
    error_log("UPDATE_USER ERROR: " . $e->getMessage());
    out(['ok' => false, 'error' => 'Database error: ' . $e->getMessage()]);
  }
}



if ($action === 'toggle_user') {
  try {
    $user_id_to_toggle = (int)$input['user_id'];
    $new_status = (int)$input['is_active'];
    
    $pdo->beginTransaction();
    
    // Get user info
    $stmt = $pdo->prepare("
      SELECT u.username, CONCAT(p.f_name, ' ', p.l_name) as full_name, u.user_role
      FROM tbl_users u 
      JOIN tbl_person p ON p.person_id = u.person_id 
      WHERE u.user_id = ?
    ");
    $stmt->execute([$user_id_to_toggle]);
    $user_info = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Update both tables
    $stmt = $pdo->prepare("UPDATE tbl_users SET is_active = ? WHERE user_id = ?");
    $stmt->execute([$new_status, $user_id_to_toggle]);
    
    $stmt = $pdo->prepare("
      UPDATE tbl_person 
      SET is_active = ? 
      WHERE person_id = (SELECT person_id FROM tbl_users WHERE user_id = ?)
    ");
    $stmt->execute([$new_status, $user_id_to_toggle]);
    
    $pdo->commit();
    
    $action_text = $new_status ? 'activated' : 'deactivated';
    $action_type = $new_status ? 'activate' : 'deactivate';
    
    logActivity($pdo, $user_id, $person_id, $action_type,
      "{$action_text} user account '{$user_info['username']}' ({$user_info['full_name']}) with role '{$user_info['user_role']}'",
      'User Management',
      [
        'target_table' => 'tbl_users',
        'target_id' => $user_id_to_toggle,
        'old_data' => ['is_active' => $new_status ? 0 : 1],
        'new_data' => ['is_active' => $new_status],
        'can_revert' => 1
      ]
    );
    
    out(['ok' => true, 'message' => "User {$action_text} successfully"]);
    
  } catch (PDOException $e) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}


if ($action === 'delete_user') {
  try {
    $user_id_to_delete = (int)$input['user_id'];
    
    $pdo->beginTransaction();
    
    // Get complete user data before deletion
    $stmt = $pdo->prepare("
      SELECT u.*, p.*, CONCAT(p.f_name, ' ', p.l_name) as full_name
      FROM tbl_users u 
      JOIN tbl_person p ON p.person_id = u.person_id 
      WHERE u.user_id = ?
    ");
    $stmt->execute([$user_id_to_delete]);
    $deleted_user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Delete from tbl_users
    $stmt = $pdo->prepare("DELETE FROM tbl_users WHERE user_id = ?");
    $stmt->execute([$user_id_to_delete]);
    
    // Delete from tbl_person
    if ($deleted_user['person_id']) {
      $stmt = $pdo->prepare("DELETE FROM tbl_person WHERE person_id = ?");
      $stmt->execute([$deleted_user['person_id']]);
      
      // Delete from tbl_team_athletes if exists
      $stmt = $pdo->prepare("DELETE FROM tbl_team_athletes WHERE person_id = ?");
      $stmt->execute([$deleted_user['person_id']]);
    }
    
    $pdo->commit();
    
    logActivity($pdo, $user_id, $person_id, 'delete',
      "permanently deleted user account '{$deleted_user['username']}' ({$deleted_user['full_name']}) with role '{$deleted_user['user_role']}' and role type '{$deleted_user['role_type']}'",
      'User Management',
      [
        'target_table' => 'tbl_users',
        'target_id' => $user_id_to_delete,
        'old_data' => $deleted_user,
        'can_revert' => 1
      ]
    );
    
    out(['ok' => true, 'message' => 'User deleted successfully']);
    
  } catch (PDOException $e) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

// ==========================================
// NEW: revert_action endpoint
// ==========================================

if ($action === 'revert_action') {
  try {
    $log_id = (int)$input['log_id'];
    
    $pdo->beginTransaction();
    
    // Get log details
    $stmt = $pdo->prepare("
      SELECT * FROM tbl_logs 
      WHERE log_id = ? AND can_revert = 1 AND reverted_at IS NULL
    ");
    $stmt->execute([$log_id]);
    $log = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$log) {
      out(['ok' => false, 'error' => 'Action cannot be reverted or already reverted']);
    }
    
    $old_data = json_decode($log['old_data'], true);
    $new_data = json_decode($log['new_data'], true);
    
    // Revert based on action type
    switch ($log['action_type']) {
      case 'create':
        // Delete the created record
        if ($log['target_table'] === 'tbl_users') {
          $stmt = $pdo->prepare("DELETE FROM tbl_users WHERE user_id = ?");
          $stmt->execute([$log['target_id']]);
          
          if (isset($new_data['person_id'])) {
            $stmt = $pdo->prepare("DELETE FROM tbl_person WHERE person_id = ?");
            $stmt->execute([$new_data['person_id']]);
          }
        }
        break;
        
      case 'delete':
        // Restore the deleted record
        if ($log['target_table'] === 'tbl_users' && $old_data) {
          // Restore person first
          $stmt = $pdo->prepare("
            INSERT INTO tbl_person 
            (person_id, f_name, l_name, m_name, role_type, title, date_birth, 
             college_code, course, blood_type, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ");
          $stmt->execute([
            $old_data['person_id'], $old_data['f_name'], $old_data['l_name'],
            $old_data['m_name'], $old_data['role_type'], $old_data['title'],
            $old_data['date_birth'], $old_data['college_code'], $old_data['course'],
            $old_data['blood_type'], $old_data['is_active']
          ]);
          
          // Restore user
          $stmt = $pdo->prepare("
            INSERT INTO tbl_users 
            (user_id, username, password, user_role, person_id, is_active) 
            VALUES (?, ?, ?, ?, ?, ?)
          ");
          $stmt->execute([
            $log['target_id'], $old_data['username'], $old_data['password'],
            $old_data['user_role'], $old_data['person_id'], $old_data['is_active']
          ]);
        }
        break;
        
      case 'update':
        // Restore old values
        if ($log['target_table'] === 'tbl_users' && $old_data) {
          $stmt = $pdo->prepare("
            UPDATE tbl_person 
            SET f_name=?, l_name=?, m_name=?, role_type=?, title=?, 
                date_birth=?, college_code=?, course=?, blood_type=?
            WHERE person_id=?
          ");
          $stmt->execute([
            $old_data['f_name'], $old_data['l_name'], $old_data['m_name'],
            $old_data['role_type'], $old_data['title'], $old_data['date_birth'],
            $old_data['college_code'], $old_data['course'], $old_data['blood_type'],
            $old_data['person_id']
          ]);
          
          $stmt = $pdo->prepare("
            UPDATE tbl_users SET username=?, user_role=? WHERE user_id=?
          ");
          $stmt->execute([
            $old_data['username'], $old_data['user_role'], $log['target_id']
          ]);
        }
        break;
        
      case 'activate':
      case 'deactivate':
        // Toggle back
        $restore_status = $old_data['is_active'];
        $stmt = $pdo->prepare("UPDATE tbl_users SET is_active=? WHERE user_id=?");
        $stmt->execute([$restore_status, $log['target_id']]);
        
        $stmt = $pdo->prepare("
          UPDATE tbl_person SET is_active=? 
          WHERE person_id=(SELECT person_id FROM tbl_users WHERE user_id=?)
        ");
        $stmt->execute([$restore_status, $log['target_id']]);
        break;
    }
    
    // Mark as reverted
    $stmt = $pdo->prepare("
      UPDATE tbl_logs 
      SET reverted_at = NOW(), reverted_by = ? 
      WHERE log_id = ?
    ");
    $stmt->execute([$user_id, $log_id]);
    
    $pdo->commit();
    
    // Log the revert action
    logActivity($pdo, $user_id, $person_id, 'revert',
      "reverted action from log #{$log_id}: \"{$log['log_event']}\"",
      'System Administration',
      [
        'target_table' => 'tbl_logs',
        'target_id' => $log_id,
        'can_revert' => 0
      ]
    );
    
    out(['ok' => true, 'message' => 'Action reverted successfully']);
    
  } catch (PDOException $e) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }
    out(['ok' => false, 'error' => 'Revert failed: ' . $e->getMessage()]);
  }
}

// ==========================================
// ACTIVITY LOGS
// ==========================================


if ($action === 'colleges') {
  try {
    $stmt = $pdo->query("
      SELECT college_id, college_code, college_name, college_dean, is_active
      FROM tbl_college 
      WHERE is_active = 1
      ORDER BY college_name
    ");
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

// Replace the logs and recent_activities sections in system_administrator/api.php

// ==========================================
// ACTIVITY LOGS (Using tbl_logs)
// ==========================================

if ($action === 'logs') {
  try {
    $filter = $_GET['filter'] ?? '';
    $limit = (int)($_GET['limit'] ?? 50);
    
    $sql = "
      SELECT 
        l.log_id,
        l.user_id,
        l.log_event as description,
        l.log_date as created_at,
        l.module_name,
        l.action_type,
        l.target_table,
        l.target_id,
        l.old_data,
        l.new_data,
        l.can_revert,
        l.reverted_at,
        l.reverted_by,
        u.username,
        CONCAT(p.f_name, ' ', p.l_name) as user_name
      FROM tbl_logs l
      LEFT JOIN tbl_users u ON u.user_id = l.user_id
      LEFT JOIN tbl_person p ON p.person_id = u.person_id
      WHERE 1=1
    ";
    
    // Filter based on action type
    if ($filter) {
      switch($filter) {
        case 'login':
          $sql .= " AND l.action_type = 'login'";
          break;
        case 'create':
          $sql .= " AND l.action_type = 'create'";
          break;
        case 'update':
          $sql .= " AND l.action_type = 'update'";
          break;
        case 'delete':
          $sql .= " AND l.action_type = 'delete'";
          break;
        case 'activate':
          $sql .= " AND l.action_type IN ('activate', 'deactivate')";
          break;
      }
    }
    
    $sql .= " ORDER BY l.log_date DESC LIMIT $limit";
    
    $stmt = $pdo->query($sql);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Set action for compatibility if null
    foreach ($logs as &$log) {
      if (!$log['action_type']) {
        $event_lower = strtolower($log['description']);
        if (strpos($event_lower, 'login') !== false) {
          $log['action_type'] = 'login';
        } elseif (strpos($event_lower, 'logout') !== false) {
          $log['action_type'] = 'logout';
        } elseif (strpos($event_lower, 'created') !== false || strpos($event_lower, 'added') !== false) {
          $log['action_type'] = 'create';
        } elseif (strpos($event_lower, 'updated') !== false) {
          $log['action_type'] = 'update';
        } elseif (strpos($event_lower, 'deleted') !== false) {
          $log['action_type'] = 'delete';
        } elseif (strpos($event_lower, 'activated') !== false) {
          $log['action_type'] = 'activate';
        } elseif (strpos($event_lower, 'deactivated') !== false) {
          $log['action_type'] = 'deactivate';
        }
      }
      $log['action'] = $log['action_type']; // For frontend compatibility
    }
    
    out($logs);
  } catch (PDOException $e) {
    error_log("LOGS ERROR: " . $e->getMessage());
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

if ($action === 'recent_activities') {
  try {
    $limit = (int)($_GET['limit'] ?? 10);
    
    $stmt = $pdo->prepare("
      SELECT 
        l.log_id,
        l.user_id,
        l.log_event as description,
        l.log_date as created_at,
        l.module_name,
        l.action_type,
        CONCAT(p.f_name, ' ', p.l_name) as user_name
      FROM tbl_logs l
      LEFT JOIN tbl_users u ON u.user_id = l.user_id
      LEFT JOIN tbl_person p ON p.person_id = u.person_id
      ORDER BY l.log_date DESC
      LIMIT :limit
    ");
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Set action for compatibility
    foreach ($logs as &$log) {
      $log['action'] = $log['action_type'] ?? 'info';
    }
    
    out($logs);
  } catch (PDOException $e) {
    error_log("RECENT_ACTIVITIES ERROR: " . $e->getMessage());
    out([]);
  }
}

if ($action === 'tournaments') {
  try {
    $stmt = $pdo->query("
      SELECT 
        t.*,
        COUNT(DISTINCT st.sports_id) as num_sports,
        COUNT(DISTINCT tm.team_id) as num_teams
      FROM tbl_tournament t
      LEFT JOIN tbl_sports_team st ON st.tour_id = t.tour_id
      LEFT JOIN tbl_team tm ON tm.team_id = st.team_id
      GROUP BY t.tour_id
      ORDER BY t.is_active DESC, t.tour_id DESC
    ");
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

// ==========================================
// TEAMS (Admin sees ALL)
// ==========================================

if ($action === 'teams') {
  try {
    $sport_id = isset($_GET['sport_id']) ? (int)$_GET['sport_id'] : null;
    
    $sql = "
      SELECT DISTINCT
        t.team_id,
        t.team_name,
        t.is_active,
        s.sports_id,
        s.sports_name,
        s.men_women,
        COUNT(DISTINCT ta.person_id) as num_players,
        CONCAT(coach.f_name, ' ', coach.l_name) as coach_name
      FROM tbl_team t
      LEFT JOIN tbl_sports_team st ON st.team_id = t.team_id
      LEFT JOIN tbl_sports s ON s.sports_id = st.sports_id
      LEFT JOIN tbl_team_athletes ta ON ta.team_id = t.team_id AND ta.is_active = 1
      LEFT JOIN tbl_person coach ON coach.person_id = st.coach_id
      WHERE t.is_active = 1
    ";
    
    $params = [];
    
    if ($sport_id) {
      $sql .= " AND st.sports_id = :sport_id";
      $params['sport_id'] = $sport_id;
    }
    
    $sql .= " GROUP BY t.team_id, t.team_name, t.is_active, s.sports_id, s.sports_name, s.men_women, coach.f_name, coach.l_name
              ORDER BY s.sports_name, s.men_women, t.team_name";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

// ==========================================
// ATHLETES (Admin sees ALL)
// ==========================================

if ($action === 'athletes') {
  try {
    $stmt = $pdo->query("
      SELECT DISTINCT 
        p.person_id, 
        p.f_name, 
        p.l_name, 
        p.m_name,
        p.gender,
        p.college_code,
        p.course,
        p.is_active,
        CONCAT(p.f_name, ' ', p.l_name) as athlete_name,
        t.team_name, 
        s.sports_name,
        s.men_women,
        c.college_name
      FROM tbl_person p
      LEFT JOIN tbl_team_athletes ta ON ta.person_id = p.person_id AND ta.is_active = 1
      LEFT JOIN tbl_team t ON t.team_id = ta.team_id
      LEFT JOIN tbl_sports s ON s.sports_id = ta.sports_id
      LEFT JOIN tbl_college c ON c.college_code = p.college_code
      WHERE p.role_type IN ('athlete', 'athlete/player', 'trainee')
      ORDER BY s.sports_name, p.gender, p.l_name, p.f_name
    ");
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

// ==========================================
// SPORTS
// ==========================================

if ($action === 'sports') {
  try {
    $stmt = $pdo->query("SELECT * FROM tbl_sports ORDER BY is_active DESC, sports_name");
    out($stmt->fetchAll());
  } catch (PDOException $e) {
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

if ($action === 'create_sport') {
  try {
    $stmt = $pdo->prepare("
      INSERT INTO tbl_sports 
      (sports_name, team_individual, weight_class, men_women, num_req_players, num_res_players, is_active) 
      VALUES (?, ?, ?, ?, ?, ?, 1)
    ");
    $stmt->execute([
      $input['sports_name'],
      $input['team_individual'],
      $input['weight_class'] ?? null,
      $input['men_women'],
      $input['num_req_players'] ?? null,
      $input['num_res_players'] ?? null
    ]);
    
    logActivity($pdo, $user_id, $person_id, 'create', 
      "Created sport: {$input['sports_name']}");
    
    out(['ok' => true, 'sports_id' => $pdo->lastInsertId()]);
  } catch (PDOException $e) {
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

if ($action === 'update_sport') {
  try {
    $stmt = $pdo->prepare("
      UPDATE tbl_sports 
      SET sports_name=?, team_individual=?, weight_class=?, men_women=?, 
          num_req_players=?, num_res_players=?
      WHERE sports_id=?
    ");
    $stmt->execute([
      $input['sports_name'],
      $input['team_individual'],
      $input['weight_class'] ?? null,
      $input['men_women'],
      $input['num_req_players'] ?? null,
      $input['num_res_players'] ?? null,
      $input['sports_id']
    ]);
    
    logActivity($pdo, $user_id, $person_id, 'update', 
      "Updated sport: {$input['sports_name']}");
    
    out(['ok' => true]);
  } catch (PDOException $e) {
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

if ($action === 'toggle_sport') {
  try {
    $stmt = $pdo->prepare("UPDATE tbl_sports SET is_active=? WHERE sports_id=?");
    $stmt->execute([$input['is_active'], $input['sports_id']]);
    
    $status = $input['is_active'] == 1 ? 'activated' : 'deactivated';
    logActivity($pdo, $user_id, $person_id, $status, "Sport {$status}");
    
    out(['ok' => true]);
  } catch (PDOException $e) {
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

if ($action === 'delete_sport') {
  try {
    // Check if sport has associated teams/tournaments
    $check = $pdo->prepare("SELECT COUNT(*) as count FROM tbl_sports_team WHERE sports_id=?");
    $check->execute([$input['sports_id']]);
    $count = $check->fetch()['count'];
    
    if ($count > 0) {
      out(['ok' => false, 'error' => 'Cannot delete sport with existing teams. Deactivate instead.']);
    }
    
    $stmt = $pdo->prepare("DELETE FROM tbl_sports WHERE sports_id=?");
    $stmt->execute([$input['sports_id']]);
    
    logActivity($pdo, $user_id, $person_id, 'delete', "Deleted sport");
    
    out(['ok' => true]);
  } catch (PDOException $e) {
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

// ==========================================
// SECURITY SETTINGS
// ==========================================

if ($action === 'get_security_settings') {
  try {
    // Get current security settings from a configuration table or file
    // For this implementation, we'll use a tbl_system_config table
    
    // Create table if not exists
    $pdo->exec("
      CREATE TABLE IF NOT EXISTS tbl_system_config (
        config_id INT AUTO_INCREMENT PRIMARY KEY,
        config_key VARCHAR(100) UNIQUE NOT NULL,
        config_value TEXT,
        config_type VARCHAR(50) DEFAULT 'string',
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_by INT,
        FOREIGN KEY (updated_by) REFERENCES tbl_users(user_id)
      ) ENGINE=InnoDB
    ");
    
    // Default security settings
    $defaults = [
      'min_password_length' => ['value' => '8', 'type' => 'number', 'description' => 'Minimum password length'],
      'require_uppercase' => ['value' => '1', 'type' => 'boolean', 'description' => 'Require uppercase letters'],
      'require_lowercase' => ['value' => '1', 'type' => 'boolean', 'description' => 'Require lowercase letters'],
      'require_numbers' => ['value' => '1', 'type' => 'boolean', 'description' => 'Require numbers'],
      'require_special' => ['value' => '0', 'type' => 'boolean', 'description' => 'Require special characters'],
      'password_expiry_days' => ['value' => '90', 'type' => 'number', 'description' => 'Password expiry in days (0 = never)'],
      'session_timeout' => ['value' => '3600', 'type' => 'number', 'description' => 'Session timeout in seconds'],
      'max_login_attempts' => ['value' => '5', 'type' => 'number', 'description' => 'Maximum login attempts before lockout'],
      'lockout_duration' => ['value' => '900', 'type' => 'number', 'description' => 'Account lockout duration in seconds'],
      'force_logout_inactive' => ['value' => '1', 'type' => 'boolean', 'description' => 'Force logout on inactivity']
    ];
    
    $settings = [];
    
    foreach ($defaults as $key => $default) {
      $stmt = $pdo->prepare("SELECT config_value, config_type FROM tbl_system_config WHERE config_key = ?");
      $stmt->execute([$key]);
      $result = $stmt->fetch(PDO::FETCH_ASSOC);
      
      if ($result) {
        $settings[$key] = $result['config_value'];
      } else {
        // Insert default
        $stmt = $pdo->prepare("
          INSERT INTO tbl_system_config (config_key, config_value, config_type, description, updated_by) 
          VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$key, $default['value'], $default['type'], $default['description'], $user_id]);
        $settings[$key] = $default['value'];
      }
    }
    
    out(['ok' => true, 'settings' => $settings]);
  } catch (PDOException $e) {
    error_log("GET_SECURITY_SETTINGS ERROR: " . $e->getMessage());
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

if ($action === 'update_security_settings') {
  try {
    $pdo->beginTransaction();
    
    $updated_settings = [];
    
    foreach ($input as $key => $value) {
      $stmt = $pdo->prepare("
        UPDATE tbl_system_config 
        SET config_value = ?, updated_by = ?, updated_at = NOW() 
        WHERE config_key = ?
      ");
      $stmt->execute([$value, $user_id, $key]);
      $updated_settings[$key] = $value;
    }
    
    $pdo->commit();
    
    logActivity($pdo, $user_id, $person_id, 'update', 
      "updated security settings: " . implode(', ', array_keys($updated_settings)),
      'System Settings',
      [
        'target_table' => 'tbl_system_config',
        'new_data' => $updated_settings
      ]
    );
    
    out(['ok' => true, 'message' => 'Security settings updated successfully']);
  } catch (PDOException $e) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }
    error_log("UPDATE_SECURITY_SETTINGS ERROR: " . $e->getMessage());
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

// ==========================================
// DATABASE BACKUP
// ==========================================

if ($action === 'create_backup') {
  try {
    // Get database credentials from config
    $host = DB_HOST;
    $port = defined('DB_PORT') ? DB_PORT : '3306';
    $dbname = DB_NAME;
    $user = DB_USER;
    $pass = DB_PASS;
    
    // Create backups directory if not exists
    $backup_dir = __DIR__ . '/../backups';
    if (!is_dir($backup_dir)) {
      mkdir($backup_dir, 0755, true);
    }
    
    // Generate filename with timestamp
    $timestamp = date('Y-m-d_H-i-s');
    $filename = "backup_{$dbname}_{$timestamp}.sql";
    $filepath = $backup_dir . '/' . $filename;
    
    // Use mysqldump command with port
    $command = sprintf(
      'mysqldump --host=%s --port=%s --user=%s --password=%s --single-transaction --routines --triggers %s > %s 2>&1',
      escapeshellarg($host),
      escapeshellarg($port),
      escapeshellarg($user),
      escapeshellarg($pass),
      escapeshellarg($dbname),
      escapeshellarg($filepath)
    );
    
    exec($command, $output, $return_var);
    
    if ($return_var !== 0) {
      throw new Exception("Backup failed: " . implode("\n", $output));
    }
    
    // Get file size
    $filesize = filesize($filepath);
    $filesize_mb = round($filesize / 1048576, 2);
    
    // Log backup in database
    $pdo->exec("
      CREATE TABLE IF NOT EXISTS tbl_database_backups (
        backup_id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        filepath VARCHAR(500) NOT NULL,
        filesize BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INT NOT NULL,
        backup_type VARCHAR(50) DEFAULT 'manual',
        description TEXT,
        is_deleted TINYINT(1) DEFAULT 0,
        FOREIGN KEY (created_by) REFERENCES tbl_users(user_id)
      ) ENGINE=InnoDB
    ");
    
    $stmt = $pdo->prepare("
      INSERT INTO tbl_database_backups (filename, filepath, filesize, created_by, backup_type, description) 
      VALUES (?, ?, ?, ?, 'manual', ?)
    ");
    $stmt->execute([
      $filename,
      $filepath,
      $filesize,
      $user_id,
      "Manual backup created by administrator"
    ]);
    
    $backup_id = $pdo->lastInsertId();
    
    logActivity($pdo, $user_id, $person_id, 'create', 
      "created database backup: {$filename} ({$filesize_mb} MB)",
      'Database Management',
      [
        'target_table' => 'tbl_database_backups',
        'target_id' => $backup_id,
        'new_data' => [
          'filename' => $filename,
          'filesize' => $filesize_mb . ' MB'
        ]
      ]
    );
    
    out([
      'ok' => true, 
      'message' => 'Database backup created successfully',
      'backup' => [
        'backup_id' => $backup_id,
        'filename' => $filename,
        'filesize' => $filesize_mb,
        'created_at' => date('Y-m-d H:i:s')
      ]
    ]);
    
  } catch (Exception $e) {
    error_log("CREATE_BACKUP ERROR: " . $e->getMessage());
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

if ($action === 'list_backups') {
  try {
    $stmt = $pdo->query("
      SELECT 
        b.*,
        CONCAT(p.f_name, ' ', p.l_name) as created_by_name,
        u.username as created_by_username
      FROM tbl_database_backups b
      LEFT JOIN tbl_users u ON u.user_id = b.created_by
      LEFT JOIN tbl_person p ON p.person_id = u.person_id
      WHERE b.is_deleted = 0
      ORDER BY b.created_at DESC
    ");
    
    $backups = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Add file existence check and size formatting
    foreach ($backups as &$backup) {
      $backup['file_exists'] = file_exists($backup['filepath']);
      $backup['filesize_mb'] = round($backup['filesize'] / 1048576, 2);
    }
    
    out(['ok' => true, 'backups' => $backups]);
  } catch (PDOException $e) {
    error_log("LIST_BACKUPS ERROR: " . $e->getMessage());
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

if ($action === 'download_backup') {
  try {
    $backup_id = (int)$_GET['backup_id'];
    
    $stmt = $pdo->prepare("SELECT * FROM tbl_database_backups WHERE backup_id = ? AND is_deleted = 0");
    $stmt->execute([$backup_id]);
    $backup = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$backup) {
      throw new Exception("Backup not found");
    }
    
    if (!file_exists($backup['filepath'])) {
      throw new Exception("Backup file not found on server");
    }
    
    // Log download activity
    logActivity($pdo, $user_id, $person_id, 'download', 
      "downloaded database backup: {$backup['filename']}",
      'Database Management'
    );
    
    // Set headers for download
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $backup['filename'] . '"');
    header('Content-Length: ' . filesize($backup['filepath']));
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    
    // Output file
    readfile($backup['filepath']);
    exit;
    
  } catch (Exception $e) {
    error_log("DOWNLOAD_BACKUP ERROR: " . $e->getMessage());
    header('Content-Type: application/json');
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

if ($action === 'delete_backup') {
  try {
    $backup_id = (int)$input['backup_id'];
    
    $stmt = $pdo->prepare("SELECT * FROM tbl_database_backups WHERE backup_id = ?");
    $stmt->execute([$backup_id]);
    $backup = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$backup) {
      throw new Exception("Backup not found");
    }
    
    // Mark as deleted in database
    $stmt = $pdo->prepare("UPDATE tbl_database_backups SET is_deleted = 1 WHERE backup_id = ?");
    $stmt->execute([$backup_id]);
    
    // Optionally delete the actual file
    if (file_exists($backup['filepath'])) {
      unlink($backup['filepath']);
    }
    
    logActivity($pdo, $user_id, $person_id, 'delete', 
      "deleted database backup: {$backup['filename']}",
      'Database Management',
      [
        'target_table' => 'tbl_database_backups',
        'target_id' => $backup_id
      ]
    );
    
    out(['ok' => true, 'message' => 'Backup deleted successfully']);
    
  } catch (Exception $e) {
    error_log("DELETE_BACKUP ERROR: " . $e->getMessage());
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

if ($action === 'restore_backup') {
  try {
    $backup_id = (int)$input['backup_id'];
    
    $stmt = $pdo->prepare("SELECT * FROM tbl_database_backups WHERE backup_id = ? AND is_deleted = 0");
    $stmt->execute([$backup_id]);
    $backup = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$backup) {
      throw new Exception("Backup not found");
    }
    
    if (!file_exists($backup['filepath'])) {
      throw new Exception("Backup file not found on server");
    }
    
    // Get database credentials
    $host = DB_HOST;
    $port = defined('DB_PORT') ? DB_PORT : '3306';
    $dbname = DB_NAME;
    $user = DB_USER;
    $pass = DB_PASS;
    
    // Use mysql command to restore with port
    $command = sprintf(
      'mysql --host=%s --port=%s --user=%s --password=%s %s < %s 2>&1',
      escapeshellarg($host),
      escapeshellarg($port),
      escapeshellarg($user),
      escapeshellarg($pass),
      escapeshellarg($dbname),
      escapeshellarg($backup['filepath'])
    );
    
    exec($command, $output, $return_var);
    
    if ($return_var !== 0) {
      throw new Exception("Restore failed: " . implode("\n", $output));
    }
    
    // Reconnect to database after restore
    $pdo = null;
    $port_part = defined('DB_PORT') ? ';port=' . DB_PORT : '';
    $pdo = new PDO(
      "mysql:host=" . DB_HOST . $port_part . ";dbname=" . DB_NAME . ";charset=utf8mb4",
      DB_USER,
      DB_PASS,
      [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    logActivity($pdo, $user_id, $person_id, 'restore', 
      "restored database from backup: {$backup['filename']}",
      'Database Management',
      [
        'target_table' => 'tbl_database_backups',
        'target_id' => $backup_id
      ]
    );
    
    out([
      'ok' => true, 
      'message' => 'Database restored successfully from backup: ' . $backup['filename']
    ]);
    
  } catch (Exception $e) {
    error_log("RESTORE_BACKUP ERROR: " . $e->getMessage());
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

// ==========================================
// COLLEGES, DEPARTMENTS, COURSES (for dropdowns)
// ==========================================

if ($action === 'colleges') {
  try {
    $stmt = $pdo->query("
      SELECT college_id, college_code, college_name, college_dean, description, is_active 
      FROM tbl_college 
      WHERE is_active = 1 
      ORDER BY college_name
    ");
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

if ($action === 'departments') {
  try {
    $college_id = isset($_GET['college_id']) ? (int)$_GET['college_id'] : null;
    
    $sql = "
      SELECT 
        d.dept_id, 
        d.dept_code, 
        d.dept_name, 
        d.college_id,
        d.dept_head, 
        d.description, 
        d.is_active,
        c.college_code,
        c.college_name
      FROM tbl_department d
      LEFT JOIN tbl_college c ON c.college_id = d.college_id
      WHERE d.is_active = 1
    ";
    
    $params = [];
    
    if ($college_id) {
      $sql .= " AND d.college_id = :college_id";
      $params['college_id'] = $college_id;
    }
    
    $sql .= " ORDER BY d.dept_name";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

if ($action === 'courses') {
  try {
    $dept_id = isset($_GET['dept_id']) ? (int)$_GET['dept_id'] : null;
    
    $sql = "
      SELECT 
        c.course_id, 
        c.course_code, 
        c.course_name, 
        c.dept_id,
        c.course_type, 
        c.num_years, 
        c.description,
        d.dept_code,
        d.dept_name,
        d.college_id
      FROM tbl_course c
      LEFT JOIN tbl_department d ON d.dept_id = c.dept_id
    ";
    
    $params = [];
    
    if ($dept_id) {
      $sql .= " WHERE c.dept_id = :dept_id";
      $params['dept_id'] = $dept_id;
    }
    
    $sql .= " ORDER BY c.course_name";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    out($stmt->fetchAll(PDO::FETCH_ASSOC));
  } catch (PDOException $e) {
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}


// ==========================================
// TEAM DETAILS
// ==========================================

// ==========================================
// TEAM DETAILS
// ==========================================

if ($action === 'team_details') {
  try {
    $team_id = (int)$_GET['team_id'];
    
    // Get team basic info
    $stmt = $pdo->prepare("
      SELECT DISTINCT
        t.team_id,
        t.team_name,
        t.is_active,
        s.sports_id,
        s.sports_name,
        s.men_women,
        tour.tour_name as tournament_name,
        tour.school_year
      FROM tbl_team t
      LEFT JOIN tbl_sports_team st ON st.team_id = t.team_id
      LEFT JOIN tbl_sports s ON s.sports_id = st.sports_id
      LEFT JOIN tbl_tournament tour ON tour.tour_id = st.tour_id
      WHERE t.team_id = ?
      LIMIT 1
    ");
    $stmt->execute([$team_id]);
    $team = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$team) {
      out(['ok' => false, 'error' => 'Team not found']);
    }
    
    // Get head coach - FIXED COLUMN NAME
    $stmt = $pdo->prepare("
      SELECT 
        p.person_id,
        p.f_name,
        p.l_name,
        p.m_name,
        c.college_name,
        c.college_code
      FROM tbl_sports_team st
      JOIN tbl_person p ON p.person_id = st.coach_id
      LEFT JOIN tbl_college c ON c.college_code = p.college_code
      WHERE st.team_id = ?
      LIMIT 1
    ");
    $stmt->execute([$team_id]);
    $coach = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get assistant coach - FIXED COLUMN NAME: asst_coach_id
    $stmt = $pdo->prepare("
      SELECT 
        p.person_id,
        p.f_name,
        p.l_name,
        p.m_name,
        c.college_name,
        c.college_code
      FROM tbl_sports_team st
      JOIN tbl_person p ON p.person_id = st.asst_coach_id
      LEFT JOIN tbl_college c ON c.college_code = p.college_code
      WHERE st.team_id = ?
      LIMIT 1
    ");
    $stmt->execute([$team_id]);
    $assistant_coach = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get team roster
    $stmt = $pdo->prepare("
      SELECT 
        p.person_id,
        p.f_name,
        p.l_name,
        p.m_name,
        p.college_code,
        p.course,
        p.is_active,
        ta.is_captain,
        c.college_name
      FROM tbl_team_athletes ta
      JOIN tbl_person p ON p.person_id = ta.person_id
      LEFT JOIN tbl_college c ON c.college_code = p.college_code
      WHERE ta.team_id = ? AND ta.is_active = 1
      ORDER BY ta.is_captain DESC, p.l_name, p.f_name
    ");
    $stmt->execute([$team_id]);
    $players = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    out([
      'ok' => true,
      'team' => $team,
      'coach' => $coach,
      'assistant_coach' => $assistant_coach,
      'players' => $players
    ]);
    
  } catch (PDOException $e) {
    error_log("TEAM_DETAILS ERROR: " . $e->getMessage());
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

// ==========================================
// TOURNAMENT MANAGEMENT
// ==========================================

if ($action === 'create_tournament') {
  try {
    // Validation
    if (empty($input['tour_name']) || empty($input['school_year'])) {
      out(['ok' => false, 'error' => 'Tournament name and school year are required']);
    }
    
    $pdo->beginTransaction();
    
    $stmt = $pdo->prepare("
      INSERT INTO tbl_tournament (tour_name, school_year, tour_date, is_active) 
      VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([
      $input['tour_name'],
      $input['school_year'],
      $input['tour_date'] ?? null,
      $input['is_active'] ?? 1
    ]);
    
    $new_tour_id = $pdo->lastInsertId();
    
    $pdo->commit();
    
    logActivity($pdo, $user_id, $person_id, 'create',
      "created new tournament '{$input['tour_name']}' for school year {$input['school_year']}",
      'Tournament Management',
      [
        'target_table' => 'tbl_tournament',
        'target_id' => $new_tour_id,
        'new_data' => $input,
        'can_revert' => 1
      ]
    );
    
    out(['ok' => true, 'tour_id' => $new_tour_id, 'message' => 'Tournament created successfully']);
    
  } catch (PDOException $e) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }
    error_log("CREATE_TOURNAMENT ERROR: " . $e->getMessage());
    out(['ok' => false, 'error' => 'Database error: ' . $e->getMessage()]);
  }
}

if ($action === 'update_tournament') {
  try {
    if (empty($input['tour_id'])) {
      out(['ok' => false, 'error' => 'Tournament ID is required']);
    }
    
    $pdo->beginTransaction();
    
    // Get old data
    $stmt = $pdo->prepare("SELECT * FROM tbl_tournament WHERE tour_id = ?");
    $stmt->execute([$input['tour_id']]);
    $old_data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$old_data) {
      out(['ok' => false, 'error' => 'Tournament not found']);
    }
    
    $stmt = $pdo->prepare("
      UPDATE tbl_tournament 
      SET tour_name = ?, school_year = ?, tour_date = ?, is_active = ?
      WHERE tour_id = ?
    ");
    $stmt->execute([
      $input['tour_name'],
      $input['school_year'],
      $input['tour_date'] ?? null,
      $input['is_active'] ?? 1,
      $input['tour_id']
    ]);
    
    $pdo->commit();
    
    // Build change description
    $changes = [];
    if ($old_data['tour_name'] !== $input['tour_name']) {
      $changes[] = "name from '{$old_data['tour_name']}' to '{$input['tour_name']}'";
    }
    if ($old_data['school_year'] !== $input['school_year']) {
      $changes[] = "school year from '{$old_data['school_year']}' to '{$input['school_year']}'";
    }
    if ($old_data['tour_date'] !== ($input['tour_date'] ?? null)) {
      $changes[] = "date from '{$old_data['tour_date']}' to '{$input['tour_date']}'";
    }
    
    $change_text = !empty($changes) ? 'Changed: ' . implode(', ', $changes) : 'Updated tournament details';
    
    logActivity($pdo, $user_id, $person_id, 'update',
      "updated tournament '{$input['tour_name']}'. {$change_text}",
      'Tournament Management',
      [
        'target_table' => 'tbl_tournament',
        'target_id' => $input['tour_id'],
        'old_data' => $old_data,
        'new_data' => $input,
        'can_revert' => 1
      ]
    );
    
    out(['ok' => true, 'message' => 'Tournament updated successfully']);
    
  } catch (PDOException $e) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }
    error_log("UPDATE_TOURNAMENT ERROR: " . $e->getMessage());
    out(['ok' => false, 'error' => 'Database error: ' . $e->getMessage()]);
  }
}

if ($action === 'toggle_tournament') {
  try {
    $tour_id = (int)$input['tour_id'];
    $new_status = (int)$input['is_active'];
    
    $pdo->beginTransaction();
    
    // Get tournament info
    $stmt = $pdo->prepare("SELECT tour_name, school_year FROM tbl_tournament WHERE tour_id = ?");
    $stmt->execute([$tour_id]);
    $tournament = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$tournament) {
      out(['ok' => false, 'error' => 'Tournament not found']);
    }
    
    $stmt = $pdo->prepare("UPDATE tbl_tournament SET is_active = ? WHERE tour_id = ?");
    $stmt->execute([$new_status, $tour_id]);
    
    $pdo->commit();
    
    $action_text = $new_status ? 'activated' : 'deactivated';
    $action_type = $new_status ? 'activate' : 'deactivate';
    
    logActivity($pdo, $user_id, $person_id, $action_type,
      "{$action_text} tournament '{$tournament['tour_name']}' ({$tournament['school_year']})",
      'Tournament Management',
      [
        'target_table' => 'tbl_tournament',
        'target_id' => $tour_id,
        'old_data' => ['is_active' => $new_status ? 0 : 1],
        'new_data' => ['is_active' => $new_status],
        'can_revert' => 1
      ]
    );
    
    out(['ok' => true, 'message' => "Tournament {$action_text} successfully"]);
    
  } catch (PDOException $e) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }
    error_log("TOGGLE_TOURNAMENT ERROR: " . $e->getMessage());
    out(['ok' => false, 'error' => $e->getMessage()]);
  }
}

if ($action === 'delete_tournament') {
  try {
    $tour_id = (int)$input['tour_id'];
    
    $pdo->beginTransaction();
    
    // Get tournament data before deletion
    $stmt = $pdo->prepare("SELECT * FROM tbl_tournament WHERE tour_id = ?");
    $stmt->execute([$tour_id]);
    $deleted_tournament = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$deleted_tournament) {
      out(['ok' => false, 'error' => 'Tournament not found']);
    }
    
    // Delete related records
    // 1. Delete tournament team registrations
    $stmt = $pdo->prepare("DELETE FROM tbl_tournament_teams WHERE tour_id = ?");
    $stmt->execute([$tour_id]);
    
    // 2. Delete team athletes assignments
    $stmt = $pdo->prepare("DELETE FROM tbl_team_athletes WHERE tour_id = ?");
    $stmt->execute([$tour_id]);
    
    // 3. Delete sports team assignments
    $stmt = $pdo->prepare("DELETE FROM tbl_sports_team WHERE tour_id = ?");
    $stmt->execute([$tour_id]);
    
    // 4. Delete matches
    $stmt = $pdo->prepare("DELETE FROM tbl_match WHERE tour_id = ?");
    $stmt->execute([$tour_id]);
    
    // 5. Delete competition scores
    $stmt = $pdo->prepare("DELETE FROM tbl_comp_score WHERE tour_id = ?");
    $stmt->execute([$tour_id]);
    
    // 6. Delete team standings
    $stmt = $pdo->prepare("DELETE FROM tbl_team_standing WHERE tour_id = ?");
    $stmt->execute([$tour_id]);
    
    // 7. Delete tournament sports selections
    $stmt = $pdo->prepare("DELETE FROM tbl_tournament_sports_selection WHERE tour_id = ?");
    $stmt->execute([$tour_id]);
    
    // 8. Delete umpire assignments
    $stmt = $pdo->prepare("DELETE FROM tbl_tournament_umpire_assignments WHERE tour_id = ?");
    $stmt->execute([$tour_id]);
    
    // Finally, delete the tournament itself
    $stmt = $pdo->prepare("DELETE FROM tbl_tournament WHERE tour_id = ?");
    $stmt->execute([$tour_id]);
    
    $pdo->commit();
    
    logActivity($pdo, $user_id, $person_id, 'delete',
      "permanently deleted tournament '{$deleted_tournament['tour_name']}' ({$deleted_tournament['school_year']}) and all associated records",
      'Tournament Management',
      [
        'target_table' => 'tbl_tournament',
        'target_id' => $tour_id,
        'old_data' => $deleted_tournament,
        'can_revert' => 1
      ]
    );
    
    out(['ok' => true, 'message' => 'Tournament deleted successfully']);
    
  } catch (PDOException $e) {
    if ($pdo->inTransaction()) {
      $pdo->rollBack();
    }
    error_log("DELETE_TOURNAMENT ERROR: " . $e->getMessage());
    out(['ok' => false, 'error' => 'Database error: ' . $e->getMessage()]);
  }
}

out(['ok' => false, 'message' => 'Unknown action: ' . $action]);