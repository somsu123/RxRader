import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import { motion } from 'motion/react';
import { ShoppingCart, Share2, Search, TrendingDown, CheckCircle, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main>
        <Hero />

        {/* Features Section */}
        <section id="features" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Intelligence-Driven Savings</h2>
              <p className="mt-4 text-xl text-gray-500">More than just price comparison. It's healthcare optimization.</p>
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
        <section id="how-it-works" className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">Efficiency in 3 Steps</h2>
                <div className="space-y-8">
                  <Step icon="01" title="Upload or Type Prescription" text="Enter the medicine names or upload a clear photo of your physical script." />
                  <Step icon="02" title="Analysis & Optimization" text="Our engine identifies generic salts and polls real-time prices across pharmacies." />
                  <Step icon="03" title="Save up to 80%" text="Get a personalized buy plan and pharmacist scripts to start saving immediately." />
                </div>
              </div>
              <div className="relative">
                <div className="bg-blue-600 rounded-[3rem] p-4 shadow-2xl shadow-blue-200 aspect-square flex items-center justify-center">
                  <div className="bg-white rounded-[2.5rem] w-full h-full p-8 flex flex-col justify-center">
                    <div className="space-y-4">
                      <div className="h-4 bg-gray-100 rounded-full w-3/4" />
                      <div className="h-4 bg-gray-100 rounded-full w-1/2" />
                      <div className="h-12 bg-blue-50 rounded-2xl w-full flex items-center px-4">
                        <div className="w-6 h-6 bg-blue-600 rounded-full mr-3 animate-pulse" />
                        <div className="h-2 bg-blue-200 rounded-full w-1/2" />
                      </div>
                      <div className="pt-4 border-t border-gray-50">
                        <div className="flex justify-between items-center">
                          <div className="h-3 bg-green-100 rounded-full w-1/4" />
                          <div className="h-6 bg-green-600 rounded-full w-1/3" />
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
        <section className="py-24">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="bg-gray-900 rounded-[3rem] py-16 px-8 relative overflow-hidden">
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
    <div className="p-8 rounded-[2rem] border border-gray-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-50/50 transition-all duration-300">
      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-6">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ icon, title, text }: any) {
  return (
    <div className="flex items-start space-x-4">
      <div className="text-4xl font-black text-blue-100 leading-none">{icon}</div>
      <div>
        <h4 className="text-lg font-bold text-gray-900 mb-1">{title}</h4>
        <p className="text-gray-500">{text}</p>
      </div>
    </div>
  );
}
