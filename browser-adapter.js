(function () {
  'use strict';

  const CITIES = ['Bridgewatch','Caerleon','Fort Sterling','Lymhurst','Martlock','Thetford','Brecilien','Arthurs Rest Smugglers Network','Merlyns Rest Smugglers Network','Morganas Rest Smugglers Network','Black Market'];
  const API = 'https://west.albion-online-data.com';
  const CATALOG_URL = 'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.json';
  const RECIPES_URL = 'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/items.json';
  const fallback = [
    ['T4_BAG','Bolsa del Adepto'],['T5_BAG','Bolsa del Experto'],['T6_BAG','Bolsa del Maestro'],
    ['T4_MAIN_SWORD','Espada ancha del Adepto'],['T5_MAIN_SWORD','Espada ancha del Experto'],
    ['T4_MAIN_AXE','Hacha de batalla del Adepto'],['T5_MAIN_AXE','Hacha de batalla del Experto'],
    ['T4_MAIN_FIRESTAFF','Bastón de fuego del Adepto'],['T5_MAIN_FIRESTAFF','Bastón de fuego del Experto'],
    ['T4_HEAD_PLATE_SET1','Casco de soldado del Adepto'],['T4_ARMOR_PLATE_SET1','Armadura de soldado del Adepto'],
    ['T4_SHOES_PLATE_SET1','Botas de soldado del Adepto'],['T4_HEAD_LEATHER_SET1','Capucha de mercenario del Adepto'],
    ['T4_ARMOR_LEATHER_SET1','Chaqueta de mercenario del Adepto'],['T4_SHOES_LEATHER_SET1','Zapatos de mercenario del Adepto'],
    ['T4_HEAD_CLOTH_SET1','Capucha de erudito del Adepto'],['T4_ARMOR_CLOTH_SET1','Túnica de erudito del Adepto'],
    ['T4_SHOES_CLOTH_SET1','Sandalias de erudito del Adepto'],['T4_PLANKS','Tablones de pino'],
    ['T4_METALBAR','Lingotes de acero'],['T4_CLOTH','Tela ornamentada'],['T4_LEATHER','Cuero trabajado'],
    ['T4_STONEBLOCK','Bloques de travertino'],['T4_WOOD','Troncos de pino'],['T4_ORE','Mineral de hierro'],
    ['T4_HIDE','Piel mediana'],['T4_FIBER','Algodón']
  ].map(([id,name])=>({id,name,englishName:name,description:'',tier:Number(id[1])||0}));

  let catalog = fallback;
  let catalogPromise;
  let recipeIndex;
  let recipePromise;
  let buildCatalog;
  const buildDetails = new Map();
  const fold = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim();
  const list = value => value == null ? [] : Array.isArray(value) ? value : [value];
  const number = value => Number(value || 0);

  async function fetchJson(url, timeout = 45000) {
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(), timeout);
    try {
      const response = await fetch(url, { signal:controller.signal, cache:'no-store' });
      if (!response.ok) throw new Error(`El servicio respondió ${response.status}`);
      return await response.json();
    } finally { clearTimeout(timer); }
  }

  function normalizeCatalog(raw) {
    const rows = Array.isArray(raw) ? raw : raw?.items || [], seen = new Set();
    return rows.map(item => {
      const id=item.UniqueName||item.uniqueName||item.id, names=item.LocalizedNames||item.localizedNames||{};
      const descriptions=item.LocalizedDescriptions||item.localizedDescriptions||{};
      const name=names['ES-ES']||names['EN-US']||item.name||id;
      return { id,name,englishName:names['EN-US']||name,description:descriptions['ES-ES']||descriptions['EN-US']||'',tier:/^T(\d)/.test(id||'')?Number(id[1]):0 };
    }).filter(item=>item.id&&item.name&&!seen.has(item.id)&&seen.add(item.id));
  }

  async function loadCatalog(force=false) {
    if (!force && catalog.length > fallback.length) return catalog;
    if (!force && catalogPromise) return catalogPromise;
    catalogPromise = fetchJson(CATALOG_URL, 60000).then(raw=>{ catalog=normalizeCatalog(raw); return catalog; }).catch(()=>catalog);
    return catalogPromise;
  }

  function searchCatalog(query, limit=20) {
    const q=fold(query);
    if (!q) return catalog.slice(0,limit);
    return catalog.map(item=>{
      const name=fold(item.name), en=fold(item.englishName), id=fold(item.id);
      const score=name===q||id===q?0:name.startsWith(q)?1:en.startsWith(q)?2:id.includes(q)?3:name.includes(q)?4:en.includes(q)?5:99;
      return {item,score};
    }).filter(row=>row.score<99).sort((a,b)=>a.score-b.score||a.item.name.localeCompare(b.item.name,'es')).slice(0,limit).map(row=>row.item);
  }

  async function getPrices({itemIds=[],locations=CITIES,qualities=[1]}={}) {
    const ids=[...new Set(list(itemIds).filter(Boolean))], rows=[];
    for(let index=0;index<ids.length;index+=100){
      const batch=ids.slice(index,index+100);
      const url=`${API}/api/v2/stats/prices/${batch.map(encodeURIComponent).join(',')}.json?locations=${locations.map(encodeURIComponent).join(',')}&qualities=${qualities.join(',')}&_fresh=${Date.now()}`;
      rows.push(...await fetchJson(url,30000));
    }
    return rows;
  }

  async function getPriceHistory({itemIds=[],locations=CITIES,qualities=[1],days=30}={}) {
    const ids=[...new Set(list(itemIds).filter(Boolean))], rows=[];
    const end=new Date(), start=new Date(end.getTime()-Math.max(1,Number(days)||30)*86400000), iso=d=>d.toISOString().slice(0,10);
    for(let index=0;index<ids.length;index+=100){
      const batch=ids.slice(index,index+100);
      const url=`${API}/api/v2/stats/history/${batch.map(encodeURIComponent).join(',')}.json?date=${iso(start)}&end_date=${iso(end)}&locations=${locations.map(encodeURIComponent).join(',')}&qualities=${qualities.join(',')}&time-scale=24`;
      rows.push(...await fetchJson(url,45000));
    }
    return rows;
  }

  function extractRecipes(raw) {
    const index={}, stack=[raw];
    while(stack.length){
      const node=stack.pop();
      if(!node||typeof node!=='object') continue;
      const id=node['@uniquename']||node.uniquename;
      const requirements=list(node.craftingrequirements||node.craftingRequirements);
      if(id&&requirements.length){
        const variants=requirements.map(requirement=>{
          const resources=list(requirement.craftresource||requirement.craftResource).map(resource=>({id:resource['@uniquename']||resource.uniquename,count:number(resource['@count']||resource.count),maxReturn:number(resource['@maxreturnamount']||resource.maxreturnamount)})).filter(resource=>resource.id&&resource.count>0);
          return {amountCrafted:number(node['@amountcrafted']||requirement['@amountcrafted'])||1,nutrition:number(requirement['@nutritionconsumed']||requirement.nutritionconsumed),silver:number(requirement['@silver']||requirement.silver),craftingFocus:number(requirement['@craftingfocus']||requirement.craftingfocus),resources};
        }).filter(variant=>variant.resources.length);
        if(variants.length) index[id]={itemId:id,...variants[0],variants};
      }
      for(const value of Object.values(node)) if(value&&typeof value==='object') stack.push(value);
    }
    return index;
  }

  async function loadRecipes(){
    if(recipeIndex) return recipeIndex;
    if(!recipePromise) recipePromise=fetchJson(RECIPES_URL,180000).then(raw=>(recipeIndex=extractRecipes(raw)));
    return recipePromise;
  }

  function opportunityCandidates(tiers=[4,5,6,7,8],category='all',max=300){
    const allowed=new Set(list(tiers).map(Number));
    const groups={resources:/^T[2-8]_(ORE|WOOD|FIBER|HIDE|ROCK|METALBAR|PLANKS|CLOTH|LEATHER|STONEBLOCK)(?:_LEVEL\d+)?(?:@\d+)?$/,equipment:/_(HEAD|ARMOR|SHOES|MAIN|2H|OFF|BAG|CAPE)(_|$)/,other:/_(MEAL|POTION|MOUNT)(_|$)/};
    const blocked=/(TOKEN|QUEST|SKILL|JOURNAL|FURNITURE|VANITY|UNIQUE|TREASURE|ARTEFACT)/;
    return catalog.filter(item=>allowed.has(item.tier)&&!blocked.test(item.id)).filter(item=>category==='all'?Object.values(groups).some(pattern=>pattern.test(item.id)):groups[category]?.test(item.id)).slice(0,Math.min(300,Math.max(50,Number(max)||300)));
  }

  async function scanOpportunities({tiers,category='all',locations=CITIES,qualities=[1],maxItems=300,includeEnchantments=false}={}){
    let items=opportunityCandidates(tiers,category,includeEnchantments?Math.ceil(maxItems/5):maxItems);
    if(includeEnchantments) items=items.flatMap(item=>[0,1,2,3,4].map(enchantment=>({...item,id:enchantment?`${item.id.split('@')[0]}@${enchantment}`:item.id.split('@')[0],name:enchantment?`${item.name} .${enchantment}`:item.name}))).slice(0,300);
    const prices=[]; let failedBatches=0;
    for(let index=0;index<items.length;index+=60){try{prices.push(...await getPrices({itemIds:items.slice(index,index+60).map(item=>item.id),locations,qualities}));}catch{failedBatches++;}}
    return {items,prices,scannedCount:items.length,failedBatches};
  }

  async function scanDemand({tiers=[4,5,6,7,8],category='weapons',locations=CITIES,days=30,maxItems=200}={}){
    const allowed=new Set(list(tiers).map(Number)), recipes=await loadRecipes();
    const items=catalog.filter(item=>allowed.has(item.tier)&&marketItemCategory(item.id)===category&&(recipes[item.id]||recipes[item.id.split('@')[0]])).slice(0,Math.min(200,maxItems));
    const history=[]; let failedBatches=0;
    for(let index=0;index<items.length;index+=80){try{history.push(...await getPriceHistory({itemIds:items.slice(index,index+80).map(item=>item.id),locations,qualities:[1],days}));}catch{failedBatches++;}}
    return {rows:rankDemandHistory(items,history,days,60),scannedCount:items.length,failedBatches};
  }

  async function loadBuilds(){
    if(!buildCatalog) buildCatalog=await fetchJson('data/offline-build-catalog.json',60000);
    return buildCatalog;
  }

  async function searchBuilds({query='',weaponId='',mode='all',limit=30}={}){
    const q=fold(query), rows=await loadBuilds();
    const matches=rows.filter(row=>(mode==='all'||row.mode===mode||row.modes?.includes(mode))&&(weaponId?[row.items?.[3],row.items?.[5]].some(id=>sameItemFamily(id,weaponId)):(!q||fold(row.title).includes(q)||fold(row.slug).includes(q)))).sort((a,b)=>(b.upvotes||0)-(a.upvotes||0)).slice(0,limit);
    matches.forEach(row=>buildDetails.set(row.slug,row));
    return matches.map(({items,...summary})=>summary);
  }

  async function getBuild(slug){
    const rows=await loadBuilds(), build=buildDetails.get(slug)||rows.find(row=>row.slug===slug);
    if(!build) throw new Error('No se encontró esa build offline.');
    const byId=new Map(catalog.map(item=>[item.id,item]));
    return {...build,sourceName:build.sourceName||'Catálogo offline',sourceUrl:'',items:(build.items||[]).map(id=>id?({...byId.get(id),id,name:byId.get(id)?.name||id,tier:byId.get(id)?.tier||Number(id[1])||0}):null)};
  }

  window.IS_PWA=true;
  document.documentElement.classList.add('pwa');
  window.albion={
    bootstrap:async()=>{await loadCatalog();return {cities:CITIES,server:'Américas',web:true};},
    searchItems:async(query,limit=20)=>{await loadCatalog();return searchCatalog(query,limit);},
    refreshCatalog:async()=>({count:(await loadCatalog(true)).length}),
    getPrices,getPriceHistory,scanOpportunities,scanDemand,searchBuilds,getBuild,
    planTravel:async({origin,destination})=>({available:false,dynamic:origin==='Brecilien'||destination==='Brecilien',reason:'La versión móvil muestra la guía entre ciudades; confirma las conexiones exactas dentro del juego.'}),
    getRecipe:async itemId=>{const recipes=await loadRecipes();const base=String(itemId||'').split('@')[0];return recipeForEnchantedItem(recipes[itemId]||recipes[base],itemId);},
    getItemImage:async itemId=>`https://render.albiononline.com/v1/item/${encodeURIComponent(itemId)}.png?quality=1&size=128`,
    getSpellImage:async spellId=>`https://render.albiononline.com/v1/spell/${encodeURIComponent(spellId)}.png?size=96&locale=es`,
    notify:async({title,body})=>{if('Notification'in window&&Notification.permission==='granted')new Notification(title,{body});},
    minimizeWindow:async()=>false,maximizeWindow:async()=>false,closeWindow:async()=>false
  };
})();
