/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

interface ProfessionalWaveformProps {
  isRecording: boolean;
  analyser?: AnalyserNode | null;
  color?: string;
}

export const ProfessionalWaveform: React.FC<ProfessionalWaveformProps> = ({ 
  isRecording, 
  analyser,
  color = '#0F172A' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser?.frequencyBinCount || 0;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw a flat line when not recording
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.2;
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        return;
      }

      animationRef.current = requestAnimationFrame(draw);

      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = 1.5;
      const spacing = 2;
      const totalBarWidth = barWidth + spacing;
      const barCount = Math.floor(canvas.width / totalBarWidth);
      
      // Create gradient for bars
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.5, color);
      gradient.addColorStop(1, color);
      
      ctx.fillStyle = gradient;

      for (let i = 0; i < barCount; i++) {
        // Map dataArray to barCount
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const value = dataArray[dataIndex] || 0;
        
        // Calculate height based on value (0-255)
        const percent = value / 255;
        const height = Math.max(2, percent * canvas.height * 0.8);
        
        const x = i * totalBarWidth;
        const y = (canvas.height - height) / 2;

        // Draw rounded bars
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, height, 1);
        ctx.fill();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isRecording, analyser, color]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
        canvasRef.current.height = 80; // Fixed height for waveform
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full h-20 flex items-center justify-center overflow-hidden">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
      />
    </div>
  );
};
