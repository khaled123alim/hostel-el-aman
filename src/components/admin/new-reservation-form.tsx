"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronDown } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface Option {
  id: string;
  label: string;
}

function NativeSelect({
  value,
  onChange,
  placeholder,
  disabled,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full appearance-none rounded-xl border border-slate-300 bg-white ps-3.5 pe-9 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 rtl:left-3 rtl:right-auto" />
    </div>
  );
}

interface Option {
  id: string;
  label: string;
}

export function NewReservationForm({
  customers,
  hostels,
  rooms,
  isRtl,
}: {
  customers: Option[];
  hostels: Option[];
  rooms: (Option & { hostelId: string })[];
  isRtl: boolean;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [hostelId, setHostelId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");
  const [roomsCount, setRoomsCount] = useState("1");
  const [specialRequests, setSpecialRequests] = useState("");

  const filteredRooms = rooms.filter((r) => r.hostelId === hostelId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !hostelId || !roomId || !checkIn || !checkOut) return;
    setPending(true);
    try {
      const res = await fetch("/api/admin/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          hostelId,
          roomId,
          checkIn,
          checkOut,
          guests: Number(guests),
          rooms: Number(roomsCount),
          paymentMethod: "PAY_AT_HOSTEL",
          paymentStatus: "PENDING",
          status: "CONFIRMED",
          specialRequests,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: t(data.error ?? "errors.generic"), variant: "error" });
        return;
      }
      toast({ title: t("common.saved"), variant: "success" });
      router.push(`/admin/reservations/${data.reservation.id}`);
      router.refresh();
    } catch {
      toast({ title: t("errors.generic"), variant: "error" });
    } finally {
      setPending(false);
    }
  };

  const field = "mb-4";
  const label = "mb-1.5 block text-sm font-medium text-ink";

  return (
    <form onSubmit={submit} className="card-surface p-6">
      <div className="grid gap-x-5 md:grid-cols-2">
        <div className={field}>
          <label className={label}>{t("admin.customer")}</label>
          <NativeSelect value={customerId} onChange={setCustomerId} placeholder={t("admin.selectCustomer")}>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className={field}>
          <label className={label}>{t("admin.hostels")}</label>
          <NativeSelect
            value={hostelId}
            onChange={(v) => {
              setHostelId(v);
              setRoomId("");
            }}
            placeholder={t("admin.selectHostel")}
          >
            {hostels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.label}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className={field}>
          <label className={label}>{t("admin.rooms")}</label>
          <NativeSelect
            value={roomId}
            onChange={setRoomId}
            placeholder={hostelId ? t("admin.selectRoom") : t("admin.selectHostelFirst")}
            disabled={!hostelId}
          >
            {filteredRooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className={field}>
          <label className={label}>{t("admin.guestsCount")}</label>
          <input
            type="number"
            min={1}
            max={20}
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            className="input-base"
          />
        </div>

        <div className={field}>
          <label className={label}>{t("hero.checkin")}</label>
          <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="input-base" required />
        </div>

        <div className={field}>
          <label className={label}>{t("hero.checkout")}</label>
          <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="input-base" required />
        </div>

        <div className={field}>
          <label className={label}>{t("admin.roomsCount")}</label>
          <input
            type="number"
            min={1}
            max={5}
            value={roomsCount}
            onChange={(e) => setRoomsCount(e.target.value)}
            className="input-base"
          />
        </div>

        <div className={field}>
          <label className={label}>{t("booking.payAtHostelNote")}</label>
          <input value={t("admin.payAtHostelBadge")} readOnly disabled className="input-base" />
        </div>

        <div className="md:col-span-2">
          <label className={label}>{t("admin.specialRequests")}</label>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            rows={3}
            className="input-base"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("admin.create")}
        </button>
      </div>
    </form>
  );
}