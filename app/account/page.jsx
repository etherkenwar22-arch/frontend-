"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Alert from "../../components/ui/Alert";

export default function AccountPage() {
  const API = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"}/api`;
  const authed = useMemo(() => { try { return !!localStorage.getItem("token"); } catch { return false; } }, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [me, setMe] = useState(null);
  const [socials, setSocials] = useState([{ label: "", url: "" }]);
  const [form, setForm] = useState({ full_name: "", bio: "", pronouns: "", company: "", telegram: "" });
  const [username, setUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [chgLoading, setChgLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (!authed) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    const t = localStorage.getItem("token");
    fetch(`${API}/account/me`, { headers: { Authorization: `Bearer ${t}` }})
      .then(r => r.ok ? r.json() : Promise.reject(new Error("Gagal memuat akun")))
      .then(data => {
        if (cancelled) return;
        setMe(data);
        setUsername(data.username || "");
        setAvatarUrl(data.avatar_url || "");
        setForm({
          full_name: data.full_name || "",
          bio: data.bio || "",
          pronouns: data.pronouns || "",
          company: data.company || "",
          telegram: data.telegram || "",
        });
        const s = Array.isArray(data.social_accounts) ? data.social_accounts : [];
        setSocials(s.length ? s : [{ label: "", url: "" }]);
      })
      .catch(e => setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [API, authed]);

  function updateSocial(i, key, val) {
    setSocials(prev => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [key]: val };
      return copy;
    });
  }
  function addSocial() { setSocials(prev => [...prev, { label: "", url: "" }]); }
  function removeSocial(i) { setSocials(prev => prev.filter((_, idx) => idx !== i)); }

  function onAvatarFileChange(e) {
    setOk(""); setError("");
    const file = e.target.files && e.target.files[0];
    setAvatarFile(file || null);
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    } else {
      setAvatarPreview("");
    }
  }

  async function uploadAvatar() {
    setError(""); setOk(""); setAvatarUploading(true);
    try {
      if (!avatarFile) throw new Error("Pilih file gambar terlebih dahulu");
      const t = localStorage.getItem("token");
      const fd = new FormData();
      fd.append("file", avatarFile);
      const r = await fetch(`${API}/account/avatar`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${t}` },
        body: fd,
      });
      const txt = await r.text();
      if (!r.ok) throw new Error(txt || "Gagal mengunggah avatar");
      let resp = {};
      try { resp = JSON.parse(txt); } catch {}
      const url = resp.avatar_url || avatarUrl || "";
      if (url) setAvatarUrl(url);
      setOk("Foto profil diperbarui.");
      setAvatarFile(null);
      setAvatarPreview("");
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setAvatarUploading(false);
    }
  }

  async function saveAccount(e) {
    e.preventDefault();
    setError(""); setOk("");
    try {
      const t = localStorage.getItem("token");
      const body = { ...form, social_accounts: socials.filter(s => s.label || s.url) };
      const r = await fetch(`${API}/account`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await r.text() || "Gagal menyimpan akun");
      setOk("Akun diperbarui.");
    } catch (e) { setError(String(e.message || e)); }
  }

  async function changeUsername() {
    setError(""); setOk(""); setChgLoading(true);
    try {
      if (!newUsername) throw new Error("Masukkan username baru");
      const t = localStorage.getItem("token");
      const r = await fetch(`${API}/account/change-username`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({ new_username: newUsername }),
      });
      const txt = await r.text();
      if (!r.ok) throw new Error(txt || "Gagal mengganti username");
      const data = JSON.parse(txt);
      setOk(`Username diubah menjadi ${data.new_username}. Saldo sekarang Rp ${Number(data.balance).toLocaleString('id-ID')}`);
      setUsername(data.new_username);
      setNewUsername("");
    } catch (e) { setError(String(e.message || e)); } finally { setChgLoading(false); }
  }

  if (!authed) return <Alert type="error" message="Anda harus login untuk mengelola akun." />;

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-xl font-semibold">Account</h2>

      {loading ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="spinner" /> Loading...
        </div>
      ) : (
        <>
          <section className="border rounded p-4">
            <h3 className="font-medium">Foto Profil</h3>
            <div className="mt-3 flex items-start gap-4">
              <div className="shrink-0">
                <img
                  src={avatarPreview || avatarUrl || "/avatar-default.png"}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full border object-cover bg-neutral-50"
                />
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={onAvatarFileChange}
                  label=""
                  className="block w-full text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={uploadAvatar}
                    disabled={avatarUploading || !avatarFile}
                    loading={avatarUploading}
                  >
                    Simpan Foto
                  </Button>
                  {avatarPreview && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => { setAvatarFile(null); setAvatarPreview(""); }}
                    >
                      Batal
                    </Button>
                  )}
                </div>
                <div className="text-xs text-neutral-500">Gunakan gambar rasio 1:1 untuk hasil terbaik. Max ~2MB (sesuaikan backend).</div>
              </div>
            </div>
          </section>

          <section className="border rounded p-4">
            <h3 className="font-medium">Profil</h3>
            <form onSubmit={saveAccount} className="mt-3 space-y-3">
              <Input
                label="Name"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              />
              <div>
                <label className="text-sm">Bio</label>
                <textarea
                  rows={3}
                  className="input"
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Pronouns"
                  value={form.pronouns}
                  onChange={e => setForm(f => ({ ...f, pronouns: e.target.value }))}
                />
                <Input
                  label="Company"
                  value={form.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                />
              </div>
              <Input
                label="Contact Telegram"
                placeholder="@username"
                value={form.telegram}
                onChange={e => setForm(f => ({ ...f, telegram: e.target.value }))}
              />
              <div>
                <label className="text-sm font-medium">Social Accounts</label>
                <div className="space-y-2 mt-2">
                  {socials.map((s, i) => (
                    <div key={i} className="grid grid-cols-2 gap-2 items-start">
                      <Input
                        placeholder="Label (Instagram, LinkedIn, Toko Shopee, dll)"
                        value={s.label || ""}
                        onChange={e => updateSocial(i, "label", e.target.value)}
                        className=""
                      />
                      <Input
                        placeholder="https://..."
                        value={s.url || ""}
                        onChange={e => updateSocial(i, "url", e.target.value)}
                        className=""
                      />
                      <div className="col-span-2 text-right">
                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => removeSocial(i)}
                          className="text-xs px-2 py-1"
                        >
                          Hapus
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addSocial}
                    className="text-sm"
                  >
                    + Tambah
                  </Button>
                </div>
              </div>
              <div className="pt-2">
                <Button type="submit">Simpan</Button>
              </div>
            </form>
          </section>

          <section className="border rounded p-4">
            <h3 className="font-medium">Username</h3>
            <div className="text-sm">Saat ini: <b>{username || "(belum ada)"}</b></div>
            <div className="text-xs text-neutral-600 mt-1">Ganti username berbayar Rp.100.000. Saldo IDR akan dipotong otomatis.</div>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Username baru"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                className=""
              />
              <Button
                onClick={changeUsername}
                loading={chgLoading}
                disabled={chgLoading}
              >
                Ganti Username
              </Button>
            </div>
          </section>

          {error && <Alert type="error" message={error} />}
          {ok && <Alert type="success" message={ok} />}
        </>
      )}
    </div>
  );
}
