"use client";

import { fetchWeatherApi } from "openmeteo";
import { useQuery as useReactQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Sunrise, Sunset, ThermometerSun } from "lucide-react";
import { getWeatherIcon } from "./icons";

const weatherParams = {
  // 43.642581589306644, -79.3870381843017
  latitude: [43.642581589306644],
  longitude: [-79.3870381843017],
  current: "temperature_2m,weather_code,wind_speed_10m,wind_direction_10m",
  hourly: "temperature_2m,relative_humidity_2m",
  daily: "weather_code,temperature_2m_max,temperature_2m_min",
  timezone: "America/Toronto",
};

const url = "https://api.open-meteo.com/v1/forecast";

const range = (start: number, stop: number, step: number) =>
  Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

// Convert WMO weather code to readable condition
function getWeatherCondition(code: number | null): string {
  if (code === null) return "Unknown";
  
  const conditions: Record<number, string> = {
    0: "Clear",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Foggy",
    51: "Light Drizzle",
    53: "Drizzle",
    55: "Heavy Drizzle",
    61: "Light Rain",
    63: "Rain",
    65: "Heavy Rain",
    71: "Light Snow",
    73: "Snow",
    75: "Heavy Snow",
    77: "Snow Grains",
    80: "Light Showers",
    81: "Showers",
    82: "Heavy Showers",
    85: "Light Snow Showers",
    86: "Snow Showers",
    95: "Thunderstorm",
    96: "Thunderstorm with Hail",
    99: "Thunderstorm with Hail",
  };
  
  return conditions[code] || "Unknown";
}

async function getWeatherData() {
  const responses = await fetchWeatherApi(url, weatherParams);
  const response = responses[0];

  const utcOffsetSeconds = response.utcOffsetSeconds();

  const current = response.current();
  const hourly = response.hourly();
  const daily = response.daily();

  if (!current || !hourly || !daily) {
    throw new Error("Failed to fetch weather data");
  }

  // Fetch sunrise/sunset separately since they're ISO8601 strings, not numeric values
  const sunTimesUrl = `${url}?latitude=${weatherParams.latitude[0]}&longitude=${weatherParams.longitude[0]}&daily=sunrise,sunset&timezone=${weatherParams.timezone}`;
  const sunTimesResponse = await fetch(sunTimesUrl);
  const sunTimesData = await sunTimesResponse.json();

  const weatherData = {
    current: {
      time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
      temperature: current.variables(0)?.value() ?? 0, // Default to 0 if undefined
      weatherCode: current.variables(1)?.value() ?? null,
      windSpeed: current.variables(2)?.value() ?? 0,
      windDirection: current.variables(3)?.value() ?? 0,
    },
    hourly: {
      time: range(
        Number(hourly.time()),
        Number(hourly.timeEnd()),
        hourly.interval()
      ).map((t) => new Date((t + utcOffsetSeconds) * 1000)),
      temperature: hourly.variables(0)?.valuesArray() || [], // `.valuesArray()` get an array of floats
      humidity: hourly.variables(1)?.valuesArray() || [],
    },
    daily: {
      time: range(
        Number(daily.time()),
        Number(daily.timeEnd()),
        daily.interval()
      ).map((t) => new Date((t + utcOffsetSeconds) * 1000)),
      weatherCode: daily.variables(0)?.valuesArray() || [],
      temperatureMax: daily.variables(1)?.valuesArray() || [],
      temperatureMin: daily.variables(2)?.valuesArray() || [],
      sunrise: sunTimesData.daily.sunrise as string[],
      sunset: sunTimesData.daily.sunset as string[],
    },
  };

  return weatherData;
}

interface WeatherWidgetProps {
  className?: string;
  iconSize?: number; // Size in pixels, defaults to 64
}

export function WeatherWidget({ className }: WeatherWidgetProps) {
  const { data, isLoading, error } = useReactQuery({
    queryKey: ["weather"],
    queryFn: () => getWeatherData(),
    refetchInterval: 5 * 60 * 1000,
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const isDaytime = useMemo(() => {
    if (!data) return true;

    const currentTime = data.current.time;
    const sunrise = data.daily.sunrise[0]
      ? new Date(data.daily.sunrise[0])
      : null;
    const sunset = data.daily.sunset[0] ? new Date(data.daily.sunset[0]) : null;

    return sunrise && sunset
      ? currentTime >= sunrise && currentTime < sunset
      : true; // default to day if no sunrise/sunset data
  }, [data]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading weather...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-sm text-muted-foreground">
          Unable to load weather
        </div>
      </div>
    );
  }

  const currentTemp = Math.round(data.current.temperature);
  const maxTemp = Math.round(data.daily.temperatureMax[0]);
  const minTemp = Math.round(data.daily.temperatureMin[0]);
  const sunriseTime = formatTime(data.daily.sunrise[0]);
  const sunsetTime = formatTime(data.daily.sunset[0]);
  const condition = getWeatherCondition(data.current.weatherCode);

  const backgroundClass = isDaytime
    ? "bg-gradient-to-br from-blue-400 via-blue-300 to-blue-200"
    : "bg-gradient-to-br from-gray-700 via-gray-600 to-gray-500";
  const textColorClass = "text-white";

  return (
    <Card className={`w-full max-w-sm overflow-hidden border-none shadow-2xl ${backgroundClass} ${className || ""}`}>
      <div className="p-8">
        {/* Location */}
        <div className="mb-6">
          <h2
            className={`text-sm font-medium tracking-wide uppercase ${isDaytime ? "text-white/90" : "text-white/90"}`}
          >
            Toronto
          </h2>
        </div>

        {/* Main Temperature Display */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-baseline gap-1">
              <span className={`text-7xl font-light tracking-tight ${textColorClass}`}>{currentTemp}</span>
              <span className={`text-3xl font-light ${isDaytime ? "text-white/80" : "text-white/80"}`}>°C</span>
            </div>
            <p className={`mt-2 text-base ${isDaytime ? "text-white/90" : "text-white/90"}`}>{condition}</p>
          </div>

          {/* Weather Icon */}
          <div className="mt-1">
            <div className="h-24 w-24 [&>svg]:h-full [&>svg]:w-full">
              {getWeatherIcon(data.current.weatherCode ?? 0, isDaytime)}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className={`h-px mb-6 ${isDaytime ? "bg-white/20" : "bg-white/20"}`} />

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* High/Low */}
          <div className="flex flex-col gap-2">
            <div className={`flex items-center gap-2 ${isDaytime ? "text-white/80" : "text-white/80"}`}>
              <ThermometerSun className="h-4 w-4" strokeWidth={1.5} />
              <span className="text-xs uppercase tracking-wider">H/L</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-light ${textColorClass}`}>{maxTemp}</span>
              <span className={`text-sm ${isDaytime ? "text-white/80" : "text-white/80"}`}>°</span>
              <span className={`text-lg mx-0.5 ${isDaytime ? "text-white/80" : "text-white/80"}`}>/</span>
              <span className={`text-2xl font-light ${textColorClass}`}>{minTemp}</span>
              <span className={`text-sm ${isDaytime ? "text-white/80" : "text-white/80"}`}>°</span>
            </div>
          </div>

          {/* Sunrise */}
          <div className="flex flex-col gap-2">
            <div className={`flex items-center gap-2 ${isDaytime ? "text-white/80" : "text-white/80"}`}>
              <Sunrise className="h-4 w-4" strokeWidth={1.5} />
              <span className="text-xs uppercase tracking-wider">Rise</span>
            </div>
            <div className={`text-base font-light tabular-nums ${textColorClass}`}>{sunriseTime}</div>
          </div>

          {/* Sunset */}
          <div className="flex flex-col gap-2">
            <div className={`flex items-center gap-2 ${isDaytime ? "text-white/80" : "text-white/80"}`}>
              <Sunset className="h-4 w-4" strokeWidth={1.5} />
              <span className="text-xs uppercase tracking-wider">Set</span>
            </div>
            <div className={`text-base font-light tabular-nums ${textColorClass}`}>{sunsetTime}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
