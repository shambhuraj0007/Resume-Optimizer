import 'dotenv/config';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const BASE_URL = process.env.PAYPAL_MODE === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

const PLAN_IDS_TO_CHECK = [
    'P-09G239902Y3340720NFFLJXY', // pro-monthly-usd
    'P-10X49417336220825NFFLKJA', // pro-quarterly-usd
    'P-05M666451V631953LNFFLHDY', // pro-monthly-eur
    'P-4M9785276H958822KNFFLIJA', // pro-quarterly-eur
    'P-6M580881VM893674TNFFLI2Y', // pro-monthly-gbp
    'P-4X993862FS1550934NFFLJKY', // pro-quarterly-gbp
];

async function getAccessToken() {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    const response = await fetch(`${BASE_URL}/v1/oauth2/token`, {
        method: 'POST',
        body: 'grant_type=client_credentials',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
}

async function verifyPlan(accessToken: string, planId: string) {
    const response = await fetch(`${BASE_URL}/v1/billing/plans/${planId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });

    if (response.status === 200) {
        const data = await response.json();
        console.log(`✅ Plan Found: ${planId} (${data.status}) - ${data.name}`);
        return true;
    } else {
        console.log(`❌ Plan Not Found or Error: ${planId} (${response.status})`);
        return false;
    }
}

async function main() {
    try {
        console.log(`Using PayPal Mode: ${process.env.PAYPAL_MODE || 'live'} (Base URL: ${BASE_URL})`);
        if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
            throw new Error('Missing PayPal Credentials in .env');
        }

        console.log('Authenticating...');
        const accessToken = await getAccessToken();
        console.log('Authentication successful.\n');

        console.log('Verifying Plan IDs from seed-pricing.ts...\n');

        for (const planId of PLAN_IDS_TO_CHECK) {
            await verifyPlan(accessToken, planId);
        }

    } catch (error) {
        console.error('Script failed:', error);
    }
}

main();
