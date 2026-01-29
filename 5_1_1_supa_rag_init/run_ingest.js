import fs from 'fs';
import { ingestDocument } from './services/ingestor.js';

const buffer = fs.readFileSync('./sre_playbook.pdf');
await ingestDocument(buffer, 'SRE_Manual_V1');
console.log("✅ Ingestion complete.");