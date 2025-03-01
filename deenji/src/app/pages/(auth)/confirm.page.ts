// src/app/pages/auth/confirm.page.ts
import { Component, inject } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { SupabaseService } from "../../core/services/supabase.service";

@Component({
  standalone: true,
  template: `
    <div class="container mx-auto p-4">
      <p>Verifying magic link...</p>
    </div>
  `,
})
export default class AuthConfirmPageComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    this.handleMagicLink();
  }

  async handleMagicLink() {
    // Get the token hash from the URL fragment
    this.route.fragment.subscribe(async (fragment) => {
      if (fragment) {
        const params = new URLSearchParams(fragment);
        const tokenHash = params.get("access_token");
        if (tokenHash) {
          try {
            await this.supabase.verifyMagicLinkToken(tokenHash);
            // Redirect to profile page after successful verification
            this.router.navigate(["/profile"]);
          } catch (error) {
            console.error("Magic link verification failed:", error);
            this.router.navigate(["/login"], {
              queryParams: { error: "Invalid or expired link" },
            });
          }
        } else {
          console.error("No access token found in magic link");
          this.router.navigate(["/login"], {
            queryParams: { error: "Invalid link" },
          });
        }
      } else {
        this.router.navigate(["/login"]);
      }
    });
  }
}
