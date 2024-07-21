
var map = (() => {
    // Karteneinstellungen
    var tileUrl = '//a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png ';
    var attribution = `
        Map data &copy; <a href="https://openstreetmap.org" target="_blank">OpenStreetMap</a> contributors,
            <a href="https://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a><br/>
        <b>Datenstand:</b> 21.07.2024<br />
        <b>ADFC Hamburg:</b>
            <a href="https://hamburg.adfc.de/impressum/" target="_blank">Impressum</a> | <a href="https://hamburg.adfc.de/datenschutz" target="_blank">Datenschutz</a><br />
        `;

    var map = L.map('map', {
        renderer: L.canvas(),
        maxBounds: L.latLngBounds(L.latLng(53.3, 9.6), L.latLng(53.7, 10.4))
    }).setView([53.5, 10], 14);
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


const layer_quality = L.featureGroup([]);
const layer_stress = L.featureGroup([]);
const layer_missing = L.featureGroup([]);

L.control.layers({
    "Quality": layer_quality,
    "Stress": layer_stress,
    "Fehlende Daten": layer_missing
}, {},{collapsed: false}).addTo(map);


const quality_data = await cachingJsonClient.getFromCacheOrFetchFromUrl("data/cycling_quality/cycling_quality_index.geojson");

const indexToColor = (index) => {
    if (index > 80) {
        return "darkgreen";
    }
    if (index > 60) {
        return "LawnGreen";
    }
    if (index > 50) {
        return "yellow";
    }
    if (index > 30) {
        return "orange";
    }
    if (index > 20) {
        return "red";
    }    
    return "darkred";
};

const stressToColor = (stress) => {
    switch (stress) {
        case 1: return "darkgreen";
        case 2: return "yellow";
        case 3: return "orange";
        case 4: return "red";
        default: return "grey";
    }
};

const missingToColor = (incompleteness) => {
    if (incompleteness == 0) {
        return "#fff";
    }
    if (incompleteness < 10) {
        return "#aaa";
    }
    if (incompleteness < 20) {
        return "#999";
    }
    if (incompleteness < 30) {
        return "#888";
    }
    if (incompleteness < 40) {
        return "#777";
    }
    if (incompleteness < 50) {
        return "#666";
    }
    if (incompleteness < 60) {
        return "#555";
    }
    if (incompleteness < 70) {
        return "#444";
    }
    if (incompleteness < 80) {
        return "#333";
    }
    if (incompleteness < 90) {
        return "#222";
    }
    if (incompleteness < 100) {
        return "#111";
    }
    if (incompleteness === 100) {
        return "#000";
    }
    return "f00";
};

const missingDataToOpacity = (data_incompleteness) => {
    return 1-(data_incompleteness/100);
};

const propertyNames = {
    "id": "ID",
    "index": "Index",
    "data_incompleteness": "Unvollständigkeit (0-100)",
    "data_missing": "Fehlende Daten",
    "data_bonus": "Bonus",
    "data_malus": "Malus",
    "proc_width": "Breite",
    "proc_surface": "Oberfläche",
    "proc_maxspeed": "Tempolimit",
    "proc_mandatory": "Benutzungspflicht",
    "proc_smoothness": "Oberflächenqualität",
    "stress_level": "Stress",
    "way_type": "Wegtyp"
};

const mapPropertyName = (property) => {
    return property in propertyNames ? propertyNames[property] : property;
};

const mapFeatureToPopupText = (featureProperties) => {
    const content = Object.entries(featureProperties)
        .filter(([key, value]) => (Object.keys(propertyNames).includes(key)))
        .map(([key, value], i) => `${mapPropertyName(key)}: ${value||"-"}`)
        .join("<br />");
  
    return content;
};

const featureToOpacity = (feature) => {
    return feature.properties.proc_mandatory === "prohibited" ? 0 : 1 /*missingDataToOpacity(feature.properties.data_incompleteness)*/;
};

layer_quality.addLayer(L.geoJSON(quality_data, {
    style: (_feature) => ({
        color: indexToColor(_feature.properties.index),
        weight: 4,
        opacity: featureToOpacity(_feature)
    }), 
    onEachFeature: (feature, layer) => {
        const content = mapFeatureToPopupText(feature.properties);
        layer.bindPopup(content);
    }
}));

layer_stress.addLayer(L.geoJSON(quality_data, {
    style: (_feature) => ({
        color: stressToColor(_feature.properties.stress_level),
        weight: 4,
        opacity: featureToOpacity(_feature)
    }), 
    onEachFeature: (feature, layer) => {
        const content = mapFeatureToPopupText(feature.properties);
        layer.bindPopup(content);
    }
}));

layer_missing.addLayer(L.geoJSON(quality_data, {
    style: (_feature) => ({
        color: missingToColor(_feature.properties.data_incompleteness),
        weight: 4,
        opacity: 1
    }), 
    onEachFeature: (feature, layer) => {
        const content = mapFeatureToPopupText(feature.properties);
        layer.bindPopup(content);
    }
}));

layer_quality.addTo(map);

document.getElementById("loadingHint").style.display = "none";
