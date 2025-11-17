import React, { useMemo } from 'react';
import { useStore } from '../store/store';
import { RawPurchaseHistoryItem } from '../types';

const HistoryScreen: React.FC = () => {
    const { rawPurchaseHistory } = useStore();

    const allPurchases = useMemo(() => {
        return [...rawPurchaseHistory].sort((a, b) => new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime());
    }, [rawPurchaseHistory]);

    const groupedPurchases = useMemo(() => {
        // FIX: The initial value for the `reduce` function is now explicitly typed.
        // This ensures TypeScript correctly infers the accumulator's type and prevents
        // the `items` variable from being typed as `unknown` when calling `Object.entries`.
        return allPurchases.reduce((acc, item) => {
            const date = new Date(item.purchased_at).toLocaleDateString('pt-BR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(item);
            return acc;
        }, {} as Record<string, RawPurchaseHistoryItem[]>);
    }, [allPurchases]);

    return (
        <div className="p-4 md:p-6 animate-slide-in-up">
            <h1 className="text-2xl font-bold mb-6">Histórico de Compras</h1>

            <div className="space-y-6">
                {Object.keys(groupedPurchases).length > 0 ? Object.entries(groupedPurchases).map(([date, items]) => (
                    <div key={date}>
                         <h2 className="font-semibold text-lg mb-2 pl-2 border-l-4 border-primary dark:border-primary-dark">{date}</h2>
                         <div className="bg-card dark:bg-dark-card p-4 rounded-lg shadow-md">
                            <ul className="divide-y divide-border dark:divide-dark-border">
                                {items.map(item => (
                                    <li key={item.id} className="py-3">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="font-medium">{item.item_name}</h3>
                                                <p className="text-sm text-foreground/60 dark:text-dark-foreground/60">{item.category}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">R$ {item.total_price.toFixed(2)}</p>
                                                <p className="text-xs text-foreground/50 dark:text-dark-foreground/50">{new Date(item.purchased_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                         </div>
                    </div>
                )) : (
                    <p className="text-center py-10 text-foreground/60 dark:text-dark-foreground/60">Nenhum item no histórico de compras.</p>
                )}
            </div>
        </div>
    );
};

export default HistoryScreen;