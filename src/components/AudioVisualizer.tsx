/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isRecording: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyser, isRecording }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!analyser || !isRecording || !canvasRef.current) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        // Gradient for bars
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#ef4444'); // Red at bottom
        gradient.addColorStop(0.5, '#f59e0b'); // Orange in middle
        gradient.addColorStop(1, '#10b981'); // Green at top

        ctx.fillStyle = gradient;
        
        // Draw centered bars
        const y = (height - barHeight) / 2;
        ctx.fillRect(x, y, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [analyser, isRecording]);

  return (
    <div className="w-full h-16 bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden flex items-center justify-center border border-[#141414]/10 dark:border-[#333]">
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={64} 
        className="w-full h-full"
      />
    </div>
  );
};
