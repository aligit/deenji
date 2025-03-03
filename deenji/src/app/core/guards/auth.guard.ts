// src/app/core/guards/auth.guard.ts
import { inject } from "@angular/core";
import { SupabaseService } from "../services/supabase.service";
import { Router } from "@angular/router";

export const authGuard = () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const session = supabase.session();
  if (!session) {
    router.navigate(["/login"]);
    return false;
  }
  return true;
};
