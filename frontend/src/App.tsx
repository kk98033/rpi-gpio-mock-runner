import { useState } from 'react';
import axios from 'axios';
import { Timeline } from './components/Timeline';
import { Board } from './components/Board';
import { CodeEditor } from './components/CodeEditor';
import { usePlayback } from './hooks/usePlayback';
import { JsonViewer } from './components/JsonViewer';
import { ApiDocs } from './components/ApiDocs';
import { PinMapping, type ComponentConfig } from './components/PinMapping';
import { parseGpioState, type LogEntry } from './utils/gpioParser';
import { LayoutDashboard, Terminal, Book, Settings2 } from 'lucide-react';

type SimulationStep = 'CONFIG' | 'MAPPING' | 'PLAYBACK';

function App() {
  const [code, setCode] = useState<string>('import RPi.GPIO as GPIO\nimport time\n\nGPIO.setmode(GPIO.BCM)\nGPIO.setup(17, GPIO.OUT)\n\nGPIO.output(17, GPIO.HIGH)\ntime.sleep(1)\nGPIO.output(17, GPIO.LOW)\n');
  const [lab, setLab] = useState<string>('led');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [duration, setDuration] = useState<number>(5);
  const [distance, setDistance] = useState<number>(50); // For ultrasonic
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDocs, setShowDocs] = useState(false);

  // New state for workflow
  const [step, setStep] = useState<SimulationStep>('CONFIG');
  const [usedPins, setUsedPins] = useState<number[]>([]);
  const [componentConfig, setComponentConfig] = useState<ComponentConfig[]>([]);

  const {
    currentTime,
    isPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    togglePlay,
    stop,
    seek,
  } = usePlayback({ duration });

  // Calculate current pin state
  const pinState = parseGpioState(logs, currentTime);

  const handleRunSimulation = async () => {
    setIsLoading(true);
    setError(null);
    setLogs([]);
    stop();

    try {
      const response = await axios.post('/api/simulate', {
        code,
        lab,
        duration: 5, // Default duration request, server might cap it
        distance
      });

      const data = response.data;
      if (data.logs) {
        setLogs(data.logs);
        // Update duration from actual result if available, or use the requested one
        if (data.input_settings && data.input_settings.duration) {
          setDuration(data.input_settings.duration);
        } else {
          // Fallback: find max time in logs
          const maxTime = data.logs.reduce((max: number, log: LogEntry) => Math.max(max, log.time), 0);
          setDuration(Math.max(maxTime + 0.5, 5));
        }
        // Auto play
        // setTimeout(() => togglePlay(), 100);

        // Transition to Mapping step
        if (data.used_pins) {
          setUsedPins(data.used_pins);
          setStep('MAPPING');
        } else {
          // Fallback if no used_pins returned (old backend?)
          setStep('PLAYBACK');
          setTimeout(() => togglePlay(), 100);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Simulation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 font-sans flex flex-col">
      <ApiDocs isOpen={showDocs} onClose={() => setShowDocs(false)} />

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <LayoutDashboard size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            RPi GPIO Mock Runner
          </h1>
        </div>
        <button
          onClick={() => setShowDocs(true)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-all text-sm font-medium"
        >
          <Book size={16} /> API Docs
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Code Editor */}
        <div className="w-1/3 min-w-[400px] p-4 flex flex-col border-r border-gray-800 bg-gray-900/50">
          <div className="flex items-center gap-2 mb-2 text-gray-400">
            <Terminal size={16} />
            <span className="text-sm font-bold uppercase tracking-wider">Source Code</span>
          </div>
          <CodeEditor
            code={code}
            setCode={setCode}
            lab={lab}
            setLab={setLab}
            onRun={handleRunSimulation}
            isLoading={isLoading}
            duration={duration}
            setDuration={setDuration}
            distance={distance}
            setDistance={setDistance}
          />
          {error && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-200 text-sm rounded">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        {/* Right Panel: Visualization */}
        <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto bg-gray-950">

          {/* Board Area */}
          <div className="flex-1 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">Visualization Board</span>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-600 font-mono">Lab: {lab}</span>
                {step === 'PLAYBACK' && (
                  <button
                    onClick={() => setStep('MAPPING')}
                    className="text-xs flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                  >
                    <Settings2 size={12} /> Reconfigure
                  </button>
                )}
              </div>
            </div>

            {step === 'MAPPING' ? (
              <PinMapping
                usedPins={usedPins}
                onStart={(config) => {
                  setComponentConfig(config);
                  setStep('PLAYBACK');
                  setTimeout(() => togglePlay(), 100);
                }}
              />
            ) : (
              <Board
                lab={lab}
                pinState={pinState}
                distance={distance}
                setDistance={setDistance}
                componentConfig={componentConfig}
              />
            )}
          </div>

          {/* Timeline Control */}
          <div className="h-auto">
            <Timeline
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              onTogglePlay={togglePlay}
              onStop={stop}
              onSeek={seek}
              playbackSpeed={playbackSpeed}
              setPlaybackSpeed={setPlaybackSpeed}
            />
          </div>

          {/* JSON Output */}
          {logs.length > 0 && (
            <div className="h-64">
              <JsonViewer data={{
                program: "simulation",
                start_time: Date.now() / 1000,
                duration,
                logs
              }} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
