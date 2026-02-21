import { createClient } from '@supabase/supabase-js';
import { CONFIG } from './config.js';

console.log(CONFIG.supabase.url);

export const supabase = createClient(CONFIG.supabase.url, CONFIG.supabase.key);