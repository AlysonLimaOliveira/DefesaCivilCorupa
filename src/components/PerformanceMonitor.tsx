import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive } from 'lucide-react';

const PerformanceMonitor: React.FC = () => {
  const [fps, setFps] = useState(0);
  const [memory, setMemory] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const updateFPS = () => {
      frameCount++;
      const now = performance.now();
      if (now >= lastTime + 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;

        // Update memory if available
        if ((performance as any).memory) {
          setMemory((performance as any).memory);
        }
      }
      animationFrameId = requestAnimationFrame(updateFPS);
    };

    animationFrameId = requestAnimationFrame(updateFPS);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-[9999] p-2 bg-black/80 text-white rounded-full shadow-lg"
      >
        <Activity size={16} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-black/90 text-white p-4 rounded-2xl shadow-2xl border border-white/10 min-w-[200px] font-mono text-xs">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-bold flex items-center gap-2">
          <Activity size={14} className="text-orange-500" />
          PERFORMANCE
        </h4>
        <button onClick={() => setIsVisible(false)} className="text-white/50 hover:text-white">✕</button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
          <span className="flex items-center gap-2">
            <Cpu size={12} className="text-emerald-500" /> FPS
          </span>
          <span className={fps < 30 ? 'text-red-500' : fps < 50 ? 'text-yellow-500' : 'text-emerald-500'}>
            {fps}
          </span>
        </div>

        {memory && (
          <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
            <span className="flex items-center gap-2">
              <HardDrive size={12} className="text-blue-500" /> RAM
            </span>
            <span>
              {Math.round(memory.usedJSHeapSize / 1048576)}MB / {Math.round(memory.jsHeapLimit / 1048576)}MB
            </span>
          </div>
        )}

        <div className="text-[10px] text-white/40 mt-2 text-center italic">
          Monitor de Depuração em Tempo Real
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
