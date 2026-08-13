(() => {
 const RATE_TO_USD = {
USD: 1,
EUR: 1.1542,
GBP: 1.3499,
INR: 0.010484,
JPY: 0.0063,
 };

 const BEAN_IMG_URL = chrome.runtime.getURL('icons/bean.jpg');
 const BEAN_IMG =  `<img src="${BEAN_IMG_URL}" width="18" height="18" alt="bean" style="display:inline;vertical-align:middle;margin:0 2px 1px 2px;border-radius:2px;">`;
 
 const PRICE_REGEX =  /(\$|USD\s*|EUR\s*|€\s*|GBP\s*|£\s*|INR\s*|₹\s*|JPY\s*|¥\s*)([\d,]+(?:\.\d{1,2})?)/g;



 const PRICE_REGEX_EL =  /(\$|USD\s*|EUR\s*|€\s*|GBP\s*|£\s*|INR\s*|₹\s*|JPY\s*|¥\s*)((?:[\d]{1,3}(?:,[\d]{2,3})+|\d+)(?:\.\d{1,2})?)/g;

 const SYMBOL_TO_CURRENCY = {
"$": 'USD', 'USD': 'USD',
'€': 'EUR', 'EUR': 'EUR',
'£': 'GBP', 'GBP': 'GBP',
'₹': 'INR', 'INR': 'INR',
'¥': 'JPY', 'JPY': 'JPY',
};

const PROCESSED_ATTR = 'data-bean-rate-done';
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'CODE', 'PRE', 'HEAD']);

function parseCurrency(raw) {
return SYMBOL_TO_CURRENCY[raw.trim()] || 'USD';
}

function toBeans(amount, currency) {
return Math.ceil(amount * (RATE_TO_USD[currency] ?? 1));
}

function makeBeanSpan(beans) {
const span = document.createElement('span');
span.setAttribute(PROCESSED_ATTR, '1');
span.style.cssText = 'font-size:0.85em;color:#c88a4a;white-space:nowrap;font-weight:500;display:inline;';
span.innerHTML = `\u202F${BEAN_IMG}<span style="vertical-align:middle">\u00D7${beans}</span>`;
return span;
}

function injectBeans(textNode) {
const text = textNode.nodeValue;
if(!text) return;
PRICE_REGEX.lastIndex = 0;
if (!PRICE_REGEX.test(text)) return;
PRICE_REGEX.lastIndex = 0;

const fraq = document.createDocumentFragment();
let lastIndex = 0;
let match;

while ((match = PRICE_REGEX.exec(text)) !== null) {
const [full, symbolRaw, numStr] = match;
if (match.index > lastIndex) fraq.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
fraq.appendChild(document.createTextNode(full));
fraq.appendChild(makeBeanSpan(toBeans(parseFloat(numStr.replace(/,/g, '')), parseCurrency(symbolRaw))));
lastIndex = match.index + full.length;
}

if (lastIndex < text.length) fraq.appendChild(document.createTextNode(text.slice(lastIndex)));

const wrapper = document.createElement('span');
wrapper.setAttribute(PROCESSED_ATTR, '1');
wrapper.appendChild(fraq);
textNode.parentNode.replaceChild(wrapper, textNode);
}

function processTextNodes(node) {
if (node.nodeType === Node.TEXT_NODE) {
if (node.parentElement?.closest(`[${PROCESSED_ATTR}]`)) return;
injectBeans(node);
return;
}
if (node.nodeType !== Node.ELEMENT_NODE) return;
if (SKIP_TAGS.has(node.tagName) || node.hasAttribute(PROCESSED_ATTR)) return;
const children = Array.from(node.childNodes);
for(const child of children) processTextNodes(child);
}

function processElementPrices(root) {
const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
acceptNode(el) {
if (SKIP_TAGS.has(el.tagName)) return NodeFilter.FILTER_REJECT;
if (el.hasAttribute(PROCESSED_ATTR)) return NodeFilter.FILTER_REJECT;
return NodeFilter.FILTER_ACCEPT;
},
});

let el;
while ((el = walker.nextNode())) {
if (el.closest(`[${PROCESSED_ATTR}]`)) continue;
if (el.querySelector(`[${PROCESSED_ATTR}]`)) continue;

const text = el.textContent.trim();
if (!text || text.length > 60) continue;

PRICE_REGEX_EL.lastIndex = 0;
const match = PRICE_REGEX_EL.exec(text);
PRICE_REGEX_EL.lastIndex = 0;
if (!match) continue;
if (match[0].length / text.length < 0.35) continue;

el.setAttribute(PROCESSED_ATTR, '1');
el.parentNode?.insertBefore(
makeBeanSpan(toBeans(parseFloat(match[2].replace(/,/g, '')), parseCurrency(match[1]))),
el.nextSibling
);
}
}

let enabled = true;

function run() {
if (!enabled) return;
processTextNodes(document.body);
processElementPrices(document.body);
}

const observer = new MutationObserver((mutations) => {
if (!enabled) return;
for (const mutation of mutations) {
for (const node of mutation.addedNodes) {
if (node.nodeType === Node.ELEMENT_NODE && node.hasAttribute(PROCESSED_ATTR)) continue;
processTextNodes(node);
if (node.nodeType === Node.ELEMENT_NODE) processElementPrices(node);
}
}
});

function startObserver() {
observer.observe(document.body, { childList: true, subtree: true });
}

chrome.runtime.onMessage.addListener((msg) => {
if (msg.type !== 'BEAN_RATE_TOGGLE') return;
enabled = msg.enabled;
if (enabled) { run(); startObserver(); } else { observer.disconnect(); }
});

chrome.storage.local.get(['disabledHosts'], (result) => {
    if ((result.disabledHosts ?? []).includes(location.hostname)) { enabled = false; return; }
    run();
    startObserver();
  });
})();