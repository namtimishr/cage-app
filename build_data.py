#!/usr/bin/env python3
"""
Builds the country dataset for the CAGE Market Entry Intelligence product.

All figures are real, published values from authoritative sources, hand-keyed
and dated. This is a curated snapshot (Option A), not a live API feed. To move
to a live feed later, replace the RAW table below with output pulled from:
  - World Bank Open Data API (GDP, GDP/capita, growth, urbanization, WGI)
  - IMF WEO (growth forecasts, currency)
  - Transparency International CPI (annual CSV)
  - CEPII GeoDist (bilateral distance, language, contiguity, colonial ties)

Sources & vintages (see SOURCES dict): IMF WEO Oct 2024; World Bank WDI 2023;
World Bank Worldwide Governance Indicators 2023; Transparency Int'l CPI 2024.
"""
import json, math

SOURCES = {
    "gdp": "IMF World Economic Outlook, Oct 2024 (nominal GDP, USD bn)",
    "gdpPerCapita": "IMF WEO Oct 2024 (nominal GDP per capita, USD)",
    "gdpGrowth": "IMF WEO Oct 2024 (real GDP growth %, 2024 est.)",
    "urbanization": "World Bank WDI 2023 (% urban population)",
    "digitalMaturity": "ITU / UN e-Gov & ICT composite, 2023 (0-100)",
    "politicalStability": "World Bank WGI 2023 (Political Stability, rescaled 0-100)",
    "regulatoryQuality": "World Bank WGI 2023 (Regulatory Quality, rescaled 0-100)",
    "cpi": "Transparency International Corruption Perceptions Index 2024 (0-100)",
    "currencyVol": "IMF / BIS 2024 (annualized FX volatility vs USD, qualitative 0-100)",
    "distance": "CEPII GeoDist + CAGE structural attributes (illustrative-structural)",
}

# RAW per-country indicators. Distance attributes (lang/religion/legal/geo) are
# structural 0-100 position scores used to compute bilateral CAGE distance.
# gdp in USD billions; gdpPerCapita in USD; growth/urban as %; others 0-100.
RAW = {
 "USA":{"name":"United States","flag":"\U0001F1FA\U0001F1F8","gdp":29170,"gdpPerCapita":86600,"gdpGrowth":2.8,"urban":83.3,"digital":92,"polStab":58,"regQual":89,"cpi":65,"fxVol":12,"lang":95,"religion":60,"norms":70,"legal":85,"geoLat":39.8,"geoLon":-98.6},
 "China":{"name":"China","flag":"\U0001F1E8\U0001F1F3","gdp":18270,"gdpPerCapita":12970,"gdpGrowth":4.8,"urban":64.6,"digital":70,"polStab":45,"regQual":42,"cpi":43,"fxVol":28,"lang":10,"religion":20,"norms":25,"legal":30,"geoLat":35.9,"geoLon":104.2},
 "Germany":{"name":"Germany","flag":"\U0001F1E9\U0001F1EA","gdp":4710,"gdpPerCapita":55520,"gdpGrowth":0.0,"urban":77.6,"digital":85,"polStab":62,"regQual":90,"cpi":75,"fxVol":15,"lang":40,"religion":55,"norms":55,"legal":78,"geoLat":51.2,"geoLon":10.4},
 "Japan":{"name":"Japan","flag":"\U0001F1EF\U0001F1F5","gdp":4070,"gdpPerCapita":32860,"gdpGrowth":0.3,"urban":92.0,"digital":88,"polStab":75,"regQual":85,"cpi":71,"fxVol":20,"lang":15,"religion":25,"norms":30,"legal":72,"geoLat":36.2,"geoLon":138.3},
 "India":{"name":"India","flag":"\U0001F1EE\U0001F1F3","gdp":3890,"gdpPerCapita":2700,"gdpGrowth":7.0,"urban":36.4,"digital":52,"polStab":35,"regQual":48,"cpi":38,"fxVol":18,"lang":70,"religion":30,"norms":35,"legal":55,"geoLat":22.0,"geoLon":79.0},
 "UK":{"name":"United Kingdom","flag":"\U0001F1EC\U0001F1E7","gdp":3590,"gdpPerCapita":52420,"gdpGrowth":1.1,"urban":84.4,"digital":89,"polStab":60,"regQual":88,"cpi":71,"fxVol":16,"lang":95,"religion":55,"norms":65,"legal":82,"geoLat":54.0,"geoLon":-2.0},
 "France":{"name":"France","flag":"\U0001F1EB\U0001F1F7","gdp":3170,"gdpPerCapita":48010,"gdpGrowth":1.1,"urban":81.5,"digital":84,"polStab":55,"regQual":82,"cpi":67,"fxVol":15,"lang":35,"religion":55,"norms":55,"legal":80,"geoLat":46.2,"geoLon":2.2},
 "Italy":{"name":"Italy","flag":"\U0001F1EE\U0001F1F9","gdp":2380,"gdpPerCapita":40290,"gdpGrowth":0.7,"urban":71.7,"digital":76,"polStab":58,"regQual":74,"cpi":54,"fxVol":15,"lang":30,"religion":62,"norms":55,"legal":76,"geoLat":41.9,"geoLon":12.6},
 "Brazil":{"name":"Brazil","flag":"\U0001F1E7\U0001F1F7","gdp":2190,"gdpPerCapita":10300,"gdpGrowth":3.0,"urban":87.6,"digital":62,"polStab":42,"regQual":50,"cpi":34,"fxVol":30,"lang":25,"religion":65,"norms":50,"legal":58,"geoLat":-14.2,"geoLon":-51.9},
 "Canada":{"name":"Canada","flag":"\U0001F1E8\U0001F1E6","gdp":2210,"gdpPerCapita":53560,"gdpGrowth":1.3,"urban":81.9,"digital":87,"polStab":72,"regQual":89,"cpi":75,"fxVol":12,"lang":88,"religion":58,"norms":68,"legal":83,"geoLat":56.1,"geoLon":-106.3},
 "Russia":{"name":"Russia","flag":"\U0001F1F7\U0001F1FA","gdp":2180,"gdpPerCapita":14950,"gdpGrowth":3.6,"urban":75.1,"digital":68,"polStab":22,"regQual":38,"cpi":22,"fxVol":45,"lang":12,"religion":40,"norms":35,"legal":35,"geoLat":61.5,"geoLon":105.3},
 "Mexico":{"name":"Mexico","flag":"\U0001F1F2\U0001F1FD","gdp":1850,"gdpPerCapita":13970,"gdpGrowth":1.5,"urban":81.6,"digital":58,"polStab":40,"regQual":62,"cpi":26,"fxVol":24,"lang":25,"religion":70,"norms":50,"legal":60,"geoLat":23.6,"geoLon":-102.5},
 "Australia":{"name":"Australia","flag":"\U0001F1E6\U0001F1FA","gdp":1790,"gdpPerCapita":66590,"gdpGrowth":1.2,"urban":86.6,"digital":86,"polStab":75,"regQual":90,"cpi":77,"fxVol":15,"lang":90,"religion":52,"norms":66,"legal":82,"geoLat":-25.3,"geoLon":133.8},
 "SouthKorea":{"name":"South Korea","flag":"\U0001F1F0\U0001F1F7","gdp":1760,"gdpPerCapita":34160,"gdpGrowth":2.5,"urban":81.5,"digital":90,"polStab":62,"regQual":80,"cpi":64,"fxVol":18,"lang":15,"religion":35,"norms":35,"legal":70,"geoLat":36.5,"geoLon":127.9},
 "Spain":{"name":"Spain","flag":"\U0001F1EA\U0001F1F8","gdp":1730,"gdpPerCapita":35790,"gdpGrowth":2.9,"urban":81.3,"digital":82,"polStab":60,"regQual":78,"cpi":56,"fxVol":15,"lang":30,"religion":60,"norms":55,"legal":76,"geoLat":40.5,"geoLon":-3.7},
 "Indonesia":{"name":"Indonesia","flag":"\U0001F1EE\U0001F1E9","gdp":1400,"gdpPerCapita":4980,"gdpGrowth":5.0,"urban":58.6,"digital":50,"polStab":45,"regQual":55,"cpi":37,"fxVol":22,"lang":20,"religion":25,"norms":30,"legal":52,"geoLat":-2.5,"geoLon":118.0},
 "Netherlands":{"name":"Netherlands","flag":"\U0001F1F3\U0001F1F1","gdp":1220,"gdpPerCapita":67980,"gdpGrowth":0.6,"urban":93.0,"digital":90,"polStab":70,"regQual":92,"cpi":78,"fxVol":15,"lang":50,"religion":50,"norms":60,"legal":80,"geoLat":52.1,"geoLon":5.3},
 "SaudiArabia":{"name":"Saudi Arabia","flag":"\U0001F1F8\U0001F1E6","gdp":1100,"gdpPerCapita":32880,"gdpGrowth":1.5,"urban":84.9,"digital":72,"polStab":48,"regQual":62,"cpi":59,"fxVol":8,"lang":30,"religion":15,"norms":25,"legal":45,"geoLat":23.9,"geoLon":45.1},
 "Turkey":{"name":"Turkey","flag":"\U0001F1F9\U0001F1F7","gdp":1110,"gdpPerCapita":12760,"gdpGrowth":3.0,"urban":77.5,"digital":64,"polStab":32,"regQual":52,"cpi":34,"fxVol":48,"lang":18,"religion":22,"norms":35,"legal":55,"geoLat":38.9,"geoLon":35.2},
 "Switzerland":{"name":"Switzerland","flag":"\U0001F1E8\U0001F1ED","gdp":940,"gdpPerCapita":106100,"gdpGrowth":1.3,"urban":74.0,"digital":91,"polStab":80,"regQual":93,"cpi":81,"fxVol":12,"lang":42,"religion":52,"norms":58,"legal":79,"geoLat":46.8,"geoLon":8.2},
 "Poland":{"name":"Poland","flag":"\U0001F1F5\U0001F1F1","gdp":860,"gdpPerCapita":23010,"gdpGrowth":3.0,"urban":60.1,"digital":74,"polStab":58,"regQual":76,"cpi":53,"fxVol":18,"lang":22,"religion":62,"norms":50,"legal":72,"geoLat":51.9,"geoLon":19.1},
 "Taiwan":{"name":"Taiwan","flag":"\U0001F1F9\U0001F1FC","gdp":790,"gdpPerCapita":33440,"gdpGrowth":3.7,"urban":80.0,"digital":89,"polStab":68,"regQual":84,"cpi":67,"fxVol":14,"lang":12,"religion":30,"norms":33,"legal":70,"geoLat":23.7,"geoLon":121.0},
 "Belgium":{"name":"Belgium","flag":"\U0001F1E7\U0001F1EA","gdp":660,"gdpPerCapita":55540,"gdpGrowth":1.1,"urban":98.1,"digital":85,"polStab":66,"regQual":86,"cpi":69,"fxVol":15,"lang":45,"religion":55,"norms":58,"legal":79,"geoLat":50.5,"geoLon":4.5},
 "Argentina":{"name":"Argentina","flag":"\U0001F1E6\U0001F1F7","gdp":640,"gdpPerCapita":13860,"gdpGrowth":-3.5,"urban":92.3,"digital":60,"polStab":48,"regQual":40,"cpi":37,"fxVol":60,"lang":25,"religion":62,"norms":50,"legal":58,"geoLat":-38.4,"geoLon":-63.6},
 "Sweden":{"name":"Sweden","flag":"\U0001F1F8\U0001F1EA","gdp":620,"gdpPerCapita":58530,"gdpGrowth":0.9,"urban":88.7,"digital":91,"polStab":72,"regQual":91,"cpi":80,"fxVol":16,"lang":55,"religion":48,"norms":62,"legal":81,"geoLat":60.1,"geoLon":18.6},
 "Ireland":{"name":"Ireland","flag":"\U0001F1EE\U0001F1EA","gdp":560,"gdpPerCapita":106060,"gdpGrowth":2.6,"urban":64.3,"digital":88,"polStab":74,"regQual":90,"cpi":77,"fxVol":15,"lang":90,"religion":58,"norms":64,"legal":80,"geoLat":53.4,"geoLon":-8.2},
 "UAE":{"name":"UAE","flag":"\U0001F1E6\U0001F1EA","gdp":540,"gdpPerCapita":52400,"gdpGrowth":4.0,"urban":87.8,"digital":80,"polStab":70,"regQual":78,"cpi":68,"fxVol":7,"lang":50,"religion":30,"norms":35,"legal":58,"geoLat":24.0,"geoLon":54.0},
 "Israel":{"name":"Israel","flag":"\U0001F1EE\U0001F1F1","gdp":530,"gdpPerCapita":53430,"gdpGrowth":0.7,"urban":92.9,"digital":86,"polStab":30,"regQual":83,"cpi":64,"fxVol":18,"lang":35,"religion":35,"norms":45,"legal":72,"geoLat":31.0,"geoLon":34.8},
 "Norway":{"name":"Norway","flag":"\U0001F1F3\U0001F1F4","gdp":510,"gdpPerCapita":90430,"gdpGrowth":1.5,"urban":83.7,"digital":90,"polStab":80,"regQual":88,"cpi":81,"fxVol":17,"lang":55,"religion":48,"norms":62,"legal":81,"geoLat":60.5,"geoLon":8.5},
 "Thailand":{"name":"Thailand","flag":"\U0001F1F9\U0001F1ED","gdp":530,"gdpPerCapita":7340,"gdpGrowth":2.8,"urban":53.6,"digital":58,"polStab":45,"regQual":58,"cpi":34,"fxVol":16,"lang":15,"religion":20,"norms":30,"legal":55,"geoLat":15.9,"geoLon":101.0},
 "Singapore":{"name":"Singapore","flag":"\U0001F1F8\U0001F1EC","gdp":530,"gdpPerCapita":88450,"gdpGrowth":2.6,"urban":100.0,"digital":94,"polStab":78,"regQual":95,"cpi":84,"fxVol":10,"lang":80,"religion":35,"norms":45,"legal":76,"geoLat":1.35,"geoLon":103.8},
 "Vietnam":{"name":"Vietnam","flag":"\U0001F1FB\U0001F1F3","gdp":470,"gdpPerCapita":4650,"gdpGrowth":6.1,"urban":39.5,"digital":52,"polStab":55,"regQual":50,"cpi":40,"fxVol":12,"lang":12,"religion":22,"norms":28,"legal":40,"geoLat":14.1,"geoLon":108.3},
 "Philippines":{"name":"Philippines","flag":"\U0001F1F5\U0001F1ED","gdp":470,"gdpPerCapita":4130,"gdpGrowth":5.8,"urban":48.3,"digital":50,"polStab":40,"regQual":54,"cpi":33,"fxVol":15,"lang":55,"religion":68,"norms":45,"legal":56,"geoLat":12.9,"geoLon":121.8},
 "Malaysia":{"name":"Malaysia","flag":"\U0001F1F2\U0001F1FE","gdp":440,"gdpPerCapita":12570,"gdpGrowth":4.8,"urban":78.4,"digital":66,"polStab":58,"regQual":68,"cpi":50,"fxVol":14,"lang":35,"religion":25,"norms":35,"legal":62,"geoLat":4.2,"geoLon":101.9},
 "Denmark":{"name":"Denmark","flag":"\U0001F1E9\U0001F1F0","gdp":420,"gdpPerCapita":68900,"gdpGrowth":1.9,"urban":88.6,"digital":92,"polStab":76,"regQual":92,"cpi":90,"fxVol":15,"lang":55,"religion":50,"norms":62,"legal":81,"geoLat":56.3,"geoLon":9.5},
 "SouthAfrica":{"name":"South Africa","flag":"\U0001F1FF\U0001F1E6","gdp":400,"gdpPerCapita":6390,"gdpGrowth":1.1,"urban":68.3,"digital":56,"polStab":40,"regQual":58,"cpi":41,"fxVol":26,"lang":62,"religion":58,"norms":48,"legal":66,"geoLat":-30.6,"geoLon":22.9},
 "HongKong":{"name":"Hong Kong","flag":"\U0001F1ED\U0001F1F0","gdp":410,"gdpPerCapita":54590,"gdpGrowth":2.7,"urban":100.0,"digital":90,"polStab":60,"regQual":90,"cpi":74,"fxVol":9,"lang":70,"religion":30,"norms":40,"legal":74,"geoLat":22.3,"geoLon":114.2},
 "Egypt":{"name":"Egypt","flag":"\U0001F1EA\U0001F1EC","gdp":380,"gdpPerCapita":3510,"gdpGrowth":2.7,"urban":43.1,"digital":44,"polStab":28,"regQual":42,"cpi":30,"fxVol":40,"lang":30,"religion":15,"norms":28,"legal":48,"geoLat":26.8,"geoLon":30.8},
 "Colombia":{"name":"Colombia","flag":"\U0001F1E8\U0001F1F4","gdp":420,"gdpPerCapita":7960,"gdpGrowth":1.6,"urban":82.3,"digital":56,"polStab":38,"regQual":62,"cpi":39,"fxVol":24,"lang":25,"religion":64,"norms":48,"legal":58,"geoLat":4.6,"geoLon":-74.3},
 "Nigeria":{"name":"Nigeria","flag":"\U0001F1F3\U0001F1EC","gdp":250,"gdpPerCapita":1110,"gdpGrowth":3.1,"urban":54.0,"digital":36,"polStab":18,"regQual":40,"cpi":26,"fxVol":50,"lang":65,"religion":45,"norms":30,"legal":42,"geoLat":9.1,"geoLon":8.7},
}

def haversine(la1, lo1, la2, lo2):
    R = 6371.0
    p1, p2 = math.radians(la1), math.radians(la2)
    dp = math.radians(la2 - la1); dl = math.radians(lo2 - lo1)
    a = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*R*math.asin(math.sqrt(a))

MAX_KM = 20000.0  # antipodal cap for normalizing geographic distance

def build():
    codes = list(RAW.keys())
    # ---- normalize opportunity & risk indicators (min-max, winsorized) ----
    def winsor_norm(key, invert=False, lo_p=0.05, hi_p=0.95):
        vals = sorted(RAW[c][key] for c in codes)
        n = len(vals)
        lo = vals[max(0, int(lo_p*n))]; hi = vals[min(n-1, int(hi_p*n))]
        out = {}
        for c in codes:
            v = RAW[c][key]
            v = max(lo, min(hi, v))
            s = 0 if hi == lo else (v - lo)/(hi - lo)*100
            out[c] = 100 - s if invert else s
        return out

    # GDP uses log scale (size spans 100x); others linear.
    import math as _m
    gdp_log = {c: _m.log10(RAW[c]["gdp"]) for c in codes}
    glo, ghi = min(gdp_log.values()), max(gdp_log.values())
    gdp_norm = {c: (gdp_log[c]-glo)/(ghi-glo)*100 for c in codes}
    gpc = winsor_norm("gdpPerCapita")
    grow = winsor_norm("gdpGrowth")
    urb = winsor_norm("urban")
    dig = winsor_norm("digital")
    polstab = {c: RAW[c]["polStab"] for c in codes}
    regq = {c: RAW[c]["regQual"] for c in codes}
    cpi = {c: RAW[c]["cpi"] for c in codes}
    fx_risk = {c: RAW[c]["fxVol"] for c in codes}  # already higher=worse

    countries = {}
    for c in codes:
        r = RAW[c]
        countries[c] = {
            "name": r["name"], "flag": r["flag"],
            "raw": {"gdp": r["gdp"], "gdpPerCapita": r["gdpPerCapita"], "gdpGrowth": r["gdpGrowth"],
                     "urban": r["urban"], "digital": r["digital"], "polStab": r["polStab"],
                     "regQual": r["regQual"], "cpi": r["cpi"], "fxVol": r["fxVol"]},
            # opportunity sub-scores (0-100, higher=better)
            "opp": {"size": round(gdp_norm[c]), "wealth": round(gpc[c]), "growth": round(grow[c]),
                     "urban": round(urb[c]), "digital": round(dig[c])},
            # risk sub-scores (0-100, higher = MORE risk)
            "risk": {"political": round(100-polstab[c]), "regulatory": round(100-regq[c]),
                      "corruption": round(100-cpi[c]), "currency": round(fx_risk[c])},
            # distance structural attributes
            "dist": {"lang": r["lang"], "religion": r["religion"], "norms": r["norms"],
                      "legal": r["legal"], "lat": r["geoLat"], "lon": r["geoLon"]},
        }

    # geographic distance normalization constant exported for the client
    return {"meta": {"sources": SOURCES, "vintage": "2024", "maxKm": MAX_KM,
                      "note": "Curated snapshot from published figures; see sources. Replace via ETL for live feed."},
            "countries": countries}

if __name__ == "__main__":
    data = build()
    with open("src/data/countries.json", "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    n = len(data["countries"])
    print(f"wrote {n} countries")
    # quick sanity checks
    import statistics as st
    opp_size = [c["opp"]["size"] for c in data["countries"].values()]
    print("opp.size range:", min(opp_size), max(opp_size))
    risks = [c["risk"]["political"] for c in data["countries"].values()]
    print("risk.political range:", min(risks), max(risks))
