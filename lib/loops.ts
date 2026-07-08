import { IUser } from "@/models/User";

const LOOPS_API_KEY = process.env.LOOPS_API_KEY;

if (!LOOPS_API_KEY) {
    console.warn("LOOPS_API_KEY not found in environment variables");
}

/**
 * Derives the plan type string for Loops based on user subscription status
 */
function derivePlanType(user: IUser): string {
    if (user.isPaidUser) {
        if (user.subscriptionStatus === 'active') {
            return 'pro'; // Or specific plan name if available in subscriptionId
        }
        return 'one_time_payment';
    }
    return 'free';
}

/**
 * Syncs a user contact to Loops.so
 * @param user The user document from MongoDB
 */
export async function syncContact(user: IUser) {
    if (!LOOPS_API_KEY) return;

    try {
        const plan_type = derivePlanType(user);

        // Map region to country if country is not explicitly set
        const country = user.country || (user.region === 'INDIA' ? 'India' : user.region === 'USA' ? 'USA' : user.region);

        const payload = {
            email: user.email,
            firstName: user.name?.split(' ')[0] || '',
            lastName: user.name?.split(' ').slice(1).join(' ') || '',
            userGroup: plan_type, // Loops uses userGroup or custom properties
            properties: {
                primary_role: user.primaryRole || null,
                experience_level: user.experienceLevel || null,
                job_search_stage: user.jobSearchStage || null,
                country: country || null,
                plan_type: plan_type,
                last_seen: user.lastSeen ? user.lastSeen.toISOString() : null,
                last_ats_score: user.lastAtsScore || 0,
                credits: user.credits || 0,
                has_completed_onboarding: user.hasCompletedOnboarding || false,
            }
        };

        const response = await fetch("https://app.loops.so/api/v1/contacts/update", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${LOOPS_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Loops sync failed for ${user.email}: ${response.status} ${response.statusText} - ${errorText}`);
        } else {
            // console.log("Loops sync success:", user.email); // Uncomment for debug
        }
    } catch (err) {
        console.error("Loops sync error:", err);
    }
}

/**
 * Sends a custom event to Loops.so
 * @param email User email
 * @param eventName Event name (e.g. "viewed_home_page")
 * @param properties Event properties
 */
export async function sendEvent(email: string, eventName: string, properties: Record<string, any> = {}) {
    if (!LOOPS_API_KEY) return;

    try {
        const response = await fetch("https://app.loops.so/api/v1/events/send", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${LOOPS_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                eventName: eventName,
                properties: properties
            })
        });

        if (!response.ok) {
            console.error(`Loops event '${eventName}' failed for ${email}: ${response.status} ${response.statusText}`);
        }
    } catch (err) {
        console.error(`Loops event '${eventName}' error:`, err);
    }
}

/**
 * Sends a transactional email using a Loops template ID
 * @param transactionId Loops transaction ID (template ID)
 * @param email Recipient email
 * @param dataDataVariables Data variables for the email template
 */
export async function sendTransactionalEmail(transactionId: string, email: string, dataVariables: Record<string, any> = {}) {
    if (!LOOPS_API_KEY) return;

    try {
        const response = await fetch("https://app.loops.so/api/v1/transactional", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${LOOPS_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                transactionalId: transactionId,
                email: email,
                dataVariables: dataVariables
            })
        });

        if (!response.ok) {
            console.error(`Loops transactional email '${transactionId}' failed for ${email}: ${response.status} ${response.statusText}`);
        }
    } catch (err) {
        console.error(`Loops transactional email '${transactionId}' error:`, err);
    }
}
