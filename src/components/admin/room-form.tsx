"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { NativeSelect } from "@/components/ui/native-select";

const TYPES = ["DORMITORY", "PRIVATE", "DOUBLE", "TWIN", "TRIPLE", "FAMILY", "SUITE"];
const BEDS = ["SINGLE", "DOUBLE", "QUEEN", "KING", "BUNK", "SOFA"];
const BATHS = ["PRIVATE", "SHARED", "ENSUITE"];

interface RoomFormValues {
  hostelId: string;
  name: string;
  number: string;
  type: string;
  description: string;
  capacity: string;
  beds: string;
  bedType: string;
  bathroomType: string;
  pricePerNight: string;
  cleaningFee: string;
  taxRate: string;
  minStay: string;
  maxStay: string;
  amenities: string;
  images: string;
  status: string;
}

const empty: RoomFormValues = {
  hostelId: "",
  name: "",
  number: "",
  type: "DORMITORY",
  description: "",
  capacity: "1",
  beds: "1",
  bedType: "SINGLE",
  bathroomType: "SHARED",
  pricePerNight: "",
  cleaningFee: "0",
  taxRate: "0",
  minStay: "1",
  maxStay: "30",
  amenities: "",
  images: "",
  status: "ACTIVE",
};

export function RoomForm({
  id,
  hostels,
  initial,
  isRtl,
}: {
  id?: string;
  hostels: { id: string; label: string }[];
  initial?: Partial<RoomFormValues>;
  isRtl: boolean;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState<RoomFormValues>({ ...empty, ...initial });

  const set = (key: keyof RoomFormValues, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const split = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.hostelId || !form.pricePerNight) return;
    setPending(true);
    try {
      const payload = {
        hostelId: form.hostelId,
        name: form.name,
        number: form.number,
        type: form.type,
        description: form.description,
        capacity: Number(form.capacity),
        beds: Number(form.beds),
        bedType: form.bedType,
        bathroomType: form.bathroomType,
        pricePerNight: Number(form.pricePerNight),
        cleaningFee: Number(form.cleaningFee),
        taxRate: Number(form.taxRate),
        minStay: Number(form.minStay),
        maxStay: Number(form.maxStay),
        amenities: split(form.amenities),
        images: split(form.images),
        status: form.status,
      };
      const res = await fetch(id ? `/api/admin/rooms/${id}` : "/api/admin/rooms", {
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
      router.push("/admin/rooms");
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
          <label className={label}>{t("admin.hostels")} *</label>
          <NativeSelect value={form.hostelId} onChange={(v) => set("hostelId", v)} placeholder={t("admin.selectHostel")} dir={isRtl ? "rtl" : "ltr"}>
            {hostels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div>
          <label className={label}>{t("admin.roomName")} *</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} required className="input-base" />
        </div>
        <div>
          <label className={label}>{t("admin.roomNumber")} *</label>
          <input value={form.number} onChange={(e) => set("number", e.target.value)} required className="input-base" />
        </div>
        <div>
          <label className={label}>{t("common.type")} *</label>
          <NativeSelect value={form.type} onChange={(v) => set("type", v)} dir={isRtl ? "rtl" : "ltr"}>
            {TYPES.map((ty) => (
              <option key={ty} value={ty}>
                {t(`roomType.${ty}`)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div>
          <label className={label}>{t("common.room")} {t("common.capacity")} *</label>
          <input type="number" min={1} value={form.capacity} onChange={(e) => set("capacity", e.target.value)} className="input-base" />
        </div>
        <div>
          <label className={label}>{t("common.beds")} *</label>
          <input type="number" min={1} value={form.beds} onChange={(e) => set("beds", e.target.value)} className="input-base" />
        </div>
        <div>
          <label className={label}>{t("admin.bedType")} *</label>
          <NativeSelect value={form.bedType} onChange={(v) => set("bedType", v)} dir={isRtl ? "rtl" : "ltr"}>
            {BEDS.map((b) => (
              <option key={b} value={b}>
                {t(`bed.${b}`)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div>
          <label className={label}>{t("admin.bathroomType")} *</label>
          <NativeSelect value={form.bathroomType} onChange={(v) => set("bathroomType", v)} dir={isRtl ? "rtl" : "ltr"}>
            {BATHS.map((b) => (
              <option key={b} value={b}>
                {t(`bath.${b}`)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div>
          <label className={label}>{t("admin.pricePerNight")} *</label>
          <input type="number" min={0} step="0.01" value={form.pricePerNight} onChange={(e) => set("pricePerNight", e.target.value)} required className="input-base" />
        </div>
        <div>
          <label className={label}>{t("admin.cleaningFee")}</label>
          <input type="number" min={0} step="0.01" value={form.cleaningFee} onChange={(e) => set("cleaningFee", e.target.value)} className="input-base" />
        </div>
        <div>
          <label className={label}>{t("admin.taxRate")} (%)</label>
          <input type="number" min={0} max={100} step="0.1" value={form.taxRate} onChange={(e) => set("taxRate", e.target.value)} className="input-base" />
        </div>
        <div>
          <label className={label}>{t("admin.minStay")}</label>
          <input type="number" min={1} value={form.minStay} onChange={(e) => set("minStay", e.target.value)} className="input-base" />
        </div>
        <div>
          <label className={label}>{t("admin.maxStay")}</label>
          <input type="number" min={1} value={form.maxStay} onChange={(e) => set("maxStay", e.target.value)} className="input-base" />
        </div>
        <div className="md:col-span-2">
          <label className={label}>{t("common.description")}</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} className="input-base" />
        </div>
        <div>
          <label className={label}>{t("admin.amenities")}</label>
          <textarea value={form.amenities} onChange={(e) => set("amenities", e.target.value)} rows={3} placeholder={t("admin.listPh")} className="input-base" />
        </div>
        <div>
          <label className={label}>{t("admin.images")}</label>
          <textarea value={form.images} onChange={(e) => set("images", e.target.value)} rows={3} placeholder={t("admin.imagesPh")} className="input-base" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
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