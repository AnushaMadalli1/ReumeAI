import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SectionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  bgImageSeed: string;
  children: React.ReactNode;
  className?: string;
}

export default function SectionCard({ title, description, icon, bgImageSeed, children, className }: SectionCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "relative overflow-hidden bg-white rounded-3xl border border-gray-200 shadow-sm transition-all hover:shadow-md",
        className
      )}
    >
      {/* Background Image Overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
        <img 
          src={`https://picsum.photos/seed/${bgImageSeed}/1200/800`} 
          alt="" 
          className="w-full h-full object-cover grayscale"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="relative z-10 p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
            {icon}
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="pt-2">
          {children}
        </div>
      </div>
    </motion.div>
  );
}
