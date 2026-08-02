function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });

  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.classList.remove('active');
  });

  document.getElementById(tabName + '-tab').classList.add('active');
  event.target.classList.add('active');

  if (tabName === 'game' && !window.gameInitialized) {
    initGame();
    window.gameInitialized = true;
  }
}

document.getElementById('severity').addEventListener('input', (e) => {
  document.getElementById('severity-display').textContent = e.target.value;
});

async function submitReport() {
  const latitude = parseFloat(document.getElementById('latitude').value);
  const longitude = parseFloat(document.getElementById('longitude').value);
  const severity = parseInt(document.getElementById('severity').value);
  const description = document.getElementById('description').value;

  if (!latitude || !longitude) {
    alert('Please enter coordinates');
    return;
  }

  try {
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude,
        longitude,
        severity,
        description
      })
    });

    const data = await response.json();
    if (data.success) {
      alert('✅ Report submitted anonymously!');
      document.getElementById('latitude').value = '';
      document.getElementById('longitude').value = '';
      document.getElementById('description').value = '';
      loadReports();
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

async function loadReports() {
  try {
    const response = await fetch('/api/reports');
    const reports = await response.json();

    const container = document.getElementById('reports-container');
    if (reports.length === 0) {
      container.innerHTML = '<p class="loading">No reports yet</p>';
      return;
    }

    container.innerHTML = reports.map(report => `
      <div class="report-item">
        <div class="report-info">
          <div class="report-location">📍 ${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}</div>
          <div class="report-details">
            ${report.description || 'No description'}
            <br><small>${new Date(report.timestamp).toLocaleString()}</small>
          </div>
        </div>
        <div class="severity-badge">🔥 ${report.severity}/5</div>
        <button class="verify-btn" onclick="voteReport(${report.id})">👍 (${report.votes})</button>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error:', err);
  }
}

async function voteReport(reportId) {
  try {
    const response = await fetch(`/api/reports/${reportId}/vote`, {
      method: 'POST'
    });
    loadReports();
  } catch (err) {
    console.error('Error:', err);
  }
}

async function loadLeaderboard() {
  try {
    const response = await fetch('/api/scores');
    const scores = await response.json();

    const container = document.getElementById('leaderboard-container');
    if (scores.length === 0) {
      container.innerHTML = '<p class="loading">No scores yet</p>';
      return;
    }

    container.innerHTML = scores.map((score, index) => `
      <div class="leaderboard-item">
        <span class="leaderboard-rank">#${index + 1}</span>
        <span class="leaderboard-name">${score.playerName}</span>
        <span class="leaderboard-score">⭐ ${score.score}</span>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error:', err);
  }
}

loadReports();
loadLeaderboard();
