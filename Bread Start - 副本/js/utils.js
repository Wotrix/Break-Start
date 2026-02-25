// Utility functions

/**
 * System Bridge - Encapsulates system-level operations
 * In a real Electron app, this would use ipcRenderer
 */
export const System = {
    platform: 'web', // 'web', 'mac', 'windows'

    openUrl(url) {
        window.open(url, '_blank');
    },

    minimizeWindow() {
        if (window.electronAPI) {
            window.electronAPI.minimize();
        } else {
            console.log('System.minimizeWindow called (Web Mock)');
        }
    },

    closeWindow() {
        if (window.electronAPI) {
            window.electronAPI.close();
        } else {
            console.log('System.closeWindow called (Web Mock)');
        }
    },
    
    copyToClipboard(text) {
        return navigator.clipboard.writeText(text);
    }
};

export function getRandomColor() { 
    const l = '0123456789ABCDEF'; 
    let c = '#'; 
    for (let i = 0; i < 6; i++) c += l[Math.floor(Math.random() * 16)]; 
    return c; 
}

export function generateRandomGradient() { 
    const a = Math.floor(Math.random() * 360); 
    return `linear-gradient(${a}deg, ${getRandomColor()}, ${getRandomColor()})`; 
}

export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function darkenColor(color, percent) {
    if (!color || typeof color !== 'string') {
        color = '#7c3aed';
    }
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}
