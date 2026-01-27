import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import StudentClientView from "@/components/teacher/StudentClientView"; 

export default async function StudentDetailsPage({ params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} }
      }
    }
  );


  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll() { return [] } }
    }
  );

  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  
  const { data: student, error: studentError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (studentError || !student) {

      return (
        <div className="p-10 text-red-500 font-mono">
           <h1 className="text-xl font-bold mb-4">Error: Student Not Found</h1>
           <p>Searched ID: {id}</p>
           <p>DB Error: {JSON.stringify(studentError)}</p>
        </div>
      );
  }


  const { data: results } = await supabase
    .from('exam_results')
    .select('*')
    .eq('user_id', id)
    .order('completed_at', { ascending: true });


  const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(id);

  const realEmail = authUser?.email || student.email || "No Email";

  
  const examsCount = results?.length || 0;
  
  const bestScore = results?.reduce((max, r) => {
    const percentage = r.total_questions > 0 ? (r.score / r.total_questions) * 100 : 0;
    return percentage > max ? percentage : max;
  }, 0) || 0;

  const totalScoreSum = results?.reduce((sum, r) => {
     const percentage = r.total_questions > 0 ? (r.score / r.total_questions) * 100 : 0;
     return sum + percentage;
  }, 0) || 0;
  
  const averageScore = examsCount > 0 ? Math.round(totalScoreSum / examsCount) : 0;

  
  const chartData = results?.map((r, index) => ({
    name: `Exam ${index + 1}`,
    score: r.total_questions > 0 ? Math.round((r.score / r.total_questions) * 100) : 0,
    date: new Date(r.completed_at).toISOString().slice(5, 10)
  })) || [];


  return (
    <StudentClientView 
      student={student}
      results={results || []}
      chartData={chartData}
      email={realEmail}
      stats={{
        examsCount,
        averageScore,
        bestScore
      }}
    />
  );
}