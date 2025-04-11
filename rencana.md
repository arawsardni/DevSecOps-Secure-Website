# Rencana Integrasi Frontend dan Backend

## Fitur yang Sudah Terhubung

- **Autentikasi**
  - ✅ Login
  - ✅ Register

## Fitur yang Belum Terhubung

### 1. Produk/Katalog ✅

- Menampilkan daftar produk dari API ✅
- Detail produk ✅
- Filter dan pencarian produk ✅
- Pagination ✅

### 2. Profil Pengguna ✅

- Menampilkan data profil pengguna ✅
- Edit profil pengguna ✅
- Upload dan ganti avatar ✅
- Manajemen alamat pengguna ✅

### 3. Keranjang Belanja ✅

- Menambah produk ke keranjang ✅
- Mengubah kuantitas produk ✅
- Menghapus produk dari keranjang ✅
- Menyimpan keranjang berdasarkan user ID ✅
- Fitur "Beli Sekarang" yang langsung mengarahkan ke keranjang ✅
- Pemilihan alamat dari daftar alamat tersimpan di profil ✅
- Pemilihan metode pengambilan (Pickup/Delivery) ✅

### 4. Checkout dan Pemesanan ✅

- Form alamat pengiriman ✅
- Pilihan metode pengiriman ✅
- Pilihan metode pembayaran ✅
- Konfirmasi pesanan ✅
- QR Code pembayaran yang unik untuk setiap transaksi ✅
- Halaman konfirmasi pembayaran ✅
- Halaman sukses setelah pembayaran ✅

### 5. Riwayat Pesanan ✅

- Daftar pesanan yang pernah dibuat ✅
- Detail pesanan ✅
- Status pesanan ✅
- Riwayat pesanan berdasarkan user ID ✅
- Fitur untuk menghapus semua riwayat pesanan ✅

### 6. Review Produk ✅

- Menampilkan review produk ✅
- Menambahkan review produk ✅
- Rating produk ✅
- Review hanya untuk produk yang telah dibeli ✅
- Edit review produk ✅
- Menampilkan nama asli pengguna di review ✅
- Menampilkan avatar pengguna di review (jika tersedia) ✅
- Update rating dinamis di semua tampilan produk ✅

### 7. Notifikasi

- Notifikasi pesanan
- Notifikasi promo/diskon

### 8. Konten Dinamis

- Banner
- Konten promosi
- Informasi toko

## Rencana Implementasi

### Tahap 1: Produk/Katalog ✅

1. Buat custom hook `useProducts` untuk mengambil data produk dari API `/api/products/` ✅
2. Implementasi komponen ProductList yang terhubung dengan backend ✅
3. Implementasi komponen ProductDetail yang terhubung dengan backend ✅
4. Tambahkan fitur filter, pencarian, dan pagination ✅

### Tahap 2: Profil Pengguna ✅

1. Buat halaman profil yang mengambil data dari API `/api/auth/profile/` ✅
2. Implementasi form edit profil yang terhubung dengan API `/api/auth/profile/update/` ✅
3. Implementasi fitur upload dan ganti avatar ✅
4. Implementasi manajemen alamat pengguna ✅

### Tahap 3: Keranjang Belanja ✅

1. Buat komponen Cart untuk mengelola keranjang belanja ✅
2. Implementasi fungsi tambah/ubah/hapus item keranjang ✅
3. Mengambil data produk lengkap dari backend untuk item di keranjang ✅
4. Implementasi cart berbasis user (keranjang ditautkan dengan user_id) ✅
5. Fitur "Beli Sekarang" yang menambahkan produk ke keranjang dan langsung mengarahkan ke halaman Cart ✅
6. Integrasi alamat dari profil pengguna untuk pengiriman ✅

### Tahap 4: Checkout dan Pemesanan ✅

1. Buat form checkout yang terhubung dengan API alamat `/api/addresses/` ✅
2. Implementasi pilihan metode pengiriman dari API `/api/shipping/` ✅
3. Implementasi pilihan metode pembayaran dari API `/api/payments/` ✅
4. Implementasi proses pesanan dengan API `/api/orders/` ✅
5. Implementasi halaman konfirmasi pembayaran dengan QR Code unik ✅
6. Implementasi halaman sukses setelah pembayaran ✅

### Tahap 5: Riwayat Pesanan ✅

1. Buat halaman riwayat pesanan yang mengambil data dari API `/api/orders/` ✅
2. Implementasi komponen detail pesanan ✅
3. Implementasi fitur tracking status pesanan ✅
4. Implementasi riwayat pesanan berdasarkan user ID ✅
5. Implementasi fitur untuk menghapus semua riwayat pesanan ✅

### Tahap 6: Review Produk ✅

1. Implementasi komponen review yang mengambil data dari localStorage ✅
2. Buat form untuk menambahkan review produk ✅
3. Implementasi halaman review produk untuk produk yang telah dibeli ✅
4. Implementasi fitur edit review produk ✅
5. Integrasi dengan halaman detail produk ✅
6. Perbaikan tampilan nama dan avatar pengguna di review ✅
7. Implementasi update rating dinamis di setiap card produk ✅

### Tahap 7: Notifikasi

1. Implementasi sistem notifikasi yang terhubung dengan API `/api/notifications/`

### Tahap 8: Konten Dinamis

1. Implementasi banner dan konten dinamis dari API `/api/core/`

## Prioritas Implementasi

1. Produk/Katalog (Penting: dasar untuk semua fitur lain) ✅
2. Profil Pengguna (Medium: untuk personalisasi) ✅
3. Keranjang Belanja (Penting: fungsionalitas inti e-commerce) ✅
4. Checkout dan Pemesanan (Penting: untuk transaksi) ✅
5. Riwayat Pesanan (Medium: untuk user experience) ✅
6. Review Produk (Medium: untuk sosial dan kepercayaan) ✅
7. Notifikasi (Low: fitur tambahan)
8. Konten Dinamis (Low: untuk marketing)

## Progress Terbaru

- ✅ Implementasi sistem keranjang belanja yang terhubung dengan user ID
- ✅ Implementasi halaman checkout dengan pilihan metode pengiriman dan pembayaran
- ✅ Implementasi halaman konfirmasi pembayaran dengan QR Code unik
- ✅ Implementasi halaman sukses setelah pembayaran
- ✅ Implementasi halaman riwayat pesanan yang terhubung dengan user ID
- ✅ Implementasi fitur untuk menghapus semua riwayat pesanan
- ✅ Perbaikan tampilan produk di halaman Cart (menghapus detail es, gula, dan shot)
- ✅ Penambahan tombol "Mulai Belanja" saat keranjang kosong
- ✅ Implementasi sistem review produk untuk produk yang telah dibeli
- ✅ Implementasi halaman review produk dengan fitur tambah dan edit review
- ✅ Integrasi review dengan halaman detail produk
- ✅ Perbaikan tampilan nama pengguna (menggunakan nama asli dari user_data)
- ✅ Penambahan tampilan avatar pengguna pada review (jika tersedia)
- ✅ Implementasi rating dinamis yang diperbarui pada card produk berdasarkan review
- ✅ Perbaikan format harga pada halaman review produk

## Rencana Selanjutnya

1. Implementasi sistem notifikasi
2. Implementasi konten dinamis (banner, promo, dll)
3. Optimasi performa aplikasi
4. Pengujian keamanan dan perbaikan bug
