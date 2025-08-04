import requests
resp = requests.get("https://data.sfgov.org/resource/ynuv-fyni.geojson")
data = resp.json()

Inspired source:
https://github.com/RhysSullivan/sf-crime-heatmap/tree/main?tab=readme-ov-file by 