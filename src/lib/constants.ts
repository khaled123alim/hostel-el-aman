import {
  Wifi,
  UtensilsCrossed,
  ParkingCircle,
  AirVent,
  ShowerHead,
  LockKeyhole,
  Coffee,
  Car,
  Briefcase,
  Bike,
  DoorOpen,
  Flame,
  Sofa,
  Sun,
  Newspaper,
  KeyRound,
  ShieldCheck,
  Waves,
  Dumbbell,
  MapPin,
  type LucideIcon,
} from "lucide-react";

export const APP_NAME = "StayHub";

export const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "fr", label: "French", native: "Français" },
  { code: "ar", label: "Arabic", native: "العربية", rtl: true },
] as const;

export const CURRENCIES = [
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "DZD", symbol: "DA", label: "Algerian Dinar" },
] as const;

export const ROOM_TYPES: Record<string, { label: string; labelFr: string; labelAr: string; icon: LucideIcon }> = {
  DORMITORY: { label: "Dormitory", labelFr: "Dortoir", labelAr: "غرفة مشتركة", icon: BedDoor },
  PRIVATE: { label: "Private room", labelFr: "Chambre privée", labelAr: "غرفة خاصة", icon: DoorOpen },
  DOUBLE: { label: "Double room", labelFr: "Chambre double", labelAr: "غرفة مزدوجة", icon: BedDouble },
  TWIN: { label: "Twin room", labelFr: "Chambre twin", labelAr: "غرفة توأم", icon: BedDouble },
  TRIPLE: { label: "Triple room", labelFr: "Chambre triple", labelAr: "غرفة ثلاثية", icon: BedDouble },
  FAMILY: { label: "Family room", labelFr: "Chambre familiale", labelAr: "غرفة عائلية", icon: UsersRound },
  SUITE: { label: "Suite", labelFr: "Suite", labelAr: "جناح", icon: Home },
};

import { BedDouble, UsersRound, Home, Bed as BedDoor } from "lucide-react";

export const BED_TYPES = ["SINGLE", "DOUBLE", "QUEEN", "KING", "BUNK", "SOFA"] as const;
export const BATHROOM_TYPES = ["PRIVATE", "SHARED", "ENSUITE"] as const;

export const RESERVATION_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "CHECKED_OUT",
  "CANCELLED",
  "NO_SHOW",
] as const;

export const PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
] as const;

export const PAYMENT_METHODS = ["CARD", "STRIPE", "PAYPAL", "PAY_AT_HOSTEL", "BANK_TRANSFER"] as const;

export const HOUSEKEEPING_STATUSES = [
  "CLEAN",
  "DIRTY",
  "CLEANING",
  "INSPECTED",
  "OUT_OF_ORDER",
] as const;

export const AMENITIES_HOSTEL = [
  "Wi-Fi",
  "Breakfast",
  "Air conditioning",
  "Shared kitchen",
  "Parking",
  "Laundry",
  "Airport shuttle",
  "24h reception",
  "Bar",
  "Lounge",
  "BBQ area",
  "Terrace",
  "Bicycle rental",
  "Lockers",
  "Safe",
  "Spa",
  "Pool",
  "Gym",
  "Pet friendly",
  "Smoking area",
];

export const AMENITIES_ROOM = [
  "Wi-Fi",
  "Air conditioning",
  "Ensuite bathroom",
  "Balcony",
  "City view",
  "Towels",
  "Linen",
  "Hairdryer",
  "Safe box",
  "Mini fridge",
  "Kettle",
  "Heating",
  "Desk",
  "Wardrobe",
  "Reading lamp",
  "Blackout curtains",
];

export const AMENITY_ICONS: Record<string, LucideIcon> = {
  "Wi-Fi": Wifi,
  Breakfast: Coffee,
  "Air conditioning": AirVent,
  "Shared kitchen": UtensilsCrossed,
  Parking: ParkingCircle,
  Laundry: Waves,
  "Airport shuttle": Car,
  "24h reception": Clock24,
  Bar: Coffee,
  Lounge: Sofa,
  "BBQ area": Flame,
  Terrace: Sun,
  "Bicycle rental": Bike,
  Lockers: LockKeyhole,
  Safe: ShieldCheck,
  Spa: Waves,
  Pool: Waves,
  Gym: Dumbbell,
  "Pet friendly": UsersRound,
  "Smoking area": Sun,
  "Ensuite bathroom": ShowerHead,
  Balcony: DoorOpen,
  "City view": MapPin,
  Towels: ShowerHead,
  Linen: BedDouble,
  Hairdryer: AirVent,
  "Safe box": LockKeyhole,
  "Mini fridge": Coffee,
  Kettle: Coffee,
  Heating: Flame,
  Desk: Briefcase,
  Wardrobe: DoorOpen,
  "Reading lamp": Sun,
  "Blackout curtains": Moon,
};

import { Clock as Clock24, Moon } from "lucide-react";

export function amenityIcon(name: string): LucideIcon {
  return AMENITY_ICONS[name] ?? MapPin;
}

// Image presets ------------------------------------------------------------
const U = (id: string, w = 1600, q = 80) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=${q}`;

export const IMG = {
  hero1: U("photo-1571896349842-33c89424de2d", 2000),
  hero2: U("photo-1566073771259-6a8506099945", 2000),
  hero3: U("photo-1445019980597-93fa8acb246c", 2000),
  hero4: U("photo-1467269204594-9661b134dd2b", 2000),
  cta: U("photo-1523906834658-6e24ef2386f9", 2000),

  hostels: [
    U("photo-1571896349842-33c89424de2d"),
    U("photo-1566073771259-6a8506099945"),
    U("photo-1551882547-ff40c63fe5fa"),
    U("photo-1542314831-068cd1dbfeeb"),
    U("photo-1555854877-bab0e564b8d5"),
    U("photo-1582719478250-c89cae4dc85b"),
    U("photo-1595576508898-0ad5c879a061"),
    U("photo-1445019980597-93fa8acb246c"),
  ],

  rooms: [
    U("photo-1590490360182-c33d57733427"),
    U("photo-1611892440504-42a792e24d32"),
    U("photo-1522708323590-d24dbb6b0267"),
    U("photo-1502672260266-1c1ef2d93688"),
    U("photo-1560448204-e02f11c3d0e2"),
    U("photo-1560185007-cde436f6a4d0"),
    U("photo-1512918728675-ed5a9ecdebfd"),
    U("photo-1586023492125-27b2c045efd7"),
    U("photo-1493809842364-78817add7ffb"),
    U("photo-1600607687939-ce8a6c25118c"),
    U("photo-1616486338812-3dadae4b4ace"),
    U("photo-1616594039964-ae9021a400a0"),
  ],

  travel: [
    U("photo-1507525428034-b723cf961d3e"),
    U("photo-1469474968028-56623f02e42e"),
    U("photo-1476514525535-07fb3b4ae5f1"),
    U("photo-1499856871958-5b9627545d1a"),
    U("photo-1533488765986-dfa2a9939acd"),
    U("photo-1469854523086-cc02fe5d8800"),
  ],
};

export const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  CONFIRMED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  CHECKED_IN: "bg-sky-100 text-sky-800 border-sky-200",
  CHECKED_OUT: "bg-slate-200 text-slate-700 border-slate-300",
  CANCELLED: "bg-rose-100 text-rose-700 border-rose-200",
  NO_SHOW: "bg-zinc-200 text-zinc-700 border-zinc-300",
  PAID: "bg-emerald-100 text-emerald-800 border-emerald-200",
  PARTIALLY_REFUNDED: "bg-teal-100 text-teal-800 border-teal-200",
  REFUNDED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  FAILED: "bg-rose-100 text-rose-700 border-rose-200",
  ACTIVE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  INACTIVE: "bg-slate-200 text-slate-700 border-slate-300",
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  HIDDEN: "bg-slate-200 text-slate-700 border-slate-300",
  CLEAN: "bg-emerald-100 text-emerald-800 border-emerald-200",
  DIRTY: "bg-rose-100 text-rose-700 border-rose-200",
  CLEANING: "bg-amber-100 text-amber-800 border-amber-200",
  INSPECTED: "bg-sky-100 text-sky-800 border-sky-200",
  OUT_OF_ORDER: "bg-zinc-200 text-zinc-700 border-zinc-300",
  OPEN: "bg-emerald-100 text-emerald-800 border-emerald-200",
  CLOSED: "bg-slate-200 text-slate-700 border-slate-300",
  BLOCKED: "bg-rose-100 text-rose-700 border-rose-200",
};

export const ROLE_LABELS: Record<string, { en: string; fr: string; ar: string }> = {
  SUPER_ADMIN: { en: "Super Admin", fr: "Super Admin", ar: "مدير عام" },
  ADMIN: { en: "Administrator", fr: "Administrateur", ar: "مدير" },
  MANAGER: { en: "Manager", fr: "Gérant", ar: "مشرف" },
  RECEPTIONIST: { en: "Receptionist", fr: "Réceptionniste", ar: "استقبال" },
  CUSTOMER: { en: "Customer", fr: "Client", ar: "عميل" },
};