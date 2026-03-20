import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  Download, 
  Linkedin, 
  Youtube, 
  MessageSquare, 
  ArrowRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Copy,
  Check,
  User,
  Briefcase,
  Target,
  Wand2
} from 'lucide-react';
import Markdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { analyzeResume, ResumeAnalysis } from './services/gemini';
import { extractTextFromPdf } from './utils/pdfParser';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import SectionCard from './components/SectionCard';
import Optimizer from './components/Optimizer';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'resume' | 'cover' | 'linkedin' | 'skills' | 'interview' | 'roadmap'>('resume');
  const [copied, setCopied] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [history, setHistory] = useState<ResumeAnalysis[]>(() => {
    const saved = localStorage.getItem('resume_history');
    return saved ? JSON.parse(saved) : [];
  });

  const resumeRef = useRef<HTMLDivElement>(null);
  const coverLetterRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }

    setResumeFile(file);
    setError(null);
    try {
      const text = await extractTextFromPdf(file);
      setResumeText(text);
    } catch (err) {
      console.error(err);
      setError('Failed to parse PDF. Please try again or paste text manually.');
    }
  };

  const startAnalysis = async () => {
    if (!resumeText && !resumeFile) {
      setError('Please upload a resume.');
      return;
    }
    if (!jobDescription.trim()) {
      setError('Please paste a job description.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeResume(resumeText, jobDescription);
      setAnalysis(result);
      const newHistory = [result, ...history].slice(0, 5);
      setHistory(newHistory);
      localStorage.setItem('resume_history', JSON.stringify(newHistory));
    } catch (err) {
      console.error(err);
      setError('Analysis failed. Please check your connection and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadPDF = async (elementRef: React.RefObject<HTMLDivElement>, filename: string, id: string) => {
    if (!elementRef.current) return;
    setIsDownloading(id);
    
    try {
      // Small delay to ensure any dynamic content is fully settled
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(elementRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Ensure the cloned element uses standard colors to avoid oklch issues
          const containerId = id === 'resume' ? 'resume-container' : 'cover-container';
          const element = clonedDoc.getElementById(containerId);
          if (element) {
            element.style.backgroundColor = '#ffffff';
            element.style.color = '#1f2937';
            // Also force child elements to avoid oklch
            const children = element.querySelectorAll('*');
            children.forEach((child: any) => {
              const style = window.getComputedStyle(child);
              if (style.color.includes('oklch')) child.style.color = '#1f2937';
              if (style.borderColor.includes('oklch')) child.style.borderColor = '#d1d5db';
            });
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(filename);
    } catch (err) {
      console.error('PDF Download Error:', err);
      setError('Failed to generate PDF. This is often due to modern CSS features. Try copying the text instead.');
    } finally {
      setIsDownloading(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const reset = () => {
    setResumeFile(null);
    setResumeText('');
    setJobDescription('');
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-indigo-100 relative overflow-x-hidden">
      {/* Background Pattern/Image */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]">
        <img 
          src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=2070" 
          alt="Office Background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/20 via-transparent to-transparent" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Sparkles size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">ResumeAI</span>
          </div>
          <div className="flex items-center gap-4">
            {analysis && (
              <button 
                onClick={reset}
                className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-2"
              >
                <RefreshCw size={16} />
                <span className="hidden sm:inline">Start New</span>
              </button>
            )}
            <button 
              onClick={() => setShowAuthModal(true)}
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-95"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl space-y-8 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 to-violet-600" />
              
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-4">
                  <User size={32} />
                </div>
                <h2 className="text-3xl font-black text-gray-900">
                  {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-gray-500 font-medium">
                  {authMode === 'login' ? 'Sign in to access your resume history.' : 'Join ResumeAI to optimize your career journey.'}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="name@example.com"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  />
                </div>

                <button 
                  onClick={() => setShowAuthModal(false)}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]"
                >
                  {authMode === 'login' ? 'Sign In' : 'Create Account'}
                </button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                    <span className="bg-white px-4 text-gray-400">Or continue with</span>
                  </div>
                </div>

                <button 
                  onClick={() => setShowAuthModal(false)}
                  className="w-full py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
              </div>

              <div className="text-center">
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>

              <button 
                onClick={() => setShowAuthModal(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <RefreshCw size={20} className="rotate-45" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-16">
        {!analysis ? (
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold tracking-wide uppercase"
              >
                <Sparkles size={16} />
                AI-Powered Career Suite
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 leading-[1.1]"
              >
                Land Your Dream Job with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">ResumeAI</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed"
              >
                The ultimate toolkit to optimize your resume, craft perfect cover letters, and ace your interviews using state-of-the-art AI.
              </motion.p>
            </div>

            <div className="grid gap-8">
              <div className="grid md:grid-cols-2 gap-8">
                <SectionCard
                  title="Upload Resume"
                  description="Start by uploading your current resume in PDF format."
                  icon={<Upload className="w-6 h-6" />}
                  bgImageSeed="resume-paper"
                >
                  <div className="relative group">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={cn(
                      "border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 transition-all",
                      resumeFile ? "border-indigo-500 bg-indigo-50/50" : "border-gray-200 group-hover:border-indigo-400 group-hover:bg-gray-50"
                    )}>
                      <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                        resumeFile ? "bg-indigo-600 text-white rotate-3" : "bg-white text-gray-400"
                      )}>
                        {resumeFile ? <CheckCircle2 size={32} /> : <FileText size={32} />}
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-gray-900 text-lg">
                          {resumeFile ? resumeFile.name : "Drop your PDF here"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">or click to browse files</p>
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Target Job"
                  description="Paste the job description you're aiming for."
                  icon={<Target className="w-6 h-6" />}
                  bgImageSeed="dart-target"
                >
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the full job description here..."
                    className="w-full h-[188px] p-5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50/50 resize-none text-sm leading-relaxed text-gray-700"
                  />
                </SectionCard>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 text-red-600 font-medium"
                >
                  <AlertCircle size={24} />
                  {error}
                </motion.div>
              )}

              <button
                onClick={startAnalysis}
                disabled={isAnalyzing}
                className="group relative w-full h-16 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-200 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    Processing with Advanced AI...
                  </>
                ) : (
                  <>
                    Generate My Career Suite
                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

            {/* History Section */}
            {history.length > 0 && (
              <div className="space-y-8 pt-12">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-gray-900">Recent Analyses</h2>
                  <p className="text-gray-500">Quickly access your recently optimized career suites.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {history.map((item, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ y: -4 }}
                      onClick={() => setAnalysis(item)}
                      className="p-6 bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all text-left space-y-3 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <FileText size={20} />
                        </div>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                          {item.matchPercentage}% Match
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 truncate">{item.personalDetails.name}</h4>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.summary}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setAnalysis(null)}
                className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-white px-4 py-2 rounded-xl border border-indigo-100 shadow-sm"
              >
                <RefreshCw size={16} />
                Start New Analysis
              </button>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] border border-gray-200 shadow-sm flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
              
              <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="74"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="transparent"
                    className="text-gray-100"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="74"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={464.7}
                    strokeDashoffset={464.7 - (464.7 * analysis.matchPercentage) / 100}
                    className="text-indigo-600 transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-gray-900">{analysis.matchPercentage}%</span>
                  <span className="text-xs uppercase tracking-[0.2em] font-black text-gray-400">Match</span>
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left space-y-4 relative z-10">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <h2 className="text-3xl font-black text-gray-900">{analysis.personalDetails.name}</h2>
                  <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
                    Analysis Ready
                  </div>
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-sm text-gray-500 font-medium">
                  <span className="flex items-center gap-2"><User size={16} className="text-indigo-400" /> {analysis.personalDetails.email}</span>
                  <span className="flex items-center gap-2"><Briefcase size={16} className="text-indigo-400" /> {analysis.personalDetails.location}</span>
                </div>
                <p className="text-gray-600 leading-relaxed text-lg italic">"{analysis.summary}"</p>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
              {[
                { id: 'resume', label: 'ATS Resume', icon: FileText },
                { id: 'cover', label: 'Cover Letter', icon: CheckCircle2 },
                { id: 'linkedin', label: 'LinkedIn Tips', icon: Linkedin },
                { id: 'skills', label: 'Skill Upgrades', icon: Youtube },
                { id: 'interview', label: 'Interview Prep', icon: MessageSquare },
                { id: 'roadmap', label: 'Career Roadmap', icon: Target },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm whitespace-nowrap transition-all border",
                    activeTab === tab.id 
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100" 
                      : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30"
                  )}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {activeTab === 'resume' && (
                  <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <FileText className="text-indigo-600" />
                        Optimized ATS Resume
                      </h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => copyToClipboard(analysis.atsResume, 'resume')}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          {copied === 'resume' ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                          {copied === 'resume' ? 'Copied!' : 'Copy'}
                        </button>
                        <button 
                          onClick={() => downloadPDF(resumeRef, 'ATS_Resume.pdf', 'resume')}
                          disabled={isDownloading === 'resume'}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                        >
                          {isDownloading === 'resume' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                          {isDownloading === 'resume' ? 'Generating...' : 'Download PDF'}
                        </button>
                      </div>
                    </div>
                    <div id="resume-container" ref={resumeRef} className="bg-white p-10 border border-gray-100 rounded-xl prose-resume shadow-sm">
                      <Markdown>{analysis.atsResume}</Markdown>
                    </div>
                  </div>
                )}

                {activeTab === 'cover' && (
                  <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <CheckCircle2 className="text-indigo-600" />
                        Tailored Cover Letter
                      </h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => copyToClipboard(analysis.coverLetter, 'cover')}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          {copied === 'cover' ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                          {copied === 'cover' ? 'Copied!' : 'Copy'}
                        </button>
                        <button 
                          onClick={() => downloadPDF(coverLetterRef, 'Cover_Letter.pdf', 'cover')}
                          disabled={isDownloading === 'cover'}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                        >
                          {isDownloading === 'cover' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                          {isDownloading === 'cover' ? 'Generating...' : 'Download PDF'}
                        </button>
                      </div>
                    </div>
                    <div id="cover-container" ref={coverLetterRef} className="bg-white p-10 border border-gray-100 rounded-xl prose-resume shadow-sm">
                      <Markdown>{analysis.coverLetter}</Markdown>
                    </div>
                  </div>
                )}

                {activeTab === 'linkedin' && (
                  <div className="p-8 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Linkedin className="text-indigo-600" />
                      LinkedIn Optimization
                    </h3>
                    <div className="grid gap-4">
                      {analysis.linkedinTips.map((tip, i) => (
                        <div key={i} className="flex gap-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {i + 1}
                          </div>
                          <p className="text-gray-700 leading-relaxed">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'skills' && (
                  <div className="p-8 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Youtube className="text-red-600" />
                      Skills to Upgrade
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {analysis.skillUpgrades.map((item, i) => (
                        <a 
                          key={i} 
                          href={item.youtubeLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-5 bg-white border border-gray-200 rounded-2xl hover:border-red-300 hover:bg-red-50/30 transition-all group"
                        >
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Skill</span>
                            <p className="font-bold text-gray-900">{item.skill}</p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Youtube size={20} />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'interview' && (
                  <div className="p-8 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <MessageSquare className="text-indigo-600" />
                      Interview Preparation
                    </h3>
                    <div className="space-y-6">
                      {analysis.interviewQuestions.map((item, i) => (
                        <div key={i} className="space-y-3">
                          <div className="flex gap-3">
                            <span className="font-black text-indigo-600">Q{i + 1}.</span>
                            <p className="font-bold text-gray-900">{item.question}</p>
                          </div>
                          <div className="ml-8 p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-600 italic">
                            <span className="font-bold text-gray-400 not-italic mr-2">TIP:</span>
                            {item.tip}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'roadmap' && (
                  <div className="p-8 space-y-8">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Target className="text-indigo-600" />
                      Career Roadmap
                    </h3>
                    <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-indigo-200 before:to-transparent">
                      {analysis.careerRoadmap.map((item, i) => (
                        <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-indigo-600 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                            {i + 1}
                          </div>
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all">
                            <h4 className="font-bold text-gray-900 mb-2">{item.step}</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* AI Optimizers Section - Always Visible */}
        <div className="space-y-12 pt-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-gray-900">Precision AI Optimizers</h2>
            <p className="text-gray-500">Fine-tune specific parts of your profile with targeted AI analysis.</p>
          </div>
          
          {analysis && (
            <div className="max-w-4xl mx-auto">
              <SectionCard
                title="Target Job Description"
                description="Update the job description here to refine the AI optimization below."
                icon={<Target className="w-6 h-6" />}
                bgImageSeed="dart-target"
              >
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="w-full h-32 p-5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50/50 resize-none text-sm leading-relaxed text-gray-700"
                />
              </SectionCard>
            </div>
          )}

          <div className="space-y-8">
            <Optimizer 
              type="summary" 
              jobDescription={jobDescription} 
              initialContent={analysis?.summary}
            />
            <Optimizer 
              type="experience" 
              jobDescription={jobDescription} 
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-8 border-t border-gray-200 text-center text-gray-400 text-sm">
        <p>© 2026 ResumeAI. Powered by Advanced Career AI.</p>
      </footer>
    </div>
  );
}
