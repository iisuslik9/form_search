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
            let currentCode = code;
            
            // Добавляем всех родителей
            while (currentCode) {
                const item = map[currentCode];
                if (item && !results[item.code]) {
                    results[item.code] = item;
                }
                currentCode = item?.parent_code;
            }
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



///===========================
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

// function addItemToUl(ul, item) {
//     const li = document.createElement("li");
//     li.textContent = `${item.code}: ${item.name || ''}`;
//     li.classList.add('main-li');
//     ul.appendChild(li);
// }

function addItemToUl(ul, item) {
    const li = document.createElement("li");
    li.innerHTML = `${item.code}: ${item.markedName || item.name}`;
    
    li.classList.add('main-li'); 
    
    if (item.children && item.children.length > 0) {
        const expandButton = document.createElement("span");
        expandButton.textContent = "[+]"
        expandButton.classList.add("expand-button");

        let isExpanded = false;
        expandButton.addEventListener("click", () => {
            if (!isExpanded) {
                const childUl = document.createElement("ul");
                childUl.classList.add('child-ul')
                for (const child of item.children) {
                    addItemToUl(childUl, child);
                }
                li.appendChild(childUl);
                expandButton.textContent = "[-]";
                isExpanded = true;
            } else {
                const childUl = li.querySelector("ul");
                li.removeChild(childUl);
                expandButton.textContent = "[+]";
                isExpanded = false;
            }
        });

        li.insertBefore(expandButton, li.firstChild);
        }
    ul.appendChild(li);
}


function clearResultsW() {
    displayResultsW(searchOkvedByWord("")); 
}

 
function searchOkvedByWord(query) {
    const results = {};
    if (!query){
        return results;
    }
    for (const item of loadedOkvedData){
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
            const resultItem = { ...item };
            resultItem.markedName = markMatchedText(item.name, query);
            results[item.code] = resultItem;
        }
        
        if(item.subgroups){
            item.subgroups.forEach(subgroup => traverseChildren(subgroup, item, query));
        }
        if (item.types){
            item.types.forEach(type => traverseChildren(type, item, query));
        }
        if (item.subclasses){
            item.subclasses.forEach(subclass => traverseChildren(subclass, item, query));
        }
        if (item.groups){
            item.groups.forEach(group => traverseChildren(group, item, query));
        }
    }
    return results
}
function traverseChildren(itemData, parent, query){

    const item = { code: itemData.code, name: itemData.name, children: [] };    
    if (item.name.toLowerCase().includes(query.toLowerCase())){ 
        item.markedName = markMatchedText(item.name, query);
        item.name = itemData.name;

        if (parent) {
            parent.children.push(item)
        }
        if(itemData.subgroups){
            itemData.subgroups.forEach(subgroup => traverseChildren(subgroup, item, query));
        }
        if (itemData.types){
            itemData.types.forEach(type => traverseChildren(type, item, query));
        }
        if (itemData.subclasses){
            itemData.subclasses.forEach(subclass => traverseChildren(subclass, item, query));
        }
        if (itemData.groups){
            itemData.groups.forEach(group => traverseChildren(group, item, query));
        }
    }
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