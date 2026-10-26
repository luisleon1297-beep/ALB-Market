function effectiveFocusCost(baseFocus, mastery, specialization) {
  const base = Math.max(0, Number(baseFocus) || 0);
  const masteryLevel = Math.max(0, Math.min(100, Number(mastery) || 0));
  const specLevel = Math.max(0, Math.min(100, Number(specialization) || 0));
  return base * Math.pow(0.5, masteryLevel / 100) * Math.pow(0.5, specLevel / 100);
}

function craftingProfit({
  quantity = 1,
  outputPerCraft = 1,
  materialCost = 0,
  nonReturnableMaterialCost = 0,
  returnRate = 0,
  saleUnitPrice = 0,
  salesTax = 0,
  setupFee = 0,
  stationCost = 0,
  extraCost = 0
}) {
  const crafts = Math.ceil(Math.max(1, Number(quantity)) / Math.max(1, Number(outputPerCraft)));
  const rrr = Math.max(0, Math.min(0.95, Number(returnRate) / 100));
  const returnableMaterials = Math.max(0, Number(materialCost)) * crafts;
  const nonReturnableMaterials = Math.max(0, Number(nonReturnableMaterialCost)) * crafts;
  const grossMaterials = returnableMaterials + nonReturnableMaterials;
  const returnedValue = returnableMaterials * rrr;
  const netMaterials = grossMaterials - returnedValue;
  const grossRevenue = Math.max(0, Number(saleUnitPrice)) * Math.max(1, Number(quantity));
  const marketFees = grossRevenue * (Math.max(0, Number(salesTax)) + Math.max(0, Number(setupFee))) / 100;
  const totalCost = netMaterials + Math.max(0, Number(stationCost)) * crafts + Math.max(0, Number(extraCost));
  const netRevenue = grossRevenue - marketFees;
  const profit = netRevenue - totalCost;
  return {
    crafts, grossMaterials, returnedValue, netMaterials, grossRevenue,
    marketFees, totalCost, netRevenue, profit,
    margin: totalCost ? profit / totalCost * 100 : 0,
    unitProfit: profit / Math.max(1, Number(quantity))
  };
}

function craftMaterialTotals({ quantity = 1, outputPerCraft = 1, resources = [], returnRate = 0 }) {
  const requested = Math.max(1, Math.floor(Number(quantity) || 1));
  const output = Math.max(1, Math.floor(Number(outputPerCraft) || 1));
  const crafts = Math.ceil(requested / output);
  const rate = Math.max(0, Math.min(95, Number(returnRate) || 0)) / 100;
  return {
    requested,
    crafts,
    produced:crafts * output,
    materials:resources.map(resource => {
      const perCraft = Math.max(0, Number(resource.count) || 0);
      const total = perCraft * crafts;
      const returnable = resource.maxReturn !== 0;
      return {
        ...resource,
        perCraft,
        total,
        returnable,
        estimatedReturned:returnable ? total * rate : 0,
        estimatedConsumed:returnable ? total * (1 - rate) : total
      };
    })
  };
}

function itemEnchantment(itemId = '') {
  const match = String(itemId).match(/@([1-4])$/);
  return match ? Number(match[1]) : 0;
}

function materialIdForEnchantment(resourceId = '', outputItemId = '') {
  const enchantment = itemEnchantment(outputItemId);
  const base = String(resourceId).split('@')[0].replace(/_LEVEL[1-4]$/, '');
  const enchantableMaterial = /^T[2-8]_(ORE|WOOD|FIBER|HIDE|ROCK|METALBAR|PLANKS|CLOTH|LEATHER|STONEBLOCK)$/.test(base);
  if (!enchantableMaterial) return resourceId;
  return enchantment ? `${base}_LEVEL${enchantment}@${enchantment}` : base;
}

function recipeForEnchantedItem(recipe, outputItemId) {
  if (!recipe) return null;
  const sourceVariants = recipe.variants?.length ? recipe.variants : [recipe];
  const variants = sourceVariants.map(variant => ({
    ...variant,
    resources:(variant.resources || []).map(resource => ({
      ...resource,
      id:materialIdForEnchantment(resource.id, outputItemId)
    }))
  }));
  return { ...recipe, ...variants[0], variants, itemId:outputItemId, baseItemId:recipe.itemId, enchantment:itemEnchantment(outputItemId) };
}

function bestTrade(prices, taxPercent = 6.5) {
  const usable = prices.filter(p => p.sell_price_min > 0 || p.buy_price_max > 0);
  let best = null;
  for (const source of usable) {
    if (!source.sell_price_min) continue;
    for (const target of usable) {
      if (source.city === target.city || !target.buy_price_max) continue;
      const netSale = target.buy_price_max * (1 - Math.max(0, taxPercent) / 100);
      const profit = netSale - source.sell_price_min;
      if (!best || profit > best.profit) {
        best = {
          itemId: source.item_id,
          buyCity: source.city,
          buyPrice: source.sell_price_min,
          sellCity: target.city,
          sellPrice: target.buy_price_max,
          profit,
          margin: source.sell_price_min ? profit / source.sell_price_min * 100 : 0,
          buyUpdated: source.sell_price_min_date,
          sellUpdated: target.buy_price_max_date
        };
      }
    }
  }
  return best;
}

function aggregatePricesByCity(prices, cities) {
  return cities.map(city => {
    const rows = prices.filter(row => row.city === city);
    const sell = rows.filter(row => row.sell_price_min > 0).sort((a, b) => a.sell_price_min - b.sell_price_min)[0];
    const buy = rows.filter(row => row.buy_price_max > 0).sort((a, b) => b.buy_price_max - a.buy_price_max)[0];
    return {
      item_id: sell?.item_id || buy?.item_id,
      city,
      sell_price_min: sell?.sell_price_min || 0,
      sell_price_min_date: sell?.sell_price_min_date,
      sell_quality: sell?.quality || 0,
      sell_source: sell?.sell_source || sell?.source || '',
      buy_price_max: buy?.buy_price_max || 0,
      buy_price_max_date: buy?.buy_price_max_date,
      buy_quality: buy?.quality || 0,
      buy_source: buy?.buy_source || buy?.source || ''
    };
  });
}

function addHistoricalFallback(pricesByCity, history) {
  return pricesByCity.map(row => {
    if (row.sell_price_min > 0) return row;
    const candidates = history
      .filter(entry => entry.location === row.city && Array.isArray(entry.data))
      .flatMap(entry => entry.data.map(point => ({ ...point, quality: entry.quality, item_id: entry.item_id })))
      .filter(point => point.avg_price > 0 && point.timestamp)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const latest = candidates[0];
    if (!latest) return row;
    return {
      ...row,
      item_id: row.item_id || latest.item_id,
      sell_price_min: latest.avg_price,
      sell_price_min_date: latest.timestamp,
      sell_quality: latest.quality || 0,
      sell_historical: true,
      sell_item_count: latest.item_count || 0
    };
  });
}

function marketSellReference(prices, history, itemId, city) {
  const current = prices
    .filter(row => row.item_id === itemId && row.city === city && row.sell_price_min > 0)
    .sort((a, b) => a.sell_price_min - b.sell_price_min)[0];
  if (current) {
    return {
      price: current.sell_price_min,
      date: current.sell_price_min_date,
      quality: current.quality || 0,
      historical: false
    };
  }
  const latest = history
    .filter(entry => entry.item_id === itemId && entry.location === city && Array.isArray(entry.data))
    .flatMap(entry => entry.data.map(point => ({ ...point, quality: entry.quality })))
    .filter(point => point.avg_price > 0 && point.timestamp)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
  if (!latest) return null;
  return {
    price: latest.avg_price,
    date: latest.timestamp,
    quality: latest.quality || 0,
    historical: true,
    itemCount: latest.item_count || 0
  };
}

function refiningReturnRate({ bonusCity = false, focus = false, dailyBonus = 0 } = {}) {
  const productionBonus = 18 + (bonusCity ? 40 : 0) + (focus ? 59 : 0) + Math.max(0, Number(dailyBonus) || 0);
  return 1 - (1 / (1 + productionBonus / 100));
}

function refiningFocusCost({ tier = 4, enchantment = 0, specs = {} } = {}) {
  const baseByTier = { 4:44, 5:78, 6:140, 7:250, 8:503 };
  const enchantmentScale = [1, 1.75, 3.06, 5.36, 9.38];
  const selected = Math.max(0, Math.min(100, Number(specs[tier]) || 0));
  const family = Object.entries(specs).reduce((sum, [specTier, level]) => sum + (Number(specTier) === Number(tier) ? 0 : Math.max(0, Math.min(100, Number(level) || 0))), 0);
  const efficiency = selected * 250 + family * 30;
  const base = (baseByTier[tier] || baseByTier[4]) * (enchantmentScale[enchantment] || 1);
  return Math.max(1, Math.ceil(base * Math.pow(0.5, efficiency / 10000)));
}

function calculateRefiningBatch({
  quantity = 1, rawPerOutput = 2, rawPrice = 0, previousPerOutput = 1, previousPrice = 0,
  heartPerOutput = 0, heartPrice = 0, sellPrice = 0, returnRate = 0,
  marketTax = 0, stationRate = 0, nutrition = 0, focusPerUnit = 0
} = {}) {
  const qty = Math.max(1, Number(quantity) || 1);
  const consumed = Math.max(0, 1 - Math.max(0, Math.min(0.95, Number(returnRate) || 0)));
  const rawRequired = qty * Math.max(0, Number(rawPerOutput) || 0) * consumed;
  const previousRequired = qty * Math.max(0, Number(previousPerOutput) || 0) * consumed;
  const heartRequired = qty * Math.max(0, Number(heartPerOutput) || 0);
  const rawCost = rawRequired * Math.max(0, Number(rawPrice) || 0);
  const previousCost = previousRequired * Math.max(0, Number(previousPrice) || 0);
  const heartCost = heartRequired * Math.max(0, Number(heartPrice) || 0);
  const stationFee = Math.max(0, Number(stationRate) || 0) / 100 * Math.max(0, Number(nutrition) || 0) * qty;
  const materialCost = rawCost + previousCost + heartCost;
  const investment = materialCost + stationFee;
  const grossRevenue = qty * Math.max(0, Number(sellPrice) || 0);
  const tax = grossRevenue * Math.max(0, Number(marketTax) || 0) / 100;
  const sellRevenue = grossRevenue - tax;
  const profit = sellRevenue - investment;
  const focusTotal = Math.max(0, Number(focusPerUnit) || 0) * qty;
  return {
    quantity:qty, rawRequired, previousRequired, heartRequired, rawCost, previousCost, heartCost,
    materialCost, stationFee, investment, grossRevenue, tax, sellRevenue, profit,
    margin:investment > 0 ? profit / investment * 100 : 0,
    focusTotal
  };
}

function marketItemCategory(itemId = '') {
  const id = String(itemId).toUpperCase().split('@')[0];
  if (!id) return 'other';
  if (/_TOOL(_|$)|_(PICKAXE|SICKLE|SKINNER|STONEHAMMER)(_|$)/.test(id)) return 'tools';
  if (/_(HEAD|ARMOR|SHOES|CAPE|BAG)(_|$)/.test(id)) return 'armor';
  if (/_(MEAL|POTION|FOOD|FISH|ALCOHOL)(_|$)/.test(id)) return 'consumables';
  if (/_MOUNT(_|$)|^T\d+_MOUNT_/.test(id)) return 'mounts';
  if (/^T\d+_(MAIN|2H|OFF)_/.test(id) && !/_TOOL(_|$)/.test(id)) return 'weapons';
  if (/_(ORE|WOOD|FIBER|HIDE|ROCK|METALBAR|PLANKS|CLOTH|LEATHER|STONEBLOCK)(_|$)/.test(id)) return 'resources';
  return 'other';
}

function rankDemandHistory(items = [], history = [], days = 30, limit = 50) {
  const period = Math.max(1, Number(days) || 30);
  const entriesByItem = new Map();
  for (const entry of history) {
    if (!entry?.item_id || !Array.isArray(entry.data)) continue;
    if (!entriesByItem.has(entry.item_id)) entriesByItem.set(entry.item_id, []);
    entriesByItem.get(entry.item_id).push(entry);
  }
  return items.map(item => {
    const cities = new Map();
    for (const entry of entriesByItem.get(item.id) || []) {
      const city = entry.location || 'Sin ciudad';
      if (!cities.has(city)) cities.set(city, { city, volume:0, weightedValue:0, prices:[], newest:null });
      const stats = cities.get(city);
      for (const point of entry.data) {
        const volume = Math.max(0, Number(point.item_count) || 0);
        const price = Math.max(0, Number(point.avg_price) || 0);
        stats.volume += volume;
        stats.weightedValue += price * volume;
        if (price > 0) stats.prices.push(price);
        if (point.timestamp && (!stats.newest || new Date(point.timestamp) > new Date(stats.newest))) stats.newest = point.timestamp;
      }
    }
    const markets = [...cities.values()];
    const totalVolume = markets.reduce((sum, market) => sum + market.volume, 0);
    const best = markets.sort((a, b) => b.volume - a.volume)[0];
    const totalWeightedValue = markets.reduce((sum, market) => sum + market.weightedValue, 0);
    const fallbackPrices = markets.flatMap(market => market.prices);
    const averagePrice = totalVolume > 0 ? totalWeightedValue / totalVolume : fallbackPrices.length ? fallbackPrices.reduce((sum, price) => sum + price, 0) / fallbackPrices.length : 0;
    const newest = markets.map(market => market.newest).filter(Boolean).sort().at(-1) || null;
    return { item, volume:totalVolume, unitsPerDay:totalVolume / period, city:best?.city || '', cityVolume:best?.volume || 0, averagePrice, updated:newest };
  }).filter(row => row.volume > 0).sort((a, b) => b.volume - a.volume || b.averagePrice - a.averagePrice).slice(0, Math.max(1, Number(limit) || 50));
}

function planCityRoute(origin, destination, mode = 'safe') {
  const royalRing = ['Fort Sterling', 'Thetford', 'Lymhurst', 'Bridgewatch', 'Martlock'];
  const rests = new Set(['Arthurs Rest Smugglers Network', 'Merlyns Rest Smugglers Network', 'Morganas Rest Smugglers Network']);
  const normalize = city => city === 'Black Market' ? 'Caerleon' : city;
  const from = normalize(origin), to = normalize(destination);
  if (!from || !to) return null;
  if (origin === destination) return { nodes:[origin], risk:'Sin viaje', riskClass:'safe', summary:'Ya estás en el destino.', steps:['No necesitas cambiar de ciudad.'], dynamic:false };

  const prefix = origin === 'Black Market' ? ['Sal del Mercado Negro hacia Caerleon.'] : [];
  const suffix = destination === 'Black Market' ? ['Al llegar a Caerleon, entra al edificio del Mercado Negro.'] : [];
  if (from === to) return { nodes:[origin, destination], risk:'Ciudad', riskClass:'safe', summary:'El Mercado Negro se encuentra dentro de Caerleon.', steps:[...prefix, ...suffix], dynamic:false };

  if (from === 'Brecilien' || to === 'Brecilien') {
    return {
      nodes:[origin, destination], risk:'Ruta dinámica', riskClass:'warning',
      summary:'Brecilien no tiene una carretera fija hacia las ciudades reales.',
      steps:[...prefix, 'Revisa el Planificador de Viajes y su tarifa si ya tienes Brecilien desbloqueada.', 'Para viajar por el mundo, busca una conexión disponible mediante Mists o Roads of Avalon.', 'Confirma la salida en el mapa antes de transportar objetos costosos.', ...suffix], dynamic:true
    };
  }

  if (rests.has(from) || rests.has(to)) {
    return {
      nodes:[origin, destination], risk:'Zona negra', riskClass:'danger',
      summary:'Los Rests están en Outlands y el trayecto atraviesa zonas negras de PvP completo.',
      steps:[...prefix, 'Abre el mapa mundial y localiza el Rest y el Realm Gate más conveniente.', 'Planifica el recorrido zona por zona y evita rutas con actividad hostil.', 'Usa montura de transporte, equipo de escape y no lleves más de lo que puedas perder.', ...suffix], dynamic:true
    };
  }

  if (from === 'Caerleon' || to === 'Caerleon' || mode === 'fast') {
    const nodes = from === 'Caerleon' || to === 'Caerleon' ? [origin, destination] : [origin, 'Caerleon', destination];
    return {
      nodes, risk:'Zona roja', riskClass:'danger',
      summary:mode === 'fast' && from !== 'Caerleon' && to !== 'Caerleon' ? 'Ruta rápida por Caerleon; puede ser más corta, pero atraviesa zonas rojas.' : 'Caerleon está rodeada por zonas rojas con PvP y pérdida de inventario.',
      steps:[...prefix, 'Selecciona el destino en el mapa del juego y activa la ruta.', 'Sigue el recorrido hacia Caerleon comprobando las zonas rojas y jugadores hostiles.', ...(nodes.length === 3 ? [`Desde Caerleon continúa hacia ${destination}.`] : []), 'Revisa cada salida antes de cruzar y evita transportar sin equipo de escape.', ...suffix], dynamic:false
    };
  }

  const start = royalRing.indexOf(from), end = royalRing.indexOf(to);
  if (start >= 0 && end >= 0) {
    const clockwise = [], counter = [];
    for (let i = start; ; i = (i + 1) % royalRing.length) { clockwise.push(royalRing[i]); if (i === end) break; }
    for (let i = start; ; i = (i - 1 + royalRing.length) % royalRing.length) { counter.push(royalRing[i]); if (i === end) break; }
    const path = clockwise.length <= counter.length ? clockwise : counter;
    return {
      nodes:path, risk:'Azul/amarilla', riskClass:'safe',
      summary:'Ruta recomendada entre ciudades reales evitando Caerleon y las zonas rojas.',
      steps:path.slice(1).map(city => `Sigue en el mapa la ruta segura hacia ${city} y mantente en zonas azules o amarillas.`), dynamic:false
    };
  }

  return { nodes:[origin, destination], risk:'Comprobar mapa', riskClass:'warning', summary:'No existe una ruta general guardada para esta combinación.', steps:['Abre el mapa interactivo y calcula el trayecto zona por zona.'], dynamic:true };
}

function findRouteInWorldMap(locations, startId, endId, mode = 'safe') {
  const allowedCategories = new Set(['openworld', 'city', 'passage', 'portalcity', 'rest', 'startingcity']);
  const nodes = new Map((locations || [])
    .filter(node => node?.id && node.isPathfinderRouteCore === true && allowedCategories.has(node.mapCategory))
    .map(node => [node.id, node]));
  if (!nodes.has(startId) || !nodes.has(endId)) return null;
  const riskCost = category => mode === 'fast' ? 1 : ({ blue:1, yellow:2, red:30, black:80, other:12 }[category] || 12);
  const distance = new Map([[startId, 0]]), previous = new Map(), pending = new Set([startId]);
  while (pending.size) {
    let current = null, currentDistance = Infinity;
    for (const id of pending) {
      const value = distance.get(id) ?? Infinity;
      if (value < currentDistance) { current = id; currentDistance = value; }
    }
    pending.delete(current);
    if (current === endId) break;
    const node = nodes.get(current);
    for (const neighbourId of node.neighbours || []) {
      const neighbour = nodes.get(neighbourId);
      if (!neighbour) continue;
      const candidate = currentDistance + riskCost(neighbour.pvpCategory);
      if (candidate < (distance.get(neighbourId) ?? Infinity)) {
        distance.set(neighbourId, candidate);
        previous.set(neighbourId, current);
        pending.add(neighbourId);
      }
    }
  }
  if (!distance.has(endId)) return null;
  const ids = [];
  for (let id = endId; id; id = previous.get(id)) { ids.push(id); if (id === startId) break; }
  if (ids.at(-1) !== startId) return null;
  return ids.reverse().map(id => {
    const node = nodes.get(id);
    return { id, name:node.displayName || node.name || id, pvpCategory:node.pvpCategory || 'other', tier:Number(node.tier) || 0, mapCategory:node.mapCategory };
  });
}

function buildWorldMapView(locations) {
  const allowedCategories = new Set(['openworld', 'city', 'passage', 'portalcity', 'rest', 'startingcity']);
  const positioned = (locations || []).filter(node => {
    const position = node?.worldmapposition;
    return node?.id && node.isPathfinderRouteCore === true && allowedCategories.has(node.mapCategory) &&
      Array.isArray(position) && Number.isFinite(Number(position[0])) && Number.isFinite(Number(position[1]));
  });
  if (!positioned.length) return { width:1000, height:650, nodes:[], edges:[] };

  const width = 1000, height = 650, padding = 34;
  const xs = positioned.map(node => Number(node.worldmapposition[0]));
  const ys = positioned.map(node => Number(node.worldmapposition[1]));
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const xRange = Math.max(1, maxX - minX), yRange = Math.max(1, maxY - minY);
  const nodes = positioned.map(node => ({
    id:node.id,
    name:node.displayName || node.name || node.id,
    x:Math.round((padding + ((Number(node.worldmapposition[0]) - minX) / xRange) * (width - padding * 2)) * 10) / 10,
    y:Math.round((height - padding - ((Number(node.worldmapposition[1]) - minY) / yRange) * (height - padding * 2)) * 10) / 10,
    pvpCategory:node.pvpCategory || 'other',
    mapCategory:node.mapCategory,
    tier:Number(node.tier) || 0,
    lng:Math.round((Number(node.worldmapposition[0]) / 3 + 427.56866455078125 / 3) * 100000) / 100000,
    lat:Math.round((Number(node.worldmapposition[1]) / 3 - 595.3439331054688 / 3) * 100000) / 100000
  }));
  const ids = new Set(nodes.map(node => node.id));
  const edges = [], edgeKeys = new Set();
  for (const node of positioned) {
    for (const neighbourId of node.neighbours || []) {
      if (!ids.has(neighbourId)) continue;
      const edge = [node.id, neighbourId].sort(), key = edge.join('|');
      if (!edgeKeys.has(key)) { edgeKeys.add(key); edges.push(edge); }
    }
  }
  return { width, height, nodes, edges };
}

const BUILD_EQUIPMENT_SLOTS = new Set([0, 1, 2, 3, 4, 5, 7]);

function itemFamilyId(itemId = '') {
  return String(itemId || '').split('@')[0].replace(/^T\d_/, 'T_');
}

function sameItemFamily(left = '', right = '') {
  return Boolean(left && right && itemFamilyId(left) === itemFamilyId(right));
}

function buildItemForTier(itemId = '', tier = 8, enchantment = 0, slotIndex = 0) {
  if (!itemId || !BUILD_EQUIPMENT_SLOTS.has(Number(slotIndex))) return itemId;
  const base = String(itemId).split('@')[0].replace(/^T\d_/, `T${Math.max(4, Math.min(8, Number(tier) || 8))}_`);
  const level = Math.max(0, Math.min(4, Number(enchantment) || 0));
  return level ? `${base}@${level}` : base;
}

function prepareCommunityBuild(items = [], tier = 8, enchantment = 0) {
  const slots = items.map((id, index) => ({ index, sourceId:id, id:buildItemForTier(id, tier, enchantment, index) }));
  const seen = new Set();
  const purchaseIds = slots.filter(slot => slot.id && !seen.has(slot.id) && seen.add(slot.id)).map(slot => slot.id);
  return { slots, purchaseIds };
}

function fishChopYield({ tier = 1, rarity = 'common' } = {}) {
  if (rarity === 'boss') return 200;
  if (rarity === 'rare') return ({ 3:10, 5:20, 7:30 })[Number(tier)] || 0;
  return ({ 1:1, 2:2, 3:3, 4:4, 5:6, 6:8, 7:10, 8:14 })[Number(tier)] || 0;
}

function bestFishAction({ sellOrder = 0, buyOrder = 0, tax = 0, choppedPrice = 0, chopYield = 0, recipeOptions = [] } = {}) {
  const saleFactor = 1 - Math.max(0, Math.min(1, Number(tax) || 0));
  const options = [
    { type:'sell', label:'Vender con orden', value:Math.max(0, Number(sellOrder) || 0) * saleFactor },
    { type:'instant', label:'Venta inmediata', value:Math.max(0, Number(buyOrder) || 0) * saleFactor },
    { type:'chop', label:'Picar y vender', value:Math.max(0, Number(choppedPrice) || 0) * Math.max(0, Number(chopYield) || 0) * saleFactor }
  ];
  for (const recipe of recipeOptions || []) {
    options.push({ type:'cook', label:`Cocinar ${recipe.name || 'receta'}`, value:Math.max(0, Number(recipe.value) || 0), estimated:Boolean(recipe.estimated) });
  }
  const available = options.filter(option => option.value > 0).sort((a,b)=>b.value-a.value);
  return { best:available[0] || null, options };
}

if (typeof module !== 'undefined') module.exports = { effectiveFocusCost, craftingProfit, craftMaterialTotals, itemEnchantment, materialIdForEnchantment, recipeForEnchantedItem, bestTrade, aggregatePricesByCity, addHistoricalFallback, marketSellReference, refiningReturnRate, refiningFocusCost, calculateRefiningBatch, marketItemCategory, rankDemandHistory, planCityRoute, findRouteInWorldMap, buildWorldMapView, itemFamilyId, sameItemFamily, buildItemForTier, prepareCommunityBuild, fishChopYield, bestFishAction };
