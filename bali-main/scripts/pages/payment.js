document.addEventListener('DOMContentLoaded', function() {
    console.log('Payment page loaded');
    const urlParams = new URLSearchParams(window.location.search);
    console.log('URL Parameters:', Object.fromEntries(urlParams.entries()));
    
    const roomType = urlParams.get('room') || urlParams.get('room_type') || urlParams.get('room_name');
    const roomPriceRaw = urlParams.get('price') || urlParams.get('priceValue') || urlParams.get('total');
    
    console.log('Room Type:', roomType);
    console.log('Room Price Raw:', roomPriceRaw);
    
    const supabase = window.supabase;
    
    const ownerWhatsAppNumber = "6281394499782"; 
    
    async function saveOrderToSupabase(orderData) {
        try {
            if (!supabase) {
                console.error('Supabase client tidak tersedia');
                return { success: false, error: 'Supabase client tidak tersedia' };
            }

            const { data, error } = await supabase
                .from('orders')
                .insert([orderData])
                .select();

            if (error) {
                console.error('Error menyimpan order ke Supabase:', error);
                return { success: false, error: error.message };
            }

            console.log('Order Berhasil Dibuat!', data);
            return { success: true, data };
        } catch (err) {
            console.error('Exception saat menyimpan order:', err);
            return { success: false, error: err.message };
        }
    }

    async function updateRoomAvailability(roomType, available) {
        try {
            if (!supabase) return { success: false, error: 'Supabase client tidak tersedia' };

            const { data, error } = await supabase
                .from('rooms')
                .update({ is_available: available })
                .eq('room_type', roomType)
                .select()
                .limit(1);

            if (error) {
                console.error('Error updating room availability:', error);
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (err) {
            console.error('Exception updating room availability:', err);
            return { success: false, error: err.message };
        }
    }
    
    function showNotification(message, isSuccess = true) {

        let notification = document.getElementById('notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            document.body.appendChild(notification);
        }
        
        notification.className = isSuccess ? 'notification success' : 'notification error';
        notification.textContent = message;
        
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
    
    function safeNumber(v) {
        if (!v) return 0;
        const n = Number(String(v).replace(/[^\d\-]/g, ''));
        return Number.isFinite(n) ? n : 0;
    }
    
    function formatCurrencyNumber(n) {
        return 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');
    }
    
    function formatDateSafe(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (isNaN(d)) return '-';
        return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    
    function generateOrderNumber() {
        const timestamp = new Date().getTime().toString().slice(-6);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `ORD-${timestamp}${random}`;
    }
    
    const orderNumber = generateOrderNumber();
    const orderNumberElement = document.getElementById('order-number');
    if (orderNumberElement) orderNumberElement.textContent = orderNumber;

    async function prefillUserData() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('full_name, email, phone, bank_name, bank_account_number, bank_account_holder')
                    .eq('id', user.id)
                    .single();
                
                if (profile && !error) {
                    const nameInput = document.getElementById('name');
                    const emailInput = document.getElementById('email');
                    const phoneInput = document.getElementById('phone');
                    
                    if (nameInput && profile.full_name) nameInput.value = profile.full_name;
                    if (emailInput && profile.email) emailInput.value = profile.email;
                    if (phoneInput && profile.phone) phoneInput.value = profile.phone;
                    
                    console.log('User data pre-filled:', profile);
                }
            }
        } catch (error) {
            console.log('User not logged in or error fetching profile:', error);
        }
    }

    prefillUserData();
    
    const elRoomType = document.getElementById('summary-room-type');
    const elRoomPrice = document.getElementById('summary-room-price');
    const elCheckIn = document.getElementById('summary-check-in');
    const elCheckOut = document.getElementById('summary-check-out');
    const elDuration = document.getElementById('summary-duration');
    const elTotal = document.getElementById('summary-total');
    
    if (elRoomType) elRoomType.textContent = roomType ? decodeURIComponent(roomType) : '-';
    if (elRoomPrice) {
        const priceNum = safeNumber(roomPriceRaw);
        elRoomPrice.textContent = priceNum ? formatCurrencyNumber(priceNum) : (roomPriceRaw ? decodeURIComponent(roomPriceRaw) : '-');
    }
    
    const checkInParam = urlParams.get('check_in') || urlParams.get('checkin');
    const checkOutParam = urlParams.get('check_out') || urlParams.get('checkout');
    const durationParam = urlParams.get('duration') || urlParams.get('months');
    
    console.log('Check-in:', checkInParam);
    console.log('Check-out:', checkOutParam);
    console.log('Duration:', durationParam);
    
    if (elCheckIn) elCheckIn.textContent = formatDateSafe(checkInParam);
    if (elCheckOut) elCheckOut.textContent = formatDateSafe(checkOutParam);
    if (elDuration) elDuration.textContent = durationParam ? `${durationParam} Bulan` : '-';
    
    let totalCalculated = 0;
    const totalParam = urlParams.get('total') || urlParams.get('total_price');
    if (totalParam) {
        totalCalculated = safeNumber(totalParam);
    } else {
        const priceNum = safeNumber(roomPriceRaw);
        const dur = Number(durationParam) || 0;
        if (priceNum && dur) totalCalculated = priceNum; 
        if (!totalCalculated && priceNum && dur) totalCalculated = priceNum * dur;
    }
    if (elTotal) elTotal.textContent = totalCalculated ? formatCurrencyNumber(totalCalculated) : '-';
    
    const paymentForm = document.getElementById('payment-form');
    const paymentFormSection = document.getElementById('payment-form-section');
    const qrPaymentSection = document.getElementById('qr-payment-section');
    const paymentCompletedBtn = document.getElementById('payment-completed-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    const qrCodeImage = document.getElementById('qr-code-image');
    
    if (paymentForm) {
        paymentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const paymentMethod = document.getElementById('payment-method').value;
            
            let userId = null;
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    userId = user.id;
                }
            } catch (error) {
                console.log('Error getting user info:', error);
            }
            
            const orderDetails = {
                order_number: orderNumber,
                room_type: roomType ? decodeURIComponent(roomType) : '-',
                total_payment: totalCalculated,
                name: name,
                phone: phone,
                email: email,
                payment_method: paymentMethod,
                duration: durationParam ? Number(durationParam) : 1,
                check_in: checkInParam || new Date().toISOString(),
                check_out: checkOutParam || null,
                status: 'pending',
                created_at: new Date().toISOString(),
                user_id: userId 
            };
            
            const saveResult = await saveOrderToSupabase(orderDetails);
            
            if (!saveResult.success) {
                console.error('Gagal menyimpan order:', saveResult.error);
                showNotification('Gagal menyimpan order: ' + saveResult.error, false);
            } else {
                showNotification('Order berhasil dibuat!', true);
            }
            
            if (paymentFormSection) paymentFormSection.style.display = 'none';
            if (qrPaymentSection) qrPaymentSection.style.display = 'block';
            
            const qrData = `ORDER:${orderNumber}|ROOM:${roomType}|TOTAL:${totalCalculated}|NAME:${name}|PHONE:${phone}`;
            if (qrCodeImage) {
    qrCodeImage.src = '/bali-main/assets/qr-code.jpeg'; 
    
    qrCodeImage.onload = function() {
        if (paymentCompletedBtn) {
            paymentCompletedBtn.disabled = false;
        }
    };
    
    qrCodeImage.onerror = function() {
        console.error('Gagal memuat gambar QR code');
        if (paymentCompletedBtn) {
            paymentCompletedBtn.disabled = false; 
        }
    };
}
            
            window.orderDetails = {
                orderNumber: orderNumber,
                roomType: roomType ? decodeURIComponent(roomType) : '-',
                totalPayment: totalCalculated ? formatCurrencyNumber(totalCalculated) : '-',
                name: name,
                phone: phone,
                email: email,
                duration: durationParam ? `${durationParam} Bulan` : '-',
                checkIn: formatDateSafe(checkInParam),
                checkOut: formatDateSafe(checkOutParam)
            };
        });
    }
    
    if (paymentCompletedBtn) {
        paymentCompletedBtn.addEventListener('click', function() {
            if (loadingIndicator) loadingIndicator.style.display = 'flex';
            
            const orderDetails = window.orderDetails || {};
            const message = `Halo, saya sudah melakukan pembayaran untuk pesanan berikut:
            
*Nomor Pesanan:* ${orderDetails.orderNumber || '-'}
*Tipe Kamar:* ${orderDetails.roomType || '-'}
*Total Pembayaran:* ${orderDetails.totalPayment || '-'}
*Durasi:* ${orderDetails.duration || '-'}
*Tanggal Mulai:* ${orderDetails.checkIn || '-'}
*Tanggal Selesai:* ${orderDetails.checkOut || '-'}
*Nama:* ${orderDetails.name || '-'}
*Telepon:* ${orderDetails.phone || '-'}

Saya sudah melakukan pembayaran. Mohon cek dan konfirmasi pesanan saya.
(Saya akan mengirimkan screenshot bukti pembayaran)`;
            
            setTimeout(function() {
                const whatsappUrl = `https://wa.me/${ownerWhatsAppNumber}?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
                
                if (loadingIndicator) loadingIndicator.style.display = 'none';
            }, 1000);
        });
    }
    
    const roomSelect = document.getElementById('room-selector');
    
    const defaultPriceMap = {
        type1: safeNumber(urlParams.get('price_type1')) || safeNumber(urlParams.get('price_type')) || 800000,
        type2: safeNumber(urlParams.get('price_type2')) || safeNumber(urlParams.get('price2')) || 700000
    };
    
    function getPriceForKey(key) {
        if (!key) return safeNumber(roomPriceRaw) || 0;
        const k = String(key).toLowerCase();
        if (defaultPriceMap[k] !== undefined) return defaultPriceMap[k];
        const q = safeNumber(urlParams.get(`price_${k}`)) || safeNumber(urlParams.get(`price-${k}`));
        if (q) return q;
        return safeNumber(roomPriceRaw) || 0;
    }
    
    function updatePriceDisplayForSelection(selectedKey) {
        const dur = Number(durationParam) || 0;
        const perMonth = getPriceForKey(selectedKey);
        if (elRoomPrice) elRoomPrice.textContent = perMonth ? formatCurrencyNumber(perMonth) : '-';
        let newTotal = 0;
        if (totalParam) {
            newTotal = safeNumber(totalParam);
        } else if (perMonth && dur) {
            newTotal = perMonth * dur;
        } else {
            newTotal = perMonth;
        }
        if (elTotal) elTotal.textContent = newTotal ? formatCurrencyNumber(newTotal) : '-';
    }
    
    if (roomSelect) {
    }
});