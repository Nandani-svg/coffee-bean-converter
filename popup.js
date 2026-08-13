const toggle = document.getElementById('site-toggle');
const hostnameEl = document.getElementById('site-hostname');

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
if (!tab?.url) return;

let hostname;
try { hostname = new URL(tab.url).hostname; } catch { hostname = tab.url; }

hostnameEl.textContent = hostname || '—';

chrome.storage.local.get(['disabledHosts'], (result) => {
const disabled = result.disabledHosts ?? [];
toggle.checked = !disabled.includes(hostname);

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
});