import React, { useMemo, useState } from 'react';
import { useStore } from '../store/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSignIcon, ShoppingCartIcon, TagIcon, PackageIcon, BarChart3Icon, WalletIcon } from '../components/Icons';
import ProgressBar from '../components/ProgressBar';
import { RawPurchaseHistoryItem } from '../types';

type ProductStat = { name: string; quantity: number; totalSpent: number; prices: number[]; };
type CategorySpending = { name: string, value: number };

const StatisticsScreen: React.FC = () => {
    const { rawPurchaseHistory, priceHistory, budgets } = useStore();
    const [selectedItemForPriceChart, setSelectedItemForPriceChart] = useState<string | null>(null);

    const allCompletedItems: RawPurchaseHistoryItem[] = rawPurchaseHistory;

    const monthlyBudgetStats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const currentBudget = budgets.find(b => b.year === currentYear && b.month === currentMonth);
        
        const spentThisMonth = allCompletedItems
            .filter(item => {
                const itemDate = new Date(item.purchased_at);
                return itemDate.getFullYear() === currentYear && itemDate.getMonth() === currentMonth;
            })
            .reduce((total, item) => total + item.total_price, 0); // Assuming total_price is unit_price, quantity is not stored

        return {
            budgetAmount: currentBudget?.amount || 0,
            spentThisMonth,
            usage: currentBudget?.amount ? (spentThisMonth / currentBudget.amount) * 100 : 0,
        };
    }, [budgets, allCompletedItems]);

    const productStatsMemo = useMemo(() => {
        return allCompletedItems.reduce((acc, item) => {
            const itemName = item.item_name;
            if (!acc[itemName]) {
                acc[itemName] = { name: itemName, quantity: 0, totalSpent: 0, prices: [] };
            }
            acc[itemName].quantity += 1; // Quantity is not stored, so we count occurrences
            acc[itemName].totalSpent += item.total_price;
            acc[itemName].prices.push(item.total_price);
            return acc;
        }, {} as Record<string, ProductStat>);
    }, [allCompletedItems]);

    const dashboardStats = useMemo(() => {
        const productStatsValues: ProductStat[] = Object.values(productStatsMemo);

        const categorySpending = allCompletedItems.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + item.total_price;
            return acc;
        }, {} as Record<string, number>);

        const mostPurchasedItem = productStatsValues.length > 0 ? [...productStatsValues].sort((a, b) => b.quantity - a.quantity)[0] : null;
        const topSpendingCategory = Object.entries(categorySpending).length > 0 ? [...Object.entries(categorySpending)].sort((a, b) => b[1] - a[1])[0] : null;
        const totalSpent = allCompletedItems.reduce((sum, item) => sum + item.total_price, 0);

        return {
            totalSpent,
            completedListsCount: new Set(allCompletedItems.map(i => i.purchased_at.split('T')[0])).size, // Approximate lists by unique purchase days
            mostPurchasedItem: mostPurchasedItem ? mostPurchasedItem.name : 'N/A',
            topSpendingCategory: topSpendingCategory ? topSpendingCategory[0] : 'N/A',
        };
    }, [allCompletedItems, productStatsMemo]);
    
    const productDetails = useMemo(() => {
        const productStatsValues: ProductStat[] = Object.values(productStatsMemo);
        return productStatsValues.map(p => ({
            ...p,
            avgPrice: p.prices.length > 0 ? p.prices.reduce((a, b) => a + b, 0) / p.prices.length : 0,
        })).sort((a, b) => b.totalSpent - a.totalSpent);
    }, [productStatsMemo]);

    const spendingByCategory = useMemo(() => {
        const categorySpendingMap = allCompletedItems.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + item.total_price;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(categorySpendingMap)
            .map(([name, value]): CategorySpending => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [allCompletedItems]);

    const spendingOverTime = useMemo(() => {
        const monthlySpending: Record<string, number> = {};
        allCompletedItems.forEach(item => {
            const date = new Date(item.purchased_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + item.total_price;
        });

        return Object.entries(monthlySpending)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, total]) => ({ month, total }));
    }, [allCompletedItems]);

    const priceEvolutionData = useMemo(() => {
        if (!selectedItemForPriceChart) return [];
        const historyEntry = priceHistory.find(h => h.itemName === selectedItemForPriceChart);
        if (!historyEntry) return [];
        return historyEntry.prices
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(p => ({
                date: new Date(p.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                price: p.price
            }));
    }, [selectedItemForPriceChart, priceHistory]);


    if (allCompletedItems.length === 0) {
        return (
          <div className="p-4 md:p-6 text-center h-full flex flex-col justify-center items-center">
            <BarChart3Icon className="w-16 h-16 text-foreground/20 dark:text-dark-foreground/20 mb-4" />
            <h2 className="text-xl font-semibold">Sem dados para analisar</h2>
            <p className="text-foreground/60 dark:text-dark-foreground/60">Finalize uma compra para ver suas estatísticas.</p>
          </div>
        );
    }

    return (
        <div className="p-4 md:p-6 animate-slide-in-up space-y-8">
            <div>
              <h1 className="text-2xl font-bold">Dashboard Financeiro</h1>
              <p className="text-foreground/60 dark:text-dark-foreground/60">Seus insights de gastos baseados em compras finalizadas.</p>
            </div>
            
            {monthlyBudgetStats.budgetAmount > 0 && (
                <div className="bg-card dark:bg-dark-card p-4 rounded-lg shadow-md border border-border dark:border-dark-border">
                    <div className="flex items-center gap-3 mb-3">
                        <WalletIcon className="w-6 h-6 text-primary dark:text-primary-dark"/>
                        <h2 className="font-semibold text-lg">Orçamento Mensal vs. Gastos</h2>
                    </div>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className='text-sm text-foreground/70 dark:text-dark-foreground/70'>Gasto no Mês</p>
                            <p className='text-3xl font-bold'>R$ {monthlyBudgetStats.spentThisMonth.toFixed(2)}</p>
                        </div>
                        <div className='text-right'>
                            <p className='text-xs text-foreground/60 dark:text-dark-foreground/60'>Orçamento</p>
                            <p className='font-semibold text-lg'>R$ {monthlyBudgetStats.budgetAmount.toFixed(2)}</p>
                        </div>
                    </div>
                    <ProgressBar value={monthlyBudgetStats.usage} />
                    <div className='flex justify-between items-center mt-1 text-xs text-foreground/60 dark:text-dark-foreground/60'>
                        <span>{monthlyBudgetStats.usage.toFixed(1)}% utilizado</span>
                        <span>Restante: R$ {(monthlyBudgetStats.budgetAmount - monthlyBudgetStats.spentThisMonth).toFixed(2)}</span>
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={DollarSignIcon} title="Gasto Total" value={`R$ ${dashboardStats.totalSpent.toFixed(2)}`} />
                <StatCard icon={ShoppingCartIcon} title="Compras Feitas" value={dashboardStats.completedListsCount.toString()} />
                <StatCard icon={PackageIcon} title="Item Mais Comprado" value={dashboardStats.mostPurchasedItem} />
                <StatCard icon={TagIcon} title="Categoria Principal" value={dashboardStats.topSpendingCategory} />
            </div>

            <ChartCard title="Gastos por Categoria">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={spendingByCategory} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tickFormatter={(value) => `R$${value}`} />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }}/>
                        <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                        <Bar dataKey="value" name="Gasto" fill="#073376" barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Análise de Produtos">
                <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-foreground/70 dark:text-dark-foreground/70 uppercase bg-background dark:bg-dark-background sticky top-0">
                            <tr>
                                <th scope="col" className="px-4 py-3">Produto</th>
                                <th scope="col" className="px-4 py-3 text-center">Frequência</th>
                                <th scope="col" className="px-4 py-3 text-right">Preço Médio</th>
                                <th scope="col" className="px-4 py-3 text-right">Gasto Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productDetails.map(p => (
                                <tr key={p.name} className="border-b border-border dark:border-dark-border">
                                    <td className="px-4 py-2 font-medium">{p.name}</td>
                                    <td className="px-4 py-2 text-center">{p.quantity}</td>
                                    <td className="px-4 py-2 text-right">R$ {p.avgPrice.toFixed(2)}</td>
                                    <td className="px-4 py-2 text-right font-semibold">R$ {p.totalSpent.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </ChartCard>

            <ChartCard title="Gasto Total Mensal">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={spendingOverTime}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `R$${value}`} />
                        <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                        <Bar dataKey="total" name="Total Gasto" fill="#29B2A0" />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Evolução de Preços de Itens">
                <select 
                    onChange={(e) => setSelectedItemForPriceChart(e.target.value)}
                    value={selectedItemForPriceChart || ''}
                    className="mb-4 p-2 rounded-md bg-background dark:bg-dark-background border border-border dark:border-dark-border w-full"
                >
                    <option value="">Selecione um item para ver o histórico</option>
                    {priceHistory.map(h => <option key={h.itemName} value={h.itemName}>{h.itemName}</option>)}
                </select>
                {selectedItemForPriceChart && priceEvolutionData.length > 0 && (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={priceEvolutionData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={['dataMin - 1', 'dataMax + 1']} tickFormatter={(value) => `R$${value}`} />
                            <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                            <Line type="monotone" dataKey="price" name="Preço" stroke="#FFAE42" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </ChartCard>
        </div>
    );
};

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-card dark:bg-dark-card p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4 text-card-foreground dark:text-dark-card-foreground">{title}</h2>
        {children}
    </div>
);

interface StatCardProps {
    icon: React.ElementType;
    title: string;
    value: string;
}
const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value }) => (
    <div className="bg-card dark:bg-dark-card p-4 rounded-lg shadow-md flex items-start gap-4">
      <div className="bg-primary/10 dark:bg-primary-dark/20 p-3 rounded-lg">
          <Icon className="w-6 h-6 text-primary dark:text-primary-dark" />
      </div>
      <div>
        <p className="text-sm text-foreground/70 dark:text-dark-foreground/70 mb-1">{title}</p>
        <p className="text-xl font-bold truncate">{value}</p>
      </div>
    </div>
);


export default StatisticsScreen;