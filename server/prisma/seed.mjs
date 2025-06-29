import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
async function main() {
  // Create users
  const john = await prisma.user.create({
    data: {
      email: "john.doe@example.com",
      username: "john_doe",
      password: "hashed_password_123",
      fullName: "John Doe",
      bio: "Photographer and storyteller.",
      avatarUrl: "https://picsum.photos/seed/john/200",
      coverUrl: "https://picsum.photos/seed/johncover/600/200",
      role: "CREATOR",
      isEmailVerified: true,
      isActive: true,
    },
  });

  const jane = await prisma.user.create({
    data: {
      email: "jane.smith@example.com",
      username: "jane_smith",
      password: "hashed_password_456",
      fullName: "Jane Smith",
      bio: "Tech enthusiast and blogger.",
      avatarUrl: "https://picsum.photos/seed/jane/200",
      coverUrl: "https://picsum.photos/seed/janecover/600/200",
      role: "USER",
      isEmailVerified: true,
      isActive: true,
    },
  });

  // Create categories
  const photography = await prisma.category.create({
    data: {
      name: "Photography",
      slug: "photography",
    },
  });

  const tech = await prisma.category.create({
    data: {
      name: "Tech",
      slug: "tech",
    },
  });

  // Create creator profile for John
  const creatorProfile = await prisma.creatorProfile.create({
    data: {
      userId: john.id,
      monthlyPrice: 9.99,
      squareAccountId: "square_acc_001",
      squareLocationId: "loc_001",
      isVerified: true,
      socialLinks: {
        twitter: "https://twitter.com/john_doe",
        instagram: "https://instagram.com/john_doe",
      },
      categories: {
        connect: [{ id: photography.id }],
      },
    },
  });

  // Create posts by John
  await prisma.post.createMany({
    data: [
      {
        userId: john.id,
        title: "Exploring the Himalayas",
        content: "Check out my recent trip to the mountains!",
        isPremium: false,
        mediaUrls: ["https://picsum.photos/id/1018/400/300"],
        mediaType: ["IMAGE"],
        isArchived: false,
      },
      {
        userId: john.id,
        title: "Photography Tips for Beginners",
        content: "Here are some quick tips to improve your photography.",
        isPremium: true,
        price: 2.99,
        mediaUrls: ["https://picsum.photos/id/1024/400/300"],
        mediaType: ["IMAGE"],
        isArchived: false,
      },
    ],
  });
}

main()
  .then(() => {
    console.log("✅ Seeding completed.");
  })
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
