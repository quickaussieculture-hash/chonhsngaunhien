/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, UserCheck, Sparkles, AlertCircle, Loader2, Image as ImageIcon, Scan, Users, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as faceapi from '@vladmandic/face-api';

const Typewriter = ({ text, className }: { text: string; className?: string }) => {
  const [displayText, setDisplayText] = useState('');
  
  useEffect(() => {
    let isMounted = true;
    const normalizedText = text.normalize('NFC');
    const chars = Array.from(normalizedText);
    let currentText = '';
    setDisplayText('');
    
    let timeoutId: NodeJS.Timeout;
    
    const type = (index: number) => {
      if (!isMounted || index >= chars.length) return;
      
      currentText += chars[index];
      setDisplayText(currentText);
      timeoutId = setTimeout(() => type(index + 1), 30);
    };
    
    type(0);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [text]);

  return <span className={className}>{displayText}</span>;
};

const SystemLogs = () => {
  const [logs, setLogs] = useState<string[]>(['INITIALIZING SYSTEM...', 'LOADING FACE MODELS...', 'CONNECTING TO OPTICAL SENSORS...']);
  
  useEffect(() => {
    const technicalMessages = [
      'SCANNING BIOMETRIC DATA...',
      'ANALYZING FACIAL GEOMETRY...',
      'ENCRYPTING DATA STREAM...',
      'OPTIMIZING NEURAL NETWORK...',
      'VERIFYING SUBJECT IDENTITY...',
      'CALIBRATING DEPTH SENSORS...',
      'UPDATING DATABASE INDEX...',
      'SYNCING WITH CLOUD NODES...',
      'DETECTING THERMAL SIGNATURES...',
      'PROCESSING PIXEL BUFFER...'
    ];
    
    const interval = setInterval(() => {
      const msg = technicalMessages[Math.floor(Math.random() * technicalMessages.length)];
      setLogs(prev => [msg, ...prev.slice(0, 4)]);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-1 font-mono text-[10px] text-white/30 uppercase tracking-wider">
      {logs.map((log, i) => (
        <div key={i} className={i === 0 ? 'text-orange-500/60 animate-pulse' : ''}>
          [{new Date().toLocaleTimeString([], { hour12: false })}] {log}
        </div>
      ))}
    </div>
  );
};

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [detections, setDetections] = useState<faceapi.FaceDetection[]>([]);
  const [selectedFaceIndex, setSelectedFaceIndex] = useState<number | null>(null);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [capturedFaceImage, setCapturedFaceImage] = useState<string | null>(null);
  const [randomMessage, setRandomMessage] = useState<{ description: string; cheer: string } | null>(null);
  const [recentDescIndices, setRecentDescIndices] = useState<number[]>([]);
  const [recentCheerIndices, setRecentCheerIndices] = useState<number[]>([]);

  const DESCRIPTIONS = [
    "Phát hiện một nụ cười có sức công phá 1000 megawatt, làm sáng bừng cả phòng học.",
    "Gương mặt này có vẻ đang suy nghĩ về việc trưa nay ăn gì hơn là bài học.",
    "Thần thái 'con nhà người ta' cực mạnh, dự đoán là một chiến thần học tập.",
    "Ánh mắt chứa đựng cả một bầu trời kiến thức (hoặc là sự buồn ngủ tột độ).",
    "Vẻ mặt 'vô tội' này không thể đánh lừa được hệ thống AI tối tân của chúng tôi.",
    "Gương mặt chuẩn 'visual' của lớp, thần thái ngút ngàn như đang đi catwalk.",
    "Phát hiện một thiên tài đang ẩn mình dưới lớp vỏ bọc của một học sinh lười biếng.",
    "Gương mặt này toát lên vẻ 'đẹp trai/xinh gái' không tì vết, AI cũng phải bối rối.",
    "Vẻ mặt rất bình thản, kiểu như 'biết ngay là mình mà, không chạy đâu cho thoát'!",
    "Trông bạn ấy rất giống người sẽ được điểm 10 trong bài kiểm tra sắp tới.",
    "Hệ thống phát hiện sóng não đang ở tần số 'vũ trụ', có lẽ đang giao tiếp với người ngoài hành tinh.",
    "Gương mặt toát lên vẻ 'đại gia' kiến thức, nhưng có vẻ đang tạm thời... đóng băng.",
    "Phát hiện một 'mầm mống' của sự nổi tiếng, chuẩn bị tinh thần ký tặng fan đi nhé.",
    "Vẻ mặt này chắc chắn là đang tính toán xem còn bao nhiêu phút nữa thì hết tiết.",
    "Thần thái đỉnh cao, kiểu như 'bảng đen là sàn diễn, phấn trắng là ánh đèn'.",
    "Gương mặt này có chỉ số 'may mắn' đang tăng vọt, chúc mừng bạn đã trúng giải độc đắc mang tên 'Lên Bảng'!",
    "Phát hiện một 'cao thủ' giấu nghề, vẻ mặt điềm tĩnh đến đáng sợ.",
    "Ánh mắt sắc lẹm như dao cạo, chắc chắn là đã thuộc làu làu bài cũ rồi đúng không?",
    "Gương mặt toát lên vẻ 'thanh niên nghiêm túc' của năm, AI cũng phải ngả mũ thán phục.",
    "Vẻ mặt 'ngơ ngác' này thực chất là một chiến thuật để đánh lạc hướng AI, nhưng không thành công đâu!",
    "Phát hiện một mái tóc rất 'nghệ thuật', có vẻ chủ nhân đang cố gắng dùng tóc để che giấu sự lo lắng.",
    "Dù bạn có lấy tay che mặt thì AI vẫn nhận diện được 'khí chất' ngời ngời không thể trộn lẫn.",
    "Hệ thống đã quét qua lớp 'phòng thủ' bằng tay, phát hiện một học sinh đang rất sẵn sàng lên bảng.",
    "Mái tóc này toát lên vẻ thông thái, chắc chắn là một 'kho tàng' kiến thức đang ẩn mình.",
    "Che mặt cũng không thoát được đâu, AI đã khóa mục tiêu dựa trên 'tần số' của sự thông minh rồi!",
    "Phát hiện một kiểu tóc 'độc lạ Bình Dương', chắc chắn là điểm nhấn của cả lớp hôm nay.",
    "Dù chỉ nhìn thấy một phần gương mặt, AI vẫn đoán được bạn là người sẽ 'làm nên chuyện' trên bảng.",
    "Hệ thống nhận diện được sự 'bí ẩn' đằng sau đôi bàn tay đang che mặt kia, mời bạn lộ diện!",
    "Mái tóc bồng bềnh này chính là dấu hiệu của một thiên tài đang chờ được tỏa sáng."
  ];

  const CHEERS = [
    "Chúc bạn lên bảng tự tin như cách bạn nhìn vào ống kính camera này!",
    "Đừng lo, cả lớp đang nín thở dõi theo từng bước chân của bạn lên bảng.",
    "Hãy tỏa sáng và cho mọi người thấy kiến thức của bạn 'khủng' đến mức nào!",
    "Một bước lên bảng, vạn bước thành công. Cố lên, cả lớp tin ở bạn!",
    "Cơ hội ngàn năm có một để thể hiện bản thân, đừng làm AI thất vọng nhé!",
    "Dù kết quả thế nào, bạn vẫn là 'ngôi sao' sáng nhất trong lòng AI hôm nay.",
    "Hãy bước lên bảng với phong thái của một vị thần, mọi khó khăn chỉ là chuyện nhỏ!",
    "AI đã chọn bạn, nghĩa là định mệnh đã gọi tên. Hãy làm nên lịch sử nào!",
    "Chúc bạn có một màn trình diễn 'để đời' trên bảng, khiến thầy cô phải trầm trồ.",
    "Đừng run, cái bảng không đáng sợ bằng việc AI không chọn bạn đâu!",
    "Hãy lên bảng và biến bài tập khó thành trò đùa, bạn làm được mà!",
    "Cả thế giới (và thầy cô) đang chờ đợi màn trình diễn bùng nổ của bạn.",
    "Lên bảng thôi nào, đây là lúc để chứng minh bạn không chỉ có 'nhan sắc' mà còn có 'trí tuệ'!",
    "Đừng nhìn xuống đất, hãy nhìn thẳng vào bảng và nói: 'Chuyện nhỏ như con thỏ'!",
    "Chúc bạn có một chuyến 'du hành' lên bảng thật thú vị và đầy ắp điểm 10.",
    "Hãy coi cái bảng là sân khấu và bạn là ca sĩ chính, hãy 'cháy' hết mình đi!",
    "Lên bảng với tinh thần 'không có gì để mất', và bạn sẽ nhận được tất cả!",
    "Đừng để cái bảng làm khó bạn, hãy làm khó cái bảng bằng kiến thức của mình!",
    "Chúc bạn lên bảng 'mượt' như cách AI quét gương mặt đẹp trai/xinh gái của bạn.",
    "Cố lên chiến binh! Bảng đen chỉ là một thử thách nhỏ trên con đường chinh phục tri thức."
  ];

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        ]);
        setIsModelsLoaded(true);
      } catch (err) {
        console.error("Error loading models:", err);
        setError("Không thể tải mô hình nhận diện. Vui lòng kiểm tra kết nối mạng.");
      }
    };
    loadModels();
  }, []);

  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Trình duyệt của bạn không hỗ trợ truy cập camera.");
      }

      let mediaStream: MediaStream | null = null;
      
      // List of constraints to try from most specific to most general
      const constraintsToTry = [
        { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        { video: { facingMode: 'environment' }, audio: false },
        { video: { facingMode: 'user' }, audio: false },
        { video: true, audio: false }
      ];

      let lastError: any = null;
      for (const constraints of constraintsToTry) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
          if (mediaStream) {
            console.log("Camera started with constraints:", constraints);
            break;
          }
        } catch (e) {
          console.warn("Failed to start camera with constraints:", constraints, e);
          lastError = e;
        }
      }

      if (!mediaStream) {
        throw lastError || new Error("No camera device found");
      }

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraReady(true);
    } catch (err) {
      console.error("Final error accessing camera:", err);
      setError("Không tìm thấy thiết bị camera hoặc quyền truy cập bị từ chối. Vui lòng kiểm tra cài đặt trình duyệt.");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Live detection loop
  useEffect(() => {
    let animationFrameId: number;
    
    const runDetection = async () => {
      if (videoRef.current && isModelsLoaded && isCameraReady && videoRef.current.readyState === 4) {
        const results = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 })
        );
        
        setDetections(results);
        
        // Draw on canvas
        if (canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const displaySize = { width: video.videoWidth, height: video.videoHeight };
          
          if (canvas.width !== displaySize.width || canvas.height !== displaySize.height) {
            canvas.width = displaySize.width;
            canvas.height = displaySize.height;
          }
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Resize detections to match display size
            const resizedDetections = faceapi.resizeResults(results, displaySize);
            
            resizedDetections.forEach((detection, index) => {
              const { x, y, width, height } = detection.box;
              const isSelected = selectedFaceIndex === index;
              const color = isSelected ? '#f97316' : '#22c55e';
              const cornerSize = 20;
              
              ctx.strokeStyle = color;
              ctx.lineWidth = isSelected ? 3 : 1.5;
              
              // Draw corners instead of full rect
              // Top Left
              ctx.beginPath();
              ctx.moveTo(x, y + cornerSize);
              ctx.lineTo(x, y);
              ctx.lineTo(x + cornerSize, y);
              ctx.stroke();
              
              // Top Right
              ctx.beginPath();
              ctx.moveTo(x + width - cornerSize, y);
              ctx.lineTo(x + width, y);
              ctx.lineTo(x + width, y + cornerSize);
              ctx.stroke();
              
              // Bottom Left
              ctx.beginPath();
              ctx.moveTo(x, y + height - cornerSize);
              ctx.lineTo(x, y + height);
              ctx.lineTo(x + cornerSize, y + height);
              ctx.stroke();
              
              // Bottom Right
              ctx.beginPath();
              ctx.moveTo(x + width - cornerSize, y + height);
              ctx.lineTo(x + width, y + height);
              ctx.lineTo(x + width, y + height - cornerSize);
              ctx.stroke();

              // Draw subtle background for selected
              if (isSelected) {
                ctx.fillStyle = 'rgba(249, 115, 22, 0.05)';
                ctx.fillRect(x, y, width, height);
                
                // Scanning line for selected
                if (isRandomizing) {
                  const scanY = y + (Math.sin(Date.now() / 100) * 0.5 + 0.5) * height;
                  ctx.strokeStyle = 'rgba(249, 115, 22, 0.8)';
                  ctx.lineWidth = 2;
                  ctx.beginPath();
                  ctx.moveTo(x, scanY);
                  ctx.lineTo(x + width, scanY);
                  ctx.stroke();
                  
                  ctx.shadowBlur = 10;
                  ctx.shadowColor = '#f97316';
                  ctx.stroke();
                  ctx.shadowBlur = 0;
                }
              }
              
              // Draw tech labels
              ctx.font = '10px "JetBrains Mono", monospace';
              ctx.fillStyle = color;
              const label = isSelected ? '>> TARGET_LOCKED' : `>> SUBJECT_${(index + 1).toString().padStart(3, '0')}`;
              ctx.fillText(label, x, y - 8);
              
              if (isSelected) {
                ctx.font = '8px "JetBrains Mono", monospace';
                ctx.fillText(`X:${Math.round(x)} Y:${Math.round(y)}`, x, y + height + 12);
                ctx.fillText(`W:${Math.round(width)} H:${Math.round(height)}`, x + width - 40, y + height + 12);
              }
            });
          }
        }
      }
      animationFrameId = requestAnimationFrame(runDetection);
    };

    if (isModelsLoaded && isCameraReady) {
      runDetection();
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isModelsLoaded, isCameraReady, selectedFaceIndex]);

  const captureFace = useCallback((index: number) => {
    if (!videoRef.current || detections.length <= index) return;

    const video = videoRef.current;
    const detection = detections[index];
    const { x, y, width, height } = detection.box;

    // Create a temporary canvas for cropping
    const tempCanvas = document.createElement('canvas');
    const padding = 0.2; // 20% padding
    const padX = width * padding;
    const padY = height * padding;

    // Ensure we don't go out of bounds
    const sourceX = Math.max(0, x - padX);
    const sourceY = Math.max(0, y - padY);
    const sourceW = Math.min(video.videoWidth - sourceX, width + padX * 2);
    const sourceH = Math.min(video.videoHeight - sourceY, height + padY * 2);

    tempCanvas.width = sourceW;
    tempCanvas.height = sourceH;
    const ctx = tempCanvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(
        video,
        sourceX, sourceY, sourceW, sourceH,
        0, 0, sourceW, sourceH
      );
      setCapturedFaceImage(tempCanvas.toDataURL('image/jpeg', 0.9));
    }
  }, [detections]);

  const handleRandomize = () => {
    if (detections.length === 0) return;
    
    setIsRandomizing(true);
    setSelectedFaceIndex(null);
    setCapturedFaceImage(null);
    setRandomMessage(null);
    
    // Simulate a "randomizing" effect
    let count = 0;
    const maxCount = 15;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * detections.length);
      setSelectedFaceIndex(randomIndex);
      count++;
      
      if (count >= maxCount) {
        clearInterval(interval);
        setIsRandomizing(false);
        // Final selection and capture
        captureFace(randomIndex);
        
        // Pick random messages avoiding recent ones
        let descIdx;
        do {
          descIdx = Math.floor(Math.random() * DESCRIPTIONS.length);
        } while (recentDescIndices.includes(descIdx) && DESCRIPTIONS.length > recentDescIndices.length);
        
        let cheerIdx;
        do {
          cheerIdx = Math.floor(Math.random() * CHEERS.length);
        } while (recentCheerIndices.includes(cheerIdx) && CHEERS.length > recentCheerIndices.length);

        // Update recent indices (keep last 6)
        setRecentDescIndices(prev => [descIdx, ...prev].slice(0, 6));
        setRecentCheerIndices(prev => [cheerIdx, ...prev].slice(0, 6));

        setRandomMessage({ 
          description: DESCRIPTIONS[descIdx], 
          cheer: CHEERS[cheerIdx] 
        });
      }
    }, 100);
  };

  const reset = () => {
    setSelectedFaceIndex(null);
    setCapturedFaceImage(null);
    setRandomMessage(null);
    setError(null);
  };

  return (
    <div className="min-h-screen font-sans relative overflow-hidden bg-[#050505]">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.05),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:200px_200px]" />
        
        {/* Animated Scanning Line */}
        <motion.div 
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent z-10"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg glow-orange flicker">
                <Scan className="text-orange-500" size={24} />
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-black uppercase italic tracking-tighter text-white glitch-hover cursor-default">
                NGƯỜI <span className="text-orange-500">ĐƯỢC CHỌN</span>
              </h1>
            </div>
            <p className="text-white/40 font-mono text-xs uppercase tracking-[0.2em] ml-1">
              Hệ thống nhận diện & chọn học sinh ngẫu nhiên (thầy Ksor Gé phát triển)
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 glass-panel rounded-full flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isCameraReady ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/60">
                {isCameraReady ? 'Camera Online' : 'Camera Offline'}
              </span>
            </div>
            <div className="px-4 py-2 glass-panel rounded-full flex items-center gap-2">
              <Users className="text-orange-500" size={14} />
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/60">
                {detections.length} Students Detected
              </span>
            </div>
          </div>
        </header>

        <main className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Main Viewport */}
          <div className="lg:col-span-8 space-y-6">
            <div className="relative glass-panel rounded-3xl overflow-hidden group">
              {/* HUD Corners */}
              <div className="hud-corner top-4 left-4 border-t-2 border-l-2" />
              <div className="hud-corner top-4 right-4 border-t-2 border-r-2" />
              <div className="hud-corner bottom-4 left-4 border-b-2 border-l-2" />
              <div className="hud-corner bottom-4 right-4 border-b-2 border-r-2" />
              
              <div className="aspect-video bg-black relative">
                {!isModelsLoaded ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="animate-spin text-orange-500" size={48} />
                    <p className="text-orange-500 font-mono text-xs uppercase tracking-widest animate-pulse">
                      Đang tải AI Engine...
                    </p>
                  </div>
                ) : error ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                      <AlertCircle className="text-red-500 mx-auto mb-3" size={48} />
                      <p className="text-red-400 font-medium max-w-md">{error}</p>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={startCamera}
                        className="bg-orange-500 hover:bg-orange-600 text-black px-6 py-3 rounded-xl flex items-center gap-2 transition-all font-bold uppercase text-sm tracking-widest"
                      >
                        <Camera size={18} />
                        Thử lại
                      </button>
                      <button
                        onClick={() => window.location.reload()}
                        className="glass-panel hover:bg-white/10 px-6 py-3 rounded-xl flex items-center gap-2 transition-all text-sm uppercase tracking-widest"
                      >
                        <RefreshCw size={18} />
                        Tải lại
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover opacity-80"
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full pointer-events-none"
                    />
                    <div className="absolute inset-0 scanline opacity-20" />
                    
                    {/* Viewport Overlay Info */}
                    <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none">
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono uppercase text-white/40 tracking-widest">System Status</div>
                        <div className="text-xs font-mono text-green-500">ACTIVE_SCANNING_V3</div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-[10px] font-mono uppercase text-white/40 tracking-widest">Coordinates</div>
                        <div className="text-xs font-mono text-orange-500">
                          {detections.length > 0 ? `X:${Math.round(detections[0].box.x)} Y:${Math.round(detections[0].box.y)}` : 'SEARCHING...'}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleRandomize}
                disabled={!isCameraReady || detections.length === 0 || isRandomizing}
                className="group relative overflow-hidden bg-orange-500 hover:bg-orange-600 disabled:bg-white/5 disabled:text-white/20 text-black py-5 rounded-2xl transition-all font-black uppercase italic text-xl tracking-tighter glow-orange disabled:shadow-none"
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {isRandomizing ? (
                    <>
                      <Loader2 className="animate-spin" size={24} />
                      <span>Đang quét...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={24} className="fill-current" />
                      <span>Chọn ngẫu nhiên</span>
                    </>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>

              <button
                onClick={reset}
                className="glass-panel hover:bg-white/10 text-white py-5 rounded-2xl transition-all font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3"
              >
                <RefreshCw size={20} />
                Làm mới
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            <AnimatePresence mode="wait">
              {selectedFaceIndex !== null ? (
                <motion.div
                  key="selected"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass-panel rounded-3xl p-8 space-y-8 relative overflow-hidden"
                >
                  {/* Selected Indicator */}
                  <div className="absolute top-0 right-0 p-4">
                    <div className="bg-orange-500 text-black text-[10px] font-black px-2 py-1 rounded uppercase italic">Target Locked</div>
                  </div>

                  <div className="text-center space-y-6">
                    <div className="relative inline-block">
                      {capturedFaceImage ? (
                        <div className="w-40 h-40 rounded-3xl overflow-hidden border-2 border-orange-500/50 glow-orange rotate-3">
                          <img 
                            src={capturedFaceImage} 
                            alt="Captured face" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="w-40 h-40 glass-panel rounded-3xl flex items-center justify-center">
                          <UserCheck className="text-orange-500" size={48} />
                        </div>
                      )}
                      
                      {isRandomizing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-3xl">
                          <Loader2 className="animate-spin text-orange-500" size={40} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-3xl font-display font-black text-orange-500 uppercase italic tracking-tighter">ĐÃ CHỌN!</h3>
                      <p className="text-xs font-mono text-white/40 uppercase tracking-widest">Student ID: #{selectedFaceIndex + 1}</p>
                    </div>
                  </div>

                  <div className="space-y-6 pt-6 border-t border-white/10">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-3 bg-orange-500" />
                        <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">Phân tích đặc điểm & Nhận diện tóc</label>
                      </div>
                      <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-sm leading-relaxed italic text-orange-100/90 font-medium">
                        {randomMessage ? (
                          <Typewriter text={`"${randomMessage.description}"`} />
                        ) : (
                          "Hệ thống đang xử lý dữ liệu..."
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-3 bg-green-500" />
                        <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">Lời chúc, lời nhắn nhủ</label>
                      </div>
                      <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-sm leading-relaxed font-bold text-green-400 shadow-[inset_0_0_20px_rgba(34,197,94,0.1)]">
                        {randomMessage ? (
                          <Typewriter text={randomMessage.cheer} />
                        ) : (
                          "Mời bạn lên bảng!"
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-panel rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px]"
                >
                  <div className="w-20 h-20 glass-panel rounded-full flex items-center justify-center text-white/20">
                    <Scan size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-display font-bold uppercase tracking-tight">Sẵn sàng quét</h3>
                    <p className="text-sm text-white/40 max-w-[200px] font-mono uppercase text-[10px] tracking-widest">
                      Nhấn nút bên dưới để bắt đầu chọn học sinh
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* System Info Card */}
            <div className="glass-panel rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-white/30">
                <span>System Logs</span>
                <span className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-green-500" />
                  Online
                </span>
              </div>
              <SystemLogs />
            </div>
          </aside>
        </main>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-mono uppercase tracking-[0.3em] text-white/20">
          <p>© 2026 KSOR GÉ SYSTEMS</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-orange-500 transition-colors">Documentation</a>
            <a href="#" className="hover:text-orange-500 transition-colors">Security</a>
            <a href="#" className="hover:text-orange-500 transition-colors">v3.0.4</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
