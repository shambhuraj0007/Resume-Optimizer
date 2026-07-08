import { Reader, CountryResponse } from 'maxmind';
import path from 'path';
import fs from 'fs';

// Path to the MMDB file
const MMDB_PATHS = [
    path.join(process.cwd(), 'server', 'data', 'GeoLite2-Country.mmdb'),
    path.join(process.cwd(), 'public', 'GeoLite2-Country.mmdb'),
    path.join(process.cwd(), 'GeoLite2-Country.mmdb'), // Check root as fallback
];

let lookup: Reader<CountryResponse> | null = null;

export async function getRegionFromIP(ip: string): Promise<string> {
    const DEFAULT_REGION = 'USA';

    // Normalize IP
    if (ip === '::1') ip = '127.0.0.1';
    if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');

    // Check if IP is local/private
    const isLocal =
        ip === '127.0.0.1' ||
        ip.startsWith('192.168.') ||
        ip.startsWith('10.') ||
        ip.startsWith('172.16.') ||
        ip.startsWith('172.17.') ||
        ip.startsWith('172.18.') ||
        ip.startsWith('172.19.') ||
        ip.startsWith('172.2') ||
        ip.startsWith('172.30.') ||
        ip.startsWith('172.31.');

    // 2. Try Local MaxMind DB Lookup
    try {
        if (!lookup) {
            const dbPath = MMDB_PATHS.find(p => fs.existsSync(p));
            if (dbPath) {
                console.log(`[GEO] Found MMDB at: ${dbPath}`);
                const buffer = fs.readFileSync(dbPath);
                lookup = new Reader<CountryResponse>(buffer);
            } else {
                // Only log this once per cold start context ideally, or purely on error
                console.warn(`[GEO] GeoLite2 database not found. Searched in:`, MMDB_PATHS);
                console.warn(`[GEO] Current working directory: ${process.cwd()}`);
            }
        }

        if (lookup) {
            const response = lookup.get(ip);
            if (response?.country?.iso_code) {
                const region = mapCountryCodeToRegion(response.country.iso_code);
                console.log(`[GEO] MMDB Detected: ${region} for IP: ${ip} (${response.country.iso_code})`);
                return region;
            }
        }
    } catch (error) {
        console.error(`[GEO] Error using MMDB lookup:`, error);
    }

    // 3. Fallback to External IP Geolocation API (if MMDB missing or failed)
    try {
        // Skip calling this if we're still on a local IP (meaning step 1 failed) to avoid API errors
        if (!isLocal || (ip !== '127.0.0.1' && !ip.startsWith('192.168.'))) {
            console.log(`[GEO] Using fallback API for IP: ${ip}`);
            const apiRes = await fetch(`http://ip-api.com/json/${ip}`, { next: { revalidate: 3600 } });
            if (apiRes.ok) {
                const data = await apiRes.json();
                if (data.status === 'success' && data.countryCode) {
                    const region = mapCountryCodeToRegion(data.countryCode);
                    console.log(`[GEO] API Detected: ${region} for IP: ${ip} (${data.countryCode})`);
                    return region;
                }
            }
        }
    } catch (error) {
        console.error(`[GEO] Fallback API failed:`, error);
    }

    // 4. Final Fallback
    if (isLocal) {
        console.log(`[GEO] Local IP and external lookups failed. Defaulting to INDIA for dev.`);
        return 'INDIA';
    }

    console.log(`[GEO] Region detection failed for IP: ${ip}, using default: ${DEFAULT_REGION}`);
    return DEFAULT_REGION;
}

function mapCountryCodeToRegion(countryCode: string): string {
    if (countryCode === 'IN') return 'INDIA';
    if (countryCode === 'US') return 'USA';
    if (['GB', 'UK'].includes(countryCode)) return 'UK';

    const EU_COUNTRIES = [
        'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE',
        'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT',
        'RO', 'SK', 'SI', 'ES', 'SE'
    ];
    if (EU_COUNTRIES.includes(countryCode)) return 'EUROPE';

    // Default for other countries can be mapped to USA or a generic 'ROW' (Rest of World)
    // For now, mapping to USA as per original logic
    return 'USA';
}
