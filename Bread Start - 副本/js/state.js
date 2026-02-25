import { CONFIG, defaultCategories } from './config.js';
import { generateRandomGradient } from './utils.js';

// Application State
export const state = {
    appData: {
        activeEngineIndex: 0,
        bgUrl: "",
        categories: [],
        config: {
            minimalist: false,
            showClock: true,
            showDate: true,
            focusLevel: 50,
            accentColor: '#7c3aed',
            fontSize: 16,
            searchBoxStyle: 'rounded',
            showSearchSuggestions: true,
            customQuote: ''
        },
        styleConfig: { iconSize: 48, iconRadius: 16, gridGap: 24, containerWidth: 800 }
    },
    allEngines: [],
    suggestTimer: null
};

export function loadData() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (saved) {
        try {
            state.appData = JSON.parse(saved);
            // Ensure data integrity
            if (!Array.isArray(state.appData.categories)) {
                state.appData.categories = JSON.parse(JSON.stringify(defaultCategories));
            }

            // Default config if missing
            if (!state.appData.config) {
                state.appData.config = {
                    minimalist: false,
                    showClock: true,
                    showDate: true,
                    focusLevel: 50,
                    accentColor: '#7c3aed',
                    fontSize: 16,
                    searchBoxStyle: 'rounded',
                    showSearchSuggestions: true,
                    customQuote: ''
                };
            }

            // Default style config if missing
            if (!state.appData.styleConfig) {
                state.appData.styleConfig = { iconSize: 48, iconRadius: 16, gridGap: 24, containerWidth: 800 };
            }
        } catch (e) {
            console.error("Failed to load data", e);
            resetToDefaults();
        }
    } else {
        resetToDefaults();
    }

    if (!state.appData.bgUrl) {
        state.appData.bgUrl = generateRandomGradient();
        saveData();
    }
}

function resetToDefaults() {
    state.appData = {
        activeEngineIndex: 0,
        categories: JSON.parse(JSON.stringify(defaultCategories)),
        bgUrl: "",
        config: {
            minimalist: false,
            showClock: true,
            showDate: true,
            focusLevel: 50,
            accentColor: '#7c3aed',
            fontSize: 16,
            searchBoxStyle: 'rounded',
            showSearchSuggestions: true,
            customQuote: ''
        },
        styleConfig: { iconSize: 48, iconRadius: 16, gridGap: 24, containerWidth: 800 }
    };
}

export function saveData() {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state.appData));
}

export function refreshAllEngines() {
    state.allEngines = [];
    state.appData.categories.forEach(cat => {
        state.allEngines.push(...cat.engines);
    });

    // Ensure active index is valid
    if (state.appData.activeEngineIndex >= state.allEngines.length) {
        state.appData.activeEngineIndex = 0;
        saveData();
    }
}
