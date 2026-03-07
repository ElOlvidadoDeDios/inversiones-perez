const { createCanvas } = require('canvas');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const path = require('path');
const fs = require('fs');

// Configuración del worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.js');

const calcularPrecio = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No se subió ningún archivo PDF.' });
    }

    const { tamano, color, impresion, reduccion } = req.body;
    const filePath = req.file.path;

    // Factores que vienen del Frontend
    const factorTamano = parseFloat(tamano) || 0.20; 
    const factorColor = parseFloat(color) || 1;      
    const factorImpresion = parseFloat(impresion) || 1;
    const factorReduccion = parseFloat(reduccion) || 1;

    try {
        const data = new Uint8Array(fs.readFileSync(filePath));
        const pdf = await pdfjsLib.getDocument({ data: data }).promise;

        const numPages = pdf.numPages;
        let totalCost = 0;

        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1 });
            const canvas = createCanvas(viewport.width, viewport.height);
            const context = canvas.getContext('2d');

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };

            await page.render(renderContext).promise;

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;
            let totalPixels = pixels.length / 4;

            let whitePixels = 0;
            let blackPixels = 0;
            let colorPixels = 0;

            const whiteThreshold = 240;
            const blackThreshold = 100;

            for (let j = 0; j < pixels.length; j += 4) {
                const r = pixels[j];
                const g = pixels[j + 1];
                const b = pixels[j + 2];
                
                const lumin = 0.299 * r + 0.587 * g + 0.114 * b;

                if (lumin > whiteThreshold) {
                    whitePixels++;
                } else if (lumin < blackThreshold) {
                    blackPixels++;
                } else {
                    colorPixels++;
                }
            }

            const whitePercentage = (whitePixels / totalPixels) * 100;
            const blackPercentage = (blackPixels / totalPixels) * 100;
            const colorPercentage = (colorPixels / totalPixels) * 100;

            let pageCost = 0;

            // --- LÓGICA DE DETECCIÓN DE TINTA (TU LÓGICA ORIGINAL) ---
            if (colorPercentage < 10) {
                pageCost = 0.25;
            } else if (colorPercentage > 8 && whitePercentage > 70) {
                pageCost = 0.40;
            } else if (colorPercentage > 10 && whitePercentage > 65) {
                pageCost = 0.50;
            } else if (colorPercentage > 20 && whitePercentage > 60) {
                pageCost = 0.60;
            } else if (colorPercentage > 25 && whitePercentage > 55) {
                pageCost = 0.70;
            } else if (colorPercentage > 30 && whitePercentage > 50) {
                pageCost = 0.80;
            } else if (colorPercentage > 35 && whitePercentage > 45) {
                pageCost = 0.90;
            } else if (colorPercentage > 40 && whitePercentage > 40) {
                pageCost = 1.00;
            } else if (colorPercentage > 45 && whitePercentage > 35) {
                pageCost = 1.10;
            } else if (colorPercentage > 50 && whitePercentage > 30) {
                pageCost = 1.20;
            } else if (colorPercentage > 55 && whitePercentage > 25) {
                pageCost = 1.30;
            } else if (colorPercentage > 60 && whitePercentage > 20) {
                pageCost = 1.40;
            } else if (colorPercentage > 65 && whitePercentage > 15) {
                pageCost = 1.50;
            } else if (colorPercentage > 70 && whitePercentage > 10) {
                pageCost = 1.60;
            } else if (colorPercentage > 8 && blackPercentage > 70) {
                pageCost = 0.40;
            } else if (colorPercentage > 10 && blackPercentage > 10) {
                pageCost = 0.50;
            } else if (colorPercentage > 20 && blackPercentage > 15) {
                pageCost = 0.60;
            } else if (colorPercentage > 25 && blackPercentage > 20) {
                pageCost = 0.70;
            } else if (colorPercentage > 30 && blackPercentage > 25) {
                pageCost = 0.80;
            } else if (colorPercentage > 35 && blackPercentage > 30) {
                pageCost = 0.90;
            } else if (colorPercentage > 40 && blackPercentage > 35) {
                pageCost = 1.00;
            } else if (colorPercentage > 45 && blackPercentage > 40) {
                pageCost = 1.10;
            } else if (colorPercentage > 50 && blackPercentage > 45) {
                pageCost = 1.20;
            } else if (colorPercentage > 55 && blackPercentage > 50) {
                pageCost = 1.30;
            } else if (colorPercentage > 60 && blackPercentage > 55) {
                pageCost = 1.40;
            } else if (colorPercentage > 65 && blackPercentage > 60) {
                pageCost = 1.50;
            } else if (colorPercentage > 70 && blackPercentage > 65) {
                pageCost = 1.60;
            }

            if (pageCost < 0.25) {
                pageCost = 0.25;
            }

            totalCost += pageCost;
        }

        fs.unlinkSync(filePath);

        // --- CÁLCULO FINAL ---
        
        const factorNormalizacion = 4;
        const ajusteColor = factorColor > 1 ? 0.833333 : 1;

        let precioFinal = totalCost * factorNormalizacion * factorTamano * factorColor * ajusteColor * factorImpresion * factorReduccion;

        // --- NUEVA LÓGICA: Redondear SIEMPRE HACIA ARRIBA al decimal (Ceiling) ---
        // 0.21 -> 0.30
        // 0.25 -> 0.30 (si usas ceil puro) o 0.30 (si ya es exacto se queda)
        // Math.ceil(0.21 * 10) = Math.ceil(2.1) = 3 / 10 = 0.3
        
        // Pequeño truco para evitar problemas de coma flotante (ej: 0.2000000001 no debería subir a 0.30 si era 0.20)
        precioFinal = Math.ceil((precioFinal - 0.001) * 10) / 10;

        res.json({ 
            precio: precioFinal.toFixed(2), // 0.30
            numPaginas: numPages,
            message: 'Cálculo completado' 
        });

    } catch (error) {
        console.error('Error en el costeador:', error);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).json({ message: 'Error al procesar el PDF' });
    }
};

module.exports = { calcularPrecio };