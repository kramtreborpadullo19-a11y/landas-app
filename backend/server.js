require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'www')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'www', 'index.html'));
});

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('Landas backend listening on port ${PORT}'));