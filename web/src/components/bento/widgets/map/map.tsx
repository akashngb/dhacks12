"use client";
import Map, { Marker } from "react-map-gl/mapbox";

export default function MapBox() {
  return (
    <div className="w-full h-full rounded-3xl overflow-hidden relative min-h-0">
      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{
          longitude: -79.347015,
          latitude: 43.65107,
          zoom: 11,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/treewhacksun/cmduvtt02010c01s2bkskew1z"
        scrollZoom={false}
      >
        <Marker
          longitude={-79.3832}
          latitude={43.6532}
          anchor="bottom"
          color="red"
        />
      </Map>
    </div>
  );
}
