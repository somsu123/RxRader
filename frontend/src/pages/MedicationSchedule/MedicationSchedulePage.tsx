import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Bell, Calendar as CalendarIcon, Clock, CheckCircle, XCircle, Pill, AlertTriangle, Trash2 } from 'lucide-react';
import Calendar from 'react-calendar';
import { format, isSameDay, parse, addDays } from 'date-fns';
import { medDB, Medication, Schedule } from '../../db/medicationDB';
import Navbar from '../../components/Navbar';
import 'react-calendar/dist/Calendar.css';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function MedicationSchedulePage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'daily',
    times: ['09:00'],
    startDate: new Date().toISOString().split('T')[0],
    refillReminder: true,
    stockQuantity: 30,
    refillThreshold: 5,
    notes: ''
  });

  useEffect(() => {
    loadData();
    requestNotificationPermission();
  }, []);

  async function loadData() {
    try {
      const allMeds = await medDB.medications.toArray();
      const allSchedules = await medDB.schedules.toArray();
      setMedications(allMeds);
      setSchedules(allSchedules);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission === 'granted');
    }
  }

  async function addMedication(e: React.FormEvent) {
    e.preventDefault();
    
    const medication: Medication = {
      name: formData.name,
      dosage: formData.dosage,
      frequency: formData.frequency as any,
      times: formData.times,
      startDate: new Date(formData.startDate),
      refillReminder: formData.refillReminder,
      stockQuantity: formData.stockQuantity,
      refillThreshold: formData.refillThreshold,
      notes: formData.notes
    };
    
    const id = await medDB.medications.add(medication);
    await generateSchedules(id, medication);
    
    setShowAddModal(false);
    setFormData({
      name: '',
      dosage: '',
      frequency: 'daily',
      times: ['09:00'],
      startDate: new Date().toISOString().split('T')[0],
      refillReminder: true,
      stockQuantity: 30,
      refillThreshold: 5,
      notes: ''
    });
    loadData();
    
    if (notificationPermission) {
      new Notification('Medication Added', {
        body: `${medication.name} has been added to your schedule.`,
      });
    }
  }

  async function generateSchedules(medicationId: number, medication: Medication) {
    const schedulesToAdd: Schedule[] = [];
    const startDate = new Date(medication.startDate);
    const endDate = addDays(startDate, 30);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      for (const time of medication.times) {
        const [hours, minutes] = time.split(':');
        const scheduledTime = new Date(d);
        scheduledTime.setHours(parseInt(hours), parseInt(minutes));
        
        schedulesToAdd.push({
          medicationId,
          scheduledTime,
          taken: false,
          skipped: false
        });
      }
    }
    
    await medDB.schedules.bulkAdd(schedulesToAdd);
  }

  async function toggleTaken(scheduleId: number, currentStatus: boolean) {
    await medDB.schedules.update(scheduleId, { 
      taken: !currentStatus, 
      takenAt: !currentStatus ? new Date() : undefined 
    });
    loadData();
  }

  async function deleteMedication(id: number) {
    if (confirm('Delete this medication and all its schedules?')) {
      await medDB.medications.delete(id);
      await medDB.schedules.where('medicationId').equals(id).delete();
      loadData();
    }
  }

  function getTodaySchedules() {
    return schedules.filter(s => {
      const scheduleDate = new Date(s.scheduledTime);
      return isSameDay(scheduleDate, selectedDate) && !s.taken;
    });
  }

  function getUpcomingRefills() {
    return medications.filter(m => 
      m.refillReminder && m.stockQuantity <= m.refillThreshold
    );
  }

  function getCompletedCount() {
    const today = new Date();
    return schedules.filter(s => {
      const scheduleDate = new Date(s.scheduledTime);
      return isSameDay(scheduleDate, today) && s.taken === true;
    }).length;
  }

  const todaySchedules = getTodaySchedules();
  const upcomingRefills = getUpcomingRefills();
  const completedCount = getCompletedCount();
  const totalToday = schedules.filter(s => isSameDay(new Date(s.scheduledTime), new Date())).length;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
                <ArrowLeft className="size-4" />
                BACK TO DASHBOARD
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Medication Schedule</h1>
              <p className="text-gray-500 mt-1">Track your daily medications and refill reminders</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="size-4" />
              Add Medication
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <p className="text-sm text-gray-500">Medications</p>
              <p className="text-2xl font-bold text-gray-900">{medications.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <p className="text-sm text-gray-500">Today's Doses</p>
              <p className="text-2xl font-bold text-gray-900">{totalToday}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedCount}/{totalToday}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <p className="text-sm text-gray-500">Refill Alerts</p>
              <p className="text-2xl font-bold text-yellow-600">{upcomingRefills.length}</p>
            </div>
          </div>

          {/* Refill Alerts */}
          {upcomingRefills.length > 0 && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Refill Reminders</h3>
                  <p className="text-sm text-yellow-700">
                    {upcomingRefills.map(m => `${m.name} (${m.stockQuantity} left)`).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <Calendar
                  onChange={setSelectedDate}
                  value={selectedDate}
                  tileClassName={({ date, view }) => {
                    const hasSchedule = schedules.some(s => isSameDay(new Date(s.scheduledTime), date));
                    if (hasSchedule && view === 'month') {
                      return 'bg-blue-100 rounded-full';
                    }
                    return '';
                  }}
                />
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </h2>
                </div>
                <div className="p-4">
                  {todaySchedules.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="size-12 text-green-400 mx-auto mb-3" />
                      <p>No medications scheduled for today!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todaySchedules.map((schedule) => {
                        const medication = medications.find(m => m.id === schedule.medicationId);
                        return (
                          <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Pill className="size-5 text-blue-500" />
                              <div>
                                <p className="font-medium text-gray-900">{medication?.name}</p>
                                <p className="text-sm text-gray-500">
                                  {format(new Date(schedule.scheduledTime), 'h:mm a')} - {medication?.dosage}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => schedule.id && toggleTaken(schedule.id, schedule.taken)}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                            >
                              Mark Taken
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Medications List */}
          {medications.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Medications</h2>
              <div className="space-y-3">
                {medications.map((med) => (
                  <div key={med.id} className="bg-white rounded-xl shadow-sm border p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{med.name}</p>
                      <p className="text-sm text-gray-500">{med.dosage} - {med.frequency}</p>
                      {med.stockQuantity <= med.refillThreshold && (
                        <p className="text-xs text-yellow-600 mt-1">Low stock: {med.stockQuantity} left</p>
                      )}
                    </div>
                    <button
                      onClick={() => med.id && deleteMedication(med.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">Add Medication</h2>
            </div>
            <form onSubmit={addMedication} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Paracetamol 500mg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  placeholder="e.g., 1 tablet"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                >
                  <option value="daily">Once Daily</option>
                  <option value="twice-daily">Twice Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time(s)</label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border rounded-lg"
                  onChange={(e) => setFormData({ ...formData, times: [e.target.value] })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Refill Threshold</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={formData.refillThreshold}
                    onChange={(e) => setFormData({ ...formData, refillThreshold: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Add Medication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}