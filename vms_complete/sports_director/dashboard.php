<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . "/../auth/guard.php";

// Accept 'sports_director' or 'sports director' role (database stores as 'sports director')
$user_role = $_SESSION['user']['user_role'] ?? '';
$normalized_role = strtolower(str_replace(['/', ' '], '_', trim($user_role)));

if ($normalized_role !== 'sports_director') {
    http_response_code(403);
    die('Access denied. This page is for sports directors only.');
}

$full_name = $_SESSION['user']['full_name'] ?? 'Sports Director';
$person_id = (int)$_SESSION['user']['person_id'];
$sports_id = (int)($_SESSION['user']['sports_id'] ?? 0); // Will be NULL/0 for sports director
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sports Director Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="<?= BASE_URL ?>/sports_director/director.css">
</head>
<body>

<!-- Sidebar -->
<aside class="sidebar">
  <div class="sidebar-header">
  <div class="logo">
      <img src="<?= BASE_URL ?>/assets/images/uep.png" alt="UEP" style="width:100%;height:100%;object-fit:contain;">
    </div>
    <div class="sidebar-title">
      <h3>Sports Director</h3>
      <p><?= htmlspecialchars($full_name) ?></p>
    </div>
  </div>
  
  <nav class="sidebar-nav">
    <!-- Overview -->
    <div class="nav-item">
      <button class="nav-link active" data-view="overview">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
        </svg>
        <span>Overview</span>
      </button>
    </div>
    
    <!-- Tournaments with Sub-menu -->
    <div class="nav-item">
      <button class="nav-link" data-view="tournaments">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M2.5.5A.5.5 0 0 1 3 0h10a.5.5 0 0 1 .5.5c0 .538-.012 1.05-.034 1.536a3 3 0 1 1-1.133 5.89c-.79 1.865-1.878 2.777-2.833 3.011v2.173l1.425.356c.194.048.377.135.537.255L13.3 15.1a.5.5 0 0 1-.3.9H3a.5.5 0 0 1-.3-.9l1.838-1.379c.16-.12.343-.207.537-.255L6.5 13.11v-2.173c-.955-.234-2.043-1.146-2.833-3.012a3 3 0 1 1-1.132-5.89A33.076 33.076 0 0 1 2.5.5z"/>
        </svg>
        <span>Tournaments</span>
      </button>
      <div class="nav-submenu active" id="tournaments-submenu">
        <button class="nav-link" data-view="matches">
          <span>Matches</span>
        </button>
        <button class="nav-link" data-view="standings">
          <span>Standings</span>
        </button>
        <button class="nav-link" data-view="assign-umpires">
          <span>Assign Umpires</span>
        </button>
      </div>
    </div>
    
    <!-- Teams with Sub-menu -->
    <div class="nav-item">
      <button class="nav-link" data-view="teams">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
        </svg>
        <span>Teams</span>
      </button>
      <div class="nav-submenu active" id="teams-submenu">
        <button class="nav-link" data-view="athletes">
          <span>Athletes</span>
        </button>
        <button class="nav-link" data-view="qualify-athletes">
          <span>Qualify/Disqualify</span>
        </button>
      </div>
    </div>
    


    <!-- Colleges with Sub-menu -->
    <div class="nav-item">
      <button class="nav-link" data-view="colleges">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 14.5 3H11v-.5A1.5 1.5 0 0 0 9.5 1h-3zm0 1h3a.5.5 0 0 1 .5.5V3H6v-.5a.5.5 0 0 1 .5-.5z"/>
        </svg>
        <span>Colleges</span>
      </button>
      <div class="nav-submenu active" id="colleges-submenu">
        <button class="nav-link" data-view="departments">
          <span>Departments</span>
        </button>
        <button class="nav-link" data-view="courses">
          <span>Courses</span>
        </button>
      </div>
    </div>

        <!-- Training -->
    <div class="nav-item">
      <button class="nav-link" data-view="training">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5V2zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1H4z"/>
        </svg>
        <span>Training</span>
      </button>
    </div>

    <!-- Venues -->
    <div class="nav-item">
      <button class="nav-link" data-view="venues">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L8 2.207l6.646 6.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5Z"/>
          <path d="m8 3.293 6 6V13.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5V9.293l6-6Z"/>
        </svg>
        <span>Venues</span>
      </button>
    </div>

    <!-- Equipment -->
    <div class="nav-item">
      <button class="nav-link" data-view="equipment">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
          <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319z"/>
        </svg>
        <span>Equipment</span>
      </button>
    </div>
  </nav>

  
  
  <div class="sidebar-footer">
    <form method="post" action="<?= BASE_URL ?>/auth/logout.php" id="logoutForm">
      <button type="button" class="logout-link" onclick="confirmLogout()">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
          <path d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
        </svg>
        <span>Logout</span>
      </button>
    </form>
  </div>
</aside>

<!-- Main Content -->
<main class="main-content">
  
  <!-- Top Bar -->
<div class="top-bar">
  <h1 id="pageTitle">Overview</h1>
  <div class="top-bar-actions">
        <!-- NEW: Status Filter -->
    <select id="filterStatus" class="filter-select" title="Filter by tournament status">
      <option value="active">Active Only</option>
      <option value="all">All Tournaments</option>
      <option value="inactive">Inactive Only</option>
    </select>
    <select id="filterSchoolYear" class="filter-select">
      <option value="">All School Years</option>
    </select>
    <select id="filterTournament" class="filter-select">
      <option value="">All Tournaments</option>
    </select>
    <select id="filterTeam" class="filter-select">
      <option value="">All Teams</option>
    </select>
    <select id="filterSport" class="filter-select">
      <option value="">All Sports</option>
    </select>
    

    
    <button id="clearFilters" class="btn btn-secondary" style="display: none;">
      <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
      </svg>
      Clear Filters
    </button>
  </div>
</div>

  <!-- OVERVIEW VIEW -->
  <section class="content-view active" id="overview-view">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: #3b82f6;">📅</div>
        <div class="stat-info">
          <div class="stat-value" id="statTournaments">0</div>
          <div class="stat-label">Active Tournaments</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #10b981;">👥</div>
        <div class="stat-info">
          <div class="stat-value" id="statTeams">0</div>
          <div class="stat-label">Teams</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #f59e0b;">🏃</div>
        <div class="stat-info">
          <div class="stat-value" id="statAthletes">0</div>
          <div class="stat-label">Athletes</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #ef4444;">⚔️</div>
        <div class="stat-info">
          <div class="stat-value" id="statMatches">0</div>
          <div class="stat-label">Matches</div>
        </div>
      </div>
    </div>

    <div class="overview-section">
      <h2>📊 Quick Stats</h2>
      <div id="overviewContent">
        <div class="loading">Loading overview data...</div>
      </div>
    </div>
  </section>

  <!-- TOURNAMENTS VIEW -->
  <section class="content-view" id="tournaments-view">
    <div class="view-header">
      <button class="btn btn-primary" onclick="showTournamentModal()">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
        </svg>
        Create Tournament
      </button>
    </div>
    <div id="tournamentsContent">
      <div class="loading">Loading tournaments...</div>
    </div>
  </section>

  <!-- TEAMS VIEW -->
  <section class="content-view" id="teams-view">
    <div class="view-header">
      <button class="btn btn-primary" onclick="showTeamModal()">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
        </svg>
        Add Team
      </button>
    </div>
    <div id="teamsContent">
      <div class="loading">Loading teams...</div>
    </div>
  </section>

  <!-- ATHLETES VIEW -->
  <section class="content-view" id="athletes-view">
    <div class="view-header">
      <button class="btn btn-primary" onclick="showAthleteContextModal()">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
        </svg>
        Add Athlete
      </button>
    </div>
    <div id="athletesContent">
      <div class="loading">Loading athletes...</div>
    </div>
  </section>

  <!-- QUALIFY/DISQUALIFY ATHLETES VIEW -->
  <section class="content-view" id="qualify-athletes-view">
    <div class="view-header">
      <h2>✅ Qualify / ❌ Disqualify Athletes</h2>
    </div>
    <div id="qualifyAthletesContent">
      <div class="loading">Loading qualification management...</div>
    </div>
  </section>

  <!-- MATCHES VIEW -->
  <section class="content-view" id="matches-view">
    <div class="view-header">
      <button class="btn btn-primary" onclick="showMatchModal()">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
        </svg>
        Schedule Match
      </button>
    </div>
    <div id="matchesContent">
      <div class="loading">Loading matches...</div>
    </div>
  </section>

  <!-- STANDINGS VIEW -->
  <section class="content-view" id="standings-view">
    <div id="standingsContent">
      <div class="loading">Loading standings...</div>
    </div>
  </section>

  <!-- ASSIGN UMPIRES VIEW -->
  <section class="content-view" id="assign-umpires-view">
    <div class="view-header">
      <h2>👨‍⚖️ Assign Umpires to Matches</h2>
    </div>
    <div id="assignUmpiresContent">
      <div class="loading">Loading umpire assignments...</div>
    </div>
  </section>

  <!-- TRAINING VIEW -->
  <section class="content-view" id="training-view">
    <div class="view-header">
      <button class="btn btn-primary" onclick="showTrainingModal()">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
        </svg>
        Add Training
      </button>
    </div>
    <div id="trainingContent">
      <div class="loading">Loading training...</div>
    </div>
  </section>

  <!-- COLLEGES VIEW -->
<section class="content-view" id="colleges-view">
  <div class="view-header">
    <button class="btn btn-primary" onclick="showCollegeModal()">
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
      </svg>
      Add College
    </button>
  </div>
  <div id="collegesContent">
    <div class="loading">Loading colleges...</div>
  </div>
</section>

<!-- DEPARTMENTS VIEW -->
<section class="content-view" id="departments-view">
  <div class="view-header">
    <button class="btn btn-primary" onclick="showDepartmentModal()">
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
      </svg>
      Add Department
    </button>
  </div>
  <div id="departmentsContent">
    <div class="loading">Loading departments...</div>
  </div>
</section>

<!-- COURSES VIEW -->
<section class="content-view" id="courses-view">
  <div class="view-header">
    <button class="btn btn-primary" onclick="showCourseModal()">
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
      </svg>
      Add Course
    </button>
  </div>
  <div id="coursesContent">
    <div class="loading">Loading courses...</div>
  </div>
</section>

<!-- VENUES VIEW -->
<section class="content-view" id="venues-view">
  <div class="view-header">
    <button class="btn btn-primary" onclick="showVenueModal()">
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
      </svg>
      Add Venue
    </button>
  </div>
  <div id="venuesContent">
    <div class="loading">Loading venues...</div>
  </div>
</section>

<!-- EQUIPMENT VIEW -->
<section class="content-view" id="equipment-view">
  <div class="view-header">
    <button class="btn btn-primary" onclick="showEquipmentModal()">
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
      </svg>
      Add Equipment
    </button>
  </div>
  <div id="equipmentContent">
    <div class="loading">Loading equipment...</div>
  </div>
</section>



</main>

<!-- Print Report Modal -->
<!-- Print Report Modal -->


<!-- Print Report Modal -->
<div class="modal" id="printModal">
  <div class="modal-content" style="max-width: 700px;">
    <div class="modal-header">
      <h3>🖨️ Print Report</h3>
      <button class="modal-close" onclick="closePrintModal()">×</button>
    </div>
    <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
      
      <!-- Filter Selection -->
      <div style="padding: 16px; background: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 6px; margin-bottom: 20px;">
        <div style="font-size: 13px; color: #1e40af; margin-bottom: 12px;">
          <strong>📋 Select Filters</strong>
        </div>
        
        <!-- Status Filter - NEW -->
        <div style="margin-bottom: 12px;">
          <label style="display: block; font-weight: 600; color: #1e3a8a; font-size: 12px; margin-bottom: 6px;">
            Status Filter
          </label>
          <select id="printStatusFilter" class="form-control" style="font-size: 13px;">
            <option value="active">Active Only</option>
            <option value="all">All (Active & Inactive)</option>
            <option value="inactive">Inactive Only</option>
          </select>
          <small style="color: #1e3a8a; font-size: 11px; display: block; margin-top: 4px;">
            💡 Filter tournaments, teams, and athletes by status
          </small>
        </div>
        
        <!-- School Year Filter -->
        <div style="margin-bottom: 12px;">
          <label style="display: block; font-weight: 600; color: #1e3a8a; font-size: 12px; margin-bottom: 6px;">
            School Year
          </label>
          <select id="printSchoolYearFilter" class="form-control" style="font-size: 13px;">
            <option value="">All School Years</option>
          </select>
        </div>
        
        <!-- Tournament Filter -->
        <div>
          <label style="display: block; font-weight: 600; color: #1e3a8a; font-size: 12px; margin-bottom: 6px;">
            Tournament
          </label>
          <select id="printTournamentFilter" class="form-control" style="font-size: 13px;">
            <option value="">All Tournaments</option>
          </select>
        </div>
      </div>
      
      <!-- Current Filter Display -->
      <div style="padding: 12px; background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 6px; margin-bottom: 20px;">
        <div style="font-size: 13px; color: #065f46;">
          <strong>🎯 Current Selection:</strong> <span id="printFilterSummary">Active Only, All School Years, All Tournaments</span>
        </div>
      </div>
      
      <!-- Section Selection -->
      <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #111827;">Select Sections to Print:</h4>
      
      <div style="display: grid; gap: 10px;">
        <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: #f9fafb; border-radius: 8px; cursor: pointer; border: 1px solid #e5e7eb;">
          <input type="checkbox" id="printOverview" checked style="width: 18px; height: 18px; cursor: pointer;">
          <div style="flex: 1;">
            <div style="font-weight: 600; color: #111827;">📊 Overview Statistics</div>
            <div style="font-size: 11px; color: #6b7280;">Tournament stats, team counts, athlete counts</div>
          </div>
        </label>
        
        <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: #f9fafb; border-radius: 8px; cursor: pointer; border: 1px solid #e5e7eb;">
          <input type="checkbox" id="printTournaments" checked style="width: 18px; height: 18px; cursor: pointer;">
          <div style="flex: 1;">
            <div style="font-weight: 600; color: #111827;">🏆 Tournaments</div>
            <div style="font-size: 11px; color: #6b7280;">Tournament details and information</div>
          </div>
        </label>
        
        <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: #f9fafb; border-radius: 8px; cursor: pointer; border: 1px solid #e5e7eb;">
          <input type="checkbox" id="printTeams" checked style="width: 18px; height: 18px; cursor: pointer;">
          <div style="flex: 1;">
            <div style="font-weight: 600; color: #111827;">👥 Teams</div>
            <div style="font-size: 11px; color: #6b7280;">Team rosters and details</div>
          </div>
        </label>
        
        <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: #f9fafb; border-radius: 8px; cursor: pointer; border: 1px solid #e5e7eb;">
          <input type="checkbox" id="printAthletes" checked style="width: 18px; height: 18px; cursor: pointer;">
          <div style="flex: 1;">
            <div style="font-weight: 600; color: #111827;">🏃 Athletes</div>
            <div style="font-size: 11px; color: #6b7280;">Complete athlete listings</div>
          </div>
        </label>
        
        <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: #f9fafb; border-radius: 8px; cursor: pointer; border: 1px solid #e5e7eb;">
          <input type="checkbox" id="printMatches" style="width: 18px; height: 18px; cursor: pointer;">
          <div style="flex: 1;">
            <div style="font-weight: 600; color: #111827;">⚔️ Matches</div>
            <div style="font-size: 11px; color: #6b7280;">Match schedules and results</div>
          </div>
        </label>
        
        <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: #f9fafb; border-radius: 8px; cursor: pointer; border: 1px solid #e5e7eb;">
          <input type="checkbox" id="printStandings" style="width: 18px; height: 18px; cursor: pointer;">
          <div style="flex: 1;">
            <div style="font-weight: 600; color: #111827;">📊 Standings</div>
            <div style="font-size: 11px; color: #6b7280;">Team rankings and standings</div>
          </div>
        </label>
        
        <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: #f9fafb; border-radius: 8px; cursor: pointer; border: 1px solid #e5e7eb;">
          <input type="checkbox" id="printTraining" style="width: 18px; height: 18px; cursor: pointer;">
          <div style="flex: 1;">
            <div style="font-weight: 600; color: #111827;">📚 Training</div>
            <div style="font-size: 11px; color: #6b7280;">Training schedules and sessions</div>
          </div>
        </label>
        
        <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: #f9fafb; border-radius: 8px; cursor: pointer; border: 1px solid #e5e7eb;">
          <input type="checkbox" id="printVenues" style="width: 18px; height: 18px; cursor: pointer;">
          <div style="flex: 1;">
            <div style="font-weight: 600; color: #111827;">🏟️ Venues</div>
            <div style="font-size: 11px; color: #6b7280;">Venue information and availability</div>
          </div>
        </label>
        
        <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: #f9fafb; border-radius: 8px; cursor: pointer; border: 1px solid #e5e7eb;">
          <input type="checkbox" id="printEquipment" style="width: 18px; height: 18px; cursor: pointer;">
          <div style="flex: 1;">
            <div style="font-weight: 600; color: #111827;">⚙️ Equipment</div>
            <div style="font-size: 11px; color: #6b7280;">Equipment inventory</div>
          </div>
        </label>
        
        <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: #f9fafb; border-radius: 8px; cursor: pointer; border: 1px solid #e5e7eb;">
          <input type="checkbox" id="printColleges" style="width: 18px; height: 18px; cursor: pointer;">
          <div style="flex: 1;">
            <div style="font-weight: 600; color: #111827;">🎓 Colleges</div>
            <div style="font-size: 11px; color: #6b7280;">College and department information</div>
          </div>
        </label>
      </div>
      
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closePrintModal()">Cancel</button>
      <button class="btn btn-primary" onclick="generatePrintReport()">
        🖨️ Generate Report
      </button>
    </div>
  </div>
</div>

<!-- Modals will be loaded dynamically -->
<div id="modalContainer"></div>

<!-- Logout Modal -->
<div class="modal" id="logoutModal">
  <div class="modal-content modal-sm">
    <div class="modal-icon">👋</div>
    <h3>Logout?</h3>
    <p>Are you sure you want to logout?</p>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="closeLogoutModal()">Cancel</button>
      <button class="btn btn-danger" onclick="proceedLogout()">Logout</button>
    </div>
  </div>
</div>

<script>
  window.BASE_URL = "<?= BASE_URL ?>";
  window.DIRECTOR_CONTEXT = {
    person_id: <?= (int)$person_id ?>,
    sports_id: <?= (int)$sports_id ?>,
    full_name: "<?= htmlspecialchars($full_name) ?>"
  };

  // Logout functions
  function confirmLogout() {
    document.getElementById('logoutModal').classList.add('active');
  }

  function closeLogoutModal() {
    document.getElementById('logoutModal').classList.remove('active');
  }

  function proceedLogout() {
    document.getElementById('logoutForm').submit();
  }

  document.getElementById('logoutModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeLogoutModal();
  });

  // Show all submenus by default on page load
  document.addEventListener('DOMContentLoaded', function() {
    // Show all submenus
    document.querySelectorAll('.nav-submenu').forEach(submenu => {
      submenu.classList.add('active');
    });
  });
</script>

<script src="<?= BASE_URL ?>/sports_director/director.js"></script>
<script src="<?= BASE_URL ?>/sports_director/director_modals.js"></script>
<script src="<?= BASE_URL ?>/sports_director/print_functions.js"></script>
</body>
</html>