'use client';

export interface ReceiptLineItem {
  groupName: string;
  monthName: string;
  year: number;
  amount: number;
}

interface PrintData {
  receiptNumber?: string;
  academyName: string;
  academyLogo?: string;
  academyAddress?: string;
  academyPhones?: string[];
  receiptHeader?: string;
  receiptFooter?: string;
  receiptNote?: string;
  thankYouText?: string;
  footerText?: string;
  website?: string;
  instagram?: string;
  telegramBot?: string;

  studentName: string;
  studentPhone: string;
  studentPassword?: string;
  groupName?: string;
  paidMonth?: string;
  paidYear?: string;
  paidAt: string;
  paymentType: string;
  amount: number;
  adminName: string;
  receiptWidth?: number;
  fontSize?: number;
  items?: ReceiptLineItem[];
}

export function printReceipt(data: PrintData) {
  const width = data.receiptWidth || 320;
  const fs = data.fontSize || 13;
  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const receiptNo = data.receiptNumber || `CH-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Chek - ${receiptNo}</title>
  <style>
    @media print {
      @page { margin: 8mm; size: auto; }
      body { margin: 0; padding: 0; }
      .no-print { display: none !important; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      background: #f5f5f5;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }
    .receipt {
      width: ${width}px;
      background: #fff;
      box-shadow: 0 10px 30px -8px rgba(0,0,0,0.25);
      position: relative;
    }
    .receipt-inner {
      padding: 20px 16px 16px;
    }
    .punch-left {
      position: absolute; left: -7px; top: 40px;
      width: 14px; height: 14px;
      border-radius: 50%;
      background: #f5f5f5;
      border: 1px solid #ddd;
    }
    .punch-right {
      position: absolute; right: -7px; top: 40px;
      width: 14px; height: 14px;
      border-radius: 50%;
      background: #f5f5f5;
      border: 1px solid #ddd;
    }
    .header {
      text-align: center;
      padding-bottom: 10px;
    }
    .header .logo {
      max-height: 44px;
      max-width: 100px;
      object-fit: contain;
      margin-bottom: 6px;
    }
    .header .logo-placeholder {
      width: 36px; height: 36px;
      background: rgba(217,119,6,0.1);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 6px;
      font-size: 18px;
      color: #b45309;
    }
    .header h1 {
      font-size: ${fs + 4}px;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #111;
      white-space: pre-line;
    }
    .header .sub {
      font-size: ${fs - 2}px;
      color: #666;
      margin-top: 2px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
      gap: 8px;
    }
    .row .l {
      color: #555;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .row .r {
      font-weight: 700;
      color: #111;
      text-align: right;
      word-break: break-word;
      overflow-wrap: break-word;
      hyphens: auto;
      max-width: 65%;
    }
    .dashed {
      border-top: 1px dashed #999;
      margin: 8px 0;
    }
    .dashed-thick {
      border-top: 2px dashed #333;
      margin: 10px 0;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: ${fs + 4}px;
      font-weight: 900;
    }
    .total-row .r { font-weight: 900; }
    .footer {
      text-align: center;
      font-size: ${fs - 2}px;
      color: #555;
      margin-top: 2px;
    }
    .footer p { margin-top: 3px; }
    .contact-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 4px;
      font-size: ${fs - 2}px;
      color: #555;
    }
    .contact-icon img {
      width: 14px;
      height: 14px;
      display: block;
      border-radius: 50%;
      object-fit: cover;
    }
    .social-row {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 6px;
    }
    .social-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      text-decoration: none;
      color: #555;
      font-size: ${fs - 2}px;
    }
    .social-icon img {
      width: 18px;
      height: 18px;
      display: block;
      border-radius: 3px;
      object-fit: cover;
    }
    .social-label {
      font-size: ${fs - 3}px;
      color: #555;
      text-decoration: none;
      white-space: nowrap;
    }
    .web-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      background: #2563eb;
      color: #fff;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 700;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .thank-you {
      text-align: center;
      font-size: ${fs + 1}px;
      font-weight: 700;
      color: #111;
      margin: 8px 0 2px;
    }
    .torn-edge {
      height: 10px;
      width: 100%;
      background: inherit;
      background-color: #fff;
      -webkit-mask-image: linear-gradient(135deg, black 25%, transparent 25.5%), linear-gradient(225deg, black 25%, transparent 25.5%);
      mask-image: linear-gradient(135deg, black 25%, transparent 25.5%), linear-gradient(225deg, black 25%, transparent 25.5%);
      -webkit-mask-size: 9px 14px;
      mask-size: 9px 14px;
      -webkit-mask-position: top left;
      mask-position: top left;
      -webkit-mask-repeat: repeat-x;
      mask-repeat: repeat-x;
    }
    .actions {
      margin-top: 20px;
      display: flex;
      justify-content: center;
      gap: 10px;
    }
    .actions button {
      padding: 10px 28px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .actions .print-btn {
      background: #2563eb;
      color: #fff;
    }
    .actions .print-btn:hover { background: #1d4ed8; }
    .actions .close-btn {
      background: #e5e7eb;
      color: #374151;
    }
    .actions .close-btn:hover { background: #d1d5db; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="punch-left"></div>
    <div class="punch-right"></div>
    <div class="receipt-inner">
      <div class="header">
        ${data.academyLogo
          ? `<img src="${data.academyLogo}" alt="Logo" class="logo" />`
          : data.academyName
            ? `<div class="logo-placeholder">${data.academyName.charAt(0)}</div>`
            : ''
        }
        ${data.academyName ? `<h1>${data.academyName}</h1>` : ''}
        ${data.receiptHeader ? `<div class="sub">${data.receiptHeader}</div>` : ''}
      </div>

      <div class="dashed-thick"></div>

      <div style="font-size:${fs - 1}px">
        <div class="row">
          <span class="l">Chek №:</span>
          <span class="r">${receiptNo}</span>
        </div>
        <div class="row">
          <span class="l">Sana:</span>
          <span class="r">${dateStr}</span>
        </div>
      </div>

      <div class="dashed"></div>

      <div style="font-size:${fs - 1}px">
        <div class="row">
          <span class="l">O'quvchi:</span>
          <span class="r">${data.studentName}</span>
        </div>
        ${data.studentPhone ? `<div class="row"><span class="l">Telefon:</span><span class="r">${data.studentPhone}</span></div>` : ''}
        ${data.studentPassword ? `<div class="row"><span class="l">Parol:</span><span class="r">${data.studentPassword}</span></div>` : ''}
        <div class="row">
          <span class="l">To'lov sanasi:</span>
          <span class="r">${data.paidAt}</span>
        </div>
        <div class="row">
          <span class="l">To'lov turi:</span>
          <span class="r">${data.paymentType}</span>
        </div>
        <div class="row">
          <span class="l">Admin:</span>
          <span class="r">${data.adminName}</span>
        </div>
      </div>

      <div class="dashed"></div>

      <div style="font-size:${fs - 1}px">
        ${data.items && data.items.length > 0 ? `
          <div style="display:flex;justify-content:space-between;padding:3px 0;font-weight:700;color:#333;border-bottom:1px solid #ccc;margin-bottom:4px">
            <span style="flex:1">Guruh / Oy</span>
            <span style="text-align:right;min-width:80px">Summa</span>
          </div>
          ${data.items.map(item => `
            <div style="display:flex;justify-content:space-between;padding:2px 0">
              <span style="flex:1">${item.groupName} / ${item.monthName} ${item.year}</span>
              <span style="text-align:right;min-width:80px;font-weight:600">${item.amount.toLocaleString()} so'm</span>
            </div>
          `).join('')}
        ` : `
          ${data.groupName ? `<div class="row"><span class="l">Guruh:</span><span class="r">${data.groupName}</span></div>` : ''}
          <div class="row">
            <span class="l">To'lov oyi:</span>
            <span class="r">${data.paidMonth || ''} ${data.paidYear || ''}</span>
          </div>
          <div class="row">
            <span class="l">Summa:</span>
            <span class="r">${data.amount.toLocaleString()} so'm</span>
          </div>
        `}
      </div>

      <div class="dashed-thick"></div>

      <div class="total-row">
        <span>JAMI SUMMA:</span>
        <span class="r">${data.amount.toLocaleString()} so'm</span>
      </div>

      ${data.receiptNote ? `<div class="dashed"></div><div class="footer"><em>${data.receiptNote}</em></div>` : ''}

      <div class="dashed"></div>

      ${data.thankYouText ? `<div class="thank-you">${data.thankYouText}</div>` : ''}

      <div class="footer">
        ${data.footerText ? `<p>${data.footerText}</p>` : ''}
        ${data.academyAddress ? `<p>${data.academyAddress}</p>` : ''}
        ${data.academyPhones && data.academyPhones.length > 0 ? `<div class="contact-row"><span class="contact-icon"><img src="https://png.pngtree.com/png-vector/20201028/ourmid/pngtree-phone-icon-in-solid-circle-png-image_2380227.jpg" alt="Tel" /></span><span>${data.academyPhones.join(', ')}</span></div>` : ''}
        ${(data.telegramBot || data.instagram || data.website) ? `<div class="social-row">
          ${data.telegramBot ? `<a href="https://${data.telegramBot}" target="_blank" class="social-link"><span class="social-icon"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/3840px-Telegram_logo.svg.png" alt="Telegram" /></span><span class="social-label">${data.telegramBot}</span></a>` : ''}
          ${data.instagram ? `<a href="https://instagram.com/${data.instagram.replace('@','')}" target="_blank" class="social-link"><span class="social-icon"><img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" alt="Instagram" /></span><span class="social-label">${data.instagram}</span></a>` : ''}
          ${data.website ? `<a href="${data.website.startsWith('http') ? data.website : 'https://'+data.website}" target="_blank" class="social-link"><span class="social-icon web-icon">W</span><span class="social-label">${data.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span></a>` : ''}
        </div>` : ''}
        ${data.receiptFooter ? `<p>${data.receiptFooter}</p>` : ''}
      </div>
    </div>

    <div class="torn-edge"></div>
  </div>

  <div class="actions no-print">
    <button class="print-btn" onclick="window.print()">Chop etish</button>
    <button class="close-btn" onclick="window.close()">Yopish</button>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', `width=${Math.min(width + 100, 800)},height=700,scrollbars=yes,resizable=yes`);
  if (!win) {
    alert('Brauzer yangi oynani ochishga ruxsat bermadi. Qalqib chiquvchi oynalarga ruxsat bering.');
    return;
  }
  win.document.write(html);
  win.document.close();
}
