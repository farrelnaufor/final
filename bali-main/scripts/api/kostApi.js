
async function getAllProperties() {
  const { data, error } = await window.supabase
    .from("properties")
    .select("*, rooms(*), owner:profiles(full_name, phone)")
    .eq("is_active", true);

  return { data, error };
}

async function createProperty(property) {
  const { data, error } = await window.supabase
    .from("properties")
    .insert([property])
    .select();

  return { data, error };
}

// ==== ROOMS ==== //
async function getRoomsByProperty(propertyId) {
  const { data, error } = await window.supabase
    .from("rooms")
    .select("*")
    .eq("property_id", propertyId);

  return { data, error };
}

async function createRoom(room) {
  const { data, error } = await window.supabase
    .from("rooms")
    .insert([room])
    .select();

  return { data, error };
}

// ==== BOOKINGS ==== //
async function createBooking(booking) {
  const { data, error } = await window.supabase
    .from("bookings")
    .insert([booking])
    .select();

  return { data, error };
}

async function getBookingsByUser(userId) {
  const { data, error } = await window.supabase
    .from("bookings")
    .select("*, rooms(*), rooms:property_id(*)")
    .eq("renter_id", userId);

  return { data, error };
}

// Fungsi untuk menghitung detail booking (durasi dan harga)
function calculateBookingDetails(checkInDate, checkOutDate, roomData) {
  if (!checkInDate || !checkOutDate || !roomData) {
    return { 
      isValid: false, 
      message: "Data tidak lengkap" 
    };
  }
  
  // Hitung durasi dalam hari
  const startDate = new Date(checkInDate);
  const endDate = new Date(checkOutDate);
  
  // Validasi tanggal
  if (endDate <= startDate) {
    return { 
      isValid: false, 
      message: "Tanggal check-out harus setelah tanggal check-in" 
    };
  }
  
  // Hitung selisih dalam hari
  const durationTime = endDate.getTime() - startDate.getTime();
  const durationDays = Math.ceil(durationTime / (1000 * 3600 * 24));
  
  // Hitung total harga (harga per hari, dikali durasi)
  // Pastikan menggunakan harga yang benar dari roomData
  const priceValue = parseInt(roomData.price.replace(/\D/g, ''));
  const dailyRate = priceValue / 30; // Harga per hari
  const totalPrice = Math.round(dailyRate * durationDays);
  
  // Buat data booking dengan informasi lengkap
  const bookingData = {
    roomType: roomData.type || "",
    roomName: roomData.name,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    duration: durationDays,
    totalPrice: totalPrice,
    priceFormatted: `Rp ${totalPrice.toLocaleString('id-ID')}`,
    // Tambahkan informasi tambahan yang mungkin diperlukan
    priceValue: priceValue,
    pricePerDay: dailyRate
  };
  
  return { 
    isValid: true, 
    bookingData: bookingData 
  };
}

// Fungsi untuk menyimpan data booking ke localStorage
function saveBookingData(bookingData) {
  if (bookingData) {
    localStorage.setItem('bookingData', JSON.stringify(bookingData));
    return true;
  }
  return false;
}

// Fungsi untuk mendapatkan data booking dari localStorage
function getBookingData() {
  try {
    return JSON.parse(localStorage.getItem('bookingData') || '{}');
  } catch (error) {
    console.error('Error saat mengambil data booking:', error);
    return {};
  }
}

// Fungsi untuk membuat URL pembayaran
function createPaymentUrl(bookingData, roomName) {
  if (!bookingData) return '';
  
  return `pembayaran.html?room=${encodeURIComponent(roomName)}&checkIn=${encodeURIComponent(bookingData.checkIn)}&checkOut=${encodeURIComponent(bookingData.checkOut)}&duration=${bookingData.duration}&price=${encodeURIComponent(bookingData.totalPrice)}`;
}

// ==== REVIEWS ==== //
async function getReviews() {
  const { data, error } = await window.supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  return { data, error };
}

async function createReview(review) {
  const { data, error } = await window.supabase
    .from("reviews")
    .insert([review])
    .select();

  return { data, error };
}

// ==== ORDERS ==== //
async function getOrders() {
  const { data, error } = await window.supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  return { data, error };
}

async function updateOrder(orderId, updates) {
  const { data, error } = await window.supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId)
    .select();

  return { data, error };
}

// ==== ROOMS ==== //
async function updateRoom(roomId, updates) {
  const { data, error } = await window.supabase
    .from("rooms")
    .update(updates)
    .eq("id", roomId)
    .select();

  return { data, error };
}

async function deleteRoom(roomId) {
  const { data, error } = await window.supabase
    .from("rooms")
    .delete()
    .eq("id", roomId);

  return { data, error };
}

// ==== BOOKINGS ==== //
async function getBookings() {
  const { data, error } = await window.supabase
    .from("bookings")
    .select("*, rooms(*), renter:profiles(full_name, email, phone)")
    .order("created_at", { ascending: false });

  return { data, error };
}

async function updateBooking(bookingId, updates) {
  const { data, error } = await window.supabase
    .from("bookings")
    .update(updates)
    .eq("id", bookingId)
    .select();

  return { data, error };
}

window.kostApi = {
  getAllProperties,
  createProperty,
  getRoomsByProperty,
  createRoom,
  updateRoom,
  deleteRoom,
  createBooking,
  getBookings,
  updateBooking,
  getBookingsByUser,
  getReviews,
  createReview,
  getOrders,
  updateOrder,
  calculateBookingDetails,
  saveBookingData,
  getBookingData,
  createPaymentUrl
};
