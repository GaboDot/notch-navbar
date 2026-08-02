/**
 * capture-demo.mjs
 * 
 * Generates screenshots + video demo of the NotchNavbar playground.
 * Uses Playwright (Chromium headless). 
 * Run: node scripts/capture-demo.mjs
 */

import { chromium } from 'playwright';
import { spawn, execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/* ── Paths ────────────────────────────────────────────────────── */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCREENSHOT_DIR = path.join(ROOT, 'screenshots');
const MEDIA_DIR = path.join(ROOT, 'media');
const BASE_URL = 'http://localhost:3000';

/* ── Ensure directories ──────────────────────────────────────── */

mkdirSync(SCREENSHOT_DIR, { recursive: true });
mkdirSync(MEDIA_DIR, { recursive: true });

/* ── Helpers ─────────────────────────────────────────────────── */

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function waitForServer(url, timeoutMs = 60_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryConnect = async () => {
      try {
        const res = await fetch(url);
        if (res.ok || res.status >= 300) {
          // server is responding
          resolve();
          return;
        }
      } catch {
        // not ready yet
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Server at ${url} did not start within ${timeoutMs}ms`));
        return;
      }
      setTimeout(tryConnect, 500);
    };
    tryConnect();
  });
}

/* ── Kill process tree (Windows-compatible) ─────────────────── */

function killProcessTree(proc) {
  try {
    // On Windows, spawn taskkill to kill the process tree
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${proc.pid} /T /F 2>nul`, { stdio: 'ignore' });
    } else {
      proc.kill('SIGTERM');
    }
  } catch {
    // process already dead
  }
}

/* ── Main ────────────────────────────────────────────────────── */

async function main() {
  console.log('[capture] Starting dev server...');

  // Check if dev server already running
  let serverAlreadyRunning = false;
  try {
    const res = await fetch(BASE_URL);
    if (res.ok) {
      serverAlreadyRunning = true;
      console.log('[capture] Dev server already running on', BASE_URL);
    }
  } catch {
    // not running, start it
  }

  let devServer = null;

  if (!serverAlreadyRunning) {
    devServer = spawn('npx', ['next', 'dev', '-p', '3000'], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env },
    });

    devServer.stdout.on('data', (d) => {
      const s = d.toString();
      if (s.includes('Local:')) console.log('[next]', s.trim());
    });
    devServer.stderr.on('data', () => {
      // Next.js logs some things to stderr (warnings etc.), not fatal
    });

    console.log('[capture] Waiting for server ready...');
    await waitForServer(BASE_URL, 90_000);
    console.log('[capture] Server ready.');
  }

  try {
    /* ── Launch browser ─────────────────────────────────────────── */

    console.log('[capture] Launching Chromium...');
    const browser = await chromium.launch({ headless: true });

    /* ══════════════════════════════════════════════════════════════
       SCREENSHOT (a): horizontal default — 5 tabs
       ══════════════════════════════════════════════════════════════ */

    {
      const ctx = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 2,
      });
      const page = await ctx.newPage();
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });

      // Wait for render (react hydration + rAF animation)
      await sleep(2000);

      // Ensure orientation is horizontal (click Horizontal button if needed)
      const horizBtn = page.locator('button', { hasText: 'Horizontal' }).first();
      // CSS modules: check className contains "orientBtnActive" substring
      const isActive = await horizBtn.evaluate((el) =>
        el.className.includes('orientBtnActive')
      );
      if (!isActive) {
        await horizBtn.click();
        await sleep(800);
      }

      // Capture the phone frame (horizontal preview)
      // CSS modules: class gets hashed -> use attribute selector
      const phoneFrame = page.locator('[class*="phoneFrame"]');
      await phoneFrame.waitFor({ state: 'visible', timeout: 5000 });
      await phoneFrame.screenshot({
        path: path.join(SCREENSHOT_DIR, 'horizontal.png'),
      });
      console.log('[capture] ✓ horizontal.png');

      await ctx.close();
    }

    /* ══════════════════════════════════════════════════════════════
       SCREENSHOT (b): vertical orientation
       ══════════════════════════════════════════════════════════════ */

    {
      const ctx = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 2,
      });
      const page = await ctx.newPage();
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await sleep(1500);

      // Click "Vertical" orientation button
      const vertBtn = page.locator('button', { hasText: 'Vertical' }).first();
      await vertBtn.click();
      await sleep(1000);

      // Capture the tablet frame (vertical preview)
      const tabletFrame = page.locator('[class*="tabletFrame"]');
      await tabletFrame.waitFor({ state: 'visible', timeout: 5000 });
      await tabletFrame.screenshot({
        path: path.join(SCREENSHOT_DIR, 'vertical.png'),
      });
      console.log('[capture] ✓ vertical.png');

      await ctx.close();
    }

    /* ══════════════════════════════════════════════════════════════
       SCREENSHOT (c): More card with 7+ tabs
       ══════════════════════════════════════════════════════════════ */

    {
      const ctx = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 2,
      });
      const page = await ctx.newPage();
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await sleep(1500);

      // Increase tab count to 7 (activates More card)
      // Tab Count slider has min=3 attribute (only one matching that)
      const tabCountSlider = page.locator('input[type="range"][min="3"]');
      await tabCountSlider.waitFor({ state: 'visible', timeout: 5000 });

      // Set slider value to 7
      await tabCountSlider.evaluate((el) => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
        ).set;
        nativeInputValueSetter.call(el, '7');
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await sleep(800);

      // Click the "More" tab to open the popover
      const moreBtn = page.locator('button[aria-label="More"]');
      await moreBtn.waitFor({ state: 'visible', timeout: 5000 });
      await moreBtn.click();
      await sleep(600);

      // Capture the More card + surrounding area
      // We want the More card visible — let's screenshot the phoneFrame
      // (the card overlays on top of it)
      const phoneFrame = page.locator('[class*="phoneFrame"]');
      await phoneFrame.screenshot({
        path: path.join(SCREENSHOT_DIR, 'more-card.png'),
      });
      console.log('[capture] ✓ more-card.png');

      await ctx.close();
    }

    /* ══════════════════════════════════════════════════════════════
       VIDEO: interactive demo
       ══════════════════════════════════════════════════════════════ */

    {
      const ctx = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 2,
        recordVideo: {
          dir: MEDIA_DIR,
          size: { width: 1280, height: 900 },
        },
      });
      const page = await ctx.newPage();
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await sleep(1500);

      // ── Scene 1: Tap through 5 tabs horizontally ──────────────
      const tabs = page.locator('[class*="phoneFrame"] button[role="tab"]');
      const tabCount = await tabs.count();
      const tapCount = Math.min(tabCount, 5);

      for (let i = 1; i < tapCount; i++) {
        await tabs.nth(i).click();
        await sleep(600);
      }
      // Tap back to first
      await tabs.nth(0).click();
      await sleep(600);

      // ── Scene 2: Switch to vertical ──────────────────────────
      const vertBtn = page.locator('button', { hasText: 'Vertical' }).first();
      await vertBtn.click();
      await sleep(1200);

      // Tap through vertical tabs
      const vertTabs = page.locator('[class*="tabletFrame"] button[role="tab"]');
      const vertTabCount = await vertTabs.count();
      const vertTapCount = Math.min(vertTabCount, 5);
      for (let i = 1; i < vertTapCount; i++) {
        await vertTabs.nth(i).click();
        await sleep(600);
      }

      // ── Scene 3: Back to horizontal, increase to 7 tabs, show More card ──
      const horizBtn = page.locator('button', { hasText: 'Horizontal' }).first();
      await horizBtn.click();
      await sleep(1000);

      // Slide tab count to 7
      const tabCountSlider = page.locator('input[type="range"][min="3"]');
      await tabCountSlider.evaluate((el) => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
        ).set;
        nativeInputValueSetter.call(el, '7');
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await sleep(800);

      // Click More to open card
      const moreBtn = page.locator('button[aria-label="More"]');
      await moreBtn.click();
      await sleep(800);

      // Click an item inside the More card
      const menuItem = page.locator('[role="menuitem"]').first();
      if (await menuItem.isVisible()) {
        await menuItem.click();
        await sleep(800);
      }

      // Reopen More card, press Escape to close
      await moreBtn.click();
      await sleep(600);
      await page.keyboard.press('Escape');
      await sleep(400);

      // ── Scene 4: Wobble color pickers ──────────────────────────
      // Change Active Icon color to something visible
      const colorInputs = page.locator('input[type="color"]');
      const colorCount = await colorInputs.count();

      if (colorCount >= 1) {
        // Set first color picker (Active Icon) to red
        await colorInputs.nth(0).evaluate((el) => {
          const setter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value'
          ).set;
          setter.call(el, '#ff3b30');
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        });
        await sleep(600);
      }
      if (colorCount >= 4) {
        // Set Bar Background to dark
        await colorInputs.nth(3).evaluate((el) => {
          const setter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value'
          ).set;
          setter.call(el, '#1c1c1e');
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        });
        await sleep(800);
      }

      // ── Scene 5: Final state — horizontal, default look ──────
      // Reset tab count to 5
      await tabCountSlider.evaluate((el) => {
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
        ).set;
        setter.call(el, '5');
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await sleep(600);

      // Reset first color back
      if (colorCount >= 1) {
        await colorInputs.nth(0).evaluate((el) => {
          const setter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value'
          ).set;
          setter.call(el, '#007aff');
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        });
        await sleep(300);
      }
      if (colorCount >= 4) {
        await colorInputs.nth(3).evaluate((el) => {
          const setter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value'
          ).set;
          setter.call(el, '#ffffff');
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        });
        await sleep(600);
      }

      // Tap a couple tabs
      const finalTabs = page.locator('[class*="phoneFrame"] button[role="tab"]');
      const finalCount = await finalTabs.count();
      for (let i = 0; i < Math.min(finalCount, 3); i++) {
        await finalTabs.nth(i).click();
        await sleep(500);
      }

      await sleep(500);

      // Close context to finalize video
      await ctx.close();

      // Rename video from Playwright's auto-generated name to demo.webm
      const { readdirSync, renameSync } = await import('fs');
      const files = readdirSync(MEDIA_DIR);
      const videoFile = files.find((f) => f.endsWith('.webm'));
      if (videoFile) {
        const oldPath = path.join(MEDIA_DIR, videoFile);
        const newPath = path.join(MEDIA_DIR, 'demo.webm');
        renameSync(oldPath, newPath);
        console.log('[capture] ✓ demo.webm');
      } else {
        console.warn('[capture] ⚠ No webm video found in', MEDIA_DIR);
      }
    }

    await browser.close();
    console.log('[capture] Done. Browser closed.');
  } finally {
    /* ── Cleanup: kill dev server if we started it ────────────── */
    if (devServer) {
      console.log('[capture] Stopping dev server...');
      killProcessTree(devServer);
    }
  }

  /* ── Validate generated files ─────────────────────────────────── */

  const { statSync } = await import('fs');
  const files = [
    path.join(SCREENSHOT_DIR, 'horizontal.png'),
    path.join(SCREENSHOT_DIR, 'vertical.png'),
    path.join(SCREENSHOT_DIR, 'more-card.png'),
    path.join(MEDIA_DIR, 'demo.webm'),
  ];

  console.log('\n── File validation ──');
  for (const f of files) {
    if (existsSync(f)) {
      const { size } = statSync(f);
      const sizeKB = (size / 1024).toFixed(1);
      const status = size > 50 * 1024 ? '✓' : size > 1024 ? '⚠ (small)' : '✗ (tiny)';
      console.log(`  ${status} ${path.relative(ROOT, f)} — ${sizeKB} KB`);
    } else {
      console.log(`  ✗ ${path.relative(ROOT, f)} — MISSING`);
    }
  }

  console.log('\n[capture] All done.');
}

main().catch((err) => {
  console.error('[capture] Fatal error:', err);
  process.exit(1);
});
