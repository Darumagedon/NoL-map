// ----------------------------
// Leaflet 地図
// ----------------------------

const map = L.map("map").setView(
    [36.2048, 138.2529],
    5
);


// ----------------------------
// OpenStreetMap
// ----------------------------

L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,

        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
).addTo(map);


// ----------------------------
// 店舗データ
// ----------------------------

let stores = [];

let markers = [];


// ----------------------------
// JSON読み込み
// ----------------------------

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

        stores = data;

        displayStores(stores);

    })

    .catch(error => {

        console.error(error);

        document.getElementById(
            "store-list"
        ).innerHTML =
            "<p>店舗データを読み込めませんでした。</p>";

    });


// ----------------------------
// 店舗表示
// ----------------------------

function displayStores(storeData) {

    const list =
        document.getElementById("store-list");

    const count =
        document.getElementById("store-count");


    list.innerHTML = "";

    count.textContent =
        `${storeData.length} 店舗`;


    // 既存マーカー削除

    markers.forEach(marker => {

        map.removeLayer(marker);

    });

    markers = [];


    storeData.forEach(store => {

        // --------------------
        // 店舗一覧
        // --------------------

        const item =
            document.createElement("div");

        item.className = "store";


        const tags =
            (store.tags || [])
            .map(tag =>
                `<span class="tag">${tag}</span>`
            )
            .join("");


        const coordinateMessage =
            store.lat == null ||
            store.lng == null

            ? `<div class="no-coordinate">
                地図位置未登録
               </div>`

            : "";


        item.innerHTML = `

            <div class="store-name">
                ${store.name}
            </div>

            <div class="store-address">
                ${store.address}
            </div>

            <div class="store-tags">
                ${tags}
            </div>

            ${coordinateMessage}

        `;


        list.appendChild(item);


        // --------------------
        // 地図マーカー
        // --------------------

        if (
            store.lat != null &&
            store.lng != null
        ) {

            const marker =
                L.marker([
                    store.lat,
                    store.lng
                ]);


            marker.bindPopup(`

                <strong>
                    ${store.name}
                </strong>

                <br>

                ${store.address}

            `);


            marker.addTo(map);

            markers.push(marker);


            // 一覧クリック
            item.addEventListener(
                "click",
                () => {

                    map.setView(
                        [
                            store.lat,
                            store.lng
                        ],
                        16
                    );

                    marker.openPopup();

                }
            );

        }

    });

}


// ----------------------------
// 検索
// ----------------------------

document
    .getElementById("search")
    .addEventListener(
        "input",
        event => {

            const word =
                event.target.value
                .trim()
                .toLowerCase();


            const filtered =
                stores.filter(store => {

                    return (

                        store.name
                            .toLowerCase()
                            .includes(word)

                        ||

                        store.address
                            .toLowerCase()
                            .includes(word)

                        ||

                        (store.tags || [])
                            .some(tag =>
                                tag
                                .toLowerCase()
                                .includes(word)
                            )

                    );

                });


            displayStores(filtered);

        }
    );