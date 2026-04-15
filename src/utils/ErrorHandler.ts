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
  
  // Recording Errors
  REC_NO_SPEECH = 'REC_NO_SPEECH',
  REC_TOO_SHORT = 'REC_TOO_SHORT',
  REC_SILENT = 'REC_SILENT',
  REC_DEVICE_ERROR = 'REC_DEVICE_ERROR',
  
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
      return 'Microphone access denied. Please allow microphone access in your browser settings and refresh.';
    case AppErrorType.MIC_NOT_FOUND:
      return 'No microphone detected. Please ensure your microphone is plugged in and recognized by your system.';
    case AppErrorType.MIC_IN_USE:
      return 'Microphone is currently in use by another application. Please close other apps and try again.';
    case AppErrorType.MIC_SECURITY_ERROR:
      return 'Microphone access blocked by security policy. Ensure you are using a secure (HTTPS) connection.';
    case AppErrorType.REC_NO_SPEECH:
      return 'No clear speech was detected in the recording. Please speak clearly into the microphone.';
    case AppErrorType.REC_TOO_SHORT:
      return 'The recording was too short. Please record for at least a few seconds.';
    case AppErrorType.REC_SILENT:
      return 'The recording is silent. Please check your microphone volume and settings.';
    case AppErrorType.REC_DEVICE_ERROR:
      return 'A recording device error occurred. Please check your hardware and try again.';
    case AppErrorType.NET_OFFLINE:
      return 'No internet connection. Please check your network and try again.';
    case AppErrorType.NET_TIMEOUT:
      return 'The request timed out. Please try again with a shorter recording.';
    case AppErrorType.NET_SERVER_ERROR:
      return 'Server error occurred while processing. Please try again later.';
    case AppErrorType.API_KEY_MISSING:
      return 'AI API key is missing. Please check your environment configuration.';
    case AppErrorType.API_RATE_LIMIT:
      return 'API rate limit exceeded. Please wait a moment before trying again.';
    case AppErrorType.API_INVALID_RESPONSE:
      return 'Received an invalid response from the AI. Please try recording again.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

export const mapBrowserErrorToAppError = (err: any): AppErrorType => {
  if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') return AppErrorType.MIC_PERMISSION_DENIED;
  if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') return AppErrorType.MIC_NOT_FOUND;
  if (err.name === 'NotReadableError' || err.name === 'TrackStartError') return AppErrorType.MIC_IN_USE;
  if (err.name === 'SecurityError') return AppErrorType.MIC_SECURITY_ERROR;
  return AppErrorType.UNKNOWN;
};
