import React, { useState } from 'react';
import { CheckCircle2, Diamond, ShoppingCart, Star } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { useTranslation } from '../hooks/useTranslation';
import ExperienceFrame from '../components/ExperienceFrame';
import MascotRabbit from '../components/MascotRabbit';
import '../styles/shop.css';

const SHOP_ITEMS = [
  { id: 'hat_wizard', name: 'Wizard Hat', nameKey: 'itemHatWizard', category: 'hat', icon: '🧙‍♂️', costStars: 50, costGems: 0 },
  { id: 'hat_crown', name: 'Royal Crown', nameKey: 'itemHatCrown', category: 'hat', icon: '👑', costStars: 100, costGems: 5 },
  { id: 'hat_flower', name: 'Flower Crown', nameKey: 'itemHatFlower', category: 'hat', icon: '🌸', costStars: 0, costGems: 4 },
  { id: 'hat_party', name: 'Party Hat', nameKey: 'itemHatParty', category: 'hat', icon: '🥳', costStars: 0, costGems: 6 },
  { id: 'glasses_cool', name: 'Cool Glasses', nameKey: 'itemGlassesCool', category: 'glasses', icon: '🕶️', costStars: 30, costGems: 0 },
  { id: 'glasses_star', name: 'Star Glasses', nameKey: 'itemGlassesStar', category: 'glasses', icon: '🤩', costStars: 0, costGems: 4 },
  { id: 'glasses_heart', name: 'Heart Glasses', nameKey: 'itemGlassesHeart', category: 'glasses', icon: '💖', costStars: 0, costGems: 5 },
  { id: 'bg_space', name: 'Space Theme', nameKey: 'itemBgSpace', category: 'background', icon: '🌌', costStars: 200, costGems: 10 },
  { id: 'bg_ocean', name: 'Ocean Theme', nameKey: 'itemBgOcean', category: 'background', icon: '🌊', costStars: 0, costGems: 8 },
  { id: 'bg_candy', name: 'Candy Theme', nameKey: 'itemBgCandy', category: 'background', icon: '🍭', costStars: 0, costGems: 10 },
];

const categories = ['all', 'hat', 'glasses', 'background'];

export default function Shop() {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { stars, gems, inventory, equipped, buyItem, equipItem } = useGameStore();
  const items = selectedCategory === 'all' ? SHOP_ITEMS : SHOP_ITEMS.filter((item) => item.category === selectedCategory);

  return (
    <ExperienceFrame world={t('rewardVillage')} title={t('rewardShop')} subtitle={t('rewardShopSubtitle')} backTo="/phonics" tone="violet">
      <div className="shop-balance" aria-label={t('shopBalance')}><span><Star size={18} fill="currentColor" /> {stars}</span><span><Diamond size={18} fill="currentColor" /> {gems}</span></div>
      <div className="shop-preview"><div><span className="shop-preview__eyebrow">{t('yourBunny')}</span><h2>{t('shopPrompt')}</h2><p>{t('shopPersistence')}</p></div><MascotRabbit style={{ width: 130, height: 130 }} /></div>
      <div className="shop-filters" role="tablist" aria-label={t('shopCategories')}>
        {categories.map((category) => <button key={category} id={`shop-tab-${category}`} type="button" role="tab" aria-controls="shop-items" aria-selected={selectedCategory === category} className={selectedCategory === category ? 'btn-primary' : 'btn-secondary'} onClick={() => setSelectedCategory(category)}>{t(`category${category[0].toUpperCase()}${category.slice(1)}`)}</button>)}
      </div>
      <div className="shop-grid" id="shop-items" role="tabpanel" aria-labelledby={`shop-tab-${selectedCategory}`}>
        {items.map((item) => {
          const owned = inventory.includes(item.id);
          const active = equipped[item.category] === item.id;
          const canAfford = stars >= item.costStars && gems >= item.costGems;
          return <article className={`shop-item ${owned ? 'shop-item--owned' : ''}`} key={item.id}>
            {owned && <span className="shop-item__owned-badge">✓ {t('owned')}</span>}
            <span className="shop-item__icon" aria-hidden="true">{item.icon}</span>
            <h3>{t(item.nameKey)}</h3>
            <p>{item.costGems > 0 ? `💎 ${item.costGems}` : `⭐ ${item.costStars}`}</p>
            {owned ? (
              <button type="button" className={active ? 'btn-secondary' : 'btn-primary'} onClick={() => equipItem(item.category, item.id)}>{active ? <><CheckCircle2 size={17} /> {t('equipped')}</> : t('equip')}</button>
            ) : (
              <button type="button" className="btn-primary" disabled={!canAfford} onClick={() => buyItem(item, item.costStars, item.costGems)}>{t('buy')} {item.costGems > 0 ? `💎 ${item.costGems}` : `⭐ ${item.costStars}`}</button>
            )}
          </article>;
        })}
      </div>
      <p className="shop-footnote"><ShoppingCart size={16} /> {t('shopFootnote')}</p>
    </ExperienceFrame>
  );
}

export { SHOP_ITEMS };
