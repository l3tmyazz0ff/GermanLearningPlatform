"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient'; 
import { 
  Loader2, BookOpen, PenTool, CheckCircle, XCircle, 
  ArrowRight, ChevronLeft, Calendar, AlertCircle, Send, MessageSquare, Map 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

type ViewState = 'TYPE_SELECTION' | 'EXAM_SELECTION' | 'QUIZ' | 'RESULT';
type ExamType = 'URT' | 'TOC';

interface Question {
  id: string;
  question_text: string;
  context_text?: string;
  options: string[] | string; 
  correct_answer: string;
  order_index: number;
  question_type: string; // "Grammatik", "Landeskunde", "Schriftlicher Ausdruck (E-mail)", etc.
}

interface Exam {
  id: string;
  title: string;
  description: string;
  type: string;
  year: number;
}

export default function ExamsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [viewState, setViewState] = useState<ViewState>('TYPE_SELECTION');
  
  const [selectedType, setSelectedType] = useState<ExamType | null>(null);
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);

  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [writtenAnswer, setWrittenAnswer] = useState(""); 
  const [allStudentAnswers, setAllStudentAnswers] = useState<any[]>([]); // لتخزين كل الإجابات لمراجعتها
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);

  const wordCount = writtenAnswer.trim() ? writtenAnswer.trim().split(/\s+/).length : 0;

  const handleTypeSelect = async (type: ExamType) => {
    setLoading(true);
    setSelectedType(type);
    try {
        const { data, error } = await supabase
            .from('exams')
            .select('*')
            .eq('type', type)
            .order('year', { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
            setAvailableExams(data as Exam[]);
            setViewState('EXAM_SELECTION');
        } else {
            alert(`No exams found for ${type}`);
        }
    } catch (error) {
        console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const startExam = async (exam: Exam) => {
    setLoading(true);
    setCurrentExam(exam);
    try {
      const { data: questionsData, error: qError } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', exam.id)
        .order('order_index', { ascending: true });

      if (qError || !questionsData || questionsData.length === 0) throw new Error('No questions found');

      setQuestions(questionsData as Question[]);
      setViewState('QUIZ');
      setCurrentIndex(0);
      setScore(0);
      setAllStudentAnswers([]);
      setSelectedOption(null);
      setWrittenAnswer("");
      setShowFeedback(false);
    } catch (error) {
      alert('عذراً، لم يتم العثور على أسئلة لهذا الامتحان.');
    } finally {
      setLoading(false);
    }
  };

  const confirmAnswer = () => {
    const currentQuestion = questions[currentIndex];
    // التحقق لو السؤال مقالي بناءً على نوعه في الداتابيز عندك
    const isWritten = currentQuestion.question_type?.includes('Schriftlicher');
    
    if (!isWritten && !selectedOption) return;
    if (isWritten && wordCount < 2) return; 

    // تخزين الإجابة الحالية
    const studentAnswer = isWritten ? writtenAnswer : selectedOption;
    setAllStudentAnswers(prev => [...prev, { question_id: currentQuestion.id, answer: studentAnswer }]);

    let isCorrect = false;
    if (isWritten) {
        isCorrect = true; // المقالي يُعتبر "تم التسليم" وبنعطي الطالب درجته مبدئياً
    } else {
        isCorrect = selectedOption === currentQuestion.correct_answer;
    }

    if (isCorrect) setScore(s => s + 1);
    setShowFeedback(true);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setWrittenAnswer("");
        setShowFeedback(false);
      } else {
        finishExam();
      }
    }, 0);
  };

  const finishExam = async () => {
    setViewState('RESULT');
    const { data: { user } } = await supabase.auth.getUser();
    if (user && currentExam) {
        await supabase.from('exam_results').insert({
            user_id: user.id,
            exam_id: currentExam.id,
            score: score,
            total_questions: questions.length,
            details: allStudentAnswers // حفظ كل التفاصيل للمراجعة لاحقاً
        });
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#FDFBF7]">
      <div className="text-center animate-pulse">
        <Loader2 className="h-16 w-16 animate-spin text-[#8B0000] mx-auto mb-4" />
        <p className="text-[#1B4332] font-serif text-xl font-bold tracking-widest">Warten Sie bitte...</p>
      </div>
    </div>
  );

  // --- View: TYPE SELECTION (The Two Long Columns) ---
  if (viewState === 'TYPE_SELECTION') {
    return (
      <div className="min-h-screen bg-[#FDFBF7] p-4 md:p-8 flex flex-col items-center">
        <div className="max-w-6xl w-full text-center mb-12 space-y-4">
          <h1 className="text-6xl font-black text-[#1B4332] tracking-tighter font-serif">
            Viel Erfolg! <span className="text-[#8B0000]">🇩🇪</span>
          </h1>
          <p className="text-slate-500 text-lg uppercase tracking-widest font-bold">Wählen Sie Ihren Prüfungstyp</p>
          <div className="h-1 w-32 bg-[#FFCE00] mx-auto"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-10 w-full max-w-5xl h-[600px]">
          <ExamCard 
            title="URT Exam" 
            desc="Universitäts-Reife-Test"
            icon={<BookOpen className="w-12 h-12"/>} 
            color="black" 
            onClick={() => handleTypeSelect('URT')} 
          />
          <ExamCard 
            title="TOC Exam" 
            desc="Test of Competence"
            icon={<PenTool className="w-12 h-12"/>} 
            color="red" 
            onClick={() => handleTypeSelect('TOC')} 
          />
        </div>
      </div>
    );
  }

  // --- View: EXAM SELECTION ---
  if (viewState === 'EXAM_SELECTION') {
    return (
      <div className="max-w-4xl mx-auto p-8 space-y-8 animate-in slide-in-from-bottom-6 duration-700">
        <Button variant="ghost" onClick={() => setViewState('TYPE_SELECTION')} className="text-[#8B0000] hover:bg-red-50 font-bold uppercase tracking-wider">
          <ChevronLeft className="w-5 h-5 mr-1" /> Zurück zum Start
        </Button>
        <div className="bg-white rounded-[40px] p-10 shadow-2xl border-b-[12px] border-[#1B4332]">
            <h2 className="text-4xl font-serif font-black text-[#1B4332] mb-8 flex items-center gap-4">
               <Calendar className="text-[#FFCE00] w-10 h-10" /> {selectedType} Prüfungsjahr
            </h2>
            <div className="grid gap-6">
                {availableExams.map((exam) => (
                    <div 
                        key={exam.id}
                        onClick={() => startExam(exam)}
                        className="group flex items-center justify-between p-8 rounded-3xl border-2 border-slate-100 hover:border-[#8B0000] hover:bg-red-50/30 transition-all cursor-pointer bg-slate-50/50"
                    >
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-white shadow-md flex items-center justify-center font-black text-2xl text-[#1B4332] group-hover:bg-[#1B4332] group-hover:text-white transition-all">
                                {exam.year}
                            </div>
                            <div>
                                <h3 className="font-black text-2xl text-slate-800 tracking-tight">{exam.title}</h3>
                                <p className="text-slate-500 font-medium">Offizielle staatliche Prüfung</p>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-full border-2 border-slate-200 flex items-center justify-center group-hover:bg-[#8B0000] group-hover:border-[#8B0000] transition-all">
                           <ArrowRight className="text-slate-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    );
  }

  // --- View: QUIZ (The Core Logic) ---
  if (viewState === 'QUIZ' && questions.length > 0) {
    const currentQuestion = questions[currentIndex];
    // التحقق من نوع السؤال من الداتابيز
    const isWritten = currentQuestion.question_type?.includes('Schriftlicher');
    const progress = ((currentIndex + 1) / questions.length) * 100;

    let optionsArray: string[] = [];
    try {
        optionsArray = typeof currentQuestion.options === 'string' 
            ? JSON.parse(currentQuestion.options) 
            : currentQuestion.options;
    } catch (e) { optionsArray = []; }

    return (
      <div className="max-w-5xl mx-auto p-6 min-h-screen flex flex-col pt-10">
        <div className="mb-10 space-y-4">
            <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <p className="text-[#8B0000] font-black text-xs uppercase tracking-[0.4em]">Sektion: {currentQuestion.question_type}</p>
                    <h2 className="text-3xl font-serif font-black text-[#1B4332]">{currentExam?.type} {currentExam?.year}</h2>
                </div>
                <div className="text-right">
                    <span className="text-slate-400 font-bold text-sm tracking-tighter">{currentIndex + 1} / {questions.length} Fragen</span>
                </div>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
               <div className="h-full bg-gradient-to-r from-[#1B4332] to-[#FFCE00] transition-all duration-500" style={{width: `${progress}%`}}></div>
            </div>
        </div>

        <Card className="shadow-[30px_30px_60px_-15px_rgba(27,67,50,0.1)] border-none rounded-[48px] overflow-hidden bg-[#FDFBF7]">
          <CardHeader className="p-12 pb-6 relative">
            {/* زخرفة خفيفة للعلم */}
            <div className="absolute top-0 left-0 right-0 h-2 flex">
                <div className="flex-1 bg-black"></div>
                <div className="flex-1 bg-[#DD0000]"></div>
                <div className="flex-1 bg-[#FFCE00]"></div>
            </div>

            {currentQuestion.context_text && (
                <div className="mb-10 p-8 bg-white/80 rounded-[32px] border-l-[10px] border-[#FFCE00] shadow-sm italic font-serif text-xl text-[#1B4332] leading-relaxed relative overflow-hidden">
                    <Map className="absolute -bottom-4 -right-4 w-24 h-24 text-slate-100 opacity-50 rotate-12" />
                    <h4 className="font-black text-slate-900 not-italic mb-4 uppercase text-sm tracking-widest flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-[#8B0000]" /> Textverständnis
                    </h4>
                    {currentQuestion.context_text}
                </div>
            )}
            <CardTitle className="text-3xl font-black text-slate-800 leading-[1.2] font-serif">
                {currentQuestion.question_text}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-12 pt-6">
            {isWritten ? (
                <div className="space-y-6 animate-in fade-in duration-1000">
                    <div className="flex items-center gap-3 text-[#1B4332] font-black uppercase text-sm tracking-widest mb-2">
                        <MessageSquare className="w-6 h-6" />
                        <span>Ihre Schriftliche Antwort</span>
                    </div>
                    <Textarea 
                        placeholder="Schreiben Sie hier..."
                 
                        className="min-h-[300px] text-6xl p-6 rounded-100xl border-2 border-slate-100 focus:border-[#1B4332] bg-[#FDFBF7] text-black font-medium leading-relaxed"
                        value={writtenAnswer}
                        onChange={(e) => setWrittenAnswer(e.target.value)}
                    />
                    <div className="flex justify-between font-bold px-6">
                        <span className={`${wordCount < 10 ? 'text-[#8B0000]' : 'text-[#1B4332]'} transition-colors`}>
                            {wordCount} Wörter
                        </span>
                        <span className="text-slate-400 italic">Offizielles Prüfungsformat</span>
                    </div>
                </div>
            ) : (
                <div className="grid gap-5">
                    {optionsArray.map((option, idx) => {
                        const isSelected = selectedOption === option;
                        const isCorrect = option === currentQuestion.correct_answer;
                        let stateStyle = "bg-white border-slate-100 hover:border-[#1B4332] hover:bg-slate-50 shadow-sm";
                        if (showFeedback) {
                            if (isCorrect) stateStyle = "border-[#1B4332] bg-[#1B4332]/5 text-[#1B4332] shadow-md";
                            else if (isSelected) stateStyle = "border-[#8B0000] bg-[#8B0000]/5 text-[#8B0000]";
                            else stateStyle = "opacity-40 grayscale border-slate-100";
                        } else if (isSelected) {
                            stateStyle = "border-[#1B4332] bg-[#1B4332] text-white shadow-xl scale-[1.02]";
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => !showFeedback && setSelectedOption(option)}
                                disabled={showFeedback}
                                className={`w-full flex items-center p-7 rounded-[32px] border-2 text-left transition-all duration-300 font-bold text-lg ${stateStyle}`}
                            >
                                <span className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-6 font-black transition-all ${isSelected ? 'bg-white text-[#1B4332]' : 'bg-slate-100 text-slate-400'}`}>
                                    {String.fromCharCode(65 + idx)}
                                </span>
                                <span className="flex-1">{option}</span>
                                {showFeedback && isCorrect && <CheckCircle className="text-[#1B4332] w-8 h-8" />}
                                {showFeedback && isSelected && !isCorrect && <XCircle className="text-[#8B0000] w-8 h-8" />}
                            </button>
                        );
                    })}
                </div>
            )}
          </CardContent>

          <CardFooter className="p-12 bg-white/50 border-t border-slate-100 flex justify-between items-center">
             <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-black"></div>
                <div className="w-3 h-3 rounded-full bg-[#DD0000]"></div>
                <div className="w-3 h-3 rounded-full bg-[#FFCE00]"></div>
             </div>
             <Button 
                onClick={confirmAnswer} 
                disabled={(!isWritten && !selectedOption) || (isWritten && wordCount < 2) || showFeedback}
                className={`px-16 h-20 rounded-[30px] text-xl font-black uppercase tracking-widest transition-all shadow-2xl ${showFeedback ? 'bg-slate-400' : 'bg-[#1B4332] hover:bg-[#2c5d46] hover:-translate-y-1'}`}
            >
                {showFeedback ? 'Nächste Frage...' : 'Bestätigen'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // --- View: RESULT (German Excellence Style) ---
  if (viewState === 'RESULT') {
    const percentage = Math.round((score / questions.length) * 100);
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#FDFBF7]">
            <Card className="max-w-2xl w-full text-center shadow-2xl border-none rounded-[60px] overflow-hidden bg-white p-16">
                <div className={`mx-auto w-32 h-32 rounded-[40px] rotate-12 flex items-center justify-center mb-10 shadow-xl ${percentage >= 50 ? 'bg-[#1B4332]' : 'bg-[#8B0000]'}`}>
                    {percentage >= 50 ? <CheckCircle className="w-16 h-16 text-[#FFCE00] -rotate-12" /> : <AlertCircle className="w-16 h-16 text-white -rotate-12" />}
                </div>
                <h2 className="text-5xl font-serif font-black text-slate-800 mb-4 uppercase tracking-tighter">
                    {percentage >= 80 ? 'Ausgezeichnet!' : percentage >= 50 ? 'Bestanden!' : 'Nicht Bestanden'}
                </h2>
                <div className="text-9xl font-black text-[#1B4332] mb-8 tabular-nums tracking-tighter">
                    {percentage}%
                </div>
                <p className="text-slate-400 font-bold text-xl uppercase tracking-widest mb-12">
                   Ergebnisbericht ({score} / {questions.length})
                </p>
                <div className="grid gap-4">
                    <Button className="w-full h-20 rounded-[30px] bg-[#1B4332] hover:bg-[#2c5d46] text-xl font-black uppercase tracking-widest shadow-xl" onClick={() => window.location.reload()}>
                        Noch einmal versuchen
                    </Button>
                    <Button variant="ghost" className="w-full h-20 rounded-[30px] text-slate-400 hover:text-[#8B0000] text-lg font-bold uppercase tracking-widest" onClick={() => router.push('/student/dashboard')}>
                        Zum Dashboard
                    </Button>
                </div>
            </Card>
        </div>
    );
  }

  return null;
}

// المكون الفرعي للكروت (العمودين الطويلين)
function ExamCard({ title, desc, icon, color, onClick }: { title: string, desc: string, icon: any, color: 'black' | 'red', onClick: () => void }) {
    const borderColor = color === 'black' ? 'hover:border-black shadow-black/5' : 'hover:border-[#8B0000] shadow-red-900/5';
    const accentBg = color === 'black' ? 'bg-black' : 'bg-[#8B0000]';
    
    return (
        <Card 
          onClick={onClick} 
          className={`cursor-pointer border-4 border-transparent transition-all duration-500 group hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] rounded-[50px] overflow-hidden relative bg-white flex flex-col justify-center items-center p-10 ${borderColor}`}
        >
            <div className={`absolute top-0 left-0 w-full h-3 ${accentBg}`}></div>
            
            <div className={`w-28 h-28 rounded-[35px] flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 bg-slate-50 text-slate-400 group-hover:text-white ${color === 'black' ? 'group-hover:bg-black' : 'group-hover:bg-[#8B0000]'}`}>
                {icon}
            </div>
            
            <h3 className="text-4xl font-serif font-black text-slate-800 mb-4 tracking-tighter">{title}</h3>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-sm text-center mb-8">{desc}</p>
            
            <div className="flex items-center gap-2 text-[#FFCE00] font-black group-hover:gap-4 transition-all">
                <span>JETZT STARTEN</span>
                <ArrowRight className="w-6 h-6" />
            </div>
            
            {/* زخرفة خفيفة في الخلفية */}
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-all duration-700"></div>
        </Card>
    );
}
// "use client";

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { supabase } from '@/lib/supabaseClient'; 
// import { 
//   Loader2, BookOpen, PenTool, CheckCircle, XCircle, 
//   ArrowRight, ChevronLeft, Calendar, AlertCircle, Send, MessageSquare, Map 
// } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { Progress } from "@/components/ui/progress";
// import { Textarea } from "@/components/ui/textarea";

// type ViewState = 'TYPE_SELECTION' | 'EXAM_SELECTION' | 'QUIZ' | 'RESULT';
// type ExamType = 'URT' | 'TOC';

// interface Question {
//   id: string;
//   question_text: string;
//   context_text?: string;
//   options: string[] | string; 
//   correct_answer: string;
//   order_index: number;
//   question_type: string;
// }

// interface Exam {
//   id: string;
//   title: string;
//   description: string;
//   type: string;
//   year: number;
// }

// export default function ExamsPage() {
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);
//   const [viewState, setViewState] = useState<ViewState>('TYPE_SELECTION');
  
//   const [selectedType, setSelectedType] = useState<ExamType | null>(null);
//   const [availableExams, setAvailableExams] = useState<Exam[]>([]);

//   const [currentExam, setCurrentExam] = useState<Exam | null>(null);
//   const [questions, setQuestions] = useState<Question[]>([]);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [selectedOption, setSelectedOption] = useState<string | null>(null);
//   const [writtenAnswer, setWrittenAnswer] = useState(""); 
//   const [allStudentAnswers, setAllStudentAnswers] = useState<any[]>([]);
//   const [score, setScore] = useState(0);
//   const [showFeedback, setShowFeedback] = useState(false);

//   const wordCount = writtenAnswer.trim() ? writtenAnswer.trim().split(/\s+/).length : 0;

//   const handleTypeSelect = async (type: ExamType) => {
//     setLoading(true);
//     setSelectedType(type);
//     try {
//         const { data, error } = await supabase
//             .from('exams')
//             .select('*')
//             .eq('type', type)
//             .order('year', { ascending: false });

//         if (error) throw error;
//         if (data && data.length > 0) {
//             setAvailableExams(data as Exam[]);
//             setViewState('EXAM_SELECTION');
//         } else {
//             alert(`No exams found for ${type}`);
//         }
//     } catch (error) {
//         console.error('Error fetching exams:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const startExam = async (exam: Exam) => {
//     setLoading(true);
//     setCurrentExam(exam);
//     try {
//       const { data: questionsData, error: qError } = await supabase
//         .from('exam_questions')
//         .select('*')
//         .eq('exam_id', exam.id)
//         .order('order_index', { ascending: true });

//       if (qError || !questionsData || questionsData.length === 0) throw new Error('No questions found');

//       setQuestions(questionsData as Question[]);
//       setViewState('QUIZ');
//       setCurrentIndex(0);
//       setScore(0);
//       setAllStudentAnswers([]);
//       setSelectedOption(null);
//       setWrittenAnswer("");
//       setShowFeedback(false);
//     } catch (error) {
//       alert('عذراً، لم يتم العثور على أسئلة.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const confirmAnswer = () => {
//     const currentQuestion = questions[currentIndex];
//     const isWritten = currentQuestion.question_type?.includes('Schriftlicher');
    
//     if (!isWritten && !selectedOption) return;
//     if (isWritten && wordCount < 2) return; 

//     const studentAnswer = isWritten ? writtenAnswer : selectedOption;
//     setAllStudentAnswers(prev => [...prev, { question_id: currentQuestion.id, answer: studentAnswer }]);

//     let isCorrect = isWritten ? true : selectedOption === currentQuestion.correct_answer;
//     if (isCorrect) setScore(s => s + 1);

//     // انتقال فوري للتست
//     if (currentIndex < questions.length - 1) {
//       setCurrentIndex(prev => prev + 1);
//       setSelectedOption(null);
//       setWrittenAnswer("");
//       setShowFeedback(false);
//     } else {
//       finishExam();
//     }
//   };

//   const finishExam = async () => {
//     setViewState('RESULT');
//     const { data: { user } } = await supabase.auth.getUser();
//     if (user && currentExam) {
//         await supabase.from('exam_results').insert({
//             user_id: user.id,
//             exam_id: currentExam.id,
//             score: score,
//             total_questions: questions.length,
//             details: allStudentAnswers
//         });
//     }
//   };

//   if (loading) return (
//     <div className="flex h-screen items-center justify-center bg-[#FDFBF7]">
//       <Loader2 className="h-10 w-10 animate-spin text-[#8B0000]" />
//     </div>
//   );

//   // --- شاشة اختيار النوع: مقاسات ألطف وأرشق ---
//   if (viewState === 'TYPE_SELECTION') {
//     return (
//       <div className="min-h-screen bg-[#FDFBF7] p-8 flex flex-col items-center justify-center">
//         <div className="text-center mb-10 space-y-2">
//           <h1 className="text-4xl font-black text-[#1B4332] font-serif uppercase tracking-tight">Viel Erfolg! 🇩🇪</h1>
//           <p className="text-slate-400 font-bold text-sm tracking-widest">WÄHLEN SIE IHREN PRÜFUNGSTYP</p>
//         </div>

//         <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl h-[450px]">
//           <ExamCard 
//             title="URT Exam" 
//             desc="Universitäts-Reife-Test"
//             icon={<BookOpen className="w-10 h-10"/>} 
//             color="black" 
//             onClick={() => handleTypeSelect('URT')} 
//           />
//           <ExamCard 
//             title="TOC Exam" 
//             desc="Test of Competence"
//             icon={<PenTool className="w-10 h-10"/>} 
//             color="red" 
//             onClick={() => handleTypeSelect('TOC')} 
//           />
//         </div>
//       </div>
//     );
//   }

//   // --- شاشة السنوات: منظمة وأصغر قليلاً ---
//   if (viewState === 'EXAM_SELECTION') {
//     return (
//       <div className="max-w-3xl mx-auto p-8 space-y-6">
//         <Button variant="ghost" onClick={() => setViewState('TYPE_SELECTION')} className="text-[#8B0000] font-bold">
//           <ChevronLeft className="w-4 h-4 mr-1" /> ZURÜCK
//         </Button>
//         <div className="bg-white rounded-2xl p-8 shadow-xl border-t-4 border-[#1B4332]">
//             <h2 className="text-2xl font-black text-[#1B4332] mb-6 flex items-center gap-3">
//                <Calendar className="w-6 h-6" /> {selectedType} Jahr wählen
//             </h2>
//             <div className="grid gap-3">
//                 {availableExams.map((exam) => (
//                     <div 
//                         key={exam.id}
//                         onClick={() => startExam(exam)}
//                         className="group flex items-center justify-between p-5 rounded-xl border hover:border-[#1B4332] hover:bg-slate-50 transition-all cursor-pointer"
//                     >
//                         <div className="flex items-center gap-4">
//                             <div className="w-12 h-12 rounded-lg bg-[#1B4332] text-white flex items-center justify-center font-bold">
//                                 {exam.year}
//                             </div>
//                             <span className="font-bold text-slate-700">{exam.title}</span>
//                         </div>
//                         <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1B4332]" />
//                     </div>
//                 ))}
//             </div>
//         </div>
//       </div>
//     );
//   }

//   // --- شاشة الكويز: الخط 2xl وواضح جداً والتصميم لم نفسه ---
//   if (viewState === 'QUIZ' && questions.length > 0) {
//     const currentQuestion = questions[currentIndex];
//     const isWritten = currentQuestion.question_type?.includes('Schriftlicher');
//     const progress = ((currentIndex + 1) / questions.length) * 100;

//     return (
//       <div className="max-w-4xl mx-auto p-6 min-h-screen flex flex-col pt-6">
//         <div className="mb-6 space-y-3">
//             <div className="flex justify-between items-end">
//                 <p className="text-[#8B0000] font-bold text-xs uppercase tracking-widest">{currentQuestion.question_type}</p>
//                 <span className="text-slate-400 font-bold text-xs">{currentIndex + 1} / {questions.length}</span>
//             </div>
//             <Progress value={progress} className="h-2" />
//         </div>

//         <Card className="shadow-lg border-none rounded-2xl overflow-hidden bg-white">
//           <CardHeader className="p-8 pb-4 border-t-4 border-[#1B4332]">
//             {currentQuestion.context_text && (
//                 <div className="mb-6 p-5 bg-slate-50 rounded-xl border-l-4 border-[#FFCE00] italic font-serif text-lg text-slate-700">
//                     {currentQuestion.context_text}
//                 </div>
//             )}
//             <CardTitle className="text-xl font-black text-slate-800 font-serif leading-snug">
//                 {currentQuestion.question_text}
//             </CardTitle>
//           </CardHeader>

//           <CardContent className="p-8 pt-4">
//             {isWritten ? (
//                 <div className="space-y-4">
//                     <div className="flex items-center gap-2 text-[#1B4332] font-bold text-xs uppercase tracking-widest">
//                         <MessageSquare className="w-4 h-4" /> Ihre Antwort
//                     </div>
//                     <Textarea 
//                         placeholder="Schreiben Sie hier..."
                 
//                         className="min-h-[300px] text-6xl p-6 rounded-100xl border-2 border-slate-100 focus:border-[#1B4332] bg-[#FDFBF7] text-black font-medium leading-relaxed"
//                         value={writtenAnswer}
//                         onChange={(e) => setWrittenAnswer(e.target.value)}
//                     />
//                     <div className="text-right font-bold text-xs text-slate-400">
//                         {wordCount} WÖRTER
//                     </div>
//                 </div>
//             ) : (
//                 <div className="grid gap-3">
//                     {/* خيارات الإجابة الاختيارية بمقاس رشيق */}
//                     { (typeof currentQuestion.options === 'string' ? JSON.parse(currentQuestion.options) : currentQuestion.options).map((option: string, idx: number) => (
//                         <button
//                             key={idx}
//                             onClick={() => setSelectedOption(option)}
//                             className={`w-full flex items-center p-4 rounded-xl border-2 text-left transition-all font-bold ${selectedOption === option ? 'border-[#1B4332] bg-[#1B4332] text-white' : 'border-slate-100 hover:bg-slate-50'}`}
//                         >
//                             <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center mr-4 text-xs group-hover:bg-white">{String.fromCharCode(65 + idx)}</span>
//                             {option}
//                         </button>
//                     ))}
//                 </div>
//             )}
//           </CardContent>

//           <CardFooter className="p-8 bg-slate-50 flex justify-between items-center">
//              <div className="flex gap-1.5">
//                 <div className="w-2 h-2 rounded-full bg-black"></div>
//                 <div className="w-2 h-2 rounded-full bg-[#DD0000]"></div>
//                 <div className="w-2 h-2 rounded-full bg-[#FFCE00]"></div>
//              </div>
//              <Button 
//                 onClick={confirmAnswer} 
//                 disabled={(!isWritten && !selectedOption) || (isWritten && wordCount < 2)}
//                 className="bg-[#1B4332] hover:bg-black text-white px-10 h-12 rounded-lg font-bold uppercase tracking-widest text-xs"
//             >
//                 Bestätigen
//             </Button>
//           </CardFooter>
//         </Card>
//       </div>
//     );
//   }

//   // --- شاشة النتيجة: بسيطة ومركزة ---
//   if (viewState === 'RESULT') {
//     const percentage = Math.round((score / questions.length) * 100);
//     return (
//         <div className="min-h-screen flex items-center justify-center p-6 bg-[#FDFBF7]">
//             <Card className="max-w-md w-full text-center shadow-xl border-none rounded-3xl p-10 bg-white">
//                 <div className={`mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6 ${percentage >= 50 ? 'bg-[#1B4332]' : 'bg-[#8B0000]'} text-white`}>
//                     {percentage >= 50 ? <CheckCircle className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
//                 </div>
//                 <h2 className="text-3xl font-black text-slate-800 mb-2">{percentage}%</h2>
//                 <p className="text-slate-500 font-bold mb-8 italic">Ergebnis: {score} / {questions.length}</p>
//                 <div className="grid gap-2">
//                     <Button className="w-full h-12 bg-[#1B4332] font-bold" onClick={() => window.location.reload()}>NEU STARTEN</Button>
//                     <Button variant="ghost" className="w-full" onClick={() => router.push('/student/dashboard')}>DASHBOARD</Button>
//                 </div>
//             </Card>
//         </div>
//     );
//   }

//   return null;
// }

// function ExamCard({ title, desc, icon, color, onClick }: { title: string, desc: string, icon: any, color: 'black' | 'red', onClick: () => void }) {
//     return (
//         <Card 
//           onClick={onClick} 
//           className={`cursor-pointer border-2 border-slate-100 transition-all group hover:border-[#1B4332] rounded-3xl overflow-hidden bg-white flex flex-col justify-center items-center p-8 text-center`}
//         >
//             <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all ${color === 'black' ? 'bg-slate-900' : 'bg-[#8B0000]'} text-white group-hover:scale-110`}>
//                 {icon}
//             </div>
//             <h3 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">{title}</h3>
//             <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-6">{desc}</p>
//             <div className="text-[#1B4332] font-black text-xs flex items-center gap-2">STARTEN <ArrowRight className="w-3 h-3" /></div>
//         </Card>
//     );
// }