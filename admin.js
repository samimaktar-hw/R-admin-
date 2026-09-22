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

    apiKey:
        "AIzaSyBIddmdEKtGl0OI97ky6Q3JJBs2dOzbnbA",

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
        error.message
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

    const number =
        Number(value || 0);

    return (
        "₹ " +
        number.toLocaleString("en-IN")
    );

}


function showToast(message) {

    let toast =
        $("adminToast");

    if (!toast) {

        toast =
            document.createElement("div");

        toast.id =
            "adminToast";

        toast.style.position =
            "fixed";

        toast.style.bottom =
            "25px";

        toast.style.right =
            "25px";

        toast.style.zIndex =
            "999999";

        toast.style.padding =
            "14px 20px";

        toast.style.background =
            "#111";

        toast.style.color =
            "#00ff88";

        toast.style.border =
            "1px solid #00ff88";

        toast.style.borderRadius =
            "8px";

        toast.style.fontWeight =
            "600";

        document.body.appendChild(
            toast
        );

    }

    toast.textContent =
        message;

    toast.style.display =
        "block";

    clearTimeout(
        window.__toastTimer
    );

    window.__toastTimer =
        setTimeout(() => {

            toast.style.display =
                "none";

        }, 3000);

}


function firebaseError(error) {

    console.error(
        "Firebase error:",
        error
    );

    if (
        error &&
        (
            error.code ===
            "PERMISSION_DENIED" ||
            String(error.message)
                .toLowerCase()
                .includes("permission")
        )
    ) {

        alert(
            "Firebase Permission Denied.\n\n" +
            "Database Rules are blocking this action."
        );

    } else {

        alert(
            "Firebase Error:\n\n" +
            (
                error?.message ||
                "Unknown error"
            )
        );

    }

}


// ============================================================
// NAVIGATION FIX
// ============================================================

window.openSection = function(
    sectionName,
    event
) {

    if (event) {

        event.preventDefault();
        event.stopPropagation();

    }

    console.log(
        "Opening section:",
        sectionName
    );


    // Hide every section
    document
        .querySelectorAll(".section")
        .forEach(section => {

            section.classList.remove(
                "active"
            );

            section.style.display =
                "none";

        });


    // Find requested section
    const target =
        document.getElementById(
            sectionName
        );


    if (!target) {

        console.error(
            "Admin section not found:",
            sectionName
        );

        showToast(
            "Section not found: " +
            sectionName
        );

        return false;

    }


    // Show requested section
    target.classList.add(
        "active"
    );

    target.style.display =
        "block";


    // Remove active state
    document
        .querySelectorAll(".nav-btn")
        .forEach(button => {

            button.classList.remove(
                "active"
            );

        });


    // Add active state
    const navButton =
        document.querySelector(
            `.nav-btn[data-section="${CSS.escape(sectionName)}"]`
        );


    if (navButton) {

        navButton.classList.add(
            "active"
        );

    }


    // Page titles
    const titles = {

        dashboard:
            "Dashboard",

        services:
            "Our Services",

        products:
            "Products",

        orders:
            "Orders",

        sells:
            "Sell Requests",

        customers:
            "Customers",

        tracking:
            "Tracking Status",

        maps:
            "Google Maps",

        homepage:
            "Homepage Control",

        delivery:
            "Delivery Settings",

        settings:
            "Website Settings"

    };


    const pageTitle =
        $("pageTitle");


    if (pageTitle) {

        pageTitle.textContent =
            titles[sectionName] ||
            sectionName;

    }


    // Close mobile sidebar
    const sidebar =
        document.querySelector(
            ".sidebar"
        );


    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    return false;

};


window.switchAdminSection =
    window.openSection;


// ============================================================
// INITIALIZE NAVIGATION
// ============================================================

function initializeNavigation() {

    const sections =
        document.querySelectorAll(
            ".section"
        );


    sections.forEach(
        (section, index) => {

            const isDashboard =
                section.id === "dashboard" ||
                index === 0;


            section.classList.toggle(
                "active",
                isDashboard
            );


            section.style.display =
                isDashboard
                    ? "block"
                    : "none";

        }
    );


    document
        .querySelectorAll(".nav-btn")
        .forEach(button => {

            button.classList.remove(
                "active"
            );


            button.addEventListener(
                "click",
                function(event) {

                    event.preventDefault();
                    event.stopPropagation();


                    const sectionName =
                        this.dataset.section;


                    if (sectionName) {

                        window.openSection(
                            sectionName,
                            event
                        );

                    }

                }
            );

        });


    const dashboardNav =
        document.querySelector(
            '.nav-btn[data-section="dashboard"]'
        );


    if (dashboardNav) {

        dashboardNav.classList.add(
            "active"
        );

    }


    // Mobile menu
    const mobileMenuBtn =
        $("mobileMenuBtn");


    if (mobileMenuBtn) {

        mobileMenuBtn.addEventListener(
            "click",
            function(event) {

                event.preventDefault();
                event.stopPropagation();


                const sidebar =
                    document.querySelector(
                        ".sidebar"
                    );


                if (sidebar) {

                    sidebar.classList.toggle(
                        "open"
                    );

                }

            }
        );

    }

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

        },
        error => {

            console.error(
                "Services listener error:",
                error
            );

        }
    );

}


window.saveServices =
    async function() {

        if (!db) {

            alert(
                "Firebase is not connected."
            );

            return;

        }


        try {

            await set(
                ref(db, "services"),
                {

                    buy:
                        $("serviceBuy")
                            ?.value || "",

                    sell:
                        $("serviceSell")
                            ?.value || "",

                    tracking:
                        $("serviceTracking")
                            ?.value || "",

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

            firebaseError(error);

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

                            firebaseKey:
                                key,

                            ...product

                        })
                    );


            renderProducts();

            updateDashboard();

        },
        error => {

            console.error(
                "Products listener error:",
                error
            );

            firebaseError(error);

        }
    );

}


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
        allProducts.filter(
            product => {

                const name =
                    String(
                        product.name ||
                        ""
                    ).toLowerCase();


                const brand =
                    String(
                        product.brand ||
                        ""
                    ).toLowerCase();


                const matchesSearch =
                    !search ||
                    name.includes(search) ||
                    brand.includes(search);


                let matchesFilter =
                    true;


                if (
                    filter !==
                    "all"
                ) {

                    matchesFilter =
                        String(
                            product.status ||
                            ""
                        ).toLowerCase() ===
                        filter.toLowerCase();

                }


                return (
                    matchesSearch &&
                    matchesFilter
                );

            }
        );


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
        products
            .map(product => {

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
                                            onerror="
                                                this.style.display='none'
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
                                type="button"
                                onclick="
                                    editProduct(
                                        '${escapeHTML(
                                            product.firebaseKey
                                        )}'
                                    )
                                "
                            >

                                Edit

                            </button>


                            <button
                                type="button"
                                onclick="
                                    deleteProduct(
                                        '${escapeHTML(
                                            product.firebaseKey
                                        )}'
                                    )
                                "
                                style="color:red;"
                            >

                                Delete

                            </button>

                        </td>

                    </tr>

                `;

            })
            .join("");

}


// ============================================================
// PRODUCT MODAL
// ============================================================

window.openProductModal =
    function(
        productKey = null
    ) {

        const modal =
            $("productModal");


        if (!modal) {

            alert(
                "Product modal not found in index.html."
            );

            return;

        }


        const form =
            modal.querySelector(
                "form"
            );


        if (form) {

            form.reset();

        }


        if ($("editProductKey")) {

            $("editProductKey").value =
                "";

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

                fillProductForm(
                    product
                );

            }

        }


        modal.style.display =
            "flex";

    };


window.openAddProductModal =
    window.openProductModal;


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
// PRODUCT FORM
// ============================================================

function fillProductForm(product) {

    const fields = {

        editProductKey:
            product.firebaseKey,

        productName:
            product.name || "",

        productBrand:
            product.brand || "",

        productCategory:
            product.category || "",

        productPrice:
            product.price || "",

        productStock:
            product.stock || 0,

        productImage:
            product.image || "",

        productImages:
            Array.isArray(product.images)
                ? product.images.join("\n")
                : "",

        productRAM:
            product.ram || "",

        productStorage:
            product.storage || "",

        productCondition:
            product.condition || "",

        productQuality:
            product.quality || "",

        productWarranty:
            product.warranty || ""

    };


    Object.entries(fields)
        .forEach(
            ([id, value]) => {

                const element =
                    $(id);

                if (element) {

                    element.value =
                        value;

                }

            }
        );

}


// ============================================================
// SAVE PRODUCT
// ============================================================

window.saveProduct =
    async function() {

        if (!db) {

            alert(
                "Firebase is not connected."
            );

            return;

        }


        const editKey =
            $("editProductKey")
                ?.value || "";


        const name =
            $("productName")
                ?.value
                ?.trim() || "";


        const brand =
            $("productBrand")
                ?.value
                ?.trim() || "";


        const category =
            $("productCategory")
                ?.value
                ?.trim() || "";


        const price =
            Number(
                $("productPrice")
                    ?.value || 0
            );


        const stock =
            Number(
                $("productStock")
                    ?.value || 0
            );


        const image =
            $("productImage")
                ?.value
                ?.trim() || "";


        const imagesText =
            $("productImages")
                ?.value || "";


        const images =
            imagesText
                .split("\n")
                .map(x => x.trim())
                .filter(Boolean);


        if (!name) {

            alert(
                "Please enter product name."
            );

            return;

        }


        const productData = {

            name,
            brand,
            category,
            price,
            stock,
            image,
            images,

            ram:
                $("productRAM")
                    ?.value || "",

            storage:
                $("productStorage")
                    ?.value || "",

            condition:
                $("productCondition")
                    ?.value || "",

            quality:
                $("productQuality")
                    ?.value || "",

            warranty:
                $("productWarranty")
                    ?.value || "",

            status:
                "approved",

            updatedAt:
                Date.now()

        };


        try {

            if (editKey) {

                await update(
                    ref(
                        db,
                        "products/" +
                        editKey
                    ),
                    productData
                );

                showToast(
                    "Product updated."
                );

            } else {

                await set(
                    push(
                        ref(
                            db,
                            "products"
                        )
                    ),
                    {
                        ...productData,
                        createdAt:
                            Date.now()
                    }
                );

                showToast(
                    "Product added."
                );

            }


            window.closeProductModal();


        } catch (error) {

            firebaseError(error);

        }

    };


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


        const confirmed =
            confirm(
                "Delete this product?"
            );


        if (!confirmed) return;


        try {

            await remove(
                ref(
                    db,
                    "products/" +
                    productKey
                )
            );

            showToast(
                "Product deleted."
            );

        } catch (error) {

            firebaseError(error);

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

                            firebaseKey:
                                key,

                            ...order

                        })
                    );


            renderOrders();

            updateDashboard();

        },
        error => {

            console.error(
                "Orders listener error:",
                error
            );

        }
    );

}


function renderOrders() {

    const container =
        $("ordersTable");


    if (!container) return;


    if (
        allOrders.length ===
        0
    ) {

        container.innerHTML = `
            <tr>
                <td
                    colspan="10"
                    style="text-align:center;padding:25px;"
                >
                    No orders found.
                </td>
            </tr>
        `;

        return;

    }


    container.innerHTML =
        allOrders
            .slice()
            .reverse()
            .map(order => `

                <tr>

                    <td>
                        ${escapeHTML(
                            order.orderId ||
                            order.id ||
                            order.firebaseKey
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            order.customerName ||
                            "Customer"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            order.customerPhone ||
                            ""
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            order.productName ||
                            ""
                        )}
                    </td>

                    <td>
                        ${formatMoney(
                            order.productPrice ||
                            order.totalAmount ||
                            0
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            order.status ||
                            "Pending"
                        )}
                    </td>

                    <td>
                        <button
                            type="button"
                            onclick="
                                updateOrderStatus(
                                    '${escapeHTML(
                                        order.firebaseKey
                                    )}'
                                )
                            "
                        >
                            Update
                        </button>
                    </td>

                </tr>

            `)
            .join("");

}


// ============================================================
// UPDATE ORDER STATUS
// ============================================================

window.updateOrderStatus =
    async function(orderKey) {

        if (!db) return;


        const order =
            allOrders.find(
                item =>
                    item.firebaseKey ===
                    orderKey
            );


        if (!order) return;


        const status =
            prompt(
                "Enter new order status:",
                order.status ||
                "Processing"
            );


        if (!status) return;


        try {

            await update(
                ref(
                    db,
                    "orders/" +
                    orderKey
                ),
                {
                    status,
                    updatedAt:
                        Date.now()
                }
            );

            showToast(
                "Order status updated."
            );

        } catch (error) {

            firebaseError(error);

        }

    };


// ============================================================
// SELL REQUESTS
// ============================================================

function loadSellerRequests() {

    if (!db) return;


    onValue(
        ref(
            db,
            "sellerRequests"
        ),
        snapshot => {

            const data =
                snapshot.val() || {};


            allSellerRequests =
                Object.entries(data)
                    .map(
                        ([key, request]) => ({

                            firebaseKey:
                                key,

                            ...request

                        })
                    );


            renderSellerRequests();

            updateDashboard();

        },
        error => {

            console.error(
                "Seller requests error:",
                error
            );

        }
    );

}


function renderSellerRequests() {

    const container =
        $("sellRequestsTable");


    if (!container) return;


    if (
        allSellerRequests.length ===
        0
    ) {

        container.innerHTML = `
            <tr>
                <td
                    colspan="10"
                    style="text-align:center;padding:25px;"
                >
                    No sell requests found.
                </td>
            </tr>
        `;

        return;

    }


    container.innerHTML =
        allSellerRequests
            .slice()
            .reverse()
            .map(request => `

                <tr>

                    <td>
                        ${escapeHTML(
                            request.firebaseKey
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            request.name ||
                            request.sellerName ||
                            "Customer"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            request.mobile ||
                            request.phone ||
                            request.sellerMobile ||
                            ""
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            request.deviceName ||
                            request.productName ||
                            request.name ||
                            ""
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            request.status ||
                            "Pending"
                        )}
                    </td>

                    <td>

                        <button
                            type="button"
                            onclick="
                                openSellRequest(
                                    '${escapeHTML(
                                        request.firebaseKey
                                    )}'
                                )
                            "
                        >
                            View
                        </button>

                    </td>

                </tr>

            `)
            .join("");

}


// ============================================================
// OPEN SELL REQUEST
// ============================================================

window.openSellRequest =
    function(requestKey) {

        const request =
            allSellerRequests.find(
                item =>
                    item.firebaseKey ===
                    requestKey
            );


        if (!request) {

            alert(
                "Sell request not found."
            );

            return;

        }


        currentSellRequest =
            request;


        const modal =
            $("sellRequestModal");


        if (modal) {

            modal.style.display =
                "flex";

        }


        const mapping = {

            sellRequestName:
                request.name ||
                request.sellerName ||
                "",

            sellRequestMobile:
                request.mobile ||
                request.phone ||
                request.sellerMobile ||
                "",

            sellRequestEmail:
                request.email ||
                request.sellerEmail ||
                "",

            sellRequestDevice:
                request.deviceName ||
                request.productName ||
                "",

            sellRequestCondition:
                request.condition ||
                "",

            sellRequestPrice:
                request.expectedPrice ||
                request.price ||
                "",

            sellRequestStatus:
                request.status ||
                "Pending"

        };


        Object.entries(mapping)
            .forEach(
                ([id, value]) => {

                    const element =
                        $(id);

                    if (element) {

                        element.value =
                            value;

                    }

                }
            );

};


// ============================================================
// CLOSE SELL REQUEST
// ============================================================

window.closeSellRequest =
    function() {

        const modal =
            $("sellRequestModal");


        if (modal) {

            modal.style.display =
                "none";

        }


        currentSellRequest =
            null;

    };


// ============================================================
// REJECT SELL REQUEST
// ============================================================

window.rejectCurrentSell =
    async function(event) {

        if (event) {

            event.preventDefault();
            event.stopPropagation();

        }


        if (
            !db ||
            !currentSellRequest
        ) {

            return;

        }


        const key =
            currentSellRequest.firebaseKey;


        const confirmed =
            confirm(
                "Reject this sell request?"
            );


        if (!confirmed) return;


        try {

            await update(
                ref(
                    db,
                    "sellerRequests/" +
                    key
                ),
                {

                    status:
                        "Rejected",

                    updatedAt:
                        Date.now()

                }
            );


            showToast(
                "Sell request rejected."
            );


            window.closeSellRequest();


        } catch (error) {

            firebaseError(error);

        }

    };


// ============================================================
// ACCEPT & LAUNCH
// ============================================================

window.acceptCurrentSell =
    async function(event) {

        if (event) {

            event.preventDefault();
            event.stopPropagation();

        }


        if (
            !db ||
            !currentSellRequest
        ) {

            alert(
                "No sell request selected."
            );

            return;

        }


        const request =
            currentSellRequest;


        const requestKey =
            request.firebaseKey;


        try {

            const productRef =
                push(
                    ref(
                        db,
                        "products"
                    )
                );


            const productId =
                productRef.key;


            const product = {

                name:
                    request.deviceName ||
                    request.productName ||
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
                        request.finalPrice ||
                        request.expectedPrice ||
                        request.price ||
                        0
                    ),

                stock:
                    Number(
                        request.stock ||
                        1
                    ),

                image:
                    request.image ||
                    request.deviceImage ||
                    "",

                images:
                    Array.isArray(
                        request.images
                    )
                        ? request.images
                        : [],

                ram:
                    request.ram ||
                    "",

                storage:
                    request.storage ||
                    request.rom ||
                    "",

                specs:
                    request.specs ||
                    "",

                condition:
                    request.condition ||
                    "",

                quality:
                    request.quality ||
                    "",

                warranty:
                    request.warranty ||
                    "",

                status:
                    "approved",

                type:
                    "seller",

                sellerRequestId:
                    requestKey,

                sellerName:
                    request.name ||
                    request.sellerName ||
                    "",

                sellerMobile:
                    request.mobile ||
                    request.phone ||
                    request.sellerMobile ||
                    "",

                sellerEmail:
                    request.email ||
                    request.sellerEmail ||
                    "",

                createdAt:
                    Date.now(),

                updatedAt:
                    Date.now()

            };


            await set(
                productRef,
                product
            );


            await update(
                ref(
                    db,
                    "sellerRequests/" +
                    requestKey
                ),
                {

                    status:
                        "Accepted & Launched",

                    productId:
                        productId,

                    acceptedAt:
                        Date.now(),

                    launchedAt:
                        Date.now(),

                    updatedAt:
                        Date.now()

                }
            );


            showToast(
                "Sell request accepted & product launched."
            );


            window.closeSellRequest();


        } catch (error) {

            console.error(
                "Accept & Launch error:",
                error
            );

            firebaseError(error);

        }

    };


// ============================================================
// CUSTOMERS
// ============================================================

function loadCustomers() {

    if (!db) return;


    onValue(
        ref(
            db,
            "customers"
        ),
        snapshot => {

            const data =
                snapshot.val() || {};


            allCustomers =
                Object.entries(data)
                    .map(
                        ([key, customer]) => ({

                            firebaseKey:
                                key,

                            ...customer

                        })
                    );


            renderCustomers();

        },
        error => {

            console.error(
                "Customers error:",
                error
            );

        }
    );

}


function renderCustomers() {

    const container =
        $("customersTable");


    if (!container) return;


    if (
        allCustomers.length ===
        0
    ) {

        container.innerHTML = `
            <tr>
                <td
                    colspan="10"
                    style="text-align:center;padding:25px;"
                >
                    No customers found.
                </td>
            </tr>
        `;

        return;

    }


    container.innerHTML =
        allCustomers
            .map(customer => `

                <tr>

                    <td>
                        ${escapeHTML(
                            customer.name ||
                            customer.customerName ||
                            "Customer"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            customer.email ||
                            customer.customerEmail ||
                            ""
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            customer.phone ||
                            customer.mobile ||
                            customer.customerPhone ||
                            ""
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            customer.address ||
                            ""
                        )}
                    </td>

                </tr>

            `)
            .join("");

}


// ============================================================
// TRACKING
// ============================================================

window.saveTrackingStatus =
    async function() {

        if (!db) return;


        const orderId =
            $("trackingOrderId")
                ?.value
                ?.trim() || "";


        const status =
            $("trackingStatus")
                ?.value || "";


        const message =
            $("trackingMessage")
                ?.value
                ?.trim() || "";


        if (!orderId) {

            alert(
                "Enter Order ID."
            );

            return;

        }


        try {

            const trackingRef =
                push(
                    ref(
                        db,
                        "tracking/" +
                        orderId
                    )
                );


            await set(
                trackingRef,
                {

                    status,

                    message,

                    timestamp:
                        Date.now()

                }
            );


            showToast(
                "Tracking status saved."
            );


        } catch (error) {

            firebaseError(error);

        }

    };


// ============================================================
// MAP SETTINGS
// ============================================================

function loadMapSettings() {

    if (!db) return;


    onValue(
        ref(
            db,
            "mapSettings"
        ),
        snapshot => {

            const data =
                snapshot.val() || {};


            if ($("mapUrl"))
                $("mapUrl").value =
                    data.mapUrl || "";


            if ($("mapEmbed"))
                $("mapEmbed").value =
                    data.mapEmbed || "";


            if ($("mapAddress"))
                $("mapAddress").value =
                    data.address || "";

        }
    );

}


window.saveMapSettings =
    async function() {

        if (!db) return;


        try {

            await set(
                ref(
                    db,
                    "mapSettings"
                ),
                {

                    mapUrl:
                        $("mapUrl")
                            ?.value || "",

                    mapEmbed:
                        $("mapEmbed")
                            ?.value || "",

                    address:
                        $("mapAddress")
                            ?.value || "",

                    updatedAt:
                        Date.now()

                }
            );


            showToast(
                "Google Maps settings saved."
            );


        } catch (error) {

            firebaseError(error);

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
            "homepage"
        ),
        snapshot => {

            const data =
                snapshot.val() || {};


            if ($("homeTitle"))
                $("homeTitle").value =
                    data.title || "";


            if ($("homeSubtitle"))
                $("homeSubtitle").value =
                    data.subtitle || "";


            if ($("homeBanner"))
                $("homeBanner").value =
                    data.banner || "";

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
                    "homepage"
                ),
                {

                    title:
                        $("homeTitle")
                            ?.value || "",

                    subtitle:
                        $("homeSubtitle")
                            ?.value || "",

                    banner:
                        $("homeBanner")
                            ?.value || "",

                    updatedAt:
                        Date.now()

                }
            );


            showToast(
                "Homepage settings saved."
            );


        } catch (error) {

            firebaseError(error);

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
                    data.charge ?? "";


            if ($("deliveryTime"))
                $("deliveryTime").value =
                    data.time || "";


            if ($("freeDelivery"))
                $("freeDelivery").checked =
                    Boolean(
                        data.freeDelivery
                    );

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

                    time:
                        $("deliveryTime")
                            ?.value || "",

                    freeDelivery:
                        Boolean(
                            $("freeDelivery")
                                ?.checked
                        ),

                    updatedAt:
                        Date.now()

                }
            );


            showToast(
                "Delivery settings saved."
            );


        } catch (error) {

            firebaseError(error);

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
                    data.siteTitle || "";


            if ($("logoUrl"))
                $("logoUrl").value =
                    data.logoUrl || "";


            if ($("facebookUrl"))
                $("facebookUrl").value =
                    data.facebookUrl || "";


            if ($("instagramUrl"))
                $("instagramUrl").value =
                    data.instagramUrl || "";

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

            firebaseError(error);

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
        allOrders.filter(
            order => {

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

            }
        );


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


function renderRecentOrders() {

    const container =
        $("recentOrders");


    if (!container) return;


    if (
        allOrders.length ===
        0
    ) {

        container.innerHTML =
            "No recent orders.";

        return;

    }


    container.innerHTML =
        allOrders
            .slice()
            .reverse()
            .slice(0, 5)
            .map(
                order => `

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
                                order.totalAmount ??
                                order.total ??
                                order.amount ??
                                order.productPrice ??
                                0
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

                `
            )
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

    loadCustomers();

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
// SEARCH LISTENERS
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

    getCurrentSellRequest:
        () => currentSellRequest,

    firebase:
        () => db

};


console.log(
    "RITTIK MOBILE SHOP ADMIN JS READY"
);
