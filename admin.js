// ============================================================
// RITTIK MOBILE SHOP - ADMIN PANEL
// Firebase Realtime Database
// LOGIN DISABLED FOR NOW
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    onValue,
    set,
    update,
    push,
    remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

const firebaseConfig = {

    // এখানে তোমার আগের admin.js-এর একই apiKey বসাও
    apiKey: "AIzaSyBIddmdEKtGl0OI97ky6Q3JJBs2dOzbnbA",

    databaseURL:
        "https://rittik-mobile-shop-web-1-default-rtdb.firebaseio.com",

    projectId:
        "rittik-mobile-shop-web-1"
};


// ============================================================
// FIREBASE INITIALIZE
// ============================================================

let app = null;
let db = null;

try {

    app = initializeApp(
        firebaseConfig,
        "RittikAdminPanel"
    );

    db = getDatabase(app);

    console.log(
        "Firebase Admin connected successfully."
    );

} catch (error) {

    console.error(
        "Firebase initialization failed:",
        error
    );

    alert(
        "Firebase connection failed.\n\n" +
        "Check your Firebase configuration."
    );

}


// ============================================================
// GLOBAL DATA
// ============================================================

let allProducts = [];
let allOrders = [];
let allSellerRequests = [];
let allCustomers = [];

let currentSellRequest = null;


// ============================================================
// HELPER
// ============================================================

function $(id) {
    return document.getElementById(id);
}


function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatMoney(value) {

    const number = Number(value || 0);

    return "₹ " +
        number.toLocaleString("en-IN");
}


function showToast(message) {

    let toast = $("adminToast");

    if (!toast) {

        toast = document.createElement("div");

        toast.id = "adminToast";

        toast.style.position = "fixed";
        toast.style.bottom = "25px";
        toast.style.right = "25px";
        toast.style.zIndex = "99999";
        toast.style.padding = "14px 20px";
        toast.style.background = "#111";
        toast.style.color = "#00ff88";
        toast.style.border = "1px solid #00ff88";
        toast.style.borderRadius = "8px";
        toast.style.fontWeight = "600";
        toast.style.boxShadow =
            "0 0 20px rgba(0,255,136,.25)";

        document.body.appendChild(toast);
    }

    toast.textContent = message;

    toast.style.display = "block";

    clearTimeout(window.__toastTimer);

    window.__toastTimer = setTimeout(() => {

        toast.style.display = "none";

    }, 3000);
}


// ============================================================
// NAVIGATION
// ============================================================

window.openSection = function(sectionName) {

    document
        .querySelectorAll(".admin-section")
        .forEach(section => {

            section.classList.remove("active");

            section.style.display = "none";

        });


    const target =
        $("section-" + sectionName);


    if (target) {

        target.classList.add("active");

        target.style.display = "block";

    }


    document
        .querySelectorAll(".nav-link")
        .forEach(link => {

            link.classList.remove("active");

        });


    const nav =
        $("nav-" + sectionName);


    if (nav) {

        nav.classList.add("active");

    }

};


// Compatibility
window.switchAdminSection =
    window.openSection;


// ============================================================
// INITIAL NAVIGATION
// ============================================================

function initializeNavigation() {

    const sections =
        document.querySelectorAll(
            ".admin-section"
        );


    sections.forEach(
        (section, index) => {

            if (index === 0) {

                section.style.display =
                    "block";

                section.classList.add(
                    "active"
                );

            } else {

                section.style.display =
                    "none";

            }

        }
    );

}


// ============================================================
// SERVICES
// ============================================================

function loadServices() {

    if (!db) return;


    onValue(
        ref(db, "services"),
        snapshot => {

            const data =
                snapshot.val() || {};


            if ($("serviceBuy"))
                $("serviceBuy").value =
                    data.buy || "";


            if ($("serviceSell"))
                $("serviceSell").value =
                    data.sell || "";


            if ($("serviceTracking"))
                $("serviceTracking").value =
                    data.tracking || "";


            if ($("serviceVerification"))
                $("serviceVerification").value =
                    data.verification || "";

        }
    );

}


window.saveServices = async function() {

    if (!db) return;


    try {

        await set(
            ref(db, "services"),
            {

                buy:
                    $("serviceBuy")?.value || "",

                sell:
                    $("serviceSell")?.value || "",

                tracking:
                    $("serviceTracking")?.value || "",

                verification:
                    $("serviceVerification")
                        ?.value || "",

                updatedAt:
                    Date.now()

            }
        );


        showToast(
            "Services saved successfully."
        );


    } catch (error) {

        console.error(error);

        alert(
            "Failed to save services:\n" +
            error.message
        );

    }

};


// ============================================================
// PRODUCTS
// ============================================================

function loadProducts() {

    if (!db) return;


    onValue(
        ref(db, "products"),
        snapshot => {

            const data =
                snapshot.val() || {};


            allProducts =
                Object.entries(data)
                    .map(
                        ([key, product]) => ({

                            firebaseKey: key,

                            ...product

                        })
                    );


            renderProducts();

            updateDashboard();

        }
    );

}


// ============================================================
// RENDER PRODUCTS
// ============================================================

function renderProducts() {

    const tbody =
        $("productsTable");


    if (!tbody) return;


    const search =
        (
            $("productSearch")
                ?.value || ""
        )
            .toLowerCase()
            .trim();


    const filter =
        $("productFilter")
            ?.value || "all";


    const products =
        allProducts.filter(product => {

            const name =
                String(
                    product.name || ""
                ).toLowerCase();


            const brand =
                String(
                    product.brand || ""
                ).toLowerCase();


            const matchesSearch =
                !search ||
                name.includes(search) ||
                brand.includes(search);


            let matchesFilter = true;


            if (filter !== "all") {

                matchesFilter =
                    String(
                        product.status || ""
                    ).toLowerCase() ===
                    filter.toLowerCase();

            }


            return (
                matchesSearch &&
                matchesFilter
            );

        });


    if (products.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="10"
                    style="
                        text-align:center;
                        padding:25px;
                    "
                >

                    No products found.

                </td>

            </tr>

        `;

        return;

    }


    tbody.innerHTML =
        products.map(product => {

            const image =
                product.image ||
                product.imageUrl ||
                (
                    Array.isArray(
                        product.images
                    )
                        ? product.images[0]
                        : ""
                );


            return `

                <tr>

                    <td>

                        ${
                            image
                                ? `
                                    <img
                                        src="${escapeHTML(image)}"
                                        style="
                                            width:55px;
                                            height:55px;
                                            object-fit:cover;
                                            border-radius:8px;
                                        "
                                    >
                                  `
                                : "—"
                        }

                    </td>


                    <td>

                        <strong>

                            ${escapeHTML(
                                product.name ||
                                "Unnamed"
                            )}

                        </strong>

                    </td>


                    <td>

                        ${escapeHTML(
                            product.brand ||
                            "—"
                        )}

                    </td>


                    <td>

                        ${escapeHTML(
                            product.category ||
                            "—"
                        )}

                    </td>


                    <td>

                        ${formatMoney(
                            product.price
                        )}

                    </td>


                    <td>

                        ${product.stock ?? 0}

                    </td>


                    <td>

                        ${escapeHTML(
                            product.status ||
                            "approved"
                        )}

                    </td>


                    <td>

                        <button
                            onclick="
                                editProduct(
                                    '${product.firebaseKey}'
                                )
                            "
                        >

                            Edit

                        </button>


                        <button
                            onclick="
                                deleteProduct(
                                    '${product.firebaseKey}'
                                )
                            "
                            style="color:red;"
                        >

                            Delete

                        </button>

                    </td>

                </tr>

            `;

        }).join("");

}


// ============================================================
// PRODUCT SEARCH
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if ($("productSearch")) {

            $("productSearch")
                .addEventListener(
                    "input",
                    renderProducts
                );

        }


        if ($("productFilter")) {

            $("productFilter")
                .addEventListener(
                    "change",
                    renderProducts
                );

        }

    }
);


// ============================================================
// OPEN PRODUCT MODAL
// ============================================================

window.openProductModal =
    function(productKey = null) {

        const modal =
            $("productModal");


        if (!modal) return;


        const form =
            modal.querySelector("form");


        if (form) {

            form.reset();

        }


        if ($("editProductKey")) {

            $("editProductKey").value = "";

        }


        if ($("productModalTitle")) {

            $("productModalTitle")
                .textContent =
                productKey
                    ? "Edit Product"
                    : "Add New Product";

        }


        if (productKey) {

            const product =
                allProducts.find(
                    item =>
                        item.firebaseKey ===
                        productKey
                );


            if (product) {

                fillProductForm(product);

            }

        }


        modal.style.display = "flex";

    };


window.openAddProductModal =
    window.openProductModal;


// ============================================================
// CLOSE PRODUCT MODAL
// ============================================================

window.closeProductModal =
    function() {

        const modal =
            $("productModal");


        if (modal) {

            modal.style.display =
                "none";

        }

    };


// ============================================================
// FILL PRODUCT FORM
// ============================================================

function fillProductForm(product) {

    if ($("editProductKey"))
        $("editProductKey").value =
            product.firebaseKey || "";


    if ($("pName"))
        $("pName").value =
            product.name || "";


    if ($("pBrand"))
        $("pBrand").value =
            product.brand || "";


    if ($("pCategory"))
        $("pCategory").value =
            product.category || "";


    if ($("pPrice"))
        $("pPrice").value =
            product.price || "";


    if ($("pMrp"))
        $("pMrp").value =
            product.mrp || "";


    if ($("pStock"))
        $("pStock").value =
            product.stock || 0;


    if ($("pRam"))
        $("pRam").value =
            product.ram ||
            product.RAM ||
            "";


    if ($("pRom"))
        $("pRom").value =
            product.rom ||
            product.ROM ||
            product.storage ||
            "";


    if ($("pProcessor"))
        $("pProcessor").value =
            product.processor || "";


    if ($("pDisplay"))
        $("pDisplay").value =
            product.display || "";


    if ($("pCamera"))
        $("pCamera").value =
            product.camera || "";


    if ($("pBattery"))
        $("pBattery").value =
            product.battery || "";


    if ($("pCondition"))
        $("pCondition").value =
            product.condition || "";


    if ($("pQuality"))
        $("pQuality").value =
            product.quality || "";


    if ($("pWarranty"))
        $("pWarranty").value =
            product.warranty || "";


    if ($("pImage"))
        $("pImage").value =
            product.image ||
            product.imageUrl ||
            (
                Array.isArray(
                    product.images
                )
                    ? product.images[0]
                    : ""
            );


    if ($("pHighlights"))
        $("pHighlights").value =
            typeof product.highlights ===
            "string"
                ? product.highlights
                : "";

}


// ============================================================
// SAVE PRODUCT
// ============================================================

async function saveProduct(event) {

    event.preventDefault();


    if (!db) {

        alert(
            "Firebase is not connected."
        );

        return;

    }


    const productKey =
        $("editProductKey")
            ?.value || "";


    const name =
        $("pName")
            ?.value
            .trim() || "";


    const price =
        Number(
            $("pPrice")
                ?.value || 0
        );


    const mrp =
        Number(
            $("pMrp")
                ?.value || 0
        );


    const stock =
        Number(
            $("pStock")
                ?.value || 0
        );


    if (!name) {

        alert(
            "Please enter product name."
        );

        return;

    }


    if (price <= 0) {

        alert(
            "Please enter product price."
        );

        return;

    }


    const productData = {

        name:

            name,


        brand:

            $("pBrand")
                ?.value
                .trim() || "",


        category:

            $("pCategory")
                ?.value
                .trim() || "",


        price:

            price,


        mrp:

            mrp,


        stock:

            stock,


        ram:

            $("pRam")
                ?.value
                .trim() || "",


        rom:

            $("pRom")
                ?.value
                .trim() || "",


        processor:

            $("pProcessor")
                ?.value
                .trim() || "",


        display:

            $("pDisplay")
                ?.value
                .trim() || "",


        camera:

            $("pCamera")
                ?.value
                .trim() || "",


        battery:

            $("pBattery")
                ?.value
                .trim() || "",


        condition:

            $("pCondition")
                ?.value
                .trim() || "",


        quality:

            $("pQuality")
                ?.value
                .trim() || "",


        warranty:

            $("pWarranty")
                ?.value
                .trim() || "",


        image:

            $("pImage")
                ?.value
                .trim() || "",


        highlights:

            $("pHighlights")
                ?.value
                .trim() || "",


        status:

            "approved",


        updatedAt:

            Date.now()

    };


    try {

        if (productKey) {

            await update(
                ref(
                    db,
                    `products/${productKey}`
                ),
                productData
            );


            showToast(
                "Product updated successfully."
            );

        } else {

            productData.createdAt =
                Date.now();


            productData.type =
                "admin";


            const newProduct =
                push(
                    ref(
                        db,
                        "products"
                    )
                );


            await set(
                newProduct,
                productData
            );


            showToast(
                "Product added successfully."
            );

        }


        window.closeProductModal();


    } catch (error) {

        console.error(error);

        alert(
            "Product save failed:\n" +
            error.message
        );

    }

}


// ============================================================
// PRODUCT FORM
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const form =
            $("productForm") ||
            $("productModal")
                ?.querySelector("form");


        if (form) {

            form.addEventListener(
                "submit",
                saveProduct
            );

        }

    }
);


// ============================================================
// EDIT PRODUCT
// ============================================================

window.editProduct =
    function(productKey) {

        window.openProductModal(
            productKey
        );

    };


// ============================================================
// DELETE PRODUCT
// ============================================================

window.deleteProduct =
    async function(productKey) {

        if (!db) return;


        const product =
            allProducts.find(
                item =>
                    item.firebaseKey ===
                    productKey
            );


        if (!product) return;


        if (!confirm(
            `Delete "${
                product.name ||
                "this product"
            }"?`
        )) {

            return;

        }


        try {

            await remove(
                ref(
                    db,
                    `products/${productKey}`
                )
            );


            showToast(
                "Product deleted."
            );


        } catch (error) {

            console.error(error);

            alert(
                "Delete failed:\n" +
                error.message
            );

        }

    };


// ============================================================
// ORDERS
// ============================================================

function loadOrders() {

    if (!db) return;


    onValue(
        ref(db, "orders"),
        snapshot => {

            const data =
                snapshot.val() || {};


            allOrders =
                Object.entries(data)
                    .map(
                        ([key, order]) => ({

                            firebaseKey: key,

                            ...order

                        })
                    );


            renderOrders();

            updateCustomers();

            updateDashboard();

        }
    );

}


// ============================================================
// RENDER ORDERS
// ============================================================

function renderOrders() {

    const tbody =
        $("ordersTable");


    if (!tbody) return;


    if (allOrders.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:25px;
                    "
                >

                    No orders found.

                </td>

            </tr>

        `;

        return;

    }


    tbody.innerHTML =
        allOrders
            .slice()
            .reverse()
            .map(order => {

                const orderId =
                    order.orderId ||
                    order.id ||
                    order.firebaseKey;


                const customer =
                    order.customerName ||
                    order.name ||
                    order.customer?.name ||
                    "Customer";


                const mobile =
                    order.mobile ||
                    order.phone ||
                    order.customerPhone ||
                    order.customer?.phone ||
                    "—";


                const total =
                    order.totalAmount ??
                    order.total ??
                    order.amount ??
                    order.productPrice ??
                    0;


                const status =
                    order.status ||
                    "Pending";


                return `

                    <tr>

                        <td>

                            ${escapeHTML(
                                orderId
                            )}

                        </td>


                        <td>

                            ${escapeHTML(
                                customer
                            )}

                        </td>


                        <td>

                            ${escapeHTML(
                                mobile
                            )}

                        </td>


                        <td>

                            ${formatMoney(
                                total
                            )}

                        </td>


                        <td>

                            <select
                                onchange="
                                    updateOrderStatus(
                                        '${order.firebaseKey}',
                                        this.value
                                    )
                                "
                            >

                                ${
                                    orderStatusOptions(
                                        status
                                    )
                                }

                            </select>

                        </td>


                        <td>

                            <button
                                onclick="
                                    viewOrder(
                                        '${order.firebaseKey}'
                                    )
                                "
                            >

                                View

                            </button>

                        </td>

                    </tr>

                `;

            })
            .join("");

}


// ============================================================
// ORDER STATUS OPTIONS
// ============================================================

function orderStatusOptions(current) {

    const statuses = [

        "Pending",

        "Confirmed",

        "Processing",

        "Packed",

        "Shipped",

        "Out for Delivery",

        "Delivered",

        "Cancelled"

    ];


    return statuses
        .map(status => `

            <option
                value="${escapeHTML(status)}"
                ${
                    String(status)
                        .toLowerCase() ===
                    String(current)
                        .toLowerCase()
                        ? "selected"
                        : ""
                }
            >

                ${escapeHTML(status)}

            </option>

        `)
        .join("");

}


// ============================================================
// UPDATE ORDER STATUS
// ============================================================

window.updateOrderStatus =
    async function(
        orderKey,
        newStatus
    ) {

        if (!db) return;


        try {

            await update(
                ref(
                    db,
                    `orders/${orderKey}`
                ),
                {

                    status:
                        newStatus,

                    updatedAt:
                        Date.now()

                }
            );


            const timelineRef =
                push(
                    ref(
                        db,
                        `orders/${orderKey}/trackingTimeline`
                    )
                );


            await set(
                timelineRef,
                {

                    status:
                        newStatus,

                    label:
                        newStatus,

                    timestamp:
                        Date.now(),

                    note:
                        `Order status changed to ${newStatus}`

                }
            );


            showToast(
                "Order status updated."
            );


        } catch (error) {

            console.error(error);

            alert(
                "Order update failed:\n" +
                error.message
            );

        }

    };


// ============================================================
// VIEW ORDER
// ============================================================

window.viewOrder =
    function(orderKey) {

        const order =
            allOrders.find(
                item =>
                    item.firebaseKey ===
                    orderKey
            );


        if (!order) return;


        const items =
            order.items ||
            order.products ||
            [];


        let itemText = "";


        if (Array.isArray(items)) {

            itemText =
                items
                    .map(item => {

                        return (
                            (item.name ||
                                item.title ||
                                "Product") +
                            " × " +
                            (item.quantity || 1)
                        );

                    })
                    .join("\n");

        } else if (
            typeof items === "object"
        ) {

            itemText =
                Object.values(items)
                    .map(item => {

                        return (
                            (item.name ||
                                item.title ||
                                "Product") +
                            " × " +
                            (item.quantity || 1)
                        );

                    })
                    .join("\n");

        }


        const message =

            "Order ID: " +
            (
                order.orderId ||
                order.id ||
                order.firebaseKey
            ) +

            "\n\nCustomer: " +
            (
                order.customerName ||
                order.name ||
                "—"
            ) +

            "\n\nMobile: " +
            (
                order.mobile ||
                order.phone ||
                order.customerPhone ||
                "—"
            ) +

            "\n\nAddress: " +
            (
                order.address ||
                order.deliveryAddress ||
                "—"
            ) +

            "\n\nTotal: " +
            formatMoney(
                order.totalAmount ||
                order.total ||
                order.amount ||
                order.productPrice
            ) +

            "\n\nStatus: " +
            (
                order.status ||
                "Pending"
            ) +

            "\n\nItems:\n" +
            (
                itemText ||
                "No item details"
            );


        alert(message);

    };


// ============================================================
// SELL REQUESTS
// ============================================================

function loadSellerRequests() {

    if (!db) return;


    onValue(
        ref(db, "sellerRequests"),
        snapshot => {

            const data =
                snapshot.val() || {};


            allSellerRequests =
                Object.entries(data)
                    .map(
                        ([key, request]) => ({

                            firebaseKey: key,

                            ...request

                        })
                    );


            renderSellerRequests();

            updateDashboard();

        }
    );

}


// ============================================================
// RENDER SELL REQUESTS
// ============================================================

function renderSellerRequests() {

    const tbody =
        $("sellsTable");


    if (!tbody) return;


    if (
        allSellerRequests.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:25px;
                    "
                >

                    No sell requests found.

                </td>

            </tr>

        `;

        return;

    }


    tbody.innerHTML =
        allSellerRequests
            .slice()
            .reverse()
            .map(request => {

                const seller =
                    request.sellerName ||
                    request.name ||
                    "Seller";


                const device =
                    request.device ||
                    request.model ||
                    request.name ||
                    "Device";


                const price =
                    request.price ||
                    request.expectedPrice ||
                    0;


                const status =
                    request.status ||
                    "Pending Verification";


                return `

                    <tr>

                        <td>

                            ${escapeHTML(
                                seller
                            )}

                        </td>


                        <td>

                            ${escapeHTML(
                                device
                            )}

                        </td>


                        <td>

                            ${escapeHTML(
                                request.contact ||
                                request.mobile ||
                                "—"
                            )}

                        </td>


                        <td>

                            ${formatMoney(
                                price
                            )}

                        </td>


                        <td>

                            ${escapeHTML(
                                status
                            )}

                        </td>


                        <td>

                            <button
                                onclick="
                                    openSellRequest(
                                        '${request.firebaseKey}'
                                    )
                                "
                            >

                                View

                            </button>

                        </td>

                    </tr>

                `;

            })
            .join("");

}


// ============================================================
// OPEN SELL REQUEST
// ============================================================

window.openSellRequest =
    function(key) {

        const request =
            allSellerRequests.find(
                item =>
                    item.firebaseKey ===
                    key
            );


        if (!request) return;


        currentSellRequest =
            request;


        if ($("sellDetails")) {

            $("sellDetails").innerHTML = `

                <div>

                    <strong>Seller:</strong>

                    ${escapeHTML(
                        request.sellerName ||
                        request.name ||
                        "—"
                    )}

                </div>


                <div>

                    <strong>Device:</strong>

                    ${escapeHTML(
                        request.device ||
                        request.model ||
                        request.name ||
                        "—"
                    )}

                </div>


                <div>

                    <strong>Mobile:</strong>

                    ${escapeHTML(
                        request.contact ||
                        request.mobile ||
                        "—"
                    )}

                </div>


                <div>

                    <strong>Email:</strong>

                    ${escapeHTML(
                        request.email ||
                        request.userEmail ||
                        "—"
                    )}

                </div>


                <div>

                    <strong>Expected Price:</strong>

                    ${formatMoney(
                        request.price ||
                        request.expectedPrice
                    )}

                </div>


                <div>

                    <strong>Address:</strong>

                    ${escapeHTML(
                        request.address ||
                        "—"
                    )}

                </div>


                <div>

                    <strong>Status:</strong>

                    ${escapeHTML(
                        request.status ||
                        "Pending"
                    )}

                </div>


                ${
                    Array.isArray(
                        request.images
                    )
                        ? request.images
                            .map(
                                img => `

                                    <img
                                        src="${escapeHTML(img)}"
                                        style="
                                            width:100px;
                                            height:100px;
                                            object-fit:cover;
                                            margin:5px;
                                            border-radius:8px;
                                        "
                                    >

                                `
                            )
                            .join("")
                        : ""
                }

            `;

        }


        if ($("sellModal")) {

            $("sellModal").style.display =
                "flex";

        }

    };


// ============================================================
// CLOSE SELL MODAL
// ============================================================

window.closeSellModal =
    function() {

        if ($("sellModal")) {

            $("sellModal").style.display =
                "none";

        }


        currentSellRequest =
            null;

    };


// ============================================================
// ACCEPT SELL REQUEST
// ============================================================

window.acceptCurrentSell =
    async function() {

        if (
            !db ||
            !currentSellRequest
        ) {

            return;

        }


        const request =
            currentSellRequest;


        try {

            const key =
                request.firebaseKey;


            await update(
                ref(
                    db,
                    `sellerRequests/${key}`
                ),
                {

                    status:
                        "Accepted",

                    acceptedAt:
                        Date.now()

                }
            );


            const product = {

                name:
                    request.device ||
                    request.model ||
                    request.name ||
                    "Used Device",

                brand:
                    request.brand ||
                    "",

                category:
                    request.category ||
                    "Used Mobile",

                price:
                    Number(
                        request.price ||
                        request.expectedPrice ||
                        0
                    ),

                mrp:
                    Number(
                        request.mrp ||
                        request.price ||
                        0
                    ),

                stock:
                    1,

                image:
                    Array.isArray(
                        request.images
                    )
                        ? request.images[0] ||
                          ""
                        : request.image ||
                          "",

                images:
                    request.images ||
                    [],

                ram:
                    request.ram ||
                    "",

                rom:
                    request.rom ||
                    "",

                condition:
                    request.condition ||
                    "Used",

                quality:
                    request.quality ||
                    "Verification Pending",

                sellerRequestId:
                    key,

                status:
                    "approved",

                type:
                    "seller",

                createdAt:
                    Date.now()

            };


            const productRef =
                push(
                    ref(
                        db,
                        "products"
                    )
                );


            await set(
                productRef,
                product
            );


            await push(
                ref(
                    db,
                    "approvedSellers"
                ),
                {

                    sellerName:
                        request.sellerName ||
                        request.name ||
                        "",

                    mobile:
                        request.contact ||
                        request.mobile ||
                        "",

                    email:
                        request.email ||
                        request.userEmail ||
                        "",

                    device:
                        product.name,

                    agreedPrice:
                        product.price,

                    productId:
                        productRef.key,

                    status:
                        "active",

                    createdAt:
                        Date.now()

                }
            );


            showToast(
                "Sell request accepted and product added."
            );


            window.closeSellModal();


        } catch (error) {

            console.error(error);

            alert(
                "Accept failed:\n" +
                error.message
            );

        }

    };


// ============================================================
// REJECT SELL REQUEST
// ============================================================

window.rejectCurrentSell =
    async function() {

        if (
            !db ||
            !currentSellRequest
        ) {

            return;

        }


        const key =
            currentSellRequest.firebaseKey;


        if (
            !confirm(
                "Reject this sell request?"
            )
        ) {

            return;

        }


        try {

            await update(
                ref(
                    db,
                    `sellerRequests/${key}`
                ),
                {

                    status:
                        "Rejected",

                    rejectedAt:
                        Date.now()

                }
            );


            showToast(
                "Sell request rejected."
            );


            window.closeSellModal();


        } catch (error) {

            console.error(error);

            alert(
                "Reject failed:\n" +
                error.message
            );

        }

    };


// ============================================================
// CUSTOMERS
// ============================================================

function updateCustomers() {

    const customersMap = {};


    allOrders.forEach(order => {

        const phone =
            order.mobile ||
            order.phone ||
            order.customerPhone ||
            order.customer?.phone;


        if (!phone) return;


        if (!customersMap[phone]) {

            customersMap[phone] = {

                name:
                    order.customerName ||
                    order.name ||
                    order.customer?.name ||
                    "Customer",

                mobile:
                    phone,

                orders:
                    0,

                total:
                    0

            };

        }


        customersMap[phone].orders++;


        customersMap[phone].total +=
            Number(
                order.totalAmount ||
                order.total ||
                order.amount ||
                order.productPrice ||
                0
            );

    });


    allCustomers =
        Object.values(
            customersMap
        );


    renderCustomers();

}


// ============================================================
// RENDER CUSTOMERS
// ============================================================

function renderCustomers() {

    const tbody =
        $("customersTable");


    if (!tbody) return;


    if (
        allCustomers.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    style="
                        text-align:center;
                        padding:25px;
                    "
                >

                    No customers found.

                </td>

            </tr>

        `;

        return;

    }


    tbody.innerHTML =
        allCustomers
            .map(customer => `

                <tr>

                    <td>

                        ${escapeHTML(
                            customer.name
                        )}

                    </td>


                    <td>

                        ${escapeHTML(
                            customer.mobile
                        )}

                    </td>


                    <td>

                        ${customer.orders}

                    </td>


                    <td>

                        ${formatMoney(
                            customer.total
                        )}

                    </td>

                </tr>

            `)
            .join("");

}


// ============================================================
// TRACKING
// ============================================================

window.addTrackingUpdate =
    async function() {

        if (!db) return;


        const orderId =
            $("trackingOrderId")
                ?.value
                .trim();


        const status =
            $("trackingStatus")
                ?.value
                .trim();


        const message =
            $("trackingMessage")
                ?.value
                .trim();


        if (!orderId) {

            alert(
                "Enter Order ID."
            );

            return;

        }


        if (!status) {

            alert(
                "Enter tracking status."
            );

            return;

        }


        const order =
            allOrders.find(item =>

                item.firebaseKey ===
                    orderId ||

                item.orderId ===
                    orderId ||

                item.id ===
                    orderId

            );


        if (!order) {

            alert(
                "Order not found.\n\n" +
                "Make sure the Order ID is correct."
            );

            return;

        }


        try {

            await update(
                ref(
                    db,
                    `orders/${order.firebaseKey}`
                ),
                {

                    status:
                        status,

                    updatedAt:
                        Date.now()

                }
            );


            const timeline =
                push(
                    ref(
                        db,
                        `orders/${order.firebaseKey}/trackingTimeline`
                    )
                );


            await set(
                timeline,
                {

                    status:
                        status,

                    label:
                        status,

                    message:
                        message,

                    note:
                        message,

                    timestamp:
                        Date.now()

                }
            );


            showToast(
                "Tracking update added."
            );


            if ($("trackingOrderId"))
                $("trackingOrderId").value =
                    "";


            if ($("trackingMessage"))
                $("trackingMessage").value =
                    "";


        } catch (error) {

            console.error(error);

            alert(
                "Tracking update failed:\n" +
                error.message
            );

        }

    };


// ============================================================
// GOOGLE MAPS
// ============================================================

function loadMapSettings() {

    if (!db) return;


    onValue(
        ref(db, "storeLocation"),
        snapshot => {

            const data =
                snapshot.val() || {};


            if ($("mapLat"))
                $("mapLat").value =
                    data.lat || "";


            if ($("mapLng"))
                $("mapLng").value =
                    data.lng || "";


            if ($("mapFrame"))
                $("mapFrame").value =
                    data.mapFrame ||
                    data.mapUrl ||
                    "";

        }
    );

}


window.saveMapLocation =
    async function() {

        if (!db) return;


        const lat =
            $("mapLat")
                ?.value
                .trim() || "";


        const lng =
            $("mapLng")
                ?.value
                .trim() || "";


        const mapFrame =
            $("mapFrame")
                ?.value
                .trim() || "";


        try {

            await set(
                ref(
                    db,
                    "storeLocation"
                ),
                {

                    lat:
                        lat,

                    lng:
                        lng,

                    mapFrame:
                        mapFrame,

                    updatedAt:
                        Date.now()

                }
            );


            showToast(
                "Map location saved."
            );


        } catch (error) {

            console.error(error);

            alert(
                "Map save failed:\n" +
                error.message
            );

        }

    };


// ============================================================
// HOMEPAGE
// ============================================================

function loadHomepage() {

    if (!db) return;


    onValue(
        ref(
            db,
            "homepageSettings"
        ),
        snapshot => {

            const data =
                snapshot.val() || {};


            if ($("hpAnnouncement"))
                $("hpAnnouncement").value =
                    data.announcement || "";


            if ($("hpHeadline"))
                $("hpHeadline").value =
                    data.headline ||
                    data.heroHeadline ||
                    "";


            if ($("hpSubtitle"))
                $("hpSubtitle").value =
                    data.subtitle ||
                    data.heroSubtitle ||
                    "";


            if ($("hpImage"))
                $("hpImage").value =
                    data.image ||
                    data.heroImage ||
                    "";

        }
    );

}


window.saveHomepage =
    async function() {

        if (!db) return;


        try {

            await set(
                ref(
                    db,
                    "homepageSettings"
                ),
                {

                    announcement:
                        $("hpAnnouncement")
                            ?.value || "",

                    headline:
                        $("hpHeadline")
                            ?.value || "",

                    subtitle:
                        $("hpSubtitle")
                            ?.value || "",

                    image:
                        $("hpImage")
                            ?.value || "",

                    updatedAt:
                        Date.now()

                }
            );


            showToast(
                "Homepage settings saved."
            );


        } catch (error) {

            console.error(error);

            alert(
                "Homepage save failed:\n" +
                error.message
            );

        }

    };


// ============================================================
// DELIVERY
// ============================================================

function loadDelivery() {

    if (!db) return;


    onValue(
        ref(
            db,
            "deliverySettings"
        ),
        snapshot => {

            const data =
                snapshot.val() || {};


            if ($("deliveryCharge"))
                $("deliveryCharge").value =
                    data.charge || 0;


            if ($("freeDelivery"))
                $("freeDelivery").value =
                    data.freeDelivery ??
                    data.freeThreshold ??
                    0;


            if ($("deliveryDays"))
                $("deliveryDays").value =
                    data.days ||
                    data.deliveryDays ||
                    "";

        }
    );

}


window.saveDelivery =
    async function() {

        if (!db) return;


        try {

            await set(
                ref(
                    db,
                    "deliverySettings"
                ),
                {

                    charge:
                        Number(
                            $("deliveryCharge")
                                ?.value || 0
                        ),

                    freeDelivery:
                        Number(
                            $("freeDelivery")
                                ?.value || 0
                        ),

                    days:
                        $("deliveryDays")
                            ?.value || "",

                    updatedAt:
                        Date.now()

                }
            );


            showToast(
                "Delivery settings saved."
            );


        } catch (error) {

            console.error(error);

            alert(
                "Delivery save failed:\n" +
                error.message
            );

        }

    };


// ============================================================
// WEBSITE SETTINGS
// ============================================================

function loadWebsiteSettings() {

    if (!db) return;


    onValue(
        ref(
            db,
            "websiteSettings"
        ),
        snapshot => {

            const data =
                snapshot.val() || {};


            if ($("siteTitle"))
                $("siteTitle").value =
                    data.siteTitle ||
                    data.title ||
                    "";


            if ($("logoUrl"))
                $("logoUrl").value =
                    data.logoUrl ||
                    "";


            if ($("facebookUrl"))
                $("facebookUrl").value =
                    data.facebookUrl ||
                    data.facebook ||
                    "";


            if ($("instagramUrl"))
                $("instagramUrl").value =
                    data.instagramUrl ||
                    data.instagram ||
                    "";

        }
    );

}


window.saveWebsiteSettings =
    async function() {

        if (!db) return;


        try {

            await set(
                ref(
                    db,
                    "websiteSettings"
                ),
                {

                    siteTitle:
                        $("siteTitle")
                            ?.value || "",

                    logoUrl:
                        $("logoUrl")
                            ?.value || "",

                    facebookUrl:
                        $("facebookUrl")
                            ?.value || "",

                    instagramUrl:
                        $("instagramUrl")
                            ?.value || "",

                    updatedAt:
                        Date.now()

                }
            );


            showToast(
                "Website settings saved."
            );


        } catch (error) {

            console.error(error);

            alert(
                "Website settings save failed:\n" +
                error.message
            );

        }

    };


// ============================================================
// DASHBOARD
// ============================================================

function updateDashboard() {

    if ($("totalProducts")) {

        $("totalProducts").textContent =
            allProducts.length;

    }


    if ($("totalOrders")) {

        $("totalOrders").textContent =
            allOrders.length;

    }


    const pendingOrders =
        allOrders.filter(order => {

            const status =
                String(
                    order.status ||
                    "Pending"
                ).toLowerCase();


            return (
                status === "pending" ||
                status ===
                    "pending verification"
            );

        });


    if ($("pendingOrders")) {

        $("pendingOrders").textContent =
            pendingOrders.length;

    }


    if ($("totalSells")) {

        $("totalSells").textContent =
            allSellerRequests.length;

    }


    renderRecentOrders();

}


// ============================================================
// RECENT ORDERS
// ============================================================

function renderRecentOrders() {

    const container =
        $("recentOrders");


    if (!container) return;


    if (allOrders.length === 0) {

        container.innerHTML =
            "No recent orders.";

        return;

    }


    container.innerHTML =
        allOrders
            .slice()
            .reverse()
            .slice(0, 5)
            .map(order => `

                <div
                    style="
                        padding:10px;
                        margin-bottom:8px;
                        border-bottom:
                            1px solid #333;
                    "
                >

                    <strong>

                        ${escapeHTML(
                            order.orderId ||
                            order.id ||
                            order.firebaseKey
                        )}

                    </strong>


                    <br>


                    <small>

                        ${escapeHTML(
                            order.customerName ||
                            order.name ||
                            "Customer"
                        )}

                    </small>


                    <br>


                    <span>

                        ${formatMoney(
                            order.totalAmount ||
                            order.total ||
                            order.amount ||
                            order.productPrice
                        )}

                    </span>


                    <br>


                    <small>

                        ${escapeHTML(
                            order.status ||
                            "Pending"
                        )}

                    </small>

                </div>

            `)
            .join("");

}


// ============================================================
// START FIREBASE LISTENERS
// ============================================================

function startFirebaseListeners() {

    if (!db) {

        console.error(
            "Firebase database is not available."
        );

        return;

    }


    console.log(
        "Starting Firebase listeners..."
    );


    loadProducts();

    loadOrders();

    loadSellerRequests();

    loadServices();

    loadMapSettings();

    loadHomepage();

    loadDelivery();

    loadWebsiteSettings();


    console.log(
        "All admin listeners started."
    );

}


// ============================================================
// PAGE START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "Rittik Mobile Shop Admin loaded."
        );


        initializeNavigation();


        startFirebaseListeners();

    }
);


// ============================================================
// GLOBAL DEBUG
// ============================================================

window.RittikAdmin = {

    getProducts:
        () => allProducts,

    getOrders:
        () => allOrders,

    getSellRequests:
        () => allSellerRequests,

    getCustomers:
        () => allCustomers,

    firebase:
        () => db

};


console.log(
    "RITTIK MOBILE SHOP ADMIN JS READY"
);
