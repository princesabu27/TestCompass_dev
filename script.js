const BASE_URL = "https://compass-server-eta.vercel.app";
// USER_ID is now mutable and set upon successful login.
let USER_ID = null;

// -----------------------------
// AUTHENTICATION STATE MANAGEMENT
// -----------------------------

function showLogin() {
    document.getElementById("mainApp").style.display = "none";
    document.getElementById("loginPage").style.display = "block";
}

function showMainApp() {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("mainApp").style.display = "block";

    // Initialize data once logged in
    loadCategories();
    loadAccounts();
    switchTab("expenseTab");
}

function logout() {
    USER_ID = null;
    // Clear any stored tokens/session data here in a real app
    alert("Logged out successfully.");
    showLogin();
}

// -----------------------------
// LOGIN LOGIC
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
    // Add event listener for the login form submission
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;
            const loginMsgBox = document.getElementById("loginMsg");
            loginMsgBox.style.display = "none";

            // --- MOCK LOGIN LOGIC (Replace with real API call) ---
            if (username === "PrinceSabu" && password === "testPassword@123") {
                // Success: Set a mock USER_ID and switch views
                USER_ID = "2a3a0ab2-f05a-4b5b-8e58-80964741065a";
                loginMsgBox.textContent = "Login Successful. Redirecting...";
                loginMsgBox.className = "msg success";
                loginMsgBox.style.display = "block";

                setTimeout(showMainApp, 500);

            } else {
                // Failure
                loginMsgBox.textContent = "❌ Invalid username or password.";
                loginMsgBox.className = "msg error";
                loginMsgBox.style.display = "block";
            }
            // --- END MOCK LOGIN LOGIC ---
        });
    }

    // Initial check: Since we don't have real session storage, default to login view
    showLogin();
});

// -----------------------------
// TAB SWITCHING
// -----------------------------
function switchTab(tabId, event) {
    document.getElementById("expenseTab").style.display = "none";
    document.getElementById("balanceTab").style.display = "none";

    document
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));

    document.getElementById(tabId).style.display = "block";

    if (event && event.currentTarget) {
        event.currentTarget.classList.add("active");
    } else {
        document
            .querySelector(`.tabs > [onclick*="${tabId}"]`)
            .classList.add("active");
    }

    if (tabId === "balanceTab") loadAccountBalances();
}

// -----------------------------
// LOAD CATEGORIES
// -----------------------------
async function loadCategories() {
    if (!USER_ID) return; // Guard for unauthorized access
    try {
        const res = await fetch(
            `${BASE_URL}/api/expense/categories?user_id=${USER_ID}`
        );
        const data = await res.json();

        const dropdown = document.getElementById("category");
        dropdown.innerHTML = data
            .map(
                (item) =>
                    `<option value="${item.expense_categories_id}">${item.expense_category_name}</option>`
            )
            .join("");
    } catch (error) {
        console.error("Error loading categories:", error);
        document.getElementById(
            "category"
        ).innerHTML = `<option value="">Failed to load categories</option>`;
    }
}

// -----------------------------
// LOAD ACCOUNTS (for both form and balance list)
// -----------------------------
async function loadAccounts() {
    if (!USER_ID) return []; // Guard for unauthorized access
    try {
        const res = await fetch(
            `${BASE_URL}/api/account/list?user_id=${USER_ID}`
        );
        const data = await res.json();

        // Populate form dropdown
        const dropdown = document.getElementById("account");
        dropdown.innerHTML = data
            .map(
                (item) =>
                    `<option value="${item.account_id}">${item.account_name}</option>`
            )
            .join("");

        return data;
    } catch (error) {
        console.error("Error loading accounts:", error);
        document.getElementById(
            "account"
        ).innerHTML = `<option value="">Failed to load accounts</option>`;
        return [];
    }
}

// -----------------------------
// LOAD ACCOUNT BALANCES
// -----------------------------
async function loadAccountBalances() {
    if (!USER_ID) return; // Guard for unauthorized access
    const container = document.getElementById("accountsContainer");
    container.innerHTML =
        "<p style='text-align:center;'>Loading account data...</p>";

    const accounts = await loadAccounts();

    if (accounts.length === 0) {
        container.innerHTML =
            "<p style='text-align:center; color:#9ca3af;'>No accounts found or failed to load.</p>";
        return;
    }

    container.innerHTML = accounts
        .map(
            (acc) => `
                <div class="account-card">
                    <div class="account-details">
                        <h4>${acc.account_name}</h4>
                        <small>${acc.account_type} - ${acc.account_holding_country}</small>
                    </div>
                    <div class="account-balance">
                        ${acc.balance_amount} ${acc.currency_code}
                    </div>
                </div>
            `
        )
        .join("");
}

// -----------------------------
// SUBMIT EXPENSE
// -----------------------------
document
    .getElementById("expenseForm")
    .addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!USER_ID) {
            alert("Please log in first.");
            return;
        }

        const payload = {
            amount: parseFloat(document.getElementById("amount").value),
            user_id: USER_ID,
            expense_category_id: document.getElementById("category").value,
            account_id: document.getElementById("account").value,
            transaction_date: document.getElementById("transaction_date").value,
            expense_name: document.getElementById("expense_name").value,
            description: document.getElementById("description").value,
            currency_code: document.getElementById("currency").value,
        };

        const msgBox = document.getElementById("msg");
        msgBox.style.display = "none";

        try {
            const res = await fetch(`${BASE_URL}/api/expense/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                msgBox.textContent = "✅ Expense successfully added!";
                msgBox.className = "msg success";
                e.target.reset();
            } else {
                const errorData = await res
                    .json()
                    .catch(() => ({
                        message: "Failed with status: " + res.status,
                    }));
                msgBox.textContent = `❌ Failed to submit expense: ${errorData.message || res.statusText
                    }`;
                msgBox.className = "msg error";
            }
        } catch (error) {
            console.error("Submission error:", error);
            msgBox.textContent =
                "❗ Server or network error. Check your connection.";
            msgBox.className = "msg error";
        }

        msgBox.style.display = "block";
    });
