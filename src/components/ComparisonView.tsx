import { useState, useEffect, useMemo } from 'react';
import type { Identity, Trade } from '@/types/trade';
import { CURRENCY_SYMBOLS } from '@/types/trade';
import { calcStats } from '@/store/useCloudTradeStore';
import { mergePositions } from '@/store/useCloudTradeStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

const BENCHMARKS = [
  { symbol: '000300', name: '沪深300', market: 'cn' },
  { symbol: '000001', name: '上证指数', market: 'cn' },
  { symbol: 'SPY', name: 'S&P 500 ETF', market: 'us' },
  { symbol: 'QQQ', name: '纳斯达克100 ETF', market: 'us' },
];

const BENCH_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c43'];

interface Props {
  identities: Identity[];
  trades: Trade[];
}

function PerformanceChart({ trades, identities }: Props) {
  const [benchData, setBenchData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [selectedBench, setSelectedBench] = useState<string[]>(['000300', 'SPY']);

  // Calculate portfolio daily returns from trades
  const portfolioReturns = useMemo(() => {
    const closedTrades = trades.filter(t => t.sellDate && t.sellPrice);
    if (closedTrades.length === 0) return [];

    // Group by sell date and accumulate PnL
    const dailyPnL: Record<string, number> = {};
    let totalInvested = 0;
    closedTrades.forEach(t => {
      const date = t.sellDate!;
      const dir = t.direction === 'long' ? 1 : -1;
      const pnl = dir * (t.sellPrice! - t.buyPrice) * t.shares;
      totalInvested += t.buyPrice * t.shares;
      dailyPnL[date] = (dailyPnL[date] || 0) + pnl;
    });

    if (totalInvested === 0) return [];

    const sorted = Object.entries(dailyPnL).sort(([a], [b]) => a.localeCompare(b));
    let cumPnL = 0;
    return sorted.map(([date, pnl]) => {
      cumPnL += pnl;
      return { date, returnPct: (cumPnL / totalInvested) * 100 };
    });
  }, [trades]);

  useEffect(() => {
    const fetchBenchmarks = async () => {
      setLoading(true);
      const results: Record<string, any[]> = {};
      await Promise.all(
        selectedBench.map(async (sym) => {
          try {
            const bench = BENCHMARKS.find(b => b.symbol === sym);
            const { data } = await supabase.functions.invoke('stock-kline', {
              body: { symbol: sym, period: 'daily', count: 90, market: bench?.market },
            });
            if (data?.success && data.data) {
              const first = data.data[0]?.close;
              if (first > 0) {
                results[sym] = data.data.map((k: any) => ({
                  date: k.date,
                  returnPct: ((k.close - first) / first) * 100,
                }));
              }
            }
          } catch (e) { console.error('Bench fetch error:', e); }
        })
      );
      setBenchData(results);
      setLoading(false);
    };
    if (selectedBench.length > 0) fetchBenchmarks();
  }, [selectedBench]);

  // Merge data into chart-ready format
  const chartData = useMemo(() => {
    const dateMap: Record<string, any> = {};

    // Add portfolio data
    portfolioReturns.forEach(p => {
      if (!dateMap[p.date]) dateMap[p.date] = { date: p.date };
      dateMap[p.date]['portfolio'] = parseFloat(p.returnPct.toFixed(2));
    });

    // Add benchmark data
    selectedBench.forEach(sym => {
      (benchData[sym] || []).forEach((b: any) => {
        const d = b.date.slice(0, 10);
        if (!dateMap[d]) dateMap[d] = { date: d };
        dateMap[d][sym] = parseFloat(b.returnPct.toFixed(2));
      });
    });

    return Object.values(dateMap).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [portfolioReturns, benchData, selectedBench]);

  const toggleBench = (sym: string) => {
    setSelectedBench(prev => prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">对比基准：</span>
        {BENCHMARKS.map((b, i) => (
          <button key={b.symbol} onClick={() => toggleBench(b.symbol)}
            className={`text-xs px-2 py-1 rounded-md border transition-all ${
              selectedBench.includes(b.symbol)
                ? 'border-primary bg-primary/20 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}>
            {b.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">加载行情数据...</div>
      ) : chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={v => v.slice(5)} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={v => `${v}%`} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
              formatter={(val: number) => [`${val.toFixed(2)}%`]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="portfolio" name="我的组合" stroke="hsl(var(--primary))"
              strokeWidth={2} dot={false} connectNulls />
            {selectedBench.map((sym, i) => {
              const bench = BENCHMARKS.find(b => b.symbol === sym);
              return (
                <Line key={sym} type="monotone" dataKey={sym} name={bench?.name || sym}
                  stroke={BENCH_COLORS[i % BENCH_COLORS.length]} strokeWidth={1.5} dot={false} connectNulls />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
          暂无足够的已平仓数据生成收益曲线
        </div>
      )}
    </div>
  );
}

export function ComparisonView({ identities, trades }: Props) {
  const merged = mergePositions(trades);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1"><BarChart3 className="w-4 h-4" />对比</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl bg-card border-border max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display text-xl">身份对比 & 业绩基准</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          {/* Identity comparison cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {identities.map(identity => {
              const idTrades = trades.filter(t => t.identityId === identity.id);
              const stats = calcStats(idTrades);
              const idMerged = mergePositions(idTrades);
              const pnlColor = stats.totalPnL > 0 ? 'text-profit' : stats.totalPnL < 0 ? 'text-loss' : 'text-neutral';

              return (
                <div key={identity.id} className="rounded-lg border border-border p-4" style={{ borderLeftColor: identity.color, borderLeftWidth: 3 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: identity.color }} />
                    <span className="font-display text-lg">{identity.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                    <div><span className="text-muted-foreground text-xs">总记录</span><div>{stats.total}</div></div>
                    <div><span className="text-muted-foreground text-xs">持仓中</span><div>{stats.openCount}</div></div>
                    <div><span className="text-muted-foreground text-xs">总盈亏</span><div className={pnlColor}>¥{stats.totalPnL.toFixed(2)}</div></div>
                    <div><span className="text-muted-foreground text-xs">胜率</span><div>{stats.closedCount > 0 ? `${stats.winRate.toFixed(1)}%` : '—'}</div></div>
                  </div>
                  {idMerged.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="text-xs text-muted-foreground mb-1">合并持仓</div>
                      {idMerged.map(m => {
                        const cs = CURRENCY_SYMBOLS[m.currency] || '¥';
                        return (
                          <div key={`${m.symbol}_${m.direction}`} className="text-xs font-mono flex justify-between py-0.5">
                            <span>{m.symbol} {m.name}</span>
                            <span>{cs}{m.avgPrice.toFixed(2)} × {m.totalShares}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Performance chart */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="font-display text-sm font-medium">收益对比</span>
            </div>
            <PerformanceChart identities={identities} trades={trades} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
