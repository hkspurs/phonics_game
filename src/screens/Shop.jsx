import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Diamond, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { useTranslation } from '../hooks/useTranslation';
import MascotRabbit from '../components/MascotRabbit';

const SHOP_ITEMS = [
  { id: 'hat_wizard', name: 'Wizard Hat', category: 'hat', icon: '🧙‍♂️', costStars: 50, costGems: 0 },
  { id: 'hat_crown', name: 'Royal Crown', category: 'hat', icon: '👑', costStars: 100, costGems: 5 },
  { id: 'glasses_cool', name: 'Cool Glasses', category: 'glasses', icon: '🕶️', costStars: 30, costGems: 0 },
  { id: 'bg_space', name: 'Space Theme', category: 'background', icon: '🌌', costStars: 200, costGems: 10 },
];

export default function Shop() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { stars, gems, inventory, equipped, buyItem, equipItem } = useGameStore();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredItems = selectedCategory === 'all' 
    ? SHOP_ITEMS 
    : SHOP_ITEMS.filter(i => i.category === selectedCategory);

  const handlePurchase = (item) => {
    buyItem(item, item.costStars, item.costGems);
  };

  const handleEquip = (item) => {
    equipItem(item.category, item.id);
  };

  return (
    <div className="screen-container" style={{ background: '#fdf4ff', minHeight: '100vh', overflowY: 'auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button className="btn-secondary" onClick={() => navigate(-1)} style={{ padding: '0.75rem' }}>
          <ArrowLeft size={24} /> {t('back')}
        </button>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', border: '2px solid #e2e8f0' }}>
            <Star size={24} fill="#eab308" color="#eab308" /> {stars}
          </div>
          <div style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', border: '2px solid #e2e8f0' }}>
            <Diamond size={24} fill="#0ea5e9" color="#0ea5e9" /> {gems}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: '#d946ef', fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ShoppingCart size={40} /> Reward Shop
        </h1>
        <p style={{ color: '#a21caf', fontSize: '1.2rem' }}>Spend your hard-earned stars and gems!</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
        {['all', 'hat', 'glasses', 'background'].map(cat => (
          <button 
            key={cat}
            className={selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setSelectedCategory(cat)}
            style={{ textTransform: 'capitalize' }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {/* Mascot Preview */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '4px solid #f0abfc', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '300px' }}>
          <h2 style={{ color: '#86198f', marginBottom: '1rem' }}>Preview</h2>
          <div style={{ width: '150px', height: '150px', background: '#f8fafc', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <MascotRabbit />
            {equipped.hat === 'hat_wizard' && <span style={{ position: 'absolute', top: -30, fontSize: '4rem' }}>🧙‍♂️</span>}
            {equipped.hat === 'hat_crown' && <span style={{ position: 'absolute', top: -30, fontSize: '4rem' }}>👑</span>}
            {equipped.glasses === 'glasses_cool' && <span style={{ position: 'absolute', top: 30, fontSize: '4rem' }}>🕶️</span>}
          </div>
        </div>

        {/* Shop Items */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', flex: 1, maxWidth: '800px' }}>
          {filteredItems.map(item => {
            const isOwned = inventory.includes(item.id);
            const isEquipped = equipped[item.category] === item.id;
            const canAfford = stars >= item.costStars && gems >= item.costGems;

            return (
              <div key={item.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: (!isOwned && !canAfford) ? 0.7 : 1 }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{item.icon}</div>
                <h3 style={{ color: '#475569', textAlign: 'center', marginBottom: '1rem' }}>{item.name}</h3>
                
                {isOwned ? (
                  <button 
                    className={isEquipped ? 'btn-secondary' : 'btn-primary'}
                    onClick={() => handleEquip(item)}
                    style={{ width: '100%', marginTop: 'auto', background: isEquipped ? '#e2e8f0' : '#22c55e', color: isEquipped ? '#475569' : 'white', boxShadow: isEquipped ? 'none' : '0 4px 0 #16a34a' }}
                  >
                    {isEquipped ? <><CheckCircle2 size={20} style={{ display: 'inline' }}/> Equipped</> : 'Equip'}
                  </button>
                ) : (
                  <button 
                    className="btn-primary" 
                    onClick={() => handlePurchase(item)}
                    disabled={!canAfford}
                    style={{ width: '100%', marginTop: 'auto', background: canAfford ? '#d946ef' : '#cbd5e1', boxShadow: canAfford ? '0 4px 0 #a21caf' : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: '0.5rem' }}
                  >
                    <span>Buy</span>
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }}>
                      {item.costStars > 0 && <span>⭐ {item.costStars}</span>}
                      {item.costGems > 0 && <span>💎 {item.costGems}</span>}
                    </div>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
