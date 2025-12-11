import express from "express";
const router = express.Router();

// Node 18+ has fetch built-in
// No need to import node-fetch

// POST /api/ai-search
router.post("/", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== "string") {
      return res.json({ error: "Invalid query" });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("Missing OpenRouter key");
      return res.json({ error: "Server missing API key" });
    }

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are TyreFusion-AI.
Your task is to extract the car make, model, and year from ANY user text.

RULES:

1. Try your maximum best to infer:
   - Make
   - Model
   - Year
   Even if the user provides text like "creta 2019", "swift 2018 tyres", "need tyre for honda city", etc.

2. If you cannot identify all 3 fields with at least 80% confidence, ONLY THEN return:
   ERROR_MISSING_MMY

3. After identifying MMY, return tyre sizes in this JSON format:
{
  "sizes": [
    { "size": "205/65R16", "type": "Factory Fitment" },
    { "size": "215/60R17", "type": "Factory Fitment" },
    { "size": "225/55R17", "type": "Aftermarket Upgrade" }
  ]
}

4. Do NOT add any sentences, disclaimers, comments, or Markdown.

5. If the tyre size is not factory, mark:
   "type": "Aftermarket Upgrade"

6. If uncertain about a size:
   "type": "Unknown"

7. Return JSON ONLY.

`
          },
          { role: "user", content: query }
        ]
      })
    });

    const aiJson = await aiResponse.json();

    if (!aiJson.choices?.length) {
      return res.json({ error: "AI returned empty response" });
    }

    let raw = aiJson.choices[0].message.content.trim();

    if (raw.includes("ERROR_MISSING_MMY")) {
      return res.json({ error: "Missing make, model, or year" });
    }

    // Remove any code fences
    raw = raw.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(raw);

    if (!parsed.sizes) {
      return res.json({ error: "Invalid AI output" });
    }

    // Convert to frontend format:
    // [ "205/65R16 (Factory Fitment)" , ... ]
    const list = parsed.sizes.map(
      (s) => `${s.size} (${s.type})`
    );

    return res.json({ sizes: list });

  } catch (error) {
    console.error("AI Search ERROR:", error);
    return res.json({ error: "AI search failed" });
  }
});

export default router;
