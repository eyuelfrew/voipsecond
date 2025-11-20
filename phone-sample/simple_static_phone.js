/**
 * Simplified WebRTC Phone - Static Configuration
 * Contains only essential features: make/receive calls
 * Pre-configured for Asterisk server at 192.168.1.4:8089
 */
class SimpleStaticWebRTCPhone {
    constructor() {
        this.userAgent = null;
        this.currentSession = null;
        this.hasVideo = false;
        this.isMuted = false;
        this.hasAudio = true;

        // Asterisk server configuration - pre-configured
        this.wssServer = '192.168.137.195';
        this.sipDomain = '192.168.137.195';
        this.wsPort = '8089';

        // DOM elements
        this.elements = {
            registerBtn: document.getElementById('registerBtn'),
            unregisterBtn: document.getElementById('unregisterBtn'),
            callBtn: document.getElementById('callBtn'),
            answerBtn: document.getElementById('answerBtn'),
            hangupBtn: document.getElementById('hangupBtn'),
            regStatus: document.getElementById('regStatus'),
            callStatus: document.getElementById('callStatus'),
            targetNumber: document.getElementById('targetNumber'),
            localVideo: document.getElementById('localVideo'),
            remoteVideo: document.getElementById('remoteVideo'),
            remoteAudio: document.getElementById('remoteAudio'),
            currentCallPanel: document.getElementById('currentCallPanel'),
            callInfo: document.getElementById('callInfo'),
            toggleMuteBtn: document.getElementById('toggleMuteBtn'),
            sipUsername: document.getElementById('sipUsername'),
            sipPassword: document.getElementById('sipPassword'),
            webRtcFailed: document.getElementById('WebRtcFailed')
        };

        this.bindEvents();
    }

    bindEvents() {
        // Registration events
        this.elements.registerBtn.addEventListener('click', () => this.register());
        this.elements.unregisterBtn.addEventListener('click', () => this.unregister());

        // Call events
        this.elements.callBtn.addEventListener('click', () => this.makeCall());
        this.elements.answerBtn.addEventListener('click', () => this.answerCall());
        this.elements.hangupBtn.addEventListener('click', () => this.hangup());

        // Media toggle events
        this.elements.toggleMuteBtn.addEventListener('click', () => this.toggleMute());

        // WebRTC certificate error handling
        this.elements.webRtcFailed.addEventListener('click', () => {
            this.handleCertificateError();
        });
    }

    register() {
        if (!this.validateSettings()) {
            return;
        }

        if (this.userAgent) {
            if (this.isRegistered()) {
                this.updateRegStatus('Already registered', 'registered');
                return;
            }
        } else {
            this.createSipUserAgent();
        }

        if (this.userAgent) {
            const registerOptions = {
                requestDelegate: {
                    onReject: (response) => {
                        console.error('Registration failed:', response);
                        if (response.message && response.message.statusCode === 503) {
                            // Show certificate error if it's a 503 error
                            this.elements.webRtcFailed.style.display = 'block';
                            this.updateRegStatus('Registration failed (503). Check server certificate.', 'unregistered');
                        } else {
                            this.updateRegStatus(`Registration failed: ${response.message.reasonPhrase}`, 'unregistered');
                        }
                    }
                }
            };

            this.userAgent.registerer.register(registerOptions);
            this.updateRegStatus('Registering...', 'unregistered');
        }
    }

    unregister() {
        if (this.userAgent && this.isRegistered()) {
            this.userAgent.registerer.unregister();
            this.updateRegStatus('Unregistering...', 'unregistered');
        }
    }

    validateSettings() {
        const sipUsername = this.elements.sipUsername.value;
        const sipPassword = this.elements.sipPassword.value;

        if (!sipUsername || !sipPassword) {
            alert('Please enter SIP extension and password');
            return false;
        }

        return true;
    }

    createSipUserAgent() {
        const sipUsername = this.elements.sipUsername.value;
        const sipPassword = this.elements.sipPassword.value;

        // Create WebSocket URI - using pre-configured server
        const wsServers = [`wss://${this.wssServer}:${this.wsPort}/ws`];

        // Create user agent options
        const options = {
            uri: SIP.UserAgent.makeURI(`sip:${sipUsername}@${this.sipDomain}`),
            authorizationUsername: sipUsername,
            authorizationPassword: sipPassword,
            transportOptions: {
                wsServers: wsServers
            },
            sessionDescriptionHandlerFactoryOptions: {
                constraints: {
                    audio: true,
                    video: this.hasVideo
                },
                peerConnectionConfiguration: {
                    iceServers: [
                        // { urls: 'stun:stun.l.google.com:19302' }
                    ]
                }
            },
            logConfiguration: false
        };

        try {
            // Create the user agent
            this.userAgent = new SIP.UserAgent(options);

            // Create registerer
            this.userAgent.registerer = new SIP.Registerer(this.userAgent);

            // Listen for registration state changes
            this.userAgent.registerer.stateChange.addListener((newState) => {
                switch (newState) {
                    case SIP.RegistererState.Registered:
                        this.updateRegStatus('Registered', 'registered');
                        break;
                    case SIP.RegistererState.Unregistered:
                        this.updateRegStatus('Unregistered', 'unregistered');
                        break;
                    case SIP.RegistererState.Terminated:
                        this.updateRegStatus('Not registered', 'unregistered');
                        break;
                }
            });

            // Listen for incoming calls
            this.userAgent.delegate = {
                onInvite: (session) => {
                    this.handleIncomingCall(session);
                }
            };

            // Transport error handling for SIP.js 0.20.0
            this.userAgent.transport.onConnect = () => {
                this.elements.webRtcFailed.style.display = 'none';
                this.updateRegStatus('Connected', 'registered');
            };

            this.userAgent.transport.onDisconnect = (error) => {
                console.error('Transport disconnected:', error);
                this.elements.webRtcFailed.style.display = 'block';
                this.updateRegStatus('Transport disconnected', 'unregistered');
            };

            // Start the user agent
            this.userAgent.start().catch((error) => {
                console.error('Failed to start user agent:', error);
                this.elements.webRtcFailed.style.display = 'block';
                this.updateRegStatus('Failed to connect: ' + error.message, 'unregistered');
            });
        } catch (error) {
            console.error('Error creating SIP User Agent:', error);
            this.updateRegStatus('Error creating user agent: ' + error.message, 'unregistered');
        }
    }

    handleIncomingCall(session) {
        this.currentSession = session;

        // Update UI for incoming call
        let callerNumber = 'Unknown';
        if (session.remoteIdentity) {
            callerNumber = session.remoteIdentity.uri ? session.remoteIdentity.uri.user : 'Unknown';
        } else if (session.request) {
            callerNumber = session.request.from.uri.user || 'Unknown';
        }

        this.updateCallStatus(`Incoming call from: ${callerNumber}`, 'unregistered');
        this.elements.callStatus.style.display = 'block';
        this.elements.answerBtn.style.display = 'inline-block';
        this.elements.hangupBtn.style.display = 'inline-block';
        this.elements.callBtn.style.display = 'none';

        // Show current call panel
        this.elements.currentCallPanel.style.display = 'block';
        this.elements.callInfo.textContent = `Incoming call from: ${callerNumber}`;

        // Setup session handlers
        this.setupSessionHandlers(session);
    }

    makeCall() {
        if (!this.userAgent || !this.isRegistered()) {
            alert('Please register first!');
            return;
        }

        const number = this.elements.targetNumber.value.trim();
        if (!number) {
            alert('Please enter a number to call');
            return;
        }

        // Create invite options with media constraints
        const inviteOptions = {
            sessionDescriptionHandlerOptions: {
                constraints: {
                    audio: true,
                    video: this.hasVideo
                }
            }
        };

        try {
            // Make the call - using pre-configured domain
            const target = `sip:${number}@${this.sipDomain}`;
            const targetURI = SIP.UserAgent.makeURI(target);

            // Create an Inviter instance to initiate the call
            this.currentSession = new SIP.Inviter(this.userAgent, targetURI, inviteOptions);

            // Setup session event listeners
            this.setupSessionHandlers(this.currentSession);

            // Start the call by sending the INVITE
            this.currentSession.invite();

            // Update UI
            this.updateCallStatus('Calling...', 'unregistered');
            this.elements.callStatus.style.display = 'block';
            this.elements.hangupBtn.style.display = 'inline-block';
            this.elements.callBtn.style.display = 'none';

            // Show current call panel
            this.elements.currentCallPanel.style.display = 'block';
            this.elements.callInfo.textContent = `Calling: ${number}`;
        } catch (error) {
            console.error('Error making call:', error);
            this.updateCallStatus('Call failed: ' + error.message, 'unregistered');
        }
    }

    answerCall() {
        if (this.currentSession) {
            try {
                // Check if it's an InviteServerContext (incoming call) that needs to be accepted
                if (this.currentSession.accept) {
                    this.currentSession.accept();
                } else if (this.currentSession.invite) {
                    // If it's an Inviter (outgoing call), we don't accept it
                    // Instead, we might just update the status
                    this.updateCallStatus('In progress...', 'registered');
                    return;
                }
                this.updateCallStatus('In progress...', 'registered');
            } catch (error) {
                console.error('Error answering call:', error);
                this.updateCallStatus('Answer failed: ' + error.message, 'unregistered');
            }
        }
    }

    hangup() {
        if (this.currentSession) {
            try {
                // Different methods depending on session type
                if (this.currentSession.bye) {
                    this.currentSession.bye();
                } else if (this.currentSession.cancel) {
                    this.currentSession.cancel();
                } else if (this.currentSession.reject) {
                    this.currentSession.reject();
                }
            } catch (error) {
                console.error('Error hanging up call:', error);
            }
            this.resetCallState();
        }
    }

    setupSessionHandlers(session) {
        // Check if this is a new-style session with sessionDescriptionHandler
        if (session.sessionDescriptionHandler && session.sessionDescriptionHandler.on) {
            // Handle track addition (remote media)
            session.sessionDescriptionHandler.on('trackAdded', () => {
                try {
                    // Get the remote media stream
                    const remoteStream = session.sessionDescriptionHandler.remoteMediaStream;

                    if (remoteStream) {
                        // Create a new stream specifically for remote audio
                        const remoteAudioStream = new MediaStream();

                        // Add only audio tracks to the remote audio stream
                        remoteStream.getAudioTracks().forEach(track => {
                            console.log('Adding remote audio track:', track);
                            remoteAudioStream.addTrack(track);
                        });

                        // Create a new stream for remote video
                        const remoteVideoStream = new MediaStream();

                        // Add only video tracks to the remote video stream
                        remoteStream.getVideoTracks().forEach(track => {
                            console.log('Adding remote video track:', track);
                            remoteVideoStream.addTrack(track);
                        });

                        // Attach to media elements
                        if (remoteAudioStream.getAudioTracks().length > 0) {
                            this.elements.remoteAudio.srcObject = remoteAudioStream;
                            this.elements.remoteAudio.volume = 1.0; // Ensure volume is up

                            // CRITICAL: Wait for metadata to load, then play
                            this.elements.remoteAudio.onloadedmetadata = () => {
                                console.log('Remote audio metadata loaded, playing...');
                                this.elements.remoteAudio.play()
                                    .then(() => {
                                        console.log('Remote audio playing successfully');
                                    })
                                    .catch((error) => {
                                        console.error('Error playing remote audio:', error);
                                        // Try to play again after user interaction
                                        alert('Click OK to enable audio playback');
                                        this.elements.remoteAudio.play();
                                    });
                            };

                            console.log('Attached remote audio to remoteAudio element');
                        }

                        if (remoteVideoStream.getVideoTracks().length > 0) {
                            this.elements.remoteVideo.srcObject = remoteVideoStream;
                            this.elements.remoteVideo.style.display = 'block';
                            console.log('Attached remote video to remoteVideo element');
                        }
                    }
                } catch (error) {
                    console.error('Error adding tracks:', error);
                }
            });

            // Handle local stream for preview
            session.sessionDescriptionHandler.on('userMedia', (streams) => {
                if (streams && Array.isArray(streams) && streams.length > 0) {
                    this.elements.localVideo.srcObject = streams[0];
                    this.elements.localVideo.style.display = 'block';
                } else if (session.sessionDescriptionHandler.localMediaStream) {
                    // Create a new stream for local video only
                    const localVideoStream = new MediaStream();

                    // Add only video tracks to local preview
                    session.sessionDescriptionHandler.localMediaStream.getVideoTracks().forEach(track => {
                        localVideoStream.addTrack(track);
                    });

                    if (localVideoStream.getTracks().length > 0) {
                        this.elements.localVideo.srcObject = localVideoStream;
                        this.elements.localVideo.style.display = 'block';
                    }
                }
            });
        }

        // Handle session state changes - check if this is a Session with stateChange
        if (session.stateChange && typeof session.stateChange.addListener === 'function') {
            // New style session with stateChange listener
            session.stateChange.addListener((newState) => {
                switch (newState) {
                    case SIP.SessionState.Initial:
                        this.updateCallStatus('Initializing...', 'unregistered');
                        break;
                    case SIP.SessionState.Establishing:
                        this.updateCallStatus('Establishing...', 'unregistered');
                        break;
                    case SIP.SessionState.Established:
                        this.updateCallStatus('In progress...', 'registered');

                        // Set up local video preview if available
                        if (session.sessionDescriptionHandler && session.sessionDescriptionHandler.localMediaStream) {
                            // Create a new stream for local video only
                            const localVideoStream = new MediaStream();

                            // Add only video tracks to local preview
                            session.sessionDescriptionHandler.localMediaStream.getVideoTracks().forEach(track => {
                                localVideoStream.addTrack(track);
                            });

                            if (localVideoStream.getTracks().length > 0) {
                                this.elements.localVideo.srcObject = localVideoStream;
                                this.elements.localVideo.style.display = 'block';
                            }
                        }

                        // Try to get remote stream immediately after connection is established
                        if (session.sessionDescriptionHandler && session.sessionDescriptionHandler.remoteMediaStream) {
                            const remoteStream = session.sessionDescriptionHandler.remoteMediaStream;

                            // Create a new stream specifically for remote audio
                            const remoteAudioStream = new MediaStream();

                            // Add only audio tracks to the remote audio stream
                            remoteStream.getAudioTracks().forEach(track => {
                                remoteAudioStream.addTrack(track);
                            });

                            // Create a new stream for remote video
                            const remoteVideoStream = new MediaStream();

                            // Add only video tracks to the remote video stream
                            remoteStream.getVideoTracks().forEach(track => {
                                remoteVideoStream.addTrack(track);
                            });

                            // Attach to media elements
                            if (remoteAudioStream.getAudioTracks().length > 0) {
                                this.elements.remoteAudio.srcObject = remoteAudioStream;
                                this.elements.remoteAudio.volume = 1.0; // Ensure volume is up

                                // CRITICAL: Wait for metadata to load, then play
                                this.elements.remoteAudio.onloadedmetadata = () => {
                                    console.log('Remote audio metadata loaded (established), playing...');
                                    this.elements.remoteAudio.play()
                                        .then(() => {
                                            console.log('Remote audio playing successfully');
                                        })
                                        .catch((error) => {
                                            console.error('Error playing remote audio:', error);
                                            // Try to play again after user interaction
                                            alert('Click OK to enable audio playback');
                                            this.elements.remoteAudio.play();
                                        });
                                };
                            }

                            if (remoteVideoStream.getVideoTracks().length > 0) {
                                this.elements.remoteVideo.srcObject = remoteVideoStream;
                                this.elements.remoteVideo.style.display = 'block';
                            }
                        }
                        break;
                    case SIP.SessionState.Terminating:
                        this.updateCallStatus('Terminating...', 'unregistered');
                        break;
                    case SIP.SessionState.Terminated:
                        // Clean up remote media streams when call ends
                        this.elements.remoteAudio.srcObject = null;
                        this.elements.remoteVideo.srcObject = null;
                        this.elements.remoteVideo.style.display = 'none';
                        this.updateCallStatus('Call ended', 'unregistered');
                        // Delay reset to show the "Call ended" message
                        setTimeout(() => {
                            this.resetCallState();
                        }, 1000);
                        break;
                }
            });
        } else {
            // Older style session with event handlers
            if (session.on) {
                session.on('progress', (response) => {
                    if (response && response.status_code === 180) {
                        this.updateCallStatus('Ringing...', 'unregistered');
                    }
                });

                session.on('accepted', () => {
                    this.updateCallStatus('In progress...', 'registered');
                });

                session.on('failed', (response, cause) => {
                    this.updateCallStatus('Call failed: ' + (cause || 'Unknown reason'), 'unregistered');
                    this.resetCallState();
                });

                session.on('rejected', (response) => {
                    this.updateCallStatus('Call rejected: ' + (response ? response.reason_phrase : 'Unknown reason'), 'unregistered');
                    this.resetCallState();
                });

                session.on('bye', () => {
                    this.updateCallStatus('Call ended', 'unregistered');
                    this.resetCallState();
                });
            }

            // Set delegate for call failure
            if (session.delegate) {
                session.delegate.onReject = (response) => {
                    this.updateCallStatus('Call rejected: ' + (response ? response.message.reasonPhrase : 'Unknown reason'), 'unregistered');
                    this.resetCallState();
                };

                session.delegate.onProgress = (response) => {
                    if (response && response.message && response.message.statusCode === 180) {
                        this.updateCallStatus('Ringing...', 'unregistered');
                    }
                };

                session.delegate.onSessionDescriptionHandler = (sessionDescriptionHandler) => {
                    // Set up track handling for older style sessions
                    if (sessionDescriptionHandler.on) {
                        sessionDescriptionHandler.on('userMedia', (streams) => {
                            if (streams && streams.length > 0) {
                                this.elements.localVideo.srcObject = streams[0];
                                this.elements.localVideo.style.display = 'block';
                            }
                        });
                    }
                };
            }
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;

        if (this.elements.localVideo.srcObject) {
            // Mute/unmute the local video element
            this.elements.localVideo.muted = this.isMuted;
        }

        this.elements.toggleMuteBtn.textContent = this.isMuted ? 'Unmute' : 'Mute';
    }

    updateRegStatus(message, type) {
        this.elements.regStatus.textContent = message;
        this.elements.regStatus.className = `status ${type}`;
    }

    updateCallStatus(message, type) {
        this.elements.callStatus.textContent = message;
        this.elements.callStatus.className = `status ${type}`;
    }

    isRegistered() {
        return this.userAgent &&
            this.userAgent.registerer &&
            this.userAgent.registerer.state === SIP.RegistererState.Registered;
    }

    handleCertificateError() {
        // Open the certificate acceptance page
        const certUrl = `https://${this.wssServer}:${this.wsPort}/httpStatus`;
        window.open(certUrl, '_blank');

        // Inform user to accept the certificate
        alert(`Please accept the certificate for ${this.wssServer} in the new window, then try registering again.`);
    }

    tryReconnect() {
        if (this.userAgent && this.userAgent.transport) {
            // Attempt to reconnect to the transport
            this.userAgent.transport.connect().catch((error) => {
                console.error('Reconnection failed:', error);
            });
        }
    }

    resetCallState() {
        // Clean up current session
        this.currentSession = null;

        // Clean up media streams
        if (this.elements.localVideo.srcObject) {
            this.elements.localVideo.srcObject.getTracks().forEach(track => {
                if (track.readyState === 'live') {
                    track.stop();
                }
            });
            this.elements.localVideo.srcObject = null;
            this.elements.localVideo.style.display = 'none';
        }

        if (this.elements.remoteVideo.srcObject) {
            this.elements.remoteVideo.srcObject.getTracks().forEach(track => {
                if (track.readyState === 'live') {
                    track.stop();
                }
            });
            this.elements.remoteVideo.srcObject = null;
            this.elements.remoteVideo.style.display = 'none';
        }

        if (this.elements.remoteAudio.srcObject) {
            this.elements.remoteAudio.srcObject = null;
        }

        // Reset UI
        this.elements.callStatus.style.display = 'none';
        this.elements.callBtn.style.display = 'inline-block';
        this.elements.answerBtn.style.display = 'none';
        this.elements.hangupBtn.style.display = 'none';
        this.elements.currentCallPanel.style.display = 'none';
        this.elements.callInfo.textContent = 'No active call';
    }
}

// Initialize the phone when the page loads
document.addEventListener('DOMContentLoaded', function () {
    // Initialize the phone
    const phone = new SimpleStaticWebRTCPhone();

    // Make the phone globally available for debugging
    window.phone = phone;
});