import { Component, inject } from "@angular/core";
import { SupabaseService } from "../../core/services/supabase.service";
import { FormBuilder } from "@angular/forms";

@Component({
  standalone: true,
  template: `<p>sign up</p>`,
})
export default class SignupComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly formBuilder = inject(FormBuilder);

  loading = false;

  signInForm = this.formBuilder.group({
    email: "",
  });

  async onSubmit(): Promise<void> {
    try {
      this.loading = true;
      const email = this.signInForm.value.email as string;
      const { error } = await this.supabase.signIn(email);
      if (error) throw error;
      alert("Check your email for the login link!");
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      this.signInForm.reset();
      this.loading = false;
    }
  }
}
