# -*- coding: utf-8 -*-
"""영월군 업종 이식 시뮬레이터 - 인터랙티브 대시보드"""
import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import folium
from folium.plugins import MarkerCluster
from streamlit_folium import st_folium
import os, json

st.set_page_config(page_title="영월군 업종 이식 시뮬레이터", page_icon="🏔", layout="wide")

# ── Toss-inspired Light Theme CSS ──
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap');

html, body, [class*="st-"] { font-family: 'Noto Sans KR', -apple-system, sans-serif; }

/* Light background */
.stApp { background: #f7f8fa; }
.block-container { padding: 2rem 2.5rem 3rem; max-width: 1200px; }

/* Remove default Streamlit borders */
[data-testid="stHeader"] { background: transparent; }
section[data-testid="stSidebar"] {
    background: #ffffff;
    border-right: none;
    box-shadow: 2px 0 12px rgba(0,0,0,0.04);
}
section[data-testid="stSidebar"] > div { padding-top: 1.5rem; }

/* Hero card */
.hero {
    background: #ffffff;
    border-radius: 20px;
    padding: 36px 40px 32px;
    margin-bottom: 28px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
}
.hero-eyebrow {
    font-size: 12px; font-weight: 600;
    color: #3182f6; letter-spacing: 0.5px;
    margin-bottom: 6px;
}
.hero h2 {
    font-size: 26px; font-weight: 700;
    color: #191f28; margin: 0 0 6px;
    letter-spacing: -0.02em; line-height: 1.3;
}
.hero p {
    font-size: 14px; color: #8b95a1;
    margin: 0; line-height: 1.6;
}

/* KPI row */
.kpi-row { display: flex; gap: 16px; margin-bottom: 28px; }
.kpi {
    flex: 1;
    background: #ffffff;
    border-radius: 16px;
    padding: 22px 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
    transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s;
}
.kpi:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
.kpi-label { font-size: 12px; font-weight: 500; color: #8b95a1; margin-bottom: 8px; }
.kpi-value { font-size: 28px; font-weight: 700; color: #191f28; line-height: 1; margin-bottom: 4px; }
.kpi-sub { font-size: 12px; color: #b0b8c1; }
.kpi-value.blue { color: #3182f6; }
.kpi-value.green { color: #20c997; }
.kpi-value.orange { color: #f97316; }
.kpi-value.slate { color: #4e5968; }
.kpi-delta { display: inline-block; font-size: 12px; font-weight: 600; color: #20c997; margin-left: 6px; }
.kpi-delta.neg { color: #f04452; }

/* Section card */
.card {
    background: #ffffff;
    border-radius: 16px;
    padding: 28px;
    margin-bottom: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
}
.card-title {
    font-size: 16px; font-weight: 700;
    color: #191f28; margin-bottom: 4px;
    letter-spacing: -0.01em;
}
.card-sub { font-size: 13px; color: #8b95a1; margin-bottom: 20px; }

/* Divider */
.sep { height: 1px; background: #f2f4f6; margin: 32px 0; }

/* Table */
.tbl {
    width: 100%; border-collapse: collapse;
    font-size: 13px; color: #333d4b;
}
.tbl th {
    text-align: left; padding: 10px 12px;
    font-weight: 600; color: #8b95a1;
    border-bottom: 2px solid #f2f4f6;
    font-size: 12px;
}
.tbl td {
    padding: 10px 12px;
    border-bottom: 1px solid #f9fafb;
}
.tbl tr:hover td { background: #f9fafb; }
.tbl .num { text-align: right; font-variant-numeric: tabular-nums; }
.tbl .pos { color: #20c997; font-weight: 600; }
.tbl .neg { color: #f04452; font-weight: 600; }
.tbl .hl { background: #f0f7ff; }

/* Badge */
.badge {
    display: inline-block; padding: 3px 10px;
    border-radius: 6px; font-size: 11px; font-weight: 600;
}
.badge-blue { background: #e8f3ff; color: #3182f6; }
.badge-green { background: #e6f9f0; color: #20c997; }
.badge-orange { background: #fff4e6; color: #f97316; }
.badge-red { background: #ffefef; color: #f04452; }

/* Metric override */
[data-testid="stMetric"] {
    background: #fff; border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    padding: 16px 20px;
}

/* Tabs */
.stTabs [data-baseweb="tab-list"] {
    gap: 0; background: #f2f4f6; border-radius: 12px; padding: 3px;
}
.stTabs [data-baseweb="tab"] {
    border-radius: 10px; font-size: 13px; font-weight: 500; color: #8b95a1;
    padding: 8px 20px;
}
.stTabs [aria-selected="true"] {
    background: #fff !important; color: #191f28 !important;
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

/* Map legend */
.map-legend {
    display: flex; gap: 20px; padding: 12px 0 0;
    font-size: 12px; color: #8b95a1;
}
.map-legend span { display: flex; align-items: center; gap: 6px; }
.leg-dot { width: 10px; height: 10px; border-radius: 50%; }

/* Sidebar styling */
section[data-testid="stSidebar"] .stSlider label { font-size: 13px !important; font-weight: 500 !important; color: #333d4b !important; }
section[data-testid="stSidebar"] .stSelectbox label { font-size: 13px !important; font-weight: 500 !important; color: #333d4b !important; }

/* Recommendation callout */
.recommend {
    background: #f0f7ff;
    border-radius: 12px;
    padding: 16px 20px;
    margin: 12px 0;
    border-left: 3px solid #3182f6;
}
.recommend-title { font-size: 13px; font-weight: 700; color: #3182f6; margin-bottom: 4px; }
.recommend p { font-size: 13px; color: #4e5968; margin: 0; line-height: 1.6; }
</style>
""", unsafe_allow_html=True)

# ── Constants ──
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

CAFE_Y = 633 * 12
FOOD_Y = 1134 * 12
STAY_Y = 695 * 12
LOCAL_RATE = 0.60
TAX_RATE = 0.0289
OWN_BM = 462
TOTAL_BM = 3342
BASE_FI = OWN_BM / TOTAL_BM * 100
POP_EQ = 862

CAFE_MIX = {"카페": 0.55, "빵/도넛": 0.15, "요리 주점": 0.15, "기타 한식 음식점": 0.15}
FOOD_MIX = {"백반/한정식": 0.40, "돼지고기 구이/찜": 0.15, "치킨": 0.10,
            "김밥/만두/분식": 0.10, "횟집": 0.10, "중국집": 0.10, "해산물 구이/찜": 0.05}
STAY_MIX = {"펜션": 0.30, "여관/모텔": 0.25, "호텔/리조트": 0.20,
            "캠핑/글램핑": 0.15, "그 외 기타 숙박업": 0.10}

PRESETS = {
    "방식A (인구비례)": (62, 9, 30),
    "방식B 보수": (10, 15, 10),
    "방식B 중간": (30, 30, 20),
    "방식B 적극": (62, 30, 30),
}

ZONE_META = {
    "무릉도원면": {"label": "펜션촌", "lat": 37.28, "lon": 128.53, "color": "#f04452", "issue": "숙박 편중, 음식/레저 극소"},
    "영월읍": {"label": "시내 중심", "lat": 37.18, "lon": 128.46, "color": "#3182f6", "issue": "상권 밀집, 다양성 양호"},
    "주천면": {"label": "동강권", "lat": 37.24, "lon": 128.34, "color": "#20c997", "issue": "음식 중심, 숙박/레저 부족"},
    "김삿갓면": {"label": "숙박 특화", "lat": 37.13, "lon": 128.70, "color": "#f97316", "issue": "숙박 과다, 음식 극소"},
    "한반도면": {"label": "한반도지형", "lat": 37.23, "lon": 128.38, "color": "#8b5cf6", "issue": "소규모 혼합"},
    "북면": {"label": "북부", "lat": 37.33, "lon": 128.52, "color": "#64748b", "issue": "소규모"},
    "산솔면": {"label": "산간", "lat": 37.16, "lon": 128.57, "color": "#64748b", "issue": "소규모"},
    "남면": {"label": "남부", "lat": 37.12, "lon": 128.47, "color": "#64748b", "issue": "소규모"},
    "상동읍": {"label": "상동", "lat": 37.12, "lon": 128.83, "color": "#64748b", "issue": "소규모"},
}

PLOTLY_COLORS = {
    "blue": "#3182f6", "green": "#20c997", "orange": "#f97316",
    "red": "#f04452", "slate": "#8b95a1", "bg": "#f7f8fa",
}

PLOTLY_BASE = dict(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    font=dict(family="Noto Sans KR, sans-serif", color="#333d4b", size=12),
    margin=dict(l=48, r=16, t=44, b=44),
    xaxis=dict(gridcolor="#f2f4f6", zerolinecolor="#e5e8eb"),
    yaxis=dict(gridcolor="#f2f4f6", zerolinecolor="#e5e8eb"),
)


def shannon_h(series):
    counts = series.value_counts()
    props = counts / counts.sum()
    return -np.sum(props * np.log(props))


def evenness(h, n):
    return h / np.log(n) if n > 1 else 0


@st.cache_data
def load_data():
    yw = pd.read_csv(os.path.join(DATA_DIR, "sdc", "상권정보_영월군.csv"))
    yw["경도"] = pd.to_numeric(yw["경도"], errors="coerce")
    yw["위도"] = pd.to_numeric(yw["위도"], errors="coerce")
    yw = yw.dropna(subset=["경도", "위도"])
    yw = yw[(yw["경도"] > 126) & (yw["경도"] < 130) & (yw["위도"] > 33) & (yw["위도"] < 39)]
    yw = yw[yw["업종대분류명"].isin(["음식", "숙박", "예술·스포츠"])]

    gj = pd.read_csv(os.path.join(DATA_DIR, "상권정보_경주시.csv"))
    gj["경도"] = pd.to_numeric(gj["경도"], errors="coerce")
    gj["위도"] = pd.to_numeric(gj["위도"], errors="coerce")
    gj = gj.dropna(subset=["경도", "위도"])
    gj = gj[(gj["경도"] > 126) & (gj["경도"] < 130) & (gj["위도"] > 33) & (gj["위도"] < 39)]
    gj = gj[gj["업종대분류명"].isin(["음식", "숙박", "예술·스포츠"])]
    return yw, gj


def simulate(yw, zone, cafe_n, food_n, stay_n):
    zone_data = yw[yw["행정동명"] == zone]
    before_h = shannon_h(zone_data["업종소분류명"])
    before_n = zone_data["업종소분류명"].nunique()
    before_e = evenness(before_h, before_n)

    added = []
    for name, ratio in CAFE_MIX.items():
        added.extend([name] * max(1, int(cafe_n * ratio)))
    for name, ratio in FOOD_MIX.items():
        added.extend([name] * max(1, int(food_n * ratio)))
    for name, ratio in STAY_MIX.items():
        added.extend([name] * max(1, int(stay_n * ratio)))

    new_s = pd.Series(zone_data["업종소분류명"].tolist() + added)
    after_h = shannon_h(new_s)
    after_n = new_s.nunique()
    after_e = evenness(after_h, after_n)

    sales = cafe_n * CAFE_Y + food_n * FOOD_Y + stay_n * STAY_Y
    add_tax = (sales / 100) * LOCAL_RATE * TAX_RATE
    new_fi = (OWN_BM + add_tax / 100) / TOTAL_BM * 100

    return {
        "before_h": before_h, "after_h": after_h,
        "before_e": before_e, "after_e": after_e,
        "before_n": before_n, "after_n": after_n,
        "before_count": len(zone_data), "after_count": len(zone_data) + len(added),
        "sales_억": sales / 10000, "new_fi": new_fi, "fi_delta": new_fi - BASE_FI,
        "pop_off": int(sales * LOCAL_RATE / POP_EQ), "add_tax_억": add_tax / 10000,
    }


def zone_analysis(yw, cafe_n, food_n, stay_n):
    rows = []
    for z in sorted(yw["행정동명"].unique()):
        zd = yw[yw["행정동명"] == z]
        if len(zd) < 5:
            continue
        cats = zd["업종대분류명"].value_counts()
        n_food = cats.get("음식", 0)
        n_stay = cats.get("숙박", 0)
        n_leisure = cats.get("예술·스포츠", 0)
        before_h = shannon_h(zd["업종소분류명"])

        added = []
        for name, ratio in CAFE_MIX.items():
            added.extend([name] * max(1, int(cafe_n * ratio)))
        for name, ratio in FOOD_MIX.items():
            added.extend([name] * max(1, int(food_n * ratio)))
        for name, ratio in STAY_MIX.items():
            added.extend([name] * max(1, int(stay_n * ratio)))
        new_s = pd.Series(zd["업종소분류명"].tolist() + added)
        after_h = shannon_h(new_s)

        need_food = n_food < n_stay
        need_stay = n_stay < 10
        need_leisure = n_leisure < 5

        needs = []
        if need_food:
            needs.append("음식")
        if need_stay:
            needs.append("숙박")
        if need_leisure:
            needs.append("레저")

        rows.append({
            "zone": z,
            "total": len(zd), "food": n_food, "stay": n_stay, "leisure": n_leisure,
            "before_h": before_h, "after_h": after_h, "delta_h": after_h - before_h,
            "needs": needs,
            "priority": "high" if before_h < 2.0 else ("mid" if before_h < 2.5 else "low"),
        })
    return sorted(rows, key=lambda x: x["before_h"])


def build_sim_chart(yw, cafe_n, food_n, stay_n):
    zones_target = ["무릉도원면", "영월읍", "주천면", "김삿갓면"]
    labels, before_vals, after_vals = [], [], []

    for z in zones_target:
        zd = yw[yw["행정동명"] == z]
        if len(zd) < 5:
            continue
        labels.append(z)
        before_vals.append(shannon_h(zd["업종소분류명"]))
        added = []
        for name, ratio in CAFE_MIX.items():
            added.extend([name] * max(1, int(cafe_n * ratio)))
        for name, ratio in FOOD_MIX.items():
            added.extend([name] * max(1, int(food_n * ratio)))
        for name, ratio in STAY_MIX.items():
            added.extend([name] * max(1, int(stay_n * ratio)))
        new_s = pd.Series(zd["업종소분류명"].tolist() + added)
        after_vals.append(shannon_h(new_s))

    fig = go.Figure()
    fig.add_trace(go.Bar(
        name="현재", x=labels, y=before_vals,
        marker_color="#e5e8eb",
        text=[f"{v:.2f}" for v in before_vals], textposition="outside",
        textfont=dict(size=12, color="#8b95a1"),
    ))
    fig.add_trace(go.Bar(
        name="이식 후", x=labels, y=after_vals,
        marker_color="#3182f6",
        text=[f"{v:.2f}" for v in after_vals], textposition="outside",
        textfont=dict(size=12, color="#3182f6"),
    ))
    fig.update_layout(
        **PLOTLY_BASE,
        title=dict(text="권역별 Shannon H' 변화", font=dict(size=15, color="#191f28")),
        barmode="group", bargap=0.25, bargroupgap=0.1,
        legend=dict(orientation="h", y=1.12, x=0.5, xanchor="center", font=dict(size=12)),
        height=400,
        margin=dict(l=48, r=16, t=64, b=44),
        yaxis_title="Shannon H'",
    )
    return fig


def build_scenario_chart(yw, zone):
    labels, sales, pops = [], [], []
    for name, (c, f, s) in PRESETS.items():
        r = simulate(yw, zone, c, f, s)
        labels.append(name.replace("방식", "").strip())
        sales.append(r["sales_억"])
        pops.append(r["pop_off"])

    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=labels, y=sales,
        marker_color=["#e5e8eb", "#bfdbfe", "#60a5fa", "#3182f6"],
        text=[f"{v:.1f}억" for v in sales], textposition="outside",
        textfont=dict(size=13, color="#333d4b"),
    ))
    fig.update_layout(
        **PLOTLY_BASE,
        title=dict(text="시나리오별 추가 관광소비", font=dict(size=15, color="#191f28")),
        height=380,
        yaxis_title="억원/년",
        showlegend=False,
    )
    return fig


def build_map(yw, zone_data_list, selected_zone=None):
    m = folium.Map(
        location=[37.21, 128.46], zoom_start=11,
        tiles="cartodbpositron",
    )

    cat_colors = {"음식": "#3182f6", "숙박": "#f97316", "예술·스포츠": "#8b5cf6"}

    for cat, color in cat_colors.items():
        cat_df = yw[yw["업종대분류명"] == cat]
        fg = folium.FeatureGroup(name=f"{cat} ({len(cat_df)})")
        for _, row in cat_df.iterrows():
            folium.CircleMarker(
                location=[row["위도"], row["경도"]],
                radius=3, color=color, fill=True,
                fill_color=color, fill_opacity=0.5, weight=0.5, opacity=0.6,
                popup=f"<b>{row.get('상호명','')}</b><br>{row.get('업종소분류명','')}",
            ).add_to(fg)
        fg.add_to(m)

    rec_fg = folium.FeatureGroup(name="업종 추천 지역", show=True)
    for zd in zone_data_list:
        z = zd["zone"]
        meta = ZONE_META.get(z, {})
        if not meta or not zd["needs"]:
            continue

        is_selected = z == selected_zone
        color = meta["color"]
        needs_str = ", ".join(zd["needs"])
        priority_label = {"high": "긴급", "mid": "보통", "low": "양호"}.get(zd["priority"], "")
        priority_color = {"high": "#f04452", "mid": "#f97316", "low": "#20c997"}.get(zd["priority"], "#8b95a1")

        popup_html = f"""
        <div style="font-family:'Noto Sans KR',sans-serif;min-width:200px;padding:4px">
            <div style="font-size:15px;font-weight:700;color:#191f28;margin-bottom:6px">{z}</div>
            <div style="font-size:12px;color:#8b95a1;margin-bottom:8px">{meta.get('issue','')}</div>
            <div style="display:flex;gap:8px;margin-bottom:8px">
                <span style="background:#e8f3ff;color:#3182f6;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">음식 {zd['food']}</span>
                <span style="background:#fff4e6;color:#f97316;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">숙박 {zd['stay']}</span>
                <span style="background:#f3f0ff;color:#8b5cf6;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">레저 {zd['leisure']}</span>
            </div>
            <div style="font-size:12px;margin-bottom:4px">
                <b>H'</b> {zd['before_h']:.2f} &rarr; {zd['after_h']:.2f}
                <span style="color:#20c997;font-weight:600"> (+{zd['delta_h']:.2f})</span>
            </div>
            <div style="font-size:12px;margin-bottom:4px">
                <b>추천:</b> <span style="color:{priority_color};font-weight:600">{needs_str} 이식 ({priority_label})</span>
            </div>
        </div>
        """

        icon_html = f"""
        <div style="
            background:{color};color:white;
            border-radius:8px;padding:4px 10px;
            font-size:12px;font-weight:700;
            box-shadow:0 2px 8px rgba(0,0,0,0.15);
            white-space:nowrap;
            border:2px solid {'#191f28' if is_selected else 'white'};
            transform:{'scale(1.15)' if is_selected else 'scale(1)'};
        ">{z}<br><span style="font-size:10px;font-weight:400;opacity:0.9">{needs_str} 필요</span></div>
        """

        folium.Marker(
            location=[meta["lat"], meta["lon"]],
            popup=folium.Popup(popup_html, max_width=280),
            icon=folium.DivIcon(html=icon_html, icon_size=(120, 40), icon_anchor=(60, 20)),
        ).add_to(rec_fg)

        folium.Circle(
            location=[meta["lat"], meta["lon"]],
            radius=2500 if zd["priority"] == "high" else 1800,
            color=color, fill=True, fill_color=color,
            fill_opacity=0.08 if not is_selected else 0.15,
            weight=2 if is_selected else 1,
            opacity=0.4,
            dash_array="6" if not is_selected else None,
        ).add_to(rec_fg)

    rec_fg.add_to(m)
    folium.LayerControl(collapsed=False).add_to(m)
    return m


def main():
    yw, gj = load_data()
    gj_h = shannon_h(gj["업종소분류명"])
    zones = sorted(yw["행정동명"].unique())

    # ── Header ──
    st.markdown("""
    <div class="hero">
        <div class="hero-eyebrow">SDC &middot; 영월군 관광 데이터 분석</div>
        <h2>업종 이식 시뮬레이터</h2>
        <p>권역&middot;업종&middot;수량을 조정하면 Shannon H' 변화, 추가 소비 효과, 추천 이식 지역을 실시간으로 확인할 수 있습니다.</p>
    </div>
    """, unsafe_allow_html=True)

    # ── Sidebar ──
    with st.sidebar:
        st.markdown("#### 시뮬레이션 설정")

        preset = st.selectbox("프리셋", ["직접 설정"] + list(PRESETS.keys()), index=4)
        if preset != "직접 설정":
            dc, df, ds = PRESETS[preset]
        else:
            dc, df, ds = 62, 9, 30

        st.markdown("---")
        st.markdown("##### 이식 업종 수량")
        cafe_n = st.slider("카페/베이커리", 0, 100, dc)
        food_n = st.slider("음식점", 0, 60, df)
        stay_n = st.slider("숙박업", 0, 60, ds)

        st.markdown("---")
        zone = st.selectbox("집중 분석 권역", zones,
                            index=zones.index("무릉도원면") if "무릉도원면" in zones else 0)

        st.markdown("---")
        st.markdown(f"""
        <div style="font-size:11px;color:#b0b8c1;line-height:1.8">
        카페 월매출 {CAFE_Y//12:,}만원<br>
        음식점 월매출 {FOOD_Y//12:,}만원<br>
        숙박 월매출 {STAY_Y//12:,}만원<br>
        지역귀속률 {LOCAL_RATE:.0%} &middot; 지방세율 {TAX_RATE:.2%}<br>
        현재 재정자립도 {BASE_FI:.3f}%
        </div>
        """, unsafe_allow_html=True)

    # ── Compute ──
    result = simulate(yw, zone, cafe_n, food_n, stay_n)
    zone_list = zone_analysis(yw, cafe_n, food_n, stay_n)

    # ── KPI ──
    st.markdown(f"""
    <div class="kpi-row">
        <div class="kpi">
            <div class="kpi-label">추가 관광소비</div>
            <div class="kpi-value blue">{result['sales_억']:.1f}<span style="font-size:16px;color:#8b95a1">억/년</span></div>
            <div class="kpi-sub">카페 {cafe_n} + 음식 {food_n} + 숙박 {stay_n}개</div>
        </div>
        <div class="kpi">
            <div class="kpi-label">{zone} Shannon H'</div>
            <div class="kpi-value green">{result['after_h']:.2f}<span class="kpi-delta">+{result['after_h']-result['before_h']:.2f}</span></div>
            <div class="kpi-sub">현재 {result['before_h']:.2f} &middot; 경주 벤치마크 {gj_h:.2f}</div>
        </div>
        <div class="kpi">
            <div class="kpi-label">재정자립도</div>
            <div class="kpi-value slate">{result['new_fi']:.3f}<span style="font-size:16px;color:#8b95a1">%</span></div>
            <div class="kpi-sub">현재 {BASE_FI:.3f}% <span class="kpi-delta">+{result['fi_delta']:.3f}%p</span></div>
        </div>
        <div class="kpi">
            <div class="kpi-label">인구 대체 효과</div>
            <div class="kpi-value orange">{result['pop_off']}<span style="font-size:16px;color:#8b95a1">명분</span></div>
            <div class="kpi-sub">연간 자연감소 587명 대비 {result['pop_off']/587*100:.0f}%</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # ── Charts ──
    c1, c2 = st.columns(2)
    with c1:
        st.plotly_chart(build_sim_chart(yw, cafe_n, food_n, stay_n),
                        use_container_width=True, config={"displayModeBar": False})
    with c2:
        st.plotly_chart(build_scenario_chart(yw, zone),
                        use_container_width=True, config={"displayModeBar": False})

    st.markdown('<div class="sep"></div>', unsafe_allow_html=True)

    # ── Map ──
    st.markdown("""
    <div class="card-title">업종 추천 지역 지도</div>
    <div class="card-sub">H'가 낮고 특정 업종이 부족한 권역을 자동 탐지합니다. 마커를 클릭하면 상세 정보를 확인할 수 있습니다.</div>
    """, unsafe_allow_html=True)

    m = build_map(yw, zone_list, selected_zone=zone)
    st_folium(m, width=None, height=520, returned_objects=[])

    st.markdown("""
    <div class="map-legend">
        <span><span class="leg-dot" style="background:#3182f6"></span> 음식점</span>
        <span><span class="leg-dot" style="background:#f97316"></span> 숙박</span>
        <span><span class="leg-dot" style="background:#8b5cf6"></span> 레저/스포츠</span>
        <span><span class="leg-dot" style="background:transparent;border:2px dashed #f04452;width:8px;height:8px"></span> 이식 추천 영역</span>
    </div>
    """, unsafe_allow_html=True)

    st.markdown('<div class="sep"></div>', unsafe_allow_html=True)

    # ── Zone Detail Table ──
    st.markdown("""
    <div class="card-title">권역별 업종 다양성 분석</div>
    <div class="card-sub">Shannon H' 기준 오름차순. 값이 낮을수록 업종 편중이 심하며 이식 우선 대상입니다.</div>
    """, unsafe_allow_html=True)

    tbl_rows = ""
    for zd in zone_list:
        meta = ZONE_META.get(zd["zone"], {})
        color = meta.get("color", "#64748b")
        needs_html = " ".join([
            f'<span class="badge {"badge-blue" if n=="음식" else "badge-orange" if n=="숙박" else "badge-green"}">{n}</span>'
            for n in zd["needs"]
        ]) if zd["needs"] else '<span style="color:#b0b8c1;font-size:11px">&mdash;</span>'

        p_badge = {"high": "badge-red", "mid": "badge-orange", "low": "badge-green"}.get(zd["priority"], "")
        p_label = {"high": "긴급", "mid": "보통", "low": "양호"}.get(zd["priority"], "")

        hl = ' class="hl"' if zd["zone"] == zone else ""
        tbl_rows += f"""
        <tr{hl}>
            <td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:{color};margin-right:8px"></span><b>{zd['zone']}</b></td>
            <td class="num">{zd['total']}</td>
            <td class="num">{zd['food']}</td>
            <td class="num">{zd['stay']}</td>
            <td class="num">{zd['leisure']}</td>
            <td class="num">{zd['before_h']:.2f}</td>
            <td class="num">{zd['after_h']:.2f}</td>
            <td class="num pos">+{zd['delta_h']:.2f}</td>
            <td>{needs_html}</td>
            <td><span class="badge {p_badge}">{p_label}</span></td>
        </tr>"""

    st.markdown(f"""
    <table class="tbl">
        <thead>
            <tr>
                <th>권역</th><th class="num">총 업소</th>
                <th class="num">음식</th><th class="num">숙박</th><th class="num">레저</th>
                <th class="num">현재 H'</th><th class="num">이식후</th><th class="num">변화</th>
                <th>부족 업종</th><th>우선순위</th>
            </tr>
        </thead>
        <tbody>{tbl_rows}</tbody>
    </table>
    """, unsafe_allow_html=True)

    st.markdown('<div class="sep"></div>', unsafe_allow_html=True)

    # ── Zone Detail ──
    st.markdown(f"""
    <div class="card-title">{zone} &mdash; 상세 분석</div>
    <div class="card-sub">{ZONE_META.get(zone, {}).get('issue', '').replace('·', '/').replace('—', '-')}</div>
    """, unsafe_allow_html=True)

    d1, d2 = st.columns([3, 2])
    with d1:
        zone_data = yw[yw["행정동명"] == zone]
        before = zone_data["업종소분류명"].value_counts().head(12)

        added = []
        for name, ratio in CAFE_MIX.items():
            added.extend([name] * max(1, int(cafe_n * ratio)))
        for name, ratio in FOOD_MIX.items():
            added.extend([name] * max(1, int(food_n * ratio)))
        for name, ratio in STAY_MIX.items():
            added.extend([name] * max(1, int(stay_n * ratio)))
        after = pd.Series(zone_data["업종소분류명"].tolist() + added).value_counts().head(12)

        all_cats = list(dict.fromkeys(list(before.index) + list(after.index)))[:12]
        b_vals = [before.get(c, 0) for c in all_cats]
        a_vals = [after.get(c, 0) for c in all_cats]

        fig = go.Figure()
        fig.add_trace(go.Bar(name="현재", y=all_cats, x=b_vals, orientation="h",
                             marker_color="#e5e8eb"))
        fig.add_trace(go.Bar(name="이식 후", y=all_cats, x=a_vals, orientation="h",
                             marker_color="#3182f6"))
        layout = {**PLOTLY_BASE}
        layout.pop("yaxis", None)
        layout.pop("xaxis", None)
        fig.update_layout(
            **layout,
            title=dict(text=f"{zone} 업종 소분류 TOP 12", font=dict(size=14, color="#191f28")),
            barmode="group", height=460,
            legend=dict(orientation="h", y=1.12, x=0.5, xanchor="center", font=dict(size=12)),
            margin=dict(l=48, r=16, t=72, b=44),
            yaxis=dict(autorange="reversed", gridcolor="#f2f4f6"),
            xaxis=dict(gridcolor="#f2f4f6", title="업소 수"),
        )
        st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})

    with d2:
        st.markdown(f"""
| 지표 | 현재 | 이식 후 | 변화 |
|:---|:---:|:---:|:---:|
| **Shannon H'** | {result['before_h']:.2f} | {result['after_h']:.2f} | **+{result['after_h']-result['before_h']:.2f}** |
| 균등도 J' | {result['before_e']:.2f} | {result['after_e']:.2f} | +{result['after_e']-result['before_e']:.2f} |
| 업종 수 | {result['before_n']} | {result['after_n']} | +{result['after_n']-result['before_n']} |
| 업소 수 | {result['before_count']} | {result['after_count']} | +{result['after_count']-result['before_count']} |
| 경주 벤치마크 | {gj_h:.2f} | - | 격차 {result['after_h']-gj_h:+.2f} |
""")

        current_zd = next((z for z in zone_list if z["zone"] == zone), None)
        if current_zd and current_zd["needs"]:
            needs_str = ", ".join(current_zd["needs"])
            st.markdown(f"""
<div class="recommend">
    <div class="recommend-title">이식 추천</div>
    <p>{zone}은 <b>{needs_str}</b> 업종이 부족합니다.
    이식 시 H'가 {current_zd['before_h']:.2f}에서 {current_zd['after_h']:.2f}로 개선되며,
    경주 대비 격차가 {current_zd['after_h']-gj_h:+.2f}로 축소됩니다.</p>
</div>
            """, unsafe_allow_html=True)

    # ── Footer ──
    st.markdown('<div class="sep"></div>', unsafe_allow_html=True)
    st.caption("데이터: 소상공인 상권정보 API / 소상공인365 매출 / 지방재정365 | 분석 기준: 2024~2026")


if __name__ == "__main__":
    main()
