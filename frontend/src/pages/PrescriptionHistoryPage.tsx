import { useState, useEffect } from 'react';
import { db, Prescription } from '../db/prescriptionDB';
import { Trash2, Download, Search, Calendar, FileText, Printer, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Navbar from '../components/Navbar';

export default function PrescriptionHistoryPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  async function loadPrescriptions() {
    try {
      const allPrescriptions = await db.prescriptions.orderBy('date').reverse().toArray();
      setPrescriptions(allPrescriptions);
    } catch (error) {
      console.error('Failed to load prescriptions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deletePrescription(id: number) {
    if (confirm('Are you sure you want to delete this prescription?')) {
      await db.prescriptions.delete(id);
      await loadPrescriptions();
    }
  }

  async function deleteAllPrescriptions() {
    if (confirm('Delete all prescriptions? This action cannot be undone.')) {
      await db.prescriptions.clear();
      await loadPrescriptions();
    }
  }

  function exportToPDF(prescription: Prescription) {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 100);
    doc.text('Prescription Analysis Report', 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Report ID: ${prescription.uniqueId}`, 20, 35);
    doc.text(`Date: ${new Date(prescription.date).toLocaleString()}`, 20, 42);
    
    const tableData = prescription.medicines.map(med => [
      med.name,
      med.quantity,
      `₹${med.price}`,
      `₹${med.price * med.quantity}`
    ]);
    
    autoTable(doc, {
      startY: 55,
      head: [['Medicine Name', 'Quantity', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [40, 40, 100], textColor: 255 },
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Cost: ₹${prescription.totalCost}`, 20, finalY);
    doc.setTextColor(34, 197, 94);
    doc.text(`Savings: ₹${prescription.savingsAmount}`, 20, finalY + 8);
    
    if (prescription.pharmacyName) {
      doc.setTextColor(100, 100, 100);
      doc.text(`Pharmacy: ${prescription.pharmacyName}`, 20, finalY + 20);
    }
    
    doc.save(`prescription_${prescription.uniqueId}.pdf`);
  }

  function exportAllToPDF() {
    const doc = new jsPDF();
    
    doc.setFontSize(24);
    doc.setTextColor(40, 40, 100);
    doc.text('All Prescriptions Report', 20, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 32);
    doc.text(`Total Prescriptions: ${prescriptions.length}`, 20, 39);
    
    let yOffset = 55;
    
    for (let i = 0; i < prescriptions.length; i++) {
      const p = prescriptions[i];
      
      if (yOffset > 250) {
        doc.addPage();
        yOffset = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 100);
      doc.text(`Prescription #${i + 1}: ${p.uniqueId}`, 20, yOffset);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Date: ${new Date(p.date).toLocaleString()}`, 20, yOffset + 7);
      
      const tableData = p.medicines.map(med => [med.name, med.quantity, `₹${med.price}`, `₹${med.price * med.quantity}`]);
      
      autoTable(doc, {
        startY: yOffset + 12,
        head: [['Medicine', 'Qty', 'Unit', 'Total']],
        body: tableData,
        theme: 'striped',
        margin: { left: 20 },
        headStyles: { fillColor: [40, 40, 100] },
      });
      
      yOffset = (doc as any).lastAutoTable.finalY + 15;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Total: ₹${p.totalCost}`, 140, yOffset);
      doc.setTextColor(34, 197, 94);
      doc.text(`Savings: ₹${p.savingsAmount}`, 140, yOffset + 6);
      
      yOffset += 20;
    }
    
    doc.save('all_prescriptions.pdf');
  }

  const filteredPrescriptions = prescriptions.filter(p => {
    if (searchTerm && !p.uniqueId.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    const now = new Date();
    const presDate = new Date(p.date);
    const diffDays = Math.floor((now.getTime() - presDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dateRange === 'week' && diffDays > 7) return false;
    if (dateRange === 'month' && diffDays > 30) return false;
    
    return true;
  });

  const totalSavings = filteredPrescriptions.reduce((sum, p) => sum + p.savingsAmount, 0);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
            <ArrowLeft className="size-4" />
            BACK TO DASHBOARD
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Prescription History</h1>
            <p className="text-gray-500 mt-2">Track and manage your past prescription analyses</p>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by ID..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setDateRange('week')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    dateRange === 'week' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setDateRange('month')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    dateRange === 'month' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => setDateRange('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    dateRange === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Time
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-1">Total Prescriptions</p>
              <p className="text-3xl font-bold text-gray-900">{filteredPrescriptions.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-1">Total Savings</p>
              <p className="text-3xl font-bold text-green-600">₹{totalSavings}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-1">Average Savings</p>
              <p className="text-3xl font-bold text-blue-600">
                ₹{filteredPrescriptions.length > 0 ? Math.round(totalSavings / filteredPrescriptions.length) : 0}
              </p>
            </div>
          </div>

          {/* Export All Button */}
          {filteredPrescriptions.length > 0 && (
            <div className="mb-6 flex justify-end">
              <button
                onClick={exportAllToPDF}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
              >
                <Printer className="size-4" />
                Export All to PDF
              </button>
            </div>
          )}

          {/* Prescriptions List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-3">Loading prescriptions...</p>
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-16">
              <FileText className="size-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No prescriptions found</h3>
              <p className="text-gray-500">Analysis results will appear here after you analyze a prescription</p>
              <Link 
                to="/analyze" 
                className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
              >
                Analyze Prescription
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPrescriptions.map((pres) => (
                <div key={pres.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-mono text-sm font-medium text-gray-500">{pres.uniqueId}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Calendar className="size-3" />
                        {new Date(pres.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => exportToPDF(pres)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Export PDF"
                      >
                        <Download className="size-4" />
                      </button>
                      <button
                        onClick={() => pres.id && deletePrescription(pres.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    {pres.medicines.map((med, idx) => (
                      <div key={idx} className="flex justify-between py-2">
                        <span className="text-gray-700">{med.name} x{med.quantity}</span>
                        <span className="font-medium text-gray-900">₹{med.price * med.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-xl font-bold text-gray-900">₹{pres.totalCost}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-600">Savings</p>
                      <p className="text-xl font-bold text-green-600">₹{pres.savingsAmount}</p>
                    </div>
                  </div>
                  
                  {pres.pharmacyName && (
                    <div className="mt-3 text-sm text-gray-500">
                      Pharmacy: {pres.pharmacyName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}