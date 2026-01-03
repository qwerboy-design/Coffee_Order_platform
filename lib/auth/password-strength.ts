/**
 * 計算密碼強度（純客戶端函數，不依賴服務器端 API）
 * @param password 密碼
 * @returns 密碼強度等級
 */
export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  const hasLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*#?&]/.test(password);
  
  const score = [hasLength, hasLetter, hasNumber, hasSpecial].filter(Boolean).length;
  
  if (score <= 2) return 'weak';
  if (score === 3) return 'medium';
  return 'strong';
}


