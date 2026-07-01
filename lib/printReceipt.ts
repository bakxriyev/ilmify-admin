'use client';

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
  groupName: string;
  paidMonth: string;
  paidYear: string;
  paidAt: string;
  paymentType: string;
  amount: number;
  adminName: string;
  receiptWidth?: number;
  fontSize?: number;
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
      @page { margin: 10mm; size: auto; }
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
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      border-radius: 4px;
      overflow: hidden;
    }
    .receipt-inner {
      padding: 24px 20px 20px;
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #333;
      padding-bottom: 14px;
      margin-bottom: 14px;
    }
    .header .logo {
      max-height: 60px;
      max-width: 120px;
      object-fit: contain;
      margin-bottom: 8px;
    }
    .header .logo-placeholder {
      width: 50px;
      height: 50px;
      background: #f0f0f0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 8px;
      font-size: 24px;
      color: #999;
    }
    .header h1 {
      font-size: ${fs + 4}px;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #111;
    }
    .header .sub {
      font-size: ${fs - 2}px;
      color: #666;
      margin-top: 4px;
    }
    .header .header-text {
      font-size: ${fs - 2}px;
      color: #555;
      margin-top: 6px;
      font-style: italic;
    }
    .meta {
      font-size: ${fs - 1}px;
      margin-bottom: 12px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
    }
    .meta-row .label { color: #555; }
    .meta-row .value { font-weight: 700; color: #111; text-align: right; }
    .divider {
      border-top: 1px dashed #999;
      margin: 10px 0;
    }
    .divider-thick {
      border-top: 2px dashed #333;
      margin: 12px 0;
    }
    .amount-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: ${fs}px;
    }
    .amount-row.total {
      font-size: ${fs + 4}px;
      font-weight: 900;
    }
    .amount-row .label { color: #333; }
    .amount-row .value { font-weight: 700; }
    .info-grid {
      font-size: ${fs - 1}px;
    }
    .info-row {
      display: flex;
      padding: 2px 0;
    }
    .info-row .label {
      color: #666;
      min-width: 80px;
      flex-shrink: 0;
    }
    .info-row .value {
      color: #111;
      font-weight: 600;
    }
    .footer {
      text-align: center;
      font-size: ${fs - 2}px;
      color: #555;
      margin-top: 4px;
    }
    .footer p { margin-top: 4px; }
    .thank-you {
      text-align: center;
      font-size: ${fs + 2}px;
      font-weight: 700;
      color: #111;
      margin: 10px 0 4px;
    }
    .social {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin: 8px 0;
      font-size: ${fs - 3}px;
    }
    .social-item {
      text-align: center;
      color: #555;
    }
    .social-item .icon {
      display: block;
      width: 32px;
      height: 32px;
      margin: 0 auto 2px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: #fff;
    }
    .social-item .icon.tg { background: #1a1a2e; }
    .social-item .icon.web { background: #2563eb; }
    .social-item .icon.ig { background: #db2777; }
    .social-item .icon.verify { background: #16a34a; }
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
    <div class="receipt-inner">
      <div class="header">
        ${data.academyLogo
          ? `<img src="${data.academyLogo}" alt="Logo" class="logo" />`
          : data.academyName
            ? `<div class="logo-placeholder">${data.academyName.charAt(0)}</div>`
            : ''
        }
        ${data.academyName ? `<h1>${data.academyName}</h1>` : ''}
        ${data.receiptHeader ? `<div class="header-text">${data.receiptHeader}</div>` : ''}
      </div>

      <div class="meta">
        <div class="meta-row">
          <span class="label">Chek №:</span>
          <span class="value">${receiptNo}</span>
        </div>
        <div class="meta-row">
          <span class="label">Chop etilgan:</span>
          <span class="value">${dateStr}</span>
        </div>
      </div>

      <div class="divider-thick"></div>

      <div class="info-grid">
        <div class="info-row">
          <span class="label">O'quvchi:</span>
          <span class="value">${data.studentName}</span>
        </div>
        ${data.studentPhone ? `<div class="info-row"><span class="label">Telefon:</span><span class="value">${data.studentPhone}</span></div>` : ''}
        ${data.groupName ? `<div class="info-row"><span class="label">Guruh:</span><span class="value">${data.groupName}</span></div>` : ''}
        <div class="info-row">
          <span class="label">To'lov oyi:</span>
          <span class="value">${data.paidMonth} ${data.paidYear}</span>
        </div>
        <div class="info-row">
          <span class="label">To'lov sanasi:</span>
          <span class="value">${data.paidAt}</span>
        </div>
        <div class="info-row">
          <span class="label">To'lov turi:</span>
          <span class="value">${data.paymentType}</span>
        </div>
        <div class="info-row">
          <span class="label">Admin:</span>
          <span class="value">${data.adminName}</span>
        </div>
      </div>

      <div class="divider-thick"></div>

      <div class="amount-row total">
        <span class="label">JAMI SUMMA:</span>
        <span class="value">${data.amount.toLocaleString()} so'm</span>
      </div>

      ${data.paidAt ? `<div class="meta" style="margin-top:4px;font-size:${fs - 2}px;color:#888;text-align:center;">To'lov vaqti: ${data.paidAt}</div>` : ''}

      ${data.receiptNote ? `<div class="divider"></div><div class="footer"><em>${data.receiptNote}</em></div>` : ''}

      <div class="divider"></div>

      ${data.thankYouText ? `<div class="thank-you">${data.thankYouText}</div>` : ''}

      <div class="footer">
        ${data.footerText ? `<p>${data.footerText}</p>` : ''}
        ${data.academyAddress ? `<p>${data.academyAddress}</p>` : ''}
        ${data.academyPhones && data.academyPhones.length > 0 ? `<p>${data.academyPhones.join(' | ')}</p>` : ''}
        ${data.receiptFooter ? `<p>${data.receiptFooter}</p>` : ''}
      </div>

      ${(data.telegramBot || data.website || data.instagram) ? `
      <div class="divider"></div>
      <div class="social">
        ${data.telegramBot ? `<div class="social-item"><span class="icon tg">&#9993;</span>Telegram</div>` : ''}
        ${data.website ? `<div class="social-item"><span class="icon web">&#9783;</span>Web</div>` : ''}
        ${data.instagram ? `<div class="social-item"><span class="icon ig">&#9642;</span>Instagram</div>` : ''}
        <div class="social-item"><span class="icon verify">&#10003;</span>Tasdiq</div>
      </div>` : ''}
    </div>
  </div>

  <div class="actions no-print">
    <button class="print-btn" onclick="window.print()">🖨 Chop etish</button>
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
