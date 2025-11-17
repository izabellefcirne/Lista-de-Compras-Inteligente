
import React, { useMemo, useState } from 'react';
import { useStore } from '../store/store';
import { ShoppingList } from '../types';

const HistoryScreen: React.FC = () => {
    const { lists, setCurrentPage } = useStore();
    const [filter, setFilter] = useState<{ period: string, sortBy: string }>({ period: 'all', sortBy: 'date_desc' });

    const historicalLists = useMemo(() => {
        let filtered = lists.filter(l => l.status === 'completed' || l.status === 'archived');

        // Period filter
        if (filter.period !== 'all') {
            const now = new Date();
            const periodDate = new Date();
            if (filter.period === '7d') periodDate.setDate(now.getDate() - 7);
            if (filter.period === '30d') periodDate.setDate(now.getDate() - 30);
            if (filter.period === '90d') periodDate.setDate(now.getDate() - 90);
            filtered = filtered.filter(l => new Date(l.createdAt) >= periodDate);
        }

        // Sort
        filtered.sort((a, b) => {
            const totalA = getListTotal(a);
            const totalB = getListTotal(b);
            switch (filter.sortBy) {
                case 'date_asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'value_desc': return totalB - totalA;
                case 'value_asc': return totalA - totalB;
                case 'date_desc':
                default:
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });

        return filtered;
    }, [lists, filter]);

    const getListTotal = (list: ShoppingList) => {
        return list.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    };

    return (
        <div className="p-4 md:p-6 animate-slide-in-up">
            <h1 className="text-2xl font-bold mb-6">Histórico de Listas</h1>

            <div className="flex gap-4 mb-6">
                <select value={filter.period} onChange={e => setFilter(f => ({...f, period: e.target.value}))} className="p-2 rounded-md bg-card dark:bg-dark-card border border-border dark:border-dark-border">
                    <option value="all">Todo Período</option>
                    <option value="7d">Últimos 7 dias</option>
                    <option value="30d">Últimos 30 dias</option>
                    <option value="90d">Últimos 90 dias</option>
                </select>
                <select value={filter.sortBy} onChange={e => setFilter(f => ({...f, sortBy: e.target.value}))} className="p-2 rounded-md bg-card dark:bg-dark-card border border-border dark:border-dark-border">
                    <option value="date_desc">Mais Recentes</option>
                    <option value="date_asc">Mais Antigas</option>
                    <option value="value_desc">Maior Valor</option>
                    <option value="value_asc">Menor Valor</option>
                </select>
            </div>

            <div className="space-y-4">
                {historicalLists.length > 0 ? historicalLists.map(list => (
                    <div key={list.id} className="bg-card dark:bg-dark-card p-4 rounded-lg shadow-md cursor-pointer" onClick={() => setCurrentPage('listDetail', list.id)}>
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-bold">{list.name}</h3>
                                <p className="text-sm text-foreground/60 dark:text-dark-foreground/60">{list.category}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg">R$ {getListTotal(list).toFixed(2)}</p>
                                <p className="text-sm text-foreground/60 dark:text-dark-foreground/60">{list.items.length} itens</p>
                            </div>
                        </div>
                         <p className="text-xs text-foreground/50 dark:text-dark-foreground/50 mt-2">{new Date(list.createdAt).toLocaleString()}</p>
                    </div>
                )) : (
                    <p className="text-center py-10 text-foreground/60 dark:text-dark-foreground/60">Nenhuma lista no histórico.</p>
                )}
            </div>
        </div>
    );
};

export default HistoryScreen;
