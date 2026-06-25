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

const PRODUCT_NAME_TRANSLATIONS = [
  ["potato chips", "ポテトチップス"],
  ["corn flakes", "コーンフレーク"],
  ["ice cream", "アイスクリーム"],
  ["chocolate", "チョコレート"],
  ["cookies", "クッキー"],
  ["cookie", "クッキー"],
  ["biscuits", "ビスケット"],
  ["biscuit", "ビスケット"],
  ["yogurt", "ヨーグルト"],
  ["cheese", "チーズ"],
  ["butter", "バター"],
  ["milk", "牛乳"],
  ["coffee", "コーヒー"],
  ["green tea", "緑茶"],
  ["tea", "お茶"],
  ["orange juice", "オレンジジュース"],
  ["apple juice", "りんごジュース"],
  ["juice", "ジュース"],
  ["sparkling water", "炭酸水"],
  ["water", "水"],
  ["bread", "パン"],
  ["noodles", "麺"],
  ["noodle", "麺"],
  ["ramen", "ラーメン"],
  ["pasta", "パスタ"],
  ["rice", "米"],
  ["mayonnaise", "マヨネーズ"],
  ["ketchup", "ケチャップ"],
  ["soy sauce", "醤油"],
  ["sauce", "ソース"],
  ["candy", "飴"],
  ["gummy", "グミ"],
  ["apple", "りんご"],
  ["banana", "バナナ"],
  ["strawberry", "いちご"]
];

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
let selectedProductMetadata = null;
let selectedNearbyStore = null;
let nearbySearchCenter = null;
let nearbySearchRadiusKm = 3;
let nearbySearchExpanded = false;
const searchResponseCache = new Map();
let bestPriceGroups = [];

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
  renderQuickCategoryTabs();
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
  document.getElementById("quickCategoryTabs").addEventListener("click", selectQuickCategoryTab);
  document.getElementById("searchOpenFoodFacts").addEventListener("click", searchOpenFoodFacts);
  document.getElementById("findNearbyStores").addEventListener("click", findNearbyStores);
  document.getElementById("findStoresByName").addEventListener("click", findStoresByName);
  document.getElementById("findStoresByAddress").addEventListener("click", findStoresByAddress);
  document.getElementById("quickPriceStore").addEventListener("focus", renderRecentStores);
  document.getElementById("scanBarcode").addEventListener("click", startBarcodeScan);
  document.getElementById("stopBarcodeScan").addEventListener("click", () => stopBarcodeScan(true));
  document.getElementById("lookupBarcode").addEventListener("click", lookupBarcodeProduct);
  document.getElementById("productName").addEventListener("input", suggestProductCategory);
  document.getElementById("productCategory").addEventListener("input", markProductCategoryEdited);
  document.getElementById("closePriceComparison").addEventListener("click", closePriceComparison);
  document.getElementById("openPriceHistory").addEventListener("click", () => {
    closePriceComparison();
    showTab("prices");
  });
  document.getElementById("priceComparisonDialog").addEventListener("click", closePriceComparisonFromBackdrop);
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
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || fallback;
    return {
      products: Array.isArray(saved.products) ? saved.products.map(migrateProduct) : [],
      stores: Array.isArray(saved.stores) ? saved.stores.map(migrateStore) : [],
      prices: Array.isArray(saved.prices) ? saved.prices : []
    };
  } catch {
    return fallback;
  }
}

function migrateProduct(product) {
  return {
    ...product,
    manufacturer: product.manufacturer || "",
    barcode: normalizeBarcodeValue(product.barcode),
    weightGrams: product.weightGrams || "",
    unitCount: product.unitCount || "",
    contentAmount: product.contentAmount || product.weightGrams || product.unitCount || "",
    quantityUnit: product.quantityUnit || (product.weightGrams ? "g" : product.unitCount ? "個" : ""),
    imageUrl: product.imageUrl || "",
    source: product.source || (product.barcode ? "手入力" : ""),
    sourceId: product.sourceId || "",
    updatedAt: product.updatedAt || ""
  };
}

function migrateStore(store) {
  return {
    ...store,
    address: store.address || store.area || "",
    latitude: finiteNumberOrEmpty(store.latitude),
    longitude: finiteNumberOrEmpty(store.longitude),
    externalId: store.externalId || "",
    source: store.source || (store.name ? "手入力" : ""),
    lastUsedAt: store.lastUsedAt || "",
    useCount: Number(store.useCount) || 0
  };
}

function finiteNumberOrEmpty(value) {
  const number = Number(value);
  return Number.isFinite(number) && value !== "" && value !== null ? number : "";
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
  const moreTabs = ["stores", "prices", "charts", "data"];
  els.tabs.forEach((button) => {
    const active = button.dataset.tab === tabId
      || (button.dataset.tab === "more" && moreTabs.includes(tabId));
    button.classList.toggle("active", active);
  });
  els.panels.forEach((panel) => panel.classList.toggle("active", panel.id === tabId));
  if (tabId === "charts") drawCharts();
  window.scrollTo({ top: 0, behavior: "smooth" });
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
  document.getElementById("storeNameOptions").innerHTML = [...state.stores]
    .sort((a, b) => Number(b.useCount) - Number(a.useCount) || String(b.lastUsedAt).localeCompare(String(a.lastUsedAt)))
    .map((item) => `<option value="${escapeHtml(item.name)}">`)
    .join("");
}

async function findNearbyStores() {
  const status = document.getElementById("nearbyStoreStatus");
  const results = document.getElementById("nearbyStoreResults");
  const button = document.getElementById("findNearbyStores");
  if (!navigator.geolocation) {
    status.textContent = "位置情報を取得できませんでした。店舗名を手入力してください。";
    results.innerHTML = "";
    return;
  }
  button.disabled = true;
  status.textContent = "現在地を確認中...";
  results.innerHTML = "";
  nearbyStoreCandidates = [];
  nearbyStorePage = 0;
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        status.textContent = "3km以内のお店を検索中...";
        nearbySearchCenter = { lat: position.coords.latitude, lon: position.coords.longitude };
        nearbyStoreCandidates = await searchNearbyStoresWithExpansion(nearbySearchCenter);
        renderNearbyStoreResults();
        status.textContent = buildNearbySearchStatus();
      } catch (error) {
        status.textContent = getStoreSearchErrorMessage(error);
        results.innerHTML = "";
      } finally {
        button.disabled = false;
      }
    },
    () => {
      status.textContent = "現在地を取得できませんでした。駅名、市区町村、住所から検索できます";
      results.innerHTML = "";
      button.disabled = false;
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

async function findStoresByAddress() {
  const address = document.getElementById("nearbyAddress").value.trim();
  const status = document.getElementById("nearbyStoreStatus");
  const results = document.getElementById("nearbyStoreResults");
  const button = document.getElementById("findStoresByAddress");
  if (!address) {
    status.textContent = "住所や地名を入力してください。";
    return;
  }
  status.textContent = "住所から場所を検索中...";
  button.disabled = true;
  results.innerHTML = "";
  nearbyStoreCandidates = [];
  nearbyStorePage = 0;
  try {
    const location = await geocodeAddress(address);
    if (!location) {
      status.textContent = "住所から場所を見つけられませんでした。地名を少し変えて再検索してください。";
      return;
    }
    nearbySearchCenter = location;
    status.textContent = "3km以内のお店を検索中...";
    nearbyStoreCandidates = await searchNearbyStoresWithExpansion(location);
    renderNearbyStoreResults();
    status.textContent = buildNearbySearchStatus();
  } catch (error) {
    status.textContent = getStoreSearchErrorMessage(error, true);
    results.innerHTML = "";
  } finally {
    button.disabled = false;
  }
}

async function findStoresByName() {
  const query = document.getElementById("quickPriceStore").value.trim();
  const address = document.getElementById("nearbyAddress").value.trim();
  const status = document.getElementById("nearbyStoreStatus");
  const button = document.getElementById("findStoresByName");
  if (!query) {
    status.textContent = "検索する店舗名を入力してください。";
    return;
  }
  status.textContent = "検索の中心地点を確認中...";
  button.disabled = true;
  nearbyStorePage = 0;
  nearbyStoreCandidates = [];
  try {
    const center = address ? await geocodeAddress(address) : await getCurrentPositionOnce();
    if (!center) {
      status.textContent = "駅名、市区町村、住所のいずれかを入力してください";
      return;
    }
    nearbySearchCenter = center;
    nearbySearchRadiusKm = 10;
    nearbySearchExpanded = false;
    status.textContent = "店舗名と周辺位置から検索中...";
    nearbyStoreCandidates = await fetchNearbyStores(center.lat, center.lon, 10, query);
    renderNearbyStoreResults();
    status.textContent = nearbyStoreCandidates.length
      ? `${nearbyStoreCandidates.length}件見つかりました（10km以内・距離順）`
      : "店舗が見つかりませんでした。検索範囲を広げるか、手入力してください";
  } catch (error) {
    status.textContent = getStoreSearchErrorMessage(error);
  } finally {
    button.disabled = false;
  }
}

function getCurrentPositionOnce() {
  if (!navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

async function geocodeAddress(address) {
  const cacheKey = `geocode:${normalizeProductName(address)}`;
  const cached = getCachedSearchResponse(cacheKey);
  if (cached) return cached;
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
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  const data = await response.json();
  const result = Array.isArray(data) ? data[0] : null;
  if (!result?.lat || !result?.lon) return null;
  const location = { lat: Number(result.lat), lon: Number(result.lon) };
  setCachedSearchResponse(cacheKey, location);
  return location;
}

async function searchNearbyStoresWithExpansion(center) {
  const radii = [3, 5, 10];
  let stores = [];
  nearbySearchExpanded = false;
  for (const radius of radii) {
    nearbySearchRadiusKm = radius;
    stores = await fetchNearbyStores(center.lat, center.lon, radius);
    if (stores.length >= 5) break;
    if (radius !== radii[radii.length - 1]) nearbySearchExpanded = true;
  }
  return stores;
}

async function fetchNearbyStores(latitude, longitude, radiusKm = 3, storeName = "") {
  const cacheKey = `stores:${latitude.toFixed(4)}:${longitude.toFixed(4)}:${radiusKm}:${normalizeStoreName(storeName)}:${document.getElementById("nearbyStoreFilter").value}`;
  const cached = getCachedSearchResponse(cacheKey);
  if (cached) return cached;
  const shopPattern = document.getElementById("nearbyStoreFilter").value === "all"
    ? "^(supermarket|convenience|chemist|department_store|mall|grocery|discount|doityourself)$"
    : "^(supermarket|chemist|department_store|mall|grocery|discount|doityourself)$";
  const radiusMeters = Math.round(radiusKm * 1000);
  const resultLimit = storeName ? 200 : 80;
  const query = `
    [out:json][timeout:20];
    (
      node["shop"~"${shopPattern}"](around:${radiusMeters},${latitude},${longitude});
      way["shop"~"${shopPattern}"](around:${radiusMeters},${latitude},${longitude});
      relation["shop"~"${shopPattern}"](around:${radiusMeters},${latitude},${longitude});
    );
    out center tags ${resultLimit};
  `;
  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams({ data: query })
  });
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  const data = await response.json();
  const normalizedQuery = normalizeStoreName(storeName);
  const stores = (data.elements || [])
    .map((element) => {
      const lat = element.lat ?? element.center?.lat;
      const lon = element.lon ?? element.center?.lon;
      return {
      name: buildStoreDisplayName(element.tags || {}),
      rawName: element.tags?.name || "",
      type: element.tags?.shop || "",
      address: buildStoreAddress(element.tags || {}),
      lat,
      lon,
      distanceKm: calculateDistanceKm(latitude, longitude, lat, lon),
      externalId: `osm:${element.type}/${element.id}`,
      source: "OpenStreetMap"
    };
    })
    .filter((store) => store.name)
    .filter((store) => !normalizedQuery || storeNameMatches(store.name, normalizedQuery))
    .filter(uniqueStoreCandidate)
    .sort((a, b) => a.distanceKm - b.distanceKm);
  setCachedSearchResponse(cacheKey, stores);
  return stores;
}

function getCachedSearchResponse(key) {
  const cached = searchResponseCache.get(key);
  if (!cached || Date.now() - cached.savedAt > 5 * 60 * 1000) {
    searchResponseCache.delete(key);
    return null;
  }
  return cached.value;
}

function setCachedSearchResponse(key, value) {
  searchResponseCache.set(key, { savedAt: Date.now(), value });
}

function renderNearbyStoreResults() {
  const results = document.getElementById("nearbyStoreResults");
  if (!nearbyStoreCandidates.length) {
    results.innerHTML = '<p class="hint">店舗が見つかりませんでした。駅名、市区町村、住所を変更するか、店舗名と住所を手入力してください。</p>';
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
        <p>${escapeHtml([formatStoreType(store.type), store.address, formatDistance(store.distanceKm), store.source].filter(Boolean).join(" / "))}</p>
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
  selectedNearbyStore = { ...store };
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

function uniqueStoreCandidate(store, index, stores) {
  return stores.findIndex((candidate) => {
    if (store.externalId && candidate.externalId === store.externalId) return true;
    if (coordinatesNearlyMatch(store, candidate)) return true;
    return normalizeStoreName(candidate.name) === normalizeStoreName(store.name)
      && normalizeProductName(candidate.address) === normalizeProductName(store.address);
  }) === index;
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return Number.POSITIVE_INFINITY;
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(distanceKm) {
  if (!Number.isFinite(distanceKm)) return "";
  return distanceKm < 1
    ? `約${Math.round(distanceKm * 1000)}m`
    : `約${distanceKm.toFixed(1)}km`;
}

function normalizeStoreName(value) {
  const expanded = String(value || "")
    .replace(/ドラモリ/gu, "ドラッグストアモリ");
  return expanded
    .trim()
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0xFEE0))
    .replace(/\s+/g, "")
    .replace(/支店$/u, "")
    .replace(/店$/u, "")
    .replace(/[\u30A1-\u30F6]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0x60))
    .toLowerCase();
}

function storeNameMatches(candidateName, normalizedQuery) {
  const candidate = normalizeStoreName(candidateName);
  return candidate.includes(normalizedQuery) || normalizedQuery.includes(candidate);
}

function coordinatesNearlyMatch(left, right) {
  const leftLatValue = left.latitude ?? left.lat;
  const leftLonValue = left.longitude ?? left.lon;
  const rightLatValue = right.latitude ?? right.lat;
  const rightLonValue = right.longitude ?? right.lon;
  if ([leftLatValue, leftLonValue, rightLatValue, rightLonValue].some((value) => value === "" || value === null || value === undefined)) {
    return false;
  }
  const leftLat = Number(leftLatValue);
  const leftLon = Number(leftLonValue);
  const rightLat = Number(rightLatValue);
  const rightLon = Number(rightLonValue);
  if (![leftLat, leftLon, rightLat, rightLon].every(Number.isFinite)) return false;
  return calculateDistanceKm(leftLat, leftLon, rightLat, rightLon) <= 0.05;
}

function buildNearbySearchStatus() {
  if (!nearbyStoreCandidates.length) {
    return "店舗が見つかりませんでした。検索範囲を広げるか、手入力してください";
  }
  const expanded = nearbySearchExpanded ? `。候補が少ないため${nearbySearchRadiusKm}kmまで範囲を広げました` : "";
  return `${nearbyStoreCandidates.length}件見つかりました（距離順）${expanded}`;
}

function getStoreSearchErrorMessage(error, isAddressSearch = false) {
  if (!navigator.onLine) return "通信状況を確認して、もう一度お試しください";
  if (Number(error?.status) === 429) return "現在、検索サービスを利用できません。手入力で登録できます";
  return isAddressSearch
    ? "住所から場所を見つけられませんでした。地名を少し変えて再検索してください。"
    : "店舗検索サービスに接続できませんでした。店舗名を手入力してください。";
}

function formatStoreType(type) {
  return {
    supermarket: "スーパー",
    convenience: "コンビニ",
    chemist: "ドラッグストア",
    department_store: "百貨店",
    mall: "ショッピングモール",
    grocery: "食料品店",
    discount: "ディスカウント店",
    doityourself: "ホームセンター"
  }[type] || type || "店舗";
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
  showSaveToast("価格を記録しました");
}

function upsertProductFromQuickForm(productName) {
  const barcode = normalizeBarcodeValue(document.getElementById("quickBarcode").value);
  const existing = findProductByBarcode(barcode) || findProductByName(productName);
  const categoryInput = document.getElementById("quickProductCategory").value.trim();
  const manufacturer = document.getElementById("quickManufacturer").value.trim();
  const weightGrams = positiveNumberOrEmpty(document.getElementById("quickProductWeightGrams").value) || existing?.weightGrams || "";
  const unitCount = positiveNumberOrEmpty(document.getElementById("quickProductUnitCount").value) || existing?.unitCount || "";
  const selectedMetadata = selectedProductMetadata
    && (!selectedProductMetadata.sourceId || barcodesEquivalent(selectedProductMetadata.sourceId, barcode))
    ? selectedProductMetadata
    : null;
  const product = {
    id: existing?.id || uid(),
    name: productName,
    manufacturer: manufacturer || existing?.manufacturer || "",
    category: PRODUCT_CATEGORIES.includes(categoryInput) ? categoryInput : categoryInput || "その他",
    barcode: barcode || existing?.barcode || "",
    weightGrams,
    unitCount,
    contentAmount: selectedMetadata?.contentAmount || existing?.contentAmount || weightGrams || unitCount || "",
    quantityUnit: selectedMetadata?.quantityUnit || existing?.quantityUnit || (weightGrams ? "g" : unitCount ? "個" : ""),
    imageUrl: selectedMetadata?.imageUrl || existing?.imageUrl || "",
    source: selectedMetadata?.source || existing?.source || "手入力",
    sourceId: selectedMetadata?.sourceId || existing?.sourceId || "",
    updatedAt: today(),
    size: existing?.size || "",
    memo: existing?.memo || ""
  };
  upsert(state.products, product);
  return product;
}

function upsertStoreFromQuickForm(storeName) {
  const candidate = selectedNearbyStore?.name === storeName ? selectedNearbyStore : null;
  const existing = findMatchingStore(candidate || { name: storeName });
  const store = {
    id: existing?.id || uid(),
    name: storeName,
    type: candidate?.type || existing?.type || "",
    area: candidate?.address || existing?.area || "",
    address: candidate?.address || existing?.address || existing?.area || "",
    latitude: finiteNumberOrEmpty(candidate?.lat ?? existing?.latitude),
    longitude: finiteNumberOrEmpty(candidate?.lon ?? existing?.longitude),
    externalId: candidate?.externalId || existing?.externalId || "",
    source: candidate?.source === "最近使った店舗" ? existing?.source || "手入力" : candidate?.source || existing?.source || "手入力",
    lastUsedAt: today(),
    useCount: Number(existing?.useCount || 0) + 1,
    memo: existing?.memo || ""
  };
  upsert(state.stores, store);
  return store;
}

function findMatchingStore(candidate) {
  if (candidate.externalId) {
    const externalMatch = state.stores.find((store) => store.externalId === candidate.externalId);
    if (externalMatch) return externalMatch;
  }
  const coordinateMatch = state.stores.find((store) => coordinatesNearlyMatch(store, candidate));
  if (coordinateMatch) return coordinateMatch;
  const normalizedName = normalizeStoreName(candidate.name);
  const normalizedAddress = normalizeProductName(candidate.address);
  if (normalizedAddress) {
    const addressMatch = state.stores.find((store) =>
      normalizeStoreName(store.name) === normalizedName
      && normalizeProductName(store.address || store.area) === normalizedAddress
    );
    if (addressMatch) return addressMatch;
  }
  return findStoreByName(candidate.name);
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
    updateQuickCategoryTabs();
    return;
  }
  if (categoryInput.dataset.userEdited !== "true") {
    categoryInput.value = getSuggestedCategory(nameInput.value);
  }
  updateQuickCategoryTabs();
}

function handleQuickProductNameInput() {
  const currentName = document.getElementById("quickProductName").value.trim();
  if (selectedProductMetadata?.productName && selectedProductMetadata.productName !== currentName) {
    selectedProductMetadata = null;
  }
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
  if (selectedNearbyStore && document.getElementById("quickPriceStore").value.trim() !== selectedNearbyStore.name) {
    selectedNearbyStore = null;
  }
  document.getElementById("nearbyStoreResults").innerHTML = "";
  document.getElementById("nearbyStoreStatus").textContent = "";
  nearbyStoreCandidates = [];
}

function renderRecentStores() {
  const results = document.getElementById("nearbyStoreResults");
  if (results.innerHTML.trim() || document.getElementById("quickPriceStore").value.trim()) return;
  const recent = [...state.stores]
    .filter((store) => store.lastUsedAt || store.useCount)
    .sort((a, b) => Number(b.useCount) - Number(a.useCount) || String(b.lastUsedAt).localeCompare(String(a.lastUsedAt)))
    .slice(0, 5)
    .map((store) => ({
      name: store.name,
      type: store.type,
      address: store.address || store.area,
      lat: store.latitude,
      lon: store.longitude,
      externalId: store.externalId,
      source: "最近使った店舗",
      distanceKm: nearbySearchCenter
        ? calculateDistanceKm(nearbySearchCenter.lat, nearbySearchCenter.lon, Number(store.latitude), Number(store.longitude))
        : Number.POSITIVE_INFINITY
    }));
  if (!recent.length) return;
  nearbyStoreCandidates = recent;
  nearbyStorePage = 0;
  document.getElementById("nearbyStoreStatus").textContent = "最近使った店舗";
  renderNearbyStoreResults();
}

function markQuickCategoryEdited() {
  document.getElementById("quickProductCategory").dataset.userEdited = "true";
  updateQuickCategoryTabs();
}

function renderQuickCategoryTabs() {
  const container = document.getElementById("quickCategoryTabs");
  container.innerHTML = PRODUCT_CATEGORIES.map((category) => `
    <button type="button" class="category-tab" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>
  `).join("");
  updateQuickCategoryTabs();
}

function selectQuickCategoryTab(event) {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  const categoryInput = document.getElementById("quickProductCategory");
  categoryInput.value = button.dataset.category;
  categoryInput.dataset.userEdited = "true";
  updateQuickCategoryTabs();
}

function updateQuickCategoryTabs() {
  const selected = document.getElementById("quickProductCategory")?.value.trim();
  document.querySelectorAll("#quickCategoryTabs [data-category]").forEach((button) => {
    const active = button.dataset.category === selected;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

async function searchOpenFoodFacts() {
  const brand = document.getElementById("quickManufacturer").value.trim();
  const productName = document.getElementById("quickProductName").value.trim();
  const status = document.getElementById("openFoodFactsStatus");
  const results = document.getElementById("openFoodFactsResults");
  const button = document.getElementById("searchOpenFoodFacts");
  if (!brand && !productName) {
    status.textContent = "商品名を入力してください。";
    updateProductSearchGuide("商品名を入力し、「商品候補を検索」を押してください。");
    return;
  }
  status.textContent = "検索中...";
  button.disabled = true;
  results.innerHTML = "";
  openFoodFactsCandidates = [];
  try {
    openFoodFactsCandidates = rankAndDedupeProductCandidates(
      await fetchOpenFoodFactsCandidates(brand, productName)
    );
    renderOpenFoodFactsResults(openFoodFactsCandidates);
    status.textContent = openFoodFactsCandidates.length ? `${openFoodFactsCandidates.length}件見つかりました` : "候補が見つかりませんでした。手入力できます。";
  } catch (error) {
    status.textContent = getSearchErrorMessage(error);
    results.innerHTML = '<p class="hint">検索できない場合も、商品名を手入力して登録できます。</p>';
  } finally {
    button.disabled = false;
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
    fields: "code,product_name,product_name_ja,product_name_en,generic_name,generic_name_ja,generic_name_en,brands,quantity,categories,categories_tags,image_front_url,image_url"
  });
  let lastError = null;
  for (const baseUrl of OPEN_FOOD_FACTS_BASE_URLS) {
    try {
      const response = await fetch(`${baseUrl}/cgi/search.pl?${params.toString()}`, {
        cache: "no-store",
        credentials: "omit",
        mode: "cors"
      });
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }
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
  const cacheKey = `product:${code}`;
  const cached = getCachedSearchResponse(cacheKey);
  if (cached) return cached;
  let lastError = null;
  let notFound = false;
  for (const baseUrl of OPEN_FOOD_FACTS_BASE_URLS) {
    try {
      const response = await fetch(`${baseUrl}/api/v2/product/${encodeURIComponent(code)}.json?fields=code,product_name,product_name_ja,product_name_en,generic_name,generic_name_ja,generic_name_en,brands,quantity,categories,categories_tags,image_front_url,image_url`, {
        cache: "no-store",
        credentials: "omit",
        mode: "cors"
      });
      if (response.status === 404) {
        notFound = true;
        continue;
      }
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }
      const data = await response.json();
      if (data.status === 1) {
        setCachedSearchResponse(cacheKey, data.product);
        return data.product;
      }
    } catch (error) {
      lastError = error;
    }
  }
  if (notFound && !lastError) return null;
  if (lastError) throw lastError;
  return null;
}

function hasUsefulOpenFoodFactsName(product) {
  return Boolean(getOriginalProductName(product));
}

function renderOpenFoodFactsResults(products) {
  const results = document.getElementById("openFoodFactsResults");
  if (!products.length) {
    results.innerHTML = '<p class="hint">候補がありません。商品名やメーカー名を短くして再検索するか、手入力のまま登録できます。</p>';
    return;
  }
  results.innerHTML = products.map((product, index) => {
    const originalName = getOriginalProductName(product);
    const name = getDisplayProductName(product) || "名称なし";
    const brand = product.brands || "メーカー不明";
    const quantity = product.quantity || "内容量不明";
    const category = getOpenFoodFactsCategory(product) || "カテゴリ候補なし";
    const code = product.code ? ` / ${product.code}` : "";
    const imageUrl = product.image_front_url || product.image_url || "";
    const source = product.source || "Open Food Facts";
    return `
      <div class="off-result${imageUrl ? " has-image" : ""}">
        ${imageUrl ? `<img class="candidate-image" src="${escapeHtml(imageUrl)}" alt="" loading="lazy">` : ""}
        <div>
          <strong>${escapeHtml(name)}</strong>
          ${originalName && originalName !== name ? `<small class="original-product-name">元の表記: ${escapeHtml(originalName)}</small>` : ""}
          <p>${escapeHtml(brand)} / ${escapeHtml(quantity)} / ${escapeHtml(category)}${escapeHtml(code)}</p>
          <small>${escapeHtml(source)}</small>
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
  if (product.savedProductId) {
    const saved = findById(state.products, product.savedProductId);
    if (!saved) return;
    document.getElementById("quickProductName").value = saved.name;
    document.getElementById("quickManufacturer").value = saved.manufacturer || "";
    document.getElementById("quickBarcode").value = saved.barcode || "";
    document.getElementById("quickProductWeightGrams").value = saved.weightGrams || "";
    document.getElementById("quickProductUnitCount").value = saved.unitCount || "";
    document.getElementById("quickProductCategory").value = saved.category || "";
    selectedProductMetadata = {
      productName: saved.name,
      imageUrl: saved.imageUrl || "",
      source: saved.source || "保存済み商品",
      sourceId: saved.sourceId || "",
      contentAmount: saved.contentAmount || saved.weightGrams || saved.unitCount || "",
      quantityUnit: saved.quantityUnit || "",
      updatedAt: saved.updatedAt || today()
    };
    updateQuickCategoryTabs();
    updateProductSearchGuide();
    return;
  }
  const name = getDisplayProductName(product);
  const manufacturer = product.brands || "";
  const grams = extractGrams(product.quantity);
  const quantityInfo = extractQuantityInfo(product.quantity);
  const category = getOpenFoodFactsCategory(product) || getSuggestedCategory(name);
  selectedProductMetadata = {
    productName: name,
    imageUrl: product.image_front_url || product.image_url || product.imageUrl || "",
    source: product.source || "Open Food Facts",
    sourceId: product.code || "",
    contentAmount: quantityInfo.amount || grams || "",
    quantityUnit: quantityInfo.unit || (grams ? "g" : product.quantityUnit || ""),
    updatedAt: today()
  };
  document.getElementById("quickProductName").value = name;
  document.getElementById("quickManufacturer").value = manufacturer;
  document.getElementById("quickBarcode").value = product.code || "";
  if (grams) document.getElementById("quickProductWeightGrams").value = grams;
  if (category) document.getElementById("quickProductCategory").value = category;
  document.getElementById("quickProductCategory").dataset.userEdited = category ? "true" : "false";
  updateQuickCategoryTabs();
  updateProductSearchGuide();
}

function getOriginalProductName(product) {
  return product.product_name_ja
    || product.generic_name_ja
    || product.product_name
    || product.generic_name
    || product.product_name_en
    || product.generic_name_en
    || "";
}

function getDisplayProductName(product) {
  const japaneseName = product.product_name_ja || product.generic_name_ja;
  if (japaneseName) return japaneseName.trim();
  const original = getOriginalProductName(product).trim();
  if (!original || containsJapanese(original)) return original;
  return translateCommonProductWords(original);
}

function containsJapanese(value) {
  return /[\u3040-\u30ff\u3400-\u9fff]/u.test(value);
}

function translateCommonProductWords(value) {
  let translated = value;
  PRODUCT_NAME_TRANSLATIONS.forEach(([source, target]) => {
    translated = translated.replace(new RegExp(`\\b${escapeRegExp(source)}\\b`, "gi"), target);
  });
  return translated;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rankAndDedupeProductCandidates(products, barcode = "") {
  const target = normalizeBarcodeValue(barcode);
  const seen = new Set();
  return products
    .filter((product) => {
      const code = normalizeBarcodeValue(product.code);
      const key = code || `${normalizeProductName(getDisplayProductName(product))}|${normalizeProductName(product.brands)}`;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => productCandidateScore(right, target) - productCandidateScore(left, target));
}

function productCandidateScore(product, targetBarcode) {
  let score = 0;
  if (targetBarcode && barcodesEquivalent(product.code, targetBarcode)) score += 100;
  if (getDisplayProductName(product)) score += 20;
  if (product.brands) score += 10;
  if (product.image_front_url || product.image_url || product.imageUrl) score += 8;
  if (product.quantity) score += 6;
  return score;
}

async function startBarcodeScan() {
  const status = document.getElementById("barcodeStatus");
  if (!navigator.mediaDevices?.getUserMedia) {
    status.textContent = "カメラを利用できません。Chromeで開くか、バーコードを手入力してください。";
    return;
  }
  if ("BarcodeDetector" in window) {
    await startNativeBarcodeScan();
    return;
  }
  if (window.ZXing?.BrowserMultiFormatReader) {
    await startZxingBarcodeScan();
    return;
  }
  status.textContent = "このブラウザでは読み取りできない場合があります。Chromeで開くか、手入力してください。";
}

async function startNativeBarcodeScan() {
  const status = document.getElementById("barcodeStatus");
  try {
    status.textContent = "カメラ起動中...";
    const video = document.getElementById("barcodeVideo");
    barcodeStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false
    });
    video.srcObject = barcodeStream;
    await video.play();
    document.getElementById("barcodeScanner").hidden = false;
    document.getElementById("stopBarcodeScan").hidden = false;
    status.textContent = "バーコードをカメラに映してください";
    scanBarcodeLoop(new BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] }));
  } catch (error) {
    status.textContent = "カメラを起動できませんでした。Chromeで開くか、手入力してください。";
    stopBarcodeScan();
  }
}

async function startZxingBarcodeScan() {
  const status = document.getElementById("barcodeStatus");
  try {
    status.textContent = "カメラ起動中...";
    document.getElementById("barcodeScanner").hidden = false;
    document.getElementById("stopBarcodeScan").hidden = false;
    zxingCodeReader = new ZXing.BrowserMultiFormatReader();
    await zxingCodeReader.decodeFromVideoDevice(null, "barcodeVideo", async (result) => {
      if (!result) return;
      document.getElementById("quickBarcode").value = result.getText();
      document.getElementById("barcodeStatus").textContent = "読み取りました。商品情報を検索中...";
      stopBarcodeScan();
      await lookupBarcodeProduct();
    });
    status.textContent = "バーコードをカメラに映してください";
  } catch (error) {
    status.textContent = "カメラを起動できませんでした。Chromeで開くか、手入力してください。";
    stopBarcodeScan();
  }
}

function scanBarcodeLoop(detector) {
  const video = document.getElementById("barcodeVideo");
  barcodeScanTimer = window.setInterval(async () => {
    if (!barcodeStream || video.readyState < 2) return;
    try {
      const codes = await detector.detect(video);
      if (!codes.length) return;
      const barcode = codes[0].rawValue;
      document.getElementById("quickBarcode").value = barcode;
      document.getElementById("barcodeStatus").textContent = "読み取りました。商品情報を検索中...";
      stopBarcodeScan();
      await lookupBarcodeProduct();
    } catch {
      document.getElementById("barcodeStatus").textContent = "読み取り中です";
    }
  }, 600);
}

function stopBarcodeScan(showNoCandidate = false) {
  if (zxingCodeReader) {
    zxingCodeReader.reset();
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
  const video = document.getElementById("barcodeVideo");
  video.srcObject = null;
  document.getElementById("barcodeScanner").hidden = true;
  document.getElementById("stopBarcodeScan").hidden = true;
  if (showNoCandidate && !document.getElementById("quickBarcode").value.trim()) {
    document.getElementById("barcodeStatus").textContent = "読み取り候補がありません。商品名を入力してください。";
    updateProductSearchGuide("商品名を入力し、「商品候補を検索」を押してください。");
  }
}

function normalizeBarcodeValue(value) {
  return String(value || "").replace(/\D/g, "");
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

async function lookupBarcodeProduct() {
  const barcodeInput = document.getElementById("quickBarcode");
  const barcode = normalizeBarcodeValue(barcodeInput.value);
  const status = document.getElementById("barcodeStatus");
  const button = document.getElementById("lookupBarcode");
  if (!barcode) {
    status.textContent = "読み取り候補がありません。商品名を入力してください。";
    updateProductSearchGuide("商品名を入力し、「商品候補を検索」を押してください。");
    return;
  }
  barcodeInput.value = barcode;
  if (!isValidRetailBarcode(barcode)) {
    status.textContent = "バーコード番号を正しく読み取れませんでした。もう一度読み取るか、番号を入力してください";
    return;
  }
  const savedProduct = findProductByBarcode(barcode);
  if (savedProduct) {
    openFoodFactsCandidates = [{
      code: savedProduct.barcode,
      product_name: savedProduct.name,
      brands: savedProduct.manufacturer,
      quantity: formatSavedProductQuantity(savedProduct),
      categories: savedProduct.category,
      image_front_url: savedProduct.imageUrl,
      source: savedProduct.source || "保存済み商品",
      savedProductId: savedProduct.id
    }];
    renderOpenFoodFactsResults(openFoodFactsCandidates);
    status.textContent = "保存済みの商品が見つかりました。内容を確認して選択してください。";
    return;
  }
  button.disabled = true;
  try {
    status.textContent = "バーコードで検索中...";
    const product = await requestOpenFoodFactsByBarcode(barcode);
    if (!product) {
      openFoodFactsCandidates = [];
      renderOpenFoodFactsResults(openFoodFactsCandidates);
      status.textContent = "商品情報が見つかりませんでした。商品名を入力して登録すると、次回から自動で表示されます";
      updateProductSearchGuide("商品名を入力して登録してください。バーコード番号はそのまま保存されます。");
      return;
    }
    if (!barcodesEquivalent(product.code, barcode)) {
      status.textContent = "商品情報が見つかりませんでした。商品名を入力して登録すると、次回から自動で表示されます";
      return;
    }
    openFoodFactsCandidates = [{ ...product, source: "Open Food Facts" }];
    renderOpenFoodFactsResults(openFoodFactsCandidates);
    status.textContent = "商品候補が見つかりました。内容を確認して選択してください。";
  } catch (error) {
    status.textContent = getSearchErrorMessage(error);
    updateProductSearchGuide("外部検索を使えない場合も、商品名を手入力して登録できます。");
  } finally {
    button.disabled = false;
  }
}

function findProductByBarcode(barcode) {
  const normalized = normalizeBarcodeValue(barcode);
  return state.products.find((product) => barcodesEquivalent(product.barcode, normalized)) || null;
}

function barcodesEquivalent(left, right) {
  const leftCode = normalizeBarcodeValue(left);
  const rightCode = normalizeBarcodeValue(right);
  if (leftCode === rightCode) return true;
  if (leftCode.length === 12 && rightCode === `0${leftCode}`) return true;
  if (rightCode.length === 12 && leftCode === `0${rightCode}`) return true;
  return false;
}

function formatSavedProductQuantity(product) {
  if (product.contentAmount && product.quantityUnit) return `${product.contentAmount} ${product.quantityUnit}`;
  if (product.weightGrams) return `${product.weightGrams} g`;
  if (product.unitCount) return `${product.unitCount} 個`;
  return "";
}

function getSearchErrorMessage(error) {
  const status = Number(error?.status);
  if (status === 429) return "現在、検索サービスを利用できません。手入力で登録できます";
  return navigator.onLine
    ? "検索サービスに接続できませんでした。手入力で登録できます"
    : "通信状況を確認して、もう一度お試しください";
}

function extractGrams(quantity) {
  const value = String(quantity || "").replace(",", ".").toLowerCase();
  const kg = value.match(/(\d+(?:\.\d+)?)\s*kg/);
  if (kg) return Math.round(Number(kg[1]) * 1000);
  const grams = value.match(/(\d+(?:\.\d+)?)\s*g/);
  if (grams) return Math.round(Number(grams[1]));
  return "";
}

function extractQuantityInfo(quantity) {
  const value = String(quantity || "").replace(",", ".").trim();
  const match = value.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|mL|l|L|個|本|袋|枚)/);
  if (!match) return { amount: "", unit: "" };
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === "kg") return { amount: Math.round(amount * 1000), unit: "g" };
  if (unit === "l") return { amount: amount * 1000, unit: "ml" };
  return { amount, unit: match[2] === "mL" ? "ml" : match[2] };
}

function getOpenFoodFactsCategory(product) {
  const text = [
    product.product_name_ja,
    product.generic_name_ja,
    product.product_name,
    product.generic_name,
    product.categories,
    ...(product.categories_tags || [])
  ].join(" ").toLowerCase();
  const rules = [
    { category: "お菓子", keywords: ["snack", "chips", "crisps", "chocolate", "cookie", "biscuit", "candy", "gummy", "sweets", "ポテトチップス", "チップス"] },
    { category: "飲料", keywords: ["beverage", "drink", "tea", "coffee", "juice", "soda", "water"] },
    { category: "卵・乳製品", keywords: ["dairy", "egg", "milk", "cheese", "yogurt", "butter"] },
    { category: "米・パン・麺", keywords: ["bread", "rice", "noodle", "pasta", "cereal", "麺", "パン"] },
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
    contentAmount: positiveNumberOrEmpty(document.getElementById("productWeightGrams").value)
      || positiveNumberOrEmpty(document.getElementById("productUnitCount").value)
      || existing?.contentAmount
      || "",
    quantityUnit: existing?.quantityUnit || (document.getElementById("productWeightGrams").value ? "g" : document.getElementById("productUnitCount").value ? "個" : ""),
    imageUrl: existing?.imageUrl || "",
    source: existing?.source || "手入力",
    sourceId: existing?.sourceId || "",
    updatedAt: today(),
    size: existing?.size || "",
    memo: document.getElementById("productMemo").value.trim()
  };
  upsert(state.products, item);
  resetProductForm();
  render();
  showSaveToast("商品を保存しました");
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
  const existing = findById(state.stores, document.getElementById("storeId").value);
  const item = {
    id: document.getElementById("storeId").value || uid(),
    name: document.getElementById("storeName").value.trim(),
    type: document.getElementById("storeType").value.trim(),
    area: document.getElementById("storeArea").value.trim(),
    address: document.getElementById("storeArea").value.trim() || existing?.address || "",
    latitude: existing?.latitude || "",
    longitude: existing?.longitude || "",
    externalId: existing?.externalId || "",
    source: existing?.source || "手入力",
    lastUsedAt: existing?.lastUsedAt || "",
    useCount: Number(existing?.useCount) || 0,
    memo: document.getElementById("storeMemo").value.trim()
  };
  upsert(state.stores, item);
  resetStoreForm();
  render();
  showSaveToast("店舗を保存しました");
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
  showSaveToast("価格を保存しました");
}

let saveToastTimer = null;

function showSaveToast(message) {
  const toast = document.getElementById("saveToast");
  if (!toast) return;
  window.clearTimeout(saveToastTimer);
  toast.textContent = message;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add("visible"));
  saveToastTimer = window.setTimeout(() => {
    toast.classList.remove("visible");
    window.setTimeout(() => {
      toast.hidden = true;
    }, 220);
  }, 1800);
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
  updateQuickCategoryTabs();
  document.getElementById("quickPriceDate").value = today();
  document.getElementById("openFoodFactsResults").innerHTML = "";
  document.getElementById("openFoodFactsStatus").textContent = "";
  document.getElementById("nearbyStoreResults").innerHTML = "";
  document.getElementById("nearbyStoreStatus").textContent = "";
  document.getElementById("productSuggestions").innerHTML = "";
  document.getElementById("productSuggestions").hidden = true;
  document.getElementById("barcodeStatus").textContent = "";
  updateProductSearchGuide();
  stopBarcodeScan();
  openFoodFactsCandidates = [];
  selectedProductMetadata = null;
  nearbyStoreCandidates = [];
  nearbyStorePage = 0;
  selectedNearbyStore = null;
  nearbySearchCenter = null;
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
          <span class="pill blue">${escapeHtml(text(item.address || item.area))}</span>
          ${item.source ? `<span class="pill">${escapeHtml(item.source)}</span>` : ""}
          ${item.useCount ? `<span class="pill orange">利用${item.useCount}回</span>` : ""}
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
  bestPriceGroups = buildBestPriceGroups();
  if (!bestPriceGroups.length) return renderEmpty(els.bestPriceList);
  els.bestPriceList.innerHTML = bestPriceGroups.map((group, index) => {
    const best = group.records[0];
    const bestStore = findById(state.stores, best.storeId);
    return `
      <article class="card best-row">
        <button type="button" class="best-product-link" onclick="openPriceComparison(${index})">
          <span>${escapeHtml(group.displayName)}</span>
          <small>店舗別の価格を見る</small>
        </button>
        <div class="best-row-result">
          <span>${escapeHtml(bestStore?.name || "店舗不明")}</span>
          <strong>${yen(best.amount)}</strong>
          <small>${escapeHtml(best.date || "")}</small>
        </div>
        ${group.hasDifferentAmounts ? '<p class="amount-warning">内容量が異なります</p>' : ""}
      </article>
    `;
  }).join("");
}

function buildBestPriceGroups() {
  const groups = new Map();
  state.products.forEach((product) => {
    const key = getProductGroupKey(product);
    if (!groups.has(key)) groups.set(key, { products: [], records: [] });
    groups.get(key).products.push(product);
  });
  state.prices.forEach((price) => {
    const product = findById(state.products, price.productId);
    if (!product) return;
    const group = groups.get(getProductGroupKey(product));
    if (group) group.records.push(price);
  });
  return [...groups.values()]
    .filter((group) => group.records.length)
    .map((group) => {
      group.records.sort((a, b) => Number(a.amount) - Number(b.amount) || String(b.date).localeCompare(String(a.date)));
      group.displayName = group.products[0]?.name || "商品名未設定";
      const amounts = new Set(group.products.map(productAmountSignature).filter(Boolean));
      group.hasDifferentAmounts = amounts.size > 1;
      return group;
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "ja"));
}

function getProductGroupKey(product) {
  const barcode = normalizeBarcodeValue(product.barcode);
  if (barcode) return `barcode:${barcode.length === 12 ? `0${barcode}` : barcode}`;
  return `name:${normalizeProductGroupName(product.name)}`;
}

function normalizeProductGroupName(value) {
  return String(value || "")
    .trim()
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0xFEE0))
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function productAmountSignature(product) {
  const amount = product.contentAmount || product.weightGrams || product.unitCount || "";
  const unit = product.quantityUnit || (product.weightGrams ? "g" : product.unitCount ? "個" : "");
  return amount ? `${amount}:${unit}` : "";
}

function openPriceComparison(index) {
  const group = bestPriceGroups[index];
  if (!group) return;
  const dialog = document.getElementById("priceComparisonDialog");
  const latestByStore = new Map();
  group.records.forEach((price) => {
    const current = latestByStore.get(price.storeId);
    if (!current || String(price.date).localeCompare(String(current.date)) > 0) {
      latestByStore.set(price.storeId, price);
    }
  });
  const prices = [...latestByStore.values()]
    .sort((a, b) => Number(a.amount) - Number(b.amount) || String(b.date).localeCompare(String(a.date)));
  document.getElementById("priceComparisonTitle").textContent = group.displayName;
  const notice = document.getElementById("priceComparisonNotice");
  notice.hidden = !group.hasDifferentAmounts;
  notice.textContent = group.hasDifferentAmounts
    ? "内容量が異なる記録があります。販売価格と単価をあわせて確認してください。"
    : "";
  document.getElementById("priceComparisonList").innerHTML = prices.map((price, priceIndex) => {
    const product = findById(state.products, price.productId);
    const store = findById(state.stores, price.storeId);
    const amounts = productAmountLabels(product).join(" / ");
    const units = unitPriceLabels(price, product).join(" / ");
    return `
      <article class="comparison-row">
        <span class="comparison-rank">${priceIndex + 1}</span>
        <div>
          <strong>${escapeHtml(store?.name || "店舗不明")}</strong>
          <p>${escapeHtml([price.date, amounts, units].filter(Boolean).join(" ・ "))}</p>
        </div>
        <strong class="comparison-price">${yen(price.amount)}</strong>
      </article>
    `;
  }).join("");
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function closePriceComparison() {
  const dialog = document.getElementById("priceComparisonDialog");
  if (typeof dialog.close === "function" && dialog.open) dialog.close();
  else dialog.removeAttribute("open");
}

function closePriceComparisonFromBackdrop(event) {
  if (event.target === event.currentTarget) closePriceComparison();
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
  document.getElementById("storeArea").value = item.address || item.area;
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
    products: ["id", "name", "manufacturer", "category", "barcode", "weightGrams", "unitCount", "contentAmount", "quantityUnit", "imageUrl", "source", "sourceId", "updatedAt", "size", "memo"],
    stores: ["id", "name", "type", "area", "address", "latitude", "longitude", "externalId", "source", "lastUsedAt", "useCount", "memo"],
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
        Object.assign(item, migrateProduct(item));
      }
      if (type === "stores") {
        Object.assign(item, migrateStore(item));
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
