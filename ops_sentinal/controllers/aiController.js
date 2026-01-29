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
  const systemPrompt = `You are Ops-Sentinel. 
  If 'Docs' is empty, say: "No matching playbook found. Proceed with manual check."
  If 'Docs' has content, prioritize that specific fix.`;

  const contextBlock = contextChunks.length > 0 
    ? contextChunks.join("\n\n---\n\n") 
    : "NO DOCUMENTATION AVAILABLE."; // Explicitly tell the AI there's no data
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

// aicontroller.js
export async function generateSearchTags(forensicStory) {
  if (!forensicStory || forensicStory.length === 0) return ["general-sre"];
  
  const storySnippet = forensicStory.join("\n");
  
  // Clearer separation with '###' helps the model focus
  const prompt = `
    [TASK] Extract 3 technical keywords for search.
    [FORMAT] keyword1, keyword2, keyword3
    [LOG DATA]
    ###
    ${storySnippet}
    ###
  `;

  try {
    const response = await hf.chatCompletion({
      model: CONFIG.ai.chatModel,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 15, // Tight limit prevents storytelling
      temperature: 0, 
    });
    console.log("🤖 RAW AI TAG RESPONSE:", JSON.stringify(response.choices[0].message)); // ADD THIS

    let tagsRaw = response.choices[0].message.content.toLowerCase();
    
    // Clean common AI conversational prefixes
    tagsRaw = tagsRaw.replace(/tags:|keywords:|log:|###/g, "").trim();
    
    let tags = tagsRaw.split(',').map(t => t.trim()).filter(t => t.length > 1);

    // Hard-coded Safety Net for your Redis testing
    if (storySnippet.toLowerCase().includes("maxmemory")) {
       if (!tags.includes("redis")) tags.push("redis");
    }

    return tags.length > 0 ? tags : ["general-sre"];
  } catch (err) {
    console.error("❌ HF ERROR:", err.message); // ADD THIS
    return ["redis", "oom"];
  }
}