// E-mail addresses identify one account whatever their letter case: store and look up only this form.
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
