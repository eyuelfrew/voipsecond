// Ringtone utility for playing incoming call ringtone
let ringtoneAudio = null;
let audioInitialized = false;

/**
 * Initialize audio on user interaction (required by browsers)
 * Call this on any user click/interaction to prepare for playing ringtones
 */
export const initializeAudio = () => {
  if (!audioInitialized) {
    ringtoneAudio = new Audio('/ringtone/Ringtone_1.mp3');
    ringtoneAudio.loop = true;
    ringtoneAudio.volume = 0.7;
    audioInitialized = true;
    console.log('🔔 Audio initialized');
  }

  // If we have an audio context, try to resume it
  if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          console.log('✅ Audio context resumed');
        });
      }
    } catch (e) {
      console.log('Could not resume audio context:', e);
    }
  }

  // Try to preload the audio to avoid delays later - only after user interaction
  try {
    // Mute initially to comply with autoplay policies
    const originalMuted = ringtoneAudio.muted;
    ringtoneAudio.muted = true;
    const playPromise = ringtoneAudio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        // Pause after starting to preload, then reset muted state
        ringtoneAudio.pause();
        ringtoneAudio.muted = originalMuted; // Restore original muted state
        ringtoneAudio.currentTime = 0;
      }).catch(e => {
        console.log('Preload muted audio failed (normal):', e);
        ringtoneAudio.muted = originalMuted; // Restore original muted state
      });
    }
  } catch (e) {
    console.log('Preloading muted audio failed (normal):', e);
  }
};

/**
 * Play the incoming call ringtone
 */
export const playIncomingCallRingtone = () => {
  try {
    // Initialize if not already done
    if (!ringtoneAudio) {
      ringtoneAudio = new Audio('/ringtone/Ringtone_1.mp3');
      ringtoneAudio.loop = true;
      ringtoneAudio.volume = 0.7;
      audioInitialized = true;
    }

    // Check if already playing
    if (!ringtoneAudio.paused) {
      console.log('🔔 Ringtone already playing');
      return;
    }

    // Reset to start if needed
    ringtoneAudio.currentTime = 0;
    // Unmute the audio for actual playback
    ringtoneAudio.muted = false;

    // Play the ringtone
    console.log('🔔 Playing ringtone...');
    const playPromise = ringtoneAudio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('✅ Ringtone playing successfully');
        })
        .catch(error => {
          console.warn('⚠️ Could not play ringtone:', error.message);
          console.warn('💡 This might be due to browser autoplay policies');
          // Try to resume audio context if it exists
          if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            try {
              // Try to resume AudioContext if it exists (for Web Audio API)
              const AudioContext = window.AudioContext || window.webkitAudioContext;
              const audioContext = new AudioContext();
              if (audioContext.state === 'suspended') {
                audioContext.resume();
              }
            } catch (e) {
              console.log('No Web Audio API available or not needed');
            }
          }
        });
    }
  } catch (error) {
    console.error('❌ Error playing ringtone:', error);
  }
};

/**
 * Stop the incoming call ringtone
 */
export const stopIncomingCallRingtone = () => {
  if (ringtoneAudio) {
    console.log('🔕 Stopping ringtone');
    ringtoneAudio.pause();
    ringtoneAudio.currentTime = 0;
  }
};

/**
 * Check if the ringtone is currently playing
 */
export const isRingtonePlaying = () => {
  return ringtoneAudio && !ringtoneAudio.paused;
};