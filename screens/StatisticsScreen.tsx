import React, { useMemo, useState } from 'react';
import { useStore } from '../store/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSignIcon, ShoppingCartIcon, TagIcon, PackageIcon, BarChart3Icon, WalletIcon } from '../components/Icons';
import ProgressBar from '../components/ProgressBar';
import { ListItem } from '../types';

// FIX: Define a type for product statistics to ensure type safety in calculations.
type ProductStat = { name: string; quantity: number; totalSpent: number; prices: number[]; };

const StatisticsScreen: React.FC = () => {
    const { lists, priceHistory, budgets } = useStore();
    const [selectedItemForPriceChart, setSelectedItemForPriceChart] = useState<string | null>(null);

    const completedLists = useMemo(() => lists.filter(l => l.status === 'completed'), [lists]);
    const allCompletedItems: ListItem[] = useMemo(() => completedLists.flatMap(l => l.items), [completedLists]);

    const monthlyBudgetStats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const currentBudget = budgets.find(b => b.year === currentYear && b.month === currentMonth);
        
        const spentThisMonth = completedLists
            .filter(list => {
                const listDate = new Date(list.createdAt);
                return listDate.getFullYear() === currentYear && listDate.getMonth() === currentMonth;
            })
            .reduce((total, list) => {
                return total + list.items.reduce((listTotal, item) => listTotal + (item.unitPrice * item.quantity), 0);
            }, 0);

        return {
            budgetAmount: currentBudget?.amount || 0,
            spentThisMonth,
            usage: currentBudget?.amount ? (spentThisMonth / currentBudget.amount) * 100 : 0,
        };
    }, [budgets, completedLists]);

    const productStatsMemo = useMemo(() => {
        return allCompletedItems.reduce((acc, item) => {
            const totalItemCost = item.quantity * item.unitPrice;
            const itemName = item.name;
            if (!acc[itemName]) {
                acc[itemName] = { name: itemName, quantity: 0, totalSpent: 0, prices: [] };
            }
            acc[itemName].quantity += item.quantity;
            acc[itemName].totalSpent += totalItemCost;
            acc[itemName].prices.push(item.unitPrice);
            return acc;
        }, {} as Record<string, ProductStat>);
    }, [allCompletedItems]);

    const dashboardStats = useMemo(() => {
        // FIX: Explicitly type productStatsValues to resolve type inference issues.
        const productStatsValues: ProductStat[] = Object.values(productStatsMemo);

        const categorySpending = allCompletedItems.reduce((acc, item) => {
            const total = item.unitPrice * item.quantity;
            acc[item.category] = (acc[item.category] || 0) + total;
            return acc;
        }, {} as Record<string, number>);

        const mostPurchasedItem = productStatsValues.length > 0 ? [...productStatsValues].sort((a, b) => b.quantity - a.quantity)[0] : null;
        const topSpendingCategory = Object.entries(categorySpending).length > 0 ? [...Object.entries(categorySpending)].sort((a, b) => b[1] - a[1])[0] : null;
        const totalSpent = allCompletedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

        return {
            totalSpent,
            completedListsCount: completedLists.length,
            mostPurchasedItem: mostPurchasedItem ? mostPurchasedItem.name : 'N/A',
            topSpendingCategory: topSpendingCategory ? topSpendingCategory[0] : 'N/A',
        };
    }, [allCompletedItems, completedLists, productStatsMemo]);
    
    const productDetails = useMemo(() => {
        // FIX: Explicitly type productStatsValues to resolve type inference issues.
        const productStatsValues: ProductStat[] = Object.values(productStatsMemo);
        return productStatsValues.map(p => ({
            ...p,
            avgPrice: p.prices.length > 0 ? p.prices.reduce((a, b) => a + b, 0) / p.prices.length : 0,
        })).sort((a, b) => b.totalSpent - a.totalSpent);
    }, [productStatsMemo]);

    const spendingByCategory = useMemo(() => {
        const categorySpending = allCompletedItems.reduce((acc, item) => {
            const total = item.unitPrice * item.quantity;
            acc[item.category] = (acc[item.category] || 0) + total;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(categorySpending)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [allCompletedItems]);

    const spendingOverTime = useMemo(() => {
        const monthlySpending: Record<string, number> = {};
        completedLists.forEach(list => {
            const date = new Date(list.createdAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const total = list.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
            monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + total;
        });

        return Object.entries(monthlySpending)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, total]) => ({ month, total }));
    }, [completedLists]);

    const priceEvolutionData = useMemo(() => {
        if (!selectedItemForPriceChart) return [];
        const historyEntry = priceHistory.find(h => h.itemName === selectedItemForPriceChart);
        if (!historyEntry) return [];
        return historyEntry.prices.map(p => ({
            date: new Date(p.date).toLocaleDateString('pt-BR'),
            price: p.price
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [selectedItemForPriceChart, priceHistory]);


    if (completedLists.length === 0) {
        return (
          <div className="p-4 md:p-6 text-center h-full flex flex-col justify-center items-center">
            <BarChart3Icon className="w-16 h-16 text-foreground/20 dark:text-dark-foreground/20 mb-4" />
            <h2 className="text-xl font-semibold">Sem dados para analisar</h2>
            <p className="text-foreground/60 dark:text-dark-foreground/60">Conclua uma lista de compras para ver suas estatísticas.</p>
          </div>
        );
    }

    return (
        <div className="p-4 md:p-6 animate-slide-in-up space-y-8">
            <div>
              <h1 className="text-2xl font-bold">Dashboard Financeiro</h1>
              <p className="text-foreground/60 dark:text-dark-foreground/60">Seus insights de gastos baseados em listas concluídas.</p>
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
                <StatCard icon={ShoppingCartIcon} title="Listas Concluídas" value={dashboardStats.completedListsCount.toString()} />
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
                        <Bar dataKey="value" name="Gasto" fill="#8884d8" barSize={20} />
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
                        <Bar dataKey="total" name="Total Gasto" fill="#82ca9d" />
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
                            <Line type="monotone" dataKey="price" name="Preço" stroke="#ff7300" strokeWidth={2} />
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
