/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { AppErrorType, mapBrowserErrorToAppError } from '../utils/ErrorHandler';
import { RecordingStatus } from '../types';

export type RecordingMode = 'microphone' | 'system' | 'meeting';

interface UseAudioRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onDataAvailable?: (blob: Blob) => void;
  onError: (errorType: AppErrorType, customMessage?: string) => void;
}

const getSupportedMimeType = () => {
  if (typeof MediaRecorder === 'undefined') return '';
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg'
  ];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return '';
};

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
  const recordingTimeRef = useRef<number>(0);
  const isRecordingRef = useRef<boolean>(false);
  const discardOnStopRef = useRef<boolean>(false);
  
  // Audio Context for Visualization
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stream references to prevent unmount leaks
  const micStreamRef = useRef<MediaStream | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);

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
        setRecordingTime((prev) => {
          const next = prev + 1;
          recordingTimeRef.current = next;
          return next;
        });
      }, 1000);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.warn('Speech recognition failed to resume:', error);
        }
      }
    }
  }, []);

  const cleanupAudio = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach(track => track.stop());
      displayStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(err => console.warn("Failed to close AudioContext:", err));
      audioContextRef.current = null;
    }
    if (volumeIntervalRef.current) {
      cancelAnimationFrame(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }
    analyserRef.current = null;
    audioChunksRef.current = []; // Release compiled memory immediately
    isRecordingRef.current = false;
  }, []);

  const startRecording = useCallback(async (mode: RecordingMode = 'microphone') => {
    try {
      setStatus('listening');
      setLiveTranscript('');
      isRecordingRef.current = true;
      discardOnStopRef.current = false;
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }

      let stream: MediaStream | null = null;
      let micStream: MediaStream | null = null;
      let displayStream: MediaStream | null = null;

      const captureMic = async (): Promise<MediaStream | null> => {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          micStreamRef.current = s;
          return s;
        } catch (err) {
          console.warn("Microphone access failed:", err);
          return null;
        }
      };

      if (mode === 'meeting') {
        micStream = await captureMic();
        if (navigator.mediaDevices?.getDisplayMedia) {
          try {
            displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            displayStreamRef.current = displayStream;
            displayStream.getVideoTracks().forEach(t => t.stop());
          } catch (e) {
            console.warn("Display audio capture skipped, continuing with microphone.");
          }
        }
        if (micStream && displayStream && displayStream.getAudioTracks().length > 0) {
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const destination = audioContext.createMediaStreamDestination();
            const micSource = audioContext.createMediaStreamSource(micStream);
            const displaySource = audioContext.createMediaStreamSource(displayStream);
            micSource.connect(destination);
            displaySource.connect(destination);
            stream = destination.stream;
            audioContextRef.current = audioContext;
          } catch (e) {
            stream = micStream;
          }
        } else {
          stream = micStream || displayStream;
        }
      } else if (mode === 'system') {
        if (navigator.mediaDevices?.getDisplayMedia) {
          try {
            displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            displayStreamRef.current = displayStream;
            displayStream.getVideoTracks().forEach(t => t.stop());
            if (displayStream.getAudioTracks().length > 0) {
              stream = new MediaStream(displayStream.getAudioTracks());
            }
          } catch (e) {
            console.warn("System audio share cancelled, falling back to mic.");
          }
        }
        if (!stream) {
          micStream = await captureMic();
          stream = micStream;
        }
      } else {
        micStream = await captureMic();
        stream = micStream;
      }

      if (!stream) {
        onError(AppErrorType.MIC_PERMISSION_DENIED, "Could not access microphone or audio input. Please check device permissions.");
        setStatus('error');
        cleanupAudio();
        return false;
      }
      streamRef.current = stream;

      // Setup Web Speech API for live transcription
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';
          for (let i = 0; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          setLiveTranscript(finalTranscript.trim() + (interimTranscript ? ' ... ' + interimTranscript : ''));
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
        if (!isRecordingRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalizedVolume = Math.min(100, Math.round((average / 128) * 100));
        setVolume(normalizedVolume);
        setIsSpeaking(normalizedVolume > 10);
        volumeIntervalRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      // Small delay to ensure stream is fully stabilized
      await new Promise(resolve => setTimeout(resolve, 200));

      // Ensure stream is active before starting recorder
      if (stream.getTracks().every(track => track.readyState === 'live')) {
        try {
          const mimeType = getSupportedMimeType();
          const mediaRecorder = mimeType 
            ? new MediaRecorder(stream, { mimeType }) 
            : new MediaRecorder(stream);
            
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          const activeMimeType = mediaRecorder.mimeType || mimeType || 'audio/webm';

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
              if (onDataAvailable) {
                const currentBlob = new Blob(audioChunksRef.current, { type: activeMimeType });
                onDataAvailable(currentBlob);
              }
            }
          };

          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: activeMimeType });
            const shouldDiscard = discardOnStopRef.current;
            discardOnStopRef.current = false;

            if (shouldDiscard) {
              cleanupAudio();
              setVolume(0);
              setIsSpeaking(false);
              setStatus('idle');
              return;
            }

            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);

            if (audioBlob.size < 1000) { // Very small blob usually means no audio
               onError(AppErrorType.REC_TOO_SHORT);
               setStatus('error');
            } else {
               onRecordingComplete(audioBlob, recordingTimeRef.current);
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
            stopTimer();
            cleanupAudio();
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
          recordingTimeRef.current = 0;
          setRecordingTime(0);
          
          timerRef.current = setInterval(() => {
            setRecordingTime((prev) => {
              const next = prev + 1;
              recordingTimeRef.current = next;
              return next;
            });
          }, 1000);
          return true;
        } catch (recorderErr) {
          console.error('Failed to start MediaRecorder:', recorderErr);
          throw recorderErr;
        }
      } else {
        throw new Error('Audio stream is not active. Please check your permissions.');
      }

    } catch (err: any) {
      console.error('Recording start error:', err);
      const errorMsg = err?.message || 'An unexpected error occurred';
      if (errorMsg.includes('getDisplayMedia')) {
        onError(AppErrorType.UNKNOWN, 'Screen sharing is not available in your current environment. Try using Chrome/Edge on Desktop over localhost or HTTPS.');
      } else {
        const errorType = mapBrowserErrorToAppError(err);
        onError(errorType, errorType === AppErrorType.UNKNOWN ? `Error: ${errorMsg}` : undefined);
      }
      setStatus('error');
      cleanupAudio();
      return false;
    }
  }, [onRecordingComplete, onDataAvailable, onError, cleanupAudio, audioUrl, stopTimer]);

  const stopRecording = useCallback((discard = false) => {
    if (discard) {
      discardOnStopRef.current = true;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      stopTimer();
      setStatus(discard ? 'idle' : 'processing');
      return;
    }

    stopTimer();
    cleanupAudio();
    if (discard) setStatus('idle');
  }, [cleanupAudio, stopTimer]);

  const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    try {
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
    } finally {
      if (audioContext.state !== 'closed') {
        await audioContext.close().catch(err => console.warn("Failed to close conversion AudioContext:", err));
      }
    }
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
