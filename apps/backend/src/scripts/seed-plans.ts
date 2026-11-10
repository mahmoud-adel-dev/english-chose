import { prisma } from "../lib/prisma";

export const SUBSCRIPTION_TIERS = [
  {
    name: "FREE",
    maxDailyQuestions: 10,
    maxDailySessions: 1,
    maxAudioMinutesDay: 5.0,
    maxAttemptsPerItem: 2,
    requestsPerMinute: 10,
    priceMonthlyEgp: 0,
    priceYearlyEgp: 0,
    description: "تجربة مجانية لمدة 6 أيام لجميع خدمات المدرب الذكي والتقييم الفوري",
    badge: "تجربة 6 أيام",
    isActive: true,
  },
  {
    name: "BASIC",
    maxDailyQuestions: 25,
    maxDailySessions: 3,
    maxAudioMinutesDay: 15.0,
    maxAttemptsPerItem: 3,
    requestsPerMinute: 25,
    priceMonthlyEgp: 300,
    priceYearlyEgp: 2880, // 240/mo (20% discount)
    description: "للمتعلمين المبتدئين والاستخدام اليومي الخفيف وبناء الأساسيات",
    badge: "الأساسية",
    isActive: true,
  },
  {
    name: "PRO",
    maxDailyQuestions: 60,
    maxDailySessions: 6,
    maxAudioMinutesDay: 30.0,
    maxAttemptsPerItem: 5,
    requestsPerMinute: 40,
    priceMonthlyEgp: 500,
    priceYearlyEgp: 4500, // 375/mo (25% discount)
    description: "الخيار الأفضل للتقدم السريع والممارسة اليومية المكثفة والمحادثة الحية",
    badge: "الأكثر اختياراً ⭐",
    isActive: true,
  },
  {
    name: "PREMIUM",
    maxDailyQuestions: 150,
    maxDailySessions: 15,
    maxAudioMinutesDay: 60.0,
    maxAttemptsPerItem: 10,
    requestsPerMinute: 60,
    priceMonthlyEgp: 750,
    priceYearlyEgp: 6300, // 525/mo (30% discount)
    description: "للمحترفين والطلاب الراغبين في طلاقة كاملة بدون أي قيود",
    badge: "VIP بلا حدود",
    isActive: true,
  },
];

async function seedPlans() {
  console.log("Seeding / updating subscription plans in Neon DB...");
  for (const tier of SUBSCRIPTION_TIERS) {
    const upserted = await prisma.quotaTier.upsert({
      where: { name: tier.name },
      update: tier,
      create: tier,
    });
    console.log(`✓ Tier ${upserted.name}: Monthly=${upserted.priceMonthlyEgp} EGP, Yearly=${upserted.priceYearlyEgp} EGP`);
  }
  console.log("Done seeding subscription tiers.");
}

if (require.main === module) {
  seedPlans()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}

export { seedPlans };
