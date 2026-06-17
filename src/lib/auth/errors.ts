export function getAuthErrorMessage(message?: string) {
  const normalized = message?.toLowerCase() ?? "";

  if (normalized.includes("invalid login credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않아요.";
  }

  if (
    normalized.includes("user already registered") ||
    normalized.includes("already registered") ||
    normalized.includes("already been registered")
  ) {
    return "이미 가입된 이메일이에요.";
  }

  if (
    normalized.includes("password should be at least") ||
    normalized.includes("password")
  ) {
    return "비밀번호는 6자 이상 입력해주세요.";
  }

  if (normalized.includes("email")) {
    return "이메일 주소를 다시 확인해주세요.";
  }

  return "잠시 후 다시 시도해주세요.";
}
