import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gfcxolltqiohnpvqudla.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmY3hvbGx0cWlvaG5wdnF1ZGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMzc3MTUsImV4cCI6MjEwNTkxMzcxNX0.HHkHeQHBydQOyh2V5avZYkU49uzNWqHlTe2hptGh1hw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
