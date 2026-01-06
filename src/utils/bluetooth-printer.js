/**
 * Bluetooth Printer Integration
 * تكامل الطابعة البلوتوث - طباعة حرارية ESC/POS
 */

const PRINTER_CONFIG = {
    services: [
        '000018f0-0000-1000-8000-00805f9b34fb',  // XPrinter
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',  // Generic
        '49535343-fe7d-4ae5-8fa9-9fafd205e455'   // Alternative
    ],
    characteristics: [
        '00002af1-0000-1000-8000-00805f9b34fb',
        'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
        '49535343-8841-43f4-a8d4-ecbe34729bb3'
    ]
};

window.printDevice = null;
window.printCharacteristic = null;

/**
 * Connect to Bluetooth thermal printer
 */
window.connectToPrinter = async function(){
    try {
        if (!('bluetooth' in navigator)) {
            throw new Error('Web Bluetooth not supported in this browser');
        }
        
        console.log('Searching for XPrinter...');
        const device = await navigator.bluetooth.requestDevice({ 
            filters: [{ services: PRINTER_CONFIG.services }], 
            optionalServices: PRINTER_CONFIG.services 
        });
        
        const server = await device.gatt.connect();
        console.log('Connected to GATT');
        
        // Find a service that exists on the device
        let service = null;
        for (const uuid of PRINTER_CONFIG.services){
            try { 
                service = await server.getPrimaryService(uuid); 
                console.log('Found Service:', uuid); 
                break; 
            } catch(e) { /* continue */ }
        }
        
        if (!service) throw new Error('No matching service found.');
        
        // Try known characteristic UUIDs first
        let char = null;
        try {
            for (const uuid of PRINTER_CONFIG.characteristics){
                try { 
                    char = await service.getCharacteristic(uuid); 
                    if (char) break; 
                } catch(e) {}
            }
        } catch(e){ /* ignore */ }
        
        // If still not found, inspect any characteristic and pick a writable one
        if (!char){
            const potentialChars = await service.getCharacteristics();
            char = potentialChars.find(c=> c.properties && (c.properties.write || c.properties.writeWithoutResponse));
        }
        
        if (!char) throw new Error('Write Characteristic NOT found!');
        
        window.printCharacteristic = char;
        window.printDevice = device;
        
        alert('✅ Connected to XPrinter successfully!');
        return { device, characteristic: char };
        
    } catch (error){
        console.error('connectToPrinter failed', error);
        throw error;
    }
};

/**
 * Print invoice via Bluetooth
 * @param {Object} sale - Invoice object
 */
window.printInvoiceBluetooth = async function(sale){
    try {
        if (!sale) { 
            alert('لم يتم تمرير فاتورة للطباعة'); 
            return; 
        }
        
        // Check if invoice contains Arabic text
        const hasArabic = /[\u0600-\u06FF]/.test(JSON.stringify(sale||{}));
        
        // For Arabic text or if product names exist, use image-based printing
        if (hasArabic || (sale.items && sale.items.length > 0)) {
            if (typeof window.printAsImageForThermal === 'function') {
                console.log('Using image-based printing for Arabic text support');
                try { 
                    await window.printAsImageForThermal(sale); 
                    return; 
                } catch(e){
                    console.warn('Image printing failed, falling back to text mode:', e);
                }
            }
        }
        
        // Build payload using existing helper if present
        const payload = (typeof buildEscPosReceipt === 'function') ? 
            buildEscPosReceipt(sale) : 
            // fallback simple text
            (function(){
                const enc = new TextEncoder();
                return enc.encode('Invoice #' + (sale.invoiceNumber || sale.id) + '\nTotal: ' + (sale.total || 0) + '\n');
            })();
        
        // Connect if not already connected
        if (!window.printCharacteristic){
            try { 
                await window.connectToPrinter(); 
            } catch(e){ 
                alert('فشل الاتصال بالطابعة: ' + (e && e.message)); 
                return; 
            }
        }
        
        const char = window.printCharacteristic;
        if (!char) { 
            alert('لا توجد خاصية كتابة للطابعة'); 
            return; 
        }
        
        // Write in chunks
        const CHUNK = 180; // larger chunk for modern devices
        for (let i = 0; i < payload.length; i += CHUNK){
            const slice = payload.slice(i, i + CHUNK);
            try {
                if (char.properties.writeWithoutResponse) {
                    await char.writeValueWithoutResponse(slice);
                } else {
                    await char.writeValue(slice);
                }
            } catch(e){
                // try writeValue as fallback
                try { 
                    await char.writeValue(slice); 
                } catch(er){ 
                    throw er; 
                }
            }
            await new Promise(r => setTimeout(r, 30));
        }
        
        alert('تم إرسال الفاتورة للطابعة عبر البلوتوث.');
        
    } catch(e){ 
        console.error('printInvoiceBluetooth failed', e); 
        alert('فشل الطباعة عبر البلوتوث: ' + (e && e.message)); 
    }
};

console.log('✓ Bluetooth printer module loaded');
