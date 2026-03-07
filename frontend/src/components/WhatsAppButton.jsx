import React from 'react';
import './WhatsAppButton.css';

const WhatsAppButton = () => {
    // Reemplaza este número con el teléfono real de la imprenta (con código de país, ej: 51 para Perú)
    const phoneNumber = "51926563087"; 
    const message = "Hola, vengo de la página web y tengo una consulta.";
    
    const waLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    return (
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="whatsapp-floating-btn">
            {/* Usamos un SVG del logo de WhatsApp para que cargue rápido y no dependa de imágenes externas */}
            <svg viewBox="0 0 32 32" className="whatsapp-icon" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.002 0C7.165 0 0 7.164 0 16c0 2.815.735 5.56 2.133 7.985L.68 29.302l5.46-1.433C8.498 29.176 12.18 30 16.002 30 24.836 30 32 22.836 32 14c0-8.836-7.164-16-15.998-16zm8.814 22.766c-.368 1.036-1.782 1.838-2.906 2.016-.86.136-1.996.22-5.717-1.32-4.485-1.854-7.406-6.425-7.632-6.726-.226-.3-1.826-2.433-1.826-4.64 0-2.208 1.15-3.296 1.56-3.733.344-.366.906-.496 1.344-.496.14 0 .27.006.39.01.42.018.634.044.912.713.352.844 1.2 2.936 1.305 3.15.106.212.176.46.035.74-.14.28-.212.456-.424.704-.212.247-.442.548-.636.756-.21.228-.432.474-.188.892.244.418 1.087 1.794 2.333 2.906 1.606 1.432 2.955 1.875 3.38 2.088.423.213.67.177.925-.118.253-.295 1.088-1.268 1.378-1.704.29-.436.58-.366.968-.22.388.146 2.452 1.156 2.875 1.368.423.212.705.32.81.5.105.18.105 1.042-.263 2.078z" fill="#FFF"/>
            </svg>
        </a>
    );
};

export default WhatsAppButton;