let chart;

document.getElementById('includePension').addEventListener('change', function () {
    const pensionDetails = document.getElementById('pensionDetails');
    if (this.checked) {
        pensionDetails.classList.remove('hidden');
    } else {
        pensionDetails.classList.add('hidden');
    }
});

document.getElementById('spendingTitle').addEventListener('change', function () {
    const selectedOption = this.options[this.selectedIndex];
    const spendingAmountInput = document.getElementById('spendingAmount');
    const spendingFrequencyLabel = document.getElementById('spendingFrequencyLabel');
    const spendingFrequencyContainer = document.getElementById('spendingFrequencyContainer');

    if (selectedOption.value !== 'custom') {
        const defaultAmount = selectedOption.getAttribute('data-default-amount');
        spendingAmountInput.value = defaultAmount;

        spendingFrequencyLabel.classList.add('hidden');
        spendingFrequencyContainer.classList.add('hidden');
    } else {
        spendingAmountInput.value = '';
        spendingFrequencyLabel.classList.remove('hidden');
        spendingFrequencyContainer.classList.remove('hidden');
    }
});

function calculateAndShowResult() {
    // Get all values from input fields
    const currentAge = parseFloat(document.getElementById("currentAge").value);
    const targetAge = parseFloat(document.getElementById("targetAge").value);
    const currentSavings = parseFloat(
        document.getElementById("retirementSavings").value,
    );
    const contribution = parseFloat(
        document.getElementById("contribution").value,
    );
    const frequency = parseFloat(document.getElementById("frequency").value);
    const inflationRate = parseFloat(document.getElementById("inflation").value);

    let includePension = document.getElementById('includePension').checked;
    let pensionAmount = includePension ? parseFloat(document.getElementById("pensionAmount").value) * 12 : 0;
    let pensionAge = includePension ? parseFloat(document.getElementById("pensionAge").value) : Infinity;

    // Return if is there any Non Number value
    if (
        isNaN(currentAge) ||
        isNaN(targetAge) ||
        isNaN(currentSavings) ||
        isNaN(contribution)
    ) {
        document.getElementById("result").textContent =
            "Please fill in all fields correctly.";
        return;
    }

    // Return if targeted age is less than current age
    if (targetAge <= currentAge) {
        document.getElementById("result").textContent =
            "Target withdrawal age must be greater than current age.";
        return;
    }

    const yearsToRetirement = targetAge - currentAge;
    let savingsData = [];
    let leftSavingsData = [];
    let ageLabels = [];
    let futureValue = currentSavings;
    let adjustedContribution = contribution;

    // Calculate savings until retirement
    for (let i = 0; i <= yearsToRetirement; i++) {
        if (i > 0) {
            adjustedContribution *= 1 + inflationRate;
        }
        futureValue += adjustedContribution * frequency;

        savingsData.push(futureValue.toFixed(2));
        ageLabels.push(currentAge + i);
    }

    // Aligning Left Savings data to start correctly from the targetAge
    ageLabels.push(targetAge); // Ensure the target age is in the labels

    let remainingSavings = futureValue;
    const spendingBoxes = document.querySelectorAll(".spending-box");

    for (let i = targetAge; i <= 100; i++) {
        let yearlySpending = 0;

        spendingBoxes.forEach((box) => {
            const spendingAmount = parseFloat(box.getAttribute("data-amount")) || 0;
            const spendingFrequency = box.getAttribute("data-frequency") || "yearly";

            const adjustedSpending =
                spendingFrequency === "monthly" ? spendingAmount * 12 : spendingAmount;
            yearlySpending += adjustedSpending;
        });

        if (i >= pensionAge) {
            remainingSavings += pensionAmount; // Add government pension annually from eligibility age
        }

        remainingSavings -= yearlySpending;
        if (remainingSavings < 0) remainingSavings = 0;

        leftSavingsData.push(remainingSavings.toFixed(2));
        if (i !== targetAge) {
            ageLabels.push(i);
        }
    }

    const result = `If you retire at the age of ${targetAge} with your current retirement savings of $${currentSavings.toFixed(
        2,
    )}, while contributing $${contribution.toFixed(
        2,
    )} every period with an inflation rate of ${(inflationRate * 100).toFixed(
        2,
    )}%, you will have an estimated retirement savings of $${futureValue.toFixed(
        2,
    )}. After retirement, considering your spending, your savings will last until approximately age ${
        ageLabels[ageLabels.length - 1]
    }.`;

    document.getElementById("result").textContent = result;

    if (chart) {
        chart.destroy();
    }

    // Calculate the length of SavingsData for offset in leftSavingsData
    const nullOffsets = Array(savingsData.length - 1).fill(null);

    const ctx = document.getElementById("myChart").getContext("2d");
    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: ageLabels,
            datasets: [
                {
                    label: "Retirement Savings",
                    data: savingsData,
                    borderColor: "rgba(75, 192, 192, 1)",
                    fill: false,
                    tension: 0.1,
                    pointBackgroundColor: "rgba(75, 192, 192, 1)",
                    pointBorderColor: "rgba(75, 192, 192, 1)",
                },
                {
                    label: "Left Savings",
                    data: [...nullOffsets, ...leftSavingsData],
                    borderColor: "rgba(255, 99, 132, 1)",
                    fill: false,
                    tension: 0.1,
                    pointBackgroundColor: "rgba(255, 99, 132, 1)",
                    pointBorderColor: "rgba(255, 99, 132, 1)",
                },
            ],
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Age",
                    },
                    min: currentAge,
                    max: 100,
                },
                y: {
                    title: {
                        display: true,
                        text: "Amount ($)",
                    },
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return value / 1000 + "k";
                        },
                    },
                },
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.dataset.label || "";
                            const index = context.dataIndex;
                            const age = ageLabels[index];
                            const value = Number(context.parsed.y).toFixed(2);

                            if (label === "Retirement Savings") {
                                return `Age: ${age} | Savings: $${value}`;
                            } else if (label === "Left Savings") {
                                const spendingBoxes = document.querySelectorAll(".spending-box");
                                let yearlySpending = 0;

                                spendingBoxes.forEach((box) => {
                                    const spendingAmount = parseFloat(box.getAttribute("data-amount")) || 0;
                                    const spendingFrequency = box.getAttribute("data-frequency") || "yearly";

                                    const adjustedSpending =
                                        spendingFrequency === "monthly" ? spendingAmount * 12 : spendingAmount;
                                    yearlySpending += adjustedSpending;
                                });

                                const spending = yearlySpending.toFixed(2);
                                return `Age: ${age} | Yearly Spending: $${spending} | Savings Left: $${value}`;
                            }
                            return `${label}: $${value}`;
                        },
                    },
                },
            },
        },
    });
}

function toggleCustomTitleInput() {
    const spendingTitleSelect = document.getElementById("spendingTitle");
    const spendingTitleCustom = document.getElementById("spendingTitleCustom");
    const spendingIcon = document.getElementById("spendingIcon");
    const spendingIconLabel = document.getElementById("spendingIconLabel");

    if (spendingTitleSelect.value === "custom") {
        spendingTitleCustom.classList.remove("hidden");
        spendingIcon.classList.remove("hidden");
        spendingIconLabel.classList.remove("hidden");
    } else {
        spendingTitleCustom.classList.add("hidden");
        spendingIcon.classList.add("hidden");
        spendingIconLabel.classList.add("hidden");
    }
}

function addSpendingBox() {
    const spendingTitleSelect = document.getElementById("spendingTitle");
    const spendingTitleCustom = document
        .getElementById("spendingTitleCustom")
        .value.trim();
    let spendingTitle = spendingTitleSelect.value;
    let spendingIcon =
        spendingTitleSelect.selectedOptions[0].getAttribute("data-icon");

    const customIconFile = document.getElementById("spendingIcon").files[0];
    if (spendingTitle === "custom" && customIconFile) {
        const reader = new FileReader();
        reader.onload = function (e) {
            spendingIcon = `<img src="${e.target.result}" alt="icon" class="w-8 h-8 dropdown-icon">`;
            createSpendingBox(spendingTitleCustom, spendingIcon, true);
        };
        reader.readAsDataURL(customIconFile);
    } else if (spendingTitle === "custom") {
        spendingIcon = "💰"; // Default icon for custom titles without an uploaded icon
        createSpendingBox(spendingTitleCustom, spendingIcon, true);
    } else {
        createSpendingBox(spendingTitle, spendingIcon, false);
    }
}

function createSpendingBox(spendingTitle, spendingIcon, isCustom) {
    const spendingAmount = document.getElementById("spendingAmount").value;
    const spendingFrequency = document.querySelector(
        'input[name="spendingFrequency"]:checked',
    ).value;

    if (!spendingTitle || isNaN(spendingAmount) || spendingAmount <= 0) {
        alert("Please provide valid spending details.");
        return;
    }

    const spendingBoxContainer = document.getElementById("spendingBoxContainer");

    const spendingBox = document.createElement("div");
    spendingBox.className =
        "spending-box p-4 rounded-lg shadow-lg flex flex-col items-center justify-center relative";
    spendingBox.setAttribute("data-amount", spendingAmount);
    spendingBox.setAttribute("data-frequency", spendingFrequency);
    spendingBox.setAttribute("data-title", spendingTitle);

    const iconElement = document.createElement("div");
    iconElement.className = "icon text-2xl mb-2";
    iconElement.innerHTML = spendingIcon;

    const title = document.createElement("div");
    title.className = "view-mode text-lg font-semibold editable";
    title.textContent = spendingTitle;
    title.onclick = function () {
        makeEditable(title, spendingBox, "data-title", "editable-input");
    };

    const amountFrequency = document.createElement("div");
    amountFrequency.className = "view-mode amount-frequency text-lg font-medium editable";
    amountFrequency.innerHTML = `<span class="editable-input-amount">$${spendingAmount}</span>/<span class="editable-input-frequency">${spendingFrequency}</span>`;
    amountFrequency.querySelector('.editable-input-amount').onclick = function () {
        makeEditable(this, spendingBox, "data-amount", "editable-input editable-input-amount", true);
    };
    amountFrequency.querySelector('.editable-input-frequency').onclick = function () {
        makeFrequencyEditable(this, spendingBox, "data-frequency");
    };

    const removeButton = document.createElement("button");
    removeButton.textContent = "☓";
    removeButton.className = "remove-spending absolute top-2 right-2";
    removeButton.onclick = function () {
        spendingBox.remove();
        calculateAndShowResult();
        if (!isCustom) {
            restoreDropdownOption(spendingTitle);
        }
    };

    spendingBox.appendChild(iconElement);
    spendingBox.appendChild(title);
    spendingBox.appendChild(amountFrequency);
    spendingBox.appendChild(removeButton);

    spendingBoxContainer.appendChild(spendingBox);

    if (!isCustom) {
        removeDropdownOption(spendingTitle);
    }

    calculateAndShowResult();
    resetSpendingForm();
}

function makeEditable(element, spendingBox, dataAttribute, inputClass, isAmount = false) {
    const originalText = element.textContent;
    const input = document.createElement("input");

    input.value = isAmount ? parseFloat(spendingBox.getAttribute(dataAttribute)) : originalText;
    input.className = inputClass;
    input.style.textAlign = "center";
    input.addEventListener("blur", function () {
        if (input.value.trim() === "") {
            element.textContent = originalText;
        } else {
            element.textContent = isAmount ? `$${input.value.trim()}` : input.value.trim();
            spendingBox.setAttribute(dataAttribute, input.value.trim());
        }
        element.style.display = "";
        input.remove();
        element.classList.remove("editing");
        calculateAndShowResult();
    });

    input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            input.blur();
        }
    });

    element.classList.add("editing");
    element.style.display = "none";
    element.parentNode.insertBefore(input, element);
    input.focus();
}

function makeFrequencyEditable(element, spendingBox, dataAttribute) {
    const originalText = element.textContent;
    const select = document.createElement("select");

    const monthlyOption = document.createElement("option");
    monthlyOption.value = "monthly";
    monthlyOption.text = "Monthly";
    const yearlyOption = document.createElement("option");
    yearlyOption.value = "yearly";
    yearlyOption.text = "Yearly";

    select.appendChild(monthlyOption);
    select.appendChild(yearlyOption);

    select.value = spendingBox.getAttribute(dataAttribute);
    select.className = "editable-select";
    select.style.textAlign = "left";

    select.addEventListener("blur", function () {
        element.textContent = select.options[select.selectedIndex].text;
        spendingBox.setAttribute(dataAttribute, select.value);
        element.style.display = "";
        select.remove();
        element.classList.remove("editing");
        calculateAndShowResult();
    });

    select.addEventListener("change", function () {
        select.blur();
    });

    element.classList.add("editing");
    element.style.display = "none";
    element.parentNode.insertBefore(select, element);
    select.focus();
}

function resetSpendingForm() {
    const spendingTitleSelect = document.getElementById("spendingTitle");
    spendingTitleSelect.value = "";
    const spendingTitleCustom = document.getElementById("spendingTitleCustom");
    spendingTitleCustom.value = "";
    spendingTitleCustom.classList.add("hidden");
    const spendingIcon = document.getElementById("spendingIcon");
    spendingIcon.value = "";
    spendingIcon.classList.add("hidden");
    document.getElementById("spendingAmount").value = "";
    document.getElementById("monthly").checked = false;
    document.getElementById("yearly").checked = true;
}

function removeDropdownOption(option) {
    const spendingTitleSelect = document.getElementById("spendingTitle");
    const optionToRemove = Array.from(spendingTitleSelect.options).find(
        (opt) => opt.value === option,
    );
    if (optionToRemove) {
        spendingTitleSelect.removeChild(optionToRemove);
    }
    maintainCustomTitleOption();
}

function restoreDropdownOption(option) {
    const spendingTitleSelect = document.getElementById("spendingTitle");

    // Recreate the option with icon and default amount
    const newOption = document.createElement("option");
    newOption.value = option;
    newOption.setAttribute("data-icon", getIconForOption(option));
    newOption.setAttribute("data-default-amount", getDefaultAmountForOption(option));
    newOption.innerHTML = `${getIconForOption(option)} ${option}`;

    spendingTitleSelect.insertBefore(
        newOption,
        spendingTitleSelect.querySelector('option[value="custom"]'),
    );
}

function getIconForOption(option) {
    switch (option) {
        case 'Rent/Mortgage': return '🏠';
        case 'Utilities': return '💡';
        case 'Groceries': return '🛒';
        case 'Healthcare': return '💊';
        case 'Travel': return '✈️';
        default: return '';
    }
}

function getDefaultAmountForOption(option) {
    switch (option) {
        case 'Rent/Mortgage': return '2500';
        case 'Utilities': return '2500';
        case 'Groceries': return '1500';
        case 'Healthcare': return '2500';
        case 'Travel': return '1000';
        default: return '';
    }
}

function maintainCustomTitleOption() {
    const spendingTitleSelect = document.getElementById("spendingTitle");
    const customOption = spendingTitleSelect.querySelector(
        'option[value="custom"]',
    );
    if (customOption) {
        spendingTitleSelect.appendChild(customOption);
    }
}
