import { inject } from '@angular/core';
import { SupabaseService } from '../services/supabase.service';
import { Router } from '@angular/router';

export const authGuard = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  // Wait for session to be loaded
  await new Promise<void>((resolve) => {
    const checkSession = setInterval(() => {
      if (supabase.session !== null) {
        clearInterval(checkSession);
        resolve();
      }
    }, 100);
  });

  if (!supabase.session) {
    await router.navigate(['/login']);
    return false;
  }
  return true;
};
