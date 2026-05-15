import { useState } from 'react';
import { X, TrendingDown } from 'lucide-react';
import AlternativeCard from './AlternativeCard';

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  price: number;
  pharmacologicalClass: string;
  therapeuticAction: string;
}

interface Alternative {
  medicine: Medicine;
  matchType: 'exact' | 'generic' | 'class' | 'action';
  matchReason: string;
  priceDifference: number;
  savingsPercentage: number;
}

interface SubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalMedicine: Medicine;
  alternatives: Alternative[];
}

export default function SubstitutionModal({
  isOpen,
  onClose,
  originalMedicine,
  alternatives
}: SubstitutionModalProps) {
  const [filter, setFilter] = useState<'all' | 'generic' | 'cheaper'>('all');

  if (!isOpen) return null;

  const filteredAlternatives = alternatives.filter(alt => {
    if (filter === 'generic') return alt.matchType === 'exact';
    if (filter === 'cheaper') return alt.priceDifference < 0;
    return true;
  });

  const totalSavings = alternatives
    .filter(alt => alt.priceDifference < 0)
    .reduce((sum, alt) => sum + Math.abs(alt.priceDifference), 0);

  const cheaperCount = alternatives.filter(alt => alt.priceDifference < 0).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Medicine Alternatives</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-4 border-b bg-blue-50">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Original Prescription</h3>
          <div className="flex justify-between">
            <div>
              <p className="font-semibold">{originalMedicine.name}</p>
              <p className="text-sm text-gray-600">{originalMedicine.genericName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Price</p>
              <p className="text-xl font-bold">₹{originalMedicine.price}</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b">
          <div className="flex gap-2">
            <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-sm rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
              All ({alternatives.length})
            </button>
            <button onClick={() => setFilter('generic')} className={`px-3 py-1.5 text-sm rounded-lg ${filter === 'generic' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>
              Generic Only
            </button>
            <button onClick={() => setFilter('cheaper')} className={`px-3 py-1.5 text-sm rounded-lg ${filter === 'cheaper' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>
              Cheaper Only ({cheaperCount})
            </button>
          </div>
          {cheaperCount > 0 && (
            <div className="mt-3 flex items-center gap-2 text-green-600">
              <TrendingDown className="size-4" />
              <span className="text-sm font-medium">Potential Savings: ₹{totalSavings}</span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-4">
          {filteredAlternatives.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No alternatives match your filter.</div>
          ) : (
            filteredAlternatives.map((alt, idx) => (
              <AlternativeCard key={idx} alternative={alt} originalPrice={originalMedicine.price} />
            ))
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            ⚠️ Always consult your doctor before switching medications.
          </p>
        </div>
      </div>
    </div>
  );
}