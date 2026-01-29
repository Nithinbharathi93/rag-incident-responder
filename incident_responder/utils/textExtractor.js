import pdfParse from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CONFIG } from "../config.js";

export async function extractTextFromPDF(buffer) {
  const data = await pdfParse(buffer);
  return data.text.replace(/\n\n+/g, "\n").trim();
}

export async function chunkText(text) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CONFIG.chunks.size,
    chunkOverlap: CONFIG.chunks.overlap,
  });
  return await splitter.splitText(text);
}
