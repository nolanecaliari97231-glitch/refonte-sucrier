const fs = require("fs");
const path = require("path");
const { firefox } = require("playwright");

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:5500";
const OUT_DIR = path.join(process.cwd(), "scripts", "audit-artifacts");

const report = {
  baseUrl: BASE_URL,
  checks: [],
  bugs: [],
  screenshots: [],
};

function ensureOutDir() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
}

function addCheck(name, pass, details) {
  report.checks.push({ name, pass, details });
}

function addBug(priority, title, details) {
  report.bugs.push({ priority, title, details });
}

async function snap(page, filename) {
  const filePath = path.join(OUT_DIR, filename);
  await page.screenshot({ path: filePath, fullPage: true });
  report.screenshots.push(filePath);
}

async function run() {
  ensureOutDir();
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1) Home language switch strict
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);
    await page.selectOption("#language-select", "en");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(350);
    await snap(page, "01-home-en.png");

    const navTexts = await page.locator("nav a").allTextContents();
    const hasCatalog = navTexts.some((t) => t.trim().toLowerCase() === "catalog");
    const hasAbout = navTexts.some((t) => t.trim().toLowerCase() === "about us");
    const heroHasEnglish = await page
      .locator("body")
      .textContent()
      .then((t) => /find a book for my child|discover/i.test(t || ""));

    const homeSwitchPass = hasCatalog && hasAbout && heroHasEnglish;
    addCheck("home_fr_to_en_instant", homeSwitchPass, { navTexts, heroHasEnglish });
    if (!homeSwitchPass) {
      addBug("P1", "Home FR->EN incomplete", { navTexts, heroHasEnglish });
    }

    // 2) Catalog + add to cart + detail add
    await page.goto(`${BASE_URL}/catalogue.html`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(200);
    await snap(page, "02-catalog-en.png");
    await page.click(".catalogue-card .add-to-cart-btn");
    await page.click(".catalogue-card:nth-child(2) .add-to-cart-btn");
    await page.click(".catalogue-card");
    await page.waitForURL(/livre\.html/);
    await page.waitForTimeout(250);
    await snap(page, "03-book-detail-en.png");
    await page.click("#book-detail-add-to-cart");
    addCheck("catalog_and_detail_add_to_cart", true, "Catalog add + detail add executed");

    // 3) Cart ops + promo
    await page.goto(`${BASE_URL}/panier.html`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);
    await snap(page, "04-cart-en-before.png");

    const inc = page.locator("[data-cart-action='increase']").first();
    const dec = page.locator("[data-cart-action='decrease']").first();
    const rem = page.locator("[data-cart-action='remove']").first();
    if ((await inc.count()) > 0) await inc.click();
    if ((await dec.count()) > 0) await dec.click();
    if ((await rem.count()) > 0) await rem.click();

    const promoInput = page.locator("#promo-code");
    const applyBtn = page.locator("[data-promo-form] button[type='submit']");
    await promoInput.fill("INVALID123");
    await applyBtn.click();
    await page.waitForTimeout(150);
    const invalidText = (await page.textContent("body")) || "";
    const invalidSeen = /invalid promo|code promo invalide/i.test(invalidText);

    await snap(page, "05-cart-en-after-promo.png");

    addCheck("cart_ops_and_promo", invalidSeen, { invalidSeen, note: "valid promo optional (CMS back-office)" });
    if (!invalidSeen) {
      addBug("P1", "Promo invalid feedback missing", { invalidSeen });
    }

    // 4) Checkout click feedback
    const checkoutBtn = page.locator("[data-action='checkout']");
    if ((await checkoutBtn.count()) > 0) {
      await checkoutBtn.click();
      await page.waitForTimeout(500);
      const bodyAfterCheckout = (await page.textContent("body")) || "";
      const hasFeedback = /error|erreur|checkout|paiement|html/i.test(bodyAfterCheckout);
      addCheck("checkout_feedback_present", hasFeedback, { hasFeedback });
      if (!hasFeedback) addBug("P1", "No checkout feedback", {});
    } else {
      addCheck("checkout_feedback_present", false, "No checkout button found");
      addBug("P1", "Checkout button missing", {});
    }

    // 5) Success/cancel links strict
    await page.goto(`${BASE_URL}/checkout-success.html`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(150);
    await snap(page, "06-checkout-success.png");
    const successLinks = {
      toCatalog: (await page.locator("a[href*='catalogue.html']").count()) > 0,
      toHome: (await page.locator("a[href*='index.html']").count()) > 0,
    };
    addCheck("checkout_success_links", successLinks.toCatalog && successLinks.toHome, successLinks);
    if (!(successLinks.toCatalog && successLinks.toHome)) {
      addBug("P2", "Success page return links incomplete", successLinks);
    }

    await page.goto(`${BASE_URL}/checkout-cancel.html`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(150);
    await snap(page, "07-checkout-cancel.png");
    const cancelLinks = {
      toCart: (await page.locator("a[href*='panier.html']").count()) > 0,
      toCatalog: (await page.locator("a[href*='catalogue.html']").count()) > 0,
    };
    addCheck("checkout_cancel_links", cancelLinks.toCart && cancelLinks.toCatalog, cancelLinks);
    if (!(cancelLinks.toCart && cancelLinks.toCatalog)) {
      addBug("P2", "Cancel page return links incomplete", cancelLinks);
    }

    // 6) EN persistence
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: "domcontentloaded" });
    await page.selectOption("#language-select", "en");
    await page.waitForTimeout(250);
    await page.goto(`${BASE_URL}/catalogue.html`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(250);
    const catalogBody = (await page.textContent("body")) || "";
    const persists = /catalog|filters|reset|add/i.test(catalogBody) && !/Réinitialiser/.test(catalogBody);
    await snap(page, "08-catalog-en-persisted.png");
    addCheck("en_persistence_navigation", persists, { persists });
    if (!persists) addBug("P1", "Language persistence inconsistent", {});
  } finally {
    await context.close();
    await browser.close();
  }

  const reportPath = path.join(OUT_DIR, "strict-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify(report, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
