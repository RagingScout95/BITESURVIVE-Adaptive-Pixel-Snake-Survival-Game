// Debug utility for conditional logging
export class Debug {
    static isEnabled() {
        // Check URL parameter for debug mode
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('debug') === 'true') {
            localStorage.setItem('debugMode', 'true');
            return true;
        }
        
        // Check localStorage for debug mode
        return localStorage.getItem('debugMode') === 'true';
    }

    static log(...args) {
        if (this.isEnabled()) {
            console.log(...args);
        }
    }

    static error(...args) {
        // Always show errors, but prefix with [DEBUG] if in debug mode
        if (this.isEnabled()) {
            console.error('[DEBUG]', ...args);
        } else {
            console.error(...args);
        }
    }

    static warn(...args) {
        if (this.isEnabled()) {
            console.warn(...args);
        }
    }
}

