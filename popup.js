const toggle = document.getElementById('site-toggle');
const hostnameEl = document.getElementById('site-hostname');
const threshLow = document.getElementById('thresh-low');
const threshHigh = document.getElementById('thresh-high');

const SAFE_PROTOCOLS = new Set(['http:', 'https:']);

chrome.storage.local.get(['beanThresholds'], (r) => {
if (r.beanThresholds) {
threshLow.value = r.beanThresholds.low;
threshHigh.value = r.beanThresholds.high;
}
});

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
if (!tab?.url) return;

let hostname, canInject;
try {
const u = new URL(tab.url);
hostname = u.hostname;
canInject = SAFE_PROTOCOLS.has(u.protocol);
} catch {
hostname = tab.url;
canInject = false;
}

hostnameEl.textContent = canInject ? (hostname || '—') : 'not available here';

if (!canInject) {
toggle.disabled = true;
toggle.closest('label').style.opacity = '0.3';
} else {
chrome.storage.local.get(['disabledHosts'], (result) => {
toggle.checked = !(result.disabledHosts ?? []).includes(hostname);
toggle.addEventListener('change', () => {
const nowEnabled = toggle.checked;
chrome.storage.local.get(['disabledHosts'], (res) => {
let list = res.disabledHosts ?? [];
list = nowEnabled ? list.filter(h => h !== hostname) : [...new Set([...list, hostname])];
chrome.storage.local.set({ disabledHosts: list }, () => {
chrome.tabs.sendMessage(tab.id, { type: 'BEAN_RATE_TOGGLE', enabled: nowEnabled });
});
});
});
});
}

function saveThresholds() {
const t = {
low: Math.max(1, parseInt(threshLow.value, 10) || 50),
high: Math.max(1, parseInt(threshHigh.value, 10) || 500),
};
chrome.storage.local.set({ beanThresholds: t });
if (canInject) chrome.tabs.sendMessage(tab.id, { type: 'BEAN_RATE_THRESHOLDS', thresholds: t });
}

threshLow.addEventListener('change', saveThresholds);
threshHigh.addEventListener('change', saveThresholds);
});