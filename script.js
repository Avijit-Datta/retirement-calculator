let chart;

function calculateAndShowResult() {
  const currentAge = parseFloat(document.getElementById("currentAge").value);
  const targetAge = parseFloat(document.getElementById("targetAge").value);
  const currentSavings = parseFloat(
    document.getElementById("retirementSavings").value
  );
  const contribution = parseFloat(
    document.getElementById("contribution").value
  );
  const frequency = parseFloat(document.getElementById("frequency").value);
  const inflationRate = parseFloat(document.getElementById("inflation").value);

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

    remainingSavings -= yearlySpending;
    if (remainingSavings < 0) remainingSavings = 0;

    leftSavingsData.push(remainingSavings.toFixed(2));
    if (i !== targetAge) {
      ageLabels.push(i);
    }
  }

  const result = `If you retire at the age of ${targetAge} with your current retirement savings of $${currentSavings.toFixed(
    2
  )}, while contributing $${contribution.toFixed(
    2
  )} every period with an inflation rate of ${(inflationRate * 100).toFixed(
    2
  )}%, you will have an estimated retirement savings of $${futureValue.toFixed(
    2
  )}. After retirement, considering your spending, your savings will last until approximately age ${
    ageLabels[ageLabels.length - 1]
  }.`;

  document.getElementById("result").textContent = result;

  if (chart) {
    chart.destroy();
  }

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
          data: leftSavingsData,
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
                let spending = (
                  leftSavingsData[index - 1] - leftSavingsData[index]
                ).toFixed(2);
                spending = spending < 0 ? 0 : spending;
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
    'input[name="spendingFrequency"]:checked'
  ).value;

  if (!spendingTitle || isNaN(spendingAmount) || spendingAmount <= 0) {
    alert("Please provide valid spending details.");
    return;
  }

  const spendingBoxContainer = document.getElementById("spendingBoxContainer");

  // Ensure only one box is in edit mode at a time
  const existingEditBox = document.querySelector(".spending-box.editing");
  if (existingEditBox) {
    existingEditBox.classList.add("editing-warning");
    return;
  }

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
  title.className = "view-mode text-lg font-semibold";
  title.textContent = spendingTitle;

  const amount = document.createElement("div");
  amount.className = "view-mode text-lg font-medium";
  amount.textContent = `$${spendingAmount} / ${spendingFrequency}`;

  const editButton = document.createElement("button");
  editButton.textContent = "✎";
  editButton.className = "edit-spending text-green-500 absolute top-2 right-10";
  editButton.onclick = function () {
    toggleEditMode(spendingBox, true);
  };

  const removeButton = document.createElement("button");
  removeButton.textContent = "☓";
  removeButton.className =
    "remove-spending text-red-500 absolute top-2 right-2";
  removeButton.onclick = function () {
    spendingBox.remove();
    calculateAndShowResult();
    // Only restore dropdown option for prelisted items
    if (!isCustom) {
      restoreDropdownOption(spendingTitle); // Ensure item is added back to dropdown on removal
    }
  };

  const editTitleInput = document.createElement("input");
  editTitleInput.type = "text";
  editTitleInput.value = spendingTitle;
  editTitleInput.className =
    "edit-mode w-full p-2 border rounded-lg mb-2 hidden";

  const editAmountInput = document.createElement("input");
  editAmountInput.type = "number";
  editAmountInput.value = spendingAmount;
  editAmountInput.className =
    "edit-mode w-full p-2 border rounded-lg mb-2 hidden";

  const editIconInput = document.createElement("input");
  editIconInput.type = "file";
  editIconInput.accept = "image/*";
  editIconInput.className =
    "edit-mode w-full p-2 border rounded-lg mb-2 hidden";

  const frequencyContainer = document.createElement("div");
  frequencyContainer.className =
    "flex items-center space-x-4 edit-mode hidden mb-2";

  const editFrequencyMonthly = document.createElement("input");
  editFrequencyMonthly.type = "radio";
  editFrequencyMonthly.name = `editFrequency-${spendingTitle}`;
  editFrequencyMonthly.value = "monthly";
  editFrequencyMonthly.className =
    "h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500";
  editFrequencyMonthly.checked = spendingFrequency === "monthly";

  const editFrequencyYearly = document.createElement("input");
  editFrequencyYearly.type = "radio";
  editFrequencyYearly.name = `editFrequency-${spendingTitle}`;
  editFrequencyYearly.value = "yearly";
  editFrequencyYearly.className =
    "h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500";
  editFrequencyYearly.checked = spendingFrequency === "yearly";

  const frequencyLabelMonthly = document.createElement("label");
  frequencyLabelMonthly.className = "flex items-center";
  frequencyLabelMonthly.appendChild(editFrequencyMonthly);
  frequencyLabelMonthly.appendChild(document.createTextNode(" Monthly"));

  const frequencyLabelYearly = document.createElement("label");
  frequencyLabelYearly.className = "flex items-center";
  frequencyLabelYearly.appendChild(editFrequencyYearly);
  frequencyLabelYearly.appendChild(document.createTextNode(" Yearly"));

  frequencyContainer.appendChild(frequencyLabelMonthly);
  frequencyContainer.appendChild(frequencyLabelYearly);

  const buttonContainer = document.createElement("div");
  buttonContainer.className =
    "button-container edit-mode flex justify-between w-full mt-2 hidden";

  const saveButton = document.createElement("button");
  saveButton.textContent = "✓";
  saveButton.className = "save-button text-green-500";
  saveButton.onclick = function () {
    saveEdits(
      spendingBox,
      editTitleInput,
      editAmountInput,
      editIconInput,
      editFrequencyMonthly,
      editFrequencyYearly,
      title,
      amount,
      isCustom
    );
  };

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "☓";
  cancelButton.className = "cancel-button text-red-500";
  cancelButton.onclick = function () {
    toggleEditMode(spendingBox, false);
    spendingBox.classList.remove("editing-warning"); // Remove the red border warning
  };

  buttonContainer.appendChild(saveButton);
  buttonContainer.appendChild(cancelButton);

  spendingBox.appendChild(iconElement);
  spendingBox.appendChild(title);
  spendingBox.appendChild(amount);
  spendingBox.appendChild(editTitleInput);
  spendingBox.appendChild(editAmountInput);
  spendingBox.appendChild(editIconInput);
  spendingBox.appendChild(frequencyContainer);
  spendingBox.appendChild(buttonContainer);
  spendingBox.appendChild(editButton);
  spendingBox.appendChild(removeButton);

  spendingBoxContainer.appendChild(spendingBox);

  if (!isCustom) {
    removeDropdownOption(spendingTitle);
  }

  calculateAndShowResult();

  resetSpendingForm();
}

function toggleEditMode(box, isEditing) {
  const title = box.querySelector(".view-mode");
  const amount = box.querySelector(".view-mode:nth-child(2)");
  const editTitleInput = box.querySelector('.edit-mode[type="text"]');
  const editAmountInput = box.querySelector('.edit-mode[type="number"]');
  const editIconInput = box.querySelector('.edit-mode[type="file"]');
  const frequencyContainer = box.querySelector(
    ".edit-mode.flex.items-center.space-x-4"
  );
  const buttonContainer = box.querySelector(".button-container.edit-mode");

  if (isEditing) {
    // Check if another box is already in edit mode
    const existingEditBox = document.querySelector(".spending-box.editing");
    if (existingEditBox && existingEditBox !== box) {
      existingEditBox.classList.add("editing-warning");
      return;
    }

    box.classList.add("editing");
    title.classList.add("hidden");
    amount.classList.add("hidden");
    editTitleInput.classList.remove("hidden");
    editAmountInput.classList.remove("hidden");

    // Show or hide the icon input based on whether the item is prelisted or custom
    const prelistedItems = [
      "Rent/Mortgage",
      "Utilities",
      "Groceries",
      "Healthcare",
      "Travel",
    ];
    if (!prelistedItems.includes(box.getAttribute("data-title"))) {
      editIconInput.classList.remove("hidden");
    }

    frequencyContainer.classList.remove("hidden");
    buttonContainer.classList.remove("hidden");
  } else {
    box.classList.remove("editing");
    title.classList.remove("hidden");
    amount.classList.remove("hidden");
    editTitleInput.classList.add("hidden");
    editAmountInput.classList.add("hidden");
    editIconInput.classList.add("hidden");
    frequencyContainer.classList.add("hidden");
    buttonContainer.classList.add("hidden");
  }
}

function saveEdits(
  box,
  titleInput,
  amountInput,
  editIconInput,
  editFrequencyMonthly,
  editFrequencyYearly,
  title,
  amount,
  isCustom
) {
  const newTitle = titleInput.value;
  const newAmount = amountInput.value;
  const newFrequency = editFrequencyMonthly.checked ? "monthly" : "yearly";
  let iconHTML = box.querySelector(".icon").innerHTML;

  if (editIconInput && editIconInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = function (e) {
      iconHTML = `<img src="${e.target.result}" alt="icon" class="w-8 h-8 dropdown-icon">`;
      finalizeEdit();
    };
    reader.readAsDataURL(editIconInput.files[0]);
  } else {
    finalizeEdit();
  }

  function finalizeEdit() {
    if (!newTitle || isNaN(newAmount) || newAmount <= 0) {
      alert("Please provide valid spending details.");
      return;
    }

    title.textContent = newTitle;
    amount.textContent = `$${newAmount} / ${newFrequency}`;

    box.setAttribute("data-amount", newAmount);
    box.setAttribute("data-frequency", newFrequency);
    box.querySelector(".icon").innerHTML = iconHTML;

    toggleEditMode(box, false);
    box.classList.remove("editing-warning"); // Remove the red border warning
    calculateAndShowResult();
  }
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
    (opt) => opt.value === option
  );
  if (optionToRemove) {
    spendingTitleSelect.removeChild(optionToRemove);
  }
  maintainCustomTitleOption();
}

function restoreDropdownOption(option) {
  const spendingTitleSelect = document.getElementById("spendingTitle");
  const icon = spendingTitleSelect
    .querySelector(`option[value="${option}"]`)
    ?.getAttribute("data-icon");
  const newOption = document.createElement("option");
  newOption.value = option;
  newOption.textContent = option;

  if (icon) {
    newOption.setAttribute("data-icon", icon);
    newOption.style.backgroundImage = `url('${icon}')`;
    newOption.textContent = `${icon} ${option}`;
  }

  spendingTitleSelect.insertBefore(
    newOption,
    spendingTitleSelect.querySelector('option[value="custom"]')
  );
}

function maintainCustomTitleOption() {
  const spendingTitleSelect = document.getElementById("spendingTitle");
  const customOption = spendingTitleSelect.querySelector(
    'option[value="custom"]'
  );
  if (customOption) {
    spendingTitleSelect.appendChild(customOption);
  }
}
