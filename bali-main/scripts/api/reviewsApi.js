const reviewsApi = {
    getReviews: async function() {
        try {
            if (typeof supabase === 'undefined' || !window.supabase) {
                console.error('Supabase client tidak tersedia');
                return { success: false, error: 'Supabase client tidak tersedia', data: [] };
            }

            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching reviews:', error);
                return { success: false, error: error.message, data: [] };
            }

            return { success: true, data: data || [] };
        } catch (err) {
            console.error('Exception in getReviews:', err);
            return { success: false, error: err.message, data: [] };
        }
    },

    addReview: async function(reviewData) {
        try {
            if (typeof supabase === 'undefined' || !window.supabase) {
                console.error('Supabase client tidak tersedia');
                return { success: false, error: 'Supabase client tidak tersedia' };
            }

            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return { success: false, error: 'Anda harus login untuk memberikan ulasan' };
            }

            if (!reviewData.user_id) {
                reviewData.user_id = user.id;
            }

            const reviewWithTimestamp = {
                ...reviewData,
                created_at: new Date().toISOString()
            };

            console.log('Mengirim data ke Supabase:', reviewWithTimestamp);

            const { data, error } = await supabase
                .from('reviews')
                .insert([reviewWithTimestamp])
                .select();

            if (error) {
                console.error('Error adding review:', error);
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (err) {
            console.error('Exception in addReview:', err);
            return { success: false, error: err.message };
        }
    },

    getUserReviews: async function(userId) {
        try {
            if (typeof supabase === 'undefined' || !window.supabase) {
                console.error('Supabase client tidak tersedia');
                return { success: false, error: 'Supabase client tidak tersedia', data: [] };
            }

            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching user reviews:', error);
                return { success: false, error: error.message, data: [] };
            }

            return { success: true, data: data || [] };
        } catch (err) {
            console.error('Exception in getUserReviews:', err);
            return { success: false, error: err.message, data: [] };
        }
    },

    calculateAverageRating: function(reviews) {
        if (!reviews || reviews.length === 0) {
            return 0;
        }

        const sum = reviews.reduce((total, review) => total + parseInt(review.rating), 0);
        return (sum / reviews.length).toFixed(1);
    }
};

if (typeof window !== 'undefined') {
    window.reviewsApi = reviewsApi;
}
