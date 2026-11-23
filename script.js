/* ============================================================
   script.js — Misi Bank Sampah Digital
   VERSI PERBAIKAN LENGKAP
   ============================================================ */
(function () {
  'use strict';

  /* =========================================================
     1) KONFIGURASI
     ========================================================= */
  const CONFIG = {
    schoolName: 'SMP Negeri 19 Kota Bekasi',
    wasteData: [
      [12, 15, 18, 21],
      [20, 18, 25, 27],
      [5, 6, 4, 8],
      [3, 2, 4, 3]
    ],
    prices: [3000, 2000, 5000, 500],
    maxTotal: 150,
    badges: [
      { id: 'data-master', icon: '🏆', name: 'Data Master', desc: 'Semua rumus di Sheets benar.' },
      { id: 'chart-champion', icon: '📊', name: 'Chart Champion', desc: 'Memilih jenis grafik dengan tepat.' },
      { id: 'link-legend', icon: '🔗', name: 'Link Legend', desc: 'Memilih grafik tertaut, bukan screenshot.' },
      { id: 'critical-thinker', icon: '🧠', name: 'Critical Thinker', desc: 'Menjawab Uji Ubah Data dengan alasan berbukti.' },
      { id: 'team-player', icon: '🤝', name: 'Team Player', desc: 'Memberi pujian dan saran sejawat.' }
    ],
    defaultLang: 'bi',
    defaultTheme: 'light',
    soundEnabled: true,
    maxHistory: 3,
    storageKey: 'lkpd_k9p6_state'
  };

  /* =========================================================
     2) STATE
     ========================================================= */
  const state = {
    name: '', kelas: '91', role: 'pilot',
    score: 0, badges: [], screen: 1,
    lang: CONFIG.defaultLang, theme: CONFIG.defaultTheme,
    sound: CONFIG.soundEnabled, palette: 'green',
    hypothesis: '',
    k0: { changeDone: false, quiz1: false, reasons: [], reasonsDone: false },
    k1: { formulas: {}, chartDone: false },
    k2: { order: {}, chartLinked: false, analysis: {}, done: false },
    k3: { font: 18, readabilityDone: false, done: false },
    k4: { updated: false, answers: {}, reasonDone: false },
    k5: { praise: '', suggestion: '', conclusion: '', exit: ['', '', ''], feel: null, done: false },
    history: []
  };

  /* =========================================================
     3) UTILITAS
     ========================================================= */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function toast(message, type) {
    type = type || 'ok';
    const box = $('#toastContainer');
    if (!box) { console.log('[toast]', message); return; }
    const el = document.createElement('div');
    el.className = 'toast' + (type === 'warn' ? ' warn' : type === 'err' ? ' err' : '');
    el.textContent = message;
    box.appendChild(el);
    setTimeout(function () {
      el.classList.add('hide');
      setTimeout(function () { el.remove(); }, 320);
    }, 3000);
  }

  /* --- Suara --- */
  let audioCtx = null;
  function beep(freq, dur, type, vol) {
    freq = freq || 600; dur = dur || 0.09; type = type || 'sine'; vol = vol || 0.14;
    if (!state.sound) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    } catch (e) { /* abaikan */ }
  }
  const sfx = {
    click:   function () { beep(520, 0.06, 'triangle', 0.10); },
    correct: function () { beep(660, 0.09); setTimeout(function () { beep(880, 0.13); }, 90); },
    wrong:   function () { beep(220, 0.16, 'sawtooth', 0.12); },
    badge:   function () { beep(523, 0.1); setTimeout(function () { beep(659, 0.1); }, 100); setTimeout(function () { beep(784, 0.16); }, 200); },
    finish:  function () { [523, 659, 784, 1046].forEach(function (f, i) { setTimeout(function () { beep(f, 0.18); }, i * 130); }); }
  };

  /* --- Konfeti --- */
  function confetti(count) {
    count = count || 90;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const layer = document.createElement('div');
    layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9998;overflow:hidden;';
    document.body.appendChild(layer);
    const colors = ['#2E7D32', '#1565C0', '#F9A825', '#C62828', '#66BB6A', '#FFCA28'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('i');
      p.style.cssText = 'position:absolute;left:' + (Math.random() * 100) + 'vw;top:-20px;background:' +
        colors[Math.floor(Math.random() * colors.length)] +
        ';animation-duration:' + (2.2 + Math.random() * 2.4) + 's;animation-delay:' + (Math.random() * 0.6) + 's;' +
        'width:' + (6 + Math.random() * 8) + 'px;height:' + (10 + Math.random() * 12) + 'px;' +
        'animation-name:confettiFall;animation-timing-function:linear;animation-fill-mode:forwards;';
      layer.appendChild(p);
    }
    if (!document.getElementById('confetti-keyframes')) {
      const style = document.createElement('style');
      style.id = 'confetti-keyframes';
      style.textContent = '@keyframes confettiFall{to{transform:translateY(105vh) rotate(720deg);opacity:0.2;}}';
      document.head.appendChild(style);
    }
    setTimeout(function () { layer.remove(); }, 5200);
  }

  /* --- Modal --- */
  let confirmCallback = null;
  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.hidden = false;
    const first = m.querySelector('button, input, select, textarea, [tabindex]');
    if (first) setTimeout(function () { first.focus(); }, 60);
  }
  function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.hidden = true;
  }
  function askConfirm(text, cb) {
    const el = $('#confirmText');
    if (el) el.textContent = text;
    confirmCallback = cb;
    openModal('modalConfirm');
  }

  /* =========================================================
     4) PENYIMPANAN
     ========================================================= */
  function saveState() {
    try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(state)); } catch (e) {}
  }
  function loadState() {
    try {
      const raw = localStorage.getItem(CONFIG.storageKey);
      if (!raw) return false;
      const data = JSON.parse(raw);
      Object.assign(state, data);
      if (!Array.isArray(state.history)) state.history = [];
      return true;
    } catch (e) { return false; }
  }
  function resetState() {
    try { localStorage.removeItem(CONFIG.storageKey); } catch (e) {}
    location.reload();
  }

  /* =========================================================
     5) SKOR & BADGE
     ========================================================= */
  function addScore(points) {
    if (!points) return;
    state.score = Math.min(CONFIG.maxTotal, state.score + points);
    animateScore(state.score);
    saveState();
  }
  function animateScore(target) {
    const el = $('#scoreValue');
    if (!el) return;
    const start = parseInt(el.textContent, 10) || 0;
    const diff = target - start;
    if (diff === 0) { el.textContent = target; return; }
    const steps = Math.min(24, Math.abs(diff));
    let i = 0;
    const timer = setInterval(function () {
      i++;
      el.textContent = Math.round(start + (diff * i / steps));
      if (i >= steps) { clearInterval(timer); el.textContent = target; }
    }, 26);
  }

  function awardBadge(id) {
    if (state.badges.indexOf(id) !== -1) return;
    const badge = CONFIG.badges.filter(function (b) { return b.id === id; })[0];
    if (!badge) return;
    state.badges.push(id);
    renderBadgeStrip();
    renderBadgePreview();
    sfx.badge();
    const bIcon = $('#badgeIcon');
    const bTitle = $('#badgeTitle');
    const bDesc = $('#badgeDesc');
    if (bIcon) bIcon.textContent = badge.icon;
    if (bTitle) bTitle.textContent = badge.name + ' — Badge Baru!';
    if (bDesc) bDesc.textContent = badge.desc;
    openModal('modalBadge');
    confetti(70);
    saveState();
  }

  function renderBadgeStrip() {
    const ul = $('#badgeStrip');
    if (!ul) return;
    ul.innerHTML = '';
    state.badges.forEach(function (id) {
      const b = CONFIG.badges.filter(function (x) { return x.id === id; })[0];
      if (!b) return;
      const li = document.createElement('li');
      li.textContent = b.icon;
      li.title = b.name + ' — ' + b.desc;
      ul.appendChild(li);
    });
  }
  function renderBadgePreview() {
    const ul = $('#badgePreview');
    if (!ul) return;
    ul.innerHTML = '';
    CONFIG.badges.forEach(function (b) {
      const li = document.createElement('li');
      if (state.badges.indexOf(b.id) === -1) li.classList.add('locked');
      li.innerHTML = '<span class="badge-icon">' + b.icon + '</span>' +
                     '<span><strong>' + escapeHtml(b.name) + '</strong><br>' +
                     '<span class="small">' + escapeHtml(b.desc) + '</span></span>';
      ul.appendChild(li);
    });
  }

  /* =========================================================
     6) NAVIGASI
     ========================================================= */
  const SCREEN_TITLES = [
    'Papan Misi (Mission Board)',
    'Kegiatan 0 — Mengamati & Menduga',
    'Kegiatan 1 — Sheets Lab',
    'Kegiatan 2 — Docs Report Builder',
    'Kegiatan 3 — Slides Presenter',
    'Kegiatan 4 — Uji Ubah Data',
    'Kegiatan 5 — Peer Review & Kesimpulan'
  ];

  function goTo(n) {
    state.screen = n;
    $$('.screen').forEach(function (s) { s.classList.remove('is-active'); });
    const target = document.getElementById('screen-' + n);
    if (target) target.classList.add('is-active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateProgress();
    saveState();
  }

  function updateProgress() {
    const dots = $('#progressDots');
    if (dots && dots.children.length === 0) {
      for (let i = 1; i <= 7; i++) {
        const li = document.createElement('li');
        li.textContent = 'L' + i;
        dots.appendChild(li);
      }
    }
    $$('#progressDots li').forEach(function (li, i) {
      const n = i + 1;
      li.classList.toggle('active', n === state.screen);
      li.classList.toggle('done', n < state.screen);
    });
    const fill = $('#progressFill');
    if (fill) fill.style.width = (state.screen / 7 * 100) + '%';
    const label = $('#progressLabel');
    if (label) label.textContent = 'Layar ' + state.screen + ' dari 7 — ' + SCREEN_TITLES[state.screen - 1];
  }

  /* =========================================================
     7) I18N
     ========================================================= */
  const I18N = {
    appTitle: { bi: 'Digital Waste Bank Mission (Misi Bank Sampah Digital)', id: 'Misi Bank Sampah Digital', en: 'Digital Waste Bank Mission' },
    appSubtitle: { bi: 'LKPD Interaktif — Docs, Sheets, Slides Terintegrasi', id: 'LKPD Interaktif — Docs, Sheets, Slides Terintegrasi', en: 'Interactive Worksheet — Integrated Docs, Sheets, Slides' },
    btnGlossary: { bi: 'Kamus Misi (Mission Dictionary)', id: 'Kamus Misi', en: 'Mission Dictionary' },
    btnRules: { bi: 'Aturan Emas (Golden Rules)', id: 'Aturan Emas', en: 'Golden Rules' },
    btnReset: { bi: 'Reset Misi (Reset Mission)', id: 'Reset Misi', en: 'Reset Mission' },
    score: { bi: 'Skor (Score)', id: 'Skor', en: 'Score' },
    startTitle: { bi: 'Start Mission (Mulai Misi)', id: 'Mulai Misi', en: 'Start Mission' },
    startIntro: { bi: 'Selamat datang, agen data! Kamu akan membantu Bank Sampah SMP Negeri 19 Kota Bekasi menyusun laporan digital yang rapi, akurat, dan terintegrasi.', id: 'Selamat datang, agen data! Kamu akan membantu Bank Sampah SMP Negeri 19 Kota Bekasi menyusun laporan digital yang rapi, akurat, dan terintegrasi.', en: 'Welcome, data agent! You will help the Waste Bank of SMP Negeri 19 Kota Bekasi build a neat, accurate, and integrated digital report.' },
    labelName: { bi: 'Nama Pemain (Player Name)', id: 'Nama Pemain', en: 'Player Name' },
    labelClass: { bi: 'Kelas (Class)', id: 'Kelas', en: 'Class' },
    labelRole: { bi: 'Peran Awal (Starting Role)', id: 'Peran Awal', en: 'Starting Role' },
    btnStart: { bi: 'Start Mission (Mulai Misi)', id: 'Mulai Misi', en: 'Start Mission' },
    btnContinue: { bi: 'Continue Mission (Lanjutkan Misi)', id: 'Lanjutkan Misi', en: 'Continue Mission' },
    badgesTitle: { bi: 'Badge yang Bisa Didapat', id: 'Badge yang Bisa Didapat', en: 'Badges to Collect' },
    btnChangeData: { bi: 'Ubah data Plastik Minggu 4: 21 → 30 kg', id: 'Ubah data Plastik Minggu 4: 21 → 30 kg', en: 'Change Week-4 Plastic data: 21 → 30 kg' },
    btnCheck: { bi: 'Periksa (Check)', id: 'Periksa', en: 'Check' },
    btnSaveNext: { bi: 'Simpan & Lanjut (Save & Next)', id: 'Simpan & Lanjut', en: 'Save & Next' },
    btnNext: { bi: 'Lanjut (Next)', id: 'Lanjut', en: 'Next' },
    btnUpdate: { bi: 'Ubah Data Sekarang', id: 'Ubah Data Sekarang', en: 'Change the Data Now' },
    btnFinish: { bi: 'Selesaikan Misi', id: 'Selesaikan Misi', en: 'Finish Mission' }
  };

  function applyLang(lang) {
    state.lang = lang;
    $$('[data-i18n]').forEach(function (el) {
      const key = el.getAttribute('data-i18n');
      const dict = I18N[key];
      if (!dict) return;
      el.textContent = dict[lang] || dict.bi;
    });
    saveState();
  }

  /* =========================================================
     8) TEMA & PALET
     ========================================================= */
  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    const btn = $('#btnTheme');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    saveState();
  }
  function applyPalette(p) {
    state.palette = p;
    document.body.setAttribute('data-palette', p);
    saveState();
    toast('Palet: ' + p);
  }

  /* =========================================================
     9) GLOSARIUM
     ========================================================= */
  const GLOSSARY = [
    ['Spreadsheet', 'Lembar kerja / lembar sebar', 'Berkas berisi tabel sel (baris dan kolom) untuk data dan hitungan.'],
    ['Cell', 'Sel', 'Satu kotak pada tabel, misalnya B2 (kolom B, baris 2).'],
    ['Formula', 'Rumus', 'Perintah hitung yang selalu diawali tanda sama dengan (=).'],
    ['Chart', 'Grafik / bagan', 'Gambar yang mengubah angka menjadi batang, garis, atau lingkaran.'],
    ['Link (linked)', 'Tautan (tertaut)', 'Hubungan antara grafik di Docs/Slides dan data asli di Sheets.'],
    ['Update', 'Perbarui', 'Menyegarkan grafik agar sama dengan data terbaru.'],
    ['Heading', 'Judul bagian', 'Gaya tulisan untuk judul dan subjudul agar dokumen terstruktur.'],
    ['Layout', 'Tata letak', 'Susunan judul, teks, dan gambar pada slide/halaman.'],
    ['Comment', 'Komentar', 'Catatan yang ditempel pada bagian tertentu untuk memberi masukan.'],
    ['Peer review', 'Penilaian sejawat', 'Teman menilai dan memberi saran untuk karya kita.'],
    ['Source', 'Sumber data', 'Asal data, misalnya "Data Bank Sampah SMPN 19 Bekasi, 2026".'],
    ['SUM', 'Jumlah', 'Fungsi untuk menjumlahkan.'],
    ['AVERAGE', 'Rata-rata', 'Fungsi untuk menghitung rata-rata.'],
    ['MAX', 'Nilai terbesar', 'Fungsi untuk mencari nilai tertinggi.']
  ];

  function renderGlossary(filter) {
    filter = filter || '';
    const tbody = $('#glossaryBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const f = filter.trim().toLowerCase();
    GLOSSARY.forEach(function (row) {
      const joined = row.join(' ').toLowerCase();
      if (f && joined.indexOf(f) === -1) return;
      const tr = document.createElement('tr');
      tr.innerHTML = '<td><strong>' + escapeHtml(row[0]) + '</strong></td>' +
                     '<td>' + escapeHtml(row[1]) + '</td>' +
                     '<td>' + escapeHtml(row[2]) + '</td>';
      tbody.appendChild(tr);
    });
  }

  /* =========================================================
     10) KUIS DIAGNOSTIK & SUMATIF (L1)
     ========================================================= */
  const DIAGNOSTIC = [
    { q: 'Aplikasi yang paling cocok untuk menulis laporan adalah ....',
      opts: [['Sheets', false], ['Docs', true], ['Slides', false]] },
    { q: 'Aplikasi yang paling cocok untuk menghitung total dan membuat grafik dari angka adalah ....',
      opts: [['Docs', false], ['Sheets', true], ['Slides', false]] },
    { q: 'Aplikasi yang paling cocok untuk menyampaikan ringkasan di depan kelas adalah ....',
      opts: [['Slides', true], ['Docs', false], ['Sheets', false]] },
    { q: 'Benar atau Salah: Jika angka di tabel diubah, grafik yang ditempel sebagai gambar di laporan ikut berubah otomatis.',
      opts: [['Benar (True)', false], ['Salah (False)', true]] }
  ];
  const SUMMATIVE = [
    { q: 'Rumus untuk menjumlahkan sel B2 sampai E2 adalah ....',
      opts: [['=B2+E2', false], ['=SUM(B2:E2)', true], ['=TOTAL(B2,E2)', false], ['B2:E2=SUM', false]] },
    { q: 'Cara terbaik memasukkan grafik ke Docs agar dapat diperbarui adalah ....',
      opts: [['Screenshot', false], ['Menggambar ulang', false], ['Insert → Chart → From Sheets + centang "Link to spreadsheet"', true], ['Mengetik angkanya lagi', false]] },
    { q: 'Setelah data di Sheets diubah dan grafik di Docs diperbarui, yang masih harus diperiksa manual adalah ....',
      opts: [['Warna grafik', false], ['Kalimat analisis yang berisi angka', true], ['Ukuran kertas', false], ['Nama pengguna', false]] },
    { q: 'Total sampah 200 kg dan plastik 50 kg. Persentase plastik adalah ....',
      opts: [['15%', false], ['20%', false], ['25%', true], ['50%', false]] },
    { q: 'Sikap berikut yang tidak sesuai etika saat membuat laporan data adalah ....',
      opts: [['Mencantumkan sumber data', false], ['Mengubah angka agar terlihat bagus', true], ['Meminta izin memakai data orang lain', false], ['Memeriksa ulang angka', false]] }
  ];

  function renderQuiz(container, list, prefix) {
    if (!container) { console.warn('[renderQuiz] container null for', prefix); return; }
    container.innerHTML = '';
    list.forEach(function (item, qi) {
      const block = document.createElement('div');
      block.className = 'quiz-q';
      const p = document.createElement('p');
      p.textContent = (qi + 1) + '. ' + item.q;
      block.appendChild(p);
      item.opts.forEach(function (opt, oi) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quiz-opt';
        btn.textContent = String.fromCharCode(97 + oi) + '. ' + opt[0];
        btn.addEventListener('click', function () {
          if (block.dataset.locked === '1') return;
          block.dataset.locked = '1';
          const btns = $$('.quiz-opt', block);
          btns.forEach(function (b, bi) {
            b.disabled = true;
            if (item.opts[bi][1]) b.classList.add('correct');
          });
          if (opt[1]) { sfx.correct(); toast('Benar! (Correct!)'); }
          else { btn.classList.add('wrong'); sfx.wrong(); toast('Belum tepat. (Not yet.)', 'warn'); }
        });
        block.appendChild(btn);
      });
      container.appendChild(block);
    });
  }

  /* =========================================================
     11) LAYAR 2 — KEGIATAN 0
     ========================================================= */
  const K0_REASONS_CORRECT = [
    'Data cukup diketik satu kali di Sheets (Data typed once)',
    'Grafik di Docs & Slides ikut berubah setelah Update (Chart updates automatically)',
    'Angka di ketiga berkas selalu sama (Consistent numbers everywhere)'
  ];
  const K0_REASONS_WRONG = [
    'Harus mengetik ulang data di semua berkas (Retype everywhere)',
    'Grafik tetap beku karena hanya screenshot (Frozen screenshot chart)'
  ];

  function initK0() {
    // Mini Quiz 1
    const quiz1 = $('#k0Quiz1');
    if (quiz1) {
      quiz1.innerHTML = '';
      const q1 = document.createElement('div');
      q1.className = 'quiz-q';
      q1.innerHTML = '<p>Cara mana yang lebih baik untuk laporan bank sampah? (Which way is better?)</p>';
      [['🔗 Cara Rara (Terintegrasi / Integrated)', true],
       ['📷 Cara Bagus (Terpisah / Separated)', false]].forEach(function (pair) {
        const txt = pair[0], correct = pair[1];
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'quiz-opt';
        b.textContent = txt;
        b.addEventListener('click', function () {
          if (q1.dataset.locked === '1') return;
          q1.dataset.locked = '1';
          $$('.quiz-opt', q1).forEach(function (x) { x.disabled = true; });
          if (correct) {
            b.classList.add('correct'); sfx.correct();
            if (!state.k0.quiz1) { state.k0.quiz1 = true; addScore(5); }
            toast('Tepat! Cara terintegrasi lebih aman.');
          } else {
            b.classList.add('wrong'); sfx.wrong();
            $$('.quiz-opt', q1).forEach(function (x) {
              if (x.textContent.indexOf('Rara') !== -1) x.classList.add('correct');
            });
            toast('Belum tepat. Cara Rara lebih baik.', 'warn');
          }
          saveState();
        });
        q1.appendChild(b);
      });
      quiz1.appendChild(q1);
    }

    // Reasons drag
    renderK0Reasons();
    initGenericDnD();
    $('#btnCheckReasons').addEventListener('click', checkK0Reasons);
    $('#btnSaveHypo').addEventListener('click', saveHypothesis);
    initK0Change();
  }

  function renderK0Reasons() {
    const box = $('#k0Reasons');
    if (!box) return;
    box.innerHTML = '';
    const all = K0_REASONS_CORRECT.map(function (t, i) { return { t: t, ok: true, id: 'r-c' + i }; })
      .concat(K0_REASONS_WRONG.map(function (t, i) { return { t: t, ok: false, id: 'r-w' + i }; }));
    all.sort(function () { return Math.random() - 0.5; });
    all.forEach(function (item) {
      const card = document.createElement('div');
      card.className = 'drag-card';
      card.draggable = true;
      card.tabIndex = 0;
      card.dataset.uid = item.id;
      card.dataset.pool = 'k0Reasons';
      card.dataset.ok = item.ok ? '1' : '0';
      card.textContent = item.t;
      box.appendChild(card);
    });
    const dz = $('#k0Dropzone');
    if (dz) dz.innerHTML = '<p class="dz-hint">⬇️ Letakkan 3 alasan di sini (Drop 3 reasons here)</p>';
  }

  let dndInitialized = false;
  function initGenericDnD() {
    if (dndInitialized) return;
    dndInitialized = true;

    document.addEventListener('dragstart', function (e) {
      const card = e.target.closest('.drag-card');
      if (!card) return;
      card.classList.add('dragging');
      try { e.dataTransfer.setData('text/plain', card.dataset.uid || ''); } catch (er) {}
      e.dataTransfer.effectAllowed = 'move';
    });
    document.addEventListener('dragend', function (e) {
      const card = e.target.closest('.drag-card');
      if (card) card.classList.remove('dragging');
      $$('.slot.hover, .dropzone.hover').forEach(function (x) { x.classList.remove('hover'); });
    });
    document.addEventListener('dragover', function (e) {
      const zone = e.target.closest('.slot, .dropzone');
      if (!zone) return;
      e.preventDefault();
      zone.classList.add('hover');
    });
    document.addEventListener('dragleave', function (e) {
      const zone = e.target.closest('.slot, .dropzone');
      if (zone) zone.classList.remove('hover');
    });
    document.addEventListener('drop', function (e) {
      const zone = e.target.closest('.slot, .dropzone');
      if (!zone) return;
      e.preventDefault();
      zone.classList.remove('hover');
      const uid = e.dataTransfer.getData('text/plain');
      const card = document.querySelector('.drag-card[data-uid="' + uid + '"]');
      if (card) moveCardToZone(card, zone);
    });
    document.addEventListener('click', function (e) {
      const card = e.target.closest('.drag-card');
      if (card && card.dataset.pool) {
        const already = card.classList.contains('selected');
        $$('.drag-card.selected').forEach(function (x) { x.classList.remove('selected'); });
        if (!already) { card.classList.add('selected'); sfx.click(); }
        return;
      }
      const zone = e.target.closest('.slot, .dropzone');
      if (zone) {
        const sel = document.querySelector('.drag-card.selected');
        if (sel) { moveCardToZone(sel, zone); sel.classList.remove('selected'); }
      }
    });
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('drag-card')) {
        e.preventDefault();
        const already = e.target.classList.contains('selected');
        $$('.drag-card.selected').forEach(function (x) { x.classList.remove('selected'); });
        if (!already) e.target.classList.add('selected');
      }
    });
  }

  function moveCardToZone(card, zone) {
    const zoneIsDropzone = zone.classList.contains('dropzone');
    if (zoneIsDropzone && zone.id === 'k0Dropzone') {
      const count = $$('.drag-card', zone).length;
      if (!card.parentElement.isSameNode(zone) && count >= 3) {
        toast('Maksimal 3 alasan.', 'warn');
        return;
      }
    }
    if (zone.classList.contains('slot')) {
      const existing = $$('.drag-card', zone);
      const backPool = card.dataset.pool;
      existing.forEach(function (x) {
        const pool = document.getElementById(x.dataset.pool || backPool);
        if (pool) pool.appendChild(x);
      });
    }
    zone.appendChild(card);
    const hint = zone.querySelector('.dz-hint');
    if (hint) hint.remove();
    sfx.click();
    saveState();
  }

  function checkK0Reasons() {
    const zone = $('#k0Dropzone');
    const cards = $$('.drag-card', zone);
    const fb = $('#k0ReasonFeedback');
    if (cards.length !== 3) {
      fb.className = 'feedback no';
      fb.textContent = 'Isi tepat 3 alasan. (Fill exactly 3 reasons.)';
      sfx.wrong();
      return;
    }
    const allOk = cards.every(function (c) { return c.dataset.ok === '1'; });
    if (allOk) {
      fb.className = 'feedback ok';
      fb.textContent = 'Benar! Ketiga alasan tepat.';
      if (!state.k0.reasonsDone) { state.k0.reasonsDone = true; addScore(5); }
      sfx.correct();
    } else {
      fb.className = 'feedback no';
      fb.textContent = 'Masih ada alasan yang kurang tepat.';
      sfx.wrong();
    }
    saveState();
  }

  function saveHypothesis() {
    const ta = $('#k0Hypo');
    const val = ta.value.trim();
    const err = $('#k0Error');
    if (val.length < 10) {
      err.hidden = false;
      err.textContent = 'Tulis minimal 10 karakter. (Write at least 10 characters.)';
      ta.classList.add('invalid');
      sfx.wrong();
      return;
    }
    ta.classList.remove('invalid');
    err.hidden = true;
    if (!state.hypothesis) addScore(10);
    state.hypothesis = val;
    saveState();
    sfx.correct();
    toast('Hipotesis tersimpan!');
    goTo(3);
  }

  function initK0Change() {
    const btn = $('#btnChangeData');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (state.k0.changeDone) { toast('Data sudah diubah.', 'warn'); return; }
      state.k0.changeDone = true;
      const note = $('#changeNote');
      if (note) {
        note.hidden = false;
        note.textContent = 'Plastik Minggu 4: 21 → 30 kg. Cara Rara (tertaut) ikut berubah; Cara Bagus (screenshot) tetap 21.';
      }
      const raraBars = $$('#raraChart .bar');
      const last = raraBars[3];
      if (last) {
        last.style.setProperty('--h', '95%');
        last.querySelector('span').textContent = '30';
      }
      const rs = $('#raraStatus'); if (rs) rs.textContent = '🔗 Updated!';
      const bs = $('#bagusStatus'); if (bs) bs.textContent = '📷 Still 21';
      sfx.correct();
      addScore(5);
      saveState();
    });
  }

  /* =========================================================
     12) LAYAR 3 — KEGIATAN 1 (Sheets)
     ========================================================= */
  const FORMULAS = {
    F2: { norm: '=SUM(B2:E2)', hint: 'Total tiap jenis = SUM dari kolom minggu.' },
    H2: { norm: '=F2*G2', hint: 'Nilai = Total × Harga per kg.' },
    B6: { norm: '=SUM(B2:B5)', hint: 'Total per minggu = SUM dari baris jenis.' },
    B8: { norm: '=AVERAGE(B6:E6)', hint: 'Rata-rata per minggu = AVERAGE dari total minggu.' },
    B9: { norm: '=MAX(F2:F5)', hint: 'Nilai terbesar = MAX dari kolom Total.' }
  };

  function normalizeFormula(s) {
    return String(s || '').toUpperCase().replace(/\s+/g, '').replace(/;/g, ',');
  }

  function checkCell(id, silent) {
    const inp = document.getElementById('cell' + id);
    if (!inp) return false;
    const val = normalizeFormula(inp.value);
    const expected = FORMULAS[id].norm;
    const ok = val === expected;
    if (!silent) {
      if (ok) {
        inp.classList.add('ok');
        inp.classList.remove('no');
        if (!state.k1.formulas[id]) {
          state.k1.formulas[id] = true;
          addScore(4);
          sfx.correct();
          markChecklistItem('k1Checklist', id);
          toast('Benar! ' + FORMULAS[id].hint);
        }
        renderK1ChartGame();
      } else {
        inp.classList.add('no');
        inp.classList.remove('ok');
        sfx.wrong();
        setTimeout(function () { inp.classList.remove('no'); }, 500);
      }
    }
    return ok;
  }

  function markChecklistItem(listId, key) {
    const li = document.querySelector('#' + listId + ' li[data-check="' + key + '"]');
    if (li) {
      li.classList.add('done');
      const box = li.querySelector('.box');
      if (box) box.textContent = '☑';
    }
  }

  function fillSheetOutputs() {
    const w = CONFIG.wasteData;
    const perWeek = [0, 1, 2, 3].map(function (c) {
      return w.reduce(function (s, row) { return s + row[c]; }, 0);
    });
    const setT = function (id, val) { const el = document.getElementById(id); if (el) el.textContent = val; };
    setT('outC6', perWeek[1]);
    setT('outD6', perWeek[2]);
    setT('outE6', perWeek[3]);
    setT('outF6', perWeek.reduce(function (a, b) { return a + b; }, 0));
  }

  function allFormulasCorrect() {
    return Object.keys(FORMULAS).every(function (k) { return state.k1.formulas[k] === true; });
  }

  function initK1() {
    Object.keys(FORMULAS).forEach(function (id) {
      const inp = document.getElementById('cell' + id);
      if (!inp) return;
      inp.addEventListener('blur', function () { checkCell(id); });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); checkCell(id); }
      });
    });
    fillSheetOutputs();
    renderK1ChartGame();
    const next = $('#btnK1Next');
    if (next) next.addEventListener('click', function () {
      if (!allFormulasCorrect()) {
        toast('Selesaikan kelima rumus dulu. (Finish all five formulas first.)', 'warn');
        return;
      }
      goTo(4);
    });
  }

  function renderK1ChartGame() {
    const box = $('#k1ChartGame');
    const promptEl = $('#k1ChartPrompt');
    if (!box || !promptEl) return;
    if (!allFormulasCorrect()) {
      box.hidden = true;
      promptEl.hidden = false;
      return;
    }
    if (state.k1.chartDone) return;
    promptEl.hidden = true;
    box.hidden = false;
    box.innerHTML = '';
    const q = document.createElement('div');
    q.className = 'quiz-q';
    q.innerHTML = '<p>Untuk membandingkan <strong>total sampah tiap minggu</strong> (Minggu 1–4), jenis grafik mana yang paling tepat?</p>';
    const opts = [
      ['Column/Bar chart (Grafik batang) — membandingkan kategori dengan jelas', true],
      ['Pie chart (Grafik lingkaran) — untuk melihat bagian dari keseluruhan', false],
      ['Line chart (Grafik garis) — untuk tren naik/turun antar waktu', false],
      ['Scatter plot (Diagram sebar) — untuk hubungan dua variabel', false]
    ];
    opts.forEach(function (pair) {
      const txt = pair[0], ok = pair[1];
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'quiz-opt';
      b.textContent = txt;
      b.addEventListener('click', function () {
        if (q.dataset.locked === '1') return;
        q.dataset.locked = '1';
        $$('.quiz-opt', q).forEach(function (x) { x.disabled = true; });
        $$('.quiz-opt', q).forEach(function (x, xi) { if (opts[xi][1]) x.classList.add('correct'); });
        if (ok) {
          sfx.correct();
          toast('Tepat! Grafik batang memudahkan perbandingan mingguan.');
          if (!state.k1.chartDone) {
            state.k1.chartDone = true;
            addScore(10);
            awardBadge('data-master');
            awardBadge('chart-champion');
          }
        } else {
          b.classList.add('wrong');
          sfx.wrong();
          toast('Kurang tepat. Grafik batang paling jelas.', 'warn');
        }
        saveState();
      });
      q.appendChild(b);
    });
    box.appendChild(q);
  }

  /* =========================================================
     13) LAYAR 4 — KEGIATAN 2 (Docs)
     ========================================================= */
  function initK2() {
    const btn = $('#btnCheckK2');
    if (btn) btn.addEventListener('click', checkK2);
    const next = $('#btnK2Next');
    if (next) next.addEventListener('click', function () {
      if (!state.k2.done) { toast('Periksa dulu jawabanmu.', 'warn'); return; }
      goTo(5);
    });
  }

  function checkK2() {
    const fb = $('#k2Feedback');
    let ok = true;
    let orderOk = true;
    $$('#k2Slots .slot').forEach(function (slot) {
      const n = parseInt(slot.dataset.slot, 10);
      const card = slot.querySelector('.drag-card');
      if (!card || parseInt(card.dataset.order, 10) !== n) orderOk = false;
    });
    if (!orderOk) ok = false;

    const chartSlot = $('#k2ChartSlot .slot');
    const chartCard = chartSlot ? chartSlot.querySelector('.drag-card') : null;
    const linkOk = chartCard && chartCard.dataset.chart === 'linked';
    if (!linkOk) ok = false;

    const a = $('#k2a').value, b = $('#k2b').value, c = $('#k2c').value;
    const analysisOk = a === 'kertas' && b === '47,1' && c === '499000';
    if (!analysisOk) ok = false;

    if (ok) {
      fb.className = 'feedback ok';
      fb.textContent = 'Sempurna! Urutan benar, grafik tertaut dipilih, dan analisis tepat.';
      if (!state.k2.done) {
        state.k2.done = true;
        addScore(25);
        markChecklistItem('k2Checklist', 'order');
        markChecklistItem('k2Checklist', 'link');
        markChecklistItem('k2Checklist', 'analysis');
        awardBadge('link-legend');
      }
      sfx.correct();
    } else {
      fb.className = 'feedback no';
      const msg = [];
      if (!orderOk) msg.push('urutan bagian');
      if (!linkOk) msg.push('pilihan grafik tertaut');
      if (!analysisOk) msg.push('angka analisis');
      fb.textContent = 'Belum tepat pada: ' + msg.join(', ') + '.';
      sfx.wrong();
    }
    saveState();
  }

  /* =========================================================
     14) LAYAR 5 — KEGIATAN 3 (Slides)
     ========================================================= */
  function initK3() {
    const slider = $('#k3Font');
    const preview = $('#k3FontPreview');
    if (slider && preview) {
      slider.value = state.k3.font;
      preview.textContent = state.k3.font + ' pt';
      slider.addEventListener('input', function () {
        state.k3.font = parseInt(slider.value, 10);
        preview.textContent = state.k3.font + ' pt';
        saveState();
      });
    }

    const box = $('#k3Readability');
    if (box) {
      box.innerHTML = '';
      const q = document.createElement('div');
      q.className = 'quiz-q';
      q.innerHTML = '<p>Pilih kombinasi teks dan latar yang paling mudah dibaca dari jauh.</p>';
      const combos = [
        { fg: '#1A1A1A', bg: '#FFFFFF', label: 'Hitam di putih (Black on white)', ok: true },
        { fg: '#FFEB3B', bg: '#FFFFFF', label: 'Kuning di putih (Yellow on white)', ok: false },
        { fg: '#FFFFFF', bg: '#F9A825', label: 'Putih di kuning (White on yellow)', ok: false },
        { fg: '#BDBDBD', bg: '#E3F2FD', label: 'Abu muda di biru muda (Light gray on light blue)', ok: false }
      ];
      combos.forEach(function (c) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'swatch-btn';
        btn.innerHTML = '<span class="swatch" style="background:' + c.bg + ';color:' + c.fg + '">Aa Bb</span>' +
                        '<span>' + c.label + '</span>';
        btn.addEventListener('click', function () {
          if (q.dataset.locked === '1') return;
          q.dataset.locked = '1';
          $$('.swatch-btn', q).forEach(function (x, xi) { if (combos[xi].ok) x.classList.add('correct'); });
          if (c.ok) {
            sfx.correct();
            toast('Benar! Kontras tinggi paling mudah dibaca.');
            if (!state.k3.readabilityDone) { state.k3.readabilityDone = true; addScore(6); }
          } else {
            btn.classList.add('wrong');
            sfx.wrong();
            toast('Kurang kontras. Pilih hitam di putih.', 'warn');
          }
          saveState();
        });
        q.appendChild(btn);
      });
      box.appendChild(q);
    }

    const btnC = $('#btnCheckK3');
    if (btnC) btnC.addEventListener('click', checkK3);
    const btnN = $('#btnK3Next');
    if (btnN) btnN.addEventListener('click', function () {
      if (!state.k3.done) { toast('Periksa dulu slide-mu.', 'warn'); return; }
      goTo(6);
    });
  }

  function checkK3() {
    const fb = $('#k3Feedback');
    let ok = true;
    const problems = [];

    ['k3s1bullets', 'k3s2bullets', 'k3s3bullets'].forEach(function (id) {
      const ta = document.getElementById(id);
      if (!ta) return;
      const lines = ta.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      if (lines.length > 3) { ok = false; problems.push(id + ': lebih dari 3 poin'); }
    });
    if (state.k3.font < 24) { ok = false; problems.push('ukuran huruf < 24pt'); }
    ['k3s1title', 'k3s2title', 'k3s3title'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el && !el.value.trim()) { ok = false; problems.push(id + ' kosong'); }
    });
    if (!state.k3.readabilityDone) { ok = false; problems.push('mini-game keterbacaan belum selesai'); }

    if (ok) {
      fb.className = 'feedback ok';
      fb.textContent = 'Slide-mu rapi, ringkas, dan mudah dibaca!';
      if (!state.k3.done) { state.k3.done = true; addScore(14); }
      sfx.correct();
    } else {
      fb.className = 'feedback no';
      fb.textContent = 'Perbaiki: ' + problems.join('; ') + '.';
      sfx.wrong();
    }
    saveState();
  }

  /* =========================================================
     15) LAYAR 6 — KEGIATAN 4 (Uji Ubah Data)
     ========================================================= */
  const K4_OBJECTS = [
    { id: 'total-sheets', label: 'Total Sheets (Plastik, Minggu 4, total seluruh)', correct: 'auto' },
    { id: 'chart-docs',   label: 'Grafik di Docs (grafik tertaut)',                  correct: 'update' },
    { id: 'chart-slides', label: 'Grafik di Slides (grafik tertaut)',                correct: 'update' },
    { id: 'analysis',     label: 'Kalimat analisis (angka diketik manual)',          correct: 'manual' }
  ];
  const K4_CHOICES = [
    ['auto',   'Berubah otomatis (Changes automatically)'],
    ['update', 'Perlu Update (Needs Update)'],
    ['manual', 'Perlu perbaikan manual (Needs manual fix)']
  ];

  function initK4() {
    const wrap = $('#k4Questions');
    if (wrap) {
      wrap.innerHTML = '';
      K4_OBJECTS.forEach(function (obj) {
        const block = document.createElement('div');
        block.className = 'quiz-q';
        block.dataset.obj = obj.id;
        const p = document.createElement('p');
        p.textContent = obj.label;
        block.appendChild(p);
        K4_CHOICES.forEach(function (pair) {
          const val = pair[0], txt = pair[1];
          const label = document.createElement('label');
          label.className = 'radio-line';
          const inp = document.createElement('input');
          inp.type = 'radio';
          inp.name = 'k4-' + obj.id;
          inp.value = val;
          inp.addEventListener('change', function () {
            state.k4.answers[obj.id] = val;
            saveState();
          });
          label.appendChild(inp);
          const span = document.createElement('span');
          span.textContent = txt;
          label.appendChild(span);
          block.appendChild(label);
        });
        wrap.appendChild(block);
      });
    }

    const btnU = $('#btnUpdateData');
    if (btnU) btnU.addEventListener('click', doUpdateTest);
    const btnC = $('#btnCheckK4');
    if (btnC) btnC.addEventListener('click', checkK4);
    const btnN = $('#btnK4Next');
    if (btnN) btnN.addEventListener('click', function () {
      if (!state.k4.reasonDone) { toast('Periksa dulu jawabanmu.', 'warn'); return; }
      goTo(7);
    });
  }

  function doUpdateTest() {
    if (state.k4.updated) { toast('Data sudah diubah.', 'warn'); return; }
    state.k4.updated = true;
    const w = CONFIG.wasteData.map(function (r) { return r.slice(); });
    w[0][3] = 30;
    const plastik = w[0].reduce(function (a, b) { return a + b; }, 0);
    const m4 = [0, 1, 2, 3].reduce(function (s, r) { return s + w[r][3]; }, 0);
    const total = [0, 1, 2, 3].reduce(function (s, r) {
      return s + w[r].reduce(function (a, b) { return a + b; }, 0);
    }, 0);
    const avg = total / 4;
    const nilaiPlastik = plastik * CONFIG.prices[0];
    const totalNilaiBaru = 499000 - (21 * CONFIG.prices[0]) + (30 * CONFIG.prices[0]);
    const naik = ((m4 - 40) / 40 * 100);
    const pctP = (plastik / total * 100);
    const kertasTotal = w[1].reduce(function (a, b) { return a + b; }, 0);
    const pctK = (kertasTotal / total * 100);

    const set = function (id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; };
    set('a-plastik', plastik + ' kg');
    set('a-m4', m4 + ' kg');
    set('a-total', total + ' kg');
    set('a-avg', avg.toFixed(2).replace('.', ',') + ' kg');
    set('a-nilai', 'Rp ' + nilaiPlastik.toLocaleString('id-ID'));
    set('a-totalnilai', 'Rp ' + totalNilaiBaru.toLocaleString('id-ID'));
    set('a-naik', naik.toFixed(0) + '%');
    set('a-pctp', pctP.toFixed(1).replace('.', ',') + '%');
    set('a-pctk', pctK.toFixed(0) + '%');

    sfx.correct();
    toast('Data diubah! Amati apa yang berubah.');
    saveState();
  }

  function checkK4() {
    const fb = $('#k4Feedback');
    let correctCount = 0;
    K4_OBJECTS.forEach(function (obj) {
      if (state.k4.answers[obj.id] === obj.correct) correctCount++;
    });
    const reasonEl = $('#k4Reason');
    const reason = reasonEl ? reasonEl.value.trim() : '';
    const reasonOk = reason.length >= 20;

    if (correctCount === 4 && reasonOk && state.k4.updated) {
      fb.className = 'feedback ok';
      fb.textContent = 'Luar biasa! Semua objek terjawab benar, dan alasanmu berbasis bukti.';
      if (!state.k4.reasonDone) {
        state.k4.reasonDone = true;
        addScore(30);
        awardBadge('critical-thinker');
      }
      sfx.correct();
    } else {
      fb.className = 'feedback no';
      const issues = [];
      if (!state.k4.updated) issues.push('tekan tombol Ubah Data dulu');
      if (correctCount !== 4) issues.push('jawaban benar ' + correctCount + '/4');
      if (!reasonOk) issues.push('alasan minimal 20 karakter');
      fb.textContent = 'Perbaiki: ' + issues.join('; ') + '.';
      sfx.wrong();
    }
    saveState();
  }

  /* =========================================================
     16) LAYAR 7 — KEGIATAN 5 & HASIL AKHIR
     ========================================================= */
  function initK5() {
    $$('#k5Feeling .feel-btn, #feelingScale .feel-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('#k5Feeling .feel-btn, #feelingScale .feel-btn').forEach(function (b) {
          b.setAttribute('aria-checked', 'false');
          b.classList.remove('selected');
        });
        btn.setAttribute('aria-checked', 'true');
        btn.classList.add('selected');
        state.k5.feel = parseInt(btn.dataset.feel, 10);
        saveState();
        sfx.click();
      });
    });

    const btnF = $('#btnFinish');
    if (btnF) btnF.addEventListener('click', finishMission);
    const btnP = $('#btnPrint');
    if (btnP) btnP.addEventListener('click', function () { window.print(); });
    const btnR = $('#btnRestart');
    if (btnR) btnR.addEventListener('click', function () {
      askConfirm('Mulai ulang misi? Progres saat ini akan direset.', resetState);
    });
  }

  function finishMission() {
    const err = $('#k5Error');
    const praise = $('#k5Praise').value.trim();
    const suggestion = $('#k5Suggestion').value.trim();
    const conclusion = $('#k5Conclusion').value.trim();
    const hypothesisInput = $('#k5Hypothesis');
    if (hypothesisInput && hypothesisInput.value.trim()) {
      state.hypothesis = hypothesisInput.value.trim();
    }
    const ex = [
      $('#k5Exit1').value.trim(),
      $('#k5Exit2').value.trim(),
      $('#k5Exit3').value.trim()
    ];
    const feelOk = state.k5.feel !== null;

    const problems = [];
    if (praise.length < 10) problems.push('pujian min. 10 karakter');
    if (suggestion.length < 10) problems.push('saran min. 10 karakter');
    if (conclusion.length < 20) problems.push('kesimpulan min. 20 karakter');
    if (ex.some(function (x) { return x.length < 5; })) problems.push('ketiga kalimat exit ticket wajib diisi');
    if (!feelOk) problems.push('pilih skala perasaan');

    if (problems.length) {
      err.hidden = false;
      err.textContent = 'Lengkapi: ' + problems.join('; ') + '.';
      sfx.wrong();
      return;
    }
    err.hidden = true;

    state.k5.praise = praise;
    state.k5.suggestion = suggestion;
    state.k5.conclusion = conclusion;
    state.k5.exit = ex;
    state.k5.done = true;

    if (!state.k5._scored) {
      state.k5._scored = true;
      addScore(15);
      awardBadge('team-player');
    }

    const disp = $('#k5HypoDisplay');
    if (disp) disp.textContent = state.hypothesis || '— (belum diisi di Kegiatan 0)';

    const fb = $('#k5Validation');
    if (fb) {
      fb.className = 'feedback ok';
      fb.textContent = 'Bagus! Bandingkan: apakah kesimpulanmu mendukung atau mengoreksi hipotesis awalmu?';
    }

    state.history.unshift({
      date: new Date().toLocaleString('id-ID'),
      name: state.name || 'Anonim',
      kelas: state.kelas,
      score: state.score,
      badges: state.badges.length
    });
    if (state.history.length > CONFIG.maxHistory) state.history.length = CONFIG.maxHistory;

    renderResult();
    saveState();
    sfx.finish();
    confetti(150);

    const rp = $('#resultPanel');
    if (rp) {
      rp.hidden = false;
      setTimeout(function () { rp.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 300);
    }
  }

  function renderResult() {
    const setName = function (id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; };
    setName('resultName', (state.name || 'Anonim') + ' · Kelas ' + state.kelas);
    setName('resultScore', state.score);
    const grade = state.score >= 135 ? 'A — Luar biasa! (Excellent!)'
                : state.score >= 110 ? 'B — Bagus! (Good!)'
                : state.score >= 80  ? 'C — Cukup (Fair)'
                : 'D — Perlu latihan lagi (Keep practicing)';
    setName('resultGrade', grade);

    const rb = $('#resultBadges');
    if (rb) {
      rb.innerHTML = '';
      CONFIG.badges.forEach(function (b) {
        const li = document.createElement('li');
        if (state.badges.indexOf(b.id) === -1) li.classList.add('locked');
        li.innerHTML = '<span class="badge-icon">' + b.icon + '</span>' +
                       '<span><strong>' + escapeHtml(b.name) + '</strong><br>' +
                       '<span class="small">' + escapeHtml(b.desc) + '</span></span>';
        rb.appendChild(li);
      });
    }

    const sum = $('#resultSummary');
    if (sum) {
      sum.innerHTML = '';
      const items = [
        'Hipotesis awal: ' + (state.hypothesis || '—'),
        'Kesimpulan akhir: ' + (state.k5.conclusion || '—'),
        'Hal baru dipelajari: ' + (state.k5.exit[0] || '—'),
        'Masih membingungkan: ' + (state.k5.exit[1] || '—'),
        'Rencana di kehidupan nyata: ' + (state.k5.exit[2] || '—'),
        'Perasaan: ' + (state.k5.feel ? state.k5.feel + '/5' : '—')
      ];
      items.forEach(function (t) {
        const li = document.createElement('li');
        li.textContent = t;
        sum.appendChild(li);
      });
    }

    const hist = $('#resultHistory');
    if (hist) {
      hist.innerHTML = '';
      state.history.forEach(function (h) {
        const li = document.createElement('li');
        li.innerHTML = '<strong>' + escapeHtml(h.name) + '</strong> (' + escapeHtml(h.kelas) + ') — ' +
                       h.score + '/150, badge: ' + h.badges + ' · ' + escapeHtml(h.date);
        hist.appendChild(li);
      });
    }

    drawShareCard();
  }

  function drawShareCard() {
    const c = $('#shareCanvas');
    if (!c || !c.getContext) return;
    const ctx = c.getContext('2d');
    const W = c.width, H = c.height;

    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#2E7D32');
    grad.addColorStop(1, '#1565C0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    roundRect(ctx, 20, 20, W - 40, H - 40, 16);
    ctx.fill();

    ctx.fillStyle = '#2E7D32';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('Misi Bank Sampah Digital', 40, 65);

    ctx.fillStyle = '#1565C0';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('LKPD Informatika Kelas 9 · Docs/Sheets/Slides Terintegrasi', 40, 88);

    ctx.fillStyle = '#1A1A1A';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText((state.name || 'Anonim') + ' · ' + state.kelas, 40, 125);

    ctx.fillStyle = '#2E7D32';
    ctx.font = 'bold 46px system-ui, sans-serif';
    ctx.fillText(state.score + '/150', 40, 185);

    ctx.fillStyle = '#5A6270';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('Badge: ' + state.badges.length + '/' + CONFIG.badges.length, 40, 215);
    ctx.fillText('Tanggal: ' + new Date().toLocaleDateString('id-ID'), 40, 238);

    ctx.font = '32px system-ui, sans-serif';
    let x = 40;
    CONFIG.badges.forEach(function (b) {
      if (state.badges.indexOf(b.id) !== -1) {
        ctx.fillText(b.icon, x, 290);
        x += 46;
      }
    });

    ctx.fillStyle = '#F9A825';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('SMP Negeri 19 Kota Bekasi · 2026', 40, H - 40);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* =========================================================
     17) LAYAR 1 — START & MULAI
     ========================================================= */
  function initStart() {
    renderBadgePreview();
    renderQuiz($('#diagnosticBox'), DIAGNOSTIC, 'diag');
    renderQuiz($('#summativeBox'), SUMMATIVE, 'sum');

    const btnS = $('#btnStart');
    if (btnS) btnS.addEventListener('click', startGame);
    const btnC = $('#btnContinue');
    if (btnC) btnC.addEventListener('click', continueGame);

    if (loadState() && state.name) {
      const btnCont = $('#btnContinue');
      if (btnCont) btnCont.hidden = false;
    }
  }

  function startGame() {
    const name = $('#playerName').value.trim();
    const kelas = $('#playerClass').value;
    const roleInput = document.querySelector('input[name="role"]:checked');
    const role = roleInput ? roleInput.value : 'pilot';
    const err = $('#startError');
    if (name.length < 2) {
      err.hidden = false;
      err.textContent = 'Tulis namamu minimal 2 karakter.';
      $('#playerName').classList.add('invalid');
      sfx.wrong();
      return;
    }
    $('#playerName').classList.remove('invalid');
    err.hidden = true;

    state.name = name;
    state.kelas = kelas;
    state.role = role;
    state.score = 0;
    state.badges = [];
    state.screen = 1;
    saveState();
    renderBadgeStrip();
    animateScore(0);
    sfx.correct();
    toast('Selamat datang, ' + name + '!');
    goTo(2);
  }

  function continueGame() {
    $('#playerName').value = state.name || '';
    $('#playerClass').value = state.kelas || '91';
    goTo(state.screen || 2);
    renderBadgeStrip();
    animateScore(state.score);
    toast('Lanjutkan misi!');
  }

  /* =========================================================
     18) HEADER TOOLS
     ========================================================= */
  function initHeaderTools() {
    const ls = $('#langSelect');
    if (ls) {
      ls.value = state.lang;
      ls.addEventListener('change', function (e) { applyLang(e.target.value); });
    }

    const btnTheme = $('#btnTheme');
    if (btnTheme) btnTheme.addEventListener('click', function () {
      applyTheme(state.theme === 'dark' ? 'light' : 'dark');
      sfx.click();
    });
    const btnSound = $('#btnSound');
    if (btnSound) btnSound.addEventListener('click', function () {
      state.sound = !state.sound;
      btnSound.textContent = state.sound ? '🔊' : '🔇';
      saveState();
      if (state.sound) sfx.click();
    });
    const btnFocus = $('#btnFocus');
    if (btnFocus) btnFocus.addEventListener('click', function () {
      document.body.classList.toggle('focus-mode');
      sfx.click();
    });
    const btnPal = $('#btnPalette');
    if (btnPal) btnPal.addEventListener('click', function () {
      const seq = ['green', 'blue', 'purple'];
      const cur = seq.indexOf(state.palette || 'green');
      applyPalette(seq[(cur + 1) % seq.length]);
    });
    const btnG = $('#btnGlossary');
    if (btnG) btnG.addEventListener('click', function () {
      renderGlossary('');
      const s = $('#glossarySearch'); if (s) s.value = '';
      openModal('modalGlossary');
      sfx.click();
    });
    const btnR = $('#btnRules');
    if (btnR) btnR.addEventListener('click', function () { openModal('modalRules'); sfx.click(); });
    const btnReset = $('#btnReset');
    if (btnReset) btnReset.addEventListener('click', function () {
      askConfirm('Reset seluruh progres misi?', resetState);
    });

    const search = $('#glossarySearch');
    if (search) search.addEventListener('input', function (e) { renderGlossary(e.target.value); });

    $$('[data-close]').forEach(function (btn) {
      btn.addEventListener('click', function () { closeModal(btn.dataset.close); });
    });
    $$('.modal-overlay').forEach(function (ov) {
      ov.addEventListener('click', function (e) { if (e.target === ov) ov.hidden = true; });
    });
    const yes = $('#confirmYes');
    if (yes) yes.addEventListener('click', function () {
      closeModal('modalConfirm');
      if (typeof confirmCallback === 'function') confirmCallback();
      confirmCallback = null;
    });
  }

  /* =========================================================
     19) INIT SEMUA — dipanggil saat DOM siap
     ========================================================= */
  function initAll() {
    loadState();
    applyTheme(state.theme);
    applyLang(state.lang);
    initHeaderTools();
    initStart();
    initK0();
    initK1();
    initK2();
    initK3();
    initK4();
    initK5();
    updateProgress();
    renderBadgeStrip();
    animateScore(state.score);

    // Panduan guru jika ?guru=1
    if (window.location.search.indexOf('guru=1') !== -1) {
      const tg = $('#teacherGuide');
      if (tg) tg.hidden = false;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

})();
