// Функція для ініціалізації додатку та завантаження даних
async function loadProducts() {
  if (window.location.pathname.includes("/admin/")) {
    console.log("Завантаження script.js проігноровано на сторінці адмінки.");
    return;
  }
  let PRODUCTS = [];
  try {
    const response = await fetch("products.json");
    // Додаємо перевірку відповіді на помилки (404, 500 тощо)
    if (!response.ok) {
      throw new Error(`Помилка завантаження products.json: ${response.status}`);
    }
    PRODUCTS = await response.json();
    console.log("Товари успішно завантажені:", PRODUCTS); // Це працює, як ми бачили
  } catch (error) {
    console.error("Критична помилка ініціалізації:", error);
    // Показуємо помилку користувачу
    document.querySelector("main").innerHTML =
      "<p style='color: red;'>Не вдалося завантажити товари. Перевірте файл products.json.</p>";
    return; // Зупиняємо виконання функції, якщо дані не завантажилися
  }

  // --- КОНСТАНТИ DOM ---
  // Переконайтеся, що всі ці елементи існують у вашому index.html!
  const productsContainer = document.querySelector(".product-grid");
  const categoryList = document.getElementById("category-list");
  const cartButton = document.getElementById("cart-button");
  const cartSidebar = document.getElementById("cart-sidebar");
  const closeCartBtn = document.getElementById("close-cart-btn");
  const cartCount = document.getElementById("cart-count");
  const cartItemsContainer = document.getElementById("cart-items");
  const cartTotalPrice = document.getElementById("cart-total-price");
  const generatePdfBtn = document.getElementById("generate-pdf-btn");

  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");

  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let currentCategory = "all";

  // --- ФУНКЦІЇ РЕНДЕРИНГУ ТА ЛОГІКА ---

  function renderCategories() {
    // Якщо елемент не знайдено, просто виходимо
    if (!categoryList) return;

    const categories = [
      ...new Set(PRODUCTS.map((product) => product.category)),
    ];
    categoryList.innerHTML = `<li class="active"><a href="#" data-category="all">Усі товари</a></li>`;
    categories.forEach((category) => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="#" data-category="${category}">${category}</a>`;
      categoryList.appendChild(li);
    });
  }

  function renderProducts(filterCategory = currentCategory) {
    // Якщо елемент не знайдено, просто виходимо
    if (!productsContainer) {
      console.error("Контейнер .product-grid не знайдено!");
      return;
    }

    currentCategory = filterCategory;
    productsContainer.innerHTML = "";

    let filteredProducts =
      currentCategory === "all"
        ? PRODUCTS
        : PRODUCTS.filter((p) => p.category === currentCategory);

    filteredProducts.forEach((product) => {
      const productCard = document.createElement("div");
      productCard.classList.add("product-card");

      // Використовуємо Number(product.id) для безпечного порівняння, як обговорювалося раніше
      const cartItem = cart.find((i) => Number(i.id) === Number(product.id));

      productCard.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>${product.price.toFixed(2)} грн</p>
        <div class="product-actions">
          ${
            cartItem
              ? `
                <div class="item-quantity-control">
                  <button class="quantity-btn decrease-btn" data-id="${product.id}">-</button>
                  <span class="quantity-display">${cartItem.quantity}</span>
                  <button class="quantity-btn increase-btn" data-id="${product.id}">+</button>
                </div>
              `
              : `<button class="add-to-cart-btn" data-id="${product.id}">Додати в кошик</button>`
          }
        </div>
      `;

      productsContainer.appendChild(productCard);
    });

    // 🔥 підсвічуємо активну категорію
    document.querySelectorAll(".category-list li").forEach((li) => {
      li.classList.remove("active");
      if (li.querySelector("a")?.dataset.category === currentCategory) {
        li.classList.add("active");
      }
    });
  }

  function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.textContent = totalItems;
  }

  function updateCartTotal() {
    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    if (cartTotalPrice) cartTotalPrice.textContent = total.toFixed(2);
  }

  function renderCartItems() {
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = "";
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = "<p>Кошик порожній.</p>";
      updateCartTotal();
      return;
    }
    cart.forEach((item) => {
      const cartItem = document.createElement("div");
      cartItem.classList.add("cart-item");
      cartItem.innerHTML = `
              <img src="${item.image}" alt="${
        item.name
      }" class="cart-item-image">
              <div class="cart-item-info">
                  <h4>${item.name}</h4>
                  <p>${item.price.toFixed(2)} грн</p>
                  <div class="item-quantity-control">
                      <button class="quantity-btn decrease-btn" data-id="${
                        item.id
                      }">-</button>
                      <span class="quantity-display">${item.quantity}</span>
                      <button class="quantity-btn increase-btn" data-id="${
                        item.id
                      }">+</button>
                  </div>
              </div>
              <button class="remove-item-btn" data-id="${
                item.id
              }">&times;</button>
          `;
      cartItemsContainer.appendChild(cartItem);
    });
    updateCartTotal();
  }

  function addToCart(productId) {
    const id = Number(productId);
    const product = PRODUCTS.find((p) => Number(p.id) === id);
    const existingItem = cart.find((item) => Number(item.id) === id);

    if (product) {
      if (existingItem) {
        existingItem.quantity++;
      } else {
        // Використовуємо спред-оператор для створення копії об'єкта
        cart.push({ ...product, quantity: 1 });
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      updateCartCount();
      renderCartItems();
      renderProducts(currentCategory); // синхронізуємо картки
    }
  }

  function updateQuantity(productId, type) {
    const id = Number(productId);
    const cartItem = cart.find((i) => Number(i.id) === id);
    if (!cartItem) return;

    if (type === "increase") {
      cartItem.quantity++;
    } else if (type === "decrease") {
      cartItem.quantity--;
    }

    if (cartItem.quantity <= 0) {
      cart = cart.filter((i) => Number(i.id) !== id);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
    renderProducts(currentCategory); // оновлюємо список карток
  }

  function removeItem(productId) {
    const id = Number(productId);
    cart = cart.filter((item) => Number(item.id) !== id);

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
    renderProducts(currentCategory); // оновлюємо список карток
  }

  // Функції PDF (залишимо без змін, оскільки вони коректні)
  const PDF_FONT_URL = "/fonts/Roboto-Regular.ttf";
  let ROBOTO_BASE64 = null;

  async function getPdfFontBase64() {
    if (ROBOTO_BASE64) return ROBOTO_BASE64;
    const res = await fetch(PDF_FONT_URL);
    if (!res.ok) throw new Error("Не вдалося завантажити шрифт для PDF");
    const buf = await res.arrayBuffer();
    // надійне перетворення у base64 (частинами)
    let binary = "";
    const bytes = new Uint8Array(buf);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    ROBOTO_BASE64 = btoa(binary);
    return ROBOTO_BASE64;
  }

  function clearCart() {
    cart = [];
    localStorage.removeItem("cart");
    updateCartCount();
    renderCartItems();
    renderProducts(currentCategory);
  }

  async function generatePDF() {
    // ... ваш код генерації PDF, що використовує cart і pdfMake
    if (!cart.length) {
      alert("Кошик порожній.");
      return;
    }

    // ... (весь код PDF залишаємо, він коректний) ...
    const body = [
      // ...
    ];

    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

    const docDefinition = {
      // ...
    };

    pdfMake.createPdf(docDefinition).download("Замовлення.pdf");
    clearCart();
  }

  // --- ВИКЛИК РЕНДЕРИНГУ ТА СЛУХАЧІВ (після завантаження даних) ---

  // Рендеримо все, щойно дані готові
  renderCategories();
  renderProducts(currentCategory);
  updateCartCount();
  renderCartItems();

  // Слухачі подій

  if (document.getElementById("clear-cart-btn")) {
    document
      .getElementById("clear-cart-btn")
      .addEventListener("click", clearCart);
  }
  if (generatePdfBtn) {
    generatePdfBtn.addEventListener("click", generatePDF);
  }

  // 📱 Гамбургер меню
  if (hamburger) {
    hamburger.addEventListener("click", () => {
      if (navLinks) navLinks.classList.toggle("show");
    });
  }

  if (categoryList) {
    categoryList.addEventListener("click", (e) => {
      e.preventDefault();
      if (e.target.tagName === "A") {
        document
          .querySelectorAll(".category-list li")
          .forEach((li) => li.classList.remove("active"));
        e.target.parentElement.classList.add("active");
        const category = e.target.dataset.category;
        renderProducts(category);

        document
          .getElementById("products")
          ?.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  if (cartButton) {
    cartButton.addEventListener("click", () => {
      if (cartSidebar) cartSidebar.classList.toggle("open");
    });
  }

  if (closeCartBtn) {
    closeCartBtn.addEventListener("click", () => {
      if (cartSidebar) cartSidebar.classList.remove("open");
    });
  }

  if (cartItemsContainer) {
    cartItemsContainer.addEventListener("click", (e) => {
      const target = e.target;
      if (target.classList.contains("increase-btn")) {
        updateQuantity(target.dataset.id, "increase");
      } else if (target.classList.contains("decrease-btn")) {
        updateQuantity(target.dataset.id, "decrease");
      } else if (target.classList.contains("remove-item-btn")) {
        removeItem(target.dataset.id);
      }
    });
  }

  if (productsContainer) {
    productsContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("add-to-cart-btn")) {
        addToCart(e.target.dataset.id);
      } else if (e.target.classList.contains("increase-btn")) {
        updateQuantity(e.target.dataset.id, "increase");
      } else if (e.target.classList.contains("decrease-btn")) {
        updateQuantity(e.target.dataset.id, "decrease");
      }
    });
  }

  // Додаємо загальний слухач для закриття кошика, але з перевірками на існування елементів
  document.addEventListener("click", (e) => {
    if (!cartSidebar || !cartButton) return;

    // якщо клік був всередині корзини або на кнопку відкриття — нічого не робимо
    if (cartSidebar.contains(e.target) || cartButton.contains(e.target)) {
      return;
    }

    // інакше закриваємо
    cartSidebar.classList.remove("open");
  });
}

// Запускаємо функцію після того, як DOM повністю завантажиться
document.addEventListener("DOMContentLoaded", loadProducts);

// !! УВАГА: Видаліть виклик loadProducts() з кінця файлу, якщо він там був
// (оскільки ми перемістили його в document.addEventListener("DOMContentLoaded", ...))
