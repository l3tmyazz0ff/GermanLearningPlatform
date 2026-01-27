
"use client";

import { useEffect, useState } from "react"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { BookOpen, LogOut, Loader2, ArrowRight, TrendingUp, Zap, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient"; 

// 1. تحديث الواجهة لتطابق أسماء الأعمدة في قاعدة البيانات
interface Profile {
  first_name: string;
  last_name: string;
  german_level: string; 
}

export default function StudentDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // 2. طلب الأعمدة الصحيحة من Supabase
          const { data: userData, error } = await supabase
            .from('profiles')
            // ✅ طلب الأعمدة بالأسماء الصحيحة التي في قاعدة بياناتك
            .select('first_name, last_name, german_level') 
            .eq('id', user.id)
            .single();

          if (userData) {
            // ✅ يتم تحديث الحالة بالبيانات الحقيقية
            setProfile(userData as Profile);
          } else if (error) {
            console.error("Error fetching profile:", error.message);
          }
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setLoading(false); 
      }
    };

    getProfile();
  }, []); 

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login'; 
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  const nextLevelsMap: {
    [key: string]: string; 
    A1: string;
    A2: string;
    B1: string;
    B2: string;
    C1: string;
    C2: string;
    } = {
        A0:'A1',
        A1: 'A2',
        A2: 'B1',
        B1: 'B2',
        B2: 'C1',
        C1: 'C2',
        C2: 'Final Level'
    };
  const studentName = profile ? `${profile.first_name} ${profile.last_name}` : "Student";
  const studentLevel = profile?.german_level ? profile.german_level.toUpperCase() : "N/A"; 

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Guten Tag,{studentName}! 👋
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Your  dashboard for learning German.
            </p>
          </div>
          <Button variant="destructive" onClick={handleLogout} className="gap-2 shadow-md">
              <LogOut className="h-4 w-4" />
              Logout
          </Button>
        </header>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card className="border-l-4 border-blue-500 shadow-lg bg-white dark:bg-zinc-900">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Aktuelles Niveau</CardTitle>
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">
                      {studentLevel}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                      Next Level: {nextLevelsMap[studentLevel] || 'C2 Reached'} 
                  </p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-green-500 shadow-lg bg-white dark:bg-zinc-900">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Lektionen abgeschlossen</CardTitle>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">0/40</div>
                    <p className="text-xs text-gray-500 mt-1"> Beginnen Sie Ihre erste Lektion</p>
                </CardContent>
            </Card>

             <Card className="border-l-4 border-yellow-500 shadow-lg bg-white dark:bg-zinc-900">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Points (XP)</CardTitle>
                    <Zap className="h-5 w-5 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">0</div>
                    <p className="text-xs text-gray-500 mt-1">Complete quizzes to earn XP</p>
                </CardContent>
            </Card>
        </div>

        {/* Quick Access Menu */}
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <Link href="/student/vocab" passHref>
                <Card className="hover:shadow-xl transition-all cursor-pointer group hover:bg-blue-50 dark:hover:bg-zinc-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                            <BookOpen className="h-6 w-6" />
                            Worte
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Review your words.</p>
                        <ArrowRight className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform mt-2" />
                    </CardContent>
                </Card>
            </Link>

            <Link href="/student/exams" passHref>
        <Card className="hover:shadow-xl transition-shadow cursor-pointer border-l-4 border-l-indigo-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold">
                    Offizielle Prüfungen 🎓
                </CardTitle>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-indigo-500">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
            </CardHeader>
            <CardContent>
                <p className="text-xs text-gray-500">
                    Üben Sie URT- und TOC-Modelle.
                </p>
                <p className="text-sm mt-2 font-medium text-indigo-600">
                    Prüfung starten →
                </p>
            </CardContent>
        </Card>
    </Link>

       <Link href="/student/quiz" passHref>
        <Card className="hover:shadow-xl transition-all cursor-pointer group hover:bg-purple-50 dark:hover:bg-zinc-800">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-purple-600 dark:text-purple-400">
                    <TrendingUp className="h-6 w-6" />
                    Vokabeltest
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-gray-500 dark:text-gray-400">Vokabeln üben.</p>
                <ArrowRight className="h-5 w-5 text-purple-600 group-hover:translate-x-1 transition-transform mt-2" />
            </CardContent>
        </Card>
      </Link>

        </div>

      </div>
    </div>
  );
}
