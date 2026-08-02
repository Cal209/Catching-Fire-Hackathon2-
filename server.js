import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

let wildfireReports = [];
let gameScores = [];

// REPORT ENDPOINTS
app.get('/api/reports', (req, res) => {
  res.json(wildfireReports);
});

app.post('/api/reports', (req, res) => {
  const { latitude, longitude, severity, description } = req.body;
  
  if (!latitude || !longitude || !severity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const report = {
    id: Date.now(),
    latitude,
    longitude,
    severity,
    description,
    timestamp: new Date().toISOString(),
    verified: false,
    votes: 0
  };

  wildfireReports.push(report);
  res.json({ success: true, report });
});

app.post('/api/reports/:id/vote', (req, res) => {
  const report = wildfireReports.find(r => r.id == req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  
  report.votes++;
  if (report.votes >= 3) report.verified = true;
  
  res.json(report);
});

app.delete('/api/reports/:id', (req, res) => {
  wildfireReports = wildfireReports.filter(r => r.id != req.params.id);
  res.json({ success: true });
});

// GAME ENDPOINTS
app.get('/api/scores', (req, res) => {
  const sorted = gameScores.sort((a, b) => b.score - a.score).slice(0, 10);
  res.json(sorted);
});

app.post('/api/scores', (req, res) => {
  const { playerName, score, coinsEarned, firefightsCompleted } = req.body;
  
  if (score === undefined) {
    return res.status(400).json({ error: 'Missing score' });
  }

  const scoreEntry = {
    id: Date.now(),
    playerName: playerName || 'Anonymous Hero',
    score,
    coinsEarned,
    firefightsCompleted,
    timestamp: new Date().toISOString()
  };

  gameScores.push(scoreEntry);
  res.json({ success: true, scoreEntry });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🔥 Wildfire Awareness App running at http://localhost:${PORT}`);
});
