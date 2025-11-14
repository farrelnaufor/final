document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('register-form');

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

    if (registerForm) {
        registerForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const phone = document.getElementById('reg-phone').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;

            if (!name || !email || !phone || !password || !confirmPassword) {
                showNotification('Semua field harus diisi', true);
                return;
            }

            const phoneRegex = /^[0-9]{10,13}$/;
            if (!phoneRegex.test(phone)) {
                showNotification('Format nomor telepon tidak valid. Harus 10-13 digit angka.', true);
                return;
            }

            if (password !== confirmPassword) {
                showNotification('Password dan konfirmasi password tidak cocok', true);
                return;
            }

            if (password.length < 6) {
                showNotification('Password minimal 6 karakter', true);
                return;
            }

            try {
                if (typeof supabase === 'undefined' || !window.supabase) {
                    showNotification('Sistem belum siap. Silakan muat ulang halaman.', true);
                    return;
                }

                const submitButton = registerForm.querySelector('.btn-submit');
                const originalButtonText = submitButton.textContent;
                submitButton.textContent = 'Mendaftar...';
                submitButton.disabled = true;

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                            phone: phone
                        }
                    }
                });

                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;

                if (error) {
                    if (error.message.includes('already registered')) {
                        showNotification('Email sudah terdaftar. Silakan gunakan email lain atau login.', true);
                    } else {
                        showNotification(`Pendaftaran gagal: ${error.message}`, true);
                    }
                    console.error('Error registering:', error);
                    return;
                }

                if (data && data.user) {
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .upsert([
                            {
                                id: data.user.id,
                                full_name: name,
                                email: email,
                                phone: phone,
                                role: 'renter'
                            }
                        ], { onConflict: 'id' });

                    if (profileError) {
                        console.error('Error saving profile:', profileError);
                    }

                    showNotification('Pendaftaran berhasil! Anda akan diarahkan ke halaman login.');

                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    showNotification('Terjadi kesalahan saat pendaftaran. Silakan coba lagi.', true);
                }

            } catch (err) {
                showNotification(`Terjadi kesalahan: ${err.message}`, true);
                console.error('Unexpected error:', err);
            }
        });
    }
});
