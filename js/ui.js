import { state, saveData, refreshAllEngines } from './state.js';
import { icons } from './config.js';
import { toggleEngineDashboard } from './search.js';

export function applyStyleConfig() {
    const r = document.documentElement.style;
    const sc = state.appData.styleConfig;
    if (sc) {
        r.setProperty('--icon-size', sc.iconSize + 'px');
        r.setProperty('--icon-radius', sc.iconRadius + 'px');
        r.setProperty('--grid-gap', sc.gridGap + 'px');
        r.setProperty('--container-width', sc.containerWidth + 'px');
    }
}

export function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    const clockEl = document.getElementById('clock');
    const dateEl = document.getElementById('date');
    if (clockEl) clockEl.textContent = time;
    if (dateEl) dateEl.textContent = date;
}

export function applyBackground() { 
    const bg = state.appData.bgUrl; 
    if (!bg) return; 
    if (bg.startsWith('http') || bg.startsWith('data:image')) {
        document.body.style.backgroundImage = `url('${bg}')`;
    } else {
        document.body.style.backgroundImage = bg; 
    }
}

export function applyConfig() {
    const b = document.body.classList;
    const conf = state.appData.config;
    
    if (conf.minimalist) { 
        b.add('minimalist'); 
    } else { 
        b.remove('minimalist'); 
    }
    
    const clockEl = document.getElementById('clock');
    const dateEl = document.getElementById('date');
    if(clockEl) clockEl.style.display = conf.showClock ? 'block' : 'none';
    if(dateEl) dateEl.style.display = conf.showDate ? 'block' : 'none';

    const root = document.documentElement.style;
    const level = conf.focusLevel || 50;
    const overlayOp = (level / 100) * 0.9; 
    const contentOp = 1 - (level / 100);
    const blurAmt = (level / 100) * 10;

    root.setProperty('--focus-overlay', `rgba(0,0,0,${overlayOp})`);
    root.setProperty('--focus-content-op', contentOp);
    root.setProperty('--focus-blur', blurAmt + 'px');
}

export function updateCurrentEngineIcon() {
    const icon = document.getElementById('current-engine-icon');
    if (state.appData.activeEngineIndex >= 0 && state.appData.activeEngineIndex < state.allEngines.length) {
        const engine = state.allEngines[state.appData.activeEngineIndex];
        icon.innerHTML = getEngineIconHtml(engine);
    }
}

export function getEngineIconHtml(engine) {
    if (engine.iconType === 'image' || engine.iconType === 'url') {
        if (engine.iconValue) return `<img class="engine-img-display" src="${engine.iconValue}" alt="${engine.name}">`;
    }
    const name = engine.name;
    const iconUrl = icons[name] || icons[name.toLowerCase()] || icons[name.toUpperCase()] || icons.default;
    return `<img class="engine-svg" src="${iconUrl}" alt="${engine.name}">`;
}

export function renderEngineDashboard() {
    const content = document.getElementById('dashboard-content');
    if (!content) return;
    content.innerHTML = '';
    
    state.appData.categories.forEach(cat => {
        const section = document.createElement('div');
        section.className = 'category-section';
        section.innerHTML = `<div class="category-title">${cat.title}</div><div class="engine-grid-display"></div>`;
        const grid = section.querySelector('.engine-grid-display');
        
        cat.engines.forEach((engine) => {
            const engineIndex = state.allEngines.findIndex(e => e.name === engine.name && e.url === engine.url);
            const card = document.createElement('div');
            const isActive = engineIndex === state.appData.activeEngineIndex;
            card.className = `engine-card ${isActive ? 'active' : ''}`;
            card.innerHTML = `<div class="engine-card-icon">${getEngineIconHtml(engine)}</div><div class="engine-card-name">${engine.name}</div>`;
            
            card.onclick = () => {
                state.appData.activeEngineIndex = engineIndex;
                saveData();
                updateCurrentEngineIcon();
                renderEngineDashboard();
                toggleEngineDashboard();
            };
            grid.appendChild(card);
        });
        content.appendChild(section);
    });
}
