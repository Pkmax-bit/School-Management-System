export type NormalizedRole = 'admin' | 'teacher' | 'student' | '';

export function normalizeRole(role: unknown): NormalizedRole {
  if (typeof role !== 'string') return '';
  const r = role.toLowerCase().trim();
  if (r === 'admin' || r === 'teacher' || r === 'student') return r;
  return '';
}

export function getRedirectPathByRole(role: unknown): string {
  const r = normalizeRole(role);
  console.log('getRedirectPathByRole - Input role:', role, 'Normalized:', r);
  if (r === 'admin') {
    console.log('getRedirectPathByRole - Redirecting to admin dashboard');
    return '/admin/dashboard';
  }
  if (r === 'teacher') {
    console.log('getRedirectPathByRole - Redirecting to teacher dashboard');
    return '/teacher/dashboard';
  }
  if (r === 'student') {
    console.log('getRedirectPathByRole - Redirecting to student dashboard');
    return '/student/dashboard';
  }
  console.log('getRedirectPathByRole - Unknown role, redirecting to general dashboard');
  return '/dashboard';
}

// Map backend user to frontend shape with normalized name and role
export function normalizeUser<T extends Record<string, any>>(userData: T) {
  const fullName = userData?.full_name ?? userData?.name ?? '';
  const role = normalizeRole(userData?.role);
  console.log('normalizeUser - Input userData:', userData);
  console.log('normalizeUser - fullName:', fullName, 'role:', role);
  const result = {
    ...userData,
    name: fullName,
    role,
  } as T & { name: string; role: NormalizedRole };
  console.log('normalizeUser - Result:', result);
  return result;
}


