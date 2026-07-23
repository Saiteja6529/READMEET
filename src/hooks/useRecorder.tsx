/** @license
 *  SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseRecorderReturn {
    isRecording: boolean;
    isPaused: boolean;
    isProcessing: boolean;
    audioBlob: Blob | null;
    start: () => Promise<void>;
    pause: () => void;
    resume: () => void;
    stop: () => void;
    reset: () => void;
    setIsProcessing: (v: boolean) => void;
    setIsRecording: (v: boolean) => void;   // <-- needed for external callers
}

/**
 * Custom hook encapsulating the MediaRecorder API.
 */
export const useRecorder = (): UseRecorderReturn => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const discardOnStopRef = useRef(false);

    const stopTracks = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    }, []);

    const start = useCallback(async () => {
        if (isRecording) return;
        try {
            setIsProcessing(false);
            setAudioBlob(null);
            chunksRef.current = [];
            discardOnStopRef.current = false;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mime = MediaRecorder.isTypeSupported('audio/webm')
                ? 'audio/webm'
                : MediaRecorder.isTypeSupported('audio/mp4')
                    ? 'audio/mp4'
                    : undefined;

            const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = e => {
                if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
            };
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mime ?? 'audio/webm' });
                const shouldDiscard = discardOnStopRef.current;
                discardOnStopRef.current = false;
                stopTracks();
                mediaRecorderRef.current = null;

                if (shouldDiscard) {
                    chunksRef.current = [];
                    setAudioBlob(null);
                    setIsProcessing(false);
                    return;
                }

                setAudioBlob(blob);
                setIsProcessing(blob.size > 0);
            };
            recorder.start(1000);
            setIsRecording(true);
            setIsPaused(false);
        } catch (err) {
            console.error('Failed to start recording:', err);
            stopTracks();
            setIsRecording(false);
            setIsPaused(false);
            throw err;
        }
    }, [isRecording, stopTracks]);

    const pause = useCallback(() => {
        if (!isRecording || isPaused || !mediaRecorderRef.current) return;
        if (mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
        }
    }, [isRecording, isPaused]);

    const resume = useCallback(() => {
        if (!isRecording || !isPaused || !mediaRecorderRef.current) return;
        if (mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
        }
    }, [isRecording, isPaused]);

    const stop = useCallback(() => {
        if (!isRecording || !mediaRecorderRef.current) return;
        if (mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
        setIsRecording(false);
        setIsPaused(false);
    }, [isRecording]);

    const reset = useCallback(() => {
        discardOnStopRef.current = true;
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        } else {
            stopTracks();
            mediaRecorderRef.current = null;
        }
        mediaRecorderRef.current = null;
        chunksRef.current = [];
        setAudioBlob(null);
        setIsRecording(false);
        setIsPaused(false);
        setIsProcessing(false);
    }, [stopTracks]);

    useEffect(() => {
        return () => {
            reset();
        };
    }, [reset]);

    return {
        isRecording,
        isPaused,
        isProcessing,
        audioBlob,
        start,
        pause,
        resume,
        stop,
        reset,
        setIsProcessing,
        setIsRecording,
    };
};

export default useRecorder;
