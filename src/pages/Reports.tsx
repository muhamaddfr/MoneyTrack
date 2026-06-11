import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dbService } from '../services/db';
import { Transaction } from '../services/db/types';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { FileDown, Calendar, TrendingUp, TrendingDown, ArrowLeftRight, Award } from 'lucide-react';

export const Reports: React.FC = () => {
  // Queries
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => dbService.getTransactions(),
  });

  // State
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  
  // Date values
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // 'YYYY-MM'
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString()); // 'YYYY'

  // Calculations
  const getFilteredTransactions = (): Transaction[] => {
    return transactions.filter(tx => {
      if (reportType === 'daily') {
        return tx.transaction_date === selectedDate;
      } else if (reportType === 'monthly') {
        return tx.transaction_date.slice(0, 7) === selectedMonth;
      } else {
        return tx.transaction_date.slice(0, 4) === selectedYear;
      }
    });
  };

  const filteredTxs = getFilteredTransactions();

  const totalIncome = filteredTxs
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTxs
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashflow = totalIncome - totalExpense;

  // Calculate Largest Expense Category
  const getLargestExpenseCategory = (): { name: string; amount: number } => {
    const categoryTotals: { [name: string]: number } = {};
    
    filteredTxs
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const catName = t.category_name || 'Lainnya';
        categoryTotals[catName] = (categoryTotals[catName] || 0) + t.amount;
      });

    let topCatName = '-';
    let topCatAmount = 0;

    Object.entries(categoryTotals).forEach(([name, amount]) => {
      if (amount > topCatAmount) {
        topCatAmount = amount;
        topCatName = name;
      }
    });

    return { name: topCatName, amount: topCatAmount };
  };

  const topCategory = getLargestExpenseCategory();

  // Excel Exporter
  const handleExportExcel = () => {
    const periodLabel = reportType === 'daily' 
      ? selectedDate 
      : reportType === 'monthly' 
        ? selectedMonth 
        : selectedYear;

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();

    // 1. Summary Sheet Data
    const summaryData = [
      ['LAPORAN KEUANGAN MONEYTRACK'],
      ['Jenis Laporan', reportType.toUpperCase()],
      ['Periode', periodLabel],
      [],
      ['Total Pemasukan', totalIncome],
      ['Total Pengeluaran', totalExpense],
      ['Net Cashflow (Selisih)', netCashflow],
      ['Kategori Pengeluaran Terbesar', `${topCategory.name} (${topCategory.amount})`],
      [],
      ['DETAIL TRANSAKSI'],
      ['Tanggal', 'Deskripsi', 'Jenis', 'Kategori', 'Wallet', 'Nominal']
    ];

    // Append transaction list
    filteredTxs.forEach(t => {
      summaryData.push([
        t.transaction_date,
        t.notes,
        t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        t.category_name || 'Unknown',
        t.wallet_name || 'Unknown',
        t.amount
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Keuangan');

    // Download
    XLSX.writeFile(wb, `MoneyTrack_Laporan_${reportType}_${periodLabel}.xlsx`);
  };

  // PDF Exporter
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const periodLabel = reportType === 'daily' 
      ? selectedDate 
      : reportType === 'monthly' 
        ? selectedMonth 
        : selectedYear;

    // Title & Metadata
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('MoneyTrack Report', 14, 20);

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Tipe Laporan: ${reportType.toUpperCase()}`, 14, 28);
    doc.text(`Periode: ${periodLabel}`, 14, 33);
    doc.text(`Dicetak Pada: ${new Date().toLocaleString('id-ID')}`, 14, 38);

    // Summary Card Grid
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(14, 45, 182, 35, 3, 3, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text('RINGKASAN LAPORAN', 20, 52);

    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Total Pemasukan:`, 20, 60);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // emerald-500
    doc.text(formatIDR(totalIncome), 60, 60);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Total Pengeluaran:`, 20, 66);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(244, 63, 94); // rose-500
    doc.text(formatIDR(totalExpense), 60, 66);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Net Cashflow (Selisih):`, 20, 72);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(netCashflow >= 0 ? 16 : 244, netCashflow >= 0 ? 185 : 63, netCashflow >= 0 ? 129 : 94);
    doc.text(formatIDR(netCashflow), 60, 72);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Kategori Terbesar:`, 115, 60);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${topCategory.name} (${formatIDR(topCategory.amount)})`, 147, 60);

    // Table Header
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Daftar Transaksi', 14, 92);

    doc.setFontSize(9);
    doc.setFillColor(15, 23, 42);
    doc.rect(14, 97, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.text('Tanggal', 17, 102);
    doc.text('Keterangan', 45, 102);
    doc.text('Kategori', 105, 102);
    doc.text('Wallet', 145, 102);
    doc.text('Nominal', 175, 102);

    // Table Rows
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    let y = 110;
    
    filteredTxs.forEach((t, i) => {
      // Draw background stripe
      if (i % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y - 4, 182, 6.5, 'F');
      }
      
      doc.text(t.transaction_date, 17, y);
      
      // Truncate notes if too long
      const notes = t.notes.length > 30 ? t.notes.substring(0, 28) + '..' : t.notes;
      doc.text(notes, 45, y);
      
      doc.text(t.category_name || '-', 105, y);
      doc.text(t.wallet_name || '-', 145, y);
      
      // Color coded amount
      doc.setFont('Helvetica', 'bold');
      if (t.type === 'income') {
        doc.setTextColor(16, 185, 129);
        doc.text(`+${formatIDR(t.amount)}`, 175, y);
      } else {
        doc.setTextColor(244, 63, 94);
        doc.text(`-${formatIDR(t.amount)}`, 175, y);
      }
      
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      y += 6.5;

      // Handle page break
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    // Save
    doc.save(`MoneyTrack_Laporan_${reportType}_${periodLabel}.pdf`);
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Laporan Keuangan</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Pantau arus kas masuk-keluar secara visual dan ekspor laporannya</p>
        </div>
        
        {/* Export Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleExportExcel}
            disabled={filteredTxs.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2.5 font-semibold text-xs border border-[var(--color-border)] hover:bg-slate-200/50 dark:hover:bg-slate-880/60 rounded-xl text-slate-700 dark:text-slate-300 disabled:opacity-40 transition-all cursor-pointer"
          >
            <FileDown size={14} className="text-violet-600 dark:text-violet-400" />
            Ekspor Excel
          </button>
          <button
            onClick={handleExportPDF}
            disabled={filteredTxs.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2.5 font-semibold text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white disabled:opacity-40 rounded-xl transition-all shadow-lg glow-brand cursor-pointer"
          >
            <FileDown size={14} />
            Unduh PDF
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex gap-2 bg-slate-200/50 dark:bg-[#151b2c] p-1.5 rounded-xl border border-slate-300/30 dark:border-slate-800 max-w-sm">
        {(['daily', 'monthly', 'yearly'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setReportType(type)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              reportType === type
                ? 'bg-violet-600/10 text-violet-600 dark:text-violet-400 border border-violet-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {type === 'daily' ? 'Harian' : type === 'monthly' ? 'Bulanan' : 'Tahunan'}
          </button>
        ))}
      </div>

      {/* Date Selectors Section */}
      <div className="glass-panel rounded-2xl p-5 border border-[var(--color-border)] flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/15 text-violet-600 dark:text-violet-400 rounded-xl">
            <Calendar size={18} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Pilih Periode</span>
            
            {reportType === 'daily' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-0 text-sm font-bold text-slate-800 dark:text-slate-200 focus:ring-0 focus:outline-none p-0 mt-0.5"
              />
            )}

            {reportType === 'monthly' && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border-0 text-sm font-bold text-slate-800 dark:text-slate-200 focus:ring-0 focus:outline-none p-0 mt-0.5"
              />
            )}

            {reportType === 'yearly' && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent border-0 text-sm font-bold text-slate-800 dark:text-slate-200 focus:ring-0 focus:outline-none p-0 mt-0.5 cursor-pointer"
              >
                {[2024, 2025, 2026, 2027, 2028].map(y => (
                  <option key={y} value={y.toString()} className="bg-[var(--color-card)] text-[var(--color-text-primary)]">{y}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Summary Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
        {/* Pemasukan */}
        <div className="glass-panel rounded-2xl p-5 border-l-4 border-emerald-500">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Pemasukan</span>
            <TrendingUp size={16} className="text-emerald-500 dark:text-emerald-400" />
          </div>
          <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-3">{formatIDR(totalIncome)}</h3>
        </div>

        {/* Pengeluaran */}
        <div className="glass-panel rounded-2xl p-5 border-l-4 border-rose-500">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Pengeluaran</span>
            <TrendingDown size={16} className="text-rose-500 dark:text-rose-400" />
          </div>
          <h3 className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-3">{formatIDR(totalExpense)}</h3>
        </div>

        {/* Selisih / Cashflow */}
        <div className={`glass-panel rounded-2xl p-5 border-l-4 ${netCashflow >= 0 ? 'border-violet-500' : 'border-amber-500'}`}>
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Net Cashflow</span>
            <ArrowLeftRight size={16} className="text-violet-500 dark:text-violet-400" />
          </div>
          <h3 className={`text-xl font-extrabold mt-3 ${netCashflow >= 0 ? 'text-violet-600 dark:text-violet-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {formatIDR(netCashflow)}
          </h3>
        </div>

        {/* Kategori Terbesar */}
        <div className="glass-panel rounded-2xl p-5 border-l-4 border-slate-500">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Kategori Terbesar</span>
            <Award size={16} className="text-violet-500 dark:text-violet-400" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-200 mt-3 truncate">{topCategory.name}</h3>
          {topCategory.amount > 0 && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Total: {formatIDR(topCategory.amount)}</p>
          )}
        </div>
      </div>

      {/* Transaction List Table */}
      <div className="glass-panel rounded-2xl p-6 border border-[var(--color-border)]">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-4">
          Detail Transaksi Periode ini
        </h4>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-12 bg-slate-800/10 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredTxs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  <th className="py-3.5 px-3">Tanggal</th>
                  <th className="py-3.5 px-3">Catatan</th>
                  <th className="py-3.5 px-3">Jenis</th>
                  <th className="py-3.5 px-3">Kategori</th>
                  <th className="py-3.5 px-3">Wallet</th>
                  <th className="py-3.5 px-3 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40 text-sm">
                {filteredTxs.map(t => (
                  <tr key={t.id} className="hover:bg-slate-200/30 dark:hover:bg-slate-800/5 transition-all">
                    <td className="py-3.5 px-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{t.transaction_date}</td>
                    <td className="py-3.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{t.notes || '-'}</td>
                    <td className="py-3.5 px-3">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        t.type === 'income' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-455'
                      }`}>
                        {t.type === 'income' ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-xs text-slate-700 dark:text-slate-300">{t.category_name}</td>
                    <td className="py-3.5 px-3 text-xs text-slate-600 dark:text-slate-400">{t.wallet_name}</td>
                    <td className="py-3.5 px-3 text-right font-bold">
                      <span className={t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                        {t.type === 'income' ? '+' : '-'} {formatIDR(t.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 text-sm">
            Tidak ada transaksi dicatat untuk periode ini.
          </div>
        )}
      </div>
    </div>
  );
};
