import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const LanguageContext = createContext();

const translations = {
  fr: {
    title: "Métronome",
    start: "Démarrer",
    stop: "Arrêter",
    measure: "Mesure :",
    tempoIncrease: "Appuyez sur 'F' pour augmenter le tempo de 5 BPM",
    tempoDecrease: "Appuyez sur 'S' pour diminuer le tempo de 5 BPM"
  },
  en: {
    title: "Metronome",
    start: "Start",
    stop: "Stop",
    measure: "Time Signature:",
    tempoIncrease: "Press 'F' to increase tempo by 5 BPM",
    tempoDecrease: "Press 'S' to decrease tempo by 5 BPM"
  },
  es: {
    title: "Metrónomo",
    start: "Iniciar",
    stop: "Detener",
    measure: "Compás:",
    tempoIncrease: "Presione 'F' para aumentar el tempo en 5 BPM",
    tempoDecrease: "Presione 'S' para disminuir el tempo en 5 BPM"
  },
  de: {
    title: "Metronom",
    start: "Start",
    stop: "Stopp",
    measure: "Taktart:",
    tempoIncrease: "Drücken Sie 'F', um das Tempo um 5 BPM zu erhöhen",
    tempoDecrease: "Drücken Sie 'S', um das Tempo um 5 BPM zu verringern"
  },
  lu: {
    title: "Metronom",
    start: "Ufänken",
    stop: "Stopp",
    measure: "Takt:",
    tempoIncrease: "Dréckt 'F' fir den Tempo ëm 5 BPM ze erhéijen",
    tempoDecrease: "Dréckt 'S' fir den Tempo ëm 5 BPM ze reduzéieren"
  },
  pt: {
    title: "Metrônomo",
    start: "Iniciar",
    stop: "Parar",
    measure: "Compasso:",
    tempoIncrease: "Pressione 'F' para aumentar o tempo em 5 BPM",
    tempoDecrease: "Pressione 'S' para diminuir o tempo em 5 BPM"
  }
};

const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('fr');
  const value = { language, setLanguage, t: translations[language] };
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

const Metronome = () => {
  const { language, setLanguage, t } = useContext(LanguageContext);
  const [bpm, setBpm] = useState(80);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mainLedOn, setMainLedOn] = useState(true);
  const [measureLedOn, setMeasureLedOn] = useState(false);
  const [beat, setBeat] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [timeSignature, setTimeSignature] = useState("4/4");
  const audioContext = useRef(null);
  const oscillator = useRef(null);

  useEffect(() => {
    audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  const playBeep = (frequency, duration) => {
    if (!audioContext.current) return;
    
    oscillator.current = audioContext.current.createOscillator();
    oscillator.current.type = 'sine';
    oscillator.current.frequency.setValueAtTime(frequency, audioContext.current.currentTime);

    const gainNode = audioContext.current.createGain();
    gainNode.gain.setValueAtTime(0.1, audioContext.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.current.currentTime + duration);

    oscillator.current.connect(gainNode);
    gainNode.connect(audioContext.current.destination);

    oscillator.current.start();
    oscillator.current.stop(audioContext.current.currentTime + duration);
  };

  useEffect(() => {
    let interval;
    if (isPlaying) {
      const [beatsPerMeasure, beatUnit] = timeSignature.split('/').map(Number);
      const beatDuration = 60000 / bpm;
      const intervalDuration = beatUnit === 8 ? beatDuration / 2 : beatDuration;

      interval = setInterval(() => {
        setBeat(prevBeat => {
          const newBeat = (prevBeat + 1) % (beatsPerMeasure * (beatUnit === 8 ? 2 : 1));
          if (newBeat === 0 && measureLedOn) {
            playBeep(1046.50, 0.1); // C6 note for measure start
          } else if (mainLedOn && (beatUnit === 4 || newBeat % 2 === 0)) {
            playBeep(880, 0.1); // A5 note for each beat
          }
          return newBeat;
        });
        setPulse(prev => !prev);
      }, intervalDuration);
    }
    return () => clearInterval(interval);
  }, [isPlaying, bpm, mainLedOn, measureLedOn, timeSignature]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'f') setBpm(prev => Math.min(prev + 5, 300));
      if (e.key === 's') setBpm(prev => Math.max(prev - 5, 20));
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleBpmChange = (value) => {
    setBpm(Math.max(20, Math.min(300, value)));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-purple-500 to-pink-500 p-8">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mr-4">{t.title}</h1>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[50px] h-8 text-xs px-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">FR</SelectItem>
              <SelectItem value="en">EN</SelectItem>
              <SelectItem value="es">ES</SelectItem>
              <SelectItem value="de">DE</SelectItem>
              <SelectItem value="lu">LU</SelectItem>
              <SelectItem value="pt">PT</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex justify-center space-x-4 mb-6">
          <div 
            className={`w-16 h-16 rounded-full ${mainLedOn ? (pulse ? 'bg-red-500' : 'bg-red-300') : 'bg-red-200'} cursor-pointer transition-colors duration-100`} 
            onClick={() => setMainLedOn(!mainLedOn)}
          />
          <div 
            className={`w-8 h-8 rounded-full ${measureLedOn && beat === 0 ? 'bg-green-500' : 'bg-green-200'} cursor-pointer transition-colors duration-100 self-end`} 
            onClick={() => setMeasureLedOn(!measureLedOn)}
          />
        </div>
        
        <div className="mb-6">
          <Input
            type="number"
            value={bpm}
            onChange={(e) => handleBpmChange(parseInt(e.target.value))}
            className="w-full text-center text-2xl font-bold"
          />
        </div>
        
        <Slider
          value={[bpm]}
          onValueChange={([value]) => handleBpmChange(value)}
          max={300}
          min={20}
          step={1}
          className="mb-6"
        />

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.measure}</label>
          <Select value={timeSignature} onValueChange={setTimeSignature}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["2/4", "3/4", "4/4", "5/4", "6/4", "3/8", "6/8", "9/8", "12/8"].map(sig => (
                <SelectItem key={sig} value={sig}>{sig}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          onClick={() => setIsPlaying(!isPlaying)}
          className={`w-full ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white font-bold py-2 px-4 rounded`}
        >
          {isPlaying ? t.stop : t.start}
        </Button>
        
        <p className="text-center mt-4 text-sm text-gray-600">
          {t.tempoIncrease}<br/>
          {t.tempoDecrease}
        </p>
      </div>
    </div>
  );
};

const BilingualMetronome = () => (
  <LanguageProvider>
    <Metronome />
  </LanguageProvider>
);

export default BilingualMetronome;
