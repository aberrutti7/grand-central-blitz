import json
import os

INPUT_FILE = "single_play.json"
OUTPUT_FILE = "plays_filtered.json"

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

filtered_spins = []

for spin in data["spins"]:
    if not spin:
        continue

    game = spin[0].get("basegame")
    if game and game.get("reelsHeight") in (3, 6):
        filtered_spins.append(spin)

data["spins"] = filtered_spins

with open(INPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(data, f, separators=(",", ":"))

print(f"Jugadas restantes: {len(data['spins'])}")