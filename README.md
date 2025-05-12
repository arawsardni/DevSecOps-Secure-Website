# DevSecOps Secure Website

## Menjalankan Aplikasi dengan Docker

Repositori ini berisi aplikasi full-stack yang terdiri dari:
- Frontend NextJS
- Backend Django
- Database PostgreSQL

Keseluruhan aplikasi bisa dijalankan dengan mudah menggunakan Docker.

### Cara Menjalankan

1. Pastikan Docker dan Docker Compose sudah terinstal di sistem anda
2. Clone repositori ini
3. Buka terminal dan masuk ke direktori root repositori
4. Jalankan perintah berikut:

```bash
docker-compose up --build
```

5. Tunggu hingga semua container dibangun dan berjalan
6. Akses aplikasi:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api

### Menghentikan Aplikasi

Untuk menghentikan aplikasi, jalankan:

```bash
docker-compose down
```

Untuk menghapus volume (termasuk database), jalankan:

```bash
docker-compose down -v
```

## Troubleshooting

Jika frontend tidak dapat terhubung ke backend, pastikan:
1. Kedua container berjalan dengan benar (`docker ps`)
2. Variabel lingkungan `NEXT_PUBLIC_API_URL` telah dikonfigurasi dengan benar
3. Network bridge Docker berfungsi dengan baik 