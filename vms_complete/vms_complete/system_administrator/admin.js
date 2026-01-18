const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const personId = window.ADMIN_CONTEXT.person_id;

// Navigation
$$('.nav-link').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.nav-link').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const view = btn.dataset.view;
    $$('.content-view').forEach(v => v.classList.remove('active'));
    $(`#${view}-view`).classList.add('active');
    
    // Update page title
    const titles = {
      overview: 'System Overview',
      users: 'User Management',
      roles: 'Roles & Permissions',
      logs: 'Activity Logs',
      tournaments: 'Tournaments',
      teams: 'Teams',
      athletes: 'Athletes',
      'sports-setup': 'Sports Setup',
      system: 'System Settings'
    };
    $('#pageTitle').textContent = titles[view] || 'Dashboard';
    
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
    case 'users': loadUsers(); break;
    case 'roles': loadRoles(); break;
    case 'logs': loadLogs(); break;
    case 'tournaments': loadTournaments(); break;
    case 'teams': loadTeams(); break;
    case 'athletes': loadAthletes(); break;
    case 'sports-setup': loadSports(); break;
  }
}

// ==========================================
// OVERVIEW
// ==========================================

async function loadOverview() {
  try {
    const data = await fetchAPI('admin_stats');
    
    if (data) {
      $('#statUsers').textContent = data.total_users || 0;
      $('#statActiveUsers').textContent = data.active_users || 0;
      $('#statAthletes').textContent = data.total_athletes || 0;
      $('#statSports').textContent = data.active_sports || 0;
    }
    
    const activities = await fetchAPI('recent_activities', { limit: 10 });
    const content = $('#overviewContent');
    
    if (!activities || activities.length === 0) {
      content.innerHTML = '<div class="empty-state">No recent activities</div>';
    } else {
      content.innerHTML = activities.map(a => `
        <div class="log-entry">
          <div class="log-icon">${getActionIcon(a.action)}</div>
          <div class="log-details">
            <div class="log-action">${escapeHtml(a.description)}</div>
            <div class="log-meta">By ${escapeHtml(a.user_name)}</div>
          </div>
          <div class="log-time">${formatTime(a.created_at)}</div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('loadOverview error:', err);
  }
}

// ==========================================
// USER MANAGEMENT
// ==========================================

// ==========================================
// USER MANAGEMENT - ENHANCED VERSION
// Lines 197-329 - Replace these functions in your admin.js
// ==========================================

// ==========================================
// USER MANAGEMENT - COMPLETE SECTION
// Add this after line 122 in admin.js
// ==========================================

async function loadUsers() {
  const content = $('#usersContent');
  content.innerHTML = '<div class="loading">Loading users...</div>';
  
  try {
    const data = await fetchAPI('users');
    
    if (!data || data.length === 0) {
      content.innerHTML = '<div class="empty-state">No users found</div>';
      return;
    }
    
    // Group users by their user_role
    const groupedUsers = {};
    
    data.forEach(user => {
      const role = user.user_role || 'Unassigned';
      if (!groupedUsers[role]) {
        groupedUsers[role] = [];
      }
      groupedUsers[role].push(user);
    });
    
    // ✅ SORT USERS ALPHABETICALLY BY FIRST NAME WITHIN EACH GROUP
    Object.keys(groupedUsers).forEach(role => {
      groupedUsers[role].sort((a, b) => {
        // First, sort by first name
        const firstNameCompare = a.f_name.localeCompare(b.f_name);
        if (firstNameCompare !== 0) return firstNameCompare;
        
        // If first names are the same, sort by last name
        return a.l_name.localeCompare(b.l_name);
      });
    });
    
    // Define role order and icons
    const roleOrder = [
      'system administrator',
      'sports director',
      'Tournament manager',
      'coach',
      'trainor',
      'athlete/player',
      'trainee',
      'umpire',
      'scorer',
      'Spectator'
    ];
    
    const roleIcons = {
      'system administrator': '👑',
      'sports director': '🎯',
      'Tournament manager': '🏆',
      'coach': '👨‍🏫',
      'trainor': '💪',
      'athlete/player': '🏃',
      'trainee': '🎓',
      'umpire': '⚖️',
      'scorer': '📊',
      'Spectator': '👀'
    };
    
    let html = `
      <div class="view-header">
        <h2>All Users</h2>
        <button class="btn btn-primary" onclick="showUserModal()">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 0a1 1 0 011 1v6h6a1 1 0 110 2H9v6a1 1 0 11-2 0V9H1a1 1 0 010-2h6V1a1 1 0 011-1z"/>
          </svg>
          Add User
        </button>
      </div>
    `;
    
    // Sort roles by defined order
    const sortedRoles = Object.keys(groupedUsers).sort((a, b) => {
      const indexA = roleOrder.indexOf(a);
      const indexB = roleOrder.indexOf(b);
      
      // If both roles are in the order array, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only A is in the order array, it comes first
      if (indexA !== -1) return -1;
      // If only B is in the order array, it comes first
      if (indexB !== -1) return 1;
      // Otherwise, sort alphabetically
      return a.localeCompare(b);
    });
    
    sortedRoles.forEach(role => {
      const users = groupedUsers[role];
      const roleIcon = roleIcons[role] || '👤';
      
      html += `
        <div class="group-header">
          <div class="group-title">${roleIcon} ${escapeHtml(role)}</div>
          <div class="group-badge">${users.length} ${users.length === 1 ? 'user' : 'users'}</div>
        </div>
        
        <table class="user-table" style="margin-bottom: 24px;">
          <thead>
            <tr>
              <th>User</th>
              <th>Username</th>
              <th>Role Type</th>
              <th>College</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      users.forEach(user => {
        const fullName = `${user.f_name} ${user.l_name}`;
        const initials = `${user.f_name.charAt(0)}${user.l_name.charAt(0)}`.toUpperCase();
        const statusClass = user.is_active == 1 ? 'active' : 'inactive';
        const statusText = user.is_active == 1 ? 'Active' : 'Inactive';
        
        html += `
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 10px;">
                <div class="user-avatar">${escapeHtml(initials)}</div>
                <div>
                  <div style="font-weight: 600;">${escapeHtml(fullName)}</div>
                  ${user.m_name ? `<div style="font-size: 11px; color: var(--text-muted);">${escapeHtml(user.m_name)}</div>` : ''}
                </div>
              </div>
            </td>
            <td>${escapeHtml(user.username)}</td>
            <td>
              <span class="role-badge">${escapeHtml(user.role_type || 'N/A')}</span>
            </td>
            <td>${escapeHtml(user.college_name || user.college_code || 'N/A')}</td>
            <td>
              <span class="status-dot ${statusClass}"></span>
              ${statusText}
            </td>
            <td>
              <div class="action-buttons">
                <button class="btn-icon" onclick="editUser(${user.user_id})" title="Edit">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                  </svg>
                </button>
                <button class="btn-icon ${statusClass === 'active' ? 'danger' : 'success'}" 
                        onclick="toggleUser(${user.user_id}, ${user.is_active})"
                        title="${user.is_active == 1 ? 'Deactivate' : 'Activate'}">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                    ${user.is_active == 1 ? 
                      '<path d="M5 3.5h6A1.5 1.5 0 0 1 12.5 5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11V5A1.5 1.5 0 0 1 5 3.5z"/>' :
                      '<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>'
                    }
                  </svg>
                </button>
                <button class="btn-icon danger" onclick="deleteUser(${user.user_id})" title="Delete">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                    <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      });
      
      html += `
          </tbody>
        </table>
      `;
    });
    
    content.innerHTML = html;
    
  } catch (err) {
    console.error('loadUsers error:', err);
    content.innerHTML = '<div class="empty-state">Error loading users</div>';
  }
}

function showUserModal(id = null) {
  const isEdit = id !== null;
  const title = isEdit ? 'Edit User' : 'Add User';
  
  const modalHTML = `
    <div class="modal active" id="userModal">
      <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="closeModal('userModal')">×</button>
        </div>
        <div class="modal-body">
          <form id="userForm" onsubmit="saveUser(event, ${id})">
            
            <!-- Personal Information -->
            <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 12px; color: var(--text); border-bottom: 1px solid var(--border); padding-bottom: 8px;">Personal Information</h4>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div class="form-group">
                <label class="form-label">First Name *</label>
                <input type="text" class="form-control" id="user_f_name" required>
              </div>
              <div class="form-group">
                <label class="form-label">Last Name *</label>
                <input type="text" class="form-control" id="user_l_name" required>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Middle Name</label>
              <input type="text" class="form-control" id="user_m_name">
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div class="form-group">
                <label class="form-label">Title</label>
                <input type="text" class="form-control" id="user_title" placeholder="e.g., Mr., Ms., Dr.">
              </div>
              <div class="form-group">
                <label class="form-label">Date of Birth</label>
                <input type="date" class="form-control" id="user_date_birth">
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Blood Type</label>
              <select class="form-control" id="user_blood_type">
                <option value="">Select Blood Type</option>
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
            
            <!-- Academic Information -->
            <h4 style="font-size: 14px; font-weight: 600; margin: 20px 0 12px 0; color: var(--text); border-bottom: 1px solid var(--border); padding-bottom: 8px;">Academic Information</h4>
            
            <div class="form-group">
              <label class="form-label">College</label>
              <select class="form-control" id="user_college_code" onchange="loadDepartmentsByCollege()">
                <option value="">Select College</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Department</label>
              <select class="form-control" id="user_department" onchange="loadCoursesByDepartment()" disabled>
                <option value="">Select College First</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Course</label>
              <select class="form-control" id="user_course" disabled>
                <option value="">Select Department First</option>
              </select>
            </div>
            
            <!-- Role and Account - EXACT DATABASE VALUES -->
            <h4 style="font-size: 14px; font-weight: 600; margin: 20px 0 12px 0; color: var(--text); border-bottom: 1px solid var(--border); padding-bottom: 8px;">Role & Account Information</h4>
            
            <div class="form-group">
              <label class="form-label">Role Type * (for tbl_person)</label>
              <select class="form-control" id="user_role_type" required onchange="toggleAthleteFields()">
                <option value="">Select Role Type</option>
                <option value="athlete">athlete</option>
                <option value="trainee">trainee</option>
                <option value="coach">coach</option>
                <option value="trainor">trainor</option>
                <option value="sports_director">sports_director</option>
                <option value="tournament_manager">tournament_manager</option>
                <option value="umpire">umpire</option>
                <option value="Spectator">Spectator</option>
              </select>
              <small style="color: #6b7280; font-size: 11px;">⚠️ DB values: athlete, trainee, coach, trainor, sports_director, tournament_manager, umpire, Spectator</small>
            </div>
            
            <div class="form-group">
              <label class="form-label">User Role * (for tbl_users - system access)</label>
              <select class="form-control" id="user_role" required>
                <option value="">Select User Role</option>
                <option value="system administrator">system administrator</option>
                <option value="trainor">trainor</option>
                <option value="trainee">trainee</option>
                <option value="coach">coach</option>
                <option value="athlete/player">athlete/player</option>
                <option value="sports director">sports director</option>
                <option value="umpire">umpire</option>
                <option value="Tournament manager">Tournament manager</option>
                <option value="Spectator">Spectator</option>
                <option value="scorer">scorer</option>
              </select>
              <small style="color: #6b7280; font-size: 11px;">⚠️ DB values: system administrator, trainor, trainee, coach, athlete/player, sports director, umpire, Tournament manager, Spectator, scorer</small>
            </div>
            
            <div class="form-group">
              <label class="form-label">Username *</label>
              <input type="text" class="form-control" id="user_username" required>
            </div>
            
            ${!isEdit ? `
            <div class="form-group">
              <label class="form-label">Password *</label>
              <input type="password" class="form-control" id="user_password" required minlength="6">
            </div>
            <div class="form-group">
              <label class="form-label">Confirm Password *</label>
              <input type="password" class="form-control" id="user_password_confirm" required minlength="6">
            </div>
            ` : ''}
            
            <!-- Athlete/Player Assignment (Conditional) -->
            <div id="athleteFields" style="display: none;">
              <h4 style="font-size: 14px; font-weight: 600; margin: 20px 0 12px 0; color: var(--text); border-bottom: 1px solid var(--border); padding-bottom: 8px;">Team Assignment (Optional)</h4>
              
              <div style="background: #fef3c7; padding: 12px; border-radius: 6px; margin-bottom: 12px; font-size: 12px; color: #92400e;">
                ℹ️ <strong>Note:</strong> You can assign this athlete to a team now, or do it later.
              </div>
              
              <div class="form-group">
                <label class="form-label">
                  <input type="checkbox" id="assign_to_team" onchange="toggleTeamFields()"> 
                  Assign to Team Now
                </label>
              </div>
              
              <div id="teamFields" style="display: none;">
                <div class="form-group">
                  <label class="form-label">Tournament</label>
                  <select class="form-control" id="user_tour_id">
                    <option value="">Select Tournament</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label">Sport</label>
                  <select class="form-control" id="user_sports_id" onchange="loadTeamsForSport()">
                    <option value="">Select Sport</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label">Team</label>
                  <select class="form-control" id="user_team_id">
                    <option value="">Select Team</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label">
                    <input type="checkbox" id="user_is_captain"> 
                    Team Captain
                  </label>
                </div>
              </div>
            </div>
            
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('userModal')">Cancel</button>
          <button class="btn btn-primary" onclick="$('#userForm').requestSubmit()">
            ${isEdit ? 'Update' : 'Create'} User
          </button>
        </div>
      </div>
    </div>
  `;
  
  $('#modalContainer').innerHTML = modalHTML;
  
  // Load dropdown data
  loadCollegesDropdown();
  loadTournamentsDropdown();
  loadSportsDropdown();
  
  if (isEdit) {
    loadUserData(id);
  }
}

// Toggle athlete-specific fields
function toggleAthleteFields() {
  const roleType = $('#user_role_type').value;
  const athleteFields = $('#athleteFields');
  
  // Show for "athlete" or "trainee" (exact database values)
  if (roleType === 'athlete' || roleType === 'trainee') {
    athleteFields.style.display = 'block';
  } else {
    athleteFields.style.display = 'none';
    $('#assign_to_team').checked = false;
    $('#teamFields').style.display = 'none';
  }
}

// Toggle team assignment fields
function toggleTeamFields() {
  const assignToTeam = $('#assign_to_team').checked;
  $('#teamFields').style.display = assignToTeam ? 'block' : 'none';
}

// Load colleges for dropdown
async function loadCollegesDropdown() {
  try {
    const colleges = await fetchAPI('colleges');
    const select = $('#user_college_code');
    
    if (colleges && colleges.length > 0) {
      colleges.forEach(college => {
        const option = document.createElement('option');
        option.value = college.college_code;
        option.textContent = `${college.college_code} - ${college.college_name}`;
        option.dataset.collegeId = college.college_id; // Store college_id for department lookup
        select.appendChild(option);
      });
    }
  } catch (err) {
    console.error('Error loading colleges:', err);
  }
}

// Load departments when college is selected
async function loadDepartmentsByCollege() {
  const collegeSelect = $('#user_college_code');
  const deptSelect = $('#user_department');
  const courseSelect = $('#user_course');
  
  // Reset department and course
  deptSelect.innerHTML = '<option value="">Loading...</option>';
  deptSelect.disabled = true;
  courseSelect.innerHTML = '<option value="">Select Department First</option>';
  courseSelect.disabled = true;
  
  const selectedOption = collegeSelect.options[collegeSelect.selectedIndex];
  
  if (!selectedOption || !selectedOption.dataset.collegeId) {
    deptSelect.innerHTML = '<option value="">Select College First</option>';
    return;
  }
  
  const collegeId = selectedOption.dataset.collegeId;
  
  try {
    const departments = await fetchAPI('departments', { college_id: collegeId });
    
    deptSelect.innerHTML = '<option value="">Select Department</option>';
    
    if (departments && departments.length > 0) {
      departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.dept_id;
        option.textContent = `${dept.dept_code} - ${dept.dept_name}`;
        deptSelect.appendChild(option);
      });
      deptSelect.disabled = false;
    } else {
      deptSelect.innerHTML = '<option value="">No departments available</option>';
    }
  } catch (err) {
    console.error('Error loading departments:', err);
    deptSelect.innerHTML = '<option value="">Error loading departments</option>';
  }
}

// Load courses when department is selected
async function loadCoursesByDepartment() {
  const deptSelect = $('#user_department');
  const courseSelect = $('#user_course');
  
  // Reset course
  courseSelect.innerHTML = '<option value="">Loading...</option>';
  courseSelect.disabled = true;
  
  const deptId = deptSelect.value;
  
  if (!deptId) {
    courseSelect.innerHTML = '<option value="">Select Department First</option>';
    return;
  }
  
  try {
    const courses = await fetchAPI('courses', { dept_id: deptId });
    
    courseSelect.innerHTML = '<option value="">Select Course</option>';
    
    if (courses && courses.length > 0) {
      courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.course_code;
        option.textContent = `${course.course_code} - ${course.course_name}`;
        courseSelect.appendChild(option);
      });
      courseSelect.disabled = false;
    } else {
      courseSelect.innerHTML = '<option value="">No courses available</option>';
    }
  } catch (err) {
    console.error('Error loading courses:', err);
    courseSelect.innerHTML = '<option value="">Error loading courses</option>';
  }
}

// Load tournaments for dropdown
async function loadTournamentsDropdown() {
  try {
    const tournaments = await fetchAPI('tournaments');
    const select = $('#user_tour_id');
    
    if (tournaments && tournaments.length > 0) {
      tournaments.forEach(tour => {
        const option = document.createElement('option');
        option.value = tour.tour_id;
        option.textContent = `${tour.tour_name} (${tour.school_year})`;
        select.appendChild(option);
      });
    }
  } catch (err) {
    console.error('Error loading tournaments:', err);
  }
}

// Load sports for dropdown
async function loadSportsDropdown() {
  try {
    const sports = await fetchAPI('sports');
    const select = $('#user_sports_id');
    
    if (sports && sports.length > 0) {
      sports.forEach(sport => {
        const option = document.createElement('option');
        option.value = sport.sports_id;
        option.textContent = sport.sports_name;
        select.appendChild(option);
      });
    }
  } catch (err) {
    console.error('Error loading sports:', err);
  }
}

// Load teams for selected sport
async function loadTeamsForSport() {
  const sportsId = $('#user_sports_id').value;
  const select = $('#user_team_id');
  
  select.innerHTML = '<option value="">Select Team</option>';
  
  if (!sportsId) return;
  
  try {
    const teams = await fetchAPI('teams', { sport_id: sportsId });
    
    if (teams && teams.length > 0) {
      teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team.team_id;
        option.textContent = team.team_name;
        select.appendChild(option);
      });
    }
  } catch (err) {
    console.error('Error loading teams:', err);
  }
}

// Load existing user data for editing
async function loadUserData(id) {
  const data = await fetchAPI('users');
  const user = data.find(u => u.user_id == id);
  
  if (user) {
    $('#user_f_name').value = user.f_name || '';
    $('#user_l_name').value = user.l_name || '';
    $('#user_m_name').value = user.m_name || '';
    $('#user_title').value = user.title || '';
    $('#user_date_birth').value = user.date_birth || '';
    $('#user_blood_type').value = user.blood_type || '';
    $('#user_role_type').value = user.role_type || '';
    $('#user_username').value = user.username || '';
    $('#user_role').value = user.user_role || '';
    
    // Handle cascading dropdowns for college → department → course
    if (user.college_code) {
      $('#user_college_code').value = user.college_code;
      
      // Load departments for this college, then set the department
      const collegeSelect = $('#user_college_code');
      const selectedOption = collegeSelect.options[collegeSelect.selectedIndex];
      
      if (selectedOption && selectedOption.dataset.collegeId) {
        const collegeId = selectedOption.dataset.collegeId;
        
        // Load departments
        const departments = await fetchAPI('departments', { college_id: collegeId });
        const deptSelect = $('#user_department');
        
        deptSelect.innerHTML = '<option value="">Select Department</option>';
        
        if (departments && departments.length > 0) {
          departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.dept_id;
            option.textContent = `${dept.dept_code} - ${dept.dept_name}`;
            deptSelect.appendChild(option);
          });
          deptSelect.disabled = false;
          
          // If user has a course, find the department for that course
          if (user.course) {
            const allCourses = await fetchAPI('courses');
            const userCourse = allCourses.find(c => c.course_code === user.course);
            
            if (userCourse && userCourse.dept_id) {
              deptSelect.value = userCourse.dept_id;
              
              // Load courses for this department
              const courses = await fetchAPI('courses', { dept_id: userCourse.dept_id });
              const courseSelect = $('#user_course');
              
              courseSelect.innerHTML = '<option value="">Select Course</option>';
              
              if (courses && courses.length > 0) {
                courses.forEach(course => {
                  const option = document.createElement('option');
                  option.value = course.course_code;
                  option.textContent = `${course.course_code} - ${course.course_name}`;
                  courseSelect.appendChild(option);
                });
                courseSelect.disabled = false;
                courseSelect.value = user.course;
              }
            }
          }
        }
      }
    }
    
    toggleAthleteFields();
  }
}

// Save user (create or update)
// Save user (create or update)
async function saveUser(e, id) {
  e.preventDefault();
  
  if (!id) {
    const password = $('#user_password').value;
    const passwordConfirm = $('#user_password_confirm').value;
    
    if (password !== passwordConfirm) {
      alert('Passwords do not match!');
      return;
    }
  }
  
  const data = {
    f_name: $('#user_f_name').value.trim(),
    l_name: $('#user_l_name').value.trim(),
    m_name: $('#user_m_name').value.trim() || null,
    title: $('#user_title').value.trim() || null,
    date_birth: $('#user_date_birth').value || null,
    blood_type: $('#user_blood_type').value || null,
    college_code: $('#user_college_code').value || null,
    course: $('#user_course').value.trim() || null,
    role_type: $('#user_role_type').value,
    username: $('#user_username').value.trim(),
    user_role: $('#user_role').value
  };
  
  if (!data.role_type) {
    alert('Please select a Role Type');
    return;
  }
  
  if (!data.user_role) {
    alert('Please select a User Role');
    return;
  }
  
  if (!id) {
    data.password = $('#user_password').value;
  } else {
    data.user_id = id;
  }
  
  const roleType = $('#user_role_type').value;
  const assignToTeam = $('#assign_to_team')?.checked;
  
  // Team assignment for athletes/trainees
  if ((roleType === 'athlete' || roleType === 'trainee') && assignToTeam) {
    const tourId = $('#user_tour_id').value;
    const sportsId = $('#user_sports_id').value;
    const teamId = $('#user_team_id').value;
    
    console.log('Team Assignment Values:', { tourId, sportsId, teamId });
    
    // Validate required fields
    if (!sportsId) {
      alert('Please select a sport for team assignment');
      return;
    }
    if (!teamId) {
      alert('Please select a team');
      return;
    }
    
    data.assign_to_team = true;
    data.team_assignment = {
      tour_id: tourId || null,
      sports_id: sportsId,
      team_id: teamId,
      is_captain: $('#user_is_captain')?.checked ? 1 : 0
    };
    
    console.log('Team Assignment Data:', data.team_assignment);
    
    // Warn if no tournament selected
    if (!tourId) {
      const proceed = confirm(
        'No tournament selected.\n\n' +
        'The athlete will be assigned to the latest active tournament.\n\n' +
        'Continue?'
      );
      if (!proceed) {
        return;
      }
    }
  }
  
  console.log('Sending data to API:', data);
  
  const action = id ? 'update_user' : 'create_user';
  const result = await fetchAPI(action, data, 'POST');
  
  console.log('API Response:', result);
  
  if (result && result.ok) {
    const message = id 
      ? 'User updated successfully!' 
      : `User created successfully!${result.team_assigned ? '\nTeam assignment completed.' : ''}`;
    
    alert(message);
    closeModal('userModal');
    loadUsers();
  } else {
    alert(result?.error || 'Failed to save user');
  }
}

async function toggleUser(id, currentStatus) {
  const newStatus = currentStatus == 1 ? 0 : 1;
  const action = newStatus == 1 ? 'activate' : 'deactivate';
  
  if (!confirm(`Are you sure you want to ${action} this user?`)) return;
  
  const result = await fetchAPI('toggle_user', { user_id: id, is_active: newStatus }, 'POST');
  
  if (result && result.ok) {
    alert(`User ${action}d!`);
    loadUsers();
  }
}

async function deleteUser(id) {
  if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
  
  const result = await fetchAPI('delete_user', { user_id: id }, 'POST');
  
  if (result && result.ok) {
    alert('User deleted!');
    loadUsers();
  }
}

function editUser(id) {
  showUserModal(id);
}



// ==========================================
// END OF USER MANAGEMENT
// ==========================================

// ==========================================
// ROLES & PERMISSIONS
// ==========================================

async function loadRoles() {
  const content = $('#rolesContent');
  
  const roles = [
    { name: 'admin', description: 'Full system access', users: 0 },
    { name: 'sports director', description: 'Manage all sports', users: 0 },
    { name: 'Tournament manager', description: 'Manage tournaments', users: 0 },
    { name: 'coach', description: 'Manage team', users: 0 },
    { name: 'athlete/player', description: 'Athlete access', users: 0 },
    { name: 'Spectator', description: 'View-only access', users: 0 }
  ];
  
  try {
    const users = await fetchAPI('users');
    roles.forEach(role => {
      role.users = users.filter(u => u.user_role === role.name).length;
    });
  } catch (err) {
    console.error('Error loading role counts:', err);
  }
  
  let html = '<div class="data-grid">';
  
  roles.forEach(role => {
    html += `
      <div class="data-card">
        <div class="data-card-header">
          <div class="data-card-title">${escapeHtml(role.name)}</div>
          <span class="badge badge-active">${role.users} users</span>
        </div>
        <div class="data-card-meta">${escapeHtml(role.description)}</div>
      </div>
    `;
  });
  
  html += '</div>';
  content.innerHTML = html;
}

// ==========================================
// ACTIVITY LOGS
// ==========================================

// ==========================================
// ENHANCED LOGS - Replace loadLogs() function in admin.js
// ==========================================

async function loadLogs() {
  try {
    const filter = $('#logFilter')?.value || '';
    const data = await fetchAPI('logs', filter ? { filter } : {});
    const content = $('#logsContent');
    
    if (!data || data.length === 0) {
      content.innerHTML = '<div class="empty-state">No activity logs found</div>';
      return;
    }
    
    let html = '';
    
    data.forEach(log => {
      const isReverted = log.reverted_at !== null;
      const canRevert = log.can_revert == 1 && !isReverted;
      const hasDetails = log.old_data || log.new_data || log.target_table;
      
      html += `
        <div class="log-card ${isReverted ? 'log-reverted' : ''}" data-log-id="${log.log_id}">
          <div class="log-header">
            <div class="log-main-info">
              <div class="log-icon-wrapper">
                <div class="log-icon ${log.action || 'info'}">${getActionIcon(log.action || 'info')}</div>
              </div>
              <div class="log-details-wrapper">
                <div class="log-action-text">${escapeHtml(log.description)}</div>
                <div class="log-metadata">
                  <span class="log-meta-item">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                    </svg>
                    ${escapeHtml(log.user_name || 'System')}
                  </span>
                  <span class="log-meta-item">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8.5 5.5a.5.5 0 0 0-1 0v3.362l-1.429 2.38a.5.5 0 1 0 .858.515l1.5-2.5A.5.5 0 0 0 8.5 9V5.5z"/>
                      <path d="M6.5 0a.5.5 0 0 0 0 1H7v1.07a7.001 7.001 0 0 0-3.273 12.474l-.602.602a.5.5 0 0 0 .707.708l.746-.746A6.97 6.97 0 0 0 8 16a6.97 6.97 0 0 0 3.422-.892l.746.746a.5.5 0 0 0 .707-.708l-.601-.602A7.001 7.001 0 0 0 9 2.07V1h.5a.5.5 0 0 0 0-1h-3zm1.038 3.018a6.093 6.093 0 0 1 .924 0 6 6 0 1 1-.924 0zM0 3.5c0 .753.333 1.429.86 1.887A8.035 8.035 0 0 1 4.387 1.86 2.5 2.5 0 0 0 0 3.5zM13.5 1c-.753 0-1.429.333-1.887.86a8.035 8.035 0 0 1 3.527 3.527A2.5 2.5 0 0 0 13.5 1z"/>
                    </svg>
                    ${formatDetailedTime(log.created_at)}
                  </span>
                  <span class="log-meta-item">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3z"/>
                    </svg>
                    ${escapeHtml(log.module_name)}
                  </span>
                </div>
              </div>
            </div>
            <div class="log-actions">
              ${hasDetails ? `
                <button class="btn-icon" onclick="toggleLogDetails(${log.log_id})" title="View details">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                  </svg>
                </button>
              ` : ''}
              ${canRevert ? `
                <button class="btn-icon btn-revert" onclick="showRevertModal(${log.log_id})" title="Revert this action">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/>
                    <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/>
                  </svg>
                </button>
              ` : ''}
            </div>
          </div>
          
          ${isReverted ? `
            <div class="log-reverted-banner">
              ⚠️ This action was reverted on ${formatDetailedTime(log.reverted_at)}
            </div>
          ` : ''}
          
          ${hasDetails ? `
            <div class="log-details-panel" id="logDetails${log.log_id}" style="display: none;">
              <div class="log-detail-grid">
                <div class="log-detail-item">
                  <strong>Log ID:</strong> #${log.log_id}
                </div>
                <div class="log-detail-item">
                  <strong>Action Type:</strong> 
                  <span class="badge badge-${getActionBadgeClass(log.action || 'info')}">${escapeHtml(log.action || 'info')}</span>
                </div>
                ${log.target_table ? `
                  <div class="log-detail-item">
                    <strong>Target Table:</strong> ${escapeHtml(log.target_table)}
                  </div>
                ` : ''}
                ${log.target_id ? `
                  <div class="log-detail-item">
                    <strong>Target ID:</strong> ${log.target_id}
                  </div>
                ` : ''}
              </div>
              
              ${log.old_data ? `
                <div class="log-data-section">
                  <strong>📋 Previous Data (Before Change):</strong>
                  <pre class="log-data-json">${formatJSON(log.old_data)}</pre>
                </div>
              ` : ''}
              
              ${log.new_data ? `
                <div class="log-data-section">
                  <strong>📄 New Data (After Change):</strong>
                  <pre class="log-data-json">${formatJSON(log.new_data)}</pre>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `;
    });
    
    content.innerHTML = html;
  } catch (err) {
    console.error('loadLogs error:', err);
    $('#logsContent').innerHTML = '<div class="empty-state">Error loading logs</div>';
  }
}


// ==========================================
// TOURNAMENTS - COMPLETE IMPLEMENTATION
// ==========================================

async function loadTournaments() {
  try {
    const data = await fetchAPI('tournaments');
    const content = $('#tournamentsContent');
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <p>No tournaments found</p>
          <button class="btn btn-primary" onclick="showTournamentModal()" style="margin-top: 16px;">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
            </svg>
            Create First Tournament
          </button>
        </div>
      `;
      return;
    }
    
    // Group tournaments by status
    const active = data.filter(t => t.is_active == 1);
    const inactive = data.filter(t => t.is_active == 0);
    
    let html = `
      <div class="view-header">
        <h2>All Tournaments</h2>
        <button class="btn btn-primary" onclick="showTournamentModal()">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
          </svg>
          Add Tournament
        </button>
      </div>
    `;
    
    if (active.length > 0) {
      html += `
        <div class="group-header">
          <div class="group-title">🏆 Active Tournaments</div>
          <div class="group-badge">${active.length}</div>
        </div>
        <div class="data-grid">
      `;
      
      active.forEach(t => {
        html += renderTournamentCard(t);
      });
      
      html += '</div>';
    }
    
    if (inactive.length > 0) {
      html += `
        <div class="group-header">
          <div class="group-title">📦 Inactive Tournaments</div>
          <div class="group-badge">${inactive.length}</div>
        </div>
        <div class="data-grid">
      `;
      
      inactive.forEach(t => {
        html += renderTournamentCard(t);
      });
      
      html += '</div>';
    }
    
    content.innerHTML = html;
  } catch (err) {
    console.error('loadTournaments error:', err);
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
        📅 ${escapeHtml(t.tour_date || 'No date')} • ${escapeHtml(t.school_year)}
        <br>🏆 ${t.num_sports || 0} sports • 👥 ${t.num_teams || 0} teams
      </div>
      <div class="data-card-actions">
        <button class="btn btn-sm btn-secondary" onclick="editTournament(${t.tour_id})">
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
          </svg>
          Edit
        </button>
        <button class="btn btn-sm ${statusClass === 'active' ? 'btn-danger' : 'btn-success'}" 
                onclick="toggleTournament(${t.tour_id}, ${t.is_active == 1 ? 0 : 1})">
          ${t.is_active == 1 ? 'Deactivate' : 'Activate'}
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteTournament(${t.tour_id})">
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
          </svg>
          Delete
        </button>
      </div>
    </div>
  `;
}

function showTournamentModal(id = null) {
  const isEdit = id !== null;
  const modalHTML = `
    <div class="modal active" id="tournamentModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>${isEdit ? 'Edit Tournament' : 'Create New Tournament'}</h3>
          <button class="modal-close" onclick="closeTournamentModal()">×</button>
        </div>
        <div class="modal-body">
          <form id="tournamentForm" onsubmit="saveTournament(event, ${id})">
            
            <div class="form-group">
              <label class="form-label">Tournament Name *</label>
              <input type="text" class="form-control" id="tour_name" 
                     placeholder="e.g., Intramurals 2024" required>
            </div>
            
            <div class="form-group">
              <label class="form-label">School Year *</label>
              <input type="text" class="form-control" id="school_year" 
                     placeholder="e.g., 2023-2024" required>
            </div>
            
            <div class="form-group">
              <label class="form-label">Tournament Date</label>
              <input type="date" class="form-control" id="tour_date">
            </div>
            
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="is_active" checked>
                <span>Active Tournament</span>
              </label>
            </div>
            
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeTournamentModal()">Cancel</button>
          <button class="btn btn-primary" onclick="$('#tournamentForm').requestSubmit()">
            ${isEdit ? 'Update' : 'Create'} Tournament
          </button>
        </div>
      </div>
    </div>
  `;
  
  $('#modalContainer').innerHTML = modalHTML;
  
  if (isEdit) {
    loadTournamentData(id);
  }
}

async function loadTournamentData(id) {
  try {
    const data = await fetchAPI('tournaments');
    const tournament = data.find(t => t.tour_id == id);
    
    if (tournament) {
      $('#tour_name').value = tournament.tour_name || '';
      $('#school_year').value = tournament.school_year || '';
      $('#tour_date').value = tournament.tour_date || '';
      $('#is_active').checked = tournament.is_active == 1;
    }
  } catch (err) {
    console.error('Error loading tournament data:', err);
  }
}

async function saveTournament(e, id) {
  e.preventDefault();
  
  const data = {
    tour_name: $('#tour_name').value.trim(),
    school_year: $('#school_year').value.trim(),
    tour_date: $('#tour_date').value || null,
    is_active: $('#is_active').checked ? 1 : 0
  };
  
  if (!data.tour_name || !data.school_year) {
    alert('Please fill in all required fields');
    return;
  }
  
  if (id) {
    data.tour_id = id;
  }
  
  try {
    const action = id ? 'update_tournament' : 'create_tournament';
    const result = await fetchAPI(action, data, 'POST');
    
    if (result && result.ok) {
      alert(id ? 'Tournament updated successfully!' : 'Tournament created successfully!');
      closeTournamentModal();
      loadTournaments();
    } else {
      alert(result?.error || 'Failed to save tournament');
    }
  } catch (err) {
    console.error('Error saving tournament:', err);
    alert('Error saving tournament');
  }
}

function editTournament(id) {
  showTournamentModal(id);
}

async function toggleTournament(id, newStatus) {
  const action = newStatus == 1 ? 'activate' : 'deactivate';
  
  if (!confirm(`Are you sure you want to ${action} this tournament?`)) return;
  
  try {
    const result = await fetchAPI('toggle_tournament', { tour_id: id, is_active: newStatus }, 'POST');
    
    if (result && result.ok) {
      alert(`Tournament ${action}d successfully!`);
      loadTournaments();
    } else {
      alert(result?.error || `Failed to ${action} tournament`);
    }
  } catch (err) {
    console.error(`Error ${action}ing tournament:`, err);
    alert(`Error ${action}ing tournament`);
  }
}

async function deleteTournament(id) {
  if (!confirm('⚠️ Delete this tournament?\n\nThis will also delete:\n• Associated teams\n• Match schedules\n• Tournament records\n\nThis action cannot be undone!')) {
    return;
  }
  
  if (!confirm('FINAL CONFIRMATION: Are you absolutely sure?')) {
    return;
  }
  
  try {
    const result = await fetchAPI('delete_tournament', { tour_id: id }, 'POST');
    
    if (result && result.ok) {
      alert('✅ Tournament deleted successfully!');
      loadTournaments();
    } else {
      alert(result?.error || 'Failed to delete tournament');
    }
  } catch (err) {
    console.error('Error deleting tournament:', err);
    alert('Error deleting tournament');
  }
}

function closeTournamentModal() {
  $('#modalContainer').innerHTML = '';
}
// ==========================================
// TEAMS & ATHLETES (Same pattern)
// ==========================================

// ==========================================
// TEAMS & ATHLETES (Same pattern)
// ==========================================

// ==========================================
// TEAMS - WITH VIEW FUNCTION
// ==========================================

async function loadTeams() {
  const data = await fetchAPI('teams');
  const content = $('#teamsContent');
  
  if (!data || data.length === 0) {
    content.innerHTML = '<div class="empty-state">No teams found</div>';
    return;
  }
  
  // Group teams by sport and gender
  const grouped = {};
  
  data.forEach(team => {
    const sportName = team.sports_name || 'Unknown Sport';
    const gender = team.men_women || 'Mixed';
    const key = `${sportName}_${gender}`;
    
    if (!grouped[key]) {
      grouped[key] = {
        sport: sportName,
        gender: gender,
        teams: []
      };
    }
    grouped[key].teams.push(team);
  });
  
  let html = '';
  
  // Sort groups by sport name, then gender
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    const groupA = grouped[a];
    const groupB = grouped[b];
    
    // First sort by sport name
    const sportCompare = groupA.sport.localeCompare(groupB.sport);
    if (sportCompare !== 0) return sportCompare;
    
    // Then by gender (Male, Female, Mixed)
    const genderOrder = { 'Male': 1, 'Female': 2, 'Mixed': 3 };
    return (genderOrder[groupA.gender] || 4) - (genderOrder[groupB.gender] || 4);
  });
  
  sortedKeys.forEach(key => {
    const group = grouped[key];
    const genderIcon = group.gender === 'Male' ? '♂️' : group.gender === 'Female' ? '♀️' : '⚧';
    
    html += `
      <div class="group-header">
        <div class="group-title">⚽ ${escapeHtml(group.sport)} ${genderIcon} ${escapeHtml(group.gender)}</div>
        <div class="group-badge">${group.teams.length} ${group.teams.length === 1 ? 'team' : 'teams'}</div>
      </div>
      <div class="data-grid">
    `;
    
    group.teams.forEach(t => {
      const statusBadge = t.is_active == 1 
        ? '<span class="badge badge-active">Active</span>' 
        : '<span class="badge badge-inactive">Inactive</span>';
      
      html += `
        <div class="data-card">
          <div class="data-card-header">
            <div class="data-card-title">${escapeHtml(t.team_name)}</div>
            ${statusBadge}
          </div>
          <div class="data-card-meta">
            👥 ${t.num_players || 0} players
            ${t.coach_name ? `<br>🏃 Coach: ${escapeHtml(t.coach_name)}` : ''}
          </div>
          <div class="data-card-actions">
            <button class="btn btn-sm btn-secondary" onclick="viewTeam(${t.team_id})">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
              </svg>
              View
            </button>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
  });
  
  content.innerHTML = html;
}

async function viewTeam(teamId) {
  console.log('viewTeam called with ID:', teamId);
  
  try {
    // Fetch team details
    const teamData = await fetchAPI('team_details', { team_id: teamId });
    
    console.log('Team data received:', teamData);
    
    if (!teamData || !teamData.ok) {
      alert('Failed to load team details: ' + (teamData?.error || 'Unknown error'));
      return;
    }
    
    const team = teamData.team;
    const players = teamData.players || [];
    const coach = teamData.coach || null;
    const assistantCoach = teamData.assistant_coach || null;
    
    console.log('Team:', team);
    console.log('Players:', players);
    console.log('Coach:', coach);
    console.log('Assistant Coach:', assistantCoach);
    
    // Render player roster
    let rosterHTML = '';
    if (players.length === 0) {
      rosterHTML = '<div class="empty-state">No players assigned to this team</div>';
    } else {
      rosterHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>College</th>
              <th>Course</th>
              <th>Captain</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${players.map(player => {
              const fullName = `${player.f_name} ${player.l_name}`;
              const initials = `${player.f_name.charAt(0)}${player.l_name.charAt(0)}`.toUpperCase();
              return `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <div class="user-avatar" style="width: 32px; height: 32px;">${escapeHtml(initials)}</div>
                      <div>
                        <div style="font-weight: 600;">${escapeHtml(fullName)}</div>
                        ${player.m_name ? `<div style="font-size: 11px; color: var(--text-muted);">${escapeHtml(player.m_name)}</div>` : ''}
                      </div>
                    </div>
                  </td>
                  <td>${escapeHtml(player.college_name || player.college_code || 'N/A')}</td>
                  <td>${escapeHtml(player.course || 'N/A')}</td>
                  <td>
                    ${player.is_captain == 1 ? '<span class="badge badge-warning">⭐ Captain</span>' : '-'}
                  </td>
                  <td>
                    <span class="badge badge-${player.is_active == 1 ? 'success' : 'inactive'}">
                      ${player.is_active == 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }
    
    const modalHTML = `
      <div class="modal active" id="teamViewModal">
        <div class="modal-content" style="max-width: 900px;">
          <div class="modal-header">
            <h3>👥 ${escapeHtml(team.team_name)}</h3>
            <button class="modal-close" onclick="closeModal('teamViewModal')">×</button>
          </div>
          
          <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
            
            <!-- Team Overview -->
            <div class="settings-section">
              <h4>Team Information</h4>
              
              <div class="log-detail-grid">
                <div class="log-detail-item">
                  <strong>Sport:</strong>
                  ${escapeHtml(team.sports_name)}
                </div>
                <div class="log-detail-item">
                  <strong>Category:</strong>
                  ${team.men_women === 'Male' ? '♂️ Men' : team.men_women === 'Female' ? '♀️ Women' : '⚧ Mixed'}
                </div>
                <div class="log-detail-item">
                  <strong>Status:</strong>
                  <span class="badge badge-${team.is_active == 1 ? 'active' : 'inactive'}">
                    ${team.is_active == 1 ? 'Active' : 'Inactive'}
                  </span>
                </div>
                ${team.tournament_name ? `
                  <div class="log-detail-item">
                    <strong>Tournament:</strong>
                    ${escapeHtml(team.tournament_name)} (${escapeHtml(team.school_year)})
                  </div>
                ` : ''}
              </div>
            </div>
            
            <!-- Coaching Staff -->
            <div class="settings-section">
              <h4>Coaching Staff</h4>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <!-- Head Coach -->
                <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid var(--border);">
                  <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 8px;">
                    Head Coach
                  </div>
                  ${coach ? `
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <div class="user-avatar" style="width: 40px; height: 40px; background: #059669;">
                        ${(coach.f_name.charAt(0) + coach.l_name.charAt(0)).toUpperCase()}
                      </div>
                      <div>
                        <div style="font-weight: 600; font-size: 14px;">
                          ${escapeHtml(coach.f_name + ' ' + coach.l_name)}
                        </div>
                        ${coach.college_name ? `<div style="font-size: 11px; color: var(--text-muted);">${escapeHtml(coach.college_name)}</div>` : ''}
                      </div>
                    </div>
                  ` : '<div style="color: var(--text-muted); font-style: italic;">No coach assigned</div>'}
                </div>
                
                <!-- Assistant Coach -->
                <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid var(--border);">
                  <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 8px;">
                    Assistant Coach
                  </div>
                  ${assistantCoach ? `
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <div class="user-avatar" style="width: 40px; height: 40px; background: #7c3aed;">
                        ${(assistantCoach.f_name.charAt(0) + assistantCoach.l_name.charAt(0)).toUpperCase()}
                      </div>
                      <div>
                        <div style="font-weight: 600; font-size: 14px;">
                          ${escapeHtml(assistantCoach.f_name + ' ' + assistantCoach.l_name)}
                        </div>
                        ${assistantCoach.college_name ? `<div style="font-size: 11px; color: var(--text-muted);">${escapeHtml(assistantCoach.college_name)}</div>` : ''}
                      </div>
                    </div>
                  ` : '<div style="color: var(--text-muted); font-style: italic;">No assistant coach assigned</div>'}
                </div>
              </div>
            </div>
            
            <!-- Team Roster -->
            <div class="settings-section">
              <h4>Team Roster (${players.length} ${players.length === 1 ? 'Player' : 'Players'})</h4>
              ${rosterHTML}
            </div>
            
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('teamViewModal')">Close</button>
          </div>
        </div>
      </div>
    `;
    
    $('#modalContainer').innerHTML = modalHTML;
    
    console.log('Modal rendered successfully');
    
  } catch (err) {
    console.error('viewTeam error:', err);
    alert('Error loading team details: ' + err.message);
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getActionIcon(action) {
  const icons = {
    login: '🔓',
    logout: '👋',
    create: '➕',
    update: '✏️',
    delete: '🗑️',
    activate: '✅',
    deactivate: '❌',
    revert: '↩️',
    info: '📝'
  };
  return icons[action] || '📝';
}

function formatTime(timestamp) {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  
  if (diff < 60) return 'Just now';
  if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
  if (diff < 86400) return Math.floor(diff / 3600) + ' hours ago';
  if (diff < 604800) return Math.floor(diff / 86400) + ' days ago';
  
  return date.toLocaleDateString();
}

function closeModal(modalId) {
  const modal = $(`#${modalId}`);
  if (modal) modal.remove();
}

// Initialize
(async function init() {
  console.log('Admin dashboard initialized');
  await loadOverview();
})();

async function loadAthletes() {
  const data = await fetchAPI('athletes');
  const content = $('#athletesContent');
  
  if (!data || data.length === 0) {
    content.innerHTML = '<div class="empty-state">No athletes found</div>';
    return;
  }
  
  // Group athletes by sport and gender
  const grouped = {};
  
  data.forEach(athlete => {
    const sportName = athlete.sports_name || 'Unassigned';
    const gender = athlete.gender || 'Unknown';
    const key = `${sportName}_${gender}`;
    
    if (!grouped[key]) {
      grouped[key] = {
        sport: sportName,
        gender: gender,
        athletes: []
      };
    }
    grouped[key].athletes.push(athlete);
  });
  
  let html = '';
  
  // Sort groups by sport name, then gender
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    const groupA = grouped[a];
    const groupB = grouped[b];
    
    // First sort by sport name
    const sportCompare = groupA.sport.localeCompare(groupB.sport);
    if (sportCompare !== 0) return sportCompare;
    
    // Then by gender (Male, Female, Unknown)
    const genderOrder = { 'Male': 1, 'Female': 2, 'Unknown': 3 };
    return (genderOrder[groupA.gender] || 4) - (genderOrder[groupB.gender] || 4);
  });
  
  sortedKeys.forEach(key => {
    const group = grouped[key];
    const genderIcon = group.gender === 'Male' ? '♂️' : group.gender === 'Female' ? '♀️' : '⚧';
    const sportIcon = group.sport === 'Unassigned' ? '❓' : '⚽';
    
    // Sort athletes alphabetically by first name, then last name
    group.athletes.sort((a, b) => {
      const firstNameCompare = a.f_name.localeCompare(b.f_name);
      if (firstNameCompare !== 0) return firstNameCompare;
      return a.l_name.localeCompare(b.l_name);
    });
    
    html += `
      <div class="group-header">
        <div class="group-title">${sportIcon} ${escapeHtml(group.sport)} ${genderIcon} ${escapeHtml(group.gender)}</div>
        <div class="group-badge">${group.athletes.length} ${group.athletes.length === 1 ? 'athlete' : 'athletes'}</div>
      </div>
      <div class="data-grid">
    `;
    
    group.athletes.forEach(athlete => {
      const statusBadge = athlete.is_active == 1 
        ? '<span class="badge badge-active">Active</span>' 
        : '<span class="badge badge-inactive">Inactive</span>';
      
      const fullName = `${athlete.f_name} ${athlete.l_name}`;
      const initials = `${athlete.f_name.charAt(0)}${athlete.l_name.charAt(0)}`.toUpperCase();
      
      html += `
        <div class="data-card">
          <div class="data-card-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div class="user-avatar" style="width: 36px; height: 36px;">${escapeHtml(initials)}</div>
              <div class="data-card-title">${escapeHtml(fullName)}</div>
            </div>
            ${statusBadge}
          </div>
          <div class="data-card-meta">
            ${athlete.team_name ? `👥 Team: ${escapeHtml(athlete.team_name)}` : '👥 No team assigned'}
            ${athlete.college_name ? `<br>🏛️ ${escapeHtml(athlete.college_name)}` : ''}
            ${athlete.course ? `<br>📚 ${escapeHtml(athlete.course)}` : ''}
          </div>
          <div class="data-card-actions">

          </div>
        </div>
      `;
    });
    
    html += '</div>';
  });
  
  content.innerHTML = html;
}

function viewAthlete(personId) {
  // Navigate to athlete details or show modal
  alert('Athlete details view - Person ID: ' + personId);
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function loadLogs() {
  try {
    const filter = $('#logFilter')?.value || '';
    const data = await fetchAPI('logs', filter ? { filter } : {});
    const content = $('#logsContent');
    
    if (!data || data.length === 0) {
      content.innerHTML = '<div class="empty-state">No activity logs found</div>';
      return;
    }
    
    let html = '';
    
    data.forEach(log => {
      const isReverted = log.reverted_at !== null;
      const canRevert = log.can_revert == 1 && !isReverted;
      const hasDetails = log.old_data || log.new_data || log.target_table;
      
      html += `
        <div class="log-card ${isReverted ? 'log-reverted' : ''}" data-log-id="${log.log_id}">
          <div class="log-header">
            <div class="log-main-info">
              <div class="log-icon-wrapper">
                <div class="log-icon ${log.action || 'info'}">${getActionIcon(log.action || 'info')}</div>
              </div>
              <div class="log-details-wrapper">
                <div class="log-action-text">${escapeHtml(log.description)}</div>
                <div class="log-metadata">
                  <span class="log-meta-item">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                    </svg>
                    ${escapeHtml(log.user_name || 'System')}
                  </span>
                  <span class="log-meta-item">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8.5 5.5a.5.5 0 0 0-1 0v3.362l-1.429 2.38a.5.5 0 1 0 .858.515l1.5-2.5A.5.5 0 0 0 8.5 9V5.5z"/>
                      <path d="M6.5 0a.5.5 0 0 0 0 1H7v1.07a7.001 7.001 0 0 0-3.273 12.474l-.602.602a.5.5 0 0 0 .707.708l.746-.746A6.97 6.97 0 0 0 8 16a6.97 6.97 0 0 0 3.422-.892l.746.746a.5.5 0 0 0 .707-.708l-.601-.602A7.001 7.001 0 0 0 9 2.07V1h.5a.5.5 0 0 0 0-1h-3zm1.038 3.018a6.093 6.093 0 0 1 .924 0 6 6 0 1 1-.924 0zM0 3.5c0 .753.333 1.429.86 1.887A8.035 8.035 0 0 1 4.387 1.86 2.5 2.5 0 0 0 0 3.5zM13.5 1c-.753 0-1.429.333-1.887.86a8.035 8.035 0 0 1 3.527 3.527A2.5 2.5 0 0 0 13.5 1z"/>
                    </svg>
                    ${formatDetailedTime(log.created_at)}
                  </span>
                  <span class="log-meta-item">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3z"/>
                    </svg>
                    ${escapeHtml(log.module_name)}
                  </span>
                </div>
              </div>
            </div>
            <div class="log-actions">
              ${hasDetails ? `
                <button class="btn-icon" onclick="toggleLogDetails(${log.log_id})" title="View details">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                  </svg>
                </button>
              ` : ''}
              ${canRevert ? `
                <button class="btn-icon btn-revert" onclick="showRevertModal(${log.log_id})" title="Revert this action">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/>
                    <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/>
                  </svg>
                </button>
              ` : ''}
            </div>
          </div>
          
          ${isReverted ? `
            <div class="log-reverted-banner">
              ⚠️ This action was reverted on ${formatDetailedTime(log.reverted_at)}
            </div>
          ` : ''}
          
          ${hasDetails ? `
            <div class="log-details-panel" id="logDetails${log.log_id}" style="display: none;">
              <div class="log-detail-grid">
                <div class="log-detail-item">
                  <strong>Log ID:</strong> #${log.log_id}
                </div>
                <div class="log-detail-item">
                  <strong>Action Type:</strong> 
                  <span class="badge badge-${getActionBadgeClass(log.action || 'info')}">${escapeHtml(log.action || 'info')}</span>
                </div>
                ${log.target_table ? `
                  <div class="log-detail-item">
                    <strong>Target Table:</strong> ${escapeHtml(log.target_table)}
                  </div>
                ` : ''}
                ${log.target_id ? `
                  <div class="log-detail-item">
                    <strong>Target ID:</strong> ${log.target_id}
                  </div>
                ` : ''}
              </div>
              
              ${log.old_data ? `
                <div class="log-data-section">
                  <strong>📋 Previous Data (Before Change):</strong>
                  <pre class="log-data-json">${formatJSON(log.old_data)}</pre>
                </div>
              ` : ''}
              
              ${log.new_data ? `
                <div class="log-data-section">
                  <strong>📄 New Data (After Change):</strong>
                  <pre class="log-data-json">${formatJSON(log.new_data)}</pre>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `;
    });
    
    content.innerHTML = html;
  } catch (err) {
    console.error('loadLogs error:', err);
    $('#logsContent').innerHTML = '<div class="empty-state">Error loading logs</div>';
  }
}

// ==========================================
// HELPER FUNCTIONS - Add to admin.js
// ==========================================

function toggleLogDetails(logId) {
  const panel = $(`#logDetails${logId}`);
  const btn = event.target.closest('button');
  
  if (panel) {
    const isHidden = panel.style.display === 'none';
    panel.style.display = isHidden ? 'block' : 'none';
    
    // Rotate icon
    if (btn) {
      const svg = btn.querySelector('svg');
      if (svg) {
        svg.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
        svg.style.transition = 'transform 0.2s';
      }
    }
  }
}

function showRevertModal(logId) {
  const modalHTML = `
    <div class="modal active" id="revertModal">
      <div class="modal-content modal-sm">
        <div class="modal-icon" style="color: #d97706; font-size: 48px;">⚠️</div>
        <h3>Revert This Action?</h3>
        <p style="margin-bottom: 16px;">This will undo the logged action and restore the previous state.</p>
        <p style="color: #dc2626; font-weight: 600; font-size: 12px;">⚠️ Warning: This operation cannot be undone!</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="closeModal('revertModal')">Cancel</button>
          <button class="btn" style="background: #d97706; color: white; border-color: #d97706;" 
                  onclick="revertAction(${logId})">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/>
              <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/>
            </svg>
            Revert Action
          </button>
        </div>
      </div>
    </div>
  `;
  
  $('#modalContainer').innerHTML = modalHTML;
}

async function revertAction(logId) {
  try {
    const result = await fetchAPI('revert_action', { log_id: logId }, 'POST');
    
    if (result && result.ok) {
      closeModal('revertModal');
      alert('✅ Action reverted successfully!');
      loadLogs(); // Reload logs to show the revert
    } else {
      alert('❌ ' + (result?.error || 'Failed to revert action'));
    }
  } catch (err) {
    console.error('Revert error:', err);
    alert('❌ Error reverting action');
  }
}

function formatDetailedTime(timestamp) {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  
  // Relative time
  let relative = '';
  if (diff < 60) relative = 'Just now';
  else if (diff < 3600) relative = Math.floor(diff / 60) + ' min ago';
  else if (diff < 86400) relative = Math.floor(diff / 3600) + ' hours ago';
  else if (diff < 604800) relative = Math.floor(diff / 86400) + ' days ago';
  else relative = date.toLocaleDateString();
  
  // Full timestamp
  const full = date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  return `<span title="${full}">${relative}</span>`;
}

function getActionBadgeClass(action) {
  const classes = {
    'create': 'success',
    'update': 'info',
    'delete': 'danger',
    'activate': 'success',
    'deactivate': 'warning',
    'login': 'info',
    'logout': 'secondary',
    'revert': 'warning'
  };
  return classes[action] || 'secondary';
}

function formatJSON(jsonString) {
  try {
    const obj = JSON.parse(jsonString);
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return jsonString;
  }
}

// Update getActionIcon if it doesn't exist in your admin.js
function getActionIcon(action) {
  const icons = {
    login: '🔐',
    logout: '👋',
    create: '➕',
    update: '✏️',
    delete: '🗑️',
    activate: '✅',
    deactivate: '❌',
    revert: '↩️',
    info: '📝'
  };
  return icons[action] || '📝';
}

function formatTime(timestamp) {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  
  if (diff < 60) return 'Just now';
  if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
  if (diff < 86400) return Math.floor(diff / 3600) + ' hours ago';
  if (diff < 604800) return Math.floor(diff / 86400) + ' days ago';
  
  return date.toLocaleDateString();
}

function closeModal(modalId) {
  const modal = $(`#${modalId}`);
  if (modal) modal.remove();
}

// User search
$('#userSearch')?.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  $$('.user-table tbody tr').forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query) ? '' : 'none';
  });
});

// ==========================================
// SPORTS SETUP
// ==========================================

async function loadSports() {
  try {
    const data = await fetchAPI('sports');
    const container = $('#sportsContent');
    
    if (!data || data.length === 0) {
      container.innerHTML = '<div class="empty-state">No sports found</div>';
      return;
    }
    
    // Group by active/inactive
    const active = data.filter(s => s.is_active == 1);
    const inactive = data.filter(s => s.is_active == 0);
    
    let html = '';
    
    // Active sports
    if (active.length > 0) {
      html += `
        <div class="group-header">
          <div class="group-title">Active Sports</div>
          <div class="group-badge">${active.length}</div>
        </div>
        <div class="data-grid">
      `;
      
      active.forEach(sport => {
        html += renderSportCard(sport);
      });
      
      html += '</div>';
    }
    
    // Inactive sports
    if (inactive.length > 0) {
      html += `
        <div class="group-header">
          <div class="group-title">Inactive Sports</div>
          <div class="group-badge">${inactive.length}</div>
        </div>
        <div class="data-grid">
      `;
      
      inactive.forEach(sport => {
        html += renderSportCard(sport);
      });
      
      html += '</div>';
    }
    
    container.innerHTML = html;
    setupSportsSearch();
    
  } catch (err) {
    console.error('Error loading sports:', err);
    $('#sportsContent').innerHTML = '<div class="empty-state">Error loading sports</div>';
  }
}

function renderSportCard(sport) {
  const typeLabel = sport.team_individual === 'team' ? '👥 Team Sport' : '👤 Individual Sport';
  const genderLabel = sport.men_women || 'Mixed';
  const statusBadge = sport.is_active == 1 
    ? '<span class="badge badge-active">Active</span>' 
    : '<span class="badge badge-inactive">Inactive</span>';
  
  const sportData = JSON.stringify(sport).replace(/'/g, "\\'").replace(/"/g, '&quot;');
  
  return `
    <div class="data-card" data-sport-name="${sport.sports_name.toLowerCase()}">
      <div class="data-card-header">
        <div class="data-card-title">${escapeHtml(sport.sports_name)}</div>
        ${statusBadge}
      </div>
      <div class="data-card-meta">
        ${typeLabel} • ${genderLabel}<br>
        ${sport.team_individual === 'team' ? `Required: ${sport.num_req_players || 'N/A'} • Reserve: ${sport.num_res_players || 'N/A'}` : ''}
        ${sport.weight_class ? `<br>Weight Class: ${sport.weight_class}` : ''}
      </div>
      <div class="data-card-actions">
        <button class="btn btn-sm" onclick='editSport(${sportData})'>
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
          </svg>
          Edit
        </button>
        <button class="btn btn-sm ${sport.is_active == 1 ? 'btn-danger' : 'btn-success'}" 
                onclick="toggleSport(${sport.sports_id}, ${sport.is_active == 1 ? 0 : 1})">
          ${sport.is_active == 1 ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  `;
}

function setupSportsSearch() {
  const searchInput = $('#sportsSearch');
  if (!searchInput) return;
  
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('#sportsContent .data-card');
    
    cards.forEach(card => {
      const sportName = card.dataset.sportName;
      if (sportName.includes(query)) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  });
}

function showSportModal(sport = null) {
  const isEdit = sport !== null;
  const modalHTML = `
    <div class="modal active" id="sportModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>${isEdit ? 'Edit Sport' : 'Add New Sport'}</h3>
          <button class="modal-close" onclick="closeSportModal()">×</button>
        </div>
        <div class="modal-body">
          <form id="sportForm" onsubmit="saveSport(event, ${isEdit})">
            <input type="hidden" id="sport_id" value="${isEdit ? sport.sports_id : ''}">
            
            <div class="form-group">
              <label class="form-label">Sport Name *</label>
              <input type="text" class="form-control" id="sports_name" 
                     value="${isEdit ? escapeHtml(sport.sports_name) : ''}" required>
            </div>
            
            <div class="form-group">
              <label class="form-label">Type *</label>
              <select class="form-control" id="team_individual" required onchange="togglePlayerFields()">
                <option value="">-- Select Type --</option>
                <option value="team" ${isEdit && sport.team_individual === 'team' ? 'selected' : ''}>Team Sport</option>
                <option value="individual" ${isEdit && sport.team_individual === 'individual' ? 'selected' : ''}>Individual Sport</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Gender Category *</label>
              <select class="form-control" id="men_women" required>
                <option value="">-- Select Category --</option>
                <option value="Male" ${isEdit && sport.men_women === 'Male' ? 'selected' : ''}>Men</option>
                <option value="Female" ${isEdit && sport.men_women === 'Female' ? 'selected' : ''}>Women</option>
                <option value="Mixed" ${isEdit && sport.men_women === 'Mixed' ? 'selected' : ''}>Mixed</option>
              </select>
            </div>
            
            <div id="teamFields" style="${isEdit && sport.team_individual === 'team' ? '' : 'display:none'}">
              <div class="form-group">
                <label class="form-label">Required Players</label>
                <input type="number" class="form-control" id="num_req_players" min="1"
                       value="${isEdit && sport.num_req_players ? sport.num_req_players : ''}">
              </div>
              
              <div class="form-group">
                <label class="form-label">Reserve Players</label>
                <input type="number" class="form-control" id="num_res_players" min="0"
                       value="${isEdit && sport.num_res_players ? sport.num_res_players : ''}">
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Weight Class (Optional)</label>
              <input type="text" class="form-control" id="weight_class" 
                     value="${isEdit && sport.weight_class ? escapeHtml(sport.weight_class) : ''}" 
                     placeholder="e.g., Light, Medium, Heavy">
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeSportModal()">Cancel</button>
          <button type="submit" form="sportForm" class="btn btn-primary">
            ${isEdit ? 'Update Sport' : 'Add Sport'}
          </button>
        </div>
      </div>
    </div>
  `;
  
  $('#modalContainer').innerHTML = modalHTML;
}

function togglePlayerFields() {
  const type = $('#team_individual').value;
  const teamFields = $('#teamFields');
  if (type === 'team') {
    teamFields.style.display = '';
  } else {
    teamFields.style.display = 'none';
  }
}

async function saveSport(e, isEdit) {
  e.preventDefault();
  
  const data = {
    sports_name: $('#sports_name').value.trim(),
    team_individual: $('#team_individual').value,
    men_women: $('#men_women').value,
    weight_class: $('#weight_class').value.trim() || null,
    num_req_players: $('#num_req_players').value || null,
    num_res_players: $('#num_res_players').value || null
  };
  
  if (isEdit) {
    data.sports_id = parseInt($('#sport_id').value);
  }
  
  try {
    const action = isEdit ? 'update_sport' : 'create_sport';
    const result = await fetchAPI(action, data, 'POST');
    
    if (result.ok) {
      closeSportModal();
      loadSports();
      alert(isEdit ? 'Sport updated successfully' : 'Sport added successfully');
    } else {
      alert(result.error || 'Failed to save sport');
    }
  } catch (err) {
    console.error('Error saving sport:', err);
    alert('Error saving sport');
  }
}

function editSport(sport) {
  showSportModal(sport);
}

async function toggleSport(sports_id, is_active) {
  const action = is_active == 1 ? 'activate' : 'deactivate';
  if (!confirm(`Are you sure you want to ${action} this sport?`)) return;
  
  try {
    const result = await fetchAPI('toggle_sport', { sports_id, is_active }, 'POST');
    
    if (result.ok) {
      loadSports();
      alert(`Sport ${action}d successfully`);
    } else {
      alert(result.error || `Failed to ${action} sport`);
    }
  } catch (err) {
    console.error(`Error ${action}ing sport:`, err);
    alert(`Error ${action}ing sport`);
  }
}

function closeSportModal() {
  $('#modalContainer').innerHTML = '';
}

// ==========================================
// SECURITY SETTINGS
// ==========================================

async function showSecuritySettings() {
  try {
    const data = await fetchAPI('get_security_settings');
    
    if (!data || !data.ok) {
      alert('Failed to load security settings');
      return;
    }
    
    const settings = data.settings;
    
    const modalHTML = `
      <div class="modal active">
        <div class="modal-content" style="max-width: 700px;">
          <div class="modal-header">
            <h3>🔐 Security Settings</h3>
            <button class="close-btn" onclick="closeSecuritySettings()">×</button>
          </div>
          
          <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
            <form id="securitySettingsForm">
              
              <div class="settings-section">
                <h4>Password Policy</h4>
                
                <div class="form-row">
                  <div class="form-group">
                    <label>Minimum Password Length</label>
                    <input type="number" name="min_password_length" 
                           value="${escapeHtml(settings.min_password_length)}" 
                           min="4" max="32" class="form-control" required>
                    <small>Minimum characters required (4-32)</small>
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label class="checkbox-label">
                      <input type="checkbox" name="require_uppercase" 
                             ${settings.require_uppercase == '1' ? 'checked' : ''}>
                      <span>Require Uppercase Letters (A-Z)</span>
                    </label>
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label class="checkbox-label">
                      <input type="checkbox" name="require_lowercase" 
                             ${settings.require_lowercase == '1' ? 'checked' : ''}>
                      <span>Require Lowercase Letters (a-z)</span>
                    </label>
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label class="checkbox-label">
                      <input type="checkbox" name="require_numbers" 
                             ${settings.require_numbers == '1' ? 'checked' : ''}>
                      <span>Require Numbers (0-9)</span>
                    </label>
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label class="checkbox-label">
                      <input type="checkbox" name="require_special" 
                             ${settings.require_special == '1' ? 'checked' : ''}>
                      <span>Require Special Characters (!@#$%^&*)</span>
                    </label>
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label>Password Expiry (Days)</label>
                    <input type="number" name="password_expiry_days" 
                           value="${escapeHtml(settings.password_expiry_days)}" 
                           min="0" max="365" class="form-control">
                    <small>Days until password expires (0 = never expires)</small>
                  </div>
                </div>
              </div>
              
              <div class="settings-section">
                <h4>Session Management</h4>
                
                <div class="form-row">
                  <div class="form-group">
                    <label>Session Timeout (Seconds)</label>
                    <input type="number" name="session_timeout" 
                           value="${escapeHtml(settings.session_timeout)}" 
                           min="300" max="86400" class="form-control" required>
                    <small>Auto-logout after inactivity (300-86400 seconds)</small>
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label class="checkbox-label">
                      <input type="checkbox" name="force_logout_inactive" 
                             ${settings.force_logout_inactive == '1' ? 'checked' : ''}>
                      <span>Force Logout on Inactivity</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div class="settings-section">
                <h4>Account Security</h4>
                
                <div class="form-row">
                  <div class="form-group">
                    <label>Maximum Login Attempts</label>
                    <input type="number" name="max_login_attempts" 
                           value="${escapeHtml(settings.max_login_attempts)}" 
                           min="3" max="10" class="form-control" required>
                    <small>Failed attempts before account lockout (3-10)</small>
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label>Lockout Duration (Seconds)</label>
                    <input type="number" name="lockout_duration" 
                           value="${escapeHtml(settings.lockout_duration)}" 
                           min="60" max="3600" class="form-control" required>
                    <small>Account locked for this duration (60-3600 seconds)</small>
                  </div>
                </div>
              </div>
              
            </form>
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick="closeSecuritySettings()">
              Cancel
            </button>
            <button type="button" class="btn btn-primary" onclick="saveSecuritySettings()">
              💾 Save Settings
            </button>
          </div>
        </div>
      </div>
    `;
    
    $('#modalContainer').innerHTML = modalHTML;
    
  } catch (err) {
    console.error('Error loading security settings:', err);
    alert('Error loading security settings');
  }
}

async function saveSecuritySettings() {
  try {
    const form = $('#securitySettingsForm');
    const formData = new FormData(form);
    
    const settings = {};
    
    // Text/number inputs
    ['min_password_length', 'password_expiry_days', 'session_timeout', 
     'max_login_attempts', 'lockout_duration'].forEach(field => {
      settings[field] = formData.get(field) || '0';
    });
    
    // Checkboxes
    ['require_uppercase', 'require_lowercase', 'require_numbers', 
     'require_special', 'force_logout_inactive'].forEach(field => {
      settings[field] = formData.get(field) ? '1' : '0';
    });
    
    const result = await fetchAPI('update_security_settings', settings, 'POST');
    
    if (result && result.ok) {
      alert('✅ Security settings updated successfully!');
      closeSecuritySettings();
    } else {
      alert('Failed to update security settings: ' + (result?.error || 'Unknown error'));
    }
    
  } catch (err) {
    console.error('Error saving security settings:', err);
    alert('Error saving security settings');
  }
}

function closeSecuritySettings() {
  $('#modalContainer').innerHTML = '';
}

// ==========================================
// DATABASE BACKUP
// ==========================================

async function showDatabaseBackup() {
  try {
    const data = await fetchAPI('list_backups');
    
    if (!data || !data.ok) {
      alert('Failed to load backups');
      return;
    }
    
    const backups = data.backups || [];
    
    let backupsHTML = '';
    
    if (backups.length === 0) {
      backupsHTML = '<div class="empty-state">No backups found. Create your first backup!</div>';
    } else {
      backupsHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Filename</th>
              <th>Size</th>
              <th>Created</th>
              <th>Created By</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${backups.map(backup => `
              <tr>
                <td><strong>${escapeHtml(backup.filename)}</strong></td>
                <td>${backup.filesize_mb} MB</td>
                <td>${new Date(backup.created_at).toLocaleString()}</td>
                <td>${escapeHtml(backup.created_by_name || backup.created_by_username || 'Unknown')}</td>
                <td>
                  ${backup.file_exists ? 
                    '<span class="badge badge-success">Available</span>' : 
                    '<span class="badge badge-danger">Missing</span>'}
                </td>
                <td>
                  <div class="action-buttons">
                    ${backup.file_exists ? `
                      <button class="btn-icon" onclick="downloadBackup(${backup.backup_id})" 
                              title="Download">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                          <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                        </svg>
                      </button>
                      <button class="btn-icon btn-warning" onclick="confirmRestoreBackup(${backup.backup_id}, '${escapeHtml(backup.filename)}')" 
                              title="Restore">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                          <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                        </svg>
                      </button>
                    ` : ''}
                    <button class="btn-icon btn-danger" onclick="confirmDeleteBackup(${backup.backup_id}, '${escapeHtml(backup.filename)}')" 
                            title="Delete">
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                        <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
    
    const modalHTML = `
      <div class="modal active">
        <div class="modal-content" style="max-width: 900px;">
          <div class="modal-header">
            <h3>💾 Database Backup Management</h3>
            <button class="close-btn" onclick="closeDatabaseBackup()">×</button>
          </div>
          
          <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
            
            <div class="backup-info-panel">
              <div class="info-card">
                <div class="info-icon">📦</div>
                <div>
                  <div class="info-label">Total Backups</div>
                  <div class="info-value">${backups.length}</div>
                </div>
              </div>
              
              <div class="info-card">
                <div class="info-icon">💽</div>
                <div>
                  <div class="info-label">Total Size</div>
                  <div class="info-value">${backups.reduce((sum, b) => sum + parseFloat(b.filesize_mb), 0).toFixed(2)} MB</div>
                </div>
              </div>
              
              <div class="info-card">
                <div class="info-icon">📅</div>
                <div>
                  <div class="info-label">Latest Backup</div>
                  <div class="info-value">${backups.length > 0 ? new Date(backups[0].created_at).toLocaleDateString() : 'None'}</div>
                </div>
              </div>
            </div>
            
            <div class="backup-actions-bar">
              <button class="btn btn-primary" onclick="createNewBackup()">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                </svg>
                Create New Backup
              </button>
            </div>
            
            ${backupsHTML}
            
            <div class="backup-notice">
              <strong>⚠️ Important:</strong>
              <ul style="margin: 8px 0 0 20px; font-size: 12px;">
                <li>Backups are stored on the server in the /backups directory</li>
                <li>Restoring a backup will overwrite the current database</li>
                <li>Always download important backups for off-site storage</li>
                <li>Regular backups are recommended before major updates</li>
              </ul>
            </div>
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick="closeDatabaseBackup()">
              Close
            </button>
          </div>
        </div>
      </div>
    `;
    
    $('#modalContainer').innerHTML = modalHTML;
    
  } catch (err) {
    console.error('Error loading database backups:', err);
    alert('Error loading database backups');
  }
}

async function createNewBackup() {
  if (!confirm('Create a new database backup? This may take a few moments.')) {
    return;
  }
  
  try {
    const result = await fetchAPI('create_backup', {}, 'POST');
    
    if (result && result.ok) {
      alert(`✅ Backup created successfully!\n\nFilename: ${result.backup.filename}\nSize: ${result.backup.filesize} MB`);
      showDatabaseBackup(); // Refresh the list
    } else {
      alert('Failed to create backup: ' + (result?.error || 'Unknown error'));
    }
    
  } catch (err) {
    console.error('Error creating backup:', err);
    alert('Error creating backup');
  }
}

function downloadBackup(backupId) {
  window.location.href = `api.php?action=download_backup&backup_id=${backupId}`;
}

async function confirmDeleteBackup(backupId, filename) {
  if (!confirm(`Delete backup: ${filename}?\n\nThis action cannot be undone.`)) {
    return;
  }
  
  try {
    const result = await fetchAPI('delete_backup', { backup_id: backupId }, 'POST');
    
    if (result && result.ok) {
      alert('✅ Backup deleted successfully');
      showDatabaseBackup(); // Refresh the list
    } else {
      alert('Failed to delete backup: ' + (result?.error || 'Unknown error'));
    }
    
  } catch (err) {
    console.error('Error deleting backup:', err);
    alert('Error deleting backup');
  }
}

async function confirmRestoreBackup(backupId, filename) {
  if (!confirm(`⚠️ RESTORE DATABASE FROM BACKUP?\n\nFilename: ${filename}\n\nThis will OVERWRITE the current database!\n\nAre you absolutely sure?`)) {
    return;
  }
  
  if (!confirm('FINAL CONFIRMATION: This action will replace all current data. Continue?')) {
    return;
  }
  
  try {
    const result = await fetchAPI('restore_backup', { backup_id: backupId }, 'POST');
    
    if (result && result.ok) {
      alert('✅ Database restored successfully!\n\nThe page will reload.');
      window.location.reload();
    } else {
      alert('Failed to restore backup: ' + (result?.error || 'Unknown error'));
    }
    
  } catch (err) {
    console.error('Error restoring backup:', err);
    alert('Error restoring backup');
  }
}

function closeDatabaseBackup() {
  $('#modalContainer').innerHTML = '';
}

// Initialize
(async function init() {
  console.log('Admin dashboard initialized');
  await loadOverview();
})();