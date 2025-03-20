const inputField = document.getElementById('okvedCode');

inputField.addEventListener('input', function() {
    const value = this.value.replace(/[^0-9]/g, ''); // Удаляем все, кроме цифр
    const formattedValue = value.match(/.{1,2}/g).join('.'); // Добавляем точку после каждых двух цифр
    
    this.value = formattedValue;
});


let loadedOkvedData = [];
const map = {};

// Загрузка данных
fetch('okved_2.json')
    .then(response => response.json())
    .then(data => {
        loadedOkvedData = data;
        buildHierarchy(data); // Построение иерархии при загрузке
        clearResults();
    })
    .catch(error => console.error('Error loading JSON:', error));

// Построение иерархической структуры
function buildHierarchy(items) {
    // Создаем хеш-таблицу
    items.forEach(item => {
        map[item.code] = { ...item, children: [] };
    });
    // Строим дерево
    items.forEach(item => {
        const parent = map[item.parent_code];
        if (parent) {
            parent.children.push(map[item.code]);
        }
    });
}


function searchOkved(query) {
    const results = {};
    
    // Ищем совпадения по коду
    Object.keys(map).forEach(code => {
        if (code.startsWith(query)) {
            const item = map[code];
            if (item && !results[item.code]) {
                results[item.code] = item;
            }
            
            // Добавляем всех потомков
            function addChildren(item) {
                if (!item || !item.children) return;
                item.children.forEach(child => {
                    if (!results[child.code]) {
                        results[child.code] = child;
                    }
                    addChildren(child);
                });
            }
            addChildren(item);
        }
    });
    
    return results;
}


// Отображение результатов поиска по коду
function displayResults(results) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";
    
    if (!Object.keys(results).length) {
        resultsDiv.innerHTML = "<p>Ничего не найдено</p>";
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

    if (item.children?.length > 5) {
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
    } else if (item.children?.length > 0) {
        const childUl = document.createElement("ul");
        item.children
            .filter(child => results[child.code])
            .forEach(child => addCodeItemToUl(childUl, child, results, level + 1));
        li.appendChild(childUl);
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



///===========================поиск по словам
function displayResultsW(itemsDictionary) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";
    
    if (!itemsDictionary || Object.keys(itemsDictionary).length === 0) {
        resultsDiv.innerHTML = "<p>No results</p>";
        return;
    }

    const ul = document.createElement("ul");
    
    const allItems = Object.values(itemsDictionary);

    
    const topLevelItems = allItems;
    for (const item of topLevelItems) {
        addItemToUl(ul, item);
    }
    resultsDiv.appendChild(ul);
}

function addItemToUl(ul, item) {
    const li = document.createElement("li");
    li.innerHTML = `${item.code}: ${item.markedName || item.name}`;
    li.classList.add('main-li');
    ul.appendChild(li);
}


function clearResultsW() {
    displayResultsW(searchOkvedByWord("")); 
}

 
function searchOkvedByWord(query) {
    const results = {};
    
    if (!query) return results;

    loadedOkvedData.forEach(item => {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
            const resultItem = { ...item };
            resultItem.markedName = markMatchedText(item.name, query);
            results[item.code] = resultItem;
        }
        
        if (item.subgroups) {
            item.subgroups.forEach(subgroup => {
                if (subgroup.name.toLowerCase().includes(query.toLowerCase())) {
                    const subgroupItem = { ...subgroup };
                    subgroupItem.markedName = markMatchedText(subgroup.name, query);
                    results[subgroup.code] = subgroupItem;
                }
            });
        }
        
        if (item.types) {
            item.types.forEach(type => {
                if (type.name.toLowerCase().includes(query.toLowerCase())) {
                    const typeItem = { ...type };
                    typeItem.markedName = markMatchedText(type.name, query);
                    results[type.code] = typeItem;
                }
            });
        }
        
        if (item.subclasses) {
            item.subclasses.forEach(subclass => {
                if (subclass.name.toLowerCase().includes(query.toLowerCase())) {
                    const subclassItem = { ...subclass };
                    subclassItem.markedName = markMatchedText(subclass.name, query);
                    results[subclass.code] = subclassItem;
                }
            });
        }
        
        if (item.groups) {
            item.groups.forEach(group => {
                if (group.name.toLowerCase().includes(query.toLowerCase())) {
                    const groupItem = { ...group };
                    groupItem.markedName = markMatchedText(group.name, query);
                    results[group.code] = groupItem;
                }
            });
        }
    });
    
    return results;
}

function markMatchedText(text, query) {  
    const regex = new RegExp(query, "giu");
    return text.replace(regex, (match) => `<mark>${match}</mark>`);
}
clearResultsW();
const okvedName = document.getElementById("okvedName");
okvedName.addEventListener("input", () => {    
    const query = okvedName.value.trim();    
    displayResultsW(searchOkvedByWord(query));
})




// JSON Loading:

// Added fetch('data.json') at the beginning of main.js to load the JSON data.
// The .then(response => response.json()) part parses the JSON response.
// loadedOkvedData = data; now stores the data from the JSON file.
// clearResults() is called to initialize the display after data is loaded.