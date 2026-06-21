import { Search, TrendingDown, Zap, CheckCircle2, Pill } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Hero from '../components/Hero';

const medicines = [
  { name: 'Paracetamol 500mg', brand: '₹85', generic: '₹12', saving: 86 },
  { name: 'Metformin 850mg', brand: '₹120', generic: '₹8', saving: 93 },
  { name: 'Atorvastatin 10mg', brand: '₹200', generic: '₹22', saving: 89 },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />
      
      <main>
        <Hero />

        {/* Features Section */}
        <section id="features" className="py-24 bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Intelligence-Driven Savings</h2>
              <p className="mt-4 text-xl text-gray-500 dark:text-slate-400">More than just price comparison. It's healthcare optimization.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Search className="w-6 h-6 text-blue-600" />}
                title="Deep Salt Analysis"
                description="We break down medicines to their base salts to find exact bioequivalent alternatives that cost much less."
              />
              <FeatureCard 
                icon={<TrendingDown className="w-6 h-6 text-green-600" />}
                title="SmartBuy Strategy"
                description="Our engine recommends where to buy each item in your list to maximize total savings with minimum effort."
              />
              <FeatureCard 
                icon={<Zap className="w-6 h-6 text-indigo-600" />}
                title="Real-time Inventory"
                description="Connected to major local and online pharmacies to show current availability and delivery speeds."
              />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 bg-gray-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Efficiency in 3 Steps</h2>
                <div className="space-y-8">
                  <Step icon="01" title="Upload or Type Prescription" text="Enter the medicine names or upload a clear photo of your physical script." />
                  <Step icon="02" title="Analysis & Optimization" text="Our engine identifies generic salts and polls real-time prices across pharmacies." />
                  <Step icon="03" title="Save up to 80%" text="Get a personalized buy plan and pharmacist scripts to start saving immediately." />
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-blue-400 rounded-[3rem] blur-2xl opacity-20 scale-95" />
                <div className="relative bg-blue-600 rounded-[3rem] p-3.5 shadow-2xl shadow-blue-200 aspect-square flex items-center justify-center">
                  <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full h-full p-6 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Pill className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-white">Prescription Analysis</p>
                          <p className="text-[10px] text-slate-400">3 medicines detected</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">✓ Optimized</span>
                    </div>

                    <div className="space-y-2 flex-1 my-2">
                      {medicines.map((med, i) => (
                        <div key={i} className="bg-slate-50 dark:bg-slate-700 rounded-2xl px-4 py-3 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-700 dark:text-white">{med.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-400 line-through">{med.brand}</span>
                              <span className="text-[10px] font-bold text-green-600">{med.generic}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                              -{med.saving}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-100 dark:border-slate-600 pt-3">
                      <div className="mb-3">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>Savings progress</span>
                          <span className="font-bold text-green-600">64% saved</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-slate-600 rounded-full overflow-hidden">
                          <div className="h-full w-[64%] bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[10px] text-slate-400">You save</p>
                          <p className="text-lg font-black text-slate-800 dark:text-white">₹1,247 <span className="text-green-500 text-sm">/ month</span></p>
                        </div>
                        <div className="bg-blue-600 rounded-2xl px-4 py-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span className="text-white text-xs font-bold">View Plan</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 dark:bg-slate-950">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="bg-gray-900 dark:bg-slate-800 rounded-[3rem] py-16 px-8 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_50%_120%,#3b82f6,transparent)]" />
               <h2 className="text-4xl font-bold text-white mb-6 relative">Ready to optimize your health spending?</h2>
               <p className="text-gray-400 text-lg mb-10 relative">Join thousands of users saving an average of ₹1,200 per month.</p>
               <Link 
                to="/analyze" 
                className="inline-flex items-center bg-blue-600 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-blue-700 transition-all relative shadow-xl shadow-blue-500/20"
               >
                 Start Free Analysis
                 <Zap className="ml-2 w-5 h-5 fill-current" />
               </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="p-8 rounded-[2rem] border border-gray-100 dark:border-slate-700 hover:border-blue-100 dark:hover:border-blue-800 hover:shadow-xl hover:shadow-blue-50/50 dark:hover:shadow-blue-900/20 transition-all duration-300 dark:bg-slate-800">
      <div className="w-12 h-12 bg-gray-50 dark:bg-slate-700 rounded-xl flex items-center justify-center mb-6">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
      <p className="text-gray-500 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ icon, title, text }: any) {
  return (
    <div className="flex items-start space-x-4">
      <div className="text-4xl font-black text-blue-100 dark:text-blue-900 leading-none">{icon}</div>
      <div>
        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{title}</h4>
        <p className="text-gray-500 dark:text-slate-400">{text}</p>
      </div>
    </div>
  );
}