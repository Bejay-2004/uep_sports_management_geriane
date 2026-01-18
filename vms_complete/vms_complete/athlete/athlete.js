const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const personId = window.ATHLETE_CONTEXT.person_id;
const sportsId = window.ATHLETE_CONTEXT.sports_id;

// ==========================================
// NAVIGATION
// ==========================================

const pageTitles = {
  'overview': 'Dashboard Overview',
  'teams': 'My Teams',
  'players': 'Team Players',
  'schedule': 'Match Schedule',
  'training': 'Training Schedule',
  'attendance': 'Training Attendance',
  'programs': 'Training Programs',
  'rankings': 'Team Rankings',
  'performance': 'My Performance & Scores',
  'account': 'Account Settings'  // ADD THIS
};

$$('.nav-link').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.nav-link').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const view = btn.dataset.view;
    
    $('#pageTitle').textContent = pageTitles[view] || 'Dashboard';
    
    $$('.content-view').forEach(v => v.classList.remove('active'));
    $(`#${view}-view`).classList.add('active');
    
    if (window.innerWidth <= 768) {
      $('.sidebar').classList.remove('active');
      $('#sidebarOverlay').classList.remove('active');
    }
    
    loadViewData(view);
  });
});

$('#menuToggle')?.addEventListener('click', () => {
  $('.sidebar').classList.toggle('active');
  $('#sidebarOverlay').classList.toggle('active');
});

$('#sidebarOverlay')?.addEventListener('click', () => {
  $('.sidebar').classList.remove('active');
  $('#sidebarOverlay').classList.remove('active');
});

// ==========================================
// API HELPER
// ==========================================

async function fetchJSON(action) {
  try {
    // Don't encode the entire action string - split it properly
    const parts = action.split('&');
    const mainAction = parts[0];
    const params = parts.slice(1).join('&');
    
    const url = params 
      ? `api.php?action=${encodeURIComponent(mainAction)}&${params}`
      : `api.php?action=${encodeURIComponent(mainAction)}`;
    
    console.log('📡 Fetching:', url);
    const res = await fetch(url);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Response error:', errorText);
      throw new Error(`HTTP ${res.status}`);
    }
    
    const data = await res.json();
    console.log('✅ Response:', data);
    return data;
  } catch (err) {
    console.error('❌ fetchJSON error:', err);
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
    case 'teams': loadMyTeams(); break;
    case 'players': loadTeamPlayers(); break;
    case 'schedule': loadMatches(); break;
    case 'training': loadTrainingSchedule(); break;
    case 'attendance': loadAttendance(); break;
    case 'programs': loadPrograms(); break;
    case 'rankings': loadRankingsView(); break;
    case 'performance': loadPerformance(); break;
    case 'account': loadAccountSettings(); break;  // ADD THIS
  }
} 


// Add this to the beginning of athlete.js

// ==========================================
// SUBMENU NAVIGATION
// ==========================================

// Handle submenu toggling
$$('.nav-link.has-submenu').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const parent = btn.dataset.parent;
    const submenu = $(`.submenu[data-parent="${parent}"]`);
    
    if (submenu) {
      // Toggle submenu
      const isExpanded = submenu.classList.contains('expanded');
      
      // Close all other submenus
      $$('.submenu').forEach(s => s.classList.remove('expanded'));
      $$('.nav-link.has-submenu').forEach(b => b.classList.remove('expanded'));
      
      if (!isExpanded) {
        submenu.classList.add('expanded');
        btn.classList.add('expanded');
      }
    }
  });
});

// Update nav link click handler to work with submenus
$$('.nav-link').forEach(btn => {
  btn.addEventListener('click', () => {
    // Skip if it's just a submenu toggle (has-submenu class)
    if (btn.classList.contains('has-submenu')) {
      return; // Let the submenu handler deal with it
    }
    
    // Remove active from all nav links
    $$('.nav-link').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // If this is a submenu item, also mark its parent as active
    const parent = btn.dataset.parent;
    if (parent) {
      const parentBtn = $(`.nav-link.has-submenu[data-parent="${parent}"]`);
      if (parentBtn) {
        parentBtn.classList.add('active');
        // Ensure submenu stays expanded
        const submenu = $(`.submenu[data-parent="${parent}"]`);
        if (submenu) {
          submenu.classList.add('expanded');
          parentBtn.classList.add('expanded');
        }
      }
    }
    
    const view = btn.dataset.view;
    
    $('#pageTitle').textContent = pageTitles[view] || 'Dashboard';
    
    $$('.content-view').forEach(v => v.classList.remove('active'));
    $(`#${view}-view`).classList.add('active');
    
    if (window.innerWidth <= 768) {
      $('.sidebar').classList.remove('active');
      $('#sidebarOverlay').classList.remove('active');
    }
    
    loadViewData(view);
  });
});

// Initialize: Auto-expand submenu if a submenu item is active on page load
document.addEventListener('DOMContentLoaded', () => {
  const activeLink = $('.nav-link.active');
  if (activeLink && activeLink.dataset.parent) {
    const parent = activeLink.dataset.parent;
    const parentBtn = $(`.nav-link.has-submenu[data-parent="${parent}"]`);
    const submenu = $(`.submenu[data-parent="${parent}"]`);
    
    if (parentBtn && submenu) {
      parentBtn.classList.add('expanded', 'active');
      submenu.classList.add('expanded');
    }
  }
});

// Add this to replace the existing rankings functions in athlete.js

async function loadRankingsView() {
  try {
    // Get athlete's teams first
    const teams = await fetchJSON('my_teams');
    
    if (!teams || teams.length === 0) {
      $('#rankingsContent').innerHTML = '<div class="empty-state">You are not part of any teams yet</div>';
      return;
    }
    
    // Load rankings for all teams
    $('#rankingsContent').innerHTML = '<div class="loading">Loading rankings...</div>';
    
    let allRankingsHTML = '';
    
    for (const team of teams) {
      try {
        const rankings = await fetchJSON(`rankings&team_id=${team.team_id}`);
        
        if (rankings && rankings.length > 0) {
          allRankingsHTML += rankings.map(r => renderTeamRankingCard(r)).join('');
        } else {
          // Show placeholder for team with no ranking data
          allRankingsHTML += `
            <div class="data-card" style="margin-bottom: 20px;">
              <div class="data-card-header">
                <div class="data-card-title">🏆 ${escapeHtml(team.team_name)}</div>
                <span class="badge" style="background:#f59e0b;color:white;">No Data</span>
              </div>
              <div class="data-card-meta">
                <strong>Sport:</strong> ${escapeHtml(team.sports_name)}
              </div>
              <div class="data-card-content">
                <p style="color:var(--muted);text-align:center;padding:20px;">
                  No ranking data available yet for this team.
                </p>
              </div>
            </div>
          `;
        }
      } catch (err) {
        console.warn(`Could not load ranking for team ${team.team_id}:`, err);
      }
    }
    
    if (allRankingsHTML) {
      $('#rankingsContent').innerHTML = allRankingsHTML;
    } else {
      $('#rankingsContent').innerHTML = '<div class="empty-state">No ranking data available</div>';
    }
    
    console.log('✅ Rankings loaded for all teams');
  } catch (err) {
    console.error('❌ loadRankingsView error:', err);
    $('#rankingsContent').innerHTML = '<div class="empty-state">Error loading rankings</div>';
  }
}

// Keep the existing renderTeamRankingCard function as is
function renderTeamRankingCard(ranking) {
  const wins = ranking.no_win || 0;
  const losses = ranking.no_loss || 0;
  const draws = ranking.no_draw || 0;
  const gamesPlayed = ranking.no_games_played || 0;
  const record = `${wins}W - ${losses}L${draws > 0 ? ' - ' + draws + 'D' : ''}`;
  
  const gold = ranking.no_gold || 0;
  const silver = ranking.no_silver || 0;
  const bronze = ranking.no_bronze || 0;
  const totalMedals = gold + silver + bronze;
  
  // Calculate win percentage
  const winPercentage = gamesPlayed > 0 ? ((wins / gamesPlayed) * 100).toFixed(1) : '0.0';
  
  return `
    <div class="data-card" style="margin-bottom: 20px;">
      <div class="data-card-header">
        <div class="data-card-title">🏆 ${escapeHtml(ranking.team_name)}</div>
        <span class="badge active">Your Team</span>
      </div>
      <div class="data-card-meta">
        <strong>Sport:</strong> ${escapeHtml(ranking.sports_name)}
      </div>
      <div class="data-card-content" style="margin-top: 16px;">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px;">
          <div style="text-align: center;">
            <div style="font-size: 13px; color: var(--muted); margin-bottom: 4px;">Games</div>
            <div style="font-size: 24px; font-weight: 700; color: var(--primary);">${gamesPlayed}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 13px; color: var(--muted); margin-bottom: 4px;">Record</div>
            <div style="font-size: 16px; font-weight: 700; color: var(--success);">${record}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 13px; color: var(--muted); margin-bottom: 4px;">Win %</div>
            <div style="font-size: 24px; font-weight: 700; color: var(--primary);">${winPercentage}%</div>
          </div>
        </div>
        
        <div style="padding-top: 16px; border-top: 1px solid var(--line);">
          <div style="font-size: 13px; color: var(--muted); margin-bottom: 12px; font-weight: 600;">🏅 Medal Count</div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
            <div style="text-align: center; padding: 12px; background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 8px;">
              <div style="font-size: 24px;">🥇</div>
              <div style="font-size: 20px; font-weight: 700; color: #92400e;">${gold}</div>
              <div style="font-size: 11px; color: #92400e; margin-top: 4px;">Gold</div>
            </div>
            <div style="text-align: center; padding: 12px; background: linear-gradient(135deg, #e2e8f0, #cbd5e1); border-radius: 8px;">
              <div style="font-size: 24px;">🥈</div>
              <div style="font-size: 20px; font-weight: 700; color: #475569;">${silver}</div>
              <div style="font-size: 11px; color: #475569; margin-top: 4px;">Silver</div>
            </div>
            <div style="text-align: center; padding: 12px; background: linear-gradient(135deg, #fed7aa, #fdba74); border-radius: 8px;">
              <div style="font-size: 24px;">🥉</div>
              <div style="font-size: 20px; font-weight: 700; color: #9a3412;">${bronze}</div>
              <div style="font-size: 11px; color: #9a3412; margin-top: 4px;">Bronze</div>
            </div>
          </div>
          <div style="margin-top: 12px; text-align: center; font-size: 14px; color: var(--muted);">
            <strong style="color: var(--text);">Total Medals: ${totalMedals}</strong>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// PERFORMANCE & SCORES FUNCTIONS
// ==========================================

async function loadPerformance() {
  try {
    await Promise.all([
      loadPerformanceStats(),
      loadMyRatings(),
      loadMyScores()
    ]);
  } catch (err) {
    console.error('loadPerformance error:', err);
  }
}

async function loadPerformanceStats() {
  try {
    const stats = await fetchJSON('my_performance_stats');
    
    if (stats) {
      $('#statAvgRating').textContent = stats.avg_rating || '0.0';
      $('#statTotalEvals').textContent = stats.total_evaluations || 0;
      
      const totalMedals = (stats.gold_medals || 0) + 
                         (stats.silver_medals || 0) + 
                         (stats.bronze_medals || 0);
      $('#statPersonalMedals').textContent = totalMedals;
      $('#statCompetitions').textContent = stats.total_competitions || 0;
    }
  } catch (err) {
    console.error('loadPerformanceStats error:', err);
  }
}

async function loadMyRatings() {
  try {
    const data = await fetchJSON('my_ratings');
    const tbody = $('#ratingsTable tbody');
    
    if (!data || !data.ratings || data.ratings.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;padding:40px;">
            <div class="empty-state">No training ratings yet</div>
          </td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = data.ratings.map(r => {
      const date = new Date(r.date_eval);
      const dateStr = date.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'short', 
        day: 'numeric' 
      });
      
      const ratingValue = parseFloat(r.rating || 0);
      let ratingClass = 'badge';
      let ratingColor = '';
      
      if (ratingValue >= 4.5) {
        ratingColor = 'background:#10b981;color:white;';
      } else if (ratingValue >= 3.5) {
        ratingColor = 'background:#3b82f6;color:white;';
      } else if (ratingValue >= 2.5) {
        ratingColor = 'background:#f59e0b;color:white;';
      } else {
        ratingColor = 'background:#ef4444;color:white;';
      }
      
      return `
        <tr>
          <td>${dateStr}</td>
          <td>
            <strong>${escapeHtml(r.activity_name)}</strong><br>
            <small style="color:var(--muted);">
              ${r.duration ? escapeHtml(r.duration) : ''} 
              ${r.repetition ? '• ' + escapeHtml(r.repetition) : ''}
            </small>
          </td>
          <td>
            <span class="badge" style="${ratingColor}">
              ⭐ ${ratingValue.toFixed(1)} / 5.0
            </span>
          </td>
          <td>${escapeHtml(r.team_name || 'N/A')}</td>
          <td>${escapeHtml(r.evaluator_name || 'N/A')}</td>
        </tr>
      `;
    }).join('');
    
    console.log('✅ Ratings loaded:', data.ratings.length);
  } catch (err) {
    console.error('❌ loadMyRatings error:', err);
    $('#ratingsTable tbody').innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;padding:40px;">
          <div class="empty-state">Error loading ratings</div>
        </td>
      </tr>
    `;
  }
}

async function loadMyScores() {
  try {
    console.log('📊 Loading competition scores...');
    const data = await fetchJSON('my_scores');
    console.log('📊 Scores response:', data);
    
    const tbody = $('#scoresTable tbody');
    
    if (!data) {
      console.error('❌ No data returned from my_scores API');
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:40px;">
            <div class="empty-state">Error loading scores - no response from server</div>
          </td>
        </tr>
      `;
      return;
    }
    
    if (!data.scores) {
      console.error('❌ Response missing scores array:', data);
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:40px;">
            <div class="empty-state">Invalid response format</div>
          </td>
        </tr>
      `;
      return;
    }
    
    if (data.scores.length === 0) {
      console.log('ℹ️ No competition scores found');
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:40px;">
            <div class="empty-state">No competition scores yet</div>
          </td>
        </tr>
      `;
      return;
    }
    
    console.log(`✅ Found ${data.scores.length} scores`);
    
    tbody.innerHTML = data.scores.map(s => {
      console.log('Processing score:', s);
      
      // Handle date
      let dateStr = 'N/A';
      if (s.sked_date) {
        try {
          const date = new Date(s.sked_date);
          dateStr = date.toLocaleDateString('en-US', { 
            year: 'numeric',
            month: 'short', 
            day: 'numeric' 
          });
        } catch (e) {
          console.warn('Invalid date:', s.sked_date);
          dateStr = s.sked_date;
        }
      }
      
      // Handle medal badge
      let medalBadge = '';
      const medalType = (s.medal_type || '').toLowerCase();
      
      if (medalType === 'gold') {
        medalBadge = '<span class="badge" style="background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#92400e;">🥇 Gold</span>';
      } else if (medalType === 'silver') {
        medalBadge = '<span class="badge" style="background:linear-gradient(135deg,#94a3b8,#64748b);color:white;">🥈 Silver</span>';
      } else if (medalType === 'bronze') {
        medalBadge = '<span class="badge" style="background:linear-gradient(135deg,#fb923c,#ea580c);color:white;">🥉 Bronze</span>';
      } else {
        medalBadge = '<span class="badge" style="background:#e5e7eb;color:#6b7280;">No Medal</span>';
      }
      
      // Format score using the helper function
      let formattedScore = '<strong>N/A</strong>';
      if (s.score && s.sports_name && typeof window.formatScoreWithLabels === 'function') {
        formattedScore = window.formatScoreWithLabels(s.score, s.sports_name, true);
      } else if (s.score) {
        formattedScore = `<strong>${escapeHtml(s.score)}</strong>`;
      }
      
      // Show team name if it's a team score
      let teamInfo = '';
      if (s.team_name && s.score_type === 'Team') {
        teamInfo = `<br><small style="color:var(--primary);">👥 ${escapeHtml(s.team_name)}</small>`;
      }
      
      return `
        <tr>
          <td>${dateStr}</td>
          <td>
            <strong>${escapeHtml(s.tour_name || 'Tournament')}</strong><br>
            <small style="color:var(--muted);">
              ${escapeHtml(s.match_type || 'Match')}
              ${s.game_no ? ' • Game #' + s.game_no : ''}
            </small>
            ${teamInfo}
          </td>
          <td>
            ${escapeHtml(s.sports_name || 'N/A')}
            ${s.sports_type ? `<br><small style="color:var(--muted);">${s.sports_type === 'team' ? '👥 Team' : '👤 Individual'}</small>` : ''}
          </td>
          <td style="min-width: 150px;">${formattedScore}</td>
          <td>
            ${s.rank_no ? `<span class="badge active">Rank ${s.rank_no}</span>` : '-'}
          </td>
          <td>${medalBadge}</td>
        </tr>
      `;
    }).join('');
    
    console.log('✅ Scores rendered successfully');
  } catch (err) {
    console.error('❌ loadMyScores error:', err);
    $('#scoresTable tbody').innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:40px;">
          <div class="empty-state">Error loading scores: ${err.message}</div>
        </td>
      </tr>
    `;
  }
}

// ==========================================
// OVERVIEW
// ==========================================

async function loadOverview() {
  try {
    await Promise.all([
      loadMyTeams(),
      loadMatches(),
      loadTrainingSchedule(),
      loadTraineeStats(),
      loadUpcomingSessions(),
      calculateTotalMedals()
    ]);
  } catch (err) {
    console.error('loadOverview error:', err);
  }
}


// ==========================================
// ATHLETE FUNCTIONS
// ==========================================

async function loadMyTeams() {
  try {
    const data = await fetchJSON('my_teams');
    
    if (!data) {
      $('#statTeams').textContent = '0';
      return;
    }
    
    $('#statTeams').textContent = data.length || 0;
    
    const overviewList = $('#overviewTeams');
    if (!data || data.length === 0) {
      overviewList.innerHTML = '<div class="empty-state">No teams assigned</div>';
    } else {
      overviewList.innerHTML = data.slice(0, 3).map(t => renderTeamCard(t)).join('');
    }
    
    const teamsContent = $('#teamsContent');
    if (!data || data.length === 0) {
      teamsContent.innerHTML = '<div class="empty-state">No teams assigned</div>';
    } else {
      teamsContent.innerHTML = data.map(t => renderTeamCard(t)).join('');
    }
    
    populateTeamFilters(data);
    
    console.log('✅ Teams loaded:', data.length);
  } catch (err) {
    console.error('❌ loadMyTeams error:', err);
    $('#overviewTeams').innerHTML = '<div class="empty-state">Error loading teams</div>';
  }
}

function renderTeamCard(team) {
  const isCaptain = team.is_captain == 1;
  
  // Clean up coach name
  let coachName = (team.coach_name || '').trim();
  if (!coachName || coachName === ' ' || coachName === '') {
    coachName = 'TBA';
  }
  
  // Clean up trainor names
  let trainorNames = (team.trainor_names || '').trim();
  
  return `
    <div class="data-card">
      <div class="data-card-header">
        <div class="data-card-title">${escapeHtml(team.team_name)}</div>
        ${isCaptain ? '<span class="badge captain">Captain</span>' : ''}
      </div>
      <div class="data-card-meta">
        <strong>Sport:</strong> ${escapeHtml(team.sports_name)}
      </div>
      <div class="data-card-content">
        <div style="margin-bottom: 8px;">
          <strong>Coach:</strong> ${escapeHtml(coachName)}
        </div>
        ${trainorNames ? `
          <div style="font-size: 13px; color: var(--muted);">
            <strong>Trainors:</strong> ${escapeHtml(trainorNames)}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function populateTeamFilters(teams) {
  // Populate team filter for players view
  const filterSelect = $('#teamFilterSelect');
  if (filterSelect) {
    if (teams && teams.length > 0) {
      filterSelect.innerHTML = '<option value="">All Teams</option>' + 
        teams.map(t => `<option value="${t.team_id}">${escapeHtml(t.team_name)}</option>`).join('');
    } else {
      filterSelect.innerHTML = '<option value="">No Teams Available</option>';
    }
  }
  
  // Populate rankings team select
  const rankingsSelect = $('#rankingsTeamSelect');
  if (rankingsSelect) {
    if (teams && teams.length > 0) {
      rankingsSelect.innerHTML = '<option value="">-- Select Team --</option>' + 
        teams.map(t => `<option value="${t.team_id}">${escapeHtml(t.team_name)}</option>`).join('');
    } else {
      rankingsSelect.innerHTML = '<option value="">-- No Teams Available --</option>';
    }
  }
}

$('#teamFilterSelect')?.addEventListener('change', (e) => {
  const teamId = e.target.value;
  loadTeamPlayers(teamId);
});

async function loadTeamPlayers(teamId = null) {
  try {
    let action = 'team_players';
    if (teamId) action += `&team_id=${teamId}`;
    
    const data = await fetchJSON(action);
    const tbody = $('#playersTable tbody');
    
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;"><div class="empty-state">No players found</div></td></tr>';
    } else {
      tbody.innerHTML = data.map(p => renderPlayerRow(p)).join('');
    }
    
    console.log('✅ Players loaded:', data.length);
  } catch (err) {
    console.error('❌ loadTeamPlayers error:', err);
    $('#playersTable tbody').innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;"><div class="empty-state">Error loading players</div></td></tr>';
  }
}

function renderPlayerRow(player) {
  const isCaptain = player.is_captain == 1;
  
  return `
    <tr>
      <td><strong>${escapeHtml(player.player_name)}</strong></td>
      <td>${escapeHtml(player.team_name)}</td>
      <td>${escapeHtml(player.sports_name)}</td>
      <td>
        ${isCaptain ? '<span class="badge captain">Captain</span>' : '<span class="badge active">Member</span>'}
      </td>
    </tr>
  `;
}

async function loadMatches() {
  try {
    const data = await fetchJSON('my_matches');
    
    if (!data) {
      $('#statUpcoming').textContent = '0';
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = data.filter(m => {
      const matchDate = new Date(m.sked_date);
      matchDate.setHours(0, 0, 0, 0);
      return matchDate >= today;
    });
    $('#statUpcoming').textContent = upcoming.length;
    
    const overviewMatches = $('#overviewMatches');
    if (upcoming.length === 0) {
      overviewMatches.innerHTML = '<div class="empty-state">No upcoming matches</div>';
    } else {
      overviewMatches.innerHTML = upcoming.slice(0, 3).map(m => renderMatchCard(m)).join('');
    }
    
    const scheduleContent = $('#scheduleContent');
    if (!data || data.length === 0) {
      scheduleContent.innerHTML = '<div class="empty-state">No matches scheduled</div>';
    } else {
      scheduleContent.innerHTML = data.map(m => renderMatchCard(m)).join('');
    }
    
    console.log('✅ Matches loaded:', data.length);
  } catch (err) {
    console.error('❌ loadMatches error:', err);
    $('#overviewMatches').innerHTML = '<div class="empty-state">Error loading matches</div>';
  }
}

// Replace the renderMatchCard function in athlete.js

// Replace the renderMatchCard function in athlete.js with this updated version

// Replace the renderMatchCard function in athlete.js with this updated version

function renderMatchCard(match) {
  const date = new Date(match.sked_date);
  const dateStr = date.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
  
  // Determine match display based on sports type
  let matchDisplay = '';
  
  if (match.sports_type === 'individual') {
    // For individual sports - show athlete's score if available
    let athleteScoreDisplay = '';
    
    // Check if we have a score for this athlete
    if (match.team_a_score && typeof window.formatScoreWithLabels === 'function') {
      athleteScoreDisplay = `
        <div style="margin-top: 12px; padding: 16px; background: #f9fafb; border-radius: 8px; border: 2px solid var(--primary);">
          <div style="font-size: 12px; color: var(--muted); margin-bottom: 8px; font-weight: 600;">Your Score</div>
          ${window.formatScoreWithLabels(match.team_a_score, match.sports_name, true)}
        </div>
      `;
    } else if (match.team_a_score) {
      athleteScoreDisplay = `
        <div style="margin-top: 12px; padding: 16px; background: #f9fafb; border-radius: 8px; border: 2px solid var(--primary);">
          <div style="font-size: 12px; color: var(--muted); margin-bottom: 4px; font-weight: 600;">Your Score</div>
          <div style="font-size: 20px; font-weight: 700; color: var(--primary);">${escapeHtml(match.team_a_score)}</div>
        </div>
      `;
    }
    
    matchDisplay = `
      <div class="match-teams">
        <div style="flex: 1; text-align: center;">
          <div style="font-size: 14px; color: var(--primary); font-weight: 700; margin-bottom: 8px;">
            ${match.my_team_name ? '👤 ' + escapeHtml(match.my_team_name) + ' (You)' : '👤 You'}
          </div>
          <div style="font-size: 12px; color: var(--muted);">Individual Event</div>
        </div>
      </div>
      ${athleteScoreDisplay}
      <div style="margin-top: 12px; padding: 12px; background: #f0fdf4; border-radius: 8px; text-align: center;">
        <div style="font-size: 12px; color: var(--muted); margin-bottom: 4px;">Competitors</div>
        <button 
          onclick="viewMatchCompetitors(${match.match_id}, '${escapeHtml(match.tour_name || 'Match')}')" 
          class="badge active" 
          style="cursor: pointer; border: none; padding: 6px 12px;">
          View All Participants →
        </button>
      </div>
    `;
  } else {
    // For team sports, show team A vs team B with scores
    const isTeamA = match.team_a_id === match.my_team_id;
    const isTeamB = match.team_b_id === match.my_team_id;
    
    // Format scores using the helper function if available
    let teamAScoreDisplay = '';
    let teamBScoreDisplay = '';
    
    if (match.team_a_score && typeof window.formatScoreCompact === 'function') {
      teamAScoreDisplay = `<div style="margin-top: 4px; font-size: 12px;">${window.formatScoreCompact(match.team_a_score, match.sports_name)}</div>`;
    } else if (match.team_a_score) {
      teamAScoreDisplay = `<div style="margin-top: 4px; font-size: 12px; color: var(--muted);">Score: <strong>${escapeHtml(match.team_a_score)}</strong></div>`;
    }
    
    if (match.team_b_score && typeof window.formatScoreCompact === 'function') {
      teamBScoreDisplay = `<div style="margin-top: 4px; font-size: 12px;">${window.formatScoreCompact(match.team_b_score, match.sports_name)}</div>`;
    } else if (match.team_b_score) {
      teamBScoreDisplay = `<div style="margin-top: 4px; font-size: 12px; color: var(--muted);">Score: <strong>${escapeHtml(match.team_b_score)}</strong></div>`;
    }
    
    matchDisplay = `
      <div class="match-teams">
        <div class="match-team ${isTeamA ? 'your-team' : ''}" style="flex: 1; text-align: center;">
          <div>${escapeHtml(match.team_a_name || 'TBA')}
          ${isTeamA ? ' <span style="font-size:12px;color:var(--primary);">(Your Team)</span>' : ''}</div>
          ${teamAScoreDisplay}
        </div>
        <div class="match-vs">VS</div>
        <div class="match-team ${isTeamB ? 'your-team' : ''}" style="flex: 1; text-align: center;">
          <div>${escapeHtml(match.team_b_name || 'TBA')}
          ${isTeamB ? ' <span style="font-size:12px;color:var(--primary);">(Your Team)</span>' : ''}</div>
          ${teamBScoreDisplay}
        </div>
      </div>
    `;
  }
  
  // Result badge
  let resultBadge = '';
  if (match.match_result === 'Won') {
    resultBadge = '<span class="badge" style="background:#10b981;color:white;">✓ Won</span>';
  } else if (match.match_result === 'Lost') {
    resultBadge = '<span class="badge" style="background:#ef4444;color:white;">✗ Lost</span>';
  } else {
    resultBadge = '<span class="badge" style="background:#f59e0b;color:white;">⏳ Pending</span>';
  }
  
  // Match type display
  const matchTypeMap = {
    'EL': 'Elimination',
    'QF': 'Quarter Finals',
    'SF': 'Semi Finals',
    'F': 'Finals'
  };
  const matchTypeDisplay = matchTypeMap[match.match_type] || match.match_type || 'Match';
  
  // Participation status
  let statusBadge = '';
  if (match.participation_status) {
    const statusMap = {
      'registered': '<span class="badge active">Registered</span>',
      'confirmed': '<span class="badge active">Confirmed</span>',
      'completed': '<span class="badge">Completed</span>',
      'withdrawn': '<span class="badge inactive">Withdrawn</span>'
    };
    statusBadge = statusMap[match.participation_status.toLowerCase()] || '';
  }
  
  // Build venue info
  let venueInfo = escapeHtml(match.venue_name || 'Venue TBA');
  if (match.venue_building) {
    venueInfo += ' - ' + escapeHtml(match.venue_building);
  }
  if (match.venue_room) {
    venueInfo += ', ' + escapeHtml(match.venue_room);
  }
  
  return `
    <div class="match-card" data-match-id="${match.match_id}">
      <div class="match-card-header">
        <div class="match-date">📅 ${dateStr} • ${match.sked_time}</div>
        <div style="display:flex;gap:8px;align-items:center;">
          <div class="match-sport">${escapeHtml(match.sports_name)}</div>
          ${resultBadge}
        </div>
      </div>
      
      ${match.tour_name ? `
        <div style="padding:8px 0;border-bottom:1px solid var(--line);">
          <div style="font-size:13px;color:var(--muted);">
            🏆 ${escapeHtml(match.tour_name)}
            ${match.game_no ? ` • Game #${match.game_no}` : ''}
          </div>
        </div>
      ` : ''}
      
      ${matchDisplay}
      
      <div class="match-details">
        <div class="match-detail">
          📍 ${venueInfo}
        </div>
        <div class="match-detail">
          🎯 ${escapeHtml(matchTypeDisplay)}
        </div>
        <div class="match-detail">
          ${match.sports_type === 'individual' ? '👤 Individual' : '👥 Team'}
        </div>
        ${statusBadge ? `<div class="match-detail">${statusBadge}</div>` : ''}
      </div>
      
      ${match.match_result === 'Won' ? `
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line);">
          <div style="font-size:13px;color:var(--success);font-weight:600;">
            ${match.sports_type === 'individual' 
              ? '🎉 You won this match!' 
              : '🎉 Your team won this match!'}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// Add this new function to show competitors in a modal/expanded view
async function viewMatchCompetitors(matchId, eventName) {
  try {
    console.log(`📋 Loading competitors for match ${matchId}`);
    
    // Fetch match participants
    const participants = await fetchJSON(`match_participants&match_id=${matchId}`);
    
    if (!participants || participants.length === 0) {
      alert('No participant information available for this match.');
      return;
    }
    
    // Create a modal/overlay to display competitors
    const competitorsHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;" id="competitorsModal" onclick="if(event.target.id === 'competitorsModal') this.remove()">
        <div style="background: white; border-radius: 16px; max-width: 600px; width: 100%; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);" onclick="event.stopPropagation()">
          <div style="padding: 24px; border-bottom: 1px solid var(--line); position: sticky; top: 0; background: white; border-radius: 16px 16px 0 0;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h3 style="margin: 0; font-size: 20px; font-weight: 700;">👥 Match Participants</h3>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: var(--muted);">${escapeHtml(eventName)}</p>
              </div>
              <button onclick="document.getElementById('competitorsModal').remove()" style="width: 32px; height: 32px; border: none; background: #f3f4f6; border-radius: 8px; cursor: pointer; font-size: 18px; color: #6b7280;">×</button>
            </div>
          </div>
          <div style="padding: 20px;">
            ${participants.map((p, index) => `
              <div style="padding: 16px; background: ${p.is_current_user ? 'linear-gradient(135deg, #dbeafe, #bfdbfe)' : '#f9fafb'}; border-radius: 12px; margin-bottom: 12px; border: ${p.is_current_user ? '2px solid var(--primary)' : '1px solid var(--line)'};">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 40px; height: 40px; border-radius: 10px; background: ${p.is_current_user ? 'var(--primary)' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)'}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px;">
                    ${index + 1}
                  </div>
                  <div style="flex: 1;">
                    <div style="font-weight: 700; font-size: 16px; color: var(--text);">
                      ${escapeHtml(p.athlete_name || p.team_name || 'Participant')}
                      ${p.is_current_user ? '<span style="font-size: 12px; color: var(--primary); margin-left: 8px;">(You)</span>' : ''}
                    </div>
                    ${p.team_name ? `<div style="font-size: 13px; color: var(--muted); margin-top: 2px;">${escapeHtml(p.team_name)}</div>` : ''}
                    ${p.status ? `<span class="badge ${p.status === 'confirmed' ? 'active' : ''}" style="margin-top: 4px; display: inline-block;">${escapeHtml(p.status)}</span>` : ''}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', competitorsHTML);
    
  } catch (err) {
    console.error('❌ Error loading competitors:', err);
    alert('Failed to load competitor information.');
  }
}

async function loadTrainingSchedule() {
  try {
    const data = await fetchJSON('training_schedule');
    
    if (!data || data.ok === false) {
      console.error('Training schedule error:', data);
      $('#statTraining').textContent = '0';
      $('#trainingContent').innerHTML = '<div class="empty-state">Error loading training sessions</div>';
      return;
    }
    
    $('#statTraining').textContent = data.length || 0;
    
    const trainingContent = $('#trainingContent');
    if (!data || data.length === 0) {
      trainingContent.innerHTML = '<div class="empty-state">No training sessions scheduled</div>';
    } else {
      trainingContent.innerHTML = data.map(t => renderTrainingCard(t)).join('');
    }
    
    console.log('✅ Training loaded:', data.length);
  } catch (err) {
    console.error('❌ loadTrainingSchedule error:', err);
    $('#statTraining').textContent = '0';
    $('#trainingContent').innerHTML = '<div class="empty-state">Error loading training</div>';
  }
}

function renderTrainingCard(training) {
  const date = new Date(training.sked_date);
  const dateStr = date.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric' 
  });
  
  const attendanceStatus = training.is_present === 1 ? 
    '<span class="badge active">Attended</span>' : 
    training.is_present === 0 ? 
    '<span class="badge inactive">Absent</span>' : 
    '<span class="badge">Pending</span>';
  
  return `
    <div class="training-card">
      <div class="training-card-header">
        <div class="training-team"><strong>${escapeHtml(training.team_name)}</strong></div>
        ${attendanceStatus}
      </div>
      <div class="training-datetime">
        <span>📅 ${dateStr}</span>
        <span>🕐 ${training.sked_time}</span>
      </div>
      <div class="training-venue">
        📍 ${escapeHtml(training.venue_name || 'Venue TBA')}
        ${training.venue_building ? ' - ' + escapeHtml(training.venue_building) : ''}
        ${training.venue_room ? ', ' + escapeHtml(training.venue_room) : ''}
      </div>
    </div>
  `;
}

$('#rankingsTeamSelect')?.addEventListener('change', (e) => {
  const teamId = e.target.value;
  if (teamId) {
    loadRankings(teamId);
  } else {
    $('#rankingsContent').innerHTML = '<div class="empty-state">Select a team to view rankings</div>';
  }
});

async function loadRankings(teamId) {
  try {
    const data = await fetchJSON(`rankings&team_id=${teamId}`);
    const content = $('#rankingsContent');
    
    if (!data) {
      content.innerHTML = '<div class="empty-state">Error loading rankings</div>';
      return;
    }
    
    if (data.length === 0) {
      content.innerHTML = '<div class="empty-state">No ranking data available for this team yet</div>';
    } else {
      // Show only the team's own ranking
      content.innerHTML = data.map(r => renderTeamRankingCard(r)).join('');
    }
    
    console.log('✅ Rankings loaded for team');
  } catch (err) {
    console.error('❌ loadRankings error:', err);
    $('#rankingsContent').innerHTML = '<div class="empty-state">Error loading rankings</div>';
  }
}

function renderTeamRankingCard(ranking) {
  const wins = ranking.no_win || 0;
  const losses = ranking.no_loss || 0;
  const draws = ranking.no_draw || 0;
  const gamesPlayed = ranking.no_games_played || 0;
  const record = `${wins}W - ${losses}L${draws > 0 ? ' - ' + draws + 'D' : ''}`;
  
  const gold = ranking.no_gold || 0;
  const silver = ranking.no_silver || 0;
  const bronze = ranking.no_bronze || 0;
  const totalMedals = gold + silver + bronze;
  
  return `
    <div class="data-card" style="margin-bottom: 20px;">
      <div class="data-card-header">
        <div class="data-card-title">🏆 ${escapeHtml(ranking.team_name)}</div>
        <span class="badge active">Your Team</span>
      </div>
      <div class="data-card-meta">
        <strong>Sport:</strong> ${escapeHtml(ranking.sports_name)}
      </div>
      <div class="data-card-content" style="margin-top: 16px;">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          <div>
            <div style="font-size: 13px; color: var(--muted); margin-bottom: 4px;">Games Played</div>
            <div style="font-size: 24px; font-weight: 700; color: var(--primary);">${gamesPlayed}</div>
          </div>
          <div>
            <div style="font-size: 13px; color: var(--muted); margin-bottom: 4px;">Record</div>
            <div style="font-size: 18px; font-weight: 700; color: var(--success);">${record}</div>
          </div>
        </div>
        
        <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--line);">
          <div style="font-size: 13px; color: var(--muted); margin-bottom: 12px; font-weight: 600;">Medal Count</div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
            <div style="text-align: center; padding: 12px; background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 8px;">
              <div style="font-size: 24px;">🥇</div>
              <div style="font-size: 20px; font-weight: 700; color: #92400e;">${gold}</div>
              <div style="font-size: 11px; color: #92400e; margin-top: 4px;">Gold</div>
            </div>
            <div style="text-align: center; padding: 12px; background: linear-gradient(135deg, #e2e8f0, #cbd5e1); border-radius: 8px;">
              <div style="font-size: 24px;">🥈</div>
              <div style="font-size: 20px; font-weight: 700; color: #475569;">${silver}</div>
              <div style="font-size: 11px; color: #475569; margin-top: 4px;">Silver</div>
            </div>
            <div style="text-align: center; padding: 12px; background: linear-gradient(135deg, #fed7aa, #fdba74); border-radius: 8px;">
              <div style="font-size: 24px;">🥉</div>
              <div style="font-size: 20px; font-weight: 700; color: #9a3412;">${bronze}</div>
              <div style="font-size: 11px; color: #9a3412; margin-top: 4px;">Bronze</div>
            </div>
          </div>
          <div style="margin-top: 12px; text-align: center; font-size: 14px; color: var(--muted);">
            <strong style="color: var(--text);">Total Medals: ${totalMedals}</strong>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function calculateTotalMedals() {
  try {
    const teams = await fetchJSON('my_teams');
    
    if (!teams || teams.length === 0) {
      $('#statMedals').textContent = '0';
      return;
    }
    
    let totalMedals = 0;
    
    for (const team of teams) {
      try {
        const standings = await fetchJSON(`rankings&team_id=${team.team_id}`);
        if (standings && Array.isArray(standings)) {
          const teamStanding = standings.find(s => s.team_id === team.team_id);
          
          if (teamStanding) {
            totalMedals += (teamStanding.no_gold || 0);
            totalMedals += (teamStanding.no_silver || 0);
            totalMedals += (teamStanding.no_bronze || 0);
          }
        }
      } catch (err) {
        console.warn('Could not fetch standings for team:', team.team_id);
      }
    }
    
    $('#statMedals').textContent = totalMedals;
  } catch (err) {
    console.error('❌ calculateTotalMedals error:', err);
    $('#statMedals').textContent = '0';
  }
}

// ==========================================
// TRAINEE FUNCTIONS
// ==========================================

async function loadTraineeStats() {
  try {
    const stats = await fetchJSON('trainee_stats');
    
    if (stats) {
      $('#statSessions').textContent = stats.sessions_attended || 0;
      $('#statRate').textContent = (stats.attendance_rate || 0) + '%';
      $('#statStreak').textContent = stats.streak || 0;
      $('#statTotal').textContent = stats.total_hours || 0;
    }
  } catch (err) {
    console.error('loadTraineeStats error:', err);
  }
}

async function loadUpcomingSessions() {
  try {
    const upcoming = await fetchJSON('upcoming_sessions');
    const upcomingEl = $('#upcomingSessions');
    
    if (!upcoming || upcoming.length === 0) {
      upcomingEl.innerHTML = `
        <div class="data-card">
          <p style="color:var(--muted);text-align:center;padding:20px;">No upcoming training sessions</p>
        </div>
      `;
    } else {
      upcomingEl.innerHTML = upcoming.slice(0, 3).map(s => `
        <div class="data-card">
          <div class="data-card-header">
            <div class="data-card-title">${escapeHtml(s.training_type)}</div>
            <span class="badge active">Scheduled</span>
          </div>
          <div class="data-card-meta">
            📅 ${escapeHtml(s.training_date)}<br>
            ⏰ ${escapeHtml(s.start_time)}<br>
            📍 ${escapeHtml(s.location || 'TBA')}<br>
            👨‍🏫 ${escapeHtml(s.trainor_name || 'TBA')}
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('loadUpcomingSessions error:', err);
  }
}

async function loadAttendance() {
  try {
    await loadTraineeStats();
    
    const attendance = await fetchJSON('my_attendance');
    const tbody = $('#attendanceTable tbody');
    
    if (!attendance || attendance.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;padding:40px;">
            <p style="color:var(--muted);">No attendance records found</p>
          </td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = attendance.map(a => {
      const statusClass = a.status === 'present' ? 'active' : 'inactive';
      const statusText = a.status === 'present' ? 'Present' : a.status === 'excused' ? 'Excused' : 'Absent';
      const statusIcon = a.status === 'present' ? '✅' : a.status === 'excused' ? '📝' : '❌';
      
      return `
        <tr>
          <td>${escapeHtml(a.training_date)}</td>
          <td>${escapeHtml(a.training_type)}</td>
          <td>${escapeHtml(a.duration || 'N/A')}</td>
          <td>${escapeHtml(a.trainor_name || 'N/A')}</td>
          <td>
            <span class="badge ${statusClass}">
              ${statusIcon} ${statusText}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('loadAttendance error:', err);
  }
}

async function loadPrograms() {
  try {
    const programs = await fetchJSON('my_programs');
    const content = $('#programsContent');
    
    if (!programs || programs.length === 0) {
      content.innerHTML = `
        <div class="data-card">
          <p style="color:var(--muted);text-align:center;padding:20px;">No training programs assigned yet</p>
        </div>
      `;
      return;
    }
    
    content.innerHTML = programs.map(p => `
      <div class="data-card" style="margin-bottom:16px;">
        <div class="data-card-header">
          <div class="data-card-title">🏋️ ${escapeHtml(p.program_name)}</div>
          <span class="badge ${p.is_active == 1 ? 'active' : 'inactive'}">
            ${p.is_active == 1 ? 'Active' : 'Completed'}
          </span>
        </div>
        <div class="data-card-meta">
          ⏱️ Duration: ${escapeHtml(p.duration_weeks)} weeks<br>
          ${p.description ? escapeHtml(p.description) : 'No description'}<br>
          ${p.goals ? '🎯 Goals: ' + escapeHtml(p.goals) : ''}
        </div>
        ${p.progress ? `
          <div style="margin-top:12px;">
            <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">Progress: ${p.progress}%</div>
            <div style="background:#e5e7eb;height:8px;border-radius:4px;overflow:hidden;">
              <div style="background:linear-gradient(135deg,#10b981,#059669);height:100%;width:${p.progress}%;transition:width 0.3s;"></div>
            </div>
          </div>
        ` : ''}
      </div>
    `).join('');
  } catch (err) {
    console.error('loadPrograms error:', err);
  }
}

// ==========================================
// ACCOUNT MANAGEMENT FUNCTIONS
// ==========================================

async function loadAccountSettings() {
  try {
    console.log('📋 Loading account settings...');
    const data = await fetchJSON('get_account_info');
    
    if (!data || !data.ok) {
      showToast('❌ Error loading account information', 'error');
      return;
    }
    
    const account = data.account;
    
    // Populate account info
    $('#accountFullName').textContent = account.full_name || 'N/A';
    $('#accountUsername').textContent = account.username || 'N/A';
    $('#accountRole').textContent = account.user_role || 'Athlete';
    $('#accountCollege').textContent = account.college_name || 'N/A';
    $('#accountCourse').textContent = account.course || 'N/A';
    
    console.log('✅ Account info loaded:', account);
  } catch (err) {
    console.error('❌ loadAccountSettings error:', err);
    showToast('❌ Error loading account settings', 'error');
  }
}

// Change Username Form Handler
$('#changeUsernameForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const newUsername = $('#newUsername').value.trim();
  
  if (!newUsername) {
    showToast('❌ Please enter a new username', 'error');
    return;
  }
  
  // Validate format
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(newUsername)) {
    showToast('❌ Username must be 3-30 characters and contain only letters, numbers, and underscores', 'error');
    return;
  }
  
  if (!confirm(`Are you sure you want to change your username to "${newUsername}"?\n\nYou will use this username to log in.`)) {
    return;
  }
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '⏳ Updating...';
  
  try {
    const response = await fetch('api.php?action=update_username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_username: newUsername })
    });
    
    const result = await response.json();
    
    if (result.ok) {
      showToast('✅ ' + result.message, 'success');
      $('#accountUsername').textContent = result.new_username;
      $('#newUsername').value = '';
      
      // Show additional notification
      setTimeout(() => {
        showToast(`💡 Your new username is: ${result.new_username}`, 'info');
      }, 1500);
    } else {
      showToast('❌ ' + (result.message || 'Error updating username'), 'error');
    }
  } catch (error) {
    console.error('Error updating username:', error);
    showToast('❌ Error updating username', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
});

// Change Password Form Handler
$('#changePasswordForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const currentPassword = $('#currentPassword').value;
  const newPassword = $('#newPassword').value;
  const confirmPassword = $('#confirmPassword').value;
  
  if (!currentPassword || !newPassword || !confirmPassword) {
    showToast('❌ Please fill in all password fields', 'error');
    return;
  }
  
  if (newPassword.length < 6) {
    showToast('❌ New password must be at least 6 characters long', 'error');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showToast('❌ New password and confirmation do not match', 'error');
    return;
  }
  
  if (!confirm('Are you sure you want to change your password?')) {
    return;
  }
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '⏳ Updating...';
  
  try {
    const response = await fetch('api.php?action=update_password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      })
    });
    
    const result = await response.json();
    
    if (result.ok) {
      showToast('✅ ' + result.message, 'success');
      
      // Clear form
      $('#currentPassword').value = '';
      $('#newPassword').value = '';
      $('#confirmPassword').value = '';
      
      // Additional notification
      setTimeout(() => {
        showToast('💡 Please remember your new password for future logins', 'info');
      }, 1500);
    } else {
      showToast('❌ ' + (result.message || 'Error updating password'), 'error');
    }
  } catch (error) {
    console.error('Error updating password:', error);
    showToast('❌ Error updating password', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
});

// Enhanced showToast function with multiple types
function showToast(message, type = 'info') {
  // Remove existing toasts
  document.querySelectorAll('.toast-notification').forEach(t => t.remove());
  
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6',
    warning: '#f59e0b'
  };
  
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };
  
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type]};
    color: white;
    padding: 14px 20px;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 10000;
    font-size: 14px;
    font-weight: 600;
    animation: slideIn 0.3s ease-out;
    min-width: 300px;
    max-width: 500px;
  `;
  toast.innerHTML = `${icons[type]} ${message}`;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Add animation keyframes
if (!document.getElementById('toastAnimations')) {
  const style = document.createElement('style');
  style.id = 'toastAnimations';
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
}

console.log('✅ Account management functions loaded');

// ==========================================
// INITIALIZE
// ==========================================

(async function init() {
  console.log('🚀 Initializing athlete dashboard with trainee features...');
  console.log('👤 Person ID:', personId);
  console.log('⚽ Sports ID:', sportsId);
  
  try {
    await loadOverview();
    console.log('✅ All data loaded successfully');
  } catch (err) {
    console.error('❌ Initialization error:', err);
  }
})();