// Mappatura delle categorie ad icone
const categoryIcons = {
  "Netflix": "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
  "Amazon": "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
  "Mutuo": "https://placehold.co/20x20/cccccc/000000?text=M",
  "Affitto": "https://placehold.co/20x20/cccccc/000000?text=A",
  "Luce": "https://placehold.co/20x20/cccccc/000000?text=L",
  "Acqua": "https://placehold.co/20x20/cccccc/000000?text=Aq",
  "Shopping": "https://placehold.co/20x20/cccccc/000000?text=S",
  "Spese Mediche": "https://placehold.co/20x20/cccccc/000000?text=SM"
};

// Variabili globali per le voci e la vista corrente
let entries = [];       
let entryId = 0;        
let currentView = 'monthly'; 
let editingEntryId = null; 
let currentEntryType = null; 
let currentMonthDate = new Date();

// --- Funzioni di Persistenza ---
function saveEntries() {
  localStorage.setItem('financeEntries', JSON.stringify(entries));
}

function loadEntries() {
  const storedEntries = localStorage.getItem('financeEntries');
  if (storedEntries) {
    entries = JSON.parse(storedEntries).map(entry => ({
      ...entry,
      date: new Date(entry.date)
    }));
    if (entries.length > 0) {
      entryId = Math.max(...entries.map(e => e.id)) + 1;
    }
  }
}

// --- Gestione delle voci ---
function createEntrySpan(entry) {
  const span = document.createElement("span");
  span.classList.add("entry", "block", "p-1", "rounded-md", "text-xs", "cursor-pointer", "hover:bg-gray-100");
  const entryAmountText = (entry.type === "income" ? `+${entry.amount.toFixed(2)}` : `-${entry.amount.toFixed(2)}`);
  
  if (categoryIcons[entry.category]) {
    span.innerHTML = `${entryAmountText} <img src="${categoryIcons[entry.category]}" alt="${entry.category}" class="inline-block w-4 h-4 align-middle ml-1">`;
  } else {
    span.textContent = `${entryAmountText} (${entry.category})`;
  }
  
  span.style.color = (entry.type === "income" ? "#007aff" : "#ff3b30");
  span.setAttribute("data-id", entry.id);
  span.addEventListener("dblclick", function() { editEntry(this); });
  return span;
}

function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function openEntryDialog(entryType, entry) {
  editingEntryId = entry ? entry.id : null;
  currentEntryType = entry ? entry.type : entryType;
  const dialog = document.getElementById("entryDialog");
  dialog.classList.remove("hidden");

  const title = document.getElementById("dialogTitle");
  const deleteBtn = document.getElementById("deleteEntryBtn");

  if (editingEntryId !== null) {
    title.textContent = "Modifica Voce";
    document.getElementById("entryAmount").value = entry.amount;
    document.getElementById("entryDate").value = formatDateForInput(new Date(entry.date));
    const select = document.getElementById("entryCategory");
    const validCategories = ["Netflix", "Amazon", "Mutuo", "Affitto", "Luce", "Acqua", "Shopping", "Spese Mediche"];
    if (validCategories.includes(entry.category)) {
      select.value = entry.category;
      document.getElementById("customCategoryDiv").style.display = "none";
      document.getElementById("customCategory").value = "";
    } else {
      select.value = "personalizzato";
      document.getElementById("customCategoryDiv").style.display = "block";
      document.getElementById("customCategory").value = entry.category;
    }
    deleteBtn.classList.remove("hidden");
  } else {
    title.textContent = "Aggiungi Voce";
    document.getElementById("entryAmount").value = "";
    let today = new Date();
    document.getElementById("entryDate").value = formatDateForInput(today);
    document.getElementById("entryCategory").value = "Netflix";
    document.getElementById("customCategoryDiv").style.display = "none";
    document.getElementById("customCategory").value = "";
    deleteBtn.classList.add("hidden");
  }
}

function closeEntryDialog() {
  document.getElementById("entryDialog").classList.add("hidden");
}

function recordEntry(type) {
  openEntryDialog(type, null);
}

document.getElementById("entryForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById("entryAmount").value);
  if (isNaN(amount)) {
    showMessageDialog("Errore Input", "Inserisci un numero valido per l'importo!");
    return;
  }
  const dateInput = document.getElementById("entryDate").value;
  if (!dateInput) {
    showMessageDialog("Errore Input", "Inserisci una data valida!");
    return;
  }
  const entryDate = new Date(dateInput);
  const select = document.getElementById("entryCategory").value;
  let category = "";
  if (select === "personalizzato") {
    category = document.getElementById("customCategory").value.trim();
    if (category === "") {
      showMessageDialog("Errore Input", "Inserisci una categoria personalizzata valida!");
      return;
    }
  } else {
    category = select;
  }
  
  if (editingEntryId === null) {
    const newEntry = {
      id: entryId++,
      date: entryDate,
      amount: amount,
      type: currentEntryType,
      category: category
    };
    entries.push(newEntry);
  } else {
    const index = entries.findIndex(e => e.id == editingEntryId);
    if (index > -1) {
      entries[index].amount = amount;
      entries[index].date = entryDate;
      entries[index].category = category;
    }
  }
  saveEntries();
  closeEntryDialog();
  renderCalendar();
});

document.getElementById("entryCategory").addEventListener("change", function() {
  if (this.value === "personalizzato") {
    document.getElementById("customCategoryDiv").style.display = "block";
  } else {
    document.getElementById("customCategoryDiv").style.display = "none";
  }
});

function editEntry(spanElement) {
  const id = parseInt(spanElement.getAttribute("data-id"));
  const index = entries.findIndex(e => e.id === id);
  if (index === -1) return;
  openEntryDialog(entries[index].type, entries[index]);
}

function showDeleteConfirm() {
  document.getElementById("deleteConfirmDialog").classList.remove("hidden");
}

function confirmDelete(isConfirmed) {
  document.getElementById("deleteConfirmDialog").classList.add("hidden");
  if (isConfirmed && editingEntryId !== null) {
    entries = entries.filter(e => e.id !== editingEntryId);
    saveEntries();
    closeEntryDialog();
    renderCalendar();
    editingEntryId = null;
  }
}

// --- Funzione per aggiornare il riepilogo in base alla vista corrente ---
function updateSummary() {
  let totalIncome = 0, totalExpense = 0;
  let visibleEntries = [];

  if (currentView === 'daily') {
    // Vista giornaliera: usa la data corrente
    const baseDate = new Date();
    visibleEntries = entries.filter(e => isSameDay(new Date(e.date), baseDate));
  } else if (currentView === 'weekly') {
    // Vista settimanale: dal lunedì alla domenica
    const baseDate = new Date();
    const dayIndex = (baseDate.getDay() + 6) % 7;
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() - dayIndex);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    visibleEntries = entries.filter(e => {
      const d = new Date(e.date);
      return d >= monday && d <= sunday;
    });
  } else if (currentView === 'monthly') {
    // Vista mensile: usa currentMonthDate
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    visibleEntries = entries.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  } else if (currentView === 'yearly') {
    // Vista annuale: usa l'anno corrente
    const year = new Date().getFullYear();
    visibleEntries = entries.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === year;
    });
  }

  visibleEntries.forEach(e => {
    if (e.type === "income") {
      totalIncome += e.amount;
    } else {
      totalExpense += e.amount;
    }
  });

  const summaryDiv = document.getElementById("summaryRow");
  if (summaryDiv) {
    summaryDiv.innerHTML = `<div class="flex justify-around items-center p-4 bg-gray-100 rounded-xl mb-4">
      <div class="text-blue-600 font-bold text-lg">Entrate: +${totalIncome.toFixed(2)}</div>
      <div class="text-red-600 font-bold text-lg">Uscite: -${totalExpense.toFixed(2)}</div>
    </div>`;
  }
}

// --- Funzioni per il rendering del Calendario ---
function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

function getEntriesForDate(date) {
  return entries.filter(e => isSameDay(new Date(e.date), date));
}

function goToPreviousMonth() {
  currentMonthDate.setMonth(currentMonthDate.getMonth() - 1);
  renderCalendar();
}

function goToNextMonth() {
  currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
  renderCalendar();
}

function renderMonthlyCalendar() {
  const container = document.getElementById("calendarContainer");
  container.innerHTML = "";
  const today = new Date();
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

  const captionDiv = document.createElement("div");
  captionDiv.className = "text-center text-2xl font-bold text-gray-800 mb-4 flex justify-between items-center";

  const prevMonthBtn = document.createElement("button");
  prevMonthBtn.className = "bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-3 rounded-lg";
  prevMonthBtn.textContent = "<";
  prevMonthBtn.onclick = goToPreviousMonth;
  captionDiv.appendChild(prevMonthBtn);

  const monthYearSpan = document.createElement("span");
  monthYearSpan.textContent = `${monthNames[month]} ${year}`;
  captionDiv.appendChild(monthYearSpan);

  const nextMonthBtn = document.createElement("button");
  nextMonthBtn.className = "bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-3 rounded-lg";
  nextMonthBtn.textContent = ">";
  nextMonthBtn.onclick = goToNextMonth;
  captionDiv.appendChild(nextMonthBtn);

  container.appendChild(captionDiv);

  const firstDay = new Date(year, month, 1);
  const startIndex = (firstDay.getDay() + 6) % 7;
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  const table = document.createElement("table");
  table.classList.add("calendar", "w-full", "border-collapse", "table-fixed", "mt-4");

  const headerRow = document.createElement("tr");
  const daysOfWeek = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
  daysOfWeek.forEach(day => {
    const th = document.createElement("th");
    th.className = "py-3 text-sm font-semibold text-gray-600 border-b border-gray-200";
    th.textContent = day;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  let totalCells = startIndex + daysInMonth;
  let numRows = Math.ceil(totalCells / 7);
  let dayCounter = 1;

  for (let i = 0; i < numRows; i++) {
    const row = document.createElement("tr");
    for (let j = 0; j < 7; j++) {
      const cell = document.createElement("td");
      cell.className = "p-2 h-28 align-top border border-gray-200 relative";

      const cellIndex = i * 7 + j;
      if (cellIndex >= startIndex && dayCounter <= daysInMonth) {
        const cellDate = new Date(year, month, dayCounter);
        const dayLabel = document.createElement("div");
        dayLabel.className = "absolute top-2 left-2 font-bold text-lg text-gray-700";
        dayLabel.textContent = dayCounter;
        cell.appendChild(dayLabel);

        if (isSameDay(cellDate, today)) {
          cell.classList.add("today-highlight");
        }
        const dayEntries = getEntriesForDate(cellDate);
        const entriesContainer = document.createElement("div");
        entriesContainer.className = "mt-8 overflow-y-auto max-h-[calc(100%-2rem)]";
        dayEntries.forEach(entry => {
          const span = createEntrySpan(entry);
          entriesContainer.appendChild(span);
        });
        cell.appendChild(entriesContainer);
        dayCounter++;
      }
      row.appendChild(cell);
    }
    table.appendChild(row);
  }
  container.appendChild(table);
}

function renderWeeklyCalendar() {
  const container = document.getElementById("calendarContainer");
  container.innerHTML = "";
  const baseDate = new Date();
  const dayIndex = (baseDate.getDay() + 6) % 7;
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - dayIndex);

  const table = document.createElement("table");
  table.classList.add("calendar", "w-full", "border-collapse", "table-fixed");

  const headerRow = document.createElement("tr");
  const dayNames = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    const th = document.createElement("th");
    th.className = "py-3 text-sm font-semibold text-gray-600 border-b border-gray-200";
    th.textContent = `${dayNames[i]} ${current.getDate()}/${current.getMonth() + 1}`;
    headerRow.appendChild(th);
  }
  table.appendChild(headerRow);

  const row = document.createElement("tr");
  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    const cell = document.createElement("td");
    cell.className = "p-2 h-48 align-top border border-gray-200 relative";
    if (isSameDay(current, baseDate)) {
      cell.classList.add("today-highlight");
    }
    const dayEntries = getEntriesForDate(current);
    const entriesContainer = document.createElement("div");
    entriesContainer.className = "overflow-y-auto max-h-full";
    dayEntries.forEach(entry => {
      const span = createEntrySpan(entry);
      entriesContainer.appendChild(span);
    });
    cell.appendChild(entriesContainer);
    row.appendChild(cell);
  }
  table.appendChild(row);
  container.appendChild(table);
}

function renderDailyCalendar() {
  const container = document.getElementById("calendarContainer");
  container.innerHTML = "";
  const baseDate = new Date();
  const table = document.createElement("table");
  table.classList.add("calendar", "w-full", "border-collapse", "table-fixed");
  table.style.maxWidth = "600px";
  table.style.margin = "0 auto";

  const headerRow = document.createElement("tr");
  const th = document.createElement("th");
  th.className = "py-3 text-lg font-semibold text-gray-800 border-b border-gray-200";
  th.textContent = `Oggi: ${baseDate.getDate()}/${baseDate.getMonth() + 1}/${baseDate.getFullYear()}`;
  headerRow.appendChild(th);
  table.appendChild(headerRow);

  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.className = "p-4 h-96 align-top border border-gray-200 relative today-highlight";
  const dayEntries = getEntriesForDate(baseDate);
  const entriesContainer = document.createElement("div");
  entriesContainer.className = "overflow-y-auto max-h-full";
  dayEntries.forEach(entry => {
    const span = createEntrySpan(entry);
    entriesContainer.appendChild(span);
  });
  cell.appendChild(entriesContainer);
  row.appendChild(cell);
  table.appendChild(row);
  container.appendChild(table);
}

function renderAnnualCalendar() {
  const container = document.getElementById("calendarContainer");
  container.innerHTML = "";
  const currentYear = new Date().getFullYear();
  const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

  const table = document.createElement("table");
  table.classList.add("calendar", "w-full", "border-collapse");

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const thMonth = document.createElement("th");
  thMonth.className = "py-3 text-sm font-semibold text-gray-600 border-b border-gray-200 w-1/4";
  thMonth.textContent = "Mese";
  const thDetails = document.createElement("th");
  thDetails.className = "py-3 text-sm font-semibold text-gray-600 border-b border-gray-200 w-3/4";
  thDetails.textContent = "Dettagli";
  headerRow.appendChild(thMonth);
  headerRow.appendChild(thDetails);
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (let m = 0; m < 12; m++) {
    const monthEntries = entries.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === currentYear && d.getMonth() === m;
    });
    let totalIncome = 0, totalExpense = 0;
    monthEntries.forEach(e => {
      if (e.type === "income") {
        totalIncome += e.amount;
      } else {
        totalExpense += e.amount;
      }
    });
    const net = totalIncome - totalExpense;

    const row = document.createElement("tr");
    const cellMonth = document.createElement("td");
    cellMonth.className = "p-3 border border-gray-200 text-center font-medium text-gray-700";
    cellMonth.textContent = `${monthNames[m]} ${currentYear}`;

    const cellDetails = document.createElement("td");
    cellDetails.className = "p-3 border border-gray-200 align-top";
    const summaryDiv = document.createElement("div");
    summaryDiv.className = "mb-2 text-sm font-semibold";
    summaryDiv.innerHTML = `<span class="text-blue-600">Entrate: +${totalIncome.toFixed(2)}</span> | <span class="text-red-600">Uscite: -${totalExpense.toFixed(2)}</span> | <span class="text-gray-800">Netto: ${net.toFixed(2)}</span>`;
    cellDetails.appendChild(summaryDiv);

    const entriesListDiv = document.createElement("div");
    entriesListDiv.className = "max-h-24 overflow-y-auto text-xs";
    monthEntries.sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach(entry => {
        const entryDiv = document.createElement("div");
        entryDiv.className = "mb-1";
        const daySpan = document.createElement("span");
        daySpan.className = "font-bold mr-1 text-gray-600";
        daySpan.textContent = new Date(entry.date).getDate() + ": ";
        entryDiv.appendChild(daySpan);
        const entrySpan = createEntrySpan(entry);
        entrySpan.classList.remove("text-xs");
        entrySpan.classList.add("text-sm");
        entryDiv.appendChild(entrySpan);
        entriesListDiv.appendChild(entryDiv);
      });
    cellDetails.appendChild(entriesListDiv);

    row.appendChild(cellMonth);
    row.appendChild(cellDetails);
    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  container.appendChild(table);
}

function setView(viewType) {
  currentView = viewType;
  // Imposta la data base a oggi quando si cambia vista
  currentMonthDate = new Date();
  document.getElementById("btn-daily").classList.remove("active-view");
  document.getElementById("btn-weekly").classList.remove("active-view");
  document.getElementById("btn-monthly").classList.remove("active-view");
  document.getElementById("btn-yearly").classList.remove("active-view");
  if (viewType === "daily") {
    document.getElementById("btn-daily").classList.add("active-view");
  } else if (viewType === "weekly") {
    document.getElementById("btn-weekly").classList.add("active-view");
  } else if (viewType === "monthly") {
    document.getElementById("btn-monthly").classList.add("active-view");
  } else if (viewType === "yearly") {
    document.getElementById("btn-yearly").classList.add("active-view");
  }
  renderCalendar();
}

function showMessageDialog(title, message) {
  document.getElementById("messageTitle").textContent = title;
  document.getElementById("messageContent").textContent = message;
  document.getElementById("messageDialog").classList.remove("hidden");
}

function closeMessageDialog() {
  document.getElementById("messageDialog").classList.add("hidden");
}

// Ogni volta che si renderizza il calendario, viene aggiornato anche il riepilogo
function renderCalendar() {
  updateSummary();
  if (currentView === "monthly") {
    renderMonthlyCalendar();
  } else if (currentView === "weekly") {
    renderWeeklyCalendar();
  } else if (currentView === "daily") {
    renderDailyCalendar();
  } else if (currentView === "yearly") {
    renderAnnualCalendar();
  }
}

// Registrazione del Service Worker per PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registrato con scope:', registration.scope);
      })
      .catch(err => {
        console.log('Registrazione ServiceWorker fallita:', err);
      });
  });
}

window.onload = function() {
  loadEntries();
  renderCalendar();
};