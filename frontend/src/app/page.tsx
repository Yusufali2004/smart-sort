"use client";
import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';

// 1. Disposal Logic Map
const DISPOSAL_INFO: Record<string, { color: string, tip: string, category: string }> = {
  'battery': { color: 'text-red-400', category: 'Hazardous', tip: 'Take to a designated e-waste collection center. Do not bin!' },
  'biological': { color: 'text-green-400', category: 'Organic', tip: 'Place in the green compost bin.' },
  'brown-glass': { color: 'text-amber-600', category: 'Recyclable', tip: 'Rinse and place in glass recycling.' },
  'white-glass': { color: 'text-slate-200', category: 'Recyclable', tip: 'Rinse and place in glass recycling.' },
  'glass': { color: 'text-cyan-400', category: 'Recyclable', tip: 'Rinse and place in glass recycling.' },
  'cardboard': { color: 'text-orange-300', category: 'Recyclable', tip: 'Flatten and keep dry in the paper bin.' },
  'clothes': { color: 'text-purple-400', category: 'Textile', tip: 'Donate if good condition, otherwise use textile recycling.' },
  'metal': { color: 'text-yellow-500', category: 'Recyclable', tip: 'Clean off food residue and recycle.' },
  'paper': { color: 'text-blue-300', category: 'Recyclable', tip: 'Place in the blue recycling bin.' },
  'plastic': { color: 'text-blue-500', category: 'Recyclable', tip: 'Check the plastic code and rinse before recycling.' },
  'shoes': { color: 'text-indigo-400', category: 'Textile', tip: 'Look for shoe-specific recycling programs.' },
  'trash': { color: 'text-gray-500', category: 'General Waste', tip: 'Dispose of in the landfill bin.' },
  'unknown': { color: 'text-gray-400', category: 'Unclear', tip: 'Try repositioning the object or improving the lighting for a better scan.' },
};

export default function SmartSortScanner() {
  const webcamRef = useRef<Webcam>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ item: string, time: string }[]>([]);

  // 2. Camera Configuration State
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: facingMode
  };

  const toggleCamera = () => {
    setFacingMode(prev => (prev === "user" ? "environment" : "user"));
  };

  const capture = async () => {
    if (webcamRef.current) {
      setLoading(true);
      // 1. Reduce quality to 0.7 to shrink file size
      const imageSrc = webcamRef.current.getScreenshot({ width: 640, height: 480 });

      if (imageSrc) {
        const blob = await fetch(imageSrc).then(res => res.blob());
        const formData = new FormData();
        formData.append('file', blob, 'capture.jpg');

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
            method: 'POST',
            body: formData,
          });

          // Check if the server actually responded
          if (!response.ok) throw new Error("Server error");

          const data = await response.json();
          setPrediction(data.prediction);
          setHistory(prev => [{ item: data.prediction, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 5));
        } catch (error) {
          console.error("Error:", error);
          alert("Request timed out. The server might be waking up—try again in 10 seconds.");
        }
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-start justify-center min-h-screen bg-gray-950 text-white p-6 gap-8">

      {/* LEFT SIDE: SCANNER */}
      <div className="flex flex-col items-center w-full lg:w-2/3">
        <h1 className="text-5xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
          SmartSort AI
        </h1>
        <p className="text-gray-400 mb-8">Next-Gen Waste Segregation System</p>

        <div className="relative border-4 border-gray-800 rounded-3xl overflow-hidden shadow-[0_0_50px_-12px_rgba(34,197,94,0.5)]">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="w-full max-w-lg"
          />

          {/* Camera Toggle Overlay Button */}
          <button
            onClick={toggleCamera}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 p-3 rounded-full border border-white/20 transition-all backdrop-blur-md"
            title="Switch Camera"
          >
            🔄
          </button>

          {loading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-500"></div>
            </div>
          )}
        </div>

        <button
          onClick={capture}
          disabled={loading}
          className="mt-8 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white px-12 py-4 rounded-2xl font-bold text-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Identify Object"}
        </button>

        {prediction && (
          <div className="mt-8 p-8 bg-gray-900 rounded-3xl border border-gray-800 shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-bold">Classification</p>
                <h2 className={`text-4xl font-black ${DISPOSAL_INFO[prediction]?.color || 'text-white'}`}>
                  {prediction.toUpperCase()}
                </h2>
              </div>
              <span className="px-3 py-1 bg-gray-800 rounded-full text-xs font-bold text-green-400 border border-green-900">
                {DISPOSAL_INFO[prediction]?.category}
              </span>
            </div>
            <p className="text-gray-300 leading-relaxed border-t border-gray-800 pt-4">
              <span className="font-bold text-white">Instruction:</span> {DISPOSAL_INFO[prediction]?.tip}
            </p>
          </div>
        )}
      </div>

      {/* RIGHT SIDE: HISTORY */}
      <div className="w-full lg:w-80 bg-gray-900/50 p-6 rounded-3xl border border-gray-800 self-stretch">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Recent Scans
        </h3>
        <div className="space-y-4">
          {history.length === 0 && <p className="text-gray-600 text-sm">No scans yet today.</p>}
          {history.map((entry, index) => (
            <div key={index} className="p-4 bg-gray-900 rounded-2xl border border-gray-800 flex justify-between items-center">
              <div>
                <p className="font-bold capitalize text-green-400">{entry.item}</p>
                <p className="text-[10px] text-gray-500">{entry.time}</p>
              </div>
              <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}