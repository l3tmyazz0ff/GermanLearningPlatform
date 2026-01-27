"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function teacherSignUp(prevState: any, formData: FormData) {
  // 1. Extract form data
  const first_name = formData.get("firstName") as string;
  const last_name = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const qualification = formData.get("qualification") as string;

  console.log("Starting teacher signup for:", email);

  // 2. Create a Supabase client for this Server Action
  const cookieStore = await cookies();
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
            // Ignore if setAll is called from a read-only context
          }
        },
      },
    }
  );
  
  // 3. Sign Up the user using Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { 
        first_name, 
        last_name, 
        role: 'teacher' 
      }
    }
  });

  if (authError) {
    console.error("Supabase Auth Error:", authError.message);
    return { error: authError.message };
  }

  const userId = authData.user?.id;


if (userId) {
    console.log("Teacher registered successfully via Auth!");

    // 2. UPDATE the teacher's profile in the 'profiles' table.
    //    We UPDATE because the row was already created by the Supabase Auth Trigger.
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        // Only update the extra fields that the trigger wouldn't set
        first_name: first_name, 
        last_name: last_name, 
        qualification: qualification,
        role: 'teacher', 
      })
      .eq('id', userId); // Crucial: Only update the row matching the new user's ID

    if (profileError) {
      console.error("Profile Update Error:", profileError.message);
      // NOTE: You should consider reverting the Auth if the profile update fails.
      return { error: profileError.message };
    }
    
    console.log("Teacher profile updated successfully!");
}

  redirect('/login');
}