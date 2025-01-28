document.addEventListener("DOMContentLoaded", async () => {
    let carbonationData;

    // Load carbonation data
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

    // Set default unit for Line Run and Line Rise to Meters
    document.getElementById("lineRunUnit").value = "m";
    document.getElementById("lineRiseUnit").value = "m";

    // Handle calculations on button click
    document.getElementById("calculateButton").addEventListener("click", () => {
        const temperatureInput = parseFloat(document.getElementById("temperature").value);
        const temperatureUnit = document.getElementById("temperatureUnit").value;
        const carbonationSelection = document.querySelector('input[name="carbonation"]:checked');

        if (!carbonationSelection) {
            showError("carbonationError", "Please select a carbonation level.");
            return;
        }

        const targetCarbonation = carbonationSelection.value === "custom" 
            ? parseFloat(document.getElementById("customValue").value) 
            : parseFloat(carbonationSelection.value);

        if (isNaN(targetCarbonation)) {
            showError("carbonationError", "Enter a valid carbonation level.");
            return;
        }

        hideError("carbonationError");

        const convertedTemperature = temperatureUnit === "F"
            ? (temperatureInput - 32) * (5 / 9)
            : temperatureInput;

        if (isNaN(convertedTemperature) || convertedTemperature < 0 || convertedTemperature > 30) {
            showError("temperatureError", "Enter a temperature between 0°C and 30°C.");
            return;
        }

        hideError("temperatureError");

        // Clear result container and calculate carbonation pressure
        clearResult("resultContainer");
        calculateCarbonationPressure(convertedTemperature, targetCarbonation);

        // Only validate Step 3 if any of its fields are filled
        if (step3HasInput()) {
            validateDispensingInputs();
        } else {
            hideError("lineError");
        }
    });

    function calculateCarbonationPressure(temperature, carbonationLevel) {
        const temperatures = Object.keys(carbonationData).map(Number).sort((a, b) => a - b);

        let lowerTemp = temperatures.find((t) => t <= temperature);
        let upperTemp = temperatures.find((t) => t >= temperature);

        if (lowerTemp === undefined || upperTemp === undefined) {
            displayResult("carbonationResult", "Invalid temperature range.", false);
            return;
        }

        const lowerPressureData = carbonationData[lowerTemp];
        const upperPressureData = carbonationData[upperTemp];

        const lowerPressure = interpolateCarbonationLevel(lowerPressureData, carbonationLevel);
        const upperPressure = interpolateCarbonationLevel(upperPressureData, carbonationLevel);

        if (lowerPressure === null || upperPressure === null) {
            displayResult("carbonationResult", "Invalid carbonation level.", false);
            return;
        }

        const interpolatedPressure = lowerPressure + ((temperature - lowerTemp) / (upperTemp - lowerTemp)) * (upperPressure - lowerPressure);
        const pressurePSI = interpolatedPressure * 14.5038;

        displayResult("carbonationResult", `Carbonation Pressure: ${interpolatedPressure.toFixed(2)} BAR / ${pressurePSI.toFixed(2)} PSI`, true);
    }

    function validateDispensingInputs() {
        const lineType = document.getElementById("lineType").value;
        const lineRun = document.getElementById("lineRun").value;
        const lineRise = document.getElementById("lineRise").value;

        if (!lineType || !lineRun || !lineRise) {
            showError("lineError", "Please fill out all required fields.");
        } else {
            hideError("lineError");
            calculateDispensingPressure(lineType, parseFloat(lineRun), parseFloat(lineRise));
        }
    }

    function calculateDispensingPressure(lineType, lineRun, lineRise) {
        const lineResistances = {
            "3/16 Vinyl": 3,
            "1/4 Vinyl": 0.85,
            "5/16 Vinyl": 0.4,
        };

        const resistance = lineResistances[lineType] || 0;
        const dispensePressure = resistance * lineRun + lineRise / 2 + 1;

        displayResult("dispenseResult", `Dispense Pressure: ${dispensePressure.toFixed(2)} PSI`, true);
    }

    function displayResult(resultId, message, success) {
        const container = document.getElementById("resultContainer");
        let resultDiv = document.getElementById(resultId);

        if (!resultDiv) {
            resultDiv = document.createElement("div");
            resultDiv.id = resultId;
            container.appendChild(resultDiv);
        }

        resultDiv.className = success ? "alert alert-success mt-3" : "alert alert-danger mt-3";
        resultDiv.textContent = message;
    }

    function clearResult(containerId) {
        document.getElementById(containerId).innerHTML = "";
    }

    function showError(elementId, message) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.classList.remove("d-none");
    }

    function hideError(elementId) {
        const element = document.getElementById(elementId);
        element.classList.add("d-none");
    }
});
