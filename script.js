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


const okvedCode = document.getElementById('okvedCode');
const addCodeBtn = document.getElementById('addCodeBtn');

inputField.addEventListener('input', function() {
    const value = this.value.replace(/[^0-9]/g, ''); 
    const formattedValue = value.match(/.{1,2}/g)?.join('.') || ''; 
    this.value = formattedValue;

    // Проверяем, что введено ровно 6 цифр в формате XX.XX.XX
    const fullCodePattern = /^\d{2}\.\d{2}\.\d{2}$/;
    addCodeBtn.disabled = !fullCodePattern.test(formattedValue);
});
