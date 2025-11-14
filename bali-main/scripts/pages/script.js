document.addEventListener('DOMContentLoaded', async function () {
    let roomData = {
        type1: { name: 'Kamar Type 1', price: 'Rp 800.000', priceValue: 800000, image: 'https://picsum.photos/seed/kamar1/1200/600.jpg', type: 'type1' },
        type2: { name: 'Kamar Type 2', price: 'Rp 700.000', priceValue: 700000, image: 'https://picsum.photos/seed/kamar2/1200/600.jpg', type: 'type2' }
    };

    async function loadRoomDataFromDatabase() {
        try {
            if (!window.supabase) return;

            const { data: rooms, error } = await supabase
                .from('rooms')
                .select('*')
                .eq('is_available', true)
                .order('room_type', { ascending: true });

            if (error) {
                console.error('Error loading rooms from database:', error);
                return;
            }

            if (rooms && rooms.length > 0) {
                const type1Rooms = rooms.filter(r => r.room_type === 'Type 1');
                const type2Rooms = rooms.filter(r => r.room_type === 'Type 2');

                if (type1Rooms.length > 0) {
                    const room = type1Rooms[0];
                    roomData.type1 = {
                        name: 'Kamar Type 1',
                        price: `Rp ${room.price.toLocaleString('id-ID')}`,
                        priceValue: room.price,
                        image: 'https://picsum.photos/seed/kamar1/1200/600.jpg',
                        type: 'type1',
                        facilities: room.facilities
                    };
                }

                if (type2Rooms.length > 0) {
                    const room = type2Rooms[0];
                    roomData.type2 = {
                        name: 'Kamar Type 2',
                        price: `Rp ${room.price.toLocaleString('id-ID')}`,
                        priceValue: room.price,
                        image: 'https://picsum.photos/seed/kamar2/1200/600.jpg',
                        type: 'type2',
                        facilities: room.facilities
                    };
                }

                console.log('Room data loaded from database:', roomData);
            }
        } catch (err) {
            console.error('Error in loadRoomDataFromDatabase:', err);
        }
    }

    await loadRoomDataFromDatabase();

    const checkInEl = document.getElementById('check-in');
    const checkOutEl = document.getElementById('check-out');
    const roomSelectorEl = document.getElementById('room-selector');
    const roomCards = Array.from(document.querySelectorAll('.room-card'));
    const durationEl = document.getElementById('duration');
    const totalPriceEl = document.getElementById('total-price');
    const roomTypeEl = document.getElementById('room-type');
    const roomPriceEl = document.getElementById('price-value');
    const heroSection = document.getElementById('hero');
    const btnBookNow = document.getElementById('btn-book-now');
    const btnWriteReview = document.querySelector('.btn-write-review');

    if (btnWriteReview) {
        const checkLoginStatus = async () => {
            try {
                if (typeof supabase === 'undefined' || !supabase) {
                    console.log('Menunggu Supabase dimuat...');
                    setTimeout(checkLoginStatus, 500);
                    return;
                }

                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    btnWriteReview.style.display = 'block';
                    btnWriteReview.addEventListener('click', function() {
                        window.location.href = 'review.html';
                    });
                } else {
                    btnWriteReview.style.display = 'none';

                    const reviewsSection = document.querySelector('.reviews-section');
                    if (reviewsSection && !document.querySelector('.login-message')) {
                        const loginMessage = document.createElement('div');
                        loginMessage.className = 'login-message';
                        loginMessage.innerHTML = '<p>Silakan <a href="login.html">login</a> untuk memberikan ulasan</p>';
                        loginMessage.style.textAlign = 'center';
                        loginMessage.style.margin = '20px 0';
                        reviewsSection.appendChild(loginMessage);
                    }
                }
            } catch (error) {
                console.error('Error checking login status:', error);
            }
        };

        checkLoginStatus();
    }

    async function loadReviews() {
        try {
            const reviewsSection = document.querySelector('.reviews-section');
            if (!reviewsSection) return;

            if (!window.supabase || typeof supabase === 'undefined') {
                console.log('Supabase belum dimuat, menunggu...');
                setTimeout(loadReviews, 1000);
                return;
            }

            console.log('Memuat ulasan...');

            if (typeof reviewsApi === 'undefined') {
                window.reviewsApi = {
                    async getReviews() {
                        try {
                            const { data, error } = await supabase
                                .from('reviews')
                                .select('*')
                                .order('created_at', { ascending: false });

                            if (error) throw error;
                            return { success: true, data: data || [] };
                        } catch (error) {
                            console.error('Error fetching reviews:', error);
                            return { success: false, error, data: [] };
                        }
                    },
                    calculateAverageRating(reviews) {
                        if (!reviews || reviews.length === 0) return 0;
                        const sum = reviews.reduce((total, review) => total + parseInt(review.rating), 0);
                        return (sum / reviews.length).toFixed(1);
                    }
                };
            }

            const result = await reviewsApi.getReviews();
            if (!result.success) {
                console.error('Gagal memuat ulasan:', result.error);
                return;
            }

            const reviews = result.data;
            console.log('Ulasan berhasil dimuat:', reviews.length, 'reviews');

            const avgRating = reviewsApi.calculateAverageRating(reviews);
            const ratingValueEl = document.querySelector('.rating-value');
            if (ratingValueEl) {
                ratingValueEl.textContent = avgRating;
            }

            const reviewItems = Array.from(document.querySelectorAll('.review-item'));
            reviewItems.forEach(item => item.remove());

            const writeReviewBtn = document.querySelector('.btn-write-review');

            if (reviews && reviews.length > 0) {
                reviews.slice(0, 5).forEach(review => {
                    const reviewEl = createReviewElement(review);
                    reviewsSection.insertBefore(reviewEl, writeReviewBtn);
                });
            } else {
                const noReviewsEl = document.createElement('div');
                noReviewsEl.className = 'no-reviews';
                noReviewsEl.textContent = 'Belum ada ulasan. Jadilah yang pertama memberikan ulasan!';
                noReviewsEl.style.textAlign = 'center';
                noReviewsEl.style.padding = '20px';
                noReviewsEl.style.color = '#999';
                reviewsSection.insertBefore(noReviewsEl, writeReviewBtn);
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
        }
    }

    function createReviewElement(review) {
        const reviewEl = document.createElement('div');
        reviewEl.className = 'review-item';

        const reviewDate = new Date(review.created_at);
        const now = new Date();
        const diffTime = Math.abs(now - reviewDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let dateText;
        if (diffDays < 7) {
            dateText = diffDays + ' hari yang lalu';
        } else if (diffDays < 30) {
            dateText = Math.floor(diffDays / 7) + ' minggu yang lalu';
        } else {
            dateText = Math.floor(diffDays / 30) + ' bulan yang lalu';
        }

        const initial = review.name ? review.name.charAt(0).toUpperCase() : 'A';

        const rating = parseInt(review.rating) || 5;
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                starsHtml += '<i class="fas fa-star"></i>';
            } else {
                starsHtml += '<i class="far fa-star"></i>';
            }
        }

        reviewEl.innerHTML = `
            <div class="review-header">
                <div class="reviewer-info">
                    <div class="reviewer-avatar">${initial}</div>
                    <div>
                        <div class="reviewer-name">${review.name}</div>
                        <div class="review-date">${dateText}</div>
                    </div>
                </div>
                <div class="review-rating">
                    ${starsHtml}
                </div>
            </div>
            <div class="review-content">
                ${review.review}
            </div>
        `;

        return reviewEl;
    }

    loadReviews();

    function setMinDateInputs() {
        const today = new Date();
        const isoToday = today.toISOString().split('T')[0];
        if (checkInEl) checkInEl.min = isoToday;
        if (checkOutEl) checkOutEl.min = isoToday;
    }
    setMinDateInputs();

    function normalizeRoomKey(key) {
        if (!key) return 'type1';
        return roomData[key] ? key : 'type1';
    }

    function renderRoomUI(roomKey) {
        roomKey = normalizeRoomKey(roomKey);
        const room = roomData[roomKey];
        if (!room) return;

        console.log('Rendering room UI for:', roomKey, room);

        roomCards.forEach(c => c.classList.toggle('selected', c.dataset.room === roomKey));

        if (roomSelectorEl) roomSelectorEl.value = roomKey;

        if (roomTypeEl) {
            roomTypeEl.textContent = room.name;
            console.log('Updated room type to:', room.name);
        }
        if (roomPriceEl) {
            roomPriceEl.textContent = room.price;
            console.log('Updated price to:', room.price);
        }
        if (heroSection) {
            heroSection.style.backgroundImage = `url(${room.image})`;
            console.log('Updated hero image to:', room.image);
        }

        const selectedRoomEl = document.getElementById('selected-room');
        if (selectedRoomEl) selectedRoomEl.textContent = room.name;
    }

    function getSelectedRoomKey() {
        const selectedCard = document.querySelector('.room-card.selected');
        const cardKey = selectedCard && selectedCard.dataset.room ? selectedCard.dataset.room : null;
        const selectKey = roomSelectorEl && roomSelectorEl.value ? roomSelectorEl.value : null;
        if (cardKey) {
            if (roomSelectorEl && roomSelectorEl.value !== cardKey) roomSelectorEl.value = cardKey;
            return normalizeRoomKey(cardKey);
        }
        if (selectKey) return normalizeRoomKey(selectKey);
        return 'type1';
    }

    function parseDateLocal(dateStr) {
        if (!dateStr) return null;
        const parts = dateStr.split('-').map(Number);
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    function calculateMonths(checkInDate, checkOutDate) {
        if (!checkInDate || !checkOutDate || checkOutDate < checkInDate) return 0;
        let months = (checkOutDate.getFullYear() - checkInDate.getFullYear()) * 12;
        months += checkOutDate.getMonth() - checkInDate.getMonth();
        if (checkOutDate.getDate() > checkInDate.getDate()) months += 1;
        return Math.max(1, months);
    }

    function formatCurrency(value) {
        return `Rp ${value.toLocaleString('id-ID')}`;
    }

    async function calculateAndRender() {
        const roomKey = getSelectedRoomKey();
        renderRoomUI(roomKey);

        const checkInStr = checkInEl ? checkInEl.value : '';
        const checkOutStr = checkOutEl ? checkOutEl.value : '';
        const checkIn = parseDateLocal(checkInStr);
        const checkOut = parseDateLocal(checkOutStr);
        const room = roomData[roomKey] || roomData['type1'];

        console.log('Calculating with room:', roomKey, 'Price:', room.priceValue);

        if (!checkInStr || !checkOutStr) {
            if (durationEl) durationEl.textContent = '0 Bulan';
            if (totalPriceEl) totalPriceEl.textContent = formatCurrency(0);
            return null;
        }

        if (checkOut < checkIn) {
            if (durationEl) durationEl.textContent = 'Tanggal tidak valid';
            if (totalPriceEl) totalPriceEl.textContent = formatCurrency(0);
            return null;
        }

        const months = calculateMonths(checkIn, checkOut);
        const totalPrice = room.priceValue * months;

        console.log('Duration:', months, 'months, Total Price:', totalPrice);

        if (durationEl) {
            durationEl.textContent = `${months} Bulan`;
            durationEl.style.transform = 'scale(1.03)';
            setTimeout(() => durationEl.style.transform = '', 120);
        }
        if (totalPriceEl) {
            totalPriceEl.textContent = formatCurrency(totalPrice);
            totalPriceEl.style.transform = 'scale(1.03)';
            setTimeout(() => totalPriceEl.style.transform = '', 120);
        }

        return { months, totalPrice };
    }

    roomCards.forEach(card => {
        card.addEventListener('click', () => {
            const key = normalizeRoomKey(card.dataset.room);
            renderRoomUI(key);
            calculateAndRender();
        });
    });

    if (roomSelectorEl) {
        roomSelectorEl.addEventListener('change', (e) => {
            const key = normalizeRoomKey(e.target.value);
            renderRoomUI(key);
            calculateAndRender();
        });
    }

    if (checkInEl) checkInEl.addEventListener('change', calculateAndRender);
    if (checkOutEl) checkOutEl.addEventListener('change', calculateAndRender);

    const urlParams = new URLSearchParams(window.location.search);
    const initialRoomRaw = urlParams.get('room') || urlParams.get('room_type') || (roomSelectorEl ? roomSelectorEl.value : 'type1');
    const initialRoom = normalizeRoomKey(initialRoomRaw);
    renderRoomUI(initialRoom);
    setTimeout(calculateAndRender, 80);

    if (btnBookNow) {
        btnBookNow.addEventListener('click', async function (e) {
            e.preventDefault();
            const res = await calculateAndRender();
            if (!res) {
                alert('Periksa pilihan kamar dan tanggal sewa.');
                return;
            }
            const roomKey = getSelectedRoomKey();
            const room = roomData[roomKey];
            const checkInStr = checkInEl ? checkInEl.value : '';
            const checkOutStr = checkOutEl ? checkOutEl.value : '';

            console.log('Processing booking for:', room.name);

            const params = new URLSearchParams({
                room_type: room.name,
                price: res.totalPrice.toString(),
                check_in: checkInStr,
                check_out: checkOutStr,
                duration: res.months.toString()
            });
            window.location.href = `payment.html?${params.toString()}`;
        });
    }
});
