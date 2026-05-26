import { TrendingDown, TrendingUp } from "lucide-react";

interface AlternativeCardProps {
  alternative: {
    medicine: {
      id: string;
      name: string;
      genericName: string;
      price: number;
    };
    matchType: 'exact' | 'generic' | 'class' | 'action';
    matchReason: string;
    priceDifference: number;
    savingsPercentage: number;
  };
  originalPrice: number;
}

export default function AlternativeCard({ alternative, originalPrice }: AlternativeCardProps) {
  const isCheaper = alternative.priceDifference < 0;
  const savings = Math.abs(alternative.priceDifference);

  const getMatchBadge = () => {
    switch (alternative.matchType) {
      case 'exact':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">Generic Equivalent</span>;
      case 'class':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">Same Class</span>;
      case 'action':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">Same Action</span>;
      default:
        return null;
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{alternative.medicine.name}</h3>
          <p className="text-sm text-gray-600">{alternative.medicine.genericName}</p>
        </div>
        {getMatchBadge()}
      </div>

      <p className="text-sm text-gray-600 mb-3">{alternative.matchReason}</p>

      <div className="flex justify-between items-center pt-3 border-t">
        <div>
          <p className="text-xs text-gray-500">Price</p>
          <p className="text-lg font-bold text-gray-900">₹{alternative.medicine.price}</p>
          <p className="text-xs text-gray-500">Original: ₹{originalPrice}</p>
        </div>

        {isCheaper ? (
          <div className="text-right">
            <div className="flex items-center gap-1 text-green-600">
              <TrendingDown className="size-4" />
              <span className="text-sm font-semibold">Save ₹{savings}</span>
            </div>
            <p className="text-xs text-green-600">{alternative.savingsPercentage}% cheaper</p>
          </div>
        ) : (
          <div className="text-right">
            <div className="flex items-center gap-1 text-red-600">
              <TrendingUp className="size-4" />
              <span className="text-sm font-semibold">₹{savings} more</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}