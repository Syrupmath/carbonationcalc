document.addEventListener("DOMContentLoaded", async () => {
    let carbonationData;

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

    // Automatically select "Custom" radio when focusing custom input
    document.getElementById("customValue").addEventListener("focus", () => {
        document.getElementById("customRadio").checked = true;
    });

    // Calculate button handler
    document.getElementById("calculateButton").addEventListener("click", () => {
        clearResult("resultContainer");

        let isValid = true;

        // Step 1: Validate Carbonation Level
        const carbonationSelection = document.querySelector('input[name="carbonation"]:checked');
        if (!carbonationSelection) {
            showError("carbonationError");
            isValid = false;
        } else {
            hideError("carbonationError");
        }

        const targetCarbonation = carbonationSelection && carbonationSelection.value === "custom"
            ? parseFloat(document.getElementById("customValue").value)
            : parseFloat(carbonationSelection?.value);

        if (carbonationSelection?.value === "custom" && isNaN(targetCarbonation)) {
            showError("carbonationError");
            isValid = false;
        }

        // Step 2: Validate Temperature
        const temperatureInput = parseFloat(document.getElementById("temperature").value);
        const temperatureUnit = document.getElementById("temperatureUnit").value;
        const convertedTemperature = temperatureUnit === "F"
            ? (temperatureInput - 32) * (5 / 9)
            : temperatureInput;

        if (isNaN(convertedTemperature) || convertedTemperature < 0 || convertedTemperature > 30) {
            showError("temperatureError");
            isValid = false;
        } else {
            hideError("temperatureError");
        }

        // Step 3: Validate Dispensing Pressure (if applicable)
        if (step3HasInput()) {
            const lineType = document.getElementById("lineType").value;
            const lineRun = document.getElementById("lineRun").value;
            const lineRise = document.getElementById("lineRise").value;

            if (!lineType || !lineRun || !lineRise) {
                showError("lineError");
                isValid = false;
            } else {
                hideError("lineError");
            }
        } else {
            hideError("lineError");
        }

        if (!isValid) return; // Stop if any validation fails

        // Perform calculations if valid
        calculateCarbonationPressure(convertedTemperature, targetCarbonation);

        if (step3HasInput()) {
            calculateDispensingPressure(
                document.getElementById("lineType").value,
                parseFloat(document.getElementById("lineRun").value),
                parseFloat(document.getElementById("lineRise").value)
            );
        }
    });

    // Calculate carbonation pressure
    function calculateCarbonationPressure(temperature, carbonationLevel) {
        const temperatures = Object.keys(carbonationData).map(Number).sort((a, b) => a - b);
        let lowerTemp = temperatures.find((t) => t <= temperature);
        let upperTemp = temperatures.find((t) => t >= temperature);

        if (lowerTemp === undefined || upperTemp === undefined) {
            displayResult("Invalid temperature range.", false);
            return;
        }

        const lowerPressureData = carbonationData[lowerTemp];
        const upperPressureData = carbonationData[upperTemp];

        const lowerPressure = interpolateCarbonationLevel(lowerPressureData, carbonationLevel);
        const upperPressure = interpolateCarbonationLevel(upperPressureData, carbonationLevel);

        if (lowerPressure === null || upperPressure === null) {
            displayResult("Invalid carbonation level.", false);
            return;
        }

        const interpolatedPressure = lowerPressure + ((temperature - lowerTemp) / (upperTemp - lowerTemp)) * (upperPressure - lowerPressure);
        const pressurePSI = interpolatedPressure * 14.5038;

        displayResult(
            `Calculated Carbonation Pressure: ${interpolatedPressure.toFixed(2)} BAR / ${pressurePSI.toFixed(2)} PSI`,
            true
        );
    }

    // Calculate dispensing pressure
    function calculateDispensingPressure(lineType, lineRun, lineRise) {
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
        const dispensePressure = resistance * lineRun + lineRise / 2 + 1;

        displayResult(
            `Calculated Dispense Pressure: ${dispensePressure.toFixed(2)} PSI`,
            true
        );
    }

    // Check if Step 3 has input
    function step3HasInput() {
        return document.getElementById("lineType").value ||
               document.getElementById("lineRun").value ||
               document.getElementById("lineRise").value;
    }

    // Show results using Bootstrap alert classes
    function displayResult(message, success) {
        const container = document.getElementById("resultContainer");
        const resultDiv = document.createElement("div");
        resultDiv.className = `alert ${success ? "alert-success" : "alert-danger"}`;
        resultDiv.textContent = message;
        container.appendChild(resultDiv);
    }

    // Clear previous results
    function clearResult(containerId) {
        document.getElementById(containerId).innerHTML = "";
    }

    // Error handling functions using Bootstrap classes
    function showError(elementId) {
        document.getElementById(elementId).classList.remove("d-none");
    }

    function hideError(elementId) {
        document.getElementById(elementId).classList.add("d-none");
    }
});
