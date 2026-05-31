export interface Medicine {
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

export interface Alternative {
  medicine: Medicine;
  matchType: 'exact' | 'generic' | 'class' | 'action';
  matchReason: string;
  priceDifference: number;
  savingsPercentage: number;
}