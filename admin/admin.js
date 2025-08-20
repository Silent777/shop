document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const price = parseFloat(document.getElementById('price').value);
  const imageFile = document.getElementById('image').files[0];

  const reader = new FileReader();
  reader.onloadend = async () => {
    const base64Image = reader.result.split(',')[1];

    // Надсилаємо запит до GitHub Actions через repository_dispatch
    await fetch('https://api.github.com/repos/USERNAME/REPO/dispatches', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': 'Bearer ' + process.env.GH_TOKEN,
      },
      body: JSON.stringify({
        event_type: 'update_products',
        client_payload: {
          name,
          price,
          imageName: imageFile.name,
          imageData: base64Image
        }
      })
    });

    alert("Запит відправлено! Зачекай пару секунд оновлення.");
  };

  reader.readAsDataURL(imageFile);
});
