const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  if (!email?.trim()) {
    return 'Email is required';
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return 'Invalid email format';
  }

  return null;
}

export function validatePassword(password) {
  if (!password) {
    return 'Password is required';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }

  return null;
}

export function validateName(name) {
  if (!name?.trim()) {
    return 'Name is required';
  }

  return null;
}
