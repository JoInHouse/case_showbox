# ProcessingButton Component

A reusable, animated button component with an SVG processing indicator. Features smooth GSAP animations with DrawSVG plugin for a professional loading effect.

## Features

- ✅ **Reusable** - Clean component-based architecture
- ✅ **Customizable** - Configure labels, icons, and callbacks
- ✅ **Animated** - Smooth GSAP DrawSVG + rotation animations
- ✅ **Lightweight** - Minimal dependencies (GSAP + DrawSVGPlugin)
- ✅ **Easy to integrate** - Simple API with extensive examples

## Demo

- **Main Demo**: [DynamicProcessIndicatingButton.html](DynamicProcessIndicatingButton.html)
- **Usage Examples**: [example-usage.html](example-usage.html)

## Quick Start

### 1. Include Dependencies

```html
<!-- GSAP Core -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/gsap.min.js"></script>
<!-- DrawSVG Plugin -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/DrawSVGPlugin.min.js"></script>
```

### 2. Include Component Files

```html
<!-- Component styles -->
<link rel="stylesheet" href="ProcessingButton.css">
<!-- Component script -->
<script src="ProcessingButton.js"></script>
```

### 3. Create Button Element

```html
<div id="myButton"></div>
```

### 4. Initialize Component

```javascript
document.addEventListener("DOMContentLoaded", () => {
    gsap.registerPlugin(DrawSVGPlugin);

    const button = new ProcessingButton(document.getElementById('myButton'));
});
```

## Usage Examples

### Basic Usage (Auto-toggle on click)

```javascript
const button = new ProcessingButton(document.getElementById('myButton'));
```

### Custom Configuration

```javascript
const button = new ProcessingButton(element, {
    label: 'Generate Report',
    defaultIcon: 'img/icon.svg',
    endIcon: 'img/arrow.svg',
    autoToggle: true,
    onStart: (btn) => {
        console.log('Processing started');
        // Your async operation here
    },
    onStop: (btn) => {
        console.log('Processing stopped');
    }
});
```

### Manual Control

```javascript
const button = new ProcessingButton(element, {
    autoToggle: false  // Disable auto-toggle
});

// Control manually
button.start();   // Start animation
button.stop();    // Stop animation
button.toggle();  // Toggle state
```

### Programmatic Updates

```javascript
// Check if processing
if (button.isActive()) {
    console.log('Button is processing');
}

// Update label
button.setLabel('New Label');

// Clean up
button.destroy();
```

## API Reference

### Constructor

```javascript
new ProcessingButton(element, options)
```

**Parameters:**
- `element` (HTMLElement) - The DOM element to convert into a processing button
- `options` (Object) - Configuration options

**Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `label` | string | `'Analysis for me'` | Button label text |
| `defaultIcon` | string | `'img/GenAI.svg'` | Path to default icon |
| `endIcon` | string | `'img/Arrow-down.svg'` | Path to end icon |
| `autoToggle` | boolean | `true` | Auto-toggle on click |
| `onStart` | function | `null` | Callback when animation starts |
| `onStop` | function | `null` | Callback when animation stops |

### Methods

#### `start()`
Start the processing animation.

```javascript
button.start();
```

#### `stop()`
Stop the processing animation.

```javascript
button.stop();
```

#### `toggle()`
Toggle between processing and idle states.

```javascript
button.toggle();
```

#### `isActive()`
Check if button is currently processing.

```javascript
const isProcessing = button.isActive(); // returns boolean
```

#### `setLabel(newLabel)`
Update the button label text.

```javascript
button.setLabel('Processing...');
```

#### `destroy()`
Clean up and destroy the component.

```javascript
button.destroy();
```

## File Structure

```
SVGAnimation/
├── ProcessingButton.js          # Component logic
├── ProcessingButton.css         # Component styles
├── DynamicProcessIndicatingButton.html  # Main demo
├── example-usage.html           # Usage examples
└── README.md                    # This file
```

## Browser Support

- Modern browsers with ES6 support
- Tested on Chrome, Firefox, Safari, Edge

## Dependencies

- **GSAP 3.x** - Animation library
- **DrawSVGPlugin** - GSAP plugin for SVG stroke animations (Premium plugin - trial available)

## License

Free to use for personal and commercial projects.

## Notes

- **DrawSVG Plugin**: This is a premium GSAP plugin. The CDN version works for testing, but for production, you may need a [GreenSock Club membership](https://greensock.com/club/).
- **Icons**: Make sure to provide valid paths for `defaultIcon` and `endIcon` options.

## Advanced Usage

### Multiple Buttons

```javascript
const buttons = ['button1', 'button2', 'button3'].map((id) => {
    return new ProcessingButton(document.getElementById(id), {
        label: `Task ${id}`
    });
});
```

### Async Operations

```javascript
const button = new ProcessingButton(element, {
    autoToggle: false,
    onStart: async (btn) => {
        try {
            const result = await fetchData();
            console.log('Success:', result);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            btn.stop();
        }
    }
});

// Trigger
button.start();
```

### Integration with Forms

```javascript
const form = document.getElementById('myForm');
const submitButton = new ProcessingButton(
    document.getElementById('submitBtn'),
    { autoToggle: false }
);

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitButton.start();

    try {
        await submitForm(new FormData(form));
        alert('Success!');
    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        submitButton.stop();
    }
});
```

## Support

For issues or questions, please open an issue in the repository.
