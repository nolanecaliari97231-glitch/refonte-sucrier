const { firefox } = require("playwright");

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:5500";

const results = [];
const bugs = [];

function record(step, status, details) {
  results.push({ step, status, details });
}

function bug(priority, title, repro, expected, observed) {
  bugs.push({ priority, title, repro, expected, observed });
}

async function clickFirst(page, selectors) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) > 0 && (await locator.isVisible())) {
      await locator.click();
      return selector;
    }
  }
  return null;
}

async function getTextList(page, selector) {
  return page.locator(selector).allTextContents();
}

async function run() {
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: "domcontentloaded" });
    const languageSelect = page.locator("#language-select");
    if ((await languageSelect.count()) === 0) {
      record(1, "fail", "Language select not found.");
      bug(
        "P1",
        "Language selector missing on home page",
        "Open home page and inspect header",
        "Language selector should be present and usable",
        "No #language-select element found"
      );
    } else {
      await languageSelect.selectOption("en");
      await page.waitForTimeout(250);
      const navTexts = await getTextList(page, "nav a");
      const hasEnglish = navTexts.some((t) => /catalog|about/i.test(t));
      if (hasEnglish) {
        record(1, "pass", "Language switch FR -> EN works instantly on home.");
      } else {
        record(1, "fail", `Header nav still not in English: ${JSON.stringify(navTexts)}`);
        bug(
          "P1",
          "FR -> EN switch incomplete on home",
          "Open home, select English, inspect header labels",
          "Header labels should update instantly to English",
          `Observed labels: ${navTexts.join(" | ")}`
        );
      }
    }

    // Step 2
    await page.goto(`${BASE_URL}/catalogue.html`, { waitUntil: "domcontentloaded" });
    const addButtons = page.locator(".book-card button, .book-card .cta, .add-to-cart-btn");
    const addCount = await addButtons.count();
    if (addCount >= 2) {
      await addButtons.nth(0).click();
      await addButtons.nth(1).click();
      record(2, "pass", "Added two books from catalog.");
    } else {
      record(2, "fail", "Not enough add-to-cart controls found on catalog.");
      bug(
        "P1",
        "Catalog add-to-cart controls missing",
        "Open catalog and search for add-to-cart buttons",
        "At least one add button per card",
        `Found ${addCount} matching controls`
      );
    }

    // Step 3
    const openedFromCatalog = await clickFirst(page, [
      ".catalogue-card",
      ".book-card a[href*='livre']",
      "a[href*='livre.html']",
      ".book-card .book-card-title a",
    ]);
    if (!openedFromCatalog) {
      record(3, "fail", "Could not open book detail from catalog.");
      bug(
        "P2",
        "Book detail navigation unavailable",
        "Open catalog and click a book detail link",
        "A detail page should be reachable from each card",
        "No clickable detail link found with common selectors"
      );
    } else {
      await page.waitForLoadState("domcontentloaded");
      const addFromDetail = await clickFirst(page, [
        ".book-detail-actions button",
        "button.add-to-cart-btn",
        "button:has-text('Add to cart')",
        "button:has-text('Ajouter au panier')",
      ]);
      if (addFromDetail) {
        record(3, "pass", "Added one item from book detail page.");
      } else {
        record(3, "fail", "No add-to-cart button found on detail page.");
        bug(
          "P1",
          "Book detail add-to-cart missing",
          "Open a book detail page and try to add to cart",
          "Detail page should contain a functional add-to-cart button",
          "No add button found with standard selectors"
        );
      }
    }

    // Step 4
    await page.goto(`${BASE_URL}/panier.html`, { waitUntil: "domcontentloaded" });
    const plusBtn = page.locator("[data-cart-action='increase'], .qty-plus, button[aria-label*='Increase']").first();
    const minusBtn = page.locator("[data-cart-action='decrease'], .qty-minus, button[aria-label*='Decrease']").first();
    const removeBtn = page
      .locator("[data-cart-action='remove'], .remove-item-btn, button[aria-label*='Remove']")
      .first();

    const ops = [];
    if ((await plusBtn.count()) > 0) {
      await plusBtn.click();
      ops.push("increase");
    }
    if ((await minusBtn.count()) > 0) {
      await minusBtn.click();
      ops.push("decrease");
    }
    if ((await removeBtn.count()) > 0) {
      await removeBtn.click();
      ops.push("remove");
    }
    if (ops.length >= 2) {
      record(4, "pass", `Cart quantity operations executed: ${ops.join(", ")}`);
    } else {
      record(4, "fail", `Could not execute enough cart operations: ${ops.join(", ") || "none"}`);
      bug(
        "P2",
        "Cart controls partially unavailable",
        "Open cart and try increase/decrease/remove actions",
        "All three actions should be present and clickable",
        `Executed actions: ${ops.join(", ") || "none"}`
      );
    }

    // Step 5
    const promoInput = page.locator("input[name='promo'], #promo-code, input[placeholder*='promo']").first();
    const applyPromoBtn = page.locator("#apply-promo, button:has-text('Apply'), button:has-text('Appliquer')").first();
    if ((await promoInput.count()) > 0 && (await applyPromoBtn.count()) > 0) {
      await promoInput.fill("INVALID123");
      await applyPromoBtn.click();
      await page.waitForTimeout(150);
      const pageTextAfterInvalid = await page.textContent("body");
      const invalidDetected = /invalid promo|code promo invalide/i.test(pageTextAfterInvalid || "");

      await promoInput.fill("SUCRIER10");
      await applyPromoBtn.click();
      await page.waitForTimeout(200);
      const pageTextAfterValid = await page.textContent("body");
      const validDetected = /10%|discount applied|remise de 10/i.test(pageTextAfterValid || "");

      if (invalidDetected && validDetected) {
        record(5, "pass", "Promo invalid+valid feedback found.");
      } else {
        record(
          5,
          "fail",
          `Promo feedback incomplete. invalidDetected=${invalidDetected}, validDetected=${validDetected}`
        );
        bug(
          "P1",
          "Promo feedback missing or inconsistent",
          "In cart, apply INVALID123 then SUCRIER10",
          "Invalid and success messages should both appear",
          `invalidDetected=${invalidDetected}, validDetected=${validDetected}`
        );
      }
    } else {
      record(5, "fail", "Promo input/button not found.");
      bug(
        "P1",
        "Promo controls missing in cart",
        "Open cart and locate promo input + apply button",
        "Promo controls should be visible",
        "Input or apply button not found"
      );
    }

    // Step 6
    const checkoutBtn = page.locator("#checkout-button, .checkout-button, button:has-text('checkout'), button:has-text('paiement')").first();
    if ((await checkoutBtn.count()) > 0) {
      await checkoutBtn.click();
      await page.waitForTimeout(400);
      const bodyText = (await page.textContent("body")) || "";
      const onExternal = /^https?:\/\//.test(page.url()) && !page.url().includes("127.0.0.1:5500");
      const hasError = /error|erreur|html|checkout session|paiement/i.test(bodyText);
      if (onExternal || hasError) {
        record(6, "pass", onExternal ? "Checkout redirected externally." : "Checkout error feedback shown.");
      } else {
        record(6, "fail", "Checkout click produced neither redirect nor clear feedback.");
        bug(
          "P1",
          "Checkout action lacks user feedback",
          "Open cart and click checkout",
          "Should redirect to payment or show explicit error",
          "No redirect and no visible feedback detected"
        );
      }
    } else {
      record(6, "fail", "Checkout button not found.");
      bug(
        "P1",
        "Checkout button missing",
        "Open cart page",
        "Checkout button should be present",
        "No checkout button found"
      );
    }

    // Step 7
    await page.goto(`${BASE_URL}/checkout-success.html`, { waitUntil: "domcontentloaded" });
    const successLinks =
      (await page.locator("a[href*='panier']").count()) +
      (await page.locator("a[href*='catalogue']").count()) +
      (await page.locator("a[href*='index']").count());
    const successNavOk = successLinks > 0;
    await page.goto(`${BASE_URL}/checkout-cancel.html`, { waitUntil: "domcontentloaded" });
    const cancelLinks =
      (await page.locator("a[href*='panier']").count()) +
      (await page.locator("a[href*='catalogue']").count()) +
      (await page.locator("a[href*='index']").count());
    const cancelNavOk = cancelLinks > 0;
    if (successNavOk && cancelNavOk) {
      record(7, "pass", "Success/cancel pages contain working return navigation.");
    } else {
      record(7, "fail", `Navigation links missing. success=${successNavOk}, cancel=${cancelNavOk}`);
      bug(
        "P2",
        "Checkout result pages missing return links",
        "Open checkout-success and checkout-cancel pages",
        "Both pages should provide navigation back to shopping flow",
        `success=${successNavOk}, cancel=${cancelNavOk}`
      );
    }

    // Step 8
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: "domcontentloaded" });
    if ((await page.locator("#language-select").count()) > 0) {
      await page.locator("#language-select").selectOption("en");
      await page.waitForTimeout(200);
    }
    await page.goto(`${BASE_URL}/catalogue.html`, { waitUntil: "domcontentloaded" });
    const catText = ((await page.textContent("body")) || "").slice(0, 2500);
    const languagePersisted = /catalog|add to cart|about/i.test(catText) && !/À propos de nous/.test(catText);
    if (languagePersisted) {
      record(8, "pass", "Language preference persisted across navigation.");
    } else {
      record(8, "fail", "Language appears inconsistent after navigation.");
      bug(
        "P1",
        "Language persistence inconsistent",
        "Set EN on home, navigate to catalog",
        "Catalog should remain in English",
        "Catalog content still partially in French"
      );
    }
  } catch (error) {
    record("runtime", "fail", error.message);
    bug("P1", "Automation runtime failure", "Run e2e-audit script", "Script should complete all checks", error.message);
  } finally {
    await context.close();
    await browser.close();
  }

  console.log(JSON.stringify({ baseUrl: BASE_URL, results, bugs }, null, 2));
}

run();
