import axios from 'axios';
import { getApiBaseUrl } from './serverUrl';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  event: string;
  message: string;
  details?: any;
}

type LogListener = (entry: LogEntry) => void;
const listeners: Set<LogListener> = new Set();
const logHistory: LogEntry[] = [];

export const addLogListener = (listener: LogListener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getLogHistory = () => [...logHistory];

const emitLog = (entry: LogEntry) => {
  logHistory.unshift(entry);
  if (logHistory.length > 200) logHistory.pop();
  listeners.forEach((l) => l(entry));
};

const sendRemoteLog = async (entry: LogEntry) => {
  try {
    await axios.post(
      `${getApiBaseUrl()}/client-logs`,
      {
        event: entry.event,
        level: entry.level,
        message: entry.message,
        details: entry.details,
        timestamp: entry.timestamp,
      },
      {
        timeout: 3000,
        headers: { 'Bypass-Tunnel-Reminder': 'true' },
      }
    );
  } catch (err) {
    // Fail silently to avoid infinite error loops
  }
};

const createLogger = (level: LogEntry['level']) => {
  return (event: string, message: string, details?: any) => {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      level,
      event,
      message,
      details,
    };

    const consolePrefix = `[CLIENT LOG] [${entry.level}] [${entry.event}]`;
    if (level === 'ERROR') {
      console.error(consolePrefix, message, details || '');
    } else if (level === 'WARN') {
      console.warn(consolePrefix, message, details || '');
    } else {
      console.log(consolePrefix, message, details || '');
    }

    emitLog(entry);
    sendRemoteLog(entry);
  };
};

export const logger = {
  info: createLogger('INFO'),
  warn: createLogger('WARN'),
  error: createLogger('ERROR'),
  debug: createLogger('DEBUG'),
};
