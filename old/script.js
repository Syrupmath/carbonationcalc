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
        clearResult("resultContainer"); // Clear previous results
        
        let isValid = true;

        // Step 1: Validate Carbonation Level
        const carbonationSelection = document.querySelector('input[name="carbonation"]:checked');
        if (!carbonationSelection) {
            showError("carbonationError", "Please select a carbonation level.");
            isValid = false;
        } else {
            hideError("carbonationError");
        }

        const targetCarbonation = carbonationSelection && carbonationSelection.value === "custom" 
            ? parseFloat(document.getElementById("customValue").value) 
            : parseFloat(carbonationSelection?.value);

        if (carbonationSelection?.value === "custom" && isNaN(targetCarbonation)) {
            showError("carbonationError", "Enter a valid carbonation level.");
            isValid = false;
        }

        // Step 2: Validate Temperature
        const temperatureInput = parseFloat(document.getElementById("temperature").value);
        const temperatureUnit = document.getElementById("temperatureUnit").value;
        const convertedTemperature = temperatureUnit === "F"
            ? (temperatureInput - 32) * (5 / 9)
            : temperatureInput;

        if (isNaN(convertedTemperature) || convertedTemperature < 0 || convertedTemperature > 30) {
            showError("temperatureError", "Enter a temperature between 0°C and 30°C.");
            isValid = false;
        } else {
            hideError("temperatureError");
        }

        // Step 3: Validate Dispensing Pressure (if any fields are filled)
        if (step3HasInput()) {
            const lineType = document.getElementById("lineType").value;
            const lineRun = document.getElementById("lineRun").value;
            const lineRise = document.getElementById("lineRise").value;

            if (!lineType || !lineRun || !lineRise) {
                showError("lineError", "Please fill out all required fields for dispensing pressure calculation.");
                isValid = false;
            } else {
                hideError("lineError");
            }
        } else {
            hideError("lineError"); // Hide error if Step 3 is empty
        }

        // If validation fails, stop here
        if (!isValid) return;

        // Proceed with calculations if everything is valid
        calculateCarbonationPressure(convertedTemperature, targetCarbonation);

if (step3HasInput()) {
    const carbonationResult = document.getElementById("carbonationResult");
    const carbonationPressureMatch = carbonationResult?.textContent.match(/([\d.]+) PSI/);
    const carbonationPressurePSI = carbonationPressureMatch ? parseFloat(carbonationPressureMatch[1]) : 0;

    calculateDispensingPressure(
        carbonationPressurePSI,
        parseFloat(document.getElementById("lineRun").value),
        parseFloat(document.getElementById("lineRise").value),
        document.getElementById("lineType").value,
        document.getElementById("lineRunUnit").value,
        document.getElementById("lineRiseUnit").value
    );
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

        displayResult(
            "carbonationResult",
            `Calculated Carbonation Pressure: ${pressurePSI.toFixed(1)} PSI / ${interpolatedPressure.toFixed(1)} BAR`,
            true
        );
    }

    function interpolateCarbonationLevel(pressureData, targetLevel) {
        const levels = Object.keys(pressureData).map(Number).sort((a, b) => a - b);
        let lowerLevel = levels.find((l) => l <= targetLevel);
        let upperLevel = levels.find((l) => l >= targetLevel);

        if (lowerLevel === undefined || upperLevel === undefined) return null;

        const lowerPressure = pressureData[lowerLevel];
        const upperPressure = pressureData[upperLevel];

        return lowerLevel === upperLevel
            ? lowerPressure
            : lowerPressure + ((targetLevel - lowerLevel) / (upperLevel - lowerLevel)) * (upperPressure - lowerPressure);
    }

function calculateDispensingPressure(carbonationPressurePSI, lineRun, lineRise, lineType, lineRunUnit, lineRiseUnit) {
    // Resistance values (PSI per foot) based on line type
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

    // Unit Conversion: Convert meters to feet if needed
    const runInFeet = lineRunUnit === "m" ? lineRun / 0.3048 : lineRun; // 1 ft = 0.3048 m
    const riseInFeet = lineRiseUnit === "m" ? lineRise / 0.3048 : lineRise;

    // Correct Formula: Includes carbonation pressure, resistance, gravity, and flow buffer
    const dispensePressurePSI = carbonationPressurePSI + (resistance * runInFeet) + (riseInFeet / 2) + 1;

    // Convert PSI to BAR
    const dispensePressureBAR = dispensePressurePSI * 0.0689476;

    // Display Result in PSI and BAR
    displayResult(
        "dispenseResult",
        `Calculated Dispense Pressure: ${dispensePressurePSI.toFixed(1)} PSI / ${dispensePressureBAR.toFixed(1)} BAR`,
        true
    );
}

    function step3HasInput() {
        return document.getElementById("lineType").value ||
               document.getElementById("lineRun").value ||
               document.getElementById("lineRise").value;
    }

    function displayResult(resultId, message, success) {
        const container = document.getElementById("resultContainer");
        let resultDiv = document.getElementById(resultId) || document.createElement("div");
        resultDiv.id = resultId;
        resultDiv.style.border = success ? "2px solid green" : "2px solid red";
        resultDiv.style.padding = "10px";
        resultDiv.style.marginTop = "10px";
        resultDiv.textContent = message;
        container.appendChild(resultDiv);
    }

    function clearResult(containerId) {
        document.getElementById(containerId).innerHTML = "";
    }

    function showError(elementId, message) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.style.display = "inline";
    }

    function hideError(elementId) {
        document.getElementById(elementId).style.display = "none";
    }
});
