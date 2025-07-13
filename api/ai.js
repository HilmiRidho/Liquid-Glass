import fetch from 'node-fetch';

export default async function handler(req, res) {
  const prompt = req.body.prompt || "Hai!";
  const OPENAI_KEY = process.env.OPENAI_API_KEY;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || "Gagal membalas.";
  res.status(200).json({ reply });
}
