// scripts/test-login.ts
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testLogin() {
  console.log("Testing login with:");
  console.log("Email: tgrassmick@gmail.com");
  console.log("Password: Grassmick1");
  console.log("");

  const { data, error } = await supabase.auth.signInWithPassword({
    email: "tgrassmick@gmail.com",
    password: "Grassmick1",
  });

  if (error) {
    console.error("❌ Login failed:", error.message);
    console.error("Error code:", error.status);
    process.exit(1);
  }

  console.log("✅ Login successful!");
  console.log("User ID:", data.user?.id);
  console.log("Email:", data.user?.email);
  console.log("Role:", data.user?.user_metadata?.role || data.user?.app_metadata?.role);

  // Sign out
  await supabase.auth.signOut();
}

testLogin();
