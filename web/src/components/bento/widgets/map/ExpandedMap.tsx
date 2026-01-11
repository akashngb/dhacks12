import MapBox from "@/components/bento/widgets/map/map";

export default function ExpandedMap() {
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold">Map</h2>
      <div className="w-full h-96">
        <MapBox />
      </div>
    </div>
  );
}
