import PDFDocument from 'pdfkit';

const money = value => `$${Number(value || 0).toFixed(2)}`;

const formatDate = value => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const productTitle = item =>
  item?.product?.title || item?.product?.name || 'Product';

// Draw a single table row with column-aligned cells.
const drawRow = (doc, y, cells, { bold = false, fill = '#111827' } = {}) => {
  doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10).fillColor(fill);
  doc.text(cells[0], 50, y, { width: 250 });
  doc.text(cells[1], 300, y, { width: 50, align: 'center' });
  doc.text(cells[2], 350, y, { width: 90, align: 'right' });
  doc.text(cells[3], 440, y, { width: 105, align: 'right' });
};

/**
 * Build a professional A4 invoice PDF for an order and resolve to a Buffer,
 * ready to be attached to the order-confirmation email.
 */
export const buildInvoicePdf = order =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const customer = order?.user || {};
      const address = order?.shippingAddress || {};

      // ── Header ────────────────────────────────────────────────
      doc
        .font('Helvetica-Bold')
        .fontSize(24)
        .fillColor('#DB4444')
        .text('Exclusive', 50, 55);
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#6B7280')
        .text('Thank you for shopping with us.', 50, 85);

      doc
        .font('Helvetica-Bold')
        .fontSize(20)
        .fillColor('#111827')
        .text('INVOICE', 400, 55, { width: 145, align: 'right' });
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#6B7280')
        .text(`#${order?.orderNumber || '-'}`, 400, 85, {
          width: 145,
          align: 'right',
        });

      doc
        .moveTo(50, 110)
        .lineTo(545, 110)
        .strokeColor('#E5E7EB')
        .stroke();

      // ── Billing / shipping ────────────────────────────────────
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#111827')
        .text('Billed To', 50, 128);
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#374151')
        .text(customer.name || 'Customer', 50, 146)
        .text(customer.email || '', 50, 161);
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#374151')
        .text(`Order Date: ${formatDate(order?.createdAt)}`, 50, 181);

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#111827')
        .text('Ship To', 320, 128);
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#374151')
        .text(
          [
            address.street,
            address.city,
            address.state,
            address.zipCode,
            address.country,
            address.phone,
          ]
            .filter(Boolean)
            .join(', ') || 'N/A',
          320,
          146,
          { width: 225 },
        );

      // ── Items table ───────────────────────────────────────────
      let y = 225;
      doc.rect(50, y, 495, 24).fill('#F3F4F6');
      drawRow(doc, y + 8, ['Description', 'Qty', 'Unit Price', 'Amount'], {
        bold: true,
      });
      y += 34;

      const items = Array.isArray(order?.items) ? order.items : [];
      items.forEach(item => {
        if (y > 700) {
          doc.addPage();
          y = 60;
        }
        const qty = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        drawRow(doc, y, [
          productTitle(item),
          String(qty),
          money(price),
          money(price * qty),
        ]);
        y += 22;
      });

      doc.moveTo(50, y).lineTo(545, y).strokeColor('#E5E7EB').stroke();
      y += 15;

      // ── Totals ────────────────────────────────────────────────
      const totals = [
        ['Subtotal', money(order?.subtotal)],
        ...(order?.discount
          ? [['Discount', `- ${money(order.discount)}`]]
          : []),
        ['Shipping', money(order?.shippingCost)],
      ];

      totals.forEach(([label, value]) => {
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#374151')
          .text(label, 350, y, { width: 90, align: 'right' });
        doc.text(value, 440, y, { width: 105, align: 'right' });
        y += 20;
      });

      doc
        .moveTo(350, y)
        .lineTo(545, y)
        .strokeColor('#E5E7EB')
        .stroke();
      y += 8;
      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#111827')
        .text('Total', 350, y, { width: 90, align: 'right' });
      doc.text(money(order?.total), 440, y, {
        width: 105,
        align: 'right',
      });

      // ── Footer ────────────────────────────────────────────────
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#9CA3AF')
        .text(
          `Payment: ${(order?.paymentMethod || '-').toUpperCase()} • Status: ${(order?.orderStatus || '-').toUpperCase()}`,
          50,
          790,
          { width: 495, align: 'center' },
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
