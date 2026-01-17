const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const personId = window.SPECTATOR_CONTEXT.person_id;
const sportsId = window.SPECTATOR_CONTEXT.sports_id;

// Global active tournament tracker
let activeTournamentId = null;

// ==========================================
// NAVIGATION
// ==========================================

// Handle submenu toggle
$$('.nav-link.nav-parent').forEach(parent => {
  parent.addEventListener('click', (e) => {
    e.stopPropagation();
    const parentName = parent.dataset.parent;
    const submenu = $(`.nav-submenu[data-parent="${parentName}"]`);
    
    parent.classList.toggle('expanded');
    submenu.classList.toggle('expanded');
  });
});

// Sidebar navigation
$$('.nav-link').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.classList.contains('nav-parent')) {
      return;
    }
    
    $$('.nav-link').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const viewId = btn.dataset.view + '-view';
    $$('.content-view').forEach(v => v.classList.remove('active'));
    $(`#${viewId}`).classList.add('active');
    
    const titles = {
      'overview': 'Dashboard Overview',
      'matches': 'Match Schedule',
      'standings': 'Team Rankings',
      'teams': 'Teams & Players',
      'tournaments': 'All Tournaments',
      'sports': 'All Sports'
    };
    $('#pageTitle').textContent = titles[btn.dataset.view] || 'Dashboard';
    
    // Load data for the view with active tournament filter
    if (btn.dataset.view === 'matches') {
      loadMatchesGrouped();
    } else if (btn.dataset.view === 'standings') {
      loadStandings();
    } else if (btn.dataset.view === 'teams') {
      loadTeams();
    } else if (btn.dataset.view === 'tournaments') {
      loadTournaments();
    } else if (btn.dataset.view === 'sports') {
      loadSports();
    }
  });
});

// Mobile menu toggle
$('#menuToggle')?.addEventListener('click', () => {
  $('.sidebar').classList.toggle('active');
  $('#sidebarOverlay').classList.toggle('active');
});

$('#sidebarOverlay')?.addEventListener('click', () => {
  $('.sidebar').classList.remove('active');
  $('#sidebarOverlay').classList.remove('active');
});

// ==========================================
// SCORE DISPLAY HELPERS
// ==========================================

function ensureScoreHelpers() {
  if (typeof window.formatScoreWithLabels === 'undefined') {
    console.warn('⚠️ score-display-helper.js not loaded');
    return false;
  }
  return true;
}

function formatScore(score, sportName, detailed = false) {
  if (!score || score === '0' || score === '0-0-0-0-0') return '-';
  
  if (ensureScoreHelpers()) {
    try {
      return window.formatScoreWithLabels(score, sportName, detailed);
    } catch (err) {
      console.error('Error formatting score:', err);
    }
  }
  return `<strong>${escapeHtml(score)}</strong>`;
}

function getTotalScore(score, sportName) {
  if (!score || score === '0') return null;
  
  if (score.includes('(')) {
    const match = score.match(/^(\d+)\s*\(/);
    if (match) return parseInt(match[1]);
  }
  
  if (ensureScoreHelpers()) {
    const config = window.getSportScoringConfig(sportName);
    if (config.type === 'sets') {
      const scores = score.split(config.separator || '-');
      return scores.filter(s => s && s.trim() !== '0').length;
    }
  }
  
  const num = parseFloat(score);
  return isNaN(num) ? null : num;
}

// ==========================================
// API HELPER
// ==========================================

async function fetchJSON(action, params = {}) {
  try {
    let url = `api.php?action=${encodeURIComponent(action)}`;
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined && value !== '') {
        url += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      }
    }
    
    console.log('📡 Fetching:', url);
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    const data = await res.json();
    console.log('✅ Response:', action, data);
    return data;
  } catch (err) {
    console.error('❌ fetchJSON error:', err);
    return [];
  }
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[m]));
}

// ==========================================
// LOAD TOURNAMENTS
// ==========================================

async function loadTournaments() {
  try {
    const data = await fetchJSON('tournaments');
    
    $('#statTournaments').textContent = data.length;
    
    if (data.length > 0 && !activeTournamentId) {
      activeTournamentId = data[0].tour_id;
      console.log('🎯 Set active tournament:', activeTournamentId);
    }
    
    const tournamentFilters = [
      '#overviewTournamentFilter',
      '#matchTournamentFilter',
      '#standingTournamentFilter'
    ];
    
    tournamentFilters.forEach(selector => {
      const select = $(selector);
      if (select && data.length > 0) {
        select.innerHTML = data.map(t => 
          `<option value="${t.tour_id}" ${t.tour_id == activeTournamentId ? 'selected' : ''}>${escapeHtml(t.tour_name)} - ${escapeHtml(t.school_year)}</option>`
        ).join('');
      }
    });
    
    const tournamentsContent = $('#tournamentsContent');
    if (!data || data.length === 0) {
      tournamentsContent.innerHTML = '<div class="empty-state">No tournaments available</div>';
    } else {
      tournamentsContent.innerHTML = data.map(t => renderTournamentCard(t)).join('');
    }
    
    console.log('✅ Tournaments loaded:', data.length);
  } catch (err) {
    console.error('❌ loadTournaments error:', err);
    $('#tournamentsContent').innerHTML = '<div class="empty-state">Error loading tournaments</div>';
  }
}

function renderTournamentCard(tournament) {
  const date = new Date(tournament.tour_date);
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  return `
    <div class="data-card">
      <div class="data-card-header">
        <div class="data-card-title">${escapeHtml(tournament.tour_name)}</div>
        <span class="match-status active">Active</span>
      </div>
      <div class="data-card-body">
        <div class="data-card-meta">📅 ${formattedDate}</div>
        <div class="data-card-meta">🎓 ${escapeHtml(tournament.school_year)}</div>
        ${tournament.match_count ? `<div class="data-card-meta">🏆 ${tournament.match_count} matches</div>` : ''}
        ${tournament.sports_count ? `<div class="data-card-meta">⚽ ${tournament.sports_count} sports</div>` : ''}
        <button class="view-tournament-teams-btn" data-tour-id="${tournament.tour_id}" data-tour-name="${escapeHtml(tournament.tour_name)}" 
                style="margin-top:12px;width:100%;padding:10px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">
          View Participating Teams
        </button>
      </div>
    </div>
  `;
}

// ==========================================
// LOAD SPORTS (FILTERED BY ACTIVE TOURNAMENT)
// ==========================================

async function loadSports() {
  try {
    const allSports = await fetchJSON('sports');
    
    let data = allSports;
    
    if (activeTournamentId) {
      const matches = await fetchJSON('matches', { tour_id: activeTournamentId });
      const activeSportIds = new Set(matches.map(m => m.sports_id));
      data = allSports.filter(s => activeSportIds.has(s.sports_id));
      console.log(`🎯 Filtered sports for tournament ${activeTournamentId}:`, data.length, 'of', allSports.length);
    }
    
    $('#statSports').textContent = data.length;
    
    const sportFilters = [
      '#matchSportFilter',
      '#standingSportFilter',
      '#teamSportFilter'
    ];
    
    sportFilters.forEach(selector => {
      const select = $(selector);
      if (select) {
        select.innerHTML = '<option value="">All Sports</option>';
        if (data.length > 0) {
          const options = data.map(s => 
            `<option value="${s.sports_id}">${escapeHtml(s.sports_name)}</option>`
          ).join('');
          select.innerHTML += options;
        }
      }
    });
    
    const sportsContent = $('#sportsContent');
    if (!data || data.length === 0) {
      sportsContent.innerHTML = '<div class="empty-state">No sports in active tournament</div>';
    } else {
      sportsContent.innerHTML = data.map(s => renderSportCard(s)).join('');
    }
    
    console.log('✅ Sports loaded:', data.length);
  } catch (err) {
    console.error('❌ loadSports error:', err);
    $('#sportsContent').innerHTML = '<div class="empty-state">Error loading sports</div>';
  }
}

function renderSportCard(sport) {
  const typeBadge = sport.team_individual === 'team' ? 'Team Sport' : 'Individual';
  
  return `
    <div class="data-card">
      <div class="data-card-header">
        <div class="data-card-title">${escapeHtml(sport.sports_name)}</div>
        <span class="match-status upcoming">${typeBadge}</span>
      </div>
      <div class="data-card-body">
        <div class="data-card-meta">${sport.men_women ? escapeHtml(sport.men_women) : 'All Genders'}</div>
        ${sport.team_count ? `<div class="data-card-meta">👥 ${sport.team_count} teams</div>` : ''}
      </div>
    </div>
  `;
}

// ==========================================
// TOURNAMENT FILTER CHANGE HANDLERS
// ==========================================

$('#overviewTournamentFilter')?.addEventListener('change', (e) => {
  activeTournamentId = e.target.value || null;
  console.log('🎯 Changed active tournament to:', activeTournamentId);
  
  $$('[id$="TournamentFilter"]').forEach(select => {
    select.value = activeTournamentId || '';
  });
  
  loadOverviewMatches();
  loadOverviewStandings();
  loadSports();
  loadTeams();
  loadStats();
});

$('#matchTournamentFilter')?.addEventListener('change', (e) => {
  activeTournamentId = e.target.value || null;
  console.log('🎯 Changed active tournament to:', activeTournamentId);
  
  $$('[id$="TournamentFilter"]').forEach(select => {
    select.value = activeTournamentId || '';
  });
  
  loadMatchesGrouped();
  loadSports();
  loadTeams();
});

$('#standingTournamentFilter')?.addEventListener('change', (e) => {
  activeTournamentId = e.target.value || null;
  console.log('🎯 Changed active tournament to:', activeTournamentId);
  
  $$('[id$="TournamentFilter"]').forEach(select => {
    select.value = activeTournamentId || '';
  });
  
  loadStandings();
  loadSports();
  loadTeams();
});

$('#matchSportFilter')?.addEventListener('change', loadMatchesGrouped);
$('#standingSportFilter')?.addEventListener('change', loadStandings);
$('#teamSportFilter')?.addEventListener('change', loadTeams);

// Continue in Part 2...
// ==========================================
// LOAD OVERVIEW MATCHES
// ==========================================

async function loadOverviewMatches() {
  try {
    const params = {};
    if (activeTournamentId) {
      params.tour_id = activeTournamentId;
    }
    
    const data = await fetchJSON('matches', params);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = data.filter(m => {
      const matchDate = new Date(m.sked_date);
      matchDate.setHours(0, 0, 0, 0);
      return matchDate >= today;
    });
    $('#statMatches').textContent = upcoming.length;
    
    const overviewMatches = $('#overviewMatches');
    if (upcoming.length === 0) {
      overviewMatches.innerHTML = `
        <div class="matches-empty">
          <p>No upcoming matches in active tournament</p>
        </div>
      `;
    } else {
      overviewMatches.innerHTML = `
        <div class="matches-grid">
          ${upcoming.slice(0, 6).map(m => renderMatchCard(m)).join('')}
        </div>
      `;
    }
    
    console.log('✅ Overview matches loaded:', data.length);
  } catch (err) {
    console.error('❌ loadOverviewMatches error:', err);
    $('#overviewMatches').innerHTML = `
      <div class="matches-empty">
        <p>Error loading matches</p>
      </div>
    `;
  }
}

// ==========================================
// LOAD OVERVIEW STANDINGS
// ==========================================

async function loadOverviewStandings() {
  try {
    const overviewStandings = $('#overviewStandings');
    
    if (!overviewStandings) return;
    
    if (!activeTournamentId) {
      overviewStandings.innerHTML = '<div class="empty-state">No active tournament selected</div>';
      return;
    }
    
    const matches = await fetchJSON('matches', { tour_id: activeTournamentId });
    const activeSportIds = [...new Set(matches.map(m => m.sports_id))];
    
    if (activeSportIds.length === 0) {
      overviewStandings.innerHTML = '<div class="empty-state">No sports in active tournament</div>';
      return;
    }
    
    const allSports = await fetchJSON('sports');
    const tournamentSports = allSports.filter(s => activeSportIds.includes(s.sports_id));
    
    let allStandingsHTML = '';
    let totalSportsWithStandings = 0;
    
    for (const sport of tournamentSports) {
      const params = { 
        tour_id: activeTournamentId, 
        sport_id: sport.sports_id 
      };
      
      const standings = await fetchJSON('standings', params);
      
      if (standings && standings.length > 0) {
        const topTeams = standings.slice(0, 3);
        totalSportsWithStandings++;
        
        allStandingsHTML += `
          <div style="margin-bottom: 24px;">
            <div style="margin-bottom: 12px; padding: 12px; background: linear-gradient(135deg, #f9fafb, #f3f4f6); border-radius: 10px; border-left: 4px solid #8b5cf6;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="font-size: 14px; color: #111827; font-weight: 700;">
                  🏆 ${escapeHtml(sport.sports_name)}
                </div>
                <div style="font-size: 12px; color: #6b7280; font-weight: 600;">
                  Top ${topTeams.length} of ${standings.length}
                </div>
              </div>
            </div>
            ${renderStandingsTable(topTeams)}
          </div>
        `;
      }
    }
    
    if (totalSportsWithStandings === 0) {
      overviewStandings.innerHTML = `
        <div class="empty-state">
          <p>No team standings available yet</p>
          <small style="display:block;margin-top:8px;opacity:0.7;">Standings will appear once matches are completed</small>
        </div>
      `;
    } else {
      const summaryHeader = `
        <div style="margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); border-radius: 12px; color: white; text-align: center;">
          <div style="font-size: 16px; font-weight: 700; margin-bottom: 4px;">
            📊 Tournament Standings
          </div>
          <div style="font-size: 13px; opacity: 0.9;">
            Showing top teams across ${totalSportsWithStandings} sport${totalSportsWithStandings > 1 ? 's' : ''}
          </div>
        </div>
      `;
      
      overviewStandings.innerHTML = summaryHeader + allStandingsHTML;
    }
    
    console.log(`✅ Overview standings loaded for ${totalSportsWithStandings} sports`);
  } catch (err) {
    console.error('❌ loadOverviewStandings error:', err);
    $('#overviewStandings').innerHTML = '<div class="empty-state">Error loading standings</div>';
  }
}

// ==========================================
// LOAD MATCHES GROUPED
// ==========================================

async function loadMatchesGrouped() {
  try {
    const tourId = activeTournamentId || '';
    const sportId = $('#matchSportFilter')?.value || '';
    
    const params = {};
    if (tourId) params.tour_id = tourId;
    if (sportId) params.sport_id = sportId;
    
    const data = await fetchJSON('matches', params);
    const content = $('#matchesContent');
    
    if (!data || data.length === 0) {
      content.innerHTML = `
        <div class="matches-empty">
          <p>No matches found in active tournament</p>
        </div>
      `;
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const completed = [];
    const live = [];
    const upcoming = [];
    
    data.forEach(match => {
      const matchDate = new Date(match.sked_date);
      matchDate.setHours(0, 0, 0, 0);
      
      if (match.winner_id || match.winner_team_id || match.winner_athlete_id) {
        completed.push(match);
      } else if (matchDate.toDateString() === today.toDateString()) {
        live.push(match);
      } else if (matchDate >= today) {
        upcoming.push(match);
      } else {
        completed.push(match);
      }
    });
    
    const sortByGameNumber = (a, b) => {
      const gameA = a.game_no ? parseInt(a.game_no) : 999999;
      const gameB = b.game_no ? parseInt(b.game_no) : 999999;
      
      if (gameA !== gameB) return gameA - gameB;
      
      const dateA = new Date(a.sked_date);
      const dateB = new Date(b.sked_date);
      
      if (dateA.getTime() !== dateB.getTime()) return dateA - dateB;
      
      const timeA = a.sked_time || '00:00:00';
      const timeB = b.sked_time || '00:00:00';
      
      return timeA.localeCompare(timeB);
    };
    
    live.sort(sortByGameNumber);
    upcoming.sort(sortByGameNumber);
    completed.sort(sortByGameNumber);
    
    let html = '';
    
    if (live.length > 0) {
      html += `
        <div class="group-header">
          <div class="group-title">🔴 Live Now</div>
          <div class="group-badge">${live.length}</div>
        </div>
        <div class="matches-grid">
          ${live.map(m => renderMatchCard(m, true)).join('')}
        </div>
      `;
    }
    
    if (upcoming.length > 0) {
      html += `
        <div class="group-header">
          <div class="group-title">📅 Upcoming</div>
          <div class="group-badge">${upcoming.length}</div>
        </div>
        <div class="matches-grid">
          ${upcoming.map(m => renderMatchCard(m, true)).join('')}
        </div>
      `;
    }
    
    if (completed.length > 0) {
      html += `
        <div class="group-header">
          <div class="group-title">✅ Completed</div>
          <div class="group-badge">${completed.length}</div>
        </div>
        <div class="matches-grid">
          ${completed.map(m => renderMatchCard(m, true)).join('')}
        </div>
      `;
    }
    
    content.innerHTML = html;
    console.log('✅ Matches loaded:', data.length);
  } catch (err) {
    console.error('❌ loadMatchesGrouped error:', err);
    $('#matchesContent').innerHTML = '<div class="matches-empty"><p>Error loading matches</p></div>';
  }
}

function renderMatchCard(match, detailed = false) {
  const date = new Date(match.sked_date);
  const formattedDate = date.toLocaleDateString('en-US', { 
    weekday: 'short', month: 'short', day: 'numeric'
  });
  
  const time = match.sked_time ? formatTime(match.sked_time) : '';
  
  const matchTypeLabels = {
    'EL': { text: 'Elimination', class: 'elimination' },
    'QF': { text: 'Quarter Finals', class: 'quarterfinals' },
    'SF': { text: 'Semi Finals', class: 'semifinals' },
    'F': { text: 'Finals', class: 'finals' }
  };
  
  const matchType = matchTypeLabels[match.match_type] || { text: match.match_type, class: '' };
  
  let statusClass = 'upcoming';
  let statusText = 'Upcoming';
  
  const today = new Date();
  const matchDate = new Date(match.sked_date);
  
  if (match.winner_id || match.winner_team_id || match.winner_athlete_id) {
    statusClass = 'completed';
    statusText = 'Completed';
  } else if (matchDate.toDateString() === today.toDateString()) {
    statusClass = 'live';
    statusText = 'Today';
  }
  
  let teamAIsWinner = false;
  let teamBIsWinner = false;
  
  if (match.sports_type === 'team' && match.winner_team_id) {
    teamAIsWinner = match.winner_team_id == match.team_a_id;
    teamBIsWinner = match.winner_team_id == match.team_b_id;
  } else if (match.winner_athlete_id && match.scores && match.scores.length > 0) {
    const winnerScore = match.scores.find(s => s.athlete_id == match.winner_athlete_id);
    if (winnerScore) {
      teamAIsWinner = winnerScore.team_id == match.team_a_id;
      teamBIsWinner = winnerScore.team_id == match.team_b_id;
    }
  }

  let teamAScoreDisplay = '';
  let teamBScoreDisplay = '';
  
  if (match.sports_type === 'team' && match.scores && match.scores.length > 0) {
    const teamAScores = match.scores.filter(s => s.team_id == match.team_a_id);
    const teamBScores = match.scores.filter(s => s.team_id == match.team_b_id);
    
    if (teamAScores.length > 0) {
      teamAScoreDisplay = formatScore(teamAScores[0].score, match.sports_name, true);
    }
    
    if (teamBScores.length > 0) {
      teamBScoreDisplay = formatScore(teamBScores[0].score, match.sports_name, true);
    }
  }
  
  let html = `
    <div class="match-card">
      <div class="match-header">
        <div class="match-info-top">
          <div class="match-sport">
            ${escapeHtml(match.sports_name)}
            ${match.match_type ? `<span class="match-type-badge ${matchType.class}">${matchType.text}</span>` : ''}
          </div>
          ${match.tour_name ? `<div class="match-tournament">${escapeHtml(match.tour_name)} • ${escapeHtml(match.school_year || '')}</div>` : ''}
        </div>
        <span class="match-status ${statusClass}">${statusText}</span>
      </div>
      
    <div class="match-teams">
      <div class="match-team ${teamAIsWinner ? 'winner' : ''}">
        <div class="match-team-name">${escapeHtml(match.team_a_name || 'TBA')}</div>
        ${teamAScoreDisplay ? `<div class="match-team-score-detailed">${teamAScoreDisplay}</div>` : ''}
      </div>
      
      <div class="match-vs">VS</div>
      
      <div class="match-team ${teamBIsWinner ? 'winner' : ''}">
        <div class="match-team-name">${escapeHtml(match.team_b_name || 'TBA')}</div>
        ${teamBScoreDisplay ? `<div class="match-team-score-detailed">${teamBScoreDisplay}</div>` : ''}
      </div>
    </div>
  `;
  
  if (match.winner_name || match.winner_athlete_name) {
    const winnerName = match.winner_name || match.winner_athlete_name;
    html += `<div class="match-winner-banner">Winner: ${escapeHtml(winnerName)}</div>`;
  }
  
  html += `
    <div class="match-details">
      <div class="match-detail-item">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
        </svg>
        <span>${formattedDate}</span>
      </div>
      ${time ? `<div class="match-detail-item">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
          <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
        </svg>
        <span>${time}</span>
      </div>` : ''}
      ${match.venue_name ? `<div class="match-detail-item">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A31.493 31.493 0 0 1 8 14.58a31.481 31.481 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94zM8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10z"/>
          <path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
        </svg>
        <span>${escapeHtml(match.venue_name)}</span>
      </div>` : ''}
      ${match.game_no ? `<div class="match-detail-item">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3z"/>
        </svg>
        <span>Game #${match.game_no}</span>
      </div>` : ''}
    </div>
  `;
  
  if (detailed && match.scores && match.scores.length > 0 && match.sports_type === 'individual') {
    html += `
      <div class="match-scores-section">
        <div class="match-scores-title">Top Performers</div>
        <div class="score-list">
    `;
    
    match.scores.slice(0, 5).forEach((score, index) => {
      let rankClass = '';
      let medal = '';
      
      if (score.rank_no == 1 || score.medal_type === 'Gold') {
        rankClass = 'gold';
        medal = '🥇';
      } else if (score.rank_no == 2 || score.medal_type === 'Silver') {
        rankClass = 'silver';
        medal = '🥈';
      } else if (score.rank_no == 3 || score.medal_type === 'Bronze') {
        rankClass = 'bronze';
        medal = '🥉';
      }
      
      const formattedScore = formatScore(score.score, match.sports_name, true);
      
      html += `
        <div class="score-item">
          <div class="score-player">
            <div class="score-rank ${rankClass}">${score.rank_no || index + 1}</div>
            <div class="score-name">${escapeHtml(score.athlete_name || score.team_name || 'Unknown')}</div>
          </div>
          <div class="score-value">${formattedScore}</div>
          ${medal ? `<div class="score-medal">${medal}</div>` : ''}
        </div>
      `;
    });
    
    html += `</div></div>`;
  }
  
  html += `</div>`;
  
  return html;
}

function formatTime(timeString) {
  if (!timeString) return '';
  
  const parts = timeString.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0]);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }
  
  return timeString;
}

// Continue in final part...
// ==========================================
// LOAD STANDINGS
// ==========================================

async function loadStandings() {
  try {
    const tourId = activeTournamentId || '';
    const sportId = $('#standingSportFilter')?.value || '';
    const content = $('#standingsContent');
    
    if (!tourId || !sportId) {
      content.innerHTML = '<div class="empty-state">Please select sport to view standings</div>';
      return;
    }
    
    const params = { tour_id: tourId, sport_id: sportId };
    const data = await fetchJSON('standings', params);
    
    if (!data || data.length === 0) {
      content.innerHTML = '<div class="empty-state">No standings available for this sport</div>';
      return;
    }
    
    content.innerHTML = renderStandingsTable(data);
    console.log('✅ Standings loaded:', data.length);
  } catch (err) {
    console.error('❌ loadStandings error:', err);
    $('#standingsContent').innerHTML = '<div class="empty-state">Error loading standings</div>';
  }
}

function renderStandingsTable(standings) {
  if (!standings || standings.length === 0) {
    return '<div class="empty-state"><p>No standings data available</p></div>';
  }
  
  return `
    <div class="standings-table-wrapper">
      <div class="standings-table">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team</th>
              <th>P</th>
              <th>W</th>
              <th>L</th>
              <th>D</th>
              <th>Points</th>
              <th>🥇</th>
              <th>🥈</th>
              <th>🥉</th>
            </tr>
          </thead>
          <tbody>
            ${standings.map((team, index) => {
              const rank = index + 1;
              return `
                <tr>
                  <td><strong>${rank}</strong></td>
                  <td>${escapeHtml(team.team_name || 'Unknown Team')}</td>
                  <td>${parseInt(team.no_games_played) || 0}</td>
                  <td>${parseInt(team.no_win) || 0}</td>
                  <td>${parseInt(team.no_loss) || 0}</td>
                  <td>${parseInt(team.no_draw) || 0}</td>
                  <td>${parseInt(team.points) || 0}</td>
                  <td>${parseInt(team.no_gold) || 0}</td>
                  <td>${parseInt(team.no_silver) || 0}</td>
                  <td>${parseInt(team.no_bronze) || 0}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ==========================================
// LOAD TEAMS (FILTERED BY ACTIVE TOURNAMENT)
// ==========================================

async function loadTeams() {
  try {
    const sportId = $('#teamSportFilter')?.value || '';
    
    const allTeams = await fetchJSON('teams', sportId ? { sport_id: sportId } : {});
    
    let data = allTeams;
    
    if (activeTournamentId) {
      const tournamentTeams = await fetchJSON('tournament_teams', { tour_id: activeTournamentId });
      const teamIds = new Set(tournamentTeams.map(t => t.team_id));
      data = allTeams.filter(t => teamIds.has(t.team_id));
      console.log(`🎯 Filtered teams for tournament ${activeTournamentId}:`, data.length, 'of', allTeams.length);
    }
    
    $('#statTeams').textContent = data.length;
    
    const content = $('#teamsContent');
    if (!data || data.length === 0) {
      content.innerHTML = '<div class="empty-state">No teams in active tournament</div>';
      return;
    }
    
    content.innerHTML = data.map(t => renderTeamCard(t, sportId)).join('');
    
    console.log('✅ Teams loaded:', data.length);
  } catch (err) {
    console.error('❌ loadTeams error:', err);
    $('#teamsContent').innerHTML = '<div class="empty-state">Error loading teams</div>';
  }
}

function renderTeamCard(team, sportId = '') {
  return `
    <div class="data-card">
      <div class="data-card-header">
        <div class="data-card-title">${escapeHtml(team.team_name)}</div>
        ${team.sports_name ? `<span class="match-status active">${escapeHtml(team.sports_name)}</span>` : ''}
      </div>
      <div class="data-card-body">
        ${team.school_name ? `<div class="data-card-meta">🏫 ${escapeHtml(team.school_name)}</div>` : ''}
        ${team.coach_name ? `<div class="data-card-meta">👨‍🏫 Coach: ${escapeHtml(team.coach_name)}</div>` : ''}
        ${team.player_count ? `<div class="data-card-meta">👥 ${team.player_count} players</div>` : ''}
        <div class="data-card-stats">
          <span>W: ${team.total_wins || 0}</span>
          <span>L: ${team.total_losses || 0}</span>
          <span>🥇${team.total_gold || 0}</span>
          <span>🥈${team.total_silver || 0}</span>
          <span>🥉${team.total_bronze || 0}</span>
        </div>
        ${team.player_count > 0 ? `
          <button class="view-athletes-btn" data-team-id="${team.team_id}" data-team-name="${escapeHtml(team.team_name)}" data-sport-id="${sportId}"
                  style="margin-top:12px;width:100%;padding:10px;background:#8b5cf6;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">
            View Athletes
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

// ==========================================
// LOAD STATS (FILTERED BY ACTIVE TOURNAMENT)
// ==========================================

async function loadStats() {
  try {
    if (!activeTournamentId) {
      const data = await fetchJSON('stats');
      
      if (data.tournaments !== undefined) $('#statTournaments').textContent = data.tournaments;
      if (data.sports !== undefined) $('#statSports').textContent = data.sports;
      if (data.matches !== undefined) $('#statMatches').textContent = data.matches;
      if (data.teams !== undefined) $('#statTeams').textContent = data.teams;
      
      return;
    }
    
    const matches = await fetchJSON('matches', { tour_id: activeTournamentId });
    const tournamentTeams = await fetchJSON('tournament_teams', { tour_id: activeTournamentId });
    
    const sportIds = new Set(matches.map(m => m.sports_id));
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = matches.filter(m => {
      const matchDate = new Date(m.sked_date);
      matchDate.setHours(0, 0, 0, 0);
      return matchDate >= today;
    });
    
    $('#statTournaments').textContent = '1';
    $('#statSports').textContent = sportIds.size;
    $('#statMatches').textContent = upcoming.length;
    $('#statTeams').textContent = tournamentTeams.length;
    
    console.log('✅ Stats loaded for tournament', activeTournamentId);
  } catch (err) {
    console.error('❌ loadStats error:', err);
  }
}

// ==========================================
// VIEW TOURNAMENT TEAMS
// ==========================================

async function viewTournamentTeams(tourId, tourName) {
  try {
    const data = await fetchJSON('tournament_teams', { tour_id: tourId });
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'tournamentTeamsModal';
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">🏆 ${escapeHtml(tourName)} - Participating Teams</h2>
          <button class="modal-close" id="closeTournamentTeamsModal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          ${data.length === 0 ? 
            '<div class="empty-state">No teams registered for this tournament</div>' :
            `<div class="tournament-teams-grid">${data.map(team => renderTournamentTeamCard(team)).join('')}</div>`
          }
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    $('#closeTournamentTeamsModal').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
    
  } catch (err) {
    console.error('❌ viewTournamentTeams error:', err);
    alert('Error loading tournament teams');
  }
}

function renderTournamentTeamCard(team) {
  const regDate = team.registration_date ? new Date(team.registration_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
  
  return `
    <div class="tournament-team-card">
      <div class="tournament-team-header">
        <div class="tournament-team-info">
          <h4>${escapeHtml(team.team_name)}</h4>
          ${team.school_name ? `<div class="tournament-team-school">🏫 ${escapeHtml(team.school_name)}</div>` : ''}
        </div>
      </div>
      <div class="tournament-team-stats">
        <div class="tournament-team-stat">
          <div class="tournament-team-stat-value">${team.player_count || 0}</div>
          <div class="tournament-team-stat-label">Players</div>
        </div>
        <div class="tournament-team-stat">
          <div class="tournament-team-stat-value">${team.sports_count || 0}</div>
          <div class="tournament-team-stat-label">Sports</div>
        </div>
      </div>
      ${team.sports_list ? `
        <div class="tournament-team-sports">
          <div class="tournament-team-sports-label">Sports</div>
          <div class="tournament-team-sports-list">${escapeHtml(team.sports_list)}</div>
        </div>
      ` : ''}
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
        <div style="display:flex;align-items:center;gap:6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>Registered: ${regDate}</span>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// VIEW TEAM ATHLETES
// ==========================================

async function viewTeamAthletes(teamId, teamName, sportId = '') {
  try {
    const params = { team_id: teamId };
    if (sportId) params.sport_id = sportId;
    if (activeTournamentId) params.tour_id = activeTournamentId;
    
    const data = await fetchJSON('players', params);
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'athletesModal';
    
    let subtitle = '';
    if (sportId && data.length > 0 && data[0].sports_name) {
      subtitle = `<p style="color:#6b7280;font-size:14px;margin:4px 0 0 0;">Filtered by: ${escapeHtml(data[0].sports_name)}</p>`;
    }
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <h2 class="modal-title">👥 ${escapeHtml(teamName)} - Athletes</h2>
            ${subtitle}
          </div>
          <button class="modal-close" id="closeAthletesModal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          ${data.length === 0 ? 
            `<div class="empty-state">No athletes found for this team in the active tournament</div>` :
            `<div class="athletes-grid">${data.map(athlete => renderAthleteCard(athlete)).join('')}</div>`
          }
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    $('#closeAthletesModal').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
    
  } catch (err) {
    console.error('❌ viewTeamAthletes error:', err);
    alert('Error loading athletes');
  }
}

function renderAthleteCard(athlete) {
  const initials = (athlete.f_name.charAt(0) + athlete.l_name.charAt(0)).toUpperCase();
  const isCaptain = athlete.is_captain == 1;
  
  return `
    <div class="athlete-card">
      <div class="athlete-header">
        <div class="athlete-avatar ${isCaptain ? 'captain' : ''}">${initials}</div>
        <div class="athlete-info">
          <h4>${escapeHtml(athlete.player_name)}</h4>
          ${isCaptain ? '<div class="athlete-role" style="color:#f59e0b;font-weight:600;">⭐ Team Captain</div>' : ''}
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// EVENT LISTENERS
// ==========================================

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('view-tournament-teams-btn')) {
    const tourId = e.target.dataset.tourId;
    const tourName = e.target.dataset.tourName;
    viewTournamentTeams(tourId, tourName);
  }
});

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('view-athletes-btn')) {
    const teamId = e.target.dataset.teamId;
    const teamName = e.target.dataset.teamName;
    const sportId = e.target.dataset.sportId || '';
    viewTeamAthletes(teamId, teamName, sportId);
  }
});

// ==========================================
// INITIALIZE
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Spectator Dashboard Initializing...');
  
  await loadTournaments();
  
  loadStats();
  loadSports();
  loadOverviewMatches();
  loadOverviewStandings();
  loadTeams();
  
  console.log('✅ Dashboard Initialized with active tournament:', activeTournamentId);
});