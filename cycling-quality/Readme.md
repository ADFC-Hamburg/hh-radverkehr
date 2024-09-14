How To Update the Quality Index
===


(1) OSM Export
---

Execute Query in Overpass (https://overpass-turbo.eu/), download result as Geojson.

```
[out:json][timeout:100];
{{geocodeArea:Hamburg}}->.searchArea;
(
  way["highway"="cycleway"](area.searchArea);
  way["highway"="path"]["bicycle"!="no"]["bicycle"!="dismount"](area.searchArea);
  way["highway"="footway"]["bicycle"="yes"](area.searchArea);
  way["highway"="footway"]["bicycle"="designated"](area.searchArea);
  way["highway"="footway"]["bicycle"="permissive"](area.searchArea);
  way["highway"="bridleway"]["bicycle"="yes"](area.searchArea);
  way["highway"="bridleway"]["bicycle"="designated"](area.searchArea);
  way["highway"="bridleway"]["bicycle"="permissive"](area.searchArea);
  way["highway"="steps"]["bicycle"="yes"](area.searchArea);
  way["highway"="steps"]["bicycle"="designated"](area.searchArea);
  way["highway"="steps"]["bicycle"="permissive"](area.searchArea);

  way["highway"="motorway"](area.searchArea);
  way["highway"="motorway_link"](area.searchArea);
  way["highway"="trunk"](area.searchArea);
  way["highway"="trunk_link"](area.searchArea);

  way["highway"="primary"](area.searchArea);
  way["highway"="primary_link"](area.searchArea);
  way["highway"="secondary"](area.searchArea);
  way["highway"="secondary_link"](area.searchArea);
  way["highway"="tertiary"](area.searchArea);
  way["highway"="tertiary_link"](area.searchArea);
  way["highway"="unclassified"](area.searchArea);
  way["highway"="residential"](area.searchArea);
  way["highway"="living_street"](area.searchArea);
  way["highway"="pedestrian"](area.searchArea);
  way["highway"="road"](area.searchArea);

  way["highway"="service"][!"service"](area.searchArea);
  way["highway"="service"]["service"="alley"](area.searchArea);
  way["highway"="service"]["bicycle"="yes"](area.searchArea);
  way["highway"="service"]["bicycle"="designated"](area.searchArea);
  way["highway"="service"]["bicycle"="permissive"](area.searchArea);
  way["highway"="track"](area.searchArea);
);
out geom;
```

(2) Create Quality Index Data 
--

1. Install QGIS
2. Checkout https://github.com/SupaplexOSM/OSM-Cycling-Quality-Index and use QGIS to run the Python Skript according to its readme using the downloaded OSM Data from Step 1
3. Be patient. This can take up to 30 minutes and QGIS is looking unresponsive meanwhile!
4. You now have a cycling_quality_index.geojson file with the quality index.

(3) Convert Geojson to Pmtiles

The created geojson has a size > 100MB, which is too much in terms of memory and data transfer.
We convert the data to pmtiles, which can be loaded from the server in chunks when needed.

1. Install tippecanoe: https://github.com/felt/tippecanoe
2. Run this command:

```
tippecanoe --output hh.pmtiles --smallest-maximum-zoom-guess=18 -rg --drop-densest-as-needed --extend-zooms-if-still-dropping --force --layer=default cycling_quality_index.geojson
```

3. move hh.pmtiles to data folder.