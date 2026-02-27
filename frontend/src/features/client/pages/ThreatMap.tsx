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
      setPosition((prev) => (prev + 0.5) % path.length);
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
        const response = await apiClient.get<ThreatMapData[]>("/threats/map");
        const liveAttacks = response.data
          .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon))
          .map((item) => ({
            id: item.id,
            rawType: item.type,
            type: getAttackType(item.type),
            srcIp: item.src_ip,
            country: item.country,
            confidence: 0,
            from: [item.lat, item.lon] as [number, number],
            to: DEFENSE_HUB,
          }));
        setAttacks(liveAttacks);
      } catch (error) {
        console.error("Failed to fetch threat map data", error);
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

              <CircleMarker
                center={attack.to}
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