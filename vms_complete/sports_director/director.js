const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const personId = window.DIRECTOR_CONTEXT.person_id;

// Event system for triggering updates across the dashboard
const DashboardEvents = {
  listeners: {},
  
  // Subscribe to an event
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },
  
  // Unsubscribe from an event
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  },
  
  // Trigger an event
  trigger(event, data) {
    console.log('📡 Event triggered:', event, data);
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(data));
  }
};

// Available events
const EVENTS = {
  TOURNAMENT_CREATED: 'tournament_created',
  TOURNAMENT_UPDATED: 'tournament_updated',
  TOURNAMENT_TOGGLED: 'tournament_toggled',
  TOURNAMENT_DELETED: 'tournament_deleted',
  TEAM_CREATED: 'team_created',
  TEAM_UPDATED: 'team_updated',
  TEAM_TOGGLED: 'team_toggled',
  TEAM_ADDED_TO_TOURNAMENT: 'team_added_to_tournament',
  TEAM_REMOVED_FROM_TOURNAMENT: 'team_removed_from_tournament',
  SPORT_ADDED_TO_TEAM: 'sport_added_to_team',
  SPORT_REMOVED_FROM_TEAM: 'sport_removed_from_team',
  ATHLETE_CREATED: 'athlete_created',
  ATHLETE_ADDED: 'athlete_added',
  ATHLETE_UPDATED: 'athlete_updated',
  ATHLETE_REMOVED: 'athlete_removed',
  STAFF_ASSIGNED: 'staff_assigned',
  COLLEGE_CREATED: 'college_created',
  COLLEGE_UPDATED: 'college_updated',
  DEPARTMENT_CREATED: 'department_created',
  COURSE_CREATED: 'course_created',
  VENUE_CREATED: 'venue_created',
  EQUIPMENT_CREATED: 'equipment_created',
  EQUIPMENT_UPDATED: 'equipment_updated'
};

// ==========================================
// SETUP EVENT LISTENERS FOR AUTO-REFRESH
// Call this after DOM is loaded
// ==========================================

function setupDashboardEventListeners() {
  // Overview stats should update on any major change
  DashboardEvents.on(EVENTS.TOURNAMENT_CREATED, () => refreshIfActive('overview'));
  DashboardEvents.on(EVENTS.TOURNAMENT_TOGGLED, () => refreshIfActive('overview'));
  DashboardEvents.on(EVENTS.TOURNAMENT_DELETED, () => refreshIfActive('overview'));
  DashboardEvents.on(EVENTS.TEAM_CREATED, () => refreshIfActive('overview'));
  DashboardEvents.on(EVENTS.ATHLETE_CREATED, () => refreshIfActive('overview'));
  DashboardEvents.on(EVENTS.ATHLETE_ADDED, () => refreshIfActive('overview'));
  
  // Tournaments view
  DashboardEvents.on(EVENTS.TOURNAMENT_CREATED, () => refreshIfActive('tournaments'));
  DashboardEvents.on(EVENTS.TOURNAMENT_UPDATED, () => refreshIfActive('tournaments'));
  DashboardEvents.on(EVENTS.TOURNAMENT_TOGGLED, () => refreshIfActive('tournaments'));
  DashboardEvents.on(EVENTS.TOURNAMENT_DELETED, () => refreshIfActive('tournaments'));
  DashboardEvents.on(EVENTS.TEAM_ADDED_TO_TOURNAMENT, () => refreshIfActive('tournaments'));
  
  // Teams view
  DashboardEvents.on(EVENTS.TEAM_CREATED, () => refreshIfActive('teams'));
  DashboardEvents.on(EVENTS.TEAM_UPDATED, () => refreshIfActive('teams'));
  DashboardEvents.on(EVENTS.TEAM_TOGGLED, () => refreshIfActive('teams'));
  
  // Athletes view
  DashboardEvents.on(EVENTS.ATHLETE_CREATED, () => refreshIfActive('athletes'));
  DashboardEvents.on(EVENTS.ATHLETE_ADDED, () => refreshIfActive('athletes'));
  DashboardEvents.on(EVENTS.ATHLETE_UPDATED, () => refreshIfActive('athletes'));
  DashboardEvents.on(EVENTS.ATHLETE_REMOVED, () => refreshIfActive('athletes'));
  
  // Colleges view
  DashboardEvents.on(EVENTS.COLLEGE_CREATED, () => refreshIfActive('colleges'));
  DashboardEvents.on(EVENTS.COLLEGE_UPDATED, () => refreshIfActive('colleges'));
  
  // Departments view
  DashboardEvents.on(EVENTS.DEPARTMENT_CREATED, () => refreshIfActive('departments'));
  
  // Courses view
  DashboardEvents.on(EVENTS.COURSE_CREATED, () => refreshIfActive('courses'));
  
  // Venues view
  DashboardEvents.on(EVENTS.VENUE_CREATED, () => refreshIfActive('venues'));
  
  // Equipment view
  DashboardEvents.on(EVENTS.EQUIPMENT_CREATED, () => refreshIfActive('equipment'));
  DashboardEvents.on(EVENTS.EQUIPMENT_UPDATED, () => refreshIfActive('equipment'));
  
  // Assign Umpires view - refresh when sports are added/removed from tournaments
  DashboardEvents.on(EVENTS.SPORT_ADDED_TO_TEAM, (data) => {
    refreshIfActive('assign-umpires');
    // Also refresh the umpire assignment modal if it's open for this tournament
    if (window.currentUmpireAssignmentTourId && window.currentUmpireAssignmentTourId === data.tour_id) {
      console.log('🔄 Refreshing umpire assignment modal after sport added');
      showUmpireAssignmentModal(data.tour_id);
    }
  });
  DashboardEvents.on(EVENTS.SPORT_REMOVED_FROM_TEAM, (data) => {
    refreshIfActive('assign-umpires');
    // Also refresh the umpire assignment modal if it's open for this tournament
    if (window.currentUmpireAssignmentTourId && window.currentUmpireAssignmentTourId === data.tour_id) {
      console.log('🔄 Refreshing umpire assignment modal after sport removed');
      showUmpireAssignmentModal(data.tour_id);
    }
  });
  
  console.log('✅ Dashboard event listeners initialized');
}

// Helper function to refresh only if the view is currently active
function refreshIfActive(viewName) {
  const view = document.getElementById(`${viewName}-view`);
  if (view && view.classList.contains('active')) {
    console.log('🔄 Auto-refreshing active view:', viewName);
    loadViewData(viewName);
  }
}

// Filter state
let currentFilters = {
  school_year: '',
  tournament: '',
  team: '',
  sport: ''
};

let currentContext = {
  tour_id: null,
  team_id: null,
  sports_id: null
};

// Navigation handling - all links navigate to their views
$$('.nav-link').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const view = btn.dataset.view;
    if (!view) return;
    
    // Remove active class from all nav links
    $$('.nav-link').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Switch to the target view
    $$('.content-view').forEach(v => v.classList.remove('active'));
    const targetView = $(`#${view}-view`);
    if (targetView) {
      targetView.classList.add('active');
    }
    
    const titles = {
      overview: 'Overview',
      tournaments: 'Tournaments',
      teams: 'Teams',
      athletes: 'Athletes',
      'qualify-athletes': 'Qualify / Disqualify Athletes',
      matches: 'Matches',
      training: 'Training',
      standings: 'Standings',
      'assign-umpires': 'Assign Umpires',
      colleges: 'Colleges',
      departments: 'Departments',
      courses: 'Courses',
      venues: 'Venues',
      equipment: 'Equipment Inventory'
    };

    $('#pageTitle').textContent = titles[view] || 'Dashboard';
    
    loadViewData(view);
  });
});




// Initialize filters immediately
(async function() {
  await initializeFilters();
  // Load initial view
  loadViewData('overview');
})();

async function initializeFilters() {
  try {
    // Load initial filter data
    const [tournaments, teams, sports] = await Promise.all([
      fetchAPI('tournaments'),
      fetchAPI('teams'),
      fetchAPI('sports')
    ]);
    
    // Populate school years from tournaments
    const schoolYears = [...new Set(tournaments.map(t => t.school_year))].sort().reverse();
    const schoolYearSelect = $('#filterSchoolYear');
    if (schoolYearSelect) {
      schoolYearSelect.innerHTML = '<option value="">All School Years</option>' +
        schoolYears.map(sy => `<option value="${sy}">${sy}</option>`).join('');
    }
    
    // Populate tournaments
    const tournamentSelect = $('#filterTournament');
    if (tournamentSelect) {
      tournamentSelect.innerHTML = '<option value="">All Tournaments</option>' +
        tournaments.map(t => `<option value="${t.tour_id}">${escapeHtml(t.tour_name)} (${t.school_year})</option>`).join('');
    }
    
    // Populate teams
    const teamSelect = $('#filterTeam');
    if (teamSelect) {
      teamSelect.innerHTML = '<option value="">All Teams</option>' +
        teams.map(t => `<option value="${t.team_id}">${escapeHtml(t.team_name)}</option>`).join('');
    }
    
    // Populate sports
    const sportSelect = $('#filterSport');
    if (sportSelect) {
      sportSelect.innerHTML = '<option value="">All Sports</option>' +
        sports.map(s => `<option value="${s.sports_id}">${escapeHtml(s.sports_name)}</option>`).join('');
    }
    
    // ==========================================
    // NEW: Initialize status filter with 'active' as default
    // ==========================================
    const statusSelect = $('#filterStatus');
    if (statusSelect) {
      statusSelect.value = 'active'; // Set default to Active Only
      currentFilters.status = 'active'; // Initialize filter state
    }
    
    // Add event listeners
    $('#filterSchoolYear')?.addEventListener('change', handleFilterChange);
    $('#filterTournament')?.addEventListener('change', handleFilterChange);
    $('#filterTeam')?.addEventListener('change', handleFilterChange);
    $('#filterSport')?.addEventListener('change', handleFilterChange);
    $('#filterStatus')?.addEventListener('change', handleFilterChange); // NEW
    $('#clearFilters')?.addEventListener('click', clearAllFilters);
    
  } catch (error) {
    console.error('Error initializing filters:', error);
  }
}

// Add Print Button to Dashboard
(function addPrintButton() {
  // Wait a bit for DOM to be ready
  setTimeout(() => {
    const topBarActions = document.querySelector('.top-bar-actions');
    
    if (!topBarActions) {
      console.warn('Top bar not found, retrying...');
      setTimeout(addPrintButton, 500);
      return;
    }
    
    // Check if button already exists
    if (document.getElementById('dashboardPrintBtn')) return;
    
    // Create print button
    const printBtn = document.createElement('button');
    printBtn.id = 'dashboardPrintBtn';
    printBtn.className = 'btn btn-secondary';
    printBtn.innerHTML = `
      <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
        <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2H5zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4V3zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2H5zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1z"/>
      </svg>
      Print
    `;
    printBtn.title = 'Print current view';
printBtn.onclick = function() {
  showPrintModal(); // Call the function from print_functions.js
};

    
    // Add to top bar
    topBarActions.appendChild(printBtn);
    console.log('✅ Print button added');
  }, 1000);
})();


function handleFilterChange(e) {
  const filterType = e.target.id.replace('filter', '').toLowerCase();
  
  // Map filter types to currentFilters keys
  const filterKey = filterType === 'schoolyear' ? 'school_year' : filterType;
  currentFilters[filterKey] = e.target.value;
  
  // Show/hide clear button (but don't count status filter since it defaults to 'active')
  const hasActiveFilters = Object.entries(currentFilters).some(([key, value]) => {
    if (key === 'status') return value !== 'active'; // Only count as filter if NOT default
    return value !== '';
  });
  
  const clearBtn = $('#clearFilters');
  if (clearBtn) {
    clearBtn.style.display = hasActiveFilters ? 'inline-flex' : 'none';
  }
  
  // If school year is selected, filter tournaments
  if (filterType === 'schoolyear') {
    updateTournamentFilter();
  }
  
  // If tournament is selected, filter teams
  if (filterType === 'tournament') {
    updateTeamFilter();
  }
  
  // Reload current view with filters
  const currentView = $('.content-view.active').id.replace('-view', '');
  loadViewData(currentView);
}

async function updateTournamentFilter() {
  const schoolYear = currentFilters.school_year;
  const tournamentSelect = $('#filterTournament');
  
  if (!schoolYear) {
    // Reset to all tournaments
    const tournaments = await fetchAPI('tournaments');
    tournamentSelect.innerHTML = '<option value="">All Tournaments</option>' +
      tournaments.map(t => `<option value="${t.tour_id}">${escapeHtml(t.tour_name)} (${t.school_year})</option>`).join('');
  } else {
    // Filter tournaments by school year
    const tournaments = await fetchAPI('tournaments');
    const filtered = tournaments.filter(t => t.school_year === schoolYear);
    tournamentSelect.innerHTML = '<option value="">All Tournaments</option>' +
      filtered.map(t => `<option value="${t.tour_id}">${escapeHtml(t.tour_name)} (${t.school_year})</option>`).join('');
  }
  
  // Reset tournament selection if it's no longer in the list
  if (currentFilters.tournament && !Array.from(tournamentSelect.options).some(opt => opt.value === currentFilters.tournament)) {
    currentFilters.tournament = '';
    tournamentSelect.value = '';
  }
}

async function updateTeamFilter() {
  const tournamentId = currentFilters.tournament;
  const teamSelect = $('#filterTeam');
  
  if (!tournamentId) {
    // Reset to all teams
    const teams = await fetchAPI('teams');
    teamSelect.innerHTML = '<option value="">All Teams</option>' +
      teams.map(t => `<option value="${t.team_id}">${escapeHtml(t.team_name)}</option>`).join('');
  } else {
    // Filter teams by tournament
    const tournamentTeams = await fetchAPI('get_tournament_teams', { tour_id: tournamentId });
    teamSelect.innerHTML = '<option value="">All Teams</option>' +
      tournamentTeams.map(t => `<option value="${t.team_id}">${escapeHtml(t.team_name)}</option>`).join('');
  }
  
  // Reset team selection if it's no longer in the list
  if (currentFilters.team && !Array.from(teamSelect.options).some(opt => opt.value === currentFilters.team)) {
    currentFilters.team = '';
    teamSelect.value = '';
  }
}


function clearAllFilters() {
  // Reset all filters
  currentFilters = { status: 'active' }; // Reset to default: active only
  
  // Reset filter UI
  $('#filterSchoolYear').value = '';
  $('#filterTournament').value = '';
  $('#filterTeam').value = '';
  $('#filterSport').value = '';
  $('#filterStatus').value = 'active'; // Reset to default
  
  // Hide clear button
  $('#clearFilters').style.display = 'none';
  
  // Reload current view
  const currentView = $('.content-view.active')?.id.replace('-view', '');
  if (currentView) {
    loadViewData(currentView);
  }
}

async function fetchAPI(action, data = null, method = 'GET') {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    let url = `api.php?action=${action}`;
    
    if (method === 'POST' && data) {
      options.body = JSON.stringify(data);
    } else if (method === 'GET' && data) {
      const params = new URLSearchParams(data);
      url += '&' + params.toString();
    }
    
    console.log('🔍 API:', method, url);
    const res = await fetch(url, options);
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const result = await res.json();
    console.log('✅ Response:', result);
    return result;
  } catch (err) {
    console.error('❌ API Error:', err);
    alert('Error: ' + err.message);
    return null;
  }
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[m]));
}

function loadViewData(view) {
  switch(view) {
    case 'overview': loadOverview(); break;
    case 'tournaments': loadTournaments(); break;
    case 'teams': loadTeams(); break;
    case 'athletes': loadAthletes(); break;
    case 'qualify-athletes': loadQualifyAthletes(); break;
    case 'matches': loadMatches(); break;
    case 'training': loadTraining(); break;
    case 'standings': loadStandings(); break;
    case 'assign-umpires': loadAssignUmpires(); break;
    case 'colleges': loadColleges(); break;
    case 'departments': loadDepartments(); break;
    case 'courses': loadCourses(); break;
    case 'venues': loadVenues(); break;
    case 'equipment': loadEquipment(); break;  // ✅ ADD THIS
    
  }
}

// ==========================================
// OVERVIEW
// ==========================================
async function loadOverview() {
  try {
    const params = {};
    if (currentFilters.sport) params.sport_id = currentFilters.sport;
    if (currentFilters.tournament) params.tour_id = currentFilters.tournament;
    if (currentFilters.team) params.team_id = currentFilters.team;
    if (currentFilters.school_year) params.school_year = currentFilters.school_year;
    
    const data = await fetchAPI('stats', params);
    
    if (data) {
      $('#statTournaments').textContent = data.tournaments || 0;
      $('#statTeams').textContent = data.teams || 0;
      $('#statAthletes').textContent = data.athletes || 0;
      $('#statMatches').textContent = data.upcoming_matches || 0;
    }
    
    const activity = await fetchAPI('recent_activity', params);
    const content = $('#overviewContent');
    
    if (!activity || activity.length === 0) {
      content.innerHTML = '<div class="empty-state">No recent activity</div>';
    } else {
      content.innerHTML = activity.map(a => `
        <div class="data-card">
          <div class="data-card-header">
            <div class="data-card-title">${escapeHtml(a.title)}</div>
            <span class="badge badge-${a.type}">${escapeHtml(a.type)}</span>
          </div>
          <div class="data-card-meta">${escapeHtml(a.description)}</div>
        </div>
      `).join('');
    }
    
    console.log('✅ Overview loaded with filters:', currentFilters);
  } catch (err) {
    console.error('❌ loadOverview error:', err);
  }
}

// ==========================================
// TOURNAMENTS
// ==========================================
async function loadTournaments() {
  try {
    let data = await fetchAPI('tournaments');
    const content = $('#tournamentsContent');
    
    if (!data || data.length === 0) {
      content.innerHTML = '<div class="empty-state">No tournaments found. Click "Add Tournament" to create one.</div>';
      return;
    }
    
    // ==========================================
    // NEW: Default to showing only ACTIVE tournaments
    // ==========================================
    
    // Check if status filter is set, otherwise default to 'active'
    if (!currentFilters.hasOwnProperty('status')) {
      currentFilters.status = 'active'; // Default to active only
    }
    
    // Apply status filter
    if (currentFilters.status === 'active') {
      data = data.filter(t => t.is_active == 1);
    } else if (currentFilters.status === 'inactive') {
      data = data.filter(t => t.is_active == 0);
    }
    // If status is 'all', show everything (no filter)
    
    // Apply school year filter if selected
    if (currentFilters.school_year) {
      data = data.filter(t => t.school_year === currentFilters.school_year);
    }
    
    if (data.length === 0) {
      content.innerHTML = '<div class="empty-state">No tournaments found matching the selected filters.</div>';
      return;
    }
    
    const grouped = {};
    data.forEach(t => {
      const year = t.school_year || 'No Year';
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(t);
    });
    
    let html = '';
    Object.keys(grouped).sort().reverse().forEach(year => {
      const tournaments = grouped[year];
      html += `
        <div class="group-header">
          <h4 class="group-title">School Year: ${escapeHtml(year)}</h4>
          <span class="group-badge">${tournaments.length} tournament${tournaments.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="data-grid">
          ${tournaments.map(t => renderTournamentCard(t)).join('')}
        </div>
      `;
    });
    
    content.innerHTML = html;
    console.log('✅ Tournaments loaded:', data.length, 'Status filter:', currentFilters.status || 'active');
  } catch (err) {
    console.error('❌ loadTournaments error:', err);
    $('#tournamentsContent').innerHTML = '<div class="empty-state">Error loading tournaments</div>';
  }
}

function renderTournamentCard(t) {
  const statusClass = t.is_active == 1 ? 'active' : 'inactive';
  const statusText = t.is_active == 1 ? 'Active' : 'Inactive';
  
  return `
    <div class="data-card">
      <div class="data-card-header">
        <div class="data-card-title">${escapeHtml(t.tour_name)}</div>
        <span class="badge badge-${statusClass}">${statusText}</span>
      </div>
      <div class="data-card-meta">
        📅 ${escapeHtml(t.tour_date || 'No date')} • ${escapeHtml(t.school_year)}<br>
        👥 ${t.num_teams || 0} team${t.num_teams !== 1 ? 's' : ''} • 
        ⚽ ${t.num_sports || 0} sport${t.num_sports !== 1 ? 's' : ''} • 
        🏃 ${t.num_athletes || 0} athlete${t.num_athletes !== 1 ? 's' : ''}
      </div>
      <div class="data-card-actions">
        <button class="btn btn-sm btn-primary" onclick="showComprehensiveTournamentView(${t.tour_id})" title="View complete tournament overview">
          📋 Full Overview
        </button>
        <button class="btn btn-sm btn-success" onclick="viewTournamentDetail(${t.tour_id})" title="Manage teams and athletes">
          👥 Manage
        </button>
        <button class="btn btn-sm btn-info" onclick="showUmpireAssignmentModal(${t.tour_id})" title="Assign umpires to sports">
          👨‍⚖️ Umpires
        </button>
        <button class="btn btn-sm btn-secondary" onclick="editTournament(${t.tour_id})">
          ✏️ Edit
        </button>
        <button class="btn btn-sm btn-${t.is_active == 1 ? 'danger' : 'success'}" 
                onclick="toggleTournament(${t.tour_id}, ${t.is_active})">
          ${t.is_active == 1 ? '❌ Deactivate' : '✅ Activate'}
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteTournament(${t.tour_id}, '${escapeHtml(t.tour_name)}')" title="Permanently delete this tournament">
          🗑️ Delete
        </button>
      </div>
    </div>
  `;
}

function showTournamentModal(id = null) {
  const isEdit = id !== null;
  const title = isEdit ? 'Edit Tournament' : 'Add Tournament';
  
  const modalHTML = `
    <div class="modal active" id="tournamentModal">
      <div class="modal-content modal-sm">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="closeModal('tournamentModal')">×</button>
        </div>
        <div class="modal-body">
          <form id="tournamentForm" onsubmit="saveTournament(event, ${id})">
            <div class="form-group">
              <label class="form-label">Tournament Name *</label>
              <input type="text" class="form-control" id="tour_name" required>
            </div>
            <div class="form-group">
              <label class="form-label">School Year *</label>
              <input type="text" class="form-control" id="school_year" placeholder="2024-2025" required>
            </div>
            <div class="form-group">
              <label class="form-label">Tournament Date</label>
              <input type="date" class="form-control" id="tour_date">
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('tournamentModal')">Cancel</button>
          <button class="btn btn-primary" onclick="$('#tournamentForm').requestSubmit()">
            ${isEdit ? 'Update' : 'Create'} Tournament
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Clean up and add modal
  const modalContainer = document.getElementById('modalContainer');
  if (modalContainer) {
    modalContainer.innerHTML = modalHTML;
  }
  
  if (isEdit) {
    loadTournamentData(id);
  }
}

async function loadTournamentData(id) {
  const data = await fetchAPI('tournaments');
  const tournament = data.find(t => t.tour_id == id);
  
  if (tournament) {
    $('#tour_name').value = tournament.tour_name || '';
    $('#school_year').value = tournament.school_year || '';
    $('#tour_date').value = tournament.tour_date || '';
  }
}

async function saveTournament(e, id) {
  e.preventDefault();
  
  const data = {
    tour_name: $('#tour_name').value,
    school_year: $('#school_year').value,
    tour_date: $('#tour_date').value
  };
  
  if (id) data.tour_id = id;
  
  const action = id ? 'update_tournament' : 'create_tournament';
  const result = await fetchAPI(action, data, 'POST');
  
  if (result && result.ok) {
    showToast(id ? '✅ Tournament updated!' : '✅ Tournament created!', 'success');
    closeModal('tournamentModal');
    
    // Trigger event for auto-refresh
    if (id) {
      DashboardEvents.trigger(EVENTS.TOURNAMENT_UPDATED, { tour_id: id, ...data });
    } else {
      DashboardEvents.trigger(EVENTS.TOURNAMENT_CREATED, { tour_id: result.tour_id, ...data });
    }
  }
}

async function toggleTournament(id, currentStatus) {
  const newStatus = currentStatus == 1 ? 0 : 1;
  const result = await fetchAPI('toggle_tournament', { tour_id: id, is_active: newStatus }, 'POST');
  
  if (result && result.ok) {
    DashboardEvents.trigger(EVENTS.TOURNAMENT_TOGGLED, { tour_id: id, is_active: newStatus });
  }
}

async function deleteTournament(id, name) {
  // Show confirmation modal
  const confirmHTML = `
    <div class="modal active" id="deleteTournamentModal">
      <div class="modal-content modal-sm">
        <div class="modal-header" style="background: #fee; border-bottom: 2px solid #ef4444;">
          <h3 style="color: #dc2626;">⚠️ Delete Tournament</h3>
          <button class="modal-close" onclick="closeModal('deleteTournamentModal')">×</button>
        </div>
        <div class="modal-body">
          <div style="padding: 20px; text-align: center;">
            <div style="font-size: 64px; margin-bottom: 16px;">🗑️</div>
            <h4 style="margin: 0 0 12px 0; color: #dc2626;">Are you sure you want to delete this tournament?</h4>
            <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 18px; font-weight: 600;">
              "${escapeHtml(name)}"
            </p>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; text-align: left; margin-bottom: 20px;">
              <div style="font-weight: 600; color: #92400e; margin-bottom: 8px;">⚠️ Warning:</div>
              <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 14px; line-height: 1.6;">
                <li>All teams registered to this tournament will be removed</li>
                <li>All athletes assigned to this tournament will be removed</li>
                <li>All matches and scores will be permanently deleted</li>
                <li>All standings and rankings will be lost</li>
                <li><strong>This action cannot be undone!</strong></li>
              </ul>
            </div>
            
            <p style="margin: 0; color: #6b7280; font-size: 13px;">
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input 
              type="text" 
              id="deleteConfirmInput" 
              class="form-control" 
              placeholder="Type DELETE here"
              style="margin-top: 8px; text-align: center; font-weight: 600; text-transform: uppercase;"
              autocomplete="off"
            >
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('deleteTournamentModal')">
            ❌ Cancel
          </button>
          <button class="btn btn-danger" onclick="confirmDeleteTournament(${id})" id="confirmDeleteBtn" disabled>
            🗑️ Delete Permanently
          </button>
        </div>
      </div>
    </div>
  `;
  
  $('#modalContainer').innerHTML = confirmHTML;
  
  // Enable delete button only when "DELETE" is typed
  $('#deleteConfirmInput').addEventListener('input', (e) => {
    const btn = $('#confirmDeleteBtn');
    if (e.target.value.toUpperCase() === 'DELETE') {
      btn.disabled = false;
      btn.style.opacity = '1';
    } else {
      btn.disabled = true;
      btn.style.opacity = '0.5';
    }
  });
  
  // Focus on input
  setTimeout(() => $('#deleteConfirmInput').focus(), 100);
}

async function confirmDeleteTournament(id) {
  try {
    const result = await fetchAPI('delete_tournament', { tour_id: id }, 'POST');
    
    if (result && result.ok) {
      closeModal('deleteTournamentModal');
      showToast('✅ Tournament deleted successfully', 'success');
      
      // Trigger event to reload tournaments
      DashboardEvents.trigger(EVENTS.TOURNAMENT_DELETED, { tour_id: id });
    } else {
      showToast('❌ Error: ' + (result?.error || 'Failed to delete tournament'), 'error');
    }
  } catch (error) {
    console.error('Error deleting tournament:', error);
    showToast('❌ Failed to delete tournament', 'error');
  }
}

function editTournament(id) {
  showTournamentModal(id);
}

// ==========================================
// TOURNAMENT DETAIL - VIEW TEAMS
// ==========================================
async function viewTournamentDetail(tourId) {
  currentContext.tour_id = tourId;
  
  const tournaments = await fetchAPI('tournaments');
  const tournament = tournaments.find(t => t.tour_id == tourId);
  
  const modalHTML = `
    <div class="modal active" id="tournamentDetailModal">
      <div class="modal-content" style="max-width: 900px;">
        <div class="modal-header">
          <h3>${escapeHtml(tournament.tour_name)} - Teams</h3>
          <button class="modal-close" onclick="closeModal('tournamentDetailModal')">×</button>
        </div>
        <div class="modal-body">
          <div style="display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="showAddTeamToTournamentModal(${tourId})">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
              </svg>
              Add Team to Tournament
            </button>
            <button class="btn btn-success" onclick="closeModal('tournamentDetailModal'); showUmpireAssignmentModal(${tourId})">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
              </svg>
              👨‍⚖️ Assign Umpires
            </button>
          </div>
          <div id="tournamentTeamsList">
            <div class="loading">Loading teams...</div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  $('#modalContainer').innerHTML = modalHTML;
  loadTournamentTeams(tourId);
}

// UPDATED loadTournamentTeams function - Replace the existing one in director.js

// FIXED loadTournamentTeams function - Replace in director.js

async function loadTournamentTeams(tourId) {
  let teams = await fetchAPI('get_tournament_teams', { tour_id: tourId });
  const container = $('#tournamentTeamsList');
  
  if (!teams || teams.length === 0) {
    container.innerHTML = '<div class="empty-state">No teams added yet. Click "Add Team to Tournament" to get started.</div>';
    return;
  }
  
  // Apply team filter if selected
  if (currentFilters.team) {
    teams = teams.filter(t => t.team_id == currentFilters.team);
    if (teams.length === 0) {
      container.innerHTML = '<div class="empty-state">No teams match the selected filter.</div>';
      return;
    }
  }
  
  // Fetch college info for each team
  const teamsWithColleges = await Promise.all(
    teams.map(async (team) => {
      try {
        const response = await fetchAPI('get_team_colleges', { 
          tour_id: tourId, 
          team_id: team.team_id 
        });
        
        // Handle different response formats
        let teamColleges = [];
        if (Array.isArray(response)) {
          teamColleges = response;
        } else if (response && response.colleges && Array.isArray(response.colleges)) {
          teamColleges = response.colleges;
        }
        
        // Get unique colleges
        const uniqueColleges = [];
        const seenCodes = new Set();
        
        teamColleges.forEach(tc => {
          if (tc && tc.college_code && !seenCodes.has(tc.college_code)) {
            seenCodes.add(tc.college_code);
            uniqueColleges.push(tc);
          }
        });
        
        return {
          ...team,
          colleges: uniqueColleges
        };
      } catch (error) {
        console.error('Error fetching colleges for team:', team.team_id, error);
        return {
          ...team,
          colleges: []
        };
      }
    })
  );
  
  container.innerHTML = `
    <div class="data-grid">
      ${teamsWithColleges.map(tt => `
        <div class="data-card">
          <div class="data-card-header">
            <div class="data-card-title">${escapeHtml(tt.team_name)}</div>
          </div>
          <div class="data-card-meta">
            🏅 ${tt.num_sports || 0} sport${tt.num_sports !== 1 ? 's' : ''}<br>
            👥 ${tt.num_athletes || 0} athlete${tt.num_athletes !== 1 ? 's' : ''}
            ${tt.colleges && tt.colleges.length > 0 ? `<br>🎓 ${tt.colleges.length} college${tt.colleges.length !== 1 ? 's' : ''}: ${tt.colleges.map(c => c.college_code).join(', ')}` : ''}
          </div>
          <div class="data-card-actions">
            <button class="btn btn-sm btn-info" onclick="showManageTeamCollegesModal(${tourId}, ${tt.team_id}, '${escapeHtml(tt.team_name).replace(/'/g, "\\'")}')">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M15.854 3.354a.5.5 0 1 0-.708-.708l-1.5 1.5a.5.5 0 0 0 0 .708l1.5 1.5a.5.5 0 0 0 .708-.708L14.707 5H8.5a.5.5 0 0 0 0 1h6.207l-1.147 1.146z"/>
                <path d="M12.854 7.854a.5.5 0 0 0-.708-.708l-2 2a.5.5 0 0 0 0 .708l2 2a.5.5 0 0 0 .708-.708L11.707 10H15.5a.5.5 0 0 0 0-1h-3.793l1.147-1.146z"/>
                <path d="M4 6V2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10H3.5A1.5 1.5 0 0 1 2 8.5v-1A1.5 1.5 0 0 1 3.5 6H4zm1 0h2v4H5V6zm7-4H6a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/>
              </svg>
              Colleges
            </button>
            <button class="btn btn-sm btn-primary" onclick="viewTeamSports(${tourId}, ${tt.team_id})">Manage Sports</button>
            <button class="btn btn-sm btn-danger" onclick="removeTeamFromTournament(${tourId}, ${tt.team_id})">Remove</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

async function showAddTeamToTournamentModal(tourId) {
  const teams = await fetchAPI('teams');
  
  const modalHTML = `
    <div class="modal active" id="addTeamModal">
      <div class="modal-content modal-sm">
        <div class="modal-header">
          <h3>Add Team to Tournament</h3>
          <button class="modal-close" onclick="closeModal('addTeamModal')">×</button>
        </div>
        <div class="modal-body">
          <form id="addTeamForm" onsubmit="addTeamToTournament(event, ${tourId})">
            <div class="form-group">
              <label class="form-label">Select Existing Team</label>
              <select class="form-control" id="select_team_id" required>
                <option value="">Choose a team...</option>
                ${teams.map(t => `<option value="${t.team_id}">${escapeHtml(t.team_name)}</option>`).join('')}
              </select>
            </div>
            
            <div style="text-align: center; margin: 15px 0;">
              <span style="color: #9ca3af;">— OR —</span>
            </div>
            
            <button type="button" class="btn btn-success" onclick="closeModal('addTeamModal'); showCreateTeamModal(${tourId})" style="width: 100%;">
              ➕ Create New Team
            </button>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('addTeamModal')">Cancel</button>
          <button class="btn btn-primary" onclick="$('#addTeamForm').requestSubmit()">Add Existing Team</button>
        </div>
      </div>
    </div>
  `;
  
  // ✅ FIX: Remove any existing modal first, then add to body
  closeModal('addTeamModal'); // Clean up any existing
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = modalHTML;
  document.body.appendChild(tempDiv.firstElementChild);
}
async function addTeamToTournament(e, tourId) {
  e.preventDefault();
  
  const teamId = $('#select_team_id').value;
  const result = await fetchAPI('add_team_to_tournament', { tour_id: tourId, team_id: teamId }, 'POST');
  
  if (result && result.ok) {
    closeModal('addTeamModal');
    showToast('✅ Team added to tournament!', 'success');
    
    // Reload the tournament teams list
    loadTournamentTeams(tourId);
    
    // Trigger event
    DashboardEvents.trigger(EVENTS.TEAM_ADDED_TO_TOURNAMENT, { tour_id: tourId, team_id: teamId });
  } else {
    showToast(result.error || 'Error adding team', 'error');
  }
}

async function removeTeamFromTournament(tourId, teamId) {
  if (!confirm('Remove this team from the tournament?')) return;
  
  const result = await fetchAPI('remove_team_from_tournament', { tour_id: tourId, team_id: teamId }, 'POST');
  
  if (result && result.ok) {
    loadTournamentTeams(tourId);
    showToast('✅ Team removed from tournament', 'success');
    DashboardEvents.trigger(EVENTS.TEAM_REMOVED_FROM_TOURNAMENT, { tour_id: tourId, team_id: teamId });
  }
}

// ==========================================
// TEAM SPORTS MANAGEMENT
// ==========================================
async function viewTeamSports(tourId, teamId) {
  currentContext.tour_id = tourId;
  currentContext.team_id = teamId;
  
  const teams = await fetchAPI('get_tournament_teams', { tour_id: tourId });
  const team = teams.find(t => t.team_id == teamId);
  
  const modalHTML = `
    <div class="modal active" id="teamSportsModal">
      <div class="modal-content" style="max-width: 900px;">
        <div class="modal-header">
          <h3>${escapeHtml(team.team_name)} - Sports</h3>
          <button class="modal-close" onclick="closeModal('teamSportsModal'); viewTournamentDetail(${tourId})">×</button>
        </div>
        <div class="modal-body">
          <div style="margin-bottom: 12px;">
            <button class="btn btn-primary" onclick="showAddSportToTeamModal(${tourId}, ${teamId})">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
              </svg>
              Add Sport
            </button>
          </div>
          <div id="teamSportsList">
            <div class="loading">Loading sports...</div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  closeModal('tournamentDetailModal');
  $('#modalContainer').innerHTML = modalHTML;
  loadTeamSports(tourId, teamId);
}

async function loadTeamSports(tourId, teamId) {
  let sports = await fetchAPI('get_team_sports', { tour_id: tourId, team_id: teamId });
  const container = $('#teamSportsList');
  
  if (!sports || sports.length === 0) {
    container.innerHTML = '<div class="empty-state">No sports added yet. Click "Add Sport" to get started.</div>';
    return;
  }
  
  // Apply sport filter if selected
  if (currentFilters.sport) {
    sports = sports.filter(s => s.sports_id == currentFilters.sport);
    if (sports.length === 0) {
      container.innerHTML = '<div class="empty-state">No sports match the selected filter.</div>';
      return;
    }
  }
  
  container.innerHTML = `
    <div class="data-grid">
      ${sports.map(st => `
        <div class="data-card">
          <div class="data-card-header">
            <div class="data-card-title">${escapeHtml(st.sports_name)}</div>
          </div>
          <div class="data-card-meta">
            👨‍🏫 Coach: ${escapeHtml(st.coach_name || 'Not assigned')}<br>
            🎯 Manager: ${escapeHtml(st.tournament_manager_name || 'Not assigned')}<br>
            👥 ${st.num_athletes || 0} athlete${st.num_athletes !== 1 ? 's' : ''}
          </div>
          <div class="data-card-actions">
            <button class="btn btn-sm btn-primary" onclick="viewSportAthletes(${tourId}, ${teamId}, ${st.sports_id})">Manage Athletes</button>
            <button class="btn btn-sm btn-secondary" onclick="assignStaffToSport(${tourId}, ${teamId}, ${st.sports_id})">Assign Staff</button>
            <button class="btn btn-sm btn-danger" onclick="removeSportFromTeam(${tourId}, ${teamId}, ${st.sports_id})">Remove</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

async function showAddSportToTeamModal(tourId, teamId) {
  const sports = await fetchAPI('sports');
  
  const modalHTML = `
    <div class="modal active" id="addSportModal">
      <div class="modal-content modal-sm">
        <div class="modal-header">
          <h3>Add Sport to Team</h3>
          <button class="modal-close" onclick="closeModal('addSportModal')">×</button>
        </div>
        <div class="modal-body">
          <form id="addSportForm" onsubmit="addSportToTeam(event, ${tourId}, ${teamId})">
            <div class="form-group">
              <label class="form-label">Select Sport *</label>
              <select class="form-control" id="select_sport_id" required>
                <option value="">Choose a sport...</option>
                ${sports.map(s => `<option value="${s.sports_id}">${escapeHtml(s.sports_name)}</option>`).join('')}
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('addSportModal')">Cancel</button>
          <button class="btn btn-primary" onclick="$('#addSportForm').requestSubmit()">Add Sport</button>
        </div>
      </div>
    </div>
  `;
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = modalHTML;
  document.body.appendChild(tempDiv.firstElementChild);
}

async function addSportToTeam(e, tourId, teamId) {
  e.preventDefault();
  
  const sportsId = $('#select_sport_id').value;
  const result = await fetchAPI('add_sport_to_team', { tour_id: tourId, team_id: teamId, sports_id: sportsId }, 'POST');
  
  if (result && result.ok) {
    closeModal('addSportModal');
    loadTeamSports(tourId, teamId);
    showToast('✅ Sport added to team!', 'success');
    DashboardEvents.trigger(EVENTS.SPORT_ADDED_TO_TEAM, { tour_id: tourId, team_id: teamId, sports_id: sportsId });
  } else {
    showToast(result.error || 'Error adding sport', 'error');
  }
}

async function removeSportFromTeam(tourId, teamId, sportsId) {
  if (!confirm('Remove this sport from the team?')) return;
  
  const result = await fetchAPI('remove_sport_from_team', { tour_id: tourId, team_id: teamId, sports_id: sportsId }, 'POST');
  
  if (result && result.ok) {
    loadTeamSports(tourId, teamId);
    showToast('✅ Sport removed from team', 'success');
    DashboardEvents.trigger(EVENTS.SPORT_REMOVED_FROM_TEAM, { tour_id: tourId, team_id: teamId, sports_id: sportsId });
  }
}

async function assignStaffToSport(tourId, teamId, sportsId) {
  const coaches = await fetchAPI('staff', { role: 'coach' });
  const managersRaw = await fetchAPI('staff', { role: 'tournament_manager' });
  // Filter to ensure only Tournament Managers appear (frontend safety check)
  const managers = managersRaw.filter(m => m.role_type === 'tournament_manager');
  const trainors = await fetchAPI('staff', { role: 'trainor' });
  
  const sports = await fetchAPI('get_team_sports', { tour_id: tourId, team_id: teamId });
  const sport = sports.find(s => s.sports_id == sportsId);
  
  const modalHTML = `
    <div class="modal active" id="assignStaffModal">
      <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
          <h3>👥 Assign Staff - ${escapeHtml(sport.sports_name)}</h3>
          <button class="modal-close" onclick="closeModal('assignStaffModal')">×</button>
        </div>
        <form id="assignStaffForm" onsubmit="saveStaffAssignmentWithAthletes(event, ${tourId}, ${teamId}, ${sportsId})">
          <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
            
            <!-- Head Coach Selection -->
            <h4 class="modal-section-title">🎯 Primary Staff</h4>
            
            <div class="form-group">
              <label class="form-label">Head Coach *</label>
              <select class="form-control" id="coach_id" onchange="previewCoachAthletes(${tourId}, ${teamId}, ${sportsId})">
                <option value="">Select Head Coach</option>
                ${coaches.map(c => `<option value="${c.person_id}" ${sport.coach_id == c.person_id ? 'selected' : ''}>${escapeHtml(c.full_name)}</option>`).join('')}
              </select>
            </div>
            
            <!-- Auto-Assign Athletes Checkbox (UPDATED) -->
            <div id="autoAssignContainer" style="display: none; margin-top: 12px;">
              <label style="display: flex; align-items: start; gap: 12px; cursor: pointer; padding: 14px; background: #f0fdf4; border-radius: 8px; border: 2px solid #86efac;">
                <input type="checkbox" id="auto_assign_athletes" name="auto_assign_athletes" style="width: 20px; height: 20px; cursor: pointer; margin-top: 2px; flex-shrink: 0;">
                <div style="flex: 1;">
                  <div style="font-weight: 600; color: #065f46; margin-bottom: 4px;">
                    ⚡ Auto-assign coach's athletes (Optional)
                  </div>
                  <div id="athletePreviewText" style="font-size: 12px; color: #047857; line-height: 1.5;">
                    Loading athlete information...
                  </div>
                  <div style="font-size: 11px; color: #059669; margin-top: 6px; font-style: italic;">
                    💡 Uncheck this if you want to manually select athletes instead
                  </div>
                </div>
              </label>
            </div>
            
            <!-- Detailed Preview -->
            <div id="athletePreviewDetails" style="display: none; margin-top: 12px;"></div>
            
            <div class="form-group">
              <label class="form-label">Assistant Coach</label>
              <select class="form-control" id="asst_coach_id">
                <option value="">Select Assistant Coach</option>
                ${coaches.map(c => `<option value="${c.person_id}" ${sport.asst_coach_id == c.person_id ? 'selected' : ''}>${escapeHtml(c.full_name)}</option>`).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Tournament Manager</label>
              <select class="form-control" id="tournament_manager_id">
                <option value="">Select Tournament Manager</option>
                ${managers.map(m => `<option value="${m.person_id}" ${sport.tournament_manager_id == m.person_id ? 'selected' : ''}>${escapeHtml(m.full_name)}</option>`).join('')}
              </select>
            </div>
            
            <!-- Trainors -->
            <h4 class="modal-section-title">🏋️ Training Staff (Optional)</h4>
            
            <div class="form-group">
              <label class="form-label">Trainor 1</label>
              <select class="form-control" id="trainor1_id">
                <option value="">Select Trainor</option>
                ${trainors.map(t => `<option value="${t.person_id}" ${sport.trainor1_id == t.person_id ? 'selected' : ''}>${escapeHtml(t.full_name)}</option>`).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Trainor 2</label>
              <select class="form-control" id="trainor2_id">
                <option value="">Select Trainor</option>
                ${trainors.map(t => `<option value="${t.person_id}" ${sport.trainor2_id == t.person_id ? 'selected' : ''}>${escapeHtml(t.full_name)}</option>`).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Trainor 3</label>
              <select class="form-control" id="trainor3_id">
                <option value="">Select Trainor</option>
                ${trainors.map(t => `<option value="${t.person_id}" ${sport.trainor3_id == t.person_id ? 'selected' : ''}>${escapeHtml(t.full_name)}</option>`).join('')}
              </select>
            </div>
            
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal('assignStaffModal')">Cancel</button>
            <button type="submit" class="btn btn-primary" id="saveStaffBtn">
              💾 Save Staff Assignments
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = modalHTML;
  document.body.appendChild(tempDiv.firstElementChild);
  
  // Trigger preview if coach is already selected
  if (sport.coach_id) {
    setTimeout(() => previewCoachAthletes(tourId, teamId, sportsId), 100);
  }
}

// Preview coach's athletes
// Preview coach's athletes
async function previewCoachAthletes(tourId, teamId, sportsId) {
  const coachId = document.getElementById('coach_id').value;
  const container = document.getElementById('autoAssignContainer');
  const detailsContainer = document.getElementById('athletePreviewDetails');
  const previewText = document.getElementById('athletePreviewText');
  const checkbox = document.getElementById('auto_assign_athletes');
  
  if (!coachId) {
    container.style.display = 'none';
    detailsContainer.style.display = 'none';
    return;
  }
  
  container.style.display = 'block';
  previewText.innerHTML = '<span style="opacity: 0.7;">⏳ Loading athletes...</span>';
  
  // ✅ Uncheck by default - user must opt-in
  if (checkbox) {
    checkbox.checked = false;
  }
  
  try {
    const result = await fetchAPI('preview_coach_athletes', { 
      coach_id: coachId, 
      sports_id: sportsId,
      tour_id: tourId,
      team_id: teamId
    });
    
    if (result && result.ok !== false) {
      const total = result.total || 0;
      const newAthletes = result.new_athletes || 0;
      const alreadyAdded = total - newAthletes;
      
      if (total === 0) {
        previewText.innerHTML = '🔍 This coach has no athletes in this sport from previous tournaments.';
        detailsContainer.style.display = 'none';
        container.style.border = '2px solid #e5e7eb';
        container.style.background = '#f9fafb';
      } else {
        previewText.innerHTML = `
          Found <strong>${total}</strong> athlete${total !== 1 ? 's' : ''} from previous tournaments
          (<strong>${newAthletes}</strong> new, ${alreadyAdded} already added)
          ${newAthletes > 0 ? '<br><small>Check the box above to add them automatically</small>' : ''}
        `;
        
        // ✅ Update container styling based on availability
        if (newAthletes > 0) {
          container.style.border = '2px solid #86efac';
          container.style.background = '#f0fdf4';
        } else {
          container.style.border = '2px solid #fbbf24';
          container.style.background = '#fef3c7';
        }
        
        if (newAthletes > 0) {
          // Show detailed list
          const athletesList = result.athletes
            .filter(a => !a.already_added)
            .map(a => `
              <div style="display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #e5e7eb;">
                <div>
                  <strong>${escapeHtml(a.athlete_name)}</strong>
                  <div style="font-size: 11px; color: #6b7280;">
                    ${escapeHtml(a.college_code || 'N/A')} - ${escapeHtml(a.course || 'N/A')}
                  </div>
                </div>
                <div style="font-size: 11px; color: #6b7280; text-align: right;">
                  ${a.tournaments_together} tournament${a.tournaments_together !== 1 ? 's' : ''} together
                  <div>Last: ${escapeHtml(a.last_together || 'N/A')}</div>
                </div>
              </div>
            `).join('');
          
          detailsContainer.innerHTML = `
            <details style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
              <summary style="cursor: pointer; font-weight: 600; color: #111827; font-size: 13px; user-select: none;">
                👥 Athletes available for auto-assignment (${newAthletes})
              </summary>
              <div style="margin-top: 12px; max-height: 300px; overflow-y: auto;">
                ${athletesList}
              </div>
            </details>
          `;
          detailsContainer.style.display = 'block';
        } else {
          detailsContainer.style.display = 'none';
        }
      }
    }
  } catch (error) {
    console.error('Error previewing athletes:', error);
    previewText.innerHTML = '⚠️ Could not load athlete information';
    detailsContainer.style.display = 'none';
  }
}

// Save staff with optional athlete auto-assignment
async function saveStaffAssignmentWithAthletes(e, tourId, teamId, sportsId) {
  e.preventDefault();
  
  const saveBtn = document.getElementById('saveStaffBtn');
  const originalText = saveBtn.innerHTML;
  saveBtn.disabled = true;
  saveBtn.innerHTML = '⏳ Saving...';
  
  const data = {
    tour_id: tourId,
    team_id: teamId,
    sports_id: sportsId,
    coach_id: $('#coach_id').value || null,
    asst_coach_id: $('#asst_coach_id').value || null,
    tournament_manager_id: $('#tournament_manager_id').value || null,
    trainor1_id: $('#trainor1_id').value || null,
    trainor2_id: $('#trainor2_id').value || null,
    trainor3_id: $('#trainor3_id').value || null,
    auto_assign_athletes: $('#auto_assign_athletes')?.checked || false
  };
  
  try {
    const result = await fetchAPI('assign_staff_with_athletes', data, 'POST');
    
    if (result && result.ok) {
      closeModal('assignStaffModal');
      loadTeamSports(tourId, teamId);
      
      // ✅ Updated success messages
      if (result.athletes_added > 0) {
        showToast(
          `✅ Staff assigned! Automatically added ${result.athletes_added} athlete${result.athletes_added !== 1 ? 's' : ''} from previous tournaments`,
          'success'
        );
        
        // Show detailed notification
        if (result.added_athlete_names && result.added_athlete_names.length > 0) {
          setTimeout(() => {
            const names = result.added_athlete_names.slice(0, 5).join(', ');
            const more = result.added_athlete_names.length > 5 ? ` and ${result.added_athlete_names.length - 5} more` : '';
            showToast(`👥 Added: ${names}${more}`, 'info');
          }, 1500);
        }
      } else if (data.auto_assign_athletes && data.coach_id) {
        // Checkbox was checked but no athletes were added
        showToast('✅ Staff assigned! No new athletes were available to add', 'success');
      } else {
        // Checkbox was not checked
        showToast('✅ Staff assignments updated!', 'success');
      }
      
      DashboardEvents.trigger(EVENTS.STAFF_ASSIGNED, data);
    } else {
      showToast('❌ Error: ' + (result?.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error saving staff:', error);
    showToast('❌ Error saving staff assignments', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;
  }
}

// ==========================================
// BULK IMPORT FROM PREVIOUS TOURNAMENT
// Add this button to the sport athletes modal
// ==========================================

function showImportAthletesModal(tourId, teamId, sportsId) {
  // First, get list of previous tournaments with this sport
  fetchAPI('tournaments').then(tournaments => {
    const modal = `
      <div class="modal active" id="importAthletesModal" style="z-index: 10002;">
        <div class="modal-content">
          <div class="modal-header">
            <h3>📋 Import Athletes from Previous Tournament</h3>
            <button class="modal-close" onclick="closeModal('importAthletesModal')">×</button>
          </div>
          <form onsubmit="executeImportAthletes(event, ${tourId}, ${teamId}, ${sportsId})" id="importForm">
            <div class="modal-body">
              <p style="color: #6b7280; font-size: 13px; margin-bottom: 16px;">
                Quickly add all athletes from a previous tournament/team combination.
              </p>
              
              <div class="form-group">
                <label class="form-label">Select Source Tournament *</label>
                <select class="form-control" name="source_tour_id" required onchange="loadSourceTeams(this.value, ${sportsId})">
                  <option value="">Choose a tournament...</option>
                  ${tournaments.filter(t => t.tour_id != tourId).map(t => 
                    `<option value="${t.tour_id}">${escapeHtml(t.tour_name)} (${t.school_year})</option>`
                  ).join('')}
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Select Source Team *</label>
                <select class="form-control" name="source_team_id" id="sourceTeamSelect" required disabled>
                  <option value="">Select tournament first...</option>
                </select>
              </div>
              
              <input type="hidden" name="source_sports_id" value="${sportsId}">
              
              <div style="padding: 12px; background: #fef3c7; border-radius: 6px; margin-top: 16px;">
                <strong style="font-size: 12px; color: #92400e;">⚠️ Note:</strong>
                <p style="font-size: 12px; color: #78350f; margin: 4px 0 0 0;">
                  This will import all athletes from the selected team in the same sport. Athletes already in your current roster will be skipped.
                </p>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeModal('importAthletesModal')">Cancel</button>
              <button type="submit" class="btn btn-primary">📋 Import Athletes</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
const tempDiv = document.createElement('div');
tempDiv.innerHTML = modal;  // ✅ Use 'modal' instead of 'modalHTML'
document.body.appendChild(tempDiv.firstElementChild);
  });
}

async function loadSourceTeams(sourceTourId, sportsId) {
  const select = document.getElementById('sourceTeamSelect');
  
  if (!sourceTourId) {
    select.disabled = true;
    select.innerHTML = '<option value="">Select tournament first...</option>';
    return;
  }
  
  select.disabled = true;
  select.innerHTML = '<option value="">Loading teams...</option>';
  
  try {
    // Get teams that have this sport in the source tournament
    const teams = await fetchAPI('get_tournament_teams', { tour_id: sourceTourId });
    
    // Filter teams that have the specific sport
    const teamsWithSport = [];
    for (const team of teams) {
      const sports = await fetchAPI('get_team_sports', { 
        tour_id: sourceTourId, 
        team_id: team.team_id 
      });
      if (sports.some(s => s.sports_id == sportsId)) {
        teamsWithSport.push(team);
      }
    }
    
    if (teamsWithSport.length === 0) {
      select.innerHTML = '<option value="">No teams found with this sport</option>';
      select.disabled = true;
    } else {
      select.innerHTML = '<option value="">Choose a team...</option>' +
        teamsWithSport.map(t => 
          `<option value="${t.team_id}">${escapeHtml(t.team_name)} (${t.num_athletes || 0} athletes)</option>`
        ).join('');
      select.disabled = false;
    }
  } catch (error) {
    console.error('Error loading teams:', error);
    select.innerHTML = '<option value="">Error loading teams</option>';
    select.disabled = true;
  }
}

async function executeImportAthletes(event, targetTourId, targetTeamId, targetSportsId) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  
  const data = {
    source_tour_id: parseInt(formData.get('source_tour_id')),
    source_team_id: parseInt(formData.get('source_team_id')),
    source_sports_id: parseInt(formData.get('source_sports_id')),
    target_tour_id: targetTourId,
    target_team_id: targetTeamId,
    target_sports_id: targetSportsId
  };
  
  try {
    const result = await fetchAPI('import_athletes_from_tournament', data, 'POST');
    
    if (result && result.ok) {
      closeModal('importAthletesModal');
      await loadSportAthletes(targetTourId, targetTeamId, targetSportsId);
      showToast(`✅ ${result.message}`, 'success');
    } else {
      showToast('❌ ' + (result?.error || 'Error importing athletes'), 'error');
    }
  } catch (error) {
    console.error('Error importing athletes:', error);
    showToast('❌ Error importing athletes', 'error');
  }
}


async function saveStaffAssignment(e, tourId, teamId, sportsId) {
  e.preventDefault();
  
  const data = {
    tour_id: tourId,
    team_id: teamId,
    sports_id: sportsId,
    coach_id: $('#coach_id').value || null,
    asst_coach_id: $('#asst_coach_id').value || null,
    tournament_manager_id: $('#tournament_manager_id').value || null,
    trainor1_id: $('#trainor1_id').value || null,
    trainor2_id: $('#trainor2_id').value || null,
    trainor3_id: $('#trainor3_id').value || null
  };
  
  const result = await fetchAPI('update_sport_staff', data, 'POST');
  
  if (result && result.ok) {
    closeModal('assignStaffModal');
    loadTeamSports(tourId, teamId);
    showToast('✅ Staff assignments updated!', 'success');
    DashboardEvents.trigger(EVENTS.STAFF_ASSIGNED, data);
  } else {
    showToast(result.error || 'Error updating staff', 'error');
  }
}

// ==========================================
// SPORT ATHLETES MANAGEMENT
// ==========================================
async function viewSportAthletes(tourId, teamId, sportsId) {
  currentContext.tour_id = tourId;
  currentContext.team_id = teamId;
  currentContext.sports_id = sportsId;
  
  const sports = await fetchAPI('get_team_sports', { tour_id: tourId, team_id: teamId });
  const sport = sports.find(s => s.sports_id == sportsId);
  
  const modalHTML = `
    <div class="modal active" id="sportAthletesModal">
      <div class="modal-content" style="max-width: 900px;">
        <div class="modal-header">
          <h3>${escapeHtml(sport.sports_name)} - Athletes</h3>
          <button class="modal-close" onclick="closeModal('sportAthletesModal'); viewTeamSports(${tourId}, ${teamId})">×</button>
        </div>
        <div class="modal-body">
          <div style="margin-bottom: 12px; display: flex; gap: 8px;">
            <button class="btn btn-primary" onclick="showAddExistingAthleteModal(${tourId}, ${teamId}, ${sportsId})">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z"/>
              </svg>
              Add Existing Athlete
            </button>
            <button class="btn btn-success" onclick="showAthleteModal(null, ${tourId}, ${teamId}, ${sportsId})">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
              </svg>
              Create New Athlete
            </button>
            <button class="btn btn-success" onclick="showImportAthletesModal(${tourId}, ${teamId}, ${sportsId})">
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
  </svg>
  Import from Previous
</button>
          </div>
          <div id="sportAthletesList">
            <div class="loading">Loading athletes...</div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  closeModal('teamSportsModal');
  $('#modalContainer').innerHTML = modalHTML;
  loadSportAthletes(tourId, teamId, sportsId);
}

// ==========================================
// UPDATED: Add Existing Athlete Modal with College Filtering
// Replace the existing showAddExistingAthleteModal function (around line 1563)
// ==========================================

// ==========================================
// UPDATED: Add Existing Athlete Modal with College Filtering + DEDUPLICATION
// Replace the existing showAddExistingAthleteModal function (around line 1563)
// ==========================================

async function showAddExistingAthleteModal(tourId, teamId, sportsId) {
  try {
    // Fetch all athletes and team colleges in parallel
    const [athletes, collegeResponse] = await Promise.all([
      fetchAPI('athletes'),
      fetchAPI('get_team_colleges', { tour_id: tourId, team_id: teamId })
    ]);
    
    if (!athletes || athletes.length === 0) {
      showToast('⚠️ No athletes found in the system', 'warning');
      return;
    }
    
    // Extract colleges array from response
    let teamColleges = [];
    if (Array.isArray(collegeResponse)) {
      teamColleges = collegeResponse;
    } else if (collegeResponse && collegeResponse.colleges) {
      teamColleges = collegeResponse.colleges;
    }
    
    // ==========================================
    // DEDUPLICATION: Remove duplicate colleges
    // ==========================================
    const uniqueColleges = [];
    const seenCodes = new Set();
    
    teamColleges.forEach(college => {
      const code = college.college_code;
      if (!seenCodes.has(code)) {
        seenCodes.add(code);
        uniqueColleges.push(college);
      }
    });
    
    console.log('📊 College deduplication:', {
      original: teamColleges.length,
      unique: uniqueColleges.length,
      colleges: uniqueColleges
    });
    
    // Store team colleges in a global variable for validation
    window.currentTeamCollegeCodes = uniqueColleges.map(c => c.college_code);
    
    const modalHTML = `
      <div class="modal active" id="addExistingAthleteModal" style="z-index: 10000;">
        <div class="modal-content modal-sm">
          <div class="modal-header">
            <h3>👥 Add Existing Athlete</h3>
            <button class="modal-close" onclick="closeModal('addExistingAthleteModal')">×</button>
          </div>
          <form onsubmit="submitAddExistingAthlete(event, ${tourId}, ${teamId}, ${sportsId})" id="addExistingAthleteForm">
            <div class="modal-body">
              <p style="color: var(--text-muted); margin-bottom: 16px; font-size: 13px;">
                Select an athlete from the list below to add to this sport.
              </p>
              
              ${uniqueColleges.length > 0 ? `
                <div class="form-group">
                  <label class="form-label">Filter by College (Optional)</label>
                  <select class="form-control" id="collegeFilter" onchange="filterAthletesByCollege()">
                    <option value="">All Colleges</option>
                    ${uniqueColleges.map(college => `
                      <option value="${escapeHtml(college.college_code)}">
                        ${escapeHtml(college.college_name)} (${escapeHtml(college.college_code)})
                      </option>
                    `).join('')}
                  </select>
                  <small style="color: #6b7280; font-size: 11px; margin-top: 4px; display: block;">
                    💡 Filter athletes by their college affiliation
                  </small>
                </div>
                
                <div style="margin: 12px 0; padding: 10px; background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; font-size: 12px; color: #92400e;">
                  <strong>⚠️ Note:</strong> Only athletes from assigned colleges (${uniqueColleges.map(c => c.college_code).join(', ')}) can be added to this team.
                </div>
              ` : ''}
              
              <div class="form-group">
                <label class="form-label">Select Athlete *</label>
                <select class="form-control" name="person_id" id="athleteSelect" required style="max-height: 300px;">
                  <option value="">Choose an athlete...</option>
                  ${athletes.map(a => `
                    <option value="${a.person_id}" data-college="${escapeHtml(a.college_code || '')}">
                      ${escapeHtml(a.athlete_name)} - ${escapeHtml(a.college_code || 'N/A')} - ${escapeHtml(a.course || 'N/A')}
                    </option>
                  `).join('')}
                </select>
                <small style="color: #6b7280; font-size: 11px; margin-top: 4px; display: block;" id="athleteCountText">
                  📋 Showing all ${athletes.length} registered athlete(s)
                </small>
              </div>
              
              <div class="form-group">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 12px; background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px;">
                  <input type="checkbox" name="is_captain" value="1" style="width: 18px; height: 18px; cursor: pointer;">
                  <span style="font-weight: 600; color: #92400e;">⭐ Designate as Team Captain</span>
                </label>
              </div>
            </div>
            
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeModal('addExistingAthleteModal')">Cancel</button>
              <button type="submit" class="btn btn-primary">Add Athlete</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = modalHTML;
    document.body.appendChild(tempDiv.firstElementChild);
    
  } catch (error) {
    console.error('Error loading athletes:', error);
    showToast('❌ Error loading athletes list', 'error');
  }
}

async function submitAddExistingAthlete(event, tourId, teamId, sportsId) {
  event.preventDefault();
  
  const form = event.target;
  const personId = form.person_id.value;
  const isCaptain = form.is_captain.checked ? 1 : 0;
  
  if (!personId) {
    showToast('❌ Please select an athlete', 'error');
    return;
  }
  
  // ==========================================
  // COLLEGE VALIDATION
  // ==========================================
  
  // Get the selected athlete's college code
  const selectedOption = form.person_id.options[form.person_id.selectedIndex];
  const athleteCollege = selectedOption.getAttribute('data-college') || '';
  
  // Check if team has assigned colleges
  if (window.currentTeamCollegeCodes && window.currentTeamCollegeCodes.length > 0) {
    // Athlete must have a college
    if (!athleteCollege) {
      showToast('❌ This athlete has no college assigned. Only athletes from team colleges can be added.', 'error');
      return;
    }
    
    // Athlete's college must be in the team's college list
    if (!window.currentTeamCollegeCodes.includes(athleteCollege)) {
      const allowedColleges = window.currentTeamCollegeCodes.join(', ');
      showToast(`❌ This athlete is from college "${athleteCollege}" which is not assigned to this team. Allowed colleges: ${allowedColleges}`, 'error');
      return;
    }
    
    console.log('✅ College validation passed:', {
      athleteCollege: athleteCollege,
      allowedColleges: window.currentTeamCollegeCodes
    });
  }
  
  // ==========================================
  // Proceed with adding the athlete
  // ==========================================
  
  console.log('🔄 Adding existing athlete:', { personId, tourId, teamId, sportsId, isCaptain });
  
  try {
    const result = await fetchAPI('add_existing_athlete', {
      person_id: parseInt(personId),
      tour_id: parseInt(tourId),
      team_id: parseInt(teamId),
      sports_id: parseInt(sportsId),
      is_captain: isCaptain
    }, 'POST');
    
    console.log('📥 Server response:', result);
    
    if (result && result.ok !== false) {
      closeModal('addExistingAthleteModal');
      
      // Clear the team colleges cache
      window.currentTeamCollegeCodes = null;
      
      // Reload the athletes list
      const sportAthletesModal = document.getElementById('sportAthletesModal');
      if (sportAthletesModal) {
        await loadSportAthletes(tourId, teamId, sportsId);
      }
      
      showToast('✅ ' + (result.message || 'Athlete added successfully'), 'success');
      
      // Trigger event
      DashboardEvents.trigger(EVENTS.ATHLETE_ADDED, {
        person_id: personId,
        tour_id: tourId,
        team_id: teamId,
        sports_id: sportsId
      });
    } else {
      showToast('❌ ' + (result?.error || 'Error adding athlete'), 'error');
    }
  } catch (error) {
    console.error('Error adding athlete:', error);
    showToast('❌ Error adding athlete: ' + error.message, 'error');
  }
}

// ==========================================
// UPDATED v3: Filter Athletes by College (with visual indicators)
// Replace the existing filterAthletesByCollege function
// ==========================================

function filterAthletesByCollege() {
  const collegeFilter = document.getElementById('collegeFilter');
  const athleteSelect = document.getElementById('athleteSelect');
  const athleteCountText = document.getElementById('athleteCountText');
  
  if (!collegeFilter || !athleteSelect) return;
  
  const selectedCollege = collegeFilter.value;
  const allOptions = athleteSelect.querySelectorAll('option');
  
  let visibleCount = 0;
  let restrictedCount = 0;
  
  allOptions.forEach(option => {
    if (option.value === '') {
      // Keep the placeholder option always visible
      option.style.display = '';
      return;
    }
    
    const athleteCollege = option.getAttribute('data-college') || '';
    
    // Check if athlete's college is allowed
    const isCollegeAllowed = !window.currentTeamCollegeCodes || 
                            window.currentTeamCollegeCodes.length === 0 || 
                            window.currentTeamCollegeCodes.includes(athleteCollege);
    
    // Filter by selected college
    if (selectedCollege === '' || athleteCollege === selectedCollege) {
      option.style.display = '';
      visibleCount++;
      
      // Add visual indicator for restricted athletes
      if (!isCollegeAllowed) {
        option.style.color = '#9ca3af';
        option.style.fontStyle = 'italic';
        restrictedCount++;
      } else {
        option.style.color = '';
        option.style.fontStyle = '';
      }
    } else {
      option.style.display = 'none';
    }
  });
  
  // Update the count text
  if (selectedCollege === '') {
    athleteCountText.innerHTML = `📋 Showing all ${visibleCount} registered athlete(s)`;
    if (restrictedCount > 0 && window.currentTeamCollegeCodes && window.currentTeamCollegeCodes.length > 0) {
      athleteCountText.innerHTML += `<br><span style="color: #ef4444; font-weight: 600;">⚠️ ${restrictedCount} athlete(s) from non-assigned colleges will be blocked</span>`;
    }
  } else {
    const collegeName = collegeFilter.options[collegeFilter.selectedIndex].text;
    athleteCountText.textContent = `📋 Showing ${visibleCount} athlete(s) from ${collegeName}`;
  }
  
  // Reset the athlete selection when filter changes
  athleteSelect.value = '';
  
  // Show info message if no athletes found for selected college
  if (visibleCount === 0 && selectedCollege !== '') {
    const collegeName = collegeFilter.options[collegeFilter.selectedIndex].text;
    showToast(`ℹ️ No athletes found from ${collegeName}`, 'info');
  }
}

async function loadSportAthletes(tourId, teamId, sportsId) {
  const athletes = await fetchAPI('get_sport_athletes', { tour_id: tourId, team_id: teamId, sports_id: sportsId });
  const container = $('#sportAthletesList');
  
  if (!athletes || athletes.length === 0) {
    container.innerHTML = '<div class="empty-state">No athletes added yet. Click "Add Athlete" to get started.</div>';
    return;
  }
  
  container.innerHTML = `
    <div style="margin-bottom: 12px; display: flex; gap: 8px; align-items: center; padding: 10px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; font-weight: 600;">
        <input type="checkbox" id="selectAllAthletes" onchange="toggleSelectAllAthletes()" style="width: 18px; height: 18px; cursor: pointer;">
        <span>Select All</span>
      </label>
      <div style="flex: 1;"></div>
      <div id="bulkActionsContainer" style="display: none; gap: 8px;">
        <span id="selectedCount" style="color: #6b7280; font-size: 13px; font-weight: 600;"></span>
        <button class="btn btn-sm btn-danger" onclick="bulkRemoveAthletes(${tourId}, ${teamId}, ${sportsId})">
          🗑️ Remove Selected
        </button>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th style="width: 40px;">
            <input type="checkbox" style="width: 18px; height: 18px; cursor: pointer; opacity: 0; pointer-events: none;">
          </th>
          <th>Name</th>
          <th>Role</th>
          <th>College</th>
          <th>Course</th>
          <th>Physical</th>
          <th>Scholarship</th>
          <th>Captain</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${athletes.map(a => `
          <tr>
            <td>
              <input type="checkbox" class="athlete-checkbox" data-athlete-id="${a.team_ath_id}" onchange="updateBulkActions()" style="width: 18px; height: 18px; cursor: pointer;">
            </td>
            <td><strong>${escapeHtml(a.full_name)}</strong></td>
            <td>
              <span style="display: inline-block; padding: 3px 8px; background: #dbeafe; color: #1e40af; border-radius: 6px; font-size: 11px; font-weight: 600;">
                ${escapeHtml(a.role_type || 'athlete')}
              </span>
            </td>
            <td>${escapeHtml(a.college_code || 'N/A')}</td>
            <td>${escapeHtml(a.course || 'N/A')}</td>
            <td>
              ${a.height ? `📏 ${a.height}cm` : ''}
              ${a.weight ? ` ⚖️ ${a.weight}kg` : ''}
              ${!a.height && !a.weight ? 'N/A' : ''}
            </td>
            <td>${a.scholarship_name ? `🎓 ${escapeHtml(a.scholarship_name)}` : '-'}</td>
            <td>${a.is_captain ? '⭐ Captain' : ''}</td>
            <td>
              <button class="btn btn-sm btn-secondary" onclick="editAthlete(${a.person_id}, ${a.team_ath_id}, ${tourId}, ${teamId}, ${sportsId})">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="removeAthleteFromSport(${a.team_ath_id}, ${tourId}, ${teamId}, ${sportsId})">Remove</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function toggleSelectAllAthletes() {
  const selectAll = document.getElementById('selectAllAthletes');
  const checkboxes = document.querySelectorAll('.athlete-checkbox');
  
  checkboxes.forEach(cb => {
    cb.checked = selectAll.checked;
  });
  
  updateBulkActions();
}

function updateBulkActions() {
  const checkboxes = document.querySelectorAll('.athlete-checkbox');
  const checkedBoxes = Array.from(checkboxes).filter(cb => cb.checked);
  const bulkActionsContainer = document.getElementById('bulkActionsContainer');
  const selectedCount = document.getElementById('selectedCount');
  const selectAll = document.getElementById('selectAllAthletes');
  
  if (checkedBoxes.length > 0) {
    bulkActionsContainer.style.display = 'flex';
    selectedCount.textContent = `${checkedBoxes.length} selected`;
  } else {
    bulkActionsContainer.style.display = 'none';
  }
  
  // Update "Select All" checkbox state
  if (checkedBoxes.length === checkboxes.length && checkboxes.length > 0) {
    selectAll.checked = true;
    selectAll.indeterminate = false;
  } else if (checkedBoxes.length > 0) {
    selectAll.checked = false;
    selectAll.indeterminate = true;
  } else {
    selectAll.checked = false;
    selectAll.indeterminate = false;
  }
}

async function bulkRemoveAthletes(tourId, teamId, sportsId) {
  const checkboxes = document.querySelectorAll('.athlete-checkbox:checked');
  const athleteIds = Array.from(checkboxes).map(cb => cb.dataset.athleteId);
  
  if (athleteIds.length === 0) {
    showToast('⚠️ No athletes selected', 'warning');
    return;
  }
  
  if (!confirm(`Remove ${athleteIds.length} athlete(s) from this sport?`)) {
    return;
  }
  
  try {
    // Remove each athlete
    let successCount = 0;
    for (const athleteId of athleteIds) {
      const result = await fetchAPI('remove_athlete_from_sport', { team_ath_id: athleteId }, 'POST');
      if (result && result.ok) {
        successCount++;
      }
    }
    
    if (successCount > 0) {
      showToast(`✅ Removed ${successCount} athlete(s)`, 'success');
      loadSportAthletes(tourId, teamId, sportsId);
    } else {
      showToast('❌ Failed to remove athletes', 'error');
    }
  } catch (error) {
    console.error('Error removing athletes:', error);
    showToast('❌ Error removing athletes', 'error');
  }
}

async function removeAthleteFromSport(teamAthId, tourId, teamId, sportsId) {
  if (!confirm('Remove this athlete from the sport?')) return;
  
  const result = await fetchAPI('remove_athlete_from_sport', { team_ath_id: teamAthId }, 'POST');
  
  if (result && result.ok) {
    loadSportAthletes(tourId, teamId, sportsId);
    showToast('✅ Athlete removed', 'success');
    DashboardEvents.trigger(EVENTS.ATHLETE_REMOVED, { team_ath_id: teamAthId, tour_id: tourId, team_id: teamId, sports_id: sportsId });
  }
}

// ==========================================
// ATHLETE PROFILE VIEW
// Add this to director.js
// ==========================================

// ==========================================
// ATHLETE PROFILE VIEW
// Add this to director.js
// ==========================================

async function viewAthleteProfile(personId) {
  try {
    // Show loading indicator
    $('#modalContainer').innerHTML = `
      <div class="modal active">
        <div class="modal-content modal-sm">
          <div style="text-align: center; padding: 40px;">
            <div class="loading">Loading athlete profile...</div>
          </div>
        </div>
      </div>
    `;
    
    // Fetch comprehensive athlete data using the optimized endpoint
    const profileData = await fetchAPI('get_athlete_profile', { person_id: personId });
    
    if (!profileData || !profileData.ok) {
      showToast('❌ Athlete not found', 'error');
      closeModal();
      return;
    }
    
    const athlete = profileData.athlete;
    const vitalSigns = profileData.vitals || [];
    const athleteHistory = profileData.history || [];
    const scholarship = profileData.scholarship;
    
    // Calculate age if date of birth exists
    let age = null;
    if (athlete.date_birth) {
      const birthDate = new Date(athlete.date_birth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }
    
    const latestVitals = vitalSigns[0] || {};
    
    // Use scholarship from profile data if available
    if (scholarship && !athlete.scholarship_name) {
      athlete.scholarship_name = scholarship.scholarship_name;
    }
    
    const modal = `
      <div class="modal active" id="athleteProfileModal">
        <div class="modal-content" style="max-width: 900px; max-height: 90vh;">
          <div class="modal-header">
            <h3>👤 Athlete Profile</h3>
            <button class="modal-close" onclick="closeModal()">×</button>
          </div>
          <div class="modal-body" style="max-height: 70vh; overflow-y: auto; padding: 24px;">
            
            <!-- Header Section with Photo Placeholder -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 28px; border-radius: 12px; color: white; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
              <div style="display: flex; gap: 24px; align-items: start;">
                <!-- Profile Photo Placeholder -->
                <div style="width: 120px; height: 120px; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 48px; flex-shrink: 0; border: 3px solid rgba(255,255,255,0.3);">
                  👤
                </div>
                
                <!-- Basic Info -->
                <div style="flex: 1;">
                  <h2 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 700;">
                    ${escapeHtml(athlete.athlete_name || `${athlete.f_name} ${athlete.l_name}`)}
                  </h2>
                  <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; opacity: 0.95;">
                    ${age ? `<span style="background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 6px; font-size: 14px; font-weight: 500;">🎂 ${age} years old</span>` : ''}
                    ${athlete.blood_type ? `<span style="background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 6px; font-size: 14px; font-weight: 500;">💉 ${escapeHtml(athlete.blood_type)}</span>` : ''}
                    <span style="background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 6px; font-size: 14px; font-weight: 500;">
                      ${athlete.is_active == 1 ? '✅ Active' : '⏸️ Inactive'}
                    </span>
                  </div>
                  ${athlete.date_birth ? `<p style="margin: 0; color: #ffffffff; font-size: 14px;">📅 Born: ${new Date(athlete.date_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
                </div>
              </div>
            </div>
            
            <!-- Quick Stats Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 24px;">
              <div style="background: #f9fafb; padding: 16px; border-radius: 10px; border: 1px solid #e5e7eb;">
                <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px; font-weight: 600; text-transform: uppercase;">College</div>
                <div style="font-size: 16px; font-weight: 700; color: #111827;">${escapeHtml(athlete.college_code || 'N/A')}</div>
              </div>
              <div style="background: #f9fafb; padding: 16px; border-radius: 10px; border: 1px solid #e5e7eb;">
                <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px; font-weight: 600; text-transform: uppercase;">Course</div>
                <div style="font-size: 16px; font-weight: 700; color: #111827;">${escapeHtml(athlete.course || 'N/A')}</div>
              </div>
              <div style="background: #f9fafb; padding: 16px; border-radius: 10px; border: 1px solid #e5e7eb;">
                <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px; font-weight: 600; text-transform: uppercase;">Height</div>
                <div style="font-size: 16px; font-weight: 700; color: #111827;">${latestVitals.height ? latestVitals.height + ' cm' : 'N/A'}</div>
              </div>
              <div style="background: #f9fafb; padding: 16px; border-radius: 10px; border: 1px solid #e5e7eb;">
                <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px; font-weight: 600; text-transform: uppercase;">Weight</div>
                <div style="font-size: 16px; font-weight: 700; color: #111827;">${latestVitals.weight ? latestVitals.weight + ' kg' : 'N/A'}</div>
              </div>
            </div>
            
            <!-- Scholarship Information -->
            ${athlete.scholarship_name ? `
              <div style="background: #fef3c7; border: 1px solid #fde68a; padding: 16px; border-radius: 10px; margin-bottom: 24px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="font-size: 32px;">🎓</span>
                  <div>
                    <div style="font-size: 13px; color: #92400e; font-weight: 600; margin-bottom: 2px;">SCHOLARSHIP</div>
                    <div style="font-size: 18px; font-weight: 700; color: #78350f;">${escapeHtml(athlete.scholarship_name)}</div>
                  </div>
                </div>
              </div>
            ` : ''}
            
            <!-- Tournament History -->
            <h4 style="font-size: 18px; font-weight: 700; color: #111827; margin: 24px 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">
              🏆 Tournament History
            </h4>
            
            ${athleteHistory.length === 0 ? 
              '<div class="empty-state" style="padding: 40px 20px;">No tournament history found</div>' :
              `<div style="display: grid; gap: 12px;">
                ${athleteHistory.map(record => `
                  <div style="background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; transition: all 0.2s;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                      <div>
                        <h5 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700; color: #111827;">
                          ${escapeHtml(record.tournament_name)}
                        </h5>
                        <p style="margin: 0; font-size: 13px; color: #6b7280;">
                          ${escapeHtml(record.school_year)} • ${escapeHtml(record.team_name)}
                        </p>
                      </div>
                      ${record.is_captain ? '<span style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700;">⭐ CAPTAIN</span>' : ''}
                    </div>
                    <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                      ${record.sports.map(sport => `
                        <span style="background: #f3f4f6; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; color: #374151;">
                          ⚽ ${escapeHtml(sport.sports_name)}
                        </span>
                      `).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>`
            }
            
            <!-- Physical Information History -->
            ${vitalSigns.length > 0 ? `
              <h4 style="font-size: 18px; font-weight: 700; color: #111827; margin: 24px 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">
                📊 Physical Records
              </h4>
              <div style="background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #f9fafb;">
                      <th style="padding: 10px; text-align: left; font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Date</th>
                      <th style="padding: 10px; text-align: left; font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Height</th>
                      <th style="padding: 10px; text-align: left; font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Weight</th>
                      <th style="padding: 10px; text-align: left; font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase;">BMI</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${vitalSigns.map(v => {
                      const bmi = (v.height && v.weight) ? (v.weight / Math.pow(v.height / 100, 2)).toFixed(1) : 'N/A';
                      return `
                        <tr style="border-bottom: 1px solid #f3f4f6;">
                          <td style="padding: 10px; font-size: 13px; color: #374151;">${v.date_taken ? new Date(v.date_taken).toLocaleDateString() : 'N/A'}</td>
                          <td style="padding: 10px; font-size: 13px; color: #374151; font-weight: 500;">${v.height ? v.height + ' cm' : 'N/A'}</td>
                          <td style="padding: 10px; font-size: 13px; color: #374151; font-weight: 500;">${v.weight ? v.weight + ' kg' : 'N/A'}</td>
                          <td style="padding: 10px; font-size: 13px; color: #374151; font-weight: 500;">${bmi}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}
            
            <!-- Contact & Emergency Info Placeholder -->
            <div style="background: #f0f9ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 10px; margin-top: 24px;">
              <div style="display: flex; gap: 10px; align-items: start;">
                <span style="font-size: 20px;">ℹ️</span>
                <div>
                  <strong style="color: #1e40af; font-size: 13px; display: block; margin-bottom: 4px;">Additional Information</strong>
                  <p style="font-size: 12px; color: #1e3a8a; margin: 0; line-height: 1.5;">
                    Contact information and emergency details can be added through the athlete's full profile management system.
                  </p>
                </div>
              </div>
            </div>
            
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" onclick="printAthleteProfile()">
              🖨️ Print Profile
            </button>

            <button class="btn btn-secondary" onclick="closeModal()">Close</button>
          </div>
        </div>
      </div>
    `;
    
    $('#modalContainer').innerHTML = modal;
    
  } catch (error) {
    console.error('Error loading athlete profile:', error);
    showToast('❌ Error loading athlete profile', 'error');
  }
}

// Helper function to fetch athlete's tournament history
async function fetchAthleteHistory(personId) {
  try {
    // This would ideally be a dedicated API endpoint
    // For now, we'll construct it from existing data
    const tournaments = await fetchAPI('tournaments');
    const history = [];
    
    for (const tournament of tournaments) {
      // Get teams in this tournament
      const teams = await fetchAPI('get_tournament_teams', { tour_id: tournament.tour_id });
      
      for (const team of teams) {
        // Get sports for this team
        const sports = await fetchAPI('get_team_sports', { 
          tour_id: tournament.tour_id, 
          team_id: team.team_id 
        });
        
        const athleteSports = [];
        let isCaptain = false;
        
        for (const sport of sports) {
          // Check if athlete is in this sport
          const athletes = await fetchAPI('get_sport_athletes', {
            tour_id: tournament.tour_id,
            team_id: team.team_id,
            sports_id: sport.sports_id
          });
          
          const athleteRecord = athletes.find(a => a.person_id == personId);
          if (athleteRecord) {
            athleteSports.push({
              sports_id: sport.sports_id,
              sports_name: sport.sports_name
            });
            if (athleteRecord.is_captain) isCaptain = true;
          }
        }
        
        if (athleteSports.length > 0) {
          history.push({
            tournament_id: tournament.tour_id,
            tournament_name: tournament.tour_name,
            school_year: tournament.school_year,
            tour_date: tournament.tour_date,
            team_id: team.team_id,
            team_name: team.team_name,
            sports: athleteSports,
            is_captain: isCaptain
          });
        }
      }
    }
    
    // Sort by date (most recent first)
    return history.sort((a, b) => {
      const dateA = new Date(a.tour_date || '1900-01-01');
      const dateB = new Date(b.tour_date || '1900-01-01');
      return dateB - dateA;
    });
    
  } catch (error) {
    console.error('Error fetching athlete history:', error);
    return [];
  }
}

// Function to edit athlete from profile view
function editAthleteFromProfile(personId) {
  // Close profile modal
  closeModal();
  
  // Find the athlete in current context if available
  if (window.currentContext && window.currentContext.tour_id && 
      window.currentContext.team_id && window.currentContext.sports_id) {
    // We have context, fetch the athlete and open edit modal
    fetchAPI('get_sport_athletes', {
      tour_id: window.currentContext.tour_id,
      team_id: window.currentContext.team_id,
      sports_id: window.currentContext.sports_id
    }).then(athletes => {
      const athlete = athletes.find(a => a.person_id == personId);
      if (athlete) {
        showAthleteModal(athlete, 
          window.currentContext.tour_id, 
          window.currentContext.team_id, 
          window.currentContext.sports_id
        );
      } else {
        showToast('⚠️ Please select a tournament and sport context to edit this athlete', 'warning');
      }
    });
  } else {
    // No context, show context selection first
    showToast('⚠️ Please select a tournament and sport context to edit this athlete', 'warning');
  }
}

// Print athlete profile
function printAthleteProfile() {
  window.print();
}

console.log('✅ Athlete profile view function loaded');

// Helper function to fetch athlete's tournament history
async function fetchAthleteHistory(personId) {
  try {
    // This would ideally be a dedicated API endpoint
    // For now, we'll construct it from existing data
    const tournaments = await fetchAPI('tournaments');
    const history = [];
    
    for (const tournament of tournaments) {
      // Get teams in this tournament
      const teams = await fetchAPI('get_tournament_teams', { tour_id: tournament.tour_id });
      
      for (const team of teams) {
        // Get sports for this team
        const sports = await fetchAPI('get_team_sports', { 
          tour_id: tournament.tour_id, 
          team_id: team.team_id 
        });
        
        const athleteSports = [];
        let isCaptain = false;
        
        for (const sport of sports) {
          // Check if athlete is in this sport
          const athletes = await fetchAPI('get_sport_athletes', {
            tour_id: tournament.tour_id,
            team_id: team.team_id,
            sports_id: sport.sports_id
          });
          
          const athleteRecord = athletes.find(a => a.person_id == personId);
          if (athleteRecord) {
            athleteSports.push({
              sports_id: sport.sports_id,
              sports_name: sport.sports_name
            });
            if (athleteRecord.is_captain) isCaptain = true;
          }
        }
        
        if (athleteSports.length > 0) {
          history.push({
            tournament_id: tournament.tour_id,
            tournament_name: tournament.tour_name,
            school_year: tournament.school_year,
            tour_date: tournament.tour_date,
            team_id: team.team_id,
            team_name: team.team_name,
            sports: athleteSports,
            is_captain: isCaptain
          });
        }
      }
    }
    
    // Sort by date (most recent first)
    return history.sort((a, b) => {
      const dateA = new Date(a.tour_date || '1900-01-01');
      const dateB = new Date(b.tour_date || '1900-01-01');
      return dateB - dateA;
    });
    
  } catch (error) {
    console.error('Error fetching athlete history:', error);
    return [];
  }
}

// Function to edit athlete from profile view
function editAthleteFromProfile(personId) {
  // Close profile modal
  closeModal();
  
  // Find the athlete in current context if available
  if (window.currentContext && window.currentContext.tour_id && 
      window.currentContext.team_id && window.currentContext.sports_id) {
    // We have context, fetch the athlete and open edit modal
    fetchAPI('get_sport_athletes', {
      tour_id: window.currentContext.tour_id,
      team_id: window.currentContext.team_id,
      sports_id: window.currentContext.sports_id
    }).then(athletes => {
      const athlete = athletes.find(a => a.person_id == personId);
      if (athlete) {
        showAthleteModal(athlete, 
          window.currentContext.tour_id, 
          window.currentContext.team_id, 
          window.currentContext.sports_id
        );
      } else {
        showToast('⚠️ Please select a tournament and sport context to edit this athlete', 'warning');
      }
    });
  } else {
    // No context, show context selection first
    showToast('⚠️ Please select a tournament and sport context to edit this athlete', 'warning');
  }
}

console.log('✅ Athlete profile view function loaded');

// NEW: Edit athlete function
async function editAthlete(personId, teamAthId, tourId, teamId, sportsId) {
  // Fetch athlete details
  const athletes = await fetchAPI('get_sport_athletes', { tour_id: tourId, team_id: teamId, sports_id: sportsId });
  const athlete = athletes.find(a => a.person_id == personId);
  
  if (athlete) {
    athlete.team_ath_id = teamAthId;
    showAthleteModal(athlete, tourId, teamId, sportsId);
  }
}

// ADD: After initialization, add print styles
const printStyles = document.createElement('style');
printStyles.textContent = `
  @media print {
    /* Hide UI elements */
    .sidebar,
    .top-bar,
    .btn,
    .filter-select,
    .modal-header,
    .modal-footer,
    .data-card-actions,
    #dashboardPrintBtn {
      display: none !important;
    }
    
    /* Main content */
    .main-content {
      margin-left: 0 !important;
      padding: 20px !important;
      max-width: 100% !important;
    }
    
    /* Show only active view */
    .content-view {
      display: none !important;
    }
    
    .content-view.active {
      display: block !important;
    }
    
    /* Page setup */
    @page {
      margin: 1cm;
      size: A4;
    }
    
    body {
      font-size: 10pt;
      color: #000;
      background: white;
    }
    
    /* Cards */
    .data-grid {
      display: block !important;
    }
    
    .data-card {
      page-break-inside: avoid;
      margin-bottom: 15px;
      border: 1px solid #000 !important;
      box-shadow: none !important;
      padding: 10px !important;
      background: white !important;
    }
    
    .data-card-title {
      font-size: 12pt;
      font-weight: bold;
      color: #000 !important;
    }
    
    .data-card-meta {
      font-size: 9pt;
      color: #333 !important;
    }
    
    /* Group headers */
    .group-header {
      page-break-after: avoid;
      margin-top: 20px;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 2px solid #000;
    }
    
    .group-title {
      font-size: 14pt;
      font-weight: bold;
      color: #000 !important;
    }
    
    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
    }
    
    thead {
      display: table-header-group;
    }
    
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    
    th, td {
      border: 1px solid #000 !important;
      padding: 5px !important;
      font-size: 9pt !important;
      color: #000 !important;
    }
    
    th {
      background: #f0f0f0 !important;
      font-weight: bold !important;
    }
    
    /* Modal content */
    .modal-content {
      max-width: 100% !important;
      box-shadow: none !important;
      border: none !important;
      padding: 0 !important;
    }
    
    .modal {
      background: white !important;
    }
    
    /* Stats grid */
    .stats-grid {
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 10px !important;
    }
    
    .stat-card {
      border: 1px solid #000 !important;
      padding: 10px !important;
      page-break-inside: avoid;
    }
    
    /* Badges */
    .badge {
      border: 1px solid #000 !important;
      padding: 2px 6px !important;
      font-size: 8pt !important;
    }
  }
`;
document.head.appendChild(printStyles);

// ==========================================
// TEAMS (Legacy view)
// ==========================================
async function loadTeams() {
  try {
    const params = {};
    if (currentFilters.sport) params.sport_id = currentFilters.sport;
    if (currentFilters.tournament) params.tour_id = currentFilters.tournament;
    
    const data = await fetchAPI('teams', params);
    const content = $('#teamsContent');
    
    if (!data || data.length === 0) {
      content.innerHTML = '<div class="empty-state">No teams found. Click "Add Team" to create one.</div>';
      return;
    }
    
    let html = '<div class="data-grid">';
    data.forEach(t => {
      const statusClass = t.is_active == 1 ? 'active' : 'inactive';
      const statusText = t.is_active == 1 ? 'Active' : 'Inactive';
      
      html += `
        <div class="data-card">
          <div class="data-card-header">
            <div class="data-card-title">${escapeHtml(t.team_name)}</div>
            <span class="badge badge-${statusClass}">${statusText}</span>
          </div>
          <div class="data-card-meta">
            Team ID: ${t.team_id}
          </div>
          <div class="data-card-actions">
            <button class="btn btn-sm btn-primary" onclick="viewTeamDetails(${t.team_id})">
              👁️ View Details
            </button>
            <button class="btn btn-sm btn-secondary" onclick="editTeam(${t.team_id})">Edit</button>
            <button class="btn btn-sm btn-${t.is_active == 1 ? 'danger' : 'success'}" 
                    onclick="toggleTeam(${t.team_id}, ${t.is_active})">
              ${t.is_active == 1 ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      `;
    });
    html += '</div>';
    
    content.innerHTML = html;
    console.log('✅ Teams loaded:', data.length);
  } catch (err) {
    console.error('❌ loadTeams error:', err);
  }
}

function showTeamModal(id = null) {
  const isEdit = id !== null;
  const title = isEdit ? 'Edit Team' : 'Add Team';
  
  // For new teams, show the comprehensive modal
  if (!isEdit) {
    showComprehensiveTeamModal();
    return;
  }
  
  // For editing, show simple modal
  const modalHTML = `
    <div class="modal active" id="teamModal">
      <div class="modal-content modal-sm">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="closeModal('teamModal')">×</button>
        </div>
        <div class="modal-body">
          <form id="teamForm" onsubmit="saveTeam(event, ${id})">
            <div class="form-group">
              <label class="form-label">Team Name *</label>
              <input type="text" class="form-control" id="team_name" required>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('teamModal')">Cancel</button>
          <button class="btn btn-primary" onclick="$('#teamForm').requestSubmit()">
            ${isEdit ? 'Update' : 'Create'} Team
          </button>
        </div>
      </div>
    </div>
  `;
  
  $('#modalContainer').innerHTML = modalHTML;
  
  if (isEdit) {
    loadTeamData(id);
  }
}

async function showComprehensiveTeamModal() {
  const schools = await fetchAPI('schools') || [];
  
  const modalHTML = `
    <div class="modal active" id="comprehensiveTeamModal">
      <div class="modal-content" style="max-width: 700px;">
        <div class="modal-header">
          <h3>➕ Create New Team</h3>
          <button class="modal-close" onclick="closeModal('comprehensiveTeamModal')">×</button>
        </div>
        <form onsubmit="saveComprehensiveTeam(event)" id="comprehensiveTeamForm">
          <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
            
            <!-- Team Basic Information -->
            <h4 class="modal-section-title">🏆 Team Information</h4>
            
            <div class="form-group">
              <label class="form-label">Team Name *</label>
              <input type="text" class="form-control" name="team_name" placeholder="e.g., Phoenix Warriors" required autofocus>
              <small style="color: #6b7280; font-size: 11px; display: block; margin-top: 4px;">
                Enter a unique and descriptive name for the team
              </small>
            </div>
            
            ${schools.length > 0 ? `
              <div class="form-group">
                <label class="form-label">School/Institution</label>
                <select class="form-control" name="school_id">
                  <option value="">Select School (Optional)</option>
                  ${schools.map(s => `<option value="${s.school_id}">${escapeHtml(s.school_name)}</option>`).join('')}
                </select>
                <small style="color: #6b7280; font-size: 11px; display: block; margin-top: 4px;">
                  Associate this team with a specific school if applicable
                </small>
              </div>
            ` : ''}
            
            <!-- Team Manager/Contact Information -->
            <h4 class="modal-section-title">👤 Team Management</h4>
            
            <div style="padding: 12px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 16px;">
              <p style="font-size: 12px; color: #6b7280; margin: 0; line-height: 1.5;">
                <strong>Note:</strong> Coaches, managers, and other staff can be assigned when you add this team to a tournament and assign sports.
              </p>
            </div>
            
            <!-- Team Status -->
            <h4 class="modal-section-title">⚙️ Team Status</h4>
            
            <div class="form-group">
              <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 12px; background: #f0fdf4; border-radius: 8px; border: 1px solid #86efac;">
                <input type="checkbox" name="is_active" checked style="width: 20px; height: 20px; cursor: pointer;">
                <div>
                  <div style="font-weight: 600; color: #065f46;">Active Team</div>
                  <div style="font-size: 11px; color: #047857; margin-top: 2px;">Check this to make the team immediately active and visible</div>
                </div>
              </label>
            </div>
            
            <!-- Next Steps Notice -->
            <div style="padding: 14px; background: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 6px; margin-top: 16px;">
              <div style="display: flex; gap: 10px;">
                <span style="font-size: 20px;">ℹ️</span>
                <div>
                  <strong style="color: #1e40af; font-size: 13px; display: block; margin-bottom: 4px;">Next Steps</strong>
                  <p style="font-size: 12px; color: #1e3a8a; margin: 0; line-height: 1.5;">
                    After creating this team, you can add it to tournaments, assign sports, coaches, and register athletes.
                  </p>
                </div>
              </div>
            </div>
            
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal('comprehensiveTeamModal')">Cancel</button>
            <button type="submit" class="btn btn-primary" style="min-width: 150px;">
              ➕ Create Team
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  $('#modalContainer').innerHTML = modalHTML;
}

async function saveComprehensiveTeam(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  
  const data = {
    team_name: formData.get('team_name').trim(),
    school_id: formData.get('school_id') || null,
    is_active: formData.get('is_active') ? 1 : 0
  };
  
  if (!data.team_name) {
    showToast('Please enter a team name', 'error');
    return;
  }
  
  try {
    const result = await fetchAPI('create_team', data, 'POST');
    
    if (result && result.ok) {
      closeModal('comprehensiveTeamModal');
      showToast(`✅ Team "${data.team_name}" created successfully!`, 'success');
      DashboardEvents.trigger(EVENTS.TEAM_CREATED, { team_id: result.team_id, ...data });
    } else {
      showToast('❌ Error creating team: ' + (result?.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error creating team:', error);
    showToast('❌ Error creating team', 'error');
  }
}

async function loadTeamData(id) {
  const data = await fetchAPI('teams');
  const team = data.find(t => t.team_id == id);
  
  if (team) {
    $('#team_name').value = team.team_name || '';
  }
}

async function saveTeam(e, id) {
  e.preventDefault();
  
  const data = {
    team_name: $('#team_name').value
  };
  
  if (id) data.team_id = id;
  
  const action = id ? 'update_team' : 'create_team';
  const result = await fetchAPI(action, data, 'POST');
  
  if (result && result.ok) {
    showToast(id ? '✅ Team updated!' : '✅ Team created!', 'success');
    closeModal('teamModal');
    
    if (id) {
      DashboardEvents.trigger(EVENTS.TEAM_UPDATED, { team_id: id, ...data });
    } else {
      DashboardEvents.trigger(EVENTS.TEAM_CREATED, { team_id: result.team_id, ...data });
    }
  }
}

async function toggleTeam(id, currentStatus) {
  const newStatus = currentStatus == 1 ? 0 : 1;
  const result = await fetchAPI('toggle_team', { team_id: id, is_active: newStatus }, 'POST');
  
  if (result && result.ok) {
    DashboardEvents.trigger(EVENTS.TEAM_TOGGLED, { team_id: id, is_active: newStatus });
  }
}

function editTeam(id) {
  showTeamModal(id);
}

// ==========================================
// TEAM DETAILS VIEW
// ==========================================
async function viewTeamDetails(teamId) {
  try {
    // Try to fetch team details from the new endpoint
    let teamData = await fetchAPI('get_team_details', { team_id: teamId });
    
    // If the endpoint doesn't exist yet, fall back to basic teams data
    if (!teamData || !teamData.team) {
      console.log('Team details endpoint not available, using fallback...');
      const allTeams = await fetchAPI('teams');
      const team = allTeams.find(t => t.team_id == teamId);
      
      if (!team) {
        showToast('❌ Team not found', 'error');
        return;
      }
      
      // Create fallback structure
      teamData = {
        team: team,
        sports: []
      };
    }
    
    const team = teamData.team;
    const sports = teamData.sports || [];
    
    const modalHTML = `
      <div class="modal active" id="teamDetailsModal">
        <div class="modal-content" style="max-width: 1000px;">
          <div class="modal-header">
            <h3>👥 ${escapeHtml(team.team_name)} - Team Details</h3>
            <button class="modal-close" onclick="closeModal('teamDetailsModal')">×</button>
          </div>
          <div class="modal-body" style="max-height: 80vh; overflow-y: auto;">
            
            <!-- Team Info -->
            <div style="padding: 16px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <h4 style="margin: 0 0 4px 0; font-size: 16px;">Team Information</h4>
                  <p style="margin: 0; font-size: 12px; color: #6b7280;">Team ID: ${team.team_id}</p>
                </div>
                <span class="badge badge-${team.is_active == 1 ? 'active' : 'inactive'}">
                  ${team.is_active == 1 ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            <div id="teamDetailsContent">
              <div class="loading">Loading team details...</div>
            </div>
            
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('teamDetailsModal')">Close</button>
          </div>
        </div>
      </div>
    `;
    
    $('#modalContainer').innerHTML = modalHTML;
    
    // Load the detailed content
    loadTeamDetailsContent(teamId, sports);
    
  } catch (err) {
    console.error('❌ Error loading team details:', err);
    showToast('❌ Error loading team details', 'error');
  }
}

async function loadTeamDetailsContent(teamId, sports) {
  const container = $('#teamDetailsContent');
  
  if (!sports || sports.length === 0) {
    container.innerHTML = `
      <div style="padding: 24px; background: #fef3c7; border-radius: 8px; border: 1px solid #fbbf24; margin-bottom: 16px;">
        <div style="display: flex; gap: 12px; align-items: start;">
          <div style="font-size: 24px;">ℹ️</div>
          <div>
            <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #92400e;">
              Team Details API Not Implemented Yet
            </h4>
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #78350f; line-height: 1.5;">
              To see coaches, trainors, and athletes for this team, you need to implement the 
              <code style="background: #fff; padding: 2px 6px; border-radius: 4px;">action=get_team_details</code> 
              endpoint in your <strong>api.php</strong> file.
            </p>
            <p style="margin: 0; font-size: 12px; color: #78350f;">
              📄 Check the <strong>API_SQL_FIXES.md</strong> file for the complete SQL queries and implementation guide.
            </p>
          </div>
        </div>
      </div>
      
      <div class="empty-state">
        <p style="margin-bottom: 12px;">This team is ready to view, but needs the API endpoint to display:</p>
        <ul style="text-align: left; display: inline-block; color: #6b7280; font-size: 13px; line-height: 1.8;">
          <li>🏆 Sports this team participates in</li>
          <li>👔 Coaches and Assistant Coaches</li>
          <li>🏃 Trainors (1, 2, and 3)</li>
          <li>📋 Tournament Managers</li>
          <li>⚡ All Athletes grouped by sport</li>
        </ul>
      </div>
    `;
    return;
  }
  
  let html = '';
  
  // Group by sport
  for (const sport of sports) {
    const sportName = sport.sports_name || 'Unknown Sport';
    const athletes = sport.athletes || [];
    
    html += `
      <div class="group-header" style="margin-top: 0;">
        <h4 class="group-title">🏆 ${escapeHtml(sportName)}</h4>
        <span class="group-badge">${athletes.length} athlete${athletes.length !== 1 ? 's' : ''}</span>
      </div>
      
      <!-- Staff Section -->
      <div style="margin: 16px 0 24px 0;">
        <h5 style="font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 12px;">
          👔 Coaching Staff & Management
        </h5>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; margin-bottom: 16px;">
          
          <!-- Coach -->
          <div style="padding: 12px; background: white; border: 1px solid #e5e7eb; border-radius: 6px;">
            <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">
              Head Coach
            </div>
            <div style="font-size: 13px; color: #111827; font-weight: 500;">
              ${sport.coach_name ? escapeHtml(sport.coach_name) : '<em style="color: #9ca3af;">Not assigned</em>'}
            </div>
          </div>
          
          <!-- Assistant Coach -->
          <div style="padding: 12px; background: white; border: 1px solid #e5e7eb; border-radius: 6px;">
            <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">
              Assistant Coach
            </div>
            <div style="font-size: 13px; color: #111827; font-weight: 500;">
              ${sport.asst_coach_name ? escapeHtml(sport.asst_coach_name) : '<em style="color: #9ca3af;">Not assigned</em>'}
            </div>
          </div>
          
          <!-- Trainor 1 -->
          <div style="padding: 12px; background: white; border: 1px solid #e5e7eb; border-radius: 6px;">
            <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">
              Trainor 1
            </div>
            <div style="font-size: 13px; color: #111827; font-weight: 500;">
              ${sport.trainor1_name ? escapeHtml(sport.trainor1_name) : '<em style="color: #9ca3af;">Not assigned</em>'}
            </div>
          </div>
          
          <!-- Trainor 2 -->
          <div style="padding: 12px; background: white; border: 1px solid #e5e7eb; border-radius: 6px;">
            <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">
              Trainor 2
            </div>
            <div style="font-size: 13px; color: #111827; font-weight: 500;">
              ${sport.trainor2_name ? escapeHtml(sport.trainor2_name) : '<em style="color: #9ca3af;">Not assigned</em>'}
            </div>
          </div>
          
          <!-- Trainor 3 -->
          <div style="padding: 12px; background: white; border: 1px solid #e5e7eb; border-radius: 6px;">
            <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">
              Trainor 3
            </div>
            <div style="font-size: 13px; color: #111827; font-weight: 500;">
              ${sport.trainor3_name ? escapeHtml(sport.trainor3_name) : '<em style="color: #9ca3af;">Not assigned</em>'}
            </div>
          </div>
          
          <!-- Tournament Manager -->
          <div style="padding: 12px; background: white; border: 1px solid #e5e7eb; border-radius: 6px;">
            <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">
              Tournament Manager
            </div>
            <div style="font-size: 13px; color: #111827; font-weight: 500;">
              ${sport.tournament_manager_name ? escapeHtml(sport.tournament_manager_name) : '<em style="color: #9ca3af;">Not assigned</em>'}
            </div>
          </div>
          
        </div>
      </div>
      
      <!-- Athletes Section -->
      <div style="margin-bottom: 32px;">
        <h5 style="font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 12px;">
          🏃 Athletes
        </h5>
    `;
    
    if (athletes.length === 0) {
      html += `
        <div style="padding: 20px; text-align: center; background: #f9fafb; border-radius: 6px; border: 1px dashed #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 13px;">No athletes registered for this sport yet.</p>
        </div>
      `;
    } else {
      html += `
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>College</th>
              <th>Course</th>
              <th>Captain</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${athletes.map(a => {
              const statusClass = a.is_active == 1 ? 'active' : 'inactive';
              const statusText = a.is_active == 1 ? 'Active' : 'Inactive';
              const isCaptain = a.is_captain == 1;
              
              return `
                <tr>
                  <td>
                    <strong>${escapeHtml(a.athlete_name || a.full_name || 'N/A')}</strong>
                    ${isCaptain ? '<span style="margin-left: 6px; font-size: 16px;" title="Team Captain">👑</span>' : ''}
                  </td>
                  <td>${escapeHtml(a.college_code || 'N/A')}</td>
                  <td>${escapeHtml(a.course || 'N/A')}</td>
                  <td>${isCaptain ? '<span class="badge badge-success">Captain</span>' : '-'}</td>
                  <td><span class="badge badge-${statusClass}">${statusText}</span></td>
                  <td>
                    <button class="btn btn-sm btn-secondary" onclick="viewAthleteProfile(${a.person_id})">
                      View Profile
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }
    
    html += '</div>'; // Close athletes section
  }
  
  container.innerHTML = html;
}

// ==========================================
// ATHLETES (Legacy view)
// ==========================================
async function loadAthletes() {
  try {
    const params = {};
    if (currentFilters.sport) params.sport_id = currentFilters.sport;
    if (currentFilters.tournament) params.tour_id = currentFilters.tournament;
    if (currentFilters.team) params.team_id = currentFilters.team;
    
    const data = await fetchAPI('athletes', params);
    const content = $('#athletesContent');
    
    if (!data || data.length === 0) {
      content.innerHTML = '<div class="empty-state">No athletes found.</div>';
      return;
    }
    
    // First, separate by sport type (team vs individual)
    // Then group by team for team sports, by sport for individual sports
    const teamSportsAthletes = {};
    const individualSportsAthletes = {};
    
    data.forEach(a => {
      const sportName = a.sports_name || 'No Sport Assigned';
      const teamName = a.team_name || null;
      const isTeamSport = a.team_individual === 'team' || teamName; // If has team_individual field or has a team
      
      if (isTeamSport && teamName) {
        // Team sport - group by team then by sport
        if (!teamSportsAthletes[teamName]) teamSportsAthletes[teamName] = {};
        if (!teamSportsAthletes[teamName][sportName]) teamSportsAthletes[teamName][sportName] = [];
        teamSportsAthletes[teamName][sportName].push(a);
      } else {
        // Individual sport - group by sport only
        if (!individualSportsAthletes[sportName]) individualSportsAthletes[sportName] = [];
        individualSportsAthletes[sportName].push(a);
      }
    });
    
    let html = '';
    
    // Render individual sports first (grouped by sport only)
    if (Object.keys(individualSportsAthletes).length > 0) {
      Object.keys(individualSportsAthletes).sort().forEach(sportName => {
        const athletes = individualSportsAthletes[sportName];
        
        html += `
          <div class="group-header" style="margin-top: 24px;">
            <h4 class="group-title">🏃 ${escapeHtml(sportName)} (Individual)</h4>
            <span class="group-badge">${athletes.length} athlete${athletes.length !== 1 ? 's' : ''}</span>
          </div>
          <table style="margin-bottom: 20px;">
            <thead>
              <tr>
                <th>Name</th>
                <th>College</th>
                <th>Course</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${athletes.map(a => {
                const statusClass = a.is_active == 1 ? 'active' : 'inactive';
                const statusText = a.is_active == 1 ? 'Active' : 'Inactive';
                
                return `
                  <tr>
                    <td><strong>${escapeHtml(a.athlete_name || a.full_name || 'N/A')}</strong></td>
                    <td>${escapeHtml(a.college_code || 'N/A')}</td>
                    <td>${escapeHtml(a.course || 'N/A')}</td>
                    <td><span class="badge badge-${statusClass}">${statusText}</span></td>
                    <td>
                      <button class="btn btn-sm btn-secondary" onclick="viewAthleteProfile(${a.person_id})">View</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `;
      });
    }
    
    // Render team sports (grouped by team then by sport)
    if (Object.keys(teamSportsAthletes).length > 0) {
      Object.keys(teamSportsAthletes).sort().forEach(teamName => {
        const sports = teamSportsAthletes[teamName];
        const totalAthletes = Object.values(sports).reduce((sum, athletes) => sum + athletes.length, 0);
        
        html += `
          <div class="group-header" style="margin-top: 24px;">
            <h4 class="group-title">👥 ${escapeHtml(teamName)}</h4>
            <span class="group-badge">${totalAthletes} athlete${totalAthletes !== 1 ? 's' : ''}</span>
          </div>
        `;
        
        // Render each sport within the team
        Object.keys(sports).sort().forEach(sportName => {
          const athletes = sports[sportName];
          
          html += `
            <div style="margin-left: 20px; margin-top: 12px;">
              <div style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 8px;">
                🏆 ${escapeHtml(sportName)} (${athletes.length})
              </div>
              <table style="margin-bottom: 16px;">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>College</th>
                    <th>Course</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${athletes.map(a => {
                    const statusClass = a.is_active == 1 ? 'active' : 'inactive';
                    const statusText = a.is_active == 1 ? 'Active' : 'Inactive';
                    
                    return `
                      <tr>
                        <td><strong>${escapeHtml(a.athlete_name || a.full_name || 'N/A')}</strong></td>
                        <td>${escapeHtml(a.college_code || 'N/A')}</td>
                        <td>${escapeHtml(a.course || 'N/A')}</td>
                        <td><span class="badge badge-${statusClass}">${statusText}</span></td>
                        <td>
                          <button class="btn btn-sm btn-secondary" onclick="viewAthleteProfile(${a.person_id})">View</button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `;
        });
      });
    }
    
    content.innerHTML = html;
    console.log('✅ Athletes loaded:', data.length);
  } catch (err) {
    console.error('❌ loadAthletes error:', err);
  }
}

// ==========================================
// QUALIFY/DISQUALIFY ATHLETES
// ==========================================
async function loadQualifyAthletes() {
  try {
    const content = $('#qualifyAthletesContent');
    
    // Fetch active tournament and all athletes
    const tournaments = await fetchAPI('tournaments');
    const activeTournament = tournaments.find(t => t.is_active == 1);
    
    if (!activeTournament) {
      content.innerHTML = `
        <div class="empty-state">
          <div style="font-size: 48px; margin-bottom: 16px;">🏆</div>
          <h3>No Active Tournament</h3>
          <p>Please activate a tournament first to manage athlete qualifications.</p>
        </div>
      `;
      return;
    }
    
    // Fetch all athletes with team and sport information
    const allAthletes = await fetchAPI('get_team_athletes');
    
    // Filter athletes by active tournament only
    const athletes = allAthletes.filter(athlete => athlete.tour_id == activeTournament.tour_id);
    
    if (!athletes || athletes.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <div style="font-size: 48px; margin-bottom: 16px;">👥</div>
          <h3>No Athletes in Active Tournament</h3>
          <p>Tournament: <strong>${escapeHtml(activeTournament.tour_name)}</strong></p>
          <p>Add teams and athletes to this tournament first.</p>
        </div>
      `;
      return;
    }
    
    // Group by team, then by sport
    const grouped = {};
    athletes.forEach(athlete => {
      const teamName = athlete.team_name || 'No Team';
      const sportName = athlete.sports_name || 'No Sport';
      
      if (!grouped[teamName]) grouped[teamName] = {};
      if (!grouped[teamName][sportName]) grouped[teamName][sportName] = [];
      
      grouped[teamName][sportName].push(athlete);
    });
    
    let html = `
      <div style="max-width: 1400px; margin: 0 auto;">
        <!-- Tournament Info Banner -->
        <div style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 20px 24px;
          margin-bottom: 24px;
          color: white;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        ">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 12px; opacity: 0.9; margin-bottom: 4px;">ACTIVE TOURNAMENT</div>
              <h2 style="margin: 0; font-size: 24px; font-weight: 700;">
                🏆 ${escapeHtml(activeTournament.tour_name)}
              </h2>
              <div style="font-size: 14px; opacity: 0.9; margin-top: 4px;">
                ${escapeHtml(activeTournament.school_year)} • ${escapeHtml(activeTournament.tour_date || 'Date TBD')}
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 32px; font-weight: 700;">${athletes.length}</div>
              <div style="font-size: 12px; opacity: 0.9;">Total Athletes</div>
            </div>
          </div>
        </div>
        
        <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px;">
          <h3 style="margin: 0 0 8px 0; color: #111827;">✅ Qualify / ❌ Disqualify Athletes</h3>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            Manage athlete qualification status by team and sport. Disqualified athletes won't be able to participate in matches.
          </p>
        </div>
    `;
    
    // Render each team
    Object.keys(grouped).sort().forEach((teamName, teamIndex) => {
      const teamSports = grouped[teamName];
      const totalAthletes = Object.values(teamSports).reduce((sum, athletes) => sum + athletes.length, 0);
      const qualifiedCount = Object.values(teamSports).reduce((sum, athletes) => 
        sum + athletes.filter(a => a.is_active == 1).length, 0);
      const disqualifiedCount = totalAthletes - qualifiedCount;
      
      // Team color palette
      const teamColors = [
        { bg: '#dbeafe', border: '#3b82f6', text: '#1e3a8a' },
        { bg: '#fef3c7', border: '#fbbf24', text: '#92400e' },
        { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
        { bg: '#fecaca', border: '#ef4444', text: '#7f1d1d' },
        { bg: '#e9d5ff', border: '#a855f7', text: '#581c87' },
        { bg: '#fed7aa', border: '#f97316', text: '#7c2d12' },
        { bg: '#fbcfe8', border: '#ec4899', text: '#831843' },
        { bg: '#e0e7ff', border: '#6366f1', text: '#312e81' },
      ];
      const color = teamColors[teamIndex % teamColors.length];
      
      html += `
        <div style="
          background: ${color.bg}; 
          border: 3px solid ${color.border}; 
          border-radius: 16px; 
          padding: 24px; 
          margin-bottom: 32px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        ">
          <!-- Team Header -->
          <div style="
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
            margin-bottom: 20px;
            padding-bottom: 16px;
            border-bottom: 2px solid ${color.border};
          ">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="
                font-size: 40px; 
                background: white; 
                width: 64px; 
                height: 64px; 
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid ${color.border};
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              ">
                👥
              </div>
              <div>
                <h3 style="
                  margin: 0; 
                  font-size: 24px; 
                  font-weight: 700; 
                  color: ${color.text};
                ">
                  ${escapeHtml(teamName)}
                </h3>
                <div style="
                  font-size: 14px; 
                  color: ${color.text}; 
                  opacity: 0.8; 
                  margin-top: 4px;
                ">
                  ${totalAthletes} athlete${totalAthletes !== 1 ? 's' : ''} • 
                  ${Object.keys(teamSports).length} sport${Object.keys(teamSports).length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            <!-- Summary Badges -->
            <div style="display: flex; gap: 12px; align-items: center;">
              <div style="
                background: white;
                padding: 8px 16px;
                border-radius: 8px;
                border: 2px solid #10b981;
                font-weight: 600;
                color: #065f46;
                font-size: 14px;
              ">
                ✅ ${qualifiedCount} Qualified
              </div>
              <div style="
                background: white;
                padding: 8px 16px;
                border-radius: 8px;
                border: 2px solid #ef4444;
                font-weight: 600;
                color: #7f1d1d;
                font-size: 14px;
              ">
                ❌ ${disqualifiedCount} Disqualified
              </div>
            </div>
          </div>
      `;
      
      // Render each sport within the team
      Object.keys(teamSports).sort().forEach((sportName) => {
        const sportAthletes = teamSports[sportName];
        const qualifiedAthletes = sportAthletes.filter(a => a.is_active == 1);
        const disqualifiedAthletes = sportAthletes.filter(a => a.is_active == 0);
        
        html += `
          <div style="
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 16px;
          ">
            <div style="display: flex; align-items: center; justify-content: between; margin-bottom: 16px;">
              <h4 style="margin: 0; color: #111827; font-size: 18px; display: flex; align-items: center; gap: 8px; flex: 1;">
                <span style="font-size: 24px;">⚽</span>
                ${escapeHtml(sportName)}
                <span style="font-size: 13px; color: #6b7280; font-weight: 400;">
                  (${sportAthletes.length} athlete${sportAthletes.length !== 1 ? 's' : ''})
                </span>
              </h4>
              <div style="display: flex; gap: 8px;">
                <button 
                  class="btn btn-sm btn-success" 
                  onclick="bulkQualifyAthletes('${escapeHtml(teamName)}', '${escapeHtml(sportName)}')"
                  title="Qualify all athletes in this sport">
                  ✅ Qualify All
                </button>
                <button 
                  class="btn btn-sm btn-danger" 
                  onclick="bulkDisqualifyAthletes('${escapeHtml(teamName)}', '${escapeHtml(sportName)}')"
                  title="Disqualify all athletes in this sport">
                  ❌ Disqualify All
                </button>
              </div>
            </div>
            
            <!-- Athletes Table -->
            <div style="overflow-x: auto;">
              <table class="data-table" style="width: 100%; min-width: 600px;">
                <thead>
                  <tr>
                    <th style="width: 40px;">#</th>
                    <th>Athlete Name</th>
                    <th>College</th>
                    <th>Course</th>
                    <th>Captain</th>
                    <th style="width: 140px;">Status</th>
                    <th style="width: 180px;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${sportAthletes.map((athlete, idx) => {
                    const isQualified = athlete.is_active == 1;
                    const statusBadge = isQualified 
                      ? '<span class="badge badge-active">✅ Qualified</span>'
                      : '<span class="badge badge-inactive">❌ Disqualified</span>';
                    
                    return `
                      <tr style="background: ${isQualified ? '#f0fdf4' : '#fef2f2'};">
                        <td>${idx + 1}</td>
                        <td style="font-weight: 500;">
                          ${escapeHtml(athlete.athlete_name || 'Unknown')}
                        </td>
                        <td>${escapeHtml(athlete.college_code || 'N/A')}</td>
                        <td style="font-size: 12px;">${escapeHtml(athlete.course_code || 'N/A')}</td>
                        <td style="text-align: center;">
                          ${athlete.is_captain == 1 ? '👑' : '-'}
                        </td>
                        <td>${statusBadge}</td>
                        <td>
                          ${isQualified ? `
                            <button 
                              class="btn btn-sm btn-danger" 
                              onclick="toggleAthleteQualification(${athlete.team_ath_id}, 0)"
                              title="Disqualify this athlete">
                              ❌ Disqualify
                            </button>
                          ` : `
                            <button 
                              class="btn btn-sm btn-success" 
                              onclick="toggleAthleteQualification(${athlete.team_ath_id}, 1)"
                              title="Qualify this athlete">
                              ✅ Qualify
                            </button>
                          `}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
      });
      
      html += `</div>`;
    });
    
    html += `</div>`;
    
    content.innerHTML = html;
    console.log('✅ Qualify Athletes view loaded:', athletes.length);
  } catch (err) {
    console.error('❌ loadQualifyAthletes error:', err);
    $('#qualifyAthletesContent').innerHTML = '<div class="empty-state">Error loading qualification view</div>';
  }
}

async function toggleAthleteQualification(teamAthId, newStatus) {
  try {
    const action = newStatus == 1 ? 'qualify' : 'disqualify';
    const result = await fetchAPI('update_athlete_qualification', {
      team_ath_id: teamAthId,
      is_active: newStatus
    }, 'POST');
    
    if (result && result.ok) {
      showToast(`✅ Athlete ${action === 'qualify' ? 'qualified' : 'disqualified'} successfully!`, 'success');
      loadQualifyAthletes(); // Reload the view
    } else {
      showToast('❌ Error: ' + (result?.error || 'Failed to update athlete status'), 'error');
    }
  } catch (error) {
    console.error('Error updating athlete qualification:', error);
    showToast('❌ Failed to update athlete status', 'error');
  }
}

async function bulkQualifyAthletes(teamName, sportName) {
  if (!confirm(`Qualify ALL athletes in ${teamName} - ${sportName}?`)) return;
  
  try {
    const result = await fetchAPI('bulk_update_athlete_qualification', {
      team_name: teamName,
      sport_name: sportName,
      is_active: 1
    }, 'POST');
    
    if (result && result.ok) {
      showToast(`✅ All athletes in ${sportName} qualified successfully!`, 'success');
      loadQualifyAthletes(); // Reload the view
    } else {
      showToast('❌ Error: ' + (result?.error || 'Failed to qualify athletes'), 'error');
    }
  } catch (error) {
    console.error('Error bulk qualifying athletes:', error);
    showToast('❌ Failed to qualify athletes', 'error');
  }
}

async function bulkDisqualifyAthletes(teamName, sportName) {
  if (!confirm(`⚠️ WARNING: Disqualify ALL athletes in ${teamName} - ${sportName}?

This will prevent them from participating in matches.`)) return;
  
  try {
    const result = await fetchAPI('bulk_update_athlete_qualification', {
      team_name: teamName,
      sport_name: sportName,
      is_active: 0
    }, 'POST');
    
    if (result && result.ok) {
      showToast(`✅ All athletes in ${sportName} disqualified`, 'success');
      loadQualifyAthletes(); // Reload the view
    } else {
      showToast('❌ Error: ' + (result?.error || 'Failed to disqualify athletes'), 'error');
    }
  } catch (error) {
    console.error('Error bulk disqualifying athletes:', error);
    showToast('❌ Failed to disqualify athletes', 'error');
  }
}

// ==========================================
// ASSIGN UMPIRES
// ==========================================
async function loadAssignUmpires() {
  try {
    const content = $('#assignUmpiresContent');
    
    // Fetch tournaments and umpires
    const tournaments = await fetchAPI('tournaments');
    const umpires = await fetchAPI('get_umpires');
    
    if (!tournaments || tournaments.length === 0) {
      content.innerHTML = '<div class="empty-state">No tournaments found. Create a tournament first.</div>';
      return;
    }
    
    if (!umpires || umpires.length === 0) {
      content.innerHTML = '<div class="empty-state">No umpires found. Please add people with umpire role first.</div>';
      return;
    }
    
    let html = `
      <div style="max-width: 1200px; margin: 0 auto;">
        <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="margin: 0 0 8px 0; color: #111827;">🏅 Assign Umpires to Tournament Sports</h3>
          <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px;">
            Assign umpires to specific sports within tournaments. These umpires will automatically be assigned to all matches of that sport in the tournament.
          </p>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 24px;">
    `;
    
    // Group tournaments by school year
    const grouped = {};
    tournaments.forEach(t => {
      const year = t.school_year || 'No Year';
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(t);
    });
    
    // Render each tournament as a card
    Object.keys(grouped).sort().reverse().forEach(year => {
      grouped[year].forEach(tournament => {
        html += `
          <div style="
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            background: #f9fafb;
            transition: all 0.2s;
            cursor: pointer;
          " onmouseover="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 4px 6px rgba(59, 130, 246, 0.1)';" 
             onmouseout="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none';"
             onclick="showUmpireAssignmentModal(${tournament.tour_id})">
            <div style="display: flex; align-items: start; justify-content: space-between; margin-bottom: 12px;">
              <div>
                <h4 style="margin: 0 0 4px 0; color: #111827; font-size: 16px;">
                  ${escapeHtml(tournament.tour_name)}
                </h4>
                <div style="font-size: 12px; color: #6b7280;">
                  ${escapeHtml(tournament.school_year)}
                </div>
              </div>
              <span class="badge badge-${tournament.is_active == 1 ? 'active' : 'inactive'}">
                ${tournament.is_active == 1 ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div style="font-size: 13px; color: #4b5563; line-height: 1.6;">
              📅 ${escapeHtml(tournament.tour_date || 'No date')}<br>
              ⚽ ${tournament.num_sports || 0} sport${tournament.num_sports !== 1 ? 's' : ''}
            </div>
            
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
              <button class="btn btn-sm btn-primary" style="width: 100%;" onclick="event.stopPropagation(); showUmpireAssignmentModal(${tournament.tour_id})">
                👨‍⚖️ Manage Umpires
              </button>
            </div>
          </div>
        `;
      });
    });
    
    html += `
          </div>
        </div>
      </div>
    `;
    
    content.innerHTML = html;
    console.log('✅ Assign Umpires view loaded');
  } catch (err) {
    console.error('❌ loadAssignUmpires error:', err);
    $('#assignUmpiresContent').innerHTML = '<div class="empty-state">Error loading umpire assignment view</div>';
  }
}

async function showUmpireAssignmentModal(tourId) {
  try {
    // Store the current tournament ID for auto-refresh when sports are added
    window.currentUmpireAssignmentTourId = tourId;
    
    // Fetch tournament details, sports, and umpires
    const tournaments = await fetchAPI('tournaments');
    const tournament = tournaments.find(t => t.tour_id == tourId);
    const tournamentSports = await fetchAPI('get_tournament_sports', { tour_id: tourId });
    const umpires = await fetchAPI('get_umpires');
    const currentAssignments = await fetchAPI('get_tournament_umpire_assignments', { tour_id: tourId });
    
    if (!tournament) {
      showToast('❌ Tournament not found', 'error');
      return;
    }
    
    // Check if tournamentSports is a valid array
    if (!Array.isArray(tournamentSports) || tournamentSports.length === 0) {
      showToast('⚠️ No sports found in this tournament. Add sports to the tournament first.', 'warning');
      return;
    }
    
    // Check if umpires is a valid array
    if (!Array.isArray(umpires) || umpires.length === 0) {
      showToast('⚠️ No umpires found. Please add people with umpire role first.', 'warning');
      return;
    }
    
    // Ensure currentAssignments is an array
    const assignments = Array.isArray(currentAssignments) ? currentAssignments : [];
    
    const modalHTML = `
      <div class="modal active" id="umpireAssignmentModal">
        <div class="modal-content" style="max-width: 900px;">
          <div class="modal-header">
            <h3>👨‍⚖️ Assign Umpires - ${escapeHtml(tournament.tour_name)}</h3>
            <button class="modal-close" onclick="closeModal('umpireAssignmentModal')">×</button>
          </div>
          <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
            
            <div style="padding: 16px; background: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 6px; margin-bottom: 24px;">
              <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                <strong>ℹ️ Note:</strong> Umpires assigned here will automatically be assigned to all matches of the selected sport in this tournament. You can assign multiple umpires per sport.
              </p>
            </div>
            
            ${tournamentSports.map(sport => {
              // Get current umpire assignments for this sport
              const sportAssignments = assignments.filter(a => a.sports_id == sport.sports_id);
              const assignedUmpireIds = sportAssignments.map(a => a.person_id);
              
              return `
                <div style="
                  background: white;
                  border: 2px solid #e5e7eb;
                  border-radius: 12px;
                  padding: 20px;
                  margin-bottom: 20px;
                ">
                  <h4 style="margin: 0 0 16px 0; color: #111827; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 24px;">⚽</span>
                    ${escapeHtml(sport.sports_name)}
                  </h4>
                  
                  <div style="margin-bottom: 16px;">
                    <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 8px; font-size: 13px;">
                      Select Umpires (Multiple Selection Allowed)
                    </label>
                    <div style="
                      max-height: 200px;
                      overflow-y: auto;
                      border: 1px solid #d1d5db;
                      border-radius: 8px;
                      padding: 8px;
                      background: #f9fafb;
                    ">
                      ${umpires.map(umpire => `
                        <label style="
                          display: flex;
                          align-items: center;
                          padding: 8px 12px;
                          margin: 4px 0;
                          background: white;
                          border-radius: 6px;
                          cursor: pointer;
                          border: 1px solid #e5e7eb;
                          transition: all 0.2s;
                        " onmouseover="this.style.borderColor='#3b82f6'; this.style.background='#eff6ff';"
                           onmouseout="this.style.borderColor='#e5e7eb'; this.style.background='white';">
                          <input 
                            type="checkbox" 
                            class="umpire-checkbox-sport-${sport.sports_id}"
                            value="${umpire.person_id}"
                            ${assignedUmpireIds.includes(umpire.person_id) ? 'checked' : ''}
                            style="width: 18px; height: 18px; margin-right: 12px; cursor: pointer;"
                          >
                          <div style="flex: 1;">
                            <div style="font-weight: 500; color: #111827; font-size: 14px;">
                              ${escapeHtml(umpire.full_name)}
                            </div>
                            ${umpire.college_code ? `
                              <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">
                                ${escapeHtml(umpire.college_code)}
                              </div>
                            ` : ''}
                          </div>
                        </label>
                      `).join('')}
                    </div>
                  </div>
                  
                  <button 
                    class="btn btn-primary" 
                    style="width: 100%;"
                    onclick="saveUmpireAssignments(${tourId}, ${sport.sports_id})">
                    💾 Save Umpires for ${escapeHtml(sport.sports_name)}
                  </button>
                </div>
              `;
            }).join('')}
            
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('umpireAssignmentModal')">Close</button>
          </div>
        </div>
      </div>
    `;
    
    $('#modalContainer').innerHTML = modalHTML;
    
  } catch (err) {
    console.error('❌ Error showing umpire assignment modal:', err);
    showToast('❌ Error loading umpire assignment form', 'error');
  }
}

async function saveUmpireAssignments(tourId, sportsId) {
  try {
    // Get all checked umpire checkboxes for this sport
    const checkboxes = document.querySelectorAll(`.umpire-checkbox-sport-${sportsId}:checked`);
    const umpireIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    const result = await fetchAPI('save_tournament_umpire_assignments', {
      tour_id: tourId,
      sports_id: sportsId,
      umpire_ids: umpireIds
    }, 'POST');
    
    if (result && result.ok) {
      showToast(`✅ Umpires assigned successfully!`, 'success');
    } else {
      showToast('❌ Error: ' + (result?.error || 'Failed to assign umpires'), 'error');
    }
  } catch (error) {
    console.error('Error saving umpire assignments:', error);
    showToast('❌ Failed to save umpire assignments', 'error');
  }
}

// ==========================================
// MATCHES
// ==========================================
async function loadMatches() {
  try {
    const params = {};
    if (currentFilters.sport) params.sport_id = currentFilters.sport;
    if (currentFilters.tournament) params.tour_id = currentFilters.tournament;
    if (currentFilters.team) params.team_id = currentFilters.team;
    
    const data = await fetchAPI('matches', params);
    const content = $('#matchesContent');
    
    if (!data || data.length === 0) {
      content.innerHTML = '<div class="empty-state">No matches scheduled yet.</div>';
      return;
    }
    
    // Group matches by sport
    const grouped = {};
    data.forEach(m => {
      const sport = m.sports_name || 'General Matches';
      if (!grouped[sport]) grouped[sport] = [];
      grouped[sport].push(m);
    });
    
    let html = '';
    
    // Render each sport group
    Object.keys(grouped).sort().forEach(sport => {
      const matches = grouped[sport];
      
      // ✅ SORT MATCHES BY GAME NUMBER (ascending)
      matches.sort((a, b) => {
        const gameA = parseInt(a.game_no) || 0;
        const gameB = parseInt(b.game_no) || 0;
        return gameA - gameB;
      });
      
      html += `
        <div class="group-header">
          <h4 class="group-title">🏆 ${escapeHtml(sport)}</h4>
          <span class="group-badge">${matches.length} match${matches.length !== 1 ? 'es' : ''}</span>
        </div>
        <table style="margin-bottom: 20px;">
          <thead>
            <tr>
              <th style="width: 80px;">Game #</th>
              <th>Match</th>
              <th>Tournament</th>
              <th>Date & Time</th>
              <th>Venue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${matches.map(m => `
              <tr>
                <td>
                  <span style="display: inline-block; padding: 4px 10px; background: #dbeafe; color: #1e40af; border-radius: 6px; font-weight: 700; font-size: 13px;">
                    #${m.game_no || 'N/A'}
                  </span>
                </td>
                <td><strong>${escapeHtml(m.team_a_name || 'TBD')} vs ${escapeHtml(m.team_b_name || 'TBD')}</strong></td>
                <td>${escapeHtml(m.tour_name || 'N/A')}</td>
                <td>${escapeHtml(m.sked_date)} ${escapeHtml(m.sked_time)}</td>
                <td>${escapeHtml(m.venue_name || 'N/A')}</td>
                <td>
                  <button class="btn btn-sm btn-secondary" onclick="editMatch(${m.match_id})">Edit</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteMatch(${m.match_id})">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    });
    
    content.innerHTML = html;
    console.log('✅ Matches loaded:', data.length);
  } catch (err) {
    console.error('❌ loadMatches error:', err);
  }
}

function showMatchModal() {
  alert('Match scheduling - to be implemented');
}

function editMatch(id) {
  alert('Edit match - to be implemented');
}

async function deleteMatch(id) {
  if (!confirm('Delete this match?')) return;
  
  const result = await fetchAPI('delete_match', { match_id: id }, 'POST');
  
  if (result && result.ok) {
    loadMatches();
  }
}

// ==========================================
// TRAINING
// ==========================================
async function loadTraining() {
  try {
    const params = {};
    if (currentFilters.sport) params.sport_id = currentFilters.sport;
    if (currentFilters.team) params.team_id = currentFilters.team;
    
    const data = await fetchAPI('training', params);
    const content = $('#trainingContent');
    
    if (!data || data.length === 0) {
      content.innerHTML = '<div class="empty-state">No training sessions scheduled.</div>';
      return;
    }
    
    // Group training by sport (or by team if sport is not available)
    const grouped = {};
    data.forEach(t => {
      // Try to get sport name, fall back to team name as grouping
      let groupKey = t.sports_name || null;
      
      // If no sport name, try to group by team instead
      if (!groupKey && t.team_name) {
        groupKey = `Team: ${t.team_name}`;
      } else if (!groupKey) {
        groupKey = 'General Training';
      }
      
      if (!grouped[groupKey]) grouped[groupKey] = [];
      grouped[groupKey].push(t);
    });
    
    let html = '';
    
    // Render each sport group
    Object.keys(grouped).sort().forEach(groupName => {
      const sessions = grouped[groupName];
      html += `
        <div class="group-header">
          <h4 class="group-title">🏃 ${escapeHtml(groupName)}</h4>
          <span class="group-badge">${sessions.length} session${sessions.length !== 1 ? 's' : ''}</span>
        </div>
        <table style="margin-bottom: 20px;">
          <thead>
            <tr>
              <th>Team</th>
              <th>Date & Time</th>
              <th>Venue</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${sessions.map(t => `
              <tr>
                <td><strong>${escapeHtml(t.team_name || 'N/A')}</strong></td>
                <td>${escapeHtml(t.sked_date)} ${escapeHtml(t.sked_time)}</td>
                <td>${escapeHtml(t.venue_name || 'N/A')}</td>
                <td><span class="badge badge-${t.is_active == 1 ? 'active' : 'inactive'}">${t.is_active == 1 ? 'Active' : 'Cancelled'}</span></td>
                <td>

  ${t.is_active == 1 ? `
    <button class="btn btn-sm btn-danger" onclick="cancelTraining(${t.sked_id})">Cancel</button>
  ` : `
    <button class="btn btn-sm btn-success" onclick="undoTrainingCancellation(${t.sked_id})">Undo</button>
  `}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    });
    
    content.innerHTML = html;
    console.log('✅ Training loaded:', data.length);
  } catch (err) {
    console.error('❌ loadTraining error:', err);
  }
}

function showTrainingModal() {
  alert('Training scheduling - to be implemented');
}

// ==========================================
// CANCEL TRAINING
// ==========================================
async function cancelTraining(id) {
  if (!confirm('Cancel this training session?')) return;
  
  try {
    const result = await fetchAPI('delete_training', { sked_id: id }, 'POST');
    
    if (result && result.ok) {
      showToast('✅ Training session cancelled', 'success');
      loadTraining();
    } else {
      showToast('❌ Error: ' + (result?.error || 'Failed to cancel training'), 'error');
    }
  } catch (error) {
    console.error('Error cancelling training:', error);
    showToast('❌ Error cancelling training', 'error');
  }
}

// ==========================================
// UNDO TRAINING CANCELLATION
// ==========================================
async function undoTrainingCancellation(id) {
  try {
    const result = await fetchAPI('reactivate_training', { sked_id: id }, 'POST');
    
    if (result && result.ok) {
      showToast('✅ Training session restored', 'success');
      loadTraining();
    } else {
      showToast('❌ Error: ' + (result?.error || 'Failed to restore training'), 'error');
    }
  } catch (error) {
    console.error('Error restoring training:', error);
    showToast('❌ Error restoring training', 'error');
  }
}

// ==========================================
// TRAINING FUNCTIONS
// Replace/add in director.js around line 2780
// ==========================================

async function editTraining(id) {
  try {
    // Fetch all training sessions
    const params = {};
    if (currentFilters.sport) params.sport_id = currentFilters.sport;
    if (currentFilters.team) params.team_id = currentFilters.team;
    
    const data = await fetchAPI('training', params);
    const training = data.find(t => t.sked_id == id);
    
    if (training) {
      // Call the function from director_modals.js
      showTrainingModal(training);
    } else {
      showToast('❌ Training session not found', 'error');
    }
  } catch (error) {
    console.error('Error loading training:', error);
    showToast('❌ Error loading training session', 'error');
  }
}

async function deleteTraining(id) {
  if (!confirm('Cancel this training session?')) return;
  
  try {
    const result = await fetchAPI('delete_training', { sked_id: id }, 'POST');
    
    if (result && result.ok) {
      showToast('✅ Training session cancelled', 'success');
      loadTraining();
    } else {
      showToast('❌ Error: ' + (result?.error || 'Failed to cancel training'), 'error');
    }
  } catch (error) {
    console.error('Error cancelling training:', error);
    showToast('❌ Error cancelling training', 'error');
  }
}

// ==========================================
// STANDINGS
// ==========================================
async function loadStandings() {
  try {
    const params = {};
    if (currentFilters.sport) params.sport_id = currentFilters.sport;
    if (currentFilters.tournament) params.tour_id = currentFilters.tournament;
    
    const data = await fetchAPI('standings', params);
    const content = $('#standingsContent');
    
    if (!data || data.length === 0) {
      content.innerHTML = '<div class="empty-state">No standings data available</div>';
      return;
    }
    
    const grouped = {};
    data.forEach(s => {
      const sport = s.sports_name || 'Unknown Sport';
      if (!grouped[sport]) grouped[sport] = [];
      grouped[sport].push(s);
    });
    
    let html = '';
    Object.keys(grouped).sort().forEach(sport => {
      const standings = grouped[sport];
      html += `
        <div class="group-header">
          <h4 class="group-title">${escapeHtml(sport)}</h4>
          <span class="group-badge">Top ${standings.length}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team</th>
              <th>Played</th>
              <th>Won</th>
              <th>Lost</th>
              <th>Medals</th>
            </tr>
          </thead>
          <tbody>
            ${standings.map((s, idx) => `
              <tr>
                <td><strong>${idx + 1}</strong></td>
                <td>${escapeHtml(s.team_name)}</td>
                <td>${s.no_games_played || 0}</td>
                <td>${s.no_win || 0}</td>
                <td>${s.no_loss || 0}</td>
                <td>🥇${s.no_gold || 0} 🥈${s.no_silver || 0} 🥉${s.no_bronze || 0}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    });
    
    content.innerHTML = html;
    console.log('✅ Standings loaded:', data.length);
  } catch (err) {
    console.error('❌ loadStandings error:', err);
  }
}

// Add these functions to director.js or create a new file

// ==========================================
// COLLEGES VIEW
// ==========================================
async function loadColleges() {
  try {
    const data = await fetchAPI('get_colleges');
    const content = $('#collegesContent');
    
    if (!data || data.length === 0) {
      content.innerHTML = '<div class="empty-state">No colleges found. Click "Add College" to create one.</div>';
      return;
    }
    
    let html = '<div class="data-grid">';
    data.forEach(c => {
      const statusClass = c.is_active == 1 ? 'active' : 'inactive';
      const statusText = c.is_active == 1 ? 'Active' : 'Inactive';
      
      html += `
        <div class="data-card">
          <div class="data-card-header">
            <div class="data-card-title">${escapeHtml(c.college_name)}</div>
            <span class="badge badge-${statusClass}">${statusText}</span>
          </div>
          <div class="data-card-meta">
            📋 Code: ${escapeHtml(c.college_code)}<br>
            👤 Dean: ${escapeHtml(c.college_dean || 'Not assigned')}<br>
            🏢 ${c.dept_count || 0} department${c.dept_count !== 1 ? 's' : ''}<br>
            👥 ${c.student_count || 0} student${c.student_count !== 1 ? 's' : ''}
          </div>
          ${c.description ? `<div style="font-size: 12px; color: #6b7280; margin-top: 8px; font-style: italic;">${escapeHtml(c.description)}</div>` : ''}
          <div class="data-card-actions">
            <button class="btn btn-sm btn-secondary" onclick="editCollege(${c.college_id})">✏️ Edit</button>
            <button class="btn btn-sm btn-${c.is_active == 1 ? 'danger' : 'success'}" 
                    onclick="toggleCollege(${c.college_id}, ${c.is_active})">
              ${c.is_active == 1 ? '❌ Deactivate' : '✅ Activate'}
            </button>
          </div>
        </div>
      `;
    });
    html += '</div>';
    
    content.innerHTML = html;
    console.log('✅ Colleges loaded:', data.length);
  } catch (err) {
    console.error('❌ loadColleges error:', err);
  }
}

function showCollegeModal(id = null) {
  const isEdit = id !== null;
  const title = isEdit ? 'Edit College' : 'Add College';
  
  const modalHTML = `
    <div class="modal active" id="collegeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <form id="collegeForm" onsubmit="saveCollege(event, ${id})">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">College Code *</label>
              <input type="text" class="form-control" id="college_code" placeholder="e.g., CAS, CEIT" required maxlength="10" style="text-transform: uppercase;">
              <small style="color: #6b7280; font-size: 11px; display: block; margin-top: 4px;">
                Short code to identify the college (will be converted to uppercase)
              </small>
            </div>
            
            <div class="form-group">
              <label class="form-label">College Name *</label>
              <input type="text" class="form-control" id="college_name" placeholder="e.g., College of Arts and Sciences" required>
            </div>
            
            <div class="form-group">
              <label class="form-label">College Dean</label>
              <input type="text" class="form-control" id="college_dean" placeholder="Dean's name">
            </div>
            
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-control" id="description" rows="3" placeholder="Brief description of the college"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">
              ${isEdit ? '💾 Update' : '➕ Create'} College
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  $('#modalContainer').innerHTML = modalHTML;
  
  if (isEdit) {
    loadCollegeData(id);
  }
}

async function loadCollegeData(id) {
  const data = await fetchAPI('get_colleges');
  const college = data.find(c => c.college_id == id);
  
  if (college) {
    $('#college_code').value = college.college_code || '';
    $('#college_name').value = college.college_name || '';
    $('#college_dean').value = college.college_dean || '';
    $('#description').value = college.description || '';
  }
}

async function saveCollege(e, id) {
  e.preventDefault();
  
  const data = {
    college_code: $('#college_code').value.trim().toUpperCase(),
    college_name: $('#college_name').value.trim(),
    college_dean: $('#college_dean').value.trim(),
    description: $('#description').value.trim()
  };
  
  if (id) data.college_id = id;
  
  const action = id ? 'update_college' : 'create_college';
  const result = await fetchAPI(action, data, 'POST');
  
  if (result && result.ok) {
    closeModal();
    loadColleges();
    showToast(id ? '✅ College updated!' : '✅ College created!', 'success');
  } else {
    showToast('❌ Error: ' + (result?.error || 'Unknown error'), 'error');
  }
}

async function toggleCollege(id, currentStatus) {
  const newStatus = currentStatus == 1 ? 0 : 1;
  const result = await fetchAPI('toggle_college', { college_id: id, is_active: newStatus }, 'POST');
  
  if (result && result.ok) {
    loadColleges();
    showToast('✅ College status updated', 'success');
  }
}

function editCollege(id) {
  showCollegeModal(id);
}

// ==========================================
// DEPARTMENTS VIEW
// ==========================================
async function loadDepartments() {
  try {
    const data = await fetchAPI('get_departments');
    const content = $('#departmentsContent');
    
    if (!data || data.length === 0) {
      content.innerHTML = '<div class="empty-state">No departments found. Click "Add Department" to create one.</div>';
      return;
    }
    
    // Group by college
    const grouped = {};
    data.forEach(d => {
      const college = d.college_name || 'Unassigned';
      if (!grouped[college]) grouped[college] = [];
      grouped[college].push(d);
    });
    
    let html = '';
    Object.keys(grouped).sort().forEach(college => {
      const depts = grouped[college];
      html += `
        <div class="group-header">
          <h4 class="group-title">🏢 ${escapeHtml(college)}</h4>
          <span class="group-badge">${depts.length} department${depts.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="data-grid">
          ${depts.map(d => {
            const statusClass = d.is_active == 1 ? 'active' : 'inactive';
            const statusText = d.is_active == 1 ? 'Active' : 'Inactive';
            
            return `
              <div class="data-card">
                <div class="data-card-header">
                  <div class="data-card-title">${escapeHtml(d.dept_name)}</div>
                  <span class="badge badge-${statusClass}">${statusText}</span>
                </div>
                <div class="data-card-meta">
                  📋 Code: ${escapeHtml(d.dept_code)}<br>
                  👤 Head: ${escapeHtml(d.dept_head || 'Not assigned')}<br>
                  📚 ${d.course_count || 0} course${d.course_count !== 1 ? 's' : ''}
                </div>
                ${d.description ? `<div style="font-size: 12px; color: #6b7280; margin-top: 8px; font-style: italic;">${escapeHtml(d.description)}</div>` : ''}
                <div class="data-card-actions">
                  <button class="btn btn-sm btn-secondary" onclick="editDepartment(${d.dept_id})">✏️ Edit</button>
                  <button class="btn btn-sm btn-${d.is_active == 1 ? 'danger' : 'success'}" 
                          onclick="toggleDepartment(${d.dept_id}, ${d.is_active})">
                    ${d.is_active == 1 ? '❌ Deactivate' : '✅ Activate'}
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    });
    
    content.innerHTML = html;
    console.log('✅ Departments loaded:', data.length);
  } catch (err) {
    console.error('❌ loadDepartments error:', err);
  }
}

async function showDepartmentModal(id = null) {
  const isEdit = id !== null;
  const title = isEdit ? 'Edit Department' : 'Add Department';
  
  const colleges = await fetchAPI('get_colleges');
  
  const modalHTML = `
    <div class="modal active" id="departmentModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <form id="departmentForm" onsubmit="saveDepartment(event, ${id})">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">College *</label>
              <select class="form-control" id="college_id" required>
                <option value="">Select College</option>
                ${colleges.filter(c => c.is_active == 1).map(c => 
                  `<option value="${c.college_id}">${escapeHtml(c.college_name)} (${escapeHtml(c.college_code)})</option>`
                ).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Department Code *</label>
              <input type="text" class="form-control" id="dept_code" placeholder="e.g., CS, IT, MATH" required maxlength="10" style="text-transform: uppercase;">
              <small style="color: #6b7280; font-size: 11px; display: block; margin-top: 4px;">
                Short code to identify the department (will be converted to uppercase)
              </small>
            </div>
            
            <div class="form-group">
              <label class="form-label">Department Name *</label>
              <input type="text" class="form-control" id="dept_name" placeholder="e.g., Computer Science Department" required>
            </div>
            
            <div class="form-group">
              <label class="form-label">Department Head</label>
              <input type="text" class="form-control" id="dept_head" placeholder="Department head's name">
            </div>
            
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-control" id="dept_description" rows="3" placeholder="Brief description of the department"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">
              ${isEdit ? '💾 Update' : '➕ Create'} Department
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  $('#modalContainer').innerHTML = modalHTML;
  
  if (isEdit) {
    loadDepartmentData(id);
  }
}

async function loadDepartmentData(id) {
  const data = await fetchAPI('get_departments');
  const dept = data.find(d => d.dept_id == id);
  
  if (dept) {
    $('#college_id').value = dept.college_id || '';
    $('#dept_code').value = dept.dept_code || '';
    $('#dept_name').value = dept.dept_name || '';
    $('#dept_head').value = dept.dept_head || '';
    $('#dept_description').value = dept.description || '';
  }
}

async function saveDepartment(e, id) {
  e.preventDefault();
  
  const data = {
    college_id: $('#college_id').value,
    dept_code: $('#dept_code').value.trim().toUpperCase(),
    dept_name: $('#dept_name').value.trim(),
    dept_head: $('#dept_head').value.trim(),
    description: $('#dept_description').value.trim()
  };
  
  if (id) data.dept_id = id;
  
  const action = id ? 'update_department' : 'create_department';
  const result = await fetchAPI(action, data, 'POST');
  
  if (result && result.ok) {
    closeModal();
    loadDepartments();
    showToast(id ? '✅ Department updated!' : '✅ Department created!', 'success');
  } else {
    showToast('❌ Error: ' + (result?.error || 'Unknown error'), 'error');
  }
}

async function toggleDepartment(id, currentStatus) {
  const newStatus = currentStatus == 1 ? 0 : 1;
  const result = await fetchAPI('toggle_department', { dept_id: id, is_active: newStatus }, 'POST');
  
  if (result && result.ok) {
    loadDepartments();
    showToast('✅ Department status updated', 'success');
  }
}

function editDepartment(id) {
  showDepartmentModal(id);
}

// ==========================================
// COURSES VIEW
// ==========================================
async function loadCourses() {
  try {
    const data = await fetchAPI('get_courses');
    const content = $('#coursesContent');
    
    if (!data || data.length === 0) {
      content.innerHTML = '<div class="empty-state">No courses found. Click "Add Course" to create one.</div>';
      return;
    }
    
    // Group by college and department
    const grouped = {};
    data.forEach(c => {
      const college = c.college_name || 'Unassigned';
      if (!grouped[college]) grouped[college] = {};
      
      const dept = c.dept_name || 'Unassigned';
      if (!grouped[college][dept]) grouped[college][dept] = [];
      
      grouped[college][dept].push(c);
    });
    
    let html = '';
    Object.keys(grouped).sort().forEach(college => {
      html += `<div style="margin-bottom: 24px;">`;
      html += `<h3 style="font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">🏢 ${escapeHtml(college)}</h3>`;
      
      Object.keys(grouped[college]).sort().forEach(dept => {
        const courses = grouped[college][dept];
        html += `
          <div class="group-header">
            <h4 class="group-title">📚 ${escapeHtml(dept)}</h4>
            <span class="group-badge">${courses.length} course${courses.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="data-grid">
            ${courses.map(c => `
              <div class="data-card">
                <div class="data-card-header">
                  <div class="data-card-title">${escapeHtml(c.course_name)}</div>
                </div>
                <div class="data-card-meta">
                  📋 Code: ${escapeHtml(c.course_code)}<br>
                  ${c.course_type ? `🎓 Type: ${escapeHtml(c.course_type)}<br>` : ''}
                  ${c.num_years ? `⏱️ Duration: ${c.num_years} year${c.num_years !== 1 ? 's' : ''}<br>` : ''}
                </div>
                ${c.description ? `<div style="font-size: 12px; color: #6b7280; margin-top: 8px; font-style: italic;">${escapeHtml(c.description)}</div>` : ''}
                <div class="data-card-actions">
                  <button class="btn btn-sm btn-secondary" onclick="editCourse(${c.course_id})">✏️ Edit</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteCourse(${c.course_id})">🗑️ Delete</button>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      });
      
      html += `</div>`;
    });
    
    content.innerHTML = html;
    console.log('✅ Courses loaded:', data.length);
  } catch (err) {
    console.error('❌ loadCourses error:', err);
  }
}

async function showCourseModal(id = null) {
  const isEdit = id !== null;
  const title = isEdit ? 'Edit Course' : 'Add Course';
  
  const colleges = await fetchAPI('get_colleges');
  const departments = await fetchAPI('get_departments');
  
  const modalHTML = `
    <div class="modal active" id="courseModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <form id="courseForm" onsubmit="saveCourse(event, ${id})">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">College *</label>
              <select class="form-control" id="course_college_id" required onchange="filterDepartmentsByCollege()">
                <option value="">Select College</option>
                ${colleges.filter(c => c.is_active == 1).map(c => 
                  `<option value="${c.college_id}">${escapeHtml(c.college_name)} (${escapeHtml(c.college_code)})</option>`
                ).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Department *</label>
              <select class="form-control" id="dept_id" required disabled>
                <option value="">Select College first</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Course Code *</label>
              <input type="text" class="form-control" id="course_code" placeholder="e.g., BSIT, BSCS, BSN" required maxlength="20" style="text-transform: uppercase;">
              <small style="color: #6b7280; font-size: 11px; display: block; margin-top: 4px;">
                Short code to identify the course (will be converted to uppercase)
              </small>
            </div>
            
            <div class="form-group">
              <label class="form-label">Course Name *</label>
              <input type="text" class="form-control" id="course_name" placeholder="e.g., Bachelor of Science in Information Technology" required>
            </div>
            
            <div class="form-group">
              <label class="form-label">Course Type</label>
              <select class="form-control" id="course_type">
                <option value="">Select Type</option>
                <option value="Bachelor">Bachelor's Degree</option>
                <option value="Master">Master's Degree</option>
                <option value="Doctorate">Doctorate Degree</option>
                <option value="Diploma">Diploma</option>
                <option value="Certificate">Certificate</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Number of Years</label>
              <input type="number" class="form-control" id="num_years" min="1" max="10" placeholder="e.g., 4">
            </div>
            
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-control" id="course_description" rows="3" placeholder="Brief description of the course"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">
              ${isEdit ? '💾 Update' : '➕ Create'} Course
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  $('#modalContainer').innerHTML = modalHTML;
  
  // Store departments data for filtering
  window.allDepartments = departments;
  
  if (isEdit) {
    loadCourseData(id);
  }
}

async function filterDepartmentsByCollege() {
  const collegeId = $('#course_college_id').value;
  const deptSelect = $('#dept_id');
  
  if (!collegeId) {
    deptSelect.disabled = true;
    deptSelect.innerHTML = '<option value="">Select College first</option>';
    return;
  }
  
  const filteredDepts = window.allDepartments.filter(d => d.college_id == collegeId && d.is_active == 1);
  
  if (filteredDepts.length === 0) {
    deptSelect.innerHTML = '<option value="">No departments in this college</option>';
    deptSelect.disabled = true;
    showToast('⚠️ No active departments in this college', 'warning');
    return;
  }
  
  deptSelect.innerHTML = '<option value="">Select Department</option>' +
    filteredDepts.map(d => `<option value="${d.dept_id}">${escapeHtml(d.dept_name)} (${escapeHtml(d.dept_code)})</option>`).join('');
  deptSelect.disabled = false;
}

async function loadCourseData(id) {
  const data = await fetchAPI('get_courses');
  const course = data.find(c => c.course_id == id);
  
  if (course) {
    // Get department to find college
    const depts = await fetchAPI('get_departments');
    const dept = depts.find(d => d.dept_id == course.dept_id);
    
    if (dept) {
      $('#course_college_id').value = dept.college_id;
      await filterDepartmentsByCollege();
    }
    
    $('#dept_id').value = course.dept_id || '';
    $('#course_code').value = course.course_code || '';
    $('#course_name').value = course.course_name || '';
    $('#course_type').value = course.course_type || '';
    $('#num_years').value = course.num_years || '';
    $('#course_description').value = course.description || '';
  }
}

async function saveCourse(e, id) {
  e.preventDefault();
  
  const data = {
    dept_id: $('#dept_id').value,
    course_code: $('#course_code').value.trim().toUpperCase(),
    course_name: $('#course_name').value.trim(),
    course_type: $('#course_type').value,
    num_years: $('#num_years').value || null,
    description: $('#course_description').value.trim()
  };
  
  if (id) data.course_id = id;
  
  const action = id ? 'update_course' : 'create_course';
  const result = await fetchAPI(action, data, 'POST');
  
  if (result && result.ok) {
    closeModal();
    loadCourses();
    showToast(id ? '✅ Course updated!' : '✅ Course created!', 'success');
  } else {
    showToast('❌ Error: ' + (result?.error || 'Unknown error'), 'error');
  }
}

async function deleteCourse(id) {
  if (!confirm('⚠️ Delete this course? This action cannot be undone.')) return;
  
  const result = await fetchAPI('delete_course', { course_id: id }, 'POST');
  
  if (result && result.ok) {
    loadCourses();
    showToast('✅ Course deleted', 'success');
  } else {
    showToast('❌ Error deleting course', 'error');
  }
}

function editCourse(id) {
  showCourseModal(id);
}

console.log('✅ Academic management functions loaded');

// Add these functions to director.js

// ==========================================
// EQUIPMENT MANAGEMENT
// ==========================================

async function loadEquipment() {
  try {
    const data = await fetchAPI('get_equipment');
    const content = $('#equipmentContent');
    
    if (!data || data.length === 0) {
      content.innerHTML = '<div class="empty-state">No equipment found. Click "Add Equipment" to add your first item.</div>';
      return;
    }
    
    // Group by sport
    const grouped = {};
    data.forEach(e => {
      const sport = e.sports_name || 'General Equipment';
      if (!grouped[sport]) grouped[sport] = [];
      grouped[sport].push(e);
    });
    
    let html = '';
    
    // Color palette for different sports
    const sportColors = [
      { bg: '#fef3c7', border: '#fbbf24', text: '#92400e', icon: '🏀' },  // Basketball yellow
      { bg: '#dbeafe', border: '#3b82f6', text: '#1e3a8a', icon: '🏐' },  // Volleyball blue
      { bg: '#fecaca', border: '#ef4444', text: '#7f1d1d', icon: '⚽' },  // Soccer red
      { bg: '#d1fae5', border: '#10b981', text: '#065f46', icon: '🎾' },  // Tennis green
      { bg: '#e9d5ff', border: '#a855f7', text: '#581c87', icon: '🏓' },  // Table Tennis purple
      { bg: '#fed7aa', border: '#f97316', text: '#7c2d12', icon: '🏈' },  // Football orange
      { bg: '#fbcfe8', border: '#ec4899', text: '#831843', icon: '🏸' },  // Badminton pink
      { bg: '#e0e7ff', border: '#6366f1', text: '#312e81', icon: '🥊' },  // Boxing indigo
      { bg: '#ccfbf1', border: '#14b8a6', text: '#134e4a', icon: '🏊' },  // Swimming teal
      { bg: '#e5e7eb', border: '#6b7280', text: '#1f2937', icon: '🏅' },  // General gray
    ];
    
    // Render each sport group
    Object.keys(grouped).sort().forEach((sport, index) => {
      const items = grouped[sport];
      const functional = items.filter(e => e.is_functional == 1);
      const nonFunctional = items.filter(e => e.is_functional == 0);
      
      // Assign color based on index (cycle through colors)
      const color = sportColors[index % sportColors.length];
      const isGeneral = sport === 'General Equipment';
      
      html += `
        <div style="
          background: ${color.bg}; 
          border: 3px solid ${color.border}; 
          border-radius: 16px; 
          padding: 24px; 
          margin-bottom: 32px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        ">
          <!-- Sport Header -->
          <div style="
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
            margin-bottom: 20px;
            padding-bottom: 16px;
            border-bottom: 2px solid ${color.border};
          ">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="
                font-size: 40px; 
                background: white; 
                width: 64px; 
                height: 64px; 
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid ${color.border};
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              ">
                ${color.icon}
              </div>
              <div>
                <h3 style="
                  margin: 0; 
                  font-size: 24px; 
                  font-weight: 700; 
                  color: ${color.text};
                ">
                  ${escapeHtml(sport)}
                </h3>
                <div style="
                  font-size: 14px; 
                  color: ${color.text}; 
                  opacity: 0.8; 
                  margin-top: 4px;
                ">
                  ${items.length} item${items.length !== 1 ? 's' : ''} total
                  ${functional.length > 0 ? ` • ${functional.length} functional` : ''}
                  ${nonFunctional.length > 0 ? ` • ${nonFunctional.length} broken` : ''}
                </div>
              </div>
            </div>
            
            <!-- Summary Badges -->
            <div style="display: flex; gap: 12px; align-items: center;">
              ${functional.length > 0 ? `
                <div style="
                  background: white;
                  padding: 8px 16px;
                  border-radius: 8px;
                  border: 2px solid #10b981;
                  font-weight: 600;
                  color: #065f46;
                  font-size: 14px;
                ">
                  ✅ ${functional.length} Working
                </div>
              ` : ''}
              ${nonFunctional.length > 0 ? `
                <div style="
                  background: white;
                  padding: 8px 16px;
                  border-radius: 8px;
                  border: 2px solid #ef4444;
                  font-weight: 600;
                  color: #7f1d1d;
                  font-size: 14px;
                ">
                  ⚠️ ${nonFunctional.length} Broken
                </div>
              ` : ''}
            </div>
          </div>
          
          <!-- Functional Equipment -->
          ${functional.length > 0 ? `
            <div style="margin-bottom: ${nonFunctional.length > 0 ? '24px' : '0'};">
              <div style="
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 16px;
                padding: 8px 12px;
                background: rgba(16, 185, 129, 0.1);
                border-left: 4px solid #10b981;
                border-radius: 6px;
              ">
                <span style="font-size: 20px;">✅</span>
                <span style="font-weight: 600; color: #065f46; font-size: 15px;">
                  Functional Equipment (${functional.length})
                </span>
              </div>
              <div class="data-grid">
                ${functional.map(e => renderEquipmentCard(e, color.border)).join('')}
              </div>
            </div>
          ` : ''}
          
          <!-- Non-Functional Equipment -->
          ${nonFunctional.length > 0 ? `
            <div>
              <div style="
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 16px;
                padding: 8px 12px;
                background: rgba(239, 68, 68, 0.1);
                border-left: 4px solid #ef4444;
                border-radius: 6px;
              ">
                <span style="font-size: 20px;">⚠️</span>
                <span style="font-weight: 600; color: #7f1d1d; font-size: 15px;">
                  Non-Functional / Needs Repair (${nonFunctional.length})
                </span>
              </div>
              <div class="data-grid">
                ${nonFunctional.map(e => renderEquipmentCard(e, color.border)).join('')}
              </div>
            </div>
          ` : ''}
          
        </div>
      `;
    });
    
    content.innerHTML = html;
    console.log('✅ Equipment loaded:', data.length);
  } catch (err) {
    console.error('❌ loadEquipment error:', err);
  }
}

function renderEquipmentCard(e, borderColor = '#e5e7eb') {
  const statusClass = e.is_functional == 1 ? 'active' : 'inactive';
  const statusText = e.is_functional == 1 ? 'Functional' : 'Non-Functional';
  const currentStock = e.current_stock ?? e.quantity ?? 0;
  const stockClass = currentStock > 10 ? 'success' : currentStock > 0 ? 'warning' : 'danger';
  
  return `
    <div class="data-card" style="border-left: 4px solid ${borderColor};">
      <div class="equipment-image" style="width: 100%; height: 180px; background: #f3f4f6; border-radius: 8px; margin-bottom: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
        ${e.image_url ? 
          `<img src="${escapeHtml(e.image_url)}" alt="${escapeHtml(e.equip_name)}" style="width: 100%; height: 100%; object-fit: cover;">` :
          `<div style="color: #9ca3af; font-size: 48px;">📦</div>`
        }
      </div>
      <div class="data-card-header">
        <div class="data-card-title">${escapeHtml(e.equip_name)}</div>
        <span class="badge badge-${statusClass}">${statusText}</span>
      </div>
      <div class="data-card-meta">
        📅 Acquired: ${escapeHtml(e.date_acquired || 'N/A')}<br>
        📊 Stock: <span class="badge badge-${stockClass}">${currentStock}</span><br>
        🔄 ${e.transaction_count || 0} transaction${e.transaction_count !== 1 ? 's' : ''}
      </div>
      ${e.description ? `<div style="font-size: 12px; color: #6b7280; margin-top: 8px; font-style: italic;">${escapeHtml(e.description)}</div>` : ''}
      <div class="data-card-actions">
        <button class="btn btn-sm btn-primary" onclick="viewEquipmentDetail(${e.equip_id})">📋 Details</button>
        <button class="btn btn-sm btn-success" onclick="showInventoryTransactionModal(${e.equip_id}, 'in')">➕ Stock In</button>
        <button class="btn btn-sm btn-warning" onclick="showInventoryTransactionModal(${e.equip_id}, 'out')">➖ Stock Out</button>
        <button class="btn btn-sm btn-secondary" onclick="editEquipment(${e.equip_id})">✏️ Edit</button>
        <button class="btn btn-sm btn-${e.is_functional == 1 ? 'danger' : 'success'}" 
                onclick="toggleEquipmentStatus(${e.equip_id}, ${e.is_functional})">
          ${e.is_functional == 1 ? '❌ Mark Broken' : '✅ Mark Fixed'}
        </button>
      </div>
    </div>
  `;
}

async function showEquipmentModal(equipId = null) {
  const isEdit = equipId !== null;
  let equipment = null;
  
  // Get current user info
  const currentUserId = window.DIRECTOR_CONTEXT.person_id;
  const currentUserName = window.DIRECTOR_CONTEXT.full_name || 'Current User';
  
  // Fetch sports list for dropdown
  const sports = await fetchAPI('sports');
  
  if (isEdit) {
    const data = await fetchAPI('get_equipment');
    equipment = data.find(e => e.equip_id == equipId);
  }
  
  const modal = `
    <div class="modal active" id="equipmentModal">
      <div class="modal-content" style="max-width: 700px;">
        <div class="modal-header">
          <h3>${isEdit ? '✏️ Edit Equipment' : '➕ Add New Equipment'}</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <form onsubmit="saveEquipment(event, ${equipId})" id="equipmentForm" enctype="multipart/form-data">
          <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
            
            <!-- Equipment Image -->
            <h4 class="modal-section-title">📷 Equipment Image</h4>
            
            <div class="form-group">
              <label class="form-label">Equipment Photo</label>
              <div id="imagePreviewContainer" style="margin-bottom: 12px;">
                ${equipment?.image_url ? 
                  `<div style="position: relative; display: inline-block;">
                    <img id="imagePreview" src="${equipment.image_url}" style="max-width: 100%; max-height: 300px; border-radius: 8px; border: 2px solid #e5e7eb;">
                    <button type="button" onclick="removeImage()" style="position: absolute; top: 8px; right: 8px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-weight: bold;">×</button>
                  </div>` :
                  `<img id="imagePreview" style="max-width: 100%; max-height: 300px; border-radius: 8px; border: 2px solid #e5e7eb; display: none;">`
                }
              </div>
              <input type="file" class="form-control" name="equip_image" id="equip_image" accept="image/*" onchange="previewImage(event)">
              <small style="color: #6b7280; font-size: 11px; display: block; margin-top: 4px;">
                Upload a clear photo of the equipment for easy identification (JPG, PNG, GIF, WebP)
              </small>
              ${isEdit ? `<input type="hidden" name="current_image" value="${equipment?.equip_image || ''}">` : ''}
            </div>
            
            <!-- Basic Information -->
            <h4 class="modal-section-title">📋 Basic Information</h4>
            
            <div class="form-group">
              <label class="form-label">Equipment Name *</label>
              <input type="text" class="form-control" name="equip_name" value="${escapeHtml(equipment?.equip_name || '')}" placeholder="e.g., Basketball, Volleyball Net, Running Shoes" required autofocus>
            </div>
            
            <div class="form-group">
              <label class="form-label">Date Acquired *</label>
              <input type="date" class="form-control" name="date_acquired" value="${equipment?.date_acquired || ''}" required>
            </div>
            
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-control" name="description" rows="3" placeholder="Brand, model, specifications, or any other relevant details">${escapeHtml(equipment?.description || '')}</textarea>
            </div>
            
            <div class="form-group">
              <label class="form-label">Sport (Optional)</label>
              <select class="form-control" name="sports_id" id="sports_id">
                <option value="">General Equipment (All Sports)</option>
                ${sports.map(s => `
                  <option value="${s.sports_id}" ${equipment && equipment.sports_id == s.sports_id ? 'selected' : ''}>
                    ${escapeHtml(s.sports_name)}
                  </option>
                `).join('')}
              </select>
              <small style="color: #6b7280; font-size: 11px; display: block; margin-top: 4px;">
                Leave as "General Equipment" if this equipment is shared across all sports (e.g., First Aid Kit, Stopwatch)
              </small>
            </div>
            
            ${!isEdit ? `
              <!-- Initial Stock (only for new equipment) -->
              <h4 class="modal-section-title">📦 Initial Stock</h4>
              
              <div class="form-group">
                <label class="form-label">Initial Quantity</label>
                <input type="number" class="form-control" name="quantity" min="0" value="1" placeholder="0">
                <small style="color: #6b7280; font-size: 11px; display: block; margin-top: 4px;">
                  Enter the initial quantity you're adding to inventory
                </small>
              </div>
              
              <div class="form-group">
                <label class="form-label">Condition</label>
                <select class="form-control" name="condition">
                  <option value="Excellent">Excellent</option>
                  <option value="Good" selected>Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
              
              <!-- Hidden field for current user's person_id -->
              <input type="hidden" name="received_by" value="${currentUserId}">
              
              <!-- Display current user's name (read-only) -->
              <div class="form-group">
                <label class="form-label">Received By</label>
                <input type="text" class="form-control" value="${escapeHtml(currentUserName)}" readonly style="background: #f3f4f6; cursor: not-allowed;">
                <small style="color: #6b7280; font-size: 11px; display: block; margin-top: 4px;">
                  ✓ Automatically set to your account
                </small>
              </div>
            ` : ''}
            
            <!-- Status -->
            <h4 class="modal-section-title">⚙️ Status</h4>
            
            <div class="form-group">
              <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 12px; background: #f0fdf4; border-radius: 8px; border: 1px solid #86efac;">
                <input type="checkbox" name="is_functional" ${!equipment || equipment.is_functional == 1 ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer;">
                <div>
                  <div style="font-weight: 600; color: #065f46;">Functional Equipment</div>
                  <div style="font-size: 11px; color: #047857; margin-top: 2px;">Check if equipment is in working condition</div>
                </div>
              </label>
            </div>
            
            ${isEdit ? `<input type="hidden" name="equip_id" value="${equipId}">` : ''}
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">
              ${isEdit ? '💾 Update' : '➕ Add'} Equipment
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  $('#modalContainer').innerHTML = modal;
}

function previewImage(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const preview = document.getElementById('imagePreview');
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
}

function removeImage() {
  document.getElementById('imagePreview').style.display = 'none';
  document.getElementById('imagePreview').src = '';
  document.getElementById('equip_image').value = '';
  const currentImageInput = document.querySelector('input[name="current_image"]');
  if (currentImageInput) currentImageInput.value = '';
}

async function saveEquipment(event, equipId) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  
  // Add is_functional as 1 or 0
  formData.set('is_functional', form.is_functional.checked ? 1 : 0);
  
  try {
    const action = equipId ? 'update_equipment' : 'create_equipment';
    
    const response = await fetch(`api.php?action=${action}`, {
      method: 'POST',
      body: formData // Don't set Content-Type header, let browser set it with boundary
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const result = await response.json();
    
    if (result && result.ok !== false) {
      closeModal();
      loadEquipment();
      showToast(equipId ? '✅ Equipment updated successfully' : '✅ Equipment added successfully', 'success');
    } else {
      showToast('❌ Error: ' + (result?.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error saving equipment:', error);
    showToast('❌ Error saving equipment: ' + error.message, 'error');
  }
}

function editEquipment(equipId) {
  showEquipmentModal(equipId);
}

async function toggleEquipmentStatus(equipId, currentStatus) {
  const newStatus = currentStatus == 1 ? 0 : 1;
  const action = newStatus == 1 ? 'mark as functional' : 'mark as non-functional';
  
  if (!confirm(`Are you sure you want to ${action} this equipment?`)) return;
  
  const result = await fetchAPI('toggle_equipment_status', { equip_id: equipId, is_functional: newStatus }, 'POST');
  
  if (result && result.ok) {
    loadEquipment();
    showToast('✅ Equipment status updated', 'success');
  }
}

async function deleteEquipment(equipId) {
  if (!confirm('⚠️ Delete this equipment? This action cannot be undone.')) return;
  
  const result = await fetchAPI('delete_equipment', { equip_id: equipId }, 'POST');
  
  if (result && result.ok) {
    loadEquipment();
    showToast('✅ Equipment deleted', 'success');
  } else {
    showToast('❌ ' + (result?.error || 'Error deleting equipment'), 'error');
  }
}

// ==========================================
// EQUIPMENT DETAIL VIEW WITH TRANSACTIONS
// ==========================================

async function viewEquipmentDetail(equipId) {
  try {
    const data = await fetchAPI('get_equipment_detail', { equip_id: equipId });
    
    if (!data || !data.ok) {
      showToast('Error loading equipment details', 'error');
      return;
    }
    
    const equipment = data.equipment;
    const transactions = data.transactions || [];
    
    const modal = `
      <div class="modal active" id="equipmentDetailModal">
        <div class="modal-content" style="max-width: 900px; max-height: 90vh;">
          <div class="modal-header">
            <h3>📦 ${escapeHtml(equipment.equip_name)}</h3>
            <button class="modal-close" onclick="closeModal()">×</button>
          </div>
          <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
            
            <!-- Equipment Summary -->
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px; margin-bottom: 24px;">
              <div>
                ${equipment.image_url ? 
                  `<img src="${equipment.image_url}" style="width: 100%; border-radius: 12px; border: 2px solid #e5e7eb;">` :
                  `<div style="width: 100%; aspect-ratio: 1; background: #f3f4f6; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 64px;">📦</div>`
                }
              </div>
              <div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                  <div style="background: #f9fafb; padding: 14px; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px; font-weight: 600;">CURRENT STOCK</div>
                    <div style="font-size: 24px; font-weight: 700; color: ${equipment.current_stock > 10 ? '#059669' : equipment.current_stock > 0 ? '#d97706' : '#dc2626'};">${equipment.current_stock}</div>
                  </div>
                  <div style="background: #f9fafb; padding: 14px; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px; font-weight: 600;">STATUS</div>
                    <div style="font-size: 14px; font-weight: 600; color: ${equipment.is_functional == 1 ? '#059669' : '#dc2626'};">${equipment.is_functional == 1 ? '✅ Functional' : '❌ Non-Functional'}</div>
                  </div>
                  <div style="background: #f9fafb; padding: 14px; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px; font-weight: 600;">DATE ACQUIRED</div>
                    <div style="font-size: 14px; font-weight: 600; color: #111827;">${escapeHtml(equipment.date_acquired || 'N/A')}</div>
                  </div>
                  <div style="background: #f9fafb; padding: 14px; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px; font-weight: 600;">TRANSACTIONS</div>
                    <div style="font-size: 24px; font-weight: 700; color: #111827;">${transactions.length}</div>
                  </div>
                </div>
                ${equipment.description ? `
                  <div style="margin-top: 16px; padding: 12px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px; font-weight: 600;">DESCRIPTION</div>
                    <div style="font-size: 13px; color: #374151;">${escapeHtml(equipment.description)}</div>
                  </div>
                ` : ''}
              </div>
            </div>
            
            <!-- Quick Actions -->
            <div style="display: flex; gap: 8px; margin-bottom: 24px; padding: 16px; background: #f9fafb; border-radius: 8px;">
              <button class="btn btn-success" onclick="showInventoryTransactionModal(${equipment.equip_id}, 'in')">➕ Stock In</button>
              <button class="btn btn-warning" onclick="showInventoryTransactionModal(${equipment.equip_id}, 'out')">➖ Stock Out</button>
              <button class="btn btn-secondary" onclick="closeModal(); editEquipment(${equipment.equip_id})">✏️ Edit Equipment</button>
              <button class="btn btn-danger" onclick="closeModal(); deleteEquipment(${equipment.equip_id})">🗑️ Delete</button>
            </div>
            
            <!-- Transaction History -->
            <h4 style="font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">📊 Transaction History</h4>
            
            ${transactions.length === 0 ? 
              '<div class="empty-state">No transactions yet</div>' :
              `<table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Condition</th>
                    <th>Person</th>
                    <th>Processed By</th>
                  </tr>
                </thead>
                <tbody>
                  ${transactions.map(t => `
                    <tr>
                      <td>${escapeHtml(t.transdate)}</td>
                      <td>
                        <span class="badge badge-${t.trans_type === 'in' ? 'success' : 'warning'}">
                          ${t.trans_type === 'in' ? '➕ IN' : '➖ OUT'}
                        </span>
                      </td>
                      <td><strong>${t.quantity || 1}</strong></td>
                      <td>${escapeHtml(t.equip_cond || 'N/A')}</td>
                      <td>${escapeHtml(t.rec_rel_by || 'N/A')}</td>
                      <td>${escapeHtml(t.trans_by_name || 'System')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>`
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Close</button>
          </div>
        </div>
      </div>
    `;
    
    $('#modalContainer').innerHTML = modal;
  } catch (error) {
    console.error('Error loading equipment detail:', error);
    showToast('Error loading equipment details', 'error');
  }
}

// ==========================================
// INVENTORY TRANSACTION MODAL
// ==========================================

async function showInventoryTransactionModal(equipId, transType) {
  const equipment = await fetchAPI('get_equipment');
  const item = equipment.find(e => e.equip_id == equipId);
  
  // Get current user's person_id from session
  const currentUserId = window.DIRECTOR_CONTEXT.person_id;
  const currentUserName = window.DIRECTOR_CONTEXT.full_name || 'Current User';
  
  const modal = `
    <div class="modal active" id="transactionModal">
      <div class="modal-content modal-sm">
        <div class="modal-header">
          <h3>${transType === 'in' ? '➕ Stock In' : '➖ Stock Out'}</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <form onsubmit="saveInventoryTransaction(event, ${equipId}, '${transType}')" id="transactionForm">
          <div class="modal-body">
            <div style="background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #e5e7eb;">
              <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">${escapeHtml(item.equip_name)}</div>
              <div style="font-size: 12px; color: #6b7280;">Current Stock: <strong>${item.current_stock ?? item.quantity ?? 0}</strong></div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Quantity *</label>
              <input type="number" class="form-control" name="quantity" min="1" value="1" required autofocus>
            </div>
            
            <div class="form-group">
              <label class="form-label">Condition</label>
              <select class="form-control" name="equip_cond">
                <option value="Excellent">Excellent</option>
                <option value="Good" selected>Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
            
            <!-- Hidden field for current user's person_id -->
            <input type="hidden" name="rec_rel_by" value="${currentUserId}">
            
            <!-- Display current user's name (read-only) -->
            <div class="form-group">
              <label class="form-label">${transType === 'in' ? 'Received' : 'Released'} By</label>
              <input type="text" class="form-control" value="${escapeHtml(currentUserName)}" readonly style="background: #f3f4f6; cursor: not-allowed;">
              <small style="color: #6b7280; font-size: 11px; display: block; margin-top: 4px;">
                ✓ Automatically set to your account
              </small>
            </div>
            
            <div style="padding: 12px; background: ${transType === 'in' ? '#d1fae5' : '#fef3c7'}; border-radius: 6px; font-size: 12px; color: ${transType === 'in' ? '#065f46' : '#92400e'};">
              ${transType === 'in' ? 
                '📥 This will increase the stock quantity' : 
                '📤 This will decrease the stock quantity'
              }
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-${transType === 'in' ? 'success' : 'warning'}">
              ${transType === 'in' ? '➕ Add to Stock' : '➖ Remove from Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
const tempDiv = document.createElement('div');
tempDiv.innerHTML = modal;  // ✅ Use 'modal' instead of 'modalHTML'
document.body.appendChild(tempDiv.firstElementChild);
}

async function saveInventoryTransaction(event, equipId, transType) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  
  const data = {
    equip_id: equipId,
    trans_type: transType,
    quantity: formData.get('quantity'),
    equip_cond: formData.get('equip_cond'),
    rec_rel_by: formData.get('rec_rel_by') // This is now person_id, not a name
  };
  
  try {
    const result = await fetchAPI('add_inventory_transaction', data, 'POST');
    
    if (result && result.ok) {
      closeModal();
      
      // Reload equipment detail if it's open
      const detailModal = document.getElementById('equipmentDetailModal');
      if (detailModal) {
        await viewEquipmentDetail(equipId);
      } else {
        await loadEquipment();
      }
      
      showToast(`✅ Stock ${transType === 'in' ? 'added' : 'removed'} successfully`, 'success');
    } else {
      showToast('❌ Error: ' + (result?.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error saving transaction:', error);
    showToast('❌ Error saving transaction', 'error');
  }
}

console.log('✅ Equipment management functions loaded');

// ==========================================
// VENUES VIEW
// ==========================================
async function loadVenues() {
  try {
    const data = await fetchAPI('get_venues');
    const content = $('#venuesContent');
    
    if (!data || data.length === 0) {
      content.innerHTML = '<div class="empty-state">No venues found. Click "Add Venue" to create one.</div>';
      return;
    }
    
    let html = '<div class="data-grid">';
    data.forEach(v => {
      const statusClass = v.is_active == 1 ? 'active' : 'inactive';
      const statusText = v.is_active == 1 ? 'Active' : 'Inactive';
      
      html += `
        <div class="data-card">
          <div class="data-card-header">
            <div class="data-card-title">${escapeHtml(v.venue_name)}</div>
            <span class="badge badge-${statusClass}">${statusText}</span>
          </div>
          <div class="data-card-meta">
            ${v.venue_building ? `🏢 ${escapeHtml(v.venue_building)}` : ''}<br>
            ${v.venue_room ? `🚪 Room: ${escapeHtml(v.venue_room)}<br>` : ''}
            📅 ${v.match_count || 0} match${v.match_count !== 1 ? 'es' : ''}<br>
            🏋️ ${v.training_count || 0} training${v.training_count !== 1 ? 's' : ''}
          </div>
          ${v.venue_description ? `<div style="font-size: 12px; color: #6b7280; margin-top: 8px; font-style: italic;">${escapeHtml(v.venue_description)}</div>` : ''}
          <div class="data-card-actions">
            <button class="btn btn-sm btn-secondary" onclick="editVenue(${v.venue_id})">✏️ Edit</button>
            <button class="btn btn-sm btn-${v.is_active == 1 ? 'danger' : 'success'}" 
                    onclick="toggleVenue(${v.venue_id}, ${v.is_active})">
              ${v.is_active == 1 ? '❌ Deactivate' : '✅ Activate'}
            </button>
            ${v.match_count == 0 && v.training_count == 0 ? `
              <button class="btn btn-sm btn-danger" onclick="deleteVenue(${v.venue_id})">🗑️ Delete</button>
            ` : ''}
          </div>
        </div>
      `;
    });
    html += '</div>';
    
    content.innerHTML = html;
    console.log('✅ Venues loaded:', data.length);
  } catch (err) {
    console.error('❌ loadVenues error:', err);
  }
}

function showVenueModal(id = null) {
  const isEdit = id !== null;
  const title = isEdit ? 'Edit Venue' : 'Add Venue';
  
  const modalHTML = `
    <div class="modal active" id="venueModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <form id="venueForm" onsubmit="saveVenue(event, ${id})">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Venue Name *</label>
              <input type="text" class="form-control" id="venue_name" placeholder="e.g., Main Gymnasium, Swimming Pool" required autofocus>
              <small style="color: #6b7280; font-size: 11px; display: block; margin-top: 4px;">
                Enter a descriptive name for the venue
              </small>
            </div>
            
            <div class="form-group">
              <label class="form-label">Building</label>
              <input type="text" class="form-control" id="venue_building" placeholder="e.g., Sports Complex, PE Building">
              <small style="color: #6b7280; font-size: 11px; display: block; margin-top: 4px;">
                Building or facility name (optional)
              </small>
            </div>
            
            <div class="form-group">
              <label class="form-label">Room/Court Number</label>
              <input type="text" class="form-control" id="venue_room" placeholder="e.g., Court 1, Room 205">
              <small style="color: #6b7280; font-size: 11px; display: block; margin-top: 4px;">
                Specific room or court number (optional)
              </small>
            </div>
            
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-control" id="venue_description" rows="3" placeholder="Additional details about the venue, capacity, facilities, etc."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">
              ${isEdit ? '💾 Update' : '➕ Create'} Venue
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  $('#modalContainer').innerHTML = modalHTML;
  
  if (isEdit) {
    loadVenueData(id);
  }
}

async function loadVenueData(id) {
  const data = await fetchAPI('get_venues');
  const venue = data.find(v => v.venue_id == id);
  
  if (venue) {
    $('#venue_name').value = venue.venue_name || '';
    $('#venue_building').value = venue.venue_building || '';
    $('#venue_room').value = venue.venue_room || '';
    $('#venue_description').value = venue.venue_description || '';
  }
}

async function saveVenue(e, id) {
  e.preventDefault();
  
  const data = {
    venue_name: $('#venue_name').value.trim(),
    venue_building: $('#venue_building').value.trim(),
    venue_room: $('#venue_room').value.trim(),
    venue_description: $('#venue_description').value.trim()
  };
  
  if (id) data.venue_id = id;
  
  const action = id ? 'update_venue' : 'create_venue';
  const result = await fetchAPI(action, data, 'POST');
  
  if (result && result.ok) {
    closeModal();
    loadVenues();
    showToast(id ? '✅ Venue updated!' : '✅ Venue created!', 'success');
  } else {
    showToast('❌ Error: ' + (result?.error || 'Unknown error'), 'error');
  }
}

async function toggleVenue(id, currentStatus) {
  const newStatus = currentStatus == 1 ? 0 : 1;
  const result = await fetchAPI('toggle_venue', { venue_id: id, is_active: newStatus }, 'POST');
  
  if (result && result.ok) {
    loadVenues();
    showToast('✅ Venue status updated', 'success');
  }
}

async function deleteVenue(id) {
  if (!confirm('⚠️ Delete this venue? This action cannot be undone.')) return;
  
  const result = await fetchAPI('delete_venue', { venue_id: id }, 'POST');
  
  if (result && result.ok) {
    loadVenues();
    showToast('✅ Venue deleted', 'success');
  } else {
    showToast('❌ ' + (result?.error || 'Error deleting venue'), 'error');
  }
}

function editVenue(id) {
  showVenueModal(id);
}

console.log('✅ Venues management loaded');


// ==========================================
// TEAM COLLEGE MANAGEMENT
// ==========================================

// FIXED TEAM COLLEGE MANAGEMENT FUNCTIONS
// Add to director.js - Replace existing college management functions if you already added them

// ==========================================
// TEAM COLLEGE MANAGEMENT
// ADD THIS TO THE END OF director.js (before the closing script tag)
// ==========================================

// SIMPLE FIX - Replace just the showManageTeamCollegesModal function in director.js
// This version shows ALL colleges without filtering by is_active

// TEMPORARY DEBUG VERSION - Replace showManageTeamCollegesModal in director.js
// This will help us see what's happening with the dropdown

async function showManageTeamCollegesModal(tourId, teamId, teamName) {
  console.log('🎓 Opening college management for team:', teamId);
  
  try {
    const colleges = await fetchAPI('colleges');
    console.log('✅ All colleges:', colleges);
    
    const collegeResponse = await fetchAPI('get_team_colleges', { tour_id: tourId, team_id: teamId });
    console.log('✅ Team colleges response:', collegeResponse);
    
    // Handle different response formats
    let teamColleges = [];
    if (Array.isArray(collegeResponse)) {
      teamColleges = collegeResponse;
    } else if (collegeResponse && collegeResponse.colleges && Array.isArray(collegeResponse.colleges)) {
      teamColleges = collegeResponse.colleges;
    }
    
    console.log('📚 Team colleges:', teamColleges);
    
    const modalHTML = `
      <div class="modal active" id="teamCollegesModal">
        <div class="modal-content" style="max-width: 600px;">
          <div class="modal-header">
            <h3>🎓 Manage Colleges - ${escapeHtml(teamName)}</h3>
            <button class="modal-close" onclick="closeModal('teamCollegesModal')">×</button>
          </div>
          <div class="modal-body">
            
            <!-- Info Notice -->
            <div style="padding: 12px; background: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 6px; margin-bottom: 20px;">
              <div style="display: flex; gap: 10px;">
                <div style="font-size: 20px;">ℹ️</div>
                <div style="flex: 1;">
                  <strong style="display: block; color: #1e40af; font-size: 12px; margin-bottom: 4px;">Optional College Filter</strong>
                  <p style="margin: 0; font-size: 11px; color: #1e3a8a; line-height: 1.5;">
                    Adding colleges to this team will restrict athlete selection to only those from the specified colleges. 
                    Leave empty to allow athletes from any college.
                  </p>
                </div>
              </div>
            </div>
            
            <!-- Add College Section -->
            <div style="margin-bottom: 20px;">
              <h4 style="font-size: 13px; font-weight: 600; margin-bottom: 12px; color: var(--text);">Add College</h4>
              <form id="addCollegeForm" onsubmit="addCollegeToTeam(event, ${tourId}, ${teamId})" style="display: flex; gap: 8px;">
                <select class="form-control" id="select_college_code" required style="flex: 1;">
                  <option value="">Select a college...</option>
                  ${colleges && colleges.length > 0 ? colleges.map(c => 
                    `<option value="${c.college_code}">${escapeHtml(c.college_name)} (${c.college_code})</option>`
                  ).join('') : ''}
                </select>
                <button type="submit" class="btn btn-primary">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                  </svg>
                  Add
                </button>
              </form>
            </div>
            
            <!-- Current Colleges List -->
            <div>
              <h4 style="font-size: 13px; font-weight: 600; margin-bottom: 12px; color: var(--text);">
                Assigned Colleges
                <span class="badge badge-active" style="margin-left: 8px; font-size: 11px;">${teamColleges?.length || 0}</span>
              </h4>
              <div id="teamCollegesList">
                ${renderTeamCollegesList(teamColleges, tourId, teamId)}
              </div>
            </div>
            
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('teamCollegesModal')">Close</button>
          </div>
        </div>
      </div>
    `;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = modalHTML;
    document.body.appendChild(tempDiv.firstElementChild);
    
    console.log('✅ College modal rendered');
    
  } catch (error) {
    console.error('❌ Error showing college management modal:', error);
    showToast('❌ Error loading college management', 'error');
  }
}

function renderTeamCollegesList(colleges, tourId, teamId) {
  if (!colleges || !Array.isArray(colleges) || colleges.length === 0) {
    return `
      <div class="empty-state" style="padding: 30px 20px; background: #f9fafb; border-radius: 8px; border: 2px dashed #e5e7eb;">
        <div style="font-size: 36px; margin-bottom: 8px;">🎓</div>
        <div style="color: #6b7280; font-size: 12px;">No colleges assigned yet</div>
        <div style="color: #9ca3af; font-size: 11px; margin-top: 4px;">Athletes from all colleges can be added</div>
      </div>
    `;
  }
  
  // Group by college (remove duplicates)
  const uniqueColleges = [];
  const seenCodes = new Set();
  
  colleges.forEach(tc => {
    if (tc && tc.college_code && !seenCodes.has(tc.college_code)) {
      seenCodes.add(tc.college_code);
      uniqueColleges.push(tc);
    }
  });
  
  return `
    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${uniqueColleges.map(college => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: white; border: 1px solid var(--border); border-radius: 8px;">
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 13px; color: var(--text); margin-bottom: 2px;">
              ${escapeHtml(college.college_name || 'Unknown College')}
            </div>
            <div style="font-size: 11px; color: var(--text-muted);">
              Code: ${escapeHtml(college.college_code)}
            </div>
          </div>
          <button class="btn btn-sm btn-danger" onclick="removeCollegeFromTeam('${escapeHtml(college.college_code)}', ${tourId}, ${teamId})" style="flex-shrink: 0;">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
            </svg>
            Remove
          </button>
        </div>
      `).join('')}
    </div>
  `;
}

async function addCollegeToTeam(event, tourId, teamId) {
  event.preventDefault();
  
  const collegeCode = $('#select_college_code').value;
  
  if (!collegeCode) {
    showToast('⚠️ Please select a college', 'warning');
    return;
  }
  
  console.log('➕ Adding college:', collegeCode, 'to team:', teamId);
  
  try {
    const result = await fetchAPI('add_team_college', {
      tour_id: tourId,
      team_id: teamId,
      college_code: collegeCode
    }, 'POST');
    
    console.log('✅ Add college result:', result);
    
    if (result && result.ok !== false) {
      showToast('✅ College added to team successfully', 'success');
      
      // Reload the colleges list
      const collegeResponse = await fetchAPI('get_team_colleges', { tour_id: tourId, team_id: teamId });
      
      // Handle different response formats
      let teamColleges = [];
      if (Array.isArray(collegeResponse)) {
        teamColleges = collegeResponse;
      } else if (collegeResponse && collegeResponse.colleges) {
        teamColleges = collegeResponse.colleges;
      }
      
      $('#teamCollegesList').innerHTML = renderTeamCollegesList(teamColleges, tourId, teamId);
      
      // Update the badge count
      const badge = document.querySelector('#teamCollegesModal .badge-active');
      if (badge) {
        badge.textContent = teamColleges.length;
      }
      
      // Reset the select
      $('#select_college_code').value = '';
      
      // Reload tournament teams to show updated info
      loadTournamentTeams(tourId);
      
    } else {
      showToast('❌ ' + (result?.error || 'Error adding college'), 'error');
    }
  } catch (error) {
    console.error('❌ Error adding college:', error);
    showToast('❌ Error adding college: ' + error.message, 'error');
  }
}

async function removeCollegeFromTeam(collegeCode, tourId, teamId) {
  if (!confirm('Remove this college from the team?\n\nAthletes from this college will remain in the team, but new athletes from this college cannot be added unless you re-add the college.')) {
    return;
  }
  
  console.log('🗑️ Removing college:', collegeCode, 'from team:', teamId);
  
  try {
    const result = await fetchAPI('remove_team_college', {
      tour_id: tourId,
      team_id: teamId,
      college_code: collegeCode
    }, 'POST');
    
    console.log('✅ Remove college result:', result);
    
    if (result && result.ok !== false) {
      showToast('✅ College removed from team', 'success');
      
      // Reload the colleges list
      const collegeResponse = await fetchAPI('get_team_colleges', { tour_id: tourId, team_id: teamId });
      
      // Handle different response formats
      let teamColleges = [];
      if (Array.isArray(collegeResponse)) {
        teamColleges = collegeResponse;
      } else if (collegeResponse && collegeResponse.colleges) {
        teamColleges = collegeResponse.colleges;
      }
      
      $('#teamCollegesList').innerHTML = renderTeamCollegesList(teamColleges, tourId, teamId);
      
      // Update the badge count
      const badge = document.querySelector('#teamCollegesModal .badge-active');
      if (badge) {
        badge.textContent = teamColleges.length;
      }
      
      // Reload tournament teams to show updated info
      loadTournamentTeams(tourId);
      
    } else {
      showToast('❌ ' + (result?.error || 'Error removing college'), 'error');
    }
  } catch (error) {
    console.error('❌ Error removing college:', error);
    showToast('❌ Error removing college: ' + error.message, 'error');
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================
function closeModal(modalId) {
  const modal = $(`#${modalId}`);
  if (modal) {
    modal.remove();
  }
}

async function loadGlobalSportFilter() {
  const sports = await fetchAPI('sports');
  const select = $('#globalSportFilter');
  
  if (sports && select) {
    const options = sports.map(s => 
      `<option value="${s.sports_id}">${escapeHtml(s.sports_name)}</option>`
    ).join('');
    select.innerHTML = '<option value="">All Sports</option>' + options;
  }
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-size: 14px;
    font-weight: 600;
    animation: slideIn 0.3s ease-out;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);

// ==========================================
// INITIALIZATION
// ==========================================
(async function init() {
  console.log('🚀 Initializing Sports Director dashboard...');
  
  try {
    await loadGlobalSportFilter();
    await loadOverview();
    
    console.log('✅ Dashboard initialized');
  } catch (err) {
    console.error('❌ Initialization error:', err);
  }
})();

// ==========================================
// INITIALIZE ON PAGE LOAD
// Add to the bottom of director.js
// ==========================================

// Call this after everything else is loaded
(async function initDashboard() {
  console.log('🚀 Initializing Sports Director dashboard...');
  
  try {
    // Setup event listeners for auto-refresh
    setupDashboardEventListeners();
    
    // Initialize filters
    await initializeFilters();
    
    // Load initial view
    await loadOverview();
    
    console.log('✅ Dashboard initialized with auto-refresh');
  } catch (err) {
    console.error('❌ Initialization error:', err);
  }
})();