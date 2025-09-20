
import debugLogger from './debugLogger.js';

export default class SoundManager {
    constructor(scene) {
        this.scene = scene;
        this.audioContext = null;
        this.masterVolume = 0.3;
        this.musicVolume = 0.15; // Lower volume for background music
        this.backgroundMusic = null;
        this.musicPlaying = false;
        
        // Load MP3 background music
        this.loadBackgroundMusic();
        
        // Initialize Web Audio API (for sound effects)
        this.initializeAudio();
        
        // Create backup sound system
        this.createBackupSound();
        
        // Start 90s-style background music after user interaction (required for Web Audio)
        this.musicStarted = false;
        
        // Enhanced music trigger system
        const startMusic = () => {
            console.log('🎵 Music trigger activated!', {
                musicStarted: this.musicStarted,
                audioContext: !!this.audioContext,
                contextState: this.audioContext?.state
            });
            
            if (!this.musicStarted && this.backgroundMusic) {
                console.log('🎵 Starting Lambada Bossa background music...');
                this.startBackgroundMusic();
                this.musicStarted = true;
            }
        };
        
        // Listen for various user interactions with better debugging
        this.scene.input.on('pointerdown', () => {
            console.log('👆 Pointer down detected');
            startMusic();
        });
        
        if (this.scene.input.keyboard) {
            this.scene.input.keyboard.on('keydown', () => {
                console.log('⌨️ Key down detected');
                startMusic();
            });
        }
        
        // Try to start music when game actually starts
        this.scene.time.delayedCall(3000, () => {
            if (!this.musicStarted) {
                console.log('🎵 Auto-starting music after delay...');
                startMusic();
            }
        });
    }

    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🎵 Audio context created:', this.audioContext.state);
        } catch (error) {
            console.error('❌ Web Audio API not supported:', error);
            debugLogger.warn('Web Audio API not supported:', error);
        }
    }

    loadBackgroundMusic() {
        try {
            // Create HTML5 Audio element for background music
            this.backgroundMusic = new Audio('./lambada-bossa-279769.mp3');
            this.backgroundMusic.loop = true;
            this.backgroundMusic.volume = this.musicVolume;
            this.backgroundMusic.preload = 'auto';
            
            // Add event listeners
            this.backgroundMusic.addEventListener('loadeddata', () => {
                console.log('🎵 Background music loaded successfully!');
            });
            
            this.backgroundMusic.addEventListener('error', (e) => {
                console.error('❌ Error loading background music:', e);
            });
            
            this.backgroundMusic.addEventListener('canplaythrough', () => {
                console.log('🎵 Background music ready to play!');
            });
            
        } catch (error) {
            console.error('❌ Failed to load background music:', error);
        }
    }

    createBackupSound() {
        // Simple backup beep for testing
        this.backupBeep = () => {
            console.log('🔊 BEEP! (Backup sound system)');
            // Visual feedback when sound plays
            if (this.scene && this.scene.cameras && this.scene.cameras.main) {
                this.scene.cameras.main.flash(100, 255, 255, 0, false);
            }
        };
    }

    // Ensure audio context is running (required for mobile)
    resumeAudio() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Generate a tone with specified frequency, duration, and wave type
    createTone(frequency, duration, waveType = 'sine', volume = 1) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = waveType;
        
        // Volume envelope
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume * this.masterVolume, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    // Play MP3 background music
    startBackgroundMusic() {
        if (!this.backgroundMusic || this.musicPlaying) return;
        
        try {
            console.log('🎵 Starting Lambada Bossa background music...');
            this.backgroundMusic.currentTime = 0;
            this.backgroundMusic.play();
            this.musicPlaying = true;
            console.log('🎵 Lambada Bossa music started successfully!');
        } catch (error) {
            console.error('❌ Failed to start background music:', error);
            // Fallback to backup system
            this.backupBeep();
            this.musicPlaying = true;
        }
    }
    
    playClassicMelody(melody) {
        let noteIndex = 0;
        let currentTime = 0;
        
        const playNextNote = () => {
            if (!this.musicPlaying) return;
            
            const currentNote = melody[noteIndex % melody.length];
            
            // Play the note (skip if it's a rest/pause)
            if (currentNote.note > 0) {
                this.createTone(
                    currentNote.note, 
                    currentNote.duration * 0.9, 
                    'square', 
                    this.musicVolume * 0.8
                );
            }
            
            noteIndex++;
            currentTime += currentNote.duration;
            
            // Loop the melody when it ends
            if (noteIndex >= melody.length) {
                noteIndex = 0;
                // Add a longer pause between loops
                setTimeout(playNextNote, (currentNote.duration + 0.8) * 1000);
            } else {
                // Schedule next note
                setTimeout(playNextNote, currentNote.duration * 1000);
            }
        };
        
        // Start the melody immediately
        playNextNote();
    }
    
    stopBackgroundMusic() {
        if (this.backgroundMusic && !this.backgroundMusic.paused) {
            try {
                this.backgroundMusic.pause();
                console.log('🎵 Lambada Bossa music stopped');
            } catch (error) {
                console.error('❌ Error stopping background music:', error);
            }
        }
        this.musicPlaying = false;
    }
    
    toggleMusic() {
        console.log('🎵 Music toggle requested!', {
            currentlyPlaying: this.musicPlaying,
            musicStarted: this.musicStarted,
            backgroundMusic: !!this.backgroundMusic,
            musicPaused: this.backgroundMusic?.paused
        });
        
        if (this.musicPlaying) {
            this.stopBackgroundMusic();
        } else {
            // Use HTML5 Audio for MP3 playback
            if (this.backgroundMusic) {
                this.startBackgroundMusic();
                this.musicStarted = true;
            } else {
                // Fallback: Use backup sound system
                console.log('🎵 Using backup sound system - MP3 not loaded');
                this.backupBeep();
                this.musicPlaying = true;
            }
        }
        
        console.log('🎵 Music toggle result:', this.musicPlaying);
        return this.musicPlaying;
    }

    // Play explosion sound for obstacle collisions
    playExplosion() {
        if (!this.audioContext) return;
        
        this.resumeAudio();
        
        // Create a dramatic explosion sound with multiple components
        const now = this.audioContext.currentTime;
        
        // Low frequency boom
        this.createTone(60, 0.5, 'sawtooth', 0.8);
        
        // Mid frequency crash
        setTimeout(() => {
            this.createTone(150, 0.3, 'square', 0.6);
        }, 50);
        
        // High frequency sizzle
        setTimeout(() => {
            this.createTone(800, 0.2, 'sawtooth', 0.4);
        }, 100);
        
        // Add some noise burst for realistic explosion
        setTimeout(() => {
            this.createTone(400, 0.15, 'triangle', 0.3);
        }, 150);
        
        console.log('💥 Explosion sound played!');
    }

    // Create chord (multiple tones at once)
    createChord(frequencies, duration, waveType = 'sine', volume = 1) {
        frequencies.forEach(freq => {
            this.createTone(freq, duration, waveType, volume * 0.7);
        });
    }

    // Play 1st place fanfare - triumphant melody
    playFirstPlaceFanfare() {
        this.resumeAudio();
        
        const melody = [
            { freq: 523, duration: 0.2, delay: 0 },     // C5
            { freq: 659, duration: 0.2, delay: 0.2 },   // E5
            { freq: 784, duration: 0.2, delay: 0.4 },   // G5
            { freq: 1047, duration: 0.4, delay: 0.6 },  // C6
            { freq: 784, duration: 0.2, delay: 1.0 },   // G5
            { freq: 1047, duration: 0.6, delay: 1.2 }   // C6 (held)
        ];

        melody.forEach(note => {
            setTimeout(() => {
                this.createTone(note.freq, note.duration, 'triangle', 0.8);
            }, note.delay * 1000);
        });

        // Add harmony
        setTimeout(() => {
            this.createChord([523, 659, 784], 0.8, 'sine', 0.4);
        }, 1200);

        // Screen shake on final note
        setTimeout(() => {
            this.scene.cameras.main.shake(200, 0.008);
        }, 1200);
    }

    // Play 2nd place celebration - uplifting cheer
    playSecondPlaceCheer() {
        this.resumeAudio();
        
        const melody = [
            { freq: 392, duration: 0.15, delay: 0 },    // G4
            { freq: 523, duration: 0.15, delay: 0.15 }, // C5
            { freq: 659, duration: 0.15, delay: 0.3 },  // E5
            { freq: 784, duration: 0.3, delay: 0.45 },  // G5
            { freq: 659, duration: 0.2, delay: 0.75 },  // E5
            { freq: 784, duration: 0.4, delay: 0.95 }   // G5 (held)
        ];

        melody.forEach(note => {
            setTimeout(() => {
                this.createTone(note.freq, note.duration, 'triangle', 0.7);
            }, note.delay * 1000);
        });

        // Add celebration chord
        setTimeout(() => {
            this.createChord([392, 523, 659], 0.5, 'sine', 0.3);
        }, 950);
    }

    // Play 3rd place celebration - encouraging tune
    playThirdPlaceCheer() {
        this.resumeAudio();
        
        const melody = [
            { freq: 349, duration: 0.2, delay: 0 },     // F4
            { freq: 440, duration: 0.2, delay: 0.2 },   // A4
            { freq: 523, duration: 0.2, delay: 0.4 },   // C5
            { freq: 659, duration: 0.4, delay: 0.6 },   // E5
            { freq: 523, duration: 0.3, delay: 1.0 }    // C5
        ];

        melody.forEach(note => {
            setTimeout(() => {
                this.createTone(note.freq, note.duration, 'sawtooth', 0.6);
            }, note.delay * 1000);
        });

        // Add supporting harmony
        setTimeout(() => {
            this.createChord([349, 440, 523], 0.4, 'sine', 0.25);
        }, 1000);
    }

    // Play general high score ding - pleasant notification
    playHighScoreDing() {
        this.resumeAudio();
        
        // Multi-layered ding sound
        setTimeout(() => {
            this.createTone(800, 0.1, 'sine', 0.6);
            this.createTone(1200, 0.08, 'triangle', 0.4);
        }, 0);

        setTimeout(() => {
            this.createTone(1000, 0.12, 'sine', 0.5);
            this.createTone(1600, 0.1, 'triangle', 0.3);
        }, 100);

        setTimeout(() => {
            this.createTone(1200, 0.15, 'sine', 0.4);
        }, 200);
    }

    // Play achievement unlock sound
    playAchievementUnlock() {
        this.resumeAudio();
        
        const sparkleNotes = [
            { freq: 1047, duration: 0.1, delay: 0 },
            { freq: 1319, duration: 0.1, delay: 0.1 },
            { freq: 1568, duration: 0.1, delay: 0.2 },
            { freq: 2093, duration: 0.2, delay: 0.3 }
        ];

        sparkleNotes.forEach(note => {
            setTimeout(() => {
                this.createTone(note.freq, note.duration, 'triangle', 0.5);
            }, note.delay * 1000);
        });
    }

    // Play power-up collection sound
    playPowerUpCollect() {
        this.resumeAudio();
        
        this.createTone(440, 0.1, 'square', 0.4);
        setTimeout(() => {
            this.createTone(660, 0.1, 'square', 0.4);
        }, 80);
        setTimeout(() => {
            this.createTone(880, 0.15, 'triangle', 0.3);
        }, 160);
    }

    // Play bean collection sound with pitch variation
    playBeanCollect() {
        this.resumeAudio();
        
        // Random pitch variation for variety
        const basePitch = 800;
        const pitchVariation = (Math.random() - 0.5) * 100; // ±50Hz
        const frequency = basePitch + pitchVariation;
        
        this.createTone(frequency, 0.08, 'sine', 0.3);
        
        // Add a subtle harmonic
        this.createTone(frequency * 1.5, 0.06, 'triangle', 0.15);
    }

    // Play obstacle hit sound
    playObstacleHit() {
        this.resumeAudio();
        
        // Harsh impact sound
        this.createTone(150, 0.1, 'sawtooth', 0.6);
        setTimeout(() => {
            this.createTone(100, 0.15, 'square', 0.4);
        }, 50);
    }

    // Play shield block sound
    playShieldBlock() {
        this.resumeAudio();
        
        // Metallic clang
        this.createTone(300, 0.08, 'triangle', 0.5);
        this.createTone(450, 0.06, 'sawtooth', 0.3);
        setTimeout(() => {
            this.createTone(600, 0.1, 'sine', 0.2);
        }, 40);
    }
    
    // Play dash sound
    playDash() {
        this.resumeAudio();
        
        // Whoosh effect
        this.createTone(200, 0.15, 'sawtooth', 0.4);
        setTimeout(() => {
            this.createTone(300, 0.1, 'sawtooth', 0.3);
        }, 50);
        setTimeout(() => {
            this.createTone(400, 0.08, 'triangle', 0.2);
        }, 100);
    }

    // Play leaderboard ranking sound based on position
    playRankingSound(position) {
        if (position === 1) {
            this.playFirstPlaceFanfare();
        } else if (position === 2) {
            this.playSecondPlaceCheer();
        } else if (position === 3) {
            this.playThirdPlaceCheer();
        } else {
            this.playHighScoreDing();
        }
    }

    // Set master volume (0.0 to 1.0)
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    // Get current volume
    getVolume() {
        return this.masterVolume;
    }
    
    // Dynamic music system for enhanced gameplay
    playDynamicTone(baseFreq, combo = 1) {
        if (!this.audioContext) return;
        
        // Increase pitch and intensity based on combo
        const frequency = baseFreq + (combo * 20);
        const volume = Math.min(0.3 + (combo * 0.02), 0.6);
        
        this.createTone(frequency, 0.15, 'sine', volume);
    }
    
    playEventMusic(eventType) {
        if (!this.audioContext) return;
        
        const eventSounds = {
            'rushHour': [523.25, 659.25, 783.99], // C-E-G chord (energetic)
            'goldenHour': [440, 554.37, 659.25], // A-C#-E chord (magical)
            'stormMode': [261.63, 311.13, 369.99], // Lower, ominous chord
            'speedFrenzy': [880, 1108.73, 1318.51], // High energy chord
            'baristaBonus': [349.23, 415.30, 493.88] // F-G#-B chord (warm)
        };
        
        const chord = eventSounds[eventType] || [440, 554.37, 659.25];
        
        // Play chord progression
        chord.forEach((freq, index) => {
            setTimeout(() => {
                this.createTone(freq, 0.4, 'triangle', 0.3);
            }, index * 100);
        });
    }
    
    playComboMusic(comboCount) {
        if (!this.audioContext) return;
        
        // Rising musical scale for combo milestones
        const scale = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25];
        const noteIndex = Math.min(Math.floor(comboCount / 5), scale.length - 1);
        
        if (noteIndex >= 0) {
            this.playDynamicTone(scale[noteIndex], comboCount);
            
            // Add harmony for higher combos
            if (comboCount >= 10) {
                setTimeout(() => {
                    this.createTone(scale[noteIndex] * 1.25, 0.12, 'triangle', 0.2);
                }, 50);
            }
        }
    }
    
    // Enhanced power-up sound
    playPowerUp() {
        this.resumeAudio();
        
        // Sparkly ascending sound
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, index) => {
            setTimeout(() => {
                this.createTone(freq, 0.15, 'triangle', 0.4);
            }, index * 80);
        });
    }

    // Button click sound
    playButtonClick() {
        this.resumeAudio();
        
        // Pleasant UI click sound
        this.createTone(600, 0.05, 'sine', 0.4);
        setTimeout(() => {
            this.createTone(800, 0.08, 'triangle', 0.3);
        }, 30);
    }
    
    // Enhanced explosion sound for bomb obstacles - HERO explosion
    playExplosion() {
        this.resumeAudio();
        
        // Create an initial pre-explosion rumble
        this.createTone(30, 0.3, 'sawtooth', 0.5); // Lower, stronger rumble
        this.createTone(20, 0.8, 'sawtooth', 0.4); // Even lower bass rumble
        
        // Create the primary explosion blast - heavier and with more layers
        setTimeout(() => {
            // Multiple layers for a richer explosion sound
            this.createTone(80, 0.2, 'square', 0.7); // Low boom
            this.createTone(120, 0.15, 'square', 0.65); // Mid boom
            this.createTone(180, 0.1, 'square', 0.6); // High boom
            
            // Add primary explosion sound
            this.createTone(200, 0.2, 'square', 0.8); // Main blast - louder
            this.createTone(100, 0.4, 'square', 0.7); // Sustain
            
            // Add secondary explosion effects after delay
            setTimeout(() => {
                // Create secondary explosion burst
                this.createTone(250, 0.15, 'square', 0.6);
                this.createTone(150, 0.25, 'square', 0.5);
                
                // Add more layers of debris sounds
                setTimeout(() => {
                    // Multiple debris layers at different frequencies
                    this.createTone(950, 0.06, 'square', 0.3); // Higher debris
                    this.createTone(800, 0.08, 'square', 0.25); 
                    this.createTone(700, 0.09, 'square', 0.2);
                    this.createTone(600, 0.1, 'square', 0.15);
                    this.createTone(500, 0.12, 'square', 0.1);
                    
                    // Add some crackling sounds for lingering effect
                    setTimeout(() => {
                        for (let i = 0; i < 5; i++) {
                            setTimeout(() => {
                                const freq = 300 + Math.random() * 700;
                                const duration = 0.03 + Math.random() * 0.05;
                                this.createTone(freq, duration, 'square', 0.1);
                            }, i * 70);
                        }
                    }, 200);
                }, 100);
            }, 150);
        }, 50);
        
        // Add a final rumble for aftermath
        setTimeout(() => {
            this.createTone(50, 1.0, 'sine', 0.3); // Long, deep aftermath rumble
        }, 400);
    }
}


