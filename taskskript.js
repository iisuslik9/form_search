// Получаем ссылку на инпут по его id
const myInput = document.getElementById('myInput');

//слушатель события 'input'
myInput.addEventListener('input', function() {
  const inputValue = this.value.toLowerCase();
  if (inputValue === 'blur') {
    // Убираем фокус с инпута
    this.blur();
  }
});
