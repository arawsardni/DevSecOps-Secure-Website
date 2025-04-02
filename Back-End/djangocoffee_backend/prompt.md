## Aplikasi Payment

Aplikasi payment telah berhasil dibuat dengan fitur-fitur berikut:

### Model

1. `PaymentMethod`

   - Menyimpan metode pembayaran (Transfer Bank, QRIS, Tunai)
   - Mendukung status aktif/tidak aktif
   - Informasi biaya admin
   - Pengaturan metode favorit

2. `BankAccount`

   - Menyimpan rekening bank untuk metode transfer
   - Mendukung multiple rekening per metode pembayaran
   - Status aktif/tidak aktif

3. `Payment`

   - Menyimpan transaksi pembayaran
   - Mendukung berbagai status (pending, verifying, paid, failed, expired, refunded)
   - Terintegrasi dengan model Order
   - Generate ID referensi otomatis
   - Pencatatan waktu kedaluwarsa
   - Fields khusus untuk setiap metode pembayaran

4. `PaymentHistory`
   - Menyimpan riwayat perubahan status pembayaran
   - Pencatatan waktu perubahan
   - Pencatatan petugas yang mengubah

### API Endpoints

1. Untuk Public

   - `GET /api/payments/methods/` - Mendapatkan daftar metode pembayaran aktif
   - `GET /api/payments/methods/<id>/` - Mendapatkan detail metode pembayaran

2. Untuk User

   - `GET /api/payments/` - Mendapatkan daftar pembayaran user
   - `GET /api/payments/<id>/` - Mendapatkan detail pembayaran
   - `POST /api/payments/create/` - Membuat pembayaran baru
   - `POST /api/payments/<id>/upload-proof/` - Mengunggah bukti pembayaran
   - `POST /api/payments/<id>/check-status/` - Memeriksa status pembayaran
   - `POST /api/payments/<id>/cancel/` - Membatalkan pembayaran
   - `POST /api/payments/<id>/simulate-cash/` - Simulasi pembayaran tunai

3. Untuk Admin
   - `GET /api/payments/admin/list/` - Mendapatkan daftar seluruh pembayaran
   - `GET /api/payments/admin/<id>/` - Mendapatkan detail pembayaran
   - `POST /api/payments/admin/<id>/confirm/` - Konfirmasi pembayaran
   - `POST /api/payments/admin/<id>/reject/` - Tolak pembayaran
   - `GET /api/payments/admin/stats/` - Mendapatkan statistik pembayaran
   - Endpoints untuk pengelolaan metode pembayaran dan rekening bank

### Signal Handlers

1. `store_original_payment_status`

   - Menyimpan status pembayaran sebelum diupdate untuk perbandingan

2. `create_payment_history`

   - Mencatat perubahan status pembayaran ke dalam history
   - Otomatis membuat catatan berdasarkan jenis perubahan

3. `create_payment_notification`
   - Mengirim notifikasi ke pengguna saat status pembayaran berubah
   - Terintegrasi dengan aplikasi notification
   - Memperhatikan preferensi notifikasi pengguna

### Fitur Keamanan

1. Validasi

   - Validasi order milik pengguna yang login
   - Validasi status pembayaran
   - Validasi jumlah pembayaran tunai

2. Isolasi Data

   - Pengguna hanya dapat mengakses pembayaran mereka sendiri
   - Permission khusus untuk admin

3. Transaction Handling

   - Penggunaan DB transaction untuk operasi kritikal

4. Error Handling
   - Penanganan kesalahan yang komprehensif
   - Pesan error yang jelas dan informatif

### Admin Panel

1. PaymentMethodAdmin

   - Tampilan metode pembayaran dengan ikon visual
   - Pengelolaan rekening bank terhubung

2. PaymentAdmin

   - Status berwarna untuk kemudahan identifikasi
   - Grouping fields berdasarkan tipe pembayaran
   - Tampilan riwayat perubahan status

3. BankAccountAdmin

   - Pengelolaan rekening bank
   - Filter berdasarkan status dan metode pembayaran

4. PaymentHistoryAdmin
   - Pencatatan semua perubahan status
   - Filter berdasarkan status dan waktu

Aplikasi payment dirancang dengan pendekatan "dummy payment" yang mensimulasikan alur pembayaran tanpa menggunakan gateway pembayaran aktual. Ini memungkinkan pengujian alur pembayaran lengkap tanpa perlu integrasi pihak ketiga.
