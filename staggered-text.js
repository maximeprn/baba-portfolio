/* ============================================
   STAGGERED TEXT ANIMATION - JavaScript
   Easy Configuration Version
   ============================================ */

// ============================================
// CONFIGURATION - TWEAK THESE VALUES
// ============================================
const STAGGERED_CONFIG = {
    // Text element selector
    textSelector: '.staggered-text',

    // Word spacing and offset
    wordSpacing: 0.3,           // Minimum space between words (em)
    maxOffset: 2.4,             // Maximum horizontal offset (em)

    // Animation timing
    delayRange: 0.3,            // Random delay range per word (0-1)
    lineStagger: 0,             // Line-based delay (0-2, higher = more stagger)

    // Easing
    easingType: 'smoothstep',   // 'linear', 'ease-in', 'ease-out', 'smoothstep', 'elastic', 'back'
    easingPower: 3.0,           // Easing intensity (1-5)

    // Smoothing & Speed
    animationSmoothing: 0.15,   // Text animation lag (0-0.5, higher = more lag)
    animationSpeed: 0.15,       // Animation response speed (0.01-0.5, lower = slower response)
    scrollSmoothing: 0.10,      // Page scroll lag (0.05-0.3, lower = smoother)

    // Animation window (viewport percentages from bottom)
    animationStart: 80,         // Start animating at 80% from bottom
    animationEnd: 20,           // Finish animating at 20% from bottom

    // Static words
    staticWords: 100,             // Percentage of words that don't move (0-100)

    // Enable/disable features
    enableSmoothScroll: true,   // Enable custom smooth scrolling
    enableWordAnimation: true   // Enable word animation
};

// ============================================
// INTERNAL STATE - DON'T MODIFY
// ============================================
let currentScrollY = 0;
let targetScrollY = 0;
const wordStates = new Map();
const animationProgressStates = new Map();
const baseTransforms = {
    0: 0.3,
    1: -0.9,
    2: 1.5,
    3: -2.4,
    4: -0.3,
    5: 1.9,
    6: -1.3,
    7: 0.6
};

// ============================================
// INITIALIZATION
// ============================================
function initStaggeredText() {
    const textElements = document.querySelectorAll(STAGGERED_CONFIG.textSelector);

    textElements.forEach(element => {
        renderText(element);
    });

    if (STAGGERED_CONFIG.enableSmoothScroll) {
        initSmoothScroll();
    }

    if (STAGGERED_CONFIG.enableWordAnimation) {
        startAnimationLoop();
    }
}

// ============================================
// TEXT RENDERING
// ============================================
function renderText(element) {
    const text = element.textContent;
    const words = text.split(' ');
    const factor = STAGGERED_CONFIG.maxOffset / 2.4;

    // Calculate how many words should be static
    const totalWords = words.length;
    const numStaticWords = Math.floor(totalWords * (STAGGERED_CONFIG.staticWords / 100));

    // Create array of indices and shuffle to randomly select static words
    const indices = Array.from({ length: totalWords }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const staticIndices = new Set(indices.slice(0, numStaticWords));

    element.innerHTML = words
        .map((word, index) => {
            const type = Math.floor(Math.random() * 8);
            const delay = Math.random() * STAGGERED_CONFIG.delayRange;
            const isStatic = staticIndices.has(index);

            // Calculate padding based on word type
            let paddingStyle = '';
            const baseSpacing = STAGGERED_CONFIG.wordSpacing;

            switch(type) {
                case 0:
                    paddingStyle = `padding-right: ${(0.4 * factor + baseSpacing).toFixed(2)}em;`;
                    break;
                case 1:
                    paddingStyle = `margin-left: ${(0.3 * factor + baseSpacing).toFixed(2)}em; padding-left: ${(1.2 * factor).toFixed(2)}em; padding-right: ${(0.2 * factor + baseSpacing).toFixed(2)}em;`;
                    break;
                case 2:
                    paddingStyle = `padding-left: ${(0.2 * factor).toFixed(2)}em; padding-right: ${(1.8 * factor + baseSpacing).toFixed(2)}em;`;
                    break;
                case 3:
                    paddingStyle = `margin-left: ${(0.4 * factor + baseSpacing).toFixed(2)}em; padding-left: ${(2.8 * factor).toFixed(2)}em; padding-right: ${(0.3 * factor + baseSpacing).toFixed(2)}em;`;
                    break;
                case 4:
                    paddingStyle = `padding-left: ${(0.5 * factor).toFixed(2)}em; padding-right: ${baseSpacing.toFixed(2)}em;`;
                    break;
                case 5:
                    paddingStyle = `padding-left: ${(0.3 * factor).toFixed(2)}em; padding-right: ${(2.2 * factor + baseSpacing).toFixed(2)}em;`;
                    break;
                case 6:
                    paddingStyle = `margin-left: ${(0.3 * factor + baseSpacing).toFixed(2)}em; padding-left: ${(1.6 * factor).toFixed(2)}em; padding-right: ${(0.2 * factor + baseSpacing).toFixed(2)}em;`;
                    break;
                case 7:
                    paddingStyle = `padding-right: ${(0.9 * factor + baseSpacing).toFixed(2)}em;`;
                    break;
            }

            return `<span class="word word-${type}" data-delay="${delay}" data-static="${isStatic}" style="${paddingStyle}">${word} </span>`;
        })
        .join('');
}

// ============================================
// SMOOTH SCROLL
// ============================================
function initSmoothScroll() {
    // Wrap content
    const wrapper = document.createElement('div');
    wrapper.id = 'smooth-scroll-wrapper';
    while (document.body.firstChild) {
        wrapper.appendChild(document.body.firstChild);
    }
    document.body.appendChild(wrapper);

    // Smooth scroll loop
    function smoothScrollLoop() {
        currentScrollY += (targetScrollY - currentScrollY) * STAGGERED_CONFIG.scrollSmoothing;
        wrapper.style.transform = `translateY(-${currentScrollY}px)`;
        requestAnimationFrame(smoothScrollLoop);
    }

    // Wheel event
    window.addEventListener('wheel', (e) => {
        e.preventDefault();
        targetScrollY += e.deltaY;

        const maxScroll = document.body.scrollHeight - window.innerHeight;
        targetScrollY = Math.max(0, Math.min(targetScrollY, maxScroll));
    }, { passive: false });

    smoothScrollLoop();
}

// ============================================
// ANIMATION
// ============================================
function updateScrollAnimation() {
    const textElements = document.querySelectorAll(STAGGERED_CONFIG.textSelector);

    textElements.forEach(textDisplay => {
        const rect = textDisplay.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        const animationStart = windowHeight * (STAGGERED_CONFIG.animationStart / 100);
        const animationEnd = windowHeight * (STAGGERED_CONFIG.animationEnd / 100);
        const animationRange = animationStart - animationEnd;

        const words = textDisplay.querySelectorAll('.word');
        words.forEach((word, index) => {
            // Skip animation for static words
            const isStatic = word.getAttribute('data-static') === 'true';
            if (isStatic) {
                word.style.transform = 'translateX(0)';
                return;
            }

            const wordRect = word.getBoundingClientRect();
            const wordCenter = wordRect.top + wordRect.height / 2;

            // Calculate relative position
            const relativePosition = (wordCenter - rect.top) / rect.height;

            // Line stagger extension
            const staggerExtension = STAGGERED_CONFIG.lineStagger * (1 - relativePosition) * animationRange;

            // Base progress
            let baseProgress = Math.max(0, Math.min(1, (animationStart - wordCenter + staggerExtension) / animationRange));

            // Apply word delay
            const wordDelay = parseFloat(word.getAttribute('data-delay')) || 0;
            const targetProgress = Math.max(0, Math.min(1, (baseProgress - wordDelay) / (1 - wordDelay)));

            // Interpolate animation progress independently from scroll speed
            const wordKey = word.textContent + index;
            if (!animationProgressStates.has(wordKey)) {
                animationProgressStates.set(wordKey, targetProgress);
            }

            const currentProgress = animationProgressStates.get(wordKey);
            const wordProgress = currentProgress + (targetProgress - currentProgress) * STAGGERED_CONFIG.animationSpeed;
            animationProgressStates.set(wordKey, wordProgress);

            // Apply easing
            const easedProgress = applyEasing(wordProgress);

            // Calculate target offset
            const type = parseInt(word.className.match(/word-(\d)/)[1]);
            const factor = STAGGERED_CONFIG.maxOffset / 2.4;
            const originalOffset = (baseTransforms[type] || 0) * factor;
            const targetOffset = originalOffset * (1 - easedProgress);

            // Apply smoothing
            const wordKey = word.textContent + index;
            if (!wordStates.has(wordKey)) {
                wordStates.set(wordKey, targetOffset);
            }

            const currentOffset = wordStates.get(wordKey);
            const newOffset = currentOffset + (targetOffset - currentOffset) * (1 - STAGGERED_CONFIG.animationSmoothing);
            wordStates.set(wordKey, newOffset);

            word.style.transform = `translateX(${newOffset}em)`;
        });
    });
}

function applyEasing(progress) {
    const power = STAGGERED_CONFIG.easingPower;

    switch(STAGGERED_CONFIG.easingType) {
        case 'linear':
            return progress;

        case 'ease-in':
            return Math.pow(progress, power);

        case 'ease-out':
            return 1 - Math.pow(1 - progress, power);

        case 'elastic':
            if (progress === 0 || progress === 1) return progress;
            const amplitude = 0.1 * power;
            const period = 0.3;
            return 1 - (Math.pow(2, -10 * progress) * Math.sin((progress - period / 4) * (2 * Math.PI) / period) * amplitude + Math.pow(2, -10 * progress));

        case 'back':
            const s = 1.70158 * (power / 3);
            return progress * progress * ((s + 1) * progress - s);

        case 'smoothstep':
        default:
            if (power <= 2) {
                return progress * progress * (3 - 2 * progress);
            } else {
                return progress * progress * progress * (progress * (progress * 6 - 15) + 10);
            }
    }
}

function startAnimationLoop() {
    function loop() {
        updateScrollAnimation();
        requestAnimationFrame(loop);
    }
    loop();
}

// ============================================
// AUTO-INITIALIZE ON DOM READY
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStaggeredText);
} else {
    initStaggeredText();
}
