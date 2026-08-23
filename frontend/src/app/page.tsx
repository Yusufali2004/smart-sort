"use client";

import AuthGuard from "@/components/AuthGuard";
import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// Disposal information
const DISPOSAL_INFO: Record<
  string,
  {
    color: string;
    tip: string;
    category: string;
  }
> = {
  battery: {
    color: "text-red-400",
    category: "Hazardous",
    tip: "Take to a designated e-waste collection center. Do not bin!",
  },
  biological: {
    color: "text-green-400",
    category: "Organic",
    tip: "Place in the green compost bin.",
  },
  "brown-glass": {
    color: "text-amber-600",
    category: "Recyclable",
    tip: "Rinse and place in glass recycling.",
  },
  "white-glass": {
    color: "text-slate-200",
    category: "Recyclable",
    tip: "Rinse and place in glass recycling.",
  },
  glass: {
    color: "text-cyan-400",
    category: "Recyclable",
    tip: "Rinse and place in glass recycling.",
  },
  cardboard: {
    color: "text-orange-300",
    category: "Recyclable",
    tip: "Flatten and keep dry in the paper bin.",
  },
  clothes: {
    color: "text-purple-400",
    category: "Textile",
    tip: "Donate if in good condition, otherwise use textile recycling.",
  },
  metal: {
    color: "text-yellow-500",
    category: "Recyclable",
    tip: "Clean off food residue and recycle.",
  },
  paper: {
    color: "text-blue-300",
    category: "Recyclable",
    tip: "Place in the blue recycling bin.",
  },
  plastic: {
    color: "text-blue-500",
    category: "Recyclable",
    tip: "Check the plastic code and rinse before recycling.",
  },
  shoes: {
    color: "text-indigo-400",
    category: "Textile",
    tip: "Look for shoe-specific recycling programs.",
  },
  trash: {
    color: "text-gray-500",
    category: "General Waste",
    tip: "Dispose of in the landfill bin.",
  },
  unknown: {
    color: "text-gray-400",
    category: "Unclear",
    tip: "Try repositioning the object or improving the lighting for a better scan.",
  },
};

export default function SmartSortScanner() {
  const router = useRouter();

  const webcamRef = useRef<Webcam>(null);

  const [prediction, setPrediction] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const [history, setHistory] = useState<
    {
      item: string;
      time: string;
    }[]
  >([]);

  const [facingMode, setFacingMode] = useState<
    "user" | "environment"
  >("environment");

  // --------------------------------------------------
  // Wake backend when page opens
  // --------------------------------------------------

  useEffect(() => {
    const wakeServer = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!apiUrl) {
          console.error("NEXT_PUBLIC_API_URL is not configured.");
          return;
        }

        await fetch(`${apiUrl}/`);
        console.log("Backend warming up...");
      } catch {
        console.log("Server wake-up ping initiated.");
      }
    };

    wakeServer();
  }, []);

  // --------------------------------------------------
  // Camera configuration
  // --------------------------------------------------

  const videoConstraints = {
    facingMode,
    width: {
      ideal: 1280,
    },
    height: {
      ideal: 720,
    },
  };

  // --------------------------------------------------
  // Camera callbacks
  // --------------------------------------------------

  const handleCameraReady = () => {
    console.log("Camera started successfully.");

    setCameraReady(true);
    setCameraError(null);
  };

  const handleCameraError = (cameraError: string | DOMException) => {
    console.error("Camera error:", cameraError);

    setCameraReady(false);

    setCameraError(
      "Unable to access the camera. Please allow camera permission and try again."
    );
  };

  // --------------------------------------------------
  // Switch front/rear camera
  // --------------------------------------------------

  const toggleCamera = () => {
    setCameraReady(false);
    setCameraError(null);

    setFacingMode((prev) =>
      prev === "user" ? "environment" : "user"
    );
  };

  // --------------------------------------------------
  // Capture image and send to AI backend
  // --------------------------------------------------

  const capture = async () => {
    if (!webcamRef.current || loading) {
      return;
    }

    if (!cameraReady) {
      setError(
        "Camera is still starting. Please wait a moment and try again."
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Capture a reasonably sized image.
      // 640x480 keeps mobile uploads lightweight.
      const imageSrc = webcamRef.current.getScreenshot({
        width: 640,
        height: 480,
      });

      if (!imageSrc) {
        throw new Error(
          "Unable to capture image from camera. Please make sure the camera preview is visible."
        );
      }

      // Convert base64 image to Blob
      const blob = await fetch(imageSrc).then((res) =>
        res.blob()
      );

      if (!blob || blob.size === 0) {
        throw new Error("Captured image is empty. Please try again.");
      }

      const formData = new FormData();

      formData.append(
        "file",
        blob,
        "capture.jpg"
      );

      // --------------------------------------------------
      // AI prediction
      // --------------------------------------------------

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!apiUrl) {
        throw new Error(
          "AI backend URL is not configured."
        );
      }

      const response = await fetch(
        `${apiUrl}/predict`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          `AI server returned ${response.status}`
        );
      }

      const data = await response.json();

      const predictionValue = String(
        data.prediction ?? "unknown"
      ).toLowerCase();

      const confidenceValue =
        Number(data.confidence ?? 0) * 100;

      const disposalInfo =
        DISPOSAL_INFO[predictionValue] ??
        DISPOSAL_INFO.unknown;

      // --------------------------------------------------
      // Get authenticated user
      // --------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      // --------------------------------------------------
      // Save scan to Supabase
      // --------------------------------------------------

      const { error: insertError } = await supabase
        .from("waste_records")
        .insert({
          user_id: user.id,

          // AI output
          ai_category: predictionValue,

          ai_confidence: Number(
            confidenceValue.toFixed(2)
          ),

          // Application classification
          final_category: disposalInfo.category,

          // Detected material
          material: predictionValue,

          quantity: 1,

          // Weight not entered yet
          weight_grams: null,
          weight_source: "manual",

          // Disposal recommendation
          disposal_method: disposalInfo.tip,

          // CO2 calculation can be added later
          carbon_impact_co2e: null,
        });

      if (insertError) {
        console.error(
          "Supabase waste record error:",
          insertError
        );

        throw new Error(
          "The AI prediction succeeded, but the scan could not be saved."
        );
      }

      // --------------------------------------------------
      // Update UI
      // --------------------------------------------------

      setPrediction(predictionValue);
      setConfidence(confidenceValue);

      setHistory((prev) =>
        [
          {
            item: predictionValue,
            time: new Date().toLocaleTimeString(),
          },
          ...prev,
        ].slice(0, 5)
      );
    } catch (err) {
      console.error(
        "SmartSort capture error:",
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while processing the scan.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-950 text-white p-4 sm:p-6 font-sans">

        {/* TOP BAR */}
        <div className="max-w-7xl mx-auto flex justify-between items-center mb-8">

          <button
            onClick={() =>
              router.push("/dashboard")
            }
            className="text-2xl font-black tracking-tight"
          >
            Smart
            <span className="text-green-400">
              Sort
            </span>
          </button>

          <button
            onClick={() =>
              router.push("/dashboard")
            }
            className="px-4 sm:px-5 py-2.5 rounded-xl border border-gray-800 bg-gray-900 text-gray-300 hover:text-white hover:border-gray-700 transition"
          >
            Dashboard
          </button>
        </div>

        <div className="flex flex-col lg:flex-row items-start justify-center max-w-7xl mx-auto gap-8">

          {/* ========================================== */}
          {/* LEFT SIDE */}
          {/* ========================================== */}

          <div className="flex flex-col items-center w-full lg:w-2/3">

            <h1 className="text-4xl sm:text-5xl md:text-6xl text-center font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
              SmartSort AI
            </h1>

            {/* GUIDELINES */}

            <div className="max-w-xl w-full text-center mb-8 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">

              <p className="text-gray-300 text-sm md:text-base leading-relaxed">

                SmartSort is a{" "}

                <span className="text-green-400 font-semibold">
                  full-stack AI platform
                </span>{" "}

                that uses Computer Vision to classify waste in
                real-time. Designed with a{" "}

                <span className="text-blue-400 font-semibold">
                  decoupled architecture
                </span>

                , it provides instant disposal instructions
                based on{" "}

                <span className="text-white font-medium">
                  BBMP (Bengaluru) guidelines
                </span>
                .

              </p>

            </div>

            {/* ========================================== */}
            {/* CAMERA */}
            {/* ========================================== */}

            <div className="relative w-full max-w-lg border-4 border-gray-800 rounded-3xl overflow-hidden shadow-[0_0_50px_-12px_rgba(34,197,94,0.3)] bg-black">

              <Webcam
                key={facingMode}
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.9}
                videoConstraints={videoConstraints}
                playsInline
                onUserMedia={handleCameraReady}
                onUserMediaError={handleCameraError}
                className="w-full aspect-video object-cover"
              />

              {/* CAMERA SWITCH */}

              <button
                onClick={toggleCamera}
                disabled={loading}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 active:scale-95 p-3 rounded-full border border-white/20 transition-all backdrop-blur-md z-10 disabled:opacity-50"
                title="Switch Camera"
                aria-label="Switch Camera"
              >
                🔄
              </button>

              {/* CAMERA STATUS */}

              {!cameraReady &&
                !cameraError &&
                !loading && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10">

                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-700 border-t-green-500 mb-4" />

                    <p className="text-white text-sm font-medium">
                      Starting camera...
                    </p>

                    <p className="text-gray-500 text-xs mt-2 text-center px-6">
                      Please allow camera permission if your browser asks.
                    </p>

                  </div>
                )}

              {/* LOADING OVERLAY */}

              {loading && (
                <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center z-20">

                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-700 border-t-green-500 mb-4" />

                  <p className="text-white text-sm font-medium animate-pulse">
                    Analyzing waste...
                  </p>

                  <p className="text-gray-400 text-xs mt-2 text-center px-6">
                    AI engine may take longer after inactivity.
                  </p>

                </div>
              )}

            </div>

            {/* CAMERA ERROR */}

            {cameraError && (
              <div className="mt-5 max-w-lg w-full rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4">

                <p className="text-sm text-red-400">
                  {cameraError}
                </p>

                <p className="text-xs text-gray-500 mt-2">
                  On mobile, make sure your browser has
                  permission to use the camera.
                </p>

              </div>
            )}

            {/* ========================================== */}
            {/* GENERAL ERROR */}
            {/* ========================================== */}

            {error && (
              <div className="mt-5 max-w-lg w-full rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4">

                <p className="text-sm text-red-400">
                  {error}
                </p>

              </div>
            )}

            {/* ========================================== */}
            {/* CAPTURE BUTTON */}
            {/* ========================================== */}

            <button
              onClick={capture}
              disabled={loading || !cameraReady}
              className="mt-8 w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white px-10 sm:px-12 py-4 rounded-2xl font-bold text-lg sm:text-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Analyzing..."
                : !cameraReady
                ? "Starting Camera..."
                : "Identify Object"}
            </button>

            {/* ========================================== */}
            {/* RESULT */}
            {/* ========================================== */}

            {prediction && (
              <div className="mt-8 p-6 sm:p-8 bg-gray-900 rounded-3xl border border-gray-800 shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-300">

                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">

                  <div>

                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-bold">
                      Classification
                    </p>

                    <h2
                      className={`text-3xl sm:text-4xl font-black ${
                        DISPOSAL_INFO[prediction]
                          ?.color || "text-white"
                      }`}
                    >
                      {prediction.toUpperCase()}
                    </h2>

                    {confidence !== null && (
                      <p className="text-sm text-gray-500 mt-2">

                        AI confidence:{" "}

                        <span className="text-green-400 font-semibold">
                          {confidence.toFixed(1)}%
                        </span>

                      </p>
                    )}

                  </div>

                  <span className="px-3 py-1 bg-gray-800 rounded-full text-xs font-bold text-green-400 border border-green-900">

                    {DISPOSAL_INFO[prediction]
                      ?.category || "Unknown"}

                  </span>

                </div>

                <p className="text-gray-300 leading-relaxed border-t border-gray-800 pt-4">

                  <span className="font-bold text-white">
                    Instruction:
                  </span>{" "}

                  {DISPOSAL_INFO[prediction]
                    ?.tip ||
                    "Please dispose of this item responsibly."}

                </p>

              </div>
            )}

          </div>

          {/* ========================================== */}
          {/* RIGHT SIDE - HISTORY */}
          {/* ========================================== */}

          <div className="w-full lg:w-80 bg-gray-900/50 p-6 rounded-3xl border border-gray-800">

            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">

              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />

              Recent Scans

            </h3>

            <div className="space-y-4">

              {history.length === 0 && (
                <p className="text-gray-600 text-sm">
                  No scans yet today.
                </p>
              )}

              {history.map(
                (entry, index) => (
                  <div
                    key={`${entry.time}-${index}`}
                    className="p-4 bg-gray-900 rounded-2xl border border-gray-800 flex justify-between items-center transition-all hover:border-gray-700"
                  >

                    <div>

                      <p className="font-bold capitalize text-green-400">
                        {entry.item}
                      </p>

                      <p className="text-[10px] text-gray-500">
                        {entry.time}
                      </p>

                    </div>

                    <div className="w-2 h-2 bg-gray-700 rounded-full" />

                  </div>
                )
              )}

            </div>

            <button
              onClick={() =>
                router.push("/dashboard")
              }
              className="w-full mt-8 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm font-semibold transition"
            >
              View Full History →
            </button>

          </div>

        </div>
      </div>
    </AuthGuard>
  );
}