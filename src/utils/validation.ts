/** Practical email syntax check; Firebase remains the final authority. */
export const isValidEmail = (email: string): boolean => {
  if (email.length > 254) return false;

  const [localPart, domain, ...extra] = email.split('@');
  if (extra.length > 0 || !localPart || localPart.length > 64 || !domain) return false;
  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..'))
    return false;

  const labels = domain.split('.');
  if (labels.length < 2) return false;
  if (labels.some(label => !label || label.length > 63)) return false;
  if (labels.some(label => !/^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(label))) return false;
  return /^[a-z]{2,}$/i.test(labels[labels.length - 1]);
};
