const repo = "Silent777/shop";
const productsFile = "js/products.js";

document.getElementById("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const price = document.getElementById("price").value;
  const imageFile = document.getElementById("image").files[0];

  let imageName = "";
  let imageBase64 = "";
  if (imageFile) {
    imageName = imageFile.name;
    const buf = await imageFile.arrayBuffer();
    imageBase64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  }

  const productsResp = await fetch(`../${productsFile}`);
  const productsText = await productsResp.text();
  let products = eval(productsText.replace("const products =", "").replace("export default products;", ""));
  products.push({ name, price, image: imageName });

  const payload = {
    event_type: "update-products",
    client_payload: {
      products_js: `const products = ${JSON.stringify(products, null, 2)};\nexport default products;`,
      image_base64: imageBase64,
      image_name: imageName
    }
  };

  const res = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
    method: "POST",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28"
    },
    body: JSON.stringify(payload)
  });

  document.getElementById("log").innerText = res.ok ? "Оновлено!" : "Помилка";
});
