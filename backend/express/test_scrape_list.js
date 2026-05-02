import axios from 'axios';
import { createClient } from 'redis';
import crypto from 'crypto';

async function testEndpoint() {
    const redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    await redis.connect();

    // Create a mock proctor session
    const sessionId = crypto.randomUUID();
    const proctorId = "PROCTOR123"; // Using a dummy proctor ID for the test
    
    await redis.set(`session:${sessionId}`, `proctor:${proctorId}`);
    
    console.log(`Mock session created: ${sessionId} for ${proctorId}`);

    try {
        const response = await axios.get(`http://127.0.0.1:5001/api/proctor/${proctorId}/scrape-list?academicYear=2027`, {
            headers: {
                'x-session-id': sessionId
            }
        });
        
        console.log("Endpoint Status:", response.status);
        console.log("Endpoint Data:", JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error("Test failed:", error.response ? error.response.data : error.message);
    } finally {
        await redis.del(`session:${sessionId}`);
        await redis.quit();
    }
}

testEndpoint();
