# -*- coding: utf-8 -*-
"""CSV → web/src/data/data.json 프리컴퓨트. 빌드 전 1회 실행."""
import json
import os

import numpy as np
import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATS = ["음식", "숙박", "예술·스포츠"]


def load(path):
    df = pd.read_csv(path)
    df["경도"] = pd.to_numeric(df["경도"], errors="coerce")
    df["위도"] = pd.to_numeric(df["위도"], errors="coerce")
    df = df.dropna(subset=["경도", "위도"])
    df = df[(df["경도"] > 126) & (df["경도"] < 130) & (df["위도"] > 33) & (df["위도"] < 39)]
    return df[df["업종대분류명"].isin(CATS)]


def shannon_h(series):
    p = series.value_counts(normalize=True)
    return float(-np.sum(p * np.log(p)))


yw = load(os.path.join(ROOT, "data", "sdc", "상권정보_영월군.csv"))
gj = load(os.path.join(ROOT, "data", "상권정보_경주시.csv"))

zones = {}
for z, zd in yw.groupby("행정동명"):
    zones[z] = {
        "subcat": zd["업종소분류명"].value_counts().to_dict(),
        "cat": {c: int((zd["업종대분류명"] == c).sum()) for c in CATS},
    }

points = [
    [round(r["위도"], 5), round(r["경도"], 5), CATS.index(r["업종대분류명"]),
     str(r.get("상호명", "")), str(r.get("업종소분류명", ""))]
    for _, r in yw.iterrows()
]

out = {"gjH": round(shannon_h(gj["업종소분류명"]), 4), "zones": zones, "points": points}
dest = os.path.join(ROOT, "web", "src", "data", "data.json")
os.makedirs(os.path.dirname(dest), exist_ok=True)
with open(dest, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
print(f"wrote {dest} ({os.path.getsize(dest) // 1024}KB, {len(points)} points, {len(zones)} zones)")
