// File: api/gemini.js

export default async function handler(request, response) {
  // Hanya izinkan metode POST
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  // Ambil API key dari environment variable yang aman
  const apiKey = process.env.GEMINI_API_KEY;
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

  if (!apiKey) {
    return response.status(500).json({ error: 'API key not configured on the server.' });
  }

  try {
    // Ambil prompt dari body request yang dikirim oleh frontend
    const { prompt } = request.body;
    
    if (!prompt) {
      return response.status(400).json({ error: 'Prompt is required.' });
    }

    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
         safetySettings: [ // Pengaturan keamanan untuk memblokir konten berbahaya
          { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
          { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
          { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
          { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" }
        ]
      }),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error('Gemini API Error:', errorData);
      throw new Error(`Gemini API responded with status: ${geminiResponse.status}`);
    }

    const data = await geminiResponse.json();
    
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure how to respond to that.";

    // Kirim balasan AI kembali ke frontend
    return response.status(200).json({ reply: aiText.trim() });

  } catch (error) {
    console.error('Internal Server Error:', error);
    return response.status(500).json({ error: 'Failed to fetch response from AI.' });
  }
}
