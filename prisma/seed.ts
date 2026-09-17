import { PrismaClient, UserRole, TeeTimeStatus, ReservationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Gualph123!', 10);
  const course = await prisma.course.upsert({
    where: { slug: 'evergreen-demo' },
    update: {},
    create: { name: 'Evergreen Demo Golf Club', slug: 'evergreen-demo', address: '100 Fairway Dr', city: 'New Albany', state: 'IN', zip: '47150', phone: '812-555-0100', holes: 18 }
  });
  await prisma.user.upsert({ where: { email: 'admin@gualph.local' }, update: {}, create: { email: 'admin@gualph.local', passwordHash, firstName: 'Gualph', lastName: 'Admin', role: UserRole.SUPER_ADMIN }});
  await prisma.user.upsert({ where: { email: 'course@gualph.local' }, update: {}, create: { email: 'course@gualph.local', passwordHash, firstName: 'Course', lastName: 'Operator', role: UserRole.COURSE_ADMIN, courseId: course.id }});
  const players = await Promise.all(['Hunt Hendon','Jamie Smith','Kathryn Brown'].map((name, i) => {
    const [firstName, lastName] = name.split(' ');
    return prisma.player.create({ data: { courseId: course.id, firstName, lastName, email: `player${i+1}@example.com`, phone: `812-555-010${i+1}` }});
  }));
  const today = new Date(); today.setHours(7,0,0,0);
  for (let i=0;i<24;i++) {
    const startTime = new Date(today.getTime() + i*10*60*1000);
    await prisma.teeTime.create({ data: { courseId: course.id, startTime, playersAllowed: 4, greenFeeCents: 4500, cartFeeCents: 1800, status: TeeTimeStatus.AVAILABLE }});
  }
  const first = await prisma.teeTime.findFirstOrThrow({ where: { courseId: course.id, status: TeeTimeStatus.AVAILABLE }});
  await prisma.reservation.create({ data: { teeTimeId: first.id, playerId: players[0].id, partySize: 4, status: ReservationStatus.BOOKED, totalCents: 25200, confirmationCode: 'GUALPH-DEMO-1' }});
  await prisma.teeTime.update({ where: { id: first.id }, data: { status: TeeTimeStatus.RESERVED }});
}
main().finally(() => prisma.$disconnect());
