
/* =========================================
   PERSONAL EXPENSE TRACKER
   APPLICATION ENGINE
   VANILLA JAVASCRIPT
========================================= */

// -----------------------------------------
// 1. APPLICATION CONFIGURATION
// -----------------------------------------

const STORAGE_KEY = "myfinance_transactions_v1";

const categories = {
    income: [
        "Salary",
        "Business",
        "Freelance",
        "Investment",
        "Rental Income",
        "Other Income"
    ],

    expense: [
        "Food",
        "Transport",
        "Housing",
        "Shopping",
        "Education",
        "Healthcare",
        "Utilities",
        "Entertainment",
        "Travel",
        "Personal Care",
        "Other Expense"
    ]
};

const currencyFormatter = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const formatMoney = amount => currencyFormatter.format(amount);

// -----------------------------------------
// 2. APPLICATION STATE
// -----------------------------------------

let transactions = loadTransactions();

// -----------------------------------------
// 3. HTML ELEMENT REFERENCES
// -----------------------------------------

const transactionForm = document.getElementById("transactionForm");

const typeInput = document.getElementById("type");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const transactionIdInput = document.getElementById("transactionId");

const balanceElement = document.getElementById("balance");
const incomeElement = document.getElementById("totalIncome");
const expensesElement = document.getElementById("totalExpenses");
const countElement = document.getElementById("transactionCount");

const tableBody = document.getElementById("transactionTableBody");
const emptyState = document.getElementById("emptyState");

const searchInput = document.getElementById("searchInput");
const filterType = document.getElementById("filterType");
const filterCategory = document.getElementById("filterCategory");
const filterMonth = document.getElementById("filterMonth");

const analyticsMonth = document.getElementById("analyticsMonth");

const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelEditBtn");

const categoryChart = document.getElementById("categoryChart");
const comparisonChart = document.getElementById("comparisonChart");

// -----------------------------------------
// 4. DATE UTILITIES
// -----------------------------------------

function getTodayDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
    if (!dateString) return "";

    const [year, month, day] = dateString.split("-");

    return `${day}/${month}/${year}`;
}

// -----------------------------------------
// 5. LOCAL STORAGE FUNCTIONS
// -----------------------------------------

function loadTransactions() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) return [];

        const parsedData = JSON.parse(savedData);

        if (!Array.isArray(parsedData)) return [];

        return parsedData.filter(item =>
            item &&
            typeof item.id === "string" &&
            ["income", "expense"].includes(item.type) &&
            typeof item.description === "string" &&
            typeof item.amount === "number" &&
            Number.isFinite(item.amount) &&
            item.amount > 0 &&
            typeof item.category === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(item.date)
        );

    } catch (error) {
        console.error("Unable to load transactions:", error);
        return [];
    }
}

function saveTransactions() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(transactions)
        );

    } catch (error) {
        console.error("Unable to save transactions:", error);
        alert("Your data could not be saved. Check browser storage.");
    }
}

// -----------------------------------------
// 6. INITIALISE APPLICATION
// -----------------------------------------

function initialiseApp() {

    document.getElementById("todayDate").textContent =
        new Date().toLocaleDateString("en-KE", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });

    dateInput.value = getTodayDate();

    populateCategories();

    renderApplication();
}

function populateCategories() {

    updateCategoryOptions();

    filterCategory.innerHTML =
        '<option value="all">All Categories</option>';

    const allCategories = [
        ...categories.income,
        ...categories.expense
    ];

    allCategories.forEach(category => {

        const option = document.createElement("option");

        option.value = category;
        option.textContent = category;

        filterCategory.appendChild(option);
    });
}

// -----------------------------------------
// 7. DYNAMIC CATEGORY SELECTION
// -----------------------------------------

function updateCategoryOptions() {

    const selectedType = typeInput.value;

    const availableCategories = categories[selectedType];

    categoryInput.innerHTML =
        '<option value="">Select category</option>';

    availableCategories.forEach(category => {

        const option = document.createElement("option");

        option.value = category;
        option.textContent = category;

        categoryInput.appendChild(option);
    });
}

typeInput.addEventListener("change", () => {
    updateCategoryOptions();
});

// -----------------------------------------
// 8. ADD AND UPDATE TRANSACTIONS
// -----------------------------------------

transactionForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const type = typeInput.value;
    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const category = categoryInput.value;
    const date = dateInput.value;
    const existingId = transactionIdInput.value;

    // Validate user input

    if (!description || !category || !date) {
        alert("Please complete all required fields.");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid amount greater than zero.");
        return;
    }

    if (!categories[type].includes(category)) {
        alert("Please select a valid category for this transaction.");
        return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        new Date(date + "T00:00:00").toString() === "Invalid Date") {
        alert("Please enter a valid transaction date.");
        return;
    }

    const transactionData = {
        id: existingId || (
            window.crypto && crypto.randomUUID
                ? crypto.randomUUID()
                : Date.now().toString() + Math.random().toString(36).slice(2)
        ),

        type,
        description,
        amount: Math.round(amount * 100) / 100,
        category,
        date
    };

    if (existingId) {

        // UPDATE EXISTING TRANSACTION

        transactions = transactions.map(transaction => {

            return transaction.id === existingId
                ? transactionData
                : transaction;

        });

    } else {

        // ADD NEW TRANSACTION

        transactions.push(transactionData);
    }

    saveTransactions();

    resetForm();

    renderApplication();

    alert(
        existingId
            ? "Transaction updated successfully!"
            : "Transaction recorded successfully!"
    );
});

// -----------------------------------------
// 9. EDIT TRANSACTION
// -----------------------------------------

function editTransaction(id) {

    const transaction = transactions.find(item => item.id === id);

    if (!transaction) return;

    transactionIdInput.value = transaction.id;

    typeInput.value = transaction.type;

    updateCategoryOptions();

    descriptionInput.value = transaction.description;
    amountInput.value = transaction.amount;
    categoryInput.value = transaction.category;
    dateInput.value = transaction.date;

    document.getElementById("formTitle").textContent =
        "Edit Transaction";

    saveBtn.textContent = "Update Transaction";

    cancelBtn.style.display = "inline-block";

    document.getElementById("transactionFormSection")
        .scrollIntoView({ behavior: "smooth" });
}

// -----------------------------------------
// 10. DELETE TRANSACTION
// -----------------------------------------

function deleteTransaction(id) {

    const transaction = transactions.find(item => item.id === id);

    if (!transaction) return;

    const confirmation = confirm(
        `Are you sure you want to delete "${transaction.description}"?`
    );

    if (!confirmation) return;

    transactions = transactions.filter(item => item.id !== id);

    saveTransactions();

    renderApplication();
}

// -----------------------------------------
// 11. RESET FORM
// -----------------------------------------

function resetForm() {

    transactionForm.reset();

    transactionIdInput.value = "";

    typeInput.value = "expense";

    updateCategoryOptions();

    dateInput.value = getTodayDate();

    document.getElementById("formTitle").textContent =
        "Add New Transaction";

    saveBtn.textContent = "Save Transaction";

    cancelBtn.style.display = "none";
}

cancelBtn.addEventListener("click", resetForm);

document.getElementById("addTransactionBtn")
    .addEventListener("click", () => {

        resetForm();

        document.getElementById("transactionFormSection")
            .scrollIntoView({ behavior: "smooth" });
    });

// -----------------------------------------
// 12. CALCULATE FINANCIAL SUMMARY
// -----------------------------------------

function calculateSummary(data = transactions) {

    const totalIncome = data

        .filter(item => item.type === "income")

        .reduce((total, item) => total + item.amount, 0);

    const totalExpenses = data

        .filter(item => item.type === "expense")

        .reduce((total, item) => total + item.amount, 0);

    const balance = totalIncome - totalExpenses;

    return {
        totalIncome,
        totalExpenses,
        balance,
        transactionCount: data.length
    };
}

// -----------------------------------------
// 13. UPDATE DASHBOARD
// -----------------------------------------

function updateDashboard() {

    const summary = calculateSummary();

    balanceElement.textContent = formatMoney(summary.balance);

    incomeElement.textContent =
        formatMoney(summary.totalIncome);

    expensesElement.textContent =
        formatMoney(summary.totalExpenses);

    countElement.textContent =
        summary.transactionCount;

    balanceElement.style.color =
        summary.balance < 0 ? "#dc2626" : "#2563eb";
}

// -----------------------------------------
// 14. TRANSACTION FILTERING
// -----------------------------------------

function getFilteredTransactions() {

    const searchTerm = searchInput.value
        .trim()
        .toLowerCase();

    const selectedType = filterType.value;

    const selectedCategory = filterCategory.value;

    const selectedMonth = filterMonth.value;

    return transactions

        .filter(transaction => {

            const matchesSearch =
                transaction.description.toLowerCase()
                    .includes(searchTerm) ||
                transaction.category.toLowerCase()
                    .includes(searchTerm);

            const matchesType =
                selectedType === "all" ||
                transaction.type === selectedType;

            const matchesCategory =
                selectedCategory === "all" ||
                transaction.category === selectedCategory;

            const matchesMonth =
                !selectedMonth ||
                transaction.date.startsWith(selectedMonth);

            return (
                matchesSearch &&
                matchesType &&
                matchesCategory &&
                matchesMonth
            );
        })

        .sort((a, b) => {

            return b.date.localeCompare(a.date) ||
                b.id.localeCompare(a.id);
        });
}

// -----------------------------------------
// 15. DISPLAY TRANSACTION HISTORY
// -----------------------------------------

function renderTransactions() {

    const filteredTransactions = getFilteredTransactions();

    tableBody.innerHTML = "";

    if (filteredTransactions.length === 0) {

        emptyState.style.display = "block";

        return;

    } else {

        emptyState.style.display = "none";
    }

    filteredTransactions.forEach(transaction => {

        const row = document.createElement("tr");

        const dateCell = document.createElement("td");
        dateCell.textContent = formatDate(transaction.date);

        const descriptionCell = document.createElement("td");
        descriptionCell.textContent = transaction.description;

        const categoryCell = document.createElement("td");
        categoryCell.textContent = transaction.category;

        const typeCell = document.createElement("td");

        const badge = document.createElement("span");

        badge.className = transaction.type === "income"
            ? "type-badge badge-income"
            : "type-badge badge-expense";

        badge.textContent = transaction.type === "income"
            ? "Income"
            : "Expense";

        typeCell.appendChild(badge);

        const amountCell = document.createElement("td");

        amountCell.className =
            transaction.type === "income"
                ? "amount-income"
                : "amount-expense";

        amountCell.textContent =
            (transaction.type === "income" ? "+" : "-") +
            " " + formatMoney(transaction.amount);

        const actionsCell = document.createElement("td");

        const editButton = document.createElement("button");

        editButton.className = "action-btn edit-btn";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", () => {
            editTransaction(transaction.id);
        });

        const deleteButton = document.createElement("button");

        deleteButton.className = "action-btn delete-btn";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
            deleteTransaction(transaction.id);
        });

        actionsCell.append(editButton, deleteButton);

        row.append(
            dateCell,
            descriptionCell,
            categoryCell,
            typeCell,
            amountCell,
            actionsCell
        );

        tableBody.appendChild(row);
    });
}

// -----------------------------------------
// 16. SPENDING ANALYTICS
// -----------------------------------------

function getAnalyticsTransactions() {

    const selectedMonth = analyticsMonth.value;

    if (selectedMonth === "all") {
        return transactions;
    }

    return transactions.filter(item =>
        item.date.startsWith(selectedMonth)
    );
}

// -----------------------------------------
// 17. POPULATE ANALYTICS MONTHS
// -----------------------------------------

function updateAnalyticsMonths() {

    const previousSelection = analyticsMonth.value;

    const months = [...new Set(
        transactions.map(item => item.date.slice(0, 7))
    )].sort().reverse();

    analyticsMonth.innerHTML =
        '<option value="all">All Time</option>';

    months.forEach(month => {

        const option = document.createElement("option");

        option.value = month;

        const [year, monthNumber] = month.split("-");

        option.textContent = new Date(
            Number(year),
            Number(monthNumber) - 1,
            1
        ).toLocaleDateString("en-KE", {
            month: "long",
            year: "numeric"
        });

        analyticsMonth.appendChild(option);
    });

    if (months.includes(previousSelection)) {
        analyticsMonth.value = previousSelection;
    }
}

// -----------------------------------------
// 18. CATEGORY SPENDING CHART
// -----------------------------------------

function renderCategoryChart() {

    const data = getAnalyticsTransactions();

    const expenses = data.filter(item =>
        item.type === "expense"
    );

    const totalExpenses = expenses.reduce(
        (sum, item) => sum + item.amount,
        0
    );

    categoryChart.innerHTML = "";

    if (totalExpenses === 0) {

        categoryChart.textContent =
            "No expense data available.";

        return;
    }

    const categoryTotals = {};

    expenses.forEach(item => {

        categoryTotals[item.category] =
            (categoryTotals[item.category] || 0) + item.amount;

    });

    const sortedCategories = Object.entries(categoryTotals)

        .sort((a, b) => b[1] - a[1]);

    sortedCategories.forEach(([category, amount]) => {

        const percentage = (amount / totalExpenses) * 100;

        const item = document.createElement("div");

        item.className = "chart-item";

        const label = document.createElement("div");

        label.className = "chart-label";

        const categoryName = document.createElement("span");
        categoryName.textContent = category;

        const categoryAmount = document.createElement("strong");

        categoryAmount.textContent =
            `${formatMoney(amount)} (${percentage.toFixed(1)}%)`;

        label.append(categoryName, categoryAmount);

        const track = document.createElement("div");

        track.className = "progress-track";

        const fill = document.createElement("div");

        fill.className = "progress-fill";

        fill.style.width = `${percentage}%`;

        track.appendChild(fill);

        item.append(label, track);

        categoryChart.appendChild(item);
    });
}

// -----------------------------------------
// 19. INCOME VS EXPENSE CHART
// -----------------------------------------

function renderComparisonChart() {

    const data = getAnalyticsTransactions();

    const summary = calculateSummary(data);

    const total = summary.totalIncome + summary.totalExpenses;

    const incomePercentage = total > 0
        ? (summary.totalIncome / total) * 100
        : 0;

    const expensePercentage = total > 0
        ? (summary.totalExpenses / total) * 100
        : 0;

    comparisonChart.innerHTML = "";

    const incomeItem = document.createElement("div");

    incomeItem.className = "comparison-item";

    const incomeLabel = document.createElement("p");

    incomeLabel.textContent =
        `Total Income: ${formatMoney(summary.totalIncome)}`;

    const expenseItem = document.createElement("div");

    expenseItem.className = "comparison-item";

    const expenseLabel = document.createElement("p");

    expenseLabel.textContent =
        `Total Expenses: ${formatMoney(summary.totalExpenses)}`;

    const bar = document.createElement("div");

    bar.className = "comparison-bar";

    const incomeBar = document.createElement("div");

    incomeBar.className = "income-bar";

    incomeBar.style.width = `${incomePercentage}%`;

    const expenseBar = document.createElement("div");

    expenseBar.className = "expense-bar";

    expenseBar.style.width = `${expensePercentage}%`;

    bar.append(incomeBar, expenseBar);

    const legend = document.createElement("div");

    legend.className = "comparison-legend";

    legend.innerHTML = `
        <span><i class="legend-dot green-dot"></i> Income</span>
        <span><i class="legend-dot red-dot"></i> Expenses</span>
    `;

    incomeItem.appendChild(incomeLabel);

    expenseItem.appendChild(expenseLabel);

    comparisonChart.append(
        incomeItem,
        expenseItem,
        bar,
        legend
    );
}

// -----------------------------------------
// 20. APPLICATION RENDERING ENGINE
// -----------------------------------------

function renderApplication() {

    updateDashboard();

    renderTransactions();

    updateAnalyticsMonths();

    renderCategoryChart();

    renderComparisonChart();
}

// -----------------------------------------
// 21. EVENT LISTENERS
// -----------------------------------------

searchInput.addEventListener("input", renderTransactions);

filterType.addEventListener("change", renderTransactions);

filterCategory.addEventListener("change", renderTransactions);

filterMonth.addEventListener("change", renderTransactions);

analyticsMonth.addEventListener("change", () => {

    renderCategoryChart();

    renderComparisonChart();
});

document.getElementById("resetFiltersBtn")
    .addEventListener("click", () => {

        searchInput.value = "";

        filterType.value = "all";

        filterCategory.value = "all";

        filterMonth.value = "";

        renderTransactions();
    });

// -----------------------------------------
// 22. START APPLICATION
// -----------------------------------------

initialiseApp();
