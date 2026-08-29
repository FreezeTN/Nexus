// Polyfills for modern JavaScript specifications used by libraries like pdfjs-dist
if (typeof window !== 'undefined') {
  if (!('toHex' in Uint8Array.prototype)) {
    (Uint8Array.prototype as any).toHex = function () {
      let result = '';
      for (let i = 0; i < this.length; i++) {
        result += this[i].toString(16).padStart(2, '0');
      }
      return result;
    };
  }

  if (!('toHex' in ArrayBuffer.prototype)) {
    (ArrayBuffer.prototype as any).toHex = function () {
      return (new Uint8Array(this) as any).toHex();
    };
  }

  if (!('withResolvers' in Promise)) {
    (Promise as any).withResolvers = function <T>() {
      let resolve!: (value: T | PromiseLike<T>) => void;
      let reject!: (reason?: any) => void;
      const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    };
  }
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { LanguageProvider } from './i18n/LanguageContext';
import { UiModeProvider } from './context/UiModeContext';
import { ModalProvider } from './context/ModalContext';
import { HotkeyProvider } from './context/HotkeyContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <UiModeProvider>
          <ModalProvider>
            <HotkeyProvider>
              <App />
            </HotkeyProvider>
          </ModalProvider>
        </UiModeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>,
);
