// =========================================================
// Mark-Up — Application logic
// Semua "otomasi" berjalan di sisi browser (localStorage)
// sebagai representasi logika internal aplikasi — tanpa
// payment gateway, WhatsApp API, atau automation service
// pihak ketiga mana pun.
// =========================================================

const STORE_KEY = "markup_pendaftaran";

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

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// ---------------------------------------------------------
// Katalog program — filter chip
// ---------------------------------------------------------
(function initCatalogFilter() {
  const chips = document.querySelectorAll(".chip");
  if (!chips.length) return;
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
})();

// ---------------------------------------------------------
// Halaman detail program (program-detail.html?slug=...)
// ---------------------------------------------------------
(function initProgramDetail() {
  const root = document.getElementById("program-detail-root");
  if (!root || typeof PROGRAMS === "undefined") return;

  const slug = getQueryParam("slug");
  const program = PROGRAMS[slug];

  if (!program) {
    root.innerHTML = `
      <div class="empty-state">
        <h2>Program tidak ditemukan</h2>
        <p>Program yang kamu cari mungkin sudah tidak tersedia.</p>
        <a href="program.html" class="btn btn-primary">Kembali ke Katalog</a>
      </div>`;
    return;
  }

  document.title = program.title + " — Mark-Up";

  const tiers = buildTierData(slug);

  const headerHtml = `
    <div class="breadcrumb"><a href="program.html">Program</a> <span>/</span> <span>${escapeHtml(program.title)}</span></div>
    <span class="program-tag">${escapeHtml(program.tag)}</span>
    <h1>${escapeHtml(program.title)}</h1>
    <p class="detail-tagline">${escapeHtml(program.tagline)}</p>
    <p class="detail-desc">${escapeHtml(program.desc)}</p>
    <div class="mentor-chip">
      <span class="mentor-avatar">${escapeHtml(program.title.charAt(0))}</span>
      <div>
        <span class="mentor-label">Mentor pendamping</span>
        <strong>${escapeHtml(program.mentor)}</strong>
      </div>
    </div>
  `;

  const tierHeaderHtml = tiers
    .map(
      (t, i) => `
      <div class="tier-col-header ${i === 1 ? "tier-popular" : ""}">
        ${i === 1 ? '<span class="tier-badge">Paling Diminati</span>' : ""}
        <h3><em>Paket<br>${escapeHtml(t.name)}</em></h3>
        <p class="tier-price">${escapeHtml(t.priceLabel)}</p>
        <a href="daftar.html?paket=${encodeURIComponent(slug)}&tier=${encodeURIComponent(t.name)}" class="btn ${i === 1 ? "btn-primary" : "btn-outline"} btn-small btn-full">Daftar</a>
      </div>`
    )
    .join("");

  const rowsHtml = FEATURE_ROWS.map((row) => {
    const label = row.label_template
      ? row.label_template.replace("{sesi}", program.sesi)
      : row.label;
    const marks = TIER_PATTERN[row.key]
      .map(
        (checked) =>
          `<div class="tier-mark">${checked ? '<span class="mark mark-yes">✓</span>' : '<span class="mark mark-no">✕</span>'}</div>`
      )
      .join("");
    return `
      <div class="tier-row">
        <div class="tier-feature-label">${escapeHtml(label)}</div>
        ${marks}
      </div>`;
  }).join("");

  root.innerHTML = `
    <div class="detail-header">${headerHtml}</div>
    <div class="tier-table-wrap">
      <div class="tier-table">
        <div class="tier-row tier-row-head">
          <div class="tier-feature-label tier-feature-label-head"></div>
          ${tierHeaderHtml}
        </div>
        ${rowsHtml}
      </div>
    </div>
    <p class="tier-footnote">Semua paket dapat menyesuaikan jenis kompetisi (BCC/BPC) yang kamu ikuti. Ada pertanyaan sebelum daftar? <a href="tentang.html">Lihat FAQ</a> atau hubungi admin lewat kontak di halaman Tentang.</p>
  `;
})();

// ---------------------------------------------------------
// Form pendaftaran (daftar.html)
// ---------------------------------------------------------
(function initFormDaftar() {
  const form = document.getElementById("form-daftar");
  if (!form) return;

  const paketSelect = document.getElementById("paket");
  const slugParam = getQueryParam("paket");
  const tierParam = getQueryParam("tier");

  if (paketSelect && slugParam && typeof PROGRAMS !== "undefined" && PROGRAMS[slugParam]) {
    const optionValue = tierParam
      ? `${PROGRAMS[slugParam].title} — Paket ${tierParam}`
      : PROGRAMS[slugParam].title;
    let opt = Array.from(paketSelect.options).find((o) => o.value === optionValue);
    if (!opt) {
      opt = document.createElement("option");
      opt.value = optionValue;
      opt.textContent = optionValue;
      paketSelect.insertBefore(opt, paketSelect.firstChild);
    }
    paketSelect.value = optionValue;
  }

  form.addEventListener("submit", (e) => {
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
      status: "pending",
    };
    list.push(entry);
    saveRegistrations(list);
    window.location.href = "pembayaran.html";
  });
})();

// ---------------------------------------------------------
// Pembayaran — upload bukti transfer (pembayaran.html)
// ---------------------------------------------------------
(function initPembayaran() {
  const btn = document.getElementById("btn-upload-bukti");
  if (!btn) return;

  const active = getActiveRegistration();
  const amountEl = document.getElementById("payment-amount-value");
  const packageEl = document.getElementById("payment-package-value");
  const statusBox = document.getElementById("status-pembayaran");

  if (!active) {
    if (amountEl) amountEl.textContent = "—";
    if (packageEl) packageEl.textContent = "Belum ada pendaftaran aktif";
    btn.disabled = true;
    if (statusBox) {
      statusBox.className = "status-box status-rejected";
      statusBox.innerHTML =
        '<span class="status-dot"></span><span>Belum ada pendaftaran — isi form pendaftaran terlebih dahulu.</span>';
    }
    return;
  }

  if (packageEl) packageEl.textContent = active.paket;
  if (amountEl) amountEl.textContent = "sesuai paket " + active.paket;

  updatePembayaranStatusUI(active, statusBox);

  btn.addEventListener("click", () => {
    const list = loadRegistrations();
    const last = list[list.length - 1];
    last.buktiUploaded = true;
    saveRegistrations(list);
    updatePembayaranStatusUI(last, statusBox);
  });
})();

function updatePembayaranStatusUI(entry, statusBox) {
  if (!statusBox) return;
  if (entry.status === "confirmed") {
    statusBox.className = "status-box status-confirmed";
    statusBox.innerHTML = '<span class="status-dot"></span><span>Pembayaran sudah dikonfirmasi admin.</span>';
  } else if (entry.status === "rejected") {
    statusBox.className = "status-box status-rejected";
    statusBox.innerHTML = '<span class="status-dot"></span><span>Bukti transfer ditolak, silakan upload ulang.</span>';
  } else if (entry.buktiUploaded) {
    statusBox.className = "status-box status-pending";
    statusBox.innerHTML = '<span class="status-dot"></span><span>Bukti terkirim, menunggu konfirmasi admin.</span>';
  } else {
    statusBox.className = "status-box status-pending";
    statusBox.innerHTML = '<span class="status-dot"></span><span>Menunggu bukti transfer diunggah.</span>';
  }
}

// ---------------------------------------------------------
// Login dengan OTP (login.html)
// ---------------------------------------------------------
(function initLogin() {
  const btnKirimOtp = document.getElementById("btn-kirim-otp");
  if (!btnKirimOtp) return;

  let currentOtp = null;

  btnKirimOtp.addEventListener("click", () => {
    const wa = document.getElementById("login-wa").value.trim();
    if (!wa) {
      alert("Masukkan nomor WhatsApp terlebih dahulu.");
      return;
    }
    currentOtp = String(Math.floor(100000 + Math.random() * 900000));
    document.getElementById("otp-code").textContent = currentOtp;
    document.getElementById("login-step-phone").classList.add("hidden");
    document.getElementById("login-step-otp").classList.remove("hidden");
  });

  const btnVerifikasiOtp = document.getElementById("btn-verifikasi-otp");
  btnVerifikasiOtp.addEventListener("click", () => {
    const input = document.getElementById("otp-input").value.trim();
    const resultBox = document.getElementById("login-result");
    resultBox.classList.remove("hidden");

    if (input === currentOtp) {
      const active = getActiveRegistration();
      resultBox.className = "status-box status-confirmed";
      resultBox.innerHTML = '<span class="status-dot"></span><span>Berhasil masuk. Mengarahkan ke akunmu...</span>';
      setTimeout(() => {
        window.location.href = active && active.status === "confirmed" ? "akun.html" : "pembayaran.html";
      }, 600);
    } else {
      resultBox.className = "status-box status-rejected";
      resultBox.innerHTML = '<span class="status-dot"></span><span>Kode OTP salah, silakan coba lagi.</span>';
    }
  });
})();

// ---------------------------------------------------------
// Akun / member area (akun.html)
// ---------------------------------------------------------
(function initAkun() {
  const resourceStatus = document.getElementById("akun-resource-status");
  if (!resourceStatus) return;

  const active = getActiveRegistration();
  const jadwalStatus = document.getElementById("akun-jadwal-status");
  const namaEl = document.getElementById("akun-nama");

  if (active && namaEl) namaEl.textContent = active.nama || "Peserta Mark-Up";

  if (active && active.status === "confirmed") {
    resourceStatus.textContent = `Terbuka — akses resource paket "${active.paket}" siap dipakai.`;
    resourceStatus.className = "akun-unlocked";
    if (jadwalStatus) {
      jadwalStatus.textContent = "Terbuka — silakan pilih slot booking sesi 1 dari kalender di bawah.";
      jadwalStatus.className = "akun-unlocked";
    }
    renderSlotPicker();
  } else {
    resourceStatus.textContent = "Terkunci — akan terbuka otomatis setelah pembayaran dikonfirmasi admin.";
    if (jadwalStatus)
      jadwalStatus.textContent = "Booking sesi 1 terbuka otomatis setelah pembayaran dikonfirmasi.";
  }

  renderRiwayat();
})();

function renderSlotPicker() {
  const wrap = document.getElementById("slot-picker");
  if (!wrap) return;
  const slots = ["Sen, 27 Jul — 19:00", "Rab, 29 Jul — 19:00", "Jum, 31 Jul — 16:00", "Min, 02 Ags — 10:00"];
  wrap.innerHTML = slots
    .map((s) => `<button type="button" class="slot-btn">${s}</button>`)
    .join("");
  wrap.querySelectorAll(".slot-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      wrap.querySelectorAll(".slot-btn").forEach((b) => b.classList.remove("slot-selected"));
      btn.classList.add("slot-selected");
      const note = document.getElementById("slot-note");
      if (note) note.textContent = "Sesi 1 terjadwal pada " + btn.textContent + ".";
    });
  });
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

// ---------------------------------------------------------
// Dashboard admin (dashboard-admin.html)
// ---------------------------------------------------------
(function initAdmin() {
  const tbody = document.getElementById("admin-table-body");
  if (!tbody) return;
  renderAdminTable();
})();

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
        entry.status === "confirmed" ? "badge-confirmed" : entry.status === "rejected" ? "badge-rejected" : "badge-pending";
      const badgeText = entry.status === "confirmed" ? "Confirmed" : entry.status === "rejected" ? "Ditolak" : "Pending";
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
        </tr>`;
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
}

// ---------------------------------------------------------
// Navbar aktif berdasarkan halaman saat ini
// ---------------------------------------------------------
(function highlightActiveNav() {
  const current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === current) a.classList.add("nav-active");
  });
})();