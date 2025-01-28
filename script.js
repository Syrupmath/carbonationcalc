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

        calculateCarbonationPressure(convertedTemperature, targetCarbonation);

        // Only validate Step 3 if any of its fields are filled
        if (step3HasInput()) {
            validateDispensingInputs();
        } else {
            hideError("lineError"); // Clear error if no Step 3 inputs are provided
            clearResult("dispenseResult");
        }
    });

    function calculateCarbonationPressure(temperature, carbonationLevel) {
        const temperatures = Object.keys(carbonationData).map(Number).sort((a, b) => a - b);

        let lowerTemp = temperatures.find((t) => t <= temperature);
        let upperTemp = temperatures.find((t) => t >= temperature);

        if (lowerTemp === undefined || upperTemp === undefined) {
            displayResult("resultContainer", "Invalid temperature range.", false);
            return;
        }

        const lowerPressureData = carbonationData[lowerTemp];
        const upperPressureData = carbonationData[upperTemp];

        const lowerPressure = interpolateCarbonationLevel(lowerPressureData, carbonationLevel);
        const upperPressure = interpolateCarbonationLevel(upperPressureData, carbonationLevel);

        if (lowerPressure === null || upperPressure === null) {
            displayResult("resultContainer", "Invalid carbonation level.", false);
            return;
        }

        const interpolatedPressure = lowerPressure + ((temperature - lowerTemp) / (upperTemp - lowerTemp)) * (upperPressure - lowerPressure);
        const pressurePSI = interpolatedPressure * 14.5038;

        displayResult(
            "resultContainer",
            `Calculated Carbonation Pressure: ${interpolatedPressure.toFixed(2)} BAR / ${pressurePSI.toFixed(2)} PSI`,
            true
        );
    }

    function interpolateCarbonationLevel(pressureData, targetLevel) {
        const levels = Object.keys(pressureData).map(Number).sort((a, b) => a - b);

        let lowerLevel = levels.find((l) => l <= targetLevel);
        let upperLevel = levels.find((l) => l >= targetLevel);

        if (lowerLevel === undefined || upperLevel === undefined) {
            return null;
        }

        const lowerPressure = pressureData[lowerLevel];
        const upperPressure = pressureData[upperLevel];

        if (lowerLevel === upperLevel) {
            return lowerPressure;
        }

        return lowerPressure + ((targetLevel - lowerLevel) / (upperLevel - lowerLevel)) * (upperPressure - lowerPressure);
    }

    function validateDispensingInputs() {
        const lineType = document.getElementById("lineType").value;
        const lineRun = document.getElementById("lineRun").value;
        const lineRise = document.getElementById("lineRise").value;

        if (!lineType || !lineRun || !lineRise) {
            showError("lineError", "Please fill out all required fields for dispensing pressure calculation.");
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
            "resultContainer",
            `Calculated Dispense Pressure: ${dispensePressure.toFixed(2)} PSI`,
            true
        );
    }

    function step3HasInput() {
        const lineType = document.getElementById("lineType").value;
        const lineRun = document.getElementById("lineRun").value;
        const lineRise = document.getElementById("lineRise").value;

        return lineType || lineRun || lineRise; // Returns true if any field is filled
    }

    function displayResult(containerId, message, success) {
        const container = document.getElementById(containerId);
        container.innerHTML = ""; // Clear previous results
        const resultCard = document.createElement("div");
        resultCard.style.border = success ? "2px solid green" : "2px solid red";
        resultCard.style.padding = "10px";
        resultCard.style.marginTop = "10px";
        resultCard.textContent = message;
        container.appendChild(resultCard);
    }

    function clearResult(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = "";
    }

    function showError(elementId, message) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.style.display = "inline";
    }

    function hideError(elementId) {
        const element = document.getElementById(elementId);
        element.style.display = "none";
    }
});
