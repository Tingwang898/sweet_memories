import { useEffect, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import countries from "world-atlas/countries-110m.json";
import {
  Camera,
  ChevronRight,
  CirclePlus,
  MapPin,
  PawPrint,
  Sparkles,
  Utensils,
  X,
} from "lucide-react";
import {
  createTravelCity,
  fetchTravelCities,
  isSupabaseConfigured,
} from "./supabaseClient";

const mainTabs = ["足迹城市", "心仪目的地", "回忆相册", "宠物帕恰游记", "我们的时间线"];
const filters = ["全部城市", "国内城市", "境外城市", "城市美食打卡", "自然风光打卡"];

const initialCities = [
  {
    id: "shanghai",
    name: "上海",
    date: "2023.05.20",
    coords: [121.4737, 31.2304],
    status: "visited",
    region: "domestic",
    type: "城市美食打卡",
    members: ["我", "对象", "帕恰"],
    days: 3,
    feature: "梧桐夜风",
    note: "在黄昏的外滩等灯光亮起，帕恰把每一步都踩得像小小邮戳。",
    food: "葱油拌面、蟹粉小笼、路边咖啡",
    dog: true,
  },
  {
    id: "kyoto",
    name: "京都",
    date: "2024.11.03",
    coords: [135.7681, 35.0116],
    status: "visited",
    region: "overseas",
    type: "自然风光打卡",
    members: ["我", "对象"],
    days: 4,
    feature: "枫叶与神社",
    note: "红叶落在石阶上，像一条安静的时间线，从清水寺延伸到傍晚。",
    food: "抹茶蕨饼、汤豆腐、鳗鱼饭",
    dog: false,
  },
  {
    id: "tokyo",
    name: "东京",
    date: "2025.04.12",
    coords: [139.6917, 35.6895],
    status: "visited",
    region: "overseas",
    type: "城市美食打卡",
    members: ["我", "对象", "帕恰"],
    days: 5,
    feature: "夜樱与拉面",
    note: "便利店的热茶、街角的夜樱，还有一只认真闻每个路口的小小旅伴。",
    food: "豚骨拉面、寿司、草莓蛋糕",
    dog: true,
  },
  {
    id: "paris",
    name: "巴黎",
    date: "2025.06.18",
    coords: [2.3522, 48.8566],
    status: "visited",
    region: "overseas",
    type: "城市美食打卡",
    members: ["我", "对象"],
    days: 6,
    feature: "塞纳河夜色",
    note: "金色路灯沿着河面铺开，晚风把所有普通散步都变成纪念。",
    food: "可颂、鹅肝、热巧克力",
    dog: false,
  },
  {
    id: "santorini",
    name: "圣托里尼",
    date: "心愿 · 2026",
    coords: [25.4615, 36.3932],
    status: "wish",
    region: "overseas",
    type: "自然风光打卡",
    members: ["我", "对象"],
    days: 5,
    feature: "爱琴海日落",
    note: "想把下一次日落存在这里，等某天一起解锁。",
    food: "海鲜、酸奶、葡萄酒",
    dog: false,
  },
  {
    id: "lijiang",
    name: "丽江",
    date: "心愿 · 2026",
    coords: [100.233, 26.872],
    status: "wish",
    region: "domestic",
    type: "自然风光打卡",
    members: ["我", "对象", "帕恰"],
    days: 4,
    feature: "雪山与古城",
    note: "想带帕恰在清晨古城里慢慢走，把爪印留给玉龙雪山。",
    food: "腊排骨、鲜花饼、米线",
    dog: true,
  },
  {
    id: "reykjavik",
    name: "雷克雅未克",
    date: "心愿 · 极光季",
    coords: [-21.9426, 64.1466],
    status: "wish",
    region: "overseas",
    type: "自然风光打卡",
    members: ["我", "对象"],
    days: 7,
    feature: "极光与温泉",
    note: "把地图上最冷的一点，留给最暖的一次拥抱。",
    food: "羊肉汤、黑麦面包、热可可",
    dog: false,
  },
];

const memoryTiles = [
  "linear-gradient(135deg, rgba(248,196,92,.88), rgba(55,34,18,.78)), radial-gradient(circle at 30% 20%, #fff7d7, transparent 28%)",
  "linear-gradient(135deg, rgba(255,171,204,.75), rgba(32,20,42,.82)), radial-gradient(circle at 72% 30%, #ffd6e6, transparent 24%)",
  "linear-gradient(135deg, rgba(73,111,150,.72), rgba(8,14,30,.94)), radial-gradient(circle at 45% 40%, #b9d4ff, transparent 22%)",
];

function cityFromDatabase(row) {
  return {
    id: row.id,
    name: row.name,
    date: row.travel_date_label,
    coords: [Number(row.longitude), Number(row.latitude)],
    status: row.status,
    region: row.region,
    type: row.checkin_type,
    members: row.members ?? ["我", "对象"],
    days: row.days ?? 1,
    feature: row.feature ?? "",
    note: row.note ?? "",
    food: row.food ?? "",
    dog: Boolean(row.dog),
  };
}

function cityToDatabase(city, sortOrder) {
  return {
    id: city.id,
    name: city.name,
    travel_date_label: city.date,
    longitude: city.coords[0],
    latitude: city.coords[1],
    status: city.status,
    region: city.region,
    checkin_type: city.type,
    members: city.members,
    days: city.days,
    feature: city.feature,
    note: city.note,
    food: city.food,
    dog: city.dog,
    sort_order: sortOrder,
  };
}

export function App() {
  const [cities, setCities] = useState(initialCities);
  const [activeId, setActiveId] = useState("kyoto");
  const [activeMain, setActiveMain] = useState("足迹城市");
  const [filter, setFilter] = useState("全部城市");
  const [tab, setTab] = useState("实拍照片");
  const [modalOpen, setModalOpen] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [cloudNotice, setCloudNotice] = useState(
    isSupabaseConfigured ? "正在连接 Supabase" : "本地预览模式"
  );
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const dragRef = useRef(null);

  const land = useMemo(() => feature(countries, countries.objects.countries), []);
  const projection = useMemo(
    () => geoMercator().scale(160).translate([520, 320]).center([12, 18]),
    []
  );
  const path = useMemo(() => geoPath(projection), [projection]);

  const visibleCities = useMemo(() => {
    return cities.filter((city) => {
      if (activeMain === "心仪目的地" && city.status !== "wish") return false;
      if (activeMain === "足迹城市" && city.status !== "visited") return false;
      if (filter === "国内城市" && city.region !== "domestic") return false;
      if (filter === "境外城市" && city.region !== "overseas") return false;
      if ((filter === "城市美食打卡" || filter === "自然风光打卡") && city.type !== filter) return false;
      return true;
    });
  }, [activeMain, cities, filter]);

  const activeCity = cities.find((city) => city.id === activeId) ?? cities[0];
  const stats = {
    visited: cities.filter((city) => city.status === "visited").length,
    wish: cities.filter((city) => city.status === "wish").length,
    days: cities.filter((city) => city.status === "visited").reduce((sum, city) => sum + city.days, 0),
    dog: cities.filter((city) => city.dog).length,
  };

  useEffect(() => {
    if (visibleCities.length > 0 && !visibleCities.some((city) => city.id === activeId)) {
      setActiveId(visibleCities[0].id);
    }
  }, [activeId, visibleCities]);

  useEffect(() => {
    let active = true;

    async function loadCloudCities() {
      if (!isSupabaseConfigured) {
        setCloudNotice("本地预览模式 · 未配置云端数据库");
        return;
      }

      const { data, error } = await fetchTravelCities();
      if (!active) return;

      if (error) {
        setCloudNotice("Supabase 读取失败 · 使用本地示例数据");
        return;
      }

      if (data?.length) {
        const nextCities = data.map(cityFromDatabase);
        setCities(nextCities);
        setActiveId(nextCities[0].id);
      }
      setCloudNotice("Supabase 已连接");
    }

    loadCloudCities();
    return () => {
      active = false;
    };
  }, []);

  function selectCity(id) {
    setActiveId(id);
    const next = cities.find((city) => city.id === id);
    if (next?.status === "wish") setActiveMain("心仪目的地");
    if (next?.status === "visited") setActiveMain("足迹城市");
  }

  function handleWheel(event) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    setView((current) => ({
      ...current,
      scale: Math.min(2.2, Math.max(0.75, Number((current.scale + delta).toFixed(2)))),
    }));
  }

  function handlePointerDown(event) {
    dragRef.current = { x: event.clientX, y: event.clientY, startX: view.x, startY: view.y };
  }

  function handlePointerMove(event) {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    setView((current) => ({ ...current, x: dragRef.current.startX + dx, y: dragRef.current.startY + dy }));
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  async function handleAddCity(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = data.get("city")?.toString().trim() || "新城市";
    const status = data.get("status")?.toString() || "visited";
    const dog = data.get("dog") === "on";
    const nextCity = {
      id: `${name}-${Date.now()}`,
      name,
      date: data.get("date")?.toString() || "2026.08.03",
      coords: [
        Number(data.get("lng") || 116.4074),
        Number(data.get("lat") || 39.9042),
      ],
      status,
      region: data.get("region")?.toString() || "domestic",
      type: data.get("type")?.toString() || "城市美食打卡",
      members: dog ? ["我", "对象", "帕恰"] : ["我", "对象"],
      days: Number(data.get("days") || 2),
      feature: data.get("feature")?.toString() || "新的星光",
      note: data.get("note")?.toString() || "把这座城市点亮，留给以后慢慢回看。",
      food: data.get("food")?.toString() || "待补充",
      dog,
    };

    let cityToAdd = nextCity;
    if (isSupabaseConfigured) {
      const { data: savedCity, error } = await createTravelCity(cityToDatabase(nextCity, cities.length + 1));
      if (error) {
        setCloudNotice("云端写入失败 · 已先保存在当前页面");
      } else if (savedCity) {
        cityToAdd = cityFromDatabase(savedCity);
        setCloudNotice("已保存到 Supabase");
      }
    } else {
      setCloudNotice("本地预览模式 · 新增数据刷新后会消失");
    }

    setCities((current) => [...current, cityToAdd]);
    setActiveId(cityToAdd.id);
    setActiveMain(status === "wish" ? "心仪目的地" : "足迹城市");
    setModalOpen(false);
  }

  return (
    <main className="app-shell">
      <div className="star-field" />
      <header className="top-nav glass">
        <div className="primary-nav">
          {mainTabs.map((item) => (
            <button
              key={item}
              className={item === activeMain ? "nav-pill active" : "nav-pill"}
              onClick={() => setActiveMain(item)}
            >
              {item}
            </button>
          ))}
          <button className="add-button" onClick={() => setModalOpen(true)} aria-label="新增打卡">
            <CirclePlus size={18} />
            新增打卡
          </button>
        </div>
        <div className="filter-nav">
          {filters.map((item) => (
            <button
              key={item}
              className={item === filter ? "filter-chip active" : "filter-chip"}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </header>

      <section className="map-stage" aria-label="旅行足迹地图">
        <div className="map-toolbar glass">
          <Sparkles size={16} />
          <span>{visibleCities.length} 个点位已显示</span>
          <span className="cloud-status">{cloudNotice}</span>
          <button onClick={() => setView({ scale: 1, x: 0, y: 0 })}>重置视角</button>
        </div>
        <svg
          className="world-map"
          viewBox="0 0 1040 640"
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <defs>
            <filter id="goldGlow">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="pinkGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width="1040" height="640" className="map-ocean" />
          <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
            <g className="land-layer">
              {land.features.map((shape, index) => (
                <path key={index} d={path(shape) ?? ""} />
              ))}
            </g>
            <g className="route-layer">
              {cities
                .filter((city) => city.status === "visited")
                .map((city, index, list) => {
                  if (!list[index + 1]) return null;
                  const start = projection(city.coords);
                  const end = projection(list[index + 1].coords);
                  if (!start || !end) return null;
                  return (
                    <path
                      key={`${city.id}-route`}
                      d={`M ${start[0]} ${start[1]} Q ${(start[0] + end[0]) / 2} ${
                        Math.min(start[1], end[1]) - 55
                      } ${end[0]} ${end[1]}`}
                    />
                  );
                })}
            </g>
            <g className="marker-layer">
              {visibleCities.map((city) => {
                const point = projection(city.coords);
                if (!point) return null;
                const active = city.id === activeId;
                const markerClass = `${city.status === "visited" ? "visited" : "wish"} ${
                  active ? "active" : ""
                }`;
                return (
                  <g
                    key={city.id}
                    className={`map-marker ${markerClass}`}
                    transform={`translate(${point[0]} ${point[1]})`}
                    onClick={(event) => {
                      event.stopPropagation();
                      selectCity(city.id);
                    }}
                    onPointerEnter={() => setHovered({ city, point })}
                    onPointerLeave={() => setHovered(null)}
                  >
                    {city.dog && <circle className="paw-ring" r={15} />}
                    <circle className="marker-halo" r={active ? 18 : 13} />
                    <circle className="marker-core" r={active ? 7 : 5} />
                    {city.dog && <PawPrint className="paw-icon" x={-6} y={-6} width={12} height={12} />}
                  </g>
                );
              })}
            </g>
          </g>
        </svg>
        <div className="floating-heart h1" />
        <div className="floating-heart h2" />
        <div className="floating-heart h3" />
        {hovered && (
          <div
            className="hover-bubble glass"
            style={{
              left: `${hovered.point[0] * view.scale + view.x + 28}px`,
              top: `${hovered.point[1] * view.scale + view.y + 18}px`,
            }}
          >
            <strong>{hovered.city.name}</strong>
            <span>{hovered.city.date}</span>
            <small>{hovered.city.members.join(" / ")}</small>
            <p>{hovered.city.note}</p>
          </div>
        )}
      </section>

      <aside className="timeline glass" aria-label="旅行时间线">
        <div className="timeline-title">
          <MapPin size={16} />
          旅程时间线
        </div>
        {cities.map((city) => (
          <button
            key={city.id}
            className={`timeline-node ${city.status} ${city.id === activeId ? "active" : ""}`}
            onClick={() => selectCity(city.id)}
          >
            <span className="node-dot" />
            <span className="node-copy">
              <strong>{city.name}</strong>
              <small>{city.date}</small>
            </span>
          </button>
        ))}
      </aside>

      <aside className="info-card glass">
        <div className="card-heading">
          <span className={activeCity.status === "visited" ? "status visited" : "status wish"}>
            {activeCity.status === "visited" ? "已抵达" : "想去"}
          </span>
          <h1>{activeCity.name} · {activeCity.date}</h1>
        </div>
        <div className="data-grid">
          <span>同行人员</span>
          <strong>{activeCity.members.join(" / ")}</strong>
          <span>停留天数</span>
          <strong>{activeCity.days} 天</strong>
          <span>游玩类型</span>
          <strong>{activeCity.type}</strong>
          <span>城市特色</span>
          <strong>{activeCity.feature}</strong>
        </div>
        <div className="card-tabs">
          {["实拍照片", "游玩随笔", "美食记录"].map((item) => (
            <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
              {item}
            </button>
          ))}
        </div>
        <div className="tab-panel">
          {tab === "实拍照片" && (
            <div className="memory-row">
              {memoryTiles.map((tile, index) => (
                <div key={tile} className="memory-tile" style={{ background: tile }}>
                  <Camera size={16} />
                  <span>记忆 {index + 1}</span>
                </div>
              ))}
            </div>
          )}
          {tab === "游玩随笔" && <p>{activeCity.note}</p>}
          {tab === "美食记录" && (
            <p>
              <Utensils size={15} />
              {activeCity.food}
            </p>
          )}
        </div>
        <div className="card-actions">
          <button>
            <Camera size={16} />
            查看回忆相册
          </button>
          <button className="primary" onClick={() => selectCity(cities.find((city) => city.status === "wish")?.id ?? activeId)}>
            标记下一座想去的城市
            <ChevronRight size={16} />
          </button>
        </div>
      </aside>

      <aside className="stats-panel glass">
        <div>
          <strong>{stats.visited}</strong>
          <span>已打卡城市</span>
        </div>
        <div>
          <strong>{stats.wish}</strong>
          <span>心愿目的地</span>
        </div>
        <div>
          <strong>{stats.days}</strong>
          <span>陪伴出行天数</span>
        </div>
        <div>
          <strong>{stats.dog}</strong>
          <span>帕恰同行次数</span>
        </div>
      </aside>

      {modalOpen && (
        <div className="modal-backdrop" onMouseDown={() => setModalOpen(false)}>
          <form className="add-modal glass" onSubmit={handleAddCity} onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setModalOpen(false)} aria-label="关闭">
              <X size={18} />
            </button>
            <h2>新增打卡</h2>
            <div className="form-grid">
              <label>
                城市
                <input name="city" placeholder="首尔" required />
              </label>
              <label>
                日期
                <input name="date" placeholder="2026.10.01" />
              </label>
              <label>
                经度
                <input name="lng" type="number" step="0.0001" placeholder="126.9780" />
              </label>
              <label>
                纬度
                <input name="lat" type="number" step="0.0001" placeholder="37.5665" />
              </label>
              <label>
                类型
                <select name="type">
                  <option>城市美食打卡</option>
                  <option>自然风光打卡</option>
                </select>
              </label>
              <label>
                区域
                <select name="region">
                  <option value="domestic">国内城市</option>
                  <option value="overseas">境外城市</option>
                </select>
              </label>
              <label>
                停留天数
                <input name="days" type="number" min="1" defaultValue="2" />
              </label>
              <label>
                状态
                <select name="status">
                  <option value="visited">已经抵达</option>
                  <option value="wish">心仪想去</option>
                </select>
              </label>
            </div>
            <label>
              城市特色
              <input name="feature" placeholder="霓虹小巷与热汤" />
            </label>
            <label>
              美食记录
              <input name="food" placeholder="烤肉、冷面、甜点" />
            </label>
            <label>
              游玩文案
              <textarea name="note" placeholder="写下一句属于这里的回忆" />
            </label>
            <label className="upload-row">
              <input name="photo" type="file" accept="image/*" />
              <span>上传照片</span>
            </label>
            <label className="dog-row">
              <input name="dog" type="checkbox" />
              带上帕恰同行
            </label>
            <button className="submit-button" type="submit">
              点亮这座城市
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
