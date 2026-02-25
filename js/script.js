// ========== 常量配置 ==========
const CONFIG = {
    MAX_FILE_SIZE: 3 * 1024 * 1024,      // 最大文件大小 3MB
    DEBOUNCE_DELAY: 200,                  // 搜索防抖延迟
    ANIMATION_DURATION: 300,              // 动画持续时间
    DEFAULT_ICON_SIZE: 60,                // 默认图标大小
    STORAGE_KEY: 'prism_start_data'       // localStorage 键名
};

const SVG_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">`;
const icons = { search_icon: 'assets/icons_search/search_Search.svg', default: 'assets/icons_search/default_Search.svg', "必应": "assets/icons_search/bing_Search.svg", "百度": "assets/icons_search/baidu_Search.svg", "谷歌": "assets/icons_search/google_Search.svg", "bilibili": "assets/icons_search/bilibili_Search.svg" };

const defaultCategories = [{ title: "网页", engines: [{ name: "必应", url: "https://www.bing.com/search?q=", iconType: 'svg' }, { name: "百度", url: "https://www.baidu.com/s?wd=", iconType: 'svg' }, { name: "谷歌", url: "https://www.google.com/search?q=", iconType: 'svg' }] }, { title: "视频", engines: [{ name: "Bilibili", url: "https://search.bilibili.com/all?keyword=", iconType: 'svg' }] }];
const defaultSites = [{ name: "哔哩哔哩", url: "https://www.bilibili.com" }, { name: "GitHub", url: "https://github.com" }, { name: "知乎", url: "https://www.zhihu.com" }];
const defaultBg = "https://bing.biturl.top/?resolution=1920&format=image&index=0&mkt=zh-CN";

let appData = {
    sites: [], activeEngineIndex: 0, bgUrl: "", categories: [],
    config: {
        minimalist: false,
        showClock: true,
        showDate: true,
        focusLevel: 50,
        accentColor: '#7c3aed',
        fontSize: 16,
        searchBoxStyle: 'rounded', // rounded, square, pill
        showSearchSuggestions: true,
        customQuote: ''
    },
    styleConfig: { iconSize: 60, iconRadius: 20, gridGap: 28, containerWidth: 900 }
};
let allEngines = [], tempBase64 = "", isEditing = false, dialogResolver = null, suggestTimer = null;

function init() {
    loadData();
    refreshAllEngines();
    applyStyleConfig();

    updateClock();
    applyBackground();
    applyConfig();
    initSortableCategories();
    setInterval(updateClock, 1000);
    setupSearchInteractions();
    // setupContextMenu(); // 已禁用右键菜单
    enableRealTimePreview(); // 启用实时预览功能
    document.getElementById('search-trigger-icon').src = icons.search_icon;
    updateCurrentEngineIcon();
    renderCategorySelect(); // 渲染分类选择器
}

function loadData() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (saved) {
        appData = JSON.parse(saved);
        if (!Array.isArray(appData.categories)) appData.categories = JSON.parse(JSON.stringify(defaultCategories));
        if (!appData.config) appData.config = {
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
        if (!appData.styleConfig) appData.styleConfig = { iconSize: 60, iconRadius: 20, gridGap: 28, containerWidth: 900 };
    } else {
        appData = {
            sites: [...defaultSites],
            activeEngineIndex: 0,
            categories: JSON.parse(JSON.stringify(defaultCategories)),
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
            styleConfig: { iconSize: 60, iconRadius: 20, gridGap: 28, containerWidth: 900 }
        };
    }
    if (!appData.bgUrl) { appData.bgUrl = generateRandomGradient(); saveData(); }

    // 安全访问DOM元素，添加存在性检查
    const focusLevelRange = document.getElementById('focus-level-range');
    if (focusLevelRange) {
        focusLevelRange.value = appData.config.focusLevel;
    }

    const minimalistCheck = document.getElementById('minimalist-check');
    if (minimalistCheck) {
        minimalistCheck.checked = appData.config.minimalist;
    }

    const sc = appData.styleConfig;
    const iconSizeInput = document.querySelector('input[oninput*="iconSize"]');
    if (iconSizeInput) {
        iconSizeInput.value = sc.iconSize;
    }

    const iconRadiusInput = document.querySelector('input[oninput*="iconRadius"]');
    if (iconRadiusInput) {
        iconRadiusInput.value = sc.iconRadius;
    }

    const gridGapInput = document.querySelector('input[oninput*="gridGap"]');
    if (gridGapInput) {
        gridGapInput.value = sc.gridGap;
    }

    const zenBtn = document.getElementById('zen-btn');
    if (zenBtn) {
        if (appData.config.minimalist) zenBtn.classList.add('active'); else zenBtn.classList.remove('active');
    }

    // 直接设置时钟和日期的显示状态（确保优先执行）
    const clockElement = document.getElementById('clock');
    const dateElement = document.getElementById('date');
    if (clockElement) {
        clockElement.style.display = appData.config.showClock ? 'block' : 'none';
    }
    if (dateElement) {
        dateElement.style.display = appData.config.showDate ? 'block' : 'none';
        // 立即更新日期内容
        const now = new Date();
        const date = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
        dateElement.textContent = date;
    }

    // 其他设置项添加安全检查
    try {
        // 应用强调色
        updateAccentColor(appData.config.accentColor);

        // 应用字体大小
        document.documentElement.style.fontSize = appData.config.fontSize + 'px';

        const fontSizeRange = document.getElementById('font-size-range');
        if (fontSizeRange) {
            fontSizeRange.value = appData.config.fontSize;
            const fontSizeValue = document.getElementById('font-size-value');
            if (fontSizeValue) {
                fontSizeValue.textContent = appData.config.fontSize + 'px';
            }
        }

        // 应用搜索框样式
        applySearchBoxStyle(appData.config.searchBoxStyle);

        // 其他设置项的安全访问
        const showSuggestionsCheck = document.getElementById('show-suggestions-check');
        if (showSuggestionsCheck) {
            showSuggestionsCheck.checked = appData.config.showSearchSuggestions;
        }

        const customQuote = document.getElementById('custom-quote');
        if (customQuote) {
            customQuote.value = appData.config.customQuote || '';
        }

        // 尝试更新壁纸预览，如果函数存在且元素可用
        if (typeof updateWallpaperPreview === 'function') {
            try {
                updateWallpaperPreview();
            } catch (e) {
                // 如果更新壁纸预览失败，不影响其他功能
            }
        }

        // 添加字体大小滑块的实时更新
        const fontSizeRangeSlider = document.getElementById('font-size-range');
        if (fontSizeRangeSlider) {
            fontSizeRangeSlider.oninput = function () {
                if (typeof updateFontSize === 'function') {
                    updateFontSize(this.value);
                }
                const fontSizeValueElement = document.getElementById('font-size-value');
                if (fontSizeValueElement) {
                    fontSizeValueElement.textContent = this.value + 'px';
                }
            };
        }

    } catch (e) {
        console.error('设置应用过程中出现错误:', e);
        // 继续执行，不影响核心功能
    }
}

function saveData() { localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appData)); }

function applyStyleConfig() {
    const r = document.documentElement.style;
    const sc = appData.styleConfig;
    r.setProperty('--icon-size', sc.iconSize + 'px');
    r.setProperty('--icon-radius', sc.iconRadius + 'px');
    r.setProperty('--grid-gap', sc.gridGap + 'px');
    r.setProperty('--container-width', sc.containerWidth + 'px');
}

function updateStyleConfig(key, value) {
    appData.styleConfig[key] = parseInt(value);
    applyStyleConfig();
    saveData();

    // 更新显示值
    const valueEl = document.getElementById(key.replace(/([A-Z])/g, '-$1').toLowerCase() + '-value');
    if (valueEl) valueEl.textContent = value + 'px';
}

function applyConfig() {
    const b = document.body.classList;
    const zenBtn = document.getElementById('zen-btn');

    // 极简模式
    if (appData.config.minimalist) {
        b.add('minimalist');
        if (zenBtn) zenBtn.classList.add('active');
    } else {
        b.remove('minimalist');
        if (zenBtn) zenBtn.classList.remove('active');
    }

    // 同步复选框状态
    const minimalistCheck = document.getElementById('minimalist-check');
    if (minimalistCheck) minimalistCheck.checked = appData.config.minimalist;

    const showClockCheck = document.getElementById('show-clock-check');
    if (showClockCheck) showClockCheck.checked = appData.config.showClock;

    const showDateCheck = document.getElementById('show-date-check');
    if (showDateCheck) showDateCheck.checked = appData.config.showDate;

    // 显示/隐藏时钟和日期
    const clockEl = document.getElementById('clock');
    const dateEl = document.getElementById('date');
    if (clockEl) clockEl.style.display = appData.config.showClock ? 'block' : 'none';
    if (dateEl) dateEl.style.display = appData.config.showDate ? 'block' : 'none';

    // 聚焦效果
    const root = document.documentElement.style;
    const level = appData.config.focusLevel || 50;
    const overlayOp = (level / 100) * 0.9;
    const contentOp = 1 - (level / 100);
    const blurAmt = (level / 100) * 10;

    root.setProperty('--focus-overlay', `rgba(0,0,0,${overlayOp})`);
    root.setProperty('--focus-content-op', contentOp);
    root.setProperty('--focus-blur', blurAmt + 'px');
}



// 更新强调色
function updateAccentColor(color) {
    // 确保颜色值有效
    if (!color || typeof color !== 'string') {
        color = '#7c3aed'; // 默认紫色
    }
    appData.config.accentColor = color;
    document.documentElement.style.setProperty('--accent-color', color);

    // 计算深色版本用于悬停效果
    const darkerColor = darkenColor(color, 10);
    document.documentElement.style.setProperty('--accent-hover', darkerColor);

    saveData();
}

// 辅助函数：使颜色变暗
function darkenColor(color, percent) {
    // 处理undefined或无效颜色
    if (!color || typeof color !== 'string') {
        color = '#7c3aed'; // 默认紫色
    }
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

// 更新壁纸预览
function updateWallpaperPreview() {
    const preview = document.getElementById('current-wallpaper-preview');
    if (preview && appData.bgUrl) {
        preview.style.backgroundImage = appData.bgUrl.startsWith('http') || appData.bgUrl.startsWith('data:image') ?
            `url('${appData.bgUrl}')` : appData.bgUrl;
    }
}

// 更新格言
function updateQuote(quote) {
    // 这里可以添加格言更新逻辑
    // 目前只是保存到配置中
    appData.config.customQuote = quote;
    saveData();
}

// 应用搜索框样式
function applySearchBoxStyle(style) {
    const searchContainer = document.getElementById('search-container');
    searchContainer.className = `search-container ${style}`;

    // 根据不同样式设置不同的圆角
    switch (style) {
        case 'square':
            searchContainer.style.borderRadius = 'var(--radius-md)';
            break;
        case 'pill':
            searchContainer.style.borderRadius = 'var(--radius-full)';
            break;
        case 'rounded':
        default:
            searchContainer.style.borderRadius = 'var(--radius-xl)';
            break;
    }
}

// 更新字体大小
function updateFontSize(size) {
    appData.config.fontSize = parseInt(size);
    document.documentElement.style.fontSize = size + 'px';
    document.getElementById('font-size-value').textContent = size + 'px';
    saveData();
}

// 切换搜索建议
function toggleSearchSuggestions() {
    appData.config.showSearchSuggestions = !appData.config.showSearchSuggestions;
    saveData();
    // 实时更新搜索建议显示状态
    const searchInput = document.getElementById('search-input');
    if (searchInput && searchInput.value.trim()) {
        if (appData.config.showSearchSuggestions) {
            fetchSuggestions(searchInput.value.trim());
        } else {
            hideSuggestions();
        }
    }
}

// 实时预览函数
function enableRealTimePreview() {
    // 为所有设置控件添加实时预览
    const controls = {
        'minimalist-check': { type: 'checkbox', configKey: 'minimalist', updateFn: toggleZenMode },
        'show-clock-check': { type: 'checkbox', configKey: 'showClock', updateFn: toggleWidget.bind(null, 'showClock') },
        'show-date-check': { type: 'checkbox', configKey: 'showDate', updateFn: toggleWidget.bind(null, 'showDate') },
        'focus-level-range': { type: 'range', configKey: 'focusLevel', updateFn: updateFocusLevel },
        'font-size-range': { type: 'range', configKey: 'fontSize', updateFn: updateFontSize },
        'accent-color-picker': { type: 'color', configKey: 'accentColor', updateFn: updateAccentColor }
    };

    // 初始化实时预览
    for (const [id, control] of Object.entries(controls)) {
        const element = document.getElementById(id);
        if (element) {
            if (control.type === 'checkbox') {
                element.addEventListener('change', (e) => {
                    appData.config[control.configKey] = e.target.checked;
                    control.updateFn();
                });
            } else if (control.type === 'range' || control.type === 'color') {
                element.addEventListener('input', (e) => {
                    control.updateFn(e.target.value);
                });
            }
        }
    }

    // 搜索框样式实时预览
    const styleOptions = document.querySelectorAll('.style-option');
    styleOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            const style = e.currentTarget.getAttribute('onclick').match(/'([^']+)'/)[1];
            applySearchBoxStyle(style);
            appData.config.searchBoxStyle = style;
            saveData();
        });
    });

    // 自定义格言实时预览
    const customQuote = document.getElementById('custom-quote');
    if (customQuote) {
        customQuote.addEventListener('input', (e) => {
            updateQuote(e.target.value);
        });
    }
}

function updateFocusLevel(val) {
    appData.config.focusLevel = val; applyConfig(); saveData();
    document.body.classList.add('searching');
    setTimeout(() => { if (document.activeElement !== document.getElementById('search-input')) { document.body.classList.remove('searching'); } }, 1000);
}

function toggleZenMode() { appData.config.minimalist = !appData.config.minimalist; applyConfig(); saveData(); }

function toggleWidget(key) { appData.config[key] = !appData.config[key]; applyConfig(); saveData(); }

function setupSearchInteractions() {
    const input = document.getElementById('search-input');
    const container = document.getElementById('search-container');
    const suggestionBox = document.getElementById('suggestions-box');

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.altKey || e.metaKey || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key.length === 1) { input.focus(); }
    });

    input.addEventListener('focus', () => {
        document.body.classList.add('searching');
        input.style.textAlign = 'left';

        // 当搜索框有内容时，重新聚焦也要产生联想结果
        const val = input.value.trim();
        if (val) {
            // 立即显示建议框，避免闪烁
            suggestionBox.classList.add('show');
            container.classList.add('has-suggestions');

            // 延迟获取建议，避免频繁请求
            clearTimeout(suggestTimer);
            suggestTimer = setTimeout(() => fetchSuggestions(val), CONFIG.DEBOUNCE_DELAY);
        }
    });

    input.addEventListener('blur', () => {
        // 延迟执行，确保点击建议项或搜索引擎列表项时不会立即隐藏
        setTimeout(() => {
            // 检查当前活动元素是否在搜索引擎相关元素内
            const isFocusedOnEngineRelated = document.activeElement.closest('#suggestions-box') ||
                document.activeElement.closest('#search-container') ||
                document.activeElement.closest('#engine-dashboard') ||
                document.activeElement.closest('.engine-card');

            // 如果焦点不在搜索引擎相关元素上，则取消聚焦状态
            if (!isFocusedOnEngineRelated) {
                blurSearchInput();
            }
        }, 150);
    });

    input.addEventListener('input', (e) => {
        const val = e.target.value.trim();

        // 当搜索框输入内容时，自动关闭搜索引擎选择界面
        document.getElementById('engine-dashboard').classList.remove('show');

        if (val) {
            clearTimeout(suggestTimer);
            suggestTimer = setTimeout(() => fetchSuggestions(val), 200);
        } else {
            hideSuggestions();
        }
    });

    // 全局点击事件，用于取消搜索框聚焦状态和隐藏搜索引擎下拉框
    document.addEventListener('click', (e) => {
        // 检查点击的目标是否在搜索相关元素内部
        const isClickInsideSearch = container.contains(e.target) ||
            document.getElementById('engine-dashboard').contains(e.target) ||
            document.getElementById('modal')?.contains(e.target) ||
            document.getElementById('item-edit-modal')?.contains(e.target) ||
            suggestionBox.contains(e.target);

        // 特别检查是否点击了搜索引擎列表项
        const isClickOnEngineItem = e.target.closest('.engine-card');

        // 如果点击的是搜索框外部区域，但不是搜索引擎列表项，则取消聚焦状态
        if (!isClickInsideSearch && !isClickOnEngineItem) {
            blurSearchInput();
        }

        // 如果点击了搜索引擎列表项，保持聚焦状态但隐藏搜索引擎选择界面
        if (isClickOnEngineItem) {
            document.getElementById('engine-dashboard')?.classList.remove('show');
        }
    });
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') doSearch(); });
}

function fetchSuggestions(keyword) {
    // 清理之前的JSONP脚本，防止内存泄漏
    const oldScripts = document.querySelectorAll('script[data-suggest="true"]');
    oldScripts.forEach(s => s.remove());

    const script = document.createElement('script');
    script.setAttribute('data-suggest', 'true');
    script.src = `https://api.bing.com/qsonhs.aspx?type=cb&q=${encodeURIComponent(keyword)}&cb=handleBingSuggestions`;
    script.onerror = () => script.remove();
    document.body.appendChild(script);

    // 设置超时自动清理
    setTimeout(() => {
        if (script.parentNode) script.remove();
    }, 5000);
}

window.handleBingSuggestions = function (data) {
    const suggestions = data.AS.Results[0].Suggests;
    const box = document.getElementById('suggestions-box');
    const container = document.getElementById('search-container');
    const searchSuggestions = document.getElementById('search-suggestions');

    if (suggestions && suggestions.length > 0) {
        // 更新搜索联想
        searchSuggestions.innerHTML = '';
        suggestions.forEach(s => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `<svg class="suggestion-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><g fill="none"><path d="m12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.036q-.016-.004-.024.006l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.016-.018m.264-.113l-.014.002l-.184.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.003-.011l.018-.43l-.003-.012l-.01-.01z" fill="currentColor"/><path fill="currentColor" d="M10.5 2c1.251 0 2.44.27 3.509.756a3 3 0 0 0-.97 1.759A6.5 6.5 0 1 0 17 10.5l-.005-.269c.536.48 1.239.765 1.991.769a8.46 8.46 0 0 1-1.809 4.762l3.652 3.652a1 1 0 0 1-1.414 1.414l-3.652-3.652A8.5 8.5 0 1 1 10.5 2m0 3c.927 0 1.801.23 2.568.635a3 3 0 0 0 1.963 2.204l.348.119A5.5 5.5 0 1 1 10.5 5M19 1a1 1 0 0 1 .898.56l.048.117l.13.378a3 3 0 0 0 1.684 1.8l.185.07l.378.129a1 1 0 0 1 .118 1.844l-.118.048l-.378.13a3 3 0 0 0-1.8 1.684l-.07.185l-.129.378a1 1 0 0 1-1.844.117l-.048-.117l-.13-.378a3 3 0 0 0-1.684-1.8l-.185-.07l-.378-.129a1 1 0 0 1-.118-1.844l.118-.048l.378-.13a3 3 0 0 0 1.8-1.684l.07-.185l.129-.378A1 1 0 0 1 19 1"/></g></svg> ${s.Txt}`;
            div.onclick = () => {
                document.getElementById('search-input').value = s.Txt;
                // 移除聚焦状态和隐藏建议框
                document.body.classList.remove('searching');
                hideSuggestions();
                doSearch();
            };
            searchSuggestions.appendChild(div);
        });

        // 显示建议框
        box.classList.add('show');
        container.classList.add('has-suggestions');
    } else {
        hideSuggestions();
    }
};

function hideSuggestions() {
    const box = document.getElementById('suggestions-box');
    const container = document.getElementById('search-container');

    // 隐藏建议框
    box.classList.remove('show');
    container.classList.remove('has-suggestions');
}

// 取消搜索框聚焦状态的函数
function blurSearchInput() {
    const input = document.getElementById('search-input');
    const container = document.getElementById('search-container');
    const suggestionBox = document.getElementById('suggestions-box');

    // 移除聚焦状态类
    document.body.classList.remove('searching');

    // 隐藏搜索引擎选择界面
    document.getElementById('engine-dashboard')?.classList.remove('show');

    // 重置搜索框样式
    input.style.textAlign = 'center';

    // 隐藏建议框
    hideSuggestions();

    // 移除焦点
    input.blur();
}

function showCustomInput(title, defaultValue = "") {
    return new Promise((resolve) => {
        document.getElementById('dialog-title-text').innerText = title;
        const input = document.getElementById('dialog-input-val');
        input.value = defaultValue;
        document.getElementById('input-dialog').classList.add('active');
        input.focus();
        dialogResolver = resolve;
    });
}

function closeInputDialog(val) { document.getElementById('input-dialog').classList.remove('active'); if (dialogResolver) dialogResolver(val); dialogResolver = null; }

function submitInputDialog() { const val = document.getElementById('dialog-input-val').value; closeInputDialog(val); }

document.getElementById('dialog-input-val').addEventListener('keydown', (e) => { if (e.key === 'Enter') submitInputDialog(); if (e.key === 'Escape') closeInputDialog(null); });

// 右键菜单功能已移除

// handleCtxAction 函数已移除（右键菜单已禁用）

function getRandomColor() { const l = '0123456789ABCDEF'; let c = '#'; for (let i = 0; i < 6; i++)c += l[Math.floor(Math.random() * 16)]; return c; }

function generateRandomGradient() { const a = Math.floor(Math.random() * 360); return `linear-gradient(${a}deg, ${getRandomColor()}, ${getRandomColor()})`; }

function setRandomWallpaper() { appData.bgUrl = generateRandomGradient(); saveData(); applyBackground(); }

function handleBgUpload(input) { const f = input.files[0]; if (f) { if (f.size > 3 * 1024 * 1024) return alert("图片过大"); const r = new FileReader(); r.onload = e => { appData.bgUrl = e.target.result; saveData(); applyBackground(); alert("已应用"); }; r.readAsDataURL(f); } }

function handleBgSave() { const url = document.getElementById('bg-url').value; if (url) { appData.bgUrl = url; saveData(); applyBackground(); } }

function applyBackground() { const bg = appData.bgUrl; if (!bg) return; if (bg.startsWith('http') || bg.startsWith('data:image')) document.body.style.backgroundImage = `url('${bg}')`; else document.body.style.backgroundImage = bg; }

let currentEditIndex = -1, currentFolderIndex = -1;

function openItemModal(mode, index) {
    const modal = document.getElementById('item-edit-modal');
    modal.style.zIndex = "9999"; modal.classList.add('active');
    document.getElementById('folder-editor-area').style.display = 'none';
    document.getElementById('icon-editor-area').style.display = 'none';
    if (mode === 'edit') {
        currentEditIndex = index;
        const item = appData.sites[index];
        document.getElementById('item-modal-title').innerText = "编辑图标";
        document.getElementById('icon-editor-area').style.display = 'block';
        document.getElementById('edit-item-name').value = item.name;
        document.getElementById('edit-item-url').value = item.url || "";
        document.getElementById('edit-item-icon-url').value = item.iconValue || "";
    } else if (mode === 'folder') {
        currentFolderIndex = index;
        const folder = appData.sites[index];
        document.getElementById('item-modal-title').innerText = folder.name;
        document.getElementById('folder-editor-area').style.display = 'block';
        renderFolderGrid(folder);
    }
}

function closeItemModal() { document.getElementById('item-edit-modal').classList.remove('active'); }



// 缺少的函数实现
function refreshAllEngines() {
    // 重新构建allEngines数组，确保索引正确
    allEngines = [];
    appData.categories.forEach(cat => {
        allEngines.push(...cat.engines);
    });
    // 确保activeEngineIndex在有效范围内
    if (appData.activeEngineIndex >= allEngines.length) {
        appData.activeEngineIndex = 0;
        saveData();
    }
    renderEngineDashboard();
}

function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    document.getElementById('clock').textContent = time;
    document.getElementById('date').textContent = date;
}

function toggleEngineDashboard(event) {
    event.stopPropagation();
    const dashboard = document.getElementById('engine-dashboard');
    dashboard.classList.toggle('show');

    // 无论打开还是关闭，都保持/激活聚焦状态
    const input = document.getElementById('search-input');
    input.focus();
    document.body.classList.add('searching');

    // 如果有内容，确保建议框显示状态正确
    if (input.value.trim() && appData.config.showSearchSuggestions) {
        document.getElementById('suggestions-box').classList.add('show');
        document.getElementById('search-container').classList.add('has-suggestions');
    }
}

function doSearch() {
    const input = document.getElementById('search-input');
    const query = input.value.trim();
    if (query) {
        // 检查allEngines数组是否有值
        if (allEngines.length === 0) {
            // 如果allEngines为空，重新初始化
            refreshAllEngines();
        }
        // 确保activeEngineIndex在有效范围内
        if (appData.activeEngineIndex >= allEngines.length) {
            appData.activeEngineIndex = 0;
            saveData();
        }
        const engine = allEngines[appData.activeEngineIndex];
        if (engine && engine.url) {
            window.open(engine.url + encodeURIComponent(query), '_blank');
        } else {
            alert('请先添加搜索引擎');
        }
    }
}


// 处理上下文操作（保留用于设置面板中的快捷方式管理）
function handleCtxAction(action, index) {
    const itemIndex = index;
    const item = appData.sites[itemIndex];
    if (!item) return;

    if (action === 'open') {
        if (item.type === 'folder') {
            openItemModal('folder', itemIndex);
        } else {
            let url = item.url.startsWith('http') ? item.url : 'https://' + item.url;
            window.location.href = url;
        }
    } else if (action === 'new-tab') {
        if (item.type === 'folder') {
            openItemModal('folder', itemIndex);
        } else {
            let url = item.url.startsWith('http') ? item.url : 'https://' + item.url;
            window.open(url, '_blank');
        }
    } else if (action === 'delete') {
        deleteShortcut(itemIndex);
    } else if (action === 'edit') {
        if (item.type === 'folder') {
            const newName = prompt("重命名文件夹", item.name);
            if (newName) {
                appData.sites[itemIndex].name = newName;
                saveData();
                renderShortcutsManagement();
            }
        } else {
            openItemModal('edit', itemIndex);
        }
    } else if (action === 'rename') {
        const newName = prompt("重命名", item.name);
        if (newName) {
            appData.sites[itemIndex].name = newName;
            saveData();
            renderShortcutsManagement();
        }
    } else if (action === 'to-folder') {
        if (item.type !== 'folder') {
            const folderName = prompt("新建文件夹名称", "我的收藏");
            if (folderName) {
                const newItem = { name: folderName, type: 'folder', children: [item] };
                appData.sites.splice(itemIndex, 1, newItem);
                saveData();
                renderShortcutsManagement();
            }
        }
    }
}

// 壁纸数据源
const wallpaperSources = {
    bing: {
        name: '必应壁纸',
        urls: [
            'https://bing.biturl.top/?resolution=1920&format=image&index=0&mkt=zh-CN',
            'https://bing.biturl.top/?resolution=1920&format=image&index=1&mkt=zh-CN',
            'https://bing.biturl.top/?resolution=1920&format=image&index=2&mkt=zh-CN',
            'https://bing.biturl.top/?resolution=1920&format=image&index=3&mkt=zh-CN',
            'https://bing.biturl.top/?resolution=1920&format=image&index=4&mkt=zh-CN',
            'https://bing.biturl.top/?resolution=1920&format=image&index=5&mkt=zh-CN'
        ]
    },
    gradients: {
        name: '渐变壁纸',
        urls: [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
        ]
    },
    nature: {
        name: '自然风景',
        urls: [
            'https://images.unsplash.com/photo-1501426026826-31c667bdf23d?w=1920&h=1080&fit=crop',
            'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&h=1080&fit=crop',
            'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&h=1080&fit=crop',
            'https://images.unsplash.com/photo-1500048993953-d23a436266cf?w=1920&h=1080&fit=crop',
            'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&h=1080&fit=crop',
            'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&h=1080&fit=crop'
        ]
    }
};

// 渲染壁纸库
function renderWallpaperGallery() {
    const container = document.getElementById('wallpaper-gallery');
    container.innerHTML = '';

    // 创建壁纸分类
    for (const [key, source] of Object.entries(wallpaperSources)) {
        const category = document.createElement('div');
        category.className = 'wallpaper-category';
        category.innerHTML = `<div class="category-title" style="margin: 10px 0;">${source.name}</div>`;

        const grid = document.createElement('div');
        grid.className = 'wallpaper-gallery';

        source.urls.forEach((url, idx) => {
            const item = document.createElement('div');
            item.className = 'wallpaper-item';
            item.style.backgroundImage = url.startsWith('linear-gradient') ? url : `url('${url}')`;
            item.onclick = () => {
                appData.bgUrl = url;
                saveData();
                applyBackground();
                updateWallpaperPreview();
            };
            grid.appendChild(item);
        });

        category.appendChild(grid);
        container.appendChild(category);
    }
}

// 优化随机壁纸函数
function setRandomWallpaper() {
    // 从所有壁纸源中随机选择
    const allWallpapers = [];
    for (const source of Object.values(wallpaperSources)) {
        allWallpapers.push(...source.urls);
    }

    const randomIndex = Math.floor(Math.random() * allWallpapers.length);
    appData.bgUrl = allWallpapers[randomIndex];
    saveData();
    applyBackground();
    updateWallpaperPreview();
}

// 处理背景上传
function handleBgUpload(input) {
    const file = input.files[0];
    if (!file) return;

    if (file.size > CONFIG.MAX_FILE_SIZE) {
        alert("图片过大，请选择小于3MB的图片");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        appData.bgUrl = e.target.result;
        saveData();
        applyBackground();
        updateWallpaperPreview();
    };
    reader.readAsDataURL(file);
}

// 处理背景保存
function handleBgSave() {
    const url = document.getElementById('bg-url').value.trim();
    if (url) {
        appData.bgUrl = url;
        saveData();
        applyBackground();
        updateWallpaperPreview();
        alert("壁纸已应用");
    }
}

function handleFileSelect(input) {
    const file = input.files[0];
    if (file) {
        if (file.size > CONFIG.MAX_FILE_SIZE) {
            alert('图片过大，请选择小于3MB的图片');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            tempBase64 = e.target.result;
            // 显示预览（如果有预览元素）
            const preview = document.getElementById('new-engine-icon-preview');
            if (preview) {
                preview.src = tempBase64;
                preview.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    }
}

function toggleIconUrlInput() {
    const urlInputDiv = document.getElementById('icon-url-input');
    urlInputDiv.style.display = urlInputDiv.style.display === 'none' || urlInputDiv.style.display === '' ? 'block' : 'none';
}

function toggleSiteIconUrlInput() {
    const urlInputDiv = document.getElementById('site-icon-url-input');
    urlInputDiv.style.display = urlInputDiv.style.display === 'none' || urlInputDiv.style.display === '' ? 'block' : 'none';
}

function handleSiteFileSelect(input) {
    // 处理快捷方式图标文件选择
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            tempBase64 = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function addNewCategoryPrompt() {
    showCustomInput('输入分类名称').then(name => {
        if (name) {
            appData.categories.push({ title: name, engines: [] });
            saveData();
            refreshAllEngines();
            renderCategorySelect();
        }
    });
}

function renderEngineDashboard() {
    const content = document.getElementById('dashboard-content');
    content.innerHTML = '';

    // 确保allEngines数组是最新的
    const allEnginesTemp = [];
    appData.categories.forEach(cat => {
        allEnginesTemp.push(...cat.engines);
    });
    allEngines = allEnginesTemp;

    appData.categories.forEach(cat => {
        const section = document.createElement('div');
        section.className = 'category-section';
        section.innerHTML = `<div class="category-title">${cat.title}</div><div class="engine-grid-display"></div>`;
        const grid = section.querySelector('.engine-grid-display');

        cat.engines.forEach((engine) => {
            // 获取引擎在全局allEngines数组中的准确索引
            const engineIndex = allEngines.findIndex(e => e.name === engine.name && e.url === engine.url);
            const card = document.createElement('div');

            // 只将当前活跃引擎标记为active
            const isActive = engineIndex === appData.activeEngineIndex;
            card.className = `engine-card ${isActive ? 'active' : ''}`;
            card.innerHTML = `<div class="engine-card-icon">${getEngineIconHtml(engine)}</div><div class="engine-card-name">${engine.name}</div>`;

            card.onclick = () => {
                // 更新活跃引擎索引
                appData.activeEngineIndex = engineIndex;
                saveData();
                updateCurrentEngineIcon();
                renderEngineDashboard();

                // 隐藏搜索引擎选择界面但保持聚焦状态
                document.getElementById('engine-dashboard')?.classList.remove('show');
            };
            grid.appendChild(card);
        });
        content.appendChild(section);
    });
}

function getEngineIconHtml(engine) {
    if (engine.iconType === 'image' || engine.iconType === 'url') {
        if (engine.iconValue) return `<img class="engine-img-display" src="${engine.iconValue}" alt="${engine.name}">`;
    }

    // 处理引擎名称，确保能正确匹配图标
    const name = engine.name;
    const iconUrl = icons[name] || icons[name.toLowerCase()] || icons[name.toUpperCase()] || icons.default;
    return `<img class="engine-svg" src="${iconUrl}" alt="${engine.name}">`;
}

function updateCurrentEngineIcon() {
    const icon = document.getElementById('current-engine-icon');
    // 确保引擎索引有效
    if (appData.activeEngineIndex >= 0 && appData.activeEngineIndex < allEngines.length) {
        const engine = allEngines[appData.activeEngineIndex];
        icon.innerHTML = getEngineIconHtml(engine);
    }
}

function exportData() {
    const data = JSON.stringify(appData);
    navigator.clipboard.writeText(data).then(() => {
        alert('配置已复制到剪贴板');
    });
}

function importDataPrompt() {
    showCustomInput('粘贴配置 JSON').then(data => {
        if (data) {
            try {
                const imported = JSON.parse(data);
                appData = imported;
                saveData();
                location.reload();
            } catch (e) {
                alert('无效的 JSON 数据');
            }
        }
    });
}

function resetData() {
    if (confirm('确定要重置所有数据吗？')) {
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        location.reload();
    }
}



function handleAddSave() {
    const name = document.getElementById('site-name').value.trim();
    const url = document.getElementById('site-url').value.trim();
    const iconUrl = document.getElementById('site-icon-url')?.value?.trim();

    if (!name || !url) return alert('请填写完整信息');

    // 构建新站点对象
    const newSite = { name, url };

    // 优先使用上传的图标，其次使用URL图标
    if (tempBase64) {
        newSite.iconValue = tempBase64;
    } else if (iconUrl) {
        newSite.iconValue = iconUrl;
    }

    appData.sites.push(newSite);
    saveData();

    // 清空表单
    document.getElementById('site-name').value = '';
    document.getElementById('site-url').value = '';
    if (document.getElementById('site-icon-url')) {
        document.getElementById('site-icon-url').value = '';
    }
    tempBase64 = ''; // 清空临时图标

    showSuccessMessage('快捷方式添加成功！');
}

function saveItemEdit() {
    const name = document.getElementById('edit-item-name').value;
    const url = document.getElementById('edit-item-url').value;
    const iconUrl = document.getElementById('edit-item-icon-url').value;
    if (!name || !url) return alert('请填写完整信息');
    const item = appData.sites[currentEditIndex];
    item.name = name;
    item.url = url;
    item.iconValue = iconUrl;
    saveData();
    closeItemModal();
}

function handleEditFile(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('edit-item-icon-url').value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function addSiteToFolderPrompt() {
    showCustomInput('输入网站名称').then(name => {
        if (name) {
            showCustomInput('输入网站 URL').then(url => {
                if (url) {
                    const site = { name, url };
                    appData.sites[currentFolderIndex].children.push(site);
                    saveData();
                    renderFolderGrid(appData.sites[currentFolderIndex]);
                }
            });
        }
    });
}

function removeSiteFromFolder(folderIndex, siteIndex) {
    appData.sites[folderIndex].children.splice(siteIndex, 1);
    saveData();
    renderFolderGrid(appData.sites[folderIndex]);
}

function renderCategorySelect() {
    const select = document.getElementById('new-engine-cat-select');
    select.innerHTML = '';
    appData.categories.forEach((cat, idx) => {
        const option = document.createElement('option');
        option.value = idx;
        option.textContent = cat.title;
        select.appendChild(option);
    });
}

// 初始化分类拖拽排序
function initSortableCategories() {
    const container = document.querySelector('.sortable-categories');
    if (!container) return;

    new Sortable(container, {
        animation: 150,
        ghostClass: 'sortable-category-ghost',
        handle: '.category-drag-handle',
        forceFallback: true,
        fallbackClass: 'sortable-category-fallback',
        onEnd: function (evt) {
            const [movedCategory] = appData.categories.splice(evt.oldIndex, 1);
            appData.categories.splice(evt.newIndex, 0, movedCategory);
            saveData();
            refreshAllEngines();
            renderEngineManagement();
        }
    });
}
// 添加fallback模式和分类拖拽的CSS样式
const fallbackStyle = document.createElement('style');
fallbackStyle.textContent = `
    /* 引擎拖拽样式 */
    .sortable-fallback {
        background: rgba(99, 102, 241, 0.2);
        border: 1px dashed rgba(99, 102, 241, 0.6);
        border-radius: 8px;
        padding: 20px;
        opacity: 0.8;
    }
    
    /* 分类拖拽样式 */
    .sortable-category-ghost {
        background: rgba(99, 102, 241, 0.1);
        border: 1px dashed rgba(99, 102, 241, 0.6);
        border-radius: 8px;
        opacity: 0.8;
    }
    
    .sortable-category-fallback {
        background: rgba(99, 102, 241, 0.2);
        border: 1px dashed rgba(99, 102, 241, 0.6);
        border-radius: 8px;
        opacity: 0.8;
    }
`;
document.head.appendChild(fallbackStyle);

// 删除分类
function deleteCategory(catIdx) {
    if (appData.categories[catIdx].engines.length > 0) {
        alert('该分类下还有搜索引擎，请先删除或转移搜索引擎');
        return;
    }

    appData.categories.splice(catIdx, 1);
    saveData();
    refreshAllEngines();
    renderEngineManagement();
    renderCategorySelect();
}

// 编辑搜索引擎
function editEngine(catIdx, engineIdx) {
    const engine = appData.categories[catIdx].engines[engineIdx];

    // 打开编辑弹窗
    showCustomInput('编辑搜索引擎名称', engine.name).then(newName => {
        if (newName) {
            engine.name = newName;
            saveData();
            refreshAllEngines();
            renderEngineManagement();
            renderEngineDashboard();
        }
    });
}

// 删除搜索引擎
function deleteEngine(catIdx, engineIdx) {
    appData.categories[catIdx].engines.splice(engineIdx, 1);
    saveData();
    refreshAllEngines();
    renderEngineManagement();
    renderEngineDashboard();
}

// 清空新引擎表单
function clearNewEngineForm() {
    document.getElementById('new-engine-name').value = '';
    document.getElementById('new-engine-url').value = '';
    document.getElementById('new-engine-icon-url').value = '';
    document.getElementById('new-engine-icon-file').value = '';
}

// 页面加载时初始化
// 版本更新：修复了元素不存在的错误 " + new Date().getTime() + "
init();