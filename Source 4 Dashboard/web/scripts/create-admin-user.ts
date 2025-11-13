// scripts/create-admin-user.ts
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: "tgrassmick@gmail.com",
    password: "Grassmick1",
    email_confirm: true,
    user_metadata: { role: "admin" },
    app_metadata: { role: "admin" },
  });

  if (error) {
    console.error("Failed to create user:", error);
    process.exit(1);
  }

  console.log("Created user:", data.user?.id);
}

main();
