const { createCanvas } = require('canvas');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const path = require('path');
const fs = require('fs');

// Configuración del worker de PDF.js para Node (evita errores de promesas)
// En entornos Node puro a veces es mejor deshabilitar el worker externo o apuntar al archivo correcto
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.js');

const calcularPrecio = async (req, res) => {
    // Verificar si hay archivo
    if (!req.file) {
        return res.status(400).json({ message: 'No se subió ningún archivo PDF.' });
    }

    const { tamano, color, impresion, reduccion } = req.body;
    const filePath = req.file.path;

    try {
        // Cargar el documento PDF
        const data = new Uint8Array(fs.readFileSync(filePath));
        const pdf = await pdfjsLib.getDocument({
            data: data,
            // standardFontDataUrl: ... (generalmente no es estricto para análisis de píxeles en backend)
        }).promise;

        const numPages = pdf.numPages;
        let totalCost = 0;

        // Iterar por cada página
        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1 });

            // Crear Canvas virtual
            const canvas = createCanvas(viewport.width, viewport.height);
            const context = canvas.getContext('2d');

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };

            await page.render(renderContext).promise;

            // Análisis de píxeles
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
                // alpha = pixels[j + 3] (no lo usamos por ahora)

                // Fórmula de luminancia
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

            // --- Lógica de Precios (Transplantada de tu server.js) ---
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

        // Limpiar archivo temporal
        fs.unlinkSync(filePath);

        // Factores multiplicadores
        const factorTamano = parseFloat(tamano) || 1;
        const factorColor = parseFloat(color) || 1;
        const factorImpresion = parseFloat(impresion) || 1;
        const factorReduccion = parseFloat(reduccion) || 1;

        const precioFinal = totalCost * factorTamano * factorColor * factorImpresion * factorReduccion;

        res.json({ 
            precio: precioFinal.toFixed(2), 
            numPaginas: numPages,
            message: 'Cálculo completado' 
        });

    } catch (error) {
        console.error('Error en el costeador:', error);
        // Intentar borrar archivo si falla
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).json({ message: 'Error al procesar el PDF' });
    }
};

module.exports = { calcularPrecio };