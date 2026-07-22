// =========================================================
// Mark-Up — Data program & paket
// Satu sumber data dipakai bersama oleh halaman katalog,
// detail program, dan form pendaftaran.
// =========================================================

const FEATURE_ROWS = [
  { key: "kelas_reguler", label_template: "Fasilitas Kelas Reguler selama {sesi} Pertemuan via Zoom Meeting" },
  { key: "pdf_materi", label: "Mendapatkan file PDF materi kelas dari pertemuan pertama sampai terakhir" },
  { key: "template", label: "Mendapatkan file template keuangan, paper, dan pitch deck" },
  { key: "referensi", label: "Mendapatkan file referensi paper, pitch deck, BMC/executive summary, dan contoh script presentasi yang standout" },
  { key: "bonus_1on1", label: "Bonus 1-on-1 mentoring secara private dengan mentor kelas" },
  { key: "teori_private", label: "Kelas penjelasan teori secara private dengan mentor dan team" },
  { key: "bimbingan_lomba", label: "Bimbingan private mentoring untuk pendaftaran lomba mulai dari tahap awal hingga akhir" },
  { key: "review_final", label: "Review final proposal, pitch deck, dan latihan mockup presentasi secara private bersama mentor" },
  { key: "only_feedback", label: "Hanya mentoring feedback paper, pitch deck, atau brainstorming ide solusi dengan mentor secara private" },
];

// Pola centang/silang tiap fitur di 4 tier — konsisten untuk semua program
// (struktur paket Mark-Up), harga & jumlah sesi berbeda per program.
const TIER_PATTERN = {
  kelas_reguler: [true, true, true, false],
  pdf_materi: [true, true, true, false],
  template: [true, true, true, false],
  referensi: [true, true, true, false],
  bonus_1on1: [false, true, true, false],
  teori_private: [false, false, true, false],
  bimbingan_lomba: [false, false, true, false],
  review_final: [false, false, true, false],
  only_feedback: [false, false, false, true],
};

const TIER_NAMES = ["Basic", "Premium", "Private", "Only Mentoring"];

const PROGRAMS = {
  "bpc-kickstart": {
    title: "BPC Kickstart",
    tag: "BPC",
    tagline: "Fondasi menyusun business plan dari nol untuk pemula.",
    desc: "Program ini dirancang untuk peserta yang baru pertama kali mengikuti Business Plan Competition. Kamu akan dibimbing menyusun ideation, business model canvas, hingga draft executive summary yang siap dikembangkan lebih lanjut.",
    mentor: "Kak Nadia — Finalis BPC Nasional 2024",
    sesi: 5,
    prices: [350000, 550000, 950000, 200000],
  },
  "bpc-levelup": {
    title: "BPC Level-Up",
    tag: "BPC",
    tagline: "Lanjutan Kickstart untuk peserta yang sudah lolos ke babak lanjut.",
    desc: "Fokus memperdalam financial projection, go-to-market strategy, serta simulasi tanya-jawab juri untuk peserta yang sudah lolos ke babak semifinal ke atas.",
    mentor: "Kak Rafi — Juara BPC Internasional 2023",
    sesi: 5,
    prices: [450000, 700000, 1100000, 250000],
  },
  "essential-sprint": {
    title: "Essential Sprint",
    tag: "BCC",
    tagline: "Latihan intensif membaca dan menganalisis studi kasus.",
    desc: "Latihan terarah membedah studi kasus dalam waktu terbatas menggunakan framework analisis yang siap pakai, fokus pada satu babak kompetisi.",
    mentor: "Kak Bela — Mentor BCC bersertifikat",
    sesi: 3,
    prices: [300000, 500000, 850000, 180000],
  },
  "full-throttle-coaching": {
    title: "Full-Throttle Coaching",
    tag: "BCC",
    tagline: "Pendampingan penuh dari penyisihan sampai final.",
    desc: "Pendampingan menyeluruh mulai dari babak penyisihan sampai final: analisis kasus, penyusunan deck, hingga simulasi presentasi langsung di depan mentor.",
    mentor: "Kak Dimas — Mentor & Juri Tamu BCC",
    sesi: 8,
    prices: [600000, 900000, 1500000, 350000],
  },
  "bundling-powerpack": {
    title: "Bundling PowerPack",
    tag: "Bundling",
    tagline: "Gabungan coaching BCC & BPC dalam satu paket hemat.",
    desc: "Untuk peserta yang mengikuti BCC dan BPC dalam satu musim kompetisi sekaligus — lebih hemat dibanding membeli dua program terpisah.",
    mentor: "Tim Mentor Mark-Up",
    sesi: 10,
    prices: [900000, 1300000, 2000000, 450000],
  },
  "kelas-reguler-baru": {
    title: "Kelas Reguler Baru",
    tag: "Kelas Reguler",
    tagline: "Kelas mingguan berkelompok untuk yang baru memulai.",
    desc: "Kelas berkelompok untuk siswa dan mahasiswa yang baru mengenal dunia BCC/BPC, membahas dasar-dasar hingga siap mengikuti kompetisi pertama.",
    mentor: "Tim Mentor Mark-Up",
    sesi: 5,
    prices: [250000, 400000, 700000, 150000],
  },
};

function formatRupiah(value) {
  return "Rp " + value.toLocaleString("id-ID");
}

function buildTierData(slug) {
  const program = PROGRAMS[slug];
  if (!program) return null;
  return TIER_NAMES.map((name, i) => ({
    name,
    price: program.prices[i],
    priceLabel: formatRupiah(program.prices[i]),
  }));
}