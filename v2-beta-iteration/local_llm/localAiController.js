import fetch from "node-fetch";
import { InferenceClient } from "@huggingface/inference";
import { CONFIG } from "./config.js";

const hf = new InferenceClient(CONFIG.hfToken);

export async function getChatResponse(userQuery, contextChunks) {
  const systemPrompt = `You are Ops-Sentinel. Root Cause and Fix Command only. < 100 words.`;
  const contextBlock = contextChunks.length > 0 ? contextChunks.join("\n") : "No context.";

  console.log("🧠 Local SLM: Requesting Ollama...");
  
  try {
    const response = await fetch("http://127.0.0.1:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2:3b", // Ensure you ran 'ollama run llama3.2:3b'
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Context:\n${contextBlock}\n\nIncident:\n${userQuery}` }
        ],
        stream: false,
      })
    });

    if (!response.ok) throw new Error(`Ollama Offline: ${response.statusText}`);

    const data = await response.json();
    return data.message.content;
  } catch (err) {
    console.error("❌ OLLAMA ERROR:", err.message);
    return "Local SLM Failed. Ensure Ollama is running.";
  }
}

// Keep using HF for this—it's fast and doesn't cause 170s lags
export async function getEmbedding(text) {
  return await hf.featureExtraction({
    model: CONFIG.ai.embeddingModel,
    inputs: text,
  });
}

/**
 * 2. HYBRID TAG GENERATION (Ollama)
 * Extracts technical keywords to guide the Supabase search.
 */
export async function generateSearchTags(forensicStory) {
  const storySnippet = Array.isArray(forensicStory) ? forensicStory.join("\n") : forensicStory;
  
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3.2:3b",
      prompt: `Analyze this server incident. Return ONLY a comma-separated list of 2-3 technical tags (e.g., redis, memory). Story: ${storySnippet}`,
      stream: false,
      options: { temperature: 0.1 }
    })
  });

  const data = await response.json();
  return data.response.split(',').map(t => t.trim().toLowerCase());
}
