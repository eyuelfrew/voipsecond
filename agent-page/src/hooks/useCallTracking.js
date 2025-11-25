import { useEffect, useRef } from 'react';
import axios from 'axios';
import { SessionState } from 'sip.js';
import { getApiUrl } from '../config';

const baseUrl = getApiUrl();

/**
 * Hook to automatically track calls and update contact stats
 * Call this hook in your SIPProvider or main call component
 */
export const useCallTracking = (callSession, callTimer) => {
    const trackedCalls = useRef(new Set());

    useEffect(() => {
        const trackCallEnd = async () => {
            if (!callSession) return;

            const callId = callSession.id;

            // Avoid tracking the same call multiple times
            if (trackedCalls.current.has(callId)) return;

            // Get remote number
            const remoteNumber =
                callSession?.remote_identity?.uri?.user ||
                callSession?.remoteIdentity?.uri?.user ||
                callSession?._remote_identity?.uri?.user ||
                callSession?.request?.from?.uri?.user ||
                callSession?.from?.uri?.user;

            if (!remoteNumber) {
                console.log('📞 Call Tracking: No remote number found');
                return;
            }

            // Determine direction
            const direction = callSession.direction === 'outgoing' ? 'outbound' : 'inbound';

            try {
                console.log(`📞 Call Tracking: Tracking call to ${remoteNumber}`);

                const response = await axios.post(
                    `${baseUrl}/contacts/track-call`,
                    {
                        phoneNumber: remoteNumber,
                        direction: direction,
                        duration: callTimer || 0,
                        status: 'answered'
                    },
                    { withCredentials: true }
                );

                if (response.data.contactFound) {
                    console.log(`📞 Call Tracking: Updated contact ${response.data.contact.name}`);
                    console.log(`   - Total calls: ${response.data.contact.callCount}`);
                    console.log(`   - Total interactions: ${response.data.contact.totalInteractions}`);
                } else {
                    console.log(`📞 Call Tracking: No contact found for ${remoteNumber}`);
                }

                // Mark this call as tracked
                trackedCalls.current.add(callId);
            } catch (error) {
                console.error('📞 Call Tracking: Error tracking call:', error);
            }
        };

        // Track when call session ends
        if (callSession) {
            // In sip.js v0.20+, sessions use stateChange listener instead of .on()
            const handleStateChange = (newState) => {
                if (newState === SessionState.Terminated) {
                    console.log('📞 Call Tracking: Call terminated, tracking...');
                    trackCallEnd();
                } else if (newState === SessionState.Failed) {
                    console.log('📞 Call Tracking: Call failed');
                    // Don't track failed calls
                }
            };

            // Check if session has stateChange listener (for Inviter/Invitation objects)
            if (callSession.stateChange && callSession.stateChange.addListener) {
                callSession.stateChange.addListener(handleStateChange);
            }
        }

        return () => {
            // Cleanup is handled by sip.js automatically when session ends
        };
    }, [callSession, callTimer]);
};

export default useCallTracking;
