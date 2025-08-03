import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../api/axiosConfig';
import { UserPetItem, ItemType } from '../types';

interface InventoryPageProps {
  onPetUpdated: () => void;
}

const InventoryPage: React.FC<InventoryPageProps> = ({ onPetUpdated }) => {
  const [inventory, setInventory] = useState<UserPetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ItemType | 'ALL'>('ALL');

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<UserPetItem[]>('/pet/inventory');
        setInventory(response.data);
      } catch (err) {
        setError('Failed to fetch inventory.');
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, [onPetUpdated]); // Refetch when pet is updated

  const handleUseItem = async (userPetItemId: string) => {
    try {
      await apiClient.post('/pet/use', { userPetItemId });
      alert('Item used successfully!');
      onPetUpdated();
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || 'Could not use item.'}`);
    }
  };

  const handleEquipItem = async (userPetItemId: string) => {
    try {
      await apiClient.post('/pet/equip', { userPetItemId });
      alert('Item equipped successfully!');
      onPetUpdated();
    } catch (error: any) {
      alert(
        `Error: ${error.response?.data?.message || 'Could not equip item.'}`,
      );
    }
  };

  const filteredInventory = useMemo(() => {
    if (activeFilter === 'ALL') {
      return inventory;
    }
    return inventory.filter((invItem) => invItem.item.type === activeFilter);
  }, [inventory, activeFilter]);

  const filterButtons = (
    <div className="filter-nav">
      <button onClick={() => setActiveFilter('ALL')}>All</button>
      <button onClick={() => setActiveFilter(ItemType.FOOD)}>Food</button>
      <button onClick={() => setActiveFilter(ItemType.TREAT)}>Treats</button>
      <button onClick={() => setActiveFilter(ItemType.TOY)}>Toys</button>
      <button onClick={() => setActiveFilter(ItemType.CUSTOMIZATION)}>
        Customization
      </button>
    </div>
  );

  if (loading) return <div>Loading inventory...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <h3>My Inventory</h3>
      {filterButtons}
      {filteredInventory.length > 0 ? (
        <div className="item-grid">
          {filteredInventory.map(({ id, item, quantity }) => (
            <div key={id} className="item-card">
              <div className="item-image-container">
                {item.imageUrl && <img src={item.imageUrl} alt={item.name} />}
              </div>
              <div className="item-info">
                <h4>
                  {item.name} (x{quantity})
                </h4>
                <p>{item.description}</p>
              </div>
              {item.type === ItemType.CUSTOMIZATION ? (
                <button onClick={() => handleEquipItem(id)}>Equip</button>
              ) : (
                <button onClick={() => handleUseItem(id)}>Use</button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>
          No items of this type in your inventory. Visit the shop to get new
          items!
        </p>
      )}
    </div>
  );
};

export default InventoryPage;
