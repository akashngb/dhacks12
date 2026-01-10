import { Card } from "@/components/ui/card"
import { Cloud, Sunrise, Sunset, ThermometerSun } from "lucide-react"

interface WeatherWidgetProps {
  location?: string
  temperature?: number
  condition?: string
  maxTemp?: number
  minTemp?: number
  sunrise?: string
  sunset?: string
}

export function WeatherWidget({
  location = "San Francisco",
  temperature = 72,
  condition = "Partly Cloudy",
  maxTemp = 78,
  minTemp = 65,
  sunrise = "6:42 AM",
  sunset = "7:23 PM",
}: WeatherWidgetProps) {
  const isDay = () => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTime = currentHour * 60 + currentMinute

    // Parse sunrise time
    const sunriseMatch = sunrise.match(/(\d+):(\d+)\s*(AM|PM)/i)
    if (!sunriseMatch) return true

    let sunriseHour = Number.parseInt(sunriseMatch[1])
    const sunriseMinute = Number.parseInt(sunriseMatch[2])
    const sunrisePeriod = sunriseMatch[3].toUpperCase()

    if (sunrisePeriod === "PM" && sunriseHour !== 12) sunriseHour += 12
    if (sunrisePeriod === "AM" && sunriseHour === 12) sunriseHour = 0
    const sunriseTime = sunriseHour * 60 + sunriseMinute

    // Parse sunset time
    const sunsetMatch = sunset.match(/(\d+):(\d+)\s*(AM|PM)/i)
    if (!sunsetMatch) return true

    let sunsetHour = Number.parseInt(sunsetMatch[1])
    const sunsetMinute = Number.parseInt(sunsetMatch[2])
    const sunsetPeriod = sunsetMatch[3].toUpperCase()

    if (sunsetPeriod === "PM" && sunsetHour !== 12) sunsetHour += 12
    if (sunsetPeriod === "AM" && sunsetHour === 12) sunsetHour = 0
    const sunsetTime = sunsetHour * 60 + sunsetMinute

    return currentTime >= sunriseTime && currentTime < sunsetTime
  }

  const isDaytime = isDay()
  const backgroundClass = isDaytime
    ? "bg-gradient-to-br from-blue-400 via-blue-300 to-blue-200"
    : "bg-gradient-to-br from-gray-700 via-gray-600 to-gray-500"
  const textColorClass = isDaytime ? "text-white" : "text-white"

  return (
    <Card className={`w-full max-w-sm overflow-hidden border-none shadow-2xl ${backgroundClass}`}>
      <div className="p-8">
        {/* Location */}
        <div className="mb-6">
          <h2
            className={`text-sm font-medium tracking-wide uppercase ${isDaytime ? "text-white/90" : "text-white/90"}`}
          >
            {location}
          </h2>
        </div>

        {/* Main Temperature Display */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-baseline gap-1">
              <span className={`text-7xl font-light tracking-tight ${textColorClass}`}>{temperature}</span>
              <span className={`text-3xl font-light ${isDaytime ? "text-white/80" : "text-white/80"}`}>°F</span>
            </div>
            <p className={`mt-2 text-base ${isDaytime ? "text-white/90" : "text-white/90"}`}>{condition}</p>
          </div>

          {/* Weather Icon */}
          <div className="mt-1">
            <Cloud className={`h-16 w-16 ${textColorClass}`} strokeWidth={1.5} />
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
            <div className={`text-base font-light tabular-nums ${textColorClass}`}>{sunrise}</div>
          </div>

          {/* Sunset */}
          <div className="flex flex-col gap-2">
            <div className={`flex items-center gap-2 ${isDaytime ? "text-white/80" : "text-white/80"}`}>
              <Sunset className="h-4 w-4" strokeWidth={1.5} />
              <span className="text-xs uppercase tracking-wider">Set</span>
            </div>
            <div className={`text-base font-light tabular-nums ${textColorClass}`}>{sunset}</div>
          </div>
        </div>
      </div>
    </Card>
  )
}
