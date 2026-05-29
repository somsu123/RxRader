import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, HeartPulse } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/ui/Button';

type QuestionId =
  | 'fever'
  | 'cough'
  | 'soreThroat'
  | 'bodyAche'
  | 'headache'
  | 'nausea'
  | 'diarrhea'
  | 'chestPain'
  | 'breathingTrouble'
  | 'confusionOrFainting';

type AnswerValue = 'no' | 'mild' | 'moderate' | 'severe';

type Question = {
  id: QuestionId;
  title: string;
  subtitle?: string;
};

const QUESTIONS: Question[] = [
  { id: 'fever', title: 'Fever', subtitle: 'Temperature or feeling unusually hot' },
  { id: 'cough', title: 'Cough', subtitle: 'Dry or wet cough' },
  { id: 'soreThroat', title: 'Sore throat' },
  { id: 'bodyAche', title: 'Body aches / fatigue' },
  { id: 'headache', title: 'Headache' },
  { id: 'nausea', title: 'Nausea / vomiting' },
  { id: 'diarrhea', title: 'Diarrhea / stomach upset' },
  { id: 'chestPain', title: 'Chest pain / pressure', subtitle: 'Especially tightness or crushing pain' },
  { id: 'breathingTrouble', title: 'Breathing trouble', subtitle: 'Shortness of breath / wheezing' },
  { id: 'confusionOrFainting', title: 'Confusion / fainting', subtitle: 'Feeling dizzy, faint, or unusually confused' },
];

const OPTIONS: { value: AnswerValue; label: string; hint: string }[] = [
  { value: 'no', label: 'No', hint: 'Not present' },
  { value: 'mild', label: 'Mild', hint: 'Noticeable but manageable' },
  { value: 'moderate', label: 'Moderate', hint: 'Interferes with routine' },
  { value: 'severe', label: 'Severe', hint: 'Hard to function / intense' },
];

function severityScore(v: AnswerValue | undefined) {
  if (!v) return 0;
  if (v === 'no') return 0;
  if (v === 'mild') return 1;
  if (v === 'moderate') return 2;
  return 3;
}

type ConditionKey = 'commonCold' | 'fluLike' | 'migraineLike' | 'gastroLike';

function computeScores(answers: Partial<Record<QuestionId, AnswerValue>>) {
  const s = (id: QuestionId) => severityScore(answers[id]);

  const scores: Record<ConditionKey, number> = {
    commonCold: 0,
    fluLike: 0,
    migraineLike: 0,
    gastroLike: 0,
  };

  // Very simple heuristic scoring (not medical diagnosis).
  scores.commonCold += s('cough') * 2 + s('soreThroat') * 2 + s('fever') * 1;
  scores.fluLike += s('fever') * 3 + s('bodyAche') * 3 + s('headache') * 2 + s('cough') * 1;
  scores.migraineLike += s('headache') * 4 + s('nausea') * 2;
  scores.gastroLike += s('nausea') * 3 + s('diarrhea') * 4 + s('fever') * 1;

  return scores;
}

function pickTopCondition(scores: Record<ConditionKey, number>) {
  const entries = Object.entries(scores) as [ConditionKey, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const [top, topScore] = entries[0];
  return { top, topScore, entries };
}

function labelForCondition(c: ConditionKey) {
  switch (c) {
    case 'commonCold':
      return { title: 'Common cold (likely)', details: 'Rest, hydration, warm fluids; monitor symptoms.' };
    case 'fluLike':
      return { title: 'Flu / viral infection (possible)', details: 'Rest, fluids, fever control; consider testing if worsening.' };
    case 'migraineLike':
      return { title: 'Migraine / tension headache (possible)', details: 'Hydrate, rest in a dark room; avoid triggers.' };
    case 'gastroLike':
      return { title: 'Gastroenteritis (possible)', details: 'Oral rehydration, light meals; monitor dehydration.' };
  }
}

function isCritical(answers: Partial<Record<QuestionId, AnswerValue>>) {
  const severe = (id: QuestionId) => answers[id] === 'severe';
  const moderateOrSevere = (id: QuestionId) => {
    const v = answers[id];
    return v === 'moderate' || v === 'severe';
  };

  // Red flags: any moderate/severe breathing trouble or chest pain, or severe confusion/fainting.
  if (moderateOrSevere('breathingTrouble')) return true;
  if (moderateOrSevere('chestPain')) return true;
  if (severe('confusionOrFainting')) return true;

  return false;
}

export default function TakeTestPage() {
  const [answers, setAnswers] = useState<Partial<Record<QuestionId, AnswerValue>>>({});
  const [submitted, setSubmitted] = useState(false);

  const answeredCount = useMemo(
    () => QUESTIONS.filter(q => !!answers[q.id]).length,
    [answers]
  );

  const scores = useMemo(() => computeScores(answers), [answers]);
  const top = useMemo(() => pickTopCondition(scores), [scores]);
  const critical = useMemo(() => isCritical(answers), [answers]);

  const canSubmit = answeredCount >= Math.min(6, QUESTIONS.length);

  const result = useMemo(() => {
    const meta = labelForCondition(top.top);
    const lowConfidence = top.topScore < 6;
    return { ...meta, lowConfidence };
  }, [top.top, top.topScore]);

  const reset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-24">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="flex items-center text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-2 group-hover:-translate-x-1 transition-transform" />
            BACK TO HOME
          </Link>

          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Symptom Test</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Quick Symptom Check</h1>
                <p className="text-slate-500 font-medium mt-2">
                  Answer a few questions and we’ll suggest a likely condition. If your symptoms look critical, we’ll recommend seeing a doctor.
                </p>

                <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <div className="text-xs font-bold text-slate-500">
                    Progress: <span className="text-slate-800">{answeredCount}</span> / {QUESTIONS.length}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={reset}
                    className="rounded-xl"
                    disabled={answeredCount === 0}
                  >
                    Clear answers
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {QUESTIONS.map(q => (
                  <div key={q.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-slate-900">{q.title}</p>
                        {q.subtitle && <p className="text-[11px] text-slate-400 font-medium mt-1">{q.subtitle}</p>}
                      </div>
                      {answers[q.id] ? (
                        <span className="text-[10px] font-black px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Answered
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-2 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                          Pending
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {OPTIONS.map(opt => {
                        const active = answers[q.id] === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.value }))}
                            className={`text-left rounded-xl border px-3 py-2 transition-all ${
                              active
                                ? 'border-blue-600 bg-blue-50 shadow-sm'
                                : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <p className={`text-xs font-black ${active ? 'text-blue-700' : 'text-slate-700'}`}>
                              {opt.label}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{opt.hint}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <p className="text-[11px] text-slate-400 font-medium">
                  This is an informational tool, not a medical diagnosis.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  className="rounded-2xl"
                  disabled={!canSubmit}
                  onClick={() => {
                    setSubmitted(true);
                  }}
                >
                  See Result
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className={`h-1 w-full ${critical ? 'bg-red-500' : 'bg-emerald-500'}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">{result.title}</h2>
                      <p className="text-slate-500 font-medium mt-2">{result.details}</p>
                      {result.lowConfidence && (
                        <p className="text-[11px] text-slate-400 font-medium mt-3">
                          Confidence is low based on current answers — consider adding more symptoms or consult a professional.
                        </p>
                      )}
                    </div>

                    {critical ? (
                      <div className="shrink-0 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-700 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Critical</span>
                      </div>
                    ) : (
                      <div className="shrink-0 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Not critical</span>
                      </div>
                    )}
                  </div>

                  {critical && (
                    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                      <p className="text-sm font-bold text-red-800">Recommendation: Please see a doctor / visit emergency care.</p>
                      <p className="text-[11px] text-red-700 font-medium mt-1">
                        Your answers include symptoms that can be serious (like chest pain or breathing trouble).
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <Button variant="secondary" size="md" className="rounded-2xl" onClick={() => setSubmitted(false)}>
                  Edit answers
                </Button>
                <Button variant="primary" size="md" className="rounded-2xl" onClick={reset}>
                  Start new test
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

