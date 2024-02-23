const express = require('express');
const multer = require('multer');
const { Pool } = require('pg');
const fs = require('fs');

const app = express();
const port = 3000;

// PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'audiofile_database',
  password: 'root',
  port: 5432,
});

// Multer memory storage configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Serve HTML file with file upload form
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/audio', (req, res) => {
  res.sendFile(__dirname + '/audio.html');
});

// Route to upload audio file
app.post('/upload', upload.single('audio'), async (req, res) => {
  try {
    const fileData = req.file.buffer; // Access the file content from memory buffer
    const fileName = req.file.originalname;

    // Insert the file info into the database
    const result = await pool.query('INSERT INTO audio_files (name, file_data) VALUES ($1, $2) RETURNING *', [fileName, fileData]);

    res.send('File uploaded successfully!');
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('Error uploading file');
  }
});

// Route to fetch all audio files
app.get('/audio-files', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT name, file_data FROM audio_files');
    const audioFiles = result.rows.map(row => ({
      name: row.name,
      file_data: row.file_data.toString('base64') // Encode file data as base64
    }));
    client.release();

    res.json(audioFiles);
  } catch (error) {
    console.error('Error fetching audio files:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
