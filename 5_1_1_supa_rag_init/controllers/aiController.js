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
  const systemPrompt = `
    You are Ops-Sentinel, a Tier-3 SRE. 
    Use the provided Documentation to solve the Incident Story.
    If no documentation matches, say: "No remediation found in playbooks."
  `;

  const contextBlock = contextChunks.join("\n\n---\n\n");

  const response = await hf.chatCompletion({
    model: CONFIG.ai.chatModel,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Docs:\n${contextBlock}\n\nIncident:\n${userQuery}` }
    ],
    temperature: CONFIG.ai.temperature,
    max_tokens: 500
  });

  return response.choices[0].message.content;
}