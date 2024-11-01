let protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

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
        url: "pmtiles://data/dbrad_2024.pmtiles",
      },
      // cycle_quality: {
      //   type: "vector",
      //   url: "pmtiles://data/hh.pmtiles",
      //   attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      // },
      velorouten: {
        type: "geojson",
        data: "./data/velorouten.geojson"
      },
      zählstellen: {
        type: "geojson",
        data: "./data/zählstellen.geojson?nocache2"
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
        id: "symbols",
        type: "symbol",
        source: "radverkehr",
        "source-layer": "default",
        layout: {
            "visibility": "visible",
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
          "line-color": "blue",
          //  "line-color": ["step", ["get", "geschwindigkeit"],
          //   "red",
          //   12,
          //   "orange",
          //   18,
          //   "yellow",
          //   21,
          //   "green",
          //   30,
          //   "blue",
          //  ],
          "line-width": [
              "interpolate",
              ["linear"], ["zoom"],
              // zoom is 5 (or less) -> Anzahl / 25
              10,  ["/", ["get", "anzahl"], 70],
              // zoom is 10 (or greater) -> Anzahl / 30
              12, ["/", ["get", "anzahl"], 50],
              16, ["/", ["get", "anzahl"], 30],
          ],
          "line-opacity": 0.5
        }
      },
      {
        id: "zählstellen",
        type: "circle",
        source: "zählstellen",
        layout: {
          visibility: "visible",
        },
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"], ["zoom"],
            10, ["/",["sqrt", ["get", "anzahl"]], 10],
            12, ["/",["sqrt", ["get", "anzahl"]], 10],
            16, ["/",["sqrt", ["get", "anzahl"]], 8],
        ],
          "circle-color": "green",
          "circle-stroke-width": 2,
          "circle-stroke-color": "black",
        }
      },
      {
        id: "ir-symbols",
        type: "symbol",
        source: "zählstellen",
        layout: {
            "visibility": "visible",
            "symbol-placement": "point",
            "text-field": '{anzahl}',
            "text-size": 16 ,
            "text-justify": "center",
            "text-allow-overlap": false,
          },
          paint: {
            "text-translate": [0, 10],
          }
      },
      // {
      //   id: "cycle_quality",
      //   source: "cycle_quality",
      //   "source-layer": "default",
      //   layout: {
      //     visibility: "none",
      //   },
      //   type: "line",
      //   filter: ["==", ["get", "filter_usable"], 1],
      //   paint: {
      //     "line-color": [
      //       "step",
      //       ["get", "index"],
      //       "#7a0403",
      //       10,
      //       "#ab1b04",
      //       20,
      //       "#d54a12",
      //       30,
      //       "#f5a038",
      //       40,
      //       "#f3cf33",
      //       50,
      //       "#e6f122",
      //       60,
      //       "#4c7315",
      //       70,
      //       "#679fce",
      //       80,
      //       "#4473e1",
      //       90,
      //       "#436dda",
      //       100,
      //       "#4143a7",
      //     ],
      //     "line-width": [
      //       "interpolate", ["linear"], ["zoom"],
      //       0, ["/", ["get", "index"], 40],
      //       10, ["/", ["get", "index"], 17]
      //     ],
      //     "line-offset": [
      //       "interpolate",
      //       ["linear"],
      //       ["zoom"],
      //       0,
      //       ["match", ["get", "side"], ["right"], 1, ["left"], -1, 0],
      //       10,
      //       ["match", ["get", "side"], ["right"], 1, ["left"], -1, 0],
      //       22,
      //       ["match", ["get", "side"], ["right"], 12, ["left"], -12, 0],
      //     ],
      //   },
      // },
      {
        id: "velorouten",
        type: "line",
        source: "velorouten",
        layout: {
          visibility: "none",
        },
        paint: {
          "line-color": "red",
          "line-width": 7,
          "line-opacity": 0.5
        }
      }
    ],
  },
  center: [10, 53.5], // starting position [lng, lat]
  zoom: 12, // starting zoom
});

map.addControl(new maplibregl.NavigationControl(), "top-left");


map.on("idle", () => {
  // toggle layer visibility buttons
  const toggleableLayerIds = ["radverkehr", "velorouten", "zählstellen"];

  for (const id of toggleableLayerIds) {
    const link = document.getElementById(id);
    link.onclick = function (e) {
      const clickedLayerId = this.id;
      e.preventDefault();
      e.stopPropagation();

      // toggle button state
      this.classList.toggle("active"); 

      // toggle layer visibility
      const visibility = map.getLayoutProperty(clickedLayerId, 'visibility');

      if (visibility === 'visible') {
          map.setLayoutProperty(clickedLayerId, 'visibility', 'none');
      } else {
          map.setLayoutProperty(clickedLayerId, 'visibility', 'visible');
      }
    };
    
  }
});
