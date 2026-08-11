import React, { useState } from 'react';
import { CheckCircle2, Diamond, ShoppingCart, Star } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { useTranslation } from '../hooks/useTranslation';
import ExperienceFrame from '../components/ExperienceFrame';
import MascotRabbit from '../components/MascotRabbit';
import '../styles/shop.css';

const SHOP_ITEMS = [
  { id: 'hat_wizard', name: 'Wizard Hat', category: 'hat', icon: '🧙‍♂️', costStars: 50, costGems: 0 },
  { id: 'hat_crown', name: 'Royal Crown', category: 'hat', icon: '👑', costStars: 100, costGems: 5 },
  { id: 'hat_flower', name: 'Flower Crown', category: 'hat', icon: '🌸', costStars: 0, costGems: 4 },
  { id: 'hat_party', name: 'Party Hat', category: 'hat', icon: '🥳', costStars: 0, costGems: 6 },
  { id: 'glasses_cool', name: 'Cool Glasses', category: 'glasses', icon: '🕶️', costStars: 30, costGems: 0 },
  { id: 'glasses_star', name: 'Star Glasses', category: 'glasses', icon: '🤩', costStars: 0, costGems: 4 },
  { id: 'glasses_heart', name: 'Heart Glasses', category: 'glasses', icon: '💖', costStars: 0, costGems: 5 },
  { id: 'bg_space', name: 'Space Theme', category: 'background', icon: '🌌', costStars: 200, costGems: 10 },
  { id: 'bg_ocean', name: 'Ocean Theme', category: 'background', icon: '🌊', costStars: 0, costGems: 8 },
  { id: 'bg_candy', name: 'Candy Theme', category: 'background', icon: '🍭', costStars: 0, costGems: 10 },
];

const categories = ['all', 'hat', 'glasses', 'background'];

export default function Shop() {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { stars, gems, inventory, equipped, buyItem, equipItem } = useGameStore();
  const items = selectedCategory === 'all' ? SHOP_ITEMS : SHOP_ITEMS.filter((item) => item.category === selectedCategory);

  return (
    <ExperienceFrame world="Reward Village" title="Reward Shop" subtitle="用星星或鑽石，幫 Bunny 換個新造型。" backTo="/phonics" tone="violet">
      <div className="shop-balance" aria-label="Shop balance"><span><Star size={18} fill="currentColor" /> {stars}</span><span><Diamond size={18} fill="currentColor" /> {gems}</span></div>
      <div className="shop-preview"><div><span className="shop-preview__eyebrow">YOUR BUNNY</span><h2>今日想戴咩？</h2><p>買完即刻 Equip；重新開 browser 都會保留。</p></div><MascotRabbit style={{ width: 130, height: 130 }} /></div>
      <div className="shop-filters" role="tablist" aria-label="Shop categories">
        {categories.map((category) => <button key={category} type="button" role="tab" aria-selected={selectedCategory === category} className={selectedCategory === category ? 'btn-primary' : 'btn-secondary'} onClick={() => setSelectedCategory(category)}>{category}</button>)}
      </div>
      <div className="shop-grid">
        {items.map((item) => {
          const owned = inventory.includes(item.id);
          const active = equipped[item.category] === item.id;
          const canAfford = stars >= item.costStars && gems >= item.costGems;
          return <article className={`shop-item ${owned ? 'shop-item--owned' : ''}`} key={item.id}>
            <span className="shop-item__icon" aria-hidden="true">{item.icon}</span>
            <h3>{item.name}</h3>
            <p>{item.costGems > 0 ? `💎 ${item.costGems}` : `⭐ ${item.costStars}`}</p>
            {owned ? (
              <button type="button" className={active ? 'btn-secondary' : 'btn-primary'} onClick={() => equipItem(item.category, item.id)}>{active ? <><CheckCircle2 size={17} /> Equipped</> : 'Equip'}</button>
            ) : (
              <button type="button" className="btn-primary" disabled={!canAfford} onClick={() => buyItem(item, item.costStars, item.costGems)}>Buy {item.costGems > 0 ? `💎 ${item.costGems}` : `⭐ ${item.costStars}`}</button>
            )}
          </article>;
        })}
      </div>
      <p className="shop-footnote"><ShoppingCart size={16} /> 鑽石造型會直接寫入現有遊戲存檔。</p>
    </ExperienceFrame>
  );
}

export { SHOP_ITEMS };
