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

        // automatische Gewichtung der Streckenabschnitte relativ zum Maximalwert

const anzahlGewichtetToWeight = (anzahl, maxAnzahl) => {
    const minAnzahl = 8;
    const normiert = (anzahl - minAnzahl) / (maxAnzahl - minAnzahl); 
    const weight = 2 + (5 * normiert); // Zahl zwischen 2 bis 7
    return weight;
};

export class StreckenAbschnitt {
    constructor(geojsonFeature) {
        this.feature = geojsonFeature;
    }

    anzahl () {
        return this.feature.properties.anzahl;
    }
    color () {
        return colorFromSpeed(this.feature.properties.geschwindigkeit);
    }
    weight (maxAnzahl) {
        return anzahlGewichtetToWeight(this.feature.properties.anzahl, maxAnzahl);
    }
    outlineWeight (maxAnzahl) {
        return anzahlGewichtetToWeight(this.feature.properties.anzahl, maxAnzahl) + 1;
    }

    hasOutline(outlineAbAnzahl) {
        return this.feature.properties.anzahl >= outlineAbAnzahl;
    }

    outlineStyle (maxAnzahl, outlineAbAnzahl) {
        return {
            color: "black",
            weight: this.outlineWeight(maxAnzahl),
            opacity: this.hasOutline(outlineAbAnzahl) ? 1 : 0
        }
    }

    fillStyle (maxAnzahl) {
        return {
            color: this.color(),
            weight: this.weight(maxAnzahl),
            opacity: 1
        }
    }
}


export function fillStyleForFeature(feature, maxAnzahl) {
    return new StreckenAbschnitt(feature).fillStyle(maxAnzahl);
}

export function outlineStyleForFeature(feature, maxAnzahl, outlineAbAnzahl) {
    return new StreckenAbschnitt(feature).outlineStyle(maxAnzahl, outlineAbAnzahl);
}


// layer functions
export function filterGeoJsonNachAnzahl(geoJsonFeatures, mindestAnzahl) {
    return geoJsonFeatures.filter(feature => {
        return feature.properties.anzahl >= mindestAnzahl
    });
}




// date

export function datePlusOneDay(dateString) {
    const parsedDate = new Date(dateString);
    parsedDate.setDate(parsedDate.getDate() + 1);
    return parsedDate.toISOString().split('T')[0];
}

export function yesterday () {
    const aDate = new Date();
    aDate.setDate(aDate.getDate() - 1);
    return aDate.toISOString().split('T')[0];
};




const _parseFragmentString = (fragmentString) => {
    if (fragmentString.length < 3) {
        return;
    }
    const paramStrings = fragmentString.substring(1).split('&')
    return paramStrings.reduce((result, paramString) => {
        if (paramString.indexOf('=') > 0) {
            const key = paramString.split('=')[0];
            const value = decodeURIComponent(paramString.split('=')[1]);
            result[key] = value;
        }
        return result;
    }, {});
};

const _createFragmentString = (query) => {
    return '#' + Object.keys(query).map((key) => {
        return `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`
    }).join('&');
};

class LocationFragment {
    constructor (_window) {
        this._window = _window;
    }
    getParameter (key) {
        return this.getQuery() && this.getQuery()[key];
    }
    hasParameter (key) {
        return this.getParameter(key) && this.getParameter(key).length > 0;
    }
    setParameter (key, value) {
        const query = this.getQuery() || [];
        query[key] = value;
        this.setQuery(query);
    }
    getQuery () {
        return _parseFragmentString(this._window.document.location.hash);
    }
    setQuery (query) {
        this._window.document.location.hash = _createFragmentString(query);
    }
    addChangeListener (callback) {
        this._window.addEventListener("hashchange", () => {
            callback(this.getQuery());
        }); 
    }
}

export {LocationFragment}