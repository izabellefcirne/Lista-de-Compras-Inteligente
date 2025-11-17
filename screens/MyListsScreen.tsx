import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../store/store';
import { ShoppingList } from '../types';
import { PlusCircleIcon, MoreVerticalIcon, CopyIcon, Trash2Icon, TagIcon } from '../components/Icons';
import Modal from '../components/Modal';
import { Spinner } from '../components/Spinner';
import { LIST_CATEGORIES } from '../constants';

const MyListsScreen: React.FC = () => {
  const { lists, setCurrentPage, addList, deleteList, duplicateList, loadingStates } = useStore();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<ShoppingList | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newListCategory, setNewListCategory] = useState(LIST_CATEGORIES[0]);
  const [newListBudget, setNewListBudget] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAndSortedLists = useMemo(() => {
    return lists
      .filter(list => {
        return list.name.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [lists, searchQuery]);

  const handleCreateList = async () => {
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

    await addList({ name: newListName, category: newListCategory, listBudget: budget });

    setNewListName('');
    setNewListBudget('');
    setNewListCategory(LIST_CATEGORIES[0]);
    setCreateModalOpen(false);
  };

  const handleDeleteConfirmation = async () => {
    if (listToDelete) {
      await deleteList(listToDelete.id);
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
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-md hover:opacity-90 transition-opacity"
        >
          <PlusCircleIcon className="w-5 h-5" />
          <span>Nova Lista</span>
        </button>
      </header>

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input 
          type="text"
          placeholder="Buscar lista..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-grow p-2 rounded-md bg-card dark:bg-dark-card border border-border dark:border-dark-border"
        />
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
            isLoading={loadingStates[`duplicateList-${list.id}`]}
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
          <button onClick={handleCreateList} disabled={loadingStates['addList']} className="w-full flex justify-center items-center mt-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg disabled:opacity-50">
            {loadingStates['addList'] ? <Spinner /> : 'Criar Lista'}
          </button>
        </div>
      </Modal>
      
      <Modal isOpen={!!listToDelete} onClose={() => setListToDelete(null)} title="Confirmar Exclusão">
        <div>
            <p>Você tem certeza que deseja excluir a lista "<strong>{listToDelete?.name}</strong>"?</p>
            <p className="text-sm text-red-500 mt-2">Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-4 mt-6">
                <button onClick={() => setListToDelete(null)} className="px-4 py-2 rounded-lg hover:bg-border dark:hover:bg-dark-border">Cancelar</button>
                <button 
                  onClick={handleDeleteConfirmation} 
                  disabled={loadingStates[`deleteList-${listToDelete?.id}`]}
                  className="w-24 flex justify-center items-center px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loadingStates[`deleteList-${listToDelete?.id}`] ? <Spinner /> : 'Excluir'}
                </button>
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
    isLoading: boolean;
}

const ListCard: React.FC<ListCardProps> = ({ list, total, onSelect, onDeleteRequest, onDuplicate, isLoading }) => {
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
            <div>
              <div className="flex justify-between items-start">
                  <div className="flex-1 cursor-pointer pr-2" onClick={onSelect}>
                      <h3 className="font-bold text-lg text-card-foreground dark:text-dark-card-foreground">{list.name}</h3>
                      <p className="text-sm text-foreground/60 dark:text-dark-foreground/60">{list.items.length} itens</p>
                  </div>
                  <div className="relative" ref={menuRef}>
                      <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 rounded-full hover:bg-border dark:hover:bg-dark-border">
                          <MoreVerticalIcon className="w-5 h-5" />
                      </button>
                      {menuOpen && (
                          <div className="absolute right-0 mt-2 w-48 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md shadow-lg z-10 animate-fade-in">
                              <button onClick={() => handleAction(() => onDuplicate(list.id))} disabled={isLoading} className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-border dark:hover:bg-dark-border disabled:opacity-50">
                                {isLoading ? <Spinner className="w-4 h-4"/> : <CopyIcon className="w-4 h-4"/>} 
                                Duplicar
                              </button>
                              <button onClick={() => handleAction(onDeleteRequest)} className="w-full text-left px-4 py-2 text-sm text-red-500 flex items-center gap-2 hover:bg-border dark:hover:bg-dark-border"><Trash2Icon className="w-4 h-4"/> Deletar</button>
                          </div>
                      )}
                  </div>
              </div>
              <div className="mt-2" onClick={onSelect}>
                  <div className="inline-flex items-center gap-1.5 bg-accent/10 text-accent dark:bg-accent/20 px-2 py-1 text-xs font-medium rounded-full">
                      <TagIcon className="w-3 h-3" />
                      {list.category}
                  </div>
              </div>
            </div>
            <div className="mt-4 cursor-pointer" onClick={onSelect}>
                <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-card-foreground dark:text-dark-card-foreground">R$ {total.toFixed(2)}</span>
                    <span className="text-xs text-foreground/50 dark:text-dark-foreground/50">{new Date(list.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    );
};

export default MyListsScreen;