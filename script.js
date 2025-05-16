// Добавляем точку после каждых двух цифр
const inputField = document.getElementById('okvedCode');
inputField.addEventListener('input', function() {
    const value = this.value.replace(/[^0-9]/g, ''); 
    const parts = value.match(/.{1,2}/g); // может быть null!
    const formattedValue = parts ? parts.join('.') : '';
    this.value = formattedValue;
});


let loadedOkvedData = []; //raw array OKVED objects
const map = {}; //organaside data

fetch('okved_2.json')
    .then(response => response.json())
    .then(data => {
        loadedOkvedData = data;
        buildHierarchy(data);
        clearResults();
    })
    .catch(error => console.error('Error loading JSON:', error));

function buildHierarchy(items) {
    // Создаем хеш-таблицу
    items.forEach(item => {
        map[item.code] = { 
            ...item, 
            children: []
        };
    });
    
    items.forEach(item => {
        const parent = map[item.parent_code];
        if (parent) {
            parent.children.push(map[item.code]);
        }
    });
    
        // Возвращаем корневые элементы
    return Object.values(map).filter(item => !item.parent_code);
    }
    



function searchOkved(query) {
    const results = {}; 
    // foreqach  codes in the map
    Object.keys(map).forEach(code => {
        //  if the code starts with the search query
        if (code.startsWith(query)) {
            const item = map[code]; // Get the item from the map.

            // not yet added to results
            if (item && !results[item.code]) { 
                results[item.code] = item;
            }
            // recurs add all children to the results.
            addAllChildren(item, results);
        }
    });

    return results;
}

// Recursive function to add all children of an item to the results.
function addAllChildren(item, results) {
    if (!item || !item.children) return; // has no children.

    item.children.forEach(child => {
        if (!results[child.code]) {
            results[child.code] = child; 
        }
        addAllChildren(child, results);
    });
}

function displayResults(results) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";
    
    if (!Object.keys(results).length) {
        resultsDiv.innerHTML = "<p>No results</p>";
        return;
    }

    const rootItems = Object.values(results).filter(
        item => !item.parent_code || !results[item.parent_code]
    );
    
    const ul = document.createElement("ul");
    rootItems.forEach(item => addCodeItemToUl(ul, item, results));
    resultsDiv.appendChild(ul);
}

function addCodeItemToUl(ul, item, results, level = 0) {
    const li = document.createElement("li");
    li.style.marginLeft = `${level * 20}px`;

    li.innerHTML = `<span class="code">${item.code}</span>: ${item.name}`;

    if (item.children?.length > 0) {
        const expandButton = document.createElement("span");
        expandButton.className = "toggle";
        expandButton.textContent = " ▶";

        expandButton.addEventListener("click", () => {
            const childUl = li.querySelector("ul");
            if (childUl) {
                li.removeChild(childUl);
                expandButton.textContent = " ▶";
            } else {
                const newUl = document.createElement("ul");
                item.children
                    .filter(child => results[child.code])
                    .forEach(child => addCodeItemToUl(newUl, child, results, level + 1));
                li.appendChild(newUl);
                expandButton.textContent = " ▼";
            }
        });

        li.insertBefore(expandButton, li.firstChild);
    }

    ul.appendChild(li);
}

document.getElementById("okvedCode").addEventListener("input", e => {
    const query = e.target.value.trim();
    displayResults(searchOkved(query));
});


function clearResults() {
    document.getElementById("results").innerHTML = "";
}


//================== Поиск по слову
function searchOkvedByWord(query) {
    const results = []; 
    
    if (!query) return results; 
    
    function searchInTree(item, level = 0) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
            const resultItem = { ...item, level: level };
            resultItem.markedName = markMatchedText(item.name, query);
            results.push(resultItem);
        }
        if (item.children) {
            item.children.forEach(child => searchInTree(child, level + 1));
        }
    }

    Object.values(map).filter(item => !item.parent_code).forEach(rootItem => {
        searchInTree(rootItem);
    });

    return results;
}

function markMatchedText(text, query) {
    // Экранируем специальные символы в запросе
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, "giu");
    return text.replace(regex, (match) => `<mark>${match}</mark>`);
}

function displaySearchResultsW(results) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = ''; 
    if (results.length === 0) {resultsDiv.textContent = "No results"; return;}
    const ul = document.createElement("ul");
    results.forEach(item => {        
        const li = document.createElement("li");
        li.style.marginLeft = `${item.level * 20}px`;
        li.innerHTML = `<span class="code">${item.code}</span>: ${item.markedName || item.name}`;
        ul.appendChild(li);
    });
    resultsDiv.appendChild(ul);
}
const okvedName = document.getElementById("okvedName");
okvedName.addEventListener("input", () => {    
    const query = okvedName.value.trim();
    displaySearchResultsW(searchOkvedByWord(query));
})

//============statistic
const okvedCode = document.getElementById('okvedCode');
const addCodeBtn = document.getElementById('addCodeBtn');
const resultsDiv = document.getElementById('results');
const chartCanvas = document.getElementById('chart').getContext('2d');
okvedCode.addEventListener('input', function() {
    const value = this.value.replace(/[^0-9]/g, ''); 
    const formattedValue = value.match(/.{1,2}/g)?.join('.') || ''; 
    this.value = formattedValue;

    //const fullCodePattern = /^\d{2}\.\d{2}\.\d{2}$/;
    //const fullCodePattern = /^\d{2}(\.\d{2}(\.\d{2})?)?$/;
    const fullCodePattern = /^\d{2}/;

    const isValidFormat = fullCodePattern.test(formattedValue);

    // Проверяем, что в results нет текста "No results"
    const noResultsText = "No results";
    const hasNoResults = resultsDiv.textContent.trim() === noResultsText;

    // Кнопка активна, если формат правильный и есть результаты (нет "No results")
    addCodeBtn.disabled = !(isValidFormat && !hasNoResults);
    //addCodeBtn.disabled = !(!hasNoResults);
});

const savedCodesStats = {};

// Функция сохранения в localStorage
function saveStatsToLocalStorage() {
    localStorage.setItem('savedCodesStats', JSON.stringify(savedCodesStats));
}

// Функция загрузки из localStorage
function loadStatsFromLocalStorage() {
    const data = localStorage.getItem('savedCodesStats');
    if (data) {
        Object.assign(savedCodesStats, JSON.parse(data));
    }
}

// При загрузке страницы подгружаем данные
loadStatsFromLocalStorage();

// При сохранении кода увеличиваем счётчик и сохраняем
addCodeBtn.addEventListener('click', () => {
    const code = inputField.value;

    if (savedCodesStats[code]) {
        savedCodesStats[code]++;
    } else {
        savedCodesStats[code] = 1;
    }

    saveStatsToLocalStorage();

    alert(`Код ${code} сохранён! Количество сохранений: ${savedCodesStats[code]}`);

    inputField.value = '';
    addCodeBtn.disabled = true;

    // Обновляем диаграмму
    const counts = countSectionsFromStats(savedCodesStats);
    renderChart(counts);
  });

  // Инициализация при загрузке страницы
  window.addEventListener('DOMContentLoaded', () => {
    loadStatsFromLocalStorage();

    // Можно здесь обновить результаты, если нужно
    resultsDiv.textContent = ''; // или ваша логика отображения результатов

    // Отрисовать диаграмму с текущими данными
    const counts = countSectionsFromStats(savedCodesStats);
    renderChart(counts);
});

// Объект для подсчёта сохранённых кодов по разделам
const countsBySection = {
    A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0, J: 0,
    K: 0, L: 0, M: 0, N: 0, O: 0, P: 0, Q: 0, R: 0, S: 0, T: 0, U: 0
  };

let chartInstance = null;
  
  // Функция для определения раздела по коду ОКВЭД
  function getSectionByCode(code) {
    // Убираем точки, берем первые две цифры
    const digits = code.replace(/\./g, '').slice(0, 2);
    const num = parseInt(digits, 10);
  
    if (num >= 1 && num <= 3) return 'A';
    if (num >= 5 && num <= 9) return 'B';
    if (num >= 10 && num <= 33) return 'C';
    if (num === 35) return 'D';
    if (num >= 36 && num <= 39) return 'E';  
    if (num >= 41 && num <= 43) return 'F';
    if (num >= 45 && num <= 47) return 'G';
    if (num >= 49 && num <= 53) return 'H';
    if (num >= 55 && num <= 56) return 'I';
    if (num >= 58 && num <= 63) return 'J';
    if (num >= 64 && num <= 66) return 'K';
    if (num === 68) return 'L';
    if (num >= 69 && num <= 75) return 'M';
    if (num >= 77 && num <= 82) return 'N';
    if (num === 84) return 'O';
    if (num === 85) return 'P';
    if (num >= 86 && num <= 88) return 'Q';
    if (num >= 90 && num <= 93) return 'R';
    if (num >= 94 && num <= 96) return 'S';
    if (num >= 97 && num <= 98) return 'T';
    if (num === 99) return 'U';
  
    return null; // Неизвестный раздел
  }
  
// Подсчёт количества сохранённых кодов по разделам
function countSectionsFromStats(stats) {
    Object.keys(countsBySection).forEach(key => countsBySection[key] = 0);

    for (const code in stats) {
      if (!stats.hasOwnProperty(code)) continue;
      const section = getSectionByCode(code);
      if (section) {
        countsBySection[section] += stats[code];
      }
    }

    return countsBySection;
  }
   // Подготовка данных для диаграммы кодов выбранного раздела
   function getCodesDataForSection(section) {
    const codes = [];
    const counts = [];
    for (const code in savedCodesStats) {
      if (getSectionByCode(code) === section) {
        codes.push(code);
        counts.push(savedCodesStats[code]);
      }
    }
    return { codes, counts };
  }
//  const codesCtx = document.getElementById('codesChart').getContext('2d');
const codesCtx = document.getElementById('codesChart');

  let codesChart = null;
  const sections = Object.keys(countsBySection);
  // Отрисовка диаграммы с помощью Chart.js
  function renderChart(counts) {
    const labels = Object.keys(counts);
    const data = Object.values(counts);
    const total = data.reduce((sum, val) => sum + val, 0);

    if (chartInstance) {
      chartInstance.data.labels = labels;
      chartInstance.data.datasets[0].data = data;
      chartInstance.update();
    } else {
      chartInstance = new Chart(chartCanvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Количество сохранённых кодов',
            data: data,
            backgroundColor: 'rgba(235, 54, 208, 0.7)'
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              stepSize: 1,
              ticks: {
                min: 0,
                max: 100,
                stepSize: 20,
                callback: function (value) {
                  return (value / this.max * 100).toFixed(0) + '%'; // convert it to percentage
                  },
              },
            }
          },
          onClick: (evt, elements) => {
            if (!elements.length) return;
            const idx = elements[0].index;
            const section = sections[idx];
            renderCodesChart(section);
          },
          plugins: {
            tooltip: {
              callbacks: {
                //label: ctx => `Кодов: ${ctx.parsed.y}`
                label: ctx => {
                    
                    const value = ctx.parsed.y;
                    const percent = total ? ((value / total) * 100).toFixed(1) : 0;
                    return `Кодов: ${value} (${percent}%)`;
                  }
              }
            }
          }
          
        }
      });
    }
  }
 // Функция отрисовки диаграммы кодов выбранного раздела
 function renderCodesChart(section) {
    codesCtx.style.display = 'block';
    const ctx = codesCtx.getContext('2d');
    const { codes, counts } = getCodesDataForSection(section);
    if (codesChart) codesChart.destroy();

    codesChart = new Chart(codesCtx, {
      type: 'bar',
      data: {
        labels: codes.length ? codes : ['Нет кодов'],
        datasets: [{
          label: `Коды раздела ${section}`,
          data: counts.length ? counts : [0],
          backgroundColor: 'rgba(255, 159, 64, 0.7)'
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true, stepSize: 1 }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: ctx => `Сохранений: ${ctx.parsed.y}`
            }
          }
        }
      }
    });
  }
//   // Элемент для вывода кодов по разделу
// const codesListDiv = document.getElementById('codesList'); // создайте в HTML <div id="codesList"></div>

// // Массив разделов (метки диаграммы)
// const sections = Object.keys(countsBySection);

// // Функция для получения кодов по разделу
// function getCodesBySection(section) {
//   return Object.keys(savedCodesStats).filter(code => getSectionByCode(code) === section);
// }

// // Обработчик клика по диаграмме
// function onChartClick(evt, elements) {
//   if (!elements.length) return;

//   // Получаем индекс кликнутого столбца
//   const index = elements[0].index;
//   const section = sections[index];

//   // Получаем коды для раздела
//   const codes = getCodesBySection(section);

//   // Формируем вывод
//   if (codes.length === 0) {
//     codesListDiv.innerHTML = `<p>Для раздела <strong>${section}</strong> коды не найдены.</p>`;
//   } else {
//     codesListDiv.innerHTML = `<p>Коды для раздела <strong>${section}</strong>:</p><ul>` +
//       codes.map(code => `<li>${code} (сохранений: ${savedCodesStats[code]})</li>`).join('') +
//       `</ul>`;
//   }
// }
