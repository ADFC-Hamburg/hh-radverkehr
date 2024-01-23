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
    constructor(name, dataProvider, filterMinAnzahl) {
        this.name = name;
        this.dataProvider = dataProvider;
        this.filterMinAnzahl = filterMinAnzahl;
    }

    async renderGeoDatenNachAnzahlUndGeschwindigkeit(outlineAbAnzahl, initPopup) {
        const geoData = await this.dataProvider();

        const getMaxAnzahl = (features) => {
            return features.sort((feature1, feature2) => {
                return feature2.properties.anzahl - feature1.properties.anzahl;
            })[0].properties.anzahl;
        };

        const maxAnzahl = getMaxAnzahl(geoData.features);

        // automatische Gewichtung der Streckenabschnitte relativ zum Maximalwert
        const anzahlGewichtetToWeight = (anzahl, maxAnzahl) => {
            const minAnzahl = 8;
            const normiert = (anzahl - minAnzahl) / (maxAnzahl - minAnzahl); 
            const weight = 2 + (5 * normiert); // Zahl zwischen 2 bis 7
            return weight;
        };

        // Farbe je nach gemessener Durchschnittsgeschwindigkeit
        const colorFromSpeed = (speed) => {
            if (speed < 10) {
                return "red";
            } else if (speed < 12) {
                return "red";
            } else if (speed < 18) {
                return "orange";
            } else if (speed < 21) {
                return "yellow";
            } else if (speed < 30) {
                return "green";
            }
            return "black"; // there should be no records of speed >= 30
        };

        // Hervorhebung von Streckenabschnitten, indem ein zweiter Layer darunter eingeblendet wird
        const getLayerWithOutline = (geoJson, optionsOutline, optionsFill) => {
            return [L.geoJSON(geoJson, optionsOutline), L.geoJSON(geoJson, optionsFill)];
        };

        const outlineOptions = {style: (feature) => ({
            color: "black",
            weight: anzahlGewichtetToWeight(feature.properties.anzahl, maxAnzahl) + 1,
            opacity: feature.properties.anzahl > outlineAbAnzahl ? 1 : 0
        })};
        const fillOptions = {style: (feature) => ({
                color: colorFromSpeed(feature.properties.geschwindigkeit),
                weight: anzahlGewichtetToWeight(feature.properties.anzahl, maxAnzahl),
                opacity: 1
            }), onEachFeature: (feature, layer) => {
                layer.bindPopup("Lade.... ", {maxWidth: 500}).on("popupopen", initPopup(feature));

                // Strecke beim Hovern hervorheben
                const initColor = layer.options.color;
                const initWeight = layer.options.weight;                    
                layer.on("mouseover", () => layer.setStyle({ color: 'cyan', weight: initWeight + 2}));
                layer.on("mouseout", () => layer.setStyle({ color: initColor, weight: initWeight }));
        }};

        return getLayerWithOutline(geoData, outlineOptions, fillOptions);
    };


}





const datePlusOneDay = (dateString) => {
    const parsedDate = new Date(dateString);
    parsedDate.setDate(parsedDate.getDate() + 1);
    return parsedDate.toISOString().split('T')[0];
};

const yesterday = () => {
    const aDate = new Date();
    aDate.setDate(aDate.getDate() - 1);
    return aDate.toISOString().split('T')[0];
};

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
            data2022: "data/dbrad_jahr_2022.json.min",
            data2023: "data/dbrad_jahr_2023.json",
            data2024: "data/dbrad_jahr_2024.json",
            data_letzte_woche: "data/dbrad_letzte_woche.json",
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
        return await cachingJsonClient.getFromCacheOrFetchFromUrl(`data/dbrad_woche_${encodeURIComponent(searchForDateFileName)}.json`);
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
    // const data_letzte_woche = await dataProvider.getDataForLetzte7Tage();


    const filterGeoJsonNachAnzahl = (data, mindestAnzahl) => {
        return { type: data.type, name: data.name, features: data.features.filter((feature) => {
            return feature.properties.anzahl >= mindestAnzahl;
        })}
    }; 


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

    
    const dbrad_letzte_woche = await new TrafficLayer('letzte_woche', async () => dataProvider.getDataForLetzte7Tage(), 20).renderGeoDatenNachAnzahlUndGeschwindigkeit(20, initPopup);
    
    // wird später nachgeladen
    const layer_velogruppe = L.featureGroup([]);
    const layer_woche = L.featureGroup([]);
    const layer_2022 = L.featureGroup([]);
    const layer_2023 = L.featureGroup([]);
    const layer_2024 = L.featureGroup([]);

    L.control.layers({
        "Daten 2022": layer_2022,
        "Daten 2023": layer_2023,
        "Daten 2024": layer_2024,
        "Daten Vergangene 7 Tage": L.featureGroup(dbrad_letzte_woche).addTo(map),
        "Daten Woche bis (Datum unten auswählen)": layer_woche,
    }, {
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
                    (await new TrafficLayer('gewaehlte_woche', async () => woche, 20).renderGeoDatenNachAnzahlUndGeschwindigkeit(20, initPopup)).forEach(l => layer_woche.addLayer(l));
                }
            };
            return datepicker;
        }
    });

    new L.Control.Datepicker({ position: 'topright' }).addTo(map);

    document.getElementById("loadingHint").style.display = "none";

    // Nachladen KW
    const data2022 = await dataProvider.getDataFor2022();
    const dbrad2022 = await new TrafficLayer('2022', async () => filterGeoJsonNachAnzahl(data2022, 70), 20).renderGeoDatenNachAnzahlUndGeschwindigkeit(2000, initPopup);
    dbrad2022.forEach(l => layer_2022.addLayer(l));

    const data2023 = await dataProvider.getDataFor2023();
    const dbrad2023 = await new TrafficLayer('2023', async () => data2023, 20).renderGeoDatenNachAnzahlUndGeschwindigkeit(45, initPopup);
    dbrad2023.forEach(l => layer_2023.addLayer(l));

    const data2024 = await dataProvider.getDataFor2024();
    const dbrad2024 = await new TrafficLayer('2024', async () => data2024, 20).renderGeoDatenNachAnzahlUndGeschwindigkeit(45, initPopup);
    dbrad2024.forEach(l => layer_2024.addLayer(l));

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