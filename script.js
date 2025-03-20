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

// Построение иерархической структуры
function buildHierarchy(items) {
    // Создаем хеш-таблицу
    items.forEach(item => {
        // добавляем каждый элемент в map
        //синтаксис расширения (...), используемый с объектом. 
        // Он создает поверхностную копию объекта элемента. 
        // Это означает, что все свойства объекта элемента
        // будут скопированы в этот новый объект.
        map[item.code] = { ...item, children: [] };
    });
    // добавляем потомков к родителям
    items.forEach(item => {
        //используем item.parent_code для поиска родительского элемента в map.
        const parent = map[item.parent_code];
        if (parent) {
            // If a parent exists
            //берем текущий элемент  и добавляем его в массив потомков его родителя
            parent.children.push(map[item.code]);
        }
    });
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

 
function searchOkvedByWord(query) {
    const results = {};
    if (!query) return results;

    function traverse(item) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
            const resultItem = { ...item };
            resultItem.markedName = markMatchedText(item.name, query);
            results[item.code] = resultItem;
        }
         if (item.children){
             item.children.forEach(child => traverse(child));
         }
    }

    // Start traversal with top-level items.
    Object.values(map).filter(item => !item.parent_code).forEach(item => traverse(item));

    return results;
}


function markMatchedText(text, query) {  
    const regex = new RegExp(query, "giu");
    return text.replace(regex, (match) => `<mark>${match}</mark>`);
}
clearResults();
const okvedName = document.getElementById("okvedName");
okvedName.addEventListener("input", () => {    
    const query = okvedName.value.trim();    
    displayResultsW(searchOkvedByWord(query));
})