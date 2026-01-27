import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, MoreHorizontal, GraduationCap, Calendar, TrendingUp } from "lucide-react";
import { UserPlus } from "lucide-react";
import Link from "next/link";

export default async function TeacherStudentsPage() {
  // 1. إعداد Supabase Client
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
             try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        }
      }
    }
  );


  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 3. جلب البيانات (الطلاب + النتائج)
  // أ) جلب البروفايلات اللي نوعها 'student'
  const { data: students, error: studentsError } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('created_at', { ascending: false });

  // ب) جلب كل نتائج الامتحانات لحساب الإحصائيات
  const { data: results, error: resultsError } = await supabase
    .from('exam_results')
    .select('user_id, score, total_questions, completed_at');

  if (studentsError || resultsError) {
    console.error("Error fetching data:", studentsError || resultsError);
  }

  // 4. معالجة البيانات (Data Processing & Calculations)
  // هنربط كل طالب بنتايجه ونحسب المتوسط
  const studentsWithStats = students?.map(student => {
    // فلتر النتائج الخاصة بالطالب ده بس
    const studentResults = results?.filter(r => r.user_id === student.id) || [];
    
    const examsTaken = studentResults.length;
    
    // حساب متوسط النسبة المئوية
    let totalPercentage = 0;
    studentResults.forEach(r => {
        // تجنب القسمة على صفر
        const percentage = r.total_questions > 0 ? (r.score / r.total_questions) * 100 : 0;
        totalPercentage += percentage;
    });
    
    const averageScore = examsTaken > 0 ? Math.round(totalPercentage / examsTaken) : 0;
    
    // معرفة آخر نشاط (تاريخ آخر امتحان)
 // الحل: استخدام دالة ثابتة للفورمات
const lastActive = studentResults.length > 0 
    ? new Date(Math.max(...studentResults.map((r: any) => new Date(r.completed_at).getTime()))).toISOString().slice(0, 10) // يحولها إلى YYYY-MM-DD
    : "No activity";
    // تحديد لون الحالة بناءً على الدرجات
    let statusColor = "bg-gray-500";
    if (examsTaken > 0) {
        if (averageScore >= 80) statusColor = "text-green-600";
        else if (averageScore >= 50) statusColor = "text-yellow-600";
        else statusColor = "text-red-600";
    }

    return {
        ...student,
        stats: {
            examsTaken,
            averageScore,
            lastActive,
            statusColor
        }
    };
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              My Students <GraduationCap className="h-8 w-8 text-blue-600" />
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage your students and track their progress.
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
             <div className="relative w-full md:w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search students..." className="pl-10 bg-white dark:bg-zinc-900" />
             </div>
             
             {/* Updated Add Student Button -> Redirects to Sign Up Page */}
             <Link href="/register/student" passHref>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" /> Add Student
                </Button>
             </Link>
          </div>
        </div>

        {/* Students Table Card */}
        <Card className="shadow-lg border-t-4 border-t-blue-500 bg-white dark:bg-zinc-900">
            <CardHeader>
                <CardTitle>Enrolled Students</CardTitle>
                <CardDescription>
                    Total Students: {studentsWithStats.length}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">Student Name</TableHead>
                            <TableHead>Current Level</TableHead>
                            <TableHead className="text-center">Exams Taken</TableHead>
                            <TableHead className="w-[200px]">Average Performance</TableHead>
                            <TableHead>Last Active</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {studentsWithStats.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                                    No students enrolled yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            studentsWithStats.map((student) => (
                                <TableRow key={student.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                                    {/* الاسم والصورة */}
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border">
                                                <AvatarImage src="" />
                                                <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                                                    {student.first_name?.[0]}{student.last_name?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-gray-100">
                                                    {student.first_name} {student.last_name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    ID: {student.id.slice(0, 8)}...
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    
                                    {/* المستوى */}
                                    <TableCell>
                                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                            {student.german_level || 'N/A'}
                                        </Badge>
                                    </TableCell>
                                    
                                    {/* عدد الامتحانات */}
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1 font-semibold">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            {student.stats.examsTaken}
                                        </div>
                                    </TableCell>
                                    
                                    {/* متوسط الأداء (Progress Bar) */}
                                    <TableCell>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span>Average Score</span>
                                                <span className={student.stats.statusColor}>
                                                    {student.stats.averageScore}%
                                                </span>
                                            </div>
                                            <Progress 
                                                value={student.stats.averageScore} 
                                                className="h-2" 
                                                // يمكنك تخصيص لون الشريط هنا لو حبيت
                                            />
                                        </div>
                                    </TableCell>
                                    
                                    {/* آخر نشاط */}
                                    <TableCell className="text-sm text-gray-500">
                                        {student.stats.lastActive}
                                    </TableCell>
                                    
                                    {/* زر الإجراءات */}
                                    <TableCell className="text-right">
                                       <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/teacher/student/${student.id}`}>
                                                <MoreHorizontal className="h-5 w-5 text-gray-400" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                    {/* مثال: خلي الزرار يودي للصفحة */}

                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
