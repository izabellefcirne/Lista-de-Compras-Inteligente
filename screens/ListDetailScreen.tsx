import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../store/store';
import { ListItem } from '../types';
import { ChevronLeftIcon, PlusCircleIcon, Trash2Icon, Edit3Icon, GripVerticalIcon, EyeIcon, EyeOffIcon, CheckSquareIcon, SquareIcon, MoreVerticalIcon, DollarSignIcon, CheckCircle2 } from '../components/Icons';
import { ITEM_CATEGORIES } from '../constants';
import ProgressBar from '../components/ProgressBar';
import Modal from '../components/Modal';

interface AutocompleteSuggestion {
    name: string;
    lastPrice: number;
}

const ListDetailScreen: React.FC<{ listId: string }> = ({ listId }) => {
  const { lists, priceHistory, setCurrentPage, addItemToList, updateItemInList, removeItemFromList, updateItemOrder, updateList } = useStore();
  
  const list = useMemo(() => lists.find(l => l.id === listId), [lists, listId]);
  
  const [isItemModalOpen, setItemModalOpen] = useState(false);
  const [isBudgetModalOpen, setBudgetModalOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ListItem | null>(null);

  const [editingItem, setEditingItem] = useState<ListItem | null>(null);
  const [ghostMode, setGhostMode] = useState(false);
  const [draggedItem, setDraggedItem] = useState<ListItem | null>(null);

  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState(ITEM_CATEGORIES[0]);
  const [budgetInput, setBudgetInput] = useState('');
  
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  const uniqueItemsFromHistory = useMemo((): AutocompleteSuggestion[] => {
    const itemMap = new Map<string, AutocompleteSuggestion>();
    priceHistory.forEach(entry => {
        const latestPrice = entry.prices[entry.prices.length - 1];
        itemMap.set(entry.itemName.toLowerCase(), {
            name: entry.itemName,
            lastPrice: latestPrice.price
        });
    });
    return Array.from(itemMap.values());
  }, [priceHistory]);
  
  const handleItemNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setItemName(value);
    if (value.length > 1) {
        setAutocompleteSuggestions(
            uniqueItemsFromHistory.filter(item => 
                item.name.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 5) // Limit to 5 suggestions
        );
    } else {
        setAutocompleteSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: AutocompleteSuggestion) => {
    setItemName(suggestion.name);
    setItemPrice(suggestion.lastPrice.toString().replace('.', ','));
    setAutocompleteSuggestions([]);
  };

  const listTotal = useMemo(() => list?.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0) || 0, [list]);
  const budgetUsage = list?.listBudget ? (listTotal / list.listBudget) * 100 : 0;
  
  const groupedItems: Record<string, ListItem[]> = useMemo(() => {
    if (!list) return {};
    const itemsToShow = ghostMode ? list.items.filter(i => !i.isPurchased) : list.items;
    
    return itemsToShow.sort((a,b) => a.order - b.order).reduce((acc, item) => {
      (acc[item.category] = acc[item.category] || []).push(item);
      return acc;
    }, {} as Record<string, ListItem[]>);
  }, [list, ghostMode]);

  useEffect(() => {
    if (!list) setCurrentPage('myLists');
  }, [list, setCurrentPage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const resetForm = () => {
    setItemName('');
    setItemQuantity('1');
    setItemPrice('');
    setItemCategory(ITEM_CATEGORIES[0]);
    setEditingItem(null);
    setAutocompleteSuggestions([]);
  };
  
  const openAddModal = () => {
    resetForm();
    setItemModalOpen(true);
  };

  const openEditModal = (item: ListItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemQuantity(item.quantity.toString());
    setItemPrice(item.unitPrice > 0 ? item.unitPrice.toString().replace('.', ',') : '');
    setItemCategory(item.category);
    setItemModalOpen(true);
    setAutocompleteSuggestions([]);
  };
  
  const handleItemFormSubmit = () => {
    if (!itemName.trim() || !itemQuantity.trim()) { alert("Por favor, preencha o nome e a quantidade do item."); return; }
    const quantity = parseInt(itemQuantity, 10);
    if (isNaN(quantity) || quantity <= 0) { alert("A quantidade deve ser um número maior que zero."); return; }
    const priceString = itemPrice.replace(',', '.').trim();
    let price = 0;
    if (priceString !== '') {
        price = parseFloat(priceString);
        if (isNaN(price) || price < 0) { alert("O preço informado é inválido. Ele deve ser um número positivo ou o campo deve ser deixado em branco."); return; }
    }

    if (editingItem) {
      updateItemInList(listId, editingItem.id, { name: itemName, quantity, unitPrice: price, category: itemCategory });
    } else {
      addItemToList(listId, { name: itemName, quantity, unitPrice: price, category: itemCategory });
    }
    setItemModalOpen(false);
    resetForm();
  };
  
  const handleDeleteItemConfirmation = () => {
    if (itemToDelete) {
      removeItemFromList(listId, itemToDelete.id);
      setItemToDelete(null);
    }
  };

  const handleBudgetFormSubmit = () => {
    const amount = parseFloat(budgetInput.replace(',', '.'));
    if (!isNaN(amount) && amount >= 0) {
      updateList(listId, { listBudget: amount });
      setBudgetModalOpen(false);
    } else {
      alert('Por favor, insira um valor de orçamento válido.');
    }
  };
  
  const handleFinalizeList = () => {
    updateList(listId, { status: 'completed' });
    setCurrentPage('myLists');
  };

  const handleDrop = (targetItem: ListItem) => {
    if (!draggedItem || !list || draggedItem.id === targetItem.id) return;
    const currentItems = [...list.items];
    const draggedIndex = currentItems.findIndex(i => i.id === draggedItem.id);
    const targetIndex = currentItems.findIndex(i => i.id === targetItem.id);
    const [reorderedItem] = currentItems.splice(draggedIndex, 1);
    currentItems.splice(targetIndex, 0, reorderedItem);
    const itemOrders = currentItems.map((item, index) => ({ itemId: item.id, newOrder: index }));
    updateItemOrder(listId, itemOrders);
  };
  
  if (!list) return <div className="p-4">Carregando...</div>;

  return (
    <div className="p-4 md:p-6 animate-slide-in-up">
       {/* Header */}
       <header className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <button onClick={() => setCurrentPage('myLists')} className="p-2 mr-2 rounded-full hover:bg-border dark:hover:bg-dark-border">
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{list.name}</h1>
            <p className="text-foreground/70 dark:text-dark-foreground/70">{list.category}</p>
          </div>
        </div>
        <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-border dark:hover:bg-dark-border">
                <MoreVerticalIcon className="w-6 h-6"/>
            </button>
            {isMenuOpen && (
                 <div className="absolute right-0 mt-2 w-56 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md shadow-lg z-10 animate-fade-in">
                    <button onClick={() => { setBudgetInput(list.listBudget?.toString().replace('.', ',') || ''); setBudgetModalOpen(true); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-border dark:hover:bg-dark-border"><DollarSignIcon className="w-4 h-4"/> Definir/Alterar Orçamento</button>
                    <button onClick={() => { handleFinalizeList(); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-border dark:hover:bg-dark-border"><CheckCircle2 className="w-4 h-4"/> Finalizar Compra</button>
                 </div>
            )}
        </div>
      </header>
      {/* Budget Panel */}
      {typeof list.listBudget === 'number' && (
        <div className="bg-card dark:bg-dark-card p-4 rounded-lg shadow-md mb-6 border border-border dark:border-dark-border">
            <div className='flex items-center justify-between mb-3'>
                <h2 className='font-semibold text-lg'>Orçamento da Lista</h2>
            </div>
            <div className="flex justify-between items-end">
                <div>
                    <p className='text-sm text-green-600 dark:text-green-400'>Disponível</p>
                    <p className='text-3xl font-bold text-green-600 dark:text-green-400'>R$ {(list.listBudget - listTotal).toFixed(2)}</p>
                </div>
                <div className='text-right'>
                    <p className='text-xs text-foreground/60 dark:text-dark-foreground/60'>Total</p>
                    <p className='font-semibold text-lg'>R$ {list.listBudget.toFixed(2)}</p>
                </div>
            </div>
            <ProgressBar value={budgetUsage} />
            <div className='flex justify-between items-center mt-1 text-xs text-foreground/60 dark:text-dark-foreground/60'>
                <span>Gasto: R$ {listTotal.toFixed(2)}</span>
                <span>{budgetUsage.toFixed(1)}% utilizado</span>
            </div>
        </div>
      )}
      {/* Items Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Itens da Lista</h2>
        <div className="flex items-center gap-4">
            <button onClick={() => setGhostMode(!ghostMode)} className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-border dark:hover:bg-dark-border">
                {ghostMode ? <EyeIcon className="w-5 h-5"/> : <EyeOffIcon className="w-5 h-5"/>}
                <span>{ghostMode ? 'Ver Todos' : 'Modo Fantasma'}</span>
            </button>
            <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-primary dark:bg-primary-dark text-primary-foreground rounded-lg shadow-md hover:opacity-90 transition-opacity">
              <PlusCircleIcon className="w-5 h-5" />
              <span>Adicionar</span>
            </button>
        </div>
      </div>
      {/* Items List */}
      <div className="space-y-4">
        {Object.keys(groupedItems).length === 0 && (
            <p className="text-center py-8 text-foreground/60 dark:text-dark-foreground/60">
              {ghostMode && list.items.length > 0 ? "Todos os itens foram comprados!" : "Sua lista está vazia. Adicione um item!"}
            </p>
        )}
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category}>
            <h3 className="font-semibold text-lg mb-2 pl-2 border-l-4 border-primary dark:border-primary-dark">{category}</h3>
            <ul className="bg-card dark:bg-dark-card rounded-lg shadow-md divide-y divide-border dark:divide-dark-border">
              {items.map(item => (
                <li 
                  key={item.id} 
                  draggable onDragStart={() => setDraggedItem(item)} onDragEnter={(e) => { e.preventDefault(); if (draggedItem && draggedItem.id !== item.id) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'; }} onDragLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.currentTarget.style.backgroundColor = ''; handleDrop(item); }} onDragEnd={() => setDraggedItem(null)}
                  className={`flex items-center p-3 transition-all ${item.isPurchased ? 'opacity-40 bg-gray-50 dark:bg-gray-800/20' : ''} ${draggedItem?.id === item.id ? 'opacity-50' : ''}`}
                >
                  <button className="cursor-grab pr-2 text-foreground/30 dark:text-dark-foreground/30"><GripVerticalIcon className="w-5 h-5"/></button>
                  <button onClick={() => updateItemInList(listId, item.id, { isPurchased: !item.isPurchased })} className="mr-3">
                    {item.isPurchased ? <CheckSquareIcon className="w-6 h-6 text-primary dark:text-primary-dark"/> : <SquareIcon className="w-6 h-6 text-foreground/50 dark:text-dark-foreground/50"/>}
                  </button>
                  <div className={`flex-1 ${item.isPurchased ? 'line-through' : ''}`}>
                    <p className="font-medium text-card-foreground dark:text-dark-card-foreground">{item.name}</p>
                    <p className="text-sm text-foreground/60 dark:text-dark-foreground/60">
                      {item.quantity} x R$ {item.unitPrice.toFixed(2)} = <span className="font-semibold">R$ {(item.quantity * item.unitPrice).toFixed(2)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditModal(item)} className="p-2 rounded-full hover:bg-border dark:hover:bg-dark-border"><Edit3Icon className="w-4 h-4"/></button>
                    <button onClick={() => setItemToDelete(item)} className="p-2 rounded-full hover:bg-border dark:hover:bg-dark-border"><Trash2Icon className="w-4 h-4 text-red-500"/></button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {/* Modals */}
      <Modal isOpen={isItemModalOpen} onClose={() => setItemModalOpen(false)} title={editingItem ? 'Editar Item' : 'Adicionar Item'}>
        <div className="space-y-4 relative">
            <input type="text" value={itemName} onChange={handleItemNameChange} placeholder="Nome do Item" className="w-full p-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-md" />
            {autocompleteSuggestions.length > 0 && (
                <div className="absolute w-full bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md shadow-lg z-10 mt-1">
                    {autocompleteSuggestions.map(s => (
                        <div key={s.name} onClick={() => handleSuggestionClick(s)} className="p-2 cursor-pointer hover:bg-border dark:hover:bg-dark-border">
                            <p className="font-medium">{s.name}</p>
                            <p className="text-sm text-foreground/60 dark:text-dark-foreground/60">Último preço: R$ {s.lastPrice.toFixed(2)}</p>
                        </div>
                    ))}
                </div>
            )}
            <div className="grid grid-cols-2 gap-4">
                <input type="number" value={itemQuantity} onChange={e => setItemQuantity(e.target.value)} placeholder="Qtd." className="w-full p-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-md" />
                <input type="text" inputMode="decimal" value={itemPrice} onChange={e => setItemPrice(e.target.value)} placeholder="Preço Unit." className="w-full p-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-md" />
            </div>
            <select value={itemCategory} onChange={e => setItemCategory(e.target.value)} className="w-full p-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-md">
                {ITEM_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <button onClick={handleItemFormSubmit} className="w-full mt-4 py-2 bg-primary dark:bg-primary-dark text-primary-foreground font-bold rounded-lg">
                {editingItem ? 'Salvar Alterações' : 'Adicionar'}
            </button>
        </div>
      </Modal>

      <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title="Confirmar Exclusão">
        <div>
            <p>Você tem certeza que deseja excluir o item "<strong>{itemToDelete?.name}</strong>"?</p>
            <div className="flex justify-end gap-4 mt-6">
                <button onClick={() => setItemToDelete(null)} className="px-4 py-2 rounded-lg hover:bg-border dark:hover:bg-dark-border">Cancelar</button>
                <button onClick={handleDeleteItemConfirmation} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Excluir</button>
            </div>
        </div>
      </Modal>
      
      <Modal isOpen={isBudgetModalOpen} onClose={() => setBudgetModalOpen(false)} title="Definir Orçamento da Lista">
        <div className="space-y-4">
          <div>
            <label htmlFor="listBudget" className="block text-sm font-medium mb-1">Valor do Orçamento (R$)</label>
            <input id="listBudget" type="text" inputMode="decimal" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} placeholder="Ex: 150,00" className="w-full p-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-md"/>
          </div>
          <button onClick={handleBudgetFormSubmit} className="w-full mt-4 py-2 bg-primary dark:bg-primary-dark text-primary-foreground font-bold rounded-lg">Salvar Orçamento</button>
        </div>
      </Modal>
    </div>
  );
};

export default ListDetailScreen;