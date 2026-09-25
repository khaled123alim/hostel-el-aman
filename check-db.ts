import { PrismaClient } from "@prisma/client";
async function main() {
  const p = new PrismaClient();
  const customers = await p.user.count({ where: { role: { name: "CUSTOMER" }, status: "ACTIVE" } });
  const hostels = await p.hostel.count();
  const rooms = await p.room.count({ where: { status: "ACTIVE" } });
  const allUsers = await p.user.count();
  const sample = await p.user.findMany({
    where: { role: { name: "CUSTOMER" } },
    take: 5,
    select: { firstName: true, lastName: true, email: true, status: true, role: { select: { name: true } } },
  });
  console.log(JSON.stringify({ customers, hostels, rooms, allUsers, sample }, null, 2));
  await p.$disconnect();
}
main();