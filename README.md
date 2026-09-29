# 🎮 Misi Bank Sampah Digital — LKPD Interaktif Informatika Kelas 9

**Digital Waste Bank Mission — Interactive Worksheet for Grade 9 ICT**

Aplikasi web LKPD (Lembar Kerja Peserta Didik) berbasis game sederhana & interaktif untuk materi **Docs, Sheets, dan Slides Terintegrasi** (Berpikir Komputasional) dengan studi kasus **Bank Sampah SMP Negeri 19 Kota Bekasi**.

---

## 📋 Daftar Isi

1. [Fitur Utama](#-fitur-utama)
2. [Struktur File](#-struktur-file)
3. [Cara Menjalankan di Komputer](#-cara-menjalankan-di-komputer)
4. [Cara Deploy ke GitHub Pages (untuk Pemula)](#-cara-deploy-ke-github-pages-untuk-pemula)
5. [Cara Mengubah Data & Pengaturan](#-cara-mengubah-data--pengaturan)
6. [Panduan Guru (?guru=1)](#-panduan-guru-guru1)
7. [Kunci Jawaban Ringkas](#-kunci-jawaban-ringkas)
8. [Troubleshooting](#-troubleshooting)
9. [Kredit & Lisensi](#-kredit--lisensi)

---

## ✨ Fitur Utama

- **7 layar permainan** mengikuti alur LKPD Bagian F: Kegiatan 0 s.d. 5 + Kesimpulan.
- **Bilingual**: toggle 🌐 ID / EN / Bilingual di header. Semua istilah teknis berpadanan Indonesia.
- **Kamus Misi**: 14 istilah teknis (spreadsheet, cell, formula, chart, link, update, dll.).
- **Aturan Emas**: 5 prinsip laporan terintegrasi (satu sumber data, tautkan bukan tempel gambar, dst.).
- **Penyimpanan otomatis** di `localStorage` (key: `lkpd_k9p6_state`). Tombol **Lanjutkan Misi** bila ada progres.
- **Dark mode**, **mode fokus**, dan **3 palet warna** (Hijau / Biru / Ungu).
- **Audio feedback** via Web Audio API (bukan file MP3) — bisa dimatikan.
- **Confetti & animasi badge** saat menyelesaikan misi atau mendapat badge.
- **Cetak / Simpan PDF** dengan CSS `@media print` yang rapi.
- **Kartu Bukti Belajar** dengan QR-style share canvas (dibuat via `<canvas>` murni).
- **Aksesibilitas**: kontras WCAG AA, ukuran font ≥ 16px, tombol ≥ 44×44px, navigasi keyboard penuh (Tab, Enter, Esc).
- **Responsif** dari 360px (HP) hingga 1920px (proyektor).
- **Tanpa backend**, **tanpa login**, **tanpa dependensi eksternal wajib**. Bisa dimainkan offline setelah dimuat pertama kali.

---

## 📁 Struktur File
