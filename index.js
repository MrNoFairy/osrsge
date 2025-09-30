const API_LATEST = "https://prices.runescape.wiki/api/v1/osrs/latest";
const API_MAPPING = "https://prices.runescape.wiki/api/v1/osrs/mapping";
const API_FIVEMIN = "https://prices.runescape.wiki/api/v1/osrs/1h";

const alchableItemIds = [
  // Adamant items
  1123, 1073, 1091, 1199, 1161, 1183, 1301, 1331, 1317, 1371, 1345, 1420,
  // Rune items
  1127, 1079, 1093, 1201, 1163, 1185, 1303, 1333, 1319, 1373, 1347, 1432, 1381, 1383, 1385, 1387,
  // Dragon items
  1187, 1215, 1305, 4587, 1377, 1434, 7158, 3204,
  // Other profitable alchables
  1391, 1393, 1395, 1397, 1399, 861, 6585, 1712, 1725, 11128
];

const flippingItemIds = [
  1127, 1079, 1093, 1201, 1163, 1185, 1303, 1333, 1319, 1373, 1347, 1432, 1381, 1383, 1385, 1387,
];

// Unfinished potion mappings
const herbloreMapping = [
  { grimyId: 199, grimyName: "Grimy guam leaf", cleanId: 249, cleanName: "Guam leaf", potionId: 91, potionName: "Guam potion (unf)" },
  { grimyId: 201, grimyName: "Grimy marrentill", cleanId: 251, cleanName: "Marrentill", potionId: 93, potionName: "Marrentill potion (unf)" },
  { grimyId: 203, grimyName: "Grimy tarromin", cleanId: 253, cleanName: "Tarromin", potionId: 95, potionName: "Tarromin potion (unf)" },
  { grimyId: 205, grimyName: "Grimy harralander", cleanId: 255, cleanName: "Harralander", potionId: 97, potionName: "Harralander potion (unf)" },
  { grimyId: 207, grimyName: "Grimy ranarr weed", cleanId: 257, cleanName: "Ranarr weed", potionId: 99, potionName: "Ranarr potion (unf)" },
  { grimyId: 3049, grimyName: "Grimy toadflax", cleanId: 2998, cleanName: "Toadflax", potionId: 3002, potionName: "Toadflax potion (unf)" },
  { grimyId: 209, grimyName: "Grimy irit leaf", cleanId: 261, cleanName: "Irit leaf", potionId: 101, potionName: "Irit potion (unf)" },
  { grimyId: 211, grimyName: "Grimy avantoe", cleanId: 263, cleanName: "Avantoe", potionId: 103, potionName: "Avantoe potion (unf)" },
  { grimyId: 213, grimyName: "Grimy kwuarm", cleanId: 265, cleanName: "Kwuarm", potionId: 105, potionName: "Kwuarm potion (unf)" },
  { grimyId: 3051, grimyName: "Grimy snapdragon", cleanId: 3000, cleanName: "Snapdragon", potionId: 3004, potionName: "Snapdragon potion (unf)" },
  { grimyId: 215, grimyName: "Grimy cadantine", cleanId: 269, cleanName: "Cadantine", potionId: 107, potionName: "Cadantine potion (unf)" },
  { grimyId: 2485, grimyName: "Grimy lantadyme", cleanId: 2481, cleanName: "Lantadyme", potionId: 2483, potionName: "Lantadyme potion (unf)" },
  { grimyId: 217, grimyName: "Grimy dwarf weed", cleanId: 267, cleanName: "Dwarf weed", potionId: 109, potionName: "Dwarf weed potion (unf)" },
  { grimyId: 219, grimyName: "Grimy torstol", cleanId: 269, cleanName: "Torstol", potionId: 111, potionName: "Torstol potion (unf)" },
  { grimyId: 30094, grimyName: "Grimy huasca", cleanId: 30097, cleanName: "Huasca", potionId: 30100, potionName: "Huasca potion (unf)" }
];

// Secondaries mappings
const secondaryMapping = [
  { rawId: 235, rawName: "Unicorn horn", processedId: 237, processedName: "Unicorn horn dust" },
  { rawId: 1973, rawName: "Chocolate bar", processedId: 1975, processedName: "Chocolate dust" },
  { rawId: 243, rawName: "Blue dragon scale", processedId: 241, processedName: "Dragon scale dust" },
  { rawId: 5075, rawName: "Bird nest", processedId: 6691, processedName: "Crushed nest" },
  { rawId: 22124, rawName: "Supererior dragon bones", processedId: 21975, processedName: "Crushed superior dragon bones" },
  { rawId: 11994, rawName: "Lava dragon scale", processedId: 11995, processedName: "Lava scale shard" }
];

function formatGp(n) {
  return typeof n === "number" ? n.toLocaleString() + " gp" : "—";
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${url}`);
  return res.json();
}

async function loadPricesAndMapping() {
  const [latest, mapping, fivemin] = await Promise.all([
    fetchJson(API_LATEST),
    fetchJson(API_MAPPING),
    fetchJson(API_FIVEMIN)
  ]);

  return {
    prices: latest.data,
    mapping: mapping.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {}),
    fivemin: fivemin.data
  };
}

function displayAlchProfits(prices, mapping, useLowMargin) {
  const tbody = document.querySelector("#alch-table tbody");
  tbody.innerHTML = "";

  // Get Nature Rune price as fee for alchables
  const natureRuneId = 561;
  const natureRuneFee = useLowMargin
  ? prices[natureRuneId]?.low || 0 
  : prices[natureRuneId]?.high || 0;

  // Prepare array with profit to sort
  const itemsWithProfit = alchableItemIds.map(id => {
    const item = mapping[id];
    const price = useLowMargin
    ? prices[id]?.high || 0 
	: prices[id]?.low || 0;
    const alchValue = item?.highalch || 0;
    const profit = alchValue - price - natureRuneFee;

    return { id, name: item ? item.name : "Unknown", price, alchValue, profit };
  });

  // Sort descending by profit
  itemsWithProfit.sort((a, b) => b.profit - a.profit);

  //filter the top 10
  const top10Items = itemsWithProfit.slice(0, 10);

  for (const item of top10Items) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${formatGp(item.price)}</td>
      <td>${formatGp(item.alchValue)}</td>
      <td>${formatGp(natureRuneFee)}</td>
      <td class="${item.profit >= 0 ? 'profit-positive' : 'profit-negative'}">${formatGp(item.profit)}</td>
    `;
    tbody.appendChild(tr);
  }
}

function displayFlippingProfits(prices, mapping, fivemin) {
  const tbody = document.querySelector("#flipping-table tbody");
  tbody.innerHTML = "";

    // Prepare array with flipping data to calculate profits
    const itemsWithProfit = Object.keys(prices).map(id => {
    const item = mapping[id];
    const lowPrice = prices[id]?.low || 0;
    const highPrice = prices[id]?.high || 0;

    // Assuming that profit is calculated as the difference between high and low prices
    const profit = highPrice - lowPrice;
    const fee = Math.floor(highPrice/100*2);
    const lowVolume = fivemin[id]?.lowPriceVolume || 0;
    const highVolume = fivemin[id]?.highPriceVolume || 0;
    const finalProfit = profit - fee;


    return { 
      id, 
      name: item ? item.name : "Unknown", 
      lowPrice, 
      highPrice, 
      profit, 
      fee, 
      lowVolume, 
      highVolume,
	  finalProfit
    };
  });

  // Filter by finalprofit and volume both sides
const filteredItems = itemsWithProfit.reduce((acc, item) => {
  if (item.lowPrice <= 5000000 &&
      item.finalProfit >= 500000 && 
      item.lowVolume >= 10 && 
      item.highVolume >= 10) {
    // Modify item for this case
    acc.push({ ...item, filterCategory: "1 x 500k 0.1ROI" });
  } else if (item.lowPrice <= 500000 &&
             item.finalProfit >= 50000 && 
             item.lowVolume >= 100 && 
             item.highVolume >= 100) {
    acc.push({ ...item, filterCategory: "10 x 50k 0.1ROI" });
  } else if (item.lowPrice <= 50000 &&
             item.finalProfit >= 5000 && 
             item.lowVolume >= 1000 && 
             item.highVolume >= 1000) {
    acc.push({ ...item, filterCategory: "100 x 5k  0.1ROI" });
  } else if (item.lowPrice <= 5000 &&
             item.finalProfit >= 500 && 
             item.lowVolume >= 10000 && 
             item.highVolume >= 10000) {
    acc.push({ ...item, filterCategory: "1k x 500 0.1ROI" });
  } else if (item.lowPrice <= 500 &&
             item.finalProfit >= 50 && 
             item.lowVolume >= 100000 && 
             item.highVolume >= 100000) {
    acc.push({ ...item, filterCategory: "10k x 50 0.1ROI" });
  }
  //switch
	else if (item.lowPrice <= 10000000 &&
      item.finalProfit >= 1000000 && 
      item.lowVolume >= 50 && 
      item.highVolume >= 50) {
    // Modify item for this case
    acc.push({ ...item, filterCategory: "5 x 100k 0.2ROI" });
  } else if (item.lowPrice <= 500000 &&
             item.finalProfit >= 10000 && 
             item.lowVolume >= 500 && 
             item.highVolume >= 500) {
    acc.push({ ...item, filterCategory: "50 x 10k 0.2ROI" });
  } else if (item.lowPrice <= 50000 &&
             item.finalProfit >= 1000 && 
             item.lowVolume >= 5000 && 
             item.highVolume >= 5000) {
    acc.push({ ...item, filterCategory: "500 x 1k  0.1ROI" });
  } else if (item.lowPrice <= 5000 &&
             item.finalProfit >= 100 && 
             item.lowVolume >= 50000 && 
             item.highVolume >= 50000) {
    acc.push({ ...item, filterCategory: "5k x 100 0.1ROI" });
  }
  //Fastflip
  else if (item.finalProfit >= 5 && 
             item.lowVolume >= 100000 && 
             item.highVolume >= 100000) {
    acc.push({ ...item, filterCategory: "Fastflip 5" });
  }
  return acc;
}, []);


  // Sort by profit, descending
  filteredItems.sort((a, b) => b.finalProfit - a.finalProfit);

  // Display each item in the table
  filteredItems.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${formatGp(item.lowPrice)}</td>
      <td>${formatGp(item.highPrice)}</td>
      <td class="${item.profit >= 0 ? 'profit-positive' : 'profit-negative'}">${formatGp(item.profit)}</td>
      <td>${formatGp(item.fee)}</td>
      <td>${item.lowVolume}</td>
      <td>${item.highVolume}</td>
	  <td>${item.filterCategory}</td>
      <td class="${item.finalProfit >= 0 ? 'profit-positive' : 'profit-negative'}">${formatGp(item.finalProfit)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function displayPotionProfits(prices, mapping, useLowMargin) {
  const tbody = document.querySelector("#potion-table tbody");
  tbody.innerHTML = "";
  const vialOfWaterId = 227;
  const fee = 200;
  
  const vialPrice = useLowMargin
    ? prices[vialOfWaterId]?.high || 0 
    : prices[vialOfWaterId]?.low || 0;

  // Prepare array with profit info
  const potionsWithProfit = herbloreMapping.map(item => {
    const cleanPrice = useLowMargin
    ? prices[item.cleanId]?.high || 0 
    : prices[item.cleanId]?.low || 0;
	
	const potionPrice = useLowMargin
    ? prices[item.potionId]?.low || 0 
    : prices[item.potionId]?.high || 0;

    const totalCost = cleanPrice + vialPrice + fee;
    const profit = potionPrice - totalCost;
    const profitTaxed = Math.floor(profit - (profit/100*2))
    return { ...item, cleanPrice, potionPrice, vialPrice, totalCost, profitTaxed };
  });

  // Sort descending by profit
  potionsWithProfit.sort((a, b) => b.profitTaxed - a.profitTaxed);

  for (let item of potionsWithProfit) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.cleanName}</td>
      <td>${formatGp(item.cleanPrice)}</td>
      <td>${formatGp(item.vialPrice)}</td>
      <td>${formatGp(fee)}</td>
      <td>${formatGp(item.totalCost)}</td>
      <td>${item.potionName}</td>
      <td>${formatGp(item.potionPrice)}</td>
      <td class="${item.profitTaxed >= 0 ? 'profit-positive' : 'profit-negative'}">${formatGp(item.profitTaxed)}</td>
    `;
    tbody.appendChild(tr);
  }
}

function displayDegrimProfits(prices, mapping, useLowMargin) {
  const tbody = document.querySelector("#degrim-table tbody");
  tbody.innerHTML = "";
  const fee = 200;

  // Prepare array with profit info
  const potionsWithProfit = herbloreMapping.map(item => {
    const grimyPrice = useLowMargin
    ? prices[item.grimyId]?.high || 0 
    : prices[item.grimyId]?.low || 0;
	
	const cleanPrice = useLowMargin
    ? prices[item.cleanId]?.low || 0 
    : prices[item.cleanId]?.high || 0;

    const totalCost = grimyPrice + fee;
    const profit = cleanPrice - totalCost;
	const profitTaxed = Math.floor(profit - (profit/100*2))
    return { ...item, grimyPrice, cleanPrice, totalCost, profitTaxed };
  });

  // Sort descending by profit
  potionsWithProfit.sort((a, b) => b.profitTaxed - a.profitTaxed);

  for (let item of potionsWithProfit) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.grimyName}</td>
      <td>${formatGp(item.grimyPrice)}</td>
      <td>${formatGp(fee)}</td>
      <td>${formatGp(item.totalCost)}</td>
      <td>${item.cleanName}</td>
      <td>${formatGp(item.cleanPrice)}</td>
      <td class="${item.profitTaxed >= 0 ? 'profit-positive' : 'profit-negative'}">${formatGp(item.profitTaxed)}</td>
    `;
    tbody.appendChild(tr);
  }
}

function displaySecondaryProfits(prices, mapping, useLowMargin) {
  const tbody = document.querySelector("#secondaries-table tbody");
  tbody.innerHTML = "";
  const fee = 50;

  // Prepare array with profit info
  const secondariesWithProfit = secondaryMapping.map(item => {
    const rawPrice = useLowMargin
    ? prices[item.rawId]?.high || 0 
    : prices[item.rawId]?.low || 0;
	
	const processedPrice = useLowMargin
    ? prices[item.processedId]?.low || 0 
    : prices[item.processedId]?.high || 0;

    const totalCost = rawPrice + fee;
    const profit = processedPrice - totalCost;
	const profitTaxed = Math.floor(profit - (profit/100*2))
    return { ...item, rawPrice, processedPrice, totalCost, profitTaxed };
  });

  // Sort descending by profit
  secondariesWithProfit.sort((a, b) => b.profitTaxed - a.profitTaxed);

  for (let item of secondariesWithProfit) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.rawName}</td>
      <td>${formatGp(item.rawPrice)}</td>
      <td>${formatGp(fee)}</td>
      <td>${formatGp(item.totalCost)}</td>
      <td>${item.processedName}</td>
      <td>${formatGp(item.processedPrice)}</td>
      <td class="${item.profitTaxed >= 0 ? 'profit-positive' : 'profit-negative'}">${formatGp(item.profitTaxed)}</td>
    `;
    tbody.appendChild(tr);
  }
}

async function main() {
  const status = document.getElementById("status");
  const lowMarginAlch = document.getElementById("margin-toggle-alch");
  const lowMarginPotion = document.getElementById("margin-toggle-potion");
  const lowMarginDegrim = document.getElementById("margin-toggle-degrim");
  const lowMarginDegrimpotion = document.getElementById("margin-toggle-degrimpotion");
  const lowMarginSecondary = document.getElementById("margin-toggle-secondary");

  try {
    status.textContent = "Loading data...";
    const { prices, mapping, fivemin } = await loadPricesAndMapping();
    status.textContent = "";

    // Display default alchable items with new fee
    displayAlchProfits(prices, mapping, lowMarginAlch.checked);
    displayFlippingProfits(prices, mapping, fivemin);
    displayPotionProfits(prices, mapping, lowMarginPotion.checked);
    displayDegrimProfits(prices, mapping, lowMarginDegrim.checked);
    displaySecondaryProfits(prices, mapping, lowMarginSecondary.checked);



	//Update on checkbox change without reloading
    lowMarginAlch.addEventListener("change", () => {displayAlchProfits(prices, mapping, lowMarginAlch.checked);});
    lowMarginPotion.addEventListener("change", () => {displayPotionProfits(prices, mapping, lowMarginPotion.checked);});
    lowMarginDegrim.addEventListener("change", () => {displayDegrimProfits(prices, mapping, lowMarginDegrim.checked);});
    lowMarginSecondary.addEventListener("change", () => {displaySecondaryProfits(prices, mapping, lowMarginSecondary.checked);});


  } catch (err) {
    console.error(err);
    status.textContent = "Error loading data: " + err.message;
  }
}

main();
