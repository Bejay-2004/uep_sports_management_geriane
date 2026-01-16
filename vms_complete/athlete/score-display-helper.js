/**
 * Score Display Helper Functions
 * Formats sport-specific scores for better readability
 * UPDATED: Added Dance Sport support
 */

// Get sport configuration (matches the tournament.js config)
function getSportScoringConfig(sportName) {
  const SPORT_CONFIGS = {
    // Set-based sports
    'volleyball': {
      type: 'sets',
      labels: ['Set 1', 'Set 2', 'Set 3', 'Set 4', 'Set 5'],
      separator: '-',
      maxSets: 5
    },
    'tennis': {
      type: 'sets',
      labels: ['Set 1', 'Set 2', 'Set 3', 'Set 4', 'Set 5'],
      separator: '-',
      maxSets: 5
    },
    'badminton': {
      type: 'sets',
      labels: ['Set 1', 'Set 2', 'Set 3'],
      separator: '-',
      maxSets: 3
    },
    'table tennis': {
      type: 'sets',
      labels: ['Set 1', 'Set 2', 'Set 3', 'Set 4', 'Set 5', 'Set 6', 'Set 7'],
      separator: '-',
      maxSets: 7
    },
    
    // Point-based team sports
    'basketball': {
      type: 'quarters',
      labels: ['Q1', 'Q2', 'Q3', 'Q4', 'OT'],
      separator: '-',
      showTotal: true
    },
    'football': {
      type: 'halves',
      labels: ['1st Half', '2nd Half', 'Extra Time'],
      separator: '-',
      showTotal: true
    },
    'soccer': {
      type: 'halves',
      labels: ['1st Half', '2nd Half', 'Extra Time'],
      separator: '-',
      showTotal: true
    },
    'baseball': {
      type: 'innings',
      labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Extra'],
      statLabels: ['R', 'H', 'E'], // Runs, Hits, Errors
      separator: '-',
      maxInnings: 9,
      showTotal: true
    },
    
    // Time-based sports
    'swimming': {
      type: 'time',
      format: 'MM:SS.mmm',
      labels: ['Time']
    },
    'athletics': {
      type: 'time',
      format: 'MM:SS.mmm',
      labels: ['Time']
    },
    
    // Distance-based sports
    'shot put': {
      type: 'distance',
      unit: 'meters',
      labels: ['Distance']
    },
    'javelin throw': {
      type: 'distance',
      unit: 'meters',
      labels: ['Distance']
    },
    'long jump': {
      type: 'distance',
      unit: 'meters',
      labels: ['Distance']
    },
    'high jump': {
      type: 'distance',
      unit: 'meters',
      labels: ['Height']
    },
    
    // Component-based sports (NEW)
    'dance sport': {
      type: 'components',
      labels: ['Technical', 'Movement', 'Choreography', 'Partnering'],
      shortLabels: ['T', 'M', 'C', 'P'],
      separator: ' ',
      hasAverage: true
    }
  };
  
  const normalized = sportName.toLowerCase().trim();
  
  // Check for exact match
  if (SPORT_CONFIGS[normalized]) {
    return SPORT_CONFIGS[normalized];
  }
  
  // Check for partial matches (e.g., "Dance Sport Solo" or "Dance Sport Pair")
  if (normalized.includes('dance sport') || normalized.includes('dancesport')) {
    return SPORT_CONFIGS['dance sport'];
  }
  
  return {
    type: 'simple',
    labels: ['Score']
  };
}

/**
 * Parse Dance Sport score string back to components
 * Format: "8.75 (T:9.0 M:8.5 C:8.7)" or "8.83 (T:9.0 M:8.5 C:8.7 P:9.2)"
 */
function parseDanceSportScore(scoreString) {
  if (!scoreString) return null;
  
  const match = scoreString.match(/([\d.]+)\s*\(T:([\d.]+)\s*M:([\d.]+)\s*C:([\d.]+)(?:\s*P:([\d.]+))?\)/);
  if (!match) return null;
  
  const result = {
    total: parseFloat(match[1]),
    technical: parseFloat(match[2]),
    movement: parseFloat(match[3]),
    choreography: parseFloat(match[4]),
    isPair: !!match[5]
  };
  
  if (match[5]) {
    result.partnering = parseFloat(match[5]);
  }
  
  return result;
}

/**
 * Format score with labels for display
 * @param {string} score - The raw score from database (e.g., "23-21-25-0-0" or "95 (25-23-22-25)")
 * @param {string} sportName - Name of the sport
 * @param {boolean} detailed - Show detailed breakdown (default: true)
 * @returns {string} HTML formatted score
 */
function formatScoreWithLabels(score, sportName, detailed = true) {
  if (!score) return '-';
  
  const config = getSportScoringConfig(sportName);
  
  // Handle Dance Sport component-based scoring
  if (config.type === 'components') {
    const parsed = parseDanceSportScore(score);
    if (!parsed) return `<strong>${score}</strong>`;
    
    if (!detailed) {
      return `<div style="display: flex; align-items: center; gap: 4px;">
        <strong style="font-size: 16px; color: #111827;">${parsed.total.toFixed(2)}</strong>
        <span style="font-size: 10px; color: #6b7280;">AVG</span>
      </div>`;
    }
    
    let html = `
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 11px; color: #6b7280; font-weight: 500;">Average:</span>
          <strong style="font-size: 16px; color: #111827;">${parsed.total.toFixed(2)}</strong>
        </div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
    `;
    
    // Technical
    html += `
      <span style="
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        color: #1e40af;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
      ">
        T: ${parsed.technical.toFixed(1)}
      </span>
    `;
    
    // Movement
    html += `
      <span style="
        background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
        color: #065f46;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
      ">
        M: ${parsed.movement.toFixed(1)}
      </span>
    `;
    
    // Choreography
    html += `
      <span style="
        background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
        color: #9f1239;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
      ">
        C: ${parsed.choreography.toFixed(1)}
      </span>
    `;
    
    // Partnering (if pair)
    if (parsed.isPair) {
      html += `
        <span style="
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #92400e;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        ">
          P: ${parsed.partnering.toFixed(1)}
        </span>
      `;
    }
    
    html += `
        </div>
        <div style="font-size: 10px; color: #9ca3af; margin-top: 2px;">
          ${parsed.isPair ? '👥 Pair Event' : '👤 Solo Event'}
        </div>
      </div>
    `;
    
    return html;
  }
  
  // Handle Baseball innings-based scoring with R-H-E
  if (config.type === 'innings') {
    // Format: "R-H-E (i1-i2-i3-i4-i5-i6-i7-i8-i9-extra)"
    const match = score.match(/^(\d+)-(\d+)-(\d+)\s*\(([^)]+)\)$/);
    if (match) {
      const runs = match[1];
      const hits = match[2];
      const errors = match[3];
      const inningsStr = match[4];
      
      if (!detailed) {
        return `<div style="display: flex; align-items: center; gap: 6px;">
          <strong style="font-size: 16px; color: #111827;">${runs}</strong>
          <span style="font-size: 10px; color: #6b7280;">R</span>
          <span style="color: #d1d5db;">|</span>
          <strong style="font-size: 14px; color: #374151;">${hits}</strong>
          <span style="font-size: 10px; color: #6b7280;">H</span>
          <span style="color: #d1d5db;">|</span>
          <strong style="font-size: 14px; color: #374151;">${errors}</strong>
          <span style="font-size: 10px; color: #6b7280;">E</span>
        </div>`;
      }
      
      const innings = inningsStr.split('-');
      
      let html = `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; gap: 12px; align-items: center;">
            <span style="
              background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
              color: #991b1b;
              padding: 4px 10px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 700;
            ">
              R: ${runs}
            </span>
            <span style="
              background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
              color: #166534;
              padding: 4px 10px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 700;
            ">
              H: ${hits}
            </span>
            <span style="
              background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
              color: #92400e;
              padding: 4px 10px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 700;
            ">
              E: ${errors}
            </span>
          </div>
          <div style="font-size: 11px; color: #6b7280;">
            <strong>Innings:</strong> ${innings.slice(0, 9).join('-')}${innings[9] ? ` + ${innings[9]} (Extra)` : ''}
          </div>
        </div>
      `;
      
      return html;
    }
  }
  
  // Handle basketball/football style scores with totals
  if (score.includes('(')) {
    const parts = score.match(/^(\d+)\s*\(([^)]+)\)$/);
    if (parts) {
      const total = parts[1];
      const breakdown = parts[2];
      
      if (!detailed) {
        return `<strong style="font-size: 14px;">${total}</strong>`;
      }
      
      const scores = breakdown.split(config.separator || '-');
      let html = '<div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px;">';
      html += `<div style="display: flex; align-items: center; gap: 6px;"><span style="color: #6b7280; font-size: 10px; font-weight: 500;">Total:</span><strong style="color: #111827; font-size: 14px;">${total}</strong></div>`;
      html += '<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px;">';
      
      scores.forEach((s, idx) => {
        if (s && s.trim() !== '0') {
          const label = config.labels[idx] || `P${idx + 1}`;
          html += `<span style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 10px; white-space: nowrap;"><span style="color: #6b7280;">${label}:</span> <strong style="color: #111827;">${s}</strong></span>`;
        }
      });
      
      html += '</div></div>';
      return html;
    }
  }
  
  // Handle set-based sports
  if (config.type === 'sets' || config.type === 'quarters' || config.type === 'halves' || config.type === 'innings') {
    const scores = score.split(config.separator || '-');
    
    if (!detailed) {
      // Show only total sets won or final score
      const nonZeroScores = scores.filter(s => s && s.trim() !== '0');
      return `<strong>${nonZeroScores.join('-')}</strong>`;
    }
    
    let html = '<div style="display: flex; flex-direction: column; gap: 3px; font-size: 11px;">';
    
    scores.forEach((s, idx) => {
      if (s && s.trim() !== '' && s.trim() !== '0') {
        const label = config.labels[idx] || `${config.type === 'innings' ? 'Inn' : 'Set'} ${idx + 1}`;
        html += `
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="color: #6b7280; font-size: 10px; min-width: 45px; font-weight: 500;">${label}:</span>
            <strong style="color: #111827; font-size: 12px;">${s}</strong>
          </div>
        `;
      }
    });
    
    html += '</div>';
    return html;
  }
  
  // Handle time-based sports
  if (config.type === 'time') {
    return `<strong>${score}</strong> <span style="font-size: 10px; color: #6b7280;">(${config.labels[0]})</span>`;
  }
  
  // Handle distance-based sports
  if (config.type === 'distance') {
    return `<strong>${score}</strong> <span style="font-size: 10px; color: #6b7280;">(${config.labels[0]})</span>`;
  }
  
  // Default: simple score
  return `<strong>${score}</strong>`;
}

/**
 * Format score for compact display (mobile-friendly)
 * @param {string} score - The raw score
 * @param {string} sportName - Name of the sport
 * @returns {string} Compact formatted score
 */
function formatScoreCompact(score, sportName) {
  return formatScoreWithLabels(score, sportName, false);
}

/**
 * Get score breakdown as an array of objects
 * @param {string} score - The raw score
 * @param {string} sportName - Name of the sport
 * @returns {Array} Array of {label, value} objects
 */
function getScoreBreakdown(score, sportName) {
  if (!score) return [];
  
  const config = getSportScoringConfig(sportName);
  const breakdown = [];
  
  // Handle Dance Sport component-based scoring
  if (config.type === 'components') {
    const parsed = parseDanceSportScore(score);
    if (!parsed) return [];
    
    breakdown.push({ 
      label: 'Average Score', 
      value: parsed.total.toFixed(2), 
      isTotal: true,
      highlight: true
    });
    
    breakdown.push({ 
      label: 'Technical Quality', 
      value: parsed.technical.toFixed(1), 
      isTotal: false,
      color: '#1e40af'
    });
    
    breakdown.push({ 
      label: 'Movement to Music', 
      value: parsed.movement.toFixed(1), 
      isTotal: false,
      color: '#065f46'
    });
    
    breakdown.push({ 
      label: 'Choreography & Presentation', 
      value: parsed.choreography.toFixed(1), 
      isTotal: false,
      color: '#9f1239'
    });
    
    if (parsed.isPair) {
      breakdown.push({ 
        label: 'Partnering Skills', 
        value: parsed.partnering.toFixed(1), 
        isTotal: false,
        color: '#92400e'
      });
    }
    
    breakdown.push({
      label: 'Performance Type',
      value: parsed.isPair ? 'Pair Event' : 'Solo Event',
      isTotal: false,
      isInfo: true
    });
    
    return breakdown;
  }
  
  // Handle scores with totals
  if (score.includes('(')) {
    const parts = score.match(/^(\d+)\s*\(([^)]+)\)$/);
    if (parts) {
      const total = parts[1];
      const scores = parts[2].split(config.separator || '-');
      
      breakdown.push({ label: 'Total', value: total, isTotal: true });
      
      scores.forEach((s, idx) => {
        if (s && s.trim() !== '0') {
          breakdown.push({
            label: config.labels[idx] || `Part ${idx + 1}`,
            value: s.trim(),
            isTotal: false
          });
        }
      });
      
      return breakdown;
    }
  }
  
  // Handle set-based scores
  const scores = score.split(config.separator || '-');
  scores.forEach((s, idx) => {
    if (s && s.trim() !== '' && s.trim() !== '0') {
      breakdown.push({
        label: config.labels[idx] || `Set ${idx + 1}`,
        value: s.trim(),
        isTotal: false
      });
    }
  });
  
  return breakdown;
}

/**
 * Create a detailed score card HTML
 * @param {Object} scoreData - Score data object {score, sportName, competitor, rank, medal}
 * @returns {string} HTML for score card
 */
function createScoreCard(scoreData) {
  const { score, sportName, competitor, rank, medal } = scoreData;
  const breakdown = getScoreBreakdown(score, sportName);
  const config = getSportScoringConfig(sportName);
  
  let html = `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; background: white;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
        <div>
          <div style="font-weight: 600; font-size: 14px;">${competitor || 'Unknown'}</div>
          <div style="font-size: 11px; color: #6b7280;">
            ${sportName}
            ${config.type === 'components' ? ' <span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600;">DANCE SPORT</span>' : ''}
          </div>
        </div>
        <div style="text-align: right;">
  `;
  
  if (rank) {
    html += `<div style="font-size: 12px; color: #6b7280;">Rank: <strong>${rank}</strong></div>`;
  }
  
  if (medal && medal !== 'None') {
    const medalColors = {
      'gold': '#fbbf24',
      'silver': '#9ca3af',
      'bronze': '#d97706'
    };
    html += `
      <div style="background: ${medalColors[medal] || '#e5e7eb'}; 
                  color: ${medal === 'silver' ? '#374151' : '#78350f'}; 
                  padding: 2px 8px; 
                  border-radius: 12px; 
                  font-size: 10px; 
                  font-weight: 600;
                  margin-top: 4px;">
        ${medal.toUpperCase()}
      </div>
    `;
  }
  
  html += `
        </div>
      </div>
      <div style="border-top: 1px solid #f3f4f6; padding-top: 8px;">
  `;
  
  breakdown.forEach(item => {
    if (item.isInfo) {
      html += `
        <div style="
          background: #f9fafb;
          padding: 6px 8px;
          border-radius: 4px;
          font-size: 11px;
          color: #6b7280;
          text-align: center;
          margin-top: 4px;
        ">
          ${item.value}
        </div>
      `;
    } else {
      html += `
        <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px;">
          <span style="color: ${item.color || '#6b7280'}; font-weight: ${item.highlight ? '600' : '400'};">
            ${item.label}:
          </span>
          <strong style="
            color: ${item.color || (item.isTotal ? '#111827' : '#374151')}; 
            font-size: ${item.isTotal ? '14px' : '12px'};
            ${item.highlight ? 'background: #fef3c7; padding: 2px 8px; border-radius: 4px;' : ''}
          ">
            ${item.value}
          </strong>
        </div>
      `;
    }
  });
  
  html += `
      </div>
    </div>
  `;
  
  return html;
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
  window.getSportScoringConfig = getSportScoringConfig;
  window.parseDanceSportScore = parseDanceSportScore;
  window.formatScoreWithLabels = formatScoreWithLabels;
  window.formatScoreCompact = formatScoreCompact;
  window.getScoreBreakdown = getScoreBreakdown;
  window.createScoreCard = createScoreCard;
}