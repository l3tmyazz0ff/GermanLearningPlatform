"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Calendar, Trophy, Target, TrendingUp, Mail, Send, Edit, BookOpen, Construction } from "lucide-react"; // زودت ايقونة Construction
import Link from "next/link";
import StudentChart from "@/components/StudentChart";

interface StudentClientProps {
  student: any;
  results: any[];
  chartData: any[];
  stats: {
    examsCount: number;
    averageScore: number;
    bestScore: number;
  };
  email: string;
}

export default function StudentClientView({ student, results, chartData, stats, email }: StudentClientProps) {
  const [note, setNote] = useState("");
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  
  // 👇 حالة جديدة عشان زرار التعديل
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isHomeworkOpen, setIsHomeworkOpen] = useState(false);
  const handleSendNote = () => {
    if (!email || email === "No Email") {
      alert("This student has no registered email!");
      return;
    }
    const subject = `Teacher Note: German Platform Progress`;
    const body = `Hello ${student.first_name},\n\nI wanted to share some feedback regarding your recent performance:\n\n${note}\n\nBest regards,\nYour Teacher`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setIsNoteOpen(false);
    setNote("");
  };
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* زر الرجوع */}
        <div className="mb-6">
          <Link href="/teacher/student">
            <Button variant="ghost" className="gap-2 text-gray-600 hover:text-blue-600">
              <ChevronLeft className="h-4 w-4" /> Back to Students
            </Button>
          </Link>
        </div>

        {/* Header: Profile Info */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8 bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800">
          <Avatar className="h-24 w-24 border-4 border-blue-50 shadow-sm">
            <AvatarImage src={student.avatar_url} />
            <AvatarFallback className="text-3xl bg-blue-600 text-white font-bold">
              {student.first_name?.[0]}{student.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white capitalize">
                {student.first_name} {student.last_name}
              </h1>
              <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none text-sm px-3 py-1">
                {student.german_level || 'Level A0'}
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-4 text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2 text-sm bg-gray-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
                    <Mail className="h-3.5 w-3.5 text-blue-500" /> 
                    <span className="select-all">{email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm bg-gray-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
                    <Calendar className="h-3.5 w-3.5 text-orange-500" /> 
                    {/* 👇 إصلاح التاريخ هنا */}
                    Joined: {new Date(student.created_at).toLocaleDateString("en-GB")}
                </div>
            </div>
          </div>
          
          <div className="flex gap-3">
             {/* 👇 زرار التعديل الجديد مع الـ Popup */}
             <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 shadow-sm">
                        <Edit className="h-4 w-4" /> Edit Profile
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md text-center">
                    <DialogHeader>
                        <div className="mx-auto bg-blue-100 p-3 rounded-full w-fit mb-3">
                            <Construction className="h-6 w-6 text-blue-600" />
                        </div>
                        <DialogTitle className="text-xl">Feature Coming Soon!</DialogTitle>
                        <DialogDescription className="text-base pt-2">
                            We are working hard to bring you the best experience. <br/>
                            This feature will be available in the next update.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-center mt-4">
                        <Button onClick={() => setIsEditOpen(false)} className="w-full sm:w-auto">
                            Got it, thanks!
                        </Button>
                    </DialogFooter>
                </DialogContent>
             </Dialog>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="shadow-sm border-t-4 border-t-blue-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Total Exams</CardTitle>
                    <Target className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{stats.examsCount}</div>
                </CardContent>
            </Card>
            <Card className="shadow-sm border-t-4 border-t-green-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Average Score</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className={`text-3xl font-bold ${stats.averageScore >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                        {stats.averageScore}%
                    </div>
                </CardContent>
            </Card>
            <Card className="shadow-sm border-t-4 border-t-yellow-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Best Score</CardTitle>
                    <Trophy className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-yellow-600">{Math.round(stats.bestScore)}%</div>
                </CardContent>
            </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Charts & Tables */}
            <div className="lg:col-span-2 space-y-8">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Performance Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <StudentChart data={chartData} />
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Recent Exams Log</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Score</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {results.length > 0 ? results.slice(0).reverse().map((exam: any) => {
                                    const percentage = exam.total_questions > 0 ? (exam.score / exam.total_questions) * 100 : 0;
                                    return (
                                        <TableRow key={exam.id}>
                                            <TableCell className="font-medium text-gray-600">
                                                {new Date(exam.completed_at).toLocaleDateString("en-GB")}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-semibold">{Math.round(percentage)}%</div>
                                                <div className="text-xs text-gray-400">{exam.score}/{exam.total_questions}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={percentage >= 50 ? "default" : "destructive"} className={percentage >= 50 ? "bg-green-500 hover:bg-green-600" : ""}>
                                                    {percentage >= 50 ? "Passed" : "Failed"}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    )
                                }) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-6 text-gray-500">No exams yet</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Actions & Notes */}
            <div className="lg:col-span-1 space-y-6">
                
                {/* 📝 Teacher's Notes Card with Dialog */}
                <Card className="bg-blue-50/50 border-blue-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-blue-700 flex items-center gap-2">
                             Teacher's Feedback 📨
                        </CardTitle>
                        <CardDescription>Send a direct note to the student via email.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2">
                                    <Send className="h-4 w-4" /> Send Note via Email
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Send Note to {student.first_name}</DialogTitle>
                                    <DialogDescription>
                                        This will open your default email client with the message pre-filled.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Student Email</Label>
                                        <div className="p-2 bg-gray-100 rounded text-sm text-gray-600">{email}</div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Your Message</Label>
                                        <Textarea 
                                            placeholder="Write your feedback here..." 
                                            className="h-32"
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsNoteOpen(false)}>Cancel</Button>
                                    <Button onClick={handleSendNote} disabled={!note.trim()}>Open Email App</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>

                {/* Actions Card */}

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                                        <Dialog open={isHomeworkOpen} onOpenChange={setIsHomeworkOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start gap-2">
                            <BookOpen className="h-4 w-4" /> Assign Homework
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md text-center">
                        <DialogHeader>
                            <div className="mx-auto bg-orange-100 p-3 rounded-full w-fit mb-3">
                                {/* غيرنا اللون لبرتقالي عشان يليق مع الواجب */}
                                <Construction className="h-6 w-6 text-orange-600" />
                            </div>
                            <DialogTitle className="text-xl">Homework System</DialogTitle>
                            <DialogDescription className="text-base pt-2">
                                We are building a comprehensive homework system linked to the curriculum. <br/>
                                Stay tuned for updates!
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="sm:justify-center mt-4">
                            <Button onClick={() => setIsHomeworkOpen(false)} className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700">
                                Okay, waiting!
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                         {/* رابط مباشر لإرسال إيميل عادي */}
                        <Button variant="outline" className="w-full justify-start gap-2" asChild>
                             <a href={`mailto:${email}`}>
                                <Mail className="h-4 w-4" /> Send Regular Email
                             </a>
                        </Button>
                    </CardContent>
                </Card>
            </div>

        </div>
      </div>
    </div>
  );
}