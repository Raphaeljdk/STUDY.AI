'use client';

import { signOut } from 'next-auth/react';

/**
 * Centralized fetch wrapper that automatically handles 401 errors
 * by signing out the user and dispatching a custom event so the UI
 * can show the auth modal.
 *
 * Usage:
 *   import { apiFetch } from '@/lib/api';
 *   const data = await apiFetch('/api/subjects');
 *   const res = await apiFetch('/api/subjects', { method: 'POST', body: ... });
 */

let isSigningOut = false;

function handle401() {
  if (isSigningOut) return;
  isSigningOut = true;

  // Dispatch event so any listener can react (e.g. show auth modal)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('session-expired'));
  }

  // Sign out without redirect — let the SessionProvider update
  signOut({ redirect: false }).finally(() => {
    isSigningOut = false;
  });
}

export interface ApiFetchOptions extends RequestInit {
  /** If true, don't throw on non-ok responses, just return the raw Response */
  raw?: boolean;
  /** Skip the 401 auto-logout */
  skipAuthCheck?: boolean;
}

export async function apiFetch<T = any>(
  url: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { raw, skipAuthCheck, ...fetchOptions } = options;

  const res = await fetch(url, {
    ...fetchOptions,
    headers: {
      ...(fetchOptions.headers || {}),
      ...(fetchOptions.body && !(fetchOptions.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
    },
  });

  if (raw) return res as unknown as T;

  // Handle 401 — session expired / user not found
  if (res.status === 401 && !skipAuthCheck) {
    handle401();
    throw new ApiError('Sessao expirada. Faca login novamente.', 401, 'SESSION_EXPIRED');
  }

  // Parse JSON
  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new ApiError('Erro ao processar resposta do servidor', res.status, 'PARSE_ERROR');
  }

  if (!res.ok) {
    throw new ApiError(data?.error || 'Erro desconhecido', res.status, data?.code);
  }

  return data as T;
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = 'UNKNOWN') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

  get isSessionExpired() {
    return this.code === 'SESSION_EXPIRED' || this.code === 'USER_NOT_FOUND' || this.status === 401;
  }
}

/**
 * Hook-friendly: listen for session-expired events.
 * Call this in a top-level component to open the auth modal when session expires.
 */
export function onSessionExpired(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener('session-expired', handler);
  return () => window.removeEventListener('session-expired', handler);
}
