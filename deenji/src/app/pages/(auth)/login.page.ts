import { Component, inject } from "@angular/core";
import { SupabaseService } from "../../core/services/supabase.service";
import { FormBuilder, FormsModule, ReactiveFormsModule } from "@angular/forms";

@Component({
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  template: `<br />
  <br />
  <br />
  <br />
  <br />
  <br />
  <br />
  <br />
  <br />
  <br />
  <br />
  <br />
  <div class="row flex-center flex">
    <div class="col-6 form-widget" aria-live="polite">
      <h1 class="header">Supabase + Angular</h1>
      <p class="description">Sign in via magic link with your email below</p>
      <form
        [formGroup]="signInForm"
        (ngSubmit)="onSubmit()"
        class="form-widget"
      >
        <div>
          <label for="email">Email</label>
          <input
            id="email"
            formControlName="email"
            class="inputField"
            type="email"
            placeholder="Your email"
          />
        </div>
        <div>
          <button type="submit" class="button block" [disabled]="loading">
            {{ loading ? "Loading" : "Send magic link" }}
          </button>
        </div>
      </form>
    </div>
  </div>`,
})
export default class LoginComponent {
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
