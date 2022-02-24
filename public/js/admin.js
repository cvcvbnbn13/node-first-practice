const button = document.querySelector('.delete-btn');

button.addEventListener('click', function () {
  const id = button.parentNode.querySelector('[name=id]').value;
  const csrf = button.parentNode.querySelector('[name=_csrf]').value;

  const productElement = button.closest('article');

  fetch(`/admin/products/${id}`, {
    method: 'DELETE',
    headers: {
      'csrf-token': csrf,
    },
  })
    .then(result => {
      return result.json();
    })
    .then(data => {
      productElement.parentNode.removeChild(productElement);
    })
    .catch(err => {
      console.log(err);
    });
});
