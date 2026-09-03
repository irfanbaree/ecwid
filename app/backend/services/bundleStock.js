const EFFECTIVELY_UNLIMITED_STOCK = 999999;

// Normalizes a parsed product_ids array so both the old shape (plain numeric
// ids, qty implicitly 1) and the new shape ({ productId, qty }) work the same.
function normalizeChildren(productIds) {
  return (productIds || []).map((entry) => {
    if (entry && typeof entry === 'object') {
      return { productId: entry.productId, qty: Math.max(1, parseInt(entry.qty, 10) || 1) };
    }
    return { productId: entry, qty: 1 };
  });
}

function parseChildren(bundle) {
  let parsed = [];
  try {
    parsed = JSON.parse(bundle.product_ids) || [];
  } catch {
    parsed = [];
  }
  return normalizeChildren(parsed);
}

// Bundle stock = min(floor(childStock / qty)) across non-unlimited children.
// If every child is unlimited (or there are no constraining children), the
// bundle is treated as effectively unlimited.
function computeStock(children, productLookup) {
  let allUnlimited = true;
  const constrained = [];

  for (const child of children) {
    const info = productLookup(child.productId);
    if (!info) continue; // child product missing/unreachable - don't let it block the calc
    if (info.unlimited) continue;
    allUnlimited = false;
    constrained.push(Math.floor(info.quantity / child.qty));
  }

  if (allUnlimited || constrained.length === 0) return EFFECTIVELY_UNLIMITED_STOCK;
  return Math.min(...constrained);
}

// For FIXED bundles: mirrors each child product's own Ecwid Options (Size,
// Color, etc.) onto the bundle as required SELECT dropdowns prefixed with the
// child's name. priceModifier forced to 0 — bundle price is already fixed.
function buildMirroredOptions(children, productsById) {
  const options = [];
  children.forEach((child) => {
    const product = productsById[child.productId];
    if (!product || !Array.isArray(product.options)) return;
    product.options.forEach((option) => {
      if (!Array.isArray(option.choices) || option.choices.length === 0) return;
      options.push({
        name: `${product.name} – ${option.name}`,
        nameTranslated: { en: `${product.name} – ${option.name}` },
        type: option.type || 'SELECT',
        required: true,
        choices: option.choices.map((choice) => ({
          text: choice.text,
          textTranslated: choice.textTranslated || { en: choice.text },
          priceModifier: 0,
          priceModifierType: 'ABSOLUTE',
        })),
      });
    });
  });
  return options;
}

// Expands a single product into its variant choices for use in a flexible
// bundle slot dropdown. Priority:
//   1. Defined combinations (Red-S, Red-M…) — one choice per combo.
//   2. Single option type with choices (e.g. Size: S/M/L) — one choice per value.
//   3. No options / multiple option types without combinations — just product name.
function expandProductChoices(product) {
  const name = product.name;
  if (Array.isArray(product.combinations) && product.combinations.length > 0) {
    return product.combinations.map((combo) => {
      const label = combo.options.map((o) => `${o.name}: ${o.value}`).join(', ');
      return {
        text: `${name} – ${label}`,
        textTranslated: { en: `${name} – ${label}` },
        priceModifier: 0,
        priceModifierType: 'ABSOLUTE',
      };
    });
  }
  if (Array.isArray(product.options) && product.options.length === 1 && product.options[0].choices?.length > 0) {
    const opt = product.options[0];
    return opt.choices.map((choice) => ({
      text: `${name} – ${opt.name}: ${choice.text}`,
      textTranslated: { en: `${name} – ${opt.name}: ${choice.text}` },
      priceModifier: 0,
      priceModifierType: 'ABSOLUTE',
    }));
  }
  return [{ text: name, textTranslated: { en: name }, priceModifier: 0, priceModifierType: 'ABSOLUTE' }];
}

// For FLEXIBLE bundles: creates N SELECT dropdowns (one per slot), labelled
// "Item 1", "Item 2", etc. Each dropdown lists all sub-products, expanded to
// include their variants so the customer picks the exact variant per slot.
function buildSlotOptions(children, productsById) {
  const allChoices = children.flatMap((child) => {
    const product = productsById[child.productId];
    if (!product) return [];
    return expandProductChoices(product);
  });

  if (allChoices.length === 0) return [];

  return children.map((_, index) => ({
    name: `Item ${index + 1}`,
    nameTranslated: { en: `Item ${index + 1}` },
    type: 'SELECT',
    required: true,
    choices: allChoices,
  }));
}

function createBundleStockService({ Bundle, Token, Notification, axios, ECDWID_API_URL }) {
  async function resolveAccessToken(storeId) {
    const tokenRecord = await Token.findOne({ where: { store_id: storeId } });
    if (!tokenRecord) return null;

    let details = tokenRecord.details;
    // `details` has historically been stored double-JSON-encoded; unwrap defensively.
    for (let i = 0; i < 2 && typeof details === 'string'; i++) {
      try {
        details = JSON.parse(details);
      } catch {
        break;
      }
    }
    return details && details.access_token ? details.access_token : null;
  }

  async function getEcwidProduct(storeId, productId, accessToken) {
    const response = await axios.get(
      `${ECDWID_API_URL}/${storeId}/products/${productId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return response.data;
  }

  async function pushBundleStock(storeId, bundle, stock, accessToken) {
    const unlimited = stock >= EFFECTIVELY_UNLIMITED_STOCK;
    await axios.put(
      `${ECDWID_API_URL}/${storeId}/products/${bundle.ecwid_id}`,
      { quantity: unlimited ? 0 : stock, unlimited },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    await bundle.update({ stock });
  }

  async function notifyLowStock(storeId, label, stock) {
    if (stock > 1) return;
    const details = stock === 0 ? `${label} is out of stock` : `Stock status of ${label} has reduced to 1`;
    await Notification.create({ details, read_flag: false, store_id: storeId });
  }

  async function syncBundleStock(storeId, bundle, accessToken) {
    const children = parseChildren(bundle);
    if (children.length === 0) return bundle.stock;

    const productInfos = await Promise.all(
      children.map((child) => getEcwidProduct(storeId, child.productId, accessToken).catch(() => null))
    );

    const lookup = {};
    children.forEach((child, i) => {
      const info = productInfos[i];
      if (info) lookup[child.productId] = { quantity: info.quantity, unlimited: info.unlimited };
    });

    const stock = computeStock(children, (id) => lookup[id]);
    await pushBundleStock(storeId, bundle, stock, accessToken);
    await notifyLowStock(storeId, bundle.name, stock);
    return stock;
  }

  async function decrementChildrenForSale(storeId, bundle, soldQty, accessToken) {
    const children = parseChildren(bundle);
    await Promise.all(
      children.map(async (child) => {
        const info = await getEcwidProduct(storeId, child.productId, accessToken).catch(() => null);
        if (!info || info.unlimited) return;
        const newQuantity = Math.max(0, info.quantity - child.qty * soldQty);
        await axios.put(
          `${ECDWID_API_URL}/${storeId}/products/${child.productId}`,
          { quantity: newQuantity },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
      })
    );
  }

  async function findBundlesContainingProduct(storeId, productId) {
    const bundles = await Bundle.findAll({ where: { store_id: storeId } });
    return bundles.filter((bundle) =>
      parseChildren(bundle).some((child) => String(child.productId) === String(productId))
    );
  }

  return {
    resolveAccessToken,
    getEcwidProduct,
    pushBundleStock,
    syncBundleStock,
    decrementChildrenForSale,
    findBundlesContainingProduct,
  };
}

module.exports = {
  EFFECTIVELY_UNLIMITED_STOCK,
  normalizeChildren,
  parseChildren,
  computeStock,
  buildMirroredOptions,
  buildSlotOptions,
  createBundleStockService,
};
