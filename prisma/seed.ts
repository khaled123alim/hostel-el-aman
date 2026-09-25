import { PrismaClient, type ReservationStatus, type RoleName } from "@prisma/client";
import { IMG } from "../src/lib/constants";
import { hashPassword } from "../src/lib/auth";
import { genId } from "../src/lib/utils";

const prisma = new PrismaClient();

// Deterministic RNG so repeated seeds are identical
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

function day(offset: number, hour = 14, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

const FIRST = ["Yasmine", "Karim", "Sophie", "Nadia", "Omar", "Fatima", "Yusuf", "Imane", "Adam", "Mehdi", "Amira", "Ali", "Ines", "Salma", "Rayan", "Sofia", "Ilyes", "Nora", "Bilal", "Hawa", "Sarah", "Zakaria", "Elena", "Lina"];
const LAST = ["Benali", "Hamidi", "Durand", "Belkacem", "Haddad", "Bouzid", "Cherif", "Rahmani", "Bensalem", "Amrani", "Guediri", "Saidi", "Merabet", "Khelifi", "Traore", "Vidal", "Ait Ahmed", "Muller", "Rossi", "Alami", "Martin", "Moreau", "Nasser", "Bonnet"];
const COUNTRIES = ["Algeria", "France", "Morocco", "Spain", "Germany", "United Kingdom", "Italy", "Tunisia", "Canada", "Belgium", "Turkey", "Netherlands"];

const HOSTEL = {
  name: "Hostel El Aman",
  slug: "hostel-el-aman",
  city: "Douera",
  country: "Algeria",
  latitude: 36.7024,
  longitude: 2.9418,
  address: "Douera, Alger, Algeria",
  description:
    "مرقد الأمان — إقامة مريحة وآمنة في قلب الدواودة بولاية الجزائر. غرف نظيفة، إنترنت واي فاي مجاني، مطبخ مشترك، موقف سيارات وقرب من محطة النقل. لا دفع مسبق — احجز الآن وادفع عند الوصول.\n\nHostel El Aman — a comfortable and safe stay in Douera, Algiers. Clean rooms, free Wi-Fi, a shared kitchen, parking and easy access to public transport. No prepayment — reserve now, pay on arrival.",
  phone: "+213 5 55 00 00 00",
  email: "contact@hostelelaman.dz",
  website: "",
  imageCover: IMG.hostels[3],
  images: [IMG.hostels[3], IMG.rooms[1], IMG.rooms[2], IMG.rooms[7], IMG.hostels[6], IMG.travel[1]],
  amenities: ["Wi-Fi", "Breakfast", "Air conditioning", "Shared kitchen", "Parking", "Terrace", "Laundry", "24h reception"],
  houseRules: ["Check-in from 14:00", "Check-out by 12:00", "Quiet hours 22:00 – 08:00", "No smoking inside", "ID required at check-in", "No pets in shared rooms"],
  seoTitle: "Hostel El Aman — مرقد الأمان, Douera",
  metaDescription: "Book Hostel El Aman in Douera, Algiers: clean rooms, free Wi-Fi, shared kitchen and no prepayment. Reserve now and pay at the hostel.",
};

const ROOMS: Array<{
  type: "DORMITORY" | "PRIVATE" | "DOUBLE" | "TRIPLE" | "FAMILY";
  name: string;
  number: string;
  capacity: number;
  beds: number;
  bedType: "SINGLE" | "DOUBLE" | "BUNK";
  bath: "PRIVATE" | "SHARED" | "ENSUITE";
  price: number;
  description: string;
  amenities: string[];
}> = [
  { type: "DORMITORY", name: "6-Bed Mixed Dorm", number: "101", capacity: 6, beds: 3, bedType: "BUNK", bath: "SHARED", price: 1500, description: "A lively mixed dorm with comfortable bunks, personal lockers and reading lights.", amenities: ["Wi-Fi", "Lockers", "Reading lamp", "Air conditioning"] },
  { type: "DORMITORY", name: "4-Bed Female Dorm", number: "102", capacity: 4, beds: 2, bedType: "BUNK", bath: "SHARED", price: 1700, description: "A quiet female-only dorm with blackout curtains and ensuite access to the bathroom.", amenities: ["Wi-Fi", "Lockers", "Blackout curtains", "Air conditioning"] },
  { type: "PRIVATE", name: "Single Room", number: "201", capacity: 1, beds: 1, bedType: "SINGLE", bath: "SHARED", price: 2500, description: "A cosy private room with a desk, wardrobe and shared bathroom. Great for solo travellers.", amenities: ["Wi-Fi", "Desk", "Wardrobe", "Reading lamp"] },
  { type: "DOUBLE", name: "Double Room — Private Bath", number: "202", capacity: 2, beds: 1, bedType: "DOUBLE", bath: "PRIVATE", price: 4000, description: "A comfortable double with a private bathroom, mini fridge and towels included.", amenities: ["Wi-Fi", "Ensuite bathroom", "Mini fridge", "Towels"] },
  { type: "TRIPLE", name: "Triple Room", number: "203", capacity: 3, beds: 3, bedType: "SINGLE", bath: "ENSUITE", price: 5500, description: "Perfect for friends or families, with three single beds and an ensuite bathroom.", amenities: ["Wi-Fi", "Ensuite bathroom", "Air conditioning", "Wardrobe"] },
  { type: "FAMILY", name: "Family Room", number: "301", capacity: 4, beds: 2, bedType: "DOUBLE", bath: "PRIVATE", price: 7000, description: "A spacious family room with a double and two single beds plus a private bathroom.", amenities: ["Wi-Fi", "Ensuite bathroom", "Hairdryer", "Safe box"] },
];

const PROMOTIONS = [
  { name: "Weekend Deal", code: "WEEKEND15", type: "PERCENTAGE" as const, value: 15, minNights: 2 },
  { name: "Long Stay", code: "STAY7", type: "PERCENTAGE" as const, value: 25, minNights: 7 },
  { name: "Early Bird", code: "EARLY10", type: "PERCENTAGE" as const, value: 10, minNights: 3 },
];

const REVIEW_COMMENTS = [
  "ممتاز، استقبال رائع وغرف نظيفة. أنصح به بشدة.",
  "موقع ممتاز وسرير مريح. كنا نشعر وكأننا في بيتنا.",
  "أفضل مرقد أقمنا فيه — نظيف وآمن والطاقم ودود.",
  "Amazing atmosphere and spotless rooms. The staff went above and beyond!",
  "Très propre et très accueillant. Je recommande.",
  "Cozy dorms, strong Wi-Fi, and a great terrace.",
  "Parfait pour découvrir les alentours. Proche des transports.",
  "Clean, quiet and super friendly. The kitchen was well equipped.",
];

async function main() {
  console.log("🌱 Seeding Hostel El Aman — Douera …");

  // --- Roles & permissions ---
  const permissionDefs: { name: string; module: string; action: string }[] = [
    "dashboard", "reservations", "calendar", "hostels", "rooms", "availability",
    "customers", "payments", "reviews", "offers", "reports", "staff",
    "settings", "notifications", "audit", "housekeeping",
  ].flatMap((module) => ["view", "create", "edit", "delete", "moderate", "export", "manage"]
    .map((action) => ({ name: `${module}.${action}`, module, action })));

  const rolePermissions: Record<string, string[]> = {
    SUPER_ADMIN: permissionDefs.map((p) => p.name),
    ADMIN: permissionDefs.map((p) => p.name),
    MANAGER: permissionDefs.filter((p) => !["staff", "settings", "audit"].includes(p.module)).map((p) => p.name),
    RECEPTIONIST: permissionDefs.filter((p) => p.module === "reservations" || p.module === "calendar" || p.module === "customers" || (p.module === "housekeeping" && ["view", "edit"].includes(p.action)) || (p.module === "payments" && ["view"].includes(p.action))).map((p) => p.name),
    CUSTOMER: [],
  };

  const roleNames: RoleName[] = ["SUPER_ADMIN", "ADMIN", "MANAGER", "RECEPTIONIST", "CUSTOMER"];
  const roles: Record<string, string> = {};
  for (const name of roleNames) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, isSystem: true, description: `${name} role` },
    });
    roles[name] = role.id;
  }

  const permIdCache = new Map<string, string>();
  for (const def of permissionDefs) {
    const perm = await prisma.permission.upsert({ where: { name: def.name }, update: {}, create: def });
    permIdCache.set(def.name, perm.id);
  }
  for (const [roleName, perms] of Object.entries(rolePermissions)) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName as RoleName } });
    const ids = perms.map((p) => ({ id: permIdCache.get(p)! })).filter((x) => x.id);
    await prisma.role.update({ where: { id: role.id }, data: { permissions: { connect: ids } } });
  }

  // --- Settings ---
  const settingsRows = [
    { key: "site", value: { name: "Hostel El Aman", tagline: "Your quiet home in Douera — مرقد الأمان", logo: "/logo.png", favicon: "", contactEmail: "contact@hostelelaman.dz", phone: "+213 5 55 00 00 00", address: "Douera, Alger, Algeria", facebook: "", instagram: "", twitter: "", font: "jakarta" } },
    { key: "brand", value: { primary: "244 194 75", primaryDark: "193 129 28", accent: "193 129 28", accentDark: "2 1 1" } },
    { key: "general", value: { defaultCurrency: "DZD", supportedCurrencies: ["DZD"], defaultLocale: "ar", supportedLocales: ["ar", "fr", "en"], timezone: "Africa/Algiers", currencyRates: { base: "EUR", rates: { USD: 1.08, GBP: 0.86, DZD: 145.0 } } } },
    { key: "reservations", value: { autoConfirm: true, minNights: 1, maxNights: 30, maxGuestsPerRoom: 6, checkInDefault: "14:00", checkOutDefault: "12:00" } },
    { key: "payments", value: { payAtHostelEnabled: true, cardEnabled: false, stripeEnabled: false, taxRate: 10, currency: "DZD" } },
    { key: "tax", value: { rate: 10, label: "Taxes & fees", applyCleaningFee: true } },
    { key: "cancellation", value: { policy: "Flexible", freeUntilDays: 2, refundPercentage: 100, text: "Free cancellation up to 48 hours before check-in. No prepayment — pay at the hostel." } },
    { key: "emails", value: { enabled: false, cc: "", ownerEmail: "contact@hostelelaman.dz" } },
    { key: "notifications", value: { bookingCreated: true, paymentReceived: true, checkinReminder: true } },
    { key: "map", value: { provider: "osm", token: "" } },
    { key: "seo", value: { title: "Hostel El Aman — مرقد الأمان, Douera", description: "A comfortable, safe hostel in Douera, Algiers. Clean rooms, free Wi-Fi, no prepayment. Reserve now and pay at the hostel." } },
  ];
  for (const row of settingsRows) {
    await prisma.setting.upsert({ where: { key: row.key }, update: { value: row.value as any }, create: { key: row.key, value: row.value as any, group: "general" } });
  }

  // --- Email templates ---
  const tpl = (subject: string, body: string) => ({ subject, body });
  const btn = "#020101";
  const gold = "#F4C24B";
  const templates: Array<{ key: string; subject: string; body: string }> = [
    { key: "welcome", ...tpl("Welcome to {{siteName}}!", `<h1>Welcome, {{firstName}}!</h1><p>Thanks for creating an account with <strong>{{siteName}}</strong>. You can now book your stay and view your reservations at any time.</p><p><a href="{{appUrl}}" style="display:inline-block;background:${btn};color:${gold};padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Start exploring</a></p>`) },
    { key: "verify_email", ...tpl("Verify your email address", `<h1>Verify your email</h1><p>Hi {{firstName}}, please confirm your email address to activate your account.</p><p><a href="{{verifyUrl}}" style="display:inline-block;background:${btn};color:${gold};padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Verify email</a></p><p>This link expires in 24 hours.</p>`) },
    { key: "reset_password", ...tpl("Reset your password", `<h1>Password reset</h1><p>Hi {{firstName}}, we received a request to reset your password.</p><p><a href="{{resetUrl}}" style="display:inline-block;background:${btn};color:${gold};padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Reset password</a></p><p>This link expires in 1 hour.</p>`) },
    { key: "reservation_confirmed", ...tpl("Reservation confirmed — {{reservationNumber}}", `<h1>You're booked, {{firstName}}!</h1><p>Your reservation <strong>{{reservationNumber}}</strong> at <strong>{{hostelName}}</strong> is confirmed. No prepayment required — you pay at the hostel.</p><table cellpadding="6"><tr><td>Room</td><td>{{roomName}}</td></tr><tr><td>Check-in</td><td>{{checkIn}}</td></tr><tr><td>Check-out</td><td>{{checkOut}}</td></tr><tr><td>Guests</td><td>{{guests}}</td></tr><tr><td>Total (paid on-site)</td><td>{{total}}</td></tr></table><p><a href="{{detailsUrl}}" style="display:inline-block;background:${btn};color:${gold};padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">View reservation</a></p>`) },
    { key: "payment_received", ...tpl("Payment received — {{reservationNumber}}", `<h1>Thank you for your payment!</h1><p>We received your payment of <strong>{{amount}}</strong> for reservation <strong>{{reservationNumber}}</strong>.</p><p>See you soon at {{hostelName}}!</p>`) },
    { key: "reservation_cancelled", ...tpl("Reservation cancelled — {{reservationNumber}}", `<h1>Reservation cancelled</h1><p>Your reservation <strong>{{reservationNumber}}</strong> at <strong>{{hostelName}}</strong> has been cancelled.</p><p>{{reason}}</p><p>We hope to host you another time.</p>`) },
    { key: "checkin_reminder", ...tpl("You check in tomorrow!", `<h1>Check-in reminder</h1><p>Hi {{firstName}}, you check in to <strong>{{hostelName}}</strong> tomorrow at {{checkInTime}}.</p><p>Reservation: {{reservationNumber}} · Room: {{roomName}}</p>`) },
    { key: "checkout_reminder", ...tpl("Your stay ends tomorrow", `<h1>Check-out reminder</h1><p>Hi {{firstName}}, your stay at <strong>{{hostelName}}</strong> ends tomorrow. Check-out is at {{checkOutTime}}.</p><p>Reservation: {{reservationNumber}}</p>`) },
    { key: "reservation_new_owner", ...tpl("New reservation — {{reservationNumber}} · {{firstName}} {{lastName}}", `<h1 style="color:${btn}">New reservation received</h1><p>A guest just booked <strong>{{roomName}}</strong> at {{hostelName}}.</p><table cellpadding="6"><tr><td>Guest</td><td>{{firstName}} {{lastName}}</td></tr><tr><td>Check-in</td><td>{{checkIn}}</td></tr><tr><td>Check-out</td><td>{{checkOut}}</td></tr><tr><td>Guests</td><td>{{guests}}</td></tr><tr><td>Phone</td><td>{{phone}}</td></tr><tr><td>Total (paid on-site)</td><td>{{total}}</td></tr></table><p>Special requests: {{specialRequests}}</p><p><a href="{{detailsUrl}}" style="display:inline-block;background:${btn};color:${gold};padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Open reservation</a></p>`) },
    { key: "reservation_cancelled_owner", ...tpl("Reservation cancelled — {{reservationNumber}}", `<h1 style="color:${btn}">A reservation was cancelled</h1><p><strong>{{firstName}} {{lastName}}</strong> cancelled reservation <strong>{{reservationNumber}}</strong>.</p><table cellpadding="6"><tr><td>Room</td><td>{{roomName}}</td></tr><tr><td>Check-in</td><td>{{checkIn}}</td></tr><tr><td>Check-out</td><td>{{checkOut}}</td></tr><tr><td>Reason</td><td>{{reason}}</td></tr></table><p>Market the room again and update availability if needed.</p>`) },
  ];
  const locales = ["en", "fr", "ar"];
  for (const t of templates) {
    for (const locale of locales) {
      await prisma.emailTemplate.upsert({
        where: { key_locale: { key: t.key, locale } },
        update: { subject: t.subject, body: t.body },
        create: { key: t.key, locale, subject: t.subject, body: t.body },
      });
    }
  }

  // --- Users ---
  const ownerPassword = process.env.SEED_ADMIN_PASSWORD ?? "Owner@12345";
  await prisma.user.upsert({
    where: { email: "owner@hostelelaman.dz" },
    update: { roleId: roles.ADMIN },
    create: { email: "owner@hostelelaman.dz", passwordHash: hashPassword(ownerPassword), emailVerified: true, firstName: "El Aman", lastName: "Hostel", phone: HOSTEL.phone, country: "Algeria", roleId: roles.ADMIN },
  });
  // legacy demo admin kept for convenience
  await prisma.user.upsert({
    where: { email: "admin@stayhub.com" },
    update: { roleId: roles.ADMIN },
    create: { email: "admin@stayhub.com", passwordHash: hashPassword("Admin@12345"), emailVerified: true, firstName: "Amin", lastName: "Khaldi", phone: "+213 555 010 101", country: "Algeria", roleId: roles.ADMIN },
  });

  const customerIds: string[] = [];
  const customers: { id: string; email: string; currency: string; locale: string }[] = [];
  for (let i = 0; i < 30; i++) {
    const firstName = FIRST[int(0, FIRST.length - 1)];
    const lastName = LAST[int(0, LAST.length - 1)];
    const country = pick(COUNTRIES);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}@demo.hostelelaman.dz`;
    const customer = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: hashPassword("Customer@123"),
        emailVerified: i % 4 !== 0,
        firstName,
        lastName,
        phone: `+213 ${String(int(500000000, 799999999))}`,
        country,
        locale: pick(["ar", "ar", "fr", "en"]),
        currency: "DZD",
        roleId: roles.CUSTOMER,
        createdAt: day(-int(30, 400)),
      },
    });
    customerIds.push(customer.id);
    customers.push(customer);
  }
  console.log("  staff + customers created");

  // --- Hostel & rooms ---
  const existingHostel = await prisma.hostel.findUnique({ where: { slug: HOSTEL.slug } });
  const hostel =
    existingHostel ??
    (await prisma.hostel.create({
      data: {
        name: HOSTEL.name, slug: HOSTEL.slug, description: HOSTEL.description, address: HOSTEL.address,
        city: HOSTEL.city, country: HOSTEL.country, latitude: HOSTEL.latitude, longitude: HOSTEL.longitude,
        phone: HOSTEL.phone, email: HOSTEL.email, website: HOSTEL.website, imageCover: HOSTEL.imageCover,
        images: HOSTEL.images, houseRules: HOSTEL.houseRules, seoTitle: HOSTEL.seoTitle,
        metaDescription: HOSTEL.metaDescription,
      },
    }));
  await prisma.hostelAmenity.deleteMany({ where: { hostelId: hostel.id } });
  for (const a of HOSTEL.amenities) {
    await prisma.hostelAmenity.upsert({
      where: { id: `${hostel.id}-${a}` },
      update: {},
      create: { id: `${hostel.id}-${a}`, hostelId: hostel.id, name: a },
    });
  }

  const roomIds: string[] = [];
  for (const def of ROOMS) {
    const existingRoom = await prisma.room.findFirst({ where: { number: def.number, hostelId: hostel.id } });
    const room = existingRoom ?? await prisma.room.create({
      data: {
        hostelId: hostel.id,
        name: def.name,
        number: def.number,
        type: def.type,
        description: def.description,
        capacity: def.capacity,
        beds: def.beds,
        bedType: def.bedType,
        bathroomType: def.bath,
        pricePerNight: def.price,
        cleaningFee: 200,
        taxRate: 10,
        images: [IMG.rooms[ROOMS.indexOf(def)]],
        minStay: 1,
        maxStay: 30,
        housekeepingStatus: "CLEAN",
      },
    });
    await prisma.roomAmenity.deleteMany({ where: { roomId: room.id } });
    for (const a of def.amenities) {
      await prisma.roomAmenity.upsert({
        where: { id: `${room.id}-${a}` },
        update: {},
        create: { id: `${room.id}-${a}`, roomId: room.id, name: a },
      });
    }
    roomIds.push(room.id);
  }
  // a couple of blocked days for realism
  await prisma.roomAvailability.upsert({
    where: { roomId_date: { roomId: roomIds[0], date: day(4) } },
    update: {},
    create: { roomId: roomIds[0], date: day(4), status: "BLOCKED", reason: "Maintenance" },
  });
  await prisma.roomAvailability.upsert({
    where: { roomId_date: { roomId: roomIds[3], date: day(12) } },
    update: {},
    create: { roomId: roomIds[3], date: day(12), status: "CLOSED", reason: "Renovation" },
  });
  console.log("  hostel + rooms created");

  // --- Promotions ---
  for (const p of PROMOTIONS) {
    await prisma.promotion.upsert({
      where: { code: p.code },
      update: {},
      create: {
        name: p.name, code: p.code, type: p.type, value: p.value ?? 0, fixedDiscount: 0,
        minNights: p.minNights, maxUses: null, startDate: day(-60), endDate: day(180),
        applicableHostels: "[]", applicableRooms: "[]", status: "ACTIVE",
      },
    });
  }

  // --- Reservations ---
  const allRooms = await prisma.room.findMany({ where: { hostelId: hostel.id }, include: { hostel: true } });
  const roomWindows = new Map<string, Array<{ in: Date; out: Date }>>();
  for (const r of allRooms) roomWindows.set(r.id, []);
  const existingBooking = (roomId: string, checkIn: Date, checkOut: Date) =>
    roomWindows.get(roomId)!.some((w) => checkIn < w.out && checkOut > w.in);

  const resos: Array<{ customerId: string; roomId: string; checkIn: Date; checkOut: Date; guests: number; status: ReservationStatus; source: string; specialRequest?: string }> = [];

  // bookings happening now
  resos.push({ customerId: pick(customerIds), roomId: roomIds[0], checkIn: day(0, 14), checkOut: day(3, 11), guests: 2, status: "CONFIRMED", source: "WEB" });
  roomWindows.get(roomIds[0])!.push({ in: day(0, 14), out: day(3, 11) });
  resos.push({ customerId: pick(customerIds), roomId: roomIds[3], checkIn: day(-2, 14), checkOut: day(2, 11), guests: 2, status: "CHECKED_IN", source: "WEB" });
  roomWindows.get(roomIds[3])!.push({ in: day(-2, 14), out: day(2, 11) });

  const today = new Date();
  for (let i = 0; i < 48; i++) {
    const room = allRooms[int(0, allRooms.length - 1)];
    const nights = int(1, 5);
    const offset = int(-260, 30);
    const checkIn = day(offset, 14);
    const checkOut = day(offset + nights, 11);
    if (existingBooking(room.id, checkIn, checkOut)) continue;
    const today0 = new Date(today); today0.setHours(0, 0, 0, 0);
    let status: ReservationStatus;
    if (checkIn < today0) status = checkOut < today0 ? "CHECKED_OUT" : "CHECKED_IN";
    else status = int(0, 9) === 0 ? "PENDING" : "CONFIRMED";
    const roll = rand();
    if (roll < 0.06 && checkIn > today0) status = "CANCELLED";
    if (roll > 0.97 && checkIn < today0) status = "NO_SHOW";
    const guestCount = int(1, Math.min(room.capacity, room.type === "DORMITORY" ? 6 : 2));
    resos.push({
      customerId: pick(customerIds),
      roomId: room.id,
      checkIn,
      checkOut,
      guests: guestCount,
      status,
      source: pick(["WEB", "WEB", "WEB", "PHONE", "WALK_IN"]),
      specialRequest: rand() < 0.2 ? "Early check-in appreciated if possible." : undefined,
    });
    roomWindows.get(room.id)!.push({ in: checkIn, out: checkOut });
  }

  for (const r of resos) {
    const room = allRooms.find((x) => x.id === r.roomId)!;
    const nights = Math.round((r.checkOut.getTime() - r.checkIn.getTime()) / 86400000);
    const subtotal = room.pricePerNight * nights;
    const taxes = Math.round(subtotal * 0.1 * 100) / 100;
    const fees = room.cleaningFee;
    const total = Math.round((subtotal + taxes + fees) * 100) / 100;
    const isCancelled = r.status === "CANCELLED" || r.status === "NO_SHOW";
    const paid = !isCancelled && r.checkOut < new Date();

    const reservation = await prisma.reservation.create({
      data: {
        number: genId("RS", 6),
        customerId: r.customerId,
        hostelId: room.hostelId,
        roomId: room.id,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        nights,
        roomsCount: 1,
        guests: r.guests,
        pricePerNight: room.pricePerNight,
        subtotal,
        taxes,
        fees,
        discount: 0,
        total,
        currency: "DZD",
        status: r.status,
        paymentStatus: paid ? "PAID" : "PENDING",
        paymentMethod: "PAY_AT_HOSTEL",
        specialRequests: r.specialRequest,
        bookingSource: r.source as any,
        checkInCode: genId("KEY", 4),
        checkedInAt: r.status === "CHECKED_IN" || r.status === "CHECKED_OUT" ? r.checkIn : null,
        checkedOutAt: r.status === "CHECKED_OUT" ? r.checkOut : null,
        cancelledAt: isCancelled ? r.checkIn : null,
        cancelReason: r.status === "CANCELLED" ? "Guest requested cancellation" : r.status === "NO_SHOW" ? "Guest did not arrive" : null,
        createdAt: day(Math.round((r.checkIn.getTime() - new Date().getTime()) / 86400000) - int(15, 50)),
      },
    });

    await prisma.payment.create({
      data: {
        reservationId: reservation.id,
        customerId: r.customerId,
        amount: total,
        currency: "DZD",
        method: "PAY_AT_HOSTEL",
        provider: null,
        transactionId: null,
        cardLast4: null,
        status: paid ? "PAID" : isCancelled ? "PENDING" : "PENDING",
        paidAt: paid ? r.checkOut : null,
      },
    });

    await prisma.reservationHistory.createMany({
      data: [
        { reservationId: reservation.id, action: "CREATED", detail: `Reservation created (source: ${r.source})`, createdAt: reservation.createdAt },
        ...(r.status === "CHECKED_IN" ? [{ reservationId: reservation.id, action: "CHECKED_IN", detail: "Guest checked in", createdAt: r.checkIn }] : []),
        ...(r.status === "CHECKED_OUT" ? [{ reservationId: reservation.id, action: "CHECKED_OUT", detail: "Guest checked out", createdAt: r.checkOut }] : []),
        ...(isCancelled ? [{ reservationId: reservation.id, action: "CANCELLED", detail: r.status === "NO_SHOW" ? "Guest did not arrive" : "Guest requested cancellation", createdAt: r.checkIn }] : []),
      ] as any,
    });
  }
  console.log(`  ${resos.length} reservations created`);

  // --- Reviews (idempotent for this hostel) ---
  await prisma.review.deleteMany({ where: { hostelId: hostel.id } });
  const checkedOut = await prisma.reservation.findMany({ where: { status: "CHECKED_OUT" }, include: { customer: true } });
  let reviewCount = 0;
  for (const res of checkedOut) {
    if (rand() < 0.45) continue;
    const overall = int(3, 5);
    const offset = (n: number) => Math.max(1, Math.min(5, overall + int(-1, 1)));
    await prisma.review.create({
      data: {
        reservationId: res.id,
        hostelId: hostel.id,
        userId: res.customerId,
        rating: overall,
        comment: pick(REVIEW_COMMENTS),
        cleanliness: offset(1), location: offset(2), staff: offset(3), comfort: offset(4), facilities: offset(5),
        status: pick(["APPROVED", "APPROVED", "APPROVED", "PENDING"] as const),
        createdAt: res.checkOut,
      },
    });
    reviewCount++;
  }
  const agg = await prisma.review.aggregate({ where: { hostelId: hostel.id, status: "APPROVED" }, _avg: { rating: true }, _count: true });
  await prisma.hostel.update({ where: { id: hostel.id }, data: { ratingAvg: Number((agg._avg.rating ?? 0).toFixed(1)), reviewCount: agg._count } });
  console.log(`  ${reviewCount} reviews created`);

  // --- Notifications ---
  for (const c of customers.slice(0, 10)) {
    await prisma.notification.create({
      data: { userId: c.id, type: "SUCCESS", title: "Welcome to Hostel El Aman!", content: "Thanks for joining — book your stay with no prepayment.", link: "/rooms" },
    });
  }
  const ownerUser = await prisma.user.findUniqueOrThrow({ where: { email: "owner@hostelelaman.dz" } });
  await prisma.notification.create({
    data: { userId: ownerUser.id, type: "INFO", title: "Reservation alerts are on", content: "You'll receive an email for every new reservation. Configure SMTP in Settings to enable real delivery.", link: "/admin/settings" },
  });

  await prisma.auditLog.create({
    data: { actorName: "System", action: "SEED", objectType: "system", detail: "Hostel El Aman database seeded" },
  });

  console.log("✅ Seed complete.");
  console.log("\nLogins:");
  console.log("  Owner:  owner@hostelelaman.dz / " + ownerPassword + "   (receives reservation emails)");
  console.log("  Admin:  admin@stayhub.com    / Admin@12345");
  console.log(`  Customer: ${customers[0]?.email ?? "sophie.…@demo.hostelelaman.dz"} / Customer@123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());