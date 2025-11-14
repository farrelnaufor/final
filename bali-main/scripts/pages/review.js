document.addEventListener('DOMContentLoaded', function() {
    const authContainer = document.getElementById('auth-container');
    const loginTemplate = document.getElementById('login-required-template');
    const reviewFormTemplate = document.getElementById('review-form-template');

    async function checkAuth() {
        try {
            if (typeof supabase === 'undefined' || !window.supabase) {
                console.log('Supabase belum dimuat, menunggu...');
                setTimeout(checkAuth, 500);
                return;
            }

            const { data: { user }, error } = await supabase.auth.getUser();

            if (error || !user) {
                authContainer.innerHTML = loginTemplate.innerHTML;
                return null;
            }

            authContainer.innerHTML = reviewFormTemplate.innerHTML;

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();

            const userNameElement = document.getElementById('logged-user-name');
            if (userNameElement) {
                userNameElement.textContent = profile && profile.full_name ? profile.full_name : user.email;
            }

            setupReviewForm(user);

            return user;
        } catch (err) {
            console.error('Error checking authentication:', err);
            authContainer.innerHTML = loginTemplate.innerHTML;
            return null;
        }
    }

    function setupReviewForm(user) {
        const reviewForm = document.getElementById('reviewForm');

        if (reviewForm) {
            reviewForm.addEventListener('submit', async function(e) {
                e.preventDefault();

                try {
                    const ratingElement = document.querySelector('input[name="rating"]:checked');

                    if (!ratingElement) {
                        alert('Silakan pilih rating terlebih dahulu');
                        return;
                    }

                    const rating = ratingElement.value;
                    const review = document.getElementById('review').value;

                    if (!review || review.trim().length === 0) {
                        alert('Silakan tulis ulasan Anda');
                        return;
                    }

                    console.log('Mengirim ulasan:', { rating, review });

                    if (!window.supabase) {
                        console.error('Supabase client belum diinisialisasi');
                        alert('Terjadi kesalahan koneksi. Silakan muat ulang halaman dan coba lagi.');
                        return;
                    }

                    if (typeof window.reviewsApi === 'undefined') {
                        const script = document.createElement('script');
                        script.src = '../scripts/api/reviewsApi.js';
                        document.head.appendChild(script);

                        await new Promise(resolve => {
                            script.onload = resolve;
                        });
                    }

                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('full_name')
                        .eq('id', user.id)
                        .single();

                    const name = profile && profile.full_name ? profile.full_name : user.email;

                    const result = await reviewsApi.addReview({
                        user_id: user.id,
                        name,
                        rating: parseInt(rating),
                        review: review.trim()
                    });

                    if (result.success) {
                        alert('Terima kasih! Ulasan Anda telah berhasil dikirim.');
                        window.location.href = 'index.html';
                    } else {
                        console.error('Gagal mengirim ulasan:', result.error);
                        alert('Maaf, terjadi kesalahan saat mengirim ulasan: ' + result.error);
                    }
                } catch (error) {
                    console.error('Error pada form ulasan:', error);
                    alert('Terjadi kesalahan: ' + error.message);
                }
            });
        }
    }

    checkAuth();
});
