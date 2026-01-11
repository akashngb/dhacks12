import { WeatherWidget } from "@/components/bento/widgets/weather";

interface ExpandedWeatherProps {
  onClose: () => void;
}

export default function ExpandedWeather({ onClose }: ExpandedWeatherProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold">Weather</h2>
      <WeatherWidget className="w-full" />
    </div>
  );
}
