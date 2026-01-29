import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  hfToken: process.env.HF_TOKEN,
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY
  },
  ai: {
    embeddingModel: "sentence-transformers/all-MiniLM-L6-v2",
    chatModel: "meta-llama/Llama-3.1-8B-Instruct", // or google/gemma-2-2b-it
    temperature: 0.1
  },
  chunks: {
    size: 1000,
    overlap: 200
  }
};