// clearBuffer.js
import { createClient } from 'redis';
import { CONFIG } from './config.js';

const client = createClient();
await client.connect();

async function clearData() {
  // Deletes only your specific project keys
  await client.del(CONFIG.redis.listName);
  await client.del("ops_sentinel_history"); 
  
  console.log("🧹 Project logs cleared!");
  await client.quit();
}

clearData();