const deleteProduct = btn => {
  const id = btn.parentNode.querySelector('[name=id]').value;
  const csrf = btn.parentNode.querySelector('[name=_csrf]').value;

  const productElement = btn.closest('article');

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
};
