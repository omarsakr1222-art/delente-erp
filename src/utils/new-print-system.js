// ==========================================
// 🚀 NEW ADVANCED PRINTING SYSTEM (80mm)
// نظام الطباعة المتقدم - يعمل مع USB و Bluetooth
// ==========================================

(function() {
    let writer, bleCharacteristic, activeMode, usbPort, usbPrinter, btDevice;

    // 1. USB Connection (Instant Speed)
    async function connectUSB() {
        if (!navigator.serial) {
            alert("المتصفح لا يدعم USB");
            return false;
        }
        try {
            // If already connected and writer exists, reuse it
            if (usbPort && usbPort.writable && writer) {
                console.log('✅ إعادة استخدام اتصال USB الموجود');
                activeMode = 'USB';
                return true;
            }
            
            // Request new port
            usbPort = await navigator.serial.requestPort();
            usbPrinter = usbPort.getInfo();
            
            // Check if port is already open
            if (!usbPort.readable) {
                await usbPort.open({ baudRate: 115200 });
            }
            
            writer = usbPort.writable.getWriter();
            activeMode = 'USB';
            console.log('✅ تم الاتصال بـ USB بنجاح');
            return true;
        } catch (e) { 
            console.error('❌ خطأ USB:', e);
            if (e.name === 'InvalidStateError') {
                // Port already open, try to get writer
                try {
                    if (usbPort && usbPort.writable) {
                        writer = usbPort.writable.getWriter();
                        activeMode = 'USB';
                        return true;
                    }
                } catch (e2) {
                    alert('الطابعة مفتوحة بالفعل. أغلق التطبيق الآخر أو اضغط F5 لإعادة تحميل الصفحة');
                }
            } else {
                alert('خطأ في الاتصال بـ USB: ' + e.message);
            }
            return false;
        }
    }

    // 2. Bluetooth Connection (Optimized Speed)
    async function connectBluetooth() {
        if (!navigator.bluetooth) {
            alert("المتصفح لا يدعم البلوتوث");
            return false;
        }
        try {
            // If already connected, check if still valid
            if (btDevice && btDevice.gatt && btDevice.gatt.connected) {
                console.log('✅ إعادة استخدام اتصال بلوتوث الموجود');
                activeMode = 'BLE';
                return true;
            }
            
            btDevice = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }]
            });
            const server = await btDevice.gatt.connect();
            const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
            bleCharacteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
            activeMode = 'BLE';
            console.log('✅ تم الاتصال بالبلوتوث بنجاح');
            return true;
        } catch (e) { 
            console.error('❌ خطأ بلوتوث:', e);
            alert('خطأ في الاتصال بالبلوتوث: ' + e.message);
            return false;
        }
    }

    // 3. Printing Logic
    async function printTurbo(sale) {
        if (!sale) {
            alert('لا توجد بيانات للفاتورة');
            return;
        }

        // Check if connected
        if (!activeMode) {
            const choice = confirm('تحتاج للاتصال أولاً. اختر موافق لـ USB أو إلغاء لـ بلوتوث');
            let connected = false;
            if (choice) {
                connected = await connectUSB();
            } else {
                connected = await connectBluetooth();
            }
            if (!connected) return;
        }

        try {
            // Create temp invoice element using the same HTML generator
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = `
                <div id="temp-invoice-box" style="width: 570px; min-width: 570px; background: #fff; padding: 20px; color: #000; font-family: 'Cairo', sans-serif;">
                    ${generateInvoiceHTML(sale)}
                </div>
            `;
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.top = '0';
            document.body.appendChild(tempDiv);

            const el = tempDiv.querySelector('#temp-invoice-box');
            
            // Wait for images
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // استخدام scale: 1 للسرعة الفورية
            const canvas = await html2canvas(el, { 
                scale: 1,
                useCORS: true,
                backgroundColor: '#ffffff',
                scrollY: 0,
                windowWidth: document.body.scrollWidth
            });

            document.body.removeChild(tempDiv);

            const data = getImageData(canvas);

            if (activeMode === 'USB') {
                // إرسال دفعة واحدة لليو إس بي (بدون releaseLock)
                await writer.write(data);
                console.log('✅ تم إرسال البيانات إلى USB');
            } else if (activeMode === 'BLE') {
                // إرسال سريع للبلوتوث
                await sendFastChunks(data);
                console.log('✅ تم إرسال البيانات إلى البلوتوث');
            }
            
            alert('تمت الطباعة بنجاح ✅');
            
        } catch (e) {
            console.error('Print error:', e);
            alert("خطأ في الطباعة: " + e.message);
        }
    }

    // دالة الإرسال السريع للبلوتوث
    async function sendFastChunks(data) {
        const chunkSize = 150; 
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            await bleCharacteristic.writeValue(chunk);
            await new Promise(r => setTimeout(r, 5));
        }
    }

    function getImageData(c) {
        const w = c.width;
        const h = c.height;
        const ctx = c.getContext('2d');
        const imgData = ctx.getImageData(0, 0, w, h);
        
        let cmds = [0x1B, 0x40, 0x1B, 0x61, 0x01, 0x1D, 0x76, 0x30, 0x00];
        
        // Width Logic
        const xb = Math.ceil(w / 8);
        cmds.push(xb % 256, Math.floor(xb / 256));
        cmds.push(h % 256, Math.floor(h / 256));

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < xb; x++) {
                let byte = 0;
                for (let bit = 0; bit < 8; bit++) {
                    const px = x * 8 + bit;
                    if (px < w) {
                        const i = (y * w + px) * 4;
                        const alpha = imgData.data[i + 3];
                        const r = imgData.data[i];
                        const g = imgData.data[i + 1];
                        const b = imgData.data[i + 2];
                        // عتبة محسّنة لضمان طباعة النصوص بوضوح
                        if (alpha > 128 && (r + g + b) / 3 < 240) {
                            byte |= (1 << (7 - bit));
                        }
                    }
                }
                cmds.push(byte);
            }
        }
        cmds.push(0x1D, 0x56, 0x42, 0x00); // قص الورقة
        return new Uint8Array(cmds);
    }

    // ========================================
    // MODAL PREVIEW SYSTEM
    // ========================================
    
    function showPrintModal(sale) {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'new-print-modal';
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;
        
        // Create modal content container
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            max-width: 900px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        `;
        
        // Create header with buttons
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            border-radius: 12px 12px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
        `;
        
        const title = document.createElement('h2');
        title.textContent = 'معاينة الفاتورة';
        title.style.cssText = `
            color: white;
            margin: 0;
            font-size: 24px;
            font-weight: bold;
        `;
        
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        `;
        
        // Connection status display
        const statusText = document.createElement('div');
        statusText.style.cssText = `
            color: white;
            font-size: 14px;
            padding: 8px 16px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.1);
            display: none;
        `;
        
        // Print button (initially hidden)
        const printBtn = document.createElement('button');
        printBtn.innerHTML = '🖨️ أمر طباعة';
        printBtn.style.cssText = `
            background: #10b981;
            color: white;
            border: none;
            padding: 10px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
            display: none;
        `;
        printBtn.onmouseover = () => printBtn.style.background = '#059669';
        printBtn.onmouseout = () => printBtn.style.background = '#10b981';
        printBtn.onclick = async () => {
            try {
                printBtn.disabled = true;
                printBtn.innerHTML = '⏳ جاري الطباعة...';
                await printTurbo(sale);
                printBtn.innerHTML = '✅ تمت الطباعة';
                setTimeout(() => {
                    if (document.body.contains(modalOverlay)) {
                        document.body.removeChild(modalOverlay);
                    }
                }, 1500);
            } catch (e) {
                printBtn.disabled = false;
                printBtn.innerHTML = '🖨️ أمر طباعة';
                alert('خطأ في الطباعة: ' + e.message);
            }
        };
        
        // USB Button
        const usbBtn = document.createElement('button');
        usbBtn.innerHTML = '🔌 USB';
        usbBtn.style.cssText = `
            background: #7c3aed;
            color: white;
            border: none;
            padding: 10px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
        `;
        usbBtn.onmouseover = () => usbBtn.style.background = '#6d28d9';
        usbBtn.onmouseout = () => usbBtn.style.background = '#7c3aed';
        usbBtn.onclick = async () => {
            try {
                usbBtn.disabled = true;
                usbBtn.innerHTML = '⏳ جاري الاتصال...';
                await connectUSB();
                
                // Show printer name
                if (usbPrinter && usbPrinter.productName) {
                    statusText.textContent = `متصل بـ: ${usbPrinter.productName}`;
                    statusText.style.display = 'block';
                } else {
                    statusText.textContent = 'متصل بطابعة USB';
                    statusText.style.display = 'block';
                }
                
                // Hide connection buttons, show print button
                usbBtn.style.display = 'none';
                btBtn.style.display = 'none';
                printBtn.style.display = 'block';
            } catch (e) {
                usbBtn.disabled = false;
                usbBtn.innerHTML = '🔌 USB';
                alert('خطأ في الاتصال بـ USB: ' + e.message);
            }
        };
        
        // Bluetooth Button
        const btBtn = document.createElement('button');
        btBtn.innerHTML = '📡 بلوتوث';
        btBtn.style.cssText = `
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
        `;
        btBtn.onmouseover = () => btBtn.style.background = '#2563eb';
        btBtn.onmouseout = () => btBtn.style.background = '#3b82f6';
        btBtn.onclick = async () => {
            try {
                btBtn.disabled = true;
                btBtn.innerHTML = '⏳ جاري الاتصال...';
                await connectBluetooth();
                
                // Show printer name
                if (btDevice && btDevice.name) {
                    statusText.textContent = `متصل بـ: ${btDevice.name}`;
                    statusText.style.display = 'block';
                } else {
                    statusText.textContent = 'متصل بطابعة بلوتوث';
                    statusText.style.display = 'block';
                }
                
                // Hide connection buttons, show print button
                usbBtn.style.display = 'none';
                btBtn.style.display = 'none';
                printBtn.style.display = 'block';
            } catch (e) {
                btBtn.disabled = false;
                btBtn.innerHTML = '📡 بلوتوث';
                alert('خطأ في الاتصال بالبلوتوث: ' + e.message);
            }
        };
        
        // Close Button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 20px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
        `;
        closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
        closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        closeBtn.onclick = () => document.body.removeChild(modalOverlay);
        
        buttonsContainer.appendChild(statusText);
        buttonsContainer.appendChild(usbBtn);
        buttonsContainer.appendChild(btBtn);
        buttonsContainer.appendChild(printBtn);
        buttonsContainer.appendChild(closeBtn);
        
        header.appendChild(title);
        header.appendChild(buttonsContainer);
        
        // Create preview container
        const previewContainer = document.createElement('div');
        previewContainer.style.cssText = `
            padding: 30px;
            background: linear-gradient(to bottom, #f3f4f6, #e5e7eb);
            min-height: 400px;
            display: flex;
            justify-content: center;
            align-items: flex-start;
        `;
        
        // Create invoice preview
        const invoicePreview = document.createElement('div');
        invoicePreview.id = 'invoice-preview-new';
        invoicePreview.style.cssText = `
            width: 570px;
            background: white;
            padding: 20px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            font-family: 'Cairo', sans-serif;
        `;
        
        // Generate invoice HTML
        invoicePreview.innerHTML = generateInvoiceHTML(sale);
        
        previewContainer.appendChild(invoicePreview);
        
        // Assemble modal
        modalContent.appendChild(header);
        modalContent.appendChild(previewContainer);
        modalOverlay.appendChild(modalContent);
        
        // Add to document
        document.body.appendChild(modalOverlay);
        
        // Close on overlay click
        modalOverlay.onclick = (e) => {
            if (e.target === modalOverlay) {
                document.body.removeChild(modalOverlay);
            }
        };
    }
    
    function generateInvoiceHTML(sale) {
        const customer = window.findCustomer ? window.findCustomer(sale.customerId) : null;
        const customerName = customer ? customer.name : 'عميل';
        
        let itemsHTML = '';
        if (Array.isArray(sale.items)) {
            sale.items.forEach(item => {
                const product = window.findProduct ? window.findProduct(item.productId) : null;
                const productName = product ? product.name : 'منتج';
                const price = item.price || 0;
                const quantity = item.quantity || 0;
                const total = price * quantity;
                
                itemsHTML += `
                    <tr style="border-bottom: 1px dotted #ccc;">
                        <td style="padding: 8px; text-align: left;">${productName}</td>
                        <td style="padding: 8px; text-align: center;">${price.toFixed(2)}</td>
                        <td style="padding: 8px; text-align: center;">${quantity}</td>
                        <td style="padding: 8px; text-align: right; font-weight: bold;">${total.toFixed(2)}</td>
                    </tr>
                `;
            });
        }
        
        const discount = sale.discount || 0;
        const subtotal = sale.total + discount;
        const finalTotal = sale.total || 0;
        
        return `
            <div style="position: relative; padding: 20px 10px; min-height: 600px;">
                <!-- Main Watermark in Center -->
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.12; z-index: 0; pointer-events: none;">
                    <img src="https://i.ibb.co/YT4114YW/image.jpg" alt="DELENTE Logo" style="height: 350px; width: auto;" crossorigin="anonymous">
                </div>
                
                <!-- Content Wrapper -->
                <div style="position: relative; z-index: 1;">
                    <!-- Header -->
                    <div style="text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px double #000;">
                        <!-- Small Logo at Top -->
                        <div style="margin-bottom: 10px;">
                            <img src="https://i.ibb.co/YT4114YW/image.jpg" alt="DELENTE Logo" style="height: 80px; width: auto; display: inline-block;" crossorigin="anonymous">
                        </div>
                        
                        <!-- Company Name -->
                        <div style="font-size: 32px; font-weight: bold; margin-bottom: 8px; color: #1f2937; letter-spacing: 2px;">
                            DELENTE
                        </div>
                        
                        <!-- Slogan -->
                        <div style="font-size: 16px; color: #4F46E5; margin-bottom: 12px; font-weight: 600;">
                            ..IT'S JUST MILK
                        </div>
                        
                        <!-- Company Info -->
                        <div style="font-size: 13px; color: #6b7280; line-height: 1.6;">
                            <div>📍 بنـــها، القليوبية، مصر</div>
                            <div>📞 ت: 12345 | 📱 م: 01000000000</div>
                            <div>🏛️ س.ت: 98765 | 🆔 ض.ق: 987654321</div>
                        </div>
                    </div>
            
            <div style="border-top: 2px dashed #000; border-bottom: 2px dashed #000; padding: 10px 0; margin: 15px 0;">
                <div style="display: flex; justify-content: space-between; font-size: 14px;">
                    <span>${new Date(sale.timestamp || Date.now()).toLocaleDateString('en-GB')}</span>
                    <span style="font-weight: bold;">#${sale.invoiceNumber || '---'}</span>
                </div>
            </div>
            
            <div style="text-align: right; margin: 15px 0; font-size: 16px; font-weight: bold;">
                العميل: ${customerName}
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <thead>
                    <tr style="background: #f5f5f5; border-bottom: 2px solid #000;">
                        <th style="padding: 10px; text-align: left; font-weight: bold;">الصنف</th>
                        <th style="padding: 10px; text-align: center; font-weight: bold;">سعر</th>
                        <th style="padding: 10px; text-align: center; font-weight: bold;">ع</th>
                        <th style="padding: 10px; text-align: right; font-weight: bold;">إجمالي</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>
            
            <div style="border-top: 2px solid #000; padding-top: 15px; margin-top: 15px;">
                <div style="display: flex; justify-content: space-between; font-size: 16px; margin-bottom: 8px;">
                    <span style="font-weight: bold;">${subtotal.toFixed(2)}</span>
                    <span>:الإجمالي</span>
                </div>
                ${discount > 0 ? `
                <div style="display: flex; justify-content: space-between; font-size: 16px; color: red; margin-bottom: 8px;">
                    <span style="font-weight: bold;">- ${discount.toFixed(2)}</span>
                    <span>:خصم</span>
                </div>
                ` : ''}
                <div style="border: 3px dotted #000; padding: 10px; margin-top: 10px;">
                    <div style="display: flex; justify-content: space-between; font-size: 22px; font-weight: bold;">
                        <span>${finalTotal.toFixed(2)}</span>
                        <span>:الصافي</span>
                    </div>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px dashed #ccc;">
                <div style="font-size: 12px; color: #666;">خدمة العملاء: 01000000000</div>
                <div style="font-size: 11px; color: #888; margin-top: 5px;">DELENTE - FRESH & NATURAL</div>
            </div>
                </div>
            </div>
        `;
    }

    // Expose globally
    window.printInvoiceNewSystem = showPrintModal; // Changed to show modal first
    window.connectUSBNewPrint = connectUSB;
    window.connectBluetoothNewPrint = connectBluetooth;
    console.log('✅ نظام الطباعة الجديد تم تحميله بنجاح');
})();
