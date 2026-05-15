type GeocodingContext = { id: string; text: string; short_code?: string };

export type GeocodingFeature = {
  place_name: string;
  center: [number, number];
  text: string;
  context?: GeocodingContext[];
  place_type: string[];
};

type GeocodingOptions = {
  types?: string;
  limit?: number;
};

export async function geocodeQuery(
  query: string,
  token: string,
  options: GeocodingOptions = {}
): Promise<GeocodingFeature[]> {
  const { types = 'address,place,postcode,poi', limit = 5 } = options;
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
  );
  url.searchParams.set('access_token', token);
  url.searchParams.set('language', 'es');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('types', types);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return [];
    const data = (await res.json()) as { features: GeocodingFeature[] };
    return data.features ?? [];
  } catch {
    return [];
  }
}

export function parseLatLon(text: string): { lat: number; lng: number } | null {
  const match = text.trim().match(/^(-?\d{1,3}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

type AddressComponents = {
  address: string;
  city: string;
  postalCode: string;
  country: string;
  countryCode: string;
};

export function extractAddressComponents(feature: GeocodingFeature): AddressComponents {
  const ctx = feature.context ?? [];

  const postcode = ctx.find((c) => c.id.startsWith('postcode'))?.text ?? '';
  const city =
    ctx.find((c) => c.id.startsWith('place'))?.text ??
    ctx.find((c) => c.id.startsWith('locality'))?.text ??
    '';
  const countryCtx = ctx.find((c) => c.id.startsWith('country'));
  const country = countryCtx?.text ?? '';
  const countryCode = countryCtx?.short_code ?? '';

  const isAddress = feature.place_type.includes('address');
  const address = isAddress ? feature.text : '';

  return { address, city, postalCode: postcode, country, countryCode };
}

export const COUNTRY_MAP: Record<string, string> = {
  // English names (from Mapbox without language param)
  Spain: 'España',
  Portugal: 'Portugal',
  France: 'Francia',
  Germany: 'Alemania',
  Italy: 'Italia',
  'United Kingdom': 'Reino Unido',
  Netherlands: 'Países Bajos',
  Belgium: 'Bélgica',
  Switzerland: 'Suiza',
  Austria: 'Austria',
  Luxembourg: 'Luxemburgo',
  // Spanish names (from Mapbox with language=es)
  España: 'España',
  Francia: 'Francia',
  Alemania: 'Alemania',
  Italia: 'Italia',
  'Reino Unido': 'Reino Unido',
  'Países Bajos': 'Países Bajos',
  Bélgica: 'Bélgica',
  Suiza: 'Suiza',
  Luxemburgo: 'Luxemburgo',
};

export const POSTAL_CODE_TO_PROVINCE: Record<string, string> = {
  '01': 'Álava',
  '02': 'Albacete',
  '03': 'Alicante',
  '04': 'Almería',
  '05': 'Ávila',
  '06': 'Badajoz',
  '07': 'Illes Balears',
  '08': 'Barcelona',
  '09': 'Burgos',
  '10': 'Cáceres',
  '11': 'Cádiz',
  '12': 'Castellón',
  '13': 'Ciudad Real',
  '14': 'Córdoba',
  '15': 'La Coruña',
  '16': 'Cuenca',
  '17': 'Girona',
  '18': 'Granada',
  '19': 'Guadalajara',
  '20': 'Gipuzkoa',
  '21': 'Huelva',
  '22': 'Huesca',
  '23': 'Jaén',
  '24': 'León',
  '25': 'Lleida',
  '26': 'La Rioja',
  '27': 'Lugo',
  '28': 'Madrid',
  '29': 'Málaga',
  '30': 'Murcia',
  '31': 'Navarra',
  '32': 'Ourense',
  '33': 'Asturias',
  '34': 'Palencia',
  '35': 'Las Palmas',
  '36': 'Pontevedra',
  '37': 'Salamanca',
  '38': 'Santa Cruz de Tenerife',
  '39': 'Cantabria',
  '40': 'Segovia',
  '41': 'Sevilla',
  '42': 'Soria',
  '43': 'Tarragona',
  '44': 'Teruel',
  '45': 'Toledo',
  '46': 'Valencia',
  '47': 'Valladolid',
  '48': 'Bizkaia',
  '49': 'Zamora',
  '50': 'Zaragoza',
};
