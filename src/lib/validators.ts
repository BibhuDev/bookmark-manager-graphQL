import { ValidationError } from './errors.js';

export function validateTitle(title: string | undefined | null): string {
  if (title === undefined || title === null) {
    throw new ValidationError('Title is required');
  }

  const trimmed = title.trim();
  if (trimmed.length === 0) {
    throw new ValidationError('Title cannot be empty or whitespace only');
  }

  return trimmed;
}

export function validateUrl(urlStr: string | undefined | null): string {
  if (!urlStr) {
    throw new ValidationError('URL is required');
  }

  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new ValidationError('URL protocol must be http: or https:');
    }
    return parsed.toString();
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('Invalid URL format');
  }
}