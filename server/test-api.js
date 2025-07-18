import fetch from "node-fetch";

const BASE_URL = "http://13.203.209.54";

async function testAPI() {
  try {
    console.log("🧪 Testing NuttyFans API...\n");

    // Test 1: Health endpoint
    console.log("1️⃣ Testing health endpoint...");
    try {
      const healthResponse = await fetch(`${BASE_URL}/health`);
      const healthData = await healthResponse.json();
      console.log("✅ Health response:", healthData);
    } catch (error) {
      console.log("❌ Health endpoint failed:", error.message);
    }

    // Test 2: Users endpoint
    console.log("\n2️⃣ Testing users endpoint...");
    try {
      const usersResponse = await fetch(`${BASE_URL}/api/users/ritesh`);
      const usersData = await usersResponse.json();
      console.log("✅ Users response:", usersData);
    } catch (error) {
      console.log("❌ Users endpoint failed:", error.message);
    }

    // Test 3: Auth endpoint
    console.log("\n3️⃣ Testing auth endpoint...");
    try {
      const authResponse = await fetch(`${BASE_URL}/api/auth/me`);
      const authData = await authResponse.json();
      console.log("✅ Auth response:", authData);
    } catch (error) {
      console.log("❌ Auth endpoint failed:", error.message);
    }

    // Test 4: Posts endpoint
    console.log("\n4️⃣ Testing posts endpoint...");
    try {
      const postsResponse = await fetch(`${BASE_URL}/api/posts`);
      const postsData = await postsResponse.json();
      console.log("✅ Posts response:", postsData);
    } catch (error) {
      console.log("❌ Posts endpoint failed:", error.message);
    }

    console.log("\n🎉 API testing completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testAPI();
