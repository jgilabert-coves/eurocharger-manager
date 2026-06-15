// Genera una contraseña segura de 12 caracteres con al menos una minúscula,
// una mayúscula, un dígito y un carácter especial.
export function generatePassword(): string {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const special = '!@#$%&*';
  const all = lower + upper + digits + special;
  const rand = (s: string) => s[Math.floor(Math.random() * s.length)];
  const chars = [rand(lower), rand(upper), rand(digits), rand(special)];
  for (let i = 0; i < 8; i++) chars.push(rand(all));
  return chars.sort(() => Math.random() - 0.5).join('');
}
