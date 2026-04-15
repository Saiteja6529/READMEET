/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { AppErrorType, mapBrowserErrorToAppError } from '../utils/ErrorHandler';

export type RecordingStatus = 'idle' | 'listening' | 'recording' | 'paused' | 'processing' | 'completed' | 'error';
export type RecordingMode = 'microphone' | 'system' | 'meeting';

interface UseAudioRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onDataAvailable?: (blob: Blob) => void;
  onError: (errorType: AppErrorType) => void;
}

export const useAudioRecorder = ({ onRecordingComplete, onDataAvailable, onError }: UseAudioRecorderProps) => {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [volume, setVolume] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const volumeIntervalRef = useRef<number | null>(null);
  
  // Audio Context for Visualization
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      stopTimer();
      setStatus('paused');
      if (recognitionRef.current) recognitionRef.current.stop();
    }
  }, [stopTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setStatus('recording');
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      if (recognitionRef.current) recognitionRef.current.start();
    }
  }, []);

  const cleanupAudio = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (volumeIntervalRef.current) {
      cancelAnimationFrame(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const startRecording = useCallback(async (mode: RecordingMode = 'microphone') => {
    try {
      setStatus('listening');
      setLiveTranscript('');
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }

      let stream: MediaStream;
      let micStream: MediaStream | null = null;
      let displayStream: MediaStream | null = null;

      if (mode === 'meeting') {
        // Capture both Mic and System Audio
        try {
          micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
          throw new Error('Microphone access denied. Please allow microphone access to record meetings.');
        }

        try {
          displayStream = await navigator.mediaDevices.getDisplayMedia({ 
            video: true, 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          
          const audioTracks = displayStream.getAudioTracks();
          if (audioTracks.length === 0) {
            displayStream.getTracks().forEach(t => t.stop());
            micStream.getTracks().forEach(t => t.stop());
            throw new Error('No system audio selected. Please make sure to check "Share tab audio" or "Share system audio".');
          }
          
          // Stop video tracks immediately
          displayStream.getVideoTracks().forEach(track => track.stop());
        } catch (err: any) {
          micStream.getTracks().forEach(t => t.stop());
          if (err.name === 'NotAllowedError') {
            throw new Error('System audio access denied. Please allow screen sharing with audio.');
          }
          throw err;
        }

        // Merge streams using AudioContext
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const destination = audioContext.createMediaStreamDestination();
        
        const micSource = audioContext.createMediaStreamSource(micStream);
        const displaySource = audioContext.createMediaStreamSource(displayStream);
        
        micSource.connect(destination);
        displaySource.connect(destination);
        
        stream = destination.stream;
        audioContextRef.current = audioContext;
        
        // Keep references for cleanup
        streamRef.current = new MediaStream([
          ...micStream.getTracks(),
          ...displayStream.getTracks()
        ]);
      } else if (mode === 'system') {
        stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true, 
          audio: true 
        });
        
        // Ensure audio track exists
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
          stream.getTracks().forEach(t => t.stop());
          throw new Error('No system audio selected. Please make sure to check "Share tab audio".');
        }
        
        // Stop video tracks as we only need audio
        stream.getVideoTracks().forEach(track => track.stop());
        streamRef.current = stream;
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      }
      
      // Setup Web Speech API for live transcription
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          setLiveTranscript(prev => prev + finalTranscript + interimTranscript);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
        };

        try {
          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.warn('Speech recognition failed to start:', e);
        }
      }

      // Setup Web Audio API for visualizer and volume
      const audioContext = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Volume detection
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (status === 'completed' || status === 'error') return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalizedVolume = Math.min(100, Math.round((average / 128) * 100));
        setVolume(normalizedVolume);
        setIsSpeaking(normalizedVolume > 10); // Threshold for "Speaking"
        volumeIntervalRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      // Small delay to ensure stream is fully stabilized
      await new Promise(resolve => setTimeout(resolve, 200));

      // Ensure stream is active before starting recorder
      if (stream.getTracks().every(track => track.readyState === 'live')) {
        try {
          const options = { mimeType: 'audio/webm;codecs=opus' };
          const mediaRecorder = MediaRecorder.isTypeSupported(options.mimeType) 
            ? new MediaRecorder(stream, options) 
            : new MediaRecorder(stream);
            
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
              if (onDataAvailable) {
                const currentBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                onDataAvailable(currentBlob);
              }
            }
          };

          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);

            if (audioBlob.size < 1000) { // Very small blob usually means no audio
               onError(AppErrorType.REC_TOO_SHORT);
               setStatus('error');
            } else {
               onRecordingComplete(audioBlob, recordingTime);
               setStatus('completed');
            }
            cleanupAudio();
            setVolume(0);
            setIsSpeaking(false);
          };

          mediaRecorder.onerror = (event: any) => {
            console.error('MediaRecorder error:', event.error);
            onError(AppErrorType.REC_DEVICE_ERROR);
            setStatus('error');
          };

          // Handle tracks ending (e.g. user stops sharing)
          stream.getTracks().forEach(track => {
            track.onended = () => {
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                stopRecording();
              }
            };
          });

          mediaRecorder.start(1000); // Collect data every second for stability
          setStatus('recording');
          setRecordingTime(0);
          
          timerRef.current = setInterval(() => {
            setRecordingTime((prev) => prev + 1);
          }, 1000);
        } catch (recorderErr) {
          console.error('Failed to start MediaRecorder:', recorderErr);
          throw recorderErr;
        }
      } else {
        throw new Error('Audio stream is not active. Please check your permissions.');
      }

    } catch (err: any) {
      console.error('Recording start error:', err);
      const errorType = mapBrowserErrorToAppError(err);
      onError(errorType);
      setStatus('error');
      cleanupAudio();
    }
  }, [onRecordingComplete, onDataAvailable, onError, cleanupAudio, audioUrl]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      stopTimer();
      setStatus('processing');
    }
  }, [stopTimer]);

  const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    
    const buffer = new ArrayBuffer(44 + audioBuffer.length * blockAlign);
    const view = new DataView(buffer);
    
    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* RIFF chunk length */
    view.setUint32(4, 36 + audioBuffer.length * blockAlign, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, format, true);
    /* channel count */
    view.setUint16(22, numChannels, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * blockAlign, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, blockAlign, true);
    /* bits per sample */
    view.setUint16(34, bitDepth, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, audioBuffer.length * blockAlign, true);
    
    const offset = 44;
    const channelData = [];
    for (let i = 0; i < numChannels; i++) {
      channelData.push(audioBuffer.getChannelData(i));
    }
    
    let index = 0;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
        view.setInt16(offset + index * bytesPerSample, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        index++;
      }
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  };

  function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  const requestData = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.requestData();
    }
  }, []);

  useEffect(() => {
    return () => {
      stopTimer();
      cleanupAudio();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [stopTimer, cleanupAudio, audioUrl]);

  return {
    status,
    setStatus,
    recordingTime,
    volume,
    isSpeaking,
    audioUrl,
    liveTranscript,
    startRecording,
    stopRecording,
    resumeRecording,
    pauseRecording,
    requestData,
    convertToWav,
    analyser: analyserRef.current
  };
};
