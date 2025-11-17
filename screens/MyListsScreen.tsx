import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../store/store';
import { ShoppingList, ListStatus } from '../types';
import { PlusCircleIcon, MoreVerticalIcon, PinIcon, ArchiveIcon, CopyIcon, Trash2Icon, Edit3Icon, CheckCircle2, ArchiveRestoreIcon } from '../components/Icons';
import Modal from '../components/Modal';
import { LIST_CATEGORIES } from '../constants';

const statusMap: Record<ListStatus, { label: string, color: string }> = {
    active: { label: 'Ativa', color: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300' },
    completed: { label: 'Concluída', color: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' },
    archived: { label: 'Arquivada', color: 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300' },
};

const MyListsScreen: React.FC = () => {
  const { lists, setCurrentPage, addList, deleteList, duplicateList, updateList } = useStore();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<ShoppingList | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newListCategory, setNewListCategory] = useState(LIST_CATEGORIES[0]);
  const [newListBudget, setNewListBudget] = useState('');
  const [filter, setFilter] = useState<{ status: ListStatus | 'all', category: string }>({ status: 'active', category: 'all' });
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAndSortedLists = useMemo(() => {
    return lists
      .filter(list => {
        const statusMatch = filter.status === 'all' || list.status === filter.status;
        const categoryMatch = filter.category === 'all' || list.category === filter.category;
        const searchMatch = list.name.toLowerCase().includes(searchQuery.toLowerCase());
        return statusMatch && categoryMatch && searchMatch;
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [lists, filter, searchQuery]);

  const handleCreateList = () => {
    if (!newListName.trim()) {
      alert('Por favor, insira um nome para a lista.');
      return;
    }

    let budget: number | undefined = undefined;
    if (newListBudget.trim()) {
        const parsedBudget = parseFloat(newListBudget.replace(',', '.'));
        if (isNaN(parsedBudget) || parsedBudget < 0) {
            alert('O valor do orçamento é inválido. Ele deve ser um número positivo.');
            return;
        }
        budget = parsedBudget;
    }

    addList({ name: newListName, category: newListCategory, listBudget: budget });

    setNewListName('');
    setNewListCategory(LIST_CATEGORIES[0]);
    setNewListBudget('');
    setCreateModalOpen(false);
  };

  const handleDeleteConfirmation = () => {
    if (listToDelete) {
      deleteList(listToDelete.id);
      setListToDelete(null);
    }
  };

  const getListTotal = (list: ShoppingList) => {
    return list.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  };

  return (
    <div className="p-4 md:p-6 animate-slide-in-up">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Minhas Listas</h1>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary dark:bg-primary-dark text-primary-foreground rounded-lg shadow-md hover:opacity-90 transition-opacity"
        >
          <PlusCircleIcon className="w-5 h-5" />
          <span>Nova Lista</span>
        </button>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input 
          type="text"
          placeholder="Buscar lista..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-grow p-2 rounded-md bg-card dark:bg-dark-card border border-border dark:border-dark-border"
        />
        <div className="flex gap-4">
          <select value={filter.status} onChange={e => setFilter(f => ({...f, status: e.target.value as ListStatus | 'all'}))} className="p-2 w-full rounded-md bg-card dark:bg-dark-card border border-border dark:border-dark-border">
              <option value="all">Todos Status</option>
              <option value="active">Ativas</option>
              <option value="completed">Concluídas</option>
              <option value="archived">Arquivadas</option>
          </select>
          <select value={filter.category} onChange={e => setFilter(f => ({...f, category: e.target.value}))} className="p-2 w-full rounded-md bg-card dark:bg-dark-card border border-border dark:border-dark-border">
              <option value="all">Todas Categorias</option>
              {LIST_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedLists.map(list => (
          <ListCard 
            key={list.id} 
            list={list} 
            total={getListTotal(list)} 
            onSelect={() => setCurrentPage('listDetail', list.id)}
            onDeleteRequest={() => setListToDelete(list)}
            onDuplicate={duplicateList}
            onUpdate={updateList}
          />
        ))}
        {filteredAndSortedLists.length === 0 && (
            <div className="col-span-full text-center py-10">
                <p className="text-foreground/60 dark:text-dark-foreground/60">{searchQuery ? 'Nenhuma lista encontrada para sua busca.' : 'Nenhuma lista encontrada. Crie uma nova!'}</p>
            </div>
        )}
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title="Criar Nova Lista">
        <div className="space-y-4">
          <div>
            <label htmlFor="listName" className="block text-sm font-medium mb-1">Nome da Lista</label>
            <input
              id="listName"
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Ex: Compras da Semana"
              className="w-full p-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-md"
            />
          </div>
          <div>
            <label htmlFor="listCategory" className="block text-sm font-medium mb-1">Categoria</label>
            <select
              id="listCategory"
              value={newListCategory}
              onChange={(e) => setNewListCategory(e.target.value)}
              className="w-full p-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-md"
            >
              {LIST_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="listBudget" className="block text-sm font-medium mb-1">Orçamento da Lista (Opcional)</label>
            <input
              id="listBudget"
              type="text"
              inputMode="decimal"
              value={newListBudget}
              onChange={(e) => setNewListBudget(e.target.value)}
              placeholder="Ex: 150,00"
              className="w-full p-2 bg-background dark:bg-dark-background border border-border dark:border-dark-border rounded-md"
            />
          </div>
          <button onClick={handleCreateList} className="w-full mt-4 py-2 bg-primary dark:bg-primary-dark text-primary-foreground font-bold rounded-lg">
            Criar Lista
          </button>
        </div>
      </Modal>
      
      <Modal isOpen={!!listToDelete} onClose={() => setListToDelete(null)} title="Confirmar Exclusão">
        <div>
            <p>Você tem certeza que deseja excluir a lista "<strong>{listToDelete?.name}</strong>"?</p>
            <p className="text-sm text-red-500 mt-2">Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-4 mt-6">
                <button onClick={() => setListToDelete(null)} className="px-4 py-2 rounded-lg hover:bg-border dark:hover:bg-dark-border">Cancelar</button>
                <button onClick={handleDeleteConfirmation} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Excluir</button>
            </div>
        </div>
      </Modal>
    </div>
  );
};


interface ListCardProps {
    list: ShoppingList;
    total: number;
    onSelect: () => void;
    onDeleteRequest: () => void;
    onDuplicate: (id: string) => void;
    onUpdate: (id: string, updates: Partial<ShoppingList>) => void;
}

const ListCard: React.FC<ListCardProps> = ({ list, total, onSelect, onDeleteRequest, onDuplicate, onUpdate }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuOpen]);

    const handleAction = (action: () => void) => {
        action();
        setMenuOpen(false);
    };
    
    return (
        <div className="bg-card dark:bg-dark-card p-4 rounded-lg shadow-md flex flex-col justify-between transition-transform hover:scale-[1.02]">
            <div className="flex justify-between items-start">
                <div className="flex-1 cursor-pointer pr-2" onClick={onSelect}>
                    {list.isPinned && <PinIcon className="w-4 h-4 text-amber-500 mb-1" />}
                    <h3 className="font-bold text-lg text-card-foreground dark:text-dark-card-foreground">{list.name}</h3>
                    <p className="text-sm text-foreground/60 dark:text-dark-foreground/60">{list.category}</p>
                </div>
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 rounded-full hover:bg-border dark:hover:bg-dark-border">
                        <MoreVerticalIcon className="w-5 h-5" />
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md shadow-lg z-10 animate-fade-in">
                           {list.status === 'active' && (
                                <>
                                    <button onClick={() => handleAction(() => onUpdate(list.id, { isPinned: !list.isPinned }))} className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-border dark:hover:bg-dark-border"><PinIcon className="w-4 h-4"/> {list.isPinned ? 'Desafixar' : 'Fixar'}</button>
                                    <button onClick={() => handleAction(() => onUpdate(list.id, { status: 'completed' }))} className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-border dark:hover:bg-dark-border"><CheckCircle2 className="w-4 h-4"/> Marcar como Concluída</button>
                                    <button onClick={() => handleAction(() => onUpdate(list.id, { status: 'archived' }))} className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-border dark:hover:bg-dark-border"><ArchiveIcon className="w-4 h-4"/> Arquivar</button>
                                </>
                            )}
                            {list.status === 'archived' && (
                                <button onClick={() => handleAction(() => onUpdate(list.id, { status: 'active' }))} className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-border dark:hover:bg-dark-border"><ArchiveRestoreIcon className="w-4 h-4"/> Restaurar</button>
                            )}
                            <button onClick={() => handleAction(() => onDuplicate(list.id))} className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-border dark:hover:bg-dark-border"><CopyIcon className="w-4 h-4"/> Duplicar</button>
                            <button onClick={() => handleAction(onDeleteRequest)} className="w-full text-left px-4 py-2 text-sm text-red-500 flex items-center gap-2 hover:bg-border dark:hover:bg-dark-border"><Trash2Icon className="w-4 h-4"/> Deletar</button>
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-4 cursor-pointer" onClick={onSelect}>
                <div className="flex justify-between items-center text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusMap[list.status].color}`}>{statusMap[list.status].label}</span>
                    <span className="font-semibold text-card-foreground dark:text-dark-card-foreground">R$ {total.toFixed(2)}</span>
                </div>
                <p className="text-xs text-foreground/50 dark:text-dark-foreground/50 mt-2">{new Date(list.createdAt).toLocaleDateString()}</p>
            </div>
        </div>
    );
};

export default MyListsScreen;