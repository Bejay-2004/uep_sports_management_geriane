// ==========================================
// PRINT REPORT FUNCTIONALITY
// ==========================================

// Show print modal with data selection
// Show print modal with data selection
function showPrintModal() {
  const modal = document.getElementById('printModal');
  if (modal) {
    modal.classList.add('active');
    // Initialize filters
    initializePrintFilters();
  }
}

// Initialize print modal filters
async function initializePrintFilters() {
  try {
    // Fetch tournaments
    const tournaments = await fetch('api.php?action=tournaments').then(r => r.json());
    
    if (!Array.isArray(tournaments)) {
      console.error('Failed to load tournaments for print filters');
      return;
    }
    
    // Get unique school years
    const schoolYears = [...new Set(tournaments.map(t => t.school_year))].sort().reverse();
    
    // Initialize status filter with 'active' as default
    const statusSelect = document.getElementById('printStatusFilter');
    if (statusSelect) {
      statusSelect.value = 'active'; // Set default to Active Only
      statusSelect.addEventListener('change', updatePrintFilterSummary);
    }
    
    // Populate school year dropdown
    const schoolYearSelect = document.getElementById('printSchoolYearFilter');
    if (schoolYearSelect) {
      schoolYearSelect.innerHTML = '<option value="">All School Years</option>' +
        schoolYears.map(sy => `<option value="${sy}">${sy}</option>`).join('');
      
      // Add change event listener
      schoolYearSelect.addEventListener('change', updatePrintTournamentFilter);
    }
    
    // Populate tournament dropdown
    const tournamentSelect = document.getElementById('printTournamentFilter');
    if (tournamentSelect) {
      tournamentSelect.innerHTML = '<option value="">All Tournaments</option>' +
        tournaments.map(t => `<option value="${t.tour_id}">${escapeHtml(t.tour_name)} (${t.school_year})</option>`).join('');
      
      // Add change event listener
      tournamentSelect.addEventListener('change', updatePrintFilterSummary);
    }
    
    // Initialize summary
    updatePrintFilterSummary();
    
  } catch (error) {
    console.error('Error initializing print filters:', error);
  }
}

// Update tournament filter based on school year selection
async function updatePrintTournamentFilter() {
  const schoolYear = document.getElementById('printSchoolYearFilter').value;
  const tournamentSelect = document.getElementById('printTournamentFilter');
  
  try {
    const tournaments = await fetch('api.php?action=tournaments').then(r => r.json());
    
    let filteredTournaments = tournaments;
    if (schoolYear) {
      filteredTournaments = tournaments.filter(t => t.school_year === schoolYear);
    }
    
    tournamentSelect.innerHTML = '<option value="">All Tournaments</option>' +
      filteredTournaments.map(t => `<option value="${t.tour_id}">${escapeHtml(t.tour_name)} (${t.school_year})</option>`).join('');
    
    // Update summary
    updatePrintFilterSummary();
    
  } catch (error) {
    console.error('Error updating tournament filter:', error);
  }
}

// Update filter summary display
function updatePrintFilterSummary() {
  const statusSelect = document.getElementById('printStatusFilter');
  const schoolYearSelect = document.getElementById('printSchoolYearFilter');
  const tournamentSelect = document.getElementById('printTournamentFilter');
  const summaryEl = document.getElementById('printFilterSummary');
  
  if (!summaryEl) return;
  
  const status = statusSelect.value;
  const schoolYear = schoolYearSelect.value;
  const tournament = tournamentSelect.value;
  
  let summary = [];
  
  // Status
  if (status === 'active') {
    summary.push('Active Only');
  } else if (status === 'inactive') {
    summary.push('Inactive Only');
  } else {
    summary.push('All Status');
  }
  
  // School Year
  if (schoolYear) {
    summary.push(`School Year: ${schoolYear}`);
  } else {
    summary.push('All School Years');
  }
  
  // Tournament
  if (tournament) {
    const tournamentName = tournamentSelect.options[tournamentSelect.selectedIndex].text;
    summary.push(tournamentName);
  } else {
    summary.push('All Tournaments');
  }
  
  summaryEl.textContent = summary.join(', ');
}
// Close print modal
function closePrintModal() {
  const modal = document.getElementById('printModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// Load available data options for printing
async function loadPrintDataOptions() {
  try {
    // Get filters
    const tournament = document.getElementById('filterTournament')?.value || '';
    const team = document.getElementById('filterTeam')?.value || '';
    const sport = document.getElementById('filterSport')?.value || '';
    
    // Update tournament info in print modal if selected
    if (tournament) {
      const tournamentSelect = document.getElementById('filterTournament');
      const tournamentName = tournamentSelect.options[tournamentSelect.selectedIndex]?.text || 'Selected Tournament';
      document.getElementById('printTournamentInfo').textContent = tournamentName;
    } else {
      document.getElementById('printTournamentInfo').textContent = 'All Tournaments';
    }
    
  } catch (error) {
    console.error('Error loading print options:', error);
  }
}



// Generate and display print preview
async function generatePrintReport() {
  const selections = {
    overview: document.getElementById('printOverview')?.checked || false,
    tournaments: document.getElementById('printTournaments')?.checked || false,
    teams: document.getElementById('printTeams')?.checked || false,
    athletes: document.getElementById('printAthletes')?.checked || false,
    matches: document.getElementById('printMatches')?.checked || false,
    standings: document.getElementById('printStandings')?.checked || false,
    training: document.getElementById('printTraining')?.checked || false,
    venues: document.getElementById('printVenues')?.checked || false,
    equipment: document.getElementById('printEquipment')?.checked || false,
    colleges: document.getElementById('printColleges')?.checked || false
  };
  
  // Check if at least one section is selected
  if (!Object.values(selections).some(v => v)) {
    alert('Please select at least one section to print');
    return;
  }
  
  // Show loading state
  const printBtn = document.querySelector('#printModal .btn-primary');
  const originalText = printBtn.innerHTML;
  printBtn.innerHTML = '<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" class="animate-spin"><path d="M8 0a8 8 0 1 0 8 8A8 8 0 0 0 8 0ZM8 14a6 6 0 1 1 6-6 6 6 0 0 1-6 6Z"/></svg> Generating...';
  printBtn.disabled = true;
  
  try {
    // Get filters from print modal
    const filters = {
      status: document.getElementById('printStatusFilter')?.value || 'active',
      schoolYear: document.getElementById('printSchoolYearFilter')?.value || '',
      tournament: document.getElementById('printTournamentFilter')?.value || ''
    };
    
    // Fetch all required data
    const reportData = await fetchReportData(selections, filters);
    
    // Generate HTML report
    const reportHTML = generateReportHTML(reportData, selections, filters);
    
    // Open print preview in new window
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(reportHTML);
    printWindow.document.close();
    
    // Auto-trigger print dialog after content loads
    printWindow.onload = function() {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
    
    // Close the modal
    closePrintModal();
    
  } catch (error) {
    console.error('Error generating report:', error);
    alert('Error generating report. Please try again.');
  } finally {
    printBtn.innerHTML = originalText;
    printBtn.disabled = false;
  }
}

// Fetch all data needed for the report
// Fetch all data needed for the report
// Fetch all data needed for the report with proper filtering
async function fetchReportData(selections, filters) {
  const data = {};
  
  try {
    // Build query string from filters
    const params = new URLSearchParams();
    if (filters.tournament) {
      params.append('tour_id', filters.tournament);
    }
    
    // Fetch overview stats if selected
    if (selections.overview) {
      try {
        const response = await fetch(`api.php?action=stats&${params}`);
        const result = await response.json();
        data.stats = result;
      } catch (error) {
        console.error('Error fetching stats:', error);
        data.stats = { tournaments: 0, teams: 0, athletes: 0, sports: 0, matches: 0, venues: 0 };
      }
    }
    
    // Fetch tournaments if selected
    if (selections.tournaments) {
      try {
        const response = await fetch(`api.php?action=tournaments`);
        let result = await response.json();
        
        // Apply filters
        if (Array.isArray(result)) {
          // Status filter
          if (filters.status === 'active') {
            result = result.filter(t => t.is_active == 1);
          } else if (filters.status === 'inactive') {
            result = result.filter(t => t.is_active == 0);
          }
          // School year filter
          if (filters.schoolYear) {
            result = result.filter(t => t.school_year === filters.schoolYear);
          }
          // Tournament filter
          if (filters.tournament) {
            result = result.filter(t => t.tour_id == filters.tournament);
          }
        }
        
        data.tournaments = { data: Array.isArray(result) ? result : [] };
      } catch (error) {
        console.error('Error fetching tournaments:', error);
        data.tournaments = { data: [] };
      }
    }
    
    // Fetch teams if selected
    if (selections.teams) {
      try {
        let result = [];
        
        if (filters.tournament) {
          // Get teams for specific tournament
          const response = await fetch(`api.php?action=get_tournament_teams&tour_id=${filters.tournament}`);
          result = await response.json();
        } else {
          // Get all teams
          const response = await fetch(`api.php?action=teams`);
          result = await response.json();
          
          // If school year is selected, filter teams by tournaments in that school year
          if (filters.schoolYear && Array.isArray(result)) {
            const tourResponse = await fetch(`api.php?action=tournaments`);
            const tournaments = await tourResponse.json();
            const schoolYearTournaments = tournaments.filter(t => t.school_year === filters.schoolYear);
            const tournamentIds = schoolYearTournaments.map(t => t.tour_id);
            
            const teamPromises = tournamentIds.map(tourId => 
              fetch(`api.php?action=get_tournament_teams&tour_id=${tourId}`).then(r => r.json())
            );
            const teamResults = await Promise.all(teamPromises);
            
            const uniqueTeams = new Map();
            teamResults.flat().forEach(team => {
              if (team && team.team_id) {
                uniqueTeams.set(team.team_id, team);
              }
            });
            result = Array.from(uniqueTeams.values());
          }
        }
        
        // Apply status filter to teams
        if (Array.isArray(result)) {
          if (filters.status === 'active') {
            result = result.filter(t => t.is_active == 1 || t.team_is_active == 1);
          } else if (filters.status === 'inactive') {
            result = result.filter(t => t.is_active == 0 || t.team_is_active == 0);
          }
        }
        
        data.teams = { data: Array.isArray(result) ? result : [] };
      } catch (error) {
        console.error('Error fetching teams:', error);
        data.teams = { data: [] };
      }
    }
    
    // Fetch athletes if selected
    if (selections.athletes) {
      try {
        let result = [];
        
        if (filters.tournament) {
          const response = await fetch(`api.php?action=get_team_athletes`);
          let allAthletes = await response.json();
          
          if (Array.isArray(allAthletes)) {
            result = allAthletes.filter(a => a.tour_id == filters.tournament);
          }
        } else if (filters.schoolYear) {
          const tourResponse = await fetch(`api.php?action=tournaments`);
          const tournaments = await tourResponse.json();
          const schoolYearTournaments = tournaments.filter(t => t.school_year === filters.schoolYear);
          const tournamentIds = schoolYearTournaments.map(t => t.tour_id);
          
          const response = await fetch(`api.php?action=get_team_athletes`);
          let allAthletes = await response.json();
          
          if (Array.isArray(allAthletes)) {
            const uniqueAthletes = new Map();
            allAthletes
              .filter(a => tournamentIds.includes(a.tour_id))
              .forEach(athlete => {
                if (athlete && athlete.person_id) {
                  uniqueAthletes.set(athlete.person_id, athlete);
                }
              });
            result = Array.from(uniqueAthletes.values());
          }
        } else {
          const response = await fetch(`api.php?action=athletes`);
          result = await response.json();
        }
        
        // Apply status filter to athletes
        if (Array.isArray(result)) {
          if (filters.status === 'active') {
            result = result.filter(a => a.is_active == 1);
          } else if (filters.status === 'inactive') {
            result = result.filter(a => a.is_active == 0);
          }
        }
        
        data.athletes = { data: Array.isArray(result) ? result : [] };
      } catch (error) {
        console.error('Error fetching athletes:', error);
        data.athletes = { data: [] };
      }
    }
    
    // Fetch matches if selected (no status filter - matches don't have is_active)
    if (selections.matches) {
      try {
        let result = [];
        
        if (filters.tournament) {
          const response = await fetch(`api.php?action=matches&tour_id=${filters.tournament}`);
          result = await response.json();
        } else if (filters.schoolYear) {
          const tourResponse = await fetch(`api.php?action=tournaments`);
          const tournaments = await tourResponse.json();
          const schoolYearTournaments = tournaments.filter(t => t.school_year === filters.schoolYear);
          const tournamentIds = schoolYearTournaments.map(t => t.tour_id);
          
          const response = await fetch(`api.php?action=matches`);
          let allMatches = await response.json();
          
          if (Array.isArray(allMatches)) {
            result = allMatches.filter(m => tournamentIds.includes(m.tour_id));
          }
        } else {
          const response = await fetch(`api.php?action=matches`);
          result = await response.json();
        }
        
        data.matches = { data: Array.isArray(result) ? result : [] };
      } catch (error) {
        console.error('Error fetching matches:', error);
        data.matches = { data: [] };
      }
    }
    
    // Fetch standings, training, venues, equipment, colleges (no status filtering for these)
    if (selections.standings) {
      try {
        let result = [];
        
        if (filters.tournament) {
          const response = await fetch(`api.php?action=standings&tour_id=${filters.tournament}`);
          result = await response.json();
        } else if (filters.schoolYear) {
          const tourResponse = await fetch(`api.php?action=tournaments`);
          const tournaments = await tourResponse.json();
          const schoolYearTournaments = tournaments.filter(t => t.school_year === filters.schoolYear);
          const tournamentIds = schoolYearTournaments.map(t => t.tour_id);
          
          const response = await fetch(`api.php?action=standings`);
          let allStandings = await response.json();
          
          if (Array.isArray(allStandings)) {
            result = allStandings.filter(s => tournamentIds.includes(s.tour_id));
          }
        } else {
          const response = await fetch(`api.php?action=standings`);
          result = await response.json();
        }
        
        data.standings = { data: Array.isArray(result) ? result : [] };
      } catch (error) {
        console.error('Error fetching standings:', error);
        data.standings = { data: [] };
      }
    }
    
    if (selections.training) {
      try {
        const response = await fetch(`api.php?action=training`);
        const result = await response.json();
        data.training = { data: Array.isArray(result) ? result : [] };
      } catch (error) {
        console.error('Error fetching training:', error);
        data.training = { data: [] };
      }
    }
    
    if (selections.venues) {
      try {
        const response = await fetch(`api.php?action=get_venues`);
        let result = await response.json();
        
        // Apply status filter to venues
        if (Array.isArray(result)) {
          if (filters.status === 'active') {
            result = result.filter(v => v.is_active == 1);
          } else if (filters.status === 'inactive') {
            result = result.filter(v => v.is_active == 0);
          }
        }
        
        data.venues = { data: Array.isArray(result) ? result : [] };
      } catch (error) {
        console.error('Error fetching venues:', error);
        data.venues = { data: [] };
      }
    }
    
    if (selections.equipment) {
      try {
        const response = await fetch(`api.php?action=get_equipment`);
        let result = await response.json();
        
        // Apply status filter to equipment (functional = active)
        if (Array.isArray(result)) {
          if (filters.status === 'active') {
            result = result.filter(e => e.is_functional == 1);
          } else if (filters.status === 'inactive') {
            result = result.filter(e => e.is_functional == 0);
          }
        }
        
        data.equipment = { data: Array.isArray(result) ? result : [] };
      } catch (error) {
        console.error('Error fetching equipment:', error);
        data.equipment = { data: [] };
      }
    }
    
    if (selections.colleges) {
      try {
        const response = await fetch(`api.php?action=get_colleges`);
        let result = await response.json();
        
        // Apply status filter to colleges
        if (Array.isArray(result)) {
          if (filters.status === 'active') {
            result = result.filter(c => c.is_active == 1);
          } else if (filters.status === 'inactive') {
            result = result.filter(c => c.is_active == 0);
          }
        }
        
        data.colleges = { data: Array.isArray(result) ? result : [] };
      } catch (error) {
        console.error('Error fetching colleges:', error);
        data.colleges = { data: [] };
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching report data:', error);
    throw error;
  }
}

// Generate HTML for print report
function generateReportHTML(data, selections, filters) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Get filter descriptions
  let filterDesc = [];
  
  // Status
  if (filters.status === 'active') {
    filterDesc.push('Status: Active Only');
  } else if (filters.status === 'inactive') {
    filterDesc.push('Status: Inactive Only');
  } else {
    filterDesc.push('Status: All');
  }
  
  // School Year
  if (filters.schoolYear) {
    filterDesc.push(`School Year: ${filters.schoolYear}`);
  }
  
  // Tournament
  if (filters.tournament) {
    const select = document.getElementById('printTournamentFilter');
    const tournamentName = select.options[select.selectedIndex]?.text || 'Selected Tournament';
    filterDesc.push(tournamentName);
  }
  
  const filterText = filterDesc.length > 0 ? filterDesc.join(' | ') : 'All Data';
  
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Sports Management Report - ${dateStr}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1f2937;
      padding: 20px;
      background: white;
    }
    
    .print-header {
      text-align: center;
      padding: 30px 20px;
      border-bottom: 3px solid #111827;
      margin-bottom: 30px;
    }
    
    .print-logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 15px;
    }
    
    .print-title {
      font-size: 24pt;
      font-weight: 700;
      color: #111827;
      margin: 0 0 8px 0;
    }
    
    .print-subtitle {
      font-size: 14pt;
      color: #6b7280;
      margin: 0 0 15px 0;
      font-weight: 500;
    }
    
    .print-meta {
      font-size: 10pt;
      color: #6b7280;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
    }
    
    .print-meta-row {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-bottom: 5px;
    }
    
    .print-section {
      margin-bottom: 35px;
      page-break-inside: avoid;
    }
    
    .print-section-title {
      font-size: 16pt;
      font-weight: 700;
      color: #111827;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 10pt;
    }
    
    thead {
      background: #f9fafb;
    }
    
    th {
      padding: 10px 12px;
      text-align: left;
      font-size: 9pt;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    tr:hover {
      background: #f9fafb;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 25px;
    }
    
    .stat-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
      background: #f9fafb;
    }
    
    .stat-value {
      font-size: 28pt;
      font-weight: 700;
      color: #111827;
      line-height: 1;
    }
    
    .stat-label {
      font-size: 10pt;
      color: #6b7280;
      margin-top: 6px;
      font-weight: 500;
    }
    
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 9pt;
      font-weight: 600;
    }
    
    .badge-active {
      background: #d1fae5;
      color: #065f46;
    }
    
    .badge-inactive {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .data-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .data-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
      background: white;
    }
    
    .data-card-title {
      font-size: 12pt;
      font-weight: 600;
      color: #111827;
      margin-bottom: 8px;
    }
    
    .data-card-meta {
      font-size: 10pt;
      color: #6b7280;
      line-height: 1.5;
    }
    
    .page-break {
      page-break-after: always;
    }
    
    @media print {
      body { padding: 0; }
      .print-section { page-break-inside: avoid; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
    }
  </style>
</head>
<body>
  <div class="print-header">
    <img src="${window.BASE_URL}/assets/images/uep.png" alt="UEP Logo" class="print-logo">
    <h1 class="print-title">University of Eastern Philippines</h1>
    <p class="print-subtitle">Sports Management System Report</p>
    <div class="print-meta">
      <div class="print-meta-row">
        <span><strong>Generated:</strong> ${dateStr} at ${timeStr}</span>
        <span><strong>Generated By:</strong> ${window.DIRECTOR_CONTEXT.full_name}</span>
      </div>
      <div class="print-meta-row">
        <span><strong>Filters:</strong> ${filterText}</span>
      </div>
    </div>
  </div>
`;

  // Overview Section
  if (selections.overview && data.stats) {
    html += generateOverviewSection(data.stats);
  }
  
  // Tournaments Section
  if (selections.tournaments && data.tournaments) {
    html += generateTournamentsSection(data.tournaments);
  }
  
  // Teams Section
  if (selections.teams && data.teams) {
    html += generateTeamsSection(data.teams);
  }
  
  // Athletes Section
  if (selections.athletes && data.athletes) {
    html += generateAthletesSection(data.athletes);
  }
  
  // Matches Section
  if (selections.matches && data.matches) {
    html += generateMatchesSection(data.matches);
  }
  
  // Standings Section
  if (selections.standings && data.standings) {
    html += generateStandingsSection(data.standings);
  }
  
  // Training Section
  if (selections.training && data.training) {
    html += generateTrainingSection(data.training);
  }
  
  // Venues Section
  if (selections.venues && data.venues) {
    html += generateVenuesSection(data.venues);
  }
  
  // Equipment Section
  if (selections.equipment && data.equipment) {
    html += generateEquipmentSection(data.equipment);
  }
  
  // Colleges Section
  if (selections.colleges && data.colleges) {
    html += generateCollegesSection(data.colleges);
  }
  
  html += `
</body>
</html>
`;
  
  return html;
}

// Generate Overview Section HTML
function generateOverviewSection(stats) {
  const s = stats;
  return `
<div class="print-section">
  <h2 class="print-section-title">📊 Overview Statistics</h2>
  <p style="font-size: 10pt; color: #6b7280; margin-bottom: 16px; font-style: italic;">
    Statistics calculated from filtered data
  </p>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${s.tournaments || 0}</div>
      <div class="stat-label">Tournaments</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${s.teams || 0}</div>
      <div class="stat-label">Teams</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${s.athletes || 0}</div>
      <div class="stat-label">Athletes</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${s.sports || 0}</div>
      <div class="stat-label">Sports Categories</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${s.matches || 0}</div>
      <div class="stat-label">Total Matches</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${s.upcoming_matches || 0}</div>
      <div class="stat-label">Upcoming Matches</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${s.venues || 0}</div>
      <div class="stat-label">Venues</div>
    </div>
  </div>
  
  ${s.tournaments === 0 && s.teams === 0 && s.athletes === 0 ? `
  <div style="padding: 16px; background: #fef3c7; border-left: 4px solid #fbbf24; border-radius: 6px; margin-top: 16px;">
    <strong style="color: #92400e;">ℹ️ Note:</strong>
    <span style="color: #78350f; font-size: 10pt;">
      No data found matching the selected filters. Try adjusting your filter criteria.
    </span>
  </div>
  ` : ''}
</div>
`;
}

// Generate Tournaments Section HTML
// Generate Tournaments Section HTML
// Generate Tournaments Section HTML
function generateTournamentsSection(data) {
  if (!data.data || data.data.length === 0) {
    return `
<div class="print-section">
  <h2 class="print-section-title">🏆 Tournaments</h2>
  <p style="color: #6b7280; font-style: italic;">No tournaments found matching the selected filters.</p>
</div>
`;
  }
  
  // Group by school year
  const grouped = {};
  data.data.forEach(t => {
    const year = t.school_year || 'No Year';
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(t);
  });
  
  let html = `
<div class="print-section">
  <h2 class="print-section-title">🏆 Tournaments</h2>
`;

  Object.keys(grouped).sort().reverse().forEach(year => {
    html += `
  <h3 style="font-size: 14pt; color: #374151; margin: 20px 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
    School Year: ${escapeHtml(year)}
  </h3>
  <table>
    <thead>
      <tr>
        <th>Tournament Name</th>
        <th>Date</th>
        <th>Teams</th>
        <th>Sports</th>
        <th>Athletes</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
`;
    
    grouped[year].forEach(t => {
      const status = t.is_active == 1 ? 
        '<span class="badge badge-active">Active</span>' : 
        '<span class="badge badge-inactive">Inactive</span>';
      
      html += `
      <tr>
        <td><strong>${escapeHtml(t.tour_name)}</strong></td>
        <td>${escapeHtml(t.tour_date || 'TBD')}</td>
        <td>${t.num_teams || 0}</td>
        <td>${t.num_sports || 0}</td>
        <td>${t.num_athletes || 0}</td>
        <td>${status}</td>
      </tr>
      `;
    });
    
    html += `
    </tbody>
  </table>
    `;
  });
  
  html += `
</div>
`;
  
  return html;
}

// Generate Teams Section HTML
// Generate Teams Section HTML
function generateTeamsSection(data) {
  if (!data.data || data.data.length === 0) {
    return `
<div class="print-section">
  <h2 class="print-section-title">👥 Teams</h2>
  <p style="color: #6b7280; font-style: italic;">No teams found.</p>
</div>
`;
  }
  
  let html = `
<div class="print-section">
  <h2 class="print-section-title">👥 Teams</h2>
  <table>
    <thead>
      <tr>
        <th>Team Name</th>
        <th>School</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
`;
  
  data.data.forEach(t => {
    const status = t.is_active == 1 ? 
      '<span class="badge badge-active">Active</span>' : 
      '<span class="badge badge-inactive">Inactive</span>';
    
    html += `
      <tr>
        <td><strong>${escapeHtml(t.team_name)}</strong></td>
        <td>${escapeHtml(t.school_name || 'N/A')}</td>
        <td>${status}</td>
      </tr>
    `;
  });
  
  html += `
    </tbody>
  </table>
</div>
`;
  
  return html;
}

// Generate Athletes Section HTML
// Generate Athletes Section HTML
// Generate Athletes Section HTML
function generateAthletesSection(data) {
  if (!data.data || data.data.length === 0) {
    return `
<div class="print-section">
  <h2 class="print-section-title">🏃 Athletes</h2>
  <p style="color: #6b7280; font-style: italic;">No athletes found matching the selected filters.</p>
</div>
`;
  }
  
  // Group by team and sport
  const grouped = {};
  data.data.forEach(a => {
    const teamName = a.team_name || 'Unknown Team';
    const sportName = a.sports_name || 'Unknown Sport';
    
    if (!grouped[teamName]) grouped[teamName] = {};
    if (!grouped[teamName][sportName]) grouped[teamName][sportName] = [];
    
    grouped[teamName][sportName].push(a);
  });
  
  let html = `
<div class="print-section">
  <h2 class="print-section-title">🏃 Athletes</h2>
`;

  Object.keys(grouped).sort().forEach(teamName => {
    html += `
  <h3 style="font-size: 14pt; color: #374151; margin: 20px 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
    Team: ${escapeHtml(teamName)}
  </h3>
`;
    
    Object.keys(grouped[teamName]).sort().forEach(sportName => {
      const athletes = grouped[teamName][sportName];
      
      html += `
  <h4 style="font-size: 11pt; color: #6b7280; margin: 12px 0 8px 0;">
    Sport: ${escapeHtml(sportName)} (${athletes.length} athlete${athletes.length !== 1 ? 's' : ''})
  </h4>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Gender</th>
        <th>College</th>
        <th>Course</th>
        <th>Role</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
`;
      
      athletes.forEach(a => {
        const status = a.is_active == 1 ? 
          '<span class="badge badge-active">Active</span>' : 
          '<span class="badge badge-inactive">Inactive</span>';
        
        const role = a.is_captain == 1 ? '⭐ Captain' : 'Athlete';
        
        html += `
      <tr>
        <td><strong>${escapeHtml(a.athlete_name || a.full_name || 'N/A')}</strong></td>
        <td>${escapeHtml(a.gender || 'N/A')}</td>
        <td>${escapeHtml(a.college_code || 'N/A')}</td>
        <td>${escapeHtml(a.course || 'N/A')}</td>
        <td>${role}</td>
        <td>${status}</td>
      </tr>
        `;
      });
      
      html += `
    </tbody>
  </table>
      `;
    });
  });
  
  html += `
</div>
`;
  
  return html;
}
// Generate Matches Section HTML
// Generate Matches Section HTML
function generateMatchesSection(data) {
  if (!data.data || data.data.length === 0) {
    return `
<div class="print-section">
  <h2 class="print-section-title">⚔️ Matches</h2>
  <p style="color: #6b7280; font-style: italic;">No matches found.</p>
</div>
`;
  }
  
  let html = `
<div class="print-section">
  <h2 class="print-section-title">⚔️ Matches</h2>
  <table>
    <thead>
      <tr>
        <th>Match</th>
        <th>Sport</th>
        <th>Date & Time</th>
        <th>Venue</th>
      </tr>
    </thead>
    <tbody>
`;
  
  data.data.forEach(m => {
    const team1 = m.team_a_name || 'TBD';
    const team2 = m.team_b_name || 'TBD';
    const matchup = `${team1} vs ${team2}`;
    const datetime = `${m.sked_date || 'TBD'} ${m.sked_time || ''}`.trim();
    
    html += `
      <tr>
        <td><strong>${escapeHtml(matchup)}</strong></td>
        <td>${escapeHtml(m.sports_name || 'N/A')}</td>
        <td>${escapeHtml(datetime)}</td>
        <td>${escapeHtml(m.venue_name || 'TBD')}</td>
      </tr>
    `;
  });
  
  html += `
    </tbody>
  </table>
</div>
`;
  
  return html;
}

// Generate Standings Section HTML
// Generate Standings Section HTML
function generateStandingsSection(data) {
  if (!data.data || data.data.length === 0) {
    return `
<div class="print-section">
  <h2 class="print-section-title">📊 Standings</h2>
  <p style="color: #6b7280; font-style: italic;">No standings data available.</p>
</div>
`;
  }
  
  let html = `
<div class="print-section">
  <h2 class="print-section-title">📊 Standings</h2>
  <table>
    <thead>
      <tr>
        <th>Rank</th>
        <th>Team</th>
        <th>Sport</th>
        <th>Wins</th>
        <th>Losses</th>
        <th>Gold</th>
        <th>Silver</th>
        <th>Bronze</th>
      </tr>
    </thead>
    <tbody>
`;
  
  data.data.forEach((s, index) => {
    html += `
      <tr>
        <td><strong>${index + 1}</strong></td>
        <td>${escapeHtml(s.team_name)}</td>
        <td>${escapeHtml(s.sports_name || 'N/A')}</td>
        <td>${s.no_win || 0}</td>
        <td>${s.no_loss || 0}</td>
        <td>🥇 ${s.no_gold || 0}</td>
        <td>🥈 ${s.no_silver || 0}</td>
        <td>🥉 ${s.no_bronze || 0}</td>
      </tr>
    `;
  });
  
  html += `
    </tbody>
  </table>
</div>
`;
  
  return html;
}

// Generate Training Section HTML
function generateTrainingSection(data) {
  if (!data.data || data.data.length === 0) {
    return `
<div class="print-section">
  <h2 class="print-section-title">📚 Training Sessions</h2>
  <p style="color: #6b7280; font-style: italic;">No training sessions found.</p>
</div>
`;
  }
  
  let html = `
<div class="print-section">
  <h2 class="print-section-title">📚 Training Sessions</h2>
  <table>
    <thead>
      <tr>
        <th>Team</th>
        <th>Date & Time</th>
        <th>Venue</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
`;
  
  data.data.forEach(t => {
    const datetime = `${t.sked_date || 'TBD'} ${t.sked_time || ''}`.trim();
    const status = t.is_active == 1 ? 
      '<span class="badge badge-active">Active</span>' : 
      '<span class="badge badge-inactive">Cancelled</span>';
    
    html += `
      <tr>
        <td><strong>${escapeHtml(t.team_name || 'N/A')}</strong></td>
        <td>${escapeHtml(datetime)}</td>
        <td>${escapeHtml(t.venue_name || 'N/A')}</td>
        <td>${status}</td>
      </tr>
    `;
  });
  
  html += `
    </tbody>
  </table>
</div>
`;
  
  return html;
}

// Generate Venues Section HTML
// Generate Venues Section HTML
function generateVenuesSection(data) {
  if (!data.data || data.data.length === 0) {
    return `
<div class="print-section">
  <h2 class="print-section-title">🏟️ Venues</h2>
  <p style="color: #6b7280; font-style: italic;">No venues found.</p>
</div>
`;
  }
  
  let html = `
<div class="print-section">
  <h2 class="print-section-title">🏟️ Venues</h2>
  <div class="data-grid">
`;
  
  data.data.forEach(v => {
    const status = v.is_active == 1 ? 
      '<span class="badge badge-active">Active</span>' : 
      '<span class="badge badge-inactive">Inactive</span>';
    
    html += `
    <div class="data-card">
      <div class="data-card-title">${escapeHtml(v.venue_name)}</div>
      <div class="data-card-meta">
        ${v.venue_building ? `<div><strong>Building:</strong> ${escapeHtml(v.venue_building)}</div>` : ''}
        ${v.venue_room ? `<div><strong>Room:</strong> ${escapeHtml(v.venue_room)}</div>` : ''}
        <div><strong>Matches:</strong> ${v.match_count || 0}</div>
        <div><strong>Training Sessions:</strong> ${v.training_count || 0}</div>
        <div><strong>Status:</strong> ${status}</div>
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

// Generate Equipment Section HTML
// Generate Equipment Section HTML
function generateEquipmentSection(data) {
  if (!data.data || data.data.length === 0) {
    return `
<div class="print-section">
  <h2 class="print-section-title">⚙️ Equipment</h2>
  <p style="color: #6b7280; font-style: italic;">No equipment found.</p>
</div>
`;
  }
  
  let html = `
<div class="print-section">
  <h2 class="print-section-title">⚙️ Equipment</h2>
  <table>
    <thead>
      <tr>
        <th>Equipment Name</th>
        <th>Sport</th>
        <th>Stock</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
`;
  
  data.data.forEach(e => {
    const status = e.is_functional == 1 ? 
      '<span class="badge badge-active">Functional</span>' : 
      '<span class="badge badge-inactive">Non-Functional</span>';
    
    html += `
      <tr>
        <td><strong>${escapeHtml(e.equip_name)}</strong></td>
        <td>${escapeHtml(e.sports_name || 'General')}</td>
        <td>${e.current_stock || e.quantity || 0}</td>
        <td>${status}</td>
      </tr>
    `;
  });
  
  html += `
    </tbody>
  </table>
</div>
`;
  
  return html;
}

// Generate Colleges Section HTML
// Generate Colleges Section HTML
function generateCollegesSection(data) {
  if (!data.data || data.data.length === 0) {
    return `
<div class="print-section">
  <h2 class="print-section-title">🎓 Colleges</h2>
  <p style="color: #6b7280; font-style: italic;">No colleges found.</p>
</div>
`;
  }
  
  let html = `
<div class="print-section">
  <h2 class="print-section-title">🎓 Colleges</h2>
  <div class="data-grid">
`;
  
  data.data.forEach(c => {
    html += `
    <div class="data-card">
      <div class="data-card-title">${escapeHtml(c.college_name)}</div>
      <div class="data-card-meta">
        <div><strong>Code:</strong> ${escapeHtml(c.college_code)}</div>
        ${c.college_dean ? `<div><strong>Dean:</strong> ${escapeHtml(c.college_dean)}</div>` : ''}
        <div><strong>Departments:</strong> ${c.dept_count || 0}</div>
        <div><strong>Students:</strong> ${c.student_count || 0}</div>
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

// Utility Functions
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return 'N/A';
  const date = new Date(dateTimeStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Close print modal when clicking outside
document.addEventListener('click', function(e) {
  const modal = document.getElementById('printModal');
  if (e.target === modal) {
    closePrintModal();
  }
});