// Login failure codes shared by the login API route and the login form, so the
// same wording shows whether the form submitted via fetch or as a plain POST.
export const LOGIN_ERRORS = {
  missing_fields: "Enter your email and password.",
  invalid_credentials: "Incorrect email or password. Please try again.",
  server_error: "We couldn't sign you in right now. Please try again in a moment.",
} as const;

export type LoginErrorCode = keyof typeof LOGIN_ERRORS;

export function loginErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null;
  return (LOGIN_ERRORS as Record<string, string>)[code] ?? LOGIN_ERRORS.server_error;
}
