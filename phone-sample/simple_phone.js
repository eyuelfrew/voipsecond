/**
 * Simplified WebRTC Phone - Core Calling Functionality
 * Contains only essential features: make/receive calls
 */
class SimpleWebRTCPhone {
    constructor() {
        this.userAgent = null;
        this.currentSession = null;
        this.hasVideo = false;
        this.isMuted = false;
        this.hasAudio = true;
        
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
            toggleVideoBtn: document.getElementById('toggleVideoBtn'),
            toggleMuteBtn: document.getElementById('toggleMuteBtn')
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
        this.elements.toggleVideoBtn.addEventListener('click', () => this.toggleVideo());
        this.elements.toggleMuteBtn.addEventListener('click', () => this.toggleMute());
        
        // Dialpad events
        document.querySelectorAll('.dial-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const digit = e.target.getAttribute('data-digit');
                this.elements.targetNumber.value += digit;
            });
        });
    }
    
    register() {
        if (!this.validateSettings()) {
            return;
        }
        
        if (this.userAgent) {
            if (this.userAgent.isRegistered()) {
                this.updateRegStatus('Already registered', 'registered');
                return;
            }
        } else {
            this.createSipUserAgent();
        }
        
        if (this.userAgent) {
            this.userAgent.registerer.register();
            this.updateRegStatus('Registering...', 'unregistered');
        }
    }
    
    unregister() {
        if (this.userAgent && this.userAgent.isRegistered()) {
            this.userAgent.registerer.unregister();
            this.updateRegStatus('Unregistering...', 'unregistered');
        }
    }
    
    validateSettings() {
        const wssServer = document.getElementById('wssServer').value;
        const sipUsername = document.getElementById('sipUsername').value;
        const sipPassword = document.getElementById('sipPassword').value;
        const sipDomain = document.getElementById('sipDomain').value;
        
        if (!wssServer || !sipUsername || !sipPassword || !sipDomain) {
            alert('Please fill in all SIP settings');
            return false;
        }
        
        return true;
    }
    
    createSipUserAgent() {
        const wssServer = document.getElementById('wssServer').value;
        const sipUsername = document.getElementById('sipUsername').value;
        const sipPassword = document.getElementById('sipPassword').value;
        const sipDomain = document.getElementById('sipDomain').value;
        
        // Create WebSocket URI
        const wsServers = [`wss://${wssServer}:8089/ws`];
        
        // Create user agent options
        const options = {
            uri: SIP.UserAgent.makeURI(`sip:${sipUsername}@${sipDomain}`),
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
            
            // Start the user agent
            this.userAgent.start().catch((error) => {
                console.error('Failed to start user agent:', error);
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
        const callerNumber = session.remoteIdentity.uri.user;
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
        if (!this.userAgent || !this.userAgent.isRegistered()) {
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
            // Make the call
            const target = `sip:${number}@${document.getElementById('sipDomain').value}`;
            this.currentSession = this.userAgent.invite(target, inviteOptions);
            
            // Setup session event listeners
            this.setupSessionHandlers(this.currentSession);
            
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
                this.currentSession.accept();
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
                this.currentSession.bye();
            } catch (error) {
                console.error('Error hanging up call:', error);
            }
            this.resetCallState();
        }
    }
    
    setupSessionHandlers(session) {
        // Handle track addition (remote media)
        session.sessionDescriptionHandler.on('trackAdded', () => {
            // Create a new media stream for remote tracks
            const remoteStream = new MediaStream();
            
            // Add remote audio tracks
            const audioTracks = session.sessionDescriptionHandler.remoteMediaStream.getAudioTracks();
            audioTracks.forEach(track => remoteStream.addTrack(track));
            
            // Add remote video tracks
            const videoTracks = session.sessionDescriptionHandler.remoteMediaStream.getVideoTracks();
            videoTracks.forEach(track => remoteStream.addTrack(track));
            
            // Attach to media elements
            if (audioTracks.length > 0) {
                this.elements.remoteAudio.srcObject = remoteStream;
            }
            
            if (videoTracks.length > 0) {
                this.elements.remoteVideo.srcObject = remoteStream;
                this.elements.remoteVideo.style.display = 'block';
            }
        });
        
        // Handle local stream for preview
        session.sessionDescriptionHandler.on('userMedia', (streams) => {
            if (streams && streams.length > 0) {
                this.elements.localVideo.srcObject = streams[0];
                this.elements.localVideo.style.display = 'block';
            }
        });
        
        // Handle session state changes
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
                    
                    // Set up local video preview
                    const localStream = session.sessionDescriptionHandler.localMediaStream;
                    if (localStream && localStream.getVideoTracks().length > 0) {
                        this.elements.localVideo.srcObject = localStream;
                        this.elements.localVideo.style.display = 'block';
                    }
                    break;
                case SIP.SessionState.Terminating:
                    this.updateCallStatus('Terminating...', 'unregistered');
                    break;
                case SIP.SessionState.Terminated:
                    this.updateCallStatus('Call ended', 'unregistered');
                    // Delay reset to show the "Call ended" message
                    setTimeout(() => {
                        this.resetCallState();
                    }, 1000);
                    break;
            }
        });
        
        // Handle call failure
        session.delegate = {
            onReject: (response) => {
                this.updateCallStatus('Call rejected: ' + (response ? response.message.reasonPhrase : 'Unknown reason'), 'unregistered');
                this.resetCallState();
            },
            onProgress: (response) => {
                if (response && response.message && response.message.statusCode === 180) {
                    this.updateCallStatus('Ringing...', 'unregistered');
                }
            }
        };
    }
    
    toggleVideo() {
        this.hasVideo = !this.hasVideo;
        
        if (this.currentSession && this.currentSession.sessionDescriptionHandler) {
            // In a real implementation, we would modify the video tracks
            this.elements.toggleVideoBtn.textContent = this.hasVideo ? 'Disable Video' : 'Enable Video';
            
            if (!this.hasVideo && this.elements.localVideo.srcObject) {
                // Remove video tracks when disabling video
                const videoTracks = this.elements.localVideo.srcObject.getVideoTracks();
                videoTracks.forEach(track => track.stop());
                this.elements.localVideo.style.display = 'none';
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
document.addEventListener('DOMContentLoaded', function() {
    // Set up default values for demo
    document.getElementById('wssServer').value = 'your-asterisk-server.com';
    document.getElementById('sipDomain').value = 'your-asterisk-server.com';
    
    // Initialize the phone
    const phone = new SimpleWebRTCPhone();
    
    // Make the phone globally available for debugging
    window.phone = phone;
});