export const sanitizer = {
  sanitizeHtml: (html: string): string => {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
  },

  sanitizeInput: (input: string): string => {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  },

  sanitizeEmail: (email: string): string => {
    if (typeof email !== 'string') return '';
    
    return email
      .toLowerCase()
      .trim()
      .replace(/[^\w@.-]/g, '');
  },

  sanitizePhone: (phone: string): string => {
    if (typeof phone !== 'string') return '';
    
    return phone
      .trim()
      .replace(/[^\d+\s()-]/g, '');
  },

  sanitizeUrl: (url: string): string => {
    if (typeof url !== 'string') return '';
    
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return '';
      }
      return parsed.toString();
    } catch {
      return '';
    }
  },

  sanitizeFileName: (filename: string): string => {
    if (typeof filename !== 'string') return '';
    
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.{2,}/g, '.')
      .substring(0, 255);
  },

  escapeRegex: (str: string): string => {
    if (typeof str !== 'string') return '';
    
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },
};

