export const CONFIG = {
    MAX_FILE_SIZE: 3 * 1024 * 1024,
    DEBOUNCE_DELAY: 200,
    ANIMATION_DURATION: 300,
    DEFAULT_ICON_SIZE: 48,
    STORAGE_KEY: 'prism_start_data'
};

export const icons = {
    search_icon: 'assets/icons_search/search_Search.svg',
    default: 'assets/icons_search/default_Search.svg',
    "必应": "assets/icons_search/bing_Search.svg",
    "百度": "assets/icons_search/baidu_Search.svg",
    "谷歌": "assets/icons_search/google_Search.svg",
    "bilibili": "assets/icons_search/bilibili_Search.svg"
};

export const defaultCategories = [
    {
        title: "网页",
        engines: [
            { name: "必应", url: "https://www.bing.com/search?q=", iconType: 'svg' },
            { name: "百度", url: "https://www.baidu.com/s?wd=", iconType: 'svg' },
            { name: "谷歌", url: "https://www.google.com/search?q=", iconType: 'svg' }
        ]
    },
    {
        title: "视频",
        engines: [
            { name: "Bilibili", url: "https://search.bilibili.com/all?keyword=", iconType: 'svg' }
        ]
    }
];

export const defaultSites = [
    { name: "哔哩哔哩", url: "https://www.bilibili.com" },
    { name: "GitHub", url: "https://github.com" },
    { name: "知乎", url: "https://www.zhihu.com" },
    { name: "微博", url: "https://weibo.com" }
];

export const defaultBg = "https://bing.biturl.top/?resolution=1920&format=image&index=0&mkt=zh-CN";

export const wallpaperSources = {
    bing: {
        name: '必应每日',
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
        name: '渐变色',
        urls: [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
            'linear-gradient(135deg, #0c3483 0%, #a2b6df 100%)',
            'linear-gradient(135deg, #f5af19 0%, #f12711 100%)'
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
