"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { login } from "./actions"; 

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button 
      className="w-full text-lg py-5 mt-6 bg-blue-600 hover:bg-blue-700 text-white transition-all" 
      type="submit" 
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Logging in...
        </>
      ) : (
        "Login"
      )}
    </Button>
  );
}


const initialState = {
  error: "",
};

export default function LoginPage() {

  const [state, formAction] = useActionState(login, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-black px-4 font-sans">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-8 shadow-lg border border-zinc-200 dark:border-zinc-700">

        <h1 className="text-3xl font-bold text-center mb-6 dark:text-white">
          Login
        </h1>

       
        {state?.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="text-sm font-medium">{state.error}</span>
          </div>
        )}

        <form action={formAction} className="space-y-5">
          

          <div className="space-y-2">
            <Label className="font-medium dark:text-white">Email</Label>
            <Input
              type="email"
              name="email"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="font-medium dark:text-white">Password</Label>
            <Input
              type="password"
              name="password"
              placeholder="Enter your password"
              required
            />
          </div>

          <SubmitButton />
        </form>

        <p className="text-center text-sm mt-4 dark:text-zinc-300">
          Don’t have an account?
          <Link href="/signup" className="text-blue-600 ml-1 hover:underline font-semibold">
            Create one
          </Link>
        </p>

      </div>
    </div>
  );
}