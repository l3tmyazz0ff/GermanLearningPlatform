"use server";

import { createClient } from "@/lib/supabaseServer";
import { redirect } from 'next/navigation';

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  
  const supabase = await createClient();

  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login error:", error);
    return { error: error.message };
  }

  
  if (data.user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile not found for user:", data.user.id);
      return { error: "Profile not found. Please contact support." };
    }

    console.log("✅ Login successful! Role:", profile.role);

    if (profile.role === 'student') {
      redirect('/student/dashboard');
    } else if (profile.role === 'teacher') {
      redirect('/teacher/dashboard');
    }
  }
  
  return { error: "Unknown user role." };
}

