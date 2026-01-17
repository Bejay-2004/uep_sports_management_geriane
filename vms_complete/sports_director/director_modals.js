// ==========================================
// MODAL MANAGEMENT
// ==========================================
// ==========================================
// SAFE MODAL CREATION HELPER
// ==========================================

function createModal(modalId, modalHTML) {
  // Remove any existing modal with this ID
  const existing = document.getElementById(modalId);
  if (existing) {
    existing.remove();
  }
  
  // Create new modal
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = modalHTML;
  const modal = tempDiv.firstElementChild;
  
  // Add to body
  document.body.appendChild(modal);
  
  return modal;
}
function closeModal() {
  // Clear umpire assignment modal tracking
  if (window.currentUmpireAssignmentTourId) {
    window.currentUmpireAssignmentTourId = null;
  }
  
  $('#modalContainer').innerHTML = '';
  // Also remove any dynamically added modals
  document.querySelectorAll('.modal').forEach(m => {
    if (m.id !== 'logoutModal') m.remove();
  });
}

// ==========================================
// ATHLETE CONTEXT SELECTION MODAL
// ==========================================

// ==========================================
// GENDER-BASED ATHLETE SELECTION
// JavaScript Code for director_modals.js
// ==========================================
// INSTRUCTIONS:
// 1. Open your director_modals.js file
// 2. Find the function: async function updateContextSportsAndAthletes()
// 3. DELETE the entire function (from 'async function' to its closing '}')
// 4. PASTE THIS ENTIRE CODE in its place
// ==========================================

async function updateContextSportsAndAthletes() {
  const tourId = $('#context_tour_id').value;
  const teamId = $('#context_team_id').value;
  const sportsId = $('#context_sports_id').value;
  const athleteSelect = $('#select_person_id');
  
  // Enable sports dropdown
  $('#context_sports_id').disabled = false;
  
  if (!tourId || !teamId) {
    athleteSelect.disabled = true;
    athleteSelect.innerHTML = '<option value="">Select tournament and team first</option>';
    return;
  }
  
  if (!sportsId) {
    athleteSelect.disabled = true;
    athleteSelect.innerHTML = '<option value="">Select sport first</option>';
    return;
  }
  
  try {
    // Show loading
    athleteSelect.disabled = true;
    athleteSelect.innerHTML = '<option value="">Loading athletes...</option>';
    
    // Fetch eligible athletes with gender filtering
    const response = await fetch(
      `api.php?action=get_team_eligible_athletes&tour_id=${tourId}&team_id=${teamId}&sports_id=${sportsId}`
    );
    const data = await response.json();
    
    if (!data.ok) {
      athleteSelect.innerHTML = '<option value="">Error loading athletes</option>';
      showAlert('Error loading athletes: ' + (data.error || 'Unknown error'), 'danger');
      return;
    }
    
    const athletes = data.athletes || [];
    const genderRequirement = data.gender_requirement;
    
    // Build athlete dropdown with gender indicators
    let html = '<option value="">Select Athlete</option>';
    
    if (athletes.length === 0) {
      if (genderRequirement === 'Male') {
        html = '<option value="">No male athletes available</option>';
      } else if (genderRequirement === 'Female') {
        html = '<option value="">No female athletes available</option>';
      } else {
        html = '<option value="">No athletes available</option>';
      }
    } else {
      athletes.forEach(athlete => {
        const genderIcon = athlete.gender === 'Male' ? '👨' : '👩';
        const collegeName = athlete.college_name || 'No College';
        html += `<option value="${athlete.person_id}">
          ${genderIcon} ${athlete.athlete_name} - ${athlete.gender} (${collegeName})
        </option>`;
      });
    }
    
    athleteSelect.innerHTML = html;
    athleteSelect.disabled = false;
    
    // Show gender requirement message
    showGenderRequirementMessage(genderRequirement);
    
  } catch (error) {
    console.error('Error loading athletes:', error);
    athleteSelect.innerHTML = '<option value="">Error loading athletes</option>';
    showAlert('Failed to load athletes. Please try again.', 'danger');
  }
}

// ==========================================
// NEW HELPER FUNCTION - Add this after updateContextSportsAndAthletes
// This shows a colored message box indicating the sport's gender requirement
// ==========================================

function showGenderRequirementMessage(genderRequirement) {
  // Remove any existing message
  const existingMsg = document.getElementById('genderRequirementMsg');
  if (existingMsg) existingMsg.remove();
  
  if (!genderRequirement) return;
  
  let message = '';
  let bgColor = '';
  let borderColor = '';
  let icon = '';
  
  if (genderRequirement === 'Male') {
    message = 'This sport requires male athletes only';
    bgColor = '#dbeafe';
    borderColor = '#3b82f6';
    icon = '👨';
  } else if (genderRequirement === 'Female') {
    message = 'This sport requires female athletes only';
    bgColor = '#fce7f3';
    borderColor = '#ec4899';
    icon = '👩';
  } else if (genderRequirement === 'Mixed') {
    message = 'This sport accepts both male and female athletes';
    bgColor = '#f3e8ff';
    borderColor = '#a855f7';
    icon = '👥';
  }
  
  if (message) {
    const msgDiv = document.createElement('div');
    msgDiv.id = 'genderRequirementMsg';
    msgDiv.style.cssText = `
      margin-top: 8px;
      padding: 10px 12px;
      background: ${bgColor};
      border: 1px solid ${borderColor};
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #1f2937;
    `;
    msgDiv.innerHTML = `<span style="font-size: 16px;">${icon}</span> <span>${message}</span>`;
    
    // Insert after athlete select
    const athleteGroup = $('#select_person_id').parentElement;
    athleteGroup.appendChild(msgDiv);
  }
}

// ==========================================
// OPTIONAL: Helper function for showing alerts
// Add this if you don't have it already
// ==========================================

function showAlert(message, type = 'info') {
  // If you have an existing alert system, use that instead
  // This is a simple fallback
  const alertDiv = document.createElement('div');
  alertDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'danger' ? '#fee2e2' : '#dbeafe'};
    border: 1px solid ${type === 'danger' ? '#dc2626' : '#3b82f6'};
    border-radius: 6px;
    font-size: 13px;
    z-index: 10000;
    max-width: 400px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  `;
  alertDiv.textContent = message;
  document.body.appendChild(alertDiv);
  
  setTimeout(() => alertDiv.remove(), 5000);
}

// ==========================================
// END OF JAVASCRIPT CODE
// ==========================================

// NOTES:
// 1. Make sure the $ function exists in your code (it's usually defined as: const $ = (selector) => document.querySelector(selector))
// 2. Make sure you have the fetchAPI function defined
// 3. Test thoroughly after implementing
// 4. Clear browser cache (Ctrl+F5) after updating the file

async function showAthleteContextModal() {
  try {
    // Fetch tournaments, teams, sports, and existing athletes
    const [tournaments, teams, sports, athletes] = await Promise.all([
      fetchAPI('tournaments'),
      fetchAPI('teams'),
      fetchAPI('sports'),
      fetchAPI('athletes') // Get all athletes
    ]);
    
    const modal = `
      <div class="modal active" id="athleteContextModal">
        <div class="modal-content" style="max-width: 600px;">
          <div class="modal-header">
            <h3>➕ Add Athlete</h3>
            <button class="modal-close" onclick="closeModal()">×</button>
          </div>
          <form onsubmit="proceedToAthleteSelection(event)" id="contextForm">
            <div class="modal-body">
              
              <!-- Selection Type -->
              <div class="form-group">
                <label class="form-label">Choose Option *</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: #f0f9ff; border: 2px solid #3b82f6; border-radius: 8px; cursor: pointer;">
                    <input type="radio" name="athlete_option" value="existing" checked onchange="toggleAthleteOption()" style="width: 18px; height: 18px; cursor: pointer;">
                    <span style="font-weight: 600; color: #1e40af;">Select Existing</span>
                  </label>
                  <label style="display: flex; align-items: center; gap: 10px; padding: 12px; background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer;">
                    <input type="radio" name="athlete_option" value="new" onchange="toggleAthleteOption()" style="width: 18px; height: 18px; cursor: pointer;">
                    <span style="font-weight: 600; color: #374151;">Create New</span>
                  </label>
                </div>
              </div>
              
              <!-- Existing Athlete Selection -->
              <div id="existingAthleteSection" style="display: block;">
                <div class="form-group">
                  <label class="form-label">Select Athlete *</label>
                  <select class="form-control" name="person_id" id="select_person_id">
                    <option value="">Choose an athlete...</option>
                    ${athletes && athletes.length > 0 ? athletes.map(a => 
                      `<option value="${a.person_id}">
                        ${escapeHtml(a.athlete_name)} - ${escapeHtml(a.college_code || 'N/A')} - ${escapeHtml(a.course || 'N/A')}
                      </option>`
                    ).join('') : '<option value="" disabled>No athletes available</option>'}
                  </select>
                  <small style="color: #6b7280; font-size: 11px; margin-top: 4px; display: block;">
                    🔍 Showing all registered athletes in the system
                  </small>
                </div>
              </div>
              
              <!-- Tournament/Team/Sport Context (always shown) -->
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: var(--text-muted); margin-bottom: 16px; font-size: 13px;">
                📋 Select tournament, team, and sport:
              </p>
              
              <div class="form-group">
                <label class="form-label">Tournament *</label>
                <select class="form-control" name="tour_id" id="context_tour_id" required onchange="updateContextTeams()">
                  <option value="">Select Tournament</option>
                  ${tournaments.filter(t => t.is_active == 1).map(t => 
                    `<option value="${t.tour_id}">${escapeHtml(t.tour_name)} (${escapeHtml(t.school_year)})</option>`
                  ).join('')}
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Team *</label>
                <select class="form-control" name="team_id" id="context_team_id" required disabled onchange="updateContextSports()">
                  <option value="">Select Team</option>
                  ${teams.filter(t => t.is_active == 1).map(t => 
                    `<option value="${t.team_id}" data-tour-id="">${escapeHtml(t.team_name)}</option>`
                  ).join('')}
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Sport *</label>
                <select class="form-control" name="sports_id" id="context_sports_id" required disabled>
                  <option value="">Select Sport</option>
                  ${sports.filter(s => s.is_active == 1).map(s => 
                    `<option value="${s.sports_id}">${escapeHtml(s.sports_name)}</option>`
                  ).join('')}
                </select>
              </div>
            </div>
            
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">
                <span id="submitButtonText">Add Existing Athlete</span> →
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    $('#modalContainer').innerHTML = modal;
    
    // Store data for dynamic updates
    window.contextModalData = { tournaments, teams, sports, athletes };
    
  } catch (error) {
    console.error('Error loading athlete context modal:', error);
    showToast('❌ Error loading form', 'error');
  }
}

function toggleAthleteOption() {
  const option = document.querySelector('input[name="athlete_option"]:checked').value;
  const existingSection = $('#existingAthleteSection');
  const personSelect = $('#select_person_id');
  const submitButton = $('#submitButtonText');
  
  if (option === 'existing') {
    existingSection.style.display = 'block';
    personSelect.required = true;
    submitButton.textContent = 'Add Existing Athlete';
  } else {
    existingSection.style.display = 'none';
    personSelect.required = false;
    submitButton.textContent = 'Create New Athlete';
  }
}

async function updateContextTeams() {
  const tourSelect = $('#context_tour_id');
  const teamSelect = $('#context_team_id');
  const sportsSelect = $('#context_sports_id');
  
  if (!tourSelect.value) {
    teamSelect.disabled = true;
    sportsSelect.disabled = true;
    teamSelect.innerHTML = '<option value="">Select Team</option>';
    sportsSelect.innerHTML = '<option value="">Select Sport</option>';
    return;
  }
  
  try {
    // Fetch teams registered in this tournament
    const tournamentTeams = await fetchAPI('get_tournament_teams', { tour_id: tourSelect.value });
    
    if (!tournamentTeams || tournamentTeams.length === 0) {
      teamSelect.innerHTML = '<option value="">No teams in this tournament</option>';
      teamSelect.disabled = true;
      sportsSelect.disabled = true;
      showToast('⚠️ No teams registered in this tournament yet', 'warning');
      return;
    }
    
    teamSelect.innerHTML = '<option value="">Select Team</option>' +
      tournamentTeams.map(t => 
        `<option value="${t.team_id}">${escapeHtml(t.team_name)}</option>`
      ).join('');
    teamSelect.disabled = false;
    
    // Reset sports
    sportsSelect.innerHTML = '<option value="">Select Sport</option>';
    sportsSelect.disabled = true;
    
  } catch (error) {
    console.error('Error loading teams:', error);
    showToast('❌ Error loading teams', 'error');
  }
}

async function updateContextSports() {
  const tourSelect = $('#context_tour_id');
  const teamSelect = $('#context_team_id');
  const sportsSelect = $('#context_sports_id');
  
  if (!tourSelect.value || !teamSelect.value) {
    sportsSelect.disabled = true;
    sportsSelect.innerHTML = '<option value="">Select Sport</option>';
    return;
  }
  
  try {
    // Fetch sports for this team in this tournament
    const teamSports = await fetchAPI('get_team_sports', { 
      tour_id: tourSelect.value, 
      team_id: teamSelect.value 
    });
    
    if (!teamSports || teamSports.length === 0) {
      sportsSelect.innerHTML = '<option value="">No sports assigned to this team</option>';
      sportsSelect.disabled = true;
      showToast('⚠️ No sports assigned to this team yet', 'warning');
      return;
    }
    
    sportsSelect.innerHTML = '<option value="">Select Sport</option>' +
      teamSports.map(s => 
        `<option value="${s.sports_id}">${escapeHtml(s.sports_name)}</option>`
      ).join('');
    sportsSelect.disabled = false;
    
  } catch (error) {
    console.error('Error loading sports:', error);
    showToast('❌ Error loading sports', 'error');
  }
}

async function proceedToAthleteSelection(event) {
  event.preventDefault();
  
  const form = event.target;
  const option = document.querySelector('input[name="athlete_option"]:checked').value;
  const tourId = form.tour_id.value;
  const teamId = form.team_id.value;
  const sportsId = form.sports_id.value;
  
  if (!tourId || !teamId || !sportsId) {
    showToast('❌ Please select tournament, team, and sport', 'error');
    return;
  }
  
if (option === 'existing') {
  // Add existing athlete to the tournament/team/sport
  const personId = form.person_id.value;
  
  if (!personId) {
    showToast('❌ Please select an athlete', 'error');
    return;
  }
  
  // ========================================
  // GENDER VALIDATION - Prevent gender mismatch
  // ========================================
  try {
    // Get athlete's gender
    const athletesData = window.contextModalData?.athletes || [];
    const selectedAthlete = athletesData.find(a => a.person_id == personId);
    
    // Get sport's gender requirement
    const sportsData = window.contextModalData?.sports || [];
    const selectedSport = sportsData.find(s => s.sports_id == sportsId);
    
if (selectedAthlete && selectedSport && selectedSport.men_women) {
  const athleteGender = selectedAthlete.gender; // "Male" or "Female"
  const sportGender = selectedSport.men_women;   // "Male", "Female", or "Mixed"
  
  console.log('🎯 Validating:', { athleteGender, sportGender }); // DEBUG
  
  // Validate gender match (exact match now!)
  let isValid = false;
  
  if (sportGender === 'Mixed') {
    isValid = true; // Mixed accepts both
  } else if (sportGender === athleteGender) {
    isValid = true; // Exact match: Male→Male or Female→Female ✓
  }
  
  if (!isValid) {
    const athleteIcon = athleteGender === 'Male' ? '👨' : '👩';
    const sportIcon = sportGender === 'Male' ? '👨' : (sportGender === 'Female' ? '👩' : '👥');
    
    showToast(
      `❌ Gender Mismatch: ${athleteIcon} ${athleteGender} athlete cannot be added to ${sportIcon} ${sportGender} sport "${selectedSport.sports_name}"`,
      'error'
    );
    return;
  }
}
  } catch (validationError) {
    console.error('Validation error:', validationError);
  }
  // ========================================
  // END GENDER VALIDATION
  // ========================================
  
  try {
    const result = await fetchAPI('add_existing_athlete', {
      person_id: personId,
      tour_id: tourId,
      team_id: teamId,
      sports_id: sportsId
    }, 'POST');
    
    if (result && result.ok !== false) {
      closeModal();
      showToast('✅ Athlete added successfully', 'success');
      
      // ... rest of success handling
    } else {
      showToast('❌ Error adding athlete: ' + (result?.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error adding existing athlete:', error);
    showToast('❌ Error adding athlete', 'error');
  }
}else {
    // Close context modal and open athlete creation form
    closeModal();
    showAthleteModal(null, tourId, teamId, sportsId);
  }
}

// ==========================================
// COMPREHENSIVE TOURNAMENT VIEW
// ==========================================

async function showComprehensiveTournamentView(tourId) {
  try {
    const data = await fetchAPI('get_tournament_comprehensive', { tour_id: tourId });
    
    if (!data || !data.ok) {
      showToast('Error loading tournament data', 'error');
      return;
    }
    
    const tournament = data.tournament;
    let teams = data.teams;
    
    // Apply team filter if selected
    if (window.currentFilters && window.currentFilters.team) {
      teams = teams.filter(t => t.team_id == window.currentFilters.team);
    }
    
    // Apply sport filter if selected - filter sports within each team
    if (window.currentFilters && window.currentFilters.sport) {
      teams = teams.map(team => ({
        ...team,
        sports: team.sports.filter(s => s.sports_id == window.currentFilters.sport)
      })).filter(team => team.sports.length > 0); // Remove teams with no matching sports
    }
    
    // Calculate total statistics (after filtering)
    let totalAthletes = 0;
    let totalSports = 0;
    const sportsSet = new Set();
    
    teams.forEach(team => {
      team.sports.forEach(sport => {
        sportsSet.add(sport.sports_id);
        totalAthletes += sport.athletes.length;
      });
      totalSports += team.sports.length;
    });
    
    // Show filter indicator if filters are active
    let filterIndicator = '';
    if (window.currentFilters) {
      const activeFilters = [];
      if (window.currentFilters.team) activeFilters.push('Team filtered');
      if (window.currentFilters.sport) activeFilters.push('Sport filtered');
      if (activeFilters.length > 0) {
        filterIndicator = `<div style="background: #fef3c7; padding: 8px 12px; border-radius: 6px; margin-bottom: 16px; font-size: 13px; color: #92400e;">
          🔍 Active filters: ${activeFilters.join(', ')}
        </div>`;
      }
    }
    
    let html = `
      <div class="modal active" id="comprehensiveModal" style="overflow-y: auto;">
        <div class="modal-content" style="max-width: 1200px; max-height: 90vh;">
          <div class="modal-header">
            <h3>📋 ${escapeHtml(tournament.tour_name)} - Complete Overview</h3>
            <button class="modal-close" onclick="closeModal()">×</button>
          </div>
          <div class="modal-body" style="padding: 20px;">
            
            ${filterIndicator}
            
            <!-- Tournament Info Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 12px; color: white; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
              <h2 style="margin: 0 0 12px 0; font-size: 28px; font-weight: 700;">${escapeHtml(tournament.tour_name)}</h2>
              <p style="margin: 0 0 16px 0; opacity: 0.9; font-size: 14px;">School Year ${escapeHtml(tournament.school_year)}</p>
              
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-top: 20px;">
                <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 14px; border-radius: 10px;">
                  <div style="opacity: 0.9; font-size: 12px; margin-bottom: 4px;">📅 Tournament Date</div>
                  <div style="font-size: 18px; font-weight: 600;">${escapeHtml(tournament.tour_date || 'TBD')}</div>
                </div>
                <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 14px; border-radius: 10px;">
                  <div style="opacity: 0.9; font-size: 12px; margin-bottom: 4px;">🏆 Teams</div>
                  <div style="font-size: 18px; font-weight: 600;">${teams.length}</div>
                </div>
                <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 14px; border-radius: 10px;">
                  <div style="opacity: 0.9; font-size: 12px; margin-bottom: 4px;">⚽ Sports</div>
                  <div style="font-size: 18px; font-weight: 600;">${sportsSet.size}</div>
                </div>
                <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 14px; border-radius: 10px;">
                  <div style="opacity: 0.9; font-size: 12px; margin-bottom: 4px;">👥 Athletes</div>
                  <div style="font-size: 18px; font-weight: 600;">${totalAthletes}</div>
                </div>
                <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 14px; border-radius: 10px;">
                  <div style="opacity: 0.9; font-size: 12px; margin-bottom: 4px;">Status</div>
                  <div style="font-size: 18px; font-weight: 600;">${tournament.is_active == 1 ? '✅ Active' : '⏸️ Inactive'}</div>
                </div>
              </div>
            </div>
    `;
    
    if (teams.length === 0) {
      html += '<div class="empty-state" style="padding: 60px 20px; text-align: center; color: #9ca3af;">No teams match the selected filters.</div>';
    } else {
      // Render each team
      teams.forEach((team, teamIdx) => {
        const teamTotalAthletes = team.sports.reduce((sum, sport) => sum + sport.athletes.length, 0);
        
        html += `
          <div style="background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #f3f4f6;">
              <div>
                <h3 style="margin: 0 0 6px 0; font-size: 22px; color: #111827; font-weight: 700;">
                  🏆 ${escapeHtml(team.team_name)}
                </h3>
                <p style="margin: 0; font-size: 13px; color: #6b7280;">
                  Registered: ${escapeHtml(team.registration_date || 'N/A')}
                </p>
              </div>
              <div style="text-align: right;">
                <div style="background: #f3f4f6; padding: 8px 16px; border-radius: 8px; display: inline-block;">
                  <div style="font-size: 11px; color: #6b7280; margin-bottom: 2px;">Total Athletes</div>
                  <div style="font-size: 20px; font-weight: 700; color: #111827;">${teamTotalAthletes}</div>
                </div>
              </div>
            </div>
        `;
        
        if (team.sports.length === 0) {
          html += '<div style="padding: 30px; text-align: center; color: #9ca3af; background: #f9fafb; border-radius: 8px;">No sports assigned to this team yet.</div>';
        } else {
          // Render each sport
          team.sports.forEach((sport, sportIdx) => {
            const totalAthletes = sport.athletes.length;
            const captains = sport.athletes.filter(a => a.is_captain).length;
            
            html += `
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; margin-bottom: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                  <h4 style="margin: 0; font-size: 18px; color: #374151; font-weight: 600;">
                    ⚽ ${escapeHtml(sport.sports_name)}
                  </h4>
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <span style="background: white; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; color: #6b7280; border: 1px solid #e5e7eb;">
                      ${totalAthletes} Athlete${totalAthletes !== 1 ? 's' : ''}
                    </span>
                    ${captains > 0 ? `<span style="background: #fef3c7; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; color: #92400e; border: 1px solid #fde68a;">⭐ ${captains} Captain${captains !== 1 ? 's' : ''}</span>` : ''}
                  </div>
                </div>
                
                <!-- Staff Section -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 16px; padding: 16px; background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
                  <div>
                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px; font-weight: 600;">👨‍🏫 HEAD COACH</div>
                    <div style="font-size: 13px; font-weight: 600; color: ${sport.coach_name ? '#111827' : '#9ca3af'};">${escapeHtml(sport.coach_name || 'Not assigned')}</div>
                  </div>
                  <div>
                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px; font-weight: 600;">👨‍💼 ASSISTANT COACH</div>
                    <div style="font-size: 13px; font-weight: 600; color: ${sport.asst_coach_name ? '#111827' : '#9ca3af'};">${escapeHtml(sport.asst_coach_name || 'Not assigned')}</div>
                  </div>
                  <div>
                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px; font-weight: 600;">🎯 TOURNAMENT MANAGER</div>
                    <div style="font-size: 13px; font-weight: 600; color: ${sport.tournament_manager_name ? '#111827' : '#9ca3af'};">${escapeHtml(sport.tournament_manager_name || 'Not assigned')}</div>
                  </div>
                </div>
                
                <!-- Trainors -->
                ${sport.trainor1_name || sport.trainor2_name || sport.trainor3_name ? `
                  <div style="padding: 12px 16px; background: white; border-radius: 8px; margin-bottom: 16px; border: 1px solid #e5e7eb;">
                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px; font-weight: 600;">🏋️ TRAINORS</div>
                    <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                      ${sport.trainor1_name ? `<span style="font-size: 13px; color: #111827; font-weight: 500;">• ${escapeHtml(sport.trainor1_name)}</span>` : ''}
                      ${sport.trainor2_name ? `<span style="font-size: 13px; color: #111827; font-weight: 500;">• ${escapeHtml(sport.trainor2_name)}</span>` : ''}
                      ${sport.trainor3_name ? `<span style="font-size: 13px; color: #111827; font-weight: 500;">• ${escapeHtml(sport.trainor3_name)}</span>` : ''}
                    </div>
                  </div>
                ` : ''}
                
                <!-- Athletes Roster -->
                <div style="background: white; border-radius: 8px; padding: 16px; border: 1px solid #e5e7eb;">
                  <h5 style="margin: 0 0 12px 0; font-size: 14px; color: #374151; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">👥 Athletes Roster</h5>
                  ${sport.athletes.length === 0 ? 
                    '<div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 13px; background: #f9fafb; border-radius: 6px;">No athletes registered yet</div>' :
                    `<div style="display: grid; gap: 10px;">
                      ${sport.athletes.map(athlete => {
                        const age = athlete.date_birth ? new Date().getFullYear() - new Date(athlete.date_birth).getFullYear() : null;
                        return `
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; transition: all 0.2s;">
                          <div style="flex: 1;">
                            <div style="font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 4px;">
                              ${athlete.is_captain ? '⭐ ' : ''}${escapeHtml(athlete.athlete_name)}
                              ${athlete.is_captain ? '<span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 10px; margin-left: 6px; font-weight: 700;">CAPTAIN</span>' : ''}
                            </div>
                            <div style="font-size: 12px; color: #6b7280; display: flex; gap: 12px; flex-wrap: wrap;">
                              <span>🏫 ${escapeHtml(athlete.college_code || 'N/A')}</span>
                              <span>📚 ${escapeHtml(athlete.course || 'N/A')}</span>
                              ${age ? `<span>🎂 ${age} yrs</span>` : ''}
                              ${athlete.scholarship_name ? `<span>🎓 ${escapeHtml(athlete.scholarship_name)}</span>` : ''}
                            </div>
                          </div>
                          <div style="display: flex; gap: 12px; font-size: 12px; color: #6b7280; font-weight: 500;">
                            ${athlete.height && athlete.height > 0 ? `<span style="background: white; padding: 4px 10px; border-radius: 6px; border: 1px solid #e5e7eb;">📏 ${athlete.height}cm</span>` : ''}
                            ${athlete.weight && athlete.weight > 0 ? `<span style="background: white; padding: 4px 10px; border-radius: 6px; border: 1px solid #e5e7eb;">⚖️ ${athlete.weight}kg</span>` : ''}
                          </div>
                        </div>
                      `}).join('')}
                    </div>`
                  }
                </div>
              </div>
            `;
          });
        }
        
        html += '</div>'; // Close team card
      });
    }
    
    html += `
          </div>
          <div class="modal-footer" style="background: #f9fafb;">
            <button class="btn btn-primary" onclick="printTournamentOverview()">
              🖨️ Print Overview
            </button>
            <button class="btn btn-secondary" onclick="closeModal()">Close</button>
          </div>
        </div>
      </div>
    `;
    
    $('#modalContainer').innerHTML = html;
    
  } catch (error) {
    console.error('Error in showComprehensiveTournamentView:', error);
    showToast('Error loading comprehensive view', 'error');
  }
}

function printTournamentOverview() {
  window.print();
}

// ==========================================
// CREATE TEAM MODAL
// ==========================================

function showCreateTeamModal(tourId) {
  const modal = `
    <div class="modal active" id="createTeamModal">
      <div class="modal-content modal-sm">
        <div class="modal-header">
          <h3>➕ Create New Team</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <form onsubmit="createAndAddTeam(event, ${tourId})" id="createTeamForm">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Team Name *</label>
              <input type="text" class="form-control" name="team_name" placeholder="e.g., Phoenix Warriors" required autofocus>
            </div>
            <div style="padding: 14px; background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 6px; font-size: 12px; color: #1e40af; line-height: 1.6;">
              <strong>💡 Tip:</strong> Choose a unique team name. This team will be automatically added to the tournament after creation.
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Create & Add Team</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  // Remove existing modal and add new one
  closeModal();
const tempDiv = document.createElement('div');
tempDiv.innerHTML = modal;  // ✅ Use 'modal' instead of 'modalHTML'
document.body.appendChild(tempDiv.firstElementChild);
}

async function createAndAddTeam(event, tourId) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const teamName = formData.get('team_name').trim();
  const schoolId = formData.get('school_id'); // This is "" if not selected
  
  if (!teamName) {
    showToast('Please enter a team name', 'error');
    return;
  }
  
  try {
    // ✅ FIX: Convert empty string to null
    const createResult = await fetchAPI('create_team', { 
      team_name: teamName,
      school_id: schoolId && schoolId !== '' ? parseInt(schoolId) : null, // ✅ This is the fix!
      is_active: formData.get('is_active') ? 1 : 0
    }, 'POST');
    
    if (createResult && createResult.ok) {
      // Then add it to the tournament
      const addResult = await fetchAPI('add_team_to_tournament', { 
        tour_id: tourId, 
        team_id: createResult.team_id 
      }, 'POST');
      
      if (addResult && addResult.ok) {
        closeModal();
        loadTournamentTeams(tourId);
        showToast(`✅ Team "${teamName}" created and added to tournament!`, 'success');
        
        // Trigger event
        DashboardEvents.trigger(EVENTS.TEAM_CREATED, { 
          team_id: createResult.team_id, 
          team_name: teamName 
        });
      } else {
        showToast('⚠️ Team created but failed to add to tournament', 'error');
      }
    } else {
      showToast('❌ Error creating team: ' + (createResult?.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error creating team:', error);
    showToast('❌ Error creating team', 'error');
  }
}

// ==========================================
// CREATE TEAM MODAL (COMPLETE WITH ALL FIELDS)
// ==========================================

async function showCreateTeamModal(tourId) {
  // Fetch schools for dropdown
  const schools = await fetchAPI('schools') || [];
  
  const modal = `
    <div class="modal active" id="createTeamModal">
      <div class="modal-content" style="max-width: 700px;">
        <div class="modal-header">
          <h3>➕ Create New Team</h3>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <form onsubmit="createAndAddTeam(event, ${tourId})" id="createTeamForm">
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
            <h4 class="modal-section-title">👤 Team Contact & Management</h4>
            
            <div style="padding: 12px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 16px;">
              <p style="font-size: 12px; color: #6b7280; margin: 0; line-height: 1.5;">
                <strong>Note:</strong> Coaches, managers, and other staff can be assigned later when adding sports to this team.
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
            
            <!-- Tournament Auto-Add Notice -->
            <div style="padding: 14px; background: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 6px; margin-top: 16px;">
              <div style="display: flex; gap: 10px;">
                <span style="font-size: 20px;">ℹ️</span>
                <div>
                  <strong style="color: #1e40af; font-size: 13px; display: block; margin-bottom: 4px;">Automatic Tournament Registration</strong>
                  <p style="font-size: 12px; color: #1e3a8a; margin: 0; line-height: 1.5;">
                    This team will be automatically registered to the selected tournament after creation. You can then add sports and athletes to the team.
                  </p>
                </div>
              </div>
            </div>
            
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" style="min-width: 180px;">
              ➕ Create Team & Register
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
// Remove existing modal and add new one
closeModal();
const tempDiv = document.createElement('div');
tempDiv.innerHTML = modal;  // ✅ Use 'modal' variable, not 'modalHTML'
document.body.appendChild(tempDiv.firstElementChild);
}

// ==========================================
// LOAD COURSES FOR SELECTED COLLEGE
// ==========================================
async function loadCoursesForCollege(collegeCode, selectedCourse = '') {
  const courseSelect = document.getElementById('athlete_course_select');
  
  if (!courseSelect) return;
  
  // If no college selected, disable and reset
  if (!collegeCode || collegeCode === '') {
    courseSelect.innerHTML = '<option value="">Select college first</option>';
    courseSelect.disabled = true;
    return;
  }
  
  try {
    // Show loading state
    courseSelect.innerHTML = '<option value="">Loading courses...</option>';
    courseSelect.disabled = true;
    
    // Fetch courses for this college
    const response = await fetch(`api.php?action=courses`);
    const allCourses = await response.json();
    
    if (!allCourses || !Array.isArray(allCourses)) {
      courseSelect.innerHTML = '<option value="">Error loading courses</option>';
      return;
    }
    
    // Fetch departments to map college → departments → courses
    const deptResponse = await fetch(`api.php?action=departments`);
    const allDepartments = await deptResponse.json();
    
    if (!allDepartments || !Array.isArray(allDepartments)) {
      courseSelect.innerHTML = '<option value="">Error loading departments</option>';
      return;
    }
    
    // Get department IDs for this college
    const collegeDepts = allDepartments.filter(d => 
      d.college_code === collegeCode && d.is_active == 1
    );
    const deptIds = collegeDepts.map(d => d.dept_id);
    
    // Filter courses that belong to these departments
    const collegeCourses = allCourses.filter(c => 
      deptIds.includes(c.dept_id) && c.is_active == 1
    );
    
    // Build dropdown options
    if (collegeCourses.length === 0) {
      courseSelect.innerHTML = '<option value="">No courses available for this college</option>';
      courseSelect.disabled = true;
    } else {
      let html = '<option value="">Select Course</option>';
      collegeCourses.forEach(course => {
        const isSelected = selectedCourse && (
          course.course_code === selectedCourse || 
          course.course_name === selectedCourse
        );
        html += `<option value="${escapeHtml(course.course_code)}" ${isSelected ? 'selected' : ''}>
          ${escapeHtml(course.course_code)} - ${escapeHtml(course.course_name)}
        </option>`;
      });
      courseSelect.innerHTML = html;
      courseSelect.disabled = false;
    }
    
  } catch (error) {
    console.error('Error loading courses:', error);
    courseSelect.innerHTML = '<option value="">Error loading courses</option>';
    courseSelect.disabled = true;
  }
}

// ==========================================
// ENHANCED ATHLETE MODAL
// ==========================================

// ==========================================
// UPDATED: Enhanced Athlete Modal with Cascading Dropdowns
// College → Department → Course
// Replace the showAthleteModal function in director_modals.js (around line 995)
// ==========================================

// ==========================================
// UPDATED: Enhanced Athlete Modal with Cascading Dropdowns
// College → Department → Course
// Replace the showAthleteModal function in director_modals.js (around line 995)
// ==========================================

async function showAthleteModal(athlete = null, tourId = null, teamId = null, sportsId = null) {
  const isEdit = athlete !== null;
  const title = isEdit ? 'Edit Athlete' : 'Create New Athlete';
  
  // Fetch colleges for dropdown
  const colleges = await fetchAPI('colleges') || [];
  
  // If creating and context is provided, use it
  const contextTourId = isEdit ? (athlete.tour_id || currentContext.tour_id) : (tourId || currentContext.tour_id);
  const contextTeamId = isEdit ? (athlete.team_id || currentContext.team_id) : (teamId || currentContext.team_id);
  const contextSportsId = isEdit ? (athlete.sports_id || currentContext.sports_id) : (sportsId || currentContext.sports_id);
  
  const modalHTML = `
    <div class="modal active" id="athleteModal" style="z-index: 10001;">
      <div class="modal-content" style="max-width: 700px;">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="closeModal('athleteModal')">×</button>
        </div>
        <form onsubmit="saveAthlete(event, ${isEdit ? athlete.person_id : 'null'}, ${isEdit ? athlete.team_ath_id : 'null'}, ${contextTourId}, ${contextTeamId}, ${contextSportsId})" id="athleteForm">
          <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
            
            <!-- Personal Information -->
            <h4 class="modal-section-title">👤 Personal Information</h4>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
              <div class="form-group">
                <label class="form-label">Last Name *</label>
                <input type="text" class="form-control" name="l_name" value="${escapeHtml(athlete?.l_name || '')}" required>
              </div>
              
              <div class="form-group">
                <label class="form-label">First Name *</label>
                <input type="text" class="form-control" name="f_name" value="${escapeHtml(athlete?.f_name || '')}" required>
              </div>
              
              <div class="form-group">
                <label class="form-label">Middle Name</label>
                <input type="text" class="form-control" name="m_name" value="${escapeHtml(athlete?.m_name || '')}">
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
              <div class="form-group">
                <label class="form-label">Title</label>
                <input type="text" class="form-control" name="title" value="${escapeHtml(athlete?.title || '')}" placeholder="e.g., Mr., Ms., Jr.">
              </div>
              
              <div class="form-group">
                <label class="form-label">Gender *</label>
                <select class="form-control" name="gender" required>
                  <option value="">Select Gender</option>
                  <option value="Male" ${athlete?.gender === 'Male' ? 'selected' : ''}>👨 Male</option>
                  <option value="Female" ${athlete?.gender === 'Female' ? 'selected' : ''}>👩 Female</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Date of Birth</label>
                <input type="date" class="form-control" name="date_birth" value="${athlete?.date_birth || ''}">
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Blood Type</label>
              <select class="form-control" name="blood_type">
                <option value="">Select Blood Type</option>
                <option value="A+" ${athlete?.blood_type === 'A+' ? 'selected' : ''}>A+</option>
                <option value="A-" ${athlete?.blood_type === 'A-' ? 'selected' : ''}>A-</option>
                <option value="B+" ${athlete?.blood_type === 'B+' ? 'selected' : ''}>B+</option>
                <option value="B-" ${athlete?.blood_type === 'B-' ? 'selected' : ''}>B-</option>
                <option value="AB+" ${athlete?.blood_type === 'AB+' ? 'selected' : ''}>AB+</option>
                <option value="AB-" ${athlete?.blood_type === 'AB-' ? 'selected' : ''}>AB-</option>
                <option value="O+" ${athlete?.blood_type === 'O+' ? 'selected' : ''}>O+</option>
                <option value="O-" ${athlete?.blood_type === 'O-' ? 'selected' : ''}>O-</option>
              </select>
            </div>
            
            <!-- Academic Information with Cascading Dropdowns -->
            <h4 class="modal-section-title">🎓 Academic Information</h4>
            
            <div class="form-group">
              <label class="form-label">College</label>
              <select class="form-control" name="college_code" id="athlete_college_select" onchange="loadDepartmentsForCollege(this.value)">
                <option value="">Select College (Optional)</option>
                ${colleges.map(c => `
                  <option value="${escapeHtml(c.college_code)}" ${athlete?.college_code === c.college_code ? 'selected' : ''}>
                    ${escapeHtml(c.college_name)} (${escapeHtml(c.college_code)})
                  </option>
                `).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Department</label>
              <select class="form-control" name="dept_id" id="athlete_department_select" onchange="loadCoursesForDepartment(this.value)" disabled>
                <option value="">Select college first</option>
              </select>
              <small style="display: block; margin-top: 4px; color: #6b7280; font-size: 11px;">
                💡 Select a college above to see available departments
              </small>
            </div>
            
            <div class="form-group">
              <label class="form-label">Course/Program</label>
              <select class="form-control" name="course" id="athlete_course_select" disabled>
                <option value="">Select department first</option>
              </select>
              <small style="display: block; margin-top: 4px; color: #6b7280; font-size: 11px;">
                📚 Select a department above to see available courses
              </small>
            </div>
            
            <!-- Physical Information -->
            <h4 class="modal-section-title">📏 Physical Information</h4>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div class="form-group">
                <label class="form-label">Height (cm)</label>
                <input type="number" class="form-control" name="height" value="${athlete?.height || ''}" step="0.1" min="0" placeholder="e.g., 170">
              </div>
              
              <div class="form-group">
                <label class="form-label">Weight (kg)</label>
                <input type="number" class="form-control" name="weight" value="${athlete?.weight || ''}" step="0.1" min="0" placeholder="e.g., 65">
              </div>
            </div>
            
            <!-- Scholarship Information -->
            <h4 class="modal-section-title">🎓 Scholarship Information</h4>
            
            <div class="form-group">
              <label class="form-label">Scholarship Type</label>
              <select class="form-control" name="scholarship_name">
                <option value="">No Scholarship</option>
                <option value="Varsity" ${athlete?.scholarship_name === 'Varsity' ? 'selected' : ''}>Varsity</option>
                <option value="Academic" ${athlete?.scholarship_name === 'Academic' ? 'selected' : ''}>Academic</option>
                <option value="Athletic" ${athlete?.scholarship_name === 'Athletic' ? 'selected' : ''}>Athletic</option>
                <option value="Full" ${athlete?.scholarship_name === 'Full' ? 'selected' : ''}>Full Scholarship</option>
                <option value="Partial" ${athlete?.scholarship_name === 'Partial' ? 'selected' : ''}>Partial Scholarship</option>
              </select>
            </div>
            
            <!-- Team Role -->
            ${!isEdit ? `
              <h4 class="modal-section-title">⭐ Team Role</h4>
              
              <div class="form-group">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 12px; background: #fef3c7; border-radius: 8px; border: 1px solid #fbbf24;">
                  <input type="checkbox" name="is_captain" value="1" style="width: 20px; height: 20px; cursor: pointer;">
                  <div>
                    <div style="font-weight: 600; color: #92400e;">Team Captain</div>
                    <div style="font-size: 11px; color: #78350f; margin-top: 2px;">Check if this athlete will be the team captain</div>
                  </div>
                </label>
              </div>
            ` : ''}
            
            ${isEdit ? `<input type="hidden" name="person_id" value="${athlete.person_id}">` : ''}
            ${isEdit && athlete.team_ath_id ? `<input type="hidden" name="team_ath_id" value="${athlete.team_ath_id}">` : ''}
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal('athleteModal')">Cancel</button>
            <button type="submit" class="btn btn-primary">
              ${isEdit ? '💾 Update' : '➕ Create'} Athlete
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = modalHTML;
  document.body.appendChild(tempDiv.firstElementChild);
  
  // If editing and athlete has academic info, load the cascading dropdowns
  if (athlete && athlete.college_code) {
    setTimeout(async () => {
      // Load departments for the athlete's college
      await loadDepartmentsForCollege(athlete.college_code);
      
      // If athlete has a department, load courses
      if (athlete.dept_id) {
        setTimeout(async () => {
          await loadCoursesForDepartment(athlete.dept_id);
          
          // Set the selected course
          if (athlete.course) {
            setTimeout(() => {
              const courseSelect = document.getElementById('athlete_course_select');
              if (courseSelect) {
                courseSelect.value = athlete.course;
              }
            }, 100);
          }
        }, 100);
      }
    }, 100);
  }
}


// ==========================================
// NEW FUNCTION: Load Departments for Selected College
// Add this function in director_modals.js
// ==========================================

// ==========================================
// FIXED: Load Departments for Selected College
// Replace around line 1250 in director_modals.js
// ==========================================

async function loadDepartmentsForCollege(collegeCode) {
  const departmentSelect = document.getElementById('athlete_department_select');
  const courseSelect = document.getElementById('athlete_course_select');
  
  console.log('🎯 loadDepartmentsForCollege called with:', collegeCode);
  
  if (!departmentSelect) {
    console.error('❌ Department select element not found!');
    return;
  }
  
  // Reset course dropdown
  if (courseSelect) {
    courseSelect.innerHTML = '<option value="">Select department first</option>';
    courseSelect.disabled = true;
  }
  
  // If no college selected, disable and reset
  if (!collegeCode || collegeCode === '') {
    departmentSelect.innerHTML = '<option value="">Select college first</option>';
    departmentSelect.disabled = true;
    return;
  }
  
  try {
    // Show loading state
    departmentSelect.innerHTML = '<option value="">Loading departments...</option>';
    departmentSelect.disabled = true;
    
    // Fetch colleges and departments in parallel
    const [collegesResponse, departmentsResponse] = await Promise.all([
      fetchAPI('colleges'),
      fetchAPI('get_departments')
    ]);
    
    // ✅ FIX: Handle different response formats
    let colleges = Array.isArray(collegesResponse) ? collegesResponse : [];
    let departments = Array.isArray(departmentsResponse) ? departmentsResponse : [];
    
    console.log('📊 Fetched data:', {
      colleges: colleges.length,
      departments: departments.length,
      selectedCollegeCode: collegeCode
    });
    
    // Find the selected college
    const selectedCollege = colleges.find(c => c.college_code === collegeCode);
    
    if (!selectedCollege) {
      console.error('❌ College not found for code:', collegeCode);
      departmentSelect.innerHTML = '<option value="">Error: College not found</option>';
      return;
    }
    
    const collegeId = selectedCollege.college_id;
    
    console.log('✅ Found college:', {
      college_code: selectedCollege.college_code,
      college_id: collegeId,
      college_name: selectedCollege.college_name
    });
    
    // Filter departments for this college
    const collegeDepartments = departments.filter(d => {
      const matches = d.college_id == collegeId && d.is_active == 1;
      console.log(`Checking dept ${d.dept_code}:`, {
        dept_college_id: d.college_id,
        target_college_id: collegeId,
        is_active: d.is_active,
        matches: matches
      });
      return matches;
    });
    
    console.log('🏫 Filtered departments:', {
      collegeCode: collegeCode,
      collegeId: collegeId,
      totalDepartments: departments.length,
      filteredDepartments: collegeDepartments.length,
      departments: collegeDepartments
    });
    
    // Build dropdown options
    if (collegeDepartments.length === 0) {
      departmentSelect.innerHTML = '<option value="">No departments available for this college</option>';
      departmentSelect.disabled = true;
      console.warn('⚠️ No departments found for college:', collegeCode);
    } else {
      let html = '<option value="">Select Department</option>';
      collegeDepartments.forEach(dept => {
        html += `<option value="${dept.dept_id}">
          ${escapeHtml(dept.dept_code)} - ${escapeHtml(dept.dept_name)}
        </option>`;
      });
      departmentSelect.innerHTML = html;
      departmentSelect.disabled = false;
      console.log('✅ Department dropdown populated with', collegeDepartments.length, 'departments');
    }
    
  } catch (error) {
    console.error('❌ Error loading departments:', error);
    departmentSelect.innerHTML = '<option value="">Error loading departments</option>';
    departmentSelect.disabled = true;
  }
}

// ==========================================
// NEW FUNCTION: Load Courses for Selected Department
// Add this function in director_modals.js
// ==========================================

// ==========================================
// FIXED: Load Courses for Selected Department
// Replace around line 1340 in director_modals.js
// ==========================================

async function loadCoursesForDepartment(deptId) {
  const courseSelect = document.getElementById('athlete_course_select');
  
  console.log('🎯 loadCoursesForDepartment called with:', deptId);
  
  if (!courseSelect) {
    console.error('❌ Course select element not found!');
    return;
  }
  
  // If no department selected, disable and reset
  if (!deptId || deptId === '') {
    courseSelect.innerHTML = '<option value="">Select department first</option>';
    courseSelect.disabled = true;
    return;
  }
  
  try {
    // Show loading state
    courseSelect.innerHTML = '<option value="">Loading courses...</option>';
    courseSelect.disabled = true;
    
    // Fetch all courses
    const response = await fetchAPI('get_courses');
    
    // ✅ FIX: Handle different response formats
    let courses = [];
    
    if (Array.isArray(response)) {
      // Response is already an array
      courses = response;
    } else if (response && response.ok !== false && Array.isArray(response.courses)) {
      // Response is an object with courses array
      courses = response.courses;
    } else if (response && response.ok !== false) {
      // Response might be the data itself
      courses = Object.values(response).filter(item => 
        item && typeof item === 'object' && item.course_id
      );
    } else {
      console.error('❌ Invalid response format:', response);
      courseSelect.innerHTML = '<option value="">Error loading courses</option>';
      courseSelect.disabled = true;
      return;
    }
    
    console.log('📊 Fetched courses:', {
      total: courses.length,
      selectedDeptId: deptId,
      sampleCourse: courses[0]
    });
    
    // Filter courses for this department
    const departmentCourses = courses.filter(c => {
      if (!c || !c.dept_id) return false;
      
      const matches = c.dept_id == deptId;
      
      console.log(`Checking course ${c.course_code}:`, {
        course_dept_id: c.dept_id,
        target_dept_id: deptId,
        matches: matches
      });
      
      return matches;
    });
    
    console.log('📚 Filtered courses:', {
      deptId: deptId,
      totalCourses: courses.length,
      filteredCourses: departmentCourses.length,
      courses: departmentCourses
    });
    
    // Build dropdown options
    if (departmentCourses.length === 0) {
      courseSelect.innerHTML = '<option value="">No courses available for this department</option>';
      courseSelect.disabled = true;
      console.warn('⚠️ No courses found for department:', deptId);
    } else {
      let html = '<option value="">Select Course</option>';
      departmentCourses.forEach(course => {
        html += `<option value="${escapeHtml(course.course_code)}">
          ${escapeHtml(course.course_code)} - ${escapeHtml(course.course_name)}
        </option>`;
      });
      courseSelect.innerHTML = html;
      courseSelect.disabled = false;
      console.log('✅ Course dropdown populated with', departmentCourses.length, 'courses');
    }
    
  } catch (error) {
    console.error('❌ Error loading courses:', error);
    courseSelect.innerHTML = '<option value="">Error loading courses</option>';
    courseSelect.disabled = true;
  }
} 

// Replace the saveAthlete function in director_modals.js with this enhanced version

// ==========================================
// UPDATED: saveAthlete function with dept_id
// Replace the existing saveAthlete function in director_modals.js (around line 1172)
// ==========================================

// ==========================================
// CORRECTED: saveAthlete function (NO dept_id)
// The person table doesn't have dept_id column
// Replace the existing saveAthlete function in director_modals.js (around line 1172)
// ==========================================

async function saveAthlete(event, personId, teamAthId, tourId, teamId, sportsId) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  
  const data = {
    l_name: formData.get('l_name'),
    f_name: formData.get('f_name'),
    m_name: formData.get('m_name'),
    title: formData.get('title'),
    date_birth: formData.get('date_birth'),
    gender: formData.get('gender'),
    college_code: formData.get('college_code'),
    course: formData.get('course'),              // ← Save course code
    // dept_id is NOT saved - person table doesn't have this column
    // Department dropdown is only used to filter courses
    blood_type: formData.get('blood_type'),
    height: formData.get('height') || null,
    weight: formData.get('weight') || null,
    scholarship_name: formData.get('scholarship_name') || '',
    is_captain: formData.get('is_captain') ? 1 : 0
  };
  
  console.log('💾 Saving athlete:', data);
  
  try {
    let result;
    
    if (personId) {
      // Update existing athlete
      data.person_id = personId;
      if (teamAthId) data.team_ath_id = teamAthId;
      if (tourId) data.tour_id = tourId;
      result = await fetchAPI('update_athlete', data, 'POST');
    } else {
      // Create new athlete
      data.tour_id = tourId;
      data.team_id = teamId;
      data.sports_id = sportsId;
      result = await fetchAPI('create_athlete', data, 'POST');
    }
    
    console.log('📥 Save result:', result);
    
    if (result && result.ok !== false) {
      closeModal('athleteModal');
      
      // Check which modal/view is currently open and reload appropriately
      const sportAthletesModal = document.getElementById('sportAthletesModal');
      
      if (sportAthletesModal && tourId && teamId && sportsId) {
        // We're in the sport athletes modal - reload that list
        await loadSportAthletes(tourId, teamId, sportsId);
      }
      
      // If new athlete was created, show account credentials
      if (!personId && result.username && result.default_password) {
        showAccountCredentialsModal(
          data.f_name + ' ' + data.l_name,
          result.username,
          result.default_password
        );
      } else {
        showToast(personId ? '✅ Athlete updated successfully' : '✅ Athlete created successfully', 'success');
      }
      
      // Trigger events
      if (personId) {
        DashboardEvents.trigger(EVENTS.ATHLETE_UPDATED, { person_id: personId, ...data });
      } else {
        DashboardEvents.trigger(EVENTS.ATHLETE_CREATED, { person_id: result.person_id, ...data });
      }
    } else {
      showToast('❌ ' + (result?.error || 'Error saving athlete'), 'error');
    }
  } catch (error) {
    console.error('Error saving athlete:', error);
    showToast('❌ Error saving athlete: ' + error.message, 'error');
  }
}

// New function to show account credentials
function showAccountCredentialsModal(athleteName, username, password) {
  const modal = `
    <div class="modal active" id="credentialsModal">
      <div class="modal-content modal-sm">
        <div class="modal-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
          <h3 style="color: white;">✅ Athlete Account Created</h3>
          <button class="modal-close" onclick="closeModal('credentialsModal')" style="color: white;">×</button>
        </div>
        <div class="modal-body" style="padding: 24px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
            <h4 style="margin: 0 0 8px 0; font-size: 18px; color: #111827;">Account Successfully Created!</h4>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">for <strong>${escapeHtml(athleteName)}</strong></p>
          </div>
          
          <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h5 style="margin: 0 0 16px 0; font-size: 14px; color: #065f46; font-weight: 700; text-transform: uppercase;">Login Credentials</h5>
            
            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 11px; color: #047857; margin-bottom: 6px; font-weight: 600;">USERNAME</label>
              <div style="display: flex; gap: 8px; align-items: center;">
                <input type="text" id="credUsername" value="${escapeHtml(username)}" readonly style="flex: 1; padding: 10px; border: 2px solid #86efac; border-radius: 6px; font-size: 14px; font-weight: 600; background: white; color: #111827;">
                <button onclick="copyToClipboard('credUsername', 'Username')" class="btn btn-sm btn-success" style="padding: 10px 16px;">
                  📋 Copy
                </button>
              </div>
            </div>
            
            <div>
              <label style="display: block; font-size: 11px; color: #047857; margin-bottom: 6px; font-weight: 600;">PASSWORD</label>
              <div style="display: flex; gap: 8px; align-items: center;">
                <input type="text" id="credPassword" value="${escapeHtml(password)}" readonly style="flex: 1; padding: 10px; border: 2px solid #86efac; border-radius: 6px; font-size: 14px; font-weight: 600; background: white; color: #111827;">
                <button onclick="copyToClipboard('credPassword', 'Password')" class="btn btn-sm btn-success" style="padding: 10px 16px;">
                  📋 Copy
                </button>
              </div>
            </div>
          </div>
          
          <div style="padding: 16px; background: #fef3c7; border-left: 4px solid #fbbf24; border-radius: 8px; margin-bottom: 16px;">
            <div style="display: flex; gap: 12px;">
              <div style="font-size: 24px;">⚠️</div>
              <div>
                <strong style="display: block; color: #92400e; font-size: 13px; margin-bottom: 4px;">Important</strong>
                <p style="margin: 0; font-size: 12px; color: #78350f; line-height: 1.6;">
                  Please save these credentials and share them with the athlete. The default password should be changed on first login for security.
                </p>
              </div>
            </div>
          </div>
          
          <div style="padding: 12px; background: #dbeafe; border-radius: 8px; font-size: 12px; color: #1e40af; line-height: 1.6;">
            <strong>📧 Next Steps:</strong>
            <ul style="margin: 8px 0 0 0; padding-left: 20px;">
              <li>Share these credentials with ${escapeHtml(athleteName)}</li>
              <li>Instruct them to change their password on first login</li>
              <li>They can login at the system's login page</li>
            </ul>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="printCredentials('${escapeHtml(athleteName)}', '${escapeHtml(username)}', '${escapeHtml(password)}')">
            🖨️ Print Credentials
          </button>
          <button class="btn btn-success" onclick="closeModal('credentialsModal')">
            ✅ Got It!
          </button>
        </div>
      </div>
    </div>
  `;
  
// ✅ FIXED: Use correct variable name and DOM manipulation
const tempDiv = document.createElement('div');
tempDiv.innerHTML = modal;  // Use 'modal', not 'modalHTML'
document.body.appendChild(tempDiv.firstElementChild);
}

// Copy to clipboard function
function copyToClipboard(inputId, fieldName) {
  const input = document.getElementById(inputId);
  if (input) {
    input.select();
    document.execCommand('copy');
    showToast(`✅ ${fieldName} copied to clipboard!`, 'success');
  }
}

// Print credentials function
function printCredentials(athleteName, username, password) {
  const printWindow = window.open('', '', 'width=600,height=400');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Account Credentials - ${athleteName}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #667eea;
          padding-bottom: 20px;
        }
        .credentials {
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .cred-item {
          margin: 15px 0;
        }
        .cred-label {
          font-weight: bold;
          color: #6b7280;
          font-size: 12px;
          text-transform: uppercase;
        }
        .cred-value {
          font-size: 18px;
          font-weight: bold;
          color: #111827;
          padding: 10px;
          background: white;
          border: 2px solid #86efac;
          border-radius: 6px;
          margin-top: 5px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎓 Athlete Account Credentials</h1>
        <p>Sports Management System</p>
      </div>
      
      <div style="text-align: center; margin-bottom: 30px;">
        <h2>${athleteName}</h2>
        <p style="color: #6b7280;">Account created on ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div class="credentials">
        <div class="cred-item">
          <div class="cred-label">Username</div>
          <div class="cred-value">${username}</div>
        </div>
        
        <div class="cred-item">
          <div class="cred-label">Password (Default)</div>
          <div class="cred-value">${password}</div>
        </div>
      </div>
      
      <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #fbbf24; border-radius: 6px; margin: 20px 0;">
        <strong>⚠️ Important Security Notice:</strong>
        <ul>
          <li>Please change your password immediately upon first login</li>
          <li>Keep these credentials secure and confidential</li>
          <li>Do not share your password with anyone</li>
        </ul>
      </div>
      
      <div class="footer">
        <p><strong>Next Steps:</strong></p>
        <ol>
          <li>Visit the system login page</li>
          <li>Enter your username and password</li>
          <li>Change your password in your profile settings</li>
        </ol>
        <p style="margin-top: 20px;">
          For assistance, please contact your Sports Director or System Administrator.
        </p>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

console.log('✅ Enhanced athlete account creation with credentials display loaded');

function closeModal(modalId) {
  // Clear umpire assignment modal tracking
  if (window.currentUmpireAssignmentTourId) {
    window.currentUmpireAssignmentTourId = null;
  }
  
  if (modalId) {
    // Close specific modal by ID
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.remove();
    }
  } else {
    // Close all modals
    // Clear modalContainer
    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer) {
      modalContainer.innerHTML = '';
    }
    
    // Remove all dynamically created modals
    document.querySelectorAll('.modal').forEach(modal => {
      if (modal.id !== 'logoutModal' && modal.id !== 'printModal') {
        modal.remove();
      }
    });
  }
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

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
    top: 80px;
    right: 20px;
    background: ${colors[type]};
    color: white;
    padding: 14px 20px;
    border-radius: 8px;
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

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function loadSportsDropdown(selectId) {
  try {
    const sports = await fetchAPI('sports');
    const select = $('#' + selectId);
    
    if (sports && sports.length > 0 && select) {
      const currentValue = select.value;
      select.innerHTML = '<option value="">Select Sport</option>' +
        sports.map(s => `<option value="${s.sports_id}">${escapeHtml(s.sports_name)}</option>`).join('');
      if (currentValue) select.value = currentValue;
    }
  } catch (error) {
    console.error('Error loading sports dropdown:', error);
  }
}

async function loadCoachesDropdown(selectId) {
  try {
    const coaches = await fetchAPI('staff', { role: 'coach' });
    const select = $('#' + selectId);
    
    if (coaches && coaches.length > 0 && select) {
      select.innerHTML = '<option value="">Select Coach</option>' +
        coaches.map(c => `<option value="${c.person_id}">${escapeHtml(c.full_name)}</option>`).join('');
    }
  } catch (error) {
    console.error('Error loading coaches dropdown:', error);
  }
}

async function loadTrainorsDropdown(selectId) {
  try {
    const trainors = await fetchAPI('staff', { role: 'trainor' });
    const select = $('#' + selectId);
    
    if (trainors && trainors.length > 0 && select) {
      select.innerHTML = '<option value="">Select Trainor</option>' +
        trainors.map(t => `<option value="${t.person_id}">${escapeHtml(t.full_name)}</option>`).join('');
    }
  } catch (error) {
    console.error('Error loading trainors dropdown:', error);
  }
}

// ==========================================
// TRAINING FUNCTIONS
// Replace in director.js - REMOVE the showTrainingModal function
// ==========================================

// ❌ DELETE THIS FUNCTION - it's causing infinite recursion
// function showTrainingModal(training = null) {
//   if (typeof window.showTrainingModal === 'function') {
//     window.showTrainingModal(training);
//   } else {
//     showTrainingModal(training);  // ← This calls itself = infinite loop!
//   }
// }

// ✅ KEEP ONLY THESE FUNCTIONS:

async function editTraining(id) {
  try {
    // Fetch all training sessions
    const params = {};
    if (currentFilters.sport) params.sport_id = currentFilters.sport;
    if (currentFilters.team) params.team_id = currentFilters.team;
    
    const data = await fetchAPI('training', params);
    const training = data.find(t => t.sked_id == id);
    
    if (training) {
      showTrainingModal(training); // This will call the one from director_modals.js
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
// CASCADING DROPDOWN HELPERS FOR TRAINING MODAL
// ==========================================

async function updateTrainingTeams() {
  const tourSelect = document.getElementById('training_tour_id');
  const teamSelect = document.getElementById('training_team_id');
  const sportsSelect = document.getElementById('training_sports_id');
  
  if (!tourSelect.value) {
    // Show all teams if no tournament selected
    const teams = window.trainingModalData?.teams || [];
    teamSelect.innerHTML = '<option value="">Select Team</option>' +
      teams.filter(t => t.is_active == 1).map(t => 
        `<option value="${t.team_id}">${escapeHtml(t.team_name)}</option>`
      ).join('');
    return;
  }
  
  try {
    const tournamentTeams = await fetchAPI('get_tournament_teams', { tour_id: tourSelect.value });
    
    if (!tournamentTeams || tournamentTeams.length === 0) {
      teamSelect.innerHTML = '<option value="">No teams in this tournament</option>';
      teamSelect.disabled = true;
      return;
    }
    
    teamSelect.innerHTML = '<option value="">Select Team</option>' +
      tournamentTeams.map(t => 
        `<option value="${t.team_id}">${escapeHtml(t.team_name)}</option>`
      ).join('');
    teamSelect.disabled = false;
    
    // Reset sports
    sportsSelect.innerHTML = '<option value="">General Training (All Sports)</option>';
  } catch (error) {
    console.error('Error loading teams:', error);
  }
}

async function updateTrainingSports() {
  const tourSelect = document.getElementById('training_tour_id');
  const teamSelect = document.getElementById('training_team_id');
  const sportsSelect = document.getElementById('training_sports_id');
  
  if (!teamSelect.value) {
    sportsSelect.innerHTML = '<option value="">General Training (All Sports)</option>';
    return;
  }
  
  if (!tourSelect.value) {
    // Show all sports if no tournament selected
    const sports = window.trainingModalData?.sports || [];
    sportsSelect.innerHTML = '<option value="">General Training (All Sports)</option>' +
      sports.filter(s => s.is_active == 1).map(s => 
        `<option value="${s.sports_id}">${escapeHtml(s.sports_name)}</option>`
      ).join('');
    return;
  }
  
  try {
    const teamSports = await fetchAPI('get_team_sports', { 
      tour_id: tourSelect.value, 
      team_id: teamSelect.value 
    });
    
    if (!teamSports || teamSports.length === 0) {
      sportsSelect.innerHTML = '<option value="">General Training (All Sports)</option>';
      return;
    }
    
    sportsSelect.innerHTML = '<option value="">General Training (All Sports)</option>' +
      teamSports.map(s => 
        `<option value="${s.sports_id}">${escapeHtml(s.sports_name)}</option>`
      ).join('');
  } catch (error) {
    console.error('Error loading sports:', error);
  }
}

// ==========================================
// SAVE TRAINING SESSION
// ==========================================

async function saveTraining(event, skedId) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  
  const data = {
    tour_id: formData.get('tour_id') || null,
    team_id: formData.get('team_id'),
    sports_id: formData.get('sports_id') || null,
    sked_date: formData.get('sked_date'),
    sked_time: formData.get('sked_time'),
    venue_id: formData.get('venue_id'),
    notes: formData.get('notes') || null
  };
  
  if (skedId) {
    data.sked_id = skedId;
  }
  
  try {
    const action = skedId ? 'update_training' : 'create_training';
    const result = await fetchAPI(action, data, 'POST');
    
    if (result && result.ok) {
      closeModal('trainingModal');
      loadTraining();
      showToast(skedId ? '✅ Training session updated!' : '✅ Training session scheduled!', 'success');
    } else {
      showToast('❌ Error: ' + (result?.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error saving training:', error);
    showToast('❌ Error saving training session', 'error');
  }
}

// ==========================================
// PRINT STYLES
// ==========================================

if (!document.getElementById('printStyles')) {
  const printStyles = document.createElement('style');
  printStyles.id = 'printStyles';
  printStyles.textContent = `
    @media print {
      .sidebar, .top-bar, .modal-header, .modal-footer, .btn, .modal-close {
        display: none !important;
      }
      .modal {
        position: static !important;
        background: white !important;
      }
      .modal-content {
        max-width: 100% !important;
        max-height: none !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
      }
      .modal-body {
        padding: 20px !important;
        max-height: none !important;
        overflow: visible !important;
      }
      body {
        font-size: 11pt;
      }
      @page {
        margin: 1cm;
      }
    }
  `;
  document.head.appendChild(printStyles);
}

// ==========================================
// UNIVERSAL MODAL BACKDROP CLICK HANDLER
// ==========================================
// ==========================================
// GLOBAL MODAL BACKDROP CLICK HANDLER
// ==========================================

document.addEventListener('click', function(e) {
  // Check if clicked element is a modal backdrop
  if (e.target.classList.contains('modal') && e.target.classList.contains('active')) {
    // Only close if clicking directly on backdrop, not modal content
    if (e.target === e.currentTarget) {
      const modalId = e.target.id;
      if (modalId) {
        closeModal(modalId);
      }
    }
  }
});

console.log('✅ Modal backdrop click handler initialized');


console.log('✅ Enhanced director_modals.js loaded');