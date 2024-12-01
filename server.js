const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Middleware לקריאת JSON בבקשות

// רוט לשליחת קריאה ל-OpenAI
app.post('/api/openai', async (req, res) => {
  const { prompt, max_tokens } = req.body;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Missing OpenAI API Key' });
  }

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt in request body' });
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/completions',
      {
        model: 'text-davinci-003',
        prompt: prompt,
        max_tokens: max_tokens || 100,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error communicating with OpenAI:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
    });
  }
});

// הפעלת השרת
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
