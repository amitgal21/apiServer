const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// הגדרת Multer לאחסון תמונות זמניות
const upload = multer({ dest: 'uploads/' });

// נתיב OpenAI (לא משתנה)
app.post('/api/openai', async (req, res) => {
  console.log('Request received:', req.body);
  console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY);

  const { prompt, max_tokens } = req.body;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    console.error('Missing OpenAI API Key');
    return res.status(500).json({ error: 'Missing OpenAI API Key' });
  }

  if (!prompt) {
    console.error('Missing prompt in request body');
    return res.status(400).json({ error: 'Missing prompt in request body' });
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: max_tokens || 100,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    console.log('OpenAI Response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error communicating with OpenAI:', error.message);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});


app.post(
  '/api/detect-colors',
  upload.fields([{ name: 'image1' }, { name: 'image2' }, { name: 'image3' }]),
  (req, res) => {
    const { files } = req;
    console.log('Uploaded files:', files);

    if (!files.image1 || !files.image2 || !files.image3) {
      return res.status(400).json({ error: 'Please upload 3 images.' });
    }

    const imagePaths = [files.image1[0].path, files.image2[0].path, files.image3[0].path];
    console.log('Image paths:', imagePaths);

    const python = spawn('python3', ['scripts/check.py', ...imagePaths]);

    let pythonOutput = '';
    python.stdout.on('data', (data) => {
      console.log('Python output:', data.toString());
      pythonOutput += data.toString();
    });

    python.stderr.on('data', (data) => {
      console.error('Python error:', data.toString());
    });

    python.on('close', (code) => {
      console.log('Python script exited with code:', code);

      // מחיקת הקבצים לאחר שימוש
      imagePaths.forEach((filePath) => {
        console.log('Deleting file:', filePath);
        fs.unlinkSync(filePath);
      });

      if (code === 0) {
        try {
          const result = JSON.parse(pythonOutput);
          res.json(result);
        } catch (error) {
          console.error('JSON parse error:', error);
          res.status(500).json({ error: 'Invalid JSON from Python script.' });
        }
      } else {
        res.status(500).json({ error: 'Python script failed.' });
      }
    });
  }
);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
