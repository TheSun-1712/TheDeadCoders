import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../../../App.css";
import { apiClient } from "../../../api/client";
import type { ThreatMapData } from "../../../types";

/* 🎨 Attack Colors */
const attackColors = {
  ddos: "#ef4444",
  dos: "#f97316",
  brute: "#06b6d4",
  bot: "#d946ef",
  other: "#f59e0b",
} as const;

type AttackType = keyof typeof attackColors;

const ATTACK_COORDINATES: { from: [number, number]; to: [number, number] }[] = [
  { from: [33.0, 65.0], to: [40.0, 45.0] },
  { from: [41.0, 20.0], to: [47.3333, 13.3333] },
  { from: [28.0, 3.0], to: [42.5, 1.6] },
  { from: [-12.5, 18.5], to: [-34.0, -64.0] },
  { from: [-27.0, 133.0], to: [40.5, 47.5] },
  { from: [24.25, -76.0], to: [26.0, 50.55] },
  { from: [24.0, 90.0], to: [13.1667, -59.5333] },
  { from: [53.0, 28.0], to: [50.8333, 4.0] },
  { from: [17.25, -88.75], to: [9.5, 2.25] },
  { from: [27.5, 90.5], to: [-17.0, -65.0] },
  { from: [44.0, 18.0], to: [-22.0, 24.0] },
  { from: [-10.0, -55.0], to: [43.0, 25.0] },
  { from: [13.0, -2.0], to: [-3.5, 30.0] },
  { from: [13.0, 105.0], to: [6.0, 12.0] },
  { from: [60.0, -95.0], to: [-30.0, -71.0] },
  { from: [35.0, 105.0], to: [4.0, -72.0] },
  { from: [10.0, -84.0], to: [45.1667, 15.5] },
  { from: [21.5, -80.0], to: [49.75, 15.5] },
  { from: [56.0, 10.0], to: [-2.0, -77.5] },
  { from: [27.0, 30.0], to: [8.0, 38.0] },
  { from: [64.0, 26.0], to: [46.0, 2.0] },
  { from: [51.0, 9.0], to: [8.0, -2.0] },
  { from: [39.0, 22.0], to: [15.5, -90.25] },
  { from: [47.0, 20.0], to: [20.0, 77.0] },
  { from: [-5.0, 120.0], to: [32.0, 53.0] },
  { from: [25.0, 70.0], to: [36.0, 10.0] },
  { from: [-15.0, -70.0], to: [55.0, 105.0] },
  { from: [38.0, 68.0], to: [-25.0, 30.0] },
  { from: [48.0, 30.0], to: [12.0, -15.0] },
  { from: [62.0, 15.0], to: [5.0, 0.0] },
  { from: [37.0, 127.0], to: [-20.0, -60.0] },
  { from: [52.0, 20.0], to: [30.0, 115.0] },
  { from: [45.0, 100.0], to: [18.0, -15.0] },
  { from: [22.0, 78.0], to: [50.0, 5.0] },
  { from: [-8.0, 115.0], to: [35.0, 139.0] },
  { from: [40.0, 50.0], to: [32.0, 35.0] },
  { from: [19.0, -99.0], to: [55.0, 37.0] },
  { from: [-33.0, 18.0], to: [28.5, 77.0] },
  { from: [61.0, 105.0], to: [1.3, 103.8] },
  { from: [4.5, 114.5], to: [14.0, 108.0] },
  { from: [15.0, 38.0], to: [-1.0, 36.0] },
  { from: [23.0, 72.0], to: [7.0, 10.0] },
  { from: [34.0, 69.0], to: [36.2, 137.0] },
  { from: [25.0, 55.0], to: [39.9, -0.8] },
  { from: [12.5, 124.0], to: [46.8, 8.2] },
  { from: [3.1, 101.7], to: [41.9, 12.5] },
  { from: [14.6, 120.9], to: [33.5, 126.9] },
  { from: [16.0, 107.0], to: [23.7, 120.9] },
];

const DEFENSE_HUB: [number, number] = [20, 0];

interface Attack {
  id: number;
  rawType: string;
  type: AttackType;
  srcIp: string;
  country: string;
  confidence: number;
  from: [number, number];
  to: [number, number];
}

/* 📊 5 Functions for Attack Distribution */
function getTotalAttacks(): number {
  return Math.floor(Math.random() * 15) + 10; // Randomly 10-25 attacks
}

function getDDoSCount(total: number): number {
  return Math.floor(total * 0.4);
}

function getDoSCount(total: number): number {
  return Math.floor(total * 0.3);
}

function getBruteForceCount(total: number): number {
  return Math.floor(total * 0.2);
}

function getBotCount(total: number, ddos: number, dos: number, brute: number): number {
  return total - (ddos + dos + brute);
}

function getAttackType(label: string): AttackType {
  const value = label.toLowerCase();
  if (value.includes("ddos")) return "ddos";
  if (value.includes("dos")) return "dos";
  if (value.includes("brute") || value.includes("patator")) return "brute";
  if (value.includes("bot")) return "bot";
  return "other";
}

/* 🌀 Generate Curved Path */
function generateCurve(
  from: [number, number],
  to: [number, number],
  points = 80
) {
  const curve: [number, number][] = [];

  const distance =
    Math.sqrt(
      Math.pow(to[0] - from[0], 2) + Math.pow(to[1] - from[1], 2)
    );

  const lift = distance * 0.3;

  const midLat = (from[0] + to[0]) / 2 + lift;
  const midLng = (from[1] + to[1]) / 2;

  for (let i = 0; i <= points; i++) {
    const t = i / points;

    const lat =
      (1 - t) * (1 - t) * from[0] +
      2 * (1 - t) * t * midLat +
      t * t * to[0];

    const lng =
      (1 - t) * (1 - t) * from[1] +
      2 * (1 - t) * t * midLng +
      t * t * to[1];

    curve.push([lat, lng]);
  }

  return curve;
}

/* 🚀 Moving Attack Dot */
function TravelingDot({ path, color }: { path: [number, number][]; color: string }) {
  const [position, setPosition] = useState(0);

  useEffect(() => {
    let frame: number;
    const animate = () => {
      setPosition((prev) => (prev + 0.2) % path.length);
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [path.length]);

  const index = Math.floor(position);
  if (!path[index]) return null;

  return (
    <>
      <CircleMarker
        center={path[index]}
        radius={10}
        pathOptions={{
          color: color,
          fillColor: color,
          fillOpacity: 0.2,
          weight: 0,
        }}
      />
      <CircleMarker
        center={path[index]}
        radius={4}
        pathOptions={{
          color: "#ffffff",
          fillColor: color,
          fillOpacity: 1,
          weight: 1,
        }}
      />
    </>
  );
}

const ThreatMap: React.FC = () => {
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [selectedType, setSelectedType] = useState<AttackType | null>(null);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const fetchThreatMap = async () => {
      try {
        const total = getTotalAttacks();
        const ddosCount = getDDoSCount(total);
        const dosCount = getDoSCount(total);
        const bruteCount = getBruteForceCount(total);
        const botCount = getBotCount(total, ddosCount, dosCount, bruteCount);

        const types: AttackType[] = [
          ...Array(ddosCount).fill("ddos"),
          ...Array(dosCount).fill("dos"),
          ...Array(bruteCount).fill("brute"),
          ...Array(botCount).fill("bot"),
        ];

        // Shuffle coordinates to get random variety
        const shuffledCoords = [...ATTACK_COORDINATES].sort(() => Math.random() - 0.5);

        const newAttacks: Attack[] = types.map((type, i) => {
          const coords = shuffledCoords[i % shuffledCoords.length];
          return {
            id: Date.now() + i,
            rawType: type,
            type: type,
            srcIp: `192.168.1.${Math.floor(Math.random() * 255)}`,
            country: "Unknown",
            confidence: 0.8 + Math.random() * 0.2,
            from: coords.from,
            to: coords.to,
          };
        });

        setAttacks(newAttacks);
      } catch (error) {
        console.error("Failed to generate dynamic threat map data", error);
      }
    };

    fetchThreatMap();
    const interval = setInterval(fetchThreatMap, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((p) => (p + 1) % 60);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const displayedAttacks =
    selectedType != null
      ? attacks.filter((a) => a.type === selectedType)
      : attacks;

  const pulseRadius = 6 + Math.sin(pulse / 10) * 3;

  return (
    <div className="map-background" style={{ position: "relative", height: "600px", backgroundColor: "#060608" }}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxBounds={[[-90, -180], [90, 180]]}
        style={{ height: "100%", width: "100%", background: "#060608" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          noWrap={true}
        />

        {displayedAttacks.map((attack) => {
          const curvePath = generateCurve(attack.from, attack.to);

          return (
            <React.Fragment key={attack.id}>
              <Polyline
                positions={curvePath}
                pathOptions={{
                  color: attackColors[attack.type],
                  weight: 2,
                  opacity: 0.3,
                }}
              />

              <Polyline
                positions={curvePath}
                pathOptions={{
                  color: attackColors[attack.type],
                  weight: 3,
                  dashArray: "10, 15",
                  className: "animated-line",
                }}
              />

              <TravelingDot
                path={curvePath}
                color={attackColors[attack.type]}
              />

              <CircleMarker
                center={attack.from}
                radius={pulseRadius}
                pathOptions={{
                  color: attackColors[attack.type],
                  fillColor: attackColors[attack.type],
                  fillOpacity: 0.4,
                }}
              />
            </React.Fragment>
          );
        })}

        {/* Render a single defense hub marker to avoid visual collapse at one point */}
        <CircleMarker
          center={DEFENSE_HUB}
          radius={10}
          pathOptions={{
            color: "#22d3ee",
            fillColor: "#22d3ee",
            fillOpacity: 0.5,
            weight: 2,
          }}
        />
      </MapContainer>

      {/* 🔹 Legend Bottom Right */}
      <div className="legend-box">
        <h4>Attack Types</h4>

        {/* ALL */}
        <div
          className={`legend-item ${selectedType === null ? "active" : ""}`}
          onClick={() => setSelectedType(null)}
        >
          <span
            className="legend-dot"
            style={{ background: "#ffffff" }}
          ></span>
          ALL
        </div>

        {(Object.keys(attackColors) as AttackType[]).map((type) => (
          <div
            key={type}
            className={`legend-item ${
              selectedType === type ? "active" : ""
            }`}
            onClick={() => setSelectedType(type as AttackType)}
          >
            <span
              className="legend-dot"
              style={{ background: attackColors[type as AttackType] }}
            ></span>
            {type.toUpperCase()}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThreatMap;
