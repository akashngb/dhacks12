"use client";
import Map, { Marker, Popup } from "react-map-gl/mapbox";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

interface PredictionLocation {
  latitude: number;
  longitude: number;
  neighbourhood: number;
  probability: number;
  rank: number;
}

interface CrimeMarker {
  id: string;
  latitude: number;
  longitude: number;
  eventType: string;
  probability: number;
  neighbourhood: number;
}

const EVENT_TYPES = ["Crime-AutoTheft", "Crime-BreakAndEnter"] as const;

// Toronto center coordinates for offset calculation
const TORONTO_CENTER = { lat: 43.65107, lng: -79.347015 };

// The API returns normalized/scaled coordinates, we need to transform them to real lat/lng
// These are approximate scaling factors based on Toronto's geography
function transformCoordinates(lat: number, lng: number): { latitude: number; longitude: number } {
  // The ML model appears to return normalized coordinates
  // We need to scale them back to Toronto area coordinates
  const latScale = 0.03; // Approximate degree per unit
  const lngScale = 0.04; // Approximate degree per unit
  
  return {
    latitude: TORONTO_CENTER.lat + lat * latScale,
    longitude: TORONTO_CENTER.lng + lng * lngScale,
  };
}

async function fetchPredictions(eventType: string): Promise<PredictionLocation[]> {
  try {
    const response = await fetch("http://akashs-macbook-air:5006/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        datetime: Math.floor(Date.now() / 1000),
        event_subtype: eventType,
      }),
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch predictions for ${eventType}`);
      return [];
    }
    
    const data = await response.json();
    if (data.success && data.output?.top_20_locations) {
      // Return top 5 locations to avoid cluttering the map
      return data.output.top_20_locations.slice(0, 5);
    }
    return [];
  } catch (error) {
    console.error(`Error fetching predictions for ${eventType}:`, error);
    return [];
  }
}

export default function MapBox({ className }: { className?: string }) {
  const [markers, setMarkers] = useState<CrimeMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<CrimeMarker | null>(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    
    let cancelled = false;
    
    async function loadPredictions() {
      const allMarkers: CrimeMarker[] = [];
      
      for (const eventType of EVENT_TYPES) {
        const predictions = await fetchPredictions(eventType);
        predictions.forEach((pred, index) => {
          const transformed = transformCoordinates(pred.latitude, pred.longitude);
          allMarkers.push({
            id: `${eventType}-${index}`,
            latitude: transformed.latitude,
            longitude: transformed.longitude,
            eventType,
            probability: pred.probability,
            neighbourhood: pred.neighbourhood,
          });
        });
      }
      
      if (!cancelled) {
        setMarkers(allMarkers);
        setLoading(false);
      }
    }
    
    loadPredictions();
    
    return () => {
      cancelled = true;
    };
  }, []);

  const getMarkerColor = (eventType: string): string => {
    switch (eventType) {
      case "Crime-AutoTheft":
        return "#ef4444"; // red
      case "Crime-BreakAndEnter":
        return "#f97316"; // orange
      default:
        return "#6b7280"; // gray
    }
  };

  const getEventLabel = (eventType: string): string => {
    switch (eventType) {
      case "Crime-AutoTheft":
        return "Auto Theft Risk";
      case "Crime-BreakAndEnter":
        return "Break & Enter Risk";
      default:
        return eventType;
    }
  };

  return (
    <div
      className={cn(
        "w-full h-full overflow-hidden relative min-h-0",
        className
      )}
    >
      {loading && (
        <div className="absolute top-2 left-2 z-10 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
          Loading predictions...
        </div>
      )}
      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{
          longitude: -79.347015,
          latitude: 43.65107,
          zoom: 11,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/treewhacksun/cmduvtt02010c01s2bkskew1z"
        scrollZoom={true}
        onClick={() => setSelectedMarker(null)}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            longitude={marker.longitude}
            latitude={marker.latitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedMarker(marker);
            }}
          >
            <div
              className="cursor-pointer transition-transform hover:scale-110"
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                backgroundColor: getMarkerColor(marker.eventType),
                border: "3px solid white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              }}
            />
          </Marker>
        ))}

        {selectedMarker && (
          <Popup
            longitude={selectedMarker.longitude}
            latitude={selectedMarker.latitude}
            anchor="bottom"
            offset={30}
            onClose={() => setSelectedMarker(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-2 text-black">
              <h3 className="font-bold text-sm mb-1">
                {getEventLabel(selectedMarker.eventType)}
              </h3>
              <p className="text-xs text-gray-600">
                Probability: {(selectedMarker.probability * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-600">
                Neighbourhood: {selectedMarker.neighbourhood}
              </p>
            </div>
          </Popup>
        )}
      </Map>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-black/80 text-white p-3 rounded-lg text-xs">
        <div className="font-semibold mb-2">Crime Risk Predictions</div>
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: "#ef4444" }}
          />
          <span>Auto Theft</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: "#f97316" }}
          />
          <span>Break & Enter</span>
        </div>
      </div>
    </div>
  );
}
