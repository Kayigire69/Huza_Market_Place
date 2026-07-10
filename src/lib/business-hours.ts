import { prisma } from "./prisma";

/** Default operating hours: 6:00 AM – 9:00 PM */
export async function getBusinessStatus(now = new Date()) {
  const emergency = await prisma.emergencyClosure.findFirst({
    where: {
      isActive: true,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
    },
  });

  if (emergency) {
    return {
      isOpen: false,
      reason: emergency.reason,
      canBrowse: true,
      canCheckout: false,
      scheduleNextDay: true,
    };
  }

  const holiday = await prisma.holiday.findFirst({
    where: {
      date: new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())),
      isClosed: true,
    },
  });

  if (holiday) {
    return {
      isOpen: false,
      reason: holiday.name,
      canBrowse: true,
      canCheckout: false,
      scheduleNextDay: true,
    };
  }

  const day = now.getDay();
  const hours = await prisma.businessHours.findFirst({ where: { dayOfWeek: day } });
  const openHour = hours?.openHour ?? 6;
  const closeHour = hours?.closeHour ?? 21;
  const closed = hours?.isClosed ?? false;
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const isOpen = !closed && currentHour >= openHour && currentHour < closeHour;

  return {
    isOpen,
    reason: isOpen ? null : "Outside business hours (6:00 AM – 9:00 PM)",
    canBrowse: true,
    canCheckout: isOpen,
    scheduleNextDay: !isOpen,
    openHour,
    closeHour,
  };
}
