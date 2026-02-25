import { state, saveData, refreshAllEngines } from './state.js';
import { CONFIG, icons } from './config.js';
import { System } from './utils.js';
import { renderEngineDashboard, updateCurrentEngineIcon, getEngineIconHtml } from './ui.js';

export function setupSearchInteractions() {
    const input = document.getElementById('search-input');
    const container = document.getElementById('search-container');
    const suggestionBox = document.getElementById('suggestions-box');

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.altKey || e.metaKey || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key.length === 1) { input.focus(); }
    });

    input.addEventListener('keydown', (e) => {
        if (suggestionBox.classList.contains('show')) {
            const items = suggestionBox.querySelectorAll('.suggestion-item');
            if (!items.length) return;

            let currentIndex = Array.from(items).findIndex(item => item.classList.contains('keyboard-selected'));

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (currentIndex >= 0) items[currentIndex].classList.remove('keyboard-selected');
                currentIndex = (currentIndex + 1) % items.length;
                items[currentIndex].classList.add('keyboard-selected');
                items[currentIndex].scrollIntoView({ block: 'nearest' });
                input.value = items[currentIndex].textContent.trim();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (currentIndex >= 0) items[currentIndex].classList.remove('keyboard-selected');
                currentIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
                items[currentIndex].classList.add('keyboard-selected');
                items[currentIndex].scrollIntoView({ block: 'nearest' });
                input.value = items[currentIndex].textContent.trim();
            }
        }
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
            clearTimeout(state.suggestTimer);
            state.suggestTimer = setTimeout(() => fetchSuggestions(val), CONFIG.DEBOUNCE_DELAY);
        }
    });

    input.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        const clearBtn = document.getElementById('search-clear');
        if (clearBtn) clearBtn.classList.toggle('show', val.length > 0);

        // 当搜索框输入内容时，自动关闭搜索引擎选择界面
        document.getElementById('engine-dashboard').classList.remove('show');

        if (val) {
            clearTimeout(state.suggestTimer);
            state.suggestTimer = setTimeout(() => fetchSuggestions(val), 200);
        } else {
            hideSuggestions();
        }
    });

    document.addEventListener('click', (e) => {
        if (!container.contains(e.target) && !document.getElementById('engine-dashboard').contains(e.target) && !document.getElementById('modal')?.contains(e.target) && !document.getElementById('item-edit-modal')?.contains(e.target) && !suggestionBox.contains(e.target)) {
            blurSearchInput();
        }
    });
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') doSearch(); });

    // 添加鼠标悬浮触发搜索联想（在非 focus 状态下）
    const wrapper = document.querySelector('.search-wrapper');
    if (wrapper) {
        wrapper.addEventListener('mouseenter', () => {
            const val = input.value.trim();
            // 当搜索框存在内容且并未被激活（body 没有 searching class）
            if (val && !document.body.classList.contains('searching')) {
                const searchSuggestions = document.getElementById('search-suggestions');
                // 若有现有节点则直接浮出
                if (searchSuggestions.children.length > 0) {
                    suggestionBox.classList.add('show');
                    // 悬浮状态不要为 container 加 has-suggestions 这会让它底部边框变透明
                    // 仅显示下方卡片
                } else {
                    fetchSuggestions(val);
                }
            }
        });

        wrapper.addEventListener('mouseleave', () => {
            // 如果处于未 focus 状态，离开时则隐藏联想
            if (!document.body.classList.contains('searching')) {
                suggestionBox.classList.remove('show');
            }
        });
    }
}

export function blurSearchInput() {
    const input = document.getElementById('search-input');
    const clearBtn = document.getElementById('search-clear');
    document.body.classList.remove('searching');
    document.getElementById('engine-dashboard').classList.remove('show');
    if (clearBtn) clearBtn.classList.remove('show');
    input.style.textAlign = 'center';
    hideSuggestions();
}

export function clearSearch() {
    const input = document.getElementById('search-input');
    const clearBtn = document.getElementById('search-clear');
    input.value = '';
    input.focus();
    if (clearBtn) clearBtn.classList.remove('show');
    hideSuggestions();
}

export function toggleEngineDashboard(event) {
    if (event) event.stopPropagation();
    const dashboard = document.getElementById('engine-dashboard');
    dashboard.classList.toggle('show');
}

export function doSearch() {
    const input = document.getElementById('search-input');
    const query = input.value.trim();
    if (query) {
        if (state.allEngines.length === 0) {
            refreshAllEngines();
        }
        if (state.appData.activeEngineIndex >= state.allEngines.length) {
            state.appData.activeEngineIndex = 0;
            saveData();
        }
        const engine = state.allEngines[state.appData.activeEngineIndex];
        if (engine && engine.url) {
            System.openUrl(engine.url + encodeURIComponent(query));
        } else {
            alert('请先添加搜索引擎');
        }
    }
}

const triggeredEggs = new Set(); // 记录已经触发过的彩蛋

export function fetchSuggestions(keyword) {
    const kw = keyword.toUpperCase();

    // 浪漫彩蛋 (专属开发者与女朋友缩写)
    if (kw === 'WT💗LM') {
        renderCustomSuggestions(['999999', '1314', '一直走在开满鲜花的路上 🌸']);
        if (!triggeredEggs.has('wtlm')) {
            if (triggerEasterEggAnimation()) {
                triggeredEggs.add('wtlm');
            }
        }
        return;
    }

    // 黑客帝国代码雨
    if (kw === 'MATRIX' || kw === '黑客帝国' || kw === '代码雨') {
        renderCustomSuggestions(['Wake up, Neo...', 'The Matrix has you...', 'Follow the white rabbit.', '母体漏洞已发现...']);
        if (!triggeredEggs.has('matrix')) {
            if (triggerMatrixRain()) {
                triggeredEggs.add('matrix');
            }
        }
        return;
    }

    // 大翻滚
    if (kw === 'BARREL ROLL' || kw === 'DO A BARREL ROLL' || kw === '大翻滚' || kw === '转圈圈') {
        renderCustomSuggestions(['Z or R twice to barrel roll!', '网页正在做前滚翻！']);
        if (!triggeredEggs.has('roll')) {
            if (triggerBarrelRoll()) {
                triggeredEggs.add('roll');
            }
        }
        return;
    }

    // 抛硬币
    if (kw === 'COIN FLIP' || kw === '抛硬币' || kw === '硬币') {
        if (!triggeredEggs.has('coin')) {
            if (triggerCoinFlip()) {
                triggeredEggs.add('coin');
                renderCustomSuggestions(['正在抛掷硬币... (Flipping coin...)']);
                return;
            }
        }
        // 反之正常展示硬币结果即可
        const isHeads = Math.random() > 0.5;
        renderCustomSuggestions([isHeads ? '正面 (Heads) 👦' : '反面 (Tails) 🪙']);
        return;
    }

    // 下雪彩蛋
    if (kw === 'SNOW' || kw === '下雪' || kw === '雪') {
        renderCustomSuggestions(['Winter is coming...', 'Let it snow!', '瑞雪兆丰年 ❄️']);
        if (!triggeredEggs.has('snow')) {
            if (triggerSnow()) {
                triggeredEggs.add('snow');
            }
        }
        return;
    }

    // 地震彩蛋
    if (kw === 'SHAKE' || kw === 'EARTHQUAKE' || kw === '地震' || kw === '摇晃') {
        renderCustomSuggestions(['Hold on tight!', '抓稳了，正在产生剧烈震动！ 💥']);
        if (!triggeredEggs.has('shake')) {
            if (triggerShake()) {
                triggeredEggs.add('shake');
            }
        }
        return;
    }

    // 霓虹彩蛋
    if (kw === 'NEON' || kw === '霓虹' || kw === '赛博朋克' || kw === 'CYBERPUNK') {
        renderCustomSuggestions(['Cyberpunk mode activated', '赛博朋克模式已启动 🌃']);
        if (!triggeredEggs.has('neon')) {
            if (triggerNeon()) {
                triggeredEggs.add('neon');
            }
        }
        return;
    }

    const oldScripts = document.querySelectorAll('script[data-suggest="true"]');
    oldScripts.forEach(s => s.remove());

    const script = document.createElement('script');
    script.setAttribute('data-suggest', 'true');
    script.src = `https://api.bing.com/qsonhs.aspx?type=cb&q=${encodeURIComponent(keyword)}&cb=handleBingSuggestions`;
    script.onerror = () => script.remove();
    document.body.appendChild(script);

    setTimeout(() => {
        if (script.parentNode) script.remove();
    }, 5000);
}

export function hideSuggestions() {
    const box = document.getElementById('suggestions-box');
    const container = document.getElementById('search-container');

    box.classList.remove('show');
    container.classList.remove('has-suggestions');
}

// Global callback for JSONP
window.handleBingSuggestions = function (data) {
    const suggestions = data.AS.Results[0].Suggests;
    const box = document.getElementById('suggestions-box');
    const container = document.getElementById('search-container');
    const searchSuggestions = document.getElementById('search-suggestions');

    if (suggestions && suggestions.length > 0) {
        searchSuggestions.innerHTML = '';
        suggestions.forEach(s => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `<svg class="suggestion-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><g fill="none"><path d="m12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.036q-.016-.004-.024.006l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.016-.018m.264-.113l-.014.002l-.184.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.003-.011l.018-.43l-.003-.012l-.01-.01z" fill="currentColor"/><path fill="currentColor" d="M10.5 2c1.251 0 2.44.27 3.509.756a3 3 0 0 0-.97 1.759A6.5 6.5 0 1 0 17 10.5l-.005-.269c.536.48 1.239.765 1.991.769a8.46 8.46 0 0 1-1.809 4.762l3.652 3.652a1 1 0 0 1-1.414 1.414l-3.652-3.652A8.5 8.5 0 1 1 10.5 2m0 3c.927 0 1.801.23 2.568.635a3 3 0 0 0 1.963 2.204l.348.119A5.5 5.5 0 1 1 10.5 5M19 1a1 1 0 0 1 .898.56l.048.117l.13.378a3 3 0 0 0 1.684 1.8l.185.07l.378.129a1 1 0 0 1 .118 1.844l-.118.048l-.378.13a3 3 0 0 0-1.8 1.684l-.07.185l-.129.378a1 1 0 0 1-1.844.117l-.048-.117l-.13-.378a3 3 0 0 0-1.684-1.8l-.185-.07l-.378-.129a1 1 0 0 1-.118-1.844l.118-.048l.378-.13a3 3 0 0 0 1.8-1.684l.07-.185l.129-.378A1 1 0 0 1 19 1"/></g></svg> ${s.Txt}`;
            div.onclick = () => {
                document.getElementById('search-input').value = s.Txt;
                doSearch();
            };
            searchSuggestions.appendChild(div);
        });

        box.classList.add('show');
        container.classList.add('has-suggestions');
    } else {
        hideSuggestions();
    }
};

function renderCustomSuggestions(items) {
    const box = document.getElementById('suggestions-box');
    const container = document.getElementById('search-container');
    const searchSuggestions = document.getElementById('search-suggestions');
    searchSuggestions.innerHTML = '';

    items.forEach(txt => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.innerHTML = `<svg class="suggestion-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><g fill="none"><path d="m12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.036q-.016-.004-.024.006l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.016-.018m.264-.113l-.014.002l-.184.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.003-.011l.018-.43l-.003-.012l-.01-.01z" fill="currentColor"/><path fill="currentColor" d="M10.5 2c1.251 0 2.44.27 3.509.756a3 3 0 0 0-.97 1.759A6.5 6.5 0 1 0 17 10.5l-.005-.269c.536.48 1.239.765 1.991.769a8.46 8.46 0 0 1-1.809 4.762l3.652 3.652a1 1 0 0 1-1.414 1.414l-3.652-3.652A8.5 8.5 0 1 1 10.5 2m0 3c.927 0 1.801.23 2.568.635a3 3 0 0 0 1.963 2.204l.348.119A5.5 5.5 0 1 1 10.5 5M19 1a1 1 0 0 1 .898.56l.048.117l.13.378a3 3 0 0 0 1.684 1.8l.185.07l.378.129a1 1 0 0 1 .118 1.844l-.118.048l-.378.13a3 3 0 0 0-1.8 1.684l-.07.185l-.129.378a1 1 0 0 1-1.844.117l-.048-.117l-.13-.378a3 3 0 0 0-1.684-1.8l-.185-.07l-.378-.129a1 1 0 0 1-.118-1.844l.118-.048l.378-.13a3 3 0 0 0 1.8-1.684l.07-.185l.129-.378A1 1 0 0 1 19 1"/></g></svg> ${txt}`;
        div.onclick = () => {
            document.getElementById('search-input').value = txt;
            doSearch();
        };
        searchSuggestions.appendChild(div);
    });
    box.classList.add('show');
    if (document.body.classList.contains('searching')) {
        container.classList.add('has-suggestions');
    }
}

let easterEggActive = false;
function triggerEasterEggAnimation() {
    if (easterEggActive) return false;
    easterEggActive = true;

    const eggContainer = document.createElement('div');
    eggContainer.id = 'easter-egg-container';
    document.body.appendChild(eggContainer);

    const emojis = ['💗', '💖', '🌸', '🌹', '🌺', '🌷', 'W', 'T', '💗', 'L', 'M'];

    // 生成满屏飞舞的彩蛋
    const interval = setInterval(() => {
        const span = document.createElement('span');
        span.className = 'easter-egg-item';
        span.innerText = emojis[Math.floor(Math.random() * emojis.length)];

        span.style.left = Math.random() * 100 + 'vw';
        span.style.fontSize = (Math.random() * 3 + 1.5) + 'rem';
        span.style.animationDuration = (Math.random() * 3 + 3) + 's';

        eggContainer.appendChild(span);

        setTimeout(() => span.remove(), 6000);
    }, 80); // 较高频率

    setTimeout(() => {
        clearInterval(interval);
        setTimeout(() => {
            if (eggContainer.parentNode) eggContainer.remove();
            easterEggActive = false;
        }, 6000);
    }, 6000); // 持续6秒
    return true;
}

function triggerMatrixRain() {
    if (easterEggActive) return false;
    easterEggActive = true;

    const canvas = document.createElement('canvas');
    canvas.id = 'matrix-canvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*]*'.split('');
    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const drops = [];
    for (let x = 0; x < columns; x++) drops[x] = 1;

    const interval = setInterval(() => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0F0';
        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < drops.length; i++) {
            const text = letters[Math.floor(Math.random() * letters.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
    }, 33);

    setTimeout(() => {
        clearInterval(interval);
        canvas.style.opacity = '0';
        canvas.style.transition = 'opacity 2s ease';
        setTimeout(() => {
            if (canvas.parentNode) canvas.remove();
            easterEggActive = false;
        }, 2000);
    }, 6000);
    return true;
}

function triggerBarrelRoll() {
    if (easterEggActive) return false;
    easterEggActive = true;
    document.body.classList.add('barrel-roll-active');
    setTimeout(() => {
        document.body.classList.remove('barrel-roll-active');
        easterEggActive = false;
    }, 4000);
    return true;
}

function triggerCoinFlip() {
    if (easterEggActive) return false;
    easterEggActive = true;

    const coinContainer = document.createElement('div');
    coinContainer.id = 'coin-container';

    const coin = document.createElement('div');
    coin.className = 'coin';

    const heads = document.createElement('div');
    heads.className = 'coin-face coin-heads';
    heads.innerText = '👦';

    const tails = document.createElement('div');
    tails.className = 'coin-face coin-tails';
    tails.innerText = '🪙';

    coin.appendChild(heads);
    coin.appendChild(tails);
    coinContainer.appendChild(coin);
    document.body.appendChild(coinContainer);

    const isHeads = Math.random() > 0.5;
    const spins = 5; // 旋转圈数
    const degrees = spins * 360 + (isHeads ? 0 : 180);

    setTimeout(() => {
        coin.style.transform = `rotateY(${degrees}deg)`;
    }, 100);

    setTimeout(() => {
        setTimeout(() => {
            coinContainer.style.opacity = '0';
            setTimeout(() => {
                if (coinContainer.parentNode) coinContainer.remove();
                easterEggActive = false;
            }, 500);
        }, 2000);
    }, 3100);
    return true;
}

function triggerSnow() {
    if (easterEggActive) return false;
    easterEggActive = true;

    const snowContainer = document.createElement('div');
    snowContainer.id = 'snow-container';
    document.body.appendChild(snowContainer);

    const interval = setInterval(() => {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.innerText = '❄';
        snowflake.style.left = Math.random() * 100 + 'vw';
        snowflake.style.opacity = Math.random() * 0.5 + 0.5;
        snowflake.style.fontSize = (Math.random() * 1 + 0.5) + 'rem';
        snowflake.style.animationDuration = (Math.random() * 3 + 4) + 's';
        snowContainer.appendChild(snowflake);

        setTimeout(() => {
            if (snowflake.parentNode) snowflake.remove();
        }, 7000);
    }, 150);

    setTimeout(() => {
        clearInterval(interval);
        setTimeout(() => {
            if (snowContainer.parentNode) snowContainer.remove();
            easterEggActive = false;
        }, 7000);
    }, 8000); // 持续8秒下雪
    return true;
}

function triggerShake() {
    if (easterEggActive) return false;
    easterEggActive = true;

    document.body.classList.add('shake-active');
    setTimeout(() => {
        document.body.classList.remove('shake-active');
        easterEggActive = false;
    }, 1500); // 震动1.5秒
    return true;
}

function triggerNeon() {
    if (easterEggActive) return false;
    easterEggActive = true;

    const searchContainer = document.getElementById('search-container');
    const bgOverlay = document.querySelector('.bg-overlay');

    searchContainer.classList.add('neon-active');
    if (bgOverlay) bgOverlay.classList.add('neon-bg-active');

    setTimeout(() => {
        searchContainer.classList.remove('neon-active');
        if (bgOverlay) bgOverlay.classList.remove('neon-bg-active');
        easterEggActive = false;
    }, 5000); // 霓虹效果保持5秒
    return true;
}
