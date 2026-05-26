import { Medicine, Alternative } from "../types/medicine";

// Medicine database
const medicines: Medicine[] = [
  {
    id: "1",
    name: "Crocin 500mg",
    genericName: "Paracetamol",
    brandName: "Crocin",
    price: 25,
    pharmacologicalClass: "Analgesics and Antipyretics",
    therapeuticAction: "Pain Relief & Fever Reduction",
    manufacturer: "GSK",
    dosageForms: ["Tablet", "Syrup"],
    strengths: ["500mg", "650mg"]
  },
  {
    id: "2",
    name: "Dolo 650mg",
    genericName: "Paracetamol",
    brandName: "Dolo",
    price: 30,
    pharmacologicalClass: "Analgesics and Antipyretics",
    therapeuticAction: "Pain Relief & Fever Reduction",
    manufacturer: "Micro Labs",
    dosageForms: ["Tablet"],
    strengths: ["650mg"]
  },
  {
    id: "3",
    name: "P 500mg",
    genericName: "Paracetamol",
    brandName: "P",
    price: 20,
    pharmacologicalClass: "Analgesics and Antipyretics",
    therapeuticAction: "Pain Relief & Fever Reduction",
    manufacturer: "Cipla",
    dosageForms: ["Tablet"],
    strengths: ["500mg"]
  },
  {
    id: "4",
    name: "Calpol 500mg",
    genericName: "Paracetamol",
    brandName: "Calpol",
    price: 28,
    pharmacologicalClass: "Analgesics and Antipyretics",
    therapeuticAction: "Pain Relief & Fever Reduction",
    manufacturer: "Johnson & Johnson",
    dosageForms: ["Tablet", "Suspension"],
    strengths: ["500mg", "650mg"]
  }
];

export function getMedicineById(id: string): Medicine | undefined {
  return medicines.find(m => m.id === id);
}

export function getAllMedicines(): Medicine[] {
  return medicines;
}

export function findAlternatives(medicineId: string): Alternative[] {
  const originalMedicine = getMedicineById(medicineId);
  if (!originalMedicine) return [];

  const alternatives: Alternative[] = [];

  for (const candidate of medicines) {
    if (candidate.id === medicineId) continue;

    let matchType: 'exact' | 'generic' | 'class' | 'action' | null = null;
    let matchReason = '';

    if (candidate.genericName === originalMedicine.genericName) {
      matchType = 'exact';
      matchReason = `Same active ingredient: ${candidate.genericName}. Generic equivalent.`;
    }
    else if (candidate.pharmacologicalClass === originalMedicine.pharmacologicalClass) {
      matchType = 'class';
      matchReason = `Same class: ${candidate.pharmacologicalClass}. Similar action.`;
    }
    else if (candidate.therapeuticAction === originalMedicine.therapeuticAction) {
      matchType = 'action';
      matchReason = `Same therapeutic action: ${candidate.therapeuticAction}.`;
    }

    if (matchType) {
      const priceDifference = candidate.price - originalMedicine.price;
      const savingsPercentage = originalMedicine.price > 0 
        ? Math.round((Math.abs(priceDifference) / originalMedicine.price) * 100) 
        : 0;

      alternatives.push({
        medicine: candidate,
        matchType,
        matchReason,
        priceDifference,
        savingsPercentage
      });
    }
  }

  return alternatives.sort((a, b) => a.medicine.price - b.medicine.price);
}