import { StreckenAbschnitt, fillStyleForFeature, outlineStyleForFeature, datePlusOneDay, filterGeoJsonNachAnzahl } from "../model";

describe('StreckenAbschnitt', () => {
    test('should not have outline', () => {
        const outlineAbAnzahl = 10;
        const abschnitt = new StreckenAbschnitt({
            properties: {
                anzahl: 1
            }
        });

        expect(abschnitt.hasOutline(outlineAbAnzahl)).toBe(false);
    });

    test('should have outline', () => {
        const outlineAbAnzahl = 10;
        const abschnitt = new StreckenAbschnitt({
            properties: {
                anzahl: 10
            }
        });

        expect(abschnitt.hasOutline(outlineAbAnzahl)).toBe(true);
    });

    test('should have outline', () => {
        const outlineAbAnzahl = 10;
        const abschnitt = new StreckenAbschnitt({
            properties: {
                anzahl: 11
            }
        });

        expect(abschnitt.hasOutline(outlineAbAnzahl)).toBe(true);
    });
});

describe('fillStyle', () => {
    test('should have red for slow routes', () => {
        const feature = {
            properties: {
                anzahl: 8,
                geschwindigkeit: 8
            }
        };

        expect(fillStyleForFeature(feature, 16)).toStrictEqual({
            color: "red", weight: 2, opacity: 1
        });
    });

    test('should have orange for 12km/h routes', () => {
        const feature = {
            properties: {
                anzahl: 12,
                geschwindigkeit: 12
            }
        };

        expect(fillStyleForFeature(feature, 16)).toStrictEqual({
            color: "orange", weight: 4.5, opacity: 1
        });
    });

    test('should have yellow for 17 km/h routes', () => {
        const feature = {
            properties: {
                anzahl: 14,
                geschwindigkeit: 17
            }
        };

        expect(fillStyleForFeature(feature, 16)).toStrictEqual({
            color: "orange", weight: 5.75, opacity: 1
        });
    });

    
});

describe('outlineStyle', () => {
    test('should have no outline', () => {
        // given
        const maxAnzahl = 16;
        const outlineAbAnzahl = 16;
        const feature = {
            properties: {
                anzahl: 8,
                geschwindigkeit: 8
            }
        };

        // when
        const outlineStyle = outlineStyleForFeature(feature, maxAnzahl, outlineAbAnzahl);


        // then
        expect(outlineStyle.opacity).toBe(0);
    });

    test('should have black outline', () => {
        // given
        const maxAnzahl = 16;
        const outlineAbAnzahl = 12;
        const feature = {
            properties: {
                anzahl: 12,
                geschwindigkeit: 12
            }
        };

        // when
        const outlineStyle = outlineStyleForFeature(feature, maxAnzahl, outlineAbAnzahl);

        expect(outlineStyle).toStrictEqual({
            color: "black", weight: 5.5, opacity: 1
        });
    });

    test('should have black outline for 17 km/h routes', () => {
        // given
        const maxAnzahl = 16;
        const outlineAbAnzahl = 12;
        const feature = {
            properties: {
                anzahl: 14,
                geschwindigkeit: 17
            }
        };

        // when
        const outlineStyle = outlineStyleForFeature(feature, maxAnzahl, outlineAbAnzahl);

        // then
        expect(outlineStyle).toStrictEqual({
            color: "black", weight: 6.75, opacity: 1
        });
    });
});

describe('datePlusOneDay', () => {
    it ('should add one day', () => {
       expect(datePlusOneDay('2023-01-01')).toStrictEqual('2023-01-02');
       expect(datePlusOneDay('2023-01-31')).toStrictEqual('2023-02-01');
       expect(datePlusOneDay('2024-02-28')).toStrictEqual('2024-02-29');
       expect(datePlusOneDay('2024-12-31')).toStrictEqual('2025-01-01');
    });
});

describe('filterGeoJsonNachAnzahl', () => {
    it('should return if empty', () => {
        const geoJsonFeatures = [];
        const filtered = filterGeoJsonNachAnzahl(geoJsonFeatures);
        expect(filtered).toStrictEqual([]);
    })

    it('should return elements with minimum anzahl', () => {
        const mindestAnzahl = 2;
        const geoJsonFeatures = [{properties: {anzahl: 2}}];
        const filtered = filterGeoJsonNachAnzahl(geoJsonFeatures, mindestAnzahl);
        expect(filtered).toStrictEqual(geoJsonFeatures);
    })

    it('should return empty array if no element matches', () => {
        const mindestAnzahl = 10;
        const geoJsonFeatures = [{properties: {anzahl: 2}}];
        const filtered = filterGeoJsonNachAnzahl(geoJsonFeatures, mindestAnzahl);
        expect(filtered).toStrictEqual([]);
    })

    it('should return only elements with minimum anzahl', () => {
        const mindestAnzahl = 10;
        const geoJsonFeatures = [{properties: {anzahl: 2}}, {properties: {anzahl: 10}}];
        const filtered = filterGeoJsonNachAnzahl(geoJsonFeatures, mindestAnzahl);
        expect(filtered).toStrictEqual([{properties: {anzahl: 10}}]);
    })

    it('should return only elements with minimum or more anzahl', () => {
        const mindestAnzahl = 10;
        const geoJsonFeatures = [{properties: {anzahl: 2}}, {properties: {anzahl: 11}}];
        const filtered = filterGeoJsonNachAnzahl(geoJsonFeatures, mindestAnzahl);
        expect(filtered).toStrictEqual([{properties: {anzahl: 11}}]);
    })
})
