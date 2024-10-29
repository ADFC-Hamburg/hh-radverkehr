let protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

let PMTILES_URL = "data/hh.pmtiles";
const p1 = new pmtiles.PMTiles(PMTILES_URL);

const PM_DBRAD_2024_PATH = "data/dbrad_2024.pmtiles"
const p2 = new pmtiles.PMTiles(PM_DBRAD_2024_PATH);

// this is so we share one instance across the JS code and the map renderer
protocol.add(p1);
protocol.add(p2);


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
      radverkehr: {
        type: "vector",
        url: "pmtiles://" + PM_DBRAD_2024_PATH,
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
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
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
      {
        id: "symbols",
        type: "symbol",
        source: "radverkehr",
        "source-layer": "default",
        layout: {
            "symbol-placement": "line",
            "text-field": '{anzahl}',
            "text-size": 10,
            "text-justify": "center",
            "text-allow-overlap": false,
          },
      },
      {
        id: "radverkehr",
        type: "line",
        source: "radverkehr",
        "source-layer": "default",
        layout: {
          visibility: "visible",
          "line-cap": "butt",
          "line-join": "round",
        },
        paint: {
          // "line-color": "blue",
           "line-color": ["step", ["get", "geschwindigkeit"],
            "red",
            12,
            "orange",
            18,
            "yellow",
            21,
            "green",
            30,
            "blue",
           ],
          "line-width": [
              "interpolate",
              ["linear"], ["zoom"],
              // zoom is 5 (or less) -> width 50px
              5,  ["/", ["get", "anzahl"], 25],
              // zoom is 10 (or greater) -> width 50px
              10, ["/", ["get", "anzahl"], 50],
          ],
          "line-opacity": 0.5
        }
      },
      {
        id: "cycle_quality",
        source: "cycle_quality",
        "source-layer": "default",
        layout: {
          visibility: "none",
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
            "#4c7315",
            70,
            "#679fce",
            80,
            "#4473e1",
            90,
            "#436dda",
            100,
            "#4143a7",
          ],
          "line-width": [
            "interpolate", ["linear"], ["zoom"],
            0, ["/", ["get", "index"], 40],
            10, ["/", ["get", "index"], 17]
          ],
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
      }
    ],
  },
  center: [10, 53.5], // starting position [lng, lat]
  zoom: 12, // starting zoom
});

map.addControl(new maplibregl.NavigationControl(), "top-left");


map.on("idle", () => {
  const toggleableLayerIds = ["radverkehr", "cycle_quality", "velorouten"];


  for (const id of toggleableLayerIds) {
    const link = document.getElementById(id);
    link.onclick = function (e) {
      const clickedLayer = this.id;
      e.preventDefault();
      e.stopPropagation();

      map.setLayoutProperty(clickedLayer, "visibility", "visible");
      this.classList.add("active");

      for (const id of toggleableLayerIds) {
          if (id !== clickedLayer) {
            map.setLayoutProperty(id, "visibility", "none");
            console.log("deactivate element: " + id);
            document.getElementById(id).classList.remove("active");
          }
      }
    };
    
  }
});
