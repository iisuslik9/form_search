// Добавляем точку после каждых двух цифр
const inputField = document.getElementById('okvedCode');
inputField.addEventListener('input', function() {
    const value = this.value.replace(/[^0-9]/g, ''); 
    const formattedValue = value.match(/.{1,2}/g).join('.'); 
    
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
    
        // Строим иерархию
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
    const results = {}; //to store results

    // Iterate through all codes in the map.
    Object.keys(map).forEach(code => {
        // Check if the code starts with the search query.
        if (code.startsWith(query)) {
            const item = map[code]; // Get the item from the map.

            // If item exists and not yet added to results, add it.
            if (item && !results[item.code]) { 
                results[item.code] = item;
            }
            // Recursively add all children of this item to the results.
            addAllChildren(item, results);
        }
    });

    return results;
}

// Recursive function to add all children of an item to the results.
function addAllChildren(item, results) {
    if (!item || !item.children) return; // Base case: item has no children.

    item.children.forEach(child => {
        if (!results[child.code]) {
            results[child.code] = child; // Add the child to the results.
        }
        addAllChildren(child, results); // Recursively check for more children.
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

// Добавление элемента в список для поиска по коду
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


// Поиск по слову
// Поиск по слову
function searchOkvedByWord(query) {
    const results = []; // Массив для хранения результатов поиска
    
    if (!query) return results; // Если запрос пустой, возвращаем пустой массив

    // Рекурсивная функция для поиска и построения иерархии
    const searchInTree = (item, parent = null) => {
        let matchFound = false;
        let resultItem = null;

        if (item.name.toLowerCase().includes(query.toLowerCase())) {
            resultItem = { ...item, children: [] };
            resultItem.markedName = markMatchedText(item.name, query);
            matchFound = true;
        } else if (item.children) {
            resultItem = { ...item, children: [] };
        }

        if (resultItem) {
          if (parent) {
              parent.children.push(resultItem);
          } else {
              results.push(resultItem);
          }
  
          if (item.children) {
              item.children.forEach(child => {
                  searchInTree(child, resultItem);
              });
          }
        }

        return matchFound;
    };
    Object.values(map).filter(item => !item.parent_code).forEach(rootItem => {
        searchInTree(rootItem);
    });
    return results;
}

// Подсветка совпадений в названии элемента
function markMatchedText(text, query) {  
    // Экранируем специальные символы в запросе
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, "giu");    
    return text.replace(regex, (match) => `<mark>${match}</mark>`);
}

// Отображение результатов поиска по слову
function displaySearchResultsW(results) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = ''; 
  if (results.length === 0) {
    resultsDiv.textContent = 'Ничего не найдено.';
    return;
  }
  const ul = document.createElement('ul');
  const addSearchItemToUlW = (item) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="code">${item.code}</span>: ${item.markedName || item.name}`;
    ul.appendChild(li);
    if (item.children) {
      const childUl = document.createElement('ul');
      item.children.forEach(child => addSearchItemToUlW(child));
      li.appendChild(childUl);
    }
  };
  results.forEach(item => addSearchItemToUlW(item));
  resultsDiv.appendChild(ul);
}

const okvedName = document.getElementById("okvedName");
okvedName.addEventListener("input", () => {    
    const query = okvedName.value.trim();
    displaySearchResultsW(searchOkvedByWord(query));
})