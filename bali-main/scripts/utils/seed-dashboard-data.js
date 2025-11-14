async function seedDashboardData() {
    const supabase = window.supabase;

    console.log('Memulai seed data untuk dashboard owner...');

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error('User tidak login. Silakan login terlebih dahulu.');
        return;
    }

    console.log('User ID:', user.id);

    let property;
    const { data: existingProperty } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id)
        .limit(1)
        .single();

    if (existingProperty) {
        property = existingProperty;
        console.log('Menggunakan property yang sudah ada:', property.id);
    } else {
        const { data: newProperty, error: propError } = await supabase
            .from('properties')
            .insert([{
                owner_id: user.id,
                name: 'Kost BaLy',
                address: 'Jl. Kaliurang No. 123',
                city: 'Yogyakarta',
                description: 'Kost nyaman dan strategis di Yogyakarta',
                is_active: true
            }])
            .select()
            .single();

        if (propError) {
            console.error('Error creating property:', propError);
            return;
        }

        property = newProperty;
        console.log('Property baru berhasil dibuat:', property.id);
    }

    const sampleRooms = [
        {
            property_id: property.id,
            room_number: '101',
            room_type: 'Type 1',
            price: 800000,
            facilities: 'Kasur, Lemari, Meja Belajar, Kamar Mandi Dalam, AC',
            is_available: true
        },
        {
            property_id: property.id,
            room_number: '102',
            room_type: 'Type 1',
            price: 800000,
            facilities: 'Kasur, Lemari, Meja Belajar, Kamar Mandi Dalam, AC',
            is_available: false
        },
        {
            property_id: property.id,
            room_number: '201',
            room_type: 'Type 2',
            price: 700000,
            facilities: 'Kasur, Lemari, Meja Belajar, Kamar Mandi Luar',
            is_available: true
        },
        {
            property_id: property.id,
            room_number: '202',
            room_type: 'Type 2',
            price: 700000,
            facilities: 'Kasur, Lemari, Meja Belajar, Kamar Mandi Luar',
            is_available: false
        },
        {
            property_id: property.id,
            room_number: '301',
            room_type: 'Type 1',
            price: 800000,
            facilities: 'Kasur, Lemari, Meja Belajar, Kamar Mandi Dalam, AC',
            is_available: true
        }
    ];

    const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .insert(sampleRooms)
        .select();

    if (roomsError) {
        console.error('Error creating rooms:', roomsError);
        return;
    }

    console.log('Berhasil membuat', rooms.length, 'kamar');

    const sampleRenterIds = [];
    const renterNames = ['Budi Santoso', 'Ani Wijaya', 'Citra Lestari'];

    for (const name of renterNames) {
        const email = `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`;

        const { data: authData, error: signupError } = await supabase.auth.signUp({
            email: email,
            password: 'password123',
            options: {
                data: {
                    full_name: name,
                    role: 'renter'
                }
            }
        });

        if (signupError && !signupError.message.includes('already registered')) {
            console.error('Error creating renter:', signupError);
            continue;
        }

        if (authData?.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert([{
                    id: authData.user.id,
                    full_name: name,
                    email: email,
                    phone: `08${Math.floor(Math.random() * 1000000000)}`,
                    role: 'renter'
                }], { onConflict: 'id' });

            if (profileError) {
                console.error('Error creating profile:', profileError);
            } else {
                sampleRenterIds.push(authData.user.id);
                console.log('Renter created:', name);
            }
        }
    }

    if (sampleRenterIds.length > 0 && rooms.length > 0) {
        const occupiedRooms = rooms.filter(r => !r.is_available);

        const sampleBookings = occupiedRooms.map((room, index) => {
            const today = new Date();
            const checkIn = new Date(today);
            checkIn.setMonth(checkIn.getMonth() - 1);

            const checkOut = new Date(today);
            checkOut.setMonth(checkOut.getMonth() + 2);

            return {
                room_id: room.id,
                renter_id: sampleRenterIds[index % sampleRenterIds.length],
                check_in: checkIn.toISOString().split('T')[0],
                check_out: checkOut.toISOString().split('T')[0],
                total_price: room.price * 3,
                duration_months: 3,
                payment_status: index % 2 === 0 ? 'paid' : 'pending',
                status: 'active'
            };
        });

        const { error: bookingsError } = await supabase
            .from('bookings')
            .insert(sampleBookings);

        if (bookingsError) {
            console.error('Error creating bookings:', bookingsError);
        } else {
            console.log('Berhasil membuat', sampleBookings.length, 'booking');
        }
    }

    const sampleOrders = [
        {
            order_number: `ORD-${Date.now()}-001`,
            room_type: 'Type 1',
            total_payment: 2400000,
            name: 'Deni Pratama',
            phone: '081234567890',
            email: 'deni.pratama@example.com',
            payment_method: 'qris',
            duration: 3,
            check_in: new Date().toISOString(),
            check_out: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
            user_id: sampleRenterIds.length > 0 ? sampleRenterIds[0] : null
        },
        {
            order_number: `ORD-${Date.now()}-002`,
            room_type: 'Type 2',
            total_payment: 1400000,
            name: 'Eko Saputra',
            phone: '081234567891',
            email: 'eko.saputra@example.com',
            payment_method: 'qris',
            duration: 2,
            check_in: new Date().toISOString(),
            check_out: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'confirmed',
            user_id: sampleRenterIds.length > 1 ? sampleRenterIds[1] : null
        }
    ];

    const { error: ordersError } = await supabase
        .from('orders')
        .insert(sampleOrders);

    if (ordersError) {
        console.error('Error creating orders:', ordersError);
    } else {
        console.log('Berhasil membuat', sampleOrders.length, 'order');
    }

    console.log('Seed data selesai! Silakan refresh halaman dashboard.');
}

if (typeof window !== 'undefined') {
    window.seedDashboardData = seedDashboardData;
}
