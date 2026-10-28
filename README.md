# 🎭 Mayarupa — Virtual Hand-Tracked Puppetry

Aplikasi simulator pertunjukan wayang digital interaktif berbasis kamera **AI Hand Tracking (MediaPipe)** yang dirancang untuk kebutuhan dalang digital, pentas proyektor/InFocus panggung, maupun siaran langsung (*live streaming*) di OBS Studio.

> **Tagline:** *Virtual Hand-Tracked Puppetry*  
> **Karya / Hak Cipta:** © 2026 **wardannugraha**

---

## 🌟 Fitur Utama

### 1. 🖐️ AI Hand Tracking (Mode 1 Tangan & 2 Tangan)
* **Mode 2 Tangan (Duet):** Tangan kiri mengendalikan tokoh wayang sisi kiri, dan tangan kanan mengendalikan tokoh wayang sisi kanan.
* **Mode 1 Tangan (Fokus Tunggal):** 1 tangan dalang mengendalikan 1 tokoh melintasi seluruh panggung layar penuh tanpa batas.
* **Kebebasan Out-Frame (Keluar/Masuk Panggung):** Wayang dapat digerakkan keluar layar ke kiri, kanan, atau bawah (*tancap/simping*) untuk transisi pergantian adegan yang alami.
* **Hand-Presence Visibility:** Wayang hanya tampil di layar saat tangan terdeteksi kamera, dan menghilang dengan halus saat tangan ditarik.

### 2. 🔄 True Anatomical Palm-Flip & Dynamic Wrist Tilt Rotation
* **Pembalikan Telapak Tangan Otomatis (*Palm Flip*):** Membaca orientasi Ibu Jari (Jempol) terhadap Kelingking secara anatomis. Saat telapak tangan dibalik menghadap luar, wayang otomatis berbalik arah hadap.
* **Rotasi Dinamis Mengikuti Kemiringan Tangan (*Wrist Tilt*):** Sudut kemiringan pergelangan tangan dalang dibaca secara *real-time* sehingga wayang ikut miring secara luwes.

### 3. 🌑 Mode Siluet Hitam Tradisional & Warna Asli (Global Switch)
* Beralih secara instan antara **Mode Siluet Hitam Pekat** (bayangan kelir klasik dengan pendaran cahaya blencong) dan **Mode Warna Asli PNG** dengan satu tombol/pintasan keyboard global (<kbd>S</kbd>).

### 4. ☁️ Ragam Motif Siluet Panggung Tradisional (Termasuk Mega Mendung Batik)
* Pilihan motif panggung sinematik:
  1. **☁️ Mega Mendung (Batik Bergerak):** Aset vektor batik mega mendung bertingkat 3-layer yang bergerak dinamis dan tenang.
  2. **☁️ Awan Kumulus Tradisional:** Gumpalan awan lengkung klasik.
  3. **🌊 Ombak Tirta Samudera:** Gelombang laut wayang.
  4. **⛰️ Siluet Candi & Gunung:** Puncak Mahameru & candi.
  5. **🌿 Hutan Wanayasa (Alas):** Pohon hayat / hutan wanayasa.
  6. **🕯️ Kelir Polos:** Pendar cahaya lampu blencong murni.

### 5. ⚙️ Pengaturan Ukuran & Kompensasi Tongkat Cempurit (*Pre-Show Setup*)
* Setiap tokoh dapat diatur **Skala Ukuran (35% - 180%)** dan **Kompensasi Ketinggian Tongkat / Posisi Tumpuan (Offset Y)**.
* Pengaturan tiap tokoh tersimpan otomatis di peramban (*LocalStorage*).

### 6. 🖥️ Layar Bersih Proyektor / OBS Dual-Screen (`proyektor.html`)
* Buka jendela sekunder khusus yang **100% bersih tanpa tombol menu atau bar browser apapun**.
* Gerakan tangan dan pergantian adegan di jendela utama dalang tersinkronisasi secara otomatis (60 FPS tanpa jeda) ke layar proyektor / InFocus / OBS.
* Cukup **klik 2x (double-click)** atau tekan <kbd>F</kbd> di jendela proyektor untuk masuk ke mode *True Fullscreen Edge-to-Edge*.

### 7. 🎵 Backsound Alunan Gamelan Slendro Bawaan
* Alunan melodi gamelan slendro tenang khas pertunjukan wayang dengan dentuman gong penutup yang sakral (Web Audio API internal, 100% offline & bebas error).

---

## 📁 Struktur Berkas Proyek

```text
Mayarupa/
├── assets/
│   ├── wayang/             # Tempat gambar PNG transparan tokoh wayang
│   │   ├── Gunungan.png
│   │   ├── Petruk.png
│   │   ├── Semar.png
│   │   └── Wayang 1.png
│   ├── background/         # Tempat gambar ornamen motif latar (mega_mendung.png)
│   └── audio/              # Tempat menyimpan file musik MP3 / WAV lokal
├── css/
│   └── style.css           # Desain bertema Kayu Jati kraton & emas
├── js/
│   └── wayang-bundle.js    # Seluruh logika engine mandiri (Offline-ready)
├── index.html              # Antarmuka utama konsol dalang & stage kelir
├── proyektor.html          # Jendela bersih khusus InFocus / Proyektor / OBS
├── katalog_wayang.json     # Daftar katalog wayang yang dibaca otomatis
└── buka_wayang.bat         # Launcher batch Windows sekali klik
```

---

## 🚀 Cara Menjalankan Aplikasi

### Metode 1: Sekali Klik (Rekomendasi di Windows)
Cukup klik ganda (*double-click*) berkas **`buka_wayang.bat`**.

### Metode 2: Melalui Peramban Web
Buka berkas **`index.html`** langsung menggunakan peramban modern (Google Chrome, Microsoft Edge, Mozilla Firefox, dll).

---

## 🖼️ Cara Menambahkan Tokoh Wayang Baru

1. Siapkan file gambar tokoh wayang berformat **PNG transparan**.
2. Simpan file gambar tersebut ke dalam folder **`assets/wayang/`** (atau `FotoWayang/`, contoh: `assets/wayang/Bima.png`).
3. Buka berkas **`katalog_wayang.json`** dan tambahkan baris baru:
   ```json
   {
     "id": "bima",
     "name": "Raden Werkudara (Bima)",
     "file": "Bima.png",
     "heightRatio": 0.72
   }
   ```
4. **Selesai!** Tokoh baru akan otomatis muncul di menu pilihan tokoh dan siap dimainkan.

*(Catatan: Anda juga tetap bisa menguji gambar baru secara instan melalui tombol **`📁 Unggah`** di antarmuka web).*

---

## ⌨️ Pintasan Keyboard (*Keyboard Shortcuts*)

| Tombol | Fungsi |
| :--- | :--- |
| <kbd>T</kbd> | Beralih antara **Mode 2 Tangan** (Duet) dan **Mode 1 Tangan** (Fokus Tunggal) |
| <kbd>B</kbd> / <kbd>M</kbd> | Menyalakan / Mematikan **Backsound Alunan Pentas** |
| <kbd>S</kbd> | Beralih antara **Mode Siluet Hitam** dan **Mode Warna Asli** (Global) |
| <kbd>F</kbd> | Mode Layar Penuh (*Fullscreen*) |
| <kbd>H</kbd> / <kbd>Tab</kbd> | Sembunyikan / Tampilkan Menu Kontrol Dalang |
| **Klik & Drag Mouse** | Menggerakkan wayang secara manual jika tanpa kamera |

---

## 📽️ Panduan Setup Pentas Proyektor / InFocus & OBS

1. Hubungkan laptop ke proyektor / InFocus via kabel HDMI (Pilih mode layar: **Extend Desktop / Perluas Tampilan** di Windows).
2. Buka `index.html` di layar utama laptop Anda.
3. Klik tombol **`🖥️ Jendela Proyektor`** di toolbar bawah.
4. Geser jendela baru tersebut ke layar proyektor / InFocus, lalu **klik 2x** pada layar agar menjadi layar penuh tanpa border.
5. Dalang mengendalikan seluruh pertunjukan, audio, dan kamera dari layar laptop utama!

---

## 📄 Hak Cipta & Pengembang

* **Aplikasi:** Mayarupa — Virtual Hand-Tracked Puppetry
* **Pengembang / Kreator:** **wardannugraha**
* **Lisensi:** © 2026 wardannugraha. All rights reserved.

---

## 🗺️ Rencana Pengembangan Mendatang
Lihat dokumen **[`ROADMAP.md`](file:///d:/Coding/WayangDigital/ROADMAP.md)** untuk daftar lengkap rencana inovasi fitur, efek pertarungan, pencahayaan babak (Pathet), dan perekam video pentas!
"# mayarupa" 
