/**
 * ProcessingButton Component
 * A reusable animated button component with processing indicator
 *
 * Dependencies: GSAP 3.x, DrawSVGPlugin
 *
 * @example
 * // Basic usage
 * const button = new ProcessingButton(document.getElementById('myButton'));
 *
 * @example
 * // With custom options
 * const button = new ProcessingButton(element, {
 *     label: 'Custom Label',
 *     defaultIcon: 'path/to/icon.svg',
 *     endIcon: 'path/to/arrow.svg',
 *     autoToggle: true,
 *     onStart: (btn) => console.log('Processing started'),
 *     onStop: (btn) => console.log('Processing stopped')
 * });
 *
 * @example
 * // Manual control
 * const button = new ProcessingButton(element, { autoToggle: false });
 * button.start();  // Start animation
 * button.stop();   // Stop animation
 */
class ProcessingButton {
    static counter = 0;

    /**
     * Create a new ProcessingButton
     * @param {HTMLElement} element - The DOM element to convert into a processing button
     * @param {Object} options - Configuration options
     * @param {string} options.defaultIcon - Path to default icon (default: 'img/GenAI.svg')
     * @param {string} options.endIcon - Path to end icon (default: 'img/Arrow-down.svg')
     * @param {string} options.label - Button label text (default: 'Analysis for me')
     * @param {boolean} options.autoToggle - Auto-toggle on click (default: true)
     * @param {Function} options.onStart - Callback when animation starts
     * @param {Function} options.onStop - Callback when animation stops
     */
    constructor(element, options = {}) {
        if (!element) {
            throw new Error('ProcessingButton requires a valid DOM element');
        }

        this.element = element;
        this.options = {
            defaultIcon: options.defaultIcon || 'img/GenAI.svg',
            endIcon: options.endIcon || 'img/Arrow-down.svg',
            label: options.label || 'Analysis for me',
            autoToggle: options.autoToggle !== false,
            onStart: options.onStart || null,
            onStop: options.onStop || null,
            ...options
        };

        this.id = `processing-btn-${++ProcessingButton.counter}`;
        this.isProcessing = false;
        this.timeline = null;

        this.init();
    }

    /**
     * Generate the processing SVG template
     * @param {string} uniqueId - Unique identifier for clip-path
     * @returns {string} SVG markup
     */
    static getProcessingSVG(uniqueId) {
        return `
            <svg class="icon-processing" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 14 14" fill="none">
                <g clip-path="url(#clip_${uniqueId})">
                    <path d="M9.11538 4.5H4.88462C4.6722 4.5 4.5 4.6722 4.5 4.88462V9.11538C4.5 9.32781 4.6722 9.5 4.88462 9.5H9.11538C9.32781 9.5 9.5 9.32781 9.5 9.11538V4.88462C9.5 4.6722 9.32781 4.5 9.11538 4.5Z" fill="#4A526B"/>
                    <circle class="animatedCircle" cx="7" cy="7" r="6" stroke="#4A526B" stroke-width="1" fill="none"/>
                </g>
                <defs>
                    <clipPath id="clip_${uniqueId}">
                        <rect width="14" height="14" fill="white"/>
                    </clipPath>
                </defs>
            </svg>
        `;
    }

    /**
     * Initialize the button with HTML and animation
     * @private
     */
    init() {
        // Add button class if not present
        if (!this.element.classList.contains('button')) {
            this.element.classList.add('button');
        }

        // Build button HTML
        this.element.innerHTML = `
            <img class="icon-default" src="${this.options.defaultIcon}" alt="default icon" />
            ${ProcessingButton.getProcessingSVG(this.id)}
            ${this.options.label}
            ${this.options.endIcon ? `<img src="${this.options.endIcon}" alt="end icon" />` : ''}
        `;

        // Setup animation
        this.setupAnimation();

        // Setup click handler
        if (this.options.autoToggle) {
            this.element.addEventListener('click', () => this.toggle());
        }
    }

    /**
     * Setup GSAP animation timeline
     * @private
     */
    setupAnimation() {
        if (!window.gsap || !window.DrawSVGPlugin) {
            console.error('ProcessingButton requires GSAP and DrawSVGPlugin to be loaded');
            return;
        }

        const circle = this.element.querySelector('.animatedCircle');
        if (!circle) {
            console.error('ProcessingButton: Could not find animated circle element');
            return;
        }

        this.timeline = gsap.timeline({
            repeat: -1,
            paused: true
        });

        this.timeline
            .fromTo(circle,
                {
                    drawSVG: "0% 0%",
                    transformOrigin: "center center"
                },
                {
                    drawSVG: "0% 100%",
                    duration: 1,
                    ease: "power2.inOut"
                }
            )
            .to(circle, {
                drawSVG: "100% 100%",
                duration: 1,
                ease: "power2.inOut"
            })
            .to(circle, {
                rotation: "+=360",
                duration: 2,
                ease: "linear"
            }, 0);
    }

    /**
     * Start processing animation
     * @public
     */
    start() {
        if (this.isProcessing) return;

        this.isProcessing = true;
        this.element.classList.add('processing');
        if (this.timeline) {
            this.timeline.play();
        }

        if (this.options.onStart) {
            this.options.onStart(this);
        }
    }

    /**
     * Stop processing animation
     * @public
     */
    stop() {
        if (!this.isProcessing) return;

        this.isProcessing = false;
        this.element.classList.remove('processing');
        if (this.timeline) {
            this.timeline.pause();
        }

        if (this.options.onStop) {
            this.options.onStop(this);
        }
    }

    /**
     * Toggle processing state
     * @public
     */
    toggle() {
        if (this.isProcessing) {
            this.stop();
        } else {
            this.start();
        }
    }

    /**
     * Check if button is currently processing
     * @returns {boolean}
     */
    isActive() {
        return this.isProcessing;
    }

    /**
     * Update button label
     * @param {string} newLabel - New label text
     */
    setLabel(newLabel) {
        this.options.label = newLabel;
        // Find text node and update it
        const textNode = Array.from(this.element.childNodes).find(
            node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()
        );
        if (textNode) {
            textNode.textContent = newLabel;
        }
    }

    /**
     * Destroy the component and cleanup
     * @public
     */
    destroy() {
        if (this.timeline) {
            this.timeline.kill();
            this.timeline = null;
        }
        this.element.innerHTML = '';
        this.element.classList.remove('button', 'processing');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProcessingButton;
}
