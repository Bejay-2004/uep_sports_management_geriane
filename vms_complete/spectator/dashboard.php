<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . "/../auth/guard.php";

// Accept 'Spectator' role
$user_role = $_SESSION['user']['user_role'] ?? '';
$normalized_role = strtolower(str_replace(['/', ' '], '_', trim($user_role)));

if ($normalized_role !== 'spectator') {
    http_response_code(403);
    die('Access denied. This page is for spectators only.');
}

$full_name = $_SESSION['user']['full_name'] ?? 'Spectator';
$person_id = (int)$_SESSION['user']['person_id'];
$sports_id = (int)($_SESSION['user']['sports_id'] ?? 0);

// Get initials for avatar
$names = explode(' ', $full_name);
$initials = '';
foreach ($names as $n) {
    $initials .= strtoupper(substr($n, 0, 1));
}
$initials = substr($initials, 0, 2);

// Get sport name if sports_id exists
$sport_name = 'All Sports';
if ($sports_id > 0) {
  try {
    $stmt = $pdo->prepare("SELECT sports_name FROM tbl_sports WHERE sports_id = :sid");
    $stmt->execute(['sid' => $sports_id]);
    $sport = $stmt->fetch();
    if ($sport) {
      $sport_name = $sport['sports_name'];
    }
  } catch (PDOException $e) {
    // Ignore error, keep 'All Sports'
  }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Spectator Dashboard - UEP Sports</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="<?= BASE_URL ?>/spectator/spectator.css">
</head>
<body>

<!-- SIDEBAR -->
<aside class="sidebar">
  <div class="sidebar-header">
  <div class="logo">
      <img src="<?= BASE_URL ?>/assets/images/uep.png" alt="UEP" style="width:100%;height:100%;object-fit:contain;">
    </div>
    <div class="sidebar-title">
      <h3>UEP Sports</h3>
      <p>Spectator Portal</p>
    </div>
  </div>

<nav class="sidebar-nav">
    <button class="nav-link active" data-view="overview">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
      <span>Overview</span>
    </button>

    <!-- Tournaments Section -->
    <button class="nav-link nav-parent" data-parent="tournaments">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="8" r="7"></circle>
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
      </svg>
      <span>Tournaments</span>
      <svg class="nav-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>
    
    <div class="nav-submenu" data-parent="tournaments">
      <button class="nav-link nav-child" data-view="tournaments">
        <span>All Tournaments</span>
      </button>
      <button class="nav-link nav-child" data-view="sports">
        <span>Sports</span>
      </button>
      <button class="nav-link nav-child" data-view="teams">
        <span>Teams</span>
      </button>
      <button class="nav-link nav-child" data-view="matches">
        <span>Matches</span>
      </button>
      <button class="nav-link nav-child" data-view="standings">
        <span>Standings</span>
      </button>
    </div>
  </nav>

  <div class="sidebar-footer">
    <form method="post" action="<?= BASE_URL ?>/auth/logout.php" style="margin:0;width:100%;">
      <button type="submit" class="logout-link">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span>Logout</span>
      </button>
    </form>
  </div>
</aside>

<!-- MAIN CONTENT -->
<main class="main-content">
  
  <!-- Top Bar -->
  <div class="top-bar">
    <button class="menu-toggle" id="menuToggle">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
    
    <h1 id="pageTitle">Dashboard Overview</h1>
    
    <div class="user-info">
      <div class="user-avatar"><?= htmlspecialchars($initials) ?></div>
      <div class="user-details">
        <div class="user-name"><?= htmlspecialchars($full_name) ?></div>
        <div class="user-role">Spectator</div>
      </div>
    </div>
  </div>

  <!-- OVERVIEW VIEW -->
  <div class="content-view active" id="overview-view">
    <div class="welcome-card">
      <h2>🏆 Welcome to UEP Sports</h2>
      <p class="college-info">Viewing: <?= htmlspecialchars($sport_name) ?></p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background:linear-gradient(135deg,#3b82f6,#2563eb);">🏆</div>
        <div class="stat-info">
          <div class="stat-value" id="statTournaments">0</div>
          <div class="stat-label">Active Tournaments</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background:linear-gradient(135deg,#10b981,#059669);">⚽</div>
        <div class="stat-info">
          <div class="stat-value" id="statSports">0</div>
          <div class="stat-label">Sports Categories</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background:linear-gradient(135deg,#f59e0b,#d97706);">📅</div>
        <div class="stat-info">
          <div class="stat-value" id="statMatches">0</div>
          <div class="stat-label">Upcoming Matches</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);">👥</div>
        <div class="stat-info">
          <div class="stat-value" id="statTeams">0</div>
          <div class="stat-label">Competing Teams</div>
        </div>
      </div>
    </div>

    <div class="filter-card">
      <label>Filter by Tournament</label>
      <select id="overviewTournamentFilter" class="form-select">
        <option value="">All Tournaments</option>
      </select>
    </div>

    <div class="overview-section">
      <h2>🔥 Live & Upcoming Matches</h2>
      <div id="overviewMatches">
        <div class="loading">Loading matches...</div>
      </div>
    </div>

    <div class="overview-section">
      <h2>🏅 Top Teams</h2>
      <div id="overviewStandings">
        <div class="loading">Loading standings...</div>
      </div>
    </div>
  </div>

  <!-- MATCHES VIEW -->
  <div class="content-view" id="matches-view">
    <div class="view-header">
      <h2>Match Schedule</h2>
    </div>

    <div class="filter-card">
      <div class="filter-grid">
        <div class="filter-group">
          <label>Tournament</label>
          <select id="matchTournamentFilter" class="form-select">
            <option value="">All Tournaments</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Sport</label>
          <select id="matchSportFilter" class="form-select">
            <option value="">All Sports</option>
          </select>
        </div>
      </div>
    </div>

    <div id="matchesContent">
      <div class="loading">Loading matches...</div>
    </div>
  </div>

  <!-- STANDINGS VIEW -->
  <div class="content-view" id="standings-view">
    <div class="view-header">
      <h2>Team Rankings</h2>
    </div>

    <div class="filter-card">
      <div class="filter-grid">
        <div class="filter-group">
          <label>Tournament</label>
          <select id="standingTournamentFilter" class="form-select">
            <option value="">Select Tournament</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Sport</label>
          <select id="standingSportFilter" class="form-select">
            <option value="">Select Sport</option>
          </select>
        </div>
      </div>
    </div>

    <div id="standingsContent">
      <div class="empty-state">Select tournament and sport to view standings</div>
    </div>
  </div>

  <!-- TEAMS VIEW -->
  <div class="content-view" id="teams-view">
    <div class="view-header">
      <h2>Teams & Players</h2>
    </div>

    <div class="filter-card">
      <label>Filter by Sport</label>
      <select id="teamSportFilter" class="form-select">
        <option value="">All Sports</option>
      </select>
    </div>

    <div id="teamsContent">
      <div class="loading">Loading teams...</div>
    </div>
  </div>

  <!-- TOURNAMENTS VIEW -->
  <div class="content-view" id="tournaments-view">
    <div class="view-header">
      <h2>All Tournaments</h2>
    </div>
    <div class="data-grid" id="tournamentsContent">
      <div class="loading">Loading tournaments...</div>
    </div>
  </div>

  <!-- SPORTS VIEW -->
  <div class="content-view" id="sports-view">
    <div class="view-header">
      <h2>All Sports</h2>
    </div>
    <div class="data-grid" id="sportsContent">
      <div class="loading">Loading sports...</div>
    </div>
  </div>

  


</main>

<!-- Mobile Overlay -->
<div class="sidebar-overlay" id="sidebarOverlay"></div>

<script>
  window.BASE_URL = "<?= BASE_URL ?>";
  window.SPECTATOR_CONTEXT = {
    person_id: <?= $person_id ?>,
    sports_id: <?= $sports_id ?>
  };

  
</script>

<script src="<?= BASE_URL ?>/spectator/score-display-helper.js"></script>
<script src="<?= BASE_URL ?>/spectator/spectator.js"></script>

</body>
</html>