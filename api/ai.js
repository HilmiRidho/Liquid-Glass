export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  const { prompt } = req.body;

  try {
    const geminiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      })
    });

    const data = await geminiRes.json();
    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, AI tidak dapat menjawab saat ini.";

    res.status(200).json({ reply: aiReply });
  } catch (err) {
    console.error("Error dari Gemini API:", err);
    res.status(500).json({ reply: "Terjadi kesalahan saat menghubungi AI." });
  }
}
