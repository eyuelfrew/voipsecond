import axios from 'axios';
import { getApiUrl } from '../config';
const baseUrl = getApiUrl();

export async function fetchAgentDailyStats(agentId) {
    // Returns { ticketsResolved, callsHandled }
    const { data } = await axios.get(`${baseUrl}/metrics/agent/${agentId}`, { withCredentials: true });
    return data;
}
