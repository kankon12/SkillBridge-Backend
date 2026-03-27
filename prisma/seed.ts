import { PrismaClient } from "@prisma/client";
import { auth } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log(" Seeding database...");

  // ─── Categories ───
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "mathematics" },
      update: {},
      create: { name: "Mathematics", slug: "mathematics", icon: "📐", description: "Algebra, Calculus, Statistics" },
    }),
    prisma.category.upsert({
      where: { slug: "programming" },
      update: {},
      create: { name: "Programming", slug: "programming", icon: "💻", description: "Web Dev, Python, DSA" },
    }),
    prisma.category.upsert({
      where: { slug: "languages" },
      update: {},
      create: { name: "Languages", slug: "languages", icon: "🌍", description: "English, French, Spanish" },
    }),
    prisma.category.upsert({
      where: { slug: "science" },
      update: {},
      create: { name: "Science", slug: "science", icon: "🔬", description: "Physics, Chemistry, Biology" },
    }),
    prisma.category.upsert({
      where: { slug: "design" },
      update: {},
      create: { name: "Design", slug: "design", icon: "🎨", description: "UI/UX, Graphic Design" },
    }),
  ]);

  console.log(` Created ${categories.length} categories`);

  // ─── Admin User ───────────────────────────────────────────────────────────
  const adminEmail = "admin@skillbridge.com";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    
    await auth.api.signUpEmail({
      body: {
        name: "Admin",
        email: adminEmail,
        password: "Admin@123456",
      },
    });

    // Set role to ADMIN
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "ADMIN", emailVerified: true },
    });

    console.log(" Admin user created: admin@skillbridge.com / Admin@123456");
  } else {
    console.log("  Admin already exists, skipping...");
  }

  //  Demo Tutor 
  const tutorEmail = "tutor@skillbridge.com";
  const existingTutor = await prisma.user.findUnique({ where: { email: tutorEmail } });

  if (!existingTutor) {
    await auth.api.signUpEmail({
      body: {
        name: "John Tutor",
        email: tutorEmail,
        password: "Tutor@123456",
      },
    });

    const tutor = await prisma.user.update({
      where: { email: tutorEmail },
      data: { role: "TUTOR", emailVerified: true },
    });

    await prisma.tutorProfile.create({
      data: {
        userId: tutor.id,
        bio: "Experienced software engineer with 5+ years of teaching experience.",
        headline: "Full-Stack Developer & Programming Tutor",
        hourlyRate: 25,
        experience: 5,
        
        languages: ["English", "Bengali"],
        isVerified: true,
        categoryId: categories[1].id, 
        availability: {
          create: [
            { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
            { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
            { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
            { dayOfWeek: 4, startTime: "09:00", endTime: "17:00" },
            { dayOfWeek: 5, startTime: "09:00", endTime: "13:00" },
          ],
        },
      },
    });

    console.log(" Demo tutor created: tutor@skillbridge.com / Tutor@123456");
  }

  console.log(" Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });