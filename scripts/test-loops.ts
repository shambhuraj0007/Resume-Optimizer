
import dotenv from 'dotenv';
dotenv.config();

// Mock the User model and mongoose to avoid DB connection issues in test
const mockUser = {
    email: "test.user@example.com",
    name: "Test User",
    isPaidUser: false,
    subscriptionStatus: null,
    region: "INDIA",
    country: "India",
    primaryRole: "Software Engineer",
    experienceLevel: "Senior",
    jobSearchStage: "Active",
    credits: 10,
    lastAtsScore: 85,
    hasCompletedOnboarding: true,
    lastSeen: new Date(),
    _id: "mock_id"
};

async function testLoops() {
    console.log("Testing Loops Integration...");

    if (!process.env.LOOPS_API_KEY) {
        console.warn("WARNING: LOOPS_API_KEY not found in env. Skipping actual API call.");
        return;
    }

    try {
        const { syncContact, sendEvent } = await import('../lib/loops');

        console.log("1. Testing syncContact...");
        await syncContact(mockUser as any);
        console.log("   syncContact call completed (check Loops dashboard).");

        console.log("2. Testing sendEvent...");
        await sendEvent("test.user@example.com", "test_event", { source: "test_script" });
        console.log("   sendEvent call completed (check Loops dashboard).");

    } catch (error) {
        console.error("Test failed:", error);
    }
}

testLoops();
