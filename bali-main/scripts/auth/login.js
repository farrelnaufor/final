document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();

    const loginForm = document.getElementById('login-form');

    let notificationElement = document.querySelector('.notification');

    if (!notificationElement) {
        notificationElement = document.createElement('div');
        notificationElement.className = 'notification';
        const formContainer = document.querySelector('.form-container');
        if (formContainer) {
            formContainer.appendChild(notificationElement);
        }
    }

    function showNotification(message, isError = false) {
        notificationElement.textContent = message;
        notificationElement.className = `notification ${isError ? 'error' : 'success'}`;
        notificationElement.style.display = 'block';

        setTimeout(() => {
            notificationElement.style.display = 'none';
        }, 5000);
    }

    async function checkAuthStatus() {
        try {
            if (typeof supabase === 'undefined' || !window.supabase) {
                console.log('Supabase belum dimuat, menunggu...');
                setTimeout(checkAuthStatus, 500);
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
        }
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (!email || !password) {
                showNotification('Email dan password harus diisi.', true);
                return;
            }

            try {
                if (typeof supabase === 'undefined' || !window.supabase) {
                    showNotification('Sistem belum siap. Silakan muat ulang halaman.', true);
                    return;
                }

                const submitButton = loginForm.querySelector('.btn-submit');
                const originalButtonText = submitButton.textContent;
                submitButton.textContent = 'Masuk...';
                submitButton.disabled = true;

                console.log('Mencoba login dengan email:', email);

                if (!email.includes('@') || !email.includes('.')) {
                    showNotification('Format email tidak valid', true);
                    submitButton.textContent = originalButtonText;
                    submitButton.disabled = false;
                    return;
                }

                if (password.length < 6) {
                    showNotification('Password minimal 6 karakter', true);
                    submitButton.textContent = originalButtonText;
                    submitButton.disabled = false;
                    return;
                }

                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;

                console.log('Hasil login:', data ? 'Berhasil' : 'Gagal', error ? error : '');

                if (error) {
                    if (error.message.includes('Invalid login credentials')) {
                        showNotification('Email atau password salah. Pastikan Anda sudah terdaftar.', true);
                    } else {
                        showNotification(`Login gagal: ${error.message}`, true);
                    }
                    console.error('Error logging in:', error);
                    return;
                }

                if (data && data.user) {
                    localStorage.setItem('userSession', JSON.stringify({
                        id: data.user.id,
                        email: data.user.email,
                        name: data.user.user_metadata?.full_name || 'Pengguna'
                    }));

                    showNotification('Login berhasil! Anda akan diarahkan ke halaman utama.');

                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                } else {
                    showNotification('Terjadi kesalahan saat login. Data pengguna tidak ditemukan.', true);
                }
            } catch (err) {
                showNotification(`Terjadi kesalahan: ${err.message}`, true);
                console.error('Unexpected error:', err);
            }
        });
    }
});
