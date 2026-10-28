# 🗺️ Roadmap & Rencana Pengembangan Mayarupa

Dokumen ini berisi rangkuman rencana pengembangan, ide fitur baru, dan arah inovasi untuk aplikasi **Mayarupa — Virtual Hand-Tracked Puppetry** karya **wardannugraha**.

---

## 🎯 Visi Pengembangan
Menjadikan Mayarupa sebagai platform simulator pertunjukan wayang digital interaktif terlengkap, mudah digunakan oleh dalang profesional maupun pemula, memiliki visual panggung yang teatrikal dan sinematik, serta siap untuk pentas proyektor panggung dan media sosial.

---

## 🌟 Daftar Rencana Fitur (Future Roadmap)

### 🎵 1. Audio Pentas & Scene Music Player (`assets/audio/`)
* **Latar Belakang:** Folder `assets/audio/` sudah siap, selanjutnya dibuat pemutar musik otomatis berdasarkan adegan wayang.
* **Fitur yang Direncanakan:**
  * **Pilihan Adegan Suasana (Presets):**
    * <kbd>1</kbd> **Jejer / Pembuka:** Suasana keraton hening & agung (*Ayak-ayak*).
    * <kbd>2</kbd> **Laku / Perjalanan:** Suasana dialog santai / perjalanan (*Srepegan*).
    * <kbd>3</kbd> **Perang / Sabetan:** Suasana pertarungan intens & cepat (*Sampak*).
    * <kbd>4</kbd> **Suluk / Wejangan:** Suasana kontemplasi mistis dengan lantunan suluk.
    * <kbd>0</kbd> **Hening:** Suara alam / blencong malam.
  * **Seamless Crossfade:** Transisi perpindahan lagu yang halus tanpa jeda kasar.

---

### ⚔️ 2. Efek Pertarungan & Gestur Sakral Dalang (*Combat & Gesture FX*)
* **Efek Tabrakan Wayang (*Clash FX*):**
  * Ketika wayang kiri dan kanan saling beradu dengan kecepatan tinggi, layar kelir memunculkan getaran halus (*screen shake*) dan percikan partikel api kelir (*spark particles*).
* **Gestur Tangan Khusus (*Dalang Magic Gestures*):**
  * **Kepalan Tangan (Fist Gesture):** Tokoh otomatis masuk ke posisi siaga bertarung (*stance perang*).
  * **Jari Terbuka Lebar (Open Palm):** Gunungan berputar perlahan (*Kayon Mubeng*) saat menandai pergantian babak.
  * **Dua Tangan Merapat:** Gestur sungkem / sembah penghormatan.

---

### 🕯️ 3. Atmosfer Waktu Pentas (*Pathet Lighting Engine*)
* **Latar Belakang:** Dalam pewayangan klasik, suasana cahaya kelir berubah seiring waktu malam berganti fajar.
* **Fitur yang Direncanakan:**
  * **Pathet Nem (Awal Pentas - 21:00):** Pendar lampu blencong kuning keemasan hangat.
  * **Pathet Sanga (Tengah Malam - 00:00):** Pendar temaram biru safir keemasan dengan kabut tipis berkesan sakral dan mistis.
  * **Pathet Manyura (Fajar Kemenangan - 03:00):** Pendar jingga kemerahan matahari terbit (*Perang Brubuh / Ruwatan*).
  * **Partikel Debu Teatrikal (*Atmospheric Dust Particles*):** Butiran debu halus melayang lambat melintasi sorot lampu blencong.

---

### ⏺️ 4. Perekam Pertunjukan Terintegrasi (*Performance Video Recorder*)
* **Fitur yang Direncanakan:**
  * Tombol **`⏺️ Rekam Pentas`** di antarmuka dalang.
  * Merekam seluruh tampilan panggung, gerakan tangan, dan alunan audio gamelan secara *real-time* ke format video modern (**`.mp4` / `.webm`**).
  * Siap diunggah langsung ke YouTube, Instagram Reels, atau TikTok tanpa perlu aplikasi perekam layar luar (seperti OBS/Bandicam).

---

### 🦾 5. Artikulasi Lengan Wayang Dinamis (*2D Puppet Skeletal Arms*)
* **Fitur yang Direncanakan:**
  * Menambahkan sistem sendi engsel pada lengan wayang (*2D Skeleton IK*).
  * Gerakan tekukan jemari tangan dalang (ibu jari dan telunjuk) dapat menggerakkan tongkat cempurit tangan wayang untuk mengayun, menunjuk, atau menghunus keris/senjata.

---

### 📦 6. Rak Simpingan Wayang Cepat (*Quick Simping Carousel*)
* **Fitur yang Direncanakan:**
  * Baris rak wayang kecil di bagian bawah layar (*simpingan kanan dan kiri*).
  * Dalang dapat mengganti tokoh wayang yang sedang dimainkan hanya dengan klik cepat atau menekan tombol angka shortcut saat pergantian tokoh di tengah lakon.

---

## 📊 Matriks Prioritas Pengembangan

| Prioritas | Fitur | Kategori | Tingkat Kesulitan |
| :--- | :--- | :--- | :--- |
| ⭐⭐⭐ **Tinggi** | **Scene Audio Player (`assets/audio/`)** | Audio & Pengiring | Mudah - Menengah |
| ⭐⭐⭐ **Tinggi** | **Pathet Lighting Engine (3 Suasana Pentas)** | Visual & Atmosfer | Mudah |
| ⭐⭐ **Menengah** | **Efek Tabrakan & Screen Shake (Clash FX)** | Interaktivitas & Fisika | Menengah |
| ⭐⭐ **Menengah** | **Perekam Video Pentas (In-App Recorder)** | Ekspor & Media | Menengah |
| ⭐ **Lanjutan** | **Artikulasi Lengan Wayang (2D Arm IK)** | Animasi & Rangka | Kompleks |

---

> 💡 *Dokumen ini akan terus diperbarui sebagai acuan diskusi dan tahap implementasi fitur Mayarupa selanjutnya.*
