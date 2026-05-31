import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Pill, ArrowLeft, Loader2 } from 'lucide-react';
import Navbar from '../../components/Navbar';

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  price: number;
  manufacturer: string;
  therapeuticAction: string;
  pharmacologicalClass: string;
  dosageForms: string[];
  strengths: string[];
}

export default function MedicineDetailPage() {
  const { id } = useParams();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for testing
    const mockMedicine: Medicine = {
      id: id || '1',
      name: 'Crocin 500mg',
      genericName: 'Paracetamol',
      price: 25,
      manufacturer: 'GSK',
      therapeuticAction: 'Pain Relief & Fever Reduction',
      pharmacologicalClass: 'Analgesics and Antipyretics',
      dosageForms: ['Tablet', 'Syrup'],
      strengths: ['500mg', '650mg']
    };
    setMedicine(mockMedicine);
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-blue-600" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
            <ArrowLeft className="size-4" />
            BACK TO HOME
          </Link>
          
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h1 className="text-2xl font-bold text-gray-900">{medicine?.name}</h1>
            <p className="text-gray-600 mt-1">{medicine?.genericName} | {medicine?.manufacturer}</p>
            <div className="mt-4 text-right">
              <p className="text-2xl font-bold text-gray-900">₹{medicine?.price}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}