let loadedOkvedData = [];

fetch('okved_2.json')
    .then(response => response.json())
    .then(data => {
        loadedOkvedData = data;
        clearResults();
        
    })
    .catch(error => console.error('Error loading JSON:', error));

function displayResults(itemsDictionary) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";
    
    if (!itemsDictionary || Object.keys(itemsDictionary).length === 0) {
        resultsDiv.innerHTML = "<p>No results found.</p>";
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

function clearResults() {
    displayResults(searchOkvedByWord("")); 
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


clearResults();
const okvedName = document.getElementById("okvedName");
okvedName.addEventListener("input", () => {    
    const query = okvedName.value.trim();    
    displayResults(searchOkvedByWord(query));
})
