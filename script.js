// =========================================================
// Mark-Up — Prototype logic (no API keys, no real services)
// All "automation" below runs locally in the browser via
// localStorage, standing in for the server-side logic
// described in the brief (Bagian 7: trigger dijalankan
// langsung di dalam aplikasi).
// =========================================================

const STORE_KEY = "markup_prototype_pendaftaran";
const PRICE_MAP = {
  "BPC Kickstart": "Rp 350rb",
  "BPC Level-Up": "Rp 550rb",
  "Essential Sprint": "Rp 300rb",
  "Full-Throttle Coaching": "Rp 900rb",
  "Bundling PowerPack": "Rp 1.4jt",
  "Kelas Reguler Baru": "Rp 250rb",
};

function loadRegistrations() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveRegistrations(list) {
  localStorage.setItem(STORE_KEY, JSON.stringify(list));
}

function getActiveRegistration() {
  const list = loadRegistrations();
  return list.length ? list[list.length - 1] : null;
}

// ---------- Program detail links (prototype: scroll to daftar, prefill) ----------
document.querySelectorAll(".program-detail-link").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const program = link.getAttribute("data-program");
    const paketSelect = document.getElementById("paket");
    if (paketSelect) paketSelect.value = program;
    document.getElementById("daftar").scrollIntoView({ behavior: "smooth" });
  });
});

// ---------- Filter chips (katalog program) ----------
const chips = document.querySelectorAll(".chip");
chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    chips.forEach((c) => c.classList.remove("chip-active"));
    chip.classList.add("chip-active");
    const filter = chip.getAttribute("data-filter");
    document.querySelectorAll(".program-card").forEach((card) => {
      const tags = card.getAttribute("data-tags") || "";
      card.style.display = filter === "all" || tags.includes(filter) ? "" : "none";
    });
  });
});

// ---------- Form pendaftaran ----------
const formDaftar = document.getElementById("form-daftar");
if (formDaftar) {
  formDaftar.addEventListener("submit", (e) => {
    e.preventDefault();
    const list = loadRegistrations();
    const paket = document.getElementById("paket").value;
    const entry = {
      id: Date.now(),
      nama: document.getElementById("nama").value.trim(),
      kontak: document.getElementById("kontak").value.trim(),
      email: document.getElementById("email").value.trim(),
      asal: document.getElementById("asal").value.trim(),
      paket: paket,
      referral: document.getElementById("referral").value.trim(),
      buktiUploaded: false,
      status: "pending", // pending | confirmed | rejected
    };
    list.push(entry);
    saveRegistrations(list);

    document.getElementById("daftar-note").textContent =
      "Pendaftaran tersimpan. Lanjutkan ke bagian Pembayaran di bawah.";
    document.getElementById("payment-amount-value").textContent =
      PRICE_MAP[paket] || "—";

    renderAdminTable();
    renderRiwayat();
    document.getElementById("pembayaran").scrollIntoView({ behavior: "smooth" });
  });
}

// ---------- Upload bukti transfer ----------
const btnUploadBukti = document.getElementById("btn-upload-bukti");
if (btnUploadBukti) {
  btnUploadBukti.addEventListener("click", () => {
    const list = loadRegistrations();
    if (!list.length) {
      alert("Isi form pendaftaran dahulu sebelum upload bukti transfer.");
      return;
    }
    const last = list[list.length - 1];
    last.buktiUploaded = true;
    saveRegistrations(list);

    const statusBox = document.getElementById("status-pembayaran");
    statusBox.className = "status-box status-pending";
    statusBox.innerHTML =
      '<span class="status-dot"></span><span>Status: bukti terkirim, menunggu konfirmasi admin</span>';

    renderAdminTable();
  });
}

// ---------- Admin dashboard ----------
function renderAdminTable() {
  const tbody = document.getElementById("admin-table-body");
  if (!tbody) return;
  const list = loadRegistrations();

  if (!list.length) {
    tbody.innerHTML =
      '<tr class="admin-empty-row"><td colspan="7" class="muted">Belum ada pendaftaran masuk.</td></tr>';
    return;
  }

  tbody.innerHTML = list
    .map((entry) => {
      const badgeClass =
        entry.status === "confirmed"
          ? "badge-confirmed"
          : entry.status === "rejected"
          ? "badge-rejected"
          : "badge-pending";
      const badgeText =
        entry.status === "confirmed"
          ? "Confirmed"
          : entry.status === "rejected"
          ? "Ditolak"
          : "Pending";
      const buktiText = entry.buktiUploaded ? "Sudah upload" : "Belum upload";
      const disabled = entry.status !== "pending" ? "disabled" : "";

      return `
        <tr>
          <td>${escapeHtml(entry.nama || "-")}</td>
          <td>${escapeHtml(entry.paket || "-")}</td>
          <td>${escapeHtml(entry.kontak || "-")}</td>
          <td>${escapeHtml(entry.referral || "-")}</td>
          <td>${buktiText}</td>
          <td><span class="badge ${badgeClass}">${badgeText}</span></td>
          <td class="admin-actions">
            <button class="btn-confirm" data-id="${entry.id}" ${disabled}>Confirm</button>
            <button class="btn-reject" data-id="${entry.id}" ${disabled}>Tolak</button>
          </td>
        </tr>
      `;
    })
    .join("");

  tbody.querySelectorAll(".btn-confirm").forEach((btn) => {
    btn.addEventListener("click", () => updateStatus(Number(btn.dataset.id), "confirmed"));
  });
  tbody.querySelectorAll(".btn-reject").forEach((btn) => {
    btn.addEventListener("click", () => updateStatus(Number(btn.dataset.id), "rejected"));
  });
}

function updateStatus(id, status) {
  const list = loadRegistrations();
  const entry = list.find((e) => e.id === id);
  if (!entry) return;
  entry.status = status;
  saveRegistrations(list);

  renderAdminTable();
  renderRiwayat();

  // Trigger otomatis pasca-confirm (logika internal, bukan automation service)
  if (status === "confirmed") {
    const resourceStatus = document.getElementById("akun-resource-status");
    const jadwalStatus = document.getElementById("akun-jadwal-status");
    if (resourceStatus) {
      resourceStatus.textContent = `Terbuka — akses resource paket "${entry.paket}" siap dipakai.`;
      resourceStatus.className = "akun-unlocked";
    }
    if (jadwalStatus) {
      jadwalStatus.textContent = "Terbuka — silakan pilih slot booking sesi 1 dari kalender internal.";
      jadwalStatus.className = "akun-unlocked";
    }
    const statusBox = document.getElementById("status-pembayaran");
    if (statusBox) {
      statusBox.className = "status-box status-confirmed";
      statusBox.innerHTML =
        '<span class="status-dot"></span><span>Status: pembayaran dikonfirmasi admin</span>';
    }
  }

  if (status === "rejected") {
    const statusBox = document.getElementById("status-pembayaran");
    if (statusBox) {
      statusBox.className = "status-box status-rejected";
      statusBox.innerHTML =
        '<span class="status-dot"></span><span>Status: bukti transfer ditolak, silakan upload ulang</span>';
    }
  }
}

function renderRiwayat() {
  const body = document.getElementById("riwayat-body");
  if (!body) return;
  const list = loadRegistrations();
  if (!list.length) {
    body.innerHTML = '<tr><td colspan="2" class="muted">Belum ada pesanan.</td></tr>';
    return;
  }
  body.innerHTML = list
    .map((entry) => {
      const label =
        entry.status === "confirmed" ? "Confirmed" : entry.status === "rejected" ? "Ditolak" : "Pending";
      return `<tr><td>${escapeHtml(entry.paket)}</td><td>${label}</td></tr>`;
    })
    .join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Login OTP simulasi ----------
const btnKirimOtp = document.getElementById("btn-kirim-otp");
const btnVerifikasiOtp = document.getElementById("btn-verifikasi-otp");
let currentOtp = null;

if (btnKirimOtp) {
  btnKirimOtp.addEventListener("click", () => {
    const wa = document.getElementById("login-wa").value.trim();
    if (!wa) {
      alert("Masukkan nomor WhatsApp terlebih dahulu.");
      return;
    }
    // OTP simulasi: langsung ditampilkan di layar, bukan dikirim via WA API asli
    currentOtp = String(Math.floor(100000 + Math.random() * 900000));
    document.getElementById("otp-code").textContent = currentOtp;
    document.getElementById("login-step-phone").classList.add("hidden");
    document.getElementById("login-step-otp").classList.remove("hidden");
  });
}

if (btnVerifikasiOtp) {
  btnVerifikasiOtp.addEventListener("click", () => {
    const input = document.getElementById("otp-input").value.trim();
    const resultBox = document.getElementById("login-result");
    resultBox.classList.remove("hidden");

    if (input === currentOtp) {
      const active = getActiveRegistration();
      const statusText =
        active && active.status === "confirmed"
          ? "Login berhasil. Akun sudah confirmed — mengarahkan ke member area."
          : "Login berhasil, tapi pembayaran belum dikonfirmasi — mengarahkan ke halaman pembayaran.";
      resultBox.className = "status-box status-confirmed";
      resultBox.innerHTML = `<span class="status-dot"></span><span>${statusText}</span>`;

      setTimeout(() => {
        const target = active && active.status === "confirmed" ? "akun" : "pembayaran";
        document.getElementById(target).scrollIntoView({ behavior: "smooth" });
      }, 700);
    } else {
      resultBox.className = "status-box status-rejected";
      resultBox.innerHTML =
        '<span class="status-dot"></span><span>Kode OTP salah, silakan coba lagi.</span>';
    }
  });
}

// ---------- Init ----------
renderAdminTable();
renderRiwayat();