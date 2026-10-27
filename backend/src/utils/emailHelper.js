const nodemailer = require('nodemailer');
const SystemConfig = require('../modules/sysadmin/system_config.model');

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(num);

const getConfig = async (key) => {
  try {
    const config = await SystemConfig.findOne({ where: { key } });
    return config?.value || process.env[key] || null;
  } catch {
    return process.env[key] || null;
  }
};

const createTransporter = async () => {
  const host = await getConfig('SMTP_HOST');
  const port = await getConfig('SMTP_PORT');
  const user = await getConfig('SMTP_USER');
  const pass = await getConfig('SMTP_PASS');

  return nodemailer.createTransport({
    host: host || 'smtp.gmail.com',
    port: parseInt(port) || 587,
    secure: false,
    auth: { user, pass }
  });
};

const sendOrderEmail = async (order, status, userEmail, userName) => {
  const statusInfo = {
    paid: {
      subject: 'Pembayaran dikonfirmasi — Decant Temcy',
      title: 'Pembayaran Dikonfirmasi',
      subtitle: 'Pesanan kamu sedang kami siapkan.',
      accent: '#3b82f6',
      accentLight: '#eff6ff',
      badge: 'DIBAYAR',
    },
    processing: {
      subject: 'Pesanan sedang diproses — Decant Temcy',
      title: 'Sedang Dikemas',
      subtitle: 'Pesanan kamu sedang kami kemas dengan cermat.',
      accent: '#8b5cf6',
      accentLight: '#f5f3ff',
      badge: 'PROSES',
    },
    shipped: {
      subject: 'Pesanan dalam perjalanan — Decant Temcy',
      title: 'Dalam Perjalanan',
      subtitle: order.tracking_number
        ? `Nomor resi pengiriman kamu: <strong style="color:#0d0d14;">${order.tracking_number}</strong>`
        : 'Pesanan kamu sudah dikirim dan sedang dalam perjalanan.',
      accent: '#06b6d4',
      accentLight: '#ecfeff',
      badge: 'DIKIRIM',
    },
    delivered: {
      subject: 'Pesanan selesai — Decant Temcy',
      title: 'Pesanan Diterima',
      subtitle: 'Terima kasih sudah belanja di Decant Temcy. Jangan lupa berikan ulasanmu ya!',
      accent: '#22c55e',
      accentLight: '#f0fdf4',
      badge: 'SELESAI',
    },
    cancelled: {
      subject: 'Pesanan dibatalkan — Decant Temcy',
      title: 'Pesanan Dibatalkan',
      subtitle: 'Pesanan ini telah dibatalkan. Hubungi kami via WhatsApp jika ada pertanyaan.',
      accent: '#ef4444',
      accentLight: '#fef2f2',
      badge: 'DIBATALKAN',
    }
  };

  const info = statusInfo[status];
  if (!info) return;

  const itemRows = order.items?.map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;vertical-align:top;">
        <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:2px;">
          ${item.product_name}
        </div>
        <div style="font-size:12px;color:#9ca3af;">
          ${item.brand} &nbsp;·&nbsp; ${item.size_ml}ml &times; ${item.quantity}
        </div>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;text-align:right;vertical-align:top;">
        <span style="font-size:14px;font-weight:700;color:#111827;">
          ${formatRupiah(item.price * item.quantity)}
        </span>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="2" style="padding:12px 0;color:#9ca3af;font-size:14px;">—</td></tr>`;

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const smtpUser = await getConfig('SMTP_USER');

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${info.subject}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

          <!-- LOGO BAR -->
          <tr>
            <td style="padding-bottom:20px;text-align:center;">
              <span style="font-size:18px;font-weight:900;letter-spacing:0.12em;color:#111827;">
                DECANT <span style="color:#f02e29;">TEMCY</span>
              </span>
            </td>
          </tr>

          <!-- CARD -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);">

              <!-- STATUS ACCENT BAR -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:${info.accent};height:4px;line-height:4px;font-size:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- STATUS HEADER -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${info.accentLight};border-bottom:1px solid ${info.accent}20;">
                <tr>
                  <td style="padding:28px 32px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:14px;">
                          <span style="display:inline-block;background:${info.accent};color:#ffffff;font-size:10px;font-weight:800;letter-spacing:0.12em;padding:4px 10px;border-radius:4px;">
                            ${info.badge}
                          </span>
                        </td>
                        <td style="vertical-align:middle;">
                          <div style="font-size:20px;font-weight:800;color:#111827;letter-spacing:-0.01em;">
                            ${info.title}
                          </div>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:12px 0 0;font-size:14px;color:#6b7280;line-height:1.7;">
                      Halo <strong style="color:#111827;">${userName}</strong>, ${info.subtitle}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- BODY -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:28px 32px;">

                    <!-- Order meta -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border-radius:10px;margin-bottom:24px;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-size:12px;color:#9ca3af;padding-bottom:6px;">Nomor Pesanan</td>
                              <td style="text-align:right;padding-bottom:6px;">
                                <strong style="font-size:13px;color:${info.accent};">${order.order_code}</strong>
                              </td>
                            </tr>
                            <tr>
                              <td style="font-size:12px;color:#9ca3af;padding-bottom:${order.tracking_number ? '6px' : '0'};">Pengiriman</td>
                              <td style="text-align:right;font-size:13px;color:#374151;font-weight:600;padding-bottom:${order.tracking_number ? '6px' : '0'};">
                                ${order.delivery_method === 'pickup'
                                  ? 'Pickup di Toko'
                                  : `${order.courier ? order.courier.toUpperCase() : '-'} ${order.courier_service || ''}`}
                              </td>
                            </tr>
                            ${order.tracking_number ? `
                            <tr>
                              <td style="font-size:12px;color:#9ca3af;">Nomor Resi</td>
                              <td style="text-align:right;">
                                <strong style="font-size:13px;color:#06b6d4;">${order.tracking_number}</strong>
                              </td>
                            </tr>` : ''}
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Item list -->
                    <div style="font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px;">
                      Produk
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      ${itemRows}
                    </table>

                    <!-- Totals -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;padding-top:16px;border-top:2px solid #f3f4f6;">
                      ${order.discount_amount > 0 ? `
                      <tr>
                        <td style="font-size:13px;color:#6b7280;padding-bottom:6px;">Diskon Voucher</td>
                        <td style="text-align:right;font-size:13px;font-weight:700;color:#22c55e;padding-bottom:6px;">
                          &minus;${formatRupiah(order.discount_amount)}
                        </td>
                      </tr>` : ''}
                      ${order.shipping_cost > 0 ? `
                      <tr>
                        <td style="font-size:13px;color:#6b7280;padding-bottom:6px;">Ongkos Kirim</td>
                        <td style="text-align:right;font-size:13px;color:#374151;padding-bottom:6px;">
                          ${formatRupiah(order.shipping_cost)}
                        </td>
                      </tr>` : ''}
                      <tr>
                        <td style="font-size:15px;font-weight:700;color:#111827;padding-top:8px;">
                          Total Pembayaran
                        </td>
                        <td style="text-align:right;padding-top:8px;">
                          <strong style="font-size:17px;color:#f02e29;">${formatRupiah(order.total_price)}</strong>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- SHIPPING ADDRESS -->
              ${order.delivery_method !== 'pickup' ? `
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:0 32px 28px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border-radius:10px;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <div style="font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;">
                            Alamat Pengiriman
                          </div>
                          <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:2px;">${order.shipping_name}</div>
                          <div style="font-size:13px;color:#6b7280;line-height:1.6;">
                            ${order.shipping_phone}<br>
                            ${order.shipping_address}, ${order.shipping_city}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>` : `
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:0 32px 28px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;">
                      <tr>
                        <td style="padding:14px 20px;">
                          <div style="font-size:11px;font-weight:700;color:#16a34a;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">
                            Info Pickup
                          </div>
                          <div style="font-size:13px;color:#374151;">
                            Hubungi kami via WhatsApp untuk konfirmasi jadwal pickup.
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>`}

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:0 32px 32px;text-align:center;">
                    <a href="${clientUrl}/orders"
                      style="display:inline-block;background:#f02e29;color:#ffffff;text-decoration:none;font-size:13px;font-weight:800;letter-spacing:0.06em;padding:14px 36px;border-radius:8px;">
                      Lihat Pesanan Saya
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:24px 0;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">Ada pertanyaan?</p>
              <a href="https://wa.me/6285128061012"
                style="font-size:13px;font-weight:700;color:#22c55e;text-decoration:none;">
                WhatsApp: +62 851-2806-1012
              </a>
              <p style="margin:12px 0 0;font-size:11px;color:#d1d5db;">
                &copy; 2025 Decant Temcy &nbsp;&middot;&nbsp; All rights reserved
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

  try {
    const transporter = await createTransporter();
    await transporter.sendMail({
      from: `"Decant Temcy" <${smtpUser}>`,
      to: userEmail,
      subject: info.subject,
      html
    });
    console.log(`✅ Email terkirim ke ${userEmail} — status: ${status}`);
  } catch (err) {
    console.error(`❌ Gagal kirim email ke ${userEmail}:`, err.message);
  }
};

module.exports = { sendOrderEmail };