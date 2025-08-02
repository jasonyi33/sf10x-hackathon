import requests
resp = requests.get("https://data.sfgov.org/resource/ynuv-fyni.geojson")
data = resp.json()