const resultsDiv = document.getElementById("results");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const limitSelect = document.getElementById("limit");

let currentPage = 1;
let limit = parseInt(limitSelect.value);

async function fetchWorkedHours(page, limit) {
  try {
    const res = await fetch(`http://localhost:3000/api/datEvents/worked-hours?page=${page}&limit=${limit}`);
    
    if (!res.ok) throw new Error("Error en la petición");
    
    const json = await res.json();
    return json;
  } catch (err) {
    resultsDiv.innerHTML = `<p class="error-message">${err.message}</p>`;
    return null;
  }
}

function renderTable(data) {
  if (!data || data.data.length === 0) {
    resultsDiv.innerHTML = "<p class='no-data'>No hay datos para mostrar.</p>";
    return;
  }
  
  let html = `<table>
    <thead>
      <tr>
        <th>Empleado</th>
        <th>Entrada (Fecha)</th>
        <th>Entrada (Hora)</th>
        <th>Salida (Fecha)</th>
        <th>Salida (Hora)</th>
        <th>Horas Trabajadas</th>
      </tr>
    </thead>
    <tbody>`;
    
  for (const row of data.data) {
    html += `<tr>
      <td>${row.employee_number}</td>
      <td>${row.entry_date}</td>
      <td>${row.entry_time}</td>
      <td>${row.exit_date}</td>
      <td>${row.exit_time}</td>
      <td>${row.hours_worked.toFixed(2)}</td>
    </tr>`;
  }
  
  html += "</tbody></table>";
  resultsDiv.innerHTML = html;
}

async function loadPage(page, limit) {
  const data = await fetchWorkedHours(page, limit);
  
  if (!data) return;
  
  currentPage = data.page;
  limit = data.limit;
  
  renderTable(data);
  
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = data.data.length < limit;
}

// Event listeners
prevBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    loadPage(currentPage - 1, limit);
  }
});

nextBtn.addEventListener("click", () => {
  loadPage(currentPage + 1, limit);
});

limitSelect.addEventListener("change", () => {
  limit = parseInt(limitSelect.value);
  loadPage(1, limit);
});

// Initial load
loadPage(currentPage, limit);