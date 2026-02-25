import { loadData, refreshAllEngines } from './state.js';
import {
    applyStyleConfig, updateClock, applyBackground, applyConfig,
    updateCurrentEngineIcon
} from './ui.js';
import { setupSearchInteractions, doSearch, toggleEngineDashboard, clearSearch } from './search.js';
import { icons } from './config.js';

// Attach functions to window for HTML event handlers
const globalFuncs = {
    toggleEngineDashboard,
    doSearch,
    clearSearch
};

Object.assign(window, globalFuncs);

// Initialize Application
function startApp() {
    loadData();
    refreshAllEngines();
    applyStyleConfig();
    updateClock();
    applyBackground();
    applyConfig();
    setInterval(updateClock, 1000);
    setupSearchInteractions();

    const searchIcon = document.getElementById('search-trigger-icon');
    if (searchIcon) searchIcon.src = icons.search_icon;

    updateCurrentEngineIcon();
}

document.addEventListener('DOMContentLoaded', startApp);
