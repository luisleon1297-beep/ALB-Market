const state = {
  cities: [], selected: null, prices: [], priceHistory: [], recipe: null,
  favorites: JSON.parse(localStorage.getItem('albion-favorites') || '[]'),
  alerts: JSON.parse(localStorage.getItem('albion-alerts') || '{}'),
  sessions: JSON.parse(localStorage.getItem('albion-sessions') || '[]'),
  buildItems: JSON.parse(localStorage.getItem('albion-build') || '[]'),
  staleHours: Number(localStorage.getItem('albion-stale-hours') || 2),
  opportunityRows: [], blackMarketRows:[], blackMarketSelected:null, demandRows: [], resourceRows: [], marketCategory:'all', chartDays:30, showAllMarkets:false, worldMapInstance: null,
  refiningResource:'METALBAR', refiningNutrition:0, refiningPriceDates:[], refiningResult:null, refiningHistory:[],
  communityBuilds:[], selectedCommunityBuild:null, selectedBuildWeapon:null, buildSlots:[], buildRecommendations:new Map(),
  fishingPrices:[], fishingPriceCity:null, fishingRecipeOptions:new Map(), fishingTax:0.065
};
const $ = id => document.getElementById(id);
const foldText = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
const silver = value => value > 0 ? `${Math.round(value).toLocaleString('es-CL')} 🜚` : '—';
const signedSilver = value => `${Math.round(Number(value) || 0).toLocaleString('es-CL')} 🜚`;
const imagePlaceholder = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="96"%3E%3Crect width="96" height="96" rx="8" fill="%23111716"/%3E%3Cpath d="M30 68 48 24l18 44M37 52h22" fill="none" stroke="%23d8ac55" stroke-width="6"/%3E%3C/svg%3E';
const qualityName = quality => ({ 1:'Normal', 2:'Buena', 3:'Sobresaliente', 4:'Excelente', 5:'Obra maestra' }[quality] || '');
const enchantmentOf = itemId => Number(String(itemId || '').match(/@([1-4])$/)?.[1] || 0);
const tierEnchant = item => item?.tier ? `T${item.tier}.${enchantmentOf(item.id)}` : `.${enchantmentOf(item?.id)}`;
const cityName = city => ({
  'Arthurs Rest Smugglers Network': "Arthur's Rest",
  'Merlyns Rest Smugglers Network': "Merlyn's Rest",
  'Morganas Rest Smugglers Network': "Morgana's Rest"
}[city] || city);
const refiningResources = {
  LEATHER:{ raw:'HIDE', label:'Cuero', rawLabel:'Piel', bonusCity:'Martlock', heart:'HIGHLAND', heartLabel:'Corazón de roca' },
  CLOTH:{ raw:'FIBER', label:'Tela', rawLabel:'Fibra', bonusCity:'Lymhurst', heart:'FOREST', heartLabel:'Corazón de árbol' },
  PLANKS:{ raw:'WOOD', label:'Tablones', rawLabel:'Troncos', bonusCity:'Fort Sterling', heart:'MOUNTAIN', heartLabel:'Corazón de montaña' },
  METALBAR:{ raw:'ORE', label:'Lingotes', rawLabel:'Mineral', bonusCity:'Thetford', heart:'SWAMP', heartLabel:'Corazón de vid' },
  STONEBLOCK:{ raw:'ROCK', label:'Bloques de piedra', rawLabel:'Piedra', bonusCity:'Bridgewatch', heart:'STEPPE', heartLabel:'Corazón de bestia' }
};
const refiningRawCounts = { 4:2, 5:3, 6:4, 7:5, 8:5 };

const fishingBiomes = { all:'Todos', forest:'Bosque', swamp:'Pantano', mountain:'Montaña', highland:'Tierras altas', steppe:'Estepa', ancient:'Tierras Ancestrales', avalon:'Avalon', ocean:'Costa', any:'Cualquier bioma' };
const fishingFish = [
  ['T1_FISH_FRESHWATER_ALL_COMMON','Corvina común',1,'fresh','any','common','Comer para subir pesca o picar'],['T2_FISH_FRESHWATER_ALL_COMMON','Carpa rayada',2,'fresh','any','common','Picar para salsa de pescado'],['T3_FISH_FRESHWATER_ALL_COMMON','Perca de Albion',3,'fresh','any','common','Vender o picar'],['T4_FISH_FRESHWATER_ALL_COMMON','Pique azul',4,'fresh','any','common','Vender o picar'],['T5_FISH_FRESHWATER_ALL_COMMON','Trucha pintada',5,'fresh','any','common','Vender o picar'],['T6_FISH_FRESHWATER_ALL_COMMON','Lucio brillante',6,'fresh','any','common','Vender o picar'],['T7_FISH_FRESHWATER_ALL_COMMON','Pez gato bocudo',7,'fresh','any','common','Vender o picar'],['T8_FISH_FRESHWATER_ALL_COMMON','Esturión de río',8,'fresh','any','common','Vender si el precio supera al pescado picado'],
  ['T1_FISH_SALTWATER_ALL_COMMON','Arenque común',1,'salt','ocean','common','Comer para subir pesca o picar'],['T2_FISH_SALTWATER_ALL_COMMON','Caballa rayada',2,'salt','ocean','common','Picar para salsa de pescado'],['T3_FISH_SALTWATER_ALL_COMMON','Solla costera',3,'salt','ocean','common','Vender o picar'],['T4_FISH_SALTWATER_ALL_COMMON','Bacalao azul',4,'salt','ocean','common','Vender o picar'],['T5_FISH_SALTWATER_ALL_COMMON','Pez lobo pintado',5,'salt','ocean','common','Vender o picar'],['T6_FISH_SALTWATER_ALL_COMMON','Salmón fuerte',6,'salt','ocean','common','Vender o picar'],['T7_FISH_SALTWATER_ALL_COMMON','Atún azulado',7,'salt','ocean','common','Vender o picar'],['T8_FISH_SALTWATER_ALL_COMMON','Pez espada de acero',8,'salt','ocean','common','Vender si el precio supera al pescado picado'],
  ['T3_FISH_FRESHWATER_FOREST_RARE','Anguila de agua verdosa',3,'fresh','forest','rare','Cocinar estofado o vender'],['T5_FISH_FRESHWATER_FOREST_RARE','Anguila rojiza',5,'fresh','forest','rare','Cocinar estofado o vender'],['T7_FISH_FRESHWATER_FOREST_RARE','Anguila de agua podrida',7,'fresh','forest','rare','Alta demanda: estofado T8'],
  ['T3_FISH_FRESHWATER_SWAMP_RARE','Almeja de páramo verde',3,'fresh','swamp','rare','Cocinar sopa o vender'],['T5_FISH_FRESHWATER_SWAMP_RARE','Almeja de agua turbia',5,'fresh','swamp','rare','Cocinar sopa o vender'],['T7_FISH_FRESHWATER_SWAMP_RARE','Almeja de pantano negro',7,'fresh','swamp','rare','Cocinar sopa o vender'],
  ['T3_FISH_FRESHWATER_MOUNTAIN_RARE','Ojo frío de tierras altas',3,'fresh','mountain','rare','Cocinar pastel o vender'],['T5_FISH_FRESHWATER_MOUNTAIN_RARE','Ojo ciego de montaña',5,'fresh','mountain','rare','Cocinar pastel o vender'],['T7_FISH_FRESHWATER_MOUNTAIN_RARE','Ojo muerto de pico helado',7,'fresh','mountain','rare','Cocinar pastel o vender'],
  ['T3_FISH_FRESHWATER_HIGHLANDS_RARE','Acechador de arroyo pétreo',3,'fresh','highland','rare','Cocinar sándwich o vender'],['T5_FISH_FRESHWATER_HIGHLANDS_RARE','Acechador de aguas rápidas',5,'fresh','highland','rare','Cocinar sándwich o vender'],['T7_FISH_FRESHWATER_HIGHLANDS_RARE','Acechador de catarata',7,'fresh','highland','rare','Cocinar sándwich o vender'],
  ['T3_FISH_FRESHWATER_STEPPE_RARE','Cangrejo de río bajo',3,'fresh','steppe','rare','Cocinar tortilla o vender'],['T5_FISH_FRESHWATER_STEPPE_RARE','Cangrejo de arroyo seco',5,'fresh','steppe','rare','Cocinar tortilla o vender'],['T7_FISH_FRESHWATER_STEPPE_RARE','Cangrejo de madriguera polvorienta',7,'fresh','steppe','rare','Cocinar tortilla o vender'],
  ['T3_FISH_SALTWATER_ALL_RARE','Calamar de bajío',3,'salt','ocean','rare','Cocinar ensalada o vender'],['T5_FISH_SALTWATER_ALL_RARE','Pulpo de aguas medias',5,'salt','ocean','rare','Cocinar ensalada o vender'],['T7_FISH_SALTWATER_ALL_RARE','Kraken de aguas profundas',7,'salt','ocean','rare','Alta demanda: ensalada T6'],
  ['T3_FISH_FRESHWATER_AVALON_RARE','Pargo de niebla blanca',3,'fresh','avalon','rare','Cocinar asado o vender'],['T5_FISH_FRESHWATER_AVALON_RARE','Pargo de neblina clara',5,'fresh','avalon','rare','Cocinar asado o vender'],['T7_FISH_FRESHWATER_AVALON_RARE','Pargo de niebla pura',7,'fresh','avalon','rare','Alta demanda: asado T7'],['T8_FISH_SALTWATER_ALL_BOSS_SHARK','Tiburón',8,'salt','ocean','boss','Vender: captura especial muy rara']
  ,['T3_FISH_FRESHWATER_DRAGON_AREA_RARE','Carefree Leyfin',3,'fresh','ancient','rare','Cocinar tortilla Leyfin, picar o vender'],['T5_FISH_FRESHWATER_DRAGON_AREA_RARE','Brightsoul Leyfin',5,'fresh','ancient','rare','Cocinar tortilla Leyfin, picar o vender'],['T7_FISH_FRESHWATER_DRAGON_AREA_RARE','Dragonbound Leyfin',7,'fresh','ancient','rare','Cocinar tortilla Leyfin, picar o vender']
].map(([id,name,tier,water,biome,rarity,use])=>({id,name,tier,water,biome,rarity,use}));
const fishingRecipes = [
  ['T1_MEAL_SOUP_FISH','Sopa de almeja verde','Almeja de páramo verde'],['T3_MEAL_SOUP_FISH','Sopa de almeja turbia','Almeja de agua turbia'],['T5_MEAL_SOUP_FISH','Sopa de almeja negra','Almeja de pantano negro'],
  ['T2_MEAL_SALAD_FISH','Ensalada de calamar','Calamar de bajío'],['T4_MEAL_SALAD_FISH','Ensalada de pulpo','Pulpo de aguas medias'],['T6_MEAL_SALAD_FISH','Ensalada de kraken','Kraken de aguas profundas'],
  ['T3_MEAL_PIE_FISH','Pastel de ojo frío','Ojo frío de tierras altas'],['T5_MEAL_PIE_FISH','Pastel de ojo ciego','Ojo ciego de montaña'],['T7_MEAL_PIE_FISH','Pastel de ojo muerto','Ojo muerto de pico helado'],
  ['T3_MEAL_OMELETTE_FISH','Tortilla de cangrejo de río','Cangrejo de río bajo'],['T5_MEAL_OMELETTE_FISH','Tortilla de cangrejo seco','Cangrejo de arroyo seco'],['T7_MEAL_OMELETTE_FISH','Tortilla de cangrejo polvoriento','Cangrejo de madriguera polvorienta'],
  ['T4_MEAL_STEW_FISH','Estofado de anguila verde','Anguila de agua verdosa'],['T6_MEAL_STEW_FISH','Estofado de anguila roja','Anguila rojiza'],['T8_MEAL_STEW_FISH','Estofado de anguila podrida','Anguila de agua podrida'],
  ['T4_MEAL_SANDWICH_FISH','Sándwich de acechador pétreo','Acechador de arroyo pétreo'],['T6_MEAL_SANDWICH_FISH','Sándwich de aguas rápidas','Acechador de aguas rápidas'],['T8_MEAL_SANDWICH_FISH','Sándwich de catarata','Acechador de catarata'],
  ['T3_MEAL_ROAST_FISH','Pargo de niebla asado','Pargo de niebla blanca'],['T5_MEAL_ROAST_FISH','Pargo de neblina asado','Pargo de neblina clara'],['T7_MEAL_ROAST_FISH','Pargo de niebla pura asado','Pargo de niebla pura'],
  ['T3_MEAL_OMELETTE_DRAGONAREA','Tortilla Carefree Leyfin','Carefree Leyfin'],['T5_MEAL_OMELETTE_DRAGONAREA','Tortilla Brightsoul Leyfin','Brightsoul Leyfin'],['T7_MEAL_OMELETTE_DRAGONAREA','Tortilla Dragonbound Leyfin','Dragonbound Leyfin']
].map(([id,name,fish])=>({id,name,fish}));
const fishingMaps = [
  ['Bosque T8','forest','Darkbough Snag · Eldersleep · Rivercopse Fount','Anguila de agua podrida','Zona negra'],
  ['Pantano T8','swamp','Drownfield Sink · Meltwater Channel · Scuttlesink Marsh','Almeja de pantano negro','Zona negra'],
  ['Montaña T8','mountain','Glacierfall Pass · Whitepeak Tundra · Avalanche Incline','Ojo muerto de pico helado','Zona negra'],
  ['Tierras altas T8','highland','Highstone Loch · Redtree Enclave · Thunderrock Draw','Acechador de catarata','Zona negra'],
  ['Estepa T8','steppe','Parchsand Drought · Sandmount Ascent · Citadel of Ash','Cangrejo polvoriento','Zona negra'],
  ['Caminos de Avalon','avalon','Mapas de Caminos con agua visible','Pargo de niebla pura','Riesgo variable'],
  ['Tierras Ancestrales','ancient','Zonas con agua dentro de las Tierras Ancestrales','Dragonbound Leyfin','Zona naranja/negra'],
  ['Costa T7–T8','ocean','Costas de zonas T7–T8 con acceso al mar','Kraken / pez espada','Riesgo variable']
].map(([title,biome,maps,target,risk])=>({title,biome,maps,target,risk}));

async function setItemImage(img, itemId) {
  if (!img || !itemId) return;
  img.src = imagePlaceholder;
  try {
    const source = await window.albion.getItemImage(itemId);
    if (source) img.src = source;
  } catch {}
}

function hydrateImages(root = document) {
  root.querySelectorAll('img[data-item-id]').forEach(img => {
    if (img.dataset.loading) return;
    img.dataset.loading = 'true';
    setItemImage(img, img.dataset.itemId);
  });
}

function toast(message, error = false) {
  const el = $('toast'); el.textContent = message; el.className = `toast show${error ? ' error' : ''}`;
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.className = 'toast', 2800);
}
function saveState() {
  localStorage.setItem('albion-favorites', JSON.stringify(state.favorites));
  localStorage.setItem('albion-alerts', JSON.stringify(state.alerts));
  localStorage.setItem('albion-sessions', JSON.stringify(state.sessions));
  localStorage.setItem('albion-build', JSON.stringify(state.buildItems));
}
function ageInfo(dateString) {
  if (!dateString || dateString.startsWith('0001')) return { text: 'Sin fecha', cls: 'bad', hours: Infinity };
  const normalized = /z$/i.test(dateString) || /[+-]\d\d:\d\d$/.test(dateString) ? dateString : `${dateString}Z`;
  const hours = Math.max(0, (Date.now() - new Date(normalized).getTime()) / 3600000);
  if (hours < 1) return { text: `Hace ${Math.max(1, Math.round(hours * 60))} min`, cls: '', hours };
  if (hours < 24) return { text: `Hace ${Math.round(hours)} h`, cls: hours > state.staleHours ? 'warn' : '', hours };
  return { text: `Hace ${Math.round(hours / 24)} d`, cls: 'bad', hours };
}

function recentOnly(rows) {
  return rows.map(row => ({
    ...row,
    sell_price_min: !row.sell_historical && ageInfo(row.sell_price_min_date).hours <= state.staleHours ? row.sell_price_min : 0,
    buy_price_max: ageInfo(row.buy_price_max_date).hours <= state.staleHours ? row.buy_price_max : 0
  }));
}

function currentPricesByCity(prices = state.prices) {
  const current = prices.map(row => ({
    ...row,
    sell_price_min: ageInfo(row.sell_price_min_date).hours <= state.staleHours ? row.sell_price_min : 0,
    buy_price_max: ageInfo(row.buy_price_max_date).hours <= state.staleHours ? row.buy_price_max : 0
  }));
  return aggregatePricesByCity(current, state.cities);
}

function itemSuggestion(item, onSelect) {
  const div = document.createElement('div'); div.className = 'suggestion';
  div.innerHTML = `<img data-item-id="${item.id}" alt=""><div><strong>${item.name} <b class="suggestion-tier">${tierEnchant(item)}</b></strong><small>${item.id}</small></div>`;
  hydrateImages(div);
  div.onclick = () => onSelect(item); return div;
}
function bindSearch(inputId, suggestionsId, onSelect) {
  const input = $(inputId), box = $(suggestionsId);
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer); timer = setTimeout(async () => {
      let items = await window.albion.searchItems(input.value, inputId === 'market-search' ? 250 : 20);
      if (inputId === 'market-search') items = filterMarketItems(items).slice(0, 24);
      box.replaceChildren(...items.map(item => itemSuggestion(item, selected => { box.classList.remove('open'); input.value = selected.name; onSelect(selected); })));
      box.classList.toggle('open', items.length > 0);
    }, 170);
  });
  input.addEventListener('keydown', event => { if (event.key === 'Escape') box.classList.remove('open'); });
}

function filterMarketItems(items) {
  if (state.marketCategory === 'all') return items;
  return items.filter(item => marketItemCategory(item.id) === state.marketCategory);
}

async function searchMarketFirst() {
  const query=$('market-search').value.trim();
  if(!query)return toast('Escribe el nombre de un objeto.',true);
  const items=filterMarketItems(await window.albion.searchItems(query, 250));
  if(!items.length)return toast('No encontré objetos en esa categoría.',true);
  $('market-suggestions').classList.remove('open');
  $('market-search').value=items[0].name;
  await selectMarketItem(items[0]);
}

async function selectMarketItem(item) {
  state.selected = item;
  setItemImage($('item-image'), item.id); $('item-tier').textContent = item.tier ? `T${item.tier}` : '—';
  $('item-id').textContent = item.id; $('item-name').textContent = item.name; $('item-status').textContent = 'Consultando precios del servidor Américas…';
  const category = ({ weapons:'Arma', armor:'Armadura', tools:'Herramienta', resources:'Recurso', consumables:'Consumible', mounts:'Montura', other:'Objeto' })[marketItemCategory(item.id)];
  $('item-category').textContent=category; $('item-distance').textContent=category==='Arma'?'A distancia':'Mercado'; $('item-tier-chip').textContent=item.tier?`Tier ${item.tier}`:'Sin tier'; $('item-quality-chip').textContent=qualityName(Number($('market-quality').value.split(',')[0]))||'Todas';
  updateFavoriteButton();
  await refreshSelectedPrices();
}
async function refreshSelectedPrices(manual = false) {
  if (!state.selected) { if (manual) toast('Selecciona primero un objeto.', true); return; }
  const refreshButton = $('refresh-btn');
  const previousSnapshot = JSON.stringify(state.prices.map(row => [row.item_id,row.city,row.quality,row.sell_price_min,row.sell_price_min_date,row.buy_price_max,row.buy_price_max_date]));
  if (manual) { refreshButton.disabled = true; refreshButton.textContent = '…'; }
  $('last-refresh').textContent = 'Consultando…';
  try {
    const qualities = $('market-quality').value.split(',').map(Number);
    const [prices, history] = await Promise.all([
      window.albion.getPrices({ itemIds: [state.selected.id], locations: state.cities, qualities }),
      window.albion.getPriceHistory({ itemIds: [state.selected.id], locations: state.cities, qualities, days: 90 }).catch(() => [])
    ]);
    state.prices = prices; state.priceHistory = history;
    const rows = addHistoricalFallback(aggregatePricesByCity(state.prices, state.cities), state.priceHistory);
    const currentRows = currentPricesByCity();
    const markets = currentRows.filter(p => p.sell_price_min || p.buy_price_max).length;
    const stale = rows.filter((row, index) => (row.sell_price_min || row.buy_price_max) && !currentRows[index].sell_price_min && !currentRows[index].buy_price_max).length;
    renderPrices();
    const dates = prices.flatMap(row => [row.sell_price_min_date, row.buy_price_max_date]).filter(date => date && !date.startsWith('0001')).sort();
    const newestAge = dates.length ? ageInfo(dates.at(-1)).text.toLowerCase() : 'sin fecha';
    const sources = new Set(prices.flatMap(row => [row.sell_source, row.buy_source]).filter(Boolean).map(value => value === 'Albion Market Client' ? 'AlbionMarket' : value === 'Albion Data Project' ? 'AODP' : value));
    const sourceText = sources.size ? ` · ${[...sources].join(' + ')}` : '';
    const queryTime = new Date().toLocaleTimeString('es-CL', { hour:'2-digit', minute:'2-digit' });
    $('item-status').textContent = `Consulta completada · ${markets} mercado${markets===1?'':'s'} reciente${markets===1?'':'s'}${stale ? ` · ${stale} con dato antiguo` : ''} · dato más nuevo ${newestAge}${sourceText}`;
    $('last-refresh').textContent = `Consulta ${queryTime}`;
    $('last-refresh').title = dates.length ? `Dato más nuevo: ${ageInfo(dates.at(-1)).text}` : 'La API no devolvió precios con fecha';
    const changed = previousSnapshot !== JSON.stringify(prices.map(row => [row.item_id,row.city,row.quality,row.sell_price_min,row.sell_price_min_date,row.buy_price_max,row.buy_price_max_date]));
    if (manual) toast(changed ? 'La API entregó precios nuevos.' : `Consulta realizada. La API todavía no tiene datos más nuevos; el más reciente es ${newestAge}.`);
  } catch (error) {
    $('last-refresh').textContent = 'Error de consulta';
    toast(`No fue posible consultar el mercado: ${error.message}`, true);
  } finally {
    if (manual) { refreshButton.disabled = false; refreshButton.textContent = '↻'; }
  }
}
function renderPrices() {
  const rows = addHistoricalFallback(aggregatePricesByCity(state.prices, state.cities), state.priceHistory);
  const recentRows = currentPricesByCity();
  const currentByCity = new Map(recentRows.map(row => [row.city, row]));
  const coreCities=new Set(['Bridgewatch','Caerleon','Fort Sterling','Lymhurst','Martlock','Thetford','Brecilien']);
  const extraCount=rows.filter(row=>!coreCities.has(row.city)).length;
  const visibleRows=state.showAllMarkets?rows:rows.filter(row=>coreCities.has(row.city));
  $('more-markets').classList.toggle('hidden',extraCount===0);
  $('more-markets').textContent=state.showAllMarkets?'Ocultar mercados adicionales':`Mostrar ${extraCount} mercados adicionales`;
  $('price-rows').innerHTML = visibleRows.map(p => {
    const current = currentByCity.get(p.city) || {};
    const sellAge = ageInfo(p.sell_price_min_date);
    const buyAge = ageInfo(p.buy_price_max_date);
    const sellRecent = current.sell_price_min > 0;
    const buyRecent = current.buy_price_max > 0;
    const availableDates = [p.sell_price_min ? p.sell_price_min_date : null, p.buy_price_max ? p.buy_price_max_date : null].filter(Boolean).sort();
    const age = availableDates.length ? ageInfo(availableDates.at(-1)) : { text:'Sin datos', cls:'bad' };
    const sourceLabel = value => value === 'Albion Market Client' ? 'AlbionMarket' : value === 'Albion Data Project' || value === 'aodp' ? 'AODP' : value === 'albionmarket' ? 'AlbionMarket' : value;
    const sellSource = sourceLabel(sellRecent ? current.sell_source : p.sell_source);
    const buySource = sourceLabel(buyRecent ? current.buy_source : p.buy_source);
    const sellNote = sellRecent ? [qualityName(current.sell_quality), sellSource].filter(Boolean).join(' · ') : p.sell_price_min > 0 ? `Último dato: ${sellAge.text}${sellSource ? ` · ${sellSource}` : ''}` : '';
    const buyNote = buyRecent ? [qualityName(current.buy_quality), buySource].filter(Boolean).join(' · ') : p.buy_price_max > 0 ? `Último dato: ${buyAge.text}${buySource ? ` · ${buySource}` : ''}` : '';
    const sellValue = sellRecent ? current.sell_price_min : p.sell_price_min;
    const buyValue = buyRecent ? current.buy_price_max : p.buy_price_max;
    const stats=marketHistoryStats(p.city), trend=stats.change;
    const slug=p.city.toLowerCase().replace(/[^a-z]+/g,'-');
    return `<tr><td><div class="city"><i class="city-icon ${slug}">${cityName(p.city).slice(0,1)}</i>${cityName(p.city)}</div></td><td class="price ${sellRecent || !sellValue ? '' : 'historical'}">${silver(sellValue)}${sellNote ? `<small>${sellNote}</small>` : ''}</td><td>${Number.isFinite(trend)?`<span class="trend ${trend>=0?'up':'down'}">${trend>=0?'↑':'↓'} ${Math.abs(trend).toFixed(0)}%</span>`:'—'}</td><td class="price ${buyRecent || !buyValue ? '' : 'historical'}">${silver(buyValue)}${buyNote ? `<small>${buyNote}</small>` : ''}</td><td class="volume">${stats.volume||0}</td><td><span class="age ${age.cls}">${age.text}</span></td><td><button class="table-action">›</button></td></tr>`;
  }).join('');
  const sells = recentRows.filter(p => p.sell_price_min > 0).sort((a,b) => a.sell_price_min-b.sell_price_min);
  const buys = recentRows.filter(p => p.buy_price_max > 0).sort((a,b) => b.buy_price_max-a.buy_price_max);
  $('best-buy').textContent = sells[0] ? silver(sells[0].sell_price_min) : '—'; $('best-buy-city').textContent = sells[0] ? cityName(sells[0].city) : 'Sin datos';
  $('best-sell').textContent = buys[0] ? silver(buys[0].buy_price_max) : '—'; $('best-sell-city').textContent = buys[0] ? cityName(buys[0].city) : 'Sin datos';
  const route = bestTrade(recentRows, Number($('sales-tax').value) + Number($('setup-fee').value));
  $('best-route').textContent = route && route.profit > 0 ? `+${silver(route.profit)}` : 'Sin ganancia';
  $('best-route-detail').textContent = route ? `${cityName(route.buyCity)} → ${cityName(route.sellCity)} · ${route.margin.toFixed(1)}%` : `Sin datos de menos de ${state.staleHours} h`;
  renderPriceChart();
}
function marketHistoryStats(city) {
  const points=state.priceHistory.filter(entry=>entry.location===city).flatMap(entry=>Array.isArray(entry.data)?entry.data:[]).filter(point=>point.avg_price>0).sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp));
  const last=points.at(-1), previous=points.at(-2);
  return {volume:last?.item_count||0,totalVolume:points.reduce((sum,p)=>sum+(Number(p.item_count)||0),0),change:last&&previous&&previous.avg_price?((last.avg_price-previous.avg_price)/previous.avg_price*100):NaN};
}
function renderPriceChart() {
  const line=$('chart-line'), area=$('chart-area'), caption=$('chart-caption'), empty=$('chart-empty'); if(!line||!area)return;
  const daily=new Map();
  state.priceHistory.flatMap(entry=>Array.isArray(entry.data)?entry.data:[]).filter(point=>point.avg_price>0&&point.timestamp).forEach(point=>{const day=String(point.timestamp).slice(0,10);if(!daily.has(day))daily.set(day,[]);daily.get(day).push(Number(point.avg_price));});
  const points=[...daily].sort((a,b)=>a[0].localeCompare(b[0])).slice(-state.chartDays).map(([day,values])=>({day,value:values.reduce((a,b)=>a+b,0)/values.length}));
  const totalVolume=state.priceHistory.flatMap(entry=>Array.isArray(entry.data)?entry.data:[]).filter(point=>point.timestamp&&String(point.timestamp).slice(0,10)>=(points[0]?.day||'')).reduce((sum,p)=>sum+(Number(p.item_count)||0),0);
  if(points.length<2){line.setAttribute('d','');area.setAttribute('d','');caption.textContent='Sin historial suficiente';empty?.classList.remove('hidden');$('chart-min').textContent=$('chart-avg').textContent=$('chart-max').textContent='—';$('chart-volume').textContent='—';return;}
  empty?.classList.add('hidden');
  const min=Math.min(...points.map(p=>p.value)),max=Math.max(...points.map(p=>p.value)),range=Math.max(1,max-min);
  const avg=points.reduce((sum,p)=>sum+p.value,0)/points.length;
  const coords=points.map((p,i)=>[i/(points.length-1)*900,230-(p.value-min)/range*195]);
  const path=coords.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  line.setAttribute('d',path);area.setAttribute('d',`${path} L900 260 L0 260 Z`);caption.textContent=`Resumen del mercado · últimos ${state.chartDays} días`;$('chart-min').textContent=silver(min);$('chart-avg').textContent=silver(avg);$('chart-max').textContent=silver(max);$('chart-volume').textContent=totalVolume.toLocaleString('es-CL');
}
function updateFavoriteButton() {
  const favorite = state.selected && state.favorites.some(f => f.id === state.selected.id);
  $('favorite-btn').textContent = favorite ? '★ En favoritos' : '☆ Añadir a favoritos';
}
function toggleFavorite() {
  if (!state.selected) return;
  const index = state.favorites.findIndex(f => f.id === state.selected.id);
  if (index >= 0) state.favorites.splice(index, 1); else state.favorites.push(state.selected);
  saveState(); updateFavoriteButton(); renderFavorites(); toast(index >= 0 ? 'Eliminado de favoritos' : 'Añadido a favoritos');
}

async function selectCraftItem(item) {
  $('craft-enchantment').value = String(enchantmentOf(item.id));
  $('craft-search').value = `${item.name} · ${tierEnchant(item)}`; $('recipe-state').textContent = 'Descargando y preparando los datos de recetas…'; $('recipe-state').style.display = 'block';
  $('recipe-variant-wrap').classList.add('hidden');
  try {
    state.recipe = await window.albion.getRecipe(item.id);
    if (!state.recipe) { $('recipe-state').textContent = 'Este objeto no tiene una receta de fabricación disponible.'; $('materials-list').innerHTML = ''; return; }
    state.recipe.item = item;
    const variants = state.recipe.variants?.length ? state.recipe.variants : [state.recipe];
    const ids = [...new Set(variants.flatMap(variant => variant.resources.map(resource => resource.id)))];
    const catalogMatches = await Promise.all(ids.map(async id => {
      const exactMatches = await window.albion.searchItems(id);
      const exact = exactMatches.find(item => item.id === id);
      if (exact) return exact;
      const baseId = String(id).split('@')[0].replace(/_LEVEL[1-4]$/, '');
      const baseMatches = await window.albion.searchItems(baseId);
      const base = baseMatches.find(item => item.id === baseId);
      return base ? { ...base, id } : { id, name:id };
    }));
    const itemNames = new Map(ids.map((id, index) => [id, catalogMatches[index]]));
    state.recipe.variants = variants.map(variant => ({ ...variant, resources: variant.resources.map(resource => ({ ...resource, item:itemNames.get(resource.id) })) }));
    $('recipe-variant').innerHTML = state.recipe.variants.map((variant, index) => {
      const special = variant.resources.find(resource => resource.maxReturn === 0) || variant.resources.at(-1);
      const level = state.recipe.enchantment || 0;
      return `<option value="${index}">Receta ${index + 1} · ${special.item.name} · materiales .${level}</option>`;
    }).join('');
    $('recipe-variant-wrap').classList.toggle('hidden', state.recipe.variants.length < 2);
    $('recipe-state').style.display = 'none';
    renderRecipeVariant(0);
  } catch (error) { $('recipe-state').textContent = 'No se pudo cargar la base de recetas. Comprueba tu conexión e inténtalo nuevamente.'; toast(error.message, true); }
}

function renderRecipeVariant(index) {
  if (!state.recipe?.variants?.length) return;
  const variant = state.recipe.variants[Number(index)] || state.recipe.variants[0];
  state.recipe.activeVariant = variant;
  $('base-focus').value = variant.craftingFocus || 0;
  renderCraftMaterialTotals();
}

function renderCraftMaterialTotals() {
  const variant = state.recipe?.activeVariant;
  if (!variant) return;
  const quantity = Math.max(1, Math.floor(Number($('craft-qty').value) || 1));
  const outputPerCraft = Math.max(1, Number(variant.amountCrafted) || 1);
  const crafts = Math.ceil(quantity / outputPerCraft);
  const returnRate = Math.max(0, Math.min(95, Number($('return-rate').value) || 0)) / 100;
  const produced = crafts * outputPerCraft;
  const outputLabel = state.recipe?.item ? tierEnchant(state.recipe.item) : `.${state.recipe?.enchantment || 0}`;
  const summary = `<div class="materials-summary"><strong>Materiales ${outputLabel} para ${quantity.toLocaleString('es-CL')} objeto${quantity === 1 ? '' : 's'}</strong><span>${crafts.toLocaleString('es-CL')} fabricación${crafts === 1 ? '' : 'es'}${produced !== quantity ? ` · produce ${produced.toLocaleString('es-CL')}` : ''}</span></div>`;
  const rows = variant.resources.map(resource => {
    const perCraft = Math.max(0, Number(resource.count) || 0);
    const total = perCraft * crafts;
    const returnable = resource.maxReturn !== 0;
    const net = returnable ? total * (1 - returnRate) : total;
    const netText = Number.isInteger(net) ? net.toLocaleString('es-CL') : net.toLocaleString('es-CL', { maximumFractionDigits:1 });
    const returnText = returnable ? `${returnRate > 0 ? '≈ ' : ''}${netText} de consumo neto` : 'Material no retornable';
    const materialLevel = enchantmentOf(resource.id);
    return `<div class="material"><img data-item-id="${resource.id}"><div class="material-name"><strong>${resource.item.name}${returnable ? ` <b class="material-enchant">.${materialLevel}</b>` : ''}</strong><small>${resource.id}</small><em>${perCraft.toLocaleString('es-CL')} por fabricación</em></div><div class="material-total"><strong>× ${total.toLocaleString('es-CL')}</strong><small>TOTAL NECESARIO</small><em>${returnText}</em></div></div>`;
  }).join('');
  $('materials-list').innerHTML = summary + rows;
  hydrateImages($('materials-list'));
}

async function calculateCraft() {
  if (!state.recipe) return toast('Primero selecciona un objeto con receta.', true);
  const recipe = state.recipe.activeVariant || state.recipe;
  const qty = Number($('craft-qty').value) || 1, crafts = Math.ceil(qty / recipe.amountCrafted);
  try {
    const materialIds = recipe.resources.map(r => r.id);
    const allIds = [...materialIds, state.recipe.itemId];
    const locations = [...new Set([$('material-city').value, $('sale-city').value])];
    const [prices, history] = await Promise.all([
      window.albion.getPrices({ itemIds: allIds, locations, qualities: [1] }),
      window.albion.getPriceHistory({ itemIds: allIds, locations, qualities: [1], days: 90 }).catch(() => [])
    ]);
    const materialCity = $('material-city').value, saleCity = $('sale-city').value;
    let perCraft = 0, nonReturnablePerCraft = 0;
    const unavailable = [];
    const estimated = [];
    for (const resource of recipe.resources) {
      const reference = marketSellReference(prices, history, resource.id, materialCity);
      if (!reference) unavailable.push(resource.item?.name || resource.id);
      else {
        if (resource.maxReturn === 0) nonReturnablePerCraft += reference.price * resource.count;
        else perCraft += reference.price * resource.count;
        if (reference.historical || ageInfo(reference.date).hours > state.staleHours) estimated.push(resource.item?.name || resource.id);
      }
    }
    const saleReference = marketSellReference(prices, history, state.recipe.itemId, saleCity);
    const sale = saleReference?.price || 0;
    if (!saleReference) unavailable.push(`${state.recipe.item.name} (${cityName(saleCity)})`);
    else if (saleReference.historical || ageInfo(saleReference.date).hours > state.staleHours) estimated.push(`${state.recipe.item.name} (${cityName(saleCity)})`);
    if (unavailable.length) {
      return toast(`No existe precio actual ni histórico: ${unavailable.slice(0, 3).join(', ')}${unavailable.length > 3 ? '…' : ''}`, true);
    }
    const stationPerCraft = (recipe.nutrition || 0) * Number($('station-fee').value) / 100;
    const result = craftingProfit({ quantity: qty, outputPerCraft: recipe.amountCrafted, materialCost: perCraft, nonReturnableMaterialCost: nonReturnablePerCraft, returnRate: $('return-rate').value, saleUnitPrice: sale, salesTax: $('sales-tax').value, setupFee: $('setup-fee').value, stationCost: stationPerCraft, extraCost: $('extra-cost').value });
    const focus = $('use-focus').checked ? effectiveFocusCost($('base-focus').value, $('mastery').value, $('specialization').value) * crafts : 0;
    $('result-materials').textContent = silver(result.netMaterials); $('result-revenue').textContent = silver(result.netRevenue);
    $('result-profit').textContent = `${result.profit >= 0 ? '+' : ''}${silver(result.profit)}`; $('result-margin').textContent = `${result.margin.toFixed(1)}% margen · ${silver(result.unitProfit)} por unidad${estimated.length ? ` · estimado con ${estimated.length} referencia${estimated.length === 1 ? '' : 's'}` : ''}`;
    $('result-focus').textContent = focus ? Math.ceil(focus).toLocaleString('es-CL') : 'Sin foco';
    toast(estimated.length ? `Cálculo estimado: ${estimated.length} precio${estimated.length === 1 ? '' : 's'} antiguo${estimated.length === 1 ? '' : 's'} o histórico${estimated.length === 1 ? '' : 's'}.` : 'Cálculo actualizado con precios recientes.');
  } catch (error) { toast(`No se pudo calcular: ${error.message}`, true); }
}

async function scanRoutes() {
  if (!state.favorites.length) return toast('Añade al menos un favorito.', true);
  $('route-list').innerHTML = '<div class="empty-card">Consultando mercados…</div>';
  try {
    const prices = await window.albion.getPrices({ itemIds: state.favorites.map(f => f.id), locations: state.cities, qualities: [1] });
    const routes = state.favorites.map(item => ({ item, route: bestTrade(recentOnly(aggregatePricesByCity(prices.filter(p => p.item_id === item.id), state.cities)), Number($('sales-tax').value) + Number($('setup-fee').value)) })).filter(x => x.route).sort((a,b) => b.route.profit-a.route.profit);
    $('route-list').innerHTML = routes.length ? routes.map(({item, route}) => `<div class="route-card"><img data-item-id="${item.id}"><div><strong>${item.name}</strong><small>${item.id}</small></div><div><strong>${cityName(route.buyCity)} → ${cityName(route.sellCity)}</strong><small>${silver(route.buyPrice)} → ${silver(route.sellPrice)}</small></div><div><span class="route-profit">${route.profit >= 0 ? '+' : ''}${silver(route.profit)}</span><small>${route.margin.toFixed(1)}% después de tasas</small></div><span class="age ${Math.max(ageInfo(route.buyUpdated).hours,ageInfo(route.sellUpdated).hours)>state.staleHours?'warn':''}">${ageInfo(route.sellUpdated).text}</span></div>`).join('') : '<div class="empty-card">No se encontraron rutas con datos suficientes.</div>';
    hydrateImages($('route-list'));
  } catch (error) { toast(error.message, true); }
}

function renderOpportunities() {
  const sortBy = $('opportunity-sort').value;
  const rows = [...state.opportunityRows].sort((a, b) => sortBy === 'margin' ? b.route.margin - a.route.margin : b.route.profit - a.route.profit).slice(0, 50);
  $('opportunity-list').innerHTML = rows.length ? rows.map(({ item, route }, index) => {
    const dataAge = Math.max(ageInfo(route.buyUpdated).hours, ageInfo(route.sellUpdated).hours);
    return `<button class="opportunity-card" data-item-id="${item.id}"><span class="opportunity-rank">${index + 1}</span><div class="opportunity-item"><img data-item-id="${item.id}"><div><strong>${item.name}</strong><small>${item.id}</small></div></div><div><strong>${cityName(route.buyCity)}</strong><small>${silver(route.buyPrice)}</small></div><div><strong>${cityName(route.sellCity)}</strong><small>${silver(route.sellPrice)}</small></div><div><strong class="route-profit">+${silver(route.profit)}</strong><small>${route.margin.toFixed(1)}% de margen</small></div><span class="age ${dataAge > state.staleHours ? 'warn' : ''}">${ageInfo(route.sellUpdated).text}</span></button>`;
  }).join('') : '<div class="empty-card">No se encontraron oportunidades rentables con datos recientes.</div>';
  hydrateImages($('opportunity-list'));
  $('opportunity-list').querySelectorAll('.opportunity-card').forEach(card => card.onclick = async () => {
    const row = state.opportunityRows.find(entry => entry.item.id === card.dataset.itemId);
    if (!row) return;
    document.querySelector('.nav[data-view="market"]').click();
    $('market-search').value = row.item.name;
    await selectMarketItem(row.item);
  });
}

async function scanOpportunities() {
  const button = $('scan-opportunities');
  button.disabled = true; button.textContent = 'Analizando…';
  $('opportunity-status').textContent = 'Consultando precios de las ciudades. Esto puede tardar entre 30 y 90 segundos…';
  $('opportunity-list').innerHTML = '<div class="empty-card">Analizando órdenes actuales…</div>';
  try {
    const tiers = $('opportunity-tier').value.split(',').map(Number);
    const result = await window.albion.scanOpportunities({ tiers, category:$('opportunity-category').value, locations:state.cities, qualities:[1], maxItems:1200 });
    const grouped = new Map();
    for (const price of result.prices) {
      if (!grouped.has(price.item_id)) grouped.set(price.item_id, []);
      grouped.get(price.item_id).push(price);
    }
    const fees = Number($('sales-tax').value) + Number($('setup-fee').value);
    state.opportunityRows = result.items.map(item => ({
      item,
      route:bestTrade(recentOnly(aggregatePricesByCity(grouped.get(item.id) || [], state.cities)), fees)
    })).filter(entry => entry.route?.profit > 0 && entry.route.margin > 0);
    $('opportunity-status').textContent = `${state.opportunityRows.length} oportunidades rentables entre ${result.scannedCount.toLocaleString('es-CL')} objetos analizados${result.failedBatches ? ` · ${result.failedBatches} consultas sin respuesta` : ''}`;
    renderOpportunities();
  } catch (error) {
    state.opportunityRows = [];
    $('opportunity-status').textContent = 'No fue posible completar el análisis.';
    $('opportunity-list').innerHTML = '<div class="empty-card">Comprueba tu conexión y vuelve a intentarlo.</div>';
    toast(error.message, true);
  } finally {
    button.disabled = false; button.textContent = 'Analizar mercado';
  }
}

function blackMarketConfidence(buyAge, sellAge, margin) {
  const oldest = Math.max(buyAge, sellAge);
  if (oldest <= 2 && margin >= 12) return { label:'Fresca', cls:'fresh', note:'Buena señal' };
  if (oldest <= 24 && margin >= 5) return { label:'Probable', cls:'probable', note:`Aguanta −${Math.max(1, Math.round(margin / 4))}%` };
  return { label:'Riesgosa', cls:'risky', note:'Revisar en el juego' };
}

function filteredBlackMarketRows() {
  const query = foldText($('blackmarket-search').value);
  const sort = $('blackmarket-sort').value;
  const rows = state.blackMarketRows.filter(row => !query || foldText(row.item.name).includes(query) || foldText(row.item.id).includes(query));
  return rows.sort((a,b) => sort === 'margin' ? b.margin-a.margin : sort === 'freshness' ? a.oldestHours-b.oldestHours : b.profit-a.profit);
}

function renderBlackMarketDetail(row) {
  const root = $('blackmarket-detail');
  if (!row) { root.innerHTML='<div class="empty-card">Selecciona una oportunidad para comparar todas sus calidades.</div>'; return; }
  state.blackMarketSelected = row.item.id;
  const qualities = row.qualities.map(option => {
    const confidence = blackMarketConfidence(option.buyAge, option.sellAge, option.margin);
    return `<article class="blackmarket-quality-card"><div class="bm-quality-top"><span class="bm-quality">${qualityName(option.quality)}</span><strong>+${silver(option.profit)}</strong></div><p><i class="bm-dot ${confidence.cls}"></i>${confidence.label} · ${confidence.note}</p><div class="bm-price-pair"><div><small>🛒 COMPRAS EN</small><b>Caerleon</b><strong>${silver(option.buyPrice)}</strong><span>${ageInfo(option.buyUpdated).text}</span></div><b>→</b><div><small>♟ VENDES AL</small><b>Black Market</b><strong>${silver(option.sellPrice)}</strong><span>${ageInfo(option.sellUpdated).text}</span></div></div><div class="bm-formula">${silver(option.sellPrice)} − ${silver(option.tax)} impuesto − ${silver(option.buyPrice)} = <strong>+${silver(option.profit)}</strong></div><small>Sin transporte: compras y vendes en Caerleon · margen ${option.margin.toFixed(1)}%</small></article>`;
  }).join('');
  root.innerHTML=`<div class="blackmarket-detail-title"><img data-item-id="${row.item.id}"><div><small>BLACK MARKET</small><h3>${row.item.name}</h3><p>${row.item.id} · ${tierEnchant(row.item)}</p></div></div><div class="blackmarket-quality-list">${qualities}</div>`;
  hydrateImages(root);
}

function renderBlackMarket() {
  const rows = filteredBlackMarketRows();
  const root = $('blackmarket-list');
  root.innerHTML = rows.length ? rows.slice(0,100).map((row,index) => `<button class="blackmarket-row ${state.blackMarketSelected===row.item.id?'selected':''}" data-id="${row.item.id}"><span class="bm-rank">${index+1}</span><div class="bm-item"><img data-item-id="${row.item.id}"><div><strong>${row.item.name}</strong><small>${tierEnchant(row.item)} · pide ${qualityName(row.quality)}</small></div></div><div><strong>${silver(row.buyPrice)}</strong><small>Caerleon · ${qualityName(row.quality)}</small></div><div><strong>${silver(row.sellPrice)}</strong><small>${ageInfo(row.sellUpdated).text}</small></div><div><strong class="bm-profit">+${silver(row.profit)}</strong><small>${row.margin.toFixed(1)}% neto</small></div><span class="bm-confidence ${row.confidence.cls}"><i></i>${row.confidence.label}</span></button>`).join('') : '<div class="empty-card">No se encontraron oportunidades que cumplan estos filtros.</div>';
  hydrateImages(root);
  root.querySelectorAll('.blackmarket-row').forEach(card => card.onclick=()=>{const row=state.blackMarketRows.find(entry=>entry.item.id===card.dataset.id);renderBlackMarketDetail(row);renderBlackMarket();});
}

async function scanBlackMarket() {
  const button=$('scan-blackmarket'); button.disabled=true; button.textContent='Analizando…';
  $('blackmarket-status').textContent='Consultando equipamiento, calidades y órdenes del Black Market…';
  $('blackmarket-list').innerHTML='<div class="empty-card">Comparando Caerleon con Black Market. Puede tardar entre 30 y 90 segundos…</div>';
  try {
    const tiers=$('blackmarket-tier').value.split(',').map(Number);
    const enchants=new Set($('blackmarket-enchant').value.split(',').map(Number));
    const maxAge=Math.max(1,Number($('blackmarket-age').value)||24);
    const taxRate=Math.max(0,Number($('blackmarket-tax').value)||0)/100;
    const capital=Math.max(0,Number($('blackmarket-capital').value)||0);
    const minProfit=Math.max(0,Number($('blackmarket-min-profit').value)||0);
    const result=await window.albion.scanOpportunities({tiers,category:'equipment',locations:['Caerleon','Black Market'],qualities:[1,2,3,4,5],maxItems:1600,includeEnchantments:true});
    const grouped=new Map(); result.prices.forEach(price=>{if(!grouped.has(price.item_id))grouped.set(price.item_id,[]);grouped.get(price.item_id).push(price);});
    state.blackMarketRows=result.items.filter(item=>enchants.has(enchantmentOf(item.id))).map(item=>{
      const prices=grouped.get(item.id)||[];
      const qualities=[1,2,3,4,5].map(quality=>{
        const buy=prices.filter(p=>p.city==='Caerleon'&&Number(p.quality)===quality&&p.sell_price_min>0).sort((a,b)=>a.sell_price_min-b.sell_price_min)[0];
        const sell=prices.filter(p=>p.city==='Black Market'&&Number(p.quality)===quality&&p.buy_price_max>0).sort((a,b)=>b.buy_price_max-a.buy_price_max)[0];
        if(!buy||!sell)return null;
        const buyAge=ageInfo(buy.sell_price_min_date).hours,sellAge=ageInfo(sell.buy_price_max_date).hours;
        const tax=sell.buy_price_max*taxRate,profit=sell.buy_price_max-tax-buy.sell_price_min,margin=buy.sell_price_min?profit/buy.sell_price_min*100:0;
        return {quality,buyPrice:buy.sell_price_min,sellPrice:sell.buy_price_max,buyUpdated:buy.sell_price_min_date,sellUpdated:sell.buy_price_max_date,buyAge,sellAge,tax,profit,margin};
      }).filter(option=>option&&Math.max(option.buyAge,option.sellAge)<=maxAge&&option.profit>=minProfit&&(capital===0||option.buyPrice<=capital));
      if(!qualities.length)return null;
      qualities.sort((a,b)=>b.profit-a.profit); const best=qualities[0],oldestHours=Math.max(best.buyAge,best.sellAge);
      return {item,qualities,quality:best.quality,buyPrice:best.buyPrice,sellPrice:best.sellPrice,buyUpdated:best.buyUpdated,sellUpdated:best.sellUpdated,profit:best.profit,margin:best.margin,oldestHours,confidence:blackMarketConfidence(best.buyAge,best.sellAge,best.margin)};
    }).filter(Boolean);
    state.blackMarketSelected=state.blackMarketRows[0]?.item.id||null;
    $('blackmarket-status').textContent=`${state.blackMarketRows.length} objetos rentables entre ${result.scannedCount.toLocaleString('es-CL')} analizados${result.failedBatches?` · ${result.failedBatches} consultas sin respuesta`:''}`;
    renderBlackMarket(); renderBlackMarketDetail(state.blackMarketRows[0]);
  } catch(error) {
    state.blackMarketRows=[]; state.blackMarketSelected=null;
    $('blackmarket-status').textContent='No fue posible completar el análisis.';
    $('blackmarket-list').innerHTML='<div class="empty-card">Comprueba tu conexión y vuelve a intentarlo.</div>'; toast(error.message,true);
  } finally {button.disabled=false;button.textContent='Buscar oportunidades';}
}

function renderDemand() {
  const days = Math.max(1, Number($('demand-days').value) || 30);
  $('demand-list').innerHTML = state.demandRows.length ? state.demandRows.map((row, index) => {
    const daily = Number(row.unitsPerDay) || row.volume / days;
    const rotation = daily >= 20 ? { label:'Muy alta', cls:'very-high' } : daily >= 5 ? { label:'Alta', cls:'high' } : daily >= 1 ? { label:'Media', cls:'medium' } : { label:'Baja', cls:'low' };
    const age = row.updated ? ageInfo(row.updated) : { text:'Sin fecha', cls:'bad' };
    return `<button class="demand-row" data-id="${row.item.id}"><span class="demand-rank">${index + 1}</span><div class="demand-item"><img data-item-id="${row.item.id}"><div><strong>${row.item.name}</strong><small>${row.item.id} · T${row.item.tier}</small></div></div><div><strong>${row.volume.toLocaleString('es-CL')}</strong><small>${daily.toLocaleString('es-CL', { maximumFractionDigits:1 })} por día</small></div><div><strong>${cityName(row.city)}</strong><small>${row.cityVolume.toLocaleString('es-CL')} unidades</small></div><div><strong>${silver(row.averagePrice)}</strong><small>promedio del período</small></div><span class="demand-badge ${rotation.cls}">${rotation.label}</span><span class="age ${age.cls}">${age.text}</span></button>`;
  }).join('') : '<div class="empty-card">No se encontraron ventas para esta categoría y período.</div>';
  hydrateImages($('demand-list'));
  $('demand-list').querySelectorAll('.demand-row').forEach(card => card.onclick = async () => {
    const row = state.demandRows.find(entry => entry.item.id === card.dataset.id);
    if (!row) return;
    document.querySelector('.nav[data-view="craft"]').click();
    $('craft-search').value = row.item.name;
    await selectCraftItem(row.item);
  });
}

async function scanDemand() {
  const button = $('scan-demand');
  button.disabled = true; button.textContent = 'Analizando…';
  $('demand-status').textContent = 'Consultando ventas históricas por ciudad. Puede tardar entre 30 y 90 segundos…';
  $('demand-list').innerHTML = '<div class="empty-card">Comparando objetos fabricables y unidades compradas…</div>';
  try {
    const tiers = $('demand-tier').value.split(',').map(Number);
    const category = $('demand-category').value;
    const days = Number($('demand-days').value) || 30;
    const result = await window.albion.scanDemand({ tiers, category, locations:state.cities, days, maxItems:1400 });
    state.demandRows = result.rows || [];
    const label = $('demand-category').selectedOptions[0].textContent;
    $('demand-status').textContent = `${state.demandRows.length} resultados de ${result.scannedCount.toLocaleString('es-CL')} objetos fabricables de ${label.toLowerCase()}${result.failedBatches ? ` · ${result.failedBatches} consultas sin respuesta` : ''}`;
    renderDemand();
  } catch (error) {
    state.demandRows = [];
    $('demand-status').textContent = 'No fue posible completar el análisis de demanda.';
    $('demand-list').innerHTML = '<div class="empty-card">Comprueba tu conexión y vuelve a intentarlo.</div>';
    toast(error.message, true);
  } finally { button.disabled = false; button.textContent = 'Analizar demanda'; }
}

async function renderTravelPlan() {
  const origin = $('travel-origin').value, destination = $('travel-destination').value;
  const mode = $('travel-mode').value;
  if (state.worldMapInstance) { state.worldMapInstance.remove(); state.worldMapInstance = null; }
  $('travel-result').innerHTML = '<div class="empty-card">Calculando la secuencia exacta de mapas…</div>';
  try {
    const result = await window.albion.planTravel({ origin, destination, mode });
    if (!result.available) {
      const fallback = planCityRoute(origin, destination, mode);
      $('travel-result').innerHTML = `<div class="travel-overview"><div><span class="travel-label">SIN RUTA TERRESTRE FIJA</span><div class="travel-nodes"><span>${cityName(origin)}</span><b>⇢</b><span>${cityName(destination)}</span></div><p>${result.reason}</p></div><span class="risk-pill warning">Dinámica</span></div><div class="travel-steps">${fallback.steps.map((step, index) => `<article><span>${index + 1}</span><p>${step}</p></article>`).join('')}</div><div class="travel-dynamic">Comprueba dentro del juego qué conexión de Mists o Roads está disponible en ese momento.</div>`;
      return;
    }
    const labels = { blue:'Azul', yellow:'Amarilla', red:'Roja', black:'Negra', other:'Especial' };
    const danger = result.maps.some(map => map.pvpCategory === 'black') ? ['Zona negra','danger'] : result.maps.some(map => map.pvpCategory === 'red') ? ['Zona roja','danger'] : result.maps.some(map => map.pvpCategory === 'yellow') ? ['Azul/amarilla','safe'] : ['Zona azul','safe'];
    const routeMaps = result.maps.map((map, index) => `<article class="map-route-step"><span class="map-route-number">${index + 1}</span><div><strong>${map.name}</strong><small>${map.tier ? `T${map.tier} · ` : ''}${map.mapCategory === 'city' ? 'Ciudad' : 'Mapa abierto'}</small></div><span class="zone-badge ${map.pvpCategory}">${labels[map.pvpCategory] || 'Especial'}</span>${index < result.maps.length - 1 ? '<b>↓</b>' : ''}</article>`).join('');
    $('travel-result').innerHTML = `<div class="travel-overview"><div><span class="travel-label">RUTA MAPA POR MAPA</span><div class="travel-nodes"><span>${cityName(origin)}</span><b>→</b><span>${cityName(destination)}</span></div><p>${result.maps.length} mapas en total · ${mode === 'safe' ? 'prioriza zonas de menor peligro' : 'prioriza la menor cantidad de mapas'}</p></div><span class="risk-pill ${danger[1]}">${danger[0]}</span></div>${renderWorldMap(result.world)}<div class="map-route-list">${routeMaps}</div>`;
    initializeAdvancedWorldMap(result.world, result.maps);
  } catch (error) {
    $('travel-result').innerHTML = '<div class="empty-card">No se pudo descargar el mapa de conexiones. Comprueba tu conexión y vuelve a intentarlo.</div>';
    toast(error.message, true);
  }
}

function renderWorldMap(world) {
  if (!world?.nodes?.length) return '<div class="empty-card">El mapa no contiene coordenadas disponibles.</div>';
  if (window.IS_PWA) {
    const byId = new Map(world.nodes.map(node => [node.id,node]));
    const routeIds = world.routeIds || [];
    const routePairs = new Set(routeIds.slice(1).flatMap((id,index) => [`${routeIds[index]}|${id}`,`${id}|${routeIds[index]}`]));
    const edges = (world.edges || []).map(edge => {
      const from=byId.get(edge.from),to=byId.get(edge.to); if(!from||!to)return '';
      return `<line class="${routePairs.has(`${edge.from}|${edge.to}`)?'active':''}" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"/>`;
    }).join('');
    const nodes = world.nodes.map(node => `<g class="route-node ${routeIds.includes(node.id)?'active':''} ${node.pvpCategory||'other'}" transform="translate(${node.x} ${node.y})"><circle r="${routeIds.includes(node.id)?22:14}"/><text y="-${routeIds.includes(node.id)?31:23}" text-anchor="middle">${node.name}</text>${routeIds.includes(node.id)?`<text class="route-order" y="5" text-anchor="middle">${routeIds.indexOf(node.id)+1}</text>`:''}</g>`).join('');
    return `<section class="world-map-card schematic-map"><div class="world-map-toolbar"><div><strong>Mapa de la ruta</strong><small>Guía regional entre ciudades</small></div><span>● Azul &nbsp; ● Roja</span></div><div class="schematic-map-scroll"><svg viewBox="0 0 ${world.width||1000} ${world.height||600}" role="img" aria-label="Ruta entre ciudades"><g class="route-edges">${edges}</g>${nodes}</svg></div><p class="world-map-caption">La línea dorada marca tu trayecto. Confirma dentro del juego los nombres exactos de las zonas y cualquier conexión dinámica.</p></section>`;
  }
  return `<section class="world-map-card"><div class="world-map-toolbar"><strong>Mapa interactivo de Albion</strong><div class="world-map-mode"><button class="active" id="advanced-map-mode">Mapa completo</button><button id="local-map-mode">Mi ruta automática</button></div></div><div class="advanced-map-pane" id="advanced-map-pane"><webview id="advanced-world-map" src="https://albionfreemarket.com/albion-map" partition="persist:albion-advanced-map" webpreferences="contextIsolation=yes, nodeIntegration=no, sandbox=yes"></webview><div class="advanced-map-status" id="advanced-map-status">Cargando herramientas avanzadas…</div></div><div class="local-map-pane hidden" id="local-map-pane"><div class="world-map-legend local-map-legend"><span><i class="blue"></i>Azul</span><span><i class="yellow"></i>Amarilla</span><span><i class="red"></i>Roja</span><span><i class="black"></i>Negra</span></div><div class="world-map-shell" id="world-map-shell"><div class="world-map-canvas" id="world-map-canvas"></div><div class="world-map-search"><input id="world-map-search" list="world-map-locations" autocomplete="off" placeholder="Buscar zona…"><datalist id="world-map-locations"></datalist><button id="world-map-find" title="Buscar zona">⌕</button></div><div class="world-map-actions"><button id="world-map-route" title="Centrar la ruta">Ruta</button><button id="world-map-fullscreen" title="Pantalla completa">⛶</button></div><div class="world-map-loading" id="world-map-loading">Cargando mapa…</div></div></div><p class="world-map-caption" id="world-map-caption">Mapa completo: crea rutas con clics, abre mapas interiores, usa Roads, filtros, recursos, marcadores y el resumen de distancia y tiempo.</p></section>`;
}

function initializeAdvancedWorldMap(world, routeMaps) {
  if (window.IS_PWA) return;
  const webview = $('advanced-world-map'), advancedPane = $('advanced-map-pane'), localPane = $('local-map-pane');
  let localStarted = false;
  const selectMode = mode => {
    const advanced = mode === 'advanced';
    advancedPane.classList.toggle('hidden', !advanced); localPane.classList.toggle('hidden', advanced);
    $('advanced-map-mode').classList.toggle('active', advanced); $('local-map-mode').classList.toggle('active', !advanced);
    $('world-map-caption').textContent = advanced
      ? 'Mapa completo: crea rutas con clics, abre mapas interiores, usa Roads, filtros, recursos, marcadores y el resumen de distancia y tiempo.'
      : 'Mi ruta automática: arrastra para moverte, usa la rueda para acercar y haz clic en una zona para ver su nombre.';
    if (!advanced) {
      if (!localStarted) { localStarted = true; initializeWorldMap(world, routeMaps); }
      setTimeout(() => state.worldMapInstance?.invalidateSize(), 80);
    }
  };
  $('advanced-map-mode').onclick = () => selectMode('advanced');
  $('local-map-mode').onclick = () => selectMode('local');
  if (!webview) return;
  webview.addEventListener('dom-ready', async () => {
    try {
      await webview.insertCSS(`
        mat-toolbar, .page-title, app-footer, footer, app-cookie-banner { display:none !important; }
        body { margin:0 !important; overflow:hidden !important; background:#252321 !important; }
        app-albion-map { display:block !important; padding:0 8px 8px !important; }
        .mat-mdc-tab-group { min-height:100vh !important; }
        .map-container { min-height:calc(100vh - 55px) !important; }
      `);
      await webview.executeJavaScript(`(() => {
        const openMap = () => {
          const tab = [...document.querySelectorAll('[role="tab"]')].find(item => item.textContent.trim() === 'Map');
          if (tab && tab.getAttribute('aria-selected') !== 'true') tab.click();
        };
        openMap(); setTimeout(openMap, 900);
      })()`);
      $('advanced-map-status')?.classList.add('hidden');
    } catch (error) {
      const status = $('advanced-map-status'); if (status) status.textContent = 'No se pudo preparar el mapa avanzado. Usa “Mi ruta automática”.';
    }
  });
  webview.addEventListener('did-fail-load', event => {
    if (event.errorCode === -3) return;
    const status = $('advanced-map-status'); if (status) status.textContent = 'No se pudo cargar el mapa avanzado. Comprueba tu conexión o usa “Mi ruta automática”.';
  });
}

function initializeWorldMap(world, routeMaps) {
  const root = $('world-map-canvas');
  if (!root || !window.L) { $('world-map-loading').textContent = 'No se pudo iniciar el visor interactivo.'; return; }
  if (state.worldMapInstance) { state.worldMapInstance.remove(); state.worldMapInstance = null; }
  const map = window.L.map(root, {
    crs:window.L.CRS.Simple, minZoom:0, maxZoom:9, zoomAnimation:true,
    maxBounds:[[-404, 0], [8, 256]], maxBoundsViscosity:1, preferCanvas:true
  }).setView([-180, 130], 0);
  state.worldMapInstance = map;
  const tileLayer = window.L.tileLayer('https://cdn.albionfreemarket.com/AlbionWorld/map/maps/{z}/map_{x}_{y}.webp', {
    tileSize:256, noWrap:true, maxNativeZoom:7, minZoom:0, bounds:[[-404, 0], [8, 256]],
    attribution:'Mapa de Albion Online · Datos visuales de Albion Free Market'
  }).addTo(map);
  tileLayer.once('load', () => $('world-map-loading')?.classList.add('hidden'));
  tileLayer.once('tileerror', () => { const loading=$('world-map-loading'); if(loading) loading.textContent='No se pudieron descargar los mosaicos del mapa.'; });

  const nodeById = new Map(world.nodes.map(node => [node.id, node]));
  const routeIds = new Set(routeMaps.map(route => route.id));
  const colors = { blue:'#4f9ee8', yellow:'#efd03e', red:'#df5c57', black:'#817493', other:'#f2f2ec' };
  const markers = new Map();
  world.nodes.forEach(node => {
    if (!Number.isFinite(node.lat) || !Number.isFinite(node.lng)) return;
    const marker = window.L.circleMarker([node.lat, node.lng], {
      radius:routeIds.has(node.id) ? 6 : node.mapCategory === 'city' ? 5 : 3,
      color:routeIds.has(node.id) ? '#fff1c2' : '#171b1a', weight:routeIds.has(node.id) ? 2.4 : 1.2,
      fillColor:colors[node.pvpCategory] || colors.other, fillOpacity:.96, pane:'markerPane'
    }).bindTooltip(`<strong>${node.name}</strong>${node.tier ? `<br>T${node.tier}` : ''}`, { direction:'top', offset:[0,-5] }).addTo(map);
    marker.on('click', () => { $('world-map-search').value=node.name; map.flyTo([node.lat,node.lng], Math.max(5,map.getZoom()), { duration:.45 }); marker.openTooltip(); });
    markers.set(node.id, marker);
  });

  const routeLatLngs = [];
  routeMaps.forEach((route, index) => {
    const node = nodeById.get(route.id); if (!node) return;
    routeLatLngs.push([node.lat,node.lng]);
    if (index) {
      const previous = nodeById.get(routeMaps[index - 1].id);
      const color = colors[route.pvpCategory] || '#f0bd4f';
      window.L.polyline([[previous.lat,previous.lng],[node.lat,node.lng]], { color:'#111', weight:8, opacity:.9 }).addTo(map);
      window.L.polyline([[previous.lat,previous.lng],[node.lat,node.lng]], { color, weight:4, opacity:1, dashArray:route.pvpCategory === 'red' || route.pvpCategory === 'black' ? '9 7' : null }).addTo(map);
    }
    const number = window.L.divIcon({ className:'route-map-number', html:`<span>${index + 1}</span>`, iconSize:[26,26], iconAnchor:[13,13] });
    window.L.marker([node.lat,node.lng], { icon:number, keyboard:false, zIndexOffset:1000 }).bindTooltip(route.name, { direction:'top', offset:[0,-13] }).addTo(map);
  });
  const routeBounds = window.L.latLngBounds(routeLatLngs);
  const focusRoute = () => routeBounds.isValid() && map.fitBounds(routeBounds, { padding:[90,90], maxZoom:5, animate:true });
  setTimeout(() => { map.invalidateSize(); focusRoute(); }, 120);

  const list = $('world-map-locations');
  list.innerHTML = [...world.nodes].sort((a,b) => a.name.localeCompare(b.name)).map(node => `<option value="${node.name.replace(/"/g,'&quot;')}"></option>`).join('');
  const findLocation = () => {
    const query = foldText($('world-map-search').value);
    const node = world.nodes.find(item => foldText(item.name) === query) || world.nodes.find(item => foldText(item.name).includes(query));
    if (!node) { toast('No encontré esa zona.', true); return; }
    $('world-map-search').value = node.name; map.flyTo([node.lat,node.lng], 6, { duration:.55 }); markers.get(node.id)?.openTooltip();
  };
  $('world-map-find').onclick = findLocation;
  $('world-map-search').onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); findLocation(); } };
  $('world-map-route').onclick = focusRoute;
  $('world-map-fullscreen').onclick = async () => {
    const shell = $('world-map-shell');
    if (document.fullscreenElement) await document.exitFullscreen(); else await shell.requestFullscreen();
  };
  document.onfullscreenchange = () => setTimeout(() => state.worldMapInstance?.invalidateSize(), 80);
}

function renderFavorites() {
  const root = $('favorites-list');
  if (!state.favorites.length) { root.innerHTML = '<div class="empty-card">Todavía no tienes objetos favoritos.</div>'; return; }
  root.innerHTML = state.favorites.map(item => {
    const alert = state.alerts[item.id] || { type:'buy_below', value:'' };
    return `<div class="favorite-card" data-id="${item.id}"><img data-item-id="${item.id}"><div><strong>${item.name}</strong><small>${item.id}</small></div><div class="alert-form"><select class="alert-type"><option value="buy_below" ${alert.type==='buy_below'?'selected':''}>Comprar bajo</option><option value="sell_above" ${alert.type==='sell_above'?'selected':''}>Vender sobre</option></select><input class="alert-value" type="number" min="0" value="${alert.value}" placeholder="Precio"></div><button class="ghost save-alert">Guardar alerta</button><button class="remove" title="Eliminar">×</button></div>`;
  }).join('');
  hydrateImages(root);
  root.querySelectorAll('.favorite-card').forEach(card => {
    card.querySelector('.save-alert').onclick = () => { state.alerts[card.dataset.id] = { type: card.querySelector('.alert-type').value, value: Number(card.querySelector('.alert-value').value) || 0 }; saveState(); toast('Alerta guardada'); };
    card.querySelector('.remove').onclick = () => { state.favorites = state.favorites.filter(f => f.id !== card.dataset.id); delete state.alerts[card.dataset.id]; saveState(); renderFavorites(); updateFavoriteButton(); };
  });
}
async function checkAlerts() {
  const active = state.favorites.filter(f => state.alerts[f.id]?.value > 0); if (!active.length) return;
  try {
    const prices = await window.albion.getPrices({ itemIds: active.map(i => i.id), locations: state.cities, qualities: [1] });
    for (const item of active) {
      const alert = state.alerts[item.id], rows = prices.filter(p => p.item_id === item.id);
      const match = alert.type === 'buy_below' ? rows.filter(p=>p.sell_price_min>0 && ageInfo(p.sell_price_min_date).hours<=state.staleHours).sort((a,b)=>a.sell_price_min-b.sell_price_min)[0] : rows.filter(p=>p.buy_price_max>0 && ageInfo(p.buy_price_max_date).hours<=state.staleHours).sort((a,b)=>b.buy_price_max-a.buy_price_max)[0];
      const value = alert.type === 'buy_below' ? match?.sell_price_min : match?.buy_price_max;
      const triggered = alert.type === 'buy_below' ? value <= alert.value : value >= alert.value;
      if (match && triggered) window.albion.notify({ title:`Alerta: ${item.name}`, body:`${match.city}: ${silver(value)}` });
    }
  } catch {}
}

function historyStats(history, itemId, city) {
  const points = history.filter(entry => entry.item_id === itemId && entry.location === city)
    .flatMap(entry => Array.isArray(entry.data) ? entry.data : []);
  return {
    volume: points.reduce((sum, point) => sum + (Number(point.item_count) || 0), 0),
    average: points.length ? points.reduce((sum, point) => sum + (Number(point.avg_price) || 0), 0) / points.length : 0
  };
}

async function scanResources() {
  const button = $('scan-resources');
  button.disabled = true; button.textContent = 'Analizando…';
  $('resource-status').textContent = 'Consultando recursos, precios, volumen e historial del servidor Américas…';
  try {
    const tiers = $('resource-tier').value.split(',').map(Number);
    const enchants = new Set($('resource-enchant').value.split(',').map(Number));
    const result = await window.albion.scanOpportunities({ tiers, category:'resources', locations:state.cities, qualities:[1], maxItems:420 });
    const rawPattern = /^T[2-8]_(ORE|WOOD|FIBER|HIDE|ROCK)(?:_LEVEL\d+)?(?:@(\d+))?$/;
    const items = result.items.filter(item => {
      const match = item.id.match(rawPattern); return match && enchants.has(Number(match[2] || 0));
    }).slice(0, 100);
    const history = await window.albion.getPriceHistory({ itemIds:items.map(item => item.id), locations:state.cities, qualities:[1], days:30 }).catch(() => []);
    const grouped = new Map();
    result.prices.forEach(price => { if (!grouped.has(price.item_id)) grouped.set(price.item_id, []); grouped.get(price.item_id).push(price); });
    const spec = Math.max(0, Number($('gather-spec').value) || 0);
    const yieldBonus = Math.max(0, Number($('gather-yield').value) || 0);
    const risk = $('gather-risk').value;
    const riskMultiplier = { safe:1, red:1.28, black:1.62 }[risk] || 1;
    const riskLoss = { safe:0, red:.06, black:.14 }[risk] || 0;
    state.resourceRows = items.map(item => {
      const prices = (grouped.get(item.id) || []).filter(row => row.buy_price_max > 0 && ageInfo(row.buy_price_max_date).hours <= state.staleHours);
      const best = prices.sort((a,b) => b.buy_price_max - a.buy_price_max)[0];
      if (!best) return null;
      const stats = historyStats(history, item.id, best.city);
      const unitsHour = Math.max(45, (380 - item.tier * 28) * riskMultiplier * (1 + spec / 500) * (1 + yieldBonus / 100));
      const hourly = best.buy_price_max * unitsHour * (1 - riskLoss);
      const age = ageInfo(best.buy_price_max_date).hours;
      const confidence = age <= state.staleHours && stats.volume >= 25 ? 'high' : age <= 24 && stats.volume >= 5 ? 'medium' : 'low';
      return { item, city:best.city, price:best.buy_price_max, updated:best.buy_price_max_date, volume:stats.volume, hourly, unitsHour, confidence };
    }).filter(Boolean).sort((a,b) => b.hourly - a.hourly).slice(0, 30);
    renderResources();
    $('resource-status').textContent = `${state.resourceRows.length} recursos con mercado · cálculo ajustado por rendimiento y riesgo · los nodos disponibles pueden cambiar el resultado real.`;
  } catch (error) {
    $('resource-results').innerHTML = '<div class="empty-card">No se pudo completar el análisis. Comprueba tu conexión.</div>';
    $('resource-status').textContent = 'Análisis incompleto.'; toast(error.message, true);
  } finally { button.disabled = false; button.textContent = 'Calcular mejores recursos'; }
}

function renderResources() {
  const root = $('resource-results');
  root.innerHTML = state.resourceRows.length ? state.resourceRows.map(row => `<button class="resource-row" data-id="${row.item.id}"><div class="resource-name"><img data-item-id="${row.item.id}"><div><strong>${row.item.name}</strong><small>${row.item.id} · T${row.item.tier}</small></div></div><div><strong>${silver(row.price)}</strong><small>${ageInfo(row.updated).text}</small></div><div><strong>${cityName(row.city)}</strong><small>${row.volume.toLocaleString('es-CL')} vendidos/30d</small></div><div><strong class="silver-hour">${silver(row.hourly)}</strong><small>${Math.round(row.unitsHour)} unidades/h estimadas</small></div><div class="confidence ${row.confidence}"><i></i>${row.confidence === 'high' ? 'Alta' : row.confidence === 'medium' ? 'Media' : 'Baja'}</div></button>`).join('') : '<div class="empty-card">No se encontraron recursos con órdenes de compra recientes.</div>';
  hydrateImages(root);
  root.querySelectorAll('.resource-row').forEach(card => card.onclick = async () => {
    const row = state.resourceRows.find(entry => entry.item.id === card.dataset.id); if (!row) return;
    document.querySelector('.nav[data-view="market"]').click(); $('market-search').value = row.item.name; await selectMarketItem(row.item);
  });
}

const buildPresets = {
  pve:['T4_2H_BOW','T4_HEAD_LEATHER_SET2','T4_ARMOR_LEATHER_SET2','T4_SHOES_PLATE_SET2','T4_BAG','T4_CAPE'],
  gather:['T4_MAIN_SPEAR','T4_OFF_TORCH','T4_HEAD_CLOTH_SET1','T4_ARMOR_LEATHER_SET2','T4_SHOES_PLATE_SET2','T4_BAG'],
  transport:['T4_HEAD_PLATE_SET1','T4_ARMOR_PLATE_SET3','T4_SHOES_PLATE_SET2','T4_BAG','T4_CAPE','T4_MOUNT_HORSE']
};
const buildSlotNames = ['Bolsa','Cabeza','Capa','Arma principal','Pecho','Mano secundaria','Poción','Calzado','Comida','Montura'];
const buildModeName = mode => ({ 'mists-solo':'Nieblas solo','mists-duo':'Nieblas dúo','hellgate-2v2':'Hellgate 2v2','hellgate-5v5':'Hellgate 5v5','corrupted-dungeons':'Mazmorras corruptas','gank':'Gank','openworld-solo':'Mundo abierto','pve-group':'PvE grupal','small-fight-zvz':'Pelea pequeña / ZvZ' }[mode] || 'Build comunitaria');
const spellNames = {
  ARMOR_CD_RESET:'Destello de perspicacia', RENDINGSPIN:'Vuelta desgarradora', AXESMASH:'Corte mortal', LETHAL_CLEAVER:'Hendidura letal', ROYAL_BANNER:'Estandarte real', ROYAL_MARCH:'Marcha real',
  RENDINGSTRIKE:'Golpe desgarrador', RENDINGCOMBO:'Furia desgarradora', AXEBOOST:'Impulso de adrenalina', AXE_CHARGE:'Carga de batalla', INNERBLEEDING:'Hemorragia interna', BLADE_AURA:'Cuchillas furiosas', AXETHROW:'Bandido sanguinario', AXEWHIRLWIND2:'Torbellino', RENDINGSWING:'Desgarrar', SCYTHESWING:'Cosecha sangrienta',
  HEROICSTRIKE2:'Golpe heroico', CLEAVE:'Hendidura heroica', SWORD_SPIN:'Ciclón de cuchillas', PARRY:'Golpe de parada', DEADLYSHOT:'Disparo mortal', MULTISHOT2:'Disparo múltiple', POISONARROW:'Flecha envenenada', GROUNDARROW:'Rayo de luz', JUMPSHOT2:'Disparo congelante', SPEEDSHOT2:'Disparo veloz', BURNINGARROWS:'Flechas explosivas',
  SUNDERARMOR2:'Perforar armadura', QDASH:'Deslizamiento mortal', ASSASSINSPIRIT:'Espíritu asesino', THROWINGBLADES:'Cuchillas arrojadizas', GROUNDDASH:'Carrera', DEEPCUTS:'Puñalada prohibida', SKILLSHOT_TELEPORT:'Filo sombrío', CHAINDASH:'Corte en cadena',
  ENERGYBURST_CHANNEL:'Recuperar energía', PBAOE_KNOCKBACK:'Campo de fuerza', PURGE_HELMET:'Purga', FROSTSHIELD:'Escudo de hielo', OUTOFCOMBATHEAL:'Curar heridas', FLAMESHIELD:'Escudo infernal', AMBUSH:'Emboscada', BLOODLUST:'Sed de sangre', HASTE:'Prisa', SELF_CLEANSE:'Limpiar', RETALIATE2:'Represalia', HOWL:'Aullido', SMOKEBOMB:'Bomba de humo', SUMMONER_CD_REDUCTION:'Meditación',
  SPRINT_CD_REDUCTION:'Carrera refrescante', ASSASSIN_DASH:'Corte veloz', OVERSPRINT:'Acelerón', STONESKIN:'Piel de piedra', BLOCK:'Bloqueo', EMERGENCY_SHIELD:'Escudo de emergencia', PURIFYING_SMOKE:'Humo purificador', ENRAGE:'Furia', TAUNT:'Provocar', WINDWALL:'Muro de viento', ARMORCHAIN:'Cadena de alma', SPRINTHOT:'Carrera rejuvenecedora', WANDERLUST:'Ansias de viajar', MAXHEALTHBUFF:'Gigante', FLEE:'Huir'
};
const spellName = id => spellNames[id] || String(id || '').replace(/^PASSIVE_/, 'Pasiva: ').replace(/_/g, ' ').toLocaleLowerCase('es').replace(/(^|\s)\p{L}/gu, letter => letter.toLocaleUpperCase('es'));
async function hydrateSpellImages(root = document) {
  root.querySelectorAll('img[data-spell-id]').forEach(async img => {
    if (img.dataset.loading) return;
    img.dataset.loading = 'true';
    try { const source = await window.albion.getSpellImage(img.dataset.spellId); if (source) img.src = source; } catch {}
  });
}

function clearCommunityBuildSelection(message = 'Busca otra arma o cambia la actividad.') {
  state.selectedCommunityBuild = null;
  state.buildSlots = [];
  state.buildItems = [];
  state.buildRecommendations = new Map();
  saveState(); renderBuild();
  $('build-title').textContent = 'Sin build publicada';
  $('build-author').textContent = message;
  $('build-mode-label').textContent = 'ALBIONONLINEBUILDS.COM';
  $('build-buy-summary').innerHTML = '<div class="empty-card">Selecciona una build real para comparar sus precios.</div>';
  $('build-totals').innerHTML = '';
}

async function searchCommunityBuilds() {
  const button = $('search-community-builds'); button.disabled = true; button.textContent = 'Buscando…';
  try {
    const query = $('community-build-search').value.trim();
    if (!query) throw new Error('Escribe el nombre del arma que quieres usar.');
    if (!state.selectedBuildWeapon || state.selectedBuildWeapon.name !== query) {
      const matches = (await window.albion.searchItems(query, 100)).filter(item => marketItemCategory(item.id) === 'weapons');
      if (!matches.length) throw new Error('No encontré esa arma. Selecciónala de la lista de sugerencias.');
      state.selectedBuildWeapon = matches[0]; $('community-build-search').value = matches[0].name;
    }
    const weapon = state.selectedBuildWeapon;
    state.communityBuilds = await window.albion.searchBuilds({ query, weaponId:weapon.id, weaponName:weapon.name, englishName:weapon.englishName || '', mode:$('community-build-mode').value, limit:30 });
    const root = $('community-build-results');
    root.innerHTML = state.communityBuilds.length ? state.communityBuilds.map(build => `<button class="community-build-card" data-slug="${build.slug}"><span>♜</span><div><strong>${build.title}</strong><small>${buildModeName(build.mode)} · ${Number(build.upvotes || 0)} votos · ${build.sourceName || 'AlbionOnlineBuilds.com'}</small></div><b>Usar build ›</b></button>`).join('') : `<div class="empty-card">No se encontró una build comunitaria publicada para <strong>${weapon.name}</strong> en las fuentes consultadas.</div>`;
    root.querySelectorAll('.community-build-card').forEach(card => card.onclick = () => selectCommunityBuild(card.dataset.slug));
    if (state.communityBuilds[0]) await selectCommunityBuild(state.communityBuilds[0].slug);
    else clearCommunityBuildSelection(`No hay una build publicada para ${weapon.name}. Prueba otra actividad.`);
  } catch (error) { clearCommunityBuildSelection('No se pudo consultar AlbionOnlineBuilds.com. Inténtalo de nuevo.'); toast(error.message, true); }
  finally { button.disabled = false; button.textContent = 'Buscar builds'; }
}

function bindCommunityWeaponSearch() {
  const input = $('community-build-search'), box = $('community-weapon-suggestions'); let timer;
  input.addEventListener('input', () => {
    state.selectedBuildWeapon = null; clearTimeout(timer);
    timer = setTimeout(async () => {
      const items = (await window.albion.searchItems(input.value, 150)).filter(item => marketItemCategory(item.id) === 'weapons').slice(0, 20);
      box.replaceChildren(...items.map(item => itemSuggestion(item, selected => {
        state.selectedBuildWeapon = selected; input.value = selected.name; box.classList.remove('open'); searchCommunityBuilds();
      })));
      box.classList.toggle('open', Boolean(input.value.trim()) && items.length > 0);
    }, 170);
  });
  input.addEventListener('keydown', event => { if (event.key === 'Escape') box.classList.remove('open'); });
}

async function selectCommunityBuild(slug) {
  $('build-loadout').innerHTML = '<div class="empty-card">Importando equipamiento y habilidades…</div>';
  try {
    state.selectedCommunityBuild = await window.albion.getBuild(slug);
    await applySelectedBuildOptions();
    $('build-title').textContent = state.selectedCommunityBuild.title;
    $('build-author').textContent = `${state.selectedCommunityBuild.author ? `Creada por ${state.selectedCommunityBuild.author} · ` : ''}Fuente: ${state.selectedCommunityBuild.sourceName || 'AlbionOnlineBuilds.com'}${state.selectedCommunityBuild.upvotes != null ? ` · ${state.selectedCommunityBuild.upvotes} votos` : ''}`;
    $('build-mode-label').textContent = buildModeName(state.selectedCommunityBuild.mode).toUpperCase();
    toast(`Build ${state.selectedCommunityBuild.title} importada.`);
  } catch (error) { $('build-loadout').innerHTML = '<div class="empty-card">No se pudo importar esta build.</div>'; toast(error.message, true); }
}

async function applySelectedBuildOptions() {
  if (!state.selectedCommunityBuild) return;
  const tier = Number($('build-tier').value), enchantment = Number($('build-enchantment').value);
  const prepared = prepareCommunityBuild(state.selectedCommunityBuild.items.map(item => item?.id || null), tier, enchantment);
  const uniqueIds = [...new Set(prepared.slots.map(slot => slot.id).filter(Boolean))];
  const resolved = new Map(await Promise.all(uniqueIds.map(async id => {
    const baseId = String(id).split('@')[0];
    const matches = await window.albion.searchItems(baseId, 10);
    return [id, matches.find(item => item.id === baseId)];
  })));
  state.buildSlots = prepared.slots.map((slot, index) => ({ ...slot, name:resolved.get(slot.id)?.name || state.selectedCommunityBuild.items[index]?.name || slot.id, tier:index === 6 || index >= 8 ? state.selectedCommunityBuild.items[index]?.tier : tier, spells:state.selectedCommunityBuild.spells?.[index] || [], passive:state.selectedCommunityBuild.passives?.[index] || null }));
  state.buildItems = prepared.purchaseIds.map(id => {
    const slot = state.buildSlots.find(entry => entry.id === id);
    return { id, name:slot?.name || id, tier:slot?.tier || tier };
  });
  state.buildRecommendations = new Map(); saveState(); renderBuild();
  $('build-buy-summary').innerHTML = '<div class="empty-card">Pulsa comparar para consultar precios de esta combinación.</div>';
  $('build-totals').innerHTML = '';
}

async function loadBuildPreset(name) {
  const ids = buildPresets[name] || [];
  const resolved = await Promise.all(ids.map(async id => (await window.albion.searchItems(id)).find(item => item.id === id) || { id, name:id, tier:4 }));
  state.selectedCommunityBuild = null; state.buildSlots = []; state.buildItems = resolved; saveState(); renderBuild();
  document.querySelectorAll('#build-presets button').forEach(button => button.classList.toggle('active', button.dataset.preset === name));
}
function addBuildItem(item) {
  if (state.buildItems.some(entry => entry.id === item.id)) return toast('Ese objeto ya está en la build.', true);
  state.selectedCommunityBuild = null; state.buildSlots = []; state.buildItems.push(item); saveState(); renderBuild(); $('build-search').value = '';
}
function renderBuild() {
  const root = $('build-loadout');
  const slots = state.buildSlots.length ? state.buildSlots : state.buildItems.map((item,index) => ({ ...item, index, name:item.name }));
  root.innerHTML = slots.length ? slots.map(slot => {
    if (!slot.id) return `<article class="build-gear-card empty-gear"><span class="build-slot-label">${buildSlotNames[slot.index] || 'Objeto'}</span><div><strong>Sin equipar</strong><small>Este espacio está libre</small></div></article>`;
    const recommendation = state.buildRecommendations.get(slot.id);
    const abilities = [...(slot.spells || []), ...(slot.passive ? [slot.passive] : [])];
    const skills = abilities.length ? `<div class="build-skills">${abilities.map((spell,index) => `<div class="build-skill" title="${spellName(spell)}"><img data-spell-id="${spell}" alt=""><span><b>${index === abilities.length - 1 && slot.passive ? 'Pasiva' : `Habilidad ${index + 1}`}</b><small>${spellName(spell)}</small></span></div>`).join('')}</div>` : (slot.index < 8 ? '<div class="build-skills-empty">La build no indicó habilidades para esta pieza</div>' : '');
    return `<article class="build-gear-card" data-id="${slot.id}"><span class="build-slot-label">${buildSlotNames[slot.index] || 'Objeto'}</span><img data-item-id="${slot.id}" alt=""><div><strong>${slot.name}</strong><small>${slot.id}</small></div>${skills}${recommendation ? `<footer><em>${cityName(recommendation.city)}</em><b>${silver(recommendation.price)}</b><small>${recommendation.stale ? 'Dato antiguo' : ageInfo(recommendation.date).text}</small></footer>` : ''}${state.selectedCommunityBuild ? '' : '<button title="Quitar">×</button>'}</article>`;
  }).join('') : '<div class="empty-card">Selecciona una build o añade objetos manualmente.</div>';
  hydrateImages(root);
  hydrateSpellImages(root);
  if (!state.selectedCommunityBuild) root.querySelectorAll('.build-gear-card').forEach(card => card.querySelector('button').onclick = () => { state.buildItems = state.buildItems.filter(item => item.id !== card.dataset.id); saveState(); renderBuild(); });
}
async function calculateBuild() {
  if (!state.buildItems.length) return toast('Añade objetos a la build.', true);
  const button = $('calculate-build'); button.disabled = true; button.textContent = 'Consultando…';
  try {
    const prices = await window.albion.getPrices({ itemIds:state.buildItems.map(item => item.id), locations:state.cities, qualities:[Number($('build-quality').value)] });
    const cityRows = state.cities.map(city => {
      let total = 0, missing = 0, stale = 0;
      state.buildItems.forEach(item => { const row = prices.filter(price => price.item_id === item.id && price.city === city && price.sell_price_min > 0).sort((a,b) => a.sell_price_min-b.sell_price_min)[0]; if(row){ total += row.sell_price_min; if(ageInfo(row.sell_price_min_date).hours > state.staleHours)stale += 1; } else missing += 1; });
      return { city, total, missing, stale };
    }).filter(row => row.total > 0).sort((a,b) => a.missing-b.missing || a.stale-b.stale || a.total-b.total);
    const complete = cityRows.filter(row => !row.missing), best = complete[0] || cityRows[0];
    const budget = Number($('build-budget').value) || 0;
    const choices = state.buildItems.map(item => {
      const available = prices.filter(row => row.item_id === item.id && row.sell_price_min > 0).sort((a,b) => a.sell_price_min-b.sell_price_min);
      const recent = available.filter(row => ageInfo(row.sell_price_min_date).hours <= state.staleHours);
      const row = recent[0] || available[0];
      return row ? { item, city:row.city, price:row.sell_price_min, date:row.sell_price_min_date, stale:!recent.length } : { item };
    });
    state.buildRecommendations = new Map(choices.filter(row => row.city).map(row => [row.item.id,row])); renderBuild();
    const mixedTotal = choices.reduce((sum,row) => sum + (row.price || 0), 0), mixedMissing = choices.filter(row => !row.city).length;
    const grouped = choices.filter(row => row.city).reduce((map,row) => map.set(row.city,(map.get(row.city)||0)+1),new Map());
    const stops = [...grouped.entries()].sort((a,b)=>b[1]-a[1]).map(([city,count])=>`${cityName(city)} (${count})`).join(' · ');
    $('build-buy-summary').innerHTML = best ? `<article class="build-recommendation"><small>MEJOR CIUDAD PARA COMPRAR TODO</small><h3>${cityName(best.city)}</h3><strong>${silver(best.total)}</strong><p>${best.missing ? `${best.missing} piezas sin precio` : best.stale ? `${best.stale} precios superan ${state.staleHours} h` : 'Set completo con precios recientes'}</p></article><article class="build-recommendation mixed"><small>MÍNIMO COMPRANDO POR PIEZA</small><h3>${choices.filter(row=>row.city).length} objetos en ${grouped.size} ciudades</h3><strong>${silver(mixedTotal)}</strong><p>${mixedMissing ? `${mixedMissing} piezas sin precio · ` : ''}${stops}</p></article>` : '<div class="empty-card">No hay precios disponibles.</div>';
    $('build-totals').innerHTML = cityRows.slice(0,8).map(row => `<div class="build-city ${row === best ? 'best' : ''}"><strong>${cityName(row.city)}</strong><span>${silver(row.total)}</span><small>${row.missing ? `${row.missing} objeto(s) sin precio` : row.stale ? `Set completo · ${row.stale} dato(s) antiguo(s)` : row.total <= budget ? 'Completa · dentro del presupuesto' : `Completa · supera el presupuesto por ${silver(row.total-budget)}`}</small></div>`).join('') || '<div class="empty-card">No hay precios disponibles para esta calidad.</div>';
  } catch(error) { toast(error.message,true); } finally { button.disabled=false; button.textContent='Comparar set en todas las ciudades'; }
}

function generateSilverPlan() {
  const capital = Math.max(0, Number($('assistant-capital').value) || 0), minutes = Math.max(15, Number($('assistant-time').value) || 60);
  const activity = $('assistant-activity').value, candidates = [];
  if ((activity === 'all' || activity === 'gather') && state.resourceRows.length) {
    state.resourceRows.slice(0,3).forEach(row => candidates.push({ type:'Recolección', title:row.item.name, detail:`Recolecta durante ${minutes} min y vende en ${cityName(row.city)}.`, profit:row.hourly*minutes/60, note:`${row.confidence === 'high' ? 'Confianza alta' : 'Estimación'} · ${Math.round(row.unitsHour)} unidades/h` }));
  }
  if (activity === 'all' || activity === 'trade') {
    state.opportunityRows.slice(0,8).forEach(row => { const units = Math.max(1, Math.min(50, Math.floor(capital / row.route.buyPrice))); candidates.push({ type:'Comercio', title:row.item.name, detail:`Compra ${units} en ${cityName(row.route.buyCity)} y vende en ${cityName(row.route.sellCity)}.`, profit:row.route.profit*units, note:`Invierte ${silver(row.route.buyPrice*units)} · ${row.route.margin.toFixed(1)}% ROI` }); });
  }
  if (activity === 'all' || activity === 'refine') {
    const refined = state.refiningResult;
    if (refined) candidates.push({ type:'Refinado', title:refined.item, detail:`Repite el lote calculado desde la pestaña Refinamiento.`, profit:refined.profit, note:`${refined.margin.toFixed(1)}% de margen${refined.focusTotal ? ` · ${Math.round(refined.spf)} silver/foco` : ''}` });
    else candidates.push({ type:'Refinado', title:'Analizar un lote real', detail:'Abre Refinamiento, carga precios recientes y calcula materiales, estación y foco.', profit:0, note:'Sin proyección inventada: falta completar el cálculo' });
  }
  if (activity === 'all' || activity === 'blackmarket') candidates.push({ type:'Mercado Negro', title:'Equipo para Caerleon', detail:'Busca equipo con margen y descuenta riesgo de transporte.', profit:capital*.08, note:'Proyección de 8% antes de comprobar precios' });
  candidates.sort((a,b) => b.profit-a.profit);
  $('assistant-plans').innerHTML = candidates.slice(0,3).map((plan,index) => `<article class="plan-card ${index===0?'best':''}"><span class="rank">${index===0?'MEJOR OPCIÓN':`OPCIÓN ${index+1}`} · ${plan.type}</span><h3>${plan.title}</h3><p>${plan.detail}</p><strong>+${silver(plan.profit)}</strong><small>${plan.note}</small></article>`).join('') || '<div class="empty-card">Primero ejecuta el radar de Recursos o el escáner de Oportunidades.</div>';
}

function refiningItemIds() {
  const config = refiningResources[state.refiningResource];
  const tier = Number($('refine-tier').value), enchantment = Number($('refine-enchant').value);
  const suffix = enchantment ? `@${enchantment}` : '';
  return {
    tier, enchantment,
    rawId:enchantment ? `T${tier}_${config.raw}_LEVEL${enchantment}@${enchantment}` : `T${tier}_${config.raw}`,
    outputId:`T${tier}_${state.refiningResource}${suffix}`,
    previousId:tier > 4 ? `T${tier - 1}_${state.refiningResource}${suffix}` : `T3_${state.refiningResource}`,
    heartId:`T1_FACTION_${config.heart}_TOKEN_1`
  };
}

function refiningSpecs() {
  return Object.fromEntries([4,5,6,7,8].map(tier => [tier, Math.max(0, Math.min(100, Number($(`refine-spec-${tier}`).value) || 0))]));
}

function updateRefiningSetup(clearPrices = false) {
  const config = refiningResources[state.refiningResource], ids = refiningItemIds();
  const heartAllowed = ids.enchantment < 4;
  if (!heartAllowed) $('refine-heart').checked = false;
  $('refine-heart').disabled = !heartAllowed;
  $('refine-bonus-city').textContent = `Bono: ${config.bonusCity}`;
  $('refine-city-label').textContent = cityName($('refine-sale-city').value || config.bonusCity);
  $('refine-product-name').textContent = config.label;
  $('refine-product-tier').textContent = `T${ids.tier}.${ids.enchantment} · Material refinado`;
  $('refine-history-title').textContent = `${config.label} T${ids.tier}.${ids.enchantment}`;
  $('refine-heart-help').textContent = heartAllowed ? `Cambia 1 ${config.rawLabel.toLowerCase()} por ${config.heartLabel.toLowerCase()}` : 'No se permite con materiales .4';
  $('refine-heart-label').textContent = config.heartLabel;
  $('refine-heart-price-wrap').classList.toggle('hidden', !$('refine-heart').checked);
  $('refine-raw-label').textContent = `${config.rawLabel} T${ids.tier}.${ids.enchantment}`;
  $('refine-prev-label').textContent = `${config.label} T${ids.tier - 1}.${ids.tier > 4 ? ids.enchantment : 0}`;
  const rawCount = Math.max(1, (refiningRawCounts[ids.tier] || 2) - ($('refine-heart').checked ? 1 : 0));
  $('refine-raw-multiplier').textContent = `×${rawCount} por unidad`;
  $('refine-sell-note').textContent = $('refine-sale-mode').value === 'instant' ? 'oferta de compra · venta inmediata' : 'orden de venta';
  const rate = refiningReturnRate({ bonusCity:$('refine-location').value === 'bonus', focus:$('refine-focus').checked, dailyBonus:Number($('refine-daily').value) });
  $('refine-return-display').textContent = `${(rate * 100).toLocaleString('es-CL', { minimumFractionDigits:1, maximumFractionDigits:1 })}%`;
  if (clearPrices) {
    for (const id of ['refine-price-raw','refine-price-prev','refine-price-heart','refine-price-sell']) $(id).value = '';
    state.refiningPriceDates = [];
    state.refiningHistory = [];
    renderRefiningMarket([], null, ids);
    $('refine-market-status').textContent = 'La configuración cambió. Carga precios recientes o ingrésalos manualmente.';
  }
}

function renderRefiningMarket(prices = [], output = null, ids = refiningItemIds()) {
  const sell = freshestRefiningPrice(prices, ids.outputId, $('refine-sale-city').value, 'sell');
  const buy = freshestRefiningPrice(prices, ids.outputId, $('refine-sale-city').value, 'buy');
  const sellValue = sell?.sell_price_min || 0, buyValue = buy?.buy_price_max || 0;
  const spread = sellValue && buyValue ? (sellValue - buyValue) / sellValue * 100 : NaN;
  const points = state.refiningHistory.flatMap(entry => Array.isArray(entry.data) ? entry.data : []).filter(point => point.avg_price > 0 && point.timestamp).sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
  $('refine-stat-sell').textContent = silver(sellValue);
  $('refine-stat-buy').textContent = silver(buyValue);
  $('refine-stat-spread').textContent = Number.isFinite(spread) ? `${spread.toFixed(1)}%` : '—';
  $('refine-stat-volume').textContent = points.reduce((sum, point) => sum + (Number(point.item_count) || 0), 0).toLocaleString('es-CL');
  const date = output ? ($('refine-sale-mode').value === 'instant' ? output.buy_price_max_date : output.sell_price_min_date) : null;
  $('refine-history-age').textContent = date ? ageInfo(date).text : 'Sin datos actuales';
  const line=$('refine-chart-line'), area=$('refine-chart-area');
  if (points.length < 2) { line.setAttribute('d',''); area.setAttribute('d',''); return; }
  const daily = new Map();
  points.forEach(point => { const day=String(point.timestamp).slice(0,10); if(!daily.has(day))daily.set(day,[]); daily.get(day).push(Number(point.avg_price)); });
  const series=[...daily].slice(-30).map(([day,values])=>({day,value:values.reduce((a,b)=>a+b,0)/values.length}));
  if(series.length < 2){line.setAttribute('d','');area.setAttribute('d','');return;}
  const min=Math.min(...series.map(p=>p.value)), max=Math.max(...series.map(p=>p.value)), range=Math.max(1,max-min);
  const coords=series.map((point,index)=>[index/(series.length-1)*900,175-(point.value-min)/range*145]);
  const path=coords.map((point,index)=>`${index?'L':'M'}${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(' ');
  line.setAttribute('d',path); area.setAttribute('d',`${path} L900 190 L0 190 Z`);
}

function freshestRefiningPrice(prices, itemId, city, side) {
  const priceKey = side === 'buy' ? 'buy_price_max' : 'sell_price_min';
  const dateKey = side === 'buy' ? 'buy_price_max_date' : 'sell_price_min_date';
  return prices.filter(row => row.item_id === itemId && row.city === city && row[priceKey] > 0 && ageInfo(row[dateKey]).hours <= state.staleHours)
    .sort((a,b) => side === 'buy' ? b[priceKey] - a[priceKey] : a[priceKey] - b[priceKey])[0];
}

async function loadRefiningPrices() {
  const button = $('refine-load-prices'), ids = refiningItemIds();
  const materialCity = $('refine-material-city').value, saleCity = $('refine-sale-city').value;
  button.disabled = true; button.textContent = 'Consultando…';
  $('refine-market-status').textContent = `Consultando órdenes recientes en ${cityName(materialCity)} y ${cityName(saleCity)}…`;
  try {
    const itemIds = [ids.rawId, ids.previousId, ids.outputId, ...($('refine-heart').checked ? [ids.heartId] : [])];
    const [prices, recipe, history] = await Promise.all([
      window.albion.getPrices({ itemIds, locations:[...new Set([materialCity, saleCity])], qualities:[1] }),
      window.albion.getRecipe(ids.outputId).catch(() => null),
      window.albion.getPriceHistory({ itemIds:[ids.outputId], locations:[saleCity], qualities:[1], days:30 }).catch(() => [])
    ]);
    state.refiningHistory = history;
    const recipeScale = recipe?.baseItemId === ids.outputId ? 1 : Math.pow(2, ids.enchantment);
    state.refiningNutrition = (Number(recipe?.nutrition) || 0) * recipeScale;
    const raw = freshestRefiningPrice(prices, ids.rawId, materialCity, 'sell');
    const previous = freshestRefiningPrice(prices, ids.previousId, materialCity, 'sell');
    const heart = $('refine-heart').checked ? freshestRefiningPrice(prices, ids.heartId, materialCity, 'sell') : null;
    const sellSide = $('refine-sale-mode').value === 'instant' ? 'buy' : 'sell';
    const output = freshestRefiningPrice(prices, ids.outputId, saleCity, sellSide);
    renderRefiningMarket(prices, output, ids);
    if (raw) $('refine-price-raw').value = raw.sell_price_min;
    if (previous) $('refine-price-prev').value = previous.sell_price_min;
    if (heart) $('refine-price-heart').value = heart.sell_price_min;
    if (output) $('refine-price-sell').value = sellSide === 'buy' ? output.buy_price_max : output.sell_price_min;
    state.refiningPriceDates = [raw?.sell_price_min_date, previous?.sell_price_min_date, heart?.sell_price_min_date, sellSide === 'buy' ? output?.buy_price_max_date : output?.sell_price_min_date].filter(Boolean);
    const missing = [!raw && refiningResources[state.refiningResource].rawLabel, !previous && `material T${ids.tier - 1}`, $('refine-heart').checked && !heart && 'corazón', !output && 'producto refinado'].filter(Boolean);
    const loadedTotal = 3 + ($('refine-heart').checked ? 1 : 0);
    $('refine-market-status').innerHTML = missing.length
      ? `<span class="status-warning">Faltan órdenes recientes: ${missing.join(', ')}.</span> Puedes completar esos precios manualmente.`
      : `${loadedTotal}/${loadedTotal} precios cargados · datos dentro de ${state.staleHours} h · ${cityName(materialCity)} → ${cityName(saleCity)}`;
    await calculateRefine();
  } catch(error) {
    $('refine-market-status').textContent = `No se pudieron cargar los precios: ${error.message}`;
    toast('No se pudieron cargar los precios de refinamiento.', true);
  } finally { button.disabled = false; button.textContent = '↻ Cargar precios actuales'; }
}

async function calculateRefine() {
  const config = refiningResources[state.refiningResource], ids = refiningItemIds();
  if (!state.refiningNutrition) {
    try {
      const recipe = await window.albion.getRecipe(ids.outputId);
      const recipeScale = recipe?.baseItemId === ids.outputId ? 1 : Math.pow(2, ids.enchantment);
      state.refiningNutrition = (Number(recipe?.nutrition) || 0) * recipeScale;
    } catch {}
  }
  const qty = Math.max(1, Number($('refine-qty').value) || 1);
  const useFocus = $('refine-focus').checked, useHeart = $('refine-heart').checked && ids.enchantment < 4;
  const tax = $('refine-tax-mode').value === 'custom' ? Number($('refine-tax-custom').value) || 0 : Number($('refine-tax-mode').value) || 0;
  const returnRate = refiningReturnRate({ bonusCity:$('refine-location').value === 'bonus', focus:useFocus, dailyBonus:Number($('refine-daily').value) });
  const rawPerOutput = Math.max(1, (refiningRawCounts[ids.tier] || 2) - (useHeart ? 1 : 0));
  const focusPerUnit = useFocus ? refiningFocusCost({ tier:ids.tier, enchantment:ids.enchantment, specs:refiningSpecs() }) : 0;
  const input = {
    quantity:qty, rawPerOutput, rawPrice:Number($('refine-price-raw').value) || 0,
    previousPerOutput:1, previousPrice:Number($('refine-price-prev').value) || 0,
    heartPerOutput:useHeart ? 1 : 0, heartPrice:Number($('refine-price-heart').value) || 0,
    sellPrice:Number($('refine-price-sell').value) || 0, returnRate, marketTax:tax,
    stationRate:Number($('refine-station-rate').value) || 0, nutrition:state.refiningNutrition, focusPerUnit
  };
  const missing = [!input.rawPrice && config.rawLabel, !input.previousPrice && `${config.label} T${ids.tier - 1}`, useHeart && !input.heartPrice && config.heartLabel, !input.sellPrice && 'precio de venta'].filter(Boolean);
  if (missing.length) {
    $('refine-decision-title').textContent = 'Faltan precios';
    $('refine-decision-detail').textContent = `Completa: ${missing.join(', ')}.`;
    $('refine-confidence').textContent = 'Baja'; $('refine-confidence-detail').textContent = 'Cálculo incompleto';
    $('refine-save-result').disabled = true; state.refiningResult = null;
    return;
  }
  const result = calculateRefiningBatch(input);
  const noFocusRate = refiningReturnRate({ bonusCity:$('refine-location').value === 'bonus', focus:false, dailyBonus:Number($('refine-daily').value) });
  const withoutFocus = calculateRefiningBatch({ ...input, returnRate:noFocusRate, focusPerUnit:0 });
  const spf = useFocus && result.focusTotal > 0 ? (result.profit - withoutFocus.profit) / result.focusTotal : 0;
  const potential = spf * 10000;
  const unit = value => Number(value).toLocaleString('es-CL', { maximumFractionDigits:1 });
  $('refine-materials-required').textContent = `${unit(result.rawRequired)} + ${unit(result.previousRequired)}${useHeart ? ` + ${unit(result.heartRequired)} ♥` : ''}`;
  $('refine-materials-detail').textContent = `${config.rawLabel} + ${config.label} T${ids.tier - 1}${useHeart ? ` + ${config.heartLabel}` : ''}`;
  $('refine-investment').textContent = signedSilver(result.investment); $('refine-station-result').textContent = signedSilver(result.stationFee);
  $('refine-revenue').textContent = signedSilver(result.sellRevenue); $('refine-tax-result').textContent = `Impuestos: ${signedSilver(result.tax)}`;
  $('refine-profit').textContent = `${result.profit >= 0 ? '+' : ''}${signedSilver(result.profit)}`; $('refine-profit').className = result.profit >= 0 ? 'positive' : 'negative';
  $('refine-margin').textContent = `Margen: ${result.margin.toFixed(1)}%`;
  $('refine-focus-total').textContent = useFocus ? Math.ceil(result.focusTotal).toLocaleString('es-CL') : 'Sin foco'; $('refine-focus-unit').textContent = useFocus ? `${focusPerUnit.toLocaleString('es-CL')} por unidad` : 'Activa foco para comparar';
  $('refine-spf').textContent = useFocus ? signedSilver(spf) : '—'; $('refine-focus-potential').textContent = useFocus ? `Potencial 10k: ${potential >= 0 ? '+' : ''}${signedSilver(potential)}` : 'Activa foco para calcular SPF';
  const age = state.refiningPriceDates.length ? Math.max(...state.refiningPriceDates.map(date => ageInfo(date).hours)) : Infinity;
  const expectedDates = 3 + (useHeart ? 1 : 0);
  const confidence = state.refiningPriceDates.length && state.refiningPriceDates.length < expectedDates ? 'Mixta' : age <= 2 ? 'Alta' : age <= state.staleHours ? 'Media' : state.refiningPriceDates.length ? 'Baja' : 'Manual';
  let title, detail;
  if (result.profit <= 0) { title='No refinar este lote'; detail=`Perderías ${silver(Math.abs(result.profit))}. Busca materiales más baratos o una ciudad de venta mejor.`; }
  else if (useFocus && spf <= 0) { title='Refinar sin foco'; detail=`El lote gana ${silver(result.profit)}, pero el foco no mejora el beneficio con estos precios.`; }
  else if (result.margin < 5) { title='Margen demasiado estrecho'; detail=`Ganancia positiva de ${silver(result.profit)}, pero ${result.margin.toFixed(1)}% puede desaparecer si cambia el mercado.`; }
  else { title=useFocus ? 'Refinar con foco' : 'Refinar ahora'; detail=`Beneficio estimado de ${silver(result.profit)} después de materiales, estación e impuestos.`; }
  $('refine-decision-title').textContent=title; $('refine-decision-detail').textContent=detail;
  $('refine-confidence').textContent=confidence; $('refine-confidence-detail').textContent=state.refiningPriceDates.length ? `Dato más antiguo: ${ageInfo(state.refiningPriceDates.sort()[0]).text}` : 'Precios ingresados manualmente';
  state.refiningResult={...result, item:`${config.label} T${ids.tier}.${ids.enchantment}`, detail, focusTotal:result.focusTotal, spf};
  $('refine-save-result').disabled=false;
}

function saveRefiningResult() {
  const result = state.refiningResult; if (!result) return;
  state.sessions.push({ id:Date.now(), date:new Date().toISOString(), activity:'Refinado', duration:0, income:result.sellRevenue, expense:result.investment, profit:result.profit, note:`${result.item} · ${$('refine-material-city').value} → ${$('refine-sale-city').value}` });
  saveState(); renderHistory(); toast('Resultado de refinamiento guardado en el historial.');
}

function calculateTransport() {
  const investment=Number($('transport-investment').value)||0, margin=(Number($('transport-margin').value)||0)/100, trips=Math.max(1,Number($('transport-trips').value)||1), death=(Number($('transport-death').value)||0)/100, gear=Number($('transport-gear').value)||0;
  const gross=investment*margin*trips, expectedLoss=(investment+gear)*death*trips, net=gross-expectedLoss;
  $('transport-result').innerHTML=`Ganancia bruta: <strong>${silver(gross)}</strong> · pérdida esperada por riesgo: <strong class="negative">${silver(expectedLoss)}</strong><br><strong class="${net>=0?'positive':'negative'}">Resultado esperado: ${net>=0?'+':''}${silver(net)}</strong> · punto máximo de riesgo rentable: ${(margin*100/(1+gear/Math.max(1,investment))).toFixed(1)}%.`;
}
function calculateBlackMarket() {
  const cost=Number($('bm-cost').value)||0, price=Number($('bm-price').value)||0, tax=(Number($('bm-tax').value)||0)/100, risk=(Number($('bm-risk').value)||0)/100, transport=Number($('bm-transport').value)||0;
  const netSale=price*(1-tax), expectedLoss=(cost+transport)*risk, profit=netSale-cost-transport-expectedLoss;
  $('bm-result').innerHTML=`Ingreso neto: <strong>${silver(netSale)}</strong> · pérdida esperada: <strong class="negative">${silver(expectedLoss)}</strong><br><strong class="${profit>=0?'positive':'negative'}">Beneficio ajustado: ${profit>=0?'+':''}${silver(profit)}</strong> · ROI ${(cost?profit/cost*100:0).toFixed(1)}%.`;
}
function calculateSpecialization() {
  const investment=Number($('spec-investment').value)||0, current=Number($('spec-current').value)||0, improvement=(Number($('spec-improvement').value)||0)/100, weekly=Math.max(1,Number($('spec-hours').value)||1), extra=current*improvement, hours=extra?investment/extra:0;
  $('spec-result').innerHTML=`Ganancia adicional: <strong class="positive">${silver(extra)} por hora</strong><br>Recuperarías la inversión en <strong>${hours?hours.toFixed(1):'—'} horas</strong>${hours?` · aproximadamente ${(hours/weekly).toFixed(1)} semanas jugando ${weekly} h/semana.`:'.'}`;
}

function renderHistory() {
  const total=state.sessions.reduce((sum,s)=>sum+s.profit,0), minutes=state.sessions.reduce((sum,s)=>sum+s.duration,0), avg=minutes?total/(minutes/60):0;
  const best=[...state.sessions].sort((a,b)=>((b.duration?b.profit/b.duration:b.profit)-(a.duration?a.profit/a.duration:a.profit)))[0];
  $('history-summary').innerHTML=`<article><small>GANANCIA TOTAL</small><strong>${silver(total)}</strong></article><article><small>SILVER POR HORA</small><strong>${silver(avg)}</strong></article><article><small>TIEMPO REGISTRADO</small><strong>${Math.round(minutes/60*10)/10} h</strong></article><article><small>MEJOR ACTIVIDAD</small><strong>${best?.activity||'—'}</strong></article>`;
  $('history-list').innerHTML=state.sessions.length?[...state.sessions].reverse().map(session=>`<div class="history-row" data-id="${session.id}"><span>${new Date(session.date).toLocaleDateString('es-CL')} · ${session.duration} min</span><strong>${session.activity}</strong><span>${session.note||'Sin nota'}</span><strong class="${session.profit>=0?'gain':'loss'}">${session.profit>=0?'+':''}${silver(session.profit)}</strong><button title="Eliminar">×</button></div>`).join(''):'<div class="empty-card">Todavía no registras sesiones.</div>';
  $('history-list').querySelectorAll('.history-row').forEach(row=>row.querySelector('button').onclick=()=>{state.sessions=state.sessions.filter(s=>String(s.id)!==row.dataset.id);saveState();renderHistory();});
}
function saveSession() {
  const duration=Math.max(1,Number($('session-duration').value)||1), income=Number($('session-income').value)||0, expense=Number($('session-expense').value)||0;
  state.sessions.push({id:Date.now(),date:new Date().toISOString(),activity:$('session-activity').value,duration,income,expense,profit:income-expense,note:$('session-note').value.trim()});
  saveState(); renderHistory(); toast('Sesión guardada en tu historial.');
}

function fishProbabilityLabel(fish) {
  if (fish.rarity === 'boss') return 'Captura especial · sin % fijo';
  if (fish.rarity === 'common') return 'Común · probabilidad variable';
  return '50% del grupo raro local*';
}

function fishMarketSnapshot(itemId) {
  if (!state.fishingPrices.length || state.fishingPriceCity !== $('fish-city')?.value) return null;
  const row = state.fishingPrices.find(price => price.item_id === itemId && price.city === state.fishingPriceCity && Number(price.quality) === 1);
  if (!row) return { sell:0, buy:0, status:'Sin datos en este mercado', stale:true };
  const sellAge = row.sell_price_min > 0 ? ageInfo(row.sell_price_min_date) : null;
  const buyAge = row.buy_price_max > 0 ? ageInfo(row.buy_price_max_date) : null;
  const freshest = [sellAge,buyAge].filter(Boolean).sort((a,b)=>a.hours-b.hours)[0];
  return { sell:row.sell_price_min || 0, buy:row.buy_price_max || 0, status:freshest?.text || 'Sin fecha', stale:!freshest || freshest.hours > state.staleHours };
}

function fishActionSnapshot(fish) {
  const market = fishMarketSnapshot(fish.id);
  if (!market) return null;
  const chopped = fishMarketSnapshot('T1_FISHCHOPS');
  return bestFishAction({
    sellOrder:market.sell,
    buyOrder:market.buy,
    tax:state.fishingTax,
    choppedPrice:chopped?.sell || 0,
    chopYield:fishChopYield(fish),
    recipeOptions:state.fishingRecipeOptions.get(fish.id) || []
  });
}

function renderFishing() {
  const tier = $('fish-tier').value, water = $('fish-water').value, biome = $('fish-biome').value, sort = $('fish-sort').value;
  const rows = fishingFish.filter(fish => (tier === 'all' || fish.tier === Number(tier)) && (water === 'all' || fish.water === water) && (biome === 'all' || fish.biome === biome || fish.biome === 'any'));
  rows.sort((a,b)=>sort === 'money' ? ((fishActionSnapshot(b)?.best?.value || 0) - (fishActionSnapshot(a)?.best?.value || 0)) : sort === 'name' ? a.name.localeCompare(b.name,'es') : (b.tier-a.tier || a.name.localeCompare(b.name,'es')));
  $('fish-count').textContent = `${rows.length} / ${fishingFish.length}`;
  $('fish-grid').innerHTML = rows.length ? rows.map(fish => { const market=fishMarketSnapshot(fish.id), action=fishActionSnapshot(fish), best=action?.best; return `<article class="fish-card ${fish.rarity}">
    <div class="fish-card-top"><img data-item-id="${fish.id}" alt=""><div><span>T${fish.tier} · ${fish.water === 'fresh' ? 'Agua dulce' : 'Agua salada'}</span><h3>${fish.name}</h3><small>${fishingBiomes[fish.biome]}</small></div></div>
    <div class="fish-probability"><b>${fish.rarity === 'common' ? 'COMÚN' : fish.rarity === 'boss' ? 'ESPECIAL' : 'RARO'}</b><span>${fishProbabilityLabel(fish)}</span></div>
    <div class="fish-market-price ${market?.stale ? 'estimated' : ''}"><div><small>ORDEN DE VENTA</small><strong>${market ? silver(market.sell) : 'Consultar'}</strong></div><div><small>VENTA INMEDIATA</small><strong>${market ? silver(market.buy) : 'Consultar'}</strong></div><span>${market ? `${cityName(state.fishingPriceCity)} · ${market.stale && market.sell ? 'estimado · ' : ''}${market.status}` : 'Presiona “Precios y recetas”'}</span></div>
    ${best ? `<div class="fish-money-advice"><small>MEJOR OPCIÓN AHORA</small><strong>${best.label}</strong><span>Valor neto estimado por pez: ${silver(best.value)}${best.estimated?' · datos estimados':''}</span><div class="fish-option-grid">${action.options.filter(option=>['sell','instant','chop'].includes(option.type) || (option.type==='cook' && option.value===Math.max(...action.options.filter(item=>item.type==='cook').map(item=>item.value)))).sort((a,b)=>b.value-a.value).slice(0,4).map(option=>`<div class="${option===best?'winner':''}"><small>${option.type==='sell'?'Orden':option.type==='instant'?'Inmediata':option.type==='chop'?'Picado':'Cocinado'}</small><b>${silver(option.value)}</b></div>`).join('')}</div></div>` : `<p><strong>Qué hacer:</strong> ${fish.use}</p>`}
  </article>`; }).join('') : '<div class="empty-card">No hay peces que coincidan con estos filtros.</div>';
  hydrateImages($('fish-grid'));
  const mapRows = fishingMaps.filter(row => biome === 'all' || row.biome === biome);
  $('fish-map-list').innerHTML = mapRows.map((row,index)=>`<article class="fish-map-card${index===0?' recommended':''}"><div><small>${row.risk}</small><strong>${row.title}</strong></div><p>${row.maps}</p><span>Objetivo: ${row.target}</span></article>`).join('') || '<div class="empty-card">No hay mapas para este filtro.</div>';
  const priced = rows.map(fish=>({fish,action:fishActionSnapshot(fish)})).filter(row=>row.action?.best).sort((a,b)=>b.action.best.value-a.action.best.value);
  const preferred = priced[0]?.fish || rows.find(fish => fish.rarity === 'rare' && fish.tier === 7) || rows.find(fish => fish.rarity === 'rare') || rows.at(-1);
  if (preferred) { $('fish-best-target').textContent = preferred.name; $('fish-best-target').nextElementSibling.textContent = priced[0] ? `${priced[0].action.best.label} · ${silver(priced[0].action.best.value)} por pez` : `${fishingBiomes[preferred.biome]} · ${preferred.water === 'fresh' ? 'agua dulce' : 'agua salada'}`; }
}

function freshFishPrice(prices, itemId, city) {
  const candidates = prices.filter(row => row.item_id === itemId && row.city === city && Number(row.quality) === 1 && row.sell_price_min > 0);
  const selected = candidates.sort((a,b)=>new Date(b.sell_price_min_date)-new Date(a.sell_price_min_date))[0];
  return selected ? { ...selected, isStale:ageInfo(selected.sell_price_min_date).hours > state.staleHours } : null;
}

async function scanFishingRecipes() {
  const button = $('scan-fish-recipes'), city = $('fish-city').value, tax = Math.max(0, Number($('fish-tax').value) || 0) / 100;
  button.disabled = true; button.textContent = 'Consultando…'; $('fish-price-status').textContent = `Cargando recetas y precios de ${cityName(city)}…`;
  try {
    const recipes = (await Promise.all(fishingRecipes.map(async meta => ({ ...meta, recipe:await window.albion.getRecipe(meta.id) })))).filter(row => row.recipe?.resources?.length);
    const itemIds = [...new Set(['T1_FISHCHOPS', ...fishingFish.map(fish=>fish.id), ...recipes.flatMap(row => [row.id, ...row.recipe.resources.map(resource => resource.id)])])];
    const catalogEntries = await Promise.all(itemIds.map(async id => {
      const matches = await window.albion.searchItems(id, 1).catch(()=>[]);
      return [id, matches.find(item=>item.id===id)?.name || id];
    }));
    const itemNames = new Map(catalogEntries);
    const prices = await window.albion.getPrices({ itemIds, locations:[city], qualities:[1] });
    state.fishingPrices=prices; state.fishingPriceCity=city; state.fishingTax=tax; state.fishingRecipeOptions=new Map();
    const results = recipes.map(row => {
      const sale = freshFishPrice(prices, row.id, city), missing = [], materials = [];
      let cost = 0;
      for (const resource of row.recipe.resources) {
        const price = freshFishPrice(prices, resource.id, city);
        const subtotal = price ? price.sell_price_min * resource.count : null;
        if (!price) missing.push(resource.id); else cost += subtotal;
        materials.push({ ...resource, name:itemNames.get(resource.id) || resource.id, price, subtotal });
      }
      if (!sale) missing.push(row.id);
      const netSale = sale ? sale.sell_price_min * (row.recipe.amountCrafted || 1) * (1-tax) : 0;
      const profit = missing.length ? null : netSale-cost;
      const estimated = [...materials.map(item=>item.price), sale].filter(Boolean).some(item=>item.isStale);
      const fishResource = materials.find(item=>item.id.includes('_FISH_'));
      const otherMaterials = materials.filter(item=>item !== fishResource), otherCostComplete = otherMaterials.every(item=>item.subtotal !== null);
      const fishValue = sale && fishResource && otherCostComplete ? Math.max(0,(netSale-otherMaterials.reduce((sum,item)=>sum+item.subtotal,0))/fishResource.count) : 0;
      return { ...row, outputName:itemNames.get(row.id)||row.name, fishName:fishResource?.name||row.fish, fishResource, fishValue, materials, sale, cost, netSale, profit, roi:profit === null || !cost ? null : profit/cost*100, missing, estimated };
    }).sort((a,b)=>(b.profit ?? -Infinity)-(a.profit ?? -Infinity));
    for (const row of results.filter(row=>row.fishResource && row.fishValue > 0)) {
      const options = state.fishingRecipeOptions.get(row.fishResource.id) || [];
      options.push({ name:row.outputName, value:row.fishValue, estimated:row.estimated });
      state.fishingRecipeOptions.set(row.fishResource.id, options);
    }
    renderFishing();
    const valid = results.filter(row => row.profit !== null);
    $('fish-recipe-list').innerHTML = results.map((row,index)=>`<article class="fish-recipe-card ${row.profit === null ? 'unavailable' : row.profit >= 0 ? 'positive' : 'negative'}">
      <header><b class="fish-recipe-rank">#${index+1}</b><img data-item-id="${row.id}" alt=""><div><small>${row.id}</small><h3>${row.outputName}</h3><span>Pez principal: ${row.fishName}</span></div><em>Produce ×${row.recipe.amountCrafted||1}</em></header>
      <div class="fish-material-title"><strong>Necesitas para una fabricación</strong><span>${row.materials.length} ingredientes</span></div>
      <div class="fish-material-list">${row.materials.map(material=>`<div class="fish-material-row ${material.price?'':'missing'}"><img data-item-id="${material.id}" alt=""><div><strong>${material.name}</strong><small>${material.id}</small></div><b>×${material.count}</b><span>${material.price?`${silver(material.price.sell_price_min)} c/u`:'Sin precio'}</span><em>${material.subtotal===null?'—':silver(material.subtotal)}</em></div>`).join('')}</div>
      <div class="fish-recipe-totals"><div><small>COSTO DE INGREDIENTES</small><strong>${row.missing.some(id=>id!==row.id)?'Incompleto':silver(row.cost)}</strong></div><div><small>VENTA NETA</small><strong>${row.sale?silver(row.netSale):'Sin precio'}</strong></div><div><small>GANANCIA</small><strong>${row.profit===null?'No calculable':`${row.profit>=0?'+':''}${silver(row.profit)}`}</strong></div><div><small>ROI</small><strong>${row.roi===null?'—':`${row.roi.toFixed(1)}%`}</strong></div></div>
      <footer><span>${row.missing.length?`Faltan ${row.missing.length} precio${row.missing.length===1?'':'s'} de mercado`:`Datos ${row.estimated?'estimados':'recientes'} · ${ageInfo(row.sale.sell_price_min_date).text}`}</span><span>Impuesto aplicado: ${(tax*100).toFixed(1)}%</span></footer>
    </article>`).join('');
    hydrateImages($('fish-recipe-list'));
    if (valid.length) { const best=valid[0]; $('fish-best-recipe').textContent=best.name; $('fish-best-profit').textContent=`${best.profit>=0?'+':''}${silver(best.profit)} · ROI ${best.roi.toFixed(1)}% en ${cityName(city)}`; }
    else { $('fish-best-recipe').textContent='Sin receta completa'; $('fish-best-profit').textContent='Faltan precios recientes para ingredientes o venta'; }
    const recent = valid.filter(row=>!row.estimated).length, estimated = valid.length-recent;
    $('fish-price-status').textContent = `${recent} recientes · ${estimated} estimadas · ${results.length-valid.length} sin datos · ${cityName(city)}`;
    $('last-refresh').textContent = `Pesca ${new Date().toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})}`;
    toast(valid.length ? `Recetas ordenadas con ${valid.length} cálculos completos.` : 'La API no tiene precios recientes suficientes en esa ciudad.', !valid.length);
  } catch (error) { $('fish-price-status').textContent='No fue posible consultar los precios'; toast(`Pesca: ${error.message}`, true); }
  finally { button.disabled=false; button.textContent='↻ Precios y recetas'; }
}

function setupNavigation() {
  const titles = { market:'Mercado', resources:'Recursos', fishing:'Pesca', refining:'Refinamiento', craft:'Crafteo', builds:'Builds', routes:'Rutas comerciales', travel:'Mapa y viaje', opportunities:'Oportunidades', blackmarket:'Black Market', demand:'Demanda para craftear', assistant:'Asistente de Silver', favorites:'Favoritos y alertas', history:'Historial', settings:'Ajustes' };
  document.querySelectorAll('.nav').forEach(button => button.onclick = () => {
    document.querySelectorAll('.nav,.view').forEach(el => el.classList.remove('active')); button.classList.add('active'); $(`${button.dataset.view}-view`).classList.add('active'); $('page-title').textContent = titles[button.dataset.view]; document.body.dataset.view = button.dataset.view;
  });
}
async function init() {
  const config = await window.albion.bootstrap(); state.cities = config.cities;
  for (const id of ['material-city','sale-city']) $(id).innerHTML = state.cities.map(city => `<option value="${city}">${cityName(city)}</option>`).join('');
  for (const id of ['refine-material-city','refine-sale-city']) $(id).innerHTML = state.cities.map(city => `<option value="${city}">${cityName(city)}</option>`).join('');
  for (const id of ['travel-origin','travel-destination']) $(id).innerHTML = state.cities.map(city => `<option value="${city}">${cityName(city)}</option>`).join('');
  $('fish-city').innerHTML = state.cities.map(city => `<option value="${city}">${cityName(city)}</option>`).join('');
  $('sale-city').value = 'Caerleon'; $('stale-hours').value = state.staleHours;
  $('travel-origin').value = 'Bridgewatch'; $('travel-destination').value = 'Caerleon';
  $('refine-material-city').value = 'Thetford'; $('refine-sale-city').value = 'Thetford';
  $('fish-city').value = 'Caerleon';
  setupNavigation(); bindSearch('market-search','market-suggestions',selectMarketItem); bindSearch('craft-search','craft-suggestions',selectCraftItem); bindSearch('build-search','build-suggestions',addBuildItem); bindCommunityWeaponSearch();
  $('favorite-btn').onclick = toggleFavorite; $('refresh-btn').onclick = ()=>refreshSelectedPrices(true); $('calculate-btn').onclick = calculateCraft; $('scan-routes').onclick = scanRoutes;
  $('scan-opportunities').onclick = scanOpportunities; $('opportunity-sort').onchange = renderOpportunities;
  $('scan-blackmarket').onclick=scanBlackMarket; $('blackmarket-search').oninput=renderBlackMarket; $('blackmarket-sort').onchange=renderBlackMarket;
  $('blackmarket-focus-search').onclick=()=>{$('blackmarket-search').focus();$('blackmarket-search').select();};
  $('scan-demand').onclick = scanDemand;
  $('plan-travel').onclick = renderTravelPlan; $('travel-mode').onchange = renderTravelPlan;
  $('travel-swap').onclick = () => { const origin=$('travel-origin').value; $('travel-origin').value=$('travel-destination').value; $('travel-destination').value=origin; renderTravelPlan(); };
  $('market-quality').onchange = ()=>{if(state.selected)$('item-quality-chip').textContent=$('market-quality').value.includes(',')?'Todas':qualityName(Number($('market-quality').value));refreshSelectedPrices();};
  $('market-search-btn').onclick=searchMarketFirst;
  $('market-search').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();searchMarketFirst();}});
  $('clear-market-search').onclick=()=>{$('market-search').value='';$('market-suggestions').classList.remove('open');$('market-search').focus();};
  document.querySelectorAll('#market-categories button').forEach(button=>button.onclick=()=>{state.marketCategory=button.dataset.category;document.querySelectorAll('#market-categories button').forEach(item=>item.classList.toggle('active',item===button));$('market-search').dispatchEvent(new Event('input'));});
  document.querySelector('[data-market-tab="recipes"]').onclick=()=>document.querySelector('.nav[data-view="craft"]').click();
  document.querySelector('[data-market-tab="cities"]').onclick=()=>document.querySelector('.market-content-grid').scrollIntoView({behavior:'smooth',block:'start'});
  $('more-markets').onclick=()=>{state.showAllMarkets=!state.showAllMarkets;renderPrices();};
  document.querySelectorAll('.chart-periods button').forEach(button=>button.onclick=()=>{state.chartDays=Number(button.dataset.days);document.querySelectorAll('.chart-periods button').forEach(item=>item.classList.toggle('active',item===button));renderPriceChart();});
  $('view-item-map').onclick=()=>document.querySelector('.nav[data-view="travel"]').click();
  $('window-minimize').onclick=()=>window.albion.minimizeWindow(); $('window-maximize').onclick=()=>window.albion.maximizeWindow(); $('window-close').onclick=()=>window.albion.closeWindow();
  $('recipe-variant').onchange = event => renderRecipeVariant(event.target.value);
  $('craft-enchantment').onchange = async () => {
    const item = state.recipe?.item;
    if (!item) return;
    const level = Number($('craft-enchantment').value) || 0;
    const baseId = String(item.id).split('@')[0];
    await selectCraftItem({ ...item, id:level ? `${baseId}@${level}` : baseId });
  };
  $('craft-qty').addEventListener('input', renderCraftMaterialTotals);
  $('return-rate').addEventListener('input', renderCraftMaterialTotals);
  $('stale-hours').onchange = () => { state.staleHours=Number($('stale-hours').value); localStorage.setItem('albion-stale-hours',state.staleHours); $('build-freshness').textContent=`${state.staleHours} h`; if(state.prices.length)renderPrices(); };
  $('catalog-refresh').onclick = async () => { try { const result=await window.albion.refreshCatalog(); toast(`Catálogo actualizado: ${result.count.toLocaleString('es-CL')} objetos`); } catch(e){toast(e.message,true);} };
  $('scan-resources').onclick = scanResources;
  for (const id of ['fish-tier','fish-water','fish-biome','fish-sort']) $(id).onchange=renderFishing;
  $('scan-fish-recipes').onclick=scanFishingRecipes; $('fish-city').onchange=()=>{$('fish-price-status').textContent='Ciudad cambiada · vuelve a consultar';renderFishing();}; $('fish-tax').onchange=()=>{$('fish-price-status').textContent='Impuesto cambiado · vuelve a calcular';};
  $('search-community-builds').onclick = searchCommunityBuilds;
  $('community-build-search').addEventListener('keydown', event => { if(event.key === 'Enter'){ event.preventDefault(); searchCommunityBuilds(); } });
  $('community-build-mode').onchange = () => { if ($('community-build-search').value.trim()) searchCommunityBuilds(); };
  for (const id of ['build-tier','build-enchantment']) $(id).onchange = async () => { if(state.selectedCommunityBuild) await applySelectedBuildOptions(); };
  $('calculate-build').onclick = calculateBuild;
  $('clear-build').onclick = () => { state.buildItems=[]; state.buildSlots=[]; state.selectedCommunityBuild=null; state.buildRecommendations=new Map(); saveState(); renderBuild(); $('build-title').textContent='Tu build personalizada'; $('build-author').textContent='Añade objetos o selecciona una build comunitaria.'; $('build-mode-label').textContent='BUILD SELECCIONADA'; $('build-buy-summary').innerHTML='<div class="empty-card">Selecciona una build para comparar sus precios.</div>'; $('build-totals').innerHTML=''; };
  document.querySelectorAll('#build-presets button').forEach(button => button.onclick=()=>loadBuildPreset(button.dataset.preset));
  $('generate-plan').onclick = generateSilverPlan;
  document.querySelectorAll('#calculator-tabs button').forEach(button => button.onclick=()=>{ document.querySelectorAll('#calculator-tabs button,.calc-pane').forEach(el=>el.classList.remove('active')); button.classList.add('active'); $(`${button.dataset.calc}-calc`).classList.add('active'); });
  document.querySelectorAll('#refine-resource-buttons button').forEach(button => button.onclick=()=>{ state.refiningResource=button.dataset.resource; document.querySelectorAll('#refine-resource-buttons button').forEach(item=>item.classList.toggle('active',item===button)); const city=refiningResources[state.refiningResource].bonusCity; $('refine-material-city').value=city; $('refine-sale-city').value=city; state.refiningNutrition=0; updateRefiningSetup(true); });
  for (const id of ['refine-tier','refine-enchant']) $(id).onchange=()=>{state.refiningNutrition=0;updateRefiningSetup(true);};
  for (const id of ['refine-material-city','refine-sale-city']) $(id).onchange=()=>{updateRefiningSetup(true);};
  for (const id of ['refine-location','refine-daily','refine-focus','refine-heart','refine-sale-mode']) $(id).onchange=()=>{updateRefiningSetup(id==='refine-sale-mode'); if(state.refiningResult)calculateRefine();};
  for (const id of ['refine-qty','refine-price-raw','refine-price-prev','refine-price-heart','refine-price-sell','refine-station-rate',...([4,5,6,7,8].map(tier=>`refine-spec-${tier}`))]) $(id).oninput=()=>{ if($('refine-price-raw').value || $('refine-price-sell').value) calculateRefine(); };
  $('refine-tax-mode').onchange=()=>{ const custom=$('refine-tax-mode').value==='custom'; $('refine-tax-custom').disabled=!custom; if(!custom)$('refine-tax-custom').value=$('refine-tax-mode').value; if(state.refiningResult)calculateRefine(); };
  $('refine-tax-custom').oninput=()=>calculateRefine(); $('refine-load-prices').onclick=loadRefiningPrices; $('calculate-refine').onclick=calculateRefine; $('refine-save-result').onclick=saveRefiningResult;
  $('calculate-transport').onclick=calculateTransport; $('calculate-bm').onclick=calculateBlackMarket; $('calculate-spec').onclick=calculateSpecialization;
  $('save-session').onclick=saveSession;
  $('build-freshness').textContent=`${state.staleHours} h`; updateRefiningSetup(); renderFavorites(); renderBuild(); renderHistory(); renderTravelPlan(); renderFishing();
  setInterval(checkAlerts,300000); setTimeout(checkAlerts,12000);
  document.body.dataset.view = 'market';
  setInterval(() => { if (state.selected) refreshSelectedPrices(); }, 60000);
}
init();
