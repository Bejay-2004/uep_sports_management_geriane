const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const { person_id } = window.UMPIRE_CONTEXT;

// Mobile Menu Toggle
const menuToggle = $('#menuToggle');
const sidebar = $('.sidebar');
const sidebarOverlay = $('#sidebarOverlay');

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
  });
}

if (sidebarOverlay) {
  sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
  });
}

// Tab Navigation
const pageTitles = {
  'overview': 'Dashboard Overview',
  'schedule': 'Match Schedule',
  'results': 'Match Results',
  'rankings': 'Rankings & Standings',
  'medals': 'Medal Tally',
  'tournaments': 'My Tournaments & Matches'
};

// Handle parent menu toggle
const tournamentsParent = document.querySelector('.nav-parent[data-view="tournaments"]');
const submenu = document.querySelector('.nav-submenu');

if (tournamentsParent && submenu) {
  tournamentsParent.addEventListener('click', (e) => {
    // If clicking the parent itself (not for navigation, but for expanding)
    const isCurrentlyExpanded = tournamentsParent.classList.contains('expanded');
    
    // Toggle expansion
    tournamentsParent.classList.toggle('expanded');
    submenu.classList.toggle('expanded');
    
    // If it wasn't expanded before, also activate the tournaments view
    if (!isCurrentlyExpanded) {
      $$('.nav-link').forEach(b => b.classList.remove('active'));
      tournamentsParent.classList.add('active');
      
      const pageTitle = $('#pageTitle');
      if (pageTitle) {
        pageTitle.textContent = pageTitles['tournaments'] || 'Dashboard';
      }
      
      $$('.content-view').forEach(p => p.classList.remove('active'));
      $('#tournaments-view').classList.add('active');
      
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
      }
      
      loadViewData('tournaments');
    }
  });
}

// Handle all nav links
$$('.nav-link').forEach(btn => {
  btn.addEventListener('click', () => {
    // Don't handle parent click here - it's handled above
    if (btn.classList.contains('nav-parent')) {
      return;
    }
    
    $$('.nav-link').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // If clicking a child item, also mark parent as active
    if (btn.classList.contains('nav-child')) {
      const parent = document.querySelector('.nav-parent[data-view="tournaments"]');
      if (parent) {
        parent.classList.add('active');
      }
    }
    
    const view = btn.dataset.view;
    
    const pageTitle = $('#pageTitle');
    if (pageTitle) {
      pageTitle.textContent = pageTitles[view] || 'Dashboard';
    }
    
    $$('.content-view').forEach(p => p.classList.remove('active'));
    $(`#${view}-view`).classList.add('active');
    
    if (window.innerWidth <= 768) {
      sidebar.classList.remove('active');
      sidebarOverlay.classList.remove('active');
    }
    
    loadViewData(view);
  });
});

// API Helper
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
    
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const result = await res.json();
    return result;
  } catch (err) {
    console.error('API Error:', err);
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
    case 'schedule': loadSchedule(); break;
    case 'results': loadResults(); break;
    case 'rankings': loadRankingsFilters(); break;
    case 'medals': loadMedalsFilters(); break;
    case 'tournaments': loadTournaments(); break;
  }
}

// ==========================================
// OVERVIEW
// ==========================================

async function loadOverview() {
  try {
    const stats = await fetchAPI('umpire_stats');
    
    if (stats) {
      $('#statMatches').textContent = stats.total_matches || 0;
      $('#statUpcoming').textContent = stats.upcoming_matches || 0;
      $('#statCompleted').textContent = stats.completed_matches || 0;
      $('#statTournaments').textContent = stats.active_tournaments || 0;
    }
    
    const upcoming = await fetchAPI('upcoming_matches');
    const upcomingEl = $('#upcomingMatches');
    
    if (!upcoming || upcoming.length === 0) {
      upcomingEl.innerHTML = `
        <div class="data-card">
          <p style="color:var(--muted);text-align:center;padding:20px;">No upcoming matches scheduled</p>
        </div>
      `;
    } else {
      upcomingEl.innerHTML = upcoming.slice(0, 3).map(m => `
        <div class="data-card">
          <div class="data-card-header">
            <div class="data-card-title">${escapeHtml(m.sports_name)} - ${escapeHtml(m.match_type)}</div>
            <span class="badge upcoming">Upcoming</span>
          </div>
          <div class="data-card-meta">
            📅 ${escapeHtml(m.sked_date)}<br>
            ⏰ ${escapeHtml(m.sked_time)}<br>
            🏟️ ${escapeHtml(m.venue_name || 'TBA')}<br>
            🆚 ${escapeHtml(m.team_a_name)} vs ${escapeHtml(m.team_b_name)}
          </div>
        </div>
      `).join('');
    }
    
    const recent = await fetchAPI('recent_results');
    const recentEl = $('#recentResults');
    
    if (!recent || recent.length === 0) {
      recentEl.innerHTML = `
        <div class="data-card">
          <p style="color:var(--muted);text-align:center;padding:20px;">No recent results</p>
        </div>
      `;
    } else {
      recentEl.innerHTML = `
        <div class="data-card">
          ${recent.slice(0, 5).map(r => `
            <div style="padding:12px 0;border-bottom:1px solid var(--line);">
              <div style="font-weight:600;margin-bottom:4px;">
                ${escapeHtml(r.team_a_name)} vs ${escapeHtml(r.team_b_name)}
              </div>
              <div style="font-size:12px;color:var(--muted);">
                Winner: <strong>${escapeHtml(r.winner_name)}</strong> | ${escapeHtml(r.sked_date)}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  } catch (err) {
    console.error('loadOverview error:', err);
  }
}

// ==========================================
// SCHEDULE
// ==========================================

async function loadSchedule() {
  try {
    // Load filter options
    const tournaments = await fetchAPI('tournaments');
    const sports = await fetchAPI('sports');
    
    const tourSelect = $('#scheduleTournamentFilter');
    const sportSelect = $('#scheduleSportFilter');
    
    if (tournaments) {
      tourSelect.innerHTML = '<option value="">All Tournaments</option>' +
        tournaments.map(t => `<option value="${t.tour_id}">${escapeHtml(t.tour_name)}</option>`).join('');
    }
    
    if (sports) {
      sportSelect.innerHTML = '<option value="">All Sports</option>' +
        sports.map(s => `<option value="${s.sports_id}">${escapeHtml(s.sports_name)}</option>`).join('');
    }
    
    // Load matches
    loadScheduleMatches();
  } catch (err) {
    console.error('loadSchedule error:', err);
  }
}

$('#scheduleTournamentFilter')?.addEventListener('change', loadScheduleMatches);
$('#scheduleSportFilter')?.addEventListener('change', loadScheduleMatches);

// Replace the loadScheduleMatches function in umpire.js with this updated version

// Replace the loadScheduleMatches function in umpire.js with this updated version

async function loadScheduleMatches() {
  const tourId = $('#scheduleTournamentFilter')?.value || '';
  const sportId = $('#scheduleSportFilter')?.value || '';
  
  try {
    const matches = await fetchAPI('all_matches', { tour_id: tourId, sports_id: sportId });
    const content = $('#scheduleContent');
    
    if (!matches || matches.length === 0) {
      content.innerHTML = `
        <div class="data-card">
          <p style="color:var(--muted);text-align:center;padding:20px;">No matches found</p>
        </div>
      `;
      return;
    }
    
    // Group matches by status
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const ongoing = [];
    const upcoming = [];
    const completed = [];
    
    matches.forEach(match => {
      const matchDate = new Date(match.sked_date);
      matchDate.setHours(0, 0, 0, 0);
      
      if (match.match_status === 'completed') {
        completed.push(match);
      } else if (match.match_status === 'today') {
        ongoing.push(match);
      } else if (matchDate >= today) {
        upcoming.push(match);
      } else {
        completed.push(match);
      }
    });
    
    // Sort function: by game_no, then date, then time
    const sortByGameNumber = (a, b) => {
      const gameA = a.game_no ? parseInt(a.game_no) : 999999;
      const gameB = b.game_no ? parseInt(b.game_no) : 999999;
      
      if (gameA !== gameB) {
        return gameA - gameB;
      }
      
      const dateA = new Date(a.sked_date);
      const dateB = new Date(b.sked_date);
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }
      
      const timeA = a.sked_time || '00:00:00';
      const timeB = b.sked_time || '00:00:00';
      
      return timeA.localeCompare(timeB);
    };
    
    // Apply sorting
    ongoing.sort(sortByGameNumber);
    upcoming.sort(sortByGameNumber);
    completed.sort(sortByGameNumber);
    
    // Render grouped matches
    let html = '';
    
    // Ongoing matches (today)
    if (ongoing.length > 0) {
      html += `
        <div class="group-header" style="background:linear-gradient(135deg,#fef3c7,#fde68a);padding:16px 20px;border-radius:12px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="font-size:24px;">🔴</div>
            <div>
              <div style="font-size:16px;font-weight:700;color:#92400e;">Live / Today</div>
              <div style="font-size:12px;color:#78350f;">Matches happening now or today</div>
            </div>
          </div>
          <div style="background:white;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;color:#92400e;">
            ${ongoing.length}
          </div>
        </div>
        <div class="matches-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:16px;margin-bottom:32px;">
          ${ongoing.map(m => renderScheduleCard(m, 'ongoing')).join('')}
        </div>
      `;
    }
    
    // Upcoming matches
    if (upcoming.length > 0) {
      html += `
        <div class="group-header" style="background:linear-gradient(135deg,#dbeafe,#bfdbfe);padding:16px 20px;border-radius:12px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="font-size:24px;">📅</div>
            <div>
              <div style="font-size:16px;font-weight:700;color:#1e40af;">Upcoming</div>
              <div style="font-size:12px;color:#1e3a8a;">Future scheduled matches</div>
            </div>
          </div>
          <div style="background:white;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;color:#1e40af;">
            ${upcoming.length}
          </div>
        </div>
        <div class="matches-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:16px;margin-bottom:32px;">
          ${upcoming.map(m => renderScheduleCard(m, 'upcoming')).join('')}
        </div>
      `;
    }
    
    // Completed matches
    if (completed.length > 0) {
      html += `
        <div class="group-header" style="background:linear-gradient(135deg,#d1fae5,#a7f3d0);padding:16px 20px;border-radius:12px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="font-size:24px;">✅</div>
            <div>
              <div style="font-size:16px;font-weight:700;color:#065f46;">Completed</div>
              <div style="font-size:12px;color:#047857;">Finished matches</div>
            </div>
          </div>
          <div style="background:white;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;color:#065f46;">
            ${completed.length}
          </div>
        </div>
        <div class="matches-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:16px;margin-bottom:32px;">
          ${completed.map(m => renderScheduleCard(m, 'completed')).join('')}
        </div>
      `;
    }
    
    content.innerHTML = html;
    
    console.log(`✅ Schedule loaded: ${ongoing.length} ongoing, ${upcoming.length} upcoming, ${completed.length} completed`);
  } catch (err) {
    console.error('loadScheduleMatches error:', err);
    content.innerHTML = `
      <div class="data-card">
        <p style="color:var(--danger);text-align:center;padding:20px;">Error loading schedule</p>
      </div>
    `;
  }
}

// New helper function to render schedule cards with game numbers
function renderScheduleCard(match, status) {
  // Handle game number - check for null, undefined, empty string, or 0
  const gameNo = match.game_no && match.game_no !== '0' && match.game_no !== 0 
    ? match.game_no 
    : 'TBD';
  
  console.log(`Match ${match.match_id}: game_no = ${match.game_no} (type: ${typeof match.game_no}), final: ${gameNo}`);
  
  // Status-specific styling
  const statusStyles = {
    'ongoing': {
      badge: 'background:#fbbf24;color:#78350f;border:2px solid #f59e0b;',
      badgeText: '🔴 Today',
      gameColor: '#f59e0b'
    },
    'upcoming': {
      badge: 'background:#dbeafe;color:#1e40af;border:2px solid #3b82f6;',
      badgeText: '📅 Upcoming',
      gameColor: '#3b82f6'
    },
    'completed': {
      badge: 'background:#d1fae5;color:#065f46;border:2px solid #10b981;',
      badgeText: '✅ Completed',
      gameColor: '#10b981'
    }
  };
  
  const style = statusStyles[status] || statusStyles.upcoming;
  
  return `
    <div class="data-card" style="position:relative;overflow:visible;">
      <!-- Game Number Badge - Prominent -->
      <div style="position:absolute;top:-12px;left:20px;background:${style.gameColor};color:white;padding:8px 16px;border-radius:20px;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.2);z-index:10;">
        Game #${gameNo}
      </div>
      
      <div class="data-card-header" style="margin-top:16px;">
        <div class="data-card-title">
          ${escapeHtml(match.sports_name)}
        </div>
        <span style="${style.badge}display:inline-block;padding:6px 12px;border-radius:12px;font-size:11px;font-weight:700;">
          ${style.badgeText}
        </span>
      </div>
      
      <div class="data-card-meta">
        <div style="font-weight:600;margin-bottom:8px;font-size:14px;color:#111827;">
          ${escapeHtml(match.match_type)} Match
        </div>
        
        <div style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:#6b7280;">
          <div style="display:flex;align-items:center;gap:8px;">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
            </svg>
            <strong>${escapeHtml(match.sked_date)}</strong>
          </div>
          
          <div style="display:flex;align-items:center;gap:8px;">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
            </svg>
            <strong>${escapeHtml(match.sked_time)}</strong>
          </div>
          
          <div style="display:flex;align-items:center;gap:8px;">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A31.493 31.493 0 0 1 8 14.58a31.481 31.481 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94zM8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10z"/>
              <path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
            </svg>
            <span>${escapeHtml(match.venue_name || 'TBA')}</span>
          </div>
        </div>
        
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line);">
          <div style="font-size:12px;color:#6b7280;margin-bottom:6px;font-weight:600;">MATCHUP</div>
          <div style="display:flex;align-items:center;justify-content:center;gap:12px;">
            <span style="flex:1;text-align:right;font-weight:600;color:#3b82f6;font-size:13px;">
              ${escapeHtml(match.team_a_name)}
            </span>
            <span style="background:#f3f4f6;padding:4px 12px;border-radius:12px;font-weight:700;font-size:11px;color:#6b7280;">
              VS
            </span>
            <span style="flex:1;text-align:left;font-weight:600;color:#ef4444;font-size:13px;">
              ${escapeHtml(match.team_b_name)}
            </span>
          </div>
        </div>
        
        ${match.winner_name ? `
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line);text-align:center;">
            <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">WINNER</div>
            <div style="font-weight:700;color:#10b981;font-size:14px;">
              🏆 ${escapeHtml(match.winner_name)}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}
// New helper function to render schedule cards with game numbers
function renderScheduleCard(match, status) {
  const gameNo = match.game_no || 'N/A';
  
  // Status-specific styling
  const statusStyles = {
    'ongoing': {
      badge: 'background:#fbbf24;color:#78350f;border:2px solid #f59e0b;',
      badgeText: '🔴 Today',
      gameColor: '#f59e0b'
    },
    'upcoming': {
      badge: 'background:#dbeafe;color:#1e40af;border:2px solid #3b82f6;',
      badgeText: '📅 Upcoming',
      gameColor: '#3b82f6'
    },
    'completed': {
      badge: 'background:#d1fae5;color:#065f46;border:2px solid #10b981;',
      badgeText: '✅ Completed',
      gameColor: '#10b981'
    }
  };
  
  const style = statusStyles[status] || statusStyles.upcoming;
  
  return `
    <div class="data-card" style="position:relative;overflow:visible;">
      <!-- Game Number Badge - Prominent -->
      <div style="position:absolute;top:-12px;left:20px;background:${style.gameColor};color:white;padding:8px 16px;border-radius:20px;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.2);z-index:10;">
        Game #${gameNo}
      </div>
      
      <div class="data-card-header" style="margin-top:16px;">
        <div class="data-card-title">
          ${escapeHtml(match.sports_name)}
        </div>
        <span style="${style.badge}display:inline-block;padding:6px 12px;border-radius:12px;font-size:11px;font-weight:700;">
          ${style.badgeText}
        </span>
      </div>
      
      <div class="data-card-meta">
        <div style="font-weight:600;margin-bottom:8px;font-size:14px;color:#111827;">
          ${escapeHtml(match.match_type)} Match
        </div>
        
        <div style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:#6b7280;">
          <div style="display:flex;align-items:center;gap:8px;">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
            </svg>
            <strong>${escapeHtml(match.sked_date)}</strong>
          </div>
          
          <div style="display:flex;align-items:center;gap:8px;">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
            </svg>
            <strong>${escapeHtml(match.sked_time)}</strong>
          </div>
          
          <div style="display:flex;align-items:center;gap:8px;">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A31.493 31.493 0 0 1 8 14.58a31.481 31.481 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94zM8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10z"/>
              <path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
            </svg>
            <span>${escapeHtml(match.venue_name || 'TBA')}</span>
          </div>
        </div>
        
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line);">
          <div style="font-size:12px;color:#6b7280;margin-bottom:6px;font-weight:600;">MATCHUP</div>
          <div style="display:flex;align-items:center;justify-content:center;gap:12px;">
            <span style="flex:1;text-align:right;font-weight:600;color:#3b82f6;font-size:13px;">
              ${escapeHtml(match.team_a_name)}
            </span>
            <span style="background:#f3f4f6;padding:4px 12px;border-radius:12px;font-weight:700;font-size:11px;color:#6b7280;">
              VS
            </span>
            <span style="flex:1;text-align:left;font-weight:600;color:#ef4444;font-size:13px;">
              ${escapeHtml(match.team_b_name)}
            </span>
          </div>
        </div>
        
        ${match.winner_name ? `
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line);text-align:center;">
            <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">WINNER</div>
            <div style="font-weight:700;color:#10b981;font-size:14px;">
              🏆 ${escapeHtml(match.winner_name)}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// ==========================================
// RESULTS
// ==========================================

async function loadResults() {
  try {
    const tournaments = await fetchAPI('tournaments');
    const sports = await fetchAPI('sports');
    
    const tourSelect = $('#resultsTournamentFilter');
    const sportSelect = $('#resultsSportFilter');
    
    if (tournaments) {
      tourSelect.innerHTML = '<option value="">All Tournaments</option>' +
        tournaments.map(t => `<option value="${t.tour_id}">${escapeHtml(t.tour_name)}</option>`).join('');
    }
    
    if (sports) {
      sportSelect.innerHTML = '<option value="">All Sports</option>' +
        sports.map(s => `<option value="${s.sports_id}">${escapeHtml(s.sports_name)}</option>`).join('');
    }
    
    loadResultsTable();
  } catch (err) {
    console.error('loadResults error:', err);
  }
}

$('#resultsTournamentFilter')?.addEventListener('change', loadResultsTable);
$('#resultsSportFilter')?.addEventListener('change', loadResultsTable);

// Replace the loadResultsTable function in umpire.js with this updated version

async function loadResultsTable() {
  const tourId = $('#resultsTournamentFilter')?.value || '';
  const sportId = $('#resultsSportFilter')?.value || '';
  
  try {
    const results = await fetchAPI('match_results', { tour_id: tourId, sports_id: sportId });
    const tbody = $('#resultsTable tbody');
    
    if (!results || results.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:40px;">
            <p style="color:var(--muted);">No results found</p>
          </td>
        </tr>
      `;
      return;
    }
    
    // Group results by sport
    const groupedBySport = results.reduce((acc, match) => {
      const sportName = match.sports_name;
      if (!acc[sportName]) {
        acc[sportName] = [];
      }
      acc[sportName].push(match);
      return acc;
    }, {});
    
    let html = '';
    
    // Sort sports alphabetically
    Object.keys(groupedBySport).sort().forEach(sportName => {
      const matches = groupedBySport[sportName];
      
      // Sort matches by game number (if available), then date
      matches.sort((a, b) => {
        const gameA = a.game_no ? parseInt(a.game_no) : 999999;
        const gameB = b.game_no ? parseInt(b.game_no) : 999999;
        
        if (gameA !== gameB) {
          return gameA - gameB;
        }
        
        // If game numbers are same, sort by date descending
        const dateA = new Date(a.sked_date);
        const dateB = new Date(b.sked_date);
        return dateB - dateA;
      });
      
      // Add sport header row
      html += `
        <tr style="background:linear-gradient(135deg,#f59e0b,#d97706);">
          <td colspan="6" style="padding:12px 16px;font-weight:700;color:white;font-size:15px;border:none;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:20px;">🏆</span>
              <span>${escapeHtml(sportName)}</span>
              <span style="background:rgba(255,255,255,0.2);padding:4px 10px;border-radius:12px;font-size:12px;margin-left:auto;">
                ${matches.length} match${matches.length !== 1 ? 'es' : ''}
              </span>
            </div>
          </td>
        </tr>
      `;
      
      // Add matches for this sport
      matches.forEach(r => {
        // Get scores for this match
        let teamAScore = '-';
        let teamBScore = '-';
        let teamAScoreRaw = '';
        let teamBScoreRaw = '';
        
        if (r.scores && r.scores.length > 0) {
          if (r.sports_type === 'team') {
            const teamAScoreObj = r.scores.find(s => s.team_id == r.team_a_id);
            const teamBScoreObj = r.scores.find(s => s.team_id == r.team_b_id);
            
            teamAScoreRaw = teamAScoreObj ? teamAScoreObj.score : '';
            teamBScoreRaw = teamBScoreObj ? teamBScoreObj.score : '';
          } else {
            if (r.scores[0]) teamAScoreRaw = r.scores[0].score;
            if (r.scores[1]) teamBScoreRaw = r.scores[1].score;
          }
        }
        
        // Format scores using the helper function
        if (teamAScoreRaw && typeof window.formatScoreCompact === 'function') {
          teamAScore = window.formatScoreCompact(teamAScoreRaw, r.sports_name);
        } else if (teamAScoreRaw) {
          teamAScore = escapeHtml(teamAScoreRaw);
        }
        
        if (teamBScoreRaw && typeof window.formatScoreCompact === 'function') {
          teamBScore = window.formatScoreCompact(teamBScoreRaw, r.sports_name);
        } else if (teamBScoreRaw) {
          teamBScore = escapeHtml(teamBScoreRaw);
        }
        
        const gameNo = r.game_no && r.game_no !== '0' && r.game_no !== 0 ? r.game_no : 'TBD';
        
        html += `
          <tr>
            <td>
              <div style="display:flex;flex-direction:column;gap:2px;">
                <span style="font-weight:600;color:#f59e0b;font-size:12px;">Game #${gameNo}</span>
                <span style="font-size:13px;">${escapeHtml(r.sked_date)}</span>
              </div>
            </td>
            <td style="font-size:13px;">${escapeHtml(r.match_type)}</td>
            <td>
              <div style="display:flex;flex-direction:column;gap:4px;">
                <span style="font-weight:600;font-size:13px;">${escapeHtml(r.team_a_name)}</span>
                ${teamAScore !== '-' ? `<div style="color:#6b7280;font-size:12px;">${teamAScore}</div>` : ''}
              </div>
            </td>
            <td>
              <div style="display:flex;flex-direction:column;gap:4px;">
                <span style="font-weight:600;font-size:13px;">${escapeHtml(r.team_b_name)}</span>
                ${teamBScore !== '-' ? `<div style="color:#6b7280;font-size:12px;">${teamBScore}</div>` : ''}
              </div>
            </td>
            <td>
              <strong style="color:#10b981;font-size:13px;">
                🏆 ${escapeHtml(r.winner_name || 'TBD')}
              </strong>
            </td>
            <td style="font-size:13px;">${escapeHtml(r.venue_name || 'N/A')}</td>
          </tr>
        `;
      });
      
      // Add spacing row between sports
      html += `
        <tr style="background:#f9fafb;">
          <td colspan="6" style="padding:4px;border:none;"></td>
        </tr>
      `;
    });
    
    tbody.innerHTML = html;
  } catch (err) {
    console.error('loadResultsTable error:', err);
  }
}

// ==========================================
// RANKINGS
// ==========================================

async function loadRankingsFilters() {
  try {
    const tournaments = await fetchAPI('tournaments');
    const select = $('#rankingsTournamentFilter');
    
    if (tournaments) {
      select.innerHTML = '<option value="">Select Tournament</option>' +
        tournaments.map(t => `<option value="${t.tour_id}">${escapeHtml(t.tour_name)}</option>`).join('');
    }
  } catch (err) {
    console.error('loadRankingsFilters error:', err);
  }
}

// Replace the Rankings change event handler in umpire.js

$('#rankingsTournamentFilter')?.addEventListener('change', async function() {
  const tourId = this.value;
  const content = $('#rankingsContent');
  
  if (!tourId) {
    content.innerHTML = '<div class="empty-state">Select a tournament to view standings</div>';
    return;
  }
  
  content.innerHTML = '<div class="loading">Loading standings...</div>';
  
  try {
    const standings = await fetchAPI('standings', { tour_id: tourId });
    
    if (!standings || standings.length === 0) {
      content.innerHTML = `
        <div class="data-card">
          <p style="color:var(--muted);text-align:center;padding:20px;">No standings available</p>
        </div>
      `;
      return;
    }
    
    // Group standings by sport
    const groupedBySport = standings.reduce((acc, team) => {
      const sportName = team.sports_name;
      if (!acc[sportName]) {
        acc[sportName] = [];
      }
      acc[sportName].push(team);
      return acc;
    }, {});
    
    // Build HTML with sport groups
    let html = '';
    
    Object.keys(groupedBySport).sort().forEach(sportName => {
      const teams = groupedBySport[sportName];
      
      // Sort teams by wins, then gold medals
      teams.sort((a, b) => {
        if (b.no_win !== a.no_win) return b.no_win - a.no_win;
        return b.no_gold - a.no_gold;
      });
      
      html += `
        <div style="margin-bottom:32px;">
          <div style="background:linear-gradient(135deg,#3b82f6,#2563eb);padding:16px 20px;border-radius:12px;margin-bottom:16px;display:flex;align-items:center;gap:12px;box-shadow:0 4px 12px rgba(59,130,246,0.3);">
            <div style="font-size:24px;">🏆</div>
            <div style="flex:1;">
              <div style="font-size:18px;font-weight:700;color:white;">${escapeHtml(sportName)}</div>
              <div style="font-size:12px;color:#dbeafe;">${teams.length} team${teams.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
          
          <div class="table-container">
            <table class="user-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Team</th>
                  <th>GP</th>
                  <th>W</th>
                  <th>L</th>
                  <th>D</th>
                  <th>🥇</th>
                  <th>🥈</th>
                  <th>🥉</th>
                </tr>
              </thead>
              <tbody>
                ${teams.map((s, idx) => `
                  <tr>
                    <td>
                      <strong style="font-size:16px;color:${idx === 0 ? '#f59e0b' : idx === 1 ? '#6b7280' : idx === 2 ? '#ea580c' : 'inherit'};">
                        ${idx + 1}${idx === 0 ? ' 🥇' : idx === 1 ? ' 🥈' : idx === 2 ? ' 🥉' : ''}
                      </strong>
                    </td>
                    <td><strong>${escapeHtml(s.team_name)}</strong></td>
                    <td>${s.no_games_played || 0}</td>
                    <td style="font-weight:600;color:#10b981;">${s.no_win || 0}</td>
                    <td style="color:#ef4444;">${s.no_loss || 0}</td>
                    <td style="color:#6b7280;">${s.no_draw || 0}</td>
                    <td style="text-align:center;font-weight:700;color:#f59e0b;">${s.no_gold || 0}</td>
                    <td style="text-align:center;font-weight:700;color:#6b7280;">${s.no_silver || 0}</td>
                    <td style="text-align:center;font-weight:700;color:#ea580c;">${s.no_bronze || 0}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    });
    
    content.innerHTML = html;
  } catch (err) {
    console.error('Error loading standings:', err);
    content.innerHTML = '<div class="empty-state">Error loading standings</div>';
  }
});

// ==========================================
// MEDALS
// ==========================================

async function loadMedalsFilters() {
  try {
    const tournaments = await fetchAPI('tournaments');
    const select = $('#medalsTournamentFilter');
    
    if (tournaments) {
      select.innerHTML = '<option value="">Select Tournament</option>' +
        tournaments.map(t => `<option value="${t.tour_id}">${escapeHtml(t.tour_name)}</option>`).join('');
    }
  } catch (err) {
    console.error('loadMedalsFilters error:', err);
  }
}

// Replace the medal tally change event handler in umpire.js with this fixed version

// Replace the medal tally change event handler in umpire.js

// Replace the medal tally change event handler in umpire.js

$('#medalsTournamentFilter')?.addEventListener('change', async function() {
  const tourId = this.value;
  const content = $('#medalsContent');
  
  if (!tourId) {
    content.innerHTML = '<div class="empty-state">Select a tournament to view medal tally</div>';
    return;
  }
  
  content.innerHTML = '<div class="loading">Loading medals...</div>';
  
  try {
    // First get standings to have sport information
    const standings = await fetchAPI('standings', { tour_id: tourId });
    
    if (!standings || standings.length === 0) {
      content.innerHTML = `
        <div class="data-card">
          <p style="color:var(--muted);text-align:center;padding:20px;">No medals awarded yet</p>
        </div>
      `;
      return;
    }
    
    // Group by sport and calculate medal totals
    const groupedBySport = standings.reduce((acc, team) => {
      const sportName = team.sports_name;
      if (!acc[sportName]) {
        acc[sportName] = [];
      }
      
      const gold = parseInt(team.no_gold) || 0;
      const silver = parseInt(team.no_silver) || 0;
      const bronze = parseInt(team.no_bronze) || 0;
      const total = gold + silver + bronze;
      
      // Only include teams with medals
      if (total > 0) {
        acc[sportName].push({
          team_name: team.team_name,
          gold,
          silver,
          bronze,
          total
        });
      }
      
      return acc;
    }, {});
    
    // Calculate grand totals
    let grandTotalGold = 0;
    let grandTotalSilver = 0;
    let grandTotalBronze = 0;
    
    // Build HTML with sport groups
    let html = '';
    
    Object.keys(groupedBySport).sort().forEach(sportName => {
      const teams = groupedBySport[sportName];
      
      // Sort by gold, then silver, then bronze
      teams.sort((a, b) => {
        if (b.gold !== a.gold) return b.gold - a.gold;
        if (b.silver !== a.silver) return b.silver - a.silver;
        return b.bronze - a.bronze;
      });
      
      // Calculate sport totals
      const sportGold = teams.reduce((sum, t) => sum + t.gold, 0);
      const sportSilver = teams.reduce((sum, t) => sum + t.silver, 0);
      const sportBronze = teams.reduce((sum, t) => sum + t.bronze, 0);
      const sportTotal = sportGold + sportSilver + sportBronze;
      
      grandTotalGold += sportGold;
      grandTotalSilver += sportSilver;
      grandTotalBronze += sportBronze;
      
      html += `
        <div style="margin-bottom:24px;">
          <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:12px 16px;border-radius:10px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 3px 10px rgba(245,158,11,0.3);flex-wrap:wrap;gap:8px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="font-size:20px;">🏅</div>
              <div>
                <div style="font-size:15px;font-weight:700;color:white;">${escapeHtml(sportName)}</div>
                <div style="font-size:11px;color:#fef3c7;">${teams.length} team${teams.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
            <div style="background:rgba(255,255,255,0.2);backdrop-filter:blur(10px);padding:6px 12px;border-radius:16px;color:white;font-weight:700;font-size:12px;border:2px solid rgba(255,255,255,0.3);">
              ${sportTotal}
            </div>
          </div>
          
          <div class="table-container">
            <table class="user-table">
              <thead>
                <tr>
                  <th style="padding:10px 8px;">Rank</th>
                  <th style="padding:10px 8px;">Team</th>
                  <th style="padding:10px 8px;text-align:center;">🥇</th>
                  <th style="padding:10px 8px;text-align:center;">🥈</th>
                  <th style="padding:10px 8px;text-align:center;">🥉</th>
                  <th style="padding:10px 8px;text-align:center;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${teams.map((m, idx) => `
                  <tr>
                    <td style="padding:10px 8px;">
                      <strong style="font-size:14px;color:${idx === 0 ? '#f59e0b' : idx === 1 ? '#6b7280' : idx === 2 ? '#ea580c' : 'inherit'};">
                        ${idx + 1}${idx < 3 ? (idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉') : ''}
                      </strong>
                    </td>
                    <td style="padding:10px 8px;"><strong style="font-size:13px;">${escapeHtml(m.team_name)}</strong></td>
                    <td style="text-align:center;font-weight:700;color:#f59e0b;font-size:14px;padding:10px 8px;">${m.gold}</td>
                    <td style="text-align:center;font-weight:700;color:#6b7280;font-size:14px;padding:10px 8px;">${m.silver}</td>
                    <td style="text-align:center;font-weight:700;color:#ea580c;font-size:14px;padding:10px 8px;">${m.bronze}</td>
                    <td style="text-align:center;font-weight:700;font-size:14px;color:#111827;background:#f9fafb;padding:10px 8px;">${m.total}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot style="border-top:2px solid var(--line);background:#fef3c7;">
                <tr>
                  <td colspan="2" style="font-weight:700;text-align:right;padding:12px 8px;color:#78350f;font-size:12px;">
                    Total:
                  </td>
                  <td style="text-align:center;font-weight:700;color:#f59e0b;font-size:14px;padding:12px 8px;">${sportGold}</td>
                  <td style="text-align:center;font-weight:700;color:#6b7280;font-size:14px;padding:12px 8px;">${sportSilver}</td>
                  <td style="text-align:center;font-weight:700;color:#ea580c;font-size:14px;padding:12px 8px;">${sportBronze}</td>
                  <td style="text-align:center;font-weight:700;font-size:14px;color:#78350f;background:#fde68a;padding:12px 8px;">${sportTotal}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      `;
    });
    
    // Calculate overall totals per team (across all sports)
    const teamTotals = {};
    Object.keys(groupedBySport).forEach(sportName => {
      groupedBySport[sportName].forEach(team => {
        if (!teamTotals[team.team_name]) {
          teamTotals[team.team_name] = { gold: 0, silver: 0, bronze: 0, total: 0 };
        }
        teamTotals[team.team_name].gold += team.gold;
        teamTotals[team.team_name].silver += team.silver;
        teamTotals[team.team_name].bronze += team.bronze;
        teamTotals[team.team_name].total += team.total;
      });
    });
    
    // Convert to array and sort
    const overallTeams = Object.keys(teamTotals).map(teamName => ({
      team_name: teamName,
      ...teamTotals[teamName]
    })).sort((a, b) => {
      if (b.gold !== a.gold) return b.gold - a.gold;
      if (b.silver !== a.silver) return b.silver - a.silver;
      return b.bronze - a.bronze;
    });
    
    // Add overall standings section
    html += `
      <div style="margin-bottom:24px;">
        <div style="background:linear-gradient(135deg,#10b981,#059669);padding:12px 16px;border-radius:10px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 3px 10px rgba(16,185,129,0.3);flex-wrap:wrap;gap:8px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="font-size:20px;">🏆</div>
            <div>
              <div style="font-size:15px;font-weight:700;color:white;">Overall Standings</div>
              <div style="font-size:11px;color:#d1fae5;">All sports combined</div>
            </div>
          </div>
        </div>
        
        <div class="table-container">
          <table class="user-table">
            <thead>
              <tr>
                <th style="padding:10px 8px;">Rank</th>
                <th style="padding:10px 8px;">Team</th>
                <th style="padding:10px 8px;text-align:center;">🥇</th>
                <th style="padding:10px 8px;text-align:center;">🥈</th>
                <th style="padding:10px 8px;text-align:center;">🥉</th>
                <th style="padding:10px 8px;text-align:center;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${overallTeams.map((m, idx) => `
                <tr style="${idx < 3 ? 'background:linear-gradient(to right, ' + (idx === 0 ? '#fef3c7' : idx === 1 ? '#f3f4f6' : '#fed7aa') + ', transparent);' : ''}">
                  <td style="padding:10px 8px;">
                    <strong style="font-size:15px;color:${idx === 0 ? '#f59e0b' : idx === 1 ? '#6b7280' : idx === 2 ? '#ea580c' : 'inherit'};">
                      ${idx + 1}${idx < 3 ? (idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉') : ''}
                    </strong>
                  </td>
                  <td style="padding:10px 8px;"><strong style="font-size:13px;">${escapeHtml(m.team_name)}</strong></td>
                  <td style="text-align:center;font-weight:700;color:#f59e0b;font-size:14px;padding:10px 8px;">${m.gold}</td>
                  <td style="text-align:center;font-weight:700;color:#6b7280;font-size:14px;padding:10px 8px;">${m.silver}</td>
                  <td style="text-align:center;font-weight:700;color:#ea580c;font-size:14px;padding:10px 8px;">${m.bronze}</td>
                  <td style="text-align:center;font-weight:700;font-size:15px;color:#111827;background:#f9fafb;padding:10px 8px;">${m.total}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    // Add grand total section
    const grandTotal = grandTotalGold + grandTotalSilver + grandTotalBronze;
    
    html += `
      <div style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);padding:16px;border-radius:10px;box-shadow:0 4px 16px rgba(139,92,246,0.4);">
        <div style="text-align:center;margin-bottom:12px;">
          <div style="font-size:16px;font-weight:700;color:white;margin-bottom:4px;">🏆 Grand Total</div>
          <div style="font-size:11px;color:#ede9fe;">Tournament Summary</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(70px,1fr));gap:10px;">
          <div style="background:rgba(255,255,255,0.15);backdrop-filter:blur(10px);padding:12px 8px;border-radius:10px;text-align:center;border:2px solid rgba(255,255,255,0.2);">
            <div style="font-size:20px;margin-bottom:4px;">🥇</div>
            <div style="font-size:18px;font-weight:700;color:#fbbf24;">${grandTotalGold}</div>
            <div style="font-size:10px;color:#ede9fe;margin-top:2px;">Gold</div>
          </div>
          <div style="background:rgba(255,255,255,0.15);backdrop-filter:blur(10px);padding:12px 8px;border-radius:10px;text-align:center;border:2px solid rgba(255,255,255,0.2);">
            <div style="font-size:20px;margin-bottom:4px;">🥈</div>
            <div style="font-size:18px;font-weight:700;color:#d1d5db;">${grandTotalSilver}</div>
            <div style="font-size:10px;color:#ede9fe;margin-top:2px;">Silver</div>
          </div>
          <div style="background:rgba(255,255,255,0.15);backdrop-filter:blur(10px);padding:12px 8px;border-radius:10px;text-align:center;border:2px solid rgba(255,255,255,0.2);">
            <div style="font-size:20px;margin-bottom:4px;">🥉</div>
            <div style="font-size:18px;font-weight:700;color:#fdba74;">${grandTotalBronze}</div>
            <div style="font-size:10px;color:#ede9fe;margin-top:2px;">Bronze</div>
          </div>
          <div style="background:rgba(255,255,255,0.25);backdrop-filter:blur(10px);padding:12px 8px;border-radius:10px;text-align:center;border:2px solid rgba(255,255,255,0.3);">
            <div style="font-size:20px;margin-bottom:4px;">🏆</div>
            <div style="font-size:18px;font-weight:700;color:white;">${grandTotal}</div>
            <div style="font-size:10px;color:#ede9fe;margin-top:2px;">Total</div>
          </div>
        </div>
      </div>
    `;
    
    content.innerHTML = html;
  } catch (err) {
    console.error('Error loading medals:', err);
    content.innerHTML = '<div class="empty-state">Error loading medal tally</div>';
  }
});

// ==========================================
// TOURNAMENTS
// ==========================================

async function loadTournaments() {
  try {
    const tournaments = await fetchAPI('tournaments');
    const content = $('#tournamentsContent');
    
    if (!tournaments || tournaments.length === 0) {
      content.innerHTML = `
        <div class="empty-state">You have no tournament assignments yet</div>
      `;
      return;
    }
    
    content.innerHTML = '<div class="loading">Loading tournament details...</div>';
    
    // Build tournament sections with matches
    let html = '';
    
    for (const tour of tournaments) {
      html += `
        <div class="tournament-section" style="margin-bottom:32px;">
          <div class="tournament-header" style="background:white;padding:20px;border-radius:var(--radius);box-shadow:var(--shadow);margin-bottom:16px;border:1px solid var(--line);">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
              <div>
                <h3 style="font-size:20px;font-weight:700;margin-bottom:8px;color:var(--text);">
                  🏆 ${escapeHtml(tour.tour_name)}
                </h3>
                <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:13px;color:var(--muted);">
                  <span>📅 ${escapeHtml(tour.tour_date)}</span>
                  <span>📚 ${escapeHtml(tour.school_year)}</span>
                  <span>🎯 ${tour.total_matches} match${tour.total_matches !== 1 ? 'es' : ''}</span>
                  ${tour.upcoming_matches > 0 ? `<span style="color:#3b82f6;font-weight:600;">⏰ ${tour.upcoming_matches} upcoming</span>` : ''}
                  ${tour.completed_matches > 0 ? `<span style="color:#10b981;font-weight:600;">✅ ${tour.completed_matches} completed</span>` : ''}
                </div>
              </div>
              <span class="badge ${tour.is_active == 1 ? 'upcoming' : 'completed'}" style="font-size:12px;">
                ${tour.is_active == 1 ? 'Active' : 'Completed'}
              </span>
            </div>
            <button class="view-matches-btn" data-tour-id="${tour.tour_id}" style="margin-top:16px;padding:10px 20px;background:var(--primary);color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;transition:all 0.2s;">
              View My Matches (${tour.total_matches})
            </button>
          </div>
          <div class="matches-container" id="matches-${tour.tour_id}" style="display:none;"></div>
        </div>
      `;
    }
    
    content.innerHTML = html;
    
    // Add event listeners to view matches buttons
    $$('.view-matches-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const tourId = this.dataset.tourId;
        const container = $(`#matches-${tourId}`);
        
        if (container.style.display === 'none') {
          // Load and show matches
          this.textContent = 'Loading...';
          this.disabled = true;
          
          try {
            const matches = await fetchAPI('tournament_matches', { tour_id: tourId });
            
            if (!matches || matches.length === 0) {
              container.innerHTML = `
                <div class="data-card">
                  <p style="color:var(--muted);text-align:center;padding:20px;">No matches found</p>
                </div>
              `;
            } else {
              container.innerHTML = `
                <div class="data-grid">
                  ${matches.map(m => {
                    const statusBadge = {
                      'today': '<span class="badge" style="background:#fbbf24;color:#78350f;border:1px solid #f59e0b;">Today</span>',
                      'upcoming': '<span class="badge upcoming">Upcoming</span>',
                      'completed': '<span class="badge completed">Completed</span>',
                      'pending': '<span class="badge pending">Pending</span>'
                    }[m.match_status] || '';
                    
                    return `
                      <div class="data-card">
                        <div class="data-card-header">
                          <div class="data-card-title">
                            Game #${m.game_no || 'N/A'} - ${escapeHtml(m.sports_name)}
                          </div>
                          ${statusBadge}
                        </div>
                        <div class="data-card-meta">
                          <div style="font-weight:600;margin-bottom:8px;font-size:14px;">
                            ${escapeHtml(m.match_type)} Match
                          </div>
                          📅 ${escapeHtml(m.sked_date)} at ${escapeHtml(m.sked_time)}<br>
                          🏟️ ${escapeHtml(m.venue_name || 'TBA')}
                          ${m.venue_building ? '<br>🏢 ' + escapeHtml(m.venue_building) : ''}
                          ${m.venue_room ? ' - Room ' + escapeHtml(m.venue_room) : ''}<br>
                          <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--line);">
                            <strong>🆚 Matchup:</strong><br>
                            <span style="color:#3b82f6;">${escapeHtml(m.team_a_name)}</span> 
                            <strong>vs</strong> 
                            <span style="color:#ef4444;">${escapeHtml(m.team_b_name)}</span>
                          </div>
                          ${m.winner_name ? `
                            <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--line);">
                              🏆 <strong>Winner:</strong> <span style="color:#10b981;font-weight:600;">${escapeHtml(m.winner_name)}</span>
                            </div>
                          ` : ''}
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `;
            }
            
            container.style.display = 'block';
            this.textContent = 'Hide Matches';
            this.disabled = false;
          } catch (err) {
            console.error('Error loading tournament matches:', err);
            container.innerHTML = `
              <div class="data-card">
                <p style="color:var(--danger);text-align:center;padding:20px;">Error loading matches</p>
              </div>
            `;
            container.style.display = 'block';
            this.textContent = 'View My Matches';
            this.disabled = false;
          }
        } else {
          // Hide matches
          container.style.display = 'none';
          this.textContent = `View My Matches (${this.textContent.match(/\d+/)[0]})`;
        }
      });
    });
    
  } catch (err) {
    console.error('loadTournaments error:', err);
    $('#tournamentsContent').innerHTML = `
      <div class="empty-state">Error loading tournaments</div>
    `;
  }
}

// Initialize
(async function init() {
  console.log('Umpire dashboard initialized');
  await loadOverview();
})();