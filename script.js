async function loadProducts() {
  const response = await fetch("products.json");
  const PRODUCTS = await response.json();
  console.log(PRODUCTS)

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

  function renderCategories() {
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
    currentCategory = filterCategory;
    productsContainer.innerHTML = "";

    let filteredProducts =
      currentCategory === "all"
        ? PRODUCTS
        : PRODUCTS.filter((p) => p.category === currentCategory);

    filteredProducts.forEach((product) => {
      const productCard = document.createElement("div");
      productCard.classList.add("product-card");

      // Перевіряємо, чи товар вже у кошику
      const cartItem = cart.find((i) => i.id == product.id);

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
    cartCount.textContent = totalItems;
  }

  function updateCartTotal() {
    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    cartTotalPrice.textContent = total.toFixed(2);
  }

  function renderCartItems() {
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
    const product = PRODUCTS.find((p) => p.id == productId);
    const existingItem = cart.find((item) => item.id == productId);

    if (existingItem) {
      existingItem.quantity++;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
    renderProducts(currentCategory); // 🔥 синхронізуємо картки
  }

  function updateQuantity(productId, type) {
    const cartItem = cart.find((i) => i.id == productId);
    if (!cartItem) return;

    if (type === "increase") {
      cartItem.quantity++;
    } else if (type === "decrease") {
      cartItem.quantity--;
    }

    if (cartItem.quantity <= 0) {
      cart = cart.filter((i) => i.id != productId);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
    renderProducts(currentCategory); // 🔥 оновлюємо список карток
  }

  function removeItem(productId) {
    cart = cart.filter((item) => item.id != productId);

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
    renderProducts(currentCategory); // 🔥 оновлюємо список карток
  }

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

  // ---- Очистити кошик ----
  function clearCart() {
    cart = [];
    localStorage.removeItem("cart");
    updateCartCount();
    renderCartItems();
    renderProducts(currentCategory); // 🔥 оновлюємо список карток
  }

  // ---- Генерація PDF з кирилицею ----
  async function generatePDF() {
    console.log("Натиснуто PDF");
    if (!cart.length) {
      alert("Кошик порожній.");
      return;
    }

    const body = [
      [
        {
          text: "Назва товару",
          bold: true,
          fillColor: "#55643b",
          color: "white",
        },
        {
          text: "Ціна за од.",
          bold: true,
          fillColor: "#55643b",
          color: "white",
        },
        { text: "Кількість", bold: true, fillColor: "#55643b", color: "white" },
        { text: "Сума", bold: true, fillColor: "#55643b", color: "white" },
      ],
      ...cart.map((i) => [
        i.name,
        { text: `${i.price.toFixed(2)} грн`, alignment: "right" },
        { text: i.quantity.toString(), alignment: "center" },
        {
          text: `${(i.price * i.quantity).toFixed(2)} грн`,
          alignment: "right",
        },
      ]),
    ];

    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

    const docDefinition = {
      content: [
        { text: "Замовлення", style: "header" },
        {
          table: {
            headerRows: 1,
            widths: ["*", "auto", "auto", "auto"],
            body: body,
          },
          layout: {
            fillColor: function (rowIndex) {
              return rowIndex % 2 === 0 ? "#f5f5f5" : null;
            },
          },
        },
        { text: `Загальна сума: ${total.toFixed(2)} грн`, style: "total" },
      ],
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
        total: { fontSize: 14, bold: true, margin: [0, 10, 0, 0] },
      },
      defaultStyle: {
        font: "Roboto",
      },
    };

    pdfMake.createPdf(docDefinition).download("Замовлення.pdf");
    clearCart();
  }

  // ---- Головний слухач ----
  document.addEventListener("DOMContentLoaded", () => {
    renderCategories();
    renderProducts(currentCategory);
    updateCartCount();
    renderCartItems();

    // Кнопки
    document
      .getElementById("clear-cart-btn")
      ?.addEventListener("click", clearCart);
    generatePdfBtn.addEventListener("click", generatePDF);

    // 📱 Гамбургер меню
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("show");
    });
  });

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
        .scrollIntoView({ behavior: "smooth" });
    }
  });

  cartButton.addEventListener("click", () => {
    cartSidebar.classList.toggle("open");
  });

  closeCartBtn.addEventListener("click", () => {
    cartSidebar.classList.remove("open");
  });

  cartItemsContainer.addEventListener("click", (e) => {
    const target = e.target;
    if (target.classList.contains("increase-btn")) {
      updateQuantity(target.dataset.id, "increase");
    } else if (target.classList.contains("decrease-btn")) {
      updateQuantity(target.dataset.id, "decrease");
    } else if (target.classList.contains("remove-item-btn")) {
      removeItem(target.dataset.id); // ✅ картка теж оновиться
    }
  });

  productsContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("add-to-cart-btn")) {
      addToCart(e.target.dataset.id);
    } else if (e.target.classList.contains("increase-btn")) {
      updateQuantity(e.target.dataset.id, "increase");
    } else if (e.target.classList.contains("decrease-btn")) {
      updateQuantity(e.target.dataset.id, "decrease");
    }
  });

  document.addEventListener("click", (e) => {
    // якщо клік був всередині корзини або на кнопку відкриття — нічого не робимо
    if (cartSidebar.contains(e.target) || cartButton.contains(e.target)) {
      return;
    }

    // інакше закриваємо
    cartSidebar.classList.remove("open");
  });
}
loadProducts();
