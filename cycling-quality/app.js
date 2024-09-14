let protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

let PMTILES_URL = "data/hh.pmtiles";
const p = new pmtiles.PMTiles(PMTILES_URL);

// this is so we share one instance across the JS code and the map renderer
protocol.add(p);

const cycle_quality_layer = {
  id: "cycle_quality",
  source: "cycle_quality",
  "source-layer": "default",
  layout: {
    visibility: "visible",
  },
  type: "line",
  filter: ["==", ["get", "filter_usable"], 1],
  paint: {
    "line-color": [
      "step",
      ["get", "index"],
      "#7a0403",
      10,
      "#ab1b04",
      20,
      "#d54a12",
      30,
      "#f5a038",
      40,
      "#f3cf33",
      50,
      "#e6f122",
      60,
      "#a7c878",
      70,
      "#679fce",
      80,
      "#4473e1",
      90,
      "#436dda",
      100,
      "#4143a7",
    ],
    "line-width": ["interpolate", ["linear"], ["zoom"], 0, 1, 10, 1, 22, 12],
    "line-offset": [
      "interpolate",
      ["linear"],
      ["zoom"],
      0,
      ["match", ["get", "side"], ["right"], 1, ["left"], -1, 0],
      10,
      ["match", ["get", "side"], ["right"], 1, ["left"], -1, 0],
      22,
      ["match", ["get", "side"], ["right"], 12, ["left"], -12, 0],
    ],
  },
};

const stress_layer = {
  id: "stress",
  source: "cycle_quality",
  "source-layer": "default",
  type: "line",
  layout: {
    visibility: "none",
  },
  filter: ["==", ["get", "filter_usable"], 1],
  paint: {
    "line-color": [
      "match",
      ["get", "stress_level"],
      [4],
      "#ab1b04",
      [3],
      "#ffcf23",
      [2],
      "#a7c878",
      [1],
      "#4589fc",
      "transparent",
    ],

    "line-width": ["interpolate", ["linear"], ["zoom"], 0, 1, 10, 1, 22, 12],
    "line-offset": [
      "interpolate",
      ["linear"],
      ["zoom"],
      0,
      ["match", ["get", "side"], ["right"], 1, ["left"], -1, 0],
      10,
      ["match", ["get", "side"], ["right"], 1, ["left"], -1, 0],
      22,
      ["match", ["get", "side"], ["right"], 12, ["left"], -12, 0],
    ],
  },
};

const missing_layer = {
  id: "missing",
  source: "cycle_quality",
  "source-layer": "default",
  type: "line",
  layout: {
    visibility: "none",
  },
  filter: ["==", ["get", "filter_usable"], 1],
  paint: {
    "line-color": [
      "interpolate",
      ["linear"],
      ["get", "data_incompleteness"],
      0,
      "#fafafa",
      10,
      "#dfdfdf",
      20,
      "#c4c4c4",
      30,
      "#a8a8a8",
      40,
      "#8d8d8d",
      50,
      "#727272",
      60,
      "#575757",
      70,
      "#3b3b3b",
      80,
      "#202020",
      90,
      "#000000",
    ],

    "line-width": ["interpolate", ["linear"], ["zoom"], 0, 1, 10, 1, 22, 12],
    "line-offset": [
      "interpolate",
      ["linear"],
      ["zoom"],
      0,
      ["match", ["get", "side"], ["right"], 1, ["left"], -1, 0],
      10,
      ["match", ["get", "side"], ["right"], 1, ["left"], -1, 0],
      22,
      ["match", ["get", "side"], ["right"], 12, ["left"], -12, 0],
    ],
  },
};

var map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    sources: {
      "osm-tiles": {
        type: "raster",
        tiles: ["https://tile.openstreetmap.de/{z}/{x}/{y}.png"],
        tileSize: 256,
      },
      cycle_quality: {
        type: "vector",
        url: "pmtiles://" + PMTILES_URL,
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      },
      velorouten: {
        type: "geojson",
        data: "./data/velorouten.geojson"
      }
    },
    layers: [
      {
        id: "osm-tiles",
        type: "raster",
        source: "osm-tiles",
        minzoom: 0,
        maxzoom: 19,
        paint: {
          "raster-saturation": -1,
        },
      },
      {
        id: "velorouten",
        type: "line",
        source: "velorouten",
        layout: {
          visibility: "none",
        },
        paint: {
          "line-color": "blue",
          "line-width": 7,
          "line-opacity": 0.5
        }
      },
      cycle_quality_layer,
      stress_layer,
      missing_layer,
    ],
  },
  center: [10, 53.5], // starting position [lng, lat]
  zoom: 12, // starting zoom
});

map.addControl(new maplibregl.NavigationControl(), "top-left");

const propertyNames = {
  "id": "OSM-ID",
  "data_bonus": "Bonus",
  "data_malus": "Malus",
  "proc_width": "Breite",
  "proc_surface": "Oberfläche",
  "proc_maxspeed": "Tempolimit",
  "proc_mandatory": "Benutzungspflicht",
  "proc_smoothness": "Oberflächenqualität",
  "way_type": "Wegtyp"
};

const mapPropertyName = (property) => {
  return property in propertyNames ? propertyNames[property] : property;
};

const mapFeatureToPopupText = (featureProperties) => {
  const header = `
    Qualitätsindex (0-100): ${featureProperties.index} <br/>
    Stress-Level (1-4): ${featureProperties.stress_level} <br/>
    <hr />
  `;
  const content = Object.entries(featureProperties)
      .filter(([key, value]) => (Object.keys(propertyNames).includes(key)))
      .map(([key, value], i) => `${mapPropertyName(key)}: ${value||"-"}`)
      .join("<br />");

  const footer = `
  <hr />
    Vollständigkeit der OSM-Daten: ${100 - featureProperties.data_incompleteness}% <br/>
    Fehlende Attribute: ${featureProperties.data_missing}
  `;

  return header + content + footer;
};

const showQualityPopup = (e) => {
  return mapFeatureToPopupText(e.features[0].properties);
};

map.on("click", "stress", (e) => {
  new maplibregl.Popup()
    .setLngLat(e.lngLat)
    .setHTML(showQualityPopup(e))
    .addTo(map);
});

map.on("click", "missing", (e) => {
  new maplibregl.Popup()
    .setLngLat(e.lngLat)
    .setHTML(showQualityPopup(e))
    .addTo(map);
});

map.on("click", "cycle_quality", (e) => {
  new maplibregl.Popup()
    .setLngLat(e.lngLat)
    .setHTML(showQualityPopup(e))
    .addTo(map);
});

map.on("idle", () => {
  const toggleableLayerIds = ["cycle_quality", "stress", "missing", "velorouten"];

  // Set up the corresponding toggle button for each layer.
  for (const id of toggleableLayerIds) {
    if (document.getElementById(id)) {
      continue;
    }

    // create toggle buttons
    const link = document.createElement("a");
    link.id = id;
    link.href = "#";
    link.textContent = id.replace("_", " ");
    link.onclick = function (e) {
      const clickedLayer = this.id;
      e.preventDefault();
      e.stopPropagation();

      map.setLayoutProperty(clickedLayer, "visibility", "visible");
      this.classList.add("active");

      for (const id of toggleableLayerIds) {
          if (id !== clickedLayer) {
            map.setLayoutProperty(id, "visibility", "none");
            document.getElementById(id).classList.remove("active");
          }
      }
    };

    const layers = document.getElementById("menu");
    layers.appendChild(link);
    document.getElementById("cycle_quality").classList.add("active");
  }
});

document.getElementById("explanation-toggle").onclick = (e) => {
  document.querySelector("#explanation .content").classList.toggle("hidden");
};