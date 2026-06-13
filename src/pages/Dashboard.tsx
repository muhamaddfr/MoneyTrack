import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dbService } from '../services/db';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useTheme } from '../context/ThemeContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import {
  TrendingUp,
  TrendingDown,
  Wallet as WalletIcon,
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Plus,
  Eye,
  EyeOff,
  AlertTriangle,
  Target,
  CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Jakarta timezone date helpers
const getJakartaParts = (d: Date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
  const parts = formatter.formatToParts(d);
  const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return {
    year: parseInt(partMap.year, 10),
    month: parseInt(partMap.month, 10),
    day: parseInt(partMap.day, 10)
  };
};

const getJakartaDateString = (d: Date = new Date()): string => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(d);
  const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${partMap.year}-${partMap.month}-${partMap.day}`;
};

const getJakartaMonthString = (d: Date = new Date()): string => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit'
  });
  const parts = formatter.formatToParts(d);
  const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${partMap.year}-${partMap.month}`;
};

const getJakartaFormattedDate = (d: Date = new Date()): string => {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d);
};

const getJakartaFormattedMonthShort = (d: Date = new Date()): string => {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    month: 'short'
  }).format(d);
};

const getJakartaWeekRange = (d: Date = new Date()) => {
  const parts = getJakartaParts(d);
  const jakartaLocal = new Date(parts.year, parts.month - 1, parts.day);
  const dayOfWeek = jakartaLocal.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(jakartaLocal);
  monday.setDate(jakartaLocal.getDate() + diffToMonday);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const formatLocal = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };
  
  return {
    start: formatLocal(monday),
    end: formatLocal(sunday)
  };
};

const getJakartaLast6Months = (d: Date = new Date()): string[] => {
  const parts = getJakartaParts(d);
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const targetMonthDate = new Date(parts.year, parts.month - 1 - i, 1);
    const y = targetMonthDate.getFullYear();
    const m = String(targetMonthDate.getMonth() + 1).padStart(2, '0');
    months.push(`${y}-${m}`);
  }
  return months;
};

export const Dashboard: React.FC = () => {
  const { theme } = useTheme();

  // State for Privacy Mode (Hide Balance)
  const [privacyMode, setPrivacyMode] = useState(() => {
    return localStorage.getItem('flowfin_privacy_mode') === 'true';
  });

  const togglePrivacyMode = () => {
    setPrivacyMode(prev => {
      const newVal = !prev;
      localStorage.setItem('flowfin_privacy_mode', String(newVal));
      return newVal;
    });
  };

  // Queries
  const { data: wallets = [], isLoading: walletsLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => dbService.getWallets(),
  });

  const { data: transactions = [], isLoading: txsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => dbService.getTransactions(),
  });

  const { data: budgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => dbService.getBudgets(),
  });

  const isLoading = walletsLoading || txsLoading || budgetsLoading;

  // Formatting Currency helpers (IDR)
  const formatIDR = (num: number) => {
    if (privacyMode) {
      return num < 0 ? '-Rp ••••••' : 'Rp ••••••';
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  // Calculations
  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
  const currentMonth = getJakartaMonthString(); // 'YYYY-MM'

  const currentMonthTxs = transactions.filter(t => t.transaction_date.slice(0, 7) === currentMonth);
  const totalIncomeThisMonth = currentMonthTxs
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenseThisMonth = currentMonthTxs
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalTxsCount = transactions.length;

  // Harian (Daily) Calculations (Jakarta Time)
  const todayStr = getJakartaDateString();
  const todayTxs = transactions.filter(t => t.transaction_date === todayStr);
  const todayIncome = todayTxs
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const todayExpense = todayTxs
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Mingguan (Weekly) Calculations (Jakarta Time)
  const weekRange = getJakartaWeekRange();
  const startOfWeekStr = weekRange.start;
  const endOfWeekStr = weekRange.end;

  const thisWeekTxs = transactions.filter(t => t.transaction_date >= startOfWeekStr && t.transaction_date <= endOfWeekStr);
  const weeklyIncome = thisWeekTxs
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const weeklyExpense = thisWeekTxs
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Budget calculations for the Dashboard
  const activeBudgets = budgets.filter(b => b.period === currentMonth);
  const getCategorySpending = (catId: string, currentPeriod: string) => {
    return transactions
      .filter(
        t =>
          t.category_id === catId &&
          t.type === 'expense' &&
          t.transaction_date.slice(0, 7) === currentPeriod
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };
  const getBudgetBarColor = (percentage: number) => {
    if (percentage > 100) {
      return 'bg-rose-500 glow-rose';
    } else if (percentage >= 80) {
      return 'bg-amber-500';
    } else {
      return 'bg-violet-500 glow-brand';
    }
  };

  // Chart Data: Monthly Income vs Expense (Last 6 Months)
  const getMonthlyChartData = () => {
    const monthlyStats: { [month: string]: { income: number; expense: number } } = {};
    
    // Initialize last 6 months in Jakarta time
    const last6Months = getJakartaLast6Months();
    last6Months.forEach(mLabel => {
      monthlyStats[mLabel] = { income: 0, expense: 0 };
    });

    // Populate stats
    transactions.forEach(t => {
      const month = t.transaction_date.slice(0, 7);
      if (monthlyStats[month] !== undefined) {
        if (t.type === 'income') {
          monthlyStats[month].income += t.amount;
        } else {
          monthlyStats[month].expense += t.amount;
        }
      }
    });

    const labels = Object.keys(monthlyStats).map(m => {
      const [year, month] = m.split('-');
      const d = new Date(parseInt(year), parseInt(month) - 1, 1);
      return d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    });

    return {
      labels,
      datasets: [
        {
          label: 'Pemasukan',
          data: Object.values(monthlyStats).map(v => v.income),
          backgroundColor: 'rgba(16, 185, 129, 0.75)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1,
          borderRadius: 8,
        },
        {
          label: 'Pengeluaran',
          data: Object.values(monthlyStats).map(v => v.expense),
          backgroundColor: 'rgba(244, 63, 94, 0.75)',
          borderColor: 'rgb(244, 63, 94)',
          borderWidth: 1,
          borderRadius: 8,
        }
      ]
    };
  };

  // Chart Data: Expense Category breakdown
  const getCategoryChartData = () => {
    const categoryTotals: { [name: string]: number } = {};
    
    transactions
      .filter(t => t.type === 'expense' && t.transaction_date.slice(0, 7) === currentMonth)
      .forEach(t => {
        const catName = t.category_name || 'Lainnya';
        categoryTotals[catName] = (categoryTotals[catName] || 0) + t.amount;
      });

    const sortedCats = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    
    return {
      labels: sortedCats.map(c => c[0]),
      datasets: [
        {
          data: sortedCats.map(c => c[1]),
          backgroundColor: [
            'rgba(139, 92, 246, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(234, 179, 8, 0.8)',
            'rgba(20, 184, 166, 0.8)',
            'rgba(249, 115, 22, 0.8)',
          ],
          borderColor: theme === 'dark' ? '#151b2c' : '#ffffff',
          borderWidth: 2,
        }
      ]
    };
  };

  const hasExpenses = transactions.some(t => t.type === 'expense' && t.transaction_date.slice(0, 7) === currentMonth);
  const recentTxs = [...transactions].slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-800/10 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 glass-panel rounded-2xl p-6 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 glass-panel rounded-2xl animate-pulse" />
          <div className="h-96 glass-panel rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Dynamic Theme Colors for Charts
  const chartTextColor = theme === 'dark' ? '#94a3b8' : '#475569';
  const chartGridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.04)';

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Dashboard</h2>
          <p className="text-slate-550 dark:text-slate-400 text-sm mt-1">Ringkasan kondisi keuangan pribadi Anda</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/transactions"
            className="flex items-center gap-2 px-4 py-2.5 font-bold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl transition-all shadow-lg glow-brand"
          >
            <Plus size={16} />
            Transaksi Baru
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Saldo Card */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border-l-4 border-violet-500 hover:border-violet-400 transition-all glow-brand">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Saldo</span>
              <button
                onClick={togglePrivacyMode}
                className="p-1 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 rounded-md text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 transition-all cursor-pointer flex items-center justify-center"
                title={privacyMode ? "Tampilkan Saldo" : "Sembunyikan Saldo"}
              >
                {privacyMode ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div className="p-2 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-lg">
              <WalletIcon size={20} />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-4 tracking-tight">
            {formatIDR(totalBalance)}
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
            Gabungan dari {wallets.length} wallet terdaftar
          </p>
        </div>

        {/* Pemasukan Card */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border-l-4 border-emerald-500 hover:border-emerald-400 transition-all glow-emerald">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pemasukan Hari Ini</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold mt-4 tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatIDR(todayIncome)}
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
            <Calendar size={10} /> {getJakartaFormattedDate()}
          </p>
        </div>

        {/* Pengeluaran Card */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border-l-4 border-rose-500 hover:border-rose-400 transition-all glow-rose">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pengeluaran Hari Ini</span>
            <div className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg">
              <TrendingDown size={20} />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold mt-4 tracking-tight text-rose-600 dark:text-rose-400">
            {formatIDR(todayExpense)}
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
            <Calendar size={10} /> {getJakartaFormattedDate()}
          </p>
        </div>

        {/* Transaksi Card */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border-l-4 border-indigo-500 hover:border-indigo-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Transaksi</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <ArrowLeftRight size={20} />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-4 tracking-tight">
            {totalTxsCount}
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
            Pencatatan total aktivitas transaksi
          </p>
        </div>
      </div>

      {/* Daily & Weekly Cashflow Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Monthly Summary Card */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-[var(--color-border)] bg-[var(--color-card)] relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3 mb-4">
            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 tracking-wider uppercase flex items-center gap-2">
              <Calendar size={14} className="text-violet-500" />
              Aliran Dana Bulan Ini
            </h4>
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-[var(--color-border)]">
              {getJakartaFormattedMonthShort()}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 divide-x divide-slate-200 dark:divide-slate-850/80">
            {/* Monthly Income */}
            <div>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Pemasukan</span>
              <h3 className="text-lg sm:text-xl font-extrabold mt-1.5 text-emerald-600 dark:text-emerald-450 tracking-tight flex items-center gap-1">
                <ArrowUpRight size={16} className="shrink-0" />
                {formatIDR(totalIncomeThisMonth)}
              </h3>
            </div>
            {/* Monthly Expense */}
            <div className="pl-4">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Pengeluaran</span>
              <h3 className="text-lg sm:text-xl font-extrabold mt-1.5 text-rose-600 dark:text-rose-455 tracking-tight flex items-center gap-1">
                <ArrowDownLeft size={16} className="shrink-0" />
                {formatIDR(totalExpenseThisMonth)}
              </h3>
            </div>
          </div>
          
          <div className="mt-4 pt-3.5 border-t border-slate-200/60 dark:border-slate-850/40 flex items-center justify-between text-xs">
            <span className="text-slate-550 dark:text-slate-400 font-medium">Selisih Bulan Ini:</span>
            <span className={`font-bold py-0.5 px-2 rounded-lg text-[9px] border ${
              totalIncomeThisMonth - totalExpenseThisMonth >= 0 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20'
            }`}>
              {totalIncomeThisMonth - totalExpenseThisMonth >= 0 ? '+' : ''} {formatIDR(totalIncomeThisMonth - totalExpenseThisMonth)}
            </span>
          </div>
        </div>

        {/* Weekly Summary Card */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-[var(--color-border)] bg-[var(--color-card)] relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3 mb-4">
            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 tracking-wider uppercase flex items-center gap-2">
              <TrendingUp size={14} className="text-violet-500" />
              Aliran Dana Minggu Ini
            </h4>
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-[var(--color-border)]">
              Aktif
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 divide-x divide-slate-200 dark:divide-slate-850/80">
            {/* Weekly Income */}
            <div>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Pemasukan</span>
              <h3 className="text-lg sm:text-xl font-extrabold mt-1.5 text-emerald-600 dark:text-emerald-455 tracking-tight flex items-center gap-1">
                <ArrowUpRight size={16} className="shrink-0" />
                {formatIDR(weeklyIncome)}
              </h3>
            </div>
            {/* Weekly Expense */}
            <div className="pl-4">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Pengeluaran</span>
              <h3 className="text-lg sm:text-xl font-extrabold mt-1.5 text-rose-600 dark:text-rose-455 tracking-tight flex items-center gap-1">
                <ArrowDownLeft size={16} className="shrink-0" />
                {formatIDR(weeklyExpense)}
              </h3>
            </div>
          </div>
          
          <div className="mt-4 pt-3.5 border-t border-slate-200/60 dark:border-slate-850/40 flex items-center justify-between text-xs">
            <span className="text-slate-550 dark:text-slate-400 font-medium">Selisih Minggu Ini:</span>
            <span className={`font-bold py-0.5 px-2 rounded-lg text-[9px] border ${
              weeklyIncome - weeklyExpense >= 0 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20'
            }`}>
              {weeklyIncome - weeklyExpense >= 0 ? '+' : ''} {formatIDR(weeklyIncome - weeklyExpense)}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-4 sm:p-6">
          <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
            Tren Keuangan Bulanan
          </h4>
          <div className="h-80 flex items-center justify-center">
            {transactions.length > 0 ? (
              <Bar
                data={getMonthlyChartData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: { color: chartTextColor, font: { family: 'Plus Jakarta Sans', weight: 'bold' } }
                    },
                    tooltip: {
                      callbacks: {
                        label: (context: { dataset: { label?: string }; parsed: { y: number | null } }) => ` ${context.dataset.label || ''}: ${formatIDR(context.parsed.y ?? 0)}`
                      }
                    }
                  },
                  scales: {
                    x: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } },
                    y: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } }
                  }
                }}
              />
            ) : (
              <p className="text-slate-500 text-sm">Belum ada data transaksi bulanan.</p>
            )}
          </div>
        </div>

        {/* Category breakdown doughnut */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6">
          <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6">Pengeluaran Kategori</h4>
          <div className="h-80 flex flex-col items-center justify-center">
            {hasExpenses ? (
              <div className="w-full h-full relative flex items-center justify-center">
                <Doughnut
                  data={getCategoryChartData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: { color: chartTextColor, font: { size: 10, family: 'Plus Jakarta Sans', weight: 'bold' }, boxWidth: 12 }
                      },
                      tooltip: {
                        callbacks: {
                        label: (context: { label: string; parsed: number | null }) => ` ${context.label}: ${formatIDR(context.parsed ?? 0)}`
                        }
                      }
                    },
                    cutout: '65%'
                  }}
                />
              </div>
            ) : (
              <div className="text-center text-slate-500 text-sm py-12">
                Belum ada pengeluaran dicatat pada bulan ini.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Third row: Recent Transactions and Wallet Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">Transaksi Terbaru</h4>
            <Link to="/transactions" className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline">
              Lihat Semua
            </Link>
          </div>

          <div className="space-y-4">
            {recentTxs.length > 0 ? (
              recentTxs.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-3.5 bg-slate-200/30 dark:bg-slate-800/25 border border-slate-300/30 dark:border-slate-800/40 rounded-xl hover:border-slate-350 dark:hover:border-slate-800 transition-all">
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2.5 rounded-xl ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                      {tx.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                    </div>
                    <div>
                      <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 truncate max-w-[180px] sm:max-w-xs">{tx.notes || (tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran')}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700/50">
                          {tx.category_name}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-550">
                          {tx.transaction_date}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-450' : 'text-slate-800 dark:text-slate-200'}`}>
                      {tx.type === 'income' ? '+' : '-'} {formatIDR(tx.amount)}
                    </span>
                    <p className="text-[9px] text-slate-500 dark:text-slate-550 mt-1">{tx.wallet_name}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 text-sm py-12">Belum ada transaksi dicatat.</p>
            )}
          </div>
        </div>

        {/* Right side: Wallets & Budget Preview */}
        <div className="space-y-6">
          {/* Wallets Summary List */}
          <div className="glass-panel rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">Multi Wallet</h4>
              <Link to="/wallets" className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline">
                Kelola
              </Link>
            </div>

            <div className="space-y-4">
              {wallets.map(w => (
                <div key={w.id} className="flex items-center justify-between p-4 bg-slate-200/50 dark:bg-[#1a2336] rounded-xl border border-slate-300/40 dark:border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-violet-600/20 to-indigo-600/20 flex items-center justify-center border border-violet-500/20 text-violet-600 dark:text-violet-400 shadow-sm">
                      <WalletIcon size={18} />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{w.name}</h5>
                      <span className="text-[9px] text-slate-500 dark:text-slate-550 uppercase tracking-wider font-semibold">Aktif</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <h6 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{formatIDR(w.balance)}</h6>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Budget Preview List */}
          <div className="glass-panel rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Target size={18} className="text-violet-500" />
                Monitor Anggaran
              </h4>
              <Link to="/budgets" className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline">
                Kelola
              </Link>
            </div>

            <div className="space-y-4">
              {activeBudgets.length > 0 ? (
                activeBudgets.map(b => {
                  const spent = getCategorySpending(b.category_id, b.period);
                  const percentage = b.limit_amount > 0 ? (spent / b.limit_amount) * 100 : 0;
                  const barColor = getBudgetBarColor(percentage);

                  return (
                    <div key={b.id} className="p-3.5 bg-slate-200/50 dark:bg-[#1a2336] rounded-xl border border-slate-300/40 dark:border-slate-800/80 space-y-2.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{b.category_name}</h5>
                          <span className="text-[9px] text-slate-550 dark:text-slate-450 uppercase font-bold tracking-wider">Bulan Ini</span>
                        </div>
                        <span className={`text-[10px] font-extrabold py-0.5 px-2 rounded-md ${
                          percentage > 100 
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/20' 
                            : percentage >= 80 
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-500/20' 
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20'
                        }`}>
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                      
                      {/* Outer progress bar */}
                      <div className="w-full h-2 bg-slate-300/50 dark:bg-slate-850 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-550 ${barColor}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-[10px] text-slate-550 dark:text-slate-400">
                        <span>Terpakai: <strong className="text-slate-700 dark:text-slate-300 font-bold">{formatIDR(spent)}</strong></span>
                        <span>Limit: <strong className="text-slate-700 dark:text-slate-300 font-bold">{formatIDR(b.limit_amount)}</strong></span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 border border-dashed border-slate-300/60 dark:border-slate-800/50 rounded-xl bg-slate-200/20 dark:bg-slate-850/10">
                  <AlertTriangle size={24} className="mx-auto text-slate-400 dark:text-slate-500 mb-2" />
                  <p className="text-xs text-slate-550 dark:text-slate-450">Belum ada anggaran bulan ini.</p>
                  <Link to="/budgets" className="text-[10px] font-bold text-violet-600 dark:text-violet-400 mt-2 block hover:underline">
                    Buat Anggaran Sekarang
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
