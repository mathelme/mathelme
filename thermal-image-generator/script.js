document.addEventListener('DOMContentLoaded', function() {
    // Initialize canvas and context
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    
    // Initialize DOM elements
    const imageUpload = document.getElementById("imageUpload");
    const loadingOverlay = document.querySelector('.loading-overlay');
    const uploadContainer = document.querySelector('.upload-container');
    const uploadButton = document.getElementById('uploadButton');
    const uploadAnotherButton = document.getElementById('uploadAnotherButton');
    const saveButton = document.getElementById('saveButton');
    const toggleOriginalButton = document.getElementById('toggleOriginal');
    const colorSchemeSelect = document.getElementById('colorScheme');
    const reverseColorsCheckbox = document.getElementById('reverseColors');
    const blurRange = document.getElementById('blurRange');
    const noiseRange = document.getElementById('noiseRange');
    const contrastRange = document.getElementById('contrastRange');
    const ditherRange = document.getElementById('ditherRange');

    // State variables
    let baseImage = null;
    let isShowingOriginal = false;
    
    // Set initial canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Hide buttons initially
    uploadAnotherButton.classList.add('hidden');
    saveButton.classList.add('hidden');
    toggleOriginalButton.classList.add('hidden');

    // Initialize upload button
    uploadContainer.querySelector('.btn').addEventListener('click', () => {
        imageUpload.click();
    });

    // Initialize upload another button
    uploadAnotherButton.addEventListener('click', () => {
        imageUpload.click();
    });

    // Initialize range value indicators
    document.querySelectorAll('.range-field input[type="range"]').forEach(range => {
        const valueDisplay = range.nextElementSibling;
        valueDisplay.textContent = range.value;
        
        range.addEventListener('input', () => {
            valueDisplay.textContent = range.value;
        });
    });

    // Handle file upload
    imageUpload.addEventListener('change', handleFileUpload);

    // Handle Updates
    document.querySelectorAll("input, select").forEach((control) => {
        control.addEventListener("input", () => {
            console.log('Control changed:', control.id, control.value);
            if (baseImage && !isShowingOriginal) {
                drawCanvas();
            }
        });
    });

    // Function to draw the canvas
    function drawCanvas() {
        if (!baseImage) {
            console.log('No base image loaded');
            return;
        }
        
        console.log('Starting drawCanvas');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw base image
        ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
        
        // Get current values
        const activeScheme = document.querySelector('.chip-item.active')?.dataset.value || 'earth';
        const isReversed = document.getElementById('reverseColors').checked;
        const blurAmount = parseFloat(document.getElementById('blurRange').value);
        const noiseAmount = parseFloat(document.getElementById('noiseRange').value);
        const contrastAmount = parseFloat(document.getElementById('contrastRange').value);
        const ditherAmount = parseFloat(document.getElementById('ditherRange').value);
        
        console.log('Effect values:', {
            activeScheme,
            isReversed,
            blurAmount,
            noiseAmount,
            contrastAmount,
            ditherAmount
        });
        
        // Create a temporary canvas for effects
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Copy current canvas to temp
        tempCtx.drawImage(canvas, 0, 0);
        
        try {
            // Apply effects in order
            if (blurAmount > 0) {
                console.log('Applying blur effect');
                tempCtx.filter = `blur(${blurAmount}px)`;
                tempCtx.drawImage(tempCanvas, 0, 0);
                tempCtx.filter = 'none';
            }
            
            if (noiseAmount > 0) {
                console.log('Applying noise effect');
                applyNoise(tempCtx, noiseAmount);
            }

            if (contrastAmount !== 100) {
                console.log('Applying contrast effect');
                applyContrast(tempCtx, contrastAmount);
            }

            if (ditherAmount > 0) {
                console.log('Applying dither effect');
                applyDither(tempCtx, ditherAmount);
            }
            
            // Apply color effect last
            console.log('Applying color effect');
            applyColorEffect(tempCtx, activeScheme, isReversed);
            
            // Draw final result back to main canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(tempCanvas, 0, 0);
            
            console.log('Canvas drawing completed successfully');
        } catch (error) {
            console.error('Error applying effects:', error);
        }
    }

    // Function to handle file upload
    function handleFileUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                baseImage = new Image();
                baseImage.onload = () => {
                    // Calculate dimensions to fit within container while maintaining aspect ratio
                    const containerWidth = canvas.width * 0.9;  // 90% of canvas width
                    const containerHeight = canvas.height * 0.9; // 90% of canvas height
                    
                    // Calculate scale to fit the container (use min to prevent cropping)
                    const scaleX = containerWidth / baseImage.width;
                    const scaleY = containerHeight / baseImage.height;
                    const scale = Math.min(scaleX, scaleY);
                    
                    // Calculate dimensions that will fit the container
                    const scaledWidth = baseImage.width * scale;
                    const scaledHeight = baseImage.height * scale;
                    
                    // Set canvas size to match scaled image
                    canvas.width = scaledWidth;
                    canvas.height = scaledHeight;
                    
                    // Hide upload container and show action buttons
                    uploadContainer.style.display = 'none';
                    uploadAnotherButton.classList.remove('hidden');
                    saveButton.classList.remove('hidden');
                    toggleOriginalButton.classList.remove('hidden');
                    
                    // Draw the image
                    drawCanvas();
                };
                baseImage.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    // Add toggle button handler
    toggleOriginalButton.addEventListener('click', () => {
        if (!baseImage) return;
        
        if (isShowingOriginal) {
            // Show processed image
            isShowingOriginal = false;
            toggleOriginalButton.innerHTML = '<i class="material-icons">visibility</i>Show Original';
            drawCanvas();
        } else {
            // Show original image
            isShowingOriginal = true;
            toggleOriginalButton.innerHTML = '<i class="material-icons">visibility_off</i>Hide Original';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
        }
    });

    // Function to generate descriptive filename
    function generateFilename() {
        const activeScheme = document.querySelector('.chip-item.active')?.dataset.value || 'none';
        const blurAmount = parseFloat(document.getElementById('blurRange').value);
        const noiseAmount = parseFloat(document.getElementById('noiseRange').value);
        const contrastAmount = parseFloat(document.getElementById('contrastRange').value);
        const ditherAmount = parseFloat(document.getElementById('ditherRange').value);
        const isReversed = document.getElementById('reverseColors').checked;
        
        let filename = 'processed_image';
        
        // Add color scheme
        if (activeScheme !== 'none') {
            filename += `_${activeScheme}`;
            if (isReversed) filename += '_reversed';
        }
        
        // Add effect values if they're not at default
        if (blurAmount > 0) filename += `_blur${blurAmount}`;
        if (noiseAmount > 0) filename += `_noise${noiseAmount}`;
        if (contrastAmount !== 100) filename += `_contrast${contrastAmount}`;
        if (ditherAmount > 0) filename += `_dither${ditherAmount}`;
        
        // Add timestamp to ensure unique filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        filename += `_${timestamp}`;
        
        return filename;
    }

    // Save button click handler
    saveButton.addEventListener('click', () => {
        const filename = generateFilename();
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    // Add click handlers for color scheme chips
    document.querySelectorAll('.chip-item').forEach(chip => {
        chip.addEventListener('click', () => {
            // Remove active class from all chips
            document.querySelectorAll('.chip-item').forEach(c => c.classList.remove('active'));
            // Add active class to clicked chip
            chip.classList.add('active');
            // Redraw canvas with new scheme
            if (baseImage && !isShowingOriginal) {
                drawCanvas();
            }
        });
    });

    // Effect functions
    function applyContrast(ctx, amount) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Convert percentage to factor
        const factor = (259 * (amount + 255)) / (255 * (259 - amount));
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = factor * (data[i] - 128) + 128;     // R
            data[i + 1] = factor * (data[i + 1] - 128) + 128; // G
            data[i + 2] = factor * (data[i + 2] - 128) + 128; // B
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    function applyNoise(ctx, amount) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * amount;
            data[i] += noise;     // R
            data[i + 1] += noise; // G
            data[i + 2] += noise; // B
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    function applyColorEffect(ctx, scheme, isReversed) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // If scheme is "none", return without applying any color effect
        if (scheme === "none") {
            return;
        }
        
        // Define color schemes
        let colors;
        switch (scheme) {
            case 'earth':
                // Natural earth tones: browns, greens, and warm grays
                colors = [
                    [180, 150, 120],
                    [180, 255, 180],
                    [180, 255, 255]
                ];
                break;
                
            case 'tokyo':
                // Tokyo neon lights: bright purples, pinks, and blues
                colors = [
                    [200, 100, 220],
                    [255, 155, 255],
                    [255, 255, 255]
                ];
                break;
                
            case 'coral':
                // Ocean coral brights: warm corals and teals
                colors = [
                    [255, 105, 180],  // Hot pink
                    [255, 192, 203],  // Pink
                    [0, 255, 255]     // Cyan
                ];
                break;
                
            case 'pop':
                // Pop Music: vibrant pinks, golds, and electric greens
                colors = [
                    [255, 20, 147],   // Deep pink
                    [255, 215, 0],    // Gold
                    [50, 205, 50]     // Lime green
                ];
                break;
                
            case 'nike':
                // Nike: black, red, and white (reversed)
                colors = [
                    [255, 0, 0],
                    [0, 255, 255],
                    [255, 255, 255]
                ];
                break;
                
            case 'gucci':
                // Gucci-inspired colors: black, gold, and green
                colors = [
                    [0, 0, 0],        // Black
                    [218, 165, 32],   // Gold
                    [0, 128, 0]       // Forest Green
                ];
                break;
                
            case 'google':
                // Google's brand colors: blue, red, yellow, green
                colors = [
                    [66, 133, 244],
                    [255, 65, 54],
                    [255, 214, 53],
                    [54, 179, 59]
                ];
                break;

            case 'wes':
                // Wes Anderson's signature pastel colors
                colors = [
                    [255, 155, 155],
                    [200, 255, 200],
                    [180, 255, 255]
                ];
                break;

            default:
                // Default to classic thermal
                colors = [
                    [0, 0, 0],
                    [255, 255, 255],
                    [255, 0, 0]
                ];
        }
        
        // Apply color effect
        for (let i = 0; i < data.length; i += 4) {
            // Convert RGB to grayscale
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            
            // Normalize gray value (0 to 1)
            let normalizedGray = gray / 255;
            if (isReversed) normalizedGray = 1 - normalizedGray;
            
            // Apply color based on scheme
            let r, g, b;
            if (colors) {
                const index = Math.round(normalizedGray * (colors.length - 1));
                r = colors[index][0];
                g = colors[index][1];
                b = colors[index][2];
            } else {
                r = colors[0];
                g = colors[1];
                b = colors[2];
            }
            
            // Apply colors directly
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    function applyDither(ctx, amount) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;
        
        // Floyd-Steinberg dithering matrix
        const matrix = [
            [0, 0, 7/16],
            [3/16, 5/16, 1/16]
        ];
        
        // Convert to grayscale first
        for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = data[i + 1] = data[i + 2] = gray;
        }
        
        // Apply dithering
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const oldPixel = data[idx];
                
                // Calculate new pixel value based on amount
                // Scale the threshold based on the new range (0.1 to 25)
                const threshold = 128 + (amount - 12.5) * 10.24; // Adjust threshold based on amount
                const newPixel = oldPixel > threshold ? 255 : 0;
                
                // Calculate error
                const error = oldPixel - newPixel;
                
                // Apply new pixel value
                data[idx] = data[idx + 1] = data[idx + 2] = newPixel;
                
                // Distribute error to neighboring pixels
                for (let dy = 0; dy < 2; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        
                        if (nx >= 0 && nx < width && ny < height) {
                            const nidx = (ny * width + nx) * 4;
                            const factor = matrix[dy][dx + 1];
                            data[nidx] += error * factor;
                            data[nidx + 1] += error * factor;
                            data[nidx + 2] += error * factor;
                        }
                    }
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    // Helper function for rainbow effect
    function hslToRgb(h, s, l) {
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
});
