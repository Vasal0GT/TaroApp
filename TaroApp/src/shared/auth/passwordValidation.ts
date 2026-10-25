export type PasswordRuleId = "length" | "lowercase" | "uppercase" | "number";

export type PasswordRule = {
  id: PasswordRuleId;
  isMet: boolean;
};

export function getPasswordRules(password: string): PasswordRule[] {
  return [
    { id: "length", isMet: password.length >= 8 },
    { id: "lowercase", isMet: /[a-zа-яё]/u.test(password) },
    { id: "uppercase", isMet: /[A-ZА-ЯЁ]/u.test(password) },
    { id: "number", isMet: /\d/u.test(password) },
  ];
}

export function isPasswordValid(password: string) {
  return getPasswordRules(password).every((rule) => rule.isMet);
}

export function getPasswordRuleLabel(
  id: PasswordRuleId,
  language: "ru" | "en"
) {
  const labels = {
    ru: {
      length: "Не менее 8 символов",
      lowercase: "Одна строчная буква",
      uppercase: "Одна заглавная буква",
      number: "Одна цифра",
    },
    en: {
      length: "At least 8 characters",
      lowercase: "One lowercase letter",
      uppercase: "One uppercase letter",
      number: "One number",
    },
  } as const;

  return labels[language][id];
}
