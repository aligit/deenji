// src/app/pages/auth/confirm.page.ts
import { Component, inject } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { SupabaseService } from "../../core/services/supabase.service";
import { CommonModule, NgIf } from "@angular/common";

@Component({
  standalone: true,
  imports: [CommonModule, NgIf],
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
    console.log(`suck my dick confirm`);
    this.handleMagicLink();
  }

  async handleMagicLink() {
    this.route.fragment.subscribe(async (fragment) => {
      if (fragment) {
        const params = new URLSearchParams(fragment);
        const accessToken = params.get("access_token");
        const error = params.get("error_description");

        if (error) {
          console.error("Magic link error:", error);
          this.router.navigate(["/login"], { queryParams: { error } });
          return;
        }

        if (accessToken) {
          // Token is already verified by Supabase server; session should be set
          const session = this.supabase.session();
          if (session) {
            console.log("Session established:", session);
            this.router.navigate(["/profile"]);
          } else {
            console.error("No session after magic link redirect");
            this.router.navigate(["/login"], {
              queryParams: { error: "Session not established" },
            });
          }
        } else {
          console.error("No access token in magic link");
          this.router.navigate(["/login"], {
            queryParams: { error: "Invalid link" },
          });
        }
      } else {
        console.error("No fragment in URL");
        this.router.navigate(["/login"]);
      }
    });
  }
}
