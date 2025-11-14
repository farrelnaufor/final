// Konfigurasi Supabase
const SUPABASE_URL = 'https://gsejpxkofpdjthcsvocn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZWpweGtvZnBkanRoY3N2b2NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MjEwMzMsImV4cCI6MjA3NjA5NzAzM30.aB_Hhk0GPKrNu_s-MCbT0sKizw1nwLPh8xUD3P56RtU';

// Validasi konfigurasi
if (!SUPABASE_URL || SUPABASE_URL.includes('your-project')) {
    console.error('❌ SUPABASE_URL tidak dikonfigurasi. Update di supabaseClient.js');
}
if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('your-anon')) {
    console.error('❌ SUPABASE_ANON_KEY tidak dikonfigurasi. Update di supabaseClient.js');
}

// Inisialisasi Supabase dengan error handling
let supabase = null;

try {
    if (window.supabase && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase berhasil diinisialisasi');
    } else {
        console.error('❌ Library @supabase/supabase-js belum dimuat');
    }
} catch (error) {
    console.error('❌ Error inisialisasi Supabase:', error);
}

// Export untuk global access
window.supabaseClient = supabase;