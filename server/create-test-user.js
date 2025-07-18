import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log("Creating test user...");

    const user = await prisma.user.create({
      data: {
        email: "ritesh@test.com",
        username: "ritesh",
        fullName: "Ritesh Kumar",
        bio: "Test user for API testing",
        role: "USER",
        isEmailVerified: true,
        isActive: true,
        emailVerificationToken: crypto.randomBytes(32).toString("hex"),
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    console.log("✅ User created successfully:", {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
    });
  } catch (error) {
    if (error.code === "P2002") {
      console.log("⚠️  User already exists, checking if ritesh exists...");

      const existingUser = await prisma.user.findUnique({
        where: { username: "ritesh" },
      });

      if (existingUser) {
        console.log("✅ User ritesh already exists:", {
          id: existingUser.id,
          username: existingUser.username,
          email: existingUser.email,
          fullName: existingUser.fullName,
        });
      }
    } else {
      console.error("❌ Error creating user:", error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
