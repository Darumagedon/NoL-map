const map = L.map("map").setView([36.2048, 138.2529], 5);

L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
).addTo(map);

let stores = [];
const markerLayer = L.layerGroup().addTo(map);

// HTTP・HTTPSのURLだけをリンクにする
function safeUrl(value) {
    if (typeof value !== "string" || !value.trim()) {
        return null;
    }

    try {
        const url = new URL(value.trim());

        return ["https:", "http:"].includes(url.protocol)
            ? url.href
            : null;
    } catch {
        return null;
    }
}

// P-WORLD・DMMのリンクを追加
function addLinks(container, store) {
    const links = document.createElement("div");
    links.className = "store-links";
    links.style.marginTop = "8px";

    const services = [
        ["P-WORLD", store.pworld_url],
        ["DMMぱちタウン", store.dmm_url]
    ];

    for (const [label, value] of services) {
        const url = safeUrl(value);
        if (!url) continue;

        const link = document.createElement("a");

        link.textContent = label;
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        link.style.display = "inline-block";
        link.style.marginRight = "12px";
        link.style.padding = "4px 0";

        // リンクを押したときは、店舗クリックによる地図移動をしない
        link.addEventListener("click", event => {
            event.stopPropagation();
        });

        links.appendChild(link);
    }

    if (links.childElementCount > 0) {
        container.appendChild(links);
    }
}

function addText(container, className, value) {
    const element = document.createElement("div");

    element.className = className;
    element.textContent = value ?? "";

    container.appendChild(element);

    return element;
}

function hasCoordinates(store) {
    return (
        typeof store.lat === "number" &&
        Number.isFinite(store.lat) &&
        Math.abs(store.lat) <= 90 &&
        typeof store.lng === "number" &&
        Number.isFinite(store.lng) &&
        Math.abs(store.lng) <= 180
    );
}

// 店舗一覧とマーカーを表示
function displayStores(storeData) {
    const list = document.getElementById("store-list");
    const count = document.getElementById("store-count");

    list.replaceChildren();
    count.textContent = `${storeData.length} 店舗`;

    markerLayer.clearLayers();

    for (const store of storeData) {
        const item = document.createElement("div");
        item.className = "store";

        addText(item, "store-name", store.name);
        addText(item, "store-address", store.address);

        const tags = document.createElement("div");
        tags.className = "store-tags";

        const storeTags = Array.isArray(store.tags)
            ? store.tags
            : [];

        for (const tag of storeTags) {
            const badge = document.createElement("span");

            badge.className = "tag";
            badge.textContent = tag;

            tags.appendChild(badge);
        }

        item.appendChild(tags);
        addLinks(item, store);
        list.appendChild(item);

        if (!hasCoordinates(store)) {
            addText(
                item,
                "no-coordinate",
                "地図位置未登録"
            );
            continue;
        }

        // 地図の吹き出し
        const popup = document.createElement("div");
        const title = document.createElement("strong");

        title.textContent = store.name ?? "";
        popup.appendChild(title);

        addText(popup, "store-address", store.address);
        addLinks(popup, store);

        const marker = L.marker([store.lat, store.lng])
            .bindPopup(popup)
            .addTo(markerLayer);

        item.style.cursor = "pointer";

        item.addEventListener("click", () => {
            map.setView([store.lat, store.lng], 16);
            marker.openPopup();
        });
    }
}

// 検索
function applySearch() {
    const word = document
        .getElementById("search")
        .value
        .trim()
        .toLowerCase();

    const filtered = stores.filter(store => {
        const name = String(store.name ?? "").toLowerCase();
        const address = String(store.address ?? "").toLowerCase();

        const tags = Array.isArray(store.tags)
            ? store.tags
            : [];

        return (
            name.includes(word) ||
            address.includes(word) ||
            tags.some(tag =>
                String(tag).toLowerCase().includes(word)
            )
        );
    });

    displayStores(filtered);
}

document
    .getElementById("search")
    .addEventListener("input", applySearch);

// JSON読み込み
fetch("data/stores.json")
    .then(response => {
        if (!response.ok) {
            throw new Error(
                "店舗データの読み込みに失敗しました"
            );
        }

        return response.json();
    })
    .then(data => {
        if (!Array.isArray(data)) {
            throw new Error("店舗データの形式が不正です");
        }

        stores = data;
        applySearch();
    })
    .catch(error => {
        console.error(error);

        document.getElementById("store-count").textContent = "";

        const list = document.getElementById("store-list");
        list.replaceChildren();

        addText(
            list,
            "load-error",
            "店舗データを読み込めませんでした。"
        );
    });
