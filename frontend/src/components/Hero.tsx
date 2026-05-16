import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Zap, ShieldCheck, HeartPulse } from 'lucide-react';
import { Link } from 'react-router-dom';
import HowItWorksModal from './HowItWorksModal';
import Button from './ui/Button';
export default function Hero() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="relative pt-32 pb-20 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] opacity-30 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-indigo-400 rounded-full blur-[96px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider mb-8">
            <Zap className="w-3.5 h-3.5 mr-2 fill-current" />
            Smart Price Discovery Engine
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-8 leading-[1.1]">
            Stop Overpaying for <span className="text-blue-600">Health.</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
            RxRadar instantly analyzes your prescription to find the best local prices and suggests bioequivalent generic alternatives that save you up to 80%.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/analyze" className="inline-block">
  <Button
    variant="primary"
    size="lg"
    className="group rounded-2xl shadow-xl shadow-blue-200 flex items-center active:scale-95"
  >
    Analyze Prescription
    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
  </Button>
</Link>
            <Button
  variant="secondary"
  size="lg"
  onClick={() => setIsModalOpen(true)}
  className="rounded-2xl text-gray-600"
>
  See How it Works
</Button>
          </div>

          <div className="mt-20 grid grid-cols-2 md:grid-cols-3 gap-8 items-center opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center justify-center space-x-2">
              <ShieldCheck className="w-6 h-6" />
              <span className="font-bold">FDA Validated Salts</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <HeartPulse className="w-6 h-6" />
              <span className="font-bold">Real-time Stores</span>
            </div>
            <div className="flex items-center justify-center space-x-2 hidden md:flex">
              <Zap className="w-6 h-6" />
              <span className="font-bold">Instant Savings</span>
            </div>
          </div>
        </motion.div>
      </div>
      
      <HowItWorksModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
