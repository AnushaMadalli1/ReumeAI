import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Loader2, Copy, Check, Wand2, AlertCircle } from 'lucide-react';
import Markdown from 'react-markdown';
import { optimizeContent } from '../services/gemini';
import SectionCard from './SectionCard';

interface OptimizerProps {
  type: 'summary' | 'experience';
  jobDescription: string;
  initialContent?: string;
}

export default function Optimizer({ type, jobDescription, initialContent = '' }: OptimizerProps) {
  const [content, setContent] = useState(initialContent);
  const [optimized, setOptimized] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Update content if initialContent changes (e.g. when analysis is generated)
  useEffect(() => {
    if (initialContent && !content) {
      setContent(initialContent);
    }
  }, [initialContent]);

  const handleOptimize = async () => {
    if (!content.trim()) {
      alert("Please paste your content first.");
      return;
    }
    if (!jobDescription.trim()) {
      alert("Please paste a Job Description at the top first so AI can optimize your content for it.");
      return;
    }
    
    setIsOptimizing(true);
    try {
      const result = await optimizeContent(type, content, jobDescription);
      if (!result) throw new Error("No response from AI");
      setOptimized(result);
    } catch (err) {
      console.error(err);
      alert("Failed to optimize content. Please check your connection and try again.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(optimized);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SectionCard
      title={`AI ${type === 'summary' ? 'Summary' : 'Experience'} Optimizer`}
      description={`Paste your ${type} and let AI optimize it for the job description.`}
      icon={<Wand2 className="w-6 h-6" />}
      bgImageSeed={type === 'summary' ? 'writing' : 'office'}
    >
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Your {type}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Paste your ${type} here...`}
            className="w-full h-64 p-5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-gray-50/50 resize-none text-gray-700 leading-relaxed"
          />
          <button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 active:scale-[0.98]"
          >
            {isOptimizing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {isOptimizing ? 'Optimizing...' : `Optimize ${type}`}
          </button>
          {(!content.trim() || !jobDescription.trim()) && !isOptimizing && (
            <p className="text-xs text-center text-gray-400 italic">
              {!content.trim() ? `Enter your ${type} to start.` : "Paste a Job Description at the top to enable optimization."}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider">
              AI Optimized {type}
            </label>
            {optimized && (
              <button 
                onClick={copyToClipboard}
                className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
          <div className="w-full h-64 p-5 border border-gray-200 rounded-2xl bg-white overflow-y-auto prose prose-sm max-w-none text-gray-700 shadow-inner">
            {isOptimizing ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
                <p className="text-sm text-indigo-600 font-medium animate-pulse">AI is working its magic...</p>
              </div>
            ) : optimized ? (
              <Markdown>{optimized}</Markdown>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                <Sparkles className="w-10 h-10 opacity-20" />
                <p className="text-sm italic">Optimized content will appear here...</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {!jobDescription.trim() && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-bold">Job Description Missing</p>
            <p>Please scroll to the top and paste the <strong>Target Job Description</strong>. AI needs it to know what skills and keywords to emphasize in your {type}.</p>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
