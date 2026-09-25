"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface HostelFormValues {
  name: string;
  slug?: string;
  description: string;
  address: string;
  city: string;
  country: string;
  latitude: string;
  longitude: string;
  phone?: string;
  email?: string;
  website?: string;
  checkInTime: string;
  checkOutTime: string;
  imageCover?: string;
  images: string;
  amenities: string;
  houseRules: string;
  seoTitle?: string;
  metaDescription?: string;
  featured: boolean;
  status: string;
}

const empty: HostelFormValues = {
  name: "",
  slug: "",
  description: "",
  address: "",
  city: "",
  country: "",
  latitude: "",
  longitude: "",
  phone: "",
  email: "",
  website: "",
  checkInTime: "14:00",
  checkOutTime: "11:00",
  imageCover: "",
  images: "",
  amenities: "",
  houseRules: "",
  seoTitle: "",
  metaDescription: "",
  featured: false,
  status: "ACTIVE",
};

export function HostelForm({ id, initial, isRtl }: { id?: string; initial?: Partial<HostelFormValues>; isRtl: boolean }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState<HostelFormValues>({ ...empty, ...initial });

  void isRtl;

  const set = (key: keyof HostelFormValues, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));
  const split = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || undefined,
        description: form.description,
        address: form.address,
        city: form.city,
        country: form.country,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        phone: form.phone,
        email: form.email,
        website: form.website,
        checkInTime: form.checkInTime,
        checkOutTime: form.checkOutTime,
        imageCover: form.imageCover,
        images: split(form.images),
        amenities: split(form.amenities),
        houseRules: split(form.houseRules),
        seoTitle: form.seoTitle,
        metaDescription: form.metaDescription,
        featured: form.featured,
        status: form.status,
      };
      const res = await fetch(id ? `/api/admin/hostels/${id}` : "/api/admin/hostels", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: t(data.error ?? "errors.generic"), variant: "error" });
        return;
      }
      toast({ title: t("common.saved"), variant: "success" });
      router.push("/admin/hostels");
      router.refresh();
    } catch {
      toast({ title: t("errors.generic"), variant: "error" });
    } finally {
      setPending(false);
    }
  };

  const label = "mb-1.5 block text-sm font-medium text-ink";
  const grid = "grid gap-5 md:grid-cols-2";

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className={grid}>
        <div>
          <label className={label}>{t("admin.hostelName")} *</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} required className="input-base" />
        </div>
        <div>
          <label className={label}>{t("admin.slug")}</label>
          <input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="my-hostel" className="input-base" />
        </div>
        <div>
          <label className={label}>{t("common.address")} *</label>
          <input value={form.address} onChange={(e) => set("address", e.target.value)} required className="input-base" />
        </div>
        <div>
          <label className={label}>{t("common.city")} *</label>
          <input value={form.city} onChange={(e) => set("city", e.target.value)} required className="input-base" />
        </div>
        <div>
          <label className={label}>{t("common.country")} *</label>
          <input value={form.country} onChange={(e) => set("country", e.target.value)} required className="input-base" />
        </div>
        <div>
          <label className={label}>{t("admin.lat")}</label>
          <input type="number" step="any" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} className="input-base" />
        </div>
        <div>
          <label className={label}>{t("admin.lng")}</label>
          <input type="number" step="any" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} className="input-base" />
        </div>
        <div>
          <label className={label}>{t("common.phone")}</label>
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="input-base" />
        </div>
        <div>
          <label className={label}>{t("common.email")}</label>
          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="input-base" />
        </div>
        <div>
          <label className={label}>{t("admin.website")}</label>
          <input value={form.website} onChange={(e) => set("website", e.target.value)} className="input-base" />
        </div>
        <div>
          <label className={label}>{t("admin.checkInTime")}</label>
          <input type="time" value={form.checkInTime} onChange={(e) => set("checkInTime", e.target.value)} className="input-base" />
        </div>
        <div>
          <label className={label}>{t("admin.checkOutTime")}</label>
          <input type="time" value={form.checkOutTime} onChange={(e) => set("checkOutTime", e.target.value)} className="input-base" />
        </div>
        <div className="md:col-span-2">
          <label className={label}>{t("admin.coverImage")}</label>
          <input value={form.imageCover} onChange={(e) => set("imageCover", e.target.value)} placeholder="https://…" className="input-base" />
        </div>
        <div className="md:col-span-2">
          <label className={label}>{t("admin.images")}</label>
          <textarea value={form.images} onChange={(e) => set("images", e.target.value)} rows={3} placeholder={t("admin.imagesPh")} className="input-base" />
        </div>
        <div className="md:col-span-2">
          <label className={label}>{t("common.description")} *</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} required className="input-base" />
        </div>
        <div>
          <label className={label}>{t("admin.amenities")}</label>
          <textarea value={form.amenities} onChange={(e) => set("amenities", e.target.value)} rows={4} placeholder={t("admin.listPh")} className="input-base" />
        </div>
        <div>
          <label className={label}>{t("admin.houseRules")}</label>
          <textarea value={form.houseRules} onChange={(e) => set("houseRules", e.target.value)} rows={4} placeholder={t("admin.listPh")} className="input-base" />
        </div>
        <div>
          <label className={label}>{t("admin.seoTitle")}</label>
          <input value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} className="input-base" />
        </div>
        <div>
          <label className={label}>{t("admin.metaDescription")}</label>
          <textarea value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} rows={2} className="input-base" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30" />
          {t("admin.featured")}
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          {t("admin.status")}
          <select value={form.status} onChange={(e) => set("status", e.target.value)} className="input-base max-w-44">
            <option value="ACTIVE">{t("admin.active")}</option>
            <option value="INACTIVE">{t("admin.inactive")}</option>
          </select>
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => router.back()} className="btn-subtle">
          {t("common.cancel")}
        </button>
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark active:scale-[0.98] disabled:opacity-50"
          )}
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {id ? t("common.update") : t("admin.create")}
        </button>
      </div>
    </form>
  );
}