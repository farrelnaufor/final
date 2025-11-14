const SUPABASE_URL = "https://gsejpxkofpdjthcsvocn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZWpweGtvZnBkanRoY3N2b2NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MjEwMzMsImV4cCI6MjA3NjA5NzAzM30.aB_Hhk0GPKrNu_s-MCbT0sKizw1nwLPh8xUD3P56RtU";

// Inisialisasi klien Supabase
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("Supabase client initialized:", SUPABASE_URL);

// Fungsi untuk memastikan tabel reviews ada
async function ensureReviewsTable() {
    try {
        // Cek apakah tabel reviews sudah ada dengan mencoba mengambil satu baris
        const { error } = await supabase
            .from('reviews')
            .select('*')
            .limit(1);
            
        if (error && error.code === '42P01') { // Kode error untuk "relation does not exist"
            console.log('Tabel reviews tidak ditemukan, mencoba membuat tabel...');
            // Tabel tidak ada, buat tabel baru melalui SQL
            // Catatan: Ini hanya contoh, dalam produksi sebaiknya gunakan migrations
            const { error: createError } = await supabase.rpc('create_reviews_table');
            
            if (createError) {
                console.error('Gagal membuat tabel reviews:', createError);
            } else {
                console.log('Tabel reviews berhasil dibuat');
            }
        }
    } catch (err) {
        console.error('Error saat memeriksa tabel reviews:', err);
    }
}

// Panggil fungsi untuk memastikan tabel ada
ensureReviewsTable();
