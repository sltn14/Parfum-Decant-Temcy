import { useState, useEffect } from 'react'
import { TrendingUp, FileText, FileSpreadsheet } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

// Helper load logo jadi base64
const loadImageAsBase64 = (url) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      canvas.getContext('2d').drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

export default function AdminSalesReport() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(null)
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => { fetchReport() }, [])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams(dateRange)
      const res = await api.get(`/admin/sales-report?${params}`)
      setReport(res.data)
    } catch { toast.error('Gagal memuat laporan') }
    finally { setLoading(false) }
  }

  const getTopProducts = () => {
    if (!report?.orders) return []
    const map = {}
    report.orders.forEach(order => {
      order.items?.forEach(item => {
        if (!map[item.product_name]) {
          map[item.product_name] = { name: item.product_name, brand: item.brand, qty: 0, revenue: 0, hpp: 0 }
        }
        map[item.product_name].qty += item.quantity
        map[item.product_name].revenue += item.price * item.quantity
        const costPerMl = item.product?.cost_price_per_ml || 0
        map[item.product_name].hpp += costPerMl * item.size_ml * item.quantity
      })
    })
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 8)
  }

  const getTotalHPP = () => {
    if (!report?.orders) return 0
    return report.orders.reduce((total, order) => {
      return total + (order.items?.reduce((sum, item) => {
        const costPerMl = item.product?.cost_price_per_ml || 0
        return sum + (costPerMl * item.size_ml * item.quantity)
      }, 0) || 0)
    }, 0)
  }

  const topProducts = getTopProducts()
  const totalHPP = getTotalHPP()
  const laba = (report?.totalRevenue || 0) - totalHPP
  const marginPct = report?.totalRevenue > 0 ? ((laba / report.totalRevenue) * 100).toFixed(1) : '0'

  // ===== EXPORT EXCEL =====
  const exportExcel = async () => {
    setExporting('excel')
    try {
      const ExcelJSModule = await import('exceljs')
      const ExcelJS = ExcelJSModule.default || ExcelJSModule
      const wb = new ExcelJS.Workbook()
      wb.creator = 'Decant Temcy'
      wb.created = new Date()

      // Load logo
      let logoId = null
      try {
        const logoBase64 = await loadImageAsBase64('/logo.png')
        if (logoBase64) {
          logoId = wb.addImage({
            base64: logoBase64.replace('data:image/png;base64,', ''),
            extension: 'png'
          })
        }
      } catch {}

      // Palette
      const C = {
        RED: 'FFB91C1C',
        DARK_RED: 'FF7F1D1D',
        LIGHT_RED: 'FFFFF5F5',
        WHITE: 'FFFFFFFF',
        DARK: 'FF111827',
        GRAY: 'FF6B7280',
        GREEN: 'FF16A34A',
        LIGHT: 'FFF9FAFB',
        BORDER: 'FFE5E7EB'
      }

      const borderAll = (color = C.BORDER) => ({
        top: { style: 'thin', color: { argb: color } },
        bottom: { style: 'thin', color: { argb: color } },
        left: { style: 'thin', color: { argb: color } },
        right: { style: 'thin', color: { argb: color } }
      })

      const colHeaderStyle = {
        font: { bold: true, color: { argb: C.WHITE }, size: 9 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.DARK } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: borderAll(C.DARK)
      }

      const dataStyle = (isAlt, align = 'left', bold = false, color = C.DARK) => ({
        font: { bold, color: { argb: color }, size: 9.5 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: isAlt ? C.LIGHT_RED : C.WHITE } },
        alignment: { horizontal: align, vertical: 'middle' },
        border: borderAll()
      })

      const totalStyle = (align = 'right') => ({
        font: { bold: true, color: { argb: C.WHITE }, size: 9.5 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.RED } },
        alignment: { horizontal: align, vertical: 'middle' },
        border: borderAll(C.RED)
      })

      const addPageHeader = (ws, title, cols) => {
        // Row 1-5: header area
        for (let r = 1; r <= 5; r++) {
          ws.getRow(r).height = r === 2 ? 32 : r === 3 ? 20 : r === 4 ? 16 : r === 5 ? 6 : 16
        }

        // Merge semua kolom di baris 1-5
        const lastCol = String.fromCharCode(64 + cols)
        ;[1,2,3,4].forEach(r => {
          ws.mergeCells(`A${r}:${lastCol}${r}`)
        })

        // Background header area
        ;[1,2,3,4].forEach(r => {
          ws.getCell(`A${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F8F8' } }
        })

        // Garis merah atas
        ws.getCell('A1').border = { top: { style: 'thick', color: { argb: C.RED } } }

        // Nama toko
        ws.getCell('A2').value = 'DECANT TEMCY'
        ws.getCell('A2').font = { bold: true, size: 20, color: { argb: C.DARK } }
        ws.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' }

        // Judul laporan
        ws.getCell('A3').value = title
        ws.getCell('A3').font = { bold: true, size: 11, color: { argb: C.RED } }
        ws.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' }

        // Periode
        ws.getCell('A4').value = `Periode: ${dateRange.start_date} s/d ${dateRange.end_date}  |  Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
        ws.getCell('A4').font = { italic: true, size: 9, color: { argb: C.GRAY } }
        ws.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' }

        // Divider merah
        ws.mergeCells(`A5:${lastCol}5`)
        ws.getCell('A5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.RED } }

        // Logo
        if (logoId !== null) {
          ws.addImage(logoId, {
            tl: { col: 0, row: 0 },
            ext: { width: 55, height: 55 },
            editAs: 'oneCell'
          })
        }
      }

      const addSectionLabel = (ws, row, label, cols) => {
        const lastCol = String.fromCharCode(64 + cols)
        ws.mergeCells(`A${row}:${lastCol}${row}`)
        ws.getCell(`A${row}`).value = label
        ws.getCell(`A${row}`).font = { bold: true, size: 9, color: { argb: C.WHITE } }
        ws.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.DARK_RED } }
        ws.getCell(`A${row}`).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
        ws.getRow(row).height = 18
      }

      // ===== SHEET 1: RINGKASAN =====
      const ws1 = wb.addWorksheet('Ringkasan')
      ws1.columns = [{ width: 40 }, { width: 24 }]
      addPageHeader(ws1, 'LAPORAN PENJUALAN', 2)

      addSectionLabel(ws1, 7, 'RINGKASAN KEUANGAN', 2)

      // Header kolom
      ws1.getRow(8).values = ['Keterangan', 'Nilai']
      ws1.getCell('A8').style = colHeaderStyle
      ws1.getCell('B8').style = colHeaderStyle
      ws1.getRow(8).height = 20

      const summaryData = [
        ['Total Revenue (Pendapatan)', report?.totalRevenue || 0, 'rupiah', false, C.DARK],
        ['Total HPP (Harga Pokok Penjualan)', totalHPP, 'rupiah', false, C.DARK],
        ['Laba Kotor', laba, 'rupiah', true, laba >= 0 ? C.GREEN : C.RED],
        ['Margin Keuntungan', `${marginPct}%`, 'text', false, C.DARK],
        ['Total Pesanan Selesai', `${report?.totalOrders || 0} pesanan`, 'text', false, C.DARK],
        ['Rata-rata per Pesanan', report?.totalOrders > 0 ? Math.floor(report.totalRevenue / report.totalOrders) : 0, 'rupiah', false, C.DARK],
      ]

      summaryData.forEach(([label, value, type, bold, color], i) => {
        const row = 9 + i
        const isAlt = i % 2 === 0

        ws1.getCell(`A${row}`).value = label
        ws1.getCell(`A${row}`).style = dataStyle(isAlt, 'left')

        ws1.getCell(`B${row}`).value = value
        ws1.getCell(`B${row}`).style = {
          ...dataStyle(isAlt, 'right', bold, color),
          numFmt: type === 'rupiah' ? '"Rp"#,##0' : undefined
        }
        ws1.getRow(row).height = 18
      })

      // Highlight laba
      const labaRow = 16
      ws1.mergeCells(`A${labaRow}:B${labaRow}`)
      ws1.getCell(`A${labaRow}`).value = `${laba >= 0 ? '✓' : '✕'}  Laba Bersih: ${formatRupiah(laba)}   |   Margin: ${marginPct}%`
      ws1.getCell(`A${labaRow}`).font = { bold: true, size: 10, color: { argb: laba >= 0 ? C.GREEN : C.RED } }
      ws1.getCell(`A${labaRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: laba >= 0 ? 'FFF0FDF4' : 'FFFFF5F5' } }
      ws1.getCell(`A${labaRow}`).alignment = { horizontal: 'center', vertical: 'middle' }
      ws1.getCell(`A${labaRow}`).border = {
        top: { style: 'medium', color: { argb: laba >= 0 ? C.GREEN : C.RED } },
        bottom: { style: 'medium', color: { argb: laba >= 0 ? C.GREEN : C.RED } },
        left: { style: 'thin', color: { argb: laba >= 0 ? C.GREEN : C.RED } },
        right: { style: 'thin', color: { argb: laba >= 0 ? C.GREEN : C.RED } },
      }
      ws1.getRow(labaRow).height = 22

      // ===== SHEET 2: PRODUK TERLARIS =====
      const ws2 = wb.addWorksheet('Produk Terlaris')
      ws2.columns = [
        { width: 5 }, { width: 18 }, { width: 30 }, { width: 10 },
        { width: 20 }, { width: 20 }, { width: 20 }, { width: 12 }
      ]
      addPageHeader(ws2, 'PRODUK TERLARIS', 8)
      addSectionLabel(ws2, 7, 'PERINGKAT PRODUK BERDASARKAN REVENUE', 8)

      const h2 = ['No', 'Brand', 'Nama Produk', 'Qty', 'Revenue', 'HPP', 'Laba Kotor', 'Margin']
      ws2.getRow(8).values = h2
      h2.forEach((_, i) => { ws2.getCell(8, i + 1).style = colHeaderStyle })
      ws2.getRow(8).height = 20

      topProducts.forEach((p, i) => {
        const row = 9 + i
        const isAlt = i % 2 === 0
        const margin = p.revenue > 0 ? ((p.revenue - p.hpp) / p.revenue * 100).toFixed(1) : '0'
        const labaP = p.revenue - p.hpp

        const vals = [i + 1, p.brand, p.name, p.qty, p.revenue, p.hpp, labaP, `${margin}%`]
        vals.forEach((val, j) => {
          const cell = ws2.getCell(row, j + 1)
          cell.value = val
          const isRupiah = [4, 5, 6].includes(j)
          const color = j === 6 ? (labaP >= 0 ? C.GREEN : C.RED) : C.DARK
          const bold = j === 6
          const align = j === 0 ? 'center' : j < 3 ? 'left' : 'right'
          cell.style = { ...dataStyle(isAlt, align, bold, color), numFmt: isRupiah ? '"Rp"#,##0' : undefined }
        })
        ws2.getRow(row).height = 17
      })

      // Total baris
      const tr2 = 9 + topProducts.length
      const totals = [
        '', 'TOTAL', '',
        topProducts.reduce((s, p) => s + p.qty, 0),
        topProducts.reduce((s, p) => s + p.revenue, 0),
        topProducts.reduce((s, p) => s + p.hpp, 0),
        topProducts.reduce((s, p) => s + (p.revenue - p.hpp), 0),
        ''
      ]
      totals.forEach((val, j) => {
        const cell = ws2.getCell(tr2, j + 1)
        cell.value = val
        const isRupiah = [4, 5, 6].includes(j)
        cell.style = { ...totalStyle(j < 3 ? 'left' : 'right'), numFmt: isRupiah ? '"Rp"#,##0' : undefined }
      })
      ws2.getRow(tr2).height = 20

      // ===== SHEET 3: TRANSAKSI =====
      const ws3 = wb.addWorksheet('Transaksi')
      ws3.columns = [
        { width: 5 }, { width: 24 }, { width: 16 },
        { width: 20 }, { width: 16 }, { width: 20 }
      ]
      addPageHeader(ws3, 'DETAIL TRANSAKSI', 6)
      addSectionLabel(ws3, 7, 'SEMUA TRANSAKSI DENGAN STATUS SELESAI', 6)

      const h3 = ['No', 'Kode Order', 'Tanggal', 'Subtotal', 'Diskon', 'Total Bayar']
      ws3.getRow(8).values = h3
      h3.forEach((_, i) => { ws3.getCell(8, i + 1).style = colHeaderStyle })
      ws3.getRow(8).height = 20

      ;(report?.orders || []).forEach((order, i) => {
        const row = 9 + i
        const isAlt = i % 2 === 0
        const subtotal = order.total_price + (order.discount_amount || 0)
        const vals = [
          i + 1,
          order.order_code,
          new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          subtotal,
          order.discount_amount || 0,
          order.total_price
        ]
        vals.forEach((val, j) => {
          const cell = ws3.getCell(row, j + 1)
          cell.value = val
          const isRupiah = [3, 4, 5].includes(j)
          const color = j === 4 && val > 0 ? C.GREEN : j === 5 ? C.RED : C.DARK
          const bold = j === 1 || j === 5
          const align = j === 0 || j === 2 ? 'center' : j === 1 ? 'left' : 'right'
          cell.style = { ...dataStyle(isAlt, align, bold, color), numFmt: isRupiah ? '"Rp"#,##0' : undefined }
        })
        ws3.getRow(row).height = 17
      })

      // Grand total
      const gt = 9 + (report?.orders?.length || 0)
      const gtVals = [
        '', 'GRAND TOTAL', '',
        (report?.orders || []).reduce((s, o) => s + o.total_price + (o.discount_amount || 0), 0),
        (report?.orders || []).reduce((s, o) => s + (o.discount_amount || 0), 0),
        (report?.orders || []).reduce((s, o) => s + o.total_price, 0)
      ]
      gtVals.forEach((val, j) => {
        const cell = ws3.getCell(gt, j + 1)
        cell.value = val
        cell.style = { ...totalStyle(j < 2 ? 'left' : 'right'), numFmt: [3, 4, 5].includes(j) ? '"Rp"#,##0' : undefined }
      })
      ws3.getRow(gt).height = 20

      // Download
      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Laporan_Decant_Temcy_${dateRange.start_date}_${dateRange.end_date}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Export Excel berhasil!')
    } catch (err) {
      console.error(err)
      toast.error('Gagal export Excel: ' + err.message)
    } finally {
      setExporting(null)
    }
  }

  // ===== EXPORT PDF =====
  const exportPDF = async () => {
    setExporting('pdf')
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W = doc.internal.pageSize.getWidth()
      const H = doc.internal.pageSize.getHeight()

      // Load logo
      let logoData = null
      try { logoData = await loadImageAsBase64('/logo.png') } catch {}

      const RED = [185, 28, 28]
      const DARK = [17, 24, 39]
      const GRAY = [107, 114, 128]
      const LIGHT = [249, 249, 251]
      const WHITE = [255, 255, 255]
      const GREEN = [22, 163, 74]
      const RED_LIGHT = [255, 245, 245]

      const drawPageFrame = () => {
        // Background putih bersih
        doc.setFillColor(...WHITE)
        doc.rect(0, 0, W, H, 'F')

        // Garis merah tipis atas
        doc.setFillColor(...RED)
        doc.rect(0, 0, W, 1.2, 'F')

        // Logo
        if (logoData) {
          doc.addImage(logoData, 'PNG', 13, 5, 16, 16)
        }

        // Nama perusahaan
        doc.setFontSize(15)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...DARK)
        doc.text('DECANT TEMCY', 33, 11)

        // Label
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...GRAY)
        doc.text('LAPORAN PENJUALAN', 33, 17)

        // Info periode di kanan
        doc.setFontSize(7.5)
        doc.text(`Periode  : ${dateRange.start_date} s/d ${dateRange.end_date}`, W - 14, 9, { align: 'right' })
        doc.text(`Dicetak  : ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, W - 14, 14.5, { align: 'right' })

        // Garis pemisah tipis
        doc.setDrawColor(220, 220, 225)
        doc.setLineWidth(0.25)
        doc.line(13, 24, W - 13, 24)

        // Garis merah bawah
        doc.setFillColor(...RED)
        doc.rect(0, H - 1.2, W, 1.2, 'F')

        // Footer text
        doc.setFontSize(7)
        doc.setTextColor(...GRAY)
        doc.setFont('helvetica', 'normal')
        doc.text('Decant Temcy', 13, H - 4.5)
      }

      const sectionTitle = (label, y) => {
        // Dot merah + label
        doc.setFillColor(...RED)
        doc.rect(13, y - 2, 2, 5, 'F')
        doc.setFontSize(8.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...RED)
        doc.text(label, 17, y + 1.5)
        // Garis abu di bawah
        doc.setDrawColor(220, 220, 225)
        doc.setLineWidth(0.2)
        doc.line(13, y + 4, W - 13, y + 4)
        doc.setTextColor(...DARK)
      }

      const tableBase = {
        theme: 'plain',
        headStyles: {
          fillColor: DARK, textColor: WHITE,
          fontStyle: 'bold', fontSize: 8.5,
          cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 }
        },
        footStyles: {
          fillColor: RED, textColor: WHITE,
          fontStyle: 'bold', fontSize: 8.5,
          cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 }
        },
        bodyStyles: {
          fontSize: 8.5, textColor: DARK,
          cellPadding: { top: 3.2, bottom: 3.2, left: 4, right: 4 }
        },
        alternateRowStyles: { fillColor: LIGHT },
        margin: { left: 13, right: 13 },
        tableLineColor: [225, 225, 230],
        tableLineWidth: 0.2
      }

      // ===== HAL 1 =====
      drawPageFrame()

      // Section 1: Ringkasan
      sectionTitle('Ringkasan Keuangan', 31)

      autoTable(doc, {
        ...tableBase,
        startY: 37,
        head: [['Keterangan', 'Nilai']],
        body: [
          ['Total Revenue (Pendapatan)', formatRupiah(report?.totalRevenue || 0)],
          ['Total HPP (Harga Pokok Penjualan)', formatRupiah(totalHPP)],
          ['Laba Kotor', formatRupiah(laba)],
          ['Margin Keuntungan', `${marginPct}%`],
          ['Jumlah Pesanan Selesai', `${report?.totalOrders || 0} pesanan`],
          ['Rata-rata Nilai per Pesanan', formatRupiah(report?.totalOrders > 0 ? Math.floor(report.totalRevenue / report.totalOrders) : 0)],
        ],
        columnStyles: {
          0: { cellWidth: 110 },
          1: { halign: 'right', fontStyle: 'bold' }
        },
        didParseCell: (d) => {
          if (d.section === 'body' && d.row.index === 2 && d.column.index === 1) {
            d.cell.styles.textColor = laba >= 0 ? GREEN : RED
          }
        }
      })

      // Kotak highlight laba
      const ly = doc.lastAutoTable.finalY + 4
      doc.setFillColor(...(laba >= 0 ? [240, 253, 244] : [255, 245, 245]))
      doc.setDrawColor(...(laba >= 0 ? GREEN : RED))
      doc.setLineWidth(0.35)
      doc.roundedRect(13, ly, W - 26, 13, 1.2, 1.2, 'FD')

      doc.setFontSize(7)
      doc.setTextColor(...GRAY)
      doc.setFont('helvetica', 'normal')
      doc.text('LABA KOTOR PERIODE INI', 18, ly + 4.5)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...(laba >= 0 ? GREEN : RED))
      doc.text(formatRupiah(laba), 18, ly + 10.5)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...GRAY)
      doc.text(`Margin ${marginPct}% dari total revenue`, W - 17, ly + 8, { align: 'right' })

      // Section 2: Produk Terlaris
      const py = ly + 20
      sectionTitle('Produk Terlaris', py)

      autoTable(doc, {
        ...tableBase,
        startY: py + 6,
        head: [['No', 'Brand', 'Produk', 'Qty', 'Revenue', 'HPP', 'Laba']],
        body: topProducts.map((p, i) => [
          i + 1, p.brand, p.name, p.qty,
          formatRupiah(p.revenue), formatRupiah(p.hpp), formatRupiah(p.revenue - p.hpp)
        ]),
        foot: [[
          '', '', 'TOTAL',
          topProducts.reduce((s, p) => s + p.qty, 0),
          formatRupiah(topProducts.reduce((s, p) => s + p.revenue, 0)),
          formatRupiah(topProducts.reduce((s, p) => s + p.hpp, 0)),
          formatRupiah(topProducts.reduce((s, p) => s + (p.revenue - p.hpp), 0))
        ]],
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 22 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 12, halign: 'center' },
          4: { cellWidth: 28, halign: 'right' },
          5: { cellWidth: 26, halign: 'right' },
          6: { cellWidth: 26, halign: 'right' }
        },
        didParseCell: (d) => {
          if (d.section === 'body' && d.column.index === 6) {
            const p = topProducts[d.row.index]
            if (p) d.cell.styles.textColor = p.revenue - p.hpp >= 0 ? GREEN : RED
          }
        }
      })

      // ===== HAL 2: TRANSAKSI =====
      if (report?.orders?.length > 0) {
        doc.addPage()
        drawPageFrame()

        sectionTitle('Detail Transaksi Selesai', 31)

        autoTable(doc, {
          ...tableBase,
          startY: 37,
          head: [['No', 'Kode Order', 'Tanggal', 'Subtotal', 'Diskon', 'Total Bayar']],
          body: report.orders.map((order, i) => [
            i + 1,
            order.order_code,
            new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
            formatRupiah(order.total_price + (order.discount_amount || 0)),
            order.discount_amount > 0 ? `-${formatRupiah(order.discount_amount)}` : '-',
            formatRupiah(order.total_price)
          ]),
          foot: [[
            '', '', 'GRAND TOTAL', '', '',
            formatRupiah((report?.orders || []).reduce((s, o) => s + o.total_price, 0))
          ]],
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 44, fontStyle: 'bold' },
            2: { cellWidth: 28, halign: 'center' },
            3: { cellWidth: 32, halign: 'right' },
            4: { cellWidth: 25, halign: 'right' },
            5: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' }
          },
          didParseCell: (d) => {
            if (d.section === 'body') {
              if (d.column.index === 4 && d.cell.raw !== '-') d.cell.styles.textColor = GREEN
              if (d.column.index === 5) d.cell.styles.fontStyle = 'bold'
            }
          }
        })
      }

      // Footer nomor halaman
      const total = doc.internal.getNumberOfPages()
      for (let i = 1; i <= total; i++) {
        doc.setPage(i)
        doc.setFontSize(7)
        doc.setTextColor(...GRAY)
        doc.text(`Hal. ${i} / ${total}`, W - 13, H - 4.5, { align: 'right' })
      }

      doc.save(`Laporan_Decant_Temcy_${dateRange.start_date}_${dateRange.end_date}.pdf`)
      toast.success('Export PDF berhasil!')
    } catch (err) {
      console.error(err)
      toast.error('Gagal export PDF: ' + err.message)
    } finally {
      setExporting(null)
    }
  }

  const inputStyle = {
    padding: '10px 14px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)', fontSize: '0.85rem',
    outline: 'none', fontFamily: 'var(--font-sans)', fontWeight: 500
  }

  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .sales-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
          }
          .sales-export-btns {
            flex-wrap: wrap !important;
            gap: 8px !important;
          }
          .sales-filter {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .sales-filter > div {
            width: 100% !important;
          }
          .sales-filter input {
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .sales-summary-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .sales-bottom-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="sales-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{
            fontSize: '0.62rem', fontWeight: 800,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--accent-red)', marginBottom: 8
          }}>Analitik</div>
          <h1 style={{
            fontWeight: 900, fontSize: '1.8rem',
            letterSpacing: '-0.02em', textTransform: 'uppercase',
            color: 'var(--text-primary)'
          }}>LAPORAN PENJUALAN</h1>
        </div>

        {!loading && report && (
          <div className="sales-export-btns" style={{ display: 'flex', gap: 10 }}>
            <button onClick={exportExcel} disabled={!!exporting}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px',
                background: exporting ? 'var(--border-hover)' : 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: 'var(--radius-sm)',
                color: '#22c55e', fontWeight: 800,
                fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: exporting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}>
              <FileSpreadsheet size={14} />
              {exporting === 'excel' ? 'EXPORTING...' : 'EXPORT EXCEL'}
            </button>
            <button onClick={exportPDF} disabled={!!exporting}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px',
                background: exporting ? 'var(--border-hover)' : 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 'var(--radius-sm)',
                color: '#ef4444', fontWeight: 800,
                fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: exporting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}>
              <FileText size={14} />
              {exporting === 'pdf' ? 'EXPORTING...' : 'EXPORT PDF'}
            </button>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="sales-filter" style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px', marginBottom: 24,
        display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap'
      }}>
        {[
          { label: 'DARI TANGGAL', key: 'start_date' },
          { label: 'SAMPAI TANGGAL', key: 'end_date' }
        ].map(({ label, key }) => (
          <div key={key}>
            <label style={{
              display: 'block', fontSize: '0.58rem', fontWeight: 800,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'var(--text-muted)', marginBottom: 6
            }}>{label}</label>
            <input type="date" value={dateRange[key]}
              onChange={e => setDateRange(prev => ({ ...prev, [key]: e.target.value }))}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
            />
          </div>
        ))}
        <button onClick={fetchReport}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 22px',
            background: 'var(--accent-red)', color: 'white',
            borderRadius: 'var(--radius-sm)', fontWeight: 800,
            fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(240,46,41,0.3)'
          }}>
          <TrendingUp size={14} /> TAMPILKAN
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '2px solid var(--border-default)',
            borderTopColor: 'var(--accent-red)',
            animation: 'rotate-slow 0.8s linear infinite'
          }} />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="sales-summary-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 14, marginBottom: 24
          }}>
            {[
              { label: 'TOTAL REVENUE', value: formatRupiah(report?.totalRevenue || 0), color: '#22c55e' },
              { label: 'TOTAL HPP', value: formatRupiah(totalHPP), color: '#f59e0b' },
              { label: 'LABA KOTOR', value: formatRupiah(laba), color: laba >= 0 ? '#3b82f6' : '#ef4444' },
              { label: 'MARGIN', value: `${marginPct}%`, color: '#8b5cf6' },
              { label: 'PESANAN SELESAI', value: `${report?.totalOrders || 0} order`, color: '#06b6d4' }
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)', padding: '18px 20px',
                position: 'relative', overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute', top: -16, right: -16,
                  width: 64, height: 64, borderRadius: '50%',
                  background: color + '12'
                }} />
                <div style={{
                  fontSize: '0.56rem', fontWeight: 800,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'var(--text-muted)', marginBottom: 10
                }}>{label}</div>
                <div style={{
                  fontSize: value.length > 14 ? '0.88rem' : '1.1rem',
                  fontWeight: 900, color, letterSpacing: '-0.02em'
                }}>{value}</div>
              </div>
            ))}
          </div>

          <div className="sales-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Top Products */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)', padding: 24
            }}>
              <div style={{
                fontSize: '0.65rem', fontWeight: 800,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'var(--text-primary)', marginBottom: 20
              }}>PRODUK TERLARIS + HPP</div>

              {topProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  Belum ada data penjualan
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {topProducts.map((p, i) => (
                    <div key={i}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-start', marginBottom: 6
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: 'var(--radius-xs)',
                            background: i < 3 ? 'var(--accent-red)' : 'var(--bg-elevated)',
                            color: i < 3 ? 'white' : 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.62rem', fontWeight: 900, flexShrink: 0
                          }}>{i + 1}</div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem', lineHeight: 1.2 }}>{p.name}</div>
                            <div style={{
                              fontSize: '0.62rem', fontWeight: 800,
                              letterSpacing: '0.08em', textTransform: 'uppercase',
                              color: 'var(--accent-red)', marginTop: 2
                            }}>{p.brand} · {p.qty} terjual</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#22c55e' }}>
                            {formatRupiah(p.revenue)}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: 600 }}>
                            HPP: {formatRupiah(p.hpp)}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#3b82f6', fontWeight: 700 }}>
                            Laba: {formatRupiah(p.revenue - p.hpp)}
                          </div>
                        </div>
                      </div>
                      <div style={{ height: 3, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          width: `${(p.revenue / topProducts[0].revenue) * 100}%`,
                          height: '100%',
                          background: i < 3 ? 'var(--accent-red)' : 'var(--border-hover)',
                          borderRadius: 2
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)', padding: 24
            }}>
              <div style={{
                fontSize: '0.65rem', fontWeight: 800,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'var(--text-primary)', marginBottom: 20
              }}>TRANSAKSI SELESAI</div>

              {!report?.orders?.length ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  Belum ada transaksi selesai
                </div>
              ) : (
                <div style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {report.orders.map((order, i) => (
                    <div key={order.order_id} style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', padding: '11px 0',
                      borderBottom: i < report.orders.length - 1 ? '1px solid var(--border-default)' : 'none'
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 2 }}>
                          {order.order_code}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {new Date(order.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                          {order.discount_amount > 0 && (
                            <span style={{ color: '#22c55e', marginLeft: 6 }}>
                              diskon {formatRupiah(order.discount_amount)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, color: '#22c55e', fontSize: '0.85rem' }}>
                        {formatRupiah(order.total_price)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}