
import { fillStyleForFeature, outlineStyleForFeature, datePlusOneDay, yesterday, LocationFragment } from "./model.js";


var map = (() => {
    // Karteneinstellungen
    var tileUrl = '//a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png ';
    var attribution = `
        Map data &copy; <a href="https://openstreetmap.org" target="_blank">OpenStreetMap</a> contributors,
            <a href="https://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a><br/>
        <b>Radverkehrsmengen (DB Rad+):</b> 
            <a href="https://metaver.de/trefferanzeige?docuuid=0CFF2923-AAEC-42FE-8DE8-A2C56A3EA1CF" target="_blank">Behörde für Verkehr und Mobilitätswende (BVM)</a>
            (Lizenz: <a href="https://www.govdata.de/dl-de/by-2-0" target="blank">dl-de/by-2-0</a>)<br/>
        <b>Velorouten:</b>
            <a href="https://metaver.de/trefferanzeige?docuuid=8254E244-7DD3-401D-AA15-4CDE78D4E91F" target="_blank">Behörde für Verkehr und Mobilitätswende (BVM)</a>
            (Lizenz: <a href="https://www.govdata.de/dl-de/by-2-0" target="blank">dl-de/by-2-0</a>)<br />
        <b>ADFC Hamburg:</b>
            <a href="https://hamburg.adfc.de/impressum/" target="_blank">Impressum</a> | <a href="https://hamburg.adfc.de/datenschutz" target="_blank">Datenschutz</a><br />
        `;

    var map = L.map('map', {
        renderer: L.canvas(),
        maxBounds: L.latLngBounds(L.latLng(53.3, 9.6), L.latLng(53.7, 10.4))
    }).setView([53.54, 10], 13);
    L.tileLayer(tileUrl, {
        attribution: attribution,
        maxZoom: 18
    }).addTo(map);
    return map;
})();


var cachingJsonClient = function() {
    const cached = {};

    const _fetchJson = (url) => {
        return fetch(url).then(resp => resp.json()).catch(e => {
            showError("Die Daten für den gewählten Zeitraum sind leider nicht verfügbar.");
            console.log(`url: ${url}; error: ${e}`);
            return {features: []};
        });
    };

    const getFromCacheOrFetchFromUrl = async (url) => {
        if (cached[url]) {
            return cached[url];
        } else {
            cached[url] = await _fetchJson(url);
            return cached[url];
        }
    };
    return { getFromCacheOrFetchFromUrl: getFromCacheOrFetchFromUrl };
}();


class TrafficLayer {
    constructor(name, dataProvider, filterMinAnzahl, outlineAbAnzahl, initPopup) {
        this.name = name;
        this.dataProvider = dataProvider;
        this.filterMinAnzahl = filterMinAnzahl;
        this.rendered = null;
        this.outlineAbAnzahl = outlineAbAnzahl;
        this.initPopup = initPopup;
    }

    async renderGeoDatenNachAnzahlUndGeschwindigkeit() {
        if (this.rendered) {
            return this.rendered;
        }
    
        const getMaxAnzahl = (features) => {
            if (features.length == 0) {
                return 0;
            }
            return features.sort((feature1, feature2) => {
                return feature2.properties.anzahl - feature1.properties.anzahl;
            })[0].properties.anzahl;
        };

        const filterGeoJsonNachAnzahl = (data, mindestAnzahl) => {
            return { type: data.type, name: data.name, features: data.features.filter((feature) => {
                return feature.properties.anzahl >= mindestAnzahl;
            })};
        }; 

        const geoData = filterGeoJsonNachAnzahl(await this.dataProvider(), this.filterMinAnzahl);


        // Hervorhebung von Streckenabschnitten, indem ein zweiter Layer darunter eingeblendet wird
        const getLayerWithOutline = (geoJson, optionsOutline, optionsFill) => {
            return [L.geoJSON(geoJson, optionsOutline), L.geoJSON(geoJson, optionsFill)];
        };

        const maxAnzahl = getMaxAnzahl(geoData.features);
        const outlineOptions = {style: (feature) => (outlineStyleForFeature(feature, maxAnzahl, this.outlineAbAnzahl))};
        const fillOptions = {style: (feature) => (fillStyleForFeature(feature, maxAnzahl)), onEachFeature: (feature, layer) => {
                layer.bindPopup("Lade.... ", {maxWidth: 500}).on("popupopen", this.initPopup(feature));

                // Strecke beim Hovern hervorheben
                const initColor = layer.options.color;
                const initWeight = layer.options.weight;                    
                layer.on("mouseover", () => layer.setStyle({ color: 'cyan', weight: initWeight + 2}));
                layer.on("mouseout", () => layer.setStyle({ color: initColor, weight: initWeight }));
        }};

        this.rendered = getLayerWithOutline(geoData, outlineOptions, fillOptions);

        return this.rendered;
    };
}



const showError = (message) => {
    const errorElement = document.getElementById("errorMessage");

    errorElement.innerHTML = message;
    errorElement.style.display = "block";
    errorElement.addEventListener("click", () => {
        errorElement.style.display = "none";
    })
    window.setTimeout(function() {
        errorElement.style.display = "none";
    }, 5000);
};

class DataProvider {
    constructor() {
        this.config = {
            urls: {
            data2022: "data/dbrad/dbrad_jahr_2022.json.min",
            data2023: "data/dbrad/dbrad_jahr_2023.json",
            data2024: "data/dbrad/dbrad_jahr_2024.json",
            data_letzte_woche: "data/dbrad/dbrad_letzte_woche.json",
            velorouten: [
                "data/velorouten/veloroute1.json",
                "data/velorouten/veloroute2.json",
                "data/velorouten/veloroute3.json",
                "data/velorouten/veloroute4.json",
                "data/velorouten/veloroute5.json",
                "data/velorouten/veloroute6.json",
                "data/velorouten/veloroute7.json",
                "data/velorouten/veloroute8.json",
                "data/velorouten/veloroute9.json",
                "data/velorouten/veloroute10.json",
                "data/velorouten/veloroute11.json",
                "data/velorouten/veloroute12.json",
                "data/velorouten/veloroute13.json",
                "data/velorouten/veloroute14.json",
                "data/velorouten/veloroute-verb.json",
            ]
            }
        };
    }

    async getDataFor2022() {
        return cachingJsonClient.getFromCacheOrFetchFromUrl(this.config.urls.data2022);
    }

    async getDataFor2023() {
        return await cachingJsonClient.getFromCacheOrFetchFromUrl(this.config.urls.data2023);
    }

    async getDataFor2024() {
        return await cachingJsonClient.getFromCacheOrFetchFromUrl(this.config.urls.data2024);
    }


    async getDataForLetzte7Tage() {
        return await cachingJsonClient.getFromCacheOrFetchFromUrl(this.config.urls.data_letzte_woche);
    }

    async getWocheFor(dateString) {
        const searchForDateFileName = datePlusOneDay(dateString); // +1, weil Datensatz vom 2023-02-05 nur die Daten bis 2023-02-04 enthält
        return await cachingJsonClient.getFromCacheOrFetchFromUrl(`data/dbrad/dbrad_woche_${encodeURIComponent(searchForDateFileName)}.json`);
    }

    async getVelorouten() {
        return await Promise.all(this.config.urls.velorouten.map(url => cachingJsonClient.getFromCacheOrFetchFromUrl(url)));
    }

    async getFeaturesFuerKoordinaten(koordinaten) {
        return [
            {name: '2022', data: await this.getDataFor2022()},
            {name: '2023', data: await this.getDataFor2023()},
            {name: '2024 bisher', data: await this.getDataFor2024()},
            {name: 'Letzte 7 Tage', data: await this.getDataForLetzte7Tage()}
        ].map(data => {
            return {
                    name: data.name,
                    data: data.data.features.filter(f => JSON.stringify(f.geometry.coordinates) == JSON.stringify(koordinaten))[0] 
                 };
        });
    }
}

const dataProvider = new DataProvider();


// Hier ist der eigentliche Ablauf der Seite als asynchrone Funktion, um Oberfläche nicht zu blockieren
const start = async () => {

    const locationFragment = new LocationFragment(window);
    const minAnzahl = locationFragment.hasParameter("minAnzahl") ? locationFragment.getParameter("minAnzahl") : 0;
    const selectedLayer = locationFragment.hasParameter("layer") ? locationFragment.getParameter("layer") : "";
    console.log("Zeige nur Strecken mit mind. Fahrten: ", minAnzahl);
    console.log("Ausgewählter Layer: ", selectedLayer);

    const geschwindigkeitenFuerAbschnitt = async (feature) => {
        // hole Daten basierend auf Koordinaten für aktuellen Abschnitt
        const features = await dataProvider.getFeaturesFuerKoordinaten(feature.geometry.coordinates);
        features.push({ name: `Aktuelle Ansicht (${feature.properties.von} - ${feature.properties.bis}):` , data: feature});

        const eintraege = features.map(f => {
            const geschwindigkeit = f?.data?.properties.geschwindigkeit ?? "-";
            const anzahl = f?.data?.properties.anzahl ?? "-";

            return `
                <b>${f.name}</b> ${geschwindigkeit} (basierend auf ${anzahl} Fahrten)
            `;
        });

        return `
            Gemessene Durchschnittsgeschwindigkeiten für diesen Abschnitt in km/h:<br />
            ${eintraege.join('<br />')}
        `;
    };

    const initPopup = (feature) => { // Lade Content erst beim Klick, sonst werden alle Popupinhalte beim Laden der Seite erzeugt!
        return async (event) => event.popup.setContent(await geschwindigkeitenFuerAbschnitt(feature));
    };

    
    const defaultLayerDefinitions = {
        "Daten 2022": new TrafficLayer('2022', () => dataProvider.getDataFor2022(), minAnzahl, 45, initPopup),
        "Daten 2023": new TrafficLayer('2023', () => dataProvider.getDataFor2023(), minAnzahl, 45, initPopup),
        "Daten 2024": new TrafficLayer('2024', () => dataProvider.getDataFor2024(), minAnzahl, 45, initPopup),
        "Daten Vergangene 7 Tage": new TrafficLayer('letzte_woche', () => dataProvider.getDataForLetzte7Tage(), minAnzahl, 20, initPopup)
    };
    
    
    // wird später nachgeladen
    const layer_velogruppe = L.featureGroup([]);
    const layer_woche = L.featureGroup([]);
    const layer_2022 = L.featureGroup([]);
    const layer_2023 = L.featureGroup([]);
    const layer_2024 = L.featureGroup([]);
    const layer_letzte_woche = L.featureGroup([]);

    const verkehrslayerGroup = {
        "Daten 2022": layer_2022,
        "Daten 2023": layer_2023,
        "Daten 2024": layer_2024,
        "Daten Vergangene 7 Tage": layer_letzte_woche,
        "Daten Woche bis (Datum unten auswählen)": layer_woche,
    };

    const renderLayerAndAddToMap = async (layerName) => {
        (await defaultLayerDefinitions[layerName].renderGeoDatenNachAnzahlUndGeschwindigkeit()).forEach(l => verkehrslayerGroup[layerName].addLayer(l));
        verkehrslayerGroup[layerName].addTo(map);
    }

    if (verkehrslayerGroup.hasOwnProperty(selectedLayer) && defaultLayerDefinitions.hasOwnProperty(selectedLayer)) {
        renderLayerAndAddToMap(selectedLayer);
    } else {
        renderLayerAndAddToMap("Daten Vergangene 7 Tage");
    }

    L.control.layers(verkehrslayerGroup, {
        "Velorouten": layer_velogruppe.bringToBack()
    }, {collapsed: false}).addTo(map);

    L.Control.Datepicker = L.Control.extend({
        onAdd: function(map) {
            var datepicker = L.DomUtil.create('input');
            datepicker.type = 'date';
            datepicker.min = '2023-01-28';
            datepicker.max = yesterday();
            datepicker.onchange = async () => {
                layer_woche.clearLayers();
                const woche = await dataProvider.getWocheFor(datepicker.value);
                if (woche.features.length > 0) {
                    (await new TrafficLayer('gewaehlte_woche', async () => woche, minAnzahl, 20, initPopup).renderGeoDatenNachAnzahlUndGeschwindigkeit()).forEach(l => layer_woche.addLayer(l));
                }
            };
            return datepicker;
        }
    });

    new L.Control.Datepicker({ position: 'topright' }).addTo(map);

    (await defaultLayerDefinitions["Daten 2022"].renderGeoDatenNachAnzahlUndGeschwindigkeit()).forEach(l => layer_2022.addLayer(l));
    (await defaultLayerDefinitions["Daten 2023"].renderGeoDatenNachAnzahlUndGeschwindigkeit()).forEach(l => layer_2023.addLayer(l));
    (await defaultLayerDefinitions["Daten 2024"].renderGeoDatenNachAnzahlUndGeschwindigkeit()).forEach(l => layer_2024.addLayer(l));

    document.getElementById("loadingHint").style.display = "none";

    // Nachladen der Velorouten
    const velorouten_data = await dataProvider.getVelorouten();
    const velorouten = velorouten_data.map(veloroute => {
        return L.geoJSON(veloroute, {style: (feature) => ({
            color: "blue",
            weight: 8,
            opacity: 0.3
        })});
    });
    velorouten.forEach(veloroute => layer_velogruppe.addLayer(veloroute));  
};

start();