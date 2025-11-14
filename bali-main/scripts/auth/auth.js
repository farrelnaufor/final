// js/auth.js
// Fungsi Autentikasi: Register, Login, Logout, Session

// REGISTER USER (email & password)
async function registerUser(email, password, fullName = "", phone = "", role = "renter") {
  const { data, error } = await window.supabase.auth.signUp(
    { email, password },
    { data: { full_name: fullName, phone: phone, role: role } }
  );

  if (error) return { error };

  // Tambahkan ke tabel profiles (jika diperlukan)
  await window.supabase.from("profiles").insert([
    {
      id: data.user.id,
      full_name: fullName,
      phone: phone,
      role: role
    }
  ]);

  return { data };
}

// LOGIN USER
async function loginUser(email, password) {
  const { data, error } = await window.supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
}

// LOGOUT USER
async function logoutUser() {
  await window.supabase.auth.signOut();
}

// GET CURRENT LOGGED USER
async function getCurrentUser() {
  const { data } = await window.supabase.auth.getUser();
  return data?.user || null;
}

// CEK SESSION
async function getSession() {
  const { data } = await window.supabase.auth.getSession();
  return data?.session || null;
}

// FUNGSI UNTUK MEMERIKSA STATUS LOGIN DAN UPDATE UI
async function checkLoginStatus() {
  const loginButton = document.getElementById('login-button');
  const userProfile = document.getElementById('user-profile');
  const userName = document.getElementById('user-name');
  
  if (!loginButton || !userProfile || !userName) return; // Skip jika elemen tidak ditemukan
  
  const session = await getSession();
  
  if (session) {
    // User sudah login
    loginButton.style.display = 'none';
    userProfile.style.display = 'flex';
    
    // Ambil data user dari session
    const userId = session.user.id;
    
    // Ambil data profil dari database
    const { data } = await window.supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();
    
    if (data && data.full_name) {
      userName.textContent = data.full_name;
    } else {
      userName.textContent = session.user.email;
    }
  } else {
    // User belum login
    loginButton.style.display = 'inline-block';
    userProfile.style.display = 'none';
  }
}

window.authApi = {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  getSession,
  checkLoginStatus
};
