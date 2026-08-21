# Coffee Bean Rate

## What it does

Coffee Bean converter convert prices on shopping pages into coffee beans: `$1 = 1 bean`. It supports USD, EUR, GBP, INR, and JPY, with color coding to make expensive red so you will think twice before buying.

## Install

1. Clone or download this folder.
2. Open `chrome://extensions` in Chrome and enable **Developer mode**.
3. Select **Load unpacked** and choose this project folder.
4. Visit a shopping page such as Amazon or Flipkart then turn on the extension andd now currencys are beans

## Tech behind this

Built with plain HTML, CSS, and JavaScript as a Chrome Manifest V3 extension. It uses content scripts to update page prices and Chrome storage for the per site toggle. There are no external packages, API calls, or tracking.(this extension prices are locked for august 2026)

## Why bean converter?

I was searching for ideas and then i thought why not make a extension which people of #3am can use see how much more bean work they need to do exactly