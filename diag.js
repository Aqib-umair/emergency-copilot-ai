const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const context = browser.defaultBrowserContext();
  await context.overridePermissions('http://localhost:3000', ['geolocation']);
  const page = await browser.newPage();
  await page.setGeolocation({latitude: 40.7128, longitude: -74.0060});
  
  let errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  let tilesLoaded = 0;
  let tilesFailed = 0;
  page.on('requestfinished', req => {
    if (req.url().includes('openstreetmap.org')) {
      const status = req.response()?.status();
      if (status === 200) tilesLoaded++;
    }
  });
  page.on('requestfailed', req => {
    if (req.url().includes('openstreetmap.org')) tilesFailed++;
  });

  await page.goto('http://localhost:3000/hospital-finder', {waitUntil: 'domcontentloaded'});
  
  await new Promise(r => setTimeout(r, 4000));
  
  const diagnostic = await page.evaluate(() => {
    const mapEl = document.querySelector('.leaflet-container');
    const container = mapEl ? mapEl.parentElement : null;
    const markers = document.querySelectorAll('.leaflet-marker-icon').length;
    
    return {
      rendered: !!mapEl,
      width: mapEl ? mapEl.clientWidth : 0,
      height: mapEl ? mapEl.clientHeight : 0,
      parentWidth: container ? container.clientWidth : 0,
      parentHeight: container ? container.clientHeight : 0,
      mapDisplay: mapEl ? window.getComputedStyle(mapEl).display : 'N/A',
      parentDisplay: container ? window.getComputedStyle(container).display : 'N/A',
      parentPosition: container ? window.getComputedStyle(container).position : 'N/A',
      markers: markers,
    };
  });
  
  console.log('--- DIAGNOSTIC RESULTS ---');
  console.log('1. Rendering:', diagnostic.rendered);
  console.log('3. Tiles loaded (HTTP 200):', tilesLoaded);
  console.log('3b. Tiles failed:', tilesFailed);
  console.log('4. Map Size:', diagnostic.width, 'x', diagnostic.height);
  console.log('4b. Parent Size:', diagnostic.parentWidth, 'x', diagnostic.parentHeight);
  console.log('5. Errors:', errors);
  console.log('6. Markers created:', diagnostic.markers);
  console.log('7. Map display:', diagnostic.mapDisplay, '| Parent:', diagnostic.parentDisplay, '| Parent Pos:', diagnostic.parentPosition);
  
  await browser.close();
})();
