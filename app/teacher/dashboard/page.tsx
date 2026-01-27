import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, Activity, LogOut, PlusCircle, BarChart3, GraduationCap } from "lucide-react";
import Link from "next/link";

export default async function TeacherDashboard() {
  // 1. إعداد Supabase
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
            // تجاهل الأخطاء
          }
        },
      },
    }
  );

  // 2. التحقق من المستخدم
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    redirect("/login");
  }

  // 3. جلب بيانات البروفايل (للاسم والمؤهل)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  // ============================================================
  // 4. (إضافة جديدة) جلب عدد الطلاب
  // ============================================================
  const { count: studentCount } = await supabase
    .from("profiles") // الجدول
    .select("*", { count: "exact", head: true }) // head: true تعني هات العدد فقط ولا تجلب البيانات
    .eq("role", "student"); // الشرط: أن يكون طالب
  // ============================================================


  // 5. تجهيز البيانات للعرض
  const teacherName = profile ? `${profile.first_name} ${profile.last_name}` : "Lehrer";
  const qualification = profile?.qualification || "Language Instructor";

  // دالة الخروج
  async function signOut() {
    "use server";
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
             try {
                cookiesToSet.forEach(({ name, value, options }) => 
                   cookieStore.set(name, value, options)
                )
             } catch {}
          }
        }
      }
    );
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Guten Tag, {teacherName}! 👨‍🏫
            </h1>
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-1">
                <GraduationCap className="w-4 h-4" />
                <span>{qualification}</span>
            </div>
          </div>
          <div className="flex gap-3">
             <form action={signOut}>
                <Button variant="destructive" className="gap-2 shadow-md">
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
             </form>
          </div>
        </header>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* بطاقة عدد الطلاب - تم التعديل هنا */}
            <Card className="border-l-4 border-blue-500 shadow-sm bg-white dark:bg-zinc-900">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Total Students</CardTitle>
                    <Users className="h-5 w-5 text-blue-500" />
                </CardHeader>
                <CardContent>
                    {/* هنا نضع المتغير الجديد studentCount */}
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {studentCount || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {studentCount ? "Active learners" : "Waiting for students"}
                    </p>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-purple-500 shadow-sm bg-white dark:bg-zinc-900">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Lessons</CardTitle>
                    <BookOpen className="h-5 w-5 text-purple-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">0</div>
                    <p className="text-xs text-gray-500 mt-1">Create your first lesson</p>
                </CardContent>
            </Card>
             <Card className="border-l-4 border-green-500 shadow-sm bg-white dark:bg-zinc-900">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Performance</CardTitle>
                    <Activity className="h-5 w-5 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">--</div>
                    <p className="text-xs text-gray-500 mt-1">No data available</p>
                </CardContent>
            </Card>
        </div>

        {/* Management Tools */}
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Classroom Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/teacher/classes" passHref>
                <Card className="hover:shadow-lg transition-all cursor-pointer group hover:bg-blue-50 dark:hover:bg-zinc-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                            <PlusCircle className="h-6 w-6" />
                            Manage Classes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Create groups and add lessons.</p>
                    </CardContent>
                </Card>
            </Link>

            <Link href="/teacher/student" passHref>
                <Card className="hover:shadow-lg transition-all cursor-pointer group hover:bg-purple-50 dark:hover:bg-zinc-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-purple-600 dark:text-purple-400">
                            <Users className="h-6 w-6" />
                            My Students
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 dark:text-gray-400">View progress and profiles.</p>
                    </CardContent>
                </Card>
            </Link>

            <Link href="/teacher/reports" passHref>
                <Card className="hover:shadow-lg transition-all cursor-pointer group hover:bg-orange-50 dark:hover:bg-zinc-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-orange-600 dark:text-orange-400">
                            <BarChart3 className="h-6 w-6" />
                            Analytics
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Check quiz results.</p>
                    </CardContent>
                </Card>
            </Link>
        </div>
      </div>
    </div>
  );
}