document.addEventListener("DOMContentLoaded", async () => {
    // Hide all error messages on page load
    hideError("carbonationError");
    hideError("temperatureError");
    hideError("lineError");

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
        clearResult("carbonationResult");
        calculateCarbonationPressure(convertedTemperature, targetCarbonation);

        // Only validate Step 3 if any of its fields are filled
        if (step3HasInput()) {
            validateDispensingInputs();
        } else {
            hideError("lineError");
        }
    });

    function validateDispensingInputs() {
        const lineType = document.getElementById("lineType").value;
        const lineRun = document.getElementById("lineRun").value;
        const lineRise = document.getElementById("lineRise").value;

        const hasInput = lineType || lineRun || lineRise; // At least one field has input
        const allFilled = lineType && lineRun && lineRise; // All fields are filled

        if (hasInput && !allFilled) {
            showError("lineError", "Please fill out all required fields for dispensing pressure calculation.");
            return;
        }

        hideError("lineError");

        if (allFilled) {
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
        const resultDiv = document.getElementById(resultId);
        resultDiv.className = success ? "alert alert-success mt-3" : "alert alert-danger mt-3";
        resultDiv.textContent = message;
        resultDiv.classList.remove("d-none");
    }

    function clearResult(resultId) {
        const resultDiv = document.getElementById(resultId);
        resultDiv.classList.add("d-none");
        resultDiv.textContent = "";
    }

    function showError(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.classList.remove("d-none");
            element.classList.add("d-block");
        }
    }

    function hideError(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = "";
            element.classList.add("d-none");
            element.classList.remove("d-block");
        }
    }

    function step3HasInput() {
        const lineType = document.getElementById("lineType").value;
        const lineRun = document.getElementById("lineRun").value;
        const lineRise = document.getElementById("lineRise").value;
        return lineType || lineRun || lineRise;
    }
});
