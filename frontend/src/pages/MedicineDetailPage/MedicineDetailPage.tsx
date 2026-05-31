import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Pill, AlertCircle, TrendingDown, Loader2 } from 'lucide-react';
import { getMedicineById, findAlternatives } from '../../lib/medicineData';
import SubstitutionModal from '../../components/medicines/SubstitutionModal';

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  brandName: string;
  price: number;
  pharmacologicalClass: string;
  therapeuticAction: string;
  manufacturer: string;
  dosageForms: string[];
  strengths: string[];
}

interface Alternative {
  medicine: Medicine;
  matchType: 'exact' | 'generic' | 'class' | 'action';
  matchReason: string;
  priceDifference: number;
  savingsPercentage: number;
}

export default function MedicineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      const medicineData = getMedicineById(id);
      if (medicineData) {
        setMedicine(medicineData);
        const altData = findAlternatives(id);
        setAlternatives(altData);
      }
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="size-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">Loading medicine details...</p>
        </div>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="size-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600">Medicine not found</p>
          <Link to="/" className="text-blue-600 mt-4 inline-block">← Back to Home</Link>
        </div>
      </div>
    );
  }

  const cheaperAlternatives = alternatives.filter(a => a.priceDifference < 0);
  const totalSavings = cheaperAlternatives.reduce((sum, a) => sum + Math.abs(a.priceDifference), 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link to="/" className="inline-block mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-1">
          ← Back to Home
        </Link>

        {/* Medicine Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Pill className="size-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{medicine.name}</h1>
                  <p className="text-gray-600">{medicine.genericName} | {medicine.manufacturer}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Price</p>
                <p className="text-2xl font-bold text-gray-900">₹{medicine.price}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Therapeutic Action</p>
                <p className="text-sm font-medium text-gray-900">{medicine.therapeuticAction}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Pharmacological Class</p>
                <p className="text-sm font-medium text-gray-900">{medicine.pharmacologicalClass}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Dosage Forms</p>
                <p className="text-sm font-medium text-gray-900">{medicine.dosageForms.join(", ")}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Strengths</p>
                <p className="text-sm font-medium text-gray-900">{medicine.strengths.join(", ")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alternatives Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
              <h2 className="text-xl font-bold text-gray-900">Therapeutic Alternatives</h2>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
              >
                <TrendingDown className="size-4" />
                Find Alternatives ({alternatives.length})
              </button>
            </div>

            {alternatives.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No direct alternatives found for this medicine.</p>
                <p className="text-sm text-gray-400 mt-2">Consult your doctor for alternative options.</p>
              </div>
            ) : (
              <>
                {cheaperAlternatives.length > 0 && (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700">
                      💰 You could save up to ₹{totalSavings} by switching to a cheaper alternative!
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {alternatives.slice(0, 3).map((alt, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{alt.medicine.name}</p>
                          <p className="text-xs text-gray-500">{alt.matchReason}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">₹{alt.medicine.price}</p>
                          {alt.priceDifference < 0 && (
                            <p className="text-xs text-green-600">Save ₹{Math.abs(alt.priceDifference)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {alternatives.length > 3 && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="w-full text-center text-blue-600 text-sm py-2 hover:underline"
                    >
                      + View all {alternatives.length} alternatives
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-xs text-yellow-700 text-center">
            ⚠️ Medical Disclaimer: Always consult your doctor or pharmacist before switching medications. 
            This information is for educational purposes only.
          </p>
        </div>
      </div>

      {/* Substitution Modal */}
      <SubstitutionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        originalMedicine={medicine}
        alternatives={alternatives}
      />
    </div>
  );
}