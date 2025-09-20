// SVG Asset Manager for Coffee Runner
// Professional vector graphics to replace emoji-based assets

export default class SVGAssets {
    constructor() {
        this.assets = {
            // Player Character - now loaded as PNG directly
            
            // Coffee items
            coffeeBean: () => this.createCoffeeCup(),
            
            // Smoothies - now loaded as PNG directly
            
            // Bagels (will use coffeeBean with tints)
            bagel: () => this.createBagel(),
            
            // Power-ups
            croissantShieldPowerUp: () => this.createShieldPowerUp(),
            espressoShot: () => this.createSpeedBoost(),
            websterPowerUp: () => this.createScoreMultiplier(),
            thaboPowerUp: () => this.createTimeSlow(),
            magnetPowerUp: () => this.createMagnet(),
            healthPowerUp: () => this.createHealth(),
            
            // Bird Companions
            sparrowCompanion: () => this.createSparrowFriend(),
            robinCompanion: () => this.createRobinFriend(),
            cardinalCompanion: () => this.createCardinalFriend(),
            
            // Fixed Environmental Obstacles
            tree: () => this.createTree(),
            building: () => this.createBuilding(),
            pipe: () => this.createPipe(),
            mountain: () => this.createMountain(),
            cloud: () => this.createCloud(),
            
            // Old obstacles (keeping for compatibility)
            spilledCoffeeCup: () => this.createSpilledCoffee(),
            brokenCoffeeMachine: () => this.createBrokenMachine(),
            angryCustomer: () => this.createAngryCustomer(),
            wiFiDeadZone: () => this.createWiFiDeadZone()
        };
    }

    // Create SVG texture from SVG string
    createSVGTexture(scene, key, svgString, width = 128, height = 128) {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Create an image from the SVG
        const img = new Image();
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        return new Promise((resolve, reject) => {
            img.onload = () => {
                ctx.drawImage(img, 0, 0, width, height);
                scene.textures.addCanvas(key, canvas);
                URL.revokeObjectURL(url);
                resolve();
            };
            img.onerror = reject;
            img.src = url;
        });
    }


    // Coffee Cup (base for coffee items)
    createCoffeeCup() {
        // Replace old cup with a sleek coffee bean icon from SVG Repo.
        return `<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M8.5581 18.9099C8.60311 19.618 7.89062 20.1044 7.35055 19.6442C5.16871 17.785 4.45172 13.9899 5.48237 10.1435C6.58272 6.03694 9.32065 3.19731 12.3564 3.03964C12.8886 3.01201 13.2769 3.51632 13.3582 4.04291C13.4204 4.44576 13.5161 4.85313 13.5603 5.21401C13.7317 6.61365 13.3786 8.02025 12.5667 9.17223L9.72895 13.1983C8.8171 14.492 8.37643 16.052 8.4768 17.6309L8.5581 18.9099ZM15.5137 3.49628C15.5292 3.4222 15.6073 3.42901 15.6758 3.46102C18.6989 4.87234 19.6518 9.19062 18.4644 13.622C17.4013 17.5896 14.8115 20.3743 11.8982 20.7007C11.2742 20.7706 10.8213 20.091 10.7733 19.4649C10.7197 18.7664 10.5516 18.0113 10.5174 17.4732C10.4353 16.1814 10.7958 14.9051 11.5419 13.8466L14.3796 9.82049C15.372 8.41251 15.8035 6.69334 15.5941 4.98266C15.4754 4.01337 15.484 3.63885 15.5137 3.49628Z" fill="#9E623B" stroke="#2F2118" stroke-width="0.96"/>
</svg>`;
    }


    // Bagel (base for bagel items)
    createBagel() {
        // Replace simple donut with a detailed bagel illustration from SVG Repo.
        return `<svg width="800px" height="800px" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--noto" preserveAspectRatio="xMidYMid meet"><path d="M94.23 68.55s27.81-5.46 29.13 5.04c.77 6.19-1.17 17.57-11.65 26.92c-8.7 7.76-23.24 14.29-47.23 13.85c-19.55-.35-32.85-5.04-41.88-10.23C7.48 95.44 4.49 83.66 5.28 76.27c1.13-10.6 18.12-15.46 18.89-15.9l70.06 8.18z" fill="#f1b34f"></path><path d="M7.32 79.1s16.04 26.62 57.78 26.76c45.19.16 59-26.83 58.25-32.28C121.93 63.13 97.85 61 97.85 61L40.39 74.54L7.32 70.91v8.19z" fill="#fadfb1"></path><path d="M7.49 69.47s-2.6 3.12-2.14 9.07c.41 5.28 5.37 13.06 14.04 15.87c7.67 2.49 13.3-.37 21.24 2.2s15.26 10.37 25.39 9.76s15.51-7.85 22.82-8.91c10.98-1.59 16.23 1.36 24.53-6.83c9.15-9.03 9.2-17.44 9.15-19.53c-.1-4.22-3.09-6.5-3.09-6.5L18.65 68.29L7.49 69.47z" fill="#ffffff"></path><radialGradient id="IconifyId17ecdb2904d178eab5779" cx="64.214" cy="44.095" r="65.576" gradientTransform="matrix(1 -.00654 .00426 .652 -.186 15.766)" gradientUnits="userSpaceOnUse"><stop offset=".162" stop-color="#f1b14a"></stop><stop offset=".169" stop-color="#f1b049"></stop><stop offset=".37" stop-color="#e89825"></stop><stop offset=".535" stop-color="#e28810"></stop><stop offset=".642" stop-color="#e08308"></stop><stop offset=".713" stop-color="#e1860d"></stop><stop offset=".792" stop-color="#e5901b"></stop><stop offset=".877" stop-color="#eba031"></stop><stop offset=".947" stop-color="#f1b14a"></stop></radialGradient><path d="M64.64 13.48C25 13.48 5.14 34.21 3.58 57.85c-.6 9.1 2.36 15.06 8.81 20.74c11.26 9.9 31.81 16.1 53.04 16.33c22.75.25 40.01-5.51 53.22-22.94c4.31-5.68 4.78-8.91 4.96-15.23c.55-19.82-17.28-43.27-58.97-43.27z" fill="url(#IconifyId17ecdb2904d178eab5779)"></path></svg>`;
    }

    // Shield Power-up
    createShieldPowerUp() {
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="shieldGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:#87CEEB;stop-opacity:0.8" />
                    <stop offset="100%" style="stop-color:#4169E1;stop-opacity:1" />
                </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="38" fill="url(#shieldGlow)"/>
            <circle cx="50" cy="50" r="32" fill="#6495ED"/>
            <circle cx="50" cy="50" r="25" fill="#87CEEB" opacity="0.9"/>
            <!-- Shield pattern -->
            <path d="M50,25 L65,40 L65,65 L50,75 L35,65 L35,40 Z" fill="#B0E0E6" opacity="0.7"/>
            <!-- Shine effects -->
            <circle cx="45" cy="40" r="3" fill="#E0F6FF"/>
            <circle cx="58" cy="35" r="2" fill="#E0F6FF"/>
            <circle cx="62" cy="55" r="2.5" fill="#E0F6FF"/>
            <circle cx="40" cy="60" r="2" fill="#E0F6FF"/>
        </svg>`;
    }

    // Speed Boost Power-up - Enhanced for vertical movement
    createSpeedBoost() {
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="speedGlow" cx="50%" cy="30%" r="60%">
                    <stop offset="0%" style="stop-color:#FFFF99;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#FFD700;stop-opacity:1" />
                </radialGradient>
                <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#FF4500;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#FF8C00;stop-opacity:1" />
                </linearGradient>
            </defs>
            <!-- Circular power-up background -->
            <circle cx="50" cy="50" r="35" fill="url(#speedGlow)"/>
            <circle cx="50" cy="50" r="30" fill="#FFFF99"/>
            
            <!-- Vertical speed indicators - arrows pointing up and down -->
            <polygon points="50,15 60,30 53,30 53,48 47,48 47,30 40,30" fill="url(#arrowGrad)">
                <!-- Animation for up arrow -->
                <animate attributeName="opacity" values="1;0.7;1" dur="0.8s" repeatCount="indefinite"/>
            </polygon>
            
            <polygon points="50,85 40,70 47,70 47,52 53,52 53,70 60,70" fill="url(#arrowGrad)">
                <!-- Animation for down arrow -->
                <animate attributeName="opacity" values="0.7;1;0.7" dur="0.8s" repeatCount="indefinite"/>
            </polygon>
            
            <!-- Center espresso symbol -->
            <circle cx="50" cy="50" r="12" fill="#8B4513"/>
            <circle cx="50" cy="50" r="10" fill="#A0522D"/>
            <ellipse cx="50" cy="46" rx="6" ry="4" fill="#D2B48C"/>
            
            <!-- Speed streaks -->
            <path d="M35,35 L30,30" stroke="#FFD700" stroke-width="2" stroke-linecap="round">
                <animate attributeName="stroke-width" values="1;3;1" dur="0.5s" repeatCount="indefinite"/>
            </path>
            <path d="M65,35 L70,30" stroke="#FFD700" stroke-width="2" stroke-linecap="round">
                <animate attributeName="stroke-width" values="1;3;1" dur="0.5s" repeatCount="indefinite" begin="0.1s"/>
            </path>
            <path d="M35,65 L30,70" stroke="#FFD700" stroke-width="2" stroke-linecap="round">
                <animate attributeName="stroke-width" values="1;3;1" dur="0.5s" repeatCount="indefinite" begin="0.2s"/>
            </path>
            <path d="M65,65 L70,70" stroke="#FFD700" stroke-width="2" stroke-linecap="round">
                <animate attributeName="stroke-width" values="1;3;1" dur="0.5s" repeatCount="indefinite" begin="0.3s"/>
            </path>
        </svg>`;
    }

    // Score Multiplier Power-up
    createScoreMultiplier() {
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="multiplierGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:#FFB6C1;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#FF1493;stop-opacity:1" />
                </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="35" fill="url(#multiplierGlow)"/>
            <circle cx="50" cy="50" r="28" fill="#FF6347"/>
            <!-- Multiplier symbol -->
            <path d="M30,30 Q50,10 70,30 Q50,50 70,70 Q50,90 30,70 Q50,50 30,30" fill="#FFB6C1" opacity="0.7"/>
            <circle cx="50" cy="50" r="18" fill="#FF1493"/>
            <!-- 2X text -->
            <text x="50" y="58" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#FFFFFF" text-anchor="middle">2X</text>
            <!-- Sparkles -->
            <circle cx="35" cy="35" r="1.5" fill="#FFFF99"/>
            <circle cx="65" cy="35" r="1.2" fill="#FFFF99"/>
            <circle cx="35" cy="65" r="1.8" fill="#FFFF99"/>
            <circle cx="65" cy="65" r="1.3" fill="#FFFF99"/>
        </svg>`;
    }

    // Time Slow Power-up
    createTimeSlow() {
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="timeGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:#DA70D6;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#4B0082;stop-opacity:1" />
                </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="38" fill="url(#timeGlow)"/>
            <circle cx="50" cy="50" r="32" fill="#8A2BE2"/>
            <!-- Clock face -->
            <circle cx="50" cy="50" r="25" fill="#9932CC"/>
            <circle cx="50" cy="50" r="20" fill="#DA70D6"/>
            <!-- Clock hands -->
            <line x1="50" y1="50" x2="50" y2="35" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
            <line x1="50" y1="50" x2="62" y2="50" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>
            <!-- Hour markers -->
            <circle cx="50" cy="32" r="1.5" fill="#FFFF99"/>
            <circle cx="68" cy="50" r="1.5" fill="#FFFF99"/>
            <circle cx="50" cy="68" r="1.5" fill="#FFFF99"/>
            <circle cx="32" cy="50" r="1.5" fill="#FFFF99"/>
            <!-- Center dot -->
            <circle cx="50" cy="50" r="3" fill="#FFD700"/>
        </svg>`;
    }

    // Magnet Power-up
    createMagnet() {
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="magnetGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:#FF69B4;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#FF1493;stop-opacity:1" />
                </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="38" fill="url(#magnetGlow)" opacity="0.8"/>
            <!-- Magnet shape -->
            <rect x="35" y="40" width="30" height="20" rx="8" fill="#DC143C"/>
            <!-- Magnet poles -->
            <circle cx="40" cy="50" r="10" fill="#FF6347"/>
            <circle cx="60" cy="50" r="10" fill="#4169E1"/>
            <!-- Pole labels -->
            <text x="40" y="55" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#FFFFFF" text-anchor="middle">N</text>
            <text x="60" y="55" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#FFFFFF" text-anchor="middle">S</text>
            <!-- Magnetic field lines -->
            <path d="M25,35 Q50,20 75,35" stroke="#FFD700" stroke-width="1.5" fill="none" opacity="0.7"/>
            <path d="M25,65 Q50,80 75,65" stroke="#FFD700" stroke-width="1.5" fill="none" opacity="0.7"/>
            <path d="M20,50 Q30,30 40,40" stroke="#FFD700" stroke-width="1" fill="none" opacity="0.5"/>
            <path d="M80,50 Q70,30 60,40" stroke="#FFD700" stroke-width="1" fill="none" opacity="0.5"/>
        </svg>`;
    }

    // Health Power-up
    createHealth() {
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="healthGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:#FFB6C1;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#DC143C;stop-opacity:1" />
                </radialGradient>
            </defs>
            <!-- Heart shape -->
            <path d="M50,25 C45,15 30,15 30,35 C30,55 50,75 50,75 C50,75 70,55 70,35 C70,15 55,15 50,25 Z" fill="url(#healthGlow)"/>
            <path d="M50,30 C46,22 35,22 35,37 C35,52 50,68 50,68 C50,68 65,52 65,37 C65,22 54,22 50,30 Z" fill="#FF6347"/>
            <!-- Heart shine -->
            <circle cx="45" cy="35" r="3" fill="#FFB6C1"/>
            <circle cx="52" cy="40" r="2" fill="#FFB6C1"/>
            <circle cx="48" cy="50" r="1.5" fill="#FFB6C1"/>
            <!-- Plus symbol -->
            <rect x="47" y="32" width="6" height="2" fill="#FFFFFF"/>
            <rect x="49" y="30" width="2" height="6" fill="#FFFFFF"/>
        </svg>`;
    }

    // Sparrow Friend Companion
    createSparrowFriend() {
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="sparrowBody" cx="50%" cy="40%" r="60%">
                    <stop offset="0%" style="stop-color:#DEB887;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#8B4513;stop-opacity:1" />
                </radialGradient>
            </defs>
            <ellipse cx="52" cy="85" rx="15" ry="6" fill="#654321" opacity="0.2"/>
            <!-- Body -->
            <ellipse cx="50" cy="60" rx="12" ry="18" fill="url(#sparrowBody)"/>
            <!-- Head -->
            <circle cx="50" cy="35" r="14" fill="url(#sparrowBody)"/>
            <!-- Wings -->
            <ellipse cx="38" cy="55" rx="6" ry="12" fill="#654321" transform="rotate(-20 38 55)"/>
            <ellipse cx="62" cy="55" rx="6" ry="12" fill="#654321" transform="rotate(20 62 55)"/>
            <!-- Eyes -->
            <circle cx="46" cy="32" r="3" fill="#FFFFFF"/>
            <circle cx="54" cy="32" r="3" fill="#FFFFFF"/>
            <circle cx="46" cy="32" r="2" fill="#2C1810"/>
            <circle cx="54" cy="32" r="2" fill="#2C1810"/>
            <circle cx="47" cy="31" r="0.5" fill="#FFFFFF"/>
            <circle cx="55" cy="31" r="0.5" fill="#FFFFFF"/>
            <!-- Beak -->
            <polygon points="50,38 48,42 52,42" fill="#FFB347"/>
            <!-- Tail -->
            <ellipse cx="50" cy="78" rx="4" ry="8" fill="#654321"/>
            <!-- Collection aura -->
            <circle cx="50" cy="50" r="35" fill="none" stroke="#FFD700" stroke-width="1" stroke-dasharray="3,3" opacity="0.5"/>
        </svg>`;
    }

    // Robin Friend Companion
    createRobinFriend() {
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="robinBody" cx="50%" cy="40%" r="60%">
                    <stop offset="0%" style="stop-color:#FF6347;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#FF4500;stop-opacity:1" />
                </radialGradient>
            </defs>
            <ellipse cx="52" cy="85" rx="16" ry="6" fill="#8B0000" opacity="0.2"/>
            <!-- Body -->
            <ellipse cx="50" cy="60" rx="13" ry="19" fill="url(#robinBody)"/>
            <!-- Head -->
            <circle cx="50" cy="35" r="15" fill="url(#robinBody)"/>
            <!-- Wings -->
            <ellipse cx="37" cy="55" rx="7" ry="13" fill="#8B0000" transform="rotate(-20 37 55)"/>
            <ellipse cx="63" cy="55" rx="7" ry="13" fill="#8B0000" transform="rotate(20 63 55)"/>
            <!-- Chest -->
            <ellipse cx="50" cy="55" rx="8" ry="12" fill="#FFB347"/>
            <!-- Eyes -->
            <circle cx="45" cy="32" r="3.2" fill="#FFFFFF"/>
            <circle cx="55" cy="32" r="3.2" fill="#FFFFFF"/>
            <circle cx="45" cy="32" r="2.2" fill="#2C1810"/>
            <circle cx="55" cy="32" r="2.2" fill="#2C1810"/>
            <circle cx="46" cy="31" r="0.6" fill="#FFFFFF"/>
            <circle cx="56" cy="31" r="0.6" fill="#FFFFFF"/>
            <!-- Beak -->
            <polygon points="50,38 47,43 53,43" fill="#FFB347"/>
            <!-- Tail -->
            <ellipse cx="50" cy="79" rx="5" ry="9" fill="#8B0000"/>
            <!-- Collection aura -->
            <circle cx="50" cy="50" r="40" fill="none" stroke="#FFD700" stroke-width="1.5" stroke-dasharray="4,2" opacity="0.6"/>
        </svg>`;
    }

    // Cardinal Friend Companion
    createCardinalFriend() {
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="cardinalBody" cx="50%" cy="40%" r="60%">
                    <stop offset="0%" style="stop-color:#FF6347;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#DC143C;stop-opacity:1" />
                </radialGradient>
            </defs>
            <ellipse cx="52" cy="85" rx="17" ry="6" fill="#8B0000" opacity="0.2"/>
            <!-- Body -->
            <ellipse cx="50" cy="60" rx="14" ry="20" fill="url(#cardinalBody)"/>
            <!-- Head -->
            <circle cx="50" cy="35" r="16" fill="url(#cardinalBody)"/>
            <!-- Crest -->
            <polygon points="50,18 45,28 50,25 55,28" fill="#8B0000"/>
            <!-- Wings -->
            <ellipse cx="36" cy="55" rx="8" ry="14" fill="#8B0000" transform="rotate(-20 36 55)"/>
            <ellipse cx="64" cy="55" rx="8" ry="14" fill="#8B0000" transform="rotate(20 64 55)"/>
            <!-- Eyes -->
            <circle cx="44" cy="32" r="3.5" fill="#FFFFFF"/>
            <circle cx="56" cy="32" r="3.5" fill="#FFFFFF"/>
            <circle cx="44" cy="32" r="2.5" fill="#2C1810"/>
            <circle cx="56" cy="32" r="2.5" fill="#2C1810"/>
            <circle cx="45" cy="31" r="0.8" fill="#FFFFFF"/>
            <circle cx="57" cy="31" r="0.8" fill="#FFFFFF"/>
            <!-- Beak -->
            <polygon points="50,38 46,44 54,44" fill="#FFB347"/>
            <!-- Tail -->
            <ellipse cx="50" cy="80" rx="6" ry="10" fill="#8B0000"/>
            <!-- Premium collection aura -->
            <circle cx="50" cy="50" r="45" fill="none" stroke="#FFD700" stroke-width="2" stroke-dasharray="5,3" opacity="0.7"/>
            <circle cx="50" cy="50" r="38" fill="none" stroke="#FF1493" stroke-width="1" stroke-dasharray="2,2" opacity="0.4"/>
        </svg>`;
    }

    // Spilled Coffee Obstacle
    createSpilledCoffee() {
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="55" cy="88" rx="25" ry="8" fill="#8B4513" opacity="0.4"/>
            <!-- Spilled coffee puddle -->
            <ellipse cx="55" cy="80" rx="22" ry="12" fill="#654321"/>
            <ellipse cx="50" cy="78" rx="18" ry="10" fill="#8B4513"/>
            <ellipse cx="48" cy="76" rx="15" ry="8" fill="#D2691E"/>
            <!-- Fallen cup -->
            <g transform="rotate(-60 40 40)">
                <rect x="30" y="35" width="20" height="25" rx="3" fill="#8B4513"/>
                <ellipse cx="40" cy="36" rx="9" ry="2" fill="#654321"/>
                <path d="M50,43 Q54,40 58,43 Q54,50 50,47" fill="#654321"/>
            </g>
            <!-- Splash droplets -->
            <circle cx="25" cy="70" r="2" fill="#D2691E"/>
            <circle cx="75" cy="82" r="1.5" fill="#D2691E"/>
            <circle cx="35" cy="85" r="1" fill="#8B4513"/>
            <circle cx="65" cy="70" r="1.2" fill="#8B4513"/>
        </svg>`;
    }

    // Broken Coffee Machine Obstacle
    createBrokenMachine() {
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="machineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#708090;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#2F4F4F;stop-opacity:1" />
                </linearGradient>
            </defs>
            <!-- Machine body -->
            <rect x="20" y="30" width="60" height="55" rx="5" fill="url(#machineGrad)"/>
            <rect x="25" y="35" width="50" height="45" rx="3" fill="#696969"/>
            
            <!-- Screen (cracked) -->
            <rect x="35" y="40" width="30" height="15" fill="#000000"/>
            <rect x="37" y="42" width="26" height="11" fill="#1C1C1C"/>
            <!-- Crack lines -->
            <path d="M40,45 L45,50 L50,47 L55,52" stroke="#FF0000" stroke-width="1" fill="none"/>
            <path d="M50,43 L52,48 L48,51" stroke="#FF0000" stroke-width="0.5" fill="none"/>
            
            <!-- Coffee dispenser (dripping) -->
            <rect x="45" y="65" width="10" height="8" fill="#2F4F4F"/>
            <circle cx="50" cy="75" r="3" fill="#1C1C1C"/>
            
            <!-- Error indicators -->
            <circle cx="30" cy="45" r="2" fill="#FF0000"/>
            <circle cx="70" cy="45" r="2" fill="#FF0000"/>
            
            <!-- Smoke/steam -->
            <circle cx="40" cy="25" r="3" fill="#808080" opacity="0.4"/>
            <circle cx="50" cy="20" r="4" fill="#808080" opacity="0.3"/>
            <circle cx="60" cy="25" r="3" fill="#808080" opacity="0.4"/>
            
            <!-- Warning sign -->
            <polygon points="50,12 55,22 45,22" fill="#FFD700" stroke="#FF0000" stroke-width="1"/>
            <text x="50" y="20" font-family="Arial" font-size="8" fill="#000000" text-anchor="middle">!</text>
        </svg>`;
    }

    // Angry Customer Obstacle
    createAngryCustomer() {
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="customerBody" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:#FFB6C1;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#FF69B4;stop-opacity:1" />
                </radialGradient>
            </defs>
            
            <!-- Shadow -->
            <ellipse cx="50" cy="88" rx="18" ry="6" fill="#000000" opacity="0.2"/>
            
            <!-- Body -->
            <ellipse cx="50" cy="65" rx="18" ry="22" fill="url(#customerBody)"/>
            
            <!-- Head -->
            <circle cx="50" cy="35" r="20" fill="#FDBCB4"/>
            
            <!-- Angry eyebrows -->
            <path d="M35,25 L45,30" stroke="#8B0000" stroke-width="3" stroke-linecap="round"/>
            <path d="M65,25 L55,30" stroke="#8B0000" stroke-width="3" stroke-linecap="round"/>
            
            <!-- Eyes (angry) -->
            <circle cx="42" cy="33" r="2" fill="#000000"/>
            <circle cx="58" cy="33" r="2" fill="#000000"/>
            
            <!-- Mouth (shouting) -->
            <ellipse cx="50" cy="43" rx="8" ry="5" fill="#8B0000"/>
            <rect x="46" y="42" width="8" height="2" fill="#FFFFFF"/>
            
            <!-- Arms (gesturing) -->
            <ellipse cx="32" cy="55" rx="5" ry="15" fill="#FDBCB4" transform="rotate(-30 32 55)"/>
            <ellipse cx="68" cy="55" rx="5" ry="15" fill="#FDBCB4" transform="rotate(30 68 55)"/>
            
            <!-- Anger symbols -->
            <text x="25" y="20" font-family="Arial" font-size="12" fill="#FF0000">💢</text>
            <text x="65" y="20" font-family="Arial" font-size="12" fill="#FF0000">💢</text>
            
            <!-- Coffee cup (throwing) -->
            <g transform="rotate(45 75 25)">
                <rect x="70" y="20" width="10" height="12" rx="2" fill="#8B4513"/>
                <ellipse cx="75" cy="21" rx="4" ry="1" fill="#654321"/>
            </g>
            
            <!-- Motion lines -->
            <path d="M80,30 L85,35" stroke="#FF0000" stroke-width="2" opacity="0.6"/>
            <path d="M82,25 L87,28" stroke="#FF0000" stroke-width="2" opacity="0.6"/>
        </svg>`;
    }

    // WiFi Dead Zone Obstacle
    createWiFiDeadZone() {
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="deadZone" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:#FF0000;stop-opacity:0.3" />
                    <stop offset="100%" style="stop-color:#8B0000;stop-opacity:0.1" />
                </radialGradient>
            </defs>
            
            <!-- Dead zone area -->
            <circle cx="50" cy="50" r="40" fill="url(#deadZone)"/>
            
            <!-- WiFi symbol (broken) -->
            <path d="M30,40 Q50,25 70,40" stroke="#696969" stroke-width="3" fill="none" opacity="0.5"/>
            <path d="M35,48 Q50,35 65,48" stroke="#696969" stroke-width="3" fill="none" opacity="0.5"/>
            <path d="M40,56 Q50,45 60,56" stroke="#696969" stroke-width="3" fill="none" opacity="0.5"/>
            
            <!-- X marks over WiFi -->
            <path d="M35,35 L65,65" stroke="#FF0000" stroke-width="4" stroke-linecap="round"/>
            <path d="M65,35 L35,65" stroke="#FF0000" stroke-width="4" stroke-linecap="round"/>
            
            <!-- Warning indicators -->
            <circle cx="50" cy="70" r="3" fill="#FF0000"/>
            
            <!-- Glitch effects -->
            <rect x="25" y="45" width="15" height="2" fill="#FF0000" opacity="0.6"/>
            <rect x="60" y="50" width="12" height="2" fill="#FF0000" opacity="0.6"/>
            <rect x="45" y="55" width="10" height="2" fill="#FF0000" opacity="0.6"/>
            
            <!-- No signal text -->
            <text x="50" y="85" font-family="Arial" font-size="8" fill="#FF0000" text-anchor="middle" font-weight="bold">NO SIGNAL</text>
        </svg>`;
    }
    
    // Fixed Environmental Obstacles
    
    // Tree obstacle
    createTree() {
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="treeGrad" cx="50%" cy="40%" r="60%">
                    <stop offset="0%" style="stop-color:#32CD32;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#228B22;stop-opacity:1" />
                </radialGradient>
            </defs>
            
            <!-- Tree trunk -->
            <rect x="45" y="70" width="10" height="25" fill="#8B4513"/>
            <rect x="43" y="68" width="14" height="4" fill="#A0522D"/>
            
            <!-- Tree foliage -->
            <circle cx="50" cy="60" r="25" fill="url(#treeGrad)"/>
            <circle cx="40" cy="50" r="18" fill="url(#treeGrad)" opacity="0.8"/>
            <circle cx="60" cy="50" r="18" fill="url(#treeGrad)" opacity="0.8"/>
            <circle cx="50" cy="40" r="20" fill="url(#treeGrad)"/>
            
            <!-- Texture details -->
            <circle cx="45" cy="55" r="3" fill="#228B22" opacity="0.6"/>
            <circle cx="55" cy="45" r="4" fill="#228B22" opacity="0.6"/>
            <circle cx="52" cy="62" r="2" fill="#228B22" opacity="0.6"/>
        </svg>`;
    }
    
    // Building obstacle
    createBuilding() {
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="buildingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#696969;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#2F4F4F;stop-opacity:1" />
                </linearGradient>
            </defs>
            
            <!-- Building base -->
            <rect x="20" y="30" width="60" height="65" fill="url(#buildingGrad)"/>
            
            <!-- Windows -->
            <rect x="30" y="40" width="8" height="10" fill="#FFD700"/>
            <rect x="45" y="40" width="8" height="10" fill="#FFD700"/>
            <rect x="62" y="40" width="8" height="10" fill="#87CEEB"/>
            
            <rect x="30" y="60" width="8" height="10" fill="#87CEEB"/>
            <rect x="45" y="60" width="8" height="10" fill="#FFD700"/>
            <rect x="62" y="60" width="8" height="10" fill="#FFD700"/>
            
            <rect x="30" y="80" width="8" height="10" fill="#FFD700"/>
            <rect x="45" y="80" width="8" height="10" fill="#87CEEB"/>
            <rect x="62" y="80" width="8" height="10" fill="#FFD700"/>
            
            <!-- Building details -->
            <rect x="20" y="25" width="60" height="8" fill="#4F4F4F"/>
            <rect x="15" y="30" width="5" height="65" fill="#2F4F4F"/>
            <rect x="80" y="30" width="5" height="65" fill="#2F4F4F"/>
        </svg>`;
    }
    
    // Pipe obstacle
    createPipe() {
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="pipeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#32CD32;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#228B22;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#006400;stop-opacity:1" />
                </linearGradient>
            </defs>
            
            <!-- Pipe body -->
            <rect x="35" y="10" width="30" height="80" fill="url(#pipeGrad)"/>
            
            <!-- Pipe caps -->
            <rect x="30" y="10" width="40" height="8" fill="#228B22"/>
            <rect x="30" y="82" width="40" height="8" fill="#228B22"/>
            
            <!-- Pipe details -->
            <rect x="40" y="15" width="20" height="3" fill="#006400"/>
            <rect x="40" y="25" width="20" height="3" fill="#006400"/>
            <rect x="40" y="35" width="20" height="3" fill="#006400"/>
            <rect x="40" y="45" width="20" height="3" fill="#006400"/>
            <rect x="40" y="55" width="20" height="3" fill="#006400"/>
            <rect x="40" y="65" width="20" height="3" fill="#006400"/>
            <rect x="40" y="75" width="20" height="3" fill="#006400"/>
            
            <!-- Highlights -->
            <rect x="37" y="12" width="3" height="76" fill="#90EE90" opacity="0.7"/>
        </svg>`;
    }
    
    // Mountain obstacle
    createMountain() {
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="mountainGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" style="stop-color:#8B4513;stop-opacity:1" />
                    <stop offset="70%" style="stop-color:#A0522D;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#D2B48C;stop-opacity:1" />
                </linearGradient>
            </defs>
            
            <!-- Mountain shape -->
            <polygon points="10,90 30,40 50,20 70,35 90,90" fill="url(#mountainGrad)"/>
            
            <!-- Snow cap -->
            <polygon points="45,25 50,20 55,25 52,30 48,30" fill="#FFFFFF"/>
            
            <!-- Mountain details -->
            <polygon points="25,60 35,45 45,70 30,75" fill="#654321" opacity="0.6"/>
            <polygon points="65,55 75,45 85,75 70,70" fill="#654321" opacity="0.6"/>
            
            <!-- Rocks -->
            <circle cx="20" cy="80" r="3" fill="#2F4F4F"/>
            <circle cx="80" cy="85" r="2.5" fill="#2F4F4F"/>
            <circle cx="40" cy="85" r="2" fill="#2F4F4F"/>
        </svg>`;
    }
    
    // Cloud obstacle
    createCloud() {
        return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="cloudGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#E6E6FA;stop-opacity:1" />
                </radialGradient>
            </defs>
            
            <!-- Cloud shape -->
            <circle cx="25" cy="50" r="15" fill="url(#cloudGrad)"/>
            <circle cx="40" cy="45" r="18" fill="url(#cloudGrad)"/>
            <circle cx="55" cy="45" r="16" fill="url(#cloudGrad)"/>
            <circle cx="70" cy="50" r="14" fill="url(#cloudGrad)"/>
            <circle cx="50" cy="55" r="20" fill="url(#cloudGrad)"/>
            
            <!-- Cloud highlights -->
            <circle cx="35" cy="42" r="3" fill="#FFFFFF" opacity="0.8"/>
            <circle cx="55" cy="40" r="4" fill="#FFFFFF" opacity="0.8"/>
            <circle cx="45" cy="52" r="2.5" fill="#FFFFFF" opacity="0.8"/>
            
            <!-- Cloud shadow -->
            <ellipse cx="50" cy="65" rx="25" ry="8" fill="#D3D3D3" opacity="0.3"/>
        </svg>`;
    }
}
