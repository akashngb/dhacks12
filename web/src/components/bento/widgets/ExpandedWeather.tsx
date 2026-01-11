import { WeatherWidget } from "@/components/bento/widgets/weather";

export default function ExpandedWeather() {
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold">Weather</h2>
      <WeatherWidget className="w-full" />
    </div>
  );
}
