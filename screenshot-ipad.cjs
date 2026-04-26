const puppeteer = require('C:\\Users\\Anteika\\AppData\\Local\\Temp\\ss-tool\\node_modules\\puppeteer-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 820, height: 1180, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle2', timeout: 15000 });
  await sleep(3000);

  // debug: what are the actual computed styles?
  const debug = await page.evaluate(() => {
    const heroText = document.querySelector('.hero-text');
    const timeline = document.querySelector('.hero-timeline');
    const rfCard = document.querySelector('.rf-mobile .rf-card');
    const rfCardText = document.querySelector('.rf-mobile .rf-card-text');
    const cs = el => el ? {
      left: window.getComputedStyle(el).left,
      bottom: window.getComputedStyle(el).bottom,
      transform: window.getComputedStyle(el).transform,
      textAlign: window.getComputedStyle(el).textAlign,
      flexDirection: window.getComputedStyle(el).flexDirection,
      fontSize: window.getComputedStyle(el).fontSize,
    } : 'not found';
    return {
      heroText: cs(heroText),
      timeline: cs(timeline),
      rfCard: rfCard ? { aspectRatio: window.getComputedStyle(rfCard).aspectRatio } : 'not found',
      rfCardText: rfCardText ? { fontSize: window.getComputedStyle(rfCardText).fontSize, webkitLineClamp: window.getComputedStyle(rfCardText).webkitLineClamp } : 'not found',
    };
  });
  console.log(JSON.stringify(debug, null, 2));

  await page.screenshot({ path: 'ipad-debug.png' });
  await page.evaluate(() => document.querySelectorAll('.scene')[2]?.scrollIntoView());
  await sleep(1500);
  await page.screenshot({ path: 'ipad-reviews-debug.png' });

  await browser.close();
})().catch(e => console.error(e.message));
