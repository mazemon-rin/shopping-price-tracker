const STORAGE_KEY = "shoppingPriceTracker.v1";

const PRODUCT_CATEGORIES = [
  "野菜",
  "果物",
  "肉類",
  "魚介類",
  "卵・乳製品",
  "米・パン・麺",
  "飲料",
  "調味料",
  "冷凍食品",
  "お菓子",
  "日用品",
  "その他"
];

const CATEGORY_RULES = [
  { category: "野菜", keywords: ["キャベツ", "白菜", "レタス", "トマト", "きゅうり", "キュウリ", "玉ねぎ", "玉葱", "にんじん", "人参", "じゃがいも", "ジャガイモ", "大根", "ピーマン"] },
  { category: "果物", keywords: ["りんご", "リンゴ", "バナナ", "みかん", "ぶどう", "ブドウ", "いちご", "苺"] },
  { category: "肉類", keywords: ["牛肉", "豚肉", "鶏肉", "ひき肉", "挽肉", "ハム", "ソーセージ"] },
  { category: "魚介類", keywords: ["鮭", "サケ", "シャケ", "サバ", "さば", "まぐろ", "マグロ", "刺身", "えび", "エビ", "海老", "いか", "イカ", "たこ", "タコ"] },
  { category: "卵・乳製品", keywords: ["卵", "たまご", "玉子", "牛乳", "チーズ", "ヨーグルト", "バター"] },
  { category: "米・パン・麺", keywords: ["米", "食パン", "パン", "うどん", "そば", "蕎麦", "ラーメン", "パスタ", "スパゲッティ"] },
  { category: "飲料", keywords: ["水", "お茶", "茶", "コーヒー", "珈琲", "ジュース", "炭酸", "サイダー", "スポーツドリンク"] },
  { category: "調味料", keywords: ["醤油", "しょうゆ", "味噌", "みそ", "砂糖", "塩", "酢", "みりん", "ソース", "マヨネーズ", "ケチャップ"] },
  { category: "冷凍食品", keywords: ["冷凍食品", "冷凍", "アイス", "餃子", "ぎょうざ", "チャーハン", "炒飯"] },
  { category: "お菓子", keywords: ["ポテトチップス", "チップス", "チョコ", "チョコレート", "せんべい", "煎餅", "クッキー", "飴", "あめ", "グミ"] },
  { category: "日用品", keywords: ["ティッシュ", "洗剤", "シャンプー", "歯磨き粉", "歯みがき粉", "トイレットペーパー"] }
];

const OPEN_FOOD_FACTS_SEARCH_TERMS = {
  "カルビー": "calbee",
  "ポテトチップス": "potato chips chips crisps",
  "ポテチ": "potato chips chips crisps",
  "チョコ": "chocolate",
  "チョコレート": "chocolate",
  "クッキー": "cookie biscuit",
  "ビスケット": "biscuit",
  "コーヒー": "coffee",
  "ジュース": "juice",
  "お茶": "tea",
  "水": "water",
  "牛乳": "milk",
  "ヨーグルト": "yogurt",
  "チーズ": "cheese",
  "ラーメン": "ramen noodles",
  "カップ麺": "instant noodles",
  "パスタ": "pasta",
  "ソース": "sauce",
  "ケチャップ": "ketchup",
  "マヨネーズ": "mayonnaise"
};

const OPEN_FOOD_FACTS_BASE_URLS = [
  "https://world.openfoodfacts.org",
  "https://jp.openfoodfacts.org"
];

const state = loadState();
let openFoodFactsCandidates = [];
let nearbyStoreCandidates = [];
let nearbyStorePage = 0;
let barcodeStream = null;
let barcodeScanTimer = null;
let zxingCodeReader = null;
let barcodeDetector = null;
let barcodeScanBusy = false;
let barcodeCandidate = "";
let barcodeCandidateCount = 0;
let barcodeCandidateLastSeen = 0;
let pendingBarcode = "";
let barcodeVideoTrack = null;
let barcodeTorchEnabled = false;

const els = {
  tabs: document.querySelectorAll(".tab-button"),
  panels: document.querySelectorAll(".tab-panel"),
  countProducts: document.getElementById("countProducts"),
  countStores: document.getElementById("countStores"),
  countPrices: document.getElementById("countPrices"),
  quickForm: document.getElementById("quickForm"),
  productForm: document.getElementById("productForm"),
  storeForm: document.getElementById("storeForm"),
  priceForm: document.getElementById("priceForm"),
  quickRecentList: document.getElementById("quickRecentList"),
  productList: document.getElementById("productList"),
  storeList: document.getElementById("storeList"),
  priceList: document.getElementById("priceList"),
  bestPriceList: document.getElementById("bestPriceList"),
  priceProduct: document.getElementById("priceProduct"),
  priceStore: document.getElementById("priceStore"),
  chartProduct: document.getElementById("chartProduct"),
  trendChart: document.getElementById("trendChart"),
  storeChart: document.getElementById("storeChart")
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("quickPriceDate").value = today();
  document.getElementById("priceDate").value = today();
  bindEvents();
  renderBarcodeHelp();
  render();
});

function bindEvents() {
  els.tabs.forEach((button) => {
    button.addEventListener("click", () => showTab(button.dataset.tab));
  });

  els.quickForm.addEventListener("submit", saveQuickEntry);
  els.productForm.addEventListener("submit", saveProduct);
  els.storeForm.addEventListener("submit", saveStore);
  els.priceForm.addEventListener("submit", savePrice);
  document.getElementById("quickProductName").addEventListener("input", handleQuickProductNameInput);
  document.getElementById("quickProductName").addEventListener("focus", renderProductSuggestions);
  document.getElementById("quickProductName").addEventListener("change", handleQuickProductNameInput);
  document.getElementById("quickPriceStore").addEventListener("input", clearNearbyStoreResults);
  document.getElementById("quickPriceStore").addEventListener("change", clearNearbyStoreResults);
  document.getElementById("quickProductCategory").addEventListener("input", markQuickCategoryEdited);
  document.getElementById("searchOpenFoodFacts").addEventListener("click", searchOpenFoodFacts);
  document.getElementById("findNearbyStores").addEventListener("click", findNearbyStores);
  document.getElementById("findStoresByAddress").addEventListener("click", findStoresByAddress);
  document.getElementById("scanBarcode").addEventListener("click", startBarcodeScan);
  document.getElementById("stopBarcodeScan").addEventListener("click", () => stopBarcodeScan(true));
  document.getElementById("lookupBarcode").addEventListener("click", lookupBarcodeProduct);
  document.getElementById("barcodeImage").addEventListener("change", readBarcodeFromImage);
  document.getElementById("confirmBarcodeSearch").addEventListener("click", confirmDetectedBarcode);
  document.getElementById("retryBarcodeScan").addEventListener("click", retryBarcodeScan);
  document.getElementById("toggleBarcodeTorch").addEventListener("click", toggleBarcodeTorch);
  document.getElementById("barcodeZoom").addEventListener("input", updateBarcodeZoom);
  document.getElementById("productName").addEventListener("input", suggestProductCategory);
  document.getElementById("productCategory").addEventListener("input", markProductCategoryEdited);
  bindNumericInputNormalization();

  document.getElementById("resetQuick").addEventListener("click", resetQuickForm);
  document.getElementById("resetProduct").addEventListener("click", resetProductForm);
  document.getElementById("resetStore").addEventListener("click", resetStoreForm);
  document.getElementById("resetPrice").addEventListener("click", resetPriceForm);
  document.getElementById("clearAll").addEventListener("click", clearAllData);
  document.getElementById("importCsv").addEventListener("click", importCsv);
  els.chartProduct.addEventListener("change", drawCharts);

  document.querySelectorAll("[data-export]").forEach((button) => {
    button.addEventListener("click", () => exportCsv(button.dataset.export));
  });
}

function renderBarcodeHelp() {
  const help = document.getElementById("barcodeHelp");
  if (!help) return;
  if (isIphoneSafari()) {
    help.textContent = "iPhoneのSafariではバーコード読み取りが動かない場合があります。読み取りはChromeで開くか、バーコード番号を手入力して「バーコードで検索」を使ってください。";
  } else {
    help.textContent = "読み取れない場合は、バーコード番号を手入力して「バーコードで検索」を使えます。";
  }
}

function isIphoneSafari() {
  const ua = navigator.userAgent;
  const isIphoneOrIpad = /iPhone|iPad|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIphoneOrIpad && isSafari;
}

function loadState() {
  const fallback = { products: [], stores: [], prices: [] };
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || fallback;
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function yen(value) {
  if (value === null || value === undefined || value === "") return "-";
  return `${Number(value).toLocaleString("ja-JP")}円`;
}

function yenDecimal(value) {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) return "-";
  return `${Number(value).toLocaleString("ja-JP", { maximumFractionDigits: 2 })}円`;
}

function text(value) {
  return value && String(value).trim() ? String(value).trim() : "-";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function showTab(tabId) {
  els.tabs.forEach((button) => button.classList.toggle("active", button.dataset.tab === tabId));
  els.panels.forEach((panel) => panel.classList.toggle("active", panel.id === tabId));
  if (tabId === "charts") drawCharts();
}

function render() {
  els.countProducts.textContent = state.products.length;
  els.countStores.textContent = state.stores.length;
  els.countPrices.textContent = state.prices.length;
  renderSelectors();
  renderProducts();
  renderStores();
  renderPrices();
  renderQuickRecent();
  renderBestPrices();
  drawCharts();
  saveState();
}

function renderSelectors() {
  fillSelect(els.priceProduct, state.products, "商品を選択");
  fillSelect(els.priceStore, state.stores, "店舗を選択");
  fillSelect(els.chartProduct, state.products, "商品を選択");
  renderProductNameOptions();
  renderStoreNameOptions();
}

function fillSelect(select, items, placeholder) {
  const current = select.value;
  select.innerHTML = `<option value="">${placeholder}</option>` + items
    .map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`)
    .join("");
  if (items.some((item) => item.id === current)) select.value = current;
}

function renderProductNameOptions() {
  document.getElementById("productNameOptions").innerHTML = state.products
    .map((item) => `<option value="${escapeHtml(item.name)}">`)
    .join("");
  renderProductSuggestions();
}

function renderStoreNameOptions() {
  document.getElementById("storeNameOptions").innerHTML = state.stores
    .map((item) => `<option value="${escapeHtml(item.name)}">`)
    .join("");
}

async function findNearbyStores() {
  const status = document.getElementById("nearbyStoreStatus");
  const results = document.getElementById("nearbyStoreResults");
  if (!navigator.geolocation) {
    status.textContent = "位置情報を取得できませんでした。店舗名を手入力してください。";
    results.innerHTML = "";
    return;
  }
  status.textContent = "現在地を確認中...";
  results.innerHTML = "";
  nearbyStoreCandidates = [];
  nearbyStorePage = 0;
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        status.textContent = "近くのお店を検索中...";
        nearbyStoreCandidates = await fetchNearbyStores(position.coords.latitude, position.coords.longitude);
        renderNearbyStoreResults();
        status.textContent = nearbyStoreCandidates.length ? `${nearbyStoreCandidates.length}件見つかりました` : "近くのお店候補が見つかりませんでした。";
      } catch {
        status.textContent = "位置情報を取得できませんでした。店舗名を手入力してください。";
        results.innerHTML = "";
      }
    },
    () => {
      status.textContent = "位置情報を取得できませんでした。店舗名を手入力してください。";
      results.innerHTML = "";
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

async function findStoresByAddress() {
  const address = document.getElementById("nearbyAddress").value.trim();
  const status = document.getElementById("nearbyStoreStatus");
  const results = document.getElementById("nearbyStoreResults");
  if (!address) {
    status.textContent = "住所や地名を入力してください。";
    return;
  }
  status.textContent = "住所から場所を検索中...";
  results.innerHTML = "";
  nearbyStoreCandidates = [];
  nearbyStorePage = 0;
  try {
    const location = await geocodeAddress(address);
    if (!location) {
      status.textContent = "住所から場所を見つけられませんでした。地名を少し変えて再検索してください。";
      return;
    }
    status.textContent = "周辺のお店を検索中...";
    nearbyStoreCandidates = await fetchNearbyStores(location.lat, location.lon);
    renderNearbyStoreResults();
    status.textContent = nearbyStoreCandidates.length ? `${nearbyStoreCandidates.length}件見つかりました` : "近くのお店候補が見つかりませんでした。";
  } catch {
    status.textContent = "住所から場所を見つけられませんでした。地名を少し変えて再検索してください。";
    results.innerHTML = "";
  }
}

async function geocodeAddress(address) {
  const params = new URLSearchParams({
    q: address,
    format: "jsonv2",
    limit: "1",
    countrycodes: "jp"
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { "Accept": "application/json" },
    cache: "no-store",
    credentials: "omit",
    mode: "cors"
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const result = Array.isArray(data) ? data[0] : null;
  if (!result?.lat || !result?.lon) return null;
  return { lat: Number(result.lat), lon: Number(result.lon) };
}

async function fetchNearbyStores(latitude, longitude) {
  const shopPattern = document.getElementById("nearbyStoreFilter").value === "all"
    ? "^(supermarket|convenience|chemist|department_store|mall|grocery|discount)$"
    : "^(supermarket|chemist|department_store|mall|grocery|discount)$";
  const query = `
    [out:json][timeout:12];
    (
      node["shop"~"${shopPattern}"](around:500,${latitude},${longitude});
      way["shop"~"${shopPattern}"](around:500,${latitude},${longitude});
      relation["shop"~"${shopPattern}"](around:500,${latitude},${longitude});
    );
    out center tags 30;
  `;
  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams({ data: query })
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return (data.elements || [])
    .map((element) => ({
      name: buildStoreDisplayName(element.tags || {}),
      rawName: element.tags?.name || "",
      type: element.tags?.shop || "",
      address: buildStoreAddress(element.tags || {}),
      lat: element.lat ?? element.center?.lat,
      lon: element.lon ?? element.center?.lon
    }))
    .filter((store) => store.name)
    .filter(uniqueStoreByNameAndAddress);
}

function renderNearbyStoreResults() {
  const results = document.getElementById("nearbyStoreResults");
  if (!nearbyStoreCandidates.length) {
    results.innerHTML = '<p class="hint">候補がありません。店舗名は手入力できます。</p>';
    return;
  }
  const pageSize = 5;
  const start = nearbyStorePage * pageSize;
  const stores = nearbyStoreCandidates.slice(start, start + pageSize);
  const hasNext = start + pageSize < nearbyStoreCandidates.length;
  results.innerHTML = stores.map((store, index) => {
    const candidateIndex = start + index;
    return `
    <div class="candidate-card">
      <div>
        <strong>${escapeHtml(store.name)}</strong>
        <p>${escapeHtml([formatStoreType(store.type), store.address, "OpenStreetMap"].filter(Boolean).join(" / "))}</p>
      </div>
      <button type="button" class="secondary tiny" onclick="selectNearbyStore(${candidateIndex})">選択</button>
    </div>
    `;
  }).join("") + (hasNext ? '<button type="button" class="secondary nearby-next" onclick="showNextNearbyStores()">次へ</button>' : "");
}

function selectNearbyStore(index) {
  const store = nearbyStoreCandidates[index];
  if (!store) return;
  document.getElementById("quickPriceStore").value = store.name;
  document.getElementById("nearbyStoreStatus").textContent = "店舗名を反映しました。";
  document.getElementById("nearbyStoreResults").innerHTML = "";
  nearbyStoreCandidates = [];
  nearbyStorePage = 0;
}

function showNextNearbyStores() {
  nearbyStorePage += 1;
  renderNearbyStoreResults();
}

function buildStoreDisplayName(tags) {
  const name = tags.name || tags.brand || tags.operator || "";
  const branch = tags.branch || tags["addr:branch"] || "";
  if (name && branch && !name.includes(branch)) return `${name} ${branch}`;
  return name;
}

function buildStoreAddress(tags) {
  if (tags["addr:full"]) return tags["addr:full"];
  return [
    tags["addr:city"],
    tags["addr:suburb"],
    tags["addr:neighbourhood"],
    tags["addr:street"],
    tags["addr:housenumber"]
  ].filter(Boolean).join(" ");
}

function uniqueStoreByNameAndAddress(store, index, stores) {
  const key = `${store.name}|${store.address}`;
  return stores.findIndex((candidate) => `${candidate.name}|${candidate.address}` === key) === index;
}

function formatStoreType(type) {
  return {
    supermarket: "スーパー",
    convenience: "コンビニ",
    chemist: "ドラッグストア",
    department_store: "百貨店",
    mall: "ショッピングモール",
    grocery: "食料品店",
    discount: "ディスカウント店"
  }[type] || "店舗";
}

function saveQuickEntry(event) {
  event.preventDefault();
  const productName = document.getElementById("quickProductName").value.trim();
  const product = upsertProductFromQuickForm(productName);
  const store = upsertStoreFromQuickForm(document.getElementById("quickPriceStore").value.trim());
  const price = {
    id: uid(),
    productId: product.id,
    storeId: store.id,
    amount: Number(normalizeNumericText(document.getElementById("quickPriceAmount").value)),
    date: document.getElementById("quickPriceDate").value,
    kind: document.getElementById("quickPriceKind").value,
    tax: document.getElementById("quickPriceTax").value,
    memo: document.getElementById("quickPriceMemo").value.trim()
  };
  state.prices.push(price);
  resetQuickForm();
  render();
}

function upsertProductFromQuickForm(productName) {
  const existing = findProductByName(productName);
  const categoryInput = document.getElementById("quickProductCategory").value.trim();
  const manufacturer = document.getElementById("quickManufacturer").value.trim();
  const barcode = document.getElementById("quickBarcode").value.trim();
  const product = {
    id: existing?.id || uid(),
    name: productName,
    manufacturer: manufacturer || existing?.manufacturer || "",
    category: PRODUCT_CATEGORIES.includes(categoryInput) ? categoryInput : categoryInput || "その他",
    barcode: barcode || existing?.barcode || "",
    weightGrams: positiveNumberOrEmpty(document.getElementById("quickProductWeightGrams").value) || existing?.weightGrams || "",
    unitCount: positiveNumberOrEmpty(document.getElementById("quickProductUnitCount").value) || existing?.unitCount || "",
    size: existing?.size || "",
    memo: existing?.memo || ""
  };
  upsert(state.products, product);
  return product;
}

function upsertStoreFromQuickForm(storeName) {
  const existing = findStoreByName(storeName);
  const store = {
    id: existing?.id || uid(),
    name: storeName,
    type: existing?.type || "",
    area: existing?.area || "",
    memo: existing?.memo || ""
  };
  upsert(state.stores, store);
  return store;
}

function updateQuickProductFields() {
  const nameInput = document.getElementById("quickProductName");
  const categoryInput = document.getElementById("quickProductCategory");
  const product = findProductByName(nameInput.value);
  if (product) {
    if (categoryInput.dataset.userEdited !== "true") categoryInput.value = product.category || "";
    document.getElementById("quickManufacturer").value = product.manufacturer || "";
    document.getElementById("quickBarcode").value = product.barcode || "";
    document.getElementById("quickProductWeightGrams").value = product.weightGrams || "";
    document.getElementById("quickProductUnitCount").value = product.unitCount || "";
    return;
  }
  if (categoryInput.dataset.userEdited !== "true") {
    categoryInput.value = getSuggestedCategory(nameInput.value);
  }
}

function handleQuickProductNameInput() {
  updateQuickProductFields();
  renderProductSuggestions();
  updateProductSearchGuide();
}

function updateProductSearchGuide(message = "") {
  const guide = document.getElementById("productSearchGuide");
  if (!guide) return;
  if (message) {
    guide.textContent = message;
    return;
  }
  const productName = document.getElementById("quickProductName").value.trim();
  guide.textContent = productName
    ? "商品名を確認し、「商品候補を検索」を押してください。"
    : "商品名を入力してください。入力できたら「商品候補を検索」を押してください。";
}

function renderProductSuggestions() {
  const list = document.getElementById("productSuggestions");
  const input = document.getElementById("quickProductName");
  const query = normalizeProductName(input.value);
  if (!query) {
    list.hidden = true;
    list.innerHTML = "";
    return;
  }
  const products = state.products
    .filter((product) => normalizeProductName(product.name).startsWith(query))
    .sort((a, b) => a.name.localeCompare(b.name, "ja"))
    .slice(0, 6);
  if (!products.length || document.activeElement !== input) {
    list.hidden = true;
    list.innerHTML = "";
    return;
  }
  list.hidden = false;
  list.innerHTML = products.map((product) => `
    <button type="button" class="suggestion-item" onclick="selectProductSuggestion('${product.id}')">
      <span>${escapeHtml(product.name)}</span>
      <small>${escapeHtml(product.category || "カテゴリ未設定")}</small>
    </button>
  `).join("");
}

function selectProductSuggestion(productId) {
  const product = findById(state.products, productId);
  if (!product) return;
  document.getElementById("quickProductName").value = product.name;
  document.getElementById("productSuggestions").hidden = true;
  document.getElementById("productSuggestions").innerHTML = "";
  updateQuickProductFields();
}

function clearNearbyStoreResults() {
  document.getElementById("nearbyStoreResults").innerHTML = "";
  document.getElementById("nearbyStoreStatus").textContent = "";
  nearbyStoreCandidates = [];
}

function markQuickCategoryEdited() {
  document.getElementById("quickProductCategory").dataset.userEdited = "true";
}

async function searchOpenFoodFacts() {
  const brand = document.getElementById("quickManufacturer").value.trim();
  const productName = document.getElementById("quickProductName").value.trim();
  const status = document.getElementById("openFoodFactsStatus");
  const results = document.getElementById("openFoodFactsResults");
  if (!brand && !productName) {
    status.textContent = "商品名を入力してください。";
    updateProductSearchGuide("商品名を入力し、「商品候補を検索」を押してください。");
    return;
  }
  status.textContent = "検索中...";
  results.innerHTML = "";
  openFoodFactsCandidates = [];
  try {
    openFoodFactsCandidates = await fetchOpenFoodFactsCandidates(brand, productName);
    renderOpenFoodFactsResults(openFoodFactsCandidates);
    status.textContent = openFoodFactsCandidates.length ? `${openFoodFactsCandidates.length}件見つかりました` : "候補が見つかりませんでした。手入力できます。";
  } catch (error) {
    status.textContent = "検索できませんでした";
    results.innerHTML = '<p class="hint">Open Food Factsに接続できませんでした。通信環境を確認してください。検索できない場合も手入力で登録できます。</p>';
  }
}

async function fetchOpenFoodFactsCandidates(brand, productName) {
  const queries = buildOpenFoodFactsQueries(brand, productName);
  let lastError = null;
  for (const query of queries) {
    try {
      const products = await requestOpenFoodFacts(query);
      if (products.length) return products;
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  return [];
}

function buildOpenFoodFactsQueries(brand, productName) {
  const original = [brand, productName].filter(Boolean).join(" ");
  const expanded = expandOpenFoodFactsTerms(original);
  const productExpanded = expandOpenFoodFactsTerms(productName);
  const candidates = [
    original,
    expanded,
    productName,
    productExpanded,
    brand
  ].map((query) => query.trim()).filter(Boolean);
  return [...new Set(candidates)];
}

function expandOpenFoodFactsTerms(value) {
  let expanded = value;
  Object.entries(OPEN_FOOD_FACTS_SEARCH_TERMS).forEach(([source, replacement]) => {
    if (expanded.includes(source)) expanded += ` ${replacement}`;
  });
  return expanded;
}

async function requestOpenFoodFacts(query) {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: "8",
    fields: "code,product_name,generic_name,brands,quantity,categories,categories_tags"
  });
  let lastError = null;
  for (const baseUrl of OPEN_FOOD_FACTS_BASE_URLS) {
    try {
      const response = await fetch(`${baseUrl}/cgi/search.pl?${params.toString()}`, {
        cache: "no-store",
        credentials: "omit",
        mode: "cors"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return Array.isArray(data.products) ? data.products.filter(hasUsefulOpenFoodFactsName) : [];
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("Open Food Facts request failed");
}

async function requestOpenFoodFactsByBarcode(barcode) {
  const code = String(barcode || "").trim();
  if (!code) return null;
  let lastError = null;
  for (const baseUrl of OPEN_FOOD_FACTS_BASE_URLS) {
    try {
      const response = await fetch(`${baseUrl}/api/v2/product/${encodeURIComponent(code)}.json?fields=code,product_name,generic_name,brands,quantity,categories,categories_tags`, {
        cache: "no-store",
        credentials: "omit",
        mode: "cors"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.status === 1) return data.product;
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  return null;
}

function hasUsefulOpenFoodFactsName(product) {
  return Boolean(product.product_name || product.generic_name);
}

function renderOpenFoodFactsResults(products) {
  const results = document.getElementById("openFoodFactsResults");
  if (!products.length) {
    results.innerHTML = '<p class="hint">候補がありません。商品名やメーカー名を短くして再検索するか、手入力のまま登録できます。</p>';
    return;
  }
  results.innerHTML = products.map((product, index) => {
    const name = product.product_name || product.generic_name || "名称なし";
    const brand = product.brands || "メーカー不明";
    const quantity = product.quantity || "内容量不明";
    const category = getOpenFoodFactsCategory(product) || "カテゴリ候補なし";
    const code = product.code ? ` / ${product.code}` : "";
    return `
      <div class="off-result">
        <div>
          <strong>${escapeHtml(name)}</strong>
          <p>${escapeHtml(brand)} / ${escapeHtml(quantity)} / ${escapeHtml(category)}${escapeHtml(code)}</p>
        </div>
        <button type="button" class="secondary tiny" onclick="selectOpenFoodFactsCandidate(${index})">選択</button>
      </div>
    `;
  }).join("");
}

function selectOpenFoodFactsCandidate(index) {
  const product = openFoodFactsCandidates[index];
  if (!product) return;
  applyOpenFoodFactsProduct(product);
  document.getElementById("openFoodFactsStatus").textContent = "候補を反映しました。価格は入力してください。";
}

function applyOpenFoodFactsProduct(product) {
  const name = product.product_name || product.generic_name || "";
  const manufacturer = product.brands || "";
  const grams = extractGrams(product.quantity);
  const category = getOpenFoodFactsCategory(product) || getSuggestedCategory(name);
  document.getElementById("quickProductName").value = name;
  document.getElementById("quickManufacturer").value = manufacturer;
  document.getElementById("quickBarcode").value = product.code || "";
  if (grams) document.getElementById("quickProductWeightGrams").value = grams;
  if (category) document.getElementById("quickProductCategory").value = category;
  document.getElementById("quickProductCategory").dataset.userEdited = category ? "true" : "false";
  updateProductSearchGuide();
}

async function startBarcodeScan() {
  const status = document.getElementById("barcodeStatus");
  status.textContent = "";
  if (!navigator.mediaDevices?.getUserMedia) {
    status.textContent = "読み取り候補がありません。商品名を入力してください。";
    updateProductSearchGuide("商品名を入力し、「商品候補を検索」を押してください。");
    return;
  }
  stopBarcodeScan();
  resetBarcodeDetection();
  hideBarcodeConfirmation();
  try {
    status.textContent = "カメラ起動中...";
    const video = document.getElementById("barcodeVideo");
    barcodeStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });
    barcodeVideoTrack = barcodeStream.getVideoTracks()[0] || null;
    video.srcObject = barcodeStream;
    await video.play();
    document.getElementById("barcodeScanner").hidden = false;
    document.getElementById("stopBarcodeScan").hidden = false;
    configureBarcodeCameraControls();
    barcodeDetector = await createBarcodeDetector();
    zxingCodeReader = barcodeDetector ? null : createZxingBarcodeReader();
    if (!barcodeDetector && !zxingCodeReader) {
      throw new Error("No supported barcode reader");
    }
    status.textContent = "バーコードを枠いっぱいに合わせてください";
    startBarcodeScanLoop();
  } catch (error) {
    status.textContent = "読み取り候補がありません。商品名を入力してください。";
    updateProductSearchGuide("商品名を入力し、「商品候補を検索」を押してください。");
    stopBarcodeScan();
  }
}

async function createBarcodeDetector() {
  if (!("BarcodeDetector" in window)) return null;
  try {
    const requestedFormats = ["ean_13", "ean_8", "upc_a"];
    if (typeof BarcodeDetector.getSupportedFormats === "function") {
      const supported = await BarcodeDetector.getSupportedFormats();
      if (!requestedFormats.every((format) => supported.includes(format))) return null;
    }
    return new BarcodeDetector({ formats: requestedFormats });
  } catch {
    return null;
  }
}

function createZxingBarcodeReader() {
  if (!window.ZXing?.BrowserMultiFormatReader) return null;
  const hints = new Map();
  hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
    ZXing.BarcodeFormat.EAN_13,
    ZXing.BarcodeFormat.EAN_8,
    ZXing.BarcodeFormat.UPC_A
  ]);
  hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
  return new ZXing.BrowserMultiFormatReader(hints);
}

function startBarcodeScanLoop() {
  const video = document.getElementById("barcodeVideo");
  barcodeScanTimer = window.setInterval(async () => {
    if (!barcodeStream || barcodeScanBusy || video.readyState < 2) return;
    barcodeScanBusy = true;
    try {
      const canvas = captureBarcodeRegion(video);
      const detected = barcodeDetector
        ? await detectBarcodeWithNativeApi(canvas)
        : detectBarcodeWithZxing(canvas);
      if (detected) registerBarcodeDetection(detected.value, detected.format);
    } catch {
      // A frame without a readable code is expected while the camera is moving.
    } finally {
      barcodeScanBusy = false;
    }
  }, 350);
}

function captureBarcodeRegion(video) {
  const canvas = document.getElementById("barcodeCanvas");
  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;
  const cropWidth = Math.round(sourceWidth * 0.84);
  const cropHeight = Math.round(sourceHeight * 0.36);
  const sourceX = Math.round((sourceWidth - cropWidth) / 2);
  const sourceY = Math.round((sourceHeight - cropHeight) / 2);
  canvas.width = cropWidth;
  canvas.height = cropHeight;
  canvas.getContext("2d", { willReadFrequently: true }).drawImage(
    video,
    sourceX,
    sourceY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  );
  return canvas;
}

async function detectBarcodeWithNativeApi(canvas) {
  const codes = await barcodeDetector.detect(canvas);
  const code = codes.find((entry) => isAllowedBarcodeFormat(entry.format));
  return code ? { value: code.rawValue, format: code.format } : null;
}

function detectBarcodeWithZxing(canvas) {
  try {
    const result = zxingCodeReader.decodeFromCanvas(canvas);
    return {
      value: result.getText(),
      format: result.getBarcodeFormat()
    };
  } catch {
    return null;
  }
}

function registerBarcodeDetection(value, format) {
  const barcode = normalizeBarcodeValue(value);
  if (!isAllowedBarcodeFormat(format) || !isValidRetailBarcode(barcode)) return;
  const now = Date.now();
  if (barcode === barcodeCandidate && now - barcodeCandidateLastSeen <= 1500) {
    barcodeCandidateCount += 1;
  } else {
    barcodeCandidate = barcode;
    barcodeCandidateCount = 1;
  }
  barcodeCandidateLastSeen = now;
  document.getElementById("barcodeStatus").textContent = `番号を確認中... ${barcodeCandidateCount}/3`;
  if (barcodeCandidateCount >= 3) completeBarcodeDetection(barcode);
}

function completeBarcodeDetection(barcode) {
  pendingBarcode = barcode;
  stopBarcodeScan();
  document.getElementById("detectedBarcode").textContent = barcode;
  document.getElementById("barcodeConfirmation").hidden = false;
  document.getElementById("barcodeStatus").textContent = "同じ番号を3回確認しました。検索する番号を確認してください。";
  if (navigator.vibrate) navigator.vibrate(80);
}

function normalizeBarcodeValue(value) {
  return String(value || "").replace(/\D/g, "");
}

function isAllowedBarcodeFormat(format) {
  const formatName = typeof format === "number" && window.ZXing?.BarcodeFormat
    ? ZXing.BarcodeFormat[format]
    : format;
  const normalized = String(formatName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return ["ean13", "ean8", "upca"].includes(normalized);
}

function isValidRetailBarcode(barcode) {
  if (![8, 12, 13].includes(barcode.length) || !/^\d+$/.test(barcode)) return false;
  return hasValidBarcodeCheckDigit(barcode);
}

function hasValidBarcodeCheckDigit(barcode) {
  const digits = barcode.split("").map(Number);
  const checkDigit = digits.pop();
  const sum = digits.reduce((total, digit, index) => {
    const positionFromRight = digits.length - index;
    return total + digit * (positionFromRight % 2 === 1 ? 3 : 1);
  }, 0);
  return (10 - (sum % 10)) % 10 === checkDigit;
}

function resetBarcodeDetection() {
  barcodeCandidate = "";
  barcodeCandidateCount = 0;
  barcodeCandidateLastSeen = 0;
  barcodeScanBusy = false;
}

function hideBarcodeConfirmation() {
  pendingBarcode = "";
  document.getElementById("detectedBarcode").textContent = "";
  document.getElementById("barcodeConfirmation").hidden = true;
}

async function confirmDetectedBarcode() {
  if (!pendingBarcode) return;
  document.getElementById("quickBarcode").value = pendingBarcode;
  hideBarcodeConfirmation();
  await lookupBarcodeProduct();
}

async function retryBarcodeScan() {
  hideBarcodeConfirmation();
  document.getElementById("quickBarcode").value = "";
  await startBarcodeScan();
}

function stopBarcodeScan(showNoCandidate = false) {
  if (zxingCodeReader) {
    try {
      zxingCodeReader.reset();
    } catch {
      // The canvas-based reader may not have an active video session to reset.
    }
    zxingCodeReader = null;
  }
  if (barcodeScanTimer) {
    window.clearInterval(barcodeScanTimer);
    barcodeScanTimer = null;
  }
  if (barcodeStream) {
    barcodeStream.getTracks().forEach((track) => track.stop());
    barcodeStream = null;
  }
  barcodeDetector = null;
  barcodeVideoTrack = null;
  barcodeTorchEnabled = false;
  barcodeScanBusy = false;
  const video = document.getElementById("barcodeVideo");
  video.srcObject = null;
  document.getElementById("barcodeScanner").hidden = true;
  document.getElementById("stopBarcodeScan").hidden = true;
  document.getElementById("cameraControls").hidden = true;
  document.getElementById("toggleBarcodeTorch").hidden = true;
  document.getElementById("barcodeZoomLabel").hidden = true;
  if (showNoCandidate && !document.getElementById("quickBarcode").value.trim()) {
    document.getElementById("barcodeStatus").textContent = "読み取り候補がありません。商品名を入力してください。";
    updateProductSearchGuide("商品名を入力し、「商品候補を検索」を押してください。");
  }
}

async function configureBarcodeCameraControls() {
  if (!barcodeVideoTrack?.getCapabilities) return;
  const capabilities = barcodeVideoTrack.getCapabilities();
  const controls = document.getElementById("cameraControls");
  const zoomLabel = document.getElementById("barcodeZoomLabel");
  const zoom = document.getElementById("barcodeZoom");
  const torch = document.getElementById("toggleBarcodeTorch");
  let hasControl = false;

  if (Array.isArray(capabilities.focusMode) && capabilities.focusMode.includes("continuous")) {
    try {
      await barcodeVideoTrack.applyConstraints({ advanced: [{ focusMode: "continuous" }] });
    } catch {
      // Continuous focus is a best-effort enhancement.
    }
  }

  if (capabilities.zoom) {
    zoom.min = capabilities.zoom.min;
    zoom.max = capabilities.zoom.max;
    zoom.step = capabilities.zoom.step || 0.1;
    zoom.value = barcodeVideoTrack.getSettings?.().zoom || capabilities.zoom.min;
    zoomLabel.hidden = false;
    hasControl = true;
  }
  if (capabilities.torch) {
    torch.hidden = false;
    torch.textContent = "ライトを点灯";
    hasControl = true;
  }
  controls.hidden = !hasControl;
}

async function updateBarcodeZoom(event) {
  if (!barcodeVideoTrack) return;
  try {
    await barcodeVideoTrack.applyConstraints({ advanced: [{ zoom: Number(event.target.value) }] });
  } catch {
    document.getElementById("barcodeStatus").textContent = "この端末ではズームを変更できません。";
  }
}

async function toggleBarcodeTorch() {
  if (!barcodeVideoTrack) return;
  barcodeTorchEnabled = !barcodeTorchEnabled;
  try {
    await barcodeVideoTrack.applyConstraints({ advanced: [{ torch: barcodeTorchEnabled }] });
    document.getElementById("toggleBarcodeTorch").textContent = barcodeTorchEnabled ? "ライトを消灯" : "ライトを点灯";
  } catch {
    barcodeTorchEnabled = false;
    document.getElementById("barcodeStatus").textContent = "この端末ではライトを使用できません。";
  }
}

async function readBarcodeFromImage(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  stopBarcodeScan();
  hideBarcodeConfirmation();
  const status = document.getElementById("barcodeStatus");
  status.textContent = "画像を解析中...";
  try {
    const canvas = document.getElementById("barcodeCanvas");
    await drawImageFileToCanvas(file, canvas);
    const detector = await createBarcodeDetector();
    let detected = null;
    if (detector) {
      const codes = await detector.detect(canvas);
      const code = codes.find((entry) =>
        isAllowedBarcodeFormat(entry.format) && isValidRetailBarcode(normalizeBarcodeValue(entry.rawValue))
      );
      if (code) detected = normalizeBarcodeValue(code.rawValue);
    }
    if (!detected) {
      const reader = createZxingBarcodeReader();
      if (reader) {
        zxingCodeReader = reader;
        const result = detectBarcodeWithZxing(canvas);
        if (result && isAllowedBarcodeFormat(result.format) && isValidRetailBarcode(normalizeBarcodeValue(result.value))) {
          detected = normalizeBarcodeValue(result.value);
        }
      }
    }
    if (!detected) {
      status.textContent = "画像から読み取り候補が見つかりませんでした。バーコード番号または商品名を入力してください。";
      return;
    }
    pendingBarcode = detected;
    document.getElementById("detectedBarcode").textContent = detected;
    document.getElementById("barcodeConfirmation").hidden = false;
    status.textContent = "画像から番号を読み取りました。検索する番号を確認してください。";
    if (navigator.vibrate) navigator.vibrate(80);
  } catch {
    status.textContent = "画像を読み取れませんでした。別の画像を選ぶか、番号を直接入力してください。";
  }
}

async function drawImageFileToCanvas(file, canvas) {
  const maxWidth = 1600;
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, maxWidth / bitmap.width);
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext("2d", { willReadFrequently: true }).drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      return;
    } catch {
      // Fall back to an image element for Safari and unsupported image formats.
    }
  }

  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await loadBarcodeImage(imageUrl);
    const scale = Math.min(1, maxWidth / image.naturalWidth);
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    canvas.getContext("2d", { willReadFrequently: true }).drawImage(image, 0, 0, canvas.width, canvas.height);
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function loadBarcodeImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

async function lookupBarcodeProduct() {
  const barcodeInput = document.getElementById("quickBarcode");
  const barcode = normalizeBarcodeValue(barcodeInput.value);
  const status = document.getElementById("barcodeStatus");
  if (!barcode) {
    status.textContent = "読み取り候補がありません。商品名を入力してください。";
    updateProductSearchGuide("商品名を入力し、「商品候補を検索」を押してください。");
    return;
  }
  barcodeInput.value = barcode;
  if (!isValidRetailBarcode(barcode)) {
    status.textContent = "EAN-13、EAN-8、UPC-Aの有効な番号を入力してください。";
    return;
  }
  try {
    status.textContent = "バーコードで検索中...";
    const product = await requestOpenFoodFactsByBarcode(barcode);
    if (!product) {
      status.textContent = "読み取り候補がありません。商品名を入力してください。";
      updateProductSearchGuide("商品名を入力し、「商品候補を検索」を押してください。");
      return;
    }
    applyOpenFoodFactsProduct(product);
    status.textContent = "商品情報を反映しました。価格は入力してください。";
    updateProductSearchGuide();
  } catch {
    status.textContent = "読み取り候補がありません。商品名を入力してください。";
    updateProductSearchGuide("商品名を入力し、「商品候補を検索」を押してください。");
  }
}

function extractGrams(quantity) {
  const value = String(quantity || "").replace(",", ".").toLowerCase();
  const kg = value.match(/(\d+(?:\.\d+)?)\s*kg/);
  if (kg) return Math.round(Number(kg[1]) * 1000);
  const grams = value.match(/(\d+(?:\.\d+)?)\s*g/);
  if (grams) return Math.round(Number(grams[1]));
  return "";
}

function getOpenFoodFactsCategory(product) {
  const text = [
    product.product_name,
    product.generic_name,
    product.categories,
    ...(product.categories_tags || [])
  ].join(" ").toLowerCase();
  const rules = [
    { category: "お菓子", keywords: ["snack", "chips", "crisps", "chocolate", "cookie", "biscuit", "sweets", "ポテトチップス", "チップス"] },
    { category: "飲料", keywords: ["beverage", "drink", "tea", "coffee", "juice", "soda", "water"] },
    { category: "卵・乳製品", keywords: ["dairy", "milk", "cheese", "yogurt", "butter"] },
    { category: "米・パン・麺", keywords: ["bread", "rice", "noodle", "pasta", "麺", "パン"] },
    { category: "冷凍食品", keywords: ["frozen", "ice cream", "アイス", "冷凍"] },
    { category: "調味料", keywords: ["sauce", "seasoning", "condiment", "mayonnaise", "ketchup"] },
    { category: "肉類", keywords: ["meat", "ham", "sausage", "beef", "pork", "chicken"] },
    { category: "魚介類", keywords: ["fish", "seafood", "shrimp", "tuna", "salmon"] },
    { category: "果物", keywords: ["fruit", "apple", "banana", "strawberry"] },
    { category: "野菜", keywords: ["vegetable", "tomato", "cabbage", "potato"] }
  ];
  return rules.find((rule) => rule.keywords.some((keyword) => text.includes(keyword)))?.category || "";
}

function saveProduct(event) {
  event.preventDefault();
  const category = document.getElementById("productCategory").value.trim();
  const existing = findById(state.products, document.getElementById("productId").value);
  const item = {
    id: document.getElementById("productId").value || uid(),
    name: document.getElementById("productName").value.trim(),
    manufacturer: document.getElementById("productManufacturer").value.trim(),
    category: PRODUCT_CATEGORIES.includes(category) ? category : category || "その他",
    barcode: document.getElementById("productBarcode").value.trim(),
    weightGrams: positiveNumberOrEmpty(document.getElementById("productWeightGrams").value),
    unitCount: positiveNumberOrEmpty(document.getElementById("productUnitCount").value),
    size: existing?.size || "",
    memo: document.getElementById("productMemo").value.trim()
  };
  upsert(state.products, item);
  resetProductForm();
  render();
}

function suggestProductCategory() {
  const nameInput = document.getElementById("productName");
  const categoryInput = document.getElementById("productCategory");
  if (categoryInput.dataset.userEdited === "true") return;
  const suggested = getSuggestedCategory(nameInput.value);
  categoryInput.value = suggested;
  categoryInput.dataset.autoValue = suggested;
}

function markProductCategoryEdited() {
  document.getElementById("productCategory").dataset.userEdited = "true";
}

function getSuggestedCategory(productName) {
  const normalized = productName.trim();
  if (!normalized) return "";
  const learned = getLearnedCategory(normalized);
  if (learned) return learned;
  const rule = CATEGORY_RULES.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword))
  );
  return rule?.category || "";
}

function positiveNumberOrEmpty(value) {
  const number = Number(normalizeNumericText(value));
  return number > 0 ? number : "";
}

function normalizeNumericText(value) {
  return String(value || "")
    .replace(/[０-９]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0xFEE0))
    .replace(/[．。]/g, ".")
    .replace(/[，、]/g, "")
    .replace(/－/g, "-")
    .replace(/＋/g, "+")
    .replace(/[　\s]/g, "");
}

function bindNumericInputNormalization() {
  document.querySelectorAll("[data-numeric]").forEach((input) => {
    const normalizeInput = () => {
      const normalized = normalizeNumericText(input.value);
      if (normalized !== input.value) input.value = normalized;
    };
    input.addEventListener("blur", normalizeInput);
    input.addEventListener("change", normalizeInput);
    input.addEventListener("compositionend", normalizeInput);
  });
}

function gramsOf(product) {
  const grams = Number(product?.weightGrams);
  return grams > 0 ? grams : 0;
}

function countOf(product) {
  const count = Number(product?.unitCount);
  return count > 0 ? count : 0;
}

function unitPriceLabels(price, product) {
  if (!product) return [];
  const amount = Number(price?.amount ?? price);
  if (!amount) return [];
  const labels = [];
  const grams = gramsOf(product);
  const count = countOf(product);
  if (grams) labels.push(`${yenDecimal(amount / grams)}/g`);
  if (count) labels.push(`${yenDecimal(amount / count)}/個`);
  return labels;
}

function productAmountLabels(product) {
  const labels = [];
  const grams = gramsOf(product);
  const count = countOf(product);
  if (grams) labels.push(`${grams.toLocaleString("ja-JP")}g`);
  if (count) labels.push(`${count.toLocaleString("ja-JP")}個`);
  if (!labels.length && product?.size) labels.push(product.size);
  return labels;
}

function getLearnedCategory(productName) {
  const normalized = normalizeProductName(productName);
  const currentId = document.getElementById("productId").value;
  const learnedProduct = [...state.products].reverse().find((product) =>
    product.id !== currentId &&
    normalizeProductName(product.name) === normalized &&
    product.category
  );
  return learnedProduct?.category || "";
}

function normalizeProductName(value) {
  return String(value || "").trim().toLowerCase();
}

function saveStore(event) {
  event.preventDefault();
  const item = {
    id: document.getElementById("storeId").value || uid(),
    name: document.getElementById("storeName").value.trim(),
    type: document.getElementById("storeType").value.trim(),
    area: document.getElementById("storeArea").value.trim(),
    memo: document.getElementById("storeMemo").value.trim()
  };
  upsert(state.stores, item);
  resetStoreForm();
  render();
}

function savePrice(event) {
  event.preventDefault();
  const item = {
    id: document.getElementById("priceId").value || uid(),
    productId: document.getElementById("priceProduct").value,
    storeId: document.getElementById("priceStore").value,
    amount: Number(normalizeNumericText(document.getElementById("priceAmount").value)),
    date: document.getElementById("priceDate").value,
    kind: document.getElementById("priceKind").value,
    tax: document.getElementById("priceTax").value,
    memo: document.getElementById("priceMemo").value.trim()
  };
  upsert(state.prices, item);
  resetPriceForm();
  render();
}

function upsert(list, item) {
  const index = list.findIndex((entry) => entry.id === item.id);
  if (index >= 0) list[index] = item;
  else list.push(item);
}

function resetProductForm() {
  els.productForm.reset();
  document.getElementById("productId").value = "";
  document.getElementById("productCategory").dataset.userEdited = "false";
}

function resetQuickForm() {
  els.quickForm.reset();
  document.getElementById("quickProductCategory").dataset.userEdited = "false";
  document.getElementById("quickPriceDate").value = today();
  document.getElementById("openFoodFactsResults").innerHTML = "";
  document.getElementById("openFoodFactsStatus").textContent = "";
  document.getElementById("nearbyStoreResults").innerHTML = "";
  document.getElementById("nearbyStoreStatus").textContent = "";
  document.getElementById("productSuggestions").innerHTML = "";
  document.getElementById("productSuggestions").hidden = true;
  document.getElementById("barcodeStatus").textContent = "";
  document.getElementById("barcodeImage").value = "";
  hideBarcodeConfirmation();
  resetBarcodeDetection();
  updateProductSearchGuide();
  stopBarcodeScan();
  openFoodFactsCandidates = [];
  nearbyStoreCandidates = [];
  nearbyStorePage = 0;
}

function resetStoreForm() {
  els.storeForm.reset();
  document.getElementById("storeId").value = "";
}

function resetPriceForm() {
  els.priceForm.reset();
  document.getElementById("priceId").value = "";
  document.getElementById("priceDate").value = today();
}

function renderProducts() {
  if (!state.products.length) return renderEmpty(els.productList);
  els.productList.innerHTML = state.products.map((item) => {
    const amountPills = productAmountLabels(item)
      .map((label) => `<span class="pill orange">${escapeHtml(label)}</span>`)
      .join("");
    return `
      <article class="card list-item">
        <div>
          <h3>${escapeHtml(item.name)}</h3>
          <div class="meta">
            <span class="pill">${escapeHtml(text(item.category))}</span>
            ${item.manufacturer ? `<span class="pill blue">${escapeHtml(item.manufacturer)}</span>` : ""}
            ${item.barcode ? `<span class="pill">${escapeHtml(item.barcode)}</span>` : ""}
            ${amountPills || '<span class="pill orange">内容量未入力</span>'}
          </div>
          <p class="memo">${escapeHtml(text(item.memo))}</p>
        </div>
        <div class="item-actions">
          <button class="secondary tiny" onclick="editProduct('${item.id}')">編集</button>
          <button class="danger tiny" onclick="deleteProduct('${item.id}')">削除</button>
        </div>
      </article>
    `;
  }).join("");
}

function renderStores() {
  if (!state.stores.length) return renderEmpty(els.storeList);
  els.storeList.innerHTML = state.stores.map((item) => `
    <article class="card list-item">
      <div>
        <h3>${escapeHtml(item.name)}</h3>
        <div class="meta">
          <span class="pill">${escapeHtml(text(item.type))}</span>
          <span class="pill blue">${escapeHtml(text(item.area))}</span>
        </div>
        <p class="memo">${escapeHtml(text(item.memo))}</p>
      </div>
      <div class="item-actions">
        <button class="secondary tiny" onclick="editStore('${item.id}')">編集</button>
        <button class="danger tiny" onclick="deleteStore('${item.id}')">削除</button>
      </div>
    </article>
  `).join("");
}

function renderPrices() {
  if (!state.prices.length) return renderEmpty(els.priceList);
  const sorted = [...state.prices].sort((a, b) => b.date.localeCompare(a.date));
  els.priceList.innerHTML = sorted.map(renderPriceCard).join("");
}

function renderQuickRecent() {
  if (!state.prices.length) return renderEmpty(els.quickRecentList);
  const sorted = [...state.prices].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  els.quickRecentList.innerHTML = sorted.map(renderPriceCard).join("");
}

function renderPriceCard(item) {
    const product = findById(state.products, item.productId);
    const store = findById(state.stores, item.storeId);
    const unitPills = unitPriceLabels(item, product)
      .map((label) => `<span class="pill orange">${escapeHtml(label)}</span>`)
      .join("");
    return `
      <article class="card list-item">
        <div>
          <h3>${escapeHtml(product?.name || "削除済みの商品")}</h3>
          <div class="meta">
            <span class="pill">${escapeHtml(store?.name || "削除済みの店舗")}</span>
            <span class="pill orange">${yen(item.amount)}</span>
            ${unitPills}
            <span class="pill blue">${escapeHtml(item.date)}</span>
            <span class="pill">${escapeHtml(item.kind)}</span>
            <span class="pill">${escapeHtml(item.tax)}</span>
          </div>
          <p class="memo">${escapeHtml(text(item.memo))}</p>
        </div>
        <div class="item-actions">
          <button class="secondary tiny" onclick="editPrice('${item.id}')">編集</button>
          <button class="danger tiny" onclick="deletePrice('${item.id}')">削除</button>
        </div>
      </article>
    `;
}

function renderBestPrices() {
  const cards = state.products.map((product) => {
    const records = state.prices.filter((price) => price.productId === product.id);
    if (!records.length) {
      return `
        <article class="card best-card">
          <h3>${escapeHtml(product.name)}</h3>
          <p class="memo">価格はまだ登録されていません。</p>
        </article>
      `;
    }
    const best = [...records].sort((a, b) => a.amount - b.amount || b.date.localeCompare(a.date))[0];
    const latest = [...records].sort((a, b) => b.date.localeCompare(a.date))[0];
    const average = Math.round(records.reduce((sum, price) => sum + Number(price.amount), 0) / records.length);
    const bestStore = findById(state.stores, best.storeId);
    const latestStore = findById(state.stores, latest.storeId);
    const bestUnits = unitPriceLabels(best, product).join(" / ") || "-";
    const latestUnits = unitPriceLabels(latest, product).join(" / ") || "-";
    const averageUnits = unitPriceLabels(average, product).join(" / ") || "-";
    return `
      <article class="card best-card">
        <h3>${escapeHtml(product.name)}</h3>
        <div class="best-highlight">
          <div>
            <span>最安値</span>
            <strong class="best-price">${yen(best.amount)}</strong>
          </div>
          <div>
            <span>最安店舗</span>
            <strong>${escapeHtml(bestStore?.name || "-")}</strong>
          </div>
        </div>
        <div class="stats">
          <div class="stat"><span>最新価格</span><strong>${yen(latest.amount)}</strong><br>${escapeHtml(latestStore?.name || "-")}</div>
          <div class="stat"><span>平均価格</span><strong>${yen(average)}</strong></div>
          <div class="stat"><span>過去最安値</span><strong>${yen(best.amount)}</strong></div>
          <div class="stat"><span>最安単価</span><strong>${escapeHtml(bestUnits)}</strong></div>
          <div class="stat"><span>最新単価</span><strong>${escapeHtml(latestUnits)}</strong></div>
          <div class="stat"><span>平均単価</span><strong>${escapeHtml(averageUnits)}</strong></div>
          <div class="stat"><span>記録数</span><strong>${records.length}件</strong></div>
        </div>
      </article>
    `;
  }).join("");
  els.bestPriceList.innerHTML = cards || document.getElementById("emptyTemplate").innerHTML;
}

function renderEmpty(target) {
  target.innerHTML = document.getElementById("emptyTemplate").innerHTML;
}

function findById(list, id) {
  return list.find((item) => item.id === id);
}

function findProductByName(name) {
  const normalized = normalizeProductName(name);
  if (!normalized) return null;
  return state.products.find((product) => normalizeProductName(product.name) === normalized) || null;
}

function findStoreByName(name) {
  const normalized = normalizeProductName(name);
  if (!normalized) return null;
  return state.stores.find((store) => normalizeProductName(store.name) === normalized) || null;
}

function editProduct(id) {
  const item = findById(state.products, id);
  if (!item) return;
  document.getElementById("productId").value = item.id;
  document.getElementById("productName").value = item.name;
  document.getElementById("productManufacturer").value = item.manufacturer || "";
  document.getElementById("productCategory").value = item.category;
  document.getElementById("productBarcode").value = item.barcode || "";
  document.getElementById("productCategory").dataset.userEdited = item.category ? "true" : "false";
  document.getElementById("productWeightGrams").value = item.weightGrams || "";
  document.getElementById("productUnitCount").value = item.unitCount || "";
  document.getElementById("productMemo").value = item.memo;
  showTab("products");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function editStore(id) {
  const item = findById(state.stores, id);
  if (!item) return;
  document.getElementById("storeId").value = item.id;
  document.getElementById("storeName").value = item.name;
  document.getElementById("storeType").value = item.type;
  document.getElementById("storeArea").value = item.area;
  document.getElementById("storeMemo").value = item.memo;
  showTab("stores");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function editPrice(id) {
  const item = findById(state.prices, id);
  if (!item) return;
  document.getElementById("priceId").value = item.id;
  document.getElementById("priceProduct").value = item.productId;
  document.getElementById("priceStore").value = item.storeId;
  document.getElementById("priceAmount").value = item.amount;
  document.getElementById("priceDate").value = item.date;
  document.getElementById("priceKind").value = item.kind;
  document.getElementById("priceTax").value = item.tax;
  document.getElementById("priceMemo").value = item.memo;
  showTab("prices");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteProduct(id) {
  if (!confirm("この商品を削除しますか？関連する価格記録も削除されます。")) return;
  state.products = state.products.filter((item) => item.id !== id);
  state.prices = state.prices.filter((item) => item.productId !== id);
  render();
}

function deleteStore(id) {
  if (!confirm("この店舗を削除しますか？関連する価格記録も削除されます。")) return;
  state.stores = state.stores.filter((item) => item.id !== id);
  state.prices = state.prices.filter((item) => item.storeId !== id);
  render();
}

function deletePrice(id) {
  if (!confirm("この価格記録を削除しますか？")) return;
  state.prices = state.prices.filter((item) => item.id !== id);
  render();
}

function drawCharts() {
  const productId = els.chartProduct.value || state.products[0]?.id || "";
  if (productId && els.chartProduct.value !== productId) els.chartProduct.value = productId;
  const records = state.prices
    .filter((price) => price.productId === productId)
    .sort((a, b) => a.date.localeCompare(b.date));
  drawTrendChart(records);
  drawStoreChart(records);
}

function drawTrendChart(records) {
  const canvas = els.trendChart;
  const ctx = canvas.getContext("2d");
  clearCanvas(ctx, canvas);
  if (!records.length) return drawNoData(ctx, canvas);
  const values = records.map((record) => record.amount);
  const area = chartArea(canvas);
  drawAxis(ctx, area);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  ctx.strokeStyle = "#1f9d63";
  ctx.lineWidth = 4;
  ctx.beginPath();
  records.forEach((record, index) => {
    const x = area.left + (records.length === 1 ? area.width / 2 : (area.width * index) / (records.length - 1));
    const y = area.bottom - ((record.amount - min) / range) * area.height;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  records.forEach((record, index) => {
    const x = area.left + (records.length === 1 ? area.width / 2 : (area.width * index) / (records.length - 1));
    const y = area.bottom - ((record.amount - min) / range) * area.height;
    drawPoint(ctx, x, y, "#f59e0b");
    drawLabel(ctx, yen(record.amount), x, y - 14);
  });
  drawChartCaption(ctx, `最小 ${yen(min)} / 最大 ${yen(max)}`, canvas);
}

function drawStoreChart(records) {
  const canvas = els.storeChart;
  const ctx = canvas.getContext("2d");
  clearCanvas(ctx, canvas);
  if (!records.length) return drawNoData(ctx, canvas);
  const latestByStore = [];
  state.stores.forEach((store) => {
    const latest = records
      .filter((record) => record.storeId === store.id)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (latest) latestByStore.push({ store, price: latest });
  });
  if (!latestByStore.length) return drawNoData(ctx, canvas);
  const area = chartArea(canvas);
  drawAxis(ctx, area);
  const max = Math.max(...latestByStore.map((item) => item.price.amount));
  const barWidth = Math.max(28, area.width / latestByStore.length - 18);
  latestByStore.forEach((item, index) => {
    const x = area.left + index * (area.width / latestByStore.length) + 9;
    const height = (item.price.amount / Math.max(1, max)) * area.height;
    const y = area.bottom - height;
    ctx.fillStyle = index % 2 ? "#2577c9" : "#1f9d63";
    ctx.fillRect(x, y, barWidth, height);
    drawLabel(ctx, yen(item.price.amount), x + barWidth / 2, y - 10);
    drawLabel(ctx, item.store.name.slice(0, 8), x + barWidth / 2, area.bottom + 24);
  });
  drawChartCaption(ctx, "各店舗の最新価格で比較", canvas);
}

function chartArea(canvas) {
  return { left: 58, top: 36, right: canvas.width - 24, bottom: canvas.height - 58, width: canvas.width - 82, height: canvas.height - 94 };
}

function clearCanvas(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawAxis(ctx, area) {
  ctx.strokeStyle = "#d9cfbd";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(area.left, area.top);
  ctx.lineTo(area.left, area.bottom);
  ctx.lineTo(area.right, area.bottom);
  ctx.stroke();
}

function drawPoint(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();
}

function drawLabel(ctx, label, x, y) {
  ctx.fillStyle = "#24312b";
  ctx.font = "700 15px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, x, y);
}

function drawChartCaption(ctx, caption, canvas) {
  ctx.fillStyle = "#66756b";
  ctx.font = "15px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(caption, 18, 24);
}

function drawNoData(ctx, canvas) {
  ctx.fillStyle = "#66756b";
  ctx.font = "700 22px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("表示できる価格データがありません", canvas.width / 2, canvas.height / 2);
}

function exportCsv(type) {
  const rows = state[type] || [];
  const headers = csvHeaders(type);
  const csv = [headers.join(","), ...rows.map((row) => headers.map((key) => csvCell(row[key])).join(","))].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${type}-${today()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function csvHeaders(type) {
  return {
    products: ["id", "name", "manufacturer", "category", "barcode", "weightGrams", "unitCount", "size", "memo"],
    stores: ["id", "name", "type", "area", "memo"],
    prices: ["id", "productId", "storeId", "amount", "date", "kind", "tax", "memo"]
  }[type];
}

function csvCell(value) {
  const safe = String(value ?? "");
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function importCsv() {
  const file = document.getElementById("csvFile").files[0];
  const type = document.getElementById("importType").value;
  if (!file) return alert("CSVファイルを選択してください。");
  const reader = new FileReader();
  reader.onload = () => {
    const rows = parseCsv(String(reader.result).replace(/^\ufeff/, ""));
    if (rows.length < 2) return alert("読み込めるデータがありません。");
    const headers = rows[0];
    rows.slice(1).forEach((values) => {
      const item = {};
      headers.forEach((header, index) => {
        item[header] = values[index] ?? "";
      });
      item.id = item.id || uid();
      if (type === "prices") item.amount = Number(item.amount);
      if (type === "products") {
        item.weightGrams = positiveNumberOrEmpty(item.weightGrams);
        item.unitCount = positiveNumberOrEmpty(item.unitCount);
      }
      upsert(state[type], item);
    });
    document.getElementById("csvFile").value = "";
    render();
    alert("CSVを読み込みました。");
  };
  reader.readAsText(file);
}

function parseCsv(csv) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const next = csv[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => value !== "")) rows.push(row);
  return rows;
}

function clearAllData() {
  if (!confirm("すべての登録データを削除します。よろしいですか？")) return;
  state.products = [];
  state.stores = [];
  state.prices = [];
  render();
}
