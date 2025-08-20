const fs = require('fs');
const path = require('path');

// Тестові дані (у реалі вони прийдуть із payload)
const payload = {
  name: process.env.PRODUCT_NAME,
  price: process.env.PRODUCT_PRICE,
  imageName: process.env.PRODUCT_IMAGE_NAME,
  imageData: process.env.PRODUCT_IMAGE_DATA
};

const productsFile = path.join(__dirname, '..', 'products.js');
const imagesDir = path.join(__dirname, '..', 'images');

// 1. Зберігаємо картинку
const imageBuffer = Buffer.from(payload.imageData, 'base64');
fs.writeFileSync(path.join(imagesDir, payload.imageName), imageBuffer);

// 2. Оновлюємо products.js
let products = require(productsFile);
products.push({
  name: payload.name,
  price: payload.price,
  image: `images/${payload.imageName}`
});
fs.writeFileSync(productsFile, "module.exports = " + JSON.stringify(products, null, 2));
