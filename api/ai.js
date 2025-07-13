// /api/ai.js
export default async function handler(req, res) {
  const { prompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  const geminiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + apiKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await geminiRes.json();
  const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, AI tidak bisa menjawab saat ini.";

  res.status(200).json({ reply: aiReply });
}
