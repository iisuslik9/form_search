const okvedData = {
    "10": {
      name: "Раздел A: Сельское, лесное хозяйство, охота, рыболовство и рыбоводство",
      children: {
        "10.1": {
          name: "Выращивание зерновых культур",
          children: {
            "10.11": {
              name: "Выращивание пшеницы"
            },
            "10.12": {
              name: "Выращивание ржи"
            }
          }
        }
      }
    },
    "20": {
      name: "Раздел B: Добывающая промышленность",
      children: {
        "20.1": {
          name: "Добыча угля",
          children: {
            "20.11": {
              name: "Добыча каменного угля"
            }
          }
        }
      }
    }
  };
  
  const classInput = document.getElementById('classInput');
  const subclassInput = document.getElementById('subclassInput');
  const groupInput = document.getElementById('groupInput');
  const subgroupInput = document.getElementById('subgroupInput');
  const searchResults = document.getElementById('searchResults');
  
  classInput.addEventListener('input', () => {
    const classCode = classInput.value;
    if (classCode in okvedData) {
      subclassInput.style.display = 'block';
      searchResults.innerHTML = '';
      searchResults.textContent = `Выбран класс: ${okvedData[classCode].name}`;
    } else {
      subclassInput.style.display = 'none';
      groupInput.style.display = 'none';
      subgroupInput.style.display = 'none';
      searchResults.innerHTML = '';
    }
  });
  
  subclassInput.addEventListener('input', () => {
    const classCode = classInput.value;
    const subclassCode = subclassInput.value;
    if (classCode in okvedData && subclassCode in okvedData[classCode].children) {
      groupInput.style.display = 'block';
      searchResults.innerHTML = '';
      searchResults.textContent = `Выбран подкласс: ${okvedData[classCode].children[subclassCode].name}`;
    } else {
      groupInput.style.display = 'none';
      subgroupInput.style.display = 'none';
      searchResults.innerHTML = '';
    }
  });
  
  groupInput.addEventListener('input', () => {
    const classCode = classInput.value;
    const subclassCode = subclassInput.value;
    const groupCode = groupInput.value;
    if (classCode in okvedData && subclassCode in okvedData[classCode].children && groupCode in okvedData[classCode].children[subclassCode].children) {
      subgroupInput.style.display = 'block';
      searchResults.innerHTML = '';
      searchResults.textContent = `Выбрана группа: ${okvedData[classCode].children[subclassCode].children[groupCode].name}`;
    } else {
      subgroupInput.style.display = 'none';
      searchResults.innerHTML = '';
    }
  });
  
  subgroupInput.addEventListener('input', () => {
    const classCode = classInput.value;
    const subclassCode = subclassInput.value;
    const groupCode = groupInput.value;
    const subgroupCode = subgroupInput.value;
    if (classCode in okvedData && subclassCode in okvedData[classCode].children && groupCode in okvedData[classCode].children[subclassCode].children && subgroupCode in okvedData[classCode].children[subclassCode].children[groupCode].children) {
      searchResults.innerHTML = '';
      searchResults.textContent = `Выбрана подгруппа: ${okvedData[classCode].children[subclassCode].children[groupCode].children[subgroupCode].name}`;
    } else {
      searchResults.innerHTML = '';
    }
  });
  