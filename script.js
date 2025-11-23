
      const BASE_URL = "https://compass-server-eta.vercel.app";
      const USER_ID = "2a3a0ab2-f05a-4b5b-8e58-80964741065a";

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

        // Use event.currentTarget for reliability
        if (event && event.currentTarget) {
          event.currentTarget.classList.add("active");
        } else {
          // Fallback for initial load
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
          msgBox.style.display = "none"; // Hide previous message

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
              // Try to get error message from body if available
              const errorData = await res
                .json()
                .catch(() => ({
                  message: "Failed with status: " + res.status,
                }));
              msgBox.textContent = `❌ Failed to submit expense: ${
                errorData.message || res.statusText
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

      // Bootstrapping
      document.addEventListener("DOMContentLoaded", () => {
        loadCategories();
        loadAccounts();

        // Ensure the initial tab state is correct
        switchTab("expenseTab");
      });