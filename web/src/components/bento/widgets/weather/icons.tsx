// Clear sky
import ClearDay from "./icons/clear/day.svg";
import ClearNight from "./icons/clear/night.svg";

// Partly cloudy
import PartlyCloudyDay from "./icons/partly-cloudy/day.svg";
import PartlyCloudyNight from "./icons/partly-cloudy/night.svg";

// Overcast
import OvercastDay from "./icons/overcast/day.svg";
import OvercastNight from "./icons/overcast/night.svg";

// Fog
import FogDay from "./icons/overcast/day-fog.svg";
import FogNight from "./icons/overcast/night-fog.svg";

// Drizzle
import DrizzleDay from "./icons/overcast/day-drizzle.svg";
import DrizzleNight from "./icons/overcast/night-drizzle.svg";

// Rain
import RainDay from "./icons/overcast/day-rain.svg";
import RainNight from "./icons/overcast/night-rain.svg";

// Sleet (freezing rain/drizzle)
import SleetDay from "./icons/overcast/day-sleet.svg";
import SleetNight from "./icons/overcast/night-sleet.svg";

// Snow
import SnowDay from "./icons/overcast/day-snow.svg";
import SnowNight from "./icons/overcast/night-snow.svg";

// Hail
import HailDay from "./icons/overcast/day-hail.svg";
import HailNight from "./icons/overcast/night-hail.svg";

// Thunderstorms
import ThunderstormDay from "./icons/thunderstorms/day.svg";
import ThunderstormNight from "./icons/thunderstorms/night.svg";

export const getWeatherIcon = (
  wmoCode: number, 
  day: boolean
): React.ReactNode => {
  // WMO Weather interpretation codes mapping
  switch (wmoCode) {
    case 0:
      // Clear sky
      return day ? <ClearDay /> : <ClearNight />;
    
    case 1:
      // Mainly clear
      return day ? <PartlyCloudyDay /> : <PartlyCloudyNight />;
    
    case 2:
      // Partly cloudy
      return day ? <PartlyCloudyDay /> : <PartlyCloudyNight />;
    
    case 3:
      // Overcast
      return day ? <OvercastDay /> : <OvercastNight />;
    
    case 45:
    case 48:
      // Fog and depositing rime fog
      return day ? <FogDay /> : <FogNight />;
    
    case 51:
    case 53:
    case 55:
      // Drizzle: Light, moderate, and dense intensity
      return day ? <DrizzleDay /> : <DrizzleNight />;
    
    case 56:
    case 57:
      // Freezing Drizzle: Light and dense intensity
      return day ? <SleetDay /> : <SleetNight />;
    
    case 61:
    case 63:
    case 65:
      // Rain: Slight, moderate and heavy intensity
      return day ? <RainDay /> : <RainNight />;
    
    case 66:
    case 67:
      // Freezing Rain: Light and heavy intensity
      return day ? <SleetDay /> : <SleetNight />;
    
    case 71:
    case 73:
    case 75:
      // Snow fall: Slight, moderate, and heavy intensity
      return day ? <SnowDay /> : <SnowNight />;
    
    case 77:
      // Snow grains
      return day ? <SnowDay /> : <SnowNight />;
    
    case 80:
    case 81:
    case 82:
      // Rain showers: Slight, moderate, and violent
      return day ? <RainDay /> : <RainNight />;
    
    case 85:
    case 86:
      // Snow showers slight and heavy
      return day ? <SnowDay /> : <SnowNight />;
    
    case 95:
      // Thunderstorm: Slight or moderate
      return day ? <ThunderstormDay /> : <ThunderstormNight />;
    
    case 96:
    case 99:
      // Thunderstorm with slight and heavy hail
      return day ? <HailDay /> : <HailNight />;
    
    default:
      // Default to clear sky if code is unknown
      return day ? <ClearDay /> : <ClearNight />;
  }
}