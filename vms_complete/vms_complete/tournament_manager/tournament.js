// Tournament Manager Dashboard - Updated for Sidebar Design

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

let selectedSports = new Set();
let currentTournamentForSports = null;
let currentTournamentForTeams = null;
let sportTeamSelections = {};
let isSubmittingMatch = false;

// ==========================================
// NAVIGATION
// ==========================================

function setTab(tabId) {
  // Update sidebar navigation
  $$('.nav-link').forEach(b => b.classList.toggle('active', b.dataset.view === tabId));
  
  // Update content views
  $$('.content-view').forEach(v => v.classList.toggle('active', v.id === `${tabId}-view`));
  
  // Update page title
const titles = {
  'overview': 'Overview',
  'tournaments': 'Tournaments',
  'teams': 'Teams',
  'sports': 'Sports',
  'athletes': 'Athletes',
  'matches': 'Matches & Schedule',
  'standings': 'Team Standings',
  'medals': 'Medal Tally',
  'venues': 'Venues'
};
  $('#pageTitle').textContent = titles[tabId] || 'Dashboard';
  
  // Load data for the view
  loadViewData(tabId);
}

// Setup navigation click handlers
$$('.nav-link').forEach(btn => {
  btn.addEventListener('click', () => {
    setTab(btn.dataset.view);
  });
});

function loadViewData(view) {
  switch(view) {
    case 'overview': 
      loadOverview(); 
      break;
    case 'tournaments': 
      loadTournaments(); 
      loadTournamentsForFilters();
      break;
    case 'teams':
      loadTournamentsForFilters();
      break;
    case 'sports':
      loadTournamentsForFilters();
      break;
    case 'athletes':
      loadTournamentsForFilters();
      break;
    case 'matches': 
      loadMatches(); 
      break;
    case 'standings':
      // Load standings if you have that functionality
      break;
    case 'medals':
      // Load medals if you have that functionality
      break;
    case 'venues': 
      loadVenuesTable(); 
      break;
  }
}

// ==========================================
// API HELPER
// ==========================================

async function fetchJSON(action, options = {}) {
  try {
    let url = `api.php?action=${encodeURIComponent(action)}`;
    let fetchOptions = {
      method: 'GET'
    };
    
    // Check if this is a POST request by looking for method, body, or headers properties
    const hasMethod = options.hasOwnProperty('method');
    const hasBody = options.hasOwnProperty('body');
    const hasHeaders = options.hasOwnProperty('headers');
    
    if (hasMethod || hasBody || hasHeaders) {
      // This is a fetch options object for POST/PUT/DELETE
      fetchOptions = {
        method: options.method || 'POST',
        headers: options.headers || {},
        body: options.body
      };
      console.log('📡 POST request:', url, fetchOptions.method);
    } else if (options && typeof options === 'object' && Object.keys(options).length > 0) {
      // This is a GET parameters object
      const queryParams = new URLSearchParams(options).toString();
      url += `&${queryParams}`;
      console.log('📡 GET request:', url);
    } else {
      console.log('📡 GET request:', url);
    }
    
    const res = await fetch(url, fetchOptions);
    
    if (!res.ok) {
      const text = await res.text();
      console.error('❌ HTTP error:', res.status, text);
      throw new Error(`HTTP ${res.status}`);
    }
    
    const data = await res.json();
    console.log('✅ Response:', data);
    return data;
  } catch (err) {
    console.error('❌ fetchJSON error:', err);
    throw err;
  }
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[m]));
}

// ==========================================
// OVERVIEW
// ==========================================

// ==========================================
// OVERVIEW - FIXED TO SHOW ONLY TM ASSIGNED DATA
// ==========================================

// ==========================================
// OVERVIEW - SHOWS TM ASSIGNED DATA WITH TEAMS COUNT
// ==========================================

async function loadOverview() {
  try {
    console.log('📊 Loading overview - filtering by TM assignments...');
    
    // Get tournaments (already filtered by backend to show only TM's tournaments)
    const tournaments = await fetchJSON('tournaments');
    
    // Get matches (already filtered by backend to show only TM's matches)
    const matches = await fetchJSON('matches');
    
    // Get TM's sport assignments to count unique teams
    const assignments = await fetchJSON('my_assignments');
    
    // Count active tournaments
    const activeTournaments = tournaments.filter(t => t.is_active == 1);
    
    // Count unique TEAMS from assignments (this is the CORRECT count for TM)
    const uniqueTeams = new Set();
    if (assignments && Array.isArray(assignments)) {
      assignments.forEach(a => {
        if (a.team_id) {
          uniqueTeams.add(a.team_id);
        }
      });
    }
    
    // Count completed matches (those with winners)
    const completedMatches = matches.filter(m => m.winner_id);
    
    // Update UI with FILTERED stats
    $('#statTournaments').textContent = activeTournaments.length || 0;
    $('#statSports').textContent = uniqueTeams.size || 0; // ✅ CHANGED: Now shows teams count
    $('#statMatches').textContent = matches.length || 0;
    $('#statCompleted').textContent = completedMatches.length || 0;
    
    console.log('✅ Overview loaded:', {
      tournaments: activeTournaments.length,
      assignedTeams: uniqueTeams.size,
      matches: matches.length,
      completed: completedMatches.length
    });
  } catch (err) {
    console.error('❌ loadOverview error:', err);
    // Set safe defaults on error
    $('#statTournaments').textContent = '0';
    $('#statSports').textContent = '0';
    $('#statMatches').textContent = '0';
    $('#statCompleted').textContent = '0';
  }
}

// ==========================================
// TOURNAMENTS
// ==========================================

async function loadTournaments() {
  try {
    const data = await fetchJSON('tournaments');
    const content = $('#tournamentsContent');
    
    if (!Array.isArray(data) || data.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <p style="font-size: 16px; margin-bottom: 12px;">📋 No Tournaments Assigned</p>
          <p>You have not been assigned to manage any tournaments yet.</p>
          <p style="margin-top: 8px; font-size: 12px; color: #6b7280;">
            The Sports Director needs to assign you as a Tournament Manager for specific sports in a tournament.
          </p>
        </div>
      `;
      return;
    }
    
    // Group by school year
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
    
    // Populate tournament dropdowns
    populateTournamentDropdowns(data);
    
    console.log('✅ Tournaments loaded:', data.length);
  } catch (err) {
    console.error('❌ loadTournaments error:', err);
    $('#tournamentsContent').innerHTML = '<div class="empty-state" style="color:red;">Error loading tournaments</div>';
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
        📅 ${escapeHtml(t.tour_date || 'No date')} • ${escapeHtml(t.school_year)}
      </div>
      <div class="data-card-actions">
        <button class="btn btn-sm btn-${t.is_active == 1 ? 'warning' : 'success'}" 
                onclick="toggleTournament(${t.tour_id}, ${t.is_active})">
          ${t.is_active == 1 ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  `;
}

function populateTournamentDropdowns(tournaments) {
  const active = tournaments.filter(t => t.is_active == 1);
  const opts = active.map(t => 
    `<option value="${t.tour_id}" data-tour-name="${escapeHtml(t.tour_name)}" data-school-year="${escapeHtml(t.school_year)}" data-tour-date="${t.tour_date}">${escapeHtml(t.tour_name)} (${t.school_year})</option>`
  ).join('');
  
  const selects = [
    '#teamsFilterTournament',
    '#sportsFilterTournament',
    '#athletesFilterTournament',
    '#matchTourSelect',
    '#matchesFilterTour',
    '#standingsTourSelect',
    '#medalsTourSelect',
    '#printTourSelect'
  ];
  
  selects.forEach(selector => {
    const el = $(selector);
    if (el) {
      if (selector === '#matchesFilterTour') {
        el.innerHTML = '<option value="">All Tournaments</option>' + opts;
      } else {
        el.innerHTML = '<option value="">-- Select Tournament --</option>' + opts;
      }
    }
  });
}

// Load tournaments for filter dropdowns
async function loadTournamentsForFilters() {
  try {
    const tournaments = await fetchJSON('tournaments');
    populateTournamentDropdowns(tournaments);
  } catch (err) {
    console.error('Error loading tournaments for filters:', err);
  }
}

// ==========================================
// TEAMS VIEW - Cascading Filters
// ==========================================
async function loadTeamsForTournament(tourId) {
  const content = $('#teamsContent');
  
  if (!tourId) {
    content.innerHTML = '<div class="empty-state">Select a tournament to view teams</div>';
    return;
  }
  
  try {
    content.innerHTML = '<div class="loading">Loading teams...</div>';
    const teams = await fetchJSON('get_tournament_teams', { tour_id: tourId });
    
    if (!teams || teams.length === 0) {
      content.innerHTML = '<div class="empty-state">No teams registered in this tournament yet.</div>';
      return;
    }
    
    let html = `<div class="data-grid">`;
    teams.forEach(team => {
      html += `
        <div class="data-card">
          <div class="data-card-header">
            <div class="data-card-title">${escapeHtml(team.team_name)}</div>
          </div>
          <div class="data-card-meta">
            🏅 ${team.num_sports || 0} sport(s)<br>
            👥 ${team.num_athletes || 0} athlete(s)
          </div>
          <div class="data-card-actions">
            <button class="btn btn-sm btn-primary" onclick="viewTeamDetails(${tourId}, ${team.team_id})">View Details</button>
          </div>
        </div>
      `;
    });
    html += '</div>';
    content.innerHTML = html;
    
  } catch (err) {
    console.error('Error loading teams:', err);
    content.innerHTML = '<div class="empty-state" style="color:red;">Error loading teams</div>';
  }
}

// Teams filter - Tournament selection
$('#teamsFilterTournament')?.addEventListener('change', (e) => {
  loadTeamsForTournament(e.target.value);
});

// ==========================================
// SPORTS VIEW - Cascading Filters
// ==========================================
async function loadSportsForTeam(tourId, teamId) {
  const content = $('#sportsContent');
  
  if (!tourId || !teamId) {
    content.innerHTML = '<div class="empty-state">Select tournament and team to view sports</div>';
    return;
  }
  
  try {
    content.innerHTML = '<div class="loading">Loading sports...</div>';
    const sports = await fetchJSON('get_team_sports', { tour_id: tourId, team_id: teamId });
    
    if (!sports || sports.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          No sports assigned to this team yet.<br><br>
          <button class="btn btn-primary" onclick="showAddSportModal(${tourId}, ${teamId})">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
            </svg>
            Add Sport
          </button>
        </div>
      `;
      return;
    }
    
    let html = `
      <div style="margin-bottom: 12px;">

      </div>
      <div class="data-grid">
    `;
    
    sports.forEach(sport => {
      html += `
        <div class="data-card">
          <div class="data-card-header">
            <div class="data-card-title">${escapeHtml(sport.sports_name)}</div>
          </div>
          <div class="data-card-meta">
            👨‍🏫 Coach: ${escapeHtml(sport.coach_name || 'Not assigned')}<br>
            🎯 Manager: ${escapeHtml(sport.tournament_manager_name || 'Not assigned')}<br>
            👥 ${sport.num_athletes || 0} athlete(s)
          </div>
          <div class="data-card-actions">
            <button class="btn btn-sm btn-primary" onclick="viewSportAthletes(${tourId}, ${teamId}, ${sport.sports_id})">Manage Athletes</button>
            <button class="btn btn-sm btn-secondary" onclick="assignStaff(${tourId}, ${teamId}, ${sport.sports_id})">Assign Staff</button>
          </div>
        </div>
      `;
    });
    html += '</div>';
    content.innerHTML = html;
    
  } catch (err) {
    console.error('Error loading sports:', err);
    content.innerHTML = '<div class="empty-state" style="color:red;">Error loading sports</div>';
  }
}

// Sports filters - Tournament and Team selection
$('#sportsFilterTournament')?.addEventListener('change', async (e) => {
  const tourId = e.target.value;
  const teamSelect = $('#sportsFilterTeam');
  
  teamSelect.disabled = !tourId;
  teamSelect.innerHTML = '<option value="">-- Select Team --</option>';
  $('#sportsContent').innerHTML = '<div class="empty-state">Select a team to view sports</div>';
  
  if (tourId) {
    try {
      const teams = await fetchJSON('get_tournament_teams', { tour_id: tourId });
      if (teams && teams.length > 0) {
        teams.forEach(team => {
          const opt = document.createElement('option');
          opt.value = team.team_id;
          opt.textContent = team.team_name;
          teamSelect.appendChild(opt);
        });
      }
    } catch (err) {
      console.error('Error loading teams:', err);
    }
  }
});

$('#sportsFilterTeam')?.addEventListener('change', (e) => {
  const tourId = $('#sportsFilterTournament').value;
  const teamId = e.target.value;
  loadSportsForTeam(tourId, teamId);
});

// ==========================================
// ATHLETES VIEW - Cascading Filters
// ==========================================
async function loadAthletesForSport(tourId, teamId, sportsId) {
  const content = $('#athletesContent');
  
  if (!tourId || !teamId || !sportsId) {
    content.innerHTML = '<div class="empty-state">Select tournament, team, and sport to view athletes</div>';
    return;
  }
  
  try {
    content.innerHTML = '<div class="loading">Loading athletes...</div>';
    const athletes = await fetchJSON('get_sport_athletes', { 
      tour_id: tourId, 
      team_id: teamId, 
      sports_id: sportsId 
    });
    
    if (!athletes || athletes.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          No athletes registered yet.<br><br>

        </div>
      `;
      return;
    }
    
    let html = `
      <div style="margin-bottom: 12px;">

      </div>
      <table class="table">
        <thead>
          <tr>
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
    `;
    
    athletes.forEach(a => {
      html += `
        <tr>
          <td><strong>${escapeHtml(a.full_name)}</strong></td>
          <td><span class="badge" style="background: #dbeafe; color: #1e40af;">${escapeHtml(a.role_type || 'athlete')}</span></td>
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

            <button class="btn btn-sm btn-danger" onclick="removeAthlete(${a.team_ath_id}, ${tourId}, ${teamId}, ${sportsId})">Remove</button>
          </td>
        </tr>
      `;
    });
    html += '</tbody></table>';
    content.innerHTML = html;
    
  } catch (err) {
    console.error('Error loading athletes:', err);
    content.innerHTML = '<div class="empty-state" style="color:red;">Error loading athletes</div>';
  }
}

// Athletes filters - Tournament, Team, and Sport selection
$('#athletesFilterTournament')?.addEventListener('change', async (e) => {
  const tourId = e.target.value;
  const teamSelect = $('#athletesFilterTeam');
  const sportSelect = $('#athletesFilterSport');
  
  teamSelect.disabled = !tourId;
  sportSelect.disabled = true;
  teamSelect.innerHTML = '<option value="">-- Select Team --</option>';
  sportSelect.innerHTML = '<option value="">-- Select Sport --</option>';
  $('#athletesContent').innerHTML = '<div class="empty-state">Select a team to continue</div>';
  
  if (tourId) {
    try {
      const teams = await fetchJSON('get_tournament_teams', { tour_id: tourId });
      if (teams && teams.length > 0) {
        teams.forEach(team => {
          const opt = document.createElement('option');
          opt.value = team.team_id;
          opt.textContent = team.team_name;
          teamSelect.appendChild(opt);
        });
      }
    } catch (err) {
      console.error('Error loading teams:', err);
    }
  }
});

function removeAthlete(teamAthId, tourId, teamId, sportsId) {
  if (!confirm('Are you sure you want to remove this athlete?')) {
    return;
  }
  
  fetch('api.php?action=remove_athlete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      team_ath_id: teamAthId,
      tour_id: tourId,
      team_id: teamId,
      sports_id: sportsId
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (data.ok) {
      alert(data.message || 'Athlete removed successfully');
      // Refresh the athlete list for this team/sport
      if (typeof loadTeamAthletes === 'function') {
        loadTeamAthletes(tourId, teamId, sportsId);
      } else {
        location.reload();
      }
    } else {
      alert('Error: ' + (data.message || 'Failed to remove athlete'));
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Failed to remove athlete. Please check the console for details.');
  });
}

$('#athletesFilterTeam')?.addEventListener('change', async (e) => {
  const tourId = $('#athletesFilterTournament').value;
  const teamId = e.target.value;
  const sportSelect = $('#athletesFilterSport');
  
  sportSelect.disabled = !teamId;
  sportSelect.innerHTML = '<option value="">-- Select Sport --</option>';
  $('#athletesContent').innerHTML = '<div class="empty-state">Select a sport to view athletes</div>';
  
  if (tourId && teamId) {
    try {
      const sports = await fetchJSON('get_team_sports', { tour_id: tourId, team_id: teamId });
      if (sports && sports.length > 0) {
        sports.forEach(sport => {
          const opt = document.createElement('option');
          opt.value = sport.sports_id;
          opt.textContent = sport.sports_name;
          sportSelect.appendChild(opt);
        });
      }
    } catch (err) {
      console.error('Error loading sports:', err);
    }
  }
});

$('#athletesFilterSport')?.addEventListener('change', (e) => {
  const tourId = $('#athletesFilterTournament').value;
  const teamId = $('#athletesFilterTeam').value;
  const sportsId = e.target.value;
  loadAthletesForSport(tourId, teamId, sportsId);
});

function showTournamentModal() {
  const modalHTML = `
    <div class="modal active" id="tournamentModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Create Tournament</h3>
          <button class="modal-close" onclick="closeModal('tournamentModal')">×</button>
        </div>
        <form id="tournamentForm" onsubmit="saveTournament(event)">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Tournament Name *</label>
              <input type="text" class="form-control" id="tour_name" placeholder="e.g., Inter-College Championship 2025" required>
            </div>
            <div class="form-group">
              <label class="form-label">School Year *</label>
              <input type="text" class="form-control" id="school_year" placeholder="e.g., 2024-2025" required>
            </div>
            <div class="form-group">
              <label class="form-label">Tournament Date *</label>
              <input type="date" class="form-control" id="tour_date" required>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal('tournamentModal')">Cancel</button>
            <button type="submit" class="btn btn-primary">Create Tournament</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  $('#modalContainer').innerHTML = modalHTML;
}

async function saveTournament(e) {
  e.preventDefault();
  
  try {
    const formData = new URLSearchParams();
    formData.set('tour_name', $('#tour_name').value);
    formData.set('school_year', $('#school_year').value);
    formData.set('tour_date', $('#tour_date').value);

    const data = await fetchJSON('create_tournament', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    if (data.ok) {
      alert(data.message || 'Tournament created!');
      closeModal('tournamentModal');
      await loadTournaments();
    } else {
      alert(data.message || 'Error creating tournament');
    }
  } catch (err) {
    console.error('❌ Tournament create error:', err);
    alert('Error creating tournament');
  }
}

async function toggleTournament(tourId, currentStatus) {
  if (!confirm(`Are you sure you want to ${currentStatus == 1 ? 'deactivate' : 'activate'} this tournament?`)) return;
  
  try {
    const formData = new URLSearchParams();
    formData.set('tour_id', tourId);
    formData.set('is_active', currentStatus == 1 ? '0' : '1');

    const data = await fetchJSON('toggle_tournament', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    if (data.ok) {
      await loadTournaments();
    } else {
      alert(data.message || 'Failed to update tournament');
    }
  } catch (err) {
    console.error('❌ Toggle tournament error:', err);
    alert('Error updating tournament');
  }
}

function closeModal(modalId) {
  const modal = $(`#${modalId}`);
  if (modal) modal.remove();
}

// ==========================================
// SPORTS SELECTION
// ==========================================

$('#sportsTourSelect')?.addEventListener('change', async (e) => {
  const tourId = e.target.value;
  currentTournamentForSports = tourId;
  
  const selectionArea = $('#sportsSelectionArea');
  const tournamentSportsList = $('#tournamentSportsList');
  
  if (!tourId) {
    if (selectionArea) selectionArea.style.display = 'none';
    if (tournamentSportsList) tournamentSportsList.innerHTML = '<p class="empty-state">Select a tournament to view its sports</p>';
    return;
  }
  
  try {
    const tourSports = await fetchJSON(`tournament_sports&tour_id=${tourId}`);
    const tourSportIds = new Set((tourSports || []).map(s => s.sports_id));
    
    if (tournamentSportsList) {
      if (tourSportIds.size > 0) {
        tournamentSportsList.innerHTML = '<div class="sports-grid">' + tourSports.map(s => `
          <div class="sport-card selected">
            <div class="sport-name">${escapeHtml(s.sports_name)}</div>
            <div class="sport-check">✓</div>
          </div>
        `).join('') + '</div>';
      } else {
        tournamentSportsList.innerHTML = '<p style="color:#6b7280;font-size:13px;margin-top:12px;">No sports selected yet. Choose from the options below.</p>';
      }
    }
    
    const allSports = await fetchJSON('all_sports');
    
    if (!Array.isArray(allSports) || allSports.length === 0) {
      const sportsList = $('#sportsList');
      if (sportsList) {
        sportsList.innerHTML = '<p style="color:#ef4444;font-size:13px;">No sports available in the system.</p>';
      }
      if (selectionArea) selectionArea.style.display = 'block';
      return;
    }
    
    selectedSports.clear();
    tourSportIds.forEach(id => selectedSports.add(id));
    
    const sportsList = $('#sportsList');
    if (sportsList) {
      sportsList.innerHTML = allSports.map(s => {
        const isSelected = tourSportIds.has(s.sports_id);
        return `
          <div class="sport-card ${isSelected ? 'selected' : ''}" data-sport-id="${s.sports_id}" onclick="toggleSport(${s.sports_id})">
            <div class="sport-name">${escapeHtml(s.sports_name)}</div>
            <div class="sport-check">✓</div>
          </div>
        `;
      }).join('');
    }
    
    if (selectionArea) selectionArea.style.display = 'block';
    
  } catch (err) {
    console.error('❌ Error loading tournament sports:', err);
  }
});

function toggleSport(sportId) {
  if (selectedSports.has(sportId)) {
    selectedSports.delete(sportId);
  } else {
    selectedSports.add(sportId);
  }
  
  $$('.sport-card').forEach(card => {
    const id = parseInt(card.dataset.sportId);
    card.classList.toggle('selected', selectedSports.has(id));
  });
}

$('#confirmSportsBtn')?.addEventListener('click', async () => {
  if (selectedSports.size === 0) {
    alert('Please select at least one sport for this tournament');
    return;
  }
  
  if (!currentTournamentForSports) {
    alert('No tournament selected');
    return;
  }
  
  const msg = $('#sportsMsg');
  msg.textContent = 'Saving sports selection...';
  msg.style.color = '#6b7280';
  
  try {
    const formData = new URLSearchParams();
    formData.set('tour_id', currentTournamentForSports);
    formData.set('sport_ids', Array.from(selectedSports).join(','));

    const data = await fetchJSON('add_tournament_sports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    if (data.ok) {
      msg.textContent = data.message + ' ✓ Now go to "Select Teams" tab to assign teams for each sport!';
      msg.style.color = 'green';
      
      $('#sportsTourSelect').dispatchEvent(new Event('change'));
    } else {
      msg.textContent = data.message || 'Error saving sports selection';
      msg.style.color = 'red';
    }
  } catch (err) {
    console.error('❌ Add sports error:', err);
    msg.textContent = 'Error saving sports selection. Please try again.';
    msg.style.color = 'red';
  }
});

// Continue with remaining functions in next response...
// This file is getting long, I'll provide the rest in the next artifact



window.setTab = setTab;
window.showTournamentModal = showTournamentModal;
window.toggleTournament = toggleTournament;
window.toggleSport = toggleSport;
window.closeModal = closeModal;

// Initialize on load
(async function init() {
  console.log('🚀 Initializing Tournament Manager dashboard...');
  
  try {
    await loadOverview();
    await loadTournaments();
    console.log('✅ Dashboard initialized');
  } catch (err) {
    console.error('❌ Initialization error:', err);
  }
})();

// Tournament Manager Dashboard - Part 2: Remaining Functions
// ADD THIS TO THE END OF tournament.js

// ==========================================
// TEAM SELECTION
// ==========================================

$('#teamsTourSelect')?.addEventListener('change', async (e) => {
  const tourId = e.target.value;
  currentTournamentForTeams = tourId;
  
  const teamsArea = $('#teamsSelectionArea');
  const container = $('#sportTeamsContainer');
  
  console.log('====================================');
  console.log('🎯 TEAM SELECTION - START');
  console.log('Tournament ID:', tourId);
  console.log('Base URL:', window.BASE_URL);
  console.log('====================================');
  
  if (!tourId) {
    if (teamsArea) teamsArea.style.display = 'none';
    console.log('⚠️ No tournament selected');
    return;
  }
  
  try {
    // STEP 1: Get tournament sports
    console.log('📡 STEP 1: Fetching tournament sports...');
    const sportsUrl = `tournament_sports&tour_id=${tourId}`;
    console.log('URL:', sportsUrl);
    
    const tourSports = await fetchJSON(sportsUrl);
    console.log('✅ Sports received:', tourSports);
    
    if (!tourSports || tourSports.length === 0) {
      console.warn('⚠️ No sports found for tournament');
      if (container) {
        container.innerHTML = `
          <div style="background:#fee2e2;border:1px solid #fca5a5;padding:16px;border-radius:6px;margin-top:16px;">
            <p style="color:#dc2626;font-weight:600;margin-bottom:8px;">⚠️ No sports selected</p>
            <p style="color:#991b1b;font-size:13px;">Please go to "Select Sports" tab first and choose sports for this tournament.</p>
          </div>
        `;
      }
      if (teamsArea) teamsArea.style.display = 'block';
      return;
    }
    
    // STEP 2: Get all available teams - TRY DIFFERENT ENDPOINTS
    console.log('📡 STEP 2: Fetching available teams...');
    
    let allTeams = null;
    let teamsUrl = '';
    
    // Try method 1: available_teams
    try {
      teamsUrl = 'available_teams';
      console.log('🔍 Trying URL:', teamsUrl);
      allTeams = await fetchJSON(teamsUrl);
      console.log('✅ Method 1 SUCCESS - available_teams:', allTeams);
    } catch (err1) {
      console.warn('❌ Method 1 FAILED:', err1.message);
      
      // Try method 2: available_teams_for_sport
      try {
        teamsUrl = 'available_teams_for_sport';
        console.log('🔍 Trying URL:', teamsUrl);
        allTeams = await fetchJSON(teamsUrl);
        console.log('✅ Method 2 SUCCESS - available_teams_for_sport:', allTeams);
      } catch (err2) {
        console.warn('❌ Method 2 FAILED:', err2.message);
        
        // Try method 3: get_all_teams
        try {
          teamsUrl = 'get_all_teams';
          console.log('🔍 Trying URL:', teamsUrl);
          allTeams = await fetchJSON(teamsUrl);
          console.log('✅ Method 3 SUCCESS - get_all_teams:', allTeams);
        } catch (err3) {
          console.error('❌ Method 3 FAILED:', err3.message);
          throw new Error('All team loading methods failed. Check api.php endpoints.');
        }
      }
    }
    
    if (!allTeams || allTeams.length === 0) {
      console.warn('⚠️ No teams available');
      if (container) {
        container.innerHTML = `
          <div style="background:#fef3c7;border:1px solid #fde68a;padding:16px;border-radius:6px;margin-top:16px;">
            <p style="color:#92400e;font-weight:600;margin-bottom:8px;">⚠️ No teams available</p>
            <p style="color:#78350f;font-size:13px;">Please register teams first in the "Register Teams" section.</p>
          </div>
        `;
      }
      if (teamsArea) teamsArea.style.display = 'block';
      return;
    }
    
    console.log('✅ Total teams available:', allTeams.length);
    
    // STEP 3: Build UI for each sport
    let html = `
      <div style="background:#f0fdf4;border:1px solid #86efac;padding:12px;border-radius:6px;margin-bottom:20px;">
        <strong style="color:#166534;">✅ ${tourSports.length} sport(s) selected for this tournament</strong>
        <p style="color:#15803d;font-size:12px;margin-top:4px;">${allTeams.length} teams available to assign</p>
      </div>
    `;
    
    for (const sport of tourSports) {
      console.log('📡 STEP 3: Processing sport:', sport.sports_name, '(ID:', sport.sports_id + ')');
      
      // Get registered teams for this sport
      let registeredTeams = [];
      try {
        const regTeamsUrl = `tournament_sport_teams&tour_id=${tourId}&sports_id=${sport.sports_id}`;
        console.log('🔍 Fetching registered teams:', regTeamsUrl);
        registeredTeams = await fetchJSON(regTeamsUrl);
        console.log('✅ Registered teams:', registeredTeams);
      } catch (err) {
        console.warn('⚠️ Could not load registered teams:', err.message);
        registeredTeams = [];
      }
      
      const registeredTeamIds = new Set((registeredTeams || []).map(t => t.team_id));
      console.log('📊 Registered team IDs:', Array.from(registeredTeamIds));
      
      // Initialize selection state
      if (!sportTeamSelections[sport.sports_id]) {
        sportTeamSelections[sport.sports_id] = new Set();
      }
      sportTeamSelections[sport.sports_id].clear();
      registeredTeamIds.forEach(id => sportTeamSelections[sport.sports_id].add(id));
      
      html += `
        <div class="card" style="margin-bottom:20px;">
          <h3 class="card-title">${escapeHtml(sport.sports_name)}</h3>
          <p style="font-size:12px;color:#6b7280;margin-bottom:12px;">
            ${sport.team_individual === 'team' ? '👥 Team Sport' : '👤 Individual Sport'} • 
            ${sport.men_women || 'Co-ed'}
          </p>
          
          <div style="margin-bottom:16px;">
            <h4 style="font-size:13px;font-weight:600;margin-bottom:10px;color:#374151;">
              Select Teams:
            </h4>
            <div class="sports-grid" id="teamGrid_${sport.sports_id}">
              ${allTeams.map(team => {
                const isSelected = registeredTeamIds.has(team.team_id);
                return `
                  <div class="sport-card ${isSelected ? 'selected' : ''}" 
                       data-team-id="${team.team_id}"
                       onclick="toggleTeamForSport(${sport.sports_id}, ${team.team_id}, this)">
                    <div class="sport-name">${escapeHtml(team.team_name)}</div>
                    <div class="sport-check">✓</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          
          <div style="background:#f9fafb;padding:12px;border-radius:6px;margin-bottom:12px;">
            <div style="font-size:12px;color:#6b7280;">
              <strong style="color:#374151;">Currently selected:</strong> 
              <span id="selectedCount_${sport.sports_id}">${registeredTeamIds.size}</span> team(s)
            </div>
          </div>
          
          <button class="btn btn-success" style="margin-bottom:16px;" 
                  onclick="saveTeamsForSport(${tourId}, ${sport.sports_id})">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
            </svg>
            Save Teams
          </button>
          
          <div id="teamSaveMsg_${sport.sports_id}" class="msg" style="display:none;"></div>
          
          ${registeredTeams.length > 0 ? `
            <div style="margin-top:20px;border-top:1px solid #e5e7eb;padding-top:16px;">
              <h4 style="font-size:13px;font-weight:600;margin-bottom:12px;">
                📋 Registered Teams (${registeredTeams.length})
              </h4>
              <table class="table">
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Coach</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${registeredTeams.map(t => `
                    <tr>
                      <td><strong>${escapeHtml(t.team_name)}</strong></td>
                      <td>${t.coach_name || '<em style="color:#9ca3af;">Not assigned</em>'}</td>
                      <td>
                        <button class="btn btn-sm" onclick="viewTeamDetails(${tourId}, ${sport.sports_id}, ${t.team_id}, '${escapeHtml(t.team_name).replace(/'/g, "\\'")}')">
                          View
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div style="padding:20px;text-align:center;color:#9ca3af;font-size:13px;border:1px dashed #e5e7eb;border-radius:6px;">
              No teams registered yet. Select teams above and click "Save Teams".
            </div>
          `}
        </div>
      `;
    }
    
    if (container) container.innerHTML = html;
    if (teamsArea) teamsArea.style.display = 'block';
    
    console.log('====================================');
    console.log('✅ TEAM SELECTION UI - COMPLETE');
    console.log('====================================');
    
  } catch (err) {
    console.error('====================================');
    console.error('❌ CRITICAL ERROR IN TEAM SELECTION');
    console.error('Error:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    console.error('====================================');
    
    if (container) {
      container.innerHTML = `
        <div style="background:#fee2e2;border:1px solid #fca5a5;padding:16px;border-radius:6px;margin-top:16px;">
          <p style="color:#dc2626;font-weight:600;margin-bottom:8px;">❌ Error loading teams</p>
          <p style="color:#991b1b;font-size:13px;margin-bottom:8px;">${err.message}</p>
          <details style="font-size:11px;color:#7f1d1d;margin-top:8px;">
            <summary style="cursor:pointer;font-weight:600;">Technical Details (click to expand)</summary>
            <pre style="margin-top:8px;padding:8px;background:#fef2f2;border-radius:4px;overflow:auto;max-height:200px;">${err.stack}</pre>
          </details>
          <p style="color:#991b1b;font-size:12px;margin-top:12px;font-weight:600;">
            💡 Check the browser console (F12) for detailed logs
          </p>
        </div>
      `;
    }
    if (teamsArea) teamsArea.style.display = 'block';
  }
});

function toggleTeamForSport(sportsId, teamId, element) {
  console.log('🔄 Toggle team:', { sportsId, teamId });
  
  element.classList.toggle('selected');
  
  if (!sportTeamSelections[sportsId]) {
    sportTeamSelections[sportsId] = new Set();
  }
  
  if (sportTeamSelections[sportsId].has(teamId)) {
    sportTeamSelections[sportsId].delete(teamId);
    console.log('➖ Removed team', teamId);
  } else {
    sportTeamSelections[sportsId].add(teamId);
    console.log('➕ Added team', teamId);
  }
  
  const countEl = $(`#selectedCount_${sportsId}`);
  if (countEl) {
    countEl.textContent = sportTeamSelections[sportsId].size;
  }
  
  console.log('Current selection:', Array.from(sportTeamSelections[sportsId]));
}

async function saveTeamsForSport(tourId, sportsId) {
  console.log('====================================');
  console.log('💾 SAVING TEAMS FOR SPORT');
  console.log('Tournament:', tourId);
  console.log('Sport:', sportsId);
  console.log('====================================');
  
  const msgEl = $(`#teamSaveMsg_${sportsId}`);
  
  if (!msgEl) {
    console.error('❌ Message element not found');
    alert('Error: Message element not found');
    return;
  }
  
  msgEl.style.display = 'block';
  msgEl.textContent = 'Saving teams...';
  msgEl.style.color = '#6b7280';
  msgEl.style.background = '#f3f4f6';
  msgEl.style.padding = '8px 12px';
  msgEl.style.borderRadius = '4px';
  
  try {
    const selectedTeamIds = Array.from(sportTeamSelections[sportsId] || []);
    console.log('Selected team IDs:', selectedTeamIds);
    
    if (selectedTeamIds.length === 0) {
      console.warn('⚠️ No teams selected');
      msgEl.textContent = '⚠️ Please select at least one team';
      msgEl.style.color = '#d97706';
      msgEl.style.background = '#fffbeb';
      return;
    }
    
    const formData = new URLSearchParams();
    formData.set('tour_id', tourId);
    formData.set('sports_id', sportsId);
    formData.set('team_ids', selectedTeamIds.join(','));
    
    console.log('📡 Sending request to: add_teams_to_tournament_sport');
    console.log('Form data:', Object.fromEntries(formData));
    
    const data = await fetchJSON('add_teams_to_tournament_sport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });
    
    console.log('✅ Response:', data);
    
    if (data.ok) {
      msgEl.textContent = `✅ ${data.message}`;
      msgEl.style.color = '#166534';
      msgEl.style.background = '#f0fdf4';
      msgEl.style.borderLeft = '3px solid #22c55e';
      
      console.log('✅ Teams saved successfully');
      
      setTimeout(() => {
        console.log('🔄 Reloading team selection view...');
        $('#teamsTourSelect').dispatchEvent(new Event('change'));
      }, 1500);
    } else {
      msgEl.textContent = `❌ ${data.message || 'Failed to save teams'}`;
      msgEl.style.color = '#dc2626';
      msgEl.style.background = '#fee2e2';
      msgEl.style.borderLeft = '3px solid #ef4444';
      console.error('❌ Save failed:', data);
    }
  } catch (err) {
    console.error('====================================');
    console.error('❌ ERROR SAVING TEAMS');
    console.error('Error:', err);
    console.error('====================================');
    
    msgEl.textContent = `❌ Error: ${err.message}`;
    msgEl.style.color = '#dc2626';
    msgEl.style.background = '#fee2e2';
    msgEl.style.borderLeft = '3px solid #ef4444';
  }
}



async function viewTeamDetails(tourId, teamId) {
  console.log('📋 View team details:', { tourId, teamId });
  
  try {
    // Fetch team sports and basic info
    const sports = await fetchJSON('get_team_sports', { tour_id: tourId, team_id: teamId });
    
    if (!sports || sports.length === 0) {
      alert('No sports assigned to this team.');
      return;
    }
    
    // Get team name from first sport  
    const teamName = sports[0].team_name || 'Team Details';
    const tournamentName = sports[0].tour_name || '';
    
    // Fetch athletes for each sport
    const sportsWithAthletes = await Promise.all(
      sports.map(async (sport) => {
        try {
          const athletes = await fetchJSON('get_sport_athletes', {
            tour_id: tourId,
            team_id: teamId,
            sports_id: sport.sports_id
          });
          return { ...sport, athletes: athletes || [] };
        } catch (err) {
          console.error('Error fetching athletes for ' + sport.sports_name + ':', err);
          return { ...sport, athletes: [] };
        }
      })
    );
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'teamDetailsModal';
    modal.className = 'modal active';
    modal.style.overflowY = 'auto';
    
    // Build HTML string
    let html = '';
    
    // Modal header
    html += '<div class="modal-content wide" style="max-width: 1000px;">';
    html += '<div class="modal-header" style="padding: 12px 16px;">';
    html += '<h3 style="font-size: 15px; margin: 0;">' + escapeHtml(teamName) + ' - Complete Details</h3>';
    html += '<button class="modal-close" onclick="closeTeamDetailsModal()">×</button>';
    html += '</div>';
    html += '<div class="modal-body" style="padding: 16px;">';
    
    // Team Summary
    const totalAthletes = sportsWithAthletes.reduce((sum, s) => sum + s.athletes.length, 0);
    const totalCaptains = sportsWithAthletes.reduce((sum, s) => sum + s.athletes.filter(a => a.is_captain == 1).length, 0);
    
    html += '<div style="background: #f9fafb; padding: 10px 12px; border-radius: 6px; margin-bottom: 16px; border: 1px solid #e5e7eb;">';
    html += '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; font-size: 12px;">';
    html += '<div><div style="color: #6b7280; margin-bottom: 2px;">Tournament</div>';
    html += '<div style="font-weight: 600;">' + escapeHtml(tournamentName) + '</div></div>';
    html += '<div><div style="color: #6b7280; margin-bottom: 2px;">Total Sports</div>';
    html += '<div style="font-weight: 600;">' + sports.length + '</div></div>';
    html += '<div><div style="color: #6b7280; margin-bottom: 2px;">Total Athletes</div>';
    html += '<div style="font-weight: 600;">' + totalAthletes + '</div></div>';
    html += '<div><div style="color: #6b7280; margin-bottom: 2px;">Captains</div>';
    html += '<div style="font-weight: 600;">' + totalCaptains + '</div></div>';
    html += '</div></div>';
    
    // Sports Details
    sportsWithAthletes.forEach((sport, idx) => {
      const captains = sport.athletes.filter(a => a.is_captain == 1);
      const regularAthletes = sport.athletes.filter(a => a.is_captain != 1);
      const marginBottom = idx < sportsWithAthletes.length - 1 ? '20px' : '0';
      
      html += '<div style="margin-bottom: ' + marginBottom + ';">';
      
      // Sport Header
      html += '<div style="background: #111827; color: white; padding: 8px 12px; border-radius: 6px 6px 0 0; display: flex; justify-content: space-between; align-items: center;">';
      html += '<div style="font-weight: 600; font-size: 13px;">' + escapeHtml(sport.sports_name) + '</div>';
      html += '<div style="font-size: 11px; opacity: 0.9;">' + sport.athletes.length + ' athlete' + (sport.athletes.length !== 1 ? 's' : '') + '</div>';
      html += '</div>';
      
      // Sport Info
      html += '<div style="background: white; border: 1px solid #e5e7eb; border-top: none; padding: 10px 12px;">';
      html += '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 12px; margin-bottom: 10px;">';
      
      const sportType = sport.team_individual === 'team' ? 'Team Sport' : 'Individual';
      let category = 'Mixed';
      if (sport.men_women === 'Male') category = 'Men';
      if (sport.men_women === 'Female') category = 'Women';
      const coachName = sport.coach_name || 'Not assigned';
      
      html += '<div><span style="color: #6b7280;">Type:</span> <strong>' + sportType + '</strong></div>';
      html += '<div><span style="color: #6b7280;">Category:</span> <strong>' + category + '</strong></div>';
      html += '<div><span style="color: #6b7280;">Coach:</span> <strong>' + escapeHtml(coachName) + '</strong></div>';
      html += '</div>';
      
      if (sport.athletes.length > 0) {
        // Athletes Table
        html += '<table style="width: 100%; font-size: 12px; border-collapse: collapse; margin-top: 8px;">';
        html += '<thead><tr style="background: #f9fafb; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">';
        html += '<th style="padding: 6px 8px; text-align: left; font-weight: 600; color: #6b7280; font-size: 11px;">NAME</th>';
        html += '<th style="padding: 6px 8px; text-align: left; font-weight: 600; color: #6b7280; font-size: 11px;">ROLE</th>';
        html += '<th style="padding: 6px 8px; text-align: left; font-weight: 600; color: #6b7280; font-size: 11px;">COLLEGE</th>';
        html += '<th style="padding: 6px 8px; text-align: left; font-weight: 600; color: #6b7280; font-size: 11px;">COURSE</th>';
        html += '<th style="padding: 6px 8px; text-align: center; font-weight: 600; color: #6b7280; font-size: 11px;">HEIGHT</th>';
        html += '<th style="padding: 6px 8px; text-align: center; font-weight: 600; color: #6b7280; font-size: 11px;">WEIGHT</th>';
        html += '<th style="padding: 6px 8px; text-align: left; font-weight: 600; color: #6b7280; font-size: 11px;">SCHOLARSHIP</th>';
        html += '<th style="padding: 6px 8px; text-align: center; font-weight: 600; color: #6b7280; font-size: 11px;">CAPTAIN</th>';
        html += '</tr></thead><tbody>';
        
        // Captains first
        captains.forEach(athlete => {
          html += '<tr style="border-bottom: 1px solid #e5e7eb; background: #fef3c7;">';
          html += '<td style="padding: 6px 8px; font-weight: 600;">' + escapeHtml(athlete.full_name) + '</td>';
          html += '<td style="padding: 6px 8px;">' + escapeHtml(athlete.role_type || '-') + '</td>';
          html += '<td style="padding: 6px 8px;">' + escapeHtml(athlete.college_code || '-') + '</td>';
          html += '<td style="padding: 6px 8px;">' + escapeHtml(athlete.course || '-') + '</td>';
          html += '<td style="padding: 6px 8px; text-align: center;">' + (athlete.height > 0 ? athlete.height + ' cm' : '-') + '</td>';
          html += '<td style="padding: 6px 8px; text-align: center;">' + (athlete.weight > 0 ? athlete.weight + ' kg' : '-') + '</td>';
          html += '<td style="padding: 6px 8px;">' + escapeHtml(athlete.scholarship_name || 'None') + '</td>';
          html += '<td style="padding: 6px 8px; text-align: center;">';
          html += '<span style="background: #fbbf24; color: #78350f; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">⭐ CAPTAIN</span>';
          html += '</td></tr>';
        });
        
        // Regular athletes
        regularAthletes.forEach(athlete => {
          html += '<tr style="border-bottom: 1px solid #e5e7eb;">';
          html += '<td style="padding: 6px 8px;">' + escapeHtml(athlete.full_name) + '</td>';
          html += '<td style="padding: 6px 8px;">' + escapeHtml(athlete.role_type || '-') + '</td>';
          html += '<td style="padding: 6px 8px;">' + escapeHtml(athlete.college_code || '-') + '</td>';
          html += '<td style="padding: 6px 8px;">' + escapeHtml(athlete.course || '-') + '</td>';
          html += '<td style="padding: 6px 8px; text-align: center;">' + (athlete.height > 0 ? athlete.height + ' cm' : '-') + '</td>';
          html += '<td style="padding: 6px 8px; text-align: center;">' + (athlete.weight > 0 ? athlete.weight + ' kg' : '-') + '</td>';
          html += '<td style="padding: 6px 8px;">' + escapeHtml(athlete.scholarship_name || 'None') + '</td>';
          html += '<td style="padding: 6px 8px; text-align: center;">-</td>';
          html += '</tr>';
        });
        
        html += '</tbody></table>';
      } else {
        html += '<div style="text-align: center; padding: 16px; color: #6b7280; font-size: 12px;">';
        html += 'No athletes registered for this sport yet.';
        html += '</div>';
      }
      
      html += '</div></div>';
    });
    
    // Modal footer
    html += '</div>';
    html += '<div class="modal-footer" style="padding: 10px 16px;">';
    html += '<button class="btn btn-secondary btn-sm" onclick="closeTeamDetailsModal()">Close</button>';
    html += '</div></div>';
    
    modal.innerHTML = html;
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeTeamDetailsModal();
    });
    
  } catch (err) {
    console.error('❌ View details error:', err);
    alert('Error loading team details: ' + err.message);
  }
}

function closeTeamDetailsModal() {
  const modal = $('#teamDetailsModal');
  if (modal) modal.remove();
}

window.toggleTeamForSport = toggleTeamForSport;
window.saveTeamsForSport = saveTeamsForSport;
window.viewTeamDetails = viewTeamDetails;
window.closeTeamDetailsModal = closeTeamDetailsModal;

console.log('✅ Team selection module loaded');

// ==========================================
// MATCHES
// ==========================================

// ==========================================
// UPDATED LOAD MATCHES FUNCTION
// Replace the loadMatches function in tournament.js
// ==========================================

async function loadMatches(filterTourId = null) {
  try {
    let url = 'matches';
    if (filterTourId) url += `&tour_id=${filterTourId}`;
    
    const data = await fetchJSON(url);
    const tbody = $('#matchesTable tbody');
    
    if (!tbody) return;
    
    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="empty-state">No matches found</td></tr>';
      return;
    }
    
    // Fetch all scores to check which matches have been scored
    let allScores = [];
    try {
      allScores = await fetchJSON('scores');
    } catch (err) {
      console.warn('Could not fetch scores:', err);
    }
    
    // Create a map of match_id to whether it has scores
    const matchHasScores = {};
    if (allScores && Array.isArray(allScores)) {
      allScores.forEach(score => {
        if (score.match_id) {
          matchHasScores[score.match_id] = true;
        }
      });
    }
    
    // For individual sports, we need to fetch athlete names for winners
    const athleteMap = {};
    
    // Get all unique winner_ids from individual sports matches
    const individualMatches = data.filter(m => m.sports_type === 'individual' && m.winner_id);
    const winnerIds = [...new Set(individualMatches.map(m => m.winner_id))];
    
    if (winnerIds.length > 0) {
      try {
        const personData = await fetchJSON('get_all_players');
        winnerIds.forEach(winnerId => {
          const athlete = personData.find(p => p.person_id == winnerId);
          if (athlete) {
            athleteMap[winnerId] = `${athlete.f_name} ${athlete.l_name}`;
          }
        });
      } catch (err) {
        console.warn('Could not fetch athlete names:', err);
      }
    }
    
    // Group matches by status
    const currentDate = new Date();
    const currentTime = currentDate.getTime();
    
    const playing = [];
    const upcoming = [];
    const played = [];
    
    data.forEach(m => {
      const matchDateTime = new Date(`${m.sked_date} ${m.sked_time}`).getTime();
      const hasWinner = m.winner_id != null;
      
      // Add hasScores flag to match object
      m.hasScores = matchHasScores[m.match_id] === true;
      
      if (hasWinner) {
        played.push(m);
      } else if (matchDateTime > currentTime) {
        upcoming.push(m);
      } else {
        playing.push(m);
      }
    });
    
// Helper function to extract numeric part from game number for proper sorting
    const extractGameNumber = (gameNo) => {
      if (!gameNo) return 0;
      // Remove all non-digit characters and parse as integer
      const numStr = String(gameNo).replace(/\D/g, '');
      return numStr ? parseInt(numStr, 10) : 0;
    };
    
    // Sort each group by game number primarily
    playing.sort((a, b) => {
      const numA = extractGameNumber(a.game_no);
      const numB = extractGameNumber(b.game_no);
      return numA - numB;
    });
    
    upcoming.sort((a, b) => {
      const numA = extractGameNumber(a.game_no);
      const numB = extractGameNumber(b.game_no);
      return numA - numB;
    });
    
    played.sort((a, b) => {
      const numA = extractGameNumber(a.game_no);
      const numB = extractGameNumber(b.game_no);
      return numA - numB;
    });
    
    // Helper function to render match row
    const renderMatchRow = (m, status = 'pending') => {
      const teamADisplay = m.sports_type === 'individual' 
        ? '<em style="color:#6b7280;">Individual Event</em>' 
        : escapeHtml(m.team_a_name || 'TBA');
      
      const teamBDisplay = m.sports_type === 'individual' 
        ? '<em style="color:#6b7280;">-</em>' 
        : escapeHtml(m.team_b_name || 'TBA');
      
      // DEBUG: Log score button condition
      const shouldShowScoreButton = ((status === 'playing' || status === 'played') && !m.hasScores);
      if (status === 'playing') {
        console.log(`🔍 Match ${m.match_id} (${m.game_no}):`, {
          status,
          hasScores: m.hasScores,
          shouldShowScoreButton,
          winner_id: m.winner_id
        });
      }
      
      // Winner display and status badge
      let winnerDisplay = '-';
      let statusBadge = '';
      
      if (m.winner_id) {
        if (m.sports_type === 'individual') {
          winnerDisplay = athleteMap[m.winner_id] || 'Winner declared';
        } else {
          winnerDisplay = escapeHtml(m.winner_name || 'Winner declared');
        }
        statusBadge = `<span class="badge badge-active">🏆 ${winnerDisplay}</span>`;
      } else {
        // Different badges based on match status
        if (status === 'playing') {
          statusBadge = '<span class="badge" style="background:#fbbf24;color:#78350f;border-color:#f59e0b;">🏃 In Progress</span>';
        } else if (status === 'upcoming') {
          statusBadge = '<span class="badge" style="background:#dbeafe;color:#1e40af;border-color:#3b82f6;">📅 Scheduled</span>';
        } else {
          statusBadge = '<span class="badge" style="background:#fef3c7;color:#92400e;">⏳ Pending</span>';
        }
      }
      
      // Participant info display for individual sports
      let participantInfo = '';
      if (m.sports_type === 'individual') {
        const total = parseInt(m.total_participants) || 0;
        const registered = parseInt(m.registered_count) || 0;
        const competed = parseInt(m.competed_count) || 0;
        
        participantInfo = `
          <div style="font-size: 11px; margin-top: 4px; color: #6b7280;">
            ${total > 0 ? `
              <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px;">
                <span style="background: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 3px; font-size: 10px;">
                  📋 ${registered} Registered
                </span>
                ${competed > 0 ? `
                  <span style="background: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 3px; font-size: 10px;">
                    ✅ ${competed} Competed
                  </span>
                ` : ''}
              </div>
            ` : '<span style="color: #dc2626; font-size: 10px;">⚠️ No participants</span>'}
          </div>
        `;
      }
      
      return `
        <tr>
          <td>${escapeHtml(m.game_no)}</td>
          <td>${m.sked_date}</td>
          <td>${m.sked_time}</td>
          <td>
            ${escapeHtml(m.sports_name)}
            <br><small style="color:#6b7280;">${m.sports_type === 'individual' ? '👤 Individual' : '👥 Team'}</small>
          </td>
          <td>${escapeHtml(m.match_type)}</td>
          <td>
            ${teamADisplay}
            ${participantInfo}
          </td>
          <td>${teamBDisplay}</td>
          <td>${escapeHtml(m.venue_name || 'TBA')}</td>
          <td>${statusBadge}</td>
          <td>
            ${m.sports_type === 'individual' 
              ? `<button class="btn btn-sm btn-primary" onclick="viewMatchParticipants(${m.match_id}, '${escapeHtml(m.sports_name)}', '${m.game_no}')" 
                         title="View and manage participants">
                   <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                     <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
                   </svg>
                   Participants (${m.total_participants || 0})
                 </button>
                 <br style="margin-bottom: 4px;">`
              : ''}
            ${((status === 'playing' || status === 'played') && !m.hasScores) ? `
              <button class="btn btn-sm btn-success" onclick="openScoringModal(${m.match_id}, '${escapeHtml(m.sports_name)}', '${m.sports_type}')" title="Score this match">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                </svg>
                Score
              </button>
              <br style="margin-bottom: 4px;">
            ` : ''}
            <button class="btn btn-sm" onclick="viewMatchDetails(${m.match_id})" title="View full match details">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
              </svg>
              View
            </button>
            <button class="btn btn-sm" onclick="editMatch(${m.match_id})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteMatch(${m.match_id})">Delete</button>
          </td>
        </tr>
      `;
    };
    
    // Build the grouped HTML
    let html = '';
    
    // Playing matches (ongoing, no winner yet, past scheduled time)
    if (playing.length > 0) {
      html += `
        <tr class="match-group-header">
          <td colspan="10" style="background: #fef3c7; font-weight: 600; color: #92400e; padding: 10px 14px; border-top: 2px solid #fbbf24;">
            🏃 PLAYING NOW (${playing.length})
          </td>
        </tr>
      `;
      html += playing.map(m => renderMatchRow(m, 'playing')).join('');
    }
    
    // Upcoming matches (scheduled for future)
    if (upcoming.length > 0) {
      html += `
        <tr class="match-group-header">
          <td colspan="10" style="background: #dbeafe; font-weight: 600; color: #1e40af; padding: 10px 14px; border-top: 2px solid #3b82f6;">
            📅 UPCOMING (${upcoming.length})
          </td>
        </tr>
      `;
      html += upcoming.map(m => renderMatchRow(m, 'upcoming')).join('');
    }
    
    // Played matches (have winner)
    if (played.length > 0) {
      html += `
        <tr class="match-group-header">
          <td colspan="10" style="background: #d1fae5; font-weight: 600; color: #065f46; padding: 10px 14px; border-top: 2px solid #10b981;">
            ✅ PLAYED (${played.length})
          </td>
        </tr>
      `;
      html += played.map(m => renderMatchRow(m, 'played')).join('');
    }
    
    tbody.innerHTML = html;
    
    // Populate both scoring and winner dropdowns
    populateMatchDropdowns(data);
    populateWinnerMatchDropdowns(data);
    
    console.log('✅ Matches loaded:', data.length, '| Playing:', playing.length, '| Upcoming:', upcoming.length, '| Played:', played.length);
  } catch (err) {
    console.error('❌ loadMatches error:', err);
  }
}

// ==========================================
// MISSING FUNCTIONS - Add these to tournament.js
// ==========================================

// ==========================================
// VIEW MATCH PARTICIPANTS MODAL
// ==========================================
async function viewMatchParticipants(matchId, sportsName, gameNo) {
  try {
    console.log('📋 Loading participants for match:', matchId);
    
    const participants = await fetchJSON('match_participants', { match_id: matchId });
    console.log('✅ Participants loaded:', participants);
    
    const html = `
      <div class="modal active" id="participantsModal">
        <div class="modal-content wide">
          <div class="modal-header">
            <h2>Match Participants - ${escapeHtml(sportsName)} (Game ${escapeHtml(gameNo)})</h2>
            <span class="close-modal" onclick="closeModal('participantsModal')">&times;</span>
          </div>
          <div class="modal-body">
            <div style="margin-bottom: 16px;">
              <button class="btn btn-primary btn-sm" onclick="showAddParticipantModal(${matchId})">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                </svg>
                Add Participant
              </button>
            </div>
            
            ${!participants || participants.length === 0 ? 
              '<div class="empty-state">No participants registered yet. Click "Add Participant" to register athletes.</div>' :
              `<table class="table">
                <thead>
                  <tr>
                    <th>Athlete</th>
                    <th>Team</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Rank</th>
                    <th>Medal</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${participants.map(p => {
                    const statusBadge = {
                      'registered': '<span class="badge" style="background:#dbeafe;color:#1e40af;">📋 Registered</span>',
                      'competed': '<span class="badge" style="background:#d1fae5;color:#065f46;">✅ Competed</span>',
                      'absent': '<span class="badge" style="background:#fee2e2;color:#991b1b;">❌ Absent</span>',
                      'disqualified': '<span class="badge" style="background:#fef3c7;color:#92400e;">⚠️ Disqualified</span>'
                    }[p.status] || '<span class="badge">Unknown</span>';
                    
                    const medalBadge = p.medal_type ? 
                      `<span class="badge ${p.medal_type}">${p.medal_type}</span>` : '-';
                    
                    return `
                      <tr>
                        <td><strong>${escapeHtml(p.athlete_name || 'Unknown')}</strong></td>
                        <td>${escapeHtml(p.team_name || '-')}</td>
                        <td>${statusBadge}</td>
                        <td>${p.score || '-'}</td>
                        <td>${p.rank_no || '-'}</td>
                        <td>${medalBadge}</td>
                        <td>
                          <select name="participant_status" class="form-control" style="width:120px;padding:4px 8px;font-size:11px;" 
                                  onchange="updateParticipantStatus(${p.participant_id}, this.value)">
                            <option value="">Change Status</option>
                            <option value="registered" ${p.status === 'registered' ? 'selected' : ''}>Registered</option>
                            <option value="competed" ${p.status === 'competed' ? 'selected' : ''}>Competed</option>
                            <option value="absent" ${p.status === 'absent' ? 'selected' : ''}>Absent</option>
                            <option value="disqualified" ${p.status === 'disqualified' ? 'selected' : ''}>Disqualified</option>
                          </select>
                          <button class="btn btn-sm btn-danger" onclick="removeParticipant(${p.participant_id}, ${matchId})" 
                                  style="margin-top:4px;">Remove</button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>`
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('participantsModal')">Close</button>
          </div>
        </div>
      </div>
    `;
    
    $('#modalContainer').innerHTML = html;
  } catch (err) {
    console.error('❌ Error loading participants:', err);
    alert('Error loading participants: ' + err.message);
  }
}

// ==========================================
// ADD PARTICIPANT TO MATCH
// ==========================================
async function showAddParticipantModal(matchId) {
  try {
    // Get match details first
    const matches = await fetchJSON('matches');
    const match = matches.find(m => m.match_id == matchId);
    
    if (!match) {
      alert('Match not found');
      return;
    }
    
    // Load available athletes
    const athletes = await fetchJSON('available_athletes_for_match', {
      tour_id: match.tour_id,
      sports_id: match.sports_id,
      match_id: matchId
    });
    
    if (!athletes || athletes.length === 0) {
      alert('No available athletes to add. All athletes may already be registered for this match.');
      return;
    }
    
    const html = `
      <div class="modal active" id="addParticipantModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Add Participant</h2>
            <span class="close-modal" onclick="closeModal('addParticipantModal')">&times;</span>
          </div>
          <div class="modal-body">
            <form id="addParticipantForm" onsubmit="submitAddParticipant(event, ${matchId})">
              <div class="form-group">
                <label class="form-label">Select Athlete *</label>
                <select name="athlete_id" class="form-control" required>
                  <option value="">-- Select Athlete --</option>
                  ${athletes.map(a => `
                    <option value="${a.athlete_id}">
                      ${escapeHtml(a.athlete_name)}${a.team_name ? ' (' + escapeHtml(a.team_name) + ')' : ''}
                    </option>
                  `).join('')}
                </select>
              </div>
              
              <div style="margin-top: 20px; display: flex; gap: 8px; justify-content: flex-end;">
                <button type="button" class="btn btn-secondary" onclick="closeModal('addParticipantModal')">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Participant</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    $('#modalContainer').innerHTML = html;
  } catch (err) {
    console.error('❌ Error showing add participant modal:', err);
    alert('Error loading athletes: ' + err.message);
  }
}

async function submitAddParticipant(event, matchId) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  formData.append('match_id', matchId);
  
  try {
    const result = await fetchJSON('add_match_participant', {
      method: 'POST',
      body: formData
    });
    
    if (result.ok) {
      alert('Participant added successfully!');
      closeModal('addParticipantModal');
      
      // Reload participants modal
      const matches = await fetchJSON('matches');
      const match = matches.find(m => m.match_id == matchId);
      if (match) {
        viewMatchParticipants(matchId, match.sports_name, match.game_no);
      }
    } else {
      alert('Error: ' + (result.message || 'Failed to add participant'));
    }
  } catch (err) {
    console.error('❌ Error adding participant:', err);
    alert('Error adding participant: ' + err.message);
  }
}

// ==========================================
// UPDATE PARTICIPANT STATUS
// ==========================================
async function updateParticipantStatus(participantId, newStatus) {
  if (!newStatus) return;
  
  try {
    const formData = new FormData();
    formData.append('participant_id', participantId);
    formData.append('status', newStatus);
    
    const result = await fetchJSON('update_participant_status', {
      method: 'POST',
      body: formData
    });
    
    if (result.ok) {
      alert('Status updated successfully!');
      // Reload the participants modal
      const modal = document.getElementById('participantsModal');
      if (modal) {
        const titleText = modal.querySelector('.modal-header h2').textContent;
        const matches = titleText.match(/Game (.+)\)/);
        if (matches) {
          location.reload(); // Simple reload for now
        }
      }
    } else {
      alert('Error: ' + (result.message || 'Failed to update status'));
    }
  } catch (err) {
    console.error('❌ Error updating status:', err);
    alert('Error updating status: ' + err.message);
  }
}

// ==========================================
// REMOVE PARTICIPANT
// ==========================================
async function removeParticipant(participantId, matchId) {
  if (!confirm('Are you sure you want to remove this participant from the match?')) {
    return;
  }
  
  try {
    const formData = new FormData();
    formData.append('participant_id', participantId);
    
    const result = await fetchJSON('remove_match_participant', {
      method: 'POST',
      body: formData
    });
    
    if (result.ok) {
      alert('Participant removed successfully!');
      
      // Reload participants modal
      const matches = await fetchJSON('matches');
      const match = matches.find(m => m.match_id == matchId);
      if (match) {
        viewMatchParticipants(matchId, match.sports_name, match.game_no);
      }
    } else {
      alert('Error: ' + (result.message || 'Failed to remove participant'));
    }
  } catch (err) {
    console.error('❌ Error removing participant:', err);
    alert('Error removing participant: ' + err.message);
  }
}

// ==========================================
// VIEW MATCH DETAILS MODAL
// ==========================================
async function viewMatchDetails(matchId) {
  try {
    const matches = await fetchJSON('matches');
    const match = matches.find(m => m.match_id == matchId);
    
    if (!match) {
      alert('Match not found');
      return;
    }
    
    // Get scores if available
    let scores = [];
    try {
      scores = await fetchJSON('match_scores', { match_id: matchId });
    } catch (err) {
      console.warn('No scores available:', err);
    }
    
    const html = `
      <div class="modal active" id="matchDetailsModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Match Details</h2>
            <span class="close-modal" onclick="closeModal('matchDetailsModal')">&times;</span>
          </div>
          <div class="modal-body">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 13px;">
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Game Number:</div>
                <div>${escapeHtml(match.game_no)}</div>
              </div>
              
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Sport:</div>
                <div>${escapeHtml(match.sports_name)} (${match.sports_type === 'individual' ? 'Individual' : 'Team'})</div>
              </div>
              
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Match Type:</div>
                <div>${escapeHtml(match.match_type)}</div>
              </div>
              
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Date & Time:</div>
                <div>${match.sked_date} at ${match.sked_time}</div>
              </div>
              
              ${match.sports_type === 'team' ? `
                <div>
                  <div style="font-weight: 600; margin-bottom: 4px;">Team A:</div>
                  <div>${escapeHtml(match.team_a_name || 'TBA')}</div>
                </div>
                
                <div>
                  <div style="font-weight: 600; margin-bottom: 4px;">Team B:</div>
                  <div>${escapeHtml(match.team_b_name || 'TBA')}</div>
                </div>
              ` : `
                <div style="grid-column: span 2;">
                  <div style="font-weight: 600; margin-bottom: 4px;">Participants:</div>
                  <div>${match.total_participants || 0} registered</div>
                </div>
              `}
              
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Venue:</div>
                <div>${escapeHtml(match.venue_name || 'TBA')}</div>
              </div>
              
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Umpire:</div>
                <div>${escapeHtml(match.umpire_name || 'Not assigned')}</div>
              </div>
              
              ${match.winner_id ? `
                <div style="grid-column: span 2;">
                  <div style="font-weight: 600; margin-bottom: 4px;">Winner:</div>
                  <div style="color: #059669; font-weight: 600;">
                    🏆 ${escapeHtml(match.winner_name || 'Winner declared')}
                  </div>
                </div>
              ` : ''}
            </div>
            
            ${scores.length > 0 ? `
              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border);">
                <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">Scores</h3>
                <table class="table">
                  <thead>
                    <tr>
                      <th>Competitor</th>
                      <th>Score</th>
                      <th>Rank</th>
                      <th>Medal</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${scores.map(s => `
                      <tr>
                        <td>${escapeHtml(s.athlete_name || s.team_name || 'Unknown')}</td>
                        <td><strong>${escapeHtml(s.score)}</strong></td>
                        <td>${s.rank_no}</td>
                        <td>${s.medal_type && s.medal_type !== 'None' ? 
                          `<span class="badge ${s.medal_type}">${s.medal_type}</span>` : '-'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('matchDetailsModal')">Close</button>
            <button class="btn btn-primary" onclick="editMatch(${matchId})">Edit Match</button>
          </div>
        </div>
      </div>
    `;
    
    $('#modalContainer').innerHTML = html;
  } catch (err) {
    console.error('❌ Error loading match details:', err);
    alert('Error loading match details: ' + err.message);
  }
}

// ==========================================
// SCORING MODAL FOR MATCHES
// ==========================================

async function openScoringModal(matchId, sportsName, sportsType) {
  try {
    console.log('📊 Opening scoring modal for match:', matchId);
    
    // Get match details
    const matches = await fetchJSON('matches');
    const match = matches.find(m => m.match_id == matchId);
    
    if (!match) {
      alert('Match not found');
      return;
    }
    
    // Get existing scores
    let scores = [];
    try {
      scores = await fetchJSON('match_scores', { match_id: matchId });
    } catch (err) {
      console.warn('No scores yet:', err);
    }
    
    const html = `
      <div class="modal active" id="scoringModal">
        <div class="modal-content wide">
          <div class="modal-header">
            <h2>Score Match - ${escapeHtml(sportsName)} (Game ${escapeHtml(match.game_no)})</h2>
            <span class="close-modal" onclick="closeModal('scoringModal')">&times;</span>
          </div>
          <div class="modal-body">
            <!-- Match Info Banner -->
            <div style="background: #f3f4f6; border-radius: 6px; padding: 12px; margin-bottom: 20px;">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; font-size: 13px;">
                <div><strong>Date:</strong> ${match.sked_date}</div>
                <div><strong>Time:</strong> ${match.sked_time}</div>
                <div><strong>Venue:</strong> ${escapeHtml(match.venue_name || 'TBA')}</div>
                <div><strong>Type:</strong> ${escapeHtml(match.match_type)}</div>
              </div>
            </div>
            
            <!-- Info Note -->
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 12px; margin-bottom: 16px;">
              <p style="font-size: 12px; color: #1e40af; margin: 0;">
                <strong>ℹ️ Auto-Scoring:</strong> Ranks and medals are automatically assigned based on performance and match type (Final, Semi-Final, etc.).
              </p>
            </div>
            
            <!-- Scoring Form -->
            <form id="modalScoringForm" class="form" onsubmit="return submitModalScore(event, ${matchId}, '${escapeHtml(sportsName)}', '${sportsType}')">
              <div class="form-group">
                <label class="form-label">Competitor (Team/Athlete) *</label>
                <select id="modalScoreCompetitor" name="competitor_id" class="form-control" required>
                  <option value="">-- Select Competitor --</option>
                </select>
              </div>
              
              <!-- Dynamic Sport-Specific Score Fields Container -->
              <div id="modalScoreFieldsContainer">
                <!-- Sport-specific fields will be rendered here dynamically -->
              </div>
              
              <button class="btn btn-success" type="submit">Save Score</button>
              <div class="msg" id="modalScoringMsg"></div>
            </form>
            
${scores.length > 0 ? `
              <!-- Scores Table -->
              <div style="margin-top: 24px; padding-top: 20px; border-top: 2px solid var(--border);">
                <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">Current Scores</h3>
                <table class="table">
                  <thead>
                    <tr>
                      <th>Competitor</th>
                      <th>Score</th>
                      <th>Rank</th>
                      <th>Medal</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${scores.sort((a, b) => a.rank_no - b.rank_no).map(s => {
                      // ✅ FIXED: Properly display competitor name based on sport type
                      let competitorName = 'Unknown';
                      if (sportsType === 'team') {
                        competitorName = s.team_name || 'Unknown Team';
                      } else {
                        competitorName = s.athlete_name || 'Unknown Athlete';
                      }
                      
                      return `
                        <tr>
                          <td>${escapeHtml(competitorName)}</td>
                          <td><strong>${escapeHtml(s.score)}</strong></td>
                          <td>${s.rank_no}</td>
                          <td>${s.medal_type && s.medal_type !== 'None' ? `<span class="badge ${s.medal_type}">${s.medal_type}</span>` : '-'}</td>
                          <td>
                            <button class="btn btn-sm btn-danger" onclick="deleteModalScore(${s.competetors_score_id}, ${matchId}, '${escapeHtml(sportsName)}', '${sportsType}')">Delete</button>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('scoringModal')">Close</button>
          </div>
        </div>
      </div>
    `;
    
    $('#modalContainer').innerHTML = html;
    
    // Load competitors
    await loadModalCompetitors(matchId, sportsType, match);
    
    // Render sport-specific scoring fields
    const scoreFieldsContainer = $('#modalScoreFieldsContainer');
    const scoringConfig = getSportScoringConfig(sportsName);
    renderSportScoringFields(scoringConfig, scoreFieldsContainer);
    
    console.log('✅ Scoring modal opened');
  } catch (err) {
    console.error('❌ Error opening scoring modal:', err);
    alert('Error opening scoring modal: ' + err.message);
  }
}



// Load competitors for the modal
// ==========================================
// FIXED: Load competitors for the modal
// ==========================================

async function loadModalCompetitors(matchId, sportsType, match) {
  const competitorSelect = $('#modalScoreCompetitor');
  
  if (!competitorSelect) return;
  
  try {
    // ✅ FIRST: Get existing scores for this match
    let existingScores = [];
    try {
      existingScores = await fetchJSON('match_scores', { match_id: matchId });
      console.log('📊 Existing scores loaded:', existingScores);
    } catch (err) {
      console.warn('No existing scores yet:', err);
      existingScores = [];
    }
    
    // Create a set of already-scored competitor IDs
    const scoredTeamIds = new Set();
    const scoredAthleteIds = new Set();
    
    existingScores.forEach(score => {
      if (score.team_id) scoredTeamIds.add(parseInt(score.team_id));
      if (score.athlete_id) scoredAthleteIds.add(parseInt(score.athlete_id));
    });
    
    if (sportsType === 'team') {
      // For team sports, show the two teams (exclude already scored)
      const teamAId = parseInt(match.team_a_id);
      const teamBId = parseInt(match.team_b_id);
      
      const teamAScored = scoredTeamIds.has(teamAId);
      const teamBScored = scoredTeamIds.has(teamBId);
      
      let options = '<option value="">-- Select Team --</option>';
      
      if (!teamAScored) {
        options += `<option value="team_${teamAId}">${escapeHtml(match.team_a_name)}</option>`;
      }
      
      if (!teamBScored) {
        options += `<option value="team_${teamBId}">${escapeHtml(match.team_b_name)}</option>`;
      }
      
      // If both teams are scored
      if (teamAScored && teamBScored) {
        options = '<option value="">All teams have been scored</option>';
      }
      
      competitorSelect.innerHTML = options;
      console.log('✅ Team competitors loaded (excluding scored teams)');
    } else {
      // Individual sport - load athletes who are registered for this match
      competitorSelect.innerHTML = '<option value="">Loading athletes...</option>';
      
      let participants = null;
      
      // Try to get registered participants for this specific match
      try {
        console.log('📡 Fetching match participants...');
        participants = await fetchJSON('match_participants', { match_id: matchId });
        console.log('✅ Match participants response:', participants);
        
        if (participants && Array.isArray(participants) && participants.length > 0) {
          console.log(`✅ Found ${participants.length} registered participants`);
        } else {
          console.log('⚠️ No participants registered for this match, loading all athletes');
          participants = null;
        }
      } catch (participantError) {
        console.log('ℹ️ match_participants not available, using fallback');
        participants = null;
      }
      
      // Fallback: Load all athletes for the sport
      if (!participants || participants.length === 0) {
        console.log('📡 Loading all athletes for sport (fallback)...');
        
        const allAthletes = await fetchJSON('match_athletes', { 
          tour_id: match.tour_id, 
          sports_id: match.sports_id 
        });
        
        if (!allAthletes || allAthletes.length === 0) {
          competitorSelect.innerHTML = '<option value="">No athletes registered for this sport</option>';
          return;
        }
        
        // Convert to participant format
        participants = allAthletes.map(a => ({
          athlete_id: a.athlete_id,
          athlete_name: a.athlete_name,
          team_name: a.team_name,
          is_captain: a.is_captain,
          status: null,
          score: null,
          rank_no: null
        }));
        
        console.log(`✅ Loaded ${participants.length} athletes from match_athletes (fallback)`);
      }
      
      // Filter out already-scored athletes
      const unscoredParticipants = participants.filter(p => {
        return !scoredAthleteIds.has(parseInt(p.athlete_id));
      });
      
      console.log(`📋 ${unscoredParticipants.length} unscored athletes (out of ${participants.length} total)`);
      
      if (unscoredParticipants.length === 0) {
        competitorSelect.innerHTML = '<option value="">All athletes have been scored</option>';
        return;
      }
      
      // Sort participants: scored first (by rank), then competed, then registered, then alphabetically
      const sorted = unscoredParticipants.sort((a, b) => {
        // Competed athletes first
        if (a.status === 'competed' && b.status !== 'competed') return -1;
        if (a.status !== 'competed' && b.status === 'competed') return 1;
        
        // Registered but not competed
        if (a.status === 'registered' && b.status !== 'registered') return -1;
        if (a.status !== 'registered' && b.status === 'registered') return 1;
        
        // Otherwise alphabetically
        return (a.athlete_name || '').localeCompare(b.athlete_name || '');
      });
      
      // Build dropdown options
      let options = '<option value="">-- Select Athlete --</option>';
      
      sorted.forEach(participant => {
        const athleteName = participant.athlete_name || 'Unknown Athlete';
        const teamInfo = participant.team_name ? ` (${escapeHtml(participant.team_name)})` : '';
        const captain = participant.is_captain == 1 ? ' 🏅' : '';
        
        let statusInfo = '';
        if (participant.status === 'registered') {
          statusInfo = ' - Registered ✓';
        } else if (participant.status === 'competed') {
          statusInfo = ' - Competed';
        }
        
        options += `<option value="athlete_${participant.athlete_id}">
          ${escapeHtml(athleteName)}${teamInfo}${captain}${statusInfo}
        </option>`;
      });
      
      competitorSelect.innerHTML = options;
      console.log('✅ Athlete competitors loaded (excluding scored athletes)');
    }
  } catch (err) {
    console.error('❌ Error loading competitors:', err);
    competitorSelect.innerHTML = '<option value="">Error loading competitors</option>';
  }
}

// Submit score from modal
async function submitModalScore(event, matchId, sportsName, sportsType) {
  event.preventDefault();
  
  const msg = $('#modalScoringMsg');
  msg.textContent = "Saving score...";
  msg.style.color = '#6b7280';

  try {
    const competitorValue = $('#modalScoreCompetitor').value;
    
    if (!competitorValue) {
      msg.textContent = 'Please select a competitor';
      msg.style.color = 'red';
      return false;
    }
    
    // Get match details
    const matches = await fetchJSON('matches');
    const match = matches.find(m => m.match_id == matchId);
    
    if (!match) {
      msg.textContent = 'Match not found';
      msg.style.color = 'red';
      return false;
    }
    
    // Get sport-specific scoring configuration
    const scoringConfig = getSportScoringConfig(sportsName);
    
    // Collect values from sport-specific fields
    const fieldValues = {};
    let hasError = false;
    
    scoringConfig.fields.forEach(field => {
      let input = document.getElementById(`score_${field.id}`);
      if (!input) {
        input = document.getElementById(field.id);
      }
      if (input) {
        const value = input.value.trim();
        
        if (!field.optional && !value) {
          msg.textContent = `Please enter ${field.label}`;
          msg.style.color = 'red';
          hasError = true;
          return;
        }
        
        fieldValues[field.id] = value;
      }
    });
    
    if (hasError) return false;
    
    // Calculate final score
    const finalScore = scoringConfig.calculateScore(fieldValues);
    console.log('📊 Calculated score:', finalScore);
    
    // Parse competitor value
    let isTeam = false;
    let isAthlete = false;
    let competitorId = null;
    
    if (competitorValue.startsWith('team_')) {
      isTeam = true;
      competitorId = competitorValue.replace('team_', '');
      console.log('💾 Saving TEAM score - team_id:', competitorId);
    } else if (competitorValue.startsWith('athlete_')) {
      isAthlete = true;
      competitorId = competitorValue.replace('athlete_', '');
      console.log('💾 Saving ATHLETE score - athlete_id:', competitorId);
    } else {
      msg.textContent = 'Invalid competitor selection';
      msg.style.color = 'red';
      return false;
    }
    
    // Get existing scores to determine rank
    let existingScores = [];
    try {
      existingScores = await fetchJSON('match_scores', { match_id: matchId });
    } catch (err) {
      console.warn('No existing scores:', err);
    }
    
    // Calculate rank based on sport type
// ❌ DO NOT CALCULATE RANK HERE - Backend will recalculate all ranks after save
    // Just pass rank_no as null or a placeholder
    let autoRank = null;
    
    console.log('📊 Rank will be auto-calculated by backend after all scores saved');
    

    
    // Prepare form data - NO MEDAL TYPE sent to backend
    const formData = new URLSearchParams();
    formData.set('tour_id', match.tour_id);
    formData.set('match_id', matchId);
    
    if (isTeam) {
      formData.set('team_id', competitorId);
      formData.set('athlete_id', '');
    } else {
      formData.set('team_id', '');
      formData.set('athlete_id', competitorId);
    }
    
    formData.set('score', finalScore);
 formData.set('rank_no', '');
    // ✅ DO NOT send medal_type - backend will assign after all scored

    console.log('📤 Sending score data:', Object.fromEntries(formData));

    const data = await fetchJSON('save_score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    console.log('📥 Save score response:', data);

    if (data.ok) {
      // Check if all competitors have been scored
      if (data.all_scored) {
        msg.textContent = '✅ ' + data.message;
        msg.style.color = '#059669';
        msg.style.background = '#d1fae5';
        msg.style.padding = '12px';
        msg.style.borderRadius = '6px';
        msg.style.border = '1px solid #6ee7b7';
        
        // Show success message for longer
        setTimeout(() => {
          openScoringModal(matchId, sportsName, sportsType);
        }, 2000);
      } else {
        msg.textContent = data.message || 'Score saved! Waiting for all competitors...';
        msg.style.color = '#d97706';
        msg.style.background = '#fef3c7';
        msg.style.padding = '12px';
        msg.style.borderRadius = '6px';
        msg.style.border = '1px solid #fde68a';
        
        // Refresh after shorter delay
        setTimeout(() => {
          openScoringModal(matchId, sportsName, sportsType);
        }, 1000);
      }
      
      // Clear score fields
      scoringConfig.fields.forEach(field => {
        let input = document.getElementById(`score_${field.id}`);
        if (!input) {
          input = document.getElementById(field.id);
        }
        if (input) input.value = '';
      });
      
      // Update participant status if individual sport
      if (isAthlete && competitorId) {
        try {
          const participants = await fetchJSON('match_participants', { match_id: matchId });
          const participant = participants.find(p => p.athlete_id == competitorId);
          
          if (participant && participant.participant_id) {
            const statusFormData = new FormData();
            statusFormData.append('participant_id', participant.participant_id);
            statusFormData.append('status', 'competed');
            
            await fetchJSON('update_participant_status', {
              method: 'POST',
              body: statusFormData
            });
            
            console.log('✅ Participant status updated to competed');
          }
        } catch (statusErr) {
          console.warn('⚠️ Could not update participant status:', statusErr);
        }
      }
    } else {
      msg.textContent = data.message || 'Error saving score';
      msg.style.color = 'red';
    }
  } catch (err) {
    console.error('❌ Score save error:', err);
    msg.textContent = 'Error saving score: ' + err.message;
    msg.style.color = 'red';
  }
  
  return false;
}

// Helper function to parse time strings to milliseconds for comparison
function parseTimeToMilliseconds(timeStr) {
  if (!timeStr) return Infinity;
  
  // Format: "MM:SS.mmm" or "SS.mmms"
  const parts = timeStr.split(':');
  let minutes = 0;
  let seconds = 0;
  let milliseconds = 0;
  
  if (parts.length === 2) {
    // Has minutes
    minutes = parseInt(parts[0]) || 0;
    const secParts = parts[1].split('.');
    seconds = parseInt(secParts[0]) || 0;
    milliseconds = parseInt(secParts[1]) || 0;
  } else {
    // Only seconds
    const secParts = timeStr.replace('s', '').split('.');
    seconds = parseInt(secParts[0]) || 0;
    milliseconds = parseInt(secParts[1]) || 0;
  }
  
  return (minutes * 60 * 1000) + (seconds * 1000) + milliseconds;
}

// Delete score from modal
async function deleteModalScore(scoreId, matchId, sportsName, sportsType) {
  if (!confirm('Delete this score?')) return;
  
  try {
    const formData = new URLSearchParams();
    formData.set('score_id', scoreId);

    const data = await fetchJSON('delete_score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    if (data.ok) {
      // Refresh the modal
      openScoringModal(matchId, sportsName, sportsType);
    } else {
      alert(data.message || 'Failed to delete');
    }
  } catch (err) {
    console.error('❌ Delete score error:', err);
    alert('Error deleting score');
  }
}

// Auto-declare winner after scoring
async function checkAndDeclareWinner(matchId, sportsType) {
  try {
    console.log('🔍 Checking if match has all scores for winner declaration...');
    
    const scores = await fetchJSON('match_scores', { match_id: matchId });
    
    if (!scores || scores.length === 0) {
      console.log('⏳ No scores yet');
      return;
    }
    
    console.log(`✅ Found ${scores.length} scores, determining winner...`);
    
    // Determine winner based on scores
    let winnerId = null;
    let winnerType = sportsType === 'team' ? 'team' : 'athlete';
    
    if (sportsType === 'team') {
      // For team sports, check if we have both team scores
      const teamIds = scores.map(s => s.team_id).filter(id => id);
      if (teamIds.length < 2) {
        console.log('⏳ Waiting for both teams to be scored');
        return;
      }
      
      // Use rank_no (lower is better)
      const topScore = scores.sort((a, b) => {
        // Try rank first (lower rank = better)
        if (a.rank_no && b.rank_no) {
          return a.rank_no - b.rank_no;
        }
        // Fall back to score comparison for point-based sports
        const scoreA = parseFloat(a.score) || 0;
        const scoreB = parseFloat(b.score) || 0;
        return scoreB - scoreA;
      })[0];
      
      winnerId = topScore.team_id;
    } else {
      // For individual sports, use rank_no (lower is better)
      const topAthlete = scores.sort((a, b) => a.rank_no - b.rank_no)[0];
      winnerId = topAthlete.athlete_id;
    }
    
    if (!winnerId) {
      console.log('⚠️ Could not determine winner');
      return;
    }
    
    // Auto-declare winner
    const formData = new URLSearchParams();
    formData.set('match_id', matchId);
    formData.set('sports_type', sportsType);
    formData.set('winner_id', winnerId);
    formData.set('winner_type', winnerType);
    
    console.log('🏆 Auto-declaring winner:', { matchId, winnerId, winnerType, sportsType });
    
    const result = await fetchJSON('declare_winner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });
    
    if (result.ok) {
      console.log('✅ Winner auto-declared successfully');
      
      // Reload matches to reflect winner
      await loadMatches();
    } else {
      console.error('❌ Failed to declare winner:', result);
    }
  } catch (err) {
    console.error('❌ Error auto-declaring winner:', err);
  }
}

async function submitScore(event, matchId, sportsName) {
  event.preventDefault();
  
  const msgEl = $('#scoringMsg');
  const competitorSelect = $('#scoreCompetitor');
  const rankInput = $('#scoreRank');
  const medalSelect = $('#scoreMedal');
  
  if (!competitorSelect.value) {
    msgEl.textContent = 'Please select a competitor';
    msgEl.className = 'msg error';
    return false;
  }
  
  // Parse competitor (format: "type_id")
  const [type, id] = competitorSelect.value.split('_');
  
  // Get sport-specific scoring config
  const scoringConfig = getSportScoringConfig(sportsName);
  
  // Collect field values
  const fieldValues = {};
  scoringConfig.fields.forEach(field => {
    const input = $(`#${field.id}`);
    if (input) {
      fieldValues[field.id] = input.value;
    }
  });
  
  // Calculate final score using sport-specific logic
  const finalScore = scoringConfig.calculateScore(fieldValues);
  
  if (!finalScore) {
    msgEl.textContent = 'Please enter valid score values';
    msgEl.className = 'msg error';
    return false;
  }
  
  try {
    const formData = new URLSearchParams();
    formData.set('match_id', matchId);
    formData.set('score', finalScore);
    formData.set('rank_no', rankInput.value);
    formData.set('medal_type', medalSelect.value);
    
    if (type === 'team') {
      formData.set('team_id', id);
    } else {
      formData.set('athlete_id', id);
    }
    
    const data = await fetchJSON('save_score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });
    
    if (data.ok) {
      msgEl.textContent = '✅ Score saved successfully!';
      msgEl.className = 'msg success';
      
      // Get sports type from the select option
      const selectedOption = competitorSelect.options[competitorSelect.selectedIndex];
      const sportsType = type === 'team' ? 'team' : 'individual';
      
      // Refresh the modal after a short delay
      setTimeout(() => {
        openScoringModal(matchId, sportsName, sportsType);
      }, 1000);
    } else {
      msgEl.textContent = data.message || 'Failed to save score';
      msgEl.className = 'msg error';
    }
  } catch (err) {
    console.error('❌ Error saving score:', err);
    msgEl.textContent = 'Error saving score: ' + err.message;
    msgEl.className = 'msg error';
  }
  
  return false;
}

async function deleteScore(scoreId, matchId, sportsName, sportsType) {
  if (!confirm('Delete this score?')) return;
  
  try {
    const formData = new URLSearchParams();
    formData.set('score_id', scoreId);
    
    const data = await fetchJSON('delete_score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });
    
    if (data.ok) {
      // Refresh the modal
      openScoringModal(matchId, sportsName, sportsType);
    } else {
      alert(data.message || 'Failed to delete score');
    }
  } catch (err) {
    console.error('❌ Error deleting score:', err);
    alert('Error deleting score: ' + err.message);
  }
}

// Export all functions to window
window.viewMatchParticipants = viewMatchParticipants;
window.showAddParticipantModal = showAddParticipantModal;
window.submitAddParticipant = submitAddParticipant;
window.updateParticipantStatus = updateParticipantStatus;
window.removeParticipant = removeParticipant;
window.viewMatchDetails = viewMatchDetails;
window.openScoringModal = openScoringModal;
window.submitModalScore = submitModalScore;
window.deleteModalScore = deleteModalScore;
window.loadModalCompetitors = loadModalCompetitors;
window.checkAndDeclareWinner = checkAndDeclareWinner;
window.parseTimeToMilliseconds = parseTimeToMilliseconds;

console.log('✅ Missing match functions loaded');

// ==========================================
// WINNER DECLARATION - SUPPORTS BOTH TEAM AND INDIVIDUAL SPORTS
// Replace the winner declaration section in tournament.js
// ==========================================

// Populate match dropdowns for winner declaration
function populateWinnerMatchDropdowns(matches) {
  const winnerMatchSelect = $('#winnerMatchSelect');
  
  if (!winnerMatchSelect) return;
  
  // Show matches without winners
  const withoutWinner = matches.filter(m => !m.winner_id);
  
  let opts = '<option value="">-- Select Match --</option>';
  withoutWinner.forEach(m => {
    let matchLabel = '';
    
    if (m.sports_type === 'individual') {
      matchLabel = `${escapeHtml(m.sports_name)} - ${escapeHtml(m.match_type)} - Game #${escapeHtml(m.game_no)} (${m.sked_date})`;
    } else {
      matchLabel = `${escapeHtml(m.sports_name)}: ${escapeHtml(m.team_a_name)} vs ${escapeHtml(m.team_b_name)} - Game #${escapeHtml(m.game_no)} (${m.sked_date})`;
    }
    
    opts += `<option value="${m.match_id}" 
             data-tour-id="${m.tour_id}" 
             data-sports-id="${m.sports_id}"
             data-sports-type="${m.sports_type}"
             data-match-id="${m.match_id}">
      ${matchLabel}
    </option>`;
  });
  
  winnerMatchSelect.innerHTML = opts;
}

// Export the functions
window.populateWinnerMatchDropdowns = populateWinnerMatchDropdowns;

// Load competitors (teams or athletes) when match is selected
// Load competitors (teams or athletes) when match is selected
$('#winnerMatchSelect')?.addEventListener('change', async (e) => {
  const option = e.target.selectedOptions[0];
  const winnerSelect = $('#winner_team_id');
  
  if (!winnerSelect) return;
  
  if (!option || !option.value) {
    winnerSelect.innerHTML = '<option value="">-- Select Winner --</option>';
    return;
  }
  
  const matchId = option.value;
  const sportsType = option.dataset.sportsType;
  const tourId = option.dataset.tourId;
  const sportsId = option.dataset.sportsId;
  
  try {
    if (sportsType === 'team') {
      // For team sports, get the two teams from the match
      const matches = await fetchJSON('matches');
      const match = matches.find(m => m.match_id == matchId);
      
      if (!match) {
        winnerSelect.innerHTML = '<option value="">-- Error: Match not found --</option>';
        return;
      }
      
      winnerSelect.innerHTML = `
        <option value="">-- Select Winner --</option>
        <option value="team_${match.team_a_id}">${escapeHtml(match.team_a_name)}</option>
        <option value="team_${match.team_b_id}">${escapeHtml(match.team_b_name)}</option>
      `;
    } else {
      // For individual sports, get ALL registered athletes for this sport
      winnerSelect.innerHTML = '<option value="">Loading athletes...</option>';
      
      // Get athletes with scores (to show their scores)
      const scores = await fetchJSON('match_scores', { match_id: matchId });
      
      // Get ALL registered athletes for this sport
      const allAthletes = await fetchJSON('match_athletes', { 
        tour_id: tourId, 
        sports_id: sportsId 
      });
      
      if (!allAthletes || allAthletes.length === 0) {
        winnerSelect.innerHTML = '<option value="">No athletes registered for this sport</option>';
        return;
      }
      
      // Create a map of athletes with their scores (if any)
      const athleteScoreMap = {};
      if (scores && scores.length > 0) {
        scores.forEach(score => {
          if (score.athlete_id) {
            athleteScoreMap[score.athlete_id] = {
              rank: score.rank_no,
              score: score.score
            };
          }
        });
      }
      
      // Sort athletes: those with scores first (by rank), then others
      const sortedAthletes = [...allAthletes].sort((a, b) => {
        const aHasScore = athleteScoreMap[a.athlete_id];
        const bHasScore = athleteScoreMap[b.athlete_id];
        
        if (aHasScore && !bHasScore) return -1;
        if (!aHasScore && bHasScore) return 1;
        
        if (aHasScore && bHasScore) {
          if (aHasScore.rank && bHasScore.rank) {
            return aHasScore.rank - bHasScore.rank;
          }
          return (parseFloat(bHasScore.score) || 0) - (parseFloat(aHasScore.score) || 0);
        }
        
        return a.athlete_name.localeCompare(b.athlete_name);
      });
      
      let options = '<option value="">-- Select Winner --</option>';
      
      sortedAthletes.forEach(athlete => {
        const athleteName = athlete.athlete_name || 'Unknown Athlete';
        const teamInfo = athlete.team_name ? ` (${escapeHtml(athlete.team_name)})` : '';
        
        // Add score info if available
        let scoreInfo = '';
        if (athleteScoreMap[athlete.athlete_id]) {
          const scoreData = athleteScoreMap[athlete.athlete_id];
          scoreInfo = ` - Rank ${scoreData.rank}, Score: ${scoreData.score}`;
        }
        
        options += `<option value="athlete_${athlete.athlete_id}">
          ${escapeHtml(athleteName)}${teamInfo}${scoreInfo}
        </option>`;
      });
      
      winnerSelect.innerHTML = options;
    }
  } catch (err) {
    console.error('Error loading competitors for winner selection:', err);
    winnerSelect.innerHTML = '<option value="">Error loading competitors</option>';
  }
});

// Export the updated function
window.loadMatches = loadMatches;

// ==========================================
// UPDATED DECLARE WINNER - With Validation
// Replace the winner form submission in tournament.js
// ==========================================

$('#winnerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('#winnerMsg');
  msg.textContent = "Checking and declaring winner...";
  msg.style.color = '#6b7280';

  try {
    const matchSelect = $('#winnerMatchSelect');
    const winnerSelect = $('#winner_team_id');
    
    const matchId = matchSelect.value;
    const winnerValue = winnerSelect.value;
    
    if (!matchId || !winnerValue) {
      msg.textContent = 'Please select both match and winner';
      msg.style.color = 'red';
      return;
    }
    
    const selectedOption = matchSelect.selectedOptions[0];
    const sportsType = selectedOption.dataset.sportsType;
    
    const formData = new URLSearchParams();
    formData.set('match_id', matchId);
    formData.set('sports_type', sportsType);
    
    // Parse winner value
    if (winnerValue.startsWith('team_')) {
      const teamId = winnerValue.replace('team_', '');
      formData.set('winner_id', teamId);
      formData.set('winner_type', 'team');
    } else if (winnerValue.startsWith('athlete_')) {
      const athleteId = winnerValue.replace('athlete_', '');
      formData.set('winner_id', athleteId);
      formData.set('winner_type', 'athlete');
    } else {
      formData.set('winner_id', winnerValue);
      formData.set('winner_type', 'team');
    }

    const data = await fetchJSON('declare_winner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    if (data.ok) {
      msg.textContent = '✅ ' + data.message;
      msg.style.color = '#059669';
      msg.style.background = '#d1fae5';
      msg.style.padding = '12px';
      msg.style.borderRadius = '6px';
      msg.style.border = '1px solid #6ee7b7';
      
      e.target.reset();
      await loadMatches();
    } else {
      msg.textContent = '⚠️ ' + data.message;
      msg.style.color = '#dc2626';
      msg.style.background = '#fee2e2';
      msg.style.padding = '12px';
      msg.style.borderRadius = '6px';
      msg.style.border = '1px solid #fca5a5';
    }
  } catch (err) {
    console.error('❌ Declare winner error:', err);
    msg.textContent = 'Error: ' + err.message;
    msg.style.color = 'red';
  }
});

// Export updated function
window.submitModalScore = submitModalScore;

// Export the function
window.populateWinnerMatchDropdowns = populateWinnerMatchDropdowns;

async function showScheduleMatchModal() {
  const existingModal = $('#scheduleMatchModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  isSubmittingMatch = false;
  
  const loadingHTML = `
    <div class="modal active" id="scheduleMatchModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Loading...</h3>
        </div>
        <div class="modal-body">
          <div class="loading">Loading form data...</div>
        </div>
      </div>
    </div>
  `;
  
  $('#modalContainer').innerHTML = loadingHTML;
  
  try {
    const [tournaments, venues, umpires] = await Promise.all([
      fetchJSON('tournaments'),
      fetchJSON('venues'),
      fetchJSON('umpires')
    ]);
    
    const activeTournaments = tournaments.filter(t => t.is_active == 1);
    const activeVenues = venues;
    
    if (!$('#scheduleMatchModal')) {
      console.log('Modal was closed during loading, aborting...');
      return;
    }
    
    const modalHTML = `
      <div class="modal active" id="scheduleMatchModal">
        <div class="modal-content wide">
          <div class="modal-header">
            <h3>Schedule New Match</h3>
            <button class="modal-close" onclick="closeScheduleMatchModal()">×</button>
          </div>
          <form id="scheduleMatchForm">
            <div class="modal-body">
              <div class="form" style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                
                <!-- Tournament Selection -->
                <div class="form-group">
                  <label class="form-label">Tournament *</label>
                  <select name="tour_id" class="form-control" id="schedule_tour_id" required>
                    <option value="">-- Select Tournament --</option>
                    ${activeTournaments.map(t => 
                      `<option value="${t.tour_id}">${escapeHtml(t.tour_name)} (${t.school_year})</option>`
                    ).join('')}
                  </select>
                </div>

                <!-- Sport Selection -->
                <div class="form-group">
                  <label class="form-label">Sport *</label>
                  <select name="sports_id" class="form-control" id="schedule_sports_id" required>
                    <option value="">-- Select Sport --</option>
                  </select>
                </div>

                <!-- Game Number -->
                <div class="form-group">
                  <label class="form-label">Game Number *</label>
                  <input type="text" class="form-control" id="schedule_game_no" placeholder="e.g., G001" required>
                </div>

                <!-- Match Type -->
                <div class="form-group">
                  <label class="form-label">Match Type *</label>
                  <select name="match_type" class="form-control" id="schedule_match_type" required>
                    <option value="">-- Select Type --</option>
                    <option value="EL">Elimination (EL)</option>
                    <option value="QF">Quarter Final (QF)</option>
                    <option value="SF">Semi Final (SF)</option>
                    <option value="F">Final (F)</option>
                  </select>
                </div>

                <!-- Date -->
                <div class="form-group">
                  <label class="form-label">Match Date *</label>
                  <input type="date" class="form-control" id="schedule_sked_date" required>
                </div>

                <!-- Time -->
                <div class="form-group">
                  <label class="form-label">Match Time *</label>
                  <input type="time" class="form-control" id="schedule_sked_time" required>
                </div>

                <!-- Venue -->
                <div class="form-group">
                  <label class="form-label">Venue</label>
                  <select name="venue_id" class="form-control" id="schedule_venue_id">
                    <option value="">-- Select Venue --</option>
                    ${activeVenues.map(v => 
                      `<option value="${v.venue_id}">${escapeHtml(v.venue_name)}</option>`
                    ).join('')}
                  </select>
                </div>

                <!-- Umpire -->
                <div class="form-group">
                  <label class="form-label">Umpire</label>
                  <select name="umpire_id" class="form-control" id="schedule_umpire_id">
                    <option value="">-- Select Umpire --</option>
                    ${umpires.map(u => 
                      `<option value="${u.person_id}">${escapeHtml(u.full_name)}</option>`
                    ).join('')}
                  </select>
                </div>

                <!-- TEAM SPORTS Section -->
                <div id="teamsSportsSection" style="grid-column: span 2; display:none;">
                  <div style="background:#f0f9ff;padding:12px;border-radius:6px;margin-bottom:12px;border:1px solid #bfdbfe;">
                    <strong style="color:#1e40af;">👥 Team Sport Match</strong>
                  </div>
                  <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                    <div class="form-group">
                      <label class="form-label">Team A *</label>
                      <select name="team_a_id" class="form-control" id="schedule_team_a_id">
                        <option value="">-- Select Team A --</option>
                      </select>
                    </div>

                    <div class="form-group">
                      <label class="form-label">Team B *</label>
                      <select name="team_b_id" class="form-control" id="schedule_team_b_id">
                        <option value="">-- Select Team B --</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- ✅ UPDATED INDIVIDUAL SPORTS Section - Now with athlete selection -->
                <div id="individualSportsSection" style="grid-column: span 2; display:none;">
                  <div style="background:#f0fdf4;padding:12px;border-radius:6px;margin-bottom:12px;border:1px solid #bbf7d0;">
                    <strong style="color:#166534;">🏃 Individual Sport Match</strong>
                    <p style="font-size:12px;color:#15803d;margin-top:4px;">
                      Select athletes who will compete in this match. You can select multiple athletes.
                    </p>
                  </div>
                  
                  <!-- Athlete Selection Container -->
                  <div id="athleteSelectionContainer" style="margin-top:12px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                      <label class="form-label" style="margin:0;">Select Athletes (Optional)</label>
                      <button type="button" class="btn btn-sm" onclick="loadAthletesForSchedule()" id="loadAthletesBtn">
                        🔄 Load Athletes
                      </button>
                    </div>
                    
                    <div id="athletesList" style="max-height:300px;overflow-y:auto;border:1px solid var(--border);border-radius:6px;padding:8px;background:white;">
                      <p style="text-align:center;color:var(--text-muted);padding:20px;margin:0;">
                        Select a tournament and sport, then click "Load Athletes" to see registered athletes.
                      </p>
                    </div>
                    
                    <div style="margin-top:8px;font-size:11px;color:var(--text-muted);">
                      <strong>Note:</strong> If you don't select athletes now, you can add them later during the scoring phase.
                    </div>
                  </div>
                </div>

                <!-- Sports Type (hidden field) -->
                <input type="hidden" id="schedule_sports_type" value="">

              </div>
              <div id="scheduleMsg" class="msg" style="display:none;"></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeScheduleMatchModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Schedule Match</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    $('#modalContainer').innerHTML = modalHTML;
    
    const form = $('#scheduleMatchForm');
    if (form) {
      form.replaceWith(form.cloneNode(true));
      $('#scheduleMatchForm').addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        saveScheduleMatch(e);
      });
    }
    
    const tourSelect = $('#schedule_tour_id');
    if (tourSelect) {
      tourSelect.addEventListener('change', onScheduleTournamentChange);
    }
    
    const sportsSelect = $('#schedule_sports_id');
    if (sportsSelect) {
      sportsSelect.addEventListener('change', onScheduleSportChange);
    }
    
  } catch (err) {
    console.error('❌ Error loading modal data:', err);
    $('#modalContainer').innerHTML = `
      <div class="modal active" id="scheduleMatchModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Error</h3>
            <button class="modal-close" onclick="closeScheduleMatchModal()">×</button>
          </div>
          <div class="modal-body">
            <p style="color: red;">Error loading form data. Please try again.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeScheduleMatchModal()">Close</button>
          </div>
        </div>
      </div>
    `;
  }
}

async function loadScheduleMatchData() {
  try {
    // Load tournaments (already filtered by assignment)
    const tournaments = await fetchJSON('tournaments');
    const activeTournaments = tournaments.filter(t => t.is_active == 1);
    const tourSelect = $('#schedule_tour_id');
    tourSelect.innerHTML = '<option value="">-- Select Tournament --</option>' + 
      activeTournaments.map(t => `<option value="${t.tour_id}">${escapeHtml(t.tour_name)} (${t.school_year})</option>`).join('');

    // Load venues
const venues = await fetchJSON('venues');
const activeVenues = venues; // API already returns only active venues
    const venueSelect = $('#schedule_venue_id');
    venueSelect.innerHTML = '<option value="">-- Select Venue --</option>' + 
      activeVenues.map(v => `<option value="${v.venue_id}">${escapeHtml(v.venue_name)}</option>`).join('');

    // Load umpires
    const umpires = await fetchJSON('umpires');
    const umpireSelect = $('#schedule_umpire_id');
    umpireSelect.innerHTML = '<option value="">-- Select Umpire --</option>' + 
      umpires.map(u => `<option value="${u.person_id}">${escapeHtml(u.full_name)}</option>`).join('');

    // Sports Manager is automatically set to current Tournament Manager
    // Remove the dropdown as it's not editable
    const managerField = $('#schedule_sports_manager_id');
    if (managerField && managerField.parentElement) {
      managerField.parentElement.style.display = 'none';
    }

  } catch (err) {
    console.error('❌ Error loading schedule match data:', err);
  }
}

async function onScheduleTournamentChange() {
  const tourId = $('#schedule_tour_id').value;
  const sportsSelect = $('#schedule_sports_id');
  
  if (!tourId) {
    sportsSelect.innerHTML = '<option value="">-- Select Sport --</option>';
    $('#teamsSportsSection').style.display = 'none';
    $('#individualSportsSection').style.display = 'none';
    return;
  }

  try {
    const assignments = await fetchJSON('my_assignments');
    const tourAssignments = assignments.filter(a => a.tour_id == tourId);
    
    const uniqueSports = [];
    const seenSports = new Set();
    
    tourAssignments.forEach(a => {
      if (!seenSports.has(a.sports_id)) {
        seenSports.add(a.sports_id);
        uniqueSports.push({
          sports_id: a.sports_id,
          sports_name: a.sports_name,
          team_individual: a.team_individual || 'team',
          men_women: a.men_women || 'mixed'
        });
      }
    });
    
    if (uniqueSports.length === 0) {
      sportsSelect.innerHTML = '<option value="">No sports assigned to you in this tournament</option>';
      return;
    }
    
    sportsSelect.innerHTML = '<option value="">-- Select Sport --</option>' + 
      uniqueSports.map(s => {
        const type = s.team_individual || 'team';
        return `<option value="${s.sports_id}" data-type="${type}">${escapeHtml(s.sports_name)} (${type})</option>`;
      }).join('');
      
  } catch (err) {
    console.error('❌ Error loading sports:', err);
    sportsSelect.innerHTML = '<option value="">Error loading sports</option>';
  }
}

async function onScheduleSportChange() {
  const tourId = $('#schedule_tour_id').value;
  const sportsSelect = $('#schedule_sports_id');
  const selectedOption = sportsSelect.selectedOptions[0];
  const teamsSportsSection = $('#teamsSportsSection');
  const individualSportsSection = $('#individualSportsSection');
  
  // Hide both sections initially
  teamsSportsSection.style.display = 'none';
  individualSportsSection.style.display = 'none';
  
  if (!selectedOption || !selectedOption.value) {
    return;
  }

  const sportsId = selectedOption.value;
  const sportsType = selectedOption.dataset.type; // 'team' or 'individual'
  $('#schedule_sports_type').value = sportsType;

  console.log('🎯 Sport selected:', sportsId, 'Type:', sportsType);

  if (sportsType === 'team') {
    // Show team selection section
    teamsSportsSection.style.display = 'block';
    
    try {
      const assignments = await fetchJSON('my_assignments');
      const relevantTeams = assignments.filter(a => 
        a.tour_id == tourId && a.sports_id == sportsId
      );
      
      const uniqueTeams = [];
      const seenTeams = new Set();
      relevantTeams.forEach(a => {
        if (!seenTeams.has(a.team_id)) {
          seenTeams.add(a.team_id);
          uniqueTeams.push({
            team_id: a.team_id,
            team_name: a.team_name
          });
        }
      });
      
      if (uniqueTeams.length === 0) {
        const teamASelect = $('#schedule_team_a_id');
        const teamBSelect = $('#schedule_team_b_id');
        teamASelect.innerHTML = '<option value="">No teams assigned</option>';
        teamBSelect.innerHTML = '<option value="">No teams assigned</option>';
        return;
      }
      
      const teamASelect = $('#schedule_team_a_id');
      const teamBSelect = $('#schedule_team_b_id');
      
      const teamOptions = '<option value="">-- Select Team --</option>' + 
        uniqueTeams.map(t => `<option value="${t.team_id}">${escapeHtml(t.team_name)}</option>`).join('');
      
      teamASelect.innerHTML = teamOptions;
      teamBSelect.innerHTML = teamOptions;
      
      teamASelect.required = true;
      teamBSelect.required = true;
    } catch (err) {
      console.error('❌ Error loading teams:', err);
    }
  } else {
    // ✅ Show individual sports section with athlete selection
    individualSportsSection.style.display = 'block';
    
    // Clear athletes list
    const athletesList = $('#athletesList');
    if (athletesList) {
      athletesList.innerHTML = `
        <p style="text-align:center;color:var(--text-muted);padding:20px;margin:0;">
          Click "Load Athletes" to see registered athletes for this sport.
        </p>
      `;
    }
    
    // Make team fields not required
    const teamASelect = $('#schedule_team_a_id');
    const teamBSelect = $('#schedule_team_b_id');
    if (teamASelect) teamASelect.required = false;
    if (teamBSelect) teamBSelect.required = false;
  }
}

// ==========================================
// NEW FUNCTION: Load athletes for scheduling
// ==========================================

// ==========================================
// LOAD ATHLETES FOR SCHEDULING WITH PARTICIPANTS CHECK
// ==========================================

async function loadAthletesForSchedule() {
  const tourId = $('#schedule_tour_id').value;
  const sportsId = $('#schedule_sports_id').value;
  const athletesList = $('#athletesList');
  const loadBtn = $('#loadAthletesBtn');
  
  if (!tourId || !sportsId) {
    alert('Please select tournament and sport first');
    return;
  }
  
  try {
    // Disable button and show loading
    loadBtn.disabled = true;
    loadBtn.textContent = '⏳ Loading...';
    athletesList.innerHTML = '<p style="text-align:center;padding:20px;">Loading athletes...</p>';
    
    console.log('🔄 Loading athletes for scheduling:', { tourId, sportsId });
    
    // Fetch athletes for this sport
    const athletes = await fetchJSON('match_athletes', { 
      tour_id: tourId, 
      sports_id: sportsId 
    });
    
    console.log('✅ Athletes loaded:', athletes);
    
    if (!athletes || athletes.length === 0) {
      athletesList.innerHTML = `
        <p style="text-align:center;color:var(--text-muted);padding:20px;margin:0;">
          No athletes registered for this sport yet.
        </p>
      `;
      loadBtn.disabled = false;
      loadBtn.textContent = '🔄 Load Athletes';
      return;
    }
    
    // Sort athletes: captains first, then alphabetically
    const sortedAthletes = [...athletes].sort((a, b) => {
      // Captains first
      if (a.is_captain == 1 && b.is_captain != 1) return -1;
      if (a.is_captain != 1 && b.is_captain == 1) return 1;
      // Then alphabetically
      return (a.athlete_name || '').localeCompare(b.athlete_name || '');
    });
    
    // Render athlete checkboxes
    let html = '<div class="checkbox-group">';
    
    sortedAthletes.forEach(athlete => {
      const athleteName = athlete.athlete_name || 'Unknown Athlete';
      const teamInfo = athlete.team_name ? ` (${escapeHtml(athlete.team_name)})` : '';
      const isCaptain = athlete.is_captain == 1 ? ' 👑' : '';
      
      html += `
        <label class="checkbox-label">
          <input 
            type="checkbox" 
            class="schedule-athlete-checkbox" 
            value="${athlete.athlete_id}"
            data-athlete-name="${escapeHtml(athleteName)}"
            data-team-id="${athlete.team_id || ''}"
            data-team-name="${escapeHtml(athlete.team_name || '')}">
          <span>${escapeHtml(athleteName)}${teamInfo}${isCaptain}</span>
        </label>
      `;
    });
    
    html += '</div>';
    
    // Add select all / deselect all buttons
    const headerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border);">
        <button type="button" class="btn btn-sm" onclick="selectAllScheduleAthletes(true)">
          ✓ Select All
        </button>
        <button type="button" class="btn btn-sm" onclick="selectAllScheduleAthletes(false)">
          ✗ Deselect All
        </button>
        <span style="flex:1;text-align:right;font-size:12px;color:var(--text-muted);line-height:30px;" id="selectedCount">
          0 selected
        </span>
      </div>
    `;
    
    athletesList.innerHTML = headerHTML + html;
    
    // Add change listeners to update count
    const checkboxes = athletesList.querySelectorAll('.schedule-athlete-checkbox');
    checkboxes.forEach(cb => {
      cb.addEventListener('change', updateScheduleAthleteCount);
    });
    
    updateScheduleAthleteCount();
    
    loadBtn.disabled = false;
    loadBtn.textContent = '🔄 Reload Athletes';
    
  } catch (err) {
    console.error('❌ Error loading athletes:', err);
    athletesList.innerHTML = `
      <p style="text-align:center;color:red;padding:20px;margin:0;">
        Error loading athletes. Please try again.
      </p>
    `;
    loadBtn.disabled = false;
    loadBtn.textContent = '🔄 Load Athletes';
  }
}



// ==========================================
// NEW FUNCTION: Select/Deselect all athletes
// ==========================================

function selectAllScheduleAthletes(select) {
  const checkboxes = document.querySelectorAll('.schedule-athlete-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = select;
  });
  updateScheduleAthleteCount();
}

// ==========================================
// NEW FUNCTION: Update selected athlete count
// ==========================================

function updateScheduleAthleteCount() {
  const checkboxes = document.querySelectorAll('.schedule-athlete-checkbox');
  const selected = Array.from(checkboxes).filter(cb => cb.checked);
  const countSpan = document.getElementById('selectedCount');
  
  if (countSpan) {
    countSpan.textContent = `${selected.length} selected`;
  }
}



async function saveScheduleMatch(event) {
  event.preventDefault();
  event.stopPropagation();
  
  if (isSubmittingMatch) {
    console.log('⚠️ Submission already in progress, ignoring duplicate request');
    return;
  }
  
  isSubmittingMatch = true;
  const msg = $('#scheduleMsg');
  msg.style.display = 'block';
  msg.textContent = 'Scheduling match...';
  msg.style.color = '#6b7280';
  
  try {
    const form = document.getElementById('scheduleMatchForm');
    const formData = new FormData(form);
    
    const tourId = $('#schedule_tour_id').value;
    const sportsId = $('#schedule_sports_id').value;
    const gameNo = $('#schedule_game_no').value;
    const matchType = $('#schedule_match_type').value;
    const skedDate = $('#schedule_sked_date').value;
    const skedTime = $('#schedule_sked_time').value;
    const venueId = $('#schedule_venue_id').value || null;
    const umpireId = $('#schedule_umpire_id').value || null;
    const sportsType = $('#schedule_sports_type').value;
    
    if (!tourId || !sportsId || !gameNo || !matchType || !skedDate || !skedTime) {
      msg.textContent = 'Please fill in all required fields';
      msg.style.color = 'red';
      isSubmittingMatch = false;
      return;
    }
    
    const submitData = new URLSearchParams();
    submitData.set('tour_id', tourId);
    submitData.set('sports_id', sportsId);
    submitData.set('game_no', gameNo);
    submitData.set('match_type', matchType);
    submitData.set('sked_date', skedDate);
    submitData.set('sked_time', skedTime);
    submitData.set('sports_type', sportsType);
    
    if (venueId) submitData.set('venue_id', venueId);
    if (umpireId) submitData.set('umpire_id', umpireId);
    
    if (sportsType === 'team') {
      const teamAId = $('#schedule_team_a_id').value;
      const teamBId = $('#schedule_team_b_id').value;
      
      if (!teamAId || !teamBId) {
        msg.textContent = 'Please select both teams';
        msg.style.color = 'red';
        isSubmittingMatch = false;
        return;
      }
      
      if (teamAId === teamBId) {
        msg.textContent = 'Team A and Team B must be different';
        msg.style.color = 'red';
        isSubmittingMatch = false;
        return;
      }
      
      submitData.set('team_a_id', teamAId);
      submitData.set('team_b_id', teamBId);
    } else {
      // ✅ Individual sport - collect selected athletes
      const selectedAthletes = Array.from(
        document.querySelectorAll('.schedule-athlete-checkbox:checked')
      ).map(cb => cb.value);
      
      console.log('👥 Selected athletes:', selectedAthletes);
      
      // Store athletes as JSON array
      if (selectedAthletes.length > 0) {
        submitData.set('athletes', JSON.stringify(selectedAthletes));
      }
    }
    
    console.log('📤 Submitting match schedule:', Object.fromEntries(submitData));
    
    const result = await fetchJSON('schedule_match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: submitData.toString()
    });
    
    console.log('📥 Result:', result);
    
    if (result.ok) {
      msg.textContent = result.message || 'Match scheduled successfully!';
      msg.style.color = 'green';
      
      // Close modal after 1 second
      setTimeout(() => {
        closeScheduleMatchModal();
        loadMatches(); // Reload matches table
      }, 1000);
    } else {
      msg.textContent = result.message || 'Failed to schedule match';
      msg.style.color = 'red';
      isSubmittingMatch = false;
    }
  } catch (err) {
    console.error('❌ Error scheduling match:', err);
    msg.textContent = 'Error scheduling match: ' + err.message;
    msg.style.color = 'red';
    isSubmittingMatch = false;
  }
}

// Export new functions
window.loadAthletesForSchedule = loadAthletesForSchedule;
window.selectAllScheduleAthletes = selectAllScheduleAthletes;
window.updateScheduleAthleteCount = updateScheduleAthleteCount;

function closeScheduleMatchModal() {
  const modal = $('#scheduleMatchModal');
  if (modal) {
    modal.remove();
  }
  // Clear the modal container
  $('#modalContainer').innerHTML = '';
  // Reset the submission flag
  isSubmittingMatch = false;
}

async function editMatch(matchId) {
  try {
    // Get match details
    const matches = await fetchJSON('matches');
    const match = matches.find(m => m.match_id === matchId);
    
    if (!match) {
      alert('Match not found');
      return;
    }

    const modalHTML = `
      <div class="modal active" id="editMatchModal">
        <div class="modal-content wide">
          <div class="modal-header">
            <h3>Edit Match</h3>
            <button class="modal-close" onclick="closeEditMatchModal()">×</button>
          </div>
          <form id="editMatchForm" onsubmit="saveEditMatch(event)">
            <input type="hidden" id="edit_match_id" value="${match.match_id}">
            <input type="hidden" id="edit_sports_type" value="${match.sports_type}">
            <div class="modal-body">
              <div class="form" style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                
                <!-- Game Number -->
                <div class="form-group">
                  <label class="form-label">Game Number *</label>
                  <input type="text" class="form-control" id="edit_game_no" value="${escapeHtml(match.game_no)}" required>
                </div>

                <!-- Match Type -->
                <div class="form-group">
                  <label class="form-label">Match Type *</label>
                  <select name="match_type" class="form-control" id="edit_match_type" required>
                    <option value="EL" ${match.match_type === 'EL' ? 'selected' : ''}>Elimination (EL)</option>
                    <option value="QF" ${match.match_type === 'QF' ? 'selected' : ''}>Quarter Final (QF)</option>
                    <option value="SF" ${match.match_type === 'SF' ? 'selected' : ''}>Semi Final (SF)</option>
                    <option value="F" ${match.match_type === 'F' ? 'selected' : ''}>Final (F)</option>
                  </select>
                </div>

                <!-- Date -->
                <div class="form-group">
                  <label class="form-label">Match Date *</label>
                  <input type="date" class="form-control" id="edit_sked_date" value="${match.sked_date}" required>
                </div>

                <!-- Time -->
                <div class="form-group">
                  <label class="form-label">Match Time *</label>
                  <input type="time" class="form-control" id="edit_sked_time" value="${match.sked_time}" required>
                </div>

                <!-- Venue -->
                <div class="form-group">
                  <label class="form-label">Venue</label>
                  <select name="venue_id" class="form-control" id="edit_venue_id">
                    <option value="">-- Select Venue --</option>
                  </select>
                </div>

                <!-- Umpire -->
                <div class="form-group">
                  <label class="form-label">Umpire</label>
                  <select name="umpire_id" class="form-control" id="edit_umpire_id">
                    <option value="">-- Select Umpire --</option>
                  </select>
                </div>

                <!-- Sports Manager -->
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Sports Manager</label>
                  <select name="sports_manager_id" class="form-control" id="edit_sports_manager_id">
                    <option value="">-- Select Sports Manager --</option>
                  </select>
                </div>

                <!-- Teams Section (shown for team sports) -->
                ${match.sports_type === 'team' ? `
                  <div style="grid-column: span 2;">
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                      <div class="form-group">
                        <label class="form-label">Team A *</label>
                        <select name="team_a_id" class="form-control" id="edit_team_a_id" required>
                          <option value="">-- Select Team A --</option>
                        </select>
                      </div>

                      <div class="form-group">
                        <label class="form-label">Team B *</label>
                        <select name="team_b_id" class="form-control" id="edit_team_b_id" required>
                          <option value="">-- Select Team B --</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ` : ''}

              </div>
              <div id="editMatchMsg" class="msg" style="display:none;"></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeEditMatchModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Update Match</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    $('#modalContainer').innerHTML = modalHTML;
    
    // Load dropdowns
    await loadEditMatchData(match);
    
  } catch (err) {
    console.error('❌ Error editing match:', err);
    alert('Error loading match details');
  }
}

async function loadEditMatchData(match) {
  try {
    // Load venues
    const venues = await fetchJSON('venues');
    const activeVenues = venues.filter(v => v.is_active == 1);
    const venueSelect = $('#edit_venue_id');
    venueSelect.innerHTML = '<option value="">-- Select Venue --</option>' + 
      activeVenues.map(v => `<option value="${v.venue_id}" ${v.venue_id == match.venue_id ? 'selected' : ''}>${escapeHtml(v.venue_name)}</option>`).join('');

    // Load umpires
    const umpires = await fetchJSON('umpires');
    const umpireSelect = $('#edit_umpire_id');
    umpireSelect.innerHTML = '<option value="">-- Select Umpire --</option>' + 
      umpires.map(u => `<option value="${u.person_id}" ${u.person_id == match.match_umpire_id ? 'selected' : ''}>${escapeHtml(u.full_name)}</option>`).join('');

    // Load sports managers
    const managers = await fetchJSON('sports_managers');
    const managerSelect = $('#edit_sports_manager_id');
    managerSelect.innerHTML = '<option value="">-- Select Sports Manager --</option>' + 
      managers.map(m => `<option value="${m.person_id}" ${m.person_id == match.match_sports_manager_id ? 'selected' : ''}>${escapeHtml(m.full_name)}</option>`).join('');

    // Load teams if team sport
    if (match.sports_type === 'team') {
      const teams = await fetchJSON(`tournament_teams_by_sport&tour_id=${match.tour_id}&sports_id=${match.sports_id}`);
      const teamOptions = '<option value="">-- Select Team --</option>' + 
        teams.map(t => `<option value="${t.team_id}">${escapeHtml(t.team_name)}</option>`).join('');
      
      const teamASelect = $('#edit_team_a_id');
      const teamBSelect = $('#edit_team_b_id');
      
      teamASelect.innerHTML = teamOptions;
      teamBSelect.innerHTML = teamOptions;
      
      // Set selected teams
      teamASelect.value = match.team_a_id || '';
      teamBSelect.value = match.team_b_id || '';
    }

  } catch (err) {
    console.error('❌ Error loading edit match data:', err);
  }
}

async function saveEditMatch(event) {
  event.preventDefault();
  const msg = $('#editMatchMsg');
  msg.style.display = 'block';
  msg.textContent = 'Updating match...';
  msg.style.color = '#6b7280';

  try {
    const formData = new URLSearchParams();
    formData.set('match_id', $('#edit_match_id').value);
    formData.set('game_no', $('#edit_game_no').value);
    formData.set('sked_date', $('#edit_sked_date').value);
    formData.set('sked_time', $('#edit_sked_time').value);
    formData.set('venue_id', $('#edit_venue_id').value || '0');
    formData.set('match_umpire_id', $('#edit_umpire_id').value || '0');
    formData.set('match_sports_manager_id', $('#edit_sports_manager_id').value || '0');
    formData.set('match_type', $('#edit_match_type').value);
    
    const sportsType = $('#edit_sports_type').value;
    if (sportsType === 'team') {
      formData.set('team_a_id', $('#edit_team_a_id').value || '');
      formData.set('team_b_id', $('#edit_team_b_id').value || '');
    } else {
      formData.set('team_a_id', '');
      formData.set('team_b_id', '');
    }

    const data = await fetchJSON('update_match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    msg.textContent = data.message || 'Match updated!';
    msg.style.color = data.ok ? 'green' : 'red';
    
    if (data.ok) {
      setTimeout(() => {
        closeEditMatchModal();
        loadMatches();
      }, 1000);
    }
  } catch (err) {
    console.error('❌ Update match error:', err);
    msg.textContent = 'Error updating match';
    msg.style.color = 'red';
  }
}

function closeEditMatchModal() {
  const modal = $('#editMatchModal');
  if (modal) modal.remove();
}

async function deleteMatch(matchId) {
  if (!confirm('Are you sure you want to delete this match? This will also delete associated scores.')) {
    return;
  }

  try {
    const formData = new URLSearchParams();
    formData.set('match_id', matchId);

    const data = await fetchJSON('delete_match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    if (data.ok) {
      alert('Match deleted successfully');
      await loadMatches();
    } else {
      alert(data.message || 'Failed to delete match');
    }
  } catch (err) {
    console.error('❌ Delete match error:', err);
    alert('Error deleting match');
  }
}

$('#matchesFilterTour')?.addEventListener('change', (e) => {
  const tourId = e.target.value || null;
  loadMatches(tourId);
});

function populateMatchDropdowns(matches) {
  const withoutWinner = matches.filter(m => !m.winner_id);
  
  const scoreMatchSelect = $('#scoreMatchSelect');
  const winnerMatchSelect = $('#winnerMatchSelect');
  
  if (scoreMatchSelect) {
    let opts = '<option value="">-- Select Match --</option>';
    withoutWinner.forEach(m => {
      const matchLabel = m.sports_type === 'individual' 
        ? `${escapeHtml(m.sports_name)} - ${escapeHtml(m.match_type)} (${m.sked_date})`
        : `${escapeHtml(m.sports_name)}: ${escapeHtml(m.team_a_name)} vs ${escapeHtml(m.team_b_name)} (${m.sked_date})`;
      
      // ✅ FIXED: Added data-sports-name attribute
      opts += `<option value="${m.match_id}" 
               data-tour-id="${m.tour_id}" 
               data-sports-id="${m.sports_id}"
               data-sports-name="${escapeHtml(m.sports_name)}"
               data-sports-type="${m.sports_type}"
               data-team-a="${m.team_a_id || ''}" 
               data-team-b="${m.team_b_id || ''}" 
               data-team-a-name="${escapeHtml(m.team_a_name || '')}" 
               data-team-b-name="${escapeHtml(m.team_b_name || '')}">
        ${matchLabel}
      </option>`;
    });
    scoreMatchSelect.innerHTML = opts;
  }
  
  if (winnerMatchSelect) {
    // Show matches without winners
    let opts = '<option value="">-- Select Match --</option>';
    withoutWinner.forEach(m => {
      const matchLabel = m.sports_type === 'individual' 
        ? `${escapeHtml(m.sports_name)} - ${escapeHtml(m.match_type)} (${m.sked_date})`
        : `${escapeHtml(m.sports_name)}: ${escapeHtml(m.team_a_name)} vs ${escapeHtml(m.team_b_name)} (${m.sked_date})`;
        
      opts += `<option value="${m.match_id}" 
               data-tour-id="${m.tour_id}"
               data-sports-id="${m.sports_id}"
               data-sports-type="${m.sports_type}"
               data-team-a="${m.team_a_id || ''}" 
               data-team-b="${m.team_b_id || ''}" 
               data-team-a-name="${escapeHtml(m.team_a_name || '')}" 
               data-team-b-name="${escapeHtml(m.team_b_name || '')}">
        ${matchLabel}
      </option>`;
    });
    winnerMatchSelect.innerHTML = opts;
  }
}




// ==========================================
// SCORING
// ==========================================

$('#scoreMatchSelect')?.addEventListener('change', async (e) => {
  const option = e.target.selectedOptions[0];
  const competitorSelect = $('#scoreCompetitorSelect');
  const scoreFieldsContainer = $('#scoreFieldsContainer');
  
  // Clear previous scoring fields
  if (scoreFieldsContainer) {
    scoreFieldsContainer.innerHTML = '';
  }
  
  if (!competitorSelect) return;
  
  if (!option || !option.value) {
    competitorSelect.innerHTML = '<option value="">-- Select Competitor --</option>';
    return;
  }
  
  const matchId = option.value;
  const sportsType = option.dataset.sportsType;
  const tourId = option.dataset.tourId;
  const sportsId = option.dataset.sportsId;
  const sportsName = option.dataset.sportsName;
  
  console.log('🔄 Match selected:', { matchId, sportsType, sportsName });
  
  // Get sport-specific scoring configuration
  const scoringConfig = getSportScoringConfig(sportsName);
  console.log('📊 Sport config loaded:', scoringConfig.type);
  
  // Render sport-specific scoring fields
  renderSportScoringFields(scoringConfig, scoreFieldsContainer);
  
  try {
    if (sportsType === 'team') {
      // Load team competitors from data attributes
      const teamAId = option.dataset.teamA;
      const teamBId = option.dataset.teamB;
      const teamAName = option.dataset.teamAName;
      const teamBName = option.dataset.teamBName;
      
      if (!teamAId || !teamBId) {
        competitorSelect.innerHTML = '<option value="">-- Error: Team data missing --</option>';
        return;
      }
      
      competitorSelect.innerHTML = `
        <option value="">-- Select Team --</option>
        <option value="team_${teamAId}">${escapeHtml(teamAName)}</option>
        <option value="team_${teamBId}">${escapeHtml(teamBName)}</option>
      `;
      
      console.log('✅ Team competitors loaded');
    } else {
      // Individual sport - load athletes who are registered for this match
      competitorSelect.innerHTML = '<option value="">Loading athletes...</option>';
      
      let participants = null;
      
      // Try to get registered participants for this specific match
      try {
        console.log('📡 Fetching match participants...');
        participants = await fetchJSON('match_participants', { match_id: matchId });
        console.log('✅ Match participants response:', participants);
        
        if (participants && Array.isArray(participants) && participants.length > 0) {
          console.log(`✅ Found ${participants.length} registered participants`);
        } else {
          console.log('⚠️ No participants registered for this match, loading all athletes');
          participants = null;
        }
      } catch (participantError) {
        console.log('ℹ️ match_participants not available, using fallback');
        participants = null;
      }
      
      // Fallback: Load all athletes for the sport
      if (!participants || participants.length === 0) {
        console.log('📡 Loading all athletes for sport (fallback)...');
        
        const allAthletes = await fetchJSON('match_athletes', { 
          tour_id: tourId, 
          sports_id: sportsId 
        });
        
        if (!allAthletes || allAthletes.length === 0) {
          competitorSelect.innerHTML = '<option value="">No athletes registered for this sport</option>';
          return;
        }
        
        // Convert to participant format
        participants = allAthletes.map(a => ({
          athlete_id: a.athlete_id,
          athlete_name: a.athlete_name,
          team_name: a.team_name,
          is_captain: a.is_captain,
          status: null,
          score: null,
          rank_no: null
        }));
        
        console.log(`✅ Loaded ${participants.length} athletes from match_athletes (fallback)`);
      }
      
      // Sort participants: scored first (by rank), then competed, then registered, then alphabetically
      const sorted = participants.sort((a, b) => {
        // Scored athletes first
        if (a.score && !b.score) return -1;
        if (!a.score && b.score) return 1;
        
        // Among scored, sort by rank
        if (a.score && b.score) {
          if (a.rank_no && b.rank_no) return a.rank_no - b.rank_no;
        }
        
        // Competed athletes next
        if (a.status === 'competed' && b.status !== 'competed') return -1;
        if (a.status !== 'competed' && b.status === 'competed') return 1;
        
        // Registered but not competed
        if (a.status === 'registered' && b.status !== 'registered') return -1;
        if (a.status !== 'registered' && b.status === 'registered') return 1;
        
        // Otherwise alphabetically
        return (a.athlete_name || '').localeCompare(b.athlete_name || '');
      });
      
      // Build dropdown options
      let options = '<option value="">-- Select Athlete --</option>';
      
      sorted.forEach(participant => {
        const athleteName = participant.athlete_name || 'Unknown Athlete';
        const teamInfo = participant.team_name ? ` (${escapeHtml(participant.team_name)})` : '';
        const captain = participant.is_captain == 1 ? ' 🏅' : '';
        
        let statusInfo = '';
        if (participant.score) {
          statusInfo = ` - Score: ${participant.score}, Rank: ${participant.rank_no}`;
        } else if (participant.status === 'registered') {
          statusInfo = ' - Registered ✓';
        } else if (participant.status === 'competed') {
          statusInfo = ' - Competed';
        }
        
        options += `<option value="athlete_${participant.athlete_id}">
          ${escapeHtml(athleteName)}${teamInfo}${captain}${statusInfo}
        </option>`;
      });
      
      competitorSelect.innerHTML = options;
      console.log('✅ Athlete competitors loaded:', participants.length);
    }
  } catch (err) {
    console.error('❌ Error loading competitors for scoring:', err);
    competitorSelect.innerHTML = '<option value="">Error loading competitors</option>';
  }
});





// ==========================================
// NEW FUNCTION: Render sport-specific scoring fields
// ==========================================

function renderSportScoringFields(config, container) {
  if (!container) {
    console.warn('⚠️ Score fields container not found');
    return;
  }
  
  console.log('🎯 Rendering sport-specific fields:', config.type);
  
  // Custom renderer for Dance Sport
  if (config.type === 'components') {
    container.innerHTML = renderDanceSportScoreForm(config, null, false);
    container.dataset.scoringType = config.type;
    console.log('✅ Dance Sport fields rendered');
    return;
  }
  
  // Custom renderer for Baseball
  if (config.type === 'innings') {
    container.innerHTML = renderBaseballScoreForm(config, null, false);
    container.dataset.scoringType = config.type;
    console.log('✅ Baseball fields rendered');
    return;
  }
  let html = `
    <div class="form-group">
      <label class="form-label">${escapeHtml(config.label)} *</label>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;">
  `;
  
  config.fields.forEach(field => {
    const required = !field.optional ? 'required' : '';
    const placeholder = field.placeholder || field.label;
    const step = field.step || (field.type === 'number' ? '1' : '');
    const min = field.min !== undefined ? `min="${field.min}"` : '';
    const max = field.max !== undefined ? `max="${field.max}"` : '';
    
    html += `
      <div>
        <label style="font-size: 11px; color: #6b7280; margin-bottom: 4px; display: block;">
          ${escapeHtml(field.label)}${field.optional ? ' (optional)' : ''}
        </label>
        <input 
          type="${field.type}" 
          id="score_${field.id}" 
          class="form-control sport-score-field" 
          data-field-id="${field.id}"
          placeholder="${placeholder}" 
          ${required}
          ${step ? `step="${step}"` : ''}
          ${min}
          ${max}
          style="font-size: 13px; padding: 6px 10px;">
      </div>
    `;
  });
  
  html += `
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  container.dataset.scoringType = config.type;
  
  console.log('✅ Fields rendered:', config.fields.length);
}

$('#scoreForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('#scoreMsg');
  msg.textContent = "Saving score...";
  msg.style.color = '#6b7280';

  try {
    const matchSelect = $('#scoreMatchSelect');
    const matchId = matchSelect.value;
    
    if (!matchId) {
      msg.textContent = 'Please select a match';
      msg.style.color = 'red';
      return;
    }
    
    const selectedOption = matchSelect.selectedOptions[0];
    const tourId = selectedOption.dataset.tourId;
    const sportsType = selectedOption.dataset.sportsType;
    const sportsName = selectedOption.dataset.sportsName;
    
    const competitorValue = $('#scoreCompetitorSelect').value;
    
    if (!competitorValue) {
      msg.textContent = 'Please select a competitor';
      msg.style.color = 'red';
      return;
    }
    
    // Get sport-specific scoring configuration
    const scoringConfig = getSportScoringConfig(sportsName);
    
    // Collect values from sport-specific fields
    const fieldValues = {};
    let hasError = false;
    
    scoringConfig.fields.forEach(field => {
let input = document.getElementById(`score_${field.id}`);
if (!input) {
  input = document.getElementById(field.id);
}
      if (input) {
        const value = input.value.trim();
        
        // Check if required field is empty
        if (!field.optional && !value) {
          msg.textContent = `Please enter ${field.label}`;
          msg.style.color = 'red';
          hasError = true;
          return;
        }
        
        fieldValues[field.id] = value;
      }
    });
    
    if (hasError) return;
    
    // Calculate final score using sport-specific calculation
    const finalScore = scoringConfig.calculateScore(fieldValues);
    console.log('📊 Calculated score:', finalScore);
    
    const formData = new URLSearchParams();
    formData.set('tour_id', tourId);
    formData.set('match_id', matchId);
    
    // ✅ CRITICAL: Parse competitor value to determine if it's a team or athlete
    let isTeam = false;
    let isAthlete = false;
    let competitorId = null;
    
    if (competitorValue.startsWith('team_')) {
      isTeam = true;
      competitorId = competitorValue.replace('team_', '');
      formData.set('team_id', competitorId);
      formData.set('athlete_id', ''); // Empty for team sports
      console.log('💾 Saving TEAM score - team_id:', competitorId);
    } else if (competitorValue.startsWith('athlete_')) {
      isAthlete = true;
      competitorId = competitorValue.replace('athlete_', '');
      formData.set('team_id', ''); // Empty for individual sports
      formData.set('athlete_id', competitorId);
      console.log('💾 Saving ATHLETE score - athlete_id:', competitorId);
    } else {
      msg.textContent = 'Invalid competitor selection';
      msg.style.color = 'red';
      return;
    }
    
    // Add score data
    formData.set('score', finalScore);
    formData.set('rank_no', $('#rank_no').value);
    formData.set('medal_type', $('#medal_type').value);

    console.log('📤 Sending score data:', Object.fromEntries(formData));

    const data = await fetchJSON('save_score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    console.log('📥 Save score response:', data);

    msg.textContent = data.message || 'Score saved!';
    msg.style.color = data.ok ? 'green' : 'red';
    
    if (data.ok) {
      // Clear only the sport-specific score fields, keep match and competitor selected
      scoringConfig.fields.forEach(field => {
let input = document.getElementById(`score_${field.id}`);
if (!input) {
  input = document.getElementById(field.id);
}
        if (input) input.value = '';
      });
      
      // Clear rank and medal
      $('#rank_no').value = '';
      $('#medal_type').value = '';
      
      // Reload scores table
      await loadScores();
      
      // Update participant status to 'competed' if this is an individual sport
      if (isAthlete && competitorId) {
        try {
          console.log('🔄 Updating participant status to "competed"...');
          
          // Get participant_id for this athlete in this match
          const participants = await fetchJSON('match_participants', { match_id: matchId });
          const participant = participants.find(p => p.athlete_id == competitorId);
          
          if (participant && participant.participant_id) {
            const statusFormData = new FormData();
            statusFormData.append('participant_id', participant.participant_id);
            statusFormData.append('status', 'competed');
            
            await fetchJSON('update_participant_status', {
              method: 'POST',
              body: statusFormData
            });
            
            console.log('✅ Participant status updated to competed');
          }
        } catch (statusErr) {
          console.warn('⚠️ Could not update participant status:', statusErr);
          // Don't show error to user as this is a background operation
        }
      }
      
      // Auto-declare winner if all competitors have scores
      await checkAndDeclareWinner(matchId, sportsType);
    }
  } catch (err) {
    console.error('❌ Score save error:', err);
    msg.textContent = 'Error saving score: ' + err.message;
    msg.style.color = 'red';
  }
});

console.log('✅ Individual athlete scoring functionality loaded');

// ==========================================
// NEW FUNCTION: Auto-declare winner after scoring
// ==========================================

async function checkAndDeclareWinner(matchId, sportsType) {
  try {
    console.log('🔍 Checking if match has all scores for winner declaration...');
    
    const scores = await fetchJSON('match_scores', { match_id: matchId });
    
    if (!scores || scores.length < 2) {
      console.log('⏳ Not enough scores yet to declare winner');
      return;
    }
    
    console.log('✅ All scores present, determining winner...');
    
    // Determine winner based on scores
    let winnerId = null;
    let winnerType = sportsType === 'team' ? 'team' : 'athlete';
    
    if (sportsType === 'team') {
      // For team sports, use rank_no (lower is better)
      const topScore = scores.sort((a, b) => {
        // Try rank first (lower rank = better)
        if (a.rank_no && b.rank_no) {
          return a.rank_no - b.rank_no;
        }
        // Fall back to score comparison for point-based sports
        const scoreA = parseFloat(a.score) || 0;
        const scoreB = parseFloat(b.score) || 0;
        return scoreB - scoreA;
      })[0];
      
      winnerId = topScore.team_id;
    } else {
      // For individual sports, use rank_no (lower is better)
      const topAthlete = scores.sort((a, b) => a.rank_no - b.rank_no)[0];
      winnerId = topAthlete.athlete_id;
    }
    
    if (!winnerId) {
      console.log('⚠️ Could not determine winner');
      return;
    }
    
    // Auto-declare winner
    const formData = new URLSearchParams();
    formData.set('match_id', matchId);
    formData.set('sports_type', sportsType);
    formData.set('winner_id', winnerId);
    formData.set('winner_type', winnerType);
    
    console.log('🏆 Auto-declaring winner:', { matchId, winnerId, winnerType });
    
    const result = await fetchJSON('declare_winner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });
    
    if (result.ok) {
      console.log('✅ Winner auto-declared successfully');
      
      // Show success message
      const winnerMsg = document.getElementById('scoreMsg');
      if (winnerMsg) {
        const currentMsg = winnerMsg.textContent;
        winnerMsg.textContent = currentMsg + ' | Winner declared automatically!';
      }
      
      // Reload matches to reflect winner
      await loadMatches();
    }
  } catch (err) {
    console.error('❌ Error auto-declaring winner:', err);
    // Don't show error to user as this is a background operation
  }
}

// Export functions
window.populateMatchDropdowns = populateMatchDropdowns;
window.getSportScoringConfig = getSportScoringConfig;
window.renderSportScoringFields = renderSportScoringFields;
window.checkAndDeclareWinner = checkAndDeclareWinner;

// Export functions
window.populateMatchDropdowns = populateMatchDropdowns;

async function loadScores() {
  try {
    // ✅ FIXED: Load matches first to populate dropdowns
    const matches = await fetchJSON('matches');
    if (matches && Array.isArray(matches)) {
      populateMatchDropdowns(matches);
    }
    
    const data = await fetchJSON('scores');
    const tbody = $('#scoresTable tbody');
    
    if (!tbody) return;
    
    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No scores yet</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.map(s => `
      <tr>
        <td style="font-size:11px;">${escapeHtml(s.match_info)}</td>
        <td>${escapeHtml(s.team_name)}</td>
        <td><strong>${escapeHtml(s.score)}</strong></td>
        <td>${s.rank_no}</td>
        <td>${s.medal_type && s.medal_type !== 'None' ? `<span class="badge ${s.medal_type}">${s.medal_type}</span>` : '-'}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="deleteScore(${s.competetors_score_id})">Delete</button>
        </td>
      </tr>
    `).join('');
    
    console.log('✅ Scores loaded:', data.length);
  } catch (err) {
    console.error('❌ loadScores error:', err);
  }
}

async function deleteScore(scoreId) {
  if (!confirm('Delete this score?')) return;
  
  try {
    const formData = new URLSearchParams();
    formData.set('score_id', scoreId);

    const data = await fetchJSON('delete_score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    if (data.ok) {
      await loadScores();
    } else {
      alert(data.message || 'Failed to delete');
    }
  } catch (err) {
    console.error('❌ Delete score error:', err);
    alert('Error deleting score');
  }
}

// Define reusable sport configurations
const volleyballConfig = {
  type: 'sets',
  label: 'Sets Won',
  maxSets: 5,
  fields: [
    { id: 'set1', label: 'Set 1', type: 'number', min: 0, max: 30 },
    { id: 'set2', label: 'Set 2', type: 'number', min: 0, max: 30 },
    { id: 'set3', label: 'Set 3', type: 'number', min: 0, max: 30 },
    { id: 'set4', label: 'Set 4', type: 'number', min: 0, max: 30 },
    { id: 'set5', label: 'Set 5', type: 'number', min: 0, max: 30 }
  ],
  calculateScore: (values) => {
    const sets = [values.set1, values.set2, values.set3, values.set4, values.set5]
      .filter(s => s !== null && s !== undefined && s !== '');
    return sets.join('-');
  }
};

const beachvolleyballConfig = {
  type: 'sets',
  label: 'Sets Won',
  maxSets: 3,
  fields: [
    { id: 'set1', label: 'Set 1', type: 'number', min: 0, max: 30 },
    { id: 'set2', label: 'Set 2', type: 'number', min: 0, max: 30 },
    { id: 'set3', label: 'Set 3', type: 'number', min: 0, max: 30 }
  ],
  calculateScore: (values) => {
    const sets = [values.set1, values.set2, values.set3]
      .filter(s => s !== null && s !== undefined && s !== '');
    return sets.join('-');
  }
};

const tennisConfig = {
  type: 'sets',
  label: 'Sets Won',
  maxSets: 5,
  fields: [
    { id: 'set1', label: 'Set 1', type: 'number', min: 0, max: 7 },
    { id: 'set2', label: 'Set 2', type: 'number', min: 0, max: 7 },
    { id: 'set3', label: 'Set 3', type: 'number', min: 0, max: 7 },
    { id: 'set4', label: 'Set 4', type: 'number', min: 0, max: 7 },
    { id: 'set5', label: 'Set 5', type: 'number', min: 0, max: 7 }
  ],
  calculateScore: (values) => {
    const sets = [values.set1, values.set2, values.set3, values.set4, values.set5]
      .filter(s => s !== null && s !== undefined && s !== '');
    return sets.join('-');
  }
};

const badmintonConfig = {
  type: 'sets',
  label: 'Sets Won',
  maxSets: 3,
  fields: [
    { id: 'set1', label: 'Set 1', type: 'number', min: 0, max: 30 },
    { id: 'set2', label: 'Set 2', type: 'number', min: 0, max: 30 },
    { id: 'set3', label: 'Set 3', type: 'number', min: 0, max: 30 }
  ],
  calculateScore: (values) => {
    const sets = [values.set1, values.set2, values.set3]
      .filter(s => s !== null && s !== undefined && s !== '');
    return sets.join('-');
  }
};

const tableTennisConfig = {
  type: 'sets',
  label: 'Sets Won',
  maxSets: 7,
  fields: [
    { id: 'set1', label: 'Set 1', type: 'number', min: 0, max: 15 },
    { id: 'set2', label: 'Set 2', type: 'number', min: 0, max: 15 },
    { id: 'set3', label: 'Set 3', type: 'number', min: 0, max: 15 },
    { id: 'set4', label: 'Set 4', type: 'number', min: 0, max: 15 },
    { id: 'set5', label: 'Set 5', type: 'number', min: 0, max: 15 },
    { id: 'set6', label: 'Set 6', type: 'number', min: 0, max: 15 },
    { id: 'set7', label: 'Set 7', type: 'number', min: 0, max: 15 }
  ],
  calculateScore: (values) => {
    const sets = [values.set1, values.set2, values.set3, values.set4, values.set5, values.set6, values.set7]
      .filter(s => s !== null && s !== undefined && s !== '');
    return sets.join('-');
  }
};

const basketballConfig = {
  type: 'quarters',
  label: 'Quarter Scores',
  description: 'Enter the total score at the end of each quarter (cumulative)',
  fields: [
    { id: 'q1', label: 'End of Q1', type: 'number', min: 0, max: 200, placeholder: 'Total after Q1' },
    { id: 'q2', label: 'End of Q2', type: 'number', min: 0, max: 200, placeholder: 'Total after Q2' },
    { id: 'q3', label: 'End of Q3', type: 'number', min: 0, max: 200, placeholder: 'Total after Q3' },
    { id: 'q4', label: 'End of Q4', type: 'number', min: 0, max: 200, placeholder: 'Final score' },
    { id: 'ot', label: 'End of OT', type: 'number', min: 0, max: 200, optional: true, placeholder: 'After overtime' }
  ],
  calculateScore: (values) => {
    const q1 = parseInt(values.q1) || 0;
    const q2 = parseInt(values.q2) || 0;
    const q3 = parseInt(values.q3) || 0;
    const q4 = parseInt(values.q4) || 0;
    const ot = parseInt(values.ot) || 0;
    
    // Calculate points scored in each quarter
    const q1Points = q1;
    const q2Points = q2 - q1;
    const q3Points = q3 - q2;
    const q4Points = q4 - q3;
    const otPoints = ot > 0 ? ot - q4 : 0;
    
    // Final total
    const total = ot > 0 ? ot : q4;
    
    // Breakdown shows points scored per quarter
    const breakdown = `${q1Points}-${q2Points}-${q3Points}-${q4Points}` + 
                     (ot > 0 ? `-${otPoints}` : '');
    
    return `${total} (${breakdown})`;
  }
};

const footballConfig = {
  type: 'halves',
  label: 'Half Scores',
  fields: [
    { id: 'h1', label: '1st Half', type: 'number', min: 0, max: 20 },
    { id: 'h2', label: '2nd Half', type: 'number', min: 0, max: 20 },
    { id: 'et', label: 'Extra Time', type: 'number', min: 0, max: 10, optional: true }
  ],
  calculateScore: (values) => {
    const total = (parseInt(values.h1) || 0) + 
                  (parseInt(values.h2) || 0) + 
                  (parseInt(values.et) || 0);
    return values.et ? `${total} (${values.h1}-${values.h2}-${values.et})` : `${total} (${values.h1}-${values.h2})`;
  }
};

const swimmingConfig = {
  type: 'time',
  label: 'Time',
  fields: [
    { id: 'minutes', label: 'Minutes', type: 'number', min: 0, max: 59 },
    { id: 'seconds', label: 'Seconds', type: 'number', min: 0, max: 59 },
    { id: 'milliseconds', label: 'Milliseconds', type: 'number', min: 0, max: 999 }
  ],
  calculateScore: (values) => {
    const min = parseInt(values.minutes) || 0;
    const sec = parseInt(values.seconds) || 0;
    const ms = parseInt(values.milliseconds) || 0;
    return min > 0 ? `${min}:${sec.toString().padStart(2,'0')}.${ms.toString().padStart(3,'0')}` 
                   : `${sec}.${ms.toString().padStart(3,'0')}s`;
  }
};

const athleticsConfig = {
  type: 'time',
  label: 'Time',
  fields: [
    { id: 'minutes', label: 'Minutes', type: 'number', min: 0, max: 59 },
    { id: 'seconds', label: 'Seconds', type: 'number', min: 0, max: 59 },
    { id: 'milliseconds', label: 'Milliseconds', type: 'number', min: 0, max: 999 }
  ],
  calculateScore: (values) => {
    const min = parseInt(values.minutes) || 0;
    const sec = parseInt(values.seconds) || 0;
    const ms = parseInt(values.milliseconds) || 0;
    return min > 0 ? `${min}:${sec.toString().padStart(2,'0')}.${ms.toString().padStart(3,'0')}` 
                   : `${sec}.${ms.toString().padStart(3,'0')}s`;
  }
};

// Sport-specific scoring configurations
const SPORT_SCORING_CONFIGS = {
  // Set-based sports with gender categories
  'volleyball - mens': volleyballConfig,
  'volleyball - womens': volleyballConfig,
  'beach volleyball - womens': beachvolleyballConfig,
  'beach volleyball - mens': beachvolleyballConfig,
  
  'tennis - mens': tennisConfig,
  'tennis - womens': tennisConfig,
  'tennis - mixed': tennisConfig,
  
  'badminton - mens': badmintonConfig,
  'badminton - womens': badmintonConfig,
  'badminton - mixed': badmintonConfig,
  
  'table tennis - mens': tableTennisConfig,
  'table tennis - womens': tableTennisConfig,
  'table tennis - mixed': tableTennisConfig,
  
  // Point-based team sports with gender categories
  'basketball - mens': basketballConfig,
  'basketball - womens': basketballConfig,
  
  'football - mens': footballConfig,
  'football - womens': footballConfig,
  
  'soccer - mens': footballConfig,
  'soccer - womens': footballConfig,
  
  baseball: {
    type: 'innings',
    label: 'Baseball Box Score',
    description: 'Official baseball scoring with innings, runs, hits, and errors',
    maxInnings: 9,
    fields: [
      // Innings 1-9 (all required, default to 0)
      { id: 'i1', label: '1', type: 'number', min: 0, max: 20, required: true, default: 0 },
      { id: 'i2', label: '2', type: 'number', min: 0, max: 20, required: true, default: 0 },
      { id: 'i3', label: '3', type: 'number', min: 0, max: 20, required: true, default: 0 },
      { id: 'i4', label: '4', type: 'number', min: 0, max: 20, required: true, default: 0 },
      { id: 'i5', label: '5', type: 'number', min: 0, max: 20, required: true, default: 0 },
      { id: 'i6', label: '6', type: 'number', min: 0, max: 20, required: true, default: 0 },
      { id: 'i7', label: '7', type: 'number', min: 0, max: 20, required: true, default: 0 },
      { id: 'i8', label: '8', type: 'number', min: 0, max: 20, required: true, default: 0 },
      { id: 'i9', label: '9', type: 'number', min: 0, max: 20, required: true, default: 0 },
      // Extra innings (conditional - shown if game tied after 9)
      { id: 'extra', label: 'Extra', type: 'number', min: 0, max: 20, optional: true, conditionalRequired: true },
      // Official stats (all required)
      { id: 'runs', label: 'R (Runs)', type: 'number', min: 0, max: 99, required: true, statField: true },
      { id: 'hits', label: 'H (Hits)', type: 'number', min: 0, max: 99, required: true, statField: true },
      { id: 'errors', label: 'E (Errors)', type: 'number', min: 0, max: 50, required: true, statField: true }
    ],
    calculateScore: (values) => {
      // Calculate total runs from innings
      const inningsTotal = (parseInt(values.i1) || 0) + 
                          (parseInt(values.i2) || 0) + 
                          (parseInt(values.i3) || 0) + 
                          (parseInt(values.i4) || 0) + 
                          (parseInt(values.i5) || 0) + 
                          (parseInt(values.i6) || 0) + 
                          (parseInt(values.i7) || 0) + 
                          (parseInt(values.i8) || 0) + 
                          (parseInt(values.i9) || 0) + 
                          (parseInt(values.extra) || 0);
      
      // Get official stats
      const runs = parseInt(values.runs) || 0;
      const hits = parseInt(values.hits) || 0;
      const errors = parseInt(values.errors) || 0;
      
      // Build innings breakdown
      const inningsBreakdown = `${values.i1 || 0}-${values.i2 || 0}-${values.i3 || 0}-${values.i4 || 0}-${values.i5 || 0}-${values.i6 || 0}-${values.i7 || 0}-${values.i8 || 0}-${values.i9 || 0}` + 
                              (values.extra ? `-${values.extra}` : '');
      
      // Format: "R-H-E (Innings: 1-2-3-4-5-6-7-8-9)"
      return `${runs}-${hits}-${errors} (${inningsBreakdown})`;
    },
    // Validation function
    validate: (values) => {
      const errors = [];
      
      // Check all 9 innings are filled
      for (let i = 1; i <= 9; i++) {
        const inningValue = values[`i${i}`];
        if (inningValue === '' || inningValue === null || inningValue === undefined) {
          errors.push(`Inning ${i} is required`);
        }
      }
      
      // Check R, H, E are filled
      if (!values.runs && values.runs !== 0) {
        errors.push('Total Runs (R) is required');
      }
      if (!values.hits && values.hits !== 0) {
        errors.push('Total Hits (H) is required');
      }
      if (!values.errors && values.errors !== 0) {
        errors.push('Total Errors (E) is required');
      }
      
      // Validate runs match
      const inningsTotal = (parseInt(values.i1) || 0) + 
                          (parseInt(values.i2) || 0) + 
                          (parseInt(values.i3) || 0) + 
                          (parseInt(values.i4) || 0) + 
                          (parseInt(values.i5) || 0) + 
                          (parseInt(values.i6) || 0) + 
                          (parseInt(values.i7) || 0) + 
                          (parseInt(values.i8) || 0) + 
                          (parseInt(values.i9) || 0) + 
                          (parseInt(values.extra) || 0);
      
      const declaredRuns = parseInt(values.runs) || 0;
      
      if (inningsTotal !== declaredRuns) {
        errors.push(`Total Runs (${declaredRuns}) must equal sum of innings (${inningsTotal})`);
      }
      
      return errors;
    }
    
  },
  
  // Time-based individual sports with gender categories
  'swimming - mens': swimmingConfig,
  'swimming - womens': swimmingConfig,
  'swimming - mixed': swimmingConfig,
  
  'athletics - mens': athleticsConfig,
  'athletics - womens': athleticsConfig,
  'athletics - mixed': athleticsConfig,
  
// Distance/measurement based
  'shot put - mens': {
    type: 'distance',
    label: 'Distance (meters)',
    fields: [
      { id: 'meters', label: 'Meters', type: 'number', min: 0, max: 30, step: 0.01 }
    ],
    calculateScore: (values) => `${parseFloat(values.meters).toFixed(2)}m`
  },
  
  'shot put - womens': {
    type: 'distance',
    label: 'Distance (meters)',
    fields: [
      { id: 'meters', label: 'Meters', type: 'number', min: 0, max: 30, step: 0.01 }
    ],
    calculateScore: (values) => `${parseFloat(values.meters).toFixed(2)}m`
  },
  
  'javelin throw - mens': {
    type: 'distance',
    label: 'Distance (meters)',
    fields: [
      { id: 'meters', label: 'Meters', type: 'number', min: 0, max: 100, step: 0.01 }
    ],
    calculateScore: (values) => `${parseFloat(values.meters).toFixed(2)}m`
  },
  
  'javelin throw - womens': {
    type: 'distance',
    label: 'Distance (meters)',
    fields: [
      { id: 'meters', label: 'Meters', type: 'number', min: 0, max: 100, step: 0.01 }
    ],
    calculateScore: (values) => `${parseFloat(values.meters).toFixed(2)}m`
  },
  
  'long jump - mens': {
    type: 'distance',
    label: 'Distance (meters)',
    fields: [
      { id: 'meters', label: 'Meters', type: 'number', min: 0, max: 10, step: 0.01 }
    ],
    calculateScore: (values) => `${parseFloat(values.meters).toFixed(2)}m`
  },
  
  'long jump - womens': {
    type: 'distance',
    label: 'Distance (meters)',
    fields: [
      { id: 'meters', label: 'Meters', type: 'number', min: 0, max: 10, step: 0.01 }
    ],
    calculateScore: (values) => `${parseFloat(values.meters).toFixed(2)}m`
  },
  
  'high jump - mens': {
    type: 'distance',
    label: 'Height (meters)',
    fields: [
      { id: 'meters', label: 'Meters', type: 'number', min: 0, max: 3, step: 0.01 }
    ],
    calculateScore: (values) => `${parseFloat(values.meters).toFixed(2)}m`
  },
  
  'high jump - womens': {
    type: 'distance',
    label: 'Height (meters)',
    fields: [
      { id: 'meters', label: 'Meters', type: 'number', min: 0, max: 3, step: 0.01 }
    ],
    calculateScore: (values) => `${parseFloat(values.meters).toFixed(2)}m`
  },
  
  // Dance Sport - Component-based scoring (solo and pair)
  'dance sport': {
    type: 'components',
    label: 'Dance Sport Scoring',
    description: 'Scored on 4 components: Technical Quality, Movement to Music, Choreography & Presentation, Partnering Skills',
    fields: [
      { 
        id: 'technical', 
        label: 'Technical Quality', 
        type: 'number', 
        min: 0, 
        max: 10, 
        step: 0.1,
        description: 'Quality of technique, execution, and form'
      },
      { 
        id: 'movement', 
        label: 'Movement to Music', 
        type: 'number', 
        min: 0, 
        max: 10, 
        step: 0.1,
        description: 'Timing, rhythm, and musical interpretation'
      },
      { 
        id: 'choreography', 
        label: 'Choreography & Presentation', 
        type: 'number', 
        min: 0, 
        max: 10, 
        step: 0.1,
        description: 'Creativity, staging, and overall presentation'
      },
      { 
        id: 'partnering', 
        label: 'Partnering Skills', 
        type: 'number', 
        min: 0, 
        max: 10, 
        step: 0.1,
        description: 'Connection, synchronization (for pairs only)',
        optional: true,
        note: 'Required for pair events, leave blank for solo'
      }
    ],
    calculateScore: (values) => {
      const technical = parseFloat(values.technical) || 0;
      const movement = parseFloat(values.movement) || 0;
      const choreography = parseFloat(values.choreography) || 0;
      const partnering = parseFloat(values.partnering) || 0;
      
      // For solo: average of 3 components, for pair: average of 4 components
      const isSolo = !values.partnering || values.partnering === '' || values.partnering === '0';
      
      let total;
      if (isSolo) {
        // Solo: T + M + C / 3
        total = ((technical + movement + choreography) / 3).toFixed(2);
        return `${total} (T:${technical.toFixed(1)} M:${movement.toFixed(1)} C:${choreography.toFixed(1)})`;
      } else {
        // Pair: T + M + C + P / 4
        total = ((technical + movement + choreography + partnering) / 4).toFixed(2);
        return `${total} (T:${technical.toFixed(1)} M:${movement.toFixed(1)} C:${choreography.toFixed(1)} P:${partnering.toFixed(1)})`;
      }
    },
    // Helper to parse score back into components (for editing)
    parseScore: (scoreString) => {
      if (!scoreString) return {};
      
      // Format: "8.75 (T:9.0 M:8.5 C:8.7)" or "8.83 (T:9.0 M:8.5 C:8.7 P:9.2)"
      const match = scoreString.match(/[\d.]+\s*\(T:([\d.]+)\s*M:([\d.]+)\s*C:([\d.]+)(?:\s*P:([\d.]+))?\)/);
      if (!match) return {};
      
      return {
        technical: match[1],
        movement: match[2],
        choreography: match[3],
        partnering: match[4] || ''
      };
    }
  },
  
  // Chess - Result-based scoring
  'chess': {
    type: 'result',
    label: 'Match Result',
    description: 'Standard chess notation: 1-0 (White wins), ½-½ (Draw), 0-1 (Black wins)',
    fields: [
      { 
        id: 'result', 
        label: 'Result', 
        type: 'select',
        options: [
          { value: '1-0', label: '1-0 (White wins)' },
          { value: '½-½', label: '½-½ (Draw)' },
          { value: '0-1', label: '0-1 (Black wins)' }
        ]
      },
      {
        id: 'moves',
        label: 'Number of Moves',
        type: 'number',
        min: 1,
        max: 500,
        optional: true,
        description: 'Total moves in the game (optional)'
      },
      {
        id: 'time_format',
        label: 'Time Control',
        type: 'select',
        optional: true,
        options: [
          { value: 'blitz', label: 'Blitz (< 10 min)' },
          { value: 'rapid', label: 'Rapid (10-60 min)' },
          { value: 'classical', label: 'Classical (> 60 min)' }
        ]
      }
    ],
    calculateScore: (values) => {
      let score = values.result || '½-½';
      if (values.moves) {
        score += ` (${values.moves} moves)`;
      }
      if (values.time_format) {
        const formatLabels = {
          'blitz': 'Blitz',
          'rapid': 'Rapid',
          'classical': 'Classical'
        };
        score += ` [${formatLabels[values.time_format]}]`;
      }
      return score;
    },
    parseScore: (scoreString) => {
      if (!scoreString) return {};
      
      // Format: "1-0 (42 moves) [Rapid]"
      const resultMatch = scoreString.match(/^([01][-–]?[01]|½-½|0\.5-0\.5)/);
      const movesMatch = scoreString.match(/\((\d+)\s+moves\)/);
      const formatMatch = scoreString.match(/\[(Blitz|Rapid|Classical)\]/);
      
      return {
        result: resultMatch ? resultMatch[1] : '',
        moves: movesMatch ? movesMatch[1] : '',
        time_format: formatMatch ? formatMatch[1].toLowerCase() : ''
      };
    }
  },

  // Default/generic scoring for other sports
  default: {
    type: 'simple',
    label: 'Score/Points',
    fields: [
      { id: 'score', label: 'Score/Points', type: 'text', placeholder: 'e.g., 95, 10.5, 3-2' }
    ],
    calculateScore: (values) => values.score
  }
};

// Get scoring config for a sport
function getSportScoringConfig(sportName) {
  if (!sportName) return SPORT_SCORING_CONFIGS.default;
  
  const normalized = sportName.toLowerCase().trim();
  
  // Check for exact match first
  if (SPORT_SCORING_CONFIGS[normalized]) {
    return SPORT_SCORING_CONFIGS[normalized];
  }
  
  // Check for partial matches (e.g., "Dance Sport Solo" or "Dance Sport Pair")
  if (normalized.includes('dance sport') || normalized.includes('dancesport')) {
    return SPORT_SCORING_CONFIGS['dance sport'];
  }
  
  return SPORT_SCORING_CONFIGS.default;
}

function renderDanceSportScoreForm(config, existingScore = null, readonly = false) {
  const parsedValues = existingScore ? config.parseScore(existingScore) : {};
  
  let html = `
    <div class="dance-sport-scoring">
      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
        <div style="display: flex; align-items: start; gap: 8px;">
          <svg width="20" height="20" fill="#0284c7" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
          </svg>
          <div style="flex: 1; font-size: 13px; color: #0c4a6e;">
            <strong>Dance Sport Scoring Components</strong><br>
            <span style="font-size: 12px;">Each component is scored from 0-10 (decimals allowed). The final score is the average of all components.</span>
          </div>
        </div>
      </div>
      
      <div class="component-grid" style="display: grid; gap: 16px;">
  `;
  
  config.fields.forEach((field, index) => {
    const value = parsedValues[field.id] || '';
    const isOptional = field.optional;
    const shouldShow = !isOptional || value !== '';
    
    if (shouldShow || !readonly) {
      html += `
        <div class="score-component" style="
          background: white;
          border: 2px solid ${isOptional ? '#fbbf24' : '#3b82f6'};
          border-radius: 8px;
          padding: 14px;
          transition: all 0.2s;
        ">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
            <label for="${field.id}" style="font-weight: 600; font-size: 14px; color: #111827;">
              ${field.label}
              ${isOptional ? '<span style="color: #f59e0b; font-size: 11px; font-weight: 500;"> (OPTIONAL - Pairs Only)</span>' : ''}
            </label>
            ${!readonly ? `
              <div style="display: flex; align-items: center; gap: 8px;">
                <input 
                  type="number" 
                  id="${field.id}" 
                  name="${field.id}"
                  min="${field.min}" 
                  max="${field.max}" 
                  step="${field.step}"
                  value="${value}"
                  placeholder="${isOptional ? '0 or leave blank' : '0.0'}"
                  style="
                    width: 80px;
                    padding: 6px 10px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 16px;
                    font-weight: 600;
                    text-align: center;
                    color: #111827;
                  "
                  ${readonly ? 'readonly' : ''}
                  ${isOptional ? '' : 'required'}
                >
                <span style="font-size: 13px; color: #6b7280; font-weight: 500;">/10</span>
              </div>
            ` : `
              <div style="
                background: #f3f4f6;
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 18px;
                font-weight: 700;
                color: #111827;
              ">
                ${value || '—'} <span style="font-size: 13px; color: #6b7280; font-weight: 500;">/10</span>
              </div>
            `}
          </div>
          <p style="font-size: 12px; color: #6b7280; margin: 0; line-height: 1.4;">
            ${field.description}
            ${field.note ? `<br><em style="color: #f59e0b;">${field.note}</em>` : ''}
          </p>
        </div>
      `;
    }
  });
  
  html += `
      </div>
      
      ${!readonly ? `
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-top: 16px;">
          <div style="font-size: 12px; color: #6b7280;">
            <strong style="color: #374151;">Scoring Notes:</strong>
            <ul style="margin: 8px 0 0 0; padding-left: 20px;">
              <li><strong>Solo Events:</strong> Leave "Partnering Skills" blank or set to 0. Final score = (Technical + Movement + Choreography) ÷ 3</li>
              <li><strong>Pair Events:</strong> Fill all four components. Final score = (Technical + Movement + Choreography + Partnering) ÷ 4</li>
              <li><strong>Scoring Range:</strong> Each component: 0.0 to 10.0 (use decimals for precision)</li>
            </ul>
          </div>
        </div>
      ` : ''}
    </div>
  `;
  
  return html;
}


// Custom renderer for Baseball scoring
function renderBaseballScoreForm(config, existingScore = null, readonly = false) {
  // Parse existing score if present
  // Format: "R-H-E (i1-i2-i3-i4-i5-i6-i7-i8-i9-extra)"
  let parsedValues = {};
  
  if (existingScore) {
    const match = existingScore.match(/^(\d+)-(\d+)-(\d+)\s*\(([^)]+)\)$/);
    if (match) {
      parsedValues.runs = match[1];
      parsedValues.hits = match[2];
      parsedValues.errors = match[3];
      
      const innings = match[4].split('-');
      for (let i = 0; i < 9; i++) {
        parsedValues[`i${i + 1}`] = innings[i] || '0';
      }
      if (innings[9]) {
        parsedValues.extra = innings[9];
      }
    }
  }
  
  let html = `
    <div class="baseball-scoring">
      <!-- Info Banner -->
      <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
        <div style="display: flex; align-items: start; gap: 8px;">
          <svg width="20" height="20" fill="#f59e0b" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
          </svg>
          <div style="flex: 1; font-size: 13px; color: #78350f;">
            <strong>Official Baseball Box Score</strong><br>
            <span style="font-size: 12px;">All fields are required. Enter 0 for innings with no runs scored.</span>
          </div>
        </div>
      </div>
      
      <!-- Innings Grid (1-9) -->
      <div style="margin-bottom: 20px;">
        <div style="
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white;
          padding: 8px 12px;
          border-radius: 6px 6px 0 0;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          <svg width="16" height="16" fill="white" viewBox="0 0 16 16">
            <path d="M4 11H2v3h2v-3zm5-4H7v7h2V7zm5-5v12h-2V2h2zm-2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1h-2zM6 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7zm-5 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3z"/>
          </svg>
          Innings (Runs per Inning)
        </div>
        <div style="
          display: grid;
          grid-template-columns: repeat(9, 1fr);
          gap: 8px;
          padding: 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-top: none;
          border-radius: 0 0 6px 6px;
        ">
  `;
  
  // Render innings 1-9
  for (let i = 1; i <= 9; i++) {
    const fieldId = `i${i}`;
    const value = parsedValues[fieldId] || '0';
    
    html += `
      <div style="text-align: center;">
        <label for="${fieldId}" style="
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 4px;
        ">${i}</label>
        <input 
          type="number" 
          id="${fieldId}" 
          name="${fieldId}"
          min="0" 
          max="20"
          value="${value}"
          placeholder="0"
          style="
            width: 100%;
            padding: 8px 4px;
            border: 2px solid #d1d5db;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 700;
            text-align: center;
            color: #111827;
            transition: all 0.2s;
          "
          onfocus="this.style.borderColor='#3b82f6'; this.style.background='#eff6ff';"
          onblur="this.style.borderColor='#d1d5db'; this.style.background='white';"
          ${readonly ? 'readonly' : ''}
          required
        >
      </div>
    `;
  }
  
  html += `
        </div>
      </div>
      
      <!-- Extra Innings (Optional) -->
      <div style="margin-bottom: 20px;">
        <div style="
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
          color: white;
          padding: 8px 12px;
          border-radius: 6px 6px 0 0;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          <svg width="16" height="16" fill="white" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
          </svg>
          Extra Innings (if game extends beyond 9 innings)
        </div>
        <div style="
          padding: 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-top: none;
          border-radius: 0 0 6px 6px;
        ">
          <div style="display: flex; align-items: center; gap: 12px;">
            <label for="extra" style="
              font-size: 13px;
              font-weight: 600;
              color: #374151;
              min-width: 100px;
            ">Total Extra Runs:</label>
            <input 
              type="number" 
              id="extra" 
              name="extra"
              min="0" 
              max="20"
              value="${parsedValues.extra || ''}"
              placeholder="Leave blank if no extra innings"
              style="
                flex: 1;
                max-width: 150px;
                padding: 8px 12px;
                border: 2px solid #d1d5db;
                border-radius: 6px;
                font-size: 16px;
                font-weight: 700;
                text-align: center;
                color: #111827;
              "
              ${readonly ? 'readonly' : ''}
            >
            <span style="font-size: 12px; color: #6b7280; font-style: italic;">
              (Optional - only if game went to extra innings)
            </span>
          </div>
        </div>
      </div>
      
      <!-- Official Stats (R-H-E) -->
      <div style="margin-bottom: 16px;">
        <div style="
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
          color: white;
          padding: 8px 12px;
          border-radius: 6px 6px 0 0;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          <svg width="16" height="16" fill="white" viewBox="0 0 16 16">
            <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm6.5 4.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3a.5.5 0 0 1 1 0z"/>
          </svg>
          Official Game Statistics (REQUIRED)
        </div>
        <div style="
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          padding: 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-top: none;
          border-radius: 0 0 6px 6px;
        ">
          <!-- Runs -->
          <div style="
            background: #fef2f2;
            border: 2px solid #fca5a5;
            border-radius: 8px;
            padding: 14px;
            text-align: center;
          ">
            <label for="runs" style="
              display: block;
              font-size: 13px;
              font-weight: 700;
              color: #991b1b;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">R - Runs</label>
            <input 
              type="number" 
              id="runs" 
              name="runs"
              min="0" 
              max="99"
              value="${parsedValues.runs || ''}"
              placeholder="0"
              style="
                width: 100%;
                padding: 10px;
                border: 2px solid #dc2626;
                border-radius: 6px;
                font-size: 20px;
                font-weight: 700;
                text-align: center;
                color: #7f1d1d;
                background: white;
              "
              ${readonly ? 'readonly' : ''}
              required
            >
            <div style="font-size: 11px; color: #991b1b; margin-top: 6px; font-weight: 500;">
              Must match inning totals
            </div>
          </div>
          
          <!-- Hits -->
          <div style="
            background: #f0fdf4;
            border: 2px solid #86efac;
            border-radius: 8px;
            padding: 14px;
            text-align: center;
          ">
            <label for="hits" style="
              display: block;
              font-size: 13px;
              font-weight: 700;
              color: #166534;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">H - Hits</label>
            <input 
              type="number" 
              id="hits" 
              name="hits"
              min="0" 
              max="99"
              value="${parsedValues.hits || ''}"
              placeholder="0"
              style="
                width: 100%;
                padding: 10px;
                border: 2px solid #16a34a;
                border-radius: 6px;
                font-size: 20px;
                font-weight: 700;
                text-align: center;
                color: #14532d;
                background: white;
              "
              ${readonly ? 'readonly' : ''}
              required
            >
            <div style="font-size: 11px; color: #166534; margin-top: 6px; font-weight: 500;">
              Total base hits
            </div>
          </div>
          
          <!-- Errors -->
          <div style="
            background: #fffbeb;
            border: 2px solid #fcd34d;
            border-radius: 8px;
            padding: 14px;
            text-align: center;
          ">
            <label for="errors" style="
              display: block;
              font-size: 13px;
              font-weight: 700;
              color: #92400e;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">E - Errors</label>
            <input 
              type="number" 
              id="errors" 
              name="errors"
              min="0" 
              max="50"
              value="${parsedValues.errors || ''}"
              placeholder="0"
              style="
                width: 100%;
                padding: 10px;
                border: 2px solid #f59e0b;
                border-radius: 6px;
                font-size: 20px;
                font-weight: 700;
                text-align: center;
                color: #78350f;
                background: white;
              "
              ${readonly ? 'readonly' : ''}
              required
            >
            <div style="font-size: 11px; color: #92400e; margin-top: 6px; font-weight: 500;">
              Defensive errors
            </div>
          </div>
        </div>
      </div>
      
      ${!readonly ? `
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
          <div style="font-size: 12px; color: #6b7280;">
            <strong style="color: #374151;">📋 Scoring Requirements:</strong>
            <ul style="margin: 8px 0 0 0; padding-left: 20px; line-height: 1.6;">
              <li>All 9 innings must be filled (enter 0 if no runs scored)</li>
              <li>R, H, E fields are mandatory</li>
              <li>Total Runs must equal the sum of all inning runs</li>
              <li>Extra innings are optional (only use if game extended)</li>
            </ul>
          </div>
        </div>
      ` : ''}
    </div>
  `;
  
  return html;
}


async function populateScoreMatchDropdowns() {
  try {
    const tournaments = await fetchJSON('tournaments');
    const activeTournaments = tournaments.filter(t => t.is_active == 1);
    
    if (!activeTournaments || activeTournaments.length === 0) {
      $('#scoreMatchSelect').innerHTML = '<option value="">No active tournaments</option>';
      return;
    }
    
    const matches = await fetchJSON('matches');
    
    if (!matches || matches.length === 0) {
      $('#scoreMatchSelect').innerHTML = '<option value="">No matches scheduled</option>';
      return;
    }
    
    // Group matches by tournament
    const grouped = {};
    matches.forEach(m => {
      if (!grouped[m.tour_name]) grouped[m.tour_name] = [];
      grouped[m.tour_name].push(m);
    });
    
    let html = '<option value="">-- Select Match --</option>';
    
    Object.keys(grouped).forEach(tourName => {
      html += `<optgroup label="${escapeHtml(tourName)}">`;
      grouped[tourName].forEach(m => {
        const matchLabel = `${m.game_no} - ${m.sports_name} (${m.match_type}) - ${m.sked_date || 'TBA'}`;
        html += `<option value="${m.match_id}" 
                        data-tour-id="${m.tour_id}" 
                        data-sports-id="${m.sports_id}"
                        data-sports-name="${escapeHtml(m.sports_name)}"
                        data-sports-type="${m.sports_type}">
                  ${escapeHtml(matchLabel)}
                </option>`;
      });
      html += '</optgroup>';
    });
    
    $('#scoreMatchSelect').innerHTML = html;
    
    console.log('✅ Score match dropdowns populated');
  } catch (err) {
    console.error('❌ populateScoreMatchDropdowns error:', err);
    $('#scoreMatchSelect').innerHTML = '<option value="">Error loading matches</option>';
  }
}

// ==========================================
// WINNER DECLARATION
// ==========================================
// Note: Winner declaration functionality is already implemented above
// (see lines ~1512-1720 for the complete implementation that handles
// both team and individual sports with proper prefix parsing)

// ==========================================
// STANDINGS & MEDALS
// ==========================================

// STANDINGS - Fixed version
$('#standingsTourSelect')?.addEventListener('change', async (e) => {
  const tourId = e.target.value;
  const tbody = $('#standingsTable tbody');
  
  if (!tbody) return;
  
  if (!tourId) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">Select a tournament</td></tr>';
    return;
  }
  
  try {
    tbody.innerHTML = '<tr><td colspan="9" class="loading">Loading standings...</td></tr>';
    
    console.log('📡 Fetching standings for tournament:', tourId);
const data = await fetchJSON('standings', { tour_id: tourId });
    console.log('✅ Standings data received:', data);
    
    if (!Array.isArray(data)) {
      console.error('❌ Invalid data format:', data);
      tbody.innerHTML = '<tr><td colspan="9" class="empty-state" style="color:red;">Invalid data received from server</td></tr>';
      return;
    }
    
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No standings data available yet. Standings will appear after matches are completed and scored.</td></tr>';
      return;
    }
    
    // Generate table rows
    let html = '';
    data.forEach(s => {
      // For individual sports, show athlete name; for team sports, show team name
      const displayName = s.team_individual === 'individual' && s.athlete_name 
        ? escapeHtml(s.athlete_name) + (s.team_name ? ` (${escapeHtml(s.team_name)})` : '')
        : escapeHtml(s.team_name || 'Unknown');
      
      html += `
        <tr>
          <td><strong>${displayName}</strong></td>
          <td>${escapeHtml(s.sports_name || 'N/A')}</td>
          <td style="text-align:center;">${s.no_games_played || 0}</td>
          <td style="text-align:center;">${s.no_win || 0}</td>
          <td style="text-align:center;">${s.no_loss || 0}</td>
          <td style="text-align:center;">${s.no_draw || 0}</td>
          <td style="text-align:center;font-weight:600;color:#f59e0b;">${s.no_gold || 0}</td>
          <td style="text-align:center;font-weight:600;color:#9ca3af;">${s.no_silver || 0}</td>
          <td style="text-align:center;font-weight:600;color:#d97706;">${s.no_bronze || 0}</td>
        </tr>
      `;
    });
    
    tbody.innerHTML = html;
    console.log('✅ Standings table updated with', data.length, 'rows');
    
  } catch (err) {
    console.error('❌ loadStandings error:', err);
    tbody.innerHTML = '<tr><td colspan="9" style="color:red;padding:20px;text-align:center;">Error loading standings: ' + err.message + '</td></tr>';
  }
});

// MEDALS - Fixed version
$('#medalsTourSelect')?.addEventListener('change', async (e) => {
  const tourId = e.target.value;
  const tbody = $('#medalsTable tbody');
  
  if (!tbody) return;
  
  if (!tourId) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Select a tournament</td></tr>';
    return;
  }
  
  try {
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Loading medal tally...</td></tr>';
    
    console.log('📡 Fetching medals for tournament:', tourId);
const data = await fetchJSON('medal_tally', { tour_id: tourId });
    console.log('✅ Medal data received:', data);
    
    if (!Array.isArray(data)) {
      console.error('❌ Invalid data format:', data);
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state" style="color:red;">Invalid data received from server</td></tr>';
      return;
    }
    
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No medals awarded yet. Medal tally will appear after matches are completed and medals are awarded.</td></tr>';
      return;
    }
    
    // Generate table rows with ranking
    let html = '';
    data.forEach((m, idx) => {
      const rank = idx + 1;
      const totalMedals = (parseInt(m.total_gold) || 0) + 
                         (parseInt(m.total_silver) || 0) + 
                         (parseInt(m.total_bronze) || 0);
      
      html += `
        <tr>
          <td style="text-align:center;font-weight:600;font-size:16px;">${rank}</td>
          <td><strong>${escapeHtml(m.team_name || 'Unknown')}</strong></td>
          <td style="text-align:center;font-weight:600;color:#f59e0b;font-size:16px;">🥇 ${m.total_gold || 0}</td>
          <td style="text-align:center;font-weight:600;color:#9ca3af;font-size:16px;">🥈 ${m.total_silver || 0}</td>
          <td style="text-align:center;font-weight:600;color:#d97706;font-size:16px;">🥉 ${m.total_bronze || 0}</td>
          <td style="text-align:center;font-weight:700;font-size:16px;background:#f9fafb;">${totalMedals}</td>
        </tr>
      `;
    });
    
    tbody.innerHTML = html;
    console.log('✅ Medal table updated with', data.length, 'teams');
    
  } catch (err) {
    console.error('❌ loadMedals error:', err);
    tbody.innerHTML = '<tr><td colspan="6" style="color:red;padding:20px;text-align:center;">Error loading medals: ' + err.message + '</td></tr>';
  }
});

console.log('✅ Standings and Medals event listeners registered');

// ==========================================
// VENUES
// ==========================================

async function loadVenuesTable() {
  try {
    const data = await fetchJSON('venues');
    const content = $('#venuesContent');
    
    if (!Array.isArray(data) || data.length === 0) {
      content.innerHTML = '<div class="empty-state">No venues found</div>';
      return;
    }
    
    let html = '<div class="data-grid">';
    html += data.map(v => `
      <div class="data-card">
        <div class="data-card-header">
          <div class="data-card-title">${escapeHtml(v.venue_name)}</div>
          <span class="badge badge-${v.is_active == 1 ? 'active' : 'inactive'}">
            ${v.is_active == 1 ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div class="data-card-meta">
          ${v.venue_building ? '🏢 ' + escapeHtml(v.venue_building) : ''} 
          ${v.venue_room ? '• 🚪 ' + escapeHtml(v.venue_room) : ''}
        </div>
        <div class="data-card-actions">

          <button class="btn btn-sm btn-${v.is_active == 1 ? 'warning' : 'success'}" 
            onclick="toggleVenue(${v.venue_id}, ${v.is_active})">
            ${v.is_active == 1 ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    `).join('');
    html += '</div>';
    
    content.innerHTML = html;
    
    console.log('✅ Venues loaded:', data.length);
  } catch (err) {
    console.error('❌ loadVenues error:', err);
  }
}

function showVenueModal(venueId = null) {
  // Venue modal implementation
  alert('Venue modal - implement similarly to tournament modal');
}

async function editVenue(venueId) {
  // Edit venue implementation
  alert('Edit venue - implement modal with pre-filled data');
}

async function toggleVenue(venueId, currentStatus) {
  // Toggle venue implementation
  if (!confirm(`${currentStatus == 1 ? 'Deactivate' : 'Activate'} this venue?`)) return;
  
  try {
    const formData = new URLSearchParams();
    formData.set('venue_id', venueId);
    formData.set('is_active', currentStatus == 1 ? '0' : '1');

    const data = await fetchJSON('toggle_venue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    if (data.ok) {
      await loadVenuesTable();
    }
  } catch (err) {
    console.error('❌ Toggle venue error:', err);
  }
}

// ==========================================
// PRINT FUNCTIONALITY
// ==========================================

// ==========================================
// COMPLETE PRINT FUNCTIONALITY
// Replace the print section in tournament.js (lines ~1615-1653)
// ==========================================

// ==========================================
// FIXED PRINT FUNCTIONALITY WITH DEBUGGING
// Replace the print section in tournament.js
// ==========================================

// ==========================================
// PLAIN TEXT FORMAL PRINT FUNCTIONALITY
// Replace the print section in tournament.js
// ==========================================

// ==========================================
// FIXED PRINT REPORT GENERATION
// Replace the entire print section in tournament.js
// ==========================================

function openPrintModal() {
  const modal = $('#printModal');
  if (modal) {
    modal.classList.add('active');
  }
}

function closePrintModal() {
  const modal = $('#printModal');
  if (modal) {
    modal.classList.remove('active');
  }
  const tourSelect = $('#printTourSelect');
  if (tourSelect) tourSelect.value = '';
  
  const printOptions = $('#printOptions');
  if (printOptions) printOptions.style.display = 'none';
  
  const generateBtn = $('#generatePrintBtn');
  if (generateBtn) generateBtn.disabled = true;
}

$('#printTourSelect')?.addEventListener('change', function() {
  const printOptions = $('#printOptions');
  const generateBtn = $('#generatePrintBtn');
  
  if (this.value && printOptions && generateBtn) {
    printOptions.style.display = 'block';
    generateBtn.disabled = false;
  } else {
    if (printOptions) printOptions.style.display = 'none';
    if (generateBtn) generateBtn.disabled = true;
  }
});

async function generatePrintReport() {
  const tourId = $('#printTourSelect')?.value;
  
  if (!tourId) {
    alert('Please select a tournament');
    return;
  }

  const generateBtn = $('#generatePrintBtn');
  if (generateBtn) {
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
  }

  try {
    console.log('📄 Starting report generation for tournament:', tourId);

    // Get selected options
    const options = {
      overview: $('#print_overview')?.checked || false,
      sports: $('#print_sports')?.checked || false,
      teams: $('#print_teams')?.checked || false,
      players: $('#print_players')?.checked || false,
      coaches: $('#print_coaches')?.checked || false,
      matches: $('#print_matches')?.checked || false,
      results: $('#print_results')?.checked || false,
      standings: $('#print_standings')?.checked || false,
      medals: $('#print_medals')?.checked || false,
      officials: $('#print_officials')?.checked || false
    };

    // Get tournament data from dropdown
    const selectedOption = $('#printTourSelect')?.selectedOptions[0];
    const tourName = selectedOption?.dataset.tourName || selectedOption?.text || 'Tournament';
    const schoolYear = selectedOption?.dataset.schoolYear || '';
    const tourDate = selectedOption?.dataset.tourDate || '';

    console.log('📊 Tournament info:', { tourName, schoolYear, tourDate });

    // Initialize data objects
    let sports = [];
    let teams = [];
    let matches = [];
    let scores = [];
    let standings = [];
    let medals = [];
    let venues = [];
    let umpires = [];
    let managers = [];
    let athletes = [];

    // Fetch sports if needed
// Fetch sports if needed
if (options.sports || options.teams || options.players || options.coaches) {
  try {
    console.log('📡 Fetching sports...');
    
    // Try multiple methods to get sports
    let sportsData = null;
    
    // Method 1: Try tournament_sports endpoint
    try {
      sportsData = await fetchJSON('tournament_sports', { tour_id: tourId });
      console.log('✅ Method 1 - tournament_sports:', sportsData?.length || 0);
    } catch (err) {
      console.warn('⚠️ Method 1 failed:', err.message);
    }
    
    // Method 2: Try all_sports and filter by tournament
    if (!sportsData || sportsData.length === 0) {
      try {
        console.log('📡 Trying Method 2 - Fetching from sports_team assignments...');
        
        // Get unique sports from tbl_sports_team for this tournament
        const assignmentsUrl = `my_assignments`;
        const assignments = await fetchJSON(assignmentsUrl);
        
        if (assignments && assignments.length > 0) {
          const tournamentAssignments = assignments.filter(a => a.tour_id == tourId);
          
          // Get unique sports
          const uniqueSportsMap = new Map();
          tournamentAssignments.forEach(a => {
            if (!uniqueSportsMap.has(a.sports_id)) {
              uniqueSportsMap.set(a.sports_id, {
                sports_id: a.sports_id,
                sports_name: a.sports_name,
                team_individual: a.team_individual,
                men_women: a.men_women
              });
            }
          });
          
          sportsData = Array.from(uniqueSportsMap.values());
          console.log('✅ Method 2 - from assignments:', sportsData.length);
        }
      } catch (err) {
        console.warn('⚠️ Method 2 failed:', err.message);
      }
    }
    
    // Method 3: Get sports from teams data (will fetch teams first)
    if (!sportsData || sportsData.length === 0) {
      try {
        console.log('📡 Trying Method 3 - Getting sports from team registrations...');
        
        const allSports = await fetchJSON('all_sports');
        
        if (allSports && allSports.length > 0) {
          // We'll verify which sports are actually in this tournament later
          // For now, just get all active sports
          sportsData = allSports.filter(s => s.is_active == 1);
          console.log('✅ Method 3 - all active sports:', sportsData.length);
        }
      } catch (err) {
        console.warn('⚠️ Method 3 failed:', err.message);
      }
    }
    
    sports = sportsData || [];
    console.log('✅ Final sports count:', sports.length);
    
  } catch (err) {
    console.error('❌ Error fetching sports:', err);
    sports = [];
  }
}

    // Fetch teams if needed
    if (options.teams || options.players || options.coaches) {
      try {
        console.log('📡 Fetching teams...');
        
        // Try different endpoints to get teams
        let teamsData = null;
        
        // Method 1: tournament_sport_teams for each sport
        if (sports && sports.length > 0) {
          const allTeams = [];
          for (const sport of sports) {
            try {
              const sportTeams = await fetchJSON('tournament_sport_teams', {
                tour_id: tourId,
                sports_id: sport.sports_id
              });
              
              if (sportTeams && sportTeams.length > 0) {
                sportTeams.forEach(team => {
                  team.sports_name = sport.sports_name;
                  team.sports_id = sport.sports_id;
                  allTeams.push(team);
                });
              }
            } catch (err) {
              console.warn(`⚠️ Error fetching teams for ${sport.sports_name}:`, err);
            }
          }
          
          if (allTeams.length > 0) {
            teamsData = allTeams;
          }
        }
        
        // Method 2: Fallback to get_tournament_teams
        if (!teamsData || teamsData.length === 0) {
          try {
            teamsData = await fetchJSON('get_tournament_teams', { tour_id: tourId });
          } catch (err) {
            console.warn('⚠️ Error with get_tournament_teams:', err);
          }
        }
        
        teams = teamsData || [];
        console.log('✅ Teams fetched:', teams.length);
        
      } catch (err) {
        console.warn('⚠️ Error fetching teams:', err);
        teams = [];
      }
    }

    // Fetch athletes/players if needed
    if (options.players) {
      try {
        console.log('📡 Fetching athletes...');
        
        // Get athletes for each sport and team
        const allAthletes = [];
        
        if (teams.length > 0 && sports.length > 0) {
          for (const team of teams) {
            for (const sport of sports) {
              try {
                const teamAthletes = await fetchJSON('get_sport_athletes', {
                  tour_id: tourId,
                  team_id: team.team_id,
                  sports_id: sport.sports_id
                });
                
                if (teamAthletes && teamAthletes.length > 0) {
                  teamAthletes.forEach(athlete => {
                    athlete.team_name = team.team_name;
                    athlete.sports_name = sport.sports_name;
                    allAthletes.push(athlete);
                  });
                }
              } catch (err) {
                // Silent fail for individual team/sport combinations
              }
            }
          }
        }
        
        athletes = allAthletes;
        console.log('✅ Athletes fetched:', athletes.length);
        
      } catch (err) {
        console.warn('⚠️ Error fetching athletes:', err);
        athletes = [];
      }
    }

    // Fetch matches if needed
    if (options.matches || options.results) {
      try {
        console.log('📡 Fetching matches...');
        const allMatches = await fetchJSON('matches');
        matches = allMatches?.filter(m => m.tour_id == tourId) || [];
        console.log('✅ Matches fetched:', matches.length);
      } catch (err) {
        console.warn('⚠️ Error fetching matches:', err);
        matches = [];
      }
    }

    // Fetch scores if needed
    if (options.results) {
      try {
        console.log('📡 Fetching scores...');
        const allScores = await fetchJSON('scores');
        const matchIds = matches.map(m => m.match_id);
        scores = allScores?.filter(s => matchIds.includes(s.match_id)) || [];
        console.log('✅ Scores fetched:', scores.length);
      } catch (err) {
        console.warn('⚠️ Error fetching scores:', err);
        scores = [];
      }
    }

    // Fetch standings if needed
    if (options.standings) {
      try {
        console.log('📡 Fetching standings...');
        standings = await fetchJSON('standings', { tour_id: tourId }) || [];
        console.log('✅ Standings fetched:', standings.length);
      } catch (err) {
        console.warn('⚠️ Error fetching standings:', err);
        standings = [];
      }
    }

    // Fetch medals if needed
    if (options.medals) {
      try {
        console.log('📡 Fetching medals...');
        medals = await fetchJSON('medal_tally', { tour_id: tourId }) || [];
        console.log('✅ Medals fetched:', medals.length);
      } catch (err) {
        console.warn('⚠️ Error fetching medals:', err);
        medals = [];
      }
    }

    // Fetch venues
    try {
      console.log('📡 Fetching venues...');
      venues = await fetchJSON('venues') || [];
      console.log('✅ Venues fetched:', venues.length);
    } catch (err) {
      console.warn('⚠️ Error fetching venues:', err);
      venues = [];
    }

    // Fetch umpires if needed
    if (options.officials) {
      try {
        console.log('📡 Fetching umpires...');
        umpires = await fetchJSON('umpires') || [];
        console.log('✅ Umpires fetched:', umpires.length);
      } catch (err) {
        console.warn('⚠️ Error fetching umpires:', err);
        umpires = [];
      }
    }

    // Fetch sports managers if needed
    if (options.officials) {
      try {
        console.log('📡 Fetching managers...');
        managers = await fetchJSON('sports_managers') || [];
        console.log('✅ Managers fetched:', managers.length);
      } catch (err) {
        console.warn('⚠️ Error fetching managers:', err);
        managers = [];
      }
    }

    console.log('📊 Data fetching complete. Generating HTML...');

    // Generate the report HTML
    const reportHTML = generatePlainTextReport(tourName, schoolYear, tourDate, options, {
      sports, teams, matches, scores, standings, medals, venues, umpires, managers, tourId, athletes
    });

    console.log('✅ HTML generated successfully');

    // Display preview
    const preview = $('#printPreview');
    if (preview) {
      preview.innerHTML = reportHTML;
      preview.style.display = 'block';
    }
    
    // Close modal
    closePrintModal();
    
    // Scroll to preview
    if (preview) {
      preview.scrollIntoView({ behavior: 'smooth' });
    }
    
    console.log('✅ Report generated successfully!');
    
    // Auto-print prompt
    setTimeout(() => {
      if (confirm('Report generated! Would you like to print now?')) {
        printReport();
      }
    }, 500);

  } catch (err) {
    console.error('❌ PRINT GENERATION ERROR:', err);
    console.error('Error stack:', err.stack);
    alert('Error generating report: ' + err.message + '\n\nCheck the browser console (F12) for details.');
  } finally {
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generate Report';
    }
  }
}

function generatePlainTextReport(tourName, schoolYear, tourDate, options, data) {
  const { sports, teams, matches, scores, standings, medals, venues, umpires, managers, tourId, athletes } = data;
  
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  let html = `
    <div id="printableReport" style="max-width:850px;margin:40px auto;background:white;padding:60px;font-family:'Courier New',monospace;font-size:12px;line-height:1.8;color:#000;">
      
      <!-- Header -->
      <div style="text-align:center;margin-bottom:50px;border-bottom:2px solid #000;padding-bottom:30px;">
        <div style="font-size:24px;font-weight:bold;letter-spacing:2px;margin-bottom:15px;">TOURNAMENT REPORT</div>
        <div style="font-size:18px;font-weight:bold;margin-bottom:10px;">${escapeHtml(tourName).toUpperCase()}</div>
        <div style="margin-top:10px;">School Year: ${escapeHtml(schoolYear)}</div>
        <div>Tournament Date: ${formatDatePlain(tourDate)}</div>
      </div>

      ${options.overview ? generatePlainOverview(tourName, schoolYear, tourDate, sports, teams, matches) : ''}
      ${options.sports ? generatePlainSports(sports) : ''}
      ${options.teams ? generatePlainTeams(teams, sports) : ''}
      ${options.players ? generatePlainPlayers(athletes, teams, sports) : ''}
      ${options.coaches ? generatePlainCoaches(teams) : ''}
      ${options.matches ? generatePlainMatches(matches, venues) : ''}
      ${options.results ? generatePlainResults(scores, matches) : ''}
      ${options.standings ? generatePlainStandings(standings) : ''}
      ${options.medals ? generatePlainMedals(medals) : ''}
      ${options.officials ? generatePlainOfficials(umpires, managers) : ''}

      <!-- Footer -->
      <div style="margin-top:80px;padding-top:20px;border-top:2px solid #000;text-align:center;font-size:10px;">
        <div>This report was generated on ${currentDate}</div>
        <div style="margin-top:5px;">Tournament Management System</div>
      </div>
    </div>

    <!-- Print Controls -->
    <div style="position:fixed;top:20px;right:20px;z-index:10000;display:flex;gap:10px;background:white;padding:10px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);" class="no-print">
      <button onclick="printReport()" style="padding:12px 24px;background:#111827;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:14px;font-family:sans-serif;">
        🖨️ Print Report
      </button>
      <button onclick="closePreview()" style="padding:12px 24px;background:#dc2626;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:14px;font-family:sans-serif;">
        ✕ Close
      </button>
    </div>
  `;
  
  return html;
}

// Add new function for players section
function generatePlainPlayers(athletes, teams, sports) {
  if (!athletes || athletes.length === 0) {
    return `
      <div style="margin-bottom:50px;">
        <div style="font-size:16px;font-weight:bold;margin-bottom:20px;text-decoration:underline;">IV. TEAM ROSTERS (PLAYERS)</div>
        <div style="margin-left:20px;font-style:italic;">No players registered yet.</div>
      </div>
    `;
  }

  // Group athletes by team and sport
  const grouped = {};
  athletes.forEach(athlete => {
    const key = `${athlete.team_name} - ${athlete.sports_name}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(athlete);
  });

  let html = `
    <div style="margin-bottom:50px;page-break-inside:avoid;">
      <div style="font-size:16px;font-weight:bold;margin-bottom:20px;text-decoration:underline;">IV. TEAM ROSTERS (PLAYERS)</div>
  `;

  Object.keys(grouped).sort().forEach(key => {
    const group = grouped[key];
    const captains = group.filter(a => a.is_captain == 1);
    const players = group.filter(a => a.is_captain != 1);
    
    html += `
      <div style="margin-bottom:25px;margin-left:20px;">
        <div style="font-weight:bold;margin-bottom:10px;">${escapeHtml(key)} (${group.length} player${group.length !== 1 ? 's' : ''})</div>
        <div style="margin-left:20px;">
    `;

    // List captains first
    captains.forEach((player, idx) => {
      const fullName = `${player.f_name} ${player.m_name ? player.m_name + ' ' : ''}${player.l_name}`;
      html += `
        <div style="margin-bottom:5px;">
          ${idx + 1}. ${escapeHtml(fullName)} (CAPTAIN)${player.course ? ' - ' + escapeHtml(player.course) : ''}
        </div>
      `;
    });

    // Then regular players
    players.forEach((player, idx) => {
      const fullName = `${player.f_name} ${player.m_name ? player.m_name + ' ' : ''}${player.l_name}`;
      html += `
        <div style="margin-bottom:5px;">
          ${captains.length + idx + 1}. ${escapeHtml(fullName)}${player.course ? ' - ' + escapeHtml(player.course) : ''}
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}


// ==========================================
// PRINT REPORT HELPER FUNCTIONS
// Add these RIGHT AFTER the generatePlainTextReport function
// ==========================================

function generatePlainOverview(tourName, schoolYear, tourDate, sports, teams, matches) {
  const uniqueTeams = teams.length > 0 ? [...new Set(teams.map(t => t.team_id))].length : 0;
  const totalMatches = matches.length;
  
  return `
    <div style="margin-bottom:50px;page-break-after:avoid;">
      <div style="font-size:16px;font-weight:bold;margin-bottom:20px;text-decoration:underline;">I. TOURNAMENT OVERVIEW</div>
      
      <div style="margin-left:20px;">
        <div style="margin-bottom:10px;">
          <span style="display:inline-block;width:200px;">Tournament Name:</span>
          <span style="font-weight:bold;">${escapeHtml(tourName)}</span>
        </div>
        
        <div style="margin-bottom:10px;">
          <span style="display:inline-block;width:200px;">School Year:</span>
          <span style="font-weight:bold;">${escapeHtml(schoolYear)}</span>
        </div>
        
        <div style="margin-bottom:10px;">
          <span style="display:inline-block;width:200px;">Tournament Date:</span>
          <span style="font-weight:bold;">${formatDatePlain(tourDate)}</span>
        </div>
        
        <div style="margin-bottom:10px;">
          <span style="display:inline-block;width:200px;">Number of Sports:</span>
          <span style="font-weight:bold;">${sports.length}</span>
        </div>
        
        <div style="margin-bottom:10px;">
          <span style="display:inline-block;width:200px;">Participating Teams:</span>
          <span style="font-weight:bold;">${uniqueTeams}</span>
        </div>
        
        <div style="margin-bottom:10px;">
          <span style="display:inline-block;width:200px;">Total Matches:</span>
          <span style="font-weight:bold;">${totalMatches}</span>
        </div>
      </div>
    </div>
  `;
}

function generatePlainSports(sports) {
  if (!sports || sports.length === 0) {
    return `
      <div style="margin-bottom:50px;">
        <div style="font-size:16px;font-weight:bold;margin-bottom:20px;text-decoration:underline;">II. SPORTS AND CATEGORIES</div>
        <div style="margin-left:20px;font-style:italic;">No sports registered for this tournament.</div>
      </div>
    `;
  }

  let html = `
    <div style="margin-bottom:50px;page-break-inside:avoid;">
      <div style="font-size:16px;font-weight:bold;margin-bottom:20px;text-decoration:underline;">II. SPORTS AND CATEGORIES</div>
      <div style="margin-left:20px;">
  `;

  sports.forEach((sport, index) => {
    const sportType = sport.team_individual === 'team' ? 'Team Sport' : 'Individual Sport';
    const category = sport.men_women || 'Mixed';
    
    html += `
      <div style="margin-bottom:15px;">
        <div style="font-weight:bold;">${index + 1}. ${escapeHtml(sport.sports_name)}</div>
        <div style="margin-left:20px;margin-top:5px;">
          Type: ${sportType} | Category: ${escapeHtml(category)}
          ${sport.weight_class ? ` | Weight Class: ${escapeHtml(sport.weight_class)}` : ''}
        </div>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  return html;
}

function generatePlainTeams(teams, sports) {
  if (!teams || teams.length === 0) {
    return `
      <div style="margin-bottom:50px;">
        <div style="font-size:16px;font-weight:bold;margin-bottom:20px;text-decoration:underline;">III. PARTICIPATING TEAMS</div>
        <div style="margin-left:20px;font-style:italic;">No teams registered for this tournament.</div>
      </div>
    `;
  }

  // Group teams by sport
  const teamsBySport = {};
  teams.forEach(team => {
    const sportName = team.sports_name || 'Other';
    if (!teamsBySport[sportName]) {
      teamsBySport[sportName] = [];
    }
    // Avoid duplicates
    if (!teamsBySport[sportName].find(t => t.team_id === team.team_id)) {
      teamsBySport[sportName].push(team);
    }
  });

  let html = `
    <div style="margin-bottom:50px;page-break-inside:avoid;">
      <div style="font-size:16px;font-weight:bold;margin-bottom:20px;text-decoration:underline;">III. PARTICIPATING TEAMS</div>
  `;

  Object.keys(teamsBySport).sort().forEach(sportName => {
    const sportTeams = teamsBySport[sportName];
    
    html += `
      <div style="margin-bottom:25px;margin-left:20px;">
        <div style="font-weight:bold;margin-bottom:10px;">${escapeHtml(sportName)} (${sportTeams.length} team${sportTeams.length !== 1 ? 's' : ''})</div>
        <div style="margin-left:20px;">
    `;

    sportTeams.forEach((team, idx) => {
      const coachInfo = team.coach_name ? ' - Coach: ' + escapeHtml(team.coach_name) : '';
      html += `
        <div style="margin-bottom:5px;">
          ${idx + 1}. ${escapeHtml(team.team_name)}${coachInfo}
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

function generatePlainPlayers(athletes, teams, sports) {
  if (!athletes || athletes.length === 0) {
    return `
      <div style="margin-bottom:50px;">
        <div style="font-size:16px;font-weight:bold;margin-bottom:20px;text-decoration:underline;">IV. TEAM ROSTERS (PLAYERS)</div>
        <div style="margin-left:20px;font-style:italic;">No players registered yet.</div>
      </div>
    `;
  }

  // Group athletes by team and sport
  const grouped = {};
  athletes.forEach(athlete => {
    const key = `${athlete.team_name} - ${athlete.sports_name}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(athlete);
  });

  let html = `
    <div style="margin-bottom:50px;page-break-before:always;">
      <div style="font-size:16px;font-weight:bold;margin-bottom:20px;text-decoration:underline;">IV. TEAM ROSTERS (PLAYERS)</div>
  `;

  Object.keys(grouped).sort().forEach(key => {
    const group = grouped[key];
    const captains = group.filter(a => a.is_captain == 1);
    const players = group.filter(a => a.is_captain != 1);
    
    html += `
      <div style="margin-bottom:25px;margin-left:20px;">
        <div style="font-weight:bold;margin-bottom:10px;">${escapeHtml(key)} (${group.length} player${group.length !== 1 ? 's' : ''})</div>
        <div style="margin-left:20px;">
    `;

    // List captains first
    captains.forEach((player, idx) => {
      const fullName = `${player.f_name} ${player.m_name ? player.m_name + ' ' : ''}${player.l_name}`;
      html += `
        <div style="margin-bottom:5px;">
          ${idx + 1}. ${escapeHtml(fullName)} (CAPTAIN)${player.course ? ' - ' + escapeHtml(player.course) : ''}
        </div>
      `;
    });

    // Then regular players
    players.forEach((player, idx) => {
      const fullName = `${player.f_name} ${player.m_name ? player.m_name + ' ' : ''}${player.l_name}`;
      html += `
        <div style="margin-bottom:5px;">
          ${captains.length + idx + 1}. ${escapeHtml(fullName)}${player.course ? ' - ' + escapeHtml(player.course) : ''}
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

function generatePlainCoaches(teams) {
  if (!teams || teams.length === 0) return '';

  const coaches = teams.filter(t => t.coach_name).map(t => ({
    team: t.team_name,
    coach: t.coach_name,
    sport: t.sports_name
  }));

  if (coaches.length === 0) {
    return `
      <div style="margin-bottom:50px;">
        <div style="font-size:16px;font-weight:bold;margin-bottom:20px;text-decoration:underline;">V. COACHES AND TEAM OFFICIALS</div>
        <div style="margin-left:20px;font-style:italic;">No coaches assigned yet.</div>
      </div>
    `;
  }

  let html = `
    <div style="margin-bottom:50px;page-break-inside:avoid;">
      <div style="font-size:16px;font-weight:bold;margin-bottom:20px;text-decoration:underline;">V. COACHES AND TEAM OFFICIALS</div>
      <div style="margin-left:20px;">
  `;

  coaches.forEach((c, idx) => {
    html += `
      <div style="margin-bottom:8px;">
        ${idx + 1}. ${escapeHtml(c.team)} (${escapeHtml(c.sport)}) - ${escapeHtml(c.coach)}
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  return html;
}

function generatePlainMatches(matches, venues) {
  if (!matches || matches.length === 0) {
    return `
      <div style="margin-bottom:50px;">
        <div style="font-size:16px;font-weight:bold;margin-bottom:20px;text-decoration:underline;">VI. MATCH SCHEDULE</div>
        <div style="margin-left:20px;font-style:italic;">No matches scheduled yet.</div>
      </div>
    `;
  }

  // Group by date
  const byDate = {};
  matches.forEach(m => {
    const date = m.sked_date || 'No Date';
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(m);
  });

  let html = `
    <div style="margin-bottom:50px;page-break-before:always;">
      <div style="font-size:16px;font-weight:bold;margin-bottom:20px;text-decoration:underline;">VI. MATCH SCHEDULE</div>
  `;

  Object.keys(byDate).sort().forEach(date => {
    const dayMatches = byDate[date].sort((a, b) => (a.sked_time || '').localeCompare(b.sked_time || ''));
    
    html += `
      <div style="margin-bottom:30px;margin-left:20px;">
        <div style="font-weight:bold;margin-bottom:15px;text-decoration:underline;">${formatDatePlain(date)}</div>
    `;

    dayMatches.forEach((m, idx) => {
      const matchInfo = m.sports_type === 'individual' 
        ? `Individual Event - ${escapeHtml(m.sports_name)}`
        : `${escapeHtml(m.team_a_name || 'TBA')} vs ${escapeHtml(m.team_b_name || 'TBA')}`;
      
      html += `
        <div style="margin-bottom:10px;margin-left:20px;">
          <div>${idx + 1}. Game #${escapeHtml(m.game_no)} - ${formatTimePlain(m.sked_time)}</div>
          <div style="margin-left:20px;">
            Sport: ${escapeHtml(m.sports_name)} (${escapeHtml(m.match_type)})<br>
            Match: ${matchInfo}<br>
            Venue: ${escapeHtml(m.venue_name || 'TBA')}
          </div>
        </div>
      `;
    });

    html += `</div>`;
  });

  html += `</div>`;
  return html;
}

function generatePlainResults(scores, matches) {
  if (!scores || scores.length === 0) {
    return `
      <div style="margin-bottom:50px;">
        <div style="font-size:16px;font-weight:bold;margin-bottom:20px;text-decoration:underline;">VII. MATCH RESULTS AND SCORES</div>
        <div style="margin-left:20px;font-style:italic;">No results recorded yet.</div>
      </div>
    `;
  }

  let html = `
    <div style="margin-bottom:50px;page-break-before:always;">
      <div style="font-size:16px;font-weight:bold;margin-bottom:20px;text-decoration:underline;">VII. MATCH RESULTS AND SCORES</div>
      <div style="margin-left:20px;">
  `;

  scores.slice(0, 50).forEach((s, idx) => {
    const medalText = s.medal_type && s.medal_type !== 'None' ? ` - ${s.medal_type.toUpperCase()} MEDAL` : '';
    const competitorName = s.athlete_name || s.team_name || 'Unknown';
    
    html += `
      <div style="margin-bottom:12px;">
        <div>${idx + 1}. ${escapeHtml(s.match_info || 'Match')}</div>
        <div style="margin-left:20px;">
          Competitor: ${escapeHtml(competitorName)}<br>
          Score: ${escapeHtml(s.score)} | Rank: ${s.rank_no}${medalText}
        </div>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  return html;
}

function generatePlainStandings(standings) {
  if (!standings || standings.length === 0) {
    return `
      <div style="margin-bottom:50px;">
        <div style="font-size:16px;font-weight:bold;margin-bottom:20px;text-decoration:underline;">VIII. TEAM STANDINGS</div>
        <div style="margin-left:20px;font-style:italic;">No standings data available.</div>
      </div>
    `;
  }

  let html = `
    <div style="margin-bottom:50px;page-break-before:always;">
      <div style="font-size:16px;font-weight:bold;margin-bottom:20px;text-decoration:underline;">VIII. TEAM STANDINGS</div>
      <div style="margin-left:20px;">
  `;

  standings.forEach((s, idx) => {
    const displayName = s.athlete_name || s.team_name || 'Unknown';
    
    html += `
      <div style="margin-bottom:12px;">
        <div style="font-weight:bold;">${idx + 1}. ${escapeHtml(displayName)} - ${escapeHtml(s.sports_name)}</div>
        <div style="margin-left:20px;">
          Played: ${s.no_games_played || 0} | Won: ${s.no_win || 0} | Lost: ${s.no_loss || 0} | Draw: ${s.no_draw || 0}<br>
          Medals - Gold: ${s.no_gold || 0}, Silver: ${s.no_silver || 0}, Bronze: ${s.no_bronze || 0}
        </div>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  return html;
}

function generatePlainMedals(medals) {
  if (!medals || medals.length === 0) {
    return `
      <div style="margin-bottom:50px;">
        <div style="font-size:16px;font-weight:bold;margin-bottom:20px;text-decoration:underline;">IX. MEDAL TALLY</div>
        <div style="margin-left:20px;font-style:italic;">No medals awarded yet.</div>
      </div>
    `;
  }

  let html = `
    <div style="margin-bottom:50px;page-break-before:always;">
      <div style="font-size:16px;font-weight:bold;margin-bottom:20px;text-decoration:underline;">IX. MEDAL TALLY</div>
      <div style="margin-left:20px;">
        <div style="margin-bottom:20px;font-weight:bold;">
          <span style="display:inline-block;width:40px;">RANK</span>
          <span style="display:inline-block;width:250px;">TEAM</span>
          <span style="display:inline-block;width:60px;text-align:center;">GOLD</span>
          <span style="display:inline-block;width:70px;text-align:center;">SILVER</span>
          <span style="display:inline-block;width:70px;text-align:center;">BRONZE</span>
          <span style="display:inline-block;width:60px;text-align:center;">TOTAL</span>
        </div>
        <div style="border-top:1px solid #000;margin-bottom:10px;"></div>
  `;

  medals.forEach((m, idx) => {
    const total = (parseInt(m.total_gold) || 0) + (parseInt(m.total_silver) || 0) + (parseInt(m.total_bronze) || 0);
    const rank = (idx + 1).toString().padStart(2, ' ');
    
    html += `
      <div style="margin-bottom:8px;">
        <span style="display:inline-block;width:40px;">${rank}</span>
        <span style="display:inline-block;width:250px;">${escapeHtml(m.team_name)}</span>
        <span style="display:inline-block;width:60px;text-align:center;">${m.total_gold || 0}</span>
        <span style="display:inline-block;width:70px;text-align:center;">${m.total_silver || 0}</span>
        <span style="display:inline-block;width:70px;text-align:center;">${m.total_bronze || 0}</span>
        <span style="display:inline-block;width:60px;text-align:center;font-weight:bold;">${total}</span>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  return html;
}

function generatePlainOfficials(umpires, managers) {
  let html = `
    <div style="margin-bottom:50px;page-break-before:always;">
      <div style="font-size:16px;font-weight:bold;margin-bottom:20px;text-decoration:underline;">X. TOURNAMENT OFFICIALS</div>
  `;

  if (managers && managers.length > 0) {
    html += `
      <div style="margin-bottom:30px;margin-left:20px;">
        <div style="font-weight:bold;margin-bottom:10px;">Tournament Managers:</div>
        <div style="margin-left:20px;">
    `;

    managers.forEach((m, idx) => {
      html += `<div style="margin-bottom:5px;">${idx + 1}. ${escapeHtml(m.full_name)}</div>`;
    });

    html += `</div></div>`;
  }

  if (umpires && umpires.length > 0) {
    html += `
      <div style="margin-bottom:30px;margin-left:20px;">
        <div style="font-weight:bold;margin-bottom:10px;">Umpires:</div>
        <div style="margin-left:20px;">
    `;

    umpires.forEach((u, idx) => {
      html += `<div style="margin-bottom:5px;">${idx + 1}. ${escapeHtml(u.full_name)}</div>`;
    });

    html += `</div></div>`;
  }

  // Signature section
  html += `
    <div style="margin-top:80px;margin-left:20px;">
      <div style="font-weight:bold;margin-bottom:40px;">CERTIFICATION:</div>
      
      <div style="margin-bottom:60px;">
        <div style="margin-bottom:40px;">
          Prepared by:
        </div>
        <div style="border-bottom:1px solid #000;width:300px;margin-bottom:10px;"></div>
        <div>Tournament Manager</div>
        <div style="margin-top:15px;">Date: _____________________</div>
      </div>
      
      <div style="margin-bottom:60px;">
        <div style="margin-bottom:40px;">
          Reviewed and approved by:
        </div>
        <div style="border-bottom:1px solid #000;width:300px;margin-bottom:10px;"></div>
        <div>Sports Director</div>
        <div style="margin-top:15px;">Date: _____________________</div>
      </div>
    </div>
  </div>`;

  return html;
}

// Helper functions remain the same...
function formatDatePlain(dateStr) {
  if (!dateStr || dateStr === 'No Date') return 'No Date';
  try {
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  } catch (e) {
    return dateStr;
  }
}

function formatTimePlain(timeStr) {
  if (!timeStr) return 'TBA';
  try {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch (e) {
    return timeStr;
  }
}

function printReport() {
  const style = document.createElement('style');
  style.textContent = `
    @media print {
      @page {
        margin: 0.75in;
        size: letter portrait;
      }
      body {
        margin: 0;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      .sidebar, .top-bar {
        display: none !important;
      }
      .main-content {
        margin-left: 0 !important;
      }
      #printPreview {
        display: block !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      #printableReport {
        box-shadow: none !important;
        margin: 0 !important;
        padding: 0 !important;
        max-width: 100% !important;
      }
    }
  `;
  document.head.appendChild(style);
  
  window.print();
  
  setTimeout(() => {
    document.head.removeChild(style);
  }, 1000);
}

function closePreview() {
  const preview = $('#printPreview');
  if (preview) {
    preview.style.display = 'none';
    preview.innerHTML = '';
  }
}

// Export functions
window.generatePrintReport = generatePrintReport;
window.printReport = printReport;
window.closePreview = closePreview;

// ==========================================
// COMPLETE REGISTER TEAMS & PLAYERS JAVASCRIPT
// Copy this entire section and paste at the END of your tournament.js file
// ==========================================

// ==========================================
// REGISTER TEAMS FUNCTIONALITY
// ==========================================

async function loadAllTeams() {
  try {
    console.log('🔄 Loading teams...');
    const teams = await fetchJSON('get_all_teams');
    console.log('✅ Teams loaded:', teams);
    
    let html = '';
    
    if (!teams || teams.length === 0) {
      html = '<div class="empty-state">No teams registered yet. Click "Register New Team" to add one.</div>';
    } else {
      html = '<div class="data-grid">';
      teams.forEach(team => {
        const schoolName = team.school_name || 'Unknown School';
        const statusBadge = team.is_active == 1 
          ? '<span class="badge badge-active">Active</span>' 
          : '<span class="badge badge-inactive">Inactive</span>';
        
        html += `
          <div class="data-card">
            <div class="data-card-header">
              <div class="data-card-title">${escapeHtml(team.team_name)}</div>
              ${statusBadge}
            </div>
            <div class="data-card-meta">
              <div><strong>School:</strong> ${escapeHtml(schoolName)}</div>
              <div><strong>Team ID:</strong> ${team.team_id}</div>
            </div>
            <div class="data-card-actions">
              <button class="btn btn-sm btn-primary" onclick="editTeam(${team.school_id}, ${team.team_id})">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                </svg>
                Edit
              </button>
              <button class="btn btn-sm ${team.is_active == 1 ? 'btn-danger' : 'btn-success'}" 
                      onclick="toggleTeamStatus(${team.school_id}, ${team.team_id}, ${team.is_active})">
                ${team.is_active == 1 ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        `;
      });
      html += '</div>';
    }
    
    $('#teamsListContent').innerHTML = html;
  } catch(err) {
    console.error('❌ Error loading teams:', err);
    $('#teamsListContent').innerHTML = '<div class="empty-state" style="color: #dc2626;">Error loading teams. Check console for details.</div>';
  }
}

async function showRegisterTeamModal() {
  try {
    console.log('🔄 Loading schools for team registration...');
    const schools = await fetchJSON('get_schools');
    console.log('✅ Schools loaded:', schools);
    
    if (!schools || schools.length === 0) {
      alert('No schools found in the database. Please add schools first.');
      return;
    }
    
    let schoolOptions = '<option value="">-- Select School --</option>';
    schools.forEach(school => {
      schoolOptions += `<option value="${school.school_id}">${escapeHtml(school.school_name)}</option>`;
    });
    
    const html = `
      <div class="modal active" id="registerTeamModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Register New Team</h2>
            <span class="close-modal" onclick="closeModal('registerTeamModal')">&times;</span>
          </div>
          <div class="modal-body">
            <form id="registerTeamForm" class="form" onsubmit="submitRegisterTeam(event)">
              <div class="form-group">
                <label class="form-label">School *</label>
                <select name="school_id" class="form-control" required>
                  ${schoolOptions}
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Team Name *</label>
                <input type="text" name="team_name" class="form-control" required 
                       placeholder="e.g., BSIT Warriors, Engineering Tigers">
              </div>
              
              <div class="form-group">
                <label class="form-label">Status</label>
                <select name="is_active" class="form-control">
                  <option value="1" selected>Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
              
              <div style="margin-top: 20px; display: flex; gap: 8px; justify-content: flex-end;">
                <button type="button" class="btn btn-secondary" onclick="closeModal('registerTeamModal')">Cancel</button>
                <button type="submit" class="btn btn-primary">Register Team</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    $('#modalContainer').innerHTML = html;
  } catch(err) {
    console.error('❌ Error showing register team modal:', err);
    alert('Error loading schools. Please check console for details.');
  }
}

async function submitRegisterTeam(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  
  try {
    console.log('📤 Submitting team registration...');
    const result = await fetchJSON('register_team', {
      method: 'POST',
      body: formData
    });
    
    console.log('📥 Registration result:', result);
    
    if (result.ok) {
      alert('Team registered successfully!');
      closeModal('registerTeamModal');
      loadAllTeams();
    } else {
      alert('Error: ' + (result.message || 'Failed to register team'));
    }
  } catch(err) {
    console.error('❌ Error registering team:', err);
    alert('Error registering team. Please check console for details.');
  }
}

async function editTeam(schoolId, teamId) {
  try {
    console.log('🔄 Loading team for edit:', schoolId, teamId);
    const teams = await fetchJSON('get_all_teams');
    const schools = await fetchJSON('get_schools');
    const team = teams.find(t => t.school_id == schoolId && t.team_id == teamId);
    
    if (!team) {
      alert('Team not found');
      return;
    }
    
    let schoolOptions = '';
    schools.forEach(school => {
      const selected = school.school_id == team.school_id ? 'selected' : '';
      schoolOptions += `<option value="${school.school_id}" ${selected}>${escapeHtml(school.school_name)}</option>`;
    });
    
    const html = `
      <div class="modal active" id="editTeamModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Edit Team</h2>
            <span class="close-modal" onclick="closeModal('editTeamModal')">&times;</span>
          </div>
          <div class="modal-body">
            <form id="editTeamForm" class="form" onsubmit="submitEditTeam(event, ${schoolId}, ${teamId})">
              <div class="form-group">
                <label class="form-label">School *</label>
                <select name="school_id" class="form-control" required disabled>
                  ${schoolOptions}
                </select>
                <small style="color: #6b7280; font-size: 11px;">School cannot be changed after team creation</small>
              </div>
              
              <div class="form-group">
                <label class="form-label">Team Name *</label>
                <input type="text" name="team_name" class="form-control" required 
                       value="${escapeHtml(team.team_name)}">
              </div>
              
              <div class="form-group">
                <label class="form-label">Status</label>
                <select name="is_active" class="form-control">
                  <option value="1" ${team.is_active == 1 ? 'selected' : ''}>Active</option>
                  <option value="0" ${team.is_active == 0 ? 'selected' : ''}>Inactive</option>
                </select>
              </div>
              
              <div style="margin-top: 20px; display: flex; gap: 8px; justify-content: flex-end;">
                <button type="button" class="btn btn-secondary" onclick="closeModal('editTeamModal')">Cancel</button>
                <button type="submit" class="btn btn-primary">Update Team</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    $('#modalContainer').innerHTML = html;
  } catch(err) {
    console.error('❌ Error loading team for edit:', err);
    alert('Error loading team details.');
  }
}

async function submitEditTeam(e, schoolId, teamId) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  formData.append('old_school_id', schoolId);
  formData.append('old_team_id', teamId);
  
  try {
    console.log('📤 Updating team...');
    const result = await fetchJSON('update_team', {
      method: 'POST',
      body: formData
    });
    
    console.log('📥 Update result:', result);
    
    if (result.ok) {
      alert('Team updated successfully!');
      closeModal('editTeamModal');
      loadAllTeams();
    } else {
      alert('Error: ' + (result.message || 'Failed to update team'));
    }
  } catch(err) {
    console.error('❌ Error updating team:', err);
    alert('Error updating team. Please check console for details.');
  }
}

async function toggleTeamStatus(schoolId, teamId, currentStatus) {
  const newStatus = currentStatus == 1 ? 0 : 1;
  const action = newStatus == 1 ? 'activate' : 'deactivate';
  
  if (!confirm(`Are you sure you want to ${action} this team?`)) {
    return;
  }
  
  try {
    const formData = new FormData();
    formData.append('school_id', schoolId);
    formData.append('team_id', teamId);
    formData.append('is_active', newStatus);
    
    console.log('📤 Toggling team status...');
    const result = await fetchJSON('toggle_team_status', {
      method: 'POST',
      body: formData
    });
    
    console.log('📥 Toggle result:', result);
    
    if (result.ok) {
      alert(`Team ${action}d successfully!`);
      loadAllTeams();
    } else {
      alert('Error: ' + (result.message || `Failed to ${action} team`));
    }
  } catch(err) {
    console.error('❌ Error toggling team status:', err);
    alert('Error updating team status. Please check console for details.');
  }
}

// ==========================================
// REGISTER PLAYERS FUNCTIONALITY
// ==========================================

async function loadAllPlayers(teamFilter = '') {
  try {
    console.log('🔄 Loading athletes with filter:', teamFilter);
    let url = 'get_all_players';
    if (teamFilter) {
      url += `&team_id=${teamFilter}`;
    }
    
    const players = await fetchJSON(url);
    console.log('✅ Athletes loaded:', players);
    
    let html = '';
    
    if (!players || players.length === 0) {
      html = '<div class="empty-state">No athletes registered yet. Click "Register New Athlete" to add one.</div>';
    } else {
      html = '<div class="data-grid">';
      players.forEach(player => {
        const fullName = `${player.f_name} ${player.m_name ? player.m_name.charAt(0) + '.' : ''} ${player.l_name}`;
        const statusBadge = player.is_active == 1 
          ? '<span class="badge badge-active">Active</span>' 
          : '<span class="badge badge-inactive">Inactive</span>';
        
        html += `
          <div class="data-card">
            <div class="data-card-header">
              <div class="data-card-title">${escapeHtml(fullName)}</div>
              ${statusBadge}
            </div>
            <div class="data-card-meta">
              ${player.college_name ? `<div><strong>College:</strong> ${escapeHtml(player.college_name)}</div>` : ''}
              ${player.course ? `<div><strong>Course:</strong> ${escapeHtml(player.course)}</div>` : ''}
              ${player.date_birth ? `<div><strong>Birth Date:</strong> ${player.date_birth}</div>` : ''}
              ${player.blood_type ? `<div><strong>Blood Type:</strong> ${player.blood_type}</div>` : ''}
            </div>
            <div class="data-card-actions">
              <button class="btn btn-sm btn-primary" onclick="editPlayer(${player.person_id})">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                </svg>
                Edit
              </button>
              <button class="btn btn-sm ${player.is_active == 1 ? 'btn-danger' : 'btn-success'}" 
                      onclick="togglePlayerStatus(${player.person_id}, ${player.is_active})">
                ${player.is_active == 1 ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        `;
      });
      html += '</div>';
    }
    
    $('#playersListContent').innerHTML = html;
  } catch(err) {
    console.error('❌ Error loading athletes:', err);
    $('#playersListContent').innerHTML = '<div class="empty-state" style="color: #dc2626;">Error loading athletes. Check console for details.</div>';
  }
}

async function loadPlayersFilter() {
  const teamFilter = $('#playerFilterTeam').value;
  await loadAllPlayers(teamFilter);
}

async function loadPlayerFilterDropdown() {
  try {
    console.log('🔄 Loading teams for filter dropdown...');
    const teams = await fetchJSON('get_all_teams');
    
    let options = '<option value="">-- All Teams --</option>';
    if (teams && teams.length > 0) {
      teams.forEach(team => {
        const schoolName = team.school_name || 'Unknown';
        options += `<option value="${team.team_id}">${escapeHtml(team.team_name)} (${escapeHtml(schoolName)})</option>`;
      });
    }
    
    $('#playerFilterTeam').innerHTML = options;
  } catch(err) {
    console.error('❌ Error loading team filter:', err);
  }
}

async function showRegisterPlayerModal() {
  try {
    console.log('🔄 Loading colleges for player registration...');
    const colleges = await fetchJSON('get_colleges');
    console.log('✅ Colleges loaded:', colleges);
    
    let collegeOptions = '<option value="">-- Select College --</option>';
    if (colleges && colleges.length > 0) {
      colleges.forEach(college => {
        collegeOptions += `<option value="${escapeHtml(college.college_code)}">${escapeHtml(college.college_name)}</option>`;
      });
    }
    
    const html = `
      <div class="modal active" id="registerPlayerModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Register New Athlete</h2>
            <span class="close-modal" onclick="closeModal('registerPlayerModal')">&times;</span>
          </div>
          <div class="modal-body">
            <form id="registerPlayerForm" class="form" onsubmit="submitRegisterPlayer(event)">
              <!-- HIDDEN FIELD: Role type is always athlete/player -->
              <input type="hidden" name="role_type" value="athlete/player">
              
              <div class="form-group">
                <label class="form-label">Last Name *</label>
                <input type="text" name="l_name" class="form-control" required>
              </div>
              
              <div class="form-group">
                <label class="form-label">First Name *</label>
                <input type="text" name="f_name" class="form-control" required>
              </div>
              
              <div class="form-group">
                <label class="form-label">Middle Name</label>
                <input type="text" name="m_name" class="form-control">
              </div>
              
              <div class="form-group">
                <label class="form-label">Title</label>
                <input type="text" name="title" class="form-control" placeholder="e.g., Mr., Ms.">
              </div>
              
              <div class="form-group">
                <label class="form-label">Date of Birth</label>
                <input type="date" name="date_birth" class="form-control">
              </div>
              
              <div class="form-group">
                <label class="form-label">College</label>
                <select name="college_code" class="form-control">
                  ${collegeOptions}
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Course</label>
                <input type="text" name="course" class="form-control" placeholder="e.g., BSIT, BSCS">
              </div>
              
              <div class="form-group">
                <label class="form-label">Blood Type</label>
                <select name="blood_type" class="form-control">
                  <option value="">-- Select Blood Type --</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Status</label>
                <select name="is_active" class="form-control">
                  <option value="1" selected>Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
              
              <div style="margin-top: 20px; display: flex; gap: 8px; justify-content: flex-end;">
                <button type="button" class="btn btn-secondary" onclick="closeModal('registerPlayerModal')">Cancel</button>
                <button type="submit" class="btn btn-primary">Register Athlete</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    $('#modalContainer').innerHTML = html;
  } catch(err) {
    console.error('❌ Error showing register player modal:', err);
    alert('Error loading colleges. Please check console for details.');
  }
}

async function submitRegisterPlayer(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  
  try {
    console.log('📤 Submitting player registration...');
    const result = await fetchJSON('register_player', {
      method: 'POST',
      body: formData
    });
    
    console.log('📥 Registration result:', result);
    
    if (result.ok) {
      alert('Player registered successfully!');
      closeModal('registerPlayerModal');
      loadAllPlayers();
    } else {
      alert('Error: ' + (result.message || 'Failed to register player'));
    }
  } catch(err) {
    console.error('❌ Error registering player:', err);
    alert('Error registering player. Please check console for details.');
  }
}

async function editPlayer(personId) {
  try {
    console.log('🔄 Loading player for edit:', personId);
    const players = await fetchJSON('get_all_players');
    const colleges = await fetchJSON('get_colleges');
    const player = players.find(p => p.person_id == personId);
    
    if (!player) {
      alert('Player not found');
      return;
    }
    
    let collegeOptions = '<option value="">-- Select College --</option>';
    if (colleges && colleges.length > 0) {
      colleges.forEach(college => {
        const selected = college.college_code == player.college_code ? 'selected' : '';
        collegeOptions += `<option value="${escapeHtml(college.college_code)}" ${selected}>${escapeHtml(college.college_name)}</option>`;
      });
    }
    
    const html = `
      <div class="modal active" id="editPlayerModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Edit Athlete</h2>
            <span class="close-modal" onclick="closeModal('editPlayerModal')">&times;</span>
          </div>
          <div class="modal-body">
            <form id="editPlayerForm" class="form" onsubmit="submitEditPlayer(event, ${personId})">
              <!-- HIDDEN FIELD: Role type is always athlete/player -->
              <input type="hidden" name="role_type" value="athlete/player">
              
              <div class="form-group">
                <label class="form-label">Last Name *</label>
                <input type="text" name="l_name" class="form-control" required value="${escapeHtml(player.l_name || '')}">
              </div>
              
              <div class="form-group">
                <label class="form-label">First Name *</label>
                <input type="text" name="f_name" class="form-control" required value="${escapeHtml(player.f_name || '')}">
              </div>
              
              <div class="form-group">
                <label class="form-label">Middle Name</label>
                <input type="text" name="m_name" class="form-control" value="${escapeHtml(player.m_name || '')}">
              </div>
              
              <div class="form-group">
                <label class="form-label">Title</label>
                <input type="text" name="title" class="form-control" value="${escapeHtml(player.title || '')}">
              </div>
              
              <div class="form-group">
                <label class="form-label">Date of Birth</label>
                <input type="date" name="date_birth" class="form-control" value="${player.date_birth || ''}">
              </div>
              
              <div class="form-group">
                <label class="form-label">College</label>
                <select name="college_code" class="form-control">
                  ${collegeOptions}
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Course</label>
                <input type="text" name="course" class="form-control" value="${escapeHtml(player.course || '')}">
              </div>
              
              <div class="form-group">
                <label class="form-label">Blood Type</label>
                <select name="blood_type" class="form-control">
                  <option value="">-- Select Blood Type --</option>
                  <option value="A+" ${player.blood_type == 'A+' ? 'selected' : ''}>A+</option>
                  <option value="A-" ${player.blood_type == 'A-' ? 'selected' : ''}>A-</option>
                  <option value="B+" ${player.blood_type == 'B+' ? 'selected' : ''}>B+</option>
                  <option value="B-" ${player.blood_type == 'B-' ? 'selected' : ''}>B-</option>
                  <option value="AB+" ${player.blood_type == 'AB+' ? 'selected' : ''}>AB+</option>
                  <option value="AB-" ${player.blood_type == 'AB-' ? 'selected' : ''}>AB-</option>
                  <option value="O+" ${player.blood_type == 'O+' ? 'selected' : ''}>O+</option>
                  <option value="O-" ${player.blood_type == 'O-' ? 'selected' : ''}>O-</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Status</label>
                <select name="is_active" class="form-control">
                  <option value="1" ${player.is_active == 1 ? 'selected' : ''}>Active</option>
                  <option value="0" ${player.is_active == 0 ? 'selected' : ''}>Inactive</option>
                </select>
              </div>
              
              <div style="margin-top: 20px; display: flex; gap: 8px; justify-content: flex-end;">
                <button type="button" class="btn btn-secondary" onclick="closeModal('editPlayerModal')">Cancel</button>
                <button type="submit" class="btn btn-primary">Update Athlete</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    $('#modalContainer').innerHTML = html;
  } catch(err) {
    console.error('❌ Error loading player for edit:', err);
    alert('Error loading player details.');
  }
}

async function submitEditPlayer(e, personId) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  formData.append('person_id', personId);
  
  try {
    console.log('📤 Updating player...');
    const result = await fetchJSON('update_player', {
      method: 'POST',
      body: formData
    });
    
    console.log('📥 Update result:', result);
    
    if (result.ok) {
      alert('Player updated successfully!');
      closeModal('editPlayerModal');
      loadAllPlayers($('#playerFilterTeam').value);
    } else {
      alert('Error: ' + (result.message || 'Failed to update player'));
    }
  } catch(err) {
    console.error('❌ Error updating player:', err);
    alert('Error updating player. Please check console for details.');
  }
}

async function togglePlayerStatus(personId, currentStatus) {
  const newStatus = currentStatus == 1 ? 0 : 1;
  const action = newStatus == 1 ? 'activate' : 'deactivate';
  
  if (!confirm(`Are you sure you want to ${action} this player?`)) {
    return;
  }
  
  try {
    const formData = new FormData();
    formData.append('person_id', personId);
    formData.append('is_active', newStatus);
    
    console.log('📤 Toggling player status...');
    const result = await fetchJSON('toggle_player_status', {
      method: 'POST',
      body: formData
    });
    
    console.log('📥 Toggle result:', result);
    
    if (result.ok) {
      alert(`Player ${action}d successfully!`);
      loadAllPlayers($('#playerFilterTeam').value);
    } else {
      alert('Error: ' + (result.message || `Failed to ${action} player`));
    }
  } catch(err) {
    console.error('❌ Error toggling player status:', err);
    alert('Error updating player status. Please check console for details.');
  }
}

// ==========================================
// ATHLETE APPROVAL & DISQUALIFICATION MODULE
// Add this entire section to your tournament.js file
// ==========================================

let selectedPendingAthletes = new Set();
let currentApprovalTab = 'pending';

function switchApprovalTab(tab) {
  currentApprovalTab = tab;
  
  // Update tab buttons
  document.querySelectorAll('.approval-tab').forEach(btn => {
    if (btn.dataset.tab === tab) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Update content
  document.querySelectorAll('.approval-content').forEach(content => {
    content.style.display = 'none';
  });
  
  if (tab === 'pending') {
    const pendingContent = document.getElementById('pendingAthletesContent');
    if (pendingContent) pendingContent.style.display = 'block';
    loadPendingAthletes();
  } else {
    const approvedContent = document.getElementById('approvedAthletesContent');
    if (approvedContent) approvedContent.style.display = 'block';
    loadApprovedAthletes();
  }
}

async function loadPendingAthletes() {
  const tourId = document.getElementById('approvalFilterTournament')?.value || '';
  const list = document.getElementById('pendingAthletesList');
  
  if (!list) return;
  
  try {
    list.innerHTML = '<div class="loading">Loading pending athletes...</div>';
    
    let url = 'pending_athletes';
    if (tourId) url += `&tour_id=${tourId}`;
    
    const athletes = await fetchJSON(url);
    console.log('Pending athletes:', athletes);
    
    if (!athletes || athletes.length === 0) {
      list.innerHTML = '<div class="empty-state">No pending athletes to review. All athletes have been approved!</div>';
      document.getElementById('pendingCount').textContent = '0';
      return;
    }
    
    document.getElementById('pendingCount').textContent = athletes.length;
    
    // Group by tournament and sport
    const grouped = {};
    athletes.forEach(a => {
      const key = `${a.tour_name} - ${a.sports_name}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(a);
    });
    
    let html = '';
    
    Object.keys(grouped).forEach(key => {
      const group = grouped[key];
      html += `
        <div class="group-header" style="margin-bottom: 12px;">
          <h4 class="group-title">${escapeHtml(key)}</h4>
          <span class="group-badge">${group.length} athlete${group.length !== 1 ? 's' : ''}</span>
        </div>
      `;
      
      group.forEach(athlete => {
        const fullName = `${athlete.f_name} ${athlete.m_name ? athlete.m_name + ' ' : ''}${athlete.l_name}`;
        const age = athlete.date_birth ? calculateAge(athlete.date_birth) : 'N/A';
        
        html += `
          <div class="athlete-card">
            <div class="athlete-card-checkbox">
              <input type="checkbox" class="pending-athlete-checkbox" value="${athlete.team_ath_id}" 
                     onchange="updateBulkApproveButton()">
            </div>
            <div class="athlete-card-content">
              <div class="athlete-card-header">
                <div>
                  <div class="athlete-card-name">
                    ${escapeHtml(fullName)}
                    ${athlete.is_captain == 1 ? '<span class="badge" style="background: #fef3c7; color: #92400e; margin-left: 6px;">⭐ Captain</span>' : ''}
                  </div>
                </div>
                <span class="badge" style="background: #fffbeb; color: #92400e; border-color: #fde68a;">Pending</span>
              </div>
              <div class="athlete-card-meta">
                <div><strong>Team:</strong> ${escapeHtml(athlete.team_name)}</div>
                <div><strong>Coach:</strong> ${escapeHtml(athlete.coach_name || 'Not assigned')}</div>
                ${athlete.college_code ? `<div><strong>College:</strong> ${escapeHtml(athlete.college_code)}</div>` : ''}
                ${athlete.course ? `<div><strong>Course:</strong> ${escapeHtml(athlete.course)}</div>` : ''}
                <div><strong>Age:</strong> ${age} ${athlete.date_birth ? `(Born: ${athlete.date_birth})` : ''}</div>
              </div>
              <div class="athlete-card-actions">
                <button class="btn btn-sm btn-success" onclick="approveAthlete(${athlete.team_ath_id})">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                  </svg>
                  Approve
                </button>
                <button class="btn btn-sm btn-danger" onclick="showDisqualifyModal(${athlete.team_ath_id}, '${escapeHtml(fullName).replace(/'/g, "\\'")}')">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                  </svg>
                  Disqualify
                </button>
                <button class="btn btn-sm btn-secondary" onclick="viewAthleteDetails(${athlete.person_id})">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                  </svg>
                  View Details
                </button>
              </div>
            </div>
          </div>
        `;
      });
    });
    
    list.innerHTML = html;
    updateBulkApproveButton();
    
  } catch (err) {
    console.error('Error loading pending athletes:', err);
    list.innerHTML = '<div class="empty-state" style="color: #dc2626;">Error loading pending athletes</div>';
  }
}

async function loadApprovedAthletes() {
  const tourId = document.getElementById('approvalFilterTournament')?.value || '';
  const list = document.getElementById('approvedAthletesList');
  
  if (!list) return;
  
  try {
    list.innerHTML = '<div class="loading">Loading approved athletes...</div>';
    
    let url = 'approved_athletes';
    if (tourId) url += `&tour_id=${tourId}`;
    
    const athletes = await fetchJSON(url);
    console.log('Approved athletes:', athletes);
    
    if (!athletes || athletes.length === 0) {
      list.innerHTML = '<div class="empty-state">No approved athletes yet.</div>';
      document.getElementById('approvedCount').textContent = '0';
      return;
    }
    
    document.getElementById('approvedCount').textContent = athletes.length;
    
    // Group by tournament and sport
    const grouped = {};
    athletes.forEach(a => {
      const key = `${a.tour_name} - ${a.sports_name}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(a);
    });
    
    let html = '';
    
    Object.keys(grouped).forEach(key => {
      const group = grouped[key];
      html += `
        <div class="group-header" style="margin-bottom: 12px;">
          <h4 class="group-title">${escapeHtml(key)}</h4>
          <span class="group-badge">${group.length} athlete${group.length !== 1 ? 's' : ''}</span>
        </div>
      `;
      
      group.forEach(athlete => {
        const fullName = `${athlete.f_name} ${athlete.m_name ? athlete.m_name + ' ' : ''}${athlete.l_name}`;
        const age = athlete.date_birth ? calculateAge(athlete.date_birth) : 'N/A';
        
        html += `
          <div class="athlete-card">
            <div class="athlete-card-content">
              <div class="athlete-card-header">
                <div>
                  <div class="athlete-card-name">
                    ${escapeHtml(fullName)}
                    ${athlete.is_captain == 1 ? '<span class="badge" style="background: #fef3c7; color: #92400e; margin-left: 6px;">⭐ Captain</span>' : ''}
                  </div>
                </div>
                <span class="badge badge-active">✅ Approved</span>
              </div>
              <div class="athlete-card-meta">
                <div><strong>Team:</strong> ${escapeHtml(athlete.team_name)}</div>
                <div><strong>Coach:</strong> ${escapeHtml(athlete.coach_name || 'Not assigned')}</div>
                ${athlete.college_code ? `<div><strong>College:</strong> ${escapeHtml(athlete.college_code)}</div>` : ''}
                ${athlete.course ? `<div><strong>Course:</strong> ${escapeHtml(athlete.course)}</div>` : ''}
                <div><strong>Age:</strong> ${age} ${athlete.date_birth ? `(Born: ${athlete.date_birth})` : ''}</div>
              </div>
              <div class="athlete-card-actions">
                <button class="btn btn-sm btn-danger" onclick="showDisqualifyModal(${athlete.team_ath_id}, '${escapeHtml(fullName).replace(/'/g, "\\'")}')">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                  </svg>
                  Disqualify
                </button>
                <button class="btn btn-sm btn-secondary" onclick="viewAthleteDetails(${athlete.person_id})">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                  </svg>
                  View Details
                </button>
              </div>
            </div>
          </div>
        `;
      });
    });
    
    list.innerHTML = html;
    
  } catch (err) {
    console.error('Error loading approved athletes:', err);
    list.innerHTML = '<div class="empty-state" style="color: #dc2626;">Error loading approved athletes</div>';
  }
}

function toggleSelectAll(type) {
  const checkbox = document.getElementById('selectAllPending');
  const checkboxes = document.querySelectorAll('.pending-athlete-checkbox');
  
  checkboxes.forEach(cb => {
    cb.checked = checkbox.checked;
  });
  
  updateBulkApproveButton();
}

function updateBulkApproveButton() {
  const checkboxes = document.querySelectorAll('.pending-athlete-checkbox:checked');
  const bulkBtn = document.getElementById('bulkApproveBtn');
  
  if (bulkBtn) {
    bulkBtn.disabled = checkboxes.length === 0;
    if (checkboxes.length > 0) {
      bulkBtn.innerHTML = `
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
        </svg>
        Approve Selected (${checkboxes.length})
      `;
    } else {
      bulkBtn.innerHTML = `
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
        </svg>
        Approve Selected
      `;
    }
  }
}

async function approveAthlete(teamAthId) {
  if (!confirm('Are you sure you want to approve this athlete?')) {
    return;
  }
  
  try {
    const formData = new URLSearchParams();
    formData.set('team_ath_id', teamAthId);
    
    const result = await fetchJSON('approve_athlete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });
    
    if (result.ok) {
      alert('Athlete approved successfully!');
      loadPendingAthletes();
      loadApprovedAthletes();
    } else {
      alert('Error: ' + (result.message || 'Failed to approve athlete'));
    }
  } catch (err) {
    console.error('Error approving athlete:', err);
    alert('Error approving athlete');
  }
}

async function bulkApproveAthletes() {
  const checkboxes = document.querySelectorAll('.pending-athlete-checkbox:checked');
  
  if (checkboxes.length === 0) {
    alert('Please select at least one athlete to approve');
    return;
  }
  
  if (!confirm(`Are you sure you want to approve ${checkboxes.length} athlete(s)?`)) {
    return;
  }
  
  try {
    const ids = Array.from(checkboxes).map(cb => cb.value);
    const formData = new URLSearchParams();
    formData.set('team_ath_ids', ids.join(','));
    
    const result = await fetchJSON('bulk_approve_athletes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });
    
    if (result.ok) {
      alert(result.message || 'Athletes approved successfully!');
      document.getElementById('selectAllPending').checked = false;
      loadPendingAthletes();
      loadApprovedAthletes();
    } else {
      alert('Error: ' + (result.message || 'Failed to approve athletes'));
    }
  } catch (err) {
    console.error('Error bulk approving athletes:', err);
    alert('Error approving athletes');
  }
}

function showDisqualifyModal(teamAthId, athleteName) {
  const html = `
    <div class="modal active" id="disqualifyModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Disqualify Athlete</h2>
          <span class="close-modal" onclick="closeModal('disqualifyModal')">&times;</span>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 16px;">Are you sure you want to disqualify <strong>${athleteName}</strong>?</p>
          <form id="disqualifyForm" class="form" onsubmit="submitDisqualify(event, ${teamAthId})">
            <div class="form-group">
              <label class="form-label">Reason for Disqualification *</label>
              <textarea name="reason" class="form-control" rows="4" required 
                        placeholder="e.g., Incomplete documents, Age requirement not met, etc."></textarea>
            </div>
            
            <div style="margin-top: 20px; display: flex; gap: 8px; justify-content: flex-end;">
              <button type="button" class="btn btn-secondary" onclick="closeModal('disqualifyModal')">Cancel</button>
              <button type="submit" class="btn btn-danger">Disqualify</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('modalContainer').innerHTML = html;
}

async function submitDisqualify(e, teamAthId) {
  e.preventDefault();
  
  const form = e.target;
  const reason = form.reason.value;
  
  try {
    const formData = new URLSearchParams();
    formData.set('team_ath_id', teamAthId);
    formData.set('reason', reason);
    
    const result = await fetchJSON('disqualify_athlete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });
    
    if (result.ok) {
      alert('Athlete disqualified successfully');
      closeModal('disqualifyModal');
      
      if (currentApprovalTab === 'pending') {
        loadPendingAthletes();
      } else {
        loadApprovedAthletes();
      }
    } else {
      alert('Error: ' + (result.message || 'Failed to disqualify athlete'));
    }
  } catch (err) {
    console.error('Error disqualifying athlete:', err);
    alert('Error disqualifying athlete');
  }
}

async function viewAthleteDetails(personId) {
  try {
    const players = await fetchJSON('get_all_players');
    const athlete = players.find(p => p.person_id == personId);
    
    if (!athlete) {
      alert('Athlete not found');
      return;
    }
    
    const fullName = `${athlete.f_name} ${athlete.m_name ? athlete.m_name + ' ' : ''}${athlete.l_name}`;
    const age = athlete.date_birth ? calculateAge(athlete.date_birth) : 'N/A';
    
    const html = `
      <div class="modal active" id="athleteDetailsModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Athlete Details</h2>
            <span class="close-modal" onclick="closeModal('athleteDetailsModal')">&times;</span>
          </div>
          <div class="modal-body">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 13px;">
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Full Name:</div>
                <div>${escapeHtml(fullName)}</div>
              </div>
              
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Age:</div>
                <div>${age}</div>
              </div>
              
              ${athlete.date_birth ? `
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Date of Birth:</div>
                <div>${athlete.date_birth}</div>
              </div>
              ` : ''}
              
              ${athlete.college_name ? `
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">College:</div>
                <div>${escapeHtml(athlete.college_name)}</div>
              </div>
              ` : ''}
              
              ${athlete.course ? `
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Course:</div>
                <div>${escapeHtml(athlete.course)}</div>
              </div>
              ` : ''}
              
              ${athlete.blood_type ? `
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Blood Type:</div>
                <div>${athlete.blood_type}</div>
              </div>
              ` : ''}
              
              ${athlete.title ? `
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Title:</div>
                <div>${escapeHtml(athlete.title)}</div>
              </div>
              ` : ''}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('athleteDetailsModal')">Close</button>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = html;
  } catch (err) {
    console.error('Error loading athlete details:', err);
    alert('Error loading athlete details');
  }
}

function calculateAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// Event listener for approval tournament filter
const approvalFilter = document.getElementById('approvalFilterTournament');
if (approvalFilter) {
  approvalFilter.addEventListener('change', () => {
    if (currentApprovalTab === 'pending') {
      loadPendingAthletes();
    } else {
      loadApprovedAthletes();
    }
  });
}

tbody.innerHTML = data.map(m => {
      const teamADisplay = m.sports_type === 'individual' 
        ? '<em style="color:#6b7280;">Individual Event</em>' 
        : escapeHtml(m.team_a_name || 'TBA');
      
      const teamBDisplay = m.sports_type === 'individual' 
        ? '<em style="color:#6b7280;">-</em>' 
        : escapeHtml(m.team_b_name || 'TBA');
      
      // Winner display
      let winnerDisplay = '-';
      if (m.winner_id) {
        if (m.sports_type === 'individual') {
          winnerDisplay = athleteMap[m.winner_id] || 'Winner declared';
        } else {
          winnerDisplay = escapeHtml(m.winner_name || 'Winner declared');
        }
      }
      
      // Participant info display for individual sports
      let participantInfo = '';
      if (m.sports_type === 'individual') {
        const total = parseInt(m.total_participants) || 0;
        const registered = parseInt(m.registered_count) || 0;
        const competed = parseInt(m.competed_count) || 0;
        const absent = parseInt(m.absent_count) || 0;
        const disqualified = parseInt(m.disqualified_count) || 0;
        
        participantInfo = `
          <div style="font-size: 11px; margin-top: 4px; color: #6b7280;">
            ${total > 0 ? `
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px;">
                <span style="background: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 3px;">
                  📝 ${registered} Registered
                </span>
                ${competed > 0 ? `
                  <span style="background: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 3px;">
                    ✅ ${competed} Competed
                  </span>
                ` : ''}
                ${absent > 0 ? `
                  <span style="background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 3px;">
                    ❌ ${absent} Absent
                  </span>
                ` : ''}
                ${disqualified > 0 ? `
                  <span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 3px;">
                    ⚠️ ${disqualified} DQ
                  </span>
                ` : ''}
              </div>
            ` : '<span style="color: #dc2626;">⚠️ No participants registered</span>'}
          </div>
        `;
      }
      
      return `
        <tr>
          <td>${escapeHtml(m.game_no)}</td>
          <td>${m.sked_date}</td>
          <td>${m.sked_time}</td>
          <td>
            ${escapeHtml(m.sports_name)}
            <br><small style="color:#6b7280;">${m.sports_type === 'individual' ? '👤 Individual' : '👥 Team'}</small>
          </td>
          <td>${escapeHtml(m.match_type)}</td>
          <td>
            ${teamADisplay}
            ${participantInfo}
          </td>
          <td>${teamBDisplay}</td>
          <td>${escapeHtml(m.venue_name || 'TBA')}</td>
          <td>
            ${m.winner_id 
              ? `<span class="badge badge-active">🏆 ${winnerDisplay}</span>` 
              : '<span class="badge" style="background:#fef3c7;color:#92400e;">Pending</span>'}
          </td>
          <td>
            ${m.sports_type === 'individual' 
              ? `<button class="btn btn-sm btn-primary" onclick="viewMatchParticipants(${m.match_id}, '${escapeHtml(m.sports_name)}', '${m.game_no}')" 
                         title="View and manage participants">
                   <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                     <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
                   </svg>
                   Participants (${m.total_participants || 0})
                 </button>
                 <br style="margin-bottom: 4px;">`
              : ''}
            <button class="btn btn-sm" onclick="viewMatchDetails(${m.match_id})" title="View full match details">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
              </svg>
              View
            </button>
            <button class="btn btn-sm" onclick="editMatch(${m.match_id})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteMatch(${m.match_id})">Delete</button>
          </td>
        </tr>
      `;
    }).join('');


    tbody.innerHTML = data.map(m => {
      const teamADisplay = m.sports_type === 'individual' 
        ? '<em style="color:#6b7280;">Individual Event</em>' 
        : escapeHtml(m.team_a_name || 'TBA');
      
      const teamBDisplay = m.sports_type === 'individual' 
        ? '<em style="color:#6b7280;">-</em>' 
        : escapeHtml(m.team_b_name || 'TBA');
      
      // Winner display
      let winnerDisplay = '-';
      if (m.winner_id) {
        if (m.sports_type === 'individual') {
          winnerDisplay = athleteMap[m.winner_id] || 'Winner declared';
        } else {
          winnerDisplay = escapeHtml(m.winner_name || 'Winner declared');
        }
      }
      
      // Participant info display for individual sports
      let participantInfo = '';
      if (m.sports_type === 'individual') {
        const total = parseInt(m.total_participants) || 0;
        const registered = parseInt(m.registered_count) || 0;
        const competed = parseInt(m.competed_count) || 0;
        const absent = parseInt(m.absent_count) || 0;
        const disqualified = parseInt(m.disqualified_count) || 0;
        
        participantInfo = `
          <div style="font-size: 11px; margin-top: 4px; color: #6b7280;">
            ${total > 0 ? `
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px;">
                <span style="background: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 3px;">
                  📝 ${registered} Registered
                </span>
                ${competed > 0 ? `
                  <span style="background: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 3px;">
                    ✅ ${competed} Competed
                  </span>
                ` : ''}
                ${absent > 0 ? `
                  <span style="background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 3px;">
                    ❌ ${absent} Absent
                  </span>
                ` : ''}
                ${disqualified > 0 ? `
                  <span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 3px;">
                    ⚠️ ${disqualified} DQ
                  </span>
                ` : ''}
              </div>
            ` : '<span style="color: #dc2626;">⚠️ No participants registered</span>'}
          </div>
        `;
      }
      
      return `
        <tr>
          <td>${escapeHtml(m.game_no)}</td>
          <td>${m.sked_date}</td>
          <td>${m.sked_time}</td>
          <td>
            ${escapeHtml(m.sports_name)}
            <br><small style="color:#6b7280;">${m.sports_type === 'individual' ? '👤 Individual' : '👥 Team'}</small>
          </td>
          <td>${escapeHtml(m.match_type)}</td>
          <td>
            ${teamADisplay}
            ${participantInfo}
          </td>
          <td>${teamBDisplay}</td>
          <td>${escapeHtml(m.venue_name || 'TBA')}</td>
          <td>
            ${m.winner_id 
              ? `<span class="badge badge-active">🏆 ${winnerDisplay}</span>` 
              : '<span class="badge" style="background:#fef3c7;color:#92400e;">Pending</span>'}
          </td>
          <td>
            ${m.sports_type === 'individual' 
              ? `<button class="btn btn-sm btn-primary" onclick="viewMatchParticipants(${m.match_id}, '${escapeHtml(m.sports_name)}', '${m.game_no}')" 
                         title="View and manage participants">
                   <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                     <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
                   </svg>
                   Participants (${m.total_participants || 0})
                 </button>
                 <br style="margin-bottom: 4px;">`
              : ''}
            <button class="btn btn-sm" onclick="viewMatchDetails(${m.match_id})" title="View full match details">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
              </svg>
              View
            </button>
            <button class="btn btn-sm" onclick="editMatch(${m.match_id})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteMatch(${m.match_id})">Delete</button>
          </td>
        </tr>
      `;
    }).join('');


// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.remove();
  }
  $('#modalContainer').innerHTML = '';
}

// ==========================================
// GLOBAL EXPORTS
// ==========================================

window.toggleTeamForSport = toggleTeamForSport;
window.saveTeamsForSport = saveTeamsForSport;
window.viewTeamDetails = viewTeamDetails;
window.closeTeamDetailsModal = closeTeamDetailsModal;
window.deleteScore = deleteScore;
window.editVenue = editVenue;
window.toggleVenue = toggleVenue;
window.showVenueModal = showVenueModal;
window.openPrintModal = openPrintModal;
window.closePrintModal = closePrintModal;
window.generatePrintReport = generatePrintReport;
window.closePreview = closePreview;
window.showScheduleMatchModal = showScheduleMatchModal;
window.closeScheduleMatchModal = closeScheduleMatchModal;
window.saveScheduleMatch = saveScheduleMatch;
window.onScheduleTournamentChange = onScheduleTournamentChange;
window.onScheduleSportChange = onScheduleSportChange;
window.editMatch = editMatch;
window.closeEditMatchModal = closeEditMatchModal;
window.saveEditMatch = saveEditMatch;
window.deleteMatch = deleteMatch;
window.showScheduleMatchModal = showScheduleMatchModal;
window.onScheduleTournamentChange = onScheduleTournamentChange;
window.onScheduleSportChange = onScheduleSportChange;
window.saveScheduleMatch = saveScheduleMatch;
// Export functions to window
window.switchApprovalTab = switchApprovalTab;
window.loadPendingAthletes = loadPendingAthletes;
window.loadApprovedAthletes = loadApprovedAthletes;
window.toggleSelectAll = toggleSelectAll;
window.updateBulkApproveButton = updateBulkApproveButton;
window.approveAthlete = approveAthlete;
window.bulkApproveAthletes = bulkApproveAthletes;
window.showDisqualifyModal = showDisqualifyModal;
window.submitDisqualify = submitDisqualify;
window.viewAthleteDetails = viewAthleteDetails;
window.calculateAge = calculateAge;