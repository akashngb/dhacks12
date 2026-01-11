
import { v1 } from "@googlemaps/places";
const { PlacesClient } = v1;
import { env } from "@/env";
import { z } from "zod";
import { google as googlePlaces } from "@googlemaps/places/build/protos/protos";
import { Client as GoogleMapsClient } from "@googlemaps/google-maps-services-js";
import { tool } from "ai";

const locationFilterSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  radius: z.number(),
});

const rankPreferenceSchema = z.enum([
  "RANK_PREFERENCE_UNSPECIFIED",
  "DISTANCE",
  "POPULARITY",
]);

const priceLevelSchema = z.enum([
  "PRICE_LEVEL_UNSPECIFIED",
  "PRICE_LEVEL_FREE",
  "PRICE_LEVEL_INEXPENSIVE",
  "PRICE_LEVEL_MODERATE",
  "PRICE_LEVEL_EXPENSIVE",
  "PRICE_LEVEL_VERY_EXPENSIVE",
]);

export const searchNearbyFilterSchema = z.object({
  location: locationFilterSchema,
  rankPreference: rankPreferenceSchema,
  includedTypes: z.string().array(),
});

export type LocationFilter = z.infer<typeof locationFilterSchema>;
export type SearchNearbyFilter = z.infer<typeof searchNearbyFilterSchema>;

export const textSearchPlacesOptionsSchema = z.object({
  location: locationFilterSchema.optional(),
  type: z.string().optional(),
  priceLevels: z.array(priceLevelSchema).optional(),
});

export type TextSearchPlacesOptions = z.infer<typeof textSearchPlacesOptionsSchema>;

export type CleanedPlace = {
  name: string;
  id: string;
  types?: string[];
  primaryType?: string;
  phoneNumber?: string;
  address?: string; // short address
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  links?: {
    googleMaps?: string;
    website?: string;
  },
  openingHours?: {
    weekdayDescriptions?: string[];
    nextOpenTime?: string;
  },
  summary: {
    editorial?: string;
    generated?: string;
    top3Reviews?: { rating: number; text: string }[]; // top 3 reviews
    reviewSummary?: string;
  },
  outdoorSeating?: boolean;
  liveMusic?: boolean;
  menuForChildren?: boolean;
  servesCocktails?: boolean;
  servesDessert?: boolean;
  servesCoffee?: boolean;
  goodForChildren?: boolean;
  allowsDogs?: boolean;
  restroom?: boolean;
  goodForGroups?: boolean;
  goodForWatchingSports?: boolean;
  parkingOptions?: { freeStreetParking: boolean; paidStreetParking: boolean };
  priceRange?: { startPrice: { currencyCode: string; units: string }; endPrice: { currencyCode: string; units: string } };
}

function removeUndefinedFields<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined)
  ) as T;
}

const getClient = () => {
  const client = new PlacesClient({
    apiKey: env.GCLOUD_API_KEY,
  });
  return client;
}

const cleanPlace = (place: googlePlaces.maps.places.v1.IPlace): CleanedPlace => {
  const obj = {
    name: place.name!,
    id: place.id!,
    types: place.types ?? undefined,
    primaryType: place.primaryType ?? undefined,
    phoneNumber: place.nationalPhoneNumber ?? undefined,
    address: place.shortFormattedAddress ?? undefined,
    location: place.location ? { latitude: place.location.latitude ?? undefined, longitude: place.location.longitude ?? undefined } : undefined,
    rating: place.rating ?? undefined,
    links: {
      googleMaps: place.googleMapsUri ?? undefined,
      website: place.websiteUri ?? undefined,
    },
    openingHours: {
      weekdayDescriptions: place.currentOpeningHours?.weekdayDescriptions ?? undefined,
      nextOpenTime: place.currentOpeningHours?.nextOpenTime 
        ? new Date(
            Number(place.currentOpeningHours.nextOpenTime.seconds || 0) * 1000 +
            Number(place.currentOpeningHours.nextOpenTime.nanos || 0) / 1000000
          ).toISOString()
        : undefined,
    },
    summary: {
      editorial: place.editorialSummary?.text ?? undefined,
      generated: place.generativeSummary?.overview?.text ?? undefined,
      top3Reviews: place.reviews
        ?.filter((review) => review.rating !== undefined && review.text?.text)
        .sort((a, b) => (b?.rating ?? 0) - (a?.rating ?? 0))
        .slice(0, 3)
        .map((review) => ({
          rating: review.rating!,
          text: review.text!.text!,
        })),
      reviewSummary: place.reviewSummary?.text?.text ?? undefined,
    },
    outdoorSeating: place.outdoorSeating ?? undefined,
    liveMusic: place.liveMusic ?? undefined,
    menuForChildren: place.menuForChildren ?? undefined,
    servesCocktails: place.servesCocktails ?? undefined,
    servesDessert: place.servesDessert ?? undefined,
    servesCoffee: place.servesCoffee ?? undefined,
    goodForChildren: place.goodForChildren ?? undefined,
    allowsDogs: place.allowsDogs ?? undefined,
    restroom: place.restroom ?? undefined,
    goodForGroups: place.goodForGroups ?? undefined,
    goodForWatchingSports: place.goodForWatchingSports ?? undefined,
    parkingOptions: place.parkingOptions
      ? {
          freeStreetParking: place.parkingOptions.freeStreetParking ?? false,
          paidStreetParking: place.parkingOptions.paidStreetParking ?? false,
        }
      : undefined,
    priceRange: place.priceRange?.startPrice && place.priceRange?.endPrice
      ? {
          startPrice: {
            currencyCode: place.priceRange.startPrice.currencyCode ?? "",
            units: String(place.priceRange.startPrice.units ?? ""),
          },
          endPrice: {
            currencyCode: place.priceRange.endPrice.currencyCode ?? "",
            units: String(place.priceRange.endPrice.units ?? ""),
          },
        }
      : undefined,
  }
  return removeUndefinedFields(obj) as CleanedPlace;
}

// this function should return a list of resturants, without in-depth details
export async function searchNearby(filter: SearchNearbyFilter): Promise<CleanedPlace[]> {
  const client = getClient();
  const response = await client.searchNearby({
    includedTypes: filter.includedTypes,
    locationRestriction: {
      circle: {
        center: {
          latitude: filter.location.latitude,
          longitude: filter.location.longitude,
        },
        radius: filter.location.radius,
      },
    },
    rankPreference: filter.rankPreference ? filter.rankPreference : undefined,
  })
  return response[0]?.places?.filter((place) => !!place.id && !!place.name).map((place) => cleanPlace(place)).filter(Boolean) ?? [];
}

export async function textSearchPlaces(query: string, options: TextSearchPlacesOptions): Promise<CleanedPlace[]> {
  const client = getClient();
  const response = await client.searchText({
    textQuery: query,
    includedType: options.type ?? null,
    ...(options.location ? {
      locationBias: {
        circle: {
          center: {
            latitude: options.location.latitude,
            longitude: options.location.longitude,
          },
          radius: options.location.radius,
        }
      }
    } : {}),
    ...(options.priceLevels ? {
      priceLevels: options.priceLevels.map((level) => googlePlaces.maps.places.v1.PriceLevel[level]),
    } : {}),
  })
  return response[0]?.places?.filter((place) => !!place.id && !!place.name).map((place) => cleanPlace(place)).filter(Boolean) ?? [];
}


export async function getPlacePhotos(placeId: string) {
  const client = getClient();
  const response = await client.getPlace({
    name: placeId,    
  })
  const place = response[0];
  if (!place?.photos) {
    return [];
  }
  return Promise.all(place.photos.map(async (photo) => {
    const photoResponse = await client.getPhotoMedia({ name: photo.name });
    return photoResponse[0]?.photoUri ?? null;
  }).filter(Boolean))
}

export async function addressToLatLng(address: string) {
  const client = new GoogleMapsClient()
  const response = await client.geocode({
    params: { address, region: "ca", key: env.GCLOUD_API_KEY },
  })
  return response.data.results[0]?.geometry
}
