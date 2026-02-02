/// <reference types="vite/client" />

import { createClient } from '@supabase/supabase-js';

// Load from environment variables first, fallback to defaults
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL || 'https://gzggzukbohckdsemlduq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Z2d6dWtib2hja2RzZW1sZHVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjE2MDYsImV4cCI6MjA4NTU5NzYwNn0.Le28zXebjSQAjdHopDwb6UZYh8fo-RnPgVF8VHFN5sw';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    global: {
      headers: {
        'X-Client-Info': 'eras-timecapsule-app',
        'User-Agent': typeof navigator !== 'undefined' ? navigator.userAgent : ''
      },
      fetch: async (url, options = {}) => {
        // Enhanced fetch with retry logic and better error handling
        const maxRetries = 3; // Increased from 2 to 3
        
        // 🎯 TIMEOUT FIX: Detect large file uploads and use extended timeouts
        // Check if this is a storage upload by examining the URL and body
        const urlString = typeof url === 'string' ? url : url.toString();
        const isStorageUpload = urlString.includes('/storage/v1/object/');
      const isLargeUpload = options.body instanceof File 
        ? options.body.size > 50 * 1024 * 1024 // >50MB
        : options.body instanceof FormData
        ? true // Assume FormData might contain large files
        : false;
      
      // 🔥 EXTENDED TIMEOUTS for large files (223MB+ videos need time!)
      // Small files: 15s base timeout
      // Large files: 5 minutes base timeout (300s) - enough for 223MB on slow connections
      const baseTimeout = (isStorageUpload && isLargeUpload) ? 300000 : 15000;
      
      console.log(`📡 Supabase request: ${isStorageUpload ? 'STORAGE' : 'API'} ${isLargeUpload ? '(LARGE FILE)' : ''}`);
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          // Exponential timeout increase for retries
          const timeout = baseTimeout * Math.pow(1.5, attempt);
          
          // Log attempts for debugging (except first attempt to reduce noise)
          if (attempt > 0) {
            console.log(`🔄 Supabase request retry ${attempt}/${maxRetries} (timeout: ${(timeout/1000).toFixed(0)}s)${isLargeUpload ? ' [LARGE FILE]' : ''}`);
          }
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);
          
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          return response;
          
        } catch (error) {
          // Clear any pending timeouts
          const isLastAttempt = attempt === maxRetries;
          const err = error as Error & { name?: string };
          
          // Log different error types
          if (err.name === 'AbortError') {
            console.warn(`⏱️ Supabase request timeout (attempt ${attempt + 1}/${maxRetries + 1})${isLargeUpload ? ' [LARGE FILE - Consider compressing before upload]' : ''}`);
            
            if (isLastAttempt) {
              throw new Error('Request timeout - please check your internet connection');
            }
          } else if (err.message?.includes('fetch')) {
            console.warn(`🌐 Network error (attempt ${attempt + 1}/${maxRetries + 1}):`, err.message);
            
            if (isLastAttempt) {
              throw new Error('Network error - please check your internet connection');
            }
          } else {
            console.error('🚨 Supabase fetch error:', error);
            throw error; // Don't retry unknown errors
          }
          
          // Wait before retry with exponential backoff
          if (!isLastAttempt) {
            const backoffDelay = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s...
            console.log(`⏳ Waiting ${backoffDelay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
          }
        }
      }
      
      // Should never reach here, but TypeScript needs it
      throw new Error('Max retries exceeded');
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

// Types for our database
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  provider?: string;
  created_at: string;
  updated_at: string;
}

export interface TimeCapsule {
  id: string;
  user_id: string;
  title: string;
  text_message?: string;
  delivery_date: string;
  delivery_time: string;
  delivery_type?: 'immediate' | 'custom_time' | 'custom_minutes' | 'custom_hours' | 'custom_days';
  custom_hour?: string;
  custom_minute?: string;
  custom_period?: string;
  custom_minutes?: string;
  custom_hours?: string;
  custom_days?: string;
  time_zone?: string; // User's timezone when capsule was created
  recipient_type: 'self' | 'other';
  delivery_method?: 'email' | 'phone';
  recipient_email?: string;
  recipient_phone?: string;
  status: 'scheduled' | 'delivered' | 'failed';
  media_files?: string[];
  created_at: string;
  updated_at: string;
  delivered_at?: string; // When the capsule was actually delivered
  frontend_url?: string; // Frontend URL for generating viewing links in emails
}

export interface MediaFile {
  id: string;
  capsule_id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  duration?: number; // Duration in seconds for video/audio files
  storage_path?: string; // Optional for security
  storage_bucket?: string;
  url?: string; // Signed URL when fetched
  created_at: string;
}