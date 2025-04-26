export const checkBrowserCompatibility = () => {
    const issues = [];
    
    // Check cookie support
    try {
      document.cookie = 'testCookie=1; SameSite=None; Secure';
      if (document.cookie.indexOf('testCookie') === -1) {
        issues.push('Third-party cookies appear to be blocked');
      }
      document.cookie = 'testCookie=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } catch (e) {
      issues.push('Cookie access is restricted');
    }
    
    // Check localStorage support
    try {
      localStorage.setItem('test', '1');
      localStorage.removeItem('test');
    } catch (e) {
      issues.push('Local storage is not available');
    }
    
    return issues;
  };