import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  getDatabase,
  ref,
  set,
  update,
  push,
  remove,
  onValue,
  get
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";


/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

const firebaseConfig = {

  apiKey: "PASTE_YOUR_EXISTING_FIREBASE_WEB_API_KEY",

  authDomain:
    "rittik-mobile-shop-web-1.firebaseapp.com",

  databaseURL:
    "https://rittik-mobile-shop-web-1-default-rtdb.firebaseio.com",

  projectId:
    "rittik-mobile-shop-web-1",

  storageBucket:
    "rittik-mobile-shop-web-1.firebasestorage.app",

  messagingSenderId:
    "PASTE_YOUR_EXISTING_MESSAGING_SENDER_ID",

  appId:
    "PASTE_YOUR_EXISTING_APP_ID"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);


/* =========================================================
   ADMIN AUTHORIZATION
   =========================================================

   এখানে শুধুমাত্র তোমার আসল admin email রাখবে।
*/

const ADMIN_EMAILS = [

  "samimak7312@gmail.com",

  "admin@rittikmobile.com",

  "admin@rittik.com",

  "owner@rittikmobile.com"

].map(e => e.toLowerCase());


/* =========================================================
   DATA
   ========================================================= */

let products = [];
let orders = [];
let sellRequests = [];
let customers = [];

let currentSell = null;


/* =========================================================
   ELEMENT HELPERS
   ========================================================= */

const $ = id => document.getElementById(id);


/* =========================================================
   TOAST
   ========================================================= */

function toast(message) {

  const el = $("toast");

  if (!el) return;

  el.textContent = message;

  el.classList.add("show");

  setTimeout(() => {

    el.classList.remove("show");

  }, 3000);
}


/* =========================================================
   NAVIGATION
   ========================================================= */

window.openSection = function(sectionName) {

  document.querySelectorAll(".section").forEach(section => {

    section.classList.remove("active");

  });


  const section = $(sectionName);

  if (section) {

    section.classList.add("active");

  }


  document.querySelectorAll(".nav-btn").forEach(btn => {

    btn.classList.toggle(
      "active",
      btn.dataset.section === sectionName
    );

  });


  const title = document.querySelector(
    `.nav-btn[data-section="${sectionName}"] span`
  );

  $("pageTitle").textContent =
    title ? title.textContent : "Dashboard";


  document.querySelector(".sidebar")
    ?.classList.remove("open");

};


document.querySelectorAll(".nav-btn").forEach(btn => {

  btn.addEventListener("click", () => {

    openSection(btn.dataset.section);

  });

});


$("mobileMenuBtn")?.addEventListener("click", () => {

  document.querySelector(".sidebar")
    ?.classList.toggle("open");

});


/* =========================================================
   AUTH
   ========================================================= */

$("loginForm").addEventListener("submit", async e => {

  e.preventDefault();

  const email =
    $("email").value.trim().toLowerCase();

  const password =
    $("password").value;


  const errorBox = $("loginError");

  errorBox.style.display = "none";


  if (!ADMIN_EMAILS.includes(email)) {

    errorBox.textContent =
      "This email is not authorized as an administrator.";

    errorBox.style.display = "block";

    return;
  }


  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  } catch (error) {

    errorBox.textContent =
      error.message || "Login failed.";

    errorBox.style.display = "block";

  }

});


onAuthStateChanged(auth, user => {

  if (!user) {

    $("loginScreen").classList.remove("hidden");

    $("adminApp").classList.add("hidden");

    return;

  }


  const email =
    (user.email || "").toLowerCase();


  if (!ADMIN_EMAILS.includes(email)) {

    signOut(auth);

    return;

  }


  $("loginScreen").classList.add("hidden");

  $("adminApp").classList.remove("hidden");

  $("adminEmail").textContent =
    user.email;


  startFirebaseListeners();

});


$("logoutBtn").addEventListener("click", async () => {

  await signOut(auth);

});


/* =========================================================
   FIREBASE LISTENERS
   ========================================================= */

function startFirebaseListeners() {

  listenProducts();

  listenOrders();

  listenSellRequests();

  listenStoreLocation();

  listenDelivery();

  listenHomepage();

  listenWebsiteSettings();

  listenServices();

}


/* =========================================================
   PRODUCTS
   ========================================================= */

function listenProducts() {

  onValue(ref(db, "products"), snapshot => {

    const data = snapshot.val() || {};

    products = Object.keys(data).map(key => ({

      ...data[key],

      firebaseKey: key,

      id: data[key]?.id || key

    }));


    products.reverse();

    renderProducts();

    updateDashboard();

  });

}


function renderProducts() {

  const tbody = $("productsTable");

  if (!tbody) return;


  const search =
    ($("productSearch")?.value || "")
      .toLowerCase();


  const filter =
    $("productFilter")?.value || "all";


  let list = products.filter(product => {

    const name =
      String(product.name || "")
        .toLowerCase();

    const brand =
      String(product.brand || "")
        .toLowerCase();


    const matchesSearch =
      name.includes(search) ||
      brand.includes(search);


    let matchesFilter = true;


    if (filter === "approved") {

      matchesFilter =
        String(product.status || "")
          .toLowerCase() === "approved";

    }


    if (filter === "out") {

      matchesFilter =
        product.outOfStock === true ||
        Number(product.stock || 0) <= 0;

    }


    return matchesSearch && matchesFilter;

  });


  if (!list.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="muted">
          No products found.
        </td>
      </tr>
    `;

    return;

  }


  tbody.innerHTML = list.map(product => {

    const image =
      product.image ||
      product.images?.[0] ||
      "https://via.placeholder.com/80";


    const stock =
      Number(product.stock ?? 1);


    const out =
      product.outOfStock === true ||
      stock <= 0;


    const status =
      product.status || "approved";


    return `

      <tr>

        <td>

          <div class="product-cell">

            <img src="${escapeHtml(image)}">

            <div>

              <strong>
                ${escapeHtml(product.name || "Unnamed")}
              </strong>

              <div class="muted">
                ${escapeHtml(product.category || "Mobile")}
              </div>

            </div>

          </div>

        </td>


        <td>
          ${escapeHtml(product.brand || "-")}
        </td>


        <td>
          ₹${Number(product.price || 0).toLocaleString("en-IN")}
        </td>


        <td>
          ${escapeHtml(product.ram || product.highlights?.ram || "-")}
          /
          ${escapeHtml(product.rom || product.highlights?.rom || "-")}
        </td>


        <td>
          ${stock}
        </td>


        <td>

          <span class="badge ${
            status === "approved"
              ? "badge-green"
              : "badge-orange"
          }">

            ${escapeHtml(status)}

          </span>

        </td>


        <td>

          <button
            class="small-btn"
            onclick="editProduct('${product.firebaseKey}')">

            Edit

          </button>


          <button
            class="danger-btn"
            onclick="deleteProduct('${product.firebaseKey}')">

            Delete

          </button>

        </td>

      </tr>

    `;

  }).join("");

}


$("productSearch")?.addEventListener(
  "input",
  renderProducts
);


$("productFilter")?.addEventListener(
  "change",
  renderProducts
);


/* =========================================================
   PRODUCT MODAL
   ========================================================= */

window.openProductModal = function(product = null) {

  $("productModal").classList.add("show");


  $("productForm").reset();


  $("editProductKey").value =
    product?.firebaseKey || "";


  $("productModalTitle").textContent =
    product
      ? "Edit Product"
      : "Add New Product";


  if (!product) return;


  $("pName").value =
    product.name || "";


  $("pBrand").value =
    product.brand || "";


  $("pCategory").value =
    product.category || "Smartphone";


  $("pPrice").value =
    product.price || "";


  $("pMrp").value =
    product.mrp || "";


  $("pStock").value =
    product.stock ?? 1;


  $("pRam").value =
    product.ram ||
    product.highlights?.ram ||
    "";


  $("pRom").value =
    product.rom ||
    product.highlights?.rom ||
    "";


  $("pProcessor").value =
    product.processor || "";


  $("pDisplay").value =
    product.display || "";


  $("pCamera").value =
    product.camera || "";


  $("pBattery").value =
    product.battery || "";


  $("pCondition").value =
    product.condition || "New";


  $("pQuality").value =
    product.quality || "Verified";


  $("pWarranty").value =
    product.warranty || "";


  $("pImage").value =
    product.image ||
    product.images?.[0] ||
    "";


  $("pHighlights").value =
    Array.isArray(product.highlights)
      ? product.highlights.join(", ")
      : product.highlightsText || "";

};


window.closeProductModal = function() {

  $("productModal").classList.remove("show");

};


$("productForm").addEventListener(
  "submit",
  async e => {

    e.preventDefault();


    const editKey =
      $("editProductKey").value;


    const highlightsText =
      $("pHighlights").value.trim();


    const productData = {

      name: $("pName").value.trim(),

      brand: $("pBrand").value.trim(),

      category: $("pCategory").value.trim(),

      price: Number($("pPrice").value || 0),

      mrp: Number($("pMrp").value || 0),

      stock: Number($("pStock").value || 0),

      outOfStock:
        Number($("pStock").value || 0) <= 0,

      ram: $("pRam").value.trim(),

      rom: $("pRom").value.trim(),

      processor:
        $("pProcessor").value.trim(),

      display:
        $("pDisplay").value.trim(),

      camera:
        $("pCamera").value.trim(),

      battery:
        $("pBattery").value.trim(),

      condition:
        $("pCondition").value,

      quality:
        $("pQuality").value,

      warranty:
        $("pWarranty").value.trim(),

      image:
        $("pImage").value.trim(),

      images:
        $("pImage").value.trim()
          ? [$("pImage").value.trim()]
          : [],

      highlightsText,

      highlights: {

        ram: $("pRam").value.trim(),

        rom: $("pRom").value.trim(),

        processor:
          $("pProcessor").value.trim(),

        display:
          $("pDisplay").value.trim(),

        camera:
          $("pCamera").value.trim(),

        battery:
          $("pBattery").value.trim(),

        text: highlightsText

      },

      status: "approved"

    };


    try {

      if (editKey) {

        await update(
          ref(db, `products/${editKey}`),
          productData
        );

        toast("Product updated successfully.");

      } else {

        const newRef =
          push(ref(db, "products"));


        productData.id =
          "PROD-" +
          Date.now().toString().slice(-8);


        productData.createdAt =
          Date.now();


        productData.type =
          "admin";


        await set(
          newRef,
          productData
        );


        toast("New product added.");

      }


      closeProductModal();

    } catch (error) {

      alert(
        "Product save failed: " +
        error.message
      );

    }

  }
);


/* =========================================================
   EDIT / DELETE PRODUCT
   ========================================================= */

window.editProduct = function(key) {

  const product =
    products.find(
      p => p.firebaseKey === key
    );


  if (product) {

    openProductModal(product);

  }

};


window.deleteProduct = async function(key) {

  if (!confirm(
    "Delete this product permanently?"
  )) return;


  try {

    await remove(
      ref(db, `products/${key}`)
    );

    toast("Product deleted.");

  } catch (error) {

    alert(
      "Delete failed: " +
      error.message
    );

  }

};


/* =========================================================
   ORDERS
   ========================================================= */

function listenOrders() {

  onValue(ref(db, "orders"), snapshot => {

    const data = snapshot.val() || {};

    orders =
      Object.keys(data).map(key => ({

        ...data[key],

        firebaseKey: key

      }));


    orders.reverse();

    renderOrders();

    renderRecentOrders();

    buildCustomers();

    updateDashboard();

  });

}


function getCustomerName(order) {

  return (
    order.customerName ||
    order.name ||
    order.customer?.name ||
    order.deliveryAddress?.name ||
    "Customer"
  );

}


function getCustomerPhone(order) {

  return (
    order.mobile ||
    order.phone ||
    order.customer?.mobile ||
    order.customer?.phone ||
    order.contact ||
    "-"
  );

}


function getCustomerAddress(order) {

  return (
    order.address ||
    order.customer?.address ||
    order.deliveryAddress?.address ||
    "-"
  );

}


function getOrderTotal(order) {

  return Number(
    order.total ||
    order.grandTotal ||
    order.amount ||
    order.totalAmount ||
    0
  );

}


function renderOrders() {

  const tbody = $("ordersTable");

  if (!tbody) return;


  if (!orders.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="muted">
          No orders found.
        </td>
      </tr>
    `;

    return;

  }


  tbody.innerHTML =
    orders.map(order => {

      const status =
        order.status || "Pending";


      return `

        <tr>

          <td>
            <strong>
              ${escapeHtml(
                order.firebaseKey
              )}
            </strong>
          </td>


          <td>
            ${escapeHtml(
              getCustomerName(order)
            )}
          </td>


          <td>
            ${escapeHtml(
              getCustomerPhone(order)
            )}
          </td>


          <td>
            ₹${getOrderTotal(order)
              .toLocaleString("en-IN")}
          </td>


          <td>

            <span class="badge badge-blue">
              ${escapeHtml(status)}
            </span>

          </td>


          <td>

            <select
              onchange="updateOrderStatus(
                '${order.firebaseKey}',
                this.value
              )">

              ${orderStatusOptions(status)}

            </select>

          </td>

        </tr>

      `;

    }).join("");

}


function orderStatusOptions(current) {

  const options = [

    "Pending",

    "Confirmed",

    "Processing",

    "Shipped",

    "Out for Delivery",

    "Delivered",

    "Cancelled"

  ];


  return options.map(status => `

    <option
      value="${status}"
      ${status.toLowerCase() ===
        String(current).toLowerCase()
        ? "selected"
        : ""}>

      ${status}

    </option>

  `).join("");

}


window.updateOrderStatus =
  async function(key, status) {

    try {

      await update(
        ref(db, `orders/${key}`),
        {
          status,
          statusUpdatedAt: Date.now()
        }
      );


      toast(
        `Order status changed to ${status}.`
      );

    } catch (error) {

      alert(
        "Status update failed: " +
        error.message
      );

    }

  };


function renderRecentOrders() {

  const tbody =
    $("recentOrders");


  if (!tbody) return;


  tbody.innerHTML =
    orders.slice(0, 6).map(order => `

      <tr>

        <td>
          ${escapeHtml(order.firebaseKey)}
        </td>

        <td>
          ${escapeHtml(getCustomerName(order))}
        </td>

        <td>
          ₹${getOrderTotal(order)
            .toLocaleString("en-IN")}
        </td>

        <td>
          <span class="badge badge-blue">
            ${escapeHtml(
              order.status || "Pending"
            )}
          </span>
        </td>

        <td>

          <button
            class="small-btn"
            onclick="openSection('orders')">

            Open

          </button>

        </td>

      </tr>

    `).join("");

}


/* =========================================================
   CUSTOMERS
   ========================================================= */

function buildCustomers() {

  const map = {};


  orders.forEach(order => {

    const email =
      order.email ||
      order.customer?.email ||
      getCustomerPhone(order) ||
      "unknown";


    if (!map[email]) {

      map[email] = {

        name:
          getCustomerName(order),

        email:
          order.email ||
          order.customer?.email ||
          "-",

        mobile:
          getCustomerPhone(order),

        address:
          getCustomerAddress(order),

        orders: 0

      };

    }


    map[email].orders++;

  });


  customers =
    Object.values(map);


  renderCustomers();

}


function renderCustomers() {

  const tbody =
    $("customersTable");


  if (!tbody) return;


  tbody.innerHTML =
    customers.map(customer => `

      <tr>

        <td>
          ${escapeHtml(customer.name)}
        </td>

        <td>
          ${escapeHtml(customer.email)}
        </td>

        <td>
          ${escapeHtml(customer.mobile)}
        </td>

        <td>
          ${escapeHtml(customer.address)}
        </td>

        <td>
          ${customer.orders}
        </td>

      </tr>

    `).join("");

}


/* =========================================================
   SELL REQUESTS
   ========================================================= */

function listenSellRequests() {

  onValue(
    ref(db, "sellerRequests"),
    snapshot => {

      const data =
        snapshot.val() || {};


      sellRequests =
        Object.keys(data).map(key => ({

          ...data[key],

          firebaseKey: key

        }));


      sellRequests.reverse();

      renderSellRequests();

      updateDashboard();

    }
  );

}


function renderSellRequests() {

  const tbody =
    $("sellsTable");


  if (!tbody) return;


  if (!sellRequests.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="muted">
          No sell requests found.
        </td>
      </tr>
    `;

    return;

  }


  tbody.innerHTML =
    sellRequests.map(req => `

      <tr>

        <td>
          <strong>
            ${escapeHtml(
              req.sellerName || "Seller"
            )}
          </strong>
        </td>


        <td>
          ${escapeHtml(
            req.name || req.model || "-"
          )}
        </td>


        <td>
          ₹${Number(
            req.price || 0
          ).toLocaleString("en-IN")}
        </td>


        <td>
          ${escapeHtml(
            req.contact || "-"
          )}
        </td>


        <td>

          <span class="badge ${
            String(req.status || "")
              .toLowerCase()
              .includes("reject")
              ? "badge-red"
              : String(req.status || "")
                  .toLowerCase()
                  .includes("accept")
                ? "badge-green"
                : "badge-orange"
          }">

            ${escapeHtml(
              req.status || "Pending"
            )}

          </span>

        </td>


        <td>

          <button
            class="small-btn"
            onclick="openSellRequest(
              '${req.firebaseKey}'
            )">

            Review

          </button>

        </td>

      </tr>

    `).join("");

}


window.openSellRequest = function(key) {

  currentSell =
    sellRequests.find(
      r => r.firebaseKey === key
    );


  if (!currentSell) return;


  $("sellModalSubtitle").textContent =
    currentSell.name || "Sell Request";


  $("sellDetails").innerHTML = `

    <div class="field">

      <label>Seller Name</label>

      <input
        value="${escapeHtml(
          currentSell.sellerName || ""
        )}"
        readonly>

    </div>


    <div class="field">

      <label>Device</label>

      <input
        value="${escapeHtml(
          currentSell.name || ""
        )}"
        readonly>

    </div>


    <div class="field">

      <label>Expected Price</label>

      <input
        value="₹${Number(
          currentSell.price || 0
        ).toLocaleString("en-IN")}"
        readonly>

    </div>


    <div class="field">

      <label>Contact</label>

      <input
        value="${escapeHtml(
          currentSell.contact || ""
        )}"
        readonly>

    </div>


    <div class="field">

      <label>Address</label>

      <textarea readonly>${escapeHtml(
        currentSell.address || ""
      )}</textarea>

    </div>

  `;


  $("sellModal").classList.add("show");

};


window.closeSellModal = function() {

  $("sellModal").classList.remove("show");

  currentSell = null;

};


/* =========================================================
   SELL ACCEPT + LAUNCH
   ========================================================= */

window.acceptCurrentSell =
  async function() {

    if (!currentSell) return;


    const key =
      currentSell.firebaseKey;


    try {

      /*
       * 1. Accept seller request
       */

      await update(
        ref(db, `sellerRequests/${key}`),
        {

          status: "launched",

          accepted: true,

          launched: true,

          approvedAt: Date.now(),

          launchedAt: Date.now()

        }
      );


      /*
       * 2. Launch the product
       */

      await update(
        ref(db, `products/${key}`),
        {

          status: "approved",

          published: true,

          launched: true,

          launchedAt: Date.now()

        }
      );


      /*
       * 3. Create approved seller
       */

      const approvedSeller = {

        id:
          "SELLER-" +
          Date.now().toString().slice(-8),

        name:
          currentSell.sellerName || "",

        mobile:
          currentSell.contact || "",

        email:
          currentSell.userEmail ||
          currentSell.email ||
          "",

        deviceSold:
          currentSell.name || "",

        agreedPrice:
          currentSell.price || 0,

        status:
          "active",

        approvedDate:
          new Date().toLocaleDateString(),

        timestamp:
          Date.now()

      };


      await push(
        ref(db, "approvedSellers"),
        approvedSeller
      );


      toast(
        "Sell request accepted and product launched."
      );


      closeSellModal();

    } catch (error) {

      alert(
        "Accept & Launch failed: " +
        error.message
      );

    }

  };


/* =========================================================
   SELL REJECT
   ========================================================= */

window.rejectCurrentSell =
  async function() {

    if (!currentSell) return;


    if (!confirm(
      "Reject this sell request?"
    )) return;


    const key =
      currentSell.firebaseKey;


    try {

      await update(
        ref(db, `sellerRequests/${key}`),
        {

          status: "Rejected",

          rejectedAt: Date.now()

        }
      );


      await update(
        ref(db, `products/${key}`),
        {

          status: "rejected",

          published: false

        }
      ).catch(() => {});


      toast(
        "Sell request rejected."
      );


      closeSellModal();

    } catch (error) {

      alert(
        "Reject failed: " +
        error.message
      );

    }

  };


/* =========================================================
   TRACKING
   ========================================================= */

window.addTrackingUpdate =
  async function() {

    const orderId =
      $("trackingOrderId").value.trim();


    const status =
      $("trackingStatus").value;


    const message =
      $("trackingMessage").value.trim();


    if (!orderId) {

      alert("Enter Order ID.");

      return;

    }


    try {

      const eventRef =
        push(
          ref(
            db,
            `orders/${orderId}/trackingTimeline`
          )
        );


      await set(eventRef, {

        status,

        message,

        timestamp: Date.now(),

        date:
          new Date().toLocaleString()

      });


      await update(
        ref(db, `orders/${orderId}`),
        {

          status,

          statusUpdatedAt: Date.now()

        }
      );


      $("trackingMessage").value = "";

      toast(
        "Tracking update added."
      );

    } catch (error) {

      alert(
        "Tracking update failed: " +
        error.message
      );

    }

  };


/* =========================================================
   MAP
   ========================================================= */

function listenStoreLocation() {

  onValue(
    ref(db, "storeLocation"),
    snapshot => {

      const loc =
        snapshot.val() || {

          lat: 22.5726,

          lng: 88.3639

        };


      $("mapLat").value =
        loc.lat || "";


      $("mapLng").value =
        loc.lng || "";


      updateMapPreview();

    }
  );

}


function updateMapPreview() {

  const lat =
    $("mapLat").value;


  const lng =
    $("mapLng").value;


  if (!lat || !lng) return;


  $("mapFrame").src =
    `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;

}


$("mapLat")?.addEventListener(
  "input",
  updateMapPreview
);


$("mapLng")?.addEventListener(
  "input",
  updateMapPreview
);


window.saveMapLocation =
  async function() {

    const lat =
      Number($("mapLat").value);


    const lng =
      Number($("mapLng").value);


    if (!Number.isFinite(lat) ||
        !Number.isFinite(lng)) {

      alert("Invalid latitude/longitude.");

      return;

    }


    try {

      await set(
        ref(db, "storeLocation"),
        {

          lat,

          lng,

          updatedAt: Date.now()

        }
      );


      toast(
        "Store location updated."
      );

    } catch (error) {

      alert(
        "Map update failed: " +
        error.message
      );

    }

  };


/* =========================================================
   DELIVERY
   ========================================================= */

function listenDelivery() {

  onValue(
    ref(db, "deliverySettings"),
    snapshot => {

      const data =
        snapshot.val() || {};


      $("deliveryCharge").value =
        data.charge ?? 0;


      $("freeDelivery").value =
        data.freeThreshold ?? 499;


      $("deliveryDays").value =
        data.deliveryDays ||
        "2 - 4 Business Days";

    }
  );

}


window.saveDelivery =
  async function() {

    try {

      await set(
        ref(db, "deliverySettings"),
        {

          charge:
            Number(
              $("deliveryCharge").value || 0
            ),

          freeThreshold:
            Number(
              $("freeDelivery").value || 0
            ),

          deliveryDays:
            $("deliveryDays").value.trim(),

          updatedAt:
            Date.now()

        }
      );


      toast(
        "Delivery settings saved."
      );

    } catch (error) {

      alert(
        "Delivery save failed: " +
        error.message
      );

    }

  };


/* =========================================================
   HOMEPAGE
   ========================================================= */

function listenHomepage() {

  onValue(
    ref(db, "homepageSettings"),
    snapshot => {

      const data =
        snapshot.val() || {};


      $("hpAnnouncement").value =
        data.announcement || "";


      $("hpHeadline").value =
        data.heroHeadline || "";


      $("hpSubtitle").value =
        data.heroSubtitle || "";


      $("hpImage").value =
        data.heroImage || "";

    }
  );

}


window.saveHomepage =
  async function() {

    try {

      await set(
        ref(db, "homepageSettings"),
        {

          announcement:
            $("hpAnnouncement").value,

          heroHeadline:
            $("hpHeadline").value,

          heroSubtitle:
            $("hpSubtitle").value,

          heroImage:
            $("hpImage").value,

          updatedAt:
            Date.now()

        }
      );


      toast(
        "Homepage settings saved."
      );

    } catch (error) {

      alert(
        "Homepage save failed: " +
        error.message
      );

    }

  };


/* =========================================================
   WEBSITE SETTINGS
   ========================================================= */

function listenWebsiteSettings() {

  onValue(
    ref(db, "websiteSettings"),
    snapshot => {

      const data =
        snapshot.val() || {};


      $("siteTitle").value =
        data.title || "";


      $("logoUrl").value =
        data.logoUrl || "";


      $("facebookUrl").value =
        data.facebook || "";


      $("instagramUrl").value =
        data.instagram || "";

    }
  );

}


window.saveWebsiteSettings =
  async function() {

    try {

      await set(
        ref(db, "websiteSettings"),
        {

          title:
            $("siteTitle").value,

          logoUrl:
            $("logoUrl").value,

          facebook:
            $("facebookUrl").value,

          instagram:
            $("instagramUrl").value,

          updatedAt:
            Date.now()

        }
      );


      toast(
        "Website settings saved."
      );

    } catch (error) {

      alert(
        "Settings save failed: " +
        error.message
      );

    }

  };


/* =========================================================
   SERVICES
   ========================================================= */

function listenServices() {

  onValue(
    ref(db, "servicesSettings"),
    snapshot => {

      const data =
        snapshot.val() || {};


      $("serviceBuy").checked =
        data.buy !== false;


      $("serviceSell").checked =
        data.sell !== false;


      $("serviceTracking").checked =
        data.tracking !== false;


      $("serviceVerification").checked =
        data.verification !== false;

    }
  );

}


window.saveServices =
  async function() {

    try {

      await set(
        ref(db, "servicesSettings"),
        {

          buy:
            $("serviceBuy").checked,

          sell:
            $("serviceSell").checked,

          tracking:
            $("serviceTracking").checked,

          verification:
            $("serviceVerification").checked,

          updatedAt:
            Date.now()

        }
      );


      toast(
        "Services settings saved."
      );

    } catch (error) {

      alert(
        "Services save failed: " +
        error.message
      );

    }

  };


/* =========================================================
   DASHBOARD
   ========================================================= */

function updateDashboard() {

  const pendingOrders =
    orders.filter(order => {

      const status =
        String(order.status || "")
          .toLowerCase();


      return [

        "pending",

        "confirmed",

        "confirmed & processing",

        "processing",

        "order placed"

      ].includes(status);

    });


  $("totalProducts").textContent =
    products.length;


  $("totalOrders").textContent =
    orders.length;


  $("pendingOrders").textContent =
    pendingOrders.length;


  $("totalSells").textContent =
    sellRequests.length;


  $("productBadge").textContent =
    products.length;


  $("orderBadge").textContent =
    pendingOrders.length;


  $("sellBadge").textContent =
    sellRequests.filter(s =>
      String(s.status || "")
        .toLowerCase()
        .includes("pending")
    ).length;

}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHtml(value) {

  return String(value ?? "")

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

}


/* =========================================================
   START
   ========================================================= */

console.log(
  "Rittik Mobile Shop Admin loaded."
);