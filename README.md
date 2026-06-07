# Smart Queue Hospital System

## Deskripsi

Smart Queue Hospital System adalah aplikasi manajemen antrean dan appointment rumah sakit berbasis web yang dikembangkan sebagai proyek **Assurance of Learning (AOL)** untuk mata kuliah **Software Engineering**.

Sistem ini memungkinkan pasien untuk membuat appointment secara online dan memantau status appointment mereka. Di sisi lain, admin dapat mengelola seluruh appointment yang masuk, termasuk menyetujui, memanggil antrean berikutnya, menyelesaikan layanan, atau menghapus appointment.

---

## Informasi Akademik

**Mata Kuliah:** Software Engineering

**Jenis Tugas:** Assurance of Learning (AOL)

**Judul Proyek:** Smart Queue Hospital System

Proyek ini dibuat untuk mengimplementasikan konsep-konsep Software Engineering dalam pengembangan aplikasi web yang terintegrasi, mulai dari perancangan sistem, pengembangan backend, pengelolaan database, autentikasi pengguna, hingga implementasi antarmuka pengguna.

---

## Anggota Kelompok

| No | Nama                           |
|----|--------------------------------|
| 1  | [Raziq Rabbani Utama](https://github.com/razeequtama)            |
| 2  | [Muhammad Zahran Al Pasha](https://github.com/Zahran-AL)       |
| 3  | Muhammad Fatih Rafa Raditya    |
| 4  | Jonathan Farrel Christian      |
| 5  | [Ecclesiates Natarios Sihombing](https://github.com/ecclesyia) |

---

## Lisensi

Proyek ini dibuat untuk keperluan akademik sebagai pemenuhan tugas Assurance of Learning (AOL) mata kuliah Software Engineering.

---

## Peran Pengguna

### 1. Pasien (User)

Pasien dapat:

- Registrasi akun
- Login ke sistem
- Membuat appointment
- Melihat daftar appointment yang dimiliki
- Menerima notifikasi terkait status appointment
- Mengakses dashboard pengguna

### 2. Admin

Admin dapat:

- Login ke sistem
- Melihat seluruh appointment
- Menyetujui (Approve) appointment
- Memanggil antrean berikutnya (Next)
- Menyelesaikan appointment (Complete)
- Menghapus appointment (Delete)
- Mengirim dan mengelola notifikasi
- Mengakses dashboard administrator

---

## Teknologi yang Digunakan

### Frontend

- HTML
- CSS
- JavaScript

### Backend

- Node.js
- Express.js

### Database

- MySQL

### Dependencies

- bcryptjs
- cors
- dotenv
- jsonwebtoken

---

## Struktur Proyek

```text
Smart-Queue-Hospital-System/
│
├── middleware/
│   └── auth.js
│
├── public/
│   │
│   ├── admin/
│   │   ├── dashboard.html
│   │   ├── login.html
│   │   ├── navigate.html
│   │   └── register.html
│   │
│   ├── user/
│   │   ├── dashboard.html
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── make-queue.html
│   │   ├── notifications.html
│   │   ├── messages.html
│   │   └── log.html
│   │
│   ├── css/
│   │   └── style.css
│   │
│   ├── js/
│   │   └── script.js
│   │
│   └── index.html
│
├── routes/
│   ├── admin.js
│   ├── auth.js
│   ├── doctors.js
│   ├── messages.js
│   ├── notifications.js
│   └── queues.js
│
├── .env
├── db.js
├── package.json
├── package-lock.json
└── server.js
```

---

## Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
```

### 2. Masuk ke Direktori Proyek

```bash
cd Smart-Queue-Hospital-System
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Konfigurasi Environment Variable

Buat file `.env`

```env
PORT=3001

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=smart_queue_db

JWT_SECRET=your_secret_key
```

### 5. Jalankan Server

```bash
nodemon server.js
```

Server akan berjalan pada:

```text
http://localhost:3001
```

---

## Fitur Utama

### Authentication

- Login User
- Login Admin
- Registrasi User
- Registrasi Admin
- JWT Authentication

### Appointment Management

- Create Appointment
- Approve Appointment
- Next Queue
- Complete Appointment
- Delete Appointment

### Notification System

- Sistem notifikasi untuk pengguna
- Riwayat aktivitas appointment

---

