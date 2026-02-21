import { InferenceClient } from "@huggingface/inference";
import { CONFIG } from "../config.js";

const hf = new InferenceClient(CONFIG.hfToken);

export async function getEmbedding(text) {
  const response = await hf.featureExtraction({
    model: CONFIG.ai.embeddingModel,
    inputs: text,
  });
  return Array.isArray(response[0]) ? response[0] : response;
}

export async function getChatResponse(userQuery, contextChunks) {
  // SYSTEM PROMPT TUNING: Shortening instructions makes SLMs faster.
  const systemPrompt = `You are Ops-Sentinel. Use the provided context to solve the incident. 
  If no match, say "No playbook found." 
  Format: 1. Root Cause, 2. Fix Command. Keep it under 100 words.`;

  const contextBlock = contextChunks.length > 0 
    ? contextChunks.join("\n")
    : "No context.";

  const response = await hf.chatCompletion({
    model: CONFIG.ai.chatModel,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Context:\n${contextBlock}\n\nIncident:\n${userQuery}` }
    ],
    temperature: CONFIG.ai.temperature,
    max_tokens: 200 // Reduced from 500 to force faster completion
  });

  return response.choices[0].message.content;
}

/**
 * Analyzes a crash story to determine the tech stack and error category.
 */
export async function generateSearchTags(forensicStory) {
  const storySnippet = Array.isArray(forensicStory) 
    ? forensicStory.join("\n") 
    : forensicStory;

  const prompt = `
    Analyze this server incident/crash story. 
    Return ONLY a comma-separated list of the 2-3 most relevant technical tags for searching a solution manual.
    Example: "nodejs, memory" or "linux, disk-space" or "redis, timeout" or "database, connection-pool".
    Story: ${storySnippet}
  `;

  try {
    const response = await hf.chatCompletion({
      model: CONFIG.ai.chatModel,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 30,
      temperature: 0.1, 
    });

    return response.choices[0].message.content.split(',').map(t => t.trim().toLowerCase());
  } catch (err) {
    console.warn("Tag generation failed, using fallback.");
    return ["incident-response"]; // Fallback
  }
}

export async function generateTags(chunk) {
  const prompt = `
    Analyze the following technical documentation chunk and return ONLY a comma-separated list of 3-5 technical keywords (tags).
    Examples: "nodejs, memory, garbage-collection" or "kubernetes, pods, networking".
    Text: ${chunk.substring(0, 1000)}
  `;

  try {
    const response = await hf.chatCompletion({
      model: CONFIG.ai.chatModel,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 50,
      temperature: 0.3, 
    });

    const tagsRaw = response.choices[0].message.content;
    return tagsRaw.split(',').map(tag => tag.trim().toLowerCase());
  } catch (err) {
    console.warn("Tag generation failed, using default.");
    return ["general-sre"];
  }
}
