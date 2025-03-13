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

    // Automatically select "Custom" radio on custom input focus
    document.getElementById("customValue").addEventListener("focus", () => {
        document.getElementById("customRadio").checked = true;
    });

    // Calculate button handler
    document.getElementById("calculateButton").addEventListener("click", (event) => {
    event.preventDefault(); // Prevent page refresh

    let isValid = validateForm(); // Run validation first

    // Clear results ONLY if Steps 1 or 2 fail (not Step 3 alone)
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

        // Step 1: Validate Carbonation Level
        const carbonationSelection = document.querySelector('input[name="carbonation"]:checked');
        if (!carbonationSelection) {
            showError("carbonationError");
            valid = false;
        } else {
            hideError("carbonationError");
        }

        const targetCarbonation = carbonationSelection && carbonationSelection.value === "custom"
            ? parseFloat(document.getElementById("customValue").value)
            : parseFloat(carbonationSelection?.value);

        if (carbonationSelection?.value === "custom" && isNaN(targetCarbonation)) {
            showError("carbonationError");
            valid = false;
        }

        // Step 2: Validate Temperature
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

        // Step 3: Validate Dispensing Pressure (if any fields are filled)
        if (step3HasInput()) {
        const lineType = document.getElementById("lineType").value;
        const lineRun = parseFloat(document.getElementById("lineRun").value);
        const lineRise = parseFloat(document.getElementById("lineRise").value);
        
        if (!lineType || isNaN(lineRun) || isNaN(lineRise)) {
            showError("lineError");
            document.getElementById("lineError").textContent = "Please complete all fields for dispensing pressure.";
            valid = false;
        } else if (lineRise > lineRun) {
            showError("lineError");
            document.getElementById("lineError").textContent = "Total run must be longer than rise/drop.";
            valid = false;
        } else {
            hideError("lineError");
        }
}
        return valid;
    }

    // Perform the carbonation and dispensing pressure calculations
    function performCalculations() {
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

        if (step3HasInput()) {
            const lineType = document.getElementById("lineType").value;
            const lineRun = parseFloat(document.getElementById("lineRun").value);
            const lineRise = parseFloat(document.getElementById("lineRise").value);

            calculateDispensingPressure(lineType, lineRun, lineRise);
        }
    }

    // Calculate carbonation pressure based on temperature and CO2 level
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
            `Calculated Carbonation Pressure: ${pressurePSI.toFixed(1)} PSI / ${interpolatedPressure.toFixed(1)} BAR`,
            true
        );
    }

    // Interpolate carbonation level based on given pressure data
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

    // Calculate dispensing pressure based on line type, run, and rise
function calculateDispensingPressure(lineType, lineRun, lineRise) {
    const carbonationResult = document.getElementById("resultContainer").textContent.match(/([\d.]+) PSI/);

    if (!carbonationResult) {
        displayResult("Dispensing pressure cannot be calculated without carbonation pressure.", false);
        return;
    }

    const carbonationPressurePSI = parseFloat(carbonationResult[1]);

    // Line resistances (in PSI per foot)
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

    // Convert meters to feet if necessary
    const lineRunUnit = document.getElementById("lineRunUnit").value;
    const lineRiseUnit = document.getElementById("lineRiseUnit").value;
    const runInFeet = lineRunUnit === "m" ? lineRun / 0.3048 : lineRun;
    const riseInFeet = lineRiseUnit === "m" ? lineRise / 0.3048 : lineRise;

    // ✅ Remove previous dispense pressure result before recalculating
    removePreviousResult("Calculated Dispense Pressure");

    // ✅ Calculate dispensing pressure
    const dispensePressurePSI = carbonationPressurePSI + (resistance * runInFeet) + (riseInFeet / 2) + 1;
    const dispensePressureBAR = dispensePressurePSI * 0.0689476;

    // ✅ Display new result (ensuring old one is gone)
    displayResult(
        `Calculated Dispense Pressure: ${dispensePressurePSI.toFixed(1)} PSI / ${dispensePressureBAR.toFixed(1)} BAR`,
        true
    );
}

    // Check if Step 3 has input for dispensing pressure calculation
    function step3HasInput() {
        return document.getElementById("lineType").value ||
               document.getElementById("lineRun").value ||
               document.getElementById("lineRise").value;
    }

    // Display result messages
function displayResult(message, success) {
    const container = document.getElementById("resultContainer");

    // ✅ Remove previous result if it exists
    const existingMessages = Array.from(container.children);
    existingMessages.forEach(msg => {
        if (msg.textContent.includes(message.split(":")[0])) { // Remove old result with the same header
            msg.remove();
        }
    });

    // ✅ Create a new result display
    const resultDiv = document.createElement("div");
    resultDiv.className = `result-card alert ${success ? "alert-success" : "alert-danger"}`;

    // Extract the numeric value from the message
    const [header, value] = message.split(":");

    // Create a title element for better readability
    const resultTitle = document.createElement("h4");
    resultTitle.textContent = `${header}:`;
    resultTitle.className = "result-title";

    // Create a value element with bold styling
    const resultValue = document.createElement("p");
    resultValue.textContent = value.trim();
    resultValue.className = "result-value";

    // Append elements to result card
    resultDiv.appendChild(resultTitle);
    resultDiv.appendChild(resultValue);
    container.appendChild(resultDiv);
}

    // Clear the result display
    function clearResult(containerId) {
        document.getElementById(containerId).innerHTML = "";
    }

function removePreviousResult(keyword) {
    const container = document.getElementById("resultContainer");
    const existingMessages = Array.from(container.children);

    existingMessages.forEach(msg => {
        if (msg.querySelector(".result-title")?.textContent.includes(keyword)) {
            msg.remove();
        }
    });
}

    // Bootstrap error visibility functions
    function showError(elementId) {
        document.getElementById(elementId).classList.remove("d-none");
    }

    function hideError(elementId) {
        document.getElementById(elementId).classList.add("d-none");
    }
});
