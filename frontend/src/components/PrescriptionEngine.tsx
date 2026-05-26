import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ImageIcon, FileText, Upload, X, Sparkles, CheckCircle2,
  AlertCircle, Clock, Pill, ChevronRight, RotateCcw, Info,
  FileSearch, Eye, EyeOff, Camera
} from 'lucide-react';
import { parsePrescriptionFile, parsePrescriptionText, ParsedDrug } from '../lib/api';

interface PrescriptionEngineProps {
  onAnalyze: (drugs: ParsedDrug[]) => void;
  isLoading?: boolean;
}

type Tab    = 'file' | 'camera' | 'text';
type Stage  = 'input' | 'parsing' | 'preview';

const EXAMPLE_RX = `Augmentin 625mg - twice daily for 5 days
Crocin 500mg - thrice daily after meals
Lipitor 10mg - once at night
Omeprazole 20mg - before breakfast`;

const ACCEPT_TYPES = 'image/*,application/pdf';

const confidenceBadge: Record<string, string> = {
  high:   'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  low:    'bg-red-100 text-red-600'
};

function getFileIcon(mime?: string) {
  if (!mime) return <FileSearch className="w-6 h-6 text-blue-600" />;
  if (mime === 'application/pdf') return <FileText className="w-6 h-6 text-red-500" />;
  return <ImageIcon className="w-6 h-6 text-blue-600" />;
}

export default function PrescriptionEngine({ onAnalyze, isLoading }: PrescriptionEngineProps) {
  const [tab, setTab]               = useState<Tab>('file');
  const [stage, setStage]           = useState<Stage>('input');
  const [text, setText]             = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragging, setDragging]     = useState(false);
  const [parsedDrugs, setParsedDrugs]   = useState<ParsedDrug[]>([]);
  const [rawText, setRawText]       = useState('');
  const [showRaw, setShowRaw]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [ocrStatus, setOcrStatus]   = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Camera State & Ref ───────────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceIdx, setActiveDeviceIdx] = useState<number>(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);

  // Start the camera stream
  const startCamera = async (deviceIdx: number = 0) => {
    setIsCameraLoading(true);
    setCameraError(null);
    
    // Stop any existing stream first
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    try {
      // First get basic permission
      const initialStream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Enumerate all devices to find cameras
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoDevices);

      // Select device
      let constraints: MediaTrackConstraints = {
        facingMode: 'environment' // Default to rear camera on mobile
      };

      if (videoDevices.length > 0) {
        const targetIdx = deviceIdx % videoDevices.length;
        setActiveDeviceIdx(targetIdx);
        constraints = {
          deviceId: { exact: videoDevices[targetIdx].deviceId }
        };
      }

      // Stop initial stream tracks before starting the targeted stream
      initialStream.getTracks().forEach(track => track.stop());

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: constraints
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Could not access camera. Please check permissions.');
    } finally {
      setIsCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    // Create a canvas
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setCapturedImage(dataUrl);
      
      // Stop stream temporarily during preview
      stopCamera();
    }
  };

  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleUseCapturedPhoto = () => {
    if (!capturedImage) return;
    const file = dataURLtoFile(capturedImage, 'captured-prescription.jpg');
    handleFile(file);
    setTab('file');
  };

  // Stop camera stream when tab changes to non-camera
  React.useEffect(() => {
    if (tab === 'camera') {
      setCapturedImage(null);
      startCamera(0);
    } else {
      stopCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [tab]);

  // ── File handling ────────────────────────────────────────────────────────
  const handleFile = (file: File) => {
    if (!file.type.match(/^image\/|application\/pdf/)) {
      setError('Unsupported file. Upload a JPG, PNG, BMP, TIFF, WEBP, or PDF.');
      return;
    }
    setUploadedFile(file);
    setError(null);
    // Preview only for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null); // PDFs — no visual preview
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // ── Parse ────────────────────────────────────────────────────────────────
  const handleParse = async () => {
    setError(null); setStage('parsing');
    try {
      let result;
      if (tab === 'file' && uploadedFile) {
        const isPdf = uploadedFile.type === 'application/pdf';
        setOcrStatus(isPdf ? 'Extracting text from PDF...' : 'Running local OCR (Tesseract)...');
        result = await parsePrescriptionFile(uploadedFile);
      } else {
        if (!text.trim()) { setError('Enter prescription text.'); setStage('input'); return; }
        setOcrStatus('Parsing prescription text...');
        result = await parsePrescriptionText(text);
      }
      // Only keep the actual medicines that match our database, discarding random OCR noise
      const validMedicines = result.parsedDrugs.filter((d: ParsedDrug) => d.dbMatch);
      setParsedDrugs(validMedicines);
      
      setRawText(result.rawText || '');
      setStage('preview');
    } catch (e: any) {
      setError(e.message || 'Could not connect to backend (port 5000).');
      setStage('input');
    }
  };

  const handleReset = () => {
    setStage('input'); setParsedDrugs([]); setRawText('');
    setUploadedFile(null); setImagePreview(null); setText('');
    setError(null); setShowRaw(false);
  };

  const handleConfirm = () => {
    const matched = parsedDrugs.filter(d => d.dbMatch);
    onAnalyze(matched.length > 0 ? matched : parsedDrugs);
  };

  const canParse = tab === 'file' ? !!uploadedFile : text.trim().length > 0;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-sm uppercase tracking-widest">Prescription Parser</h2>
            <p className="text-blue-200 text-[10px] mt-0.5">
              Local OCR · PDF Extraction · Zero API calls
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white text-[10px] font-bold uppercase tracking-wider">100% Offline</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">

          {/* ── INPUT ──────────────────────────────────────────────────────── */}
          {stage === 'input' && (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Tabs */}
              {(() => {
                const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
                  { id: 'file', label: 'Image / PDF', icon: <Upload className="w-3.5 h-3.5" /> },
                  { id: 'camera', label: 'Camera', icon: <Camera className="w-3.5 h-3.5" /> },
                  { id: 'text', label: 'Type / Paste', icon: <FileText className="w-3.5 h-3.5" /> },
                ];
                return (
                  <div className="flex rounded-xl bg-slate-100 p-1 mb-5">
                    {tabs.map(({ id, label, icon }) => (
                      <button
                        key={id}
                        onClick={() => setTab(id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                          tab === id ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {icon}{label}
                      </button>
                    ))}
                  </div>
                );
              })()}

              {/* FILE UPLOAD */}
              {tab === 'file' && (
                <>
                  {!uploadedFile ? (
                    <div
                      onDragOver={e => { e.preventDefault(); setDragging(true); }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={onDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`cursor-pointer rounded-xl border-2 border-dashed transition-all p-8 flex flex-col items-center gap-3 ${
                        dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                        <Upload className="w-7 h-7 text-blue-600" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-700">
                          {dragging ? 'Drop file here' : 'Drag & drop or click to upload'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          JPG · PNG · BMP · TIFF · WEBP · PDF
                        </p>
                        <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                          ✓ Processed locally — no internet needed
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPT_TYPES}
                        capture="environment"
                        className="hidden"
                        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      {imagePreview ? (
                        <div className="relative">
                          <img src={imagePreview} alt="Prescription" className="w-full max-h-52 object-contain bg-slate-50" />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                            <p className="text-white text-xs font-semibold truncate">{uploadedFile.name}</p>
                            <p className="text-white/60 text-[10px]">{(uploadedFile.size / 1024).toFixed(0)} KB · Image</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-red-50 p-6 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                            {getFileIcon(uploadedFile.type)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 truncate max-w-[220px]">{uploadedFile.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {(uploadedFile.size / 1024).toFixed(0)} KB · PDF Document
                            </p>
                            <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                              Text will be extracted locally via pdf-parse
                            </p>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => { setUploadedFile(null); setImagePreview(null); }}
                        className="w-full py-2 text-[11px] font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5 border-t border-slate-100"
                      >
                        <X className="w-3 h-3" /> Remove file
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* CAMERA INPUT */}
              {tab === 'camera' && (
                <div className="flex flex-col gap-4">
                  {/* Viewfinder Container */}
                  <div className="relative aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden shadow-inner border border-slate-800 flex items-center justify-center">
                    {!capturedImage && !cameraError && (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        {/* Scanning Target Box Overlays */}
                        <div className="absolute inset-0 border-[24px] border-slate-950/40 pointer-events-none flex items-center justify-center">
                          <div className="w-5/6 h-5/6 border-2 border-dashed border-blue-400/60 rounded-lg relative">
                            {/* Scanning Guide HUD corners */}
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500 -mt-1 -ml-1 rounded-tl-sm" />
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500 -mt-1 -mr-1 rounded-tr-sm" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500 -mb-1 -ml-1 rounded-bl-sm" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500 -mb-1 -mr-1 rounded-br-sm" />
                            
                            {/* Scanner scanning line animation */}
                            <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_8px_rgba(96,165,250,0.8)] top-1/2" />
                          </div>
                        </div>
                        
                        {isCameraLoading && (
                          <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-3">
                            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                            <p className="text-xs text-slate-400 font-medium">Initializing camera...</p>
                          </div>
                        )}
                      </>
                    )}

                    {capturedImage && (
                      <img
                        src={capturedImage}
                        alt="Captured prescription"
                        className="w-full h-full object-contain bg-slate-950"
                      />
                    )}

                    {cameraError && (
                      <div className="p-6 text-center max-w-xs flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-red-950/30 border border-red-500/20 flex items-center justify-center text-red-400">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">Camera Access Blocked</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Please enable camera permissions in your browser settings to scan prescriptions directly.
                          </p>
                        </div>
                        <button
                          onClick={() => startCamera(activeDeviceIdx)}
                          className="mt-2 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all"
                        >
                          Try Again
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Camera Controls */}
                  <div className="flex items-center justify-between px-2">
                    {!capturedImage && !cameraError ? (
                      <>
                        <div className="w-10 flex justify-center">
                          {devices.length > 1 && (
                            <button
                              onClick={() => startCamera(activeDeviceIdx + 1)}
                              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-90"
                              title="Switch Camera"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Capture Shutter Button */}
                        <button
                          onClick={capturePhoto}
                          disabled={isCameraLoading}
                          className="w-16 h-16 rounded-full border-4 border-slate-200 p-1 flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                        >
                          <div className="w-full h-full rounded-full bg-white hover:bg-slate-100 shadow-md" />
                        </button>

                        <div className="w-10" /> {/* Spacer */}
                      </>
                    ) : capturedImage ? (
                      <div className="flex gap-3 w-full">
                        <button
                          onClick={() => {
                            setCapturedImage(null);
                            startCamera(activeDeviceIdx);
                          }}
                          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <RotateCcw className="w-4 h-4" /> Retake
                        </button>
                        <button
                          onClick={handleUseCapturedPhoto}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-200/50 transition-all active:scale-95"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Use Photo
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <p className="text-[10px] text-slate-400 text-center">
                    Supported on all modern mobile and desktop browsers · Processed locally
                  </p>
                </div>
              )}

              {/* TEXT INPUT */}
              {tab === 'text' && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">One medicine per line</span>
                    <button onClick={() => setText(EXAMPLE_RX)} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase">
                      Use Example →
                    </button>
                  </div>
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder={`e.g.\nAugmentin 625mg twice daily 5 days\nCrocin 500mg thrice daily\nLipitor 10mg once at night`}
                    className="w-full h-36 p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-slate-700 placeholder:text-slate-300"
                  />
                  <div className="text-right text-[10px] text-slate-400 font-mono mt-1">{text.length} chars</div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-red-600">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p className="text-[11px] font-medium">{error}</p>
                </div>
              )}

              {/* Parse Button */}
              {tab !== 'camera' && (
                <button
                  onClick={handleParse}
                  disabled={!canParse}
                  className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200/50 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:grayscale active:scale-95"
                >
                  <FileSearch className="w-4 h-4" />
                  {tab === 'file' ? (uploadedFile?.type === 'application/pdf' ? 'Extract PDF Text & Parse' : 'Run OCR & Parse') : 'Parse Prescription'}
                </button>
              )}

              {/* Info */}
              {tab !== 'camera' && (
                <div className="mt-4 flex items-start gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    <strong className="text-slate-600">Images</strong> are processed using Tesseract OCR (runs locally in Node.js).{' '}
                    <strong className="text-slate-600">PDFs</strong> use pdf-parse for text extraction.{' '}
                    <span className="text-emerald-600 font-semibold">No data leaves your machine.</span>
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── PARSING ────────────────────────────────────────────────────── */}
          {stage === 'parsing' && (
            <motion.div key="parsing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-10 flex flex-col items-center gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileSearch className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-800">{ocrStatus || 'Processing...'}</p>
                <p className="text-[11px] text-slate-400 mt-1">Running locally — no internet used</p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                <motion.div
                  className="h-full bg-blue-600 rounded-full"
                  initial={{ width: '0%' }} animate={{ width: '90%' }}
                  transition={{ duration: 5, ease: 'easeOut' }}
                />
              </div>
              <p className="text-[10px] text-slate-400">
                {uploadedFile?.type === 'application/pdf' ? 'Extracting text from PDF pages...' : 'Tesseract analyzing text regions...'}
              </p>
            </motion.div>
          )}

          {/* ── PREVIEW ────────────────────────────────────────────────────── */}
          {stage === 'preview' && (
            <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase tracking-widest">
                    Extracted Medicines
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {parsedDrugs.length} detected · {parsedDrugs.filter(d => d.dbMatch).length} DB matched
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {rawText && (
                    <button
                      onClick={() => setShowRaw(s => !s)}
                      className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-blue-600 font-bold uppercase tracking-tighter transition-colors"
                    >
                      {showRaw ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      Raw Text
                    </button>
                  )}
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-blue-600 font-bold uppercase tracking-tighter transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Re-scan
                  </button>
                </div>
              </div>

              {/* Raw OCR / extracted text toggle */}
              {showRaw && rawText && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-4 bg-slate-900 rounded-xl p-3 overflow-hidden"
                >
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    {uploadedFile?.type === 'application/pdf' ? 'PDF Extracted Text' : 'OCR Raw Output'}
                  </p>
                  <pre className="text-[10px] text-slate-300 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto leading-relaxed">
                    {rawText}
                  </pre>
                </motion.div>
              )}

              {/* Drug cards */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {parsedDrugs.map((drug, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                          <Pill className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{drug.drugName}</p>
                          {drug.saltComposition && (
                            <p className="text-[10px] text-slate-400 font-mono truncate">{drug.saltComposition}</p>
                          )}
                        </div>
                      </div>
                      <span className={`shrink-0 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${confidenceBadge[drug.confidence]}`}>
                        {drug.confidence}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {drug.dosageForm && <Tag emoji="💊" label={drug.dosageForm} />}
                      {drug.strength    && <Tag emoji="⚡" label={drug.strength} />}
                      {drug.frequency   && <Tag emoji="🔁" label={drug.frequency} />}
                      {drug.freqTimesPerDay && (
                        <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-md">
                          {drug.freqTimesPerDay}×/day · cost calc
                        </span>
                      )}
                      {drug.duration    && (
                        <span className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                          <Clock className="w-2.5 h-2.5" />{drug.duration}
                        </span>
                      )}
                    </div>

                    {drug.dbMatch ? (
                      <div className="mt-2 flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="text-[10px] font-bold">
                          DB Match: {drug.dbMatch.brandName}
                          {drug.dbMatch.category ? ` · ${drug.dbMatch.category}` : ''}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center gap-1.5 text-amber-500">
                        <AlertCircle className="w-3 h-3" />
                        <span className="text-[10px] font-medium">Not in DB — will attempt fuzzy match</span>
                      </div>
                    )}
                  </motion.div>
                ))}

                {parsedDrugs.length === 0 && (
                  <div className="text-center py-10 text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold">No medicines detected.</p>
                    <p className="text-xs mt-1">Try a clearer image or switch to text entry.</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleReset}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={parsedDrugs.length === 0 || isLoading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200/60 transition-all active:scale-95 disabled:opacity-40"
                >
                  <Sparkles className="w-4 h-4" />
                  Analyze {parsedDrugs.filter(d => d.dbMatch).length || parsedDrugs.length} Medicines
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function Tag({ emoji, label }: { emoji: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md">
      <span className="text-[9px]">{emoji}</span>{label}
    </span>
  );
}
