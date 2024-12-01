const express = require('express');
const axios = require('axios');
require('dotenv').config(); // טוען משתני סביבה מקובץ .env

const app = express();
const PORT = process.env.PORT || 3000; // פורט דינמי עבור Render או 3000 לפיתוח מקומי

// Middleware לקריאת JSON בבקשות
app.use(express.json());

// רוט לשליחת קריאה ל-OpenAI
app.post('/api/openai', async (req, res) => {
  console.log('Request received:', req.body); // לוג לתיעוד הבקשה
  console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY); // לוג למפתח ה-API

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
      

    console.log('OpenAI Response:', response.data); // לוג לתגובה מ-OpenAI
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

// הפעלת השרת
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
