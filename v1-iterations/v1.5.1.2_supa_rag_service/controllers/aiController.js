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
You are Ops-Sentinel. 
STRICT RULE: Only provide solutions found in the "SRE Documentation Context". 
If the context is empty or doesn't match the error, state: "No matching playbook found. Proceed with manual DB/Cache check."
DO NOT suggest general commands like 'EXPLAIN' unless they are in the context.
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

/**
 * Asks the LLM to generate 3-5 technical tags for a given text chunk.
 */
export async function generateTags(chunk) {
  const prompt = `
    Analyze the following technical documentation chunk and return ONLY a comma-separated list of 3-5 technical keywords (tags).
    Examples: "nodejs, memory, garbage-collection" or "kubernetes, pods, networking".
    Text: ${chunk.substring(0, 1000)}
  `;

  try {
    const response = await hf.chatCompletion({
      model: "meta-llama/Llama-3.1-8B-Instruct",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 50,
      temperature: 0.3, 
    });

    const tagsRaw = response.choices[0].message.content;
    // Clean up the response: split by comma, trim, and lowercase
    return tagsRaw.split(',').map(tag => tag.trim().toLowerCase());
  } catch (err) {
    console.warn("Tag generation failed, using default.");
    return ["general-sre"];
  }
}

/**
 * Analyzes a crash story to determine the tech stack and error category.
 */
export async function generateSearchTags(forensicStory) {
  const storySnippet = forensicStory.join("\n");
  const prompt = `
    Analyze this server crash story. 
    Return ONLY a comma-separated list of the 2-3 most relevant technical tags for searching a solution manual.
    Example: "nodejs, memory" or "linux, disk-space".
    Story: ${storySnippet}
  `;

  try {
    const response = await hf.chatCompletion({
      model: "meta-llama/Llama-3.1-8B-Instruct",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 30,
      temperature: 0.1, 
    });

    return response.choices[0].message.content.split(',').map(t => t.trim().toLowerCase());
  } catch (err) {
    return ["general-sre"]; // Fallback
  }
}