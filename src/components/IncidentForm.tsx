import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { db, collection, addDoc, updateDoc, doc, serverTimestamp, handleFirestoreError, OperationType } from '../firebase';
import { notifyAdmins } from '../services/notificationService';
import { saveIncidentOffline } from '../services/offlineService';
import { type Incident, type IncidentCategory, type Location } from '../types';
import { getCategoryIcon } from '../lib/incidentIcons';
import { MapPin, AlertCircle, Phone, User, FileText, Send, CheckCircle2, ChevronRight, ChevronLeft, X, Camera, Info, Search, Target } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../AuthProvider';
import { motion, AnimatePresence } from 'motion/react';

const categories: { id: IncidentCategory; label: string; colorClass: string; subcategories: string[] }[] = [
  { 
    id: "Hidrológica", 
    label: "Hidrológica", 
    colorClass: "bg-blue-50 text-blue-600",
    subcategories: ["Inundação", "Enxurrada", "Alagamento"]
  },
  { 
    id: "Geológica", 
    label: "Geológica", 
    colorClass: "bg-amber-50 text-amber-600",
    subcategories: ["Deslizamento", "Erosão", "Queda de Rocha"]
  },
  { 
    id: "Meteorológica", 
    label: "Meteorológica", 
    colorClass: "bg-sky-50 text-sky-600",
    subcategories: ["Vendaval", "Granizo", "Chuvas Intensas"]
  },
  { 
    id: "Climatológica", 
    label: "Climatológica", 
    colorClass: "bg-orange-50 text-orange-600",
    subcategories: ["Estiagem", "Seca", "Incêndio Florestal"]
  },
  { 
    id: "Estrutural", 
    label: "Estrutural", 
    colorClass: "bg-gray-50 text-gray-600",
    subcategories: ["Colapso de Edificação", "Risco de Queda"]
  },
  { 
    id: "Incêndio", 
    label: "Incêndio", 
    colorClass: "bg-red-50 text-red-600",
    subcategories: ["Incêndio Urbano", "Incêndio Industrial"]
  },
  { 
    id: "Tecnológica", 
    label: "Tecnológica", 
    colorClass: "bg-indigo-50 text-indigo-600",
    subcategories: ["Derramamento Químico", "Explosão"]
  },
  { 
    id: "Risco Potencial", 
    label: "Risco Potencial", 
    colorClass: "bg-slate-50 text-slate-600",
    subcategories: ["Outros riscos"]
  },
];

const cities = ["Corupá", "São Bento"];

const LocationSelector: React.FC<{ onLocationSelect: (loc: Location) => void; position: Location | null }> = ({ onLocationSelect, position }) => {
  useMapEvents({
    click(e) {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return position ? <Marker position={[position.lat, position.lng]} /> : null;
};

const RecenterMap: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

interface IncidentFormProps {
  editIncident?: Incident | null;
  onCancel?: () => void;
}

const IncidentForm: React.FC<IncidentFormProps> = ({ editIncident, onCancel }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [subStep, setSubStep] = useState(1); // For step 1: 1 = Category, 2 = Subcategory
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isOfflineSubmission, setIsOfflineSubmission] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [formData, setFormData] = useState({
    category: "" as IncidentCategory | "",
    type: "",
    description: "",
    address: "",
    city: "Corupá",
    reporterName: localStorage.getItem('reporter_name') || "",
    reporterPhone: localStorage.getItem('reporter_phone') || "",
    reporterCPF: localStorage.getItem('reporter_cpf') || "",
    location: null as Location | null,
    photos: [] as string[],
  });

  useEffect(() => {
    if (editIncident) {
      setFormData({
        category: editIncident.category as IncidentCategory,
        type: editIncident.type,
        description: editIncident.description,
        address: editIncident.address || "",
        city: editIncident.city || "Corupá",
        reporterName: editIncident.reporterName || "",
        reporterPhone: editIncident.reporterPhone || "",
        reporterCPF: editIncident.reporterCPF || "",
        location: editIncident.location,
        photos: editIncident.photos || [],
      });
      setStep(3); // Start at details step for editing
    }
  }, [editIncident]);

  const nextStep = () => {
    if (step === 1 && subStep === 1) {
      if (!formData.category) return;
      setSubStep(2);
    } else if (step === 1 && subStep === 2) {
      if (!formData.type) return;
      setStep(2);
    } else {
      setStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    if (step === 1 && subStep === 2) {
      setSubStep(1);
    } else if (step === 2) {
      setStep(1);
      setSubStep(2);
    } else {
      setStep(prev => Math.max(prev - 1, 1));
    }
  };

  const handleSubmit = async () => {
    if (!formData.reporterName || !formData.reporterCPF || !formData.reporterPhone) {
      // Use a more subtle way to show error or just stay on the step
      setStep(4);
      return;
    }

    setLoading(true);
    try {
      // Save identification data for next time
      localStorage.setItem('reporter_name', formData.reporterName);
      localStorage.setItem('reporter_phone', formData.reporterPhone);
      localStorage.setItem('reporter_cpf', formData.reporterCPF);

      if (!navigator.onLine && !editIncident) {
        // Offline mode - only for new incidents
        saveIncidentOffline({
          ...formData,
          reporterUid: user?.uid,
          status: 'Pendente',
        });
        setIsOfflineSubmission(true);
        setSuccess(true);
        return;
      }

      if (editIncident) {
        await updateDoc(doc(db, 'incidents', editIncident.id), {
          ...formData,
          updatedAt: serverTimestamp(),
        });
      } else {
        const docRef = await addDoc(collection(db, 'incidents'), {
          ...formData,
          reporterUid: user?.uid,
          status: 'Pendente',
          createdAt: serverTimestamp(),
        });
        
        // Notify admins about the new incident
        await notifyAdmins(
          'Novo Incidente Registrado',
          `${formData.category}: ${formData.type} em ${formData.city}`,
          docRef.id
        );
      }
      setSuccess(true);
    } catch (error) {
      handleFirestoreError(error, editIncident ? OperationType.UPDATE : OperationType.CREATE, 'incidents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 3 - formData.photos.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots) as File[];

    filesToProcess.forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, base64String]
        }));
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input value to allow selecting same file again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      
      // We'll attach the stream to the video element in a useEffect or after render
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      alert("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
    
    const photo = canvas.toDataURL('image/jpeg', 0.8);
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, photo].slice(0, 3)
    }));

    closeCamera();
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraOpen]);

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Corupá, SC")}&limit=5`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Erro na busca:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: any) => {
    const loc = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
    setFormData({ 
      ...formData, 
      location: loc,
      address: result.display_name
    });
    setSearchResults([]);
    setSearchQuery("");
  };

  const handleMapClick = async (loc: Location) => {
    setFormData(prev => ({ ...prev, location: loc }));
    
    // Reverse geocoding
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}`);
      const data = await response.json();
      if (data.display_name) {
        setFormData(prev => ({ ...prev, address: data.display_name }));
      }
    } catch (error) {
      console.error("Erro no reverse geocoding:", error);
    }
  };

  const renderStepHeader = (title: string, currentStep: number) => (
    <div className="bg-white border-b border-gray-100 px-6 py-4 rounded-t-[32px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <button onClick={prevStep} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-primary" />
          </button>
          <h2 className="text-xl font-bold text-primary">{editIncident ? "Editar Registro" : title}</h2>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Passo {currentStep} de 4</p>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-accent"
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / 4) * 100}%` }}
        />
      </div>
    </div>
  );

  const renderStep1 = () => {
    if (subStep === 1) {
      return (
        <div className="p-6 space-y-6">
          <p className="text-sm font-medium text-gray-500">O que aconteceu?</p>
          <div className="grid grid-cols-2 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setFormData({ ...formData, category: cat.id, type: "" });
                  setSubStep(2);
                }}
                className={cn(
                  "flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all duration-200 gap-3",
                  formData.category === cat.id ? "border-primary bg-primary/5" : "border-transparent bg-white shadow-sm hover:shadow-md"
                )}
              >
                {(() => {
                  const CategoryIcon = getCategoryIcon(cat.id);
                  return (
                    <div className={cn("p-3 rounded-full", cat.colorClass)}>
                      <CategoryIcon className="w-6 h-6" />
                    </div>
                  );
                })()}
                <span className="text-sm font-bold text-primary">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    const selectedCategory = categories.find(c => c.id === formData.category);
    return (
      <div className="p-6 space-y-6">
        <button onClick={() => setSubStep(1)} className="flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          <ChevronLeft className="w-4 h-4" />
          Voltar para Categorias
        </button>
        <p className="text-lg font-bold text-primary">Selecione o tipo de {formData.category}</p>
        <div className="space-y-3">
          {selectedCategory?.subcategories.map((sub) => (
            <button
              key={sub}
              onClick={() => {
                setFormData({ ...formData, type: sub });
                setStep(2);
              }}
              className={cn(
                "w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-200",
                formData.type === sub ? "border-primary bg-primary/5" : "border-transparent bg-white shadow-sm hover:shadow-md"
              )}
            >
              <span className="font-medium text-gray-700">{sub}</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderStep2 = () => (
    <div className="p-6 space-y-6">
      <p className="text-sm font-medium text-gray-500">Onde foi?</p>
      <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-inner border border-gray-100">
        <div className="absolute top-4 left-4 right-4 z-[1000]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar rua, bairro..." 
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white shadow-xl border-none text-sm focus:ring-2 focus:ring-primary/20"
            />
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-60 overflow-y-auto">
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSearchResult(result)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-none transition-colors"
                >
                  <p className="font-bold text-primary truncate">{result.display_name.split(',')[0]}</p>
                  <p className="text-[10px] text-gray-400 truncate">{result.display_name}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition((pos) => {
                setFormData({ ...formData, location: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
              });
            }
          }}
          className="absolute bottom-40 right-4 z-[1000] bg-white p-2 rounded-full shadow-xl hover:bg-gray-50 transition-colors"
        >
          <Target className="w-5 h-5 text-primary" />
        </button>

        <MapContainer 
          center={formData.location ? [formData.location.lat, formData.location.lng] : [-26.4322, -49.2439]} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ZoomControl position="bottomright" />
          <LocationSelector position={formData.location} onLocationSelect={handleMapClick} />
          {formData.location && <RecenterMap center={[formData.location.lat, formData.location.lng]} />}
        </MapContainer>

        <div className="absolute bottom-4 left-4 right-4 z-[1000] flex flex-col gap-2">
          {formData.address && (
            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-gray-100">
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">Local Selecionado:</p>
              <p className="text-xs text-gray-600 truncate">{formData.address}</p>
            </div>
          )}
          <button 
            disabled={!formData.location}
            onClick={nextStep}
            className={cn(
              "w-[387px] max-w-full mx-auto py-3 rounded-2xl font-bold text-white shadow-xl transition-all duration-300",
              formData.location ? "bg-primary hover:bg-primary/90" : "bg-gray-300 cursor-not-allowed"
            )}
          >
            Confirmar Localização
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh] no-scrollbar">
      <p className="text-sm font-medium text-gray-500">Detalhes e Cidade</p>
      
      <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex items-start gap-4">
        <div className="bg-white p-2 rounded-xl shadow-sm">
          <MapPin className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-primary">Confirmação de Cidade</p>
          <p className="text-xs text-gray-500 mb-2">O GPS indicou estar em: {formData.city}</p>
          <select 
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-primary/10"
          >
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <p className="text-[10px] text-gray-400 mt-2 leading-tight">
            * Se a cidade do incidente não estiver na lista, selecione o município sede responsável pelo atendimento.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm font-bold text-primary">Dicas para boas fotos</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col items-center gap-2 text-center">
            <div className="p-2 rounded-full bg-blue-50 text-blue-600"><Camera className="w-5 h-5" /></div>
            <span className="text-xs font-bold text-gray-600">Detalhe do Risco</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col items-center gap-2 text-center">
            <div className="p-2 rounded-full bg-blue-50 text-blue-600"><FileText className="w-5 h-5" /></div>
            <span className="text-xs font-bold text-gray-600">Contexto Amplo</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold text-primary">Fotos do Local (Máx. 3)</p>
        <div className="flex flex-wrap gap-4">
          {formData.photos.map((photo, index) => (
            <div key={index} className="relative w-32 h-40 rounded-2xl overflow-hidden border border-gray-200 group">
              <img src={photo} alt={`Preview ${index}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <button 
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 p-1.5 bg-danger text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          
          {formData.photos.length < 3 && (
            <div className="flex gap-4">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-40 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <FileText className="w-6 h-6" />
                <span className="text-xs font-bold">Subir Foto</span>
                <span className="text-[10px]">{formData.photos.length}/3</span>
              </button>

              <button 
                onClick={handleCameraCapture}
                className="w-32 h-40 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Camera className="w-6 h-6" />
                <span className="text-xs font-bold">Usar Câmera</span>
                <span className="text-[10px]">Capturar agora</span>
              </button>
            </div>
          )}
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          multiple 
          className="hidden" 
        />
      </div>

      {/* Camera Preview Modal */}
      <AnimatePresence>
        {isCameraOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center p-4"
          >
            <div className="relative w-full max-w-2xl aspect-[3/4] sm:aspect-video bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              
              <div className="absolute top-6 right-6">
                <button 
                  onClick={closeCamera}
                  className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-8">
                <button 
                  onClick={closeCamera}
                  className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-2xl font-bold transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={capturePhoto}
                  className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all"
                >
                  <div className="w-16 h-16 border-4 border-gray-100 rounded-full" />
                </button>
                <div className="w-[88px]" /> {/* Spacer for symmetry */}
              </div>
            </div>
            <p className="text-white/60 mt-6 text-sm font-medium">Posicione a câmera e capture a evidência</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <p className="text-sm font-bold text-primary">Descrição do Ocorrido</p>
        <textarea 
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descreva o que aconteceu, pontos de referência..."
          className="w-full h-32 p-4 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/10 resize-none"
        />
      </div>

      <button onClick={nextStep} className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-xl hover:bg-primary/90 transition-all">
        Continuar
      </button>
    </div>
  );

  const renderStep4 = () => (
    <div className="p-6 space-y-6">
      <p className="text-sm font-medium text-gray-500">Identificação</p>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3 text-blue-600">
        <User className="w-5 h-5" />
        <p className="text-xs font-medium">Seus dados são protegidos e usados apenas para contato oficial.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-600">Nome</label>
          <input 
            type="text"
            value={formData.reporterName}
            onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
            placeholder="Seu nome"
            className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-600">CPF</label>
          <input 
            type="text"
            value={formData.reporterCPF}
            onChange={(e) => setFormData({ ...formData, reporterCPF: e.target.value })}
            placeholder="000.000.000-00"
            className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-600">Telefone</label>
          <input 
            type="tel"
            value={formData.reporterPhone}
            onChange={(e) => setFormData({ ...formData, reporterPhone: e.target.value })}
            placeholder="(00) 00000-0000"
            className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </div>

      <button 
        onClick={handleSubmit} 
        disabled={loading || !formData.reporterName || !formData.reporterCPF || !formData.reporterPhone}
        className={cn(
          "w-full py-4 rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center gap-2",
          loading || !formData.reporterName || !formData.reporterCPF || !formData.reporterPhone
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-success text-white hover:bg-success/90"
        )}
      >
        {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send className="w-5 h-5" /> Enviar Registro</>}
      </button>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-8">
      <div className="bg-gray-50 rounded-[40px] shadow-2xl overflow-hidden border border-white/50">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-12 text-center space-y-6"
            >
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mx-auto",
                isOfflineSubmission ? "bg-amber-100 text-amber-600" : "bg-success/10 text-success"
              )}>
                {isOfflineSubmission ? <AlertCircle className="w-12 h-12" /> : <CheckCircle2 className="w-12 h-12" />}
              </div>
              <h2 className="text-2xl font-bold text-primary">
                {isOfflineSubmission ? "Salvo Offline!" : (editIncident ? "Registro Atualizado!" : "Registro Enviado!")}
              </h2>
              <p className="text-gray-500">
                {isOfflineSubmission 
                  ? "Você está sem internet. A ocorrência foi salva no seu dispositivo e será enviada automaticamente assim que você se conectar."
                  : (editIncident 
                    ? "As alterações na ocorrência foram salvas com sucesso." 
                    : "Sua ocorrência foi registrada com sucesso. A Defesa Civil foi notificada.")}
              </p>
              <button 
                onClick={() => {
                  if (editIncident && onCancel) onCancel();
                  else window.location.reload();
                }} 
                className="px-8 py-3 bg-primary text-white rounded-2xl font-bold"
              >
                {editIncident ? "Voltar para Lista" : "Novo Registro"}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={step + (step === 1 ? subStep : 0)}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 1 && renderStepHeader("Novo Registro", 1)}
              {step === 2 && renderStepHeader("Novo Registro", 2)}
              {step === 3 && renderStepHeader("Novo Registro", 3)}
              {step === 4 && renderStepHeader("Novo Registro", 4)}

              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default IncidentForm;
