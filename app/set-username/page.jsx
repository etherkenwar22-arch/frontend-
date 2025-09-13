"use client";

import { useState } from "react";

export default function SetUsernamePage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    let token = "";
    try {
      token = localStorage.getItem("token") || "";
    } catch (_) {}

    if (!token) {
      setError("Anda harus login terlebih dahulu.");
      return;
    }

    const trimmed = (username || "").trim();
    if (!trimmed) {
      setError("Username tidak boleh kosong.");
      return;
    }
    // batas wajar untuk mencegah payload terlalu besar; ubah jika perlu
    if (trimmed.length > 64) {
      setError("Username terlalu panjang (maks 64 karakter).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/username`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: trimmed }),
      });

      if (!res.ok) {
        const t = await res.text();
        // coba parse JSON error, fallback ke teks mentah
        try {
          const j = JSON.parse(t);
          throw new Error(j.error || t || "Gagal menyimpan username");
        } catch (_) {
          throw new Error(t || "Gagal menyimpan username");
        }
      }

      setSuccess("Username berhasil dibuat. Anda bisa mulai menggunakan fitur penuh.");
      setUsername("");
    } catch (e) {
      setError(e.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 border rounded p-6">
      <h2 className="text-xl font-semibold">Lengkapi Username</h2>
      <p className="text-sm text-neutral-600">Buat username publik. Cukup satu langkah.</p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div>
          <label className="text-sm font-medium">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
            className="w-full rounded border px-3 py-2 mt-1"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {loading ? "Menyimpan..." : "Simpan Username"}
        </button>
      </form>

      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      {success && <div className="mt-3 text-sm text-green-600">{success}</div>}
    </div>
  );
}
