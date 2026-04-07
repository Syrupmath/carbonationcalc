document.addEventListener("DOMContentLoaded", async () => {
    let carbonationData;
    let lastCarbonationPressurePSI = null;

    // Load carbonation data from JSON
    async function loadCarbonationData() {
        try {
            const response = await fetch("data.json");
            carbonationData = await response.json();
            console.log("Carbonation data loaded successfully:", carbonationData);
        } catch (error) {
            console.error("Error loading carbonation data:", error);
        }
    }

    await loadCarbonationData();

    // Automatically select "Custom" radio on custom input focus
    document.getElementById("customValue").addEventListener("focus", () => {
        document.getElementById("customRadio").checked = true;
    });

    // When a valid number is entered in override, clear Steps 1 & 2
    document.getElementById("overridePressure").addEventListener("input", () => {
        const overrideRaw = parseFloat(document.getElementById("overridePressure").value);
        if (!isNaN(overrideRaw)) {
            document.querySelectorAll('input[name="carbonation"]').forEach(r => r.checked = false);
            document.getElementById("customValue").value = "";
            hideError("carbonationError");
            document.getElementById("temperature").value = "";
            hideError("temperatureError");
            clearResult("resultContainer");
        }
    });

    // When Step 1 or Step 2 gets input, clear the override field and any Step 3 error
    document.querySelectorAll('input[name="carbonation"]').forEach(el => {
        el.addEventListener("change", () => {
            const overridePressure = document.getElementById("overridePressure");
            if (overridePressure.value.trim() !== "") {
                overridePressure.value = "";
                hideError("lineError");
                clearResult("resultContainer");
            }
        });
    });
    ["customValue", "temperature"].forEach(id => {
        document.getElementById(id).addEventListener("input", () => {
            const overridePressure = document.getElementById("overridePressure");
            if (overridePressure.value.trim() !== "") {
                overridePressure.value = "";
                hideError("lineError");
                clearResult("resultContainer");
            }
        });
    });

    // Calculate button handler
    document.getElementById("calculateButton").addEventListener("click", (event) => {
        event.preventDefault();

        let isValid = validateForm();

        if (!isValid && !step3HasInput()) {
            clearResult("resultContainer");
        }

        if (isValid) {
            performCalculations();
        }
    });

    // Form validation function
    function validateForm() {
        let valid = true;

        const overrideRaw = parseFloat(document.getElementById("overridePressure").value);
        const overrideUnit = document.getElementById("overridePressureUnit").value;
        const usingOverride = !isNaN(overrideRaw);

        // Validate override pressure range
        if (usingOverride) {
            const overrideMax = overrideUnit === "BAR" ? 5.2 : 75;
            if (overrideRaw < 0 || overrideRaw > overrideMax) {
                document.getElementById("overrideError").textContent =
                    `Please enter a value between 0 and ${overrideUnit === "BAR" ? "5.2 BAR" : "75 PSI"}.`;
                showError("overrideError");
                valid = false;
            } else {
                hideError("overrideError");
            }
        } else {
            hideError("overrideError");
        }

        // Step 1: Validate Carbonation Level (skip if override is entered)
        const carbonationSelection = document.querySelector('input[name="carbonation"]:checked');
        if (!usingOverride) {
            if (!carbonationSelection) {
                document.getElementById("carbonationError").textContent = "Please select a carbonation level.";
                showError("carbonationError");
                valid = false;
            } else {
                hideError("carbonationError");

                const targetCarbonation = carbonationSelection.value === "custom"
                    ? parseFloat(document.getElementById("customValue").value)
                    : parseFloat(carbonationSelection.value);

                if (carbonationSelection.value === "custom") {
                    if (isNaN(targetCarbonation) || targetCarbonation < 3.5 || targetCarbonation > 16) {
                        document.getElementById("carbonationError").textContent = "Please enter a value between 3.5 and 16 g/L.";
                        showError("carbonationError");
                        valid = false;
                    }
                }
            }
        } else {
            hideError("carbonationError");
        }

        // Step 2: Validate Temperature (skip if override is entered)
        if (!usingOverride) {
            const temperatureInput = parseFloat(document.getElementById("temperature").value);
            const temperatureUnit = document.getElementById("temperatureUnit").value;
            const convertedTemperature = temperatureUnit === "F"
                ? (temperatureInput - 32) * (5 / 9)
                : temperatureInput;

            if (isNaN(convertedTemperature) || convertedTemperature < 0 || convertedTemperature > 30) {
                showError("temperatureError");
                valid = false;
            } else {
                hideError("temperatureError");
            }
        } else {
            hideError("temperatureError");
        }

        // Step 3: Validate Dispensing Pressure (if any Step 3 fields are filled)
        if (step3HasInput()) {
            const lineType = document.getElementById("lineType").value;
            const lineRun = parseFloat(document.getElementById("lineRun").value);
            const lineRise = parseFloat(document.getElementById("lineRise").value);

            if (!lineType || isNaN(lineRun) || isNaN(lineRise)) {
                document.getElementById("lineError").textContent = "Please complete all fields for dispensing pressure.";
                showError("lineError");
                valid = false;
            } else if (lineRise > lineRun) {
                document.getElementById("lineError").textContent = "Total run must be longer than rise/drop.";
                showError("lineError");
                valid = false;
            } else {
                hideError("lineError");
            }
        }

        return valid;
    }

    // Perform the carbonation and dispensing pressure calculations
    function performCalculations() {
        const overrideRaw = parseFloat(document.getElementById("overridePressure").value);
        const overrideUnit = document.getElementById("overridePressureUnit").value;
        const overridePSI = !isNaN(overrideRaw)
            ? (overrideUnit === "BAR" ? overrideRaw * 14.5038 : overrideRaw)
            : null;
        const usingOverride = overridePSI !== null;

        if (!usingOverride) {
            const carbonationSelection = document.querySelector('input[name="carbonation"]:checked');
            const targetCarbonation = carbonationSelection.value === "custom"
                ? parseFloat(document.getElementById("customValue").value)
                : parseFloat(carbonationSelection.value);

            const temperatureInput = parseFloat(document.getElementById("temperature").value);
            const temperatureUnit = document.getElementById("temperatureUnit").value;
            const convertedTemperature = temperatureUnit === "F"
                ? (temperatureInput - 32) * (5 / 9)
                : temperatureInput;

            calculateCarbonationPressure(convertedTemperature, targetCarbonation);
        } else {
            const existingCarbonation = document.querySelector(".carbonation-result");
            if (existingCarbonation) existingCarbonation.remove();
        }

        if (!step3HasInput()) {
            const existingDispense = document.querySelector(".dispense-result");
            if (existingDispense) existingDispense.remove();
            return;
        }

        const lineType = document.getElementById("lineType").value;
        const lineRun = parseFloat(document.getElementById("lineRun").value);
        const lineRise = parseFloat(document.getElementById("lineRise").value);

        calculateDispensingPressure(lineType, lineRun, lineRise, overridePSI);
    }

    // Calculate carbonation pressure based on temperature and CO2 level
    function calculateCarbonationPressure(temperature, carbonationLevel) {
        if (carbonationLevel < 3.5) {
            displayResult("Invalid carbonation level.", false);
            return;
        }

        const temperatures = Object.keys(carbonationData).map(Number).sort((a, b) => a - b);
        let lowerTemp = temperatures.findLast((t) => t <= temperature);
        let upperTemp = temperatures.find((t) => t >= temperature);

        if (lowerTemp === undefined || upperTemp === undefined) {
            displayResult("Invalid temperature range.", false);
            return;
        }

        const lowerPressureData = carbonationData[String(lowerTemp)];
        const upperPressureData = carbonationData[String(upperTemp)];

        const lowerPressure = interpolateCarbonationLevel(lowerPressureData, carbonationLevel);
        const upperPressure = interpolateCarbonationLevel(upperPressureData, carbonationLevel);

        if (lowerPressure === null || upperPressure === null) {
            displayResult("Invalid carbonation level.", false);
            return;
        }

        const interpolatedPressure = lowerTemp === upperTemp
            ? lowerPressure
            : lowerPressure + ((temperature - lowerTemp) / (upperTemp - lowerTemp)) * (upperPressure - lowerPressure);
        const pressurePSI = interpolatedPressure * 14.5038;
        lastCarbonationPressurePSI = pressurePSI;

        displayResult(
            `Calculated Carbonation Pressure: ${pressurePSI.toFixed(1)} PSI / ${interpolatedPressure.toFixed(1)} BAR`,
            true
        );
    }

    // Interpolate carbonation level based on given pressure data
    function interpolateCarbonationLevel(pressureData, targetLevel) {
        const levels = Object.keys(pressureData).map(Number).sort((a, b) => a - b);
        let lowerLevel = levels.findLast((l) => l <= targetLevel);
        let upperLevel = levels.find((l) => l >= targetLevel);

        if (lowerLevel === undefined || upperLevel === undefined) return null;

        const lowerPressure = pressureData[String(lowerLevel)];
        const upperPressure = pressureData[String(upperLevel)];

        return lowerLevel === upperLevel
            ? lowerPressure
            : lowerPressure + ((targetLevel - lowerLevel) / (upperLevel - lowerLevel)) * (upperPressure - lowerPressure);
    }

    // Calculate dispensing pressure based on line type, run, rise, and optional override
    function calculateDispensingPressure(lineType, lineRun, lineRise, overridePSI) {
        let carbonationPressurePSI;

        if (overridePSI !== null && overridePSI !== undefined) {
            carbonationPressurePSI = overridePSI;
        } else if (lastCarbonationPressurePSI !== null) {
            carbonationPressurePSI = lastCarbonationPressurePSI;
        } else {
            displayResult("Dispensing pressure cannot be calculated without carbonation pressure.", false);
            return;
        }

        const lineResistances = {
            "3/16 Vinyl": 3,
            "1/4 Vinyl": 0.85,
            "5/16 Vinyl": 0.4,
            "3/8 Vinyl": 0.13,
            "1/2 Vinyl": 0.025,
            "3/16 Polyethylene": 2.2,
            "1/4 Polyethylene": 0.5,
            "3/8 Stainless Steel": 0.2,
            "5/16 Stainless Steel": 0.5,
            "1/4 Stainless Steel": 2
        };

        const resistance = lineResistances[lineType] || 0;

        const lineRunUnit = document.getElementById("lineRunUnit").value;
        const lineRiseUnit = document.getElementById("lineRiseUnit").value;
        const runInFeet = lineRunUnit === "m" ? lineRun / 0.3048 : lineRun;
        const riseInFeet = lineRiseUnit === "m" ? lineRise / 0.3048 : lineRise;

        const dispensePressurePSI = carbonationPressurePSI + (resistance * runInFeet) + (riseInFeet / 2) + 1;
        const dispensePressureBAR = dispensePressurePSI * 0.0689476;

        displayResult(
            `Calculated Dispense Pressure: ${dispensePressurePSI.toFixed(1)} PSI / ${dispensePressureBAR.toFixed(1)} BAR`,
            true
        );
    }

    // Check if Step 3 has any input
    function step3HasInput() {
        return !!(document.getElementById("overridePressure").value ||
                  document.getElementById("lineType").value ||
                  document.getElementById("lineRun").value ||
                  document.getElementById("lineRise").value);
    }

    // Display result messages
    function displayResult(message, success) {
        const container = document.getElementById("resultContainer");

        const isCarbonation = message.includes("Calculated Carbonation Pressure");
        const isDispense = message.includes("Calculated Dispense Pressure");

        if (isCarbonation) {
            const existingCarbonation = container.querySelector(".carbonation-result");
            if (existingCarbonation) existingCarbonation.remove();
        }
        if (isDispense) {
            const existingDispense = container.querySelector(".dispense-result");
            if (existingDispense) existingDispense.remove();
        }

        const resultDiv = document.createElement("div");
        resultDiv.className = `result-card alert ${success ? "alert-success" : "alert-danger"}`;
        resultDiv.classList.add(isCarbonation ? "carbonation-result" : "dispense-result");

        const [header, value] = message.split(":");

        const resultTitle = document.createElement("h4");
        resultTitle.textContent = `${header}:`;
        resultTitle.className = "result-title";

        const resultValue = document.createElement("p");
        resultValue.textContent = value.trim();
        resultValue.className = "result-value";

        resultDiv.appendChild(resultTitle);
        resultDiv.appendChild(resultValue);

        if (isCarbonation) {
            container.prepend(resultDiv);
        } else {
            const existingCarbonation = container.querySelector(".carbonation-result");
            if (existingCarbonation) {
                existingCarbonation.after(resultDiv);
            } else {
                container.appendChild(resultDiv);
            }
        }
    }

    // Clear the result display
    function clearResult(containerId) {
        document.getElementById(containerId).innerHTML = "";
    }

    function showError(elementId) {
        document.getElementById(elementId).classList.remove("d-none");
    }

    function hideError(elementId) {
        document.getElementById(elementId).classList.add("d-none");
    }
});
