/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum AppErrorType {
  // Microphone Errors
  MIC_PERMISSION_DENIED = 'MIC_PERMISSION_DENIED',
  MIC_NOT_FOUND = 'MIC_NOT_FOUND',
  MIC_IN_USE = 'MIC_IN_USE',
  MIC_SECURITY_ERROR = 'MIC_SECURITY_ERROR',

  // Screen / System Audio Errors
  SCREEN_PERMISSION_DENIED = 'SCREEN_PERMISSION_DENIED',
  SCREEN_CANCELLED = 'SCREEN_CANCELLED',
  SCREEN_NO_AUDIO = 'SCREEN_NO_AUDIO',

  // Recording Errors
  REC_NO_SPEECH = 'REC_NO_SPEECH',
  REC_TOO_SHORT = 'REC_TOO_SHORT',
  REC_SILENT = 'REC_SILENT',
  REC_DEVICE_ERROR = 'REC_DEVICE_ERROR',
  REC_STREAM_INACTIVE = 'REC_STREAM_INACTIVE',

  // Network Errors
  NET_OFFLINE = 'NET_OFFLINE',
  NET_TIMEOUT = 'NET_TIMEOUT',
  NET_SERVER_ERROR = 'NET_SERVER_ERROR',

  // API Errors
  API_KEY_MISSING = 'API_KEY_MISSING',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  API_INVALID_RESPONSE = 'API_INVALID_RESPONSE',

  // Generic
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: AppErrorType;
  message: string;
  details?: string;
}

export const getErrorMessage = (type: AppErrorType): string => {
  switch (type) {
    case AppErrorType.MIC_PERMISSION_DENIED:
      return 'Microphone access was denied. Click the microphone icon in your browser address bar and allow access, then try again.';
    case AppErrorType.MIC_NOT_FOUND:
      return 'No microphone detected. Please plug in a microphone or headset and try again.';
    case AppErrorType.MIC_IN_USE:
      return 'Microphone is in use by another application. Close other apps using the mic (e.g. Zoom, Teams) and try again.';
    case AppErrorType.MIC_SECURITY_ERROR:
      return 'Microphone access is blocked by a security policy. Make sure you are on a secure (HTTPS) connection.';
    case AppErrorType.SCREEN_PERMISSION_DENIED:
      return 'Screen/audio sharing was denied. Click the lock icon in your browser address bar, allow screen sharing, then try again.';
    case AppErrorType.SCREEN_CANCELLED:
      return 'You closed the sharing dialog without selecting a source. Click Start Recording and choose a tab, window, or screen to share.';
    case AppErrorType.SCREEN_NO_AUDIO:
      return 'No audio track was captured. In the browser share dialog, make sure to check "Share tab audio" (bottom-left) or "Share system audio" before clicking Share.';
    case AppErrorType.REC_NO_SPEECH:
      return 'No speech detected in the recording. Please speak clearly and check your microphone volume.';
    case AppErrorType.REC_TOO_SHORT:
      return 'The recording was too short. Please record for at least a few seconds.';
    case AppErrorType.REC_SILENT:
      return 'The recording captured silence only. Check microphone volume and try again.';
    case AppErrorType.REC_DEVICE_ERROR:
      return 'A recording device error occurred. Check your hardware connections and try again.';
    case AppErrorType.REC_STREAM_INACTIVE:
      return 'The audio stream became inactive unexpectedly. This can happen if you stopped sharing. Please try again.';
    case AppErrorType.NET_OFFLINE:
      return 'No internet connection. Please check your network and try again.';
    case AppErrorType.NET_TIMEOUT:
      return 'The request timed out. Please try again with a shorter recording.';
    case AppErrorType.NET_SERVER_ERROR:
      return 'Server error while processing. Please try again.';
    case AppErrorType.API_KEY_MISSING:
      return 'Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file.';
    case AppErrorType.API_RATE_LIMIT:
      return 'API rate limit exceeded. Please wait a moment before trying again.';
    case AppErrorType.API_INVALID_RESPONSE:
      return 'Received an invalid response from the AI service. Please try again.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

/**
 * Maps any browser MediaDevices error (or custom thrown Error) to an AppErrorType.
 * Handles: NotAllowedError, AbortError, NotFoundError, NotReadableError,
 * SecurityError, OverconstrainedError, InvalidStateError, TypeError,
 * and custom message-based errors thrown by the recorder hook.
 */
export const mapBrowserErrorToAppError = (err: any): AppErrorType => {
  const name: string = err?.name ?? '';
  const message: string = (err?.message ?? '').toLowerCase();

  // ── User cancelled the share/permission dialog ──
  if (name === 'AbortError' || name === 'NotAllowedError') {
    // Screen share cancelled vs mic denied
    if (
      message.includes('screen') ||
      message.includes('display') ||
      message.includes('share') ||
      message.includes('system audio') ||
      message.includes('tab audio')
    ) {
      // Distinguish: closed dialog vs actually denied
      if (name === 'AbortError') return AppErrorType.SCREEN_CANCELLED;
      return AppErrorType.SCREEN_PERMISSION_DENIED;
    }
    // Mic denied
    if (name === 'AbortError') return AppErrorType.SCREEN_CANCELLED; // generic cancel
    return AppErrorType.MIC_PERMISSION_DENIED;
  }

  // ── No device found ──
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return AppErrorType.MIC_NOT_FOUND;
  }

  // ── Device in use by another app ──
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return AppErrorType.MIC_IN_USE;
  }

  // ── Security / HTTPS policy ──
  if (name === 'SecurityError') {
    return AppErrorType.MIC_SECURITY_ERROR;
  }

  // ── Overconstrained (resolution/sample rate not supported) ──
  if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
    return AppErrorType.REC_DEVICE_ERROR;
  }

  // ── Stream went inactive mid-recording ──
  if (name === 'InvalidStateError') {
    return AppErrorType.REC_STREAM_INACTIVE;
  }

  // ── Custom messages thrown by the recorder hook ──
  if (message.includes('no system audio') || message.includes('no audio') || message.includes('share tab audio') || message.includes('share system audio')) {
    return AppErrorType.SCREEN_NO_AUDIO;
  }
  if (message.includes('system audio access denied') || message.includes('screen sharing')) {
    return AppErrorType.SCREEN_PERMISSION_DENIED;
  }
  if (message.includes('microphone access denied') || message.includes('allow microphone')) {
    return AppErrorType.MIC_PERMISSION_DENIED;
  }
  if (message.includes('stream is not active') || message.includes('not active')) {
    return AppErrorType.REC_STREAM_INACTIVE;
  }

  return AppErrorType.UNKNOWN;
};

const parseErrorPayload = (value: string): string => {
  try {
    const parsed = JSON.parse(value);
    return parsed?.error?.message || parsed?.message || value;
  } catch (_) {
    return value;
  }
};

const stripHtml = (value: string): string =>
  value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const getRawErrorText = (err: any): string => {
  if (!err) return '';
  if (typeof err === 'string') return parseErrorPayload(err);
  if (typeof err?.message === 'string') return parseErrorPayload(err.message);
  if (typeof err?.error?.message === 'string') return parseErrorPayload(err.error.message);
  try {
    return JSON.stringify(err);
  } catch (_) {
    return '';
  }
};

export const mapProcessingErrorToAppError = (err: any): AppErrorType => {
  const raw = getRawErrorText(err).toLowerCase();

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return AppErrorType.NET_OFFLINE;
  }
  if (raw.includes('timeout') || raw.includes('timed out') || raw.includes('aborterror') || raw.includes('request cancelled')) {
    return AppErrorType.NET_TIMEOUT;
  }
  if (raw.includes('api key') || raw.includes('apikey') || raw.includes('permission denied') || raw.includes('unauthorized')) {
    return AppErrorType.API_KEY_MISSING;
  }
  if (raw.includes('rate limit') || raw.includes('quota') || raw.includes('429')) {
    return AppErrorType.API_RATE_LIMIT;
  }
  if (raw.includes('invalid ai response') || raw.includes('invalid response') || raw.includes('json')) {
    return AppErrorType.API_INVALID_RESPONSE;
  }

  return AppErrorType.NET_SERVER_ERROR;
};

export const getSafeProcessingErrorMessage = (err: any, fallbackType = AppErrorType.NET_SERVER_ERROR): string => {
  const raw = getRawErrorText(err);
  const lower = raw.toLowerCase();

  if (lower.includes('payloadtoolarge') || lower.includes('payload too large') || lower.includes('request entity too large') || lower.includes('413')) {
    return 'The recording is too large to process in one request. Keep the audio under 50 MB, or split very long sessions into smaller parts.';
  }
  if (lower.includes('larger than 50 mb')) {
    return 'Audio file is larger than 50 MB. Please trim or split the recording and try again.';
  }
  if (lower.includes('api key') || lower.includes('apikey')) {
    return getErrorMessage(AppErrorType.API_KEY_MISSING);
  }
  if (lower.includes('rate limit') || lower.includes('quota') || lower.includes('429')) {
    return getErrorMessage(AppErrorType.API_RATE_LIMIT);
  }
  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('request cancelled')) {
    return getErrorMessage(AppErrorType.NET_TIMEOUT);
  }
  if (/<html|<!doctype/i.test(raw)) {
    return getErrorMessage(fallbackType);
  }

  const cleaned = stripHtml(raw);
  return cleaned || getErrorMessage(fallbackType);
};
