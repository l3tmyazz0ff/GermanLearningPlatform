"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function studentSignUp(prevState: any, formData: FormData) {
  const first_name = formData.get("firstName") as string;
  const last_name = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const german_level = formData.get("level") as string;
  console.log("Starting student signup for:", email);

  // 1. Get the cookie store (Next.js 15+ requires await)
  const cookieStore = await cookies();

  // 2. Create a temporary Supabase client for this request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // This ignores errors if called from a Server Component,
            // but in a Server Action, it successfully sets the cookie.
          }
        },
      },
    }
  );

  // 3. Sign up using this new client
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name,
        last_name,
        role: "student",
        german_level: german_level,
      },
    },
  });

  if (authError) {
    console.error("Supabase Auth Error:", authError.message);
    return { error: authError.message };
  }

  const userId = authData.user?.id;

  if (userId) {
    console.log("Student registered successfully via Auth Trigger!");
  }

  // 4. Redirect on success
  redirect("/login");
}