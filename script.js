// Load carbonation data from data.json
let carbonationData = {};
fetch("data.json")
    .then(response => response.json())
    .then(data => {
        carbonationData = data;
        console.log("Carbonation data loaded:", carbonationData);
    })
    .catch(error => console.error("Error loading carbonation data:", error));

// Add event listeners to dynamically enable or disable the custom carbonation input
document.querySelectorAll('input[name="carbonation"]').forEach(radio => {
    radio.addEventListener("change", function () {
        const customValueField = document.getElementById("customValue");
        if (this.value === "custom") {
            customValueField.disabled = false; // Enable the field
            customValueField.focus(); // Focus on the field
        } else {
            customValueField.disabled = true; // Disable the field
            customValueField.value = ""; // Clear the value
        }
    });
});

// Main calculation logic
document.getElementById("calculateButton").addEventListener("click", () => {
    const selectedCarbonationOption = document.querySelector('input[name="carbonation"]:checked')?.value;
    const customValue = parseFloat(document.getElementById("customValue").value);

    // Determine the target carbonation level
    let targetCarbonationLevel;
    if (selectedCarbonationOption === "custom") {
        if (isNaN(customValue) || customValue <= 0) {
            document.getElementById("result").textContent = "Please enter a valid custom carbonation level.";
            return;
        }
        targetCarbonationLevel = customValue;
    } else {
        targetCarbonationLevel = parseFloat(selectedCarbonationOption);
    }

    // Validate the target carbonation level
    if (isNaN(targetCarbonationLevel) || targetCarbonationLevel <= 0) {
        document.getElementById("result").textContent = "Invalid carbonation level. Please select or enter a valid value.";
        return;
    }

    // Get the temperature input
    const temperature = parseFloat(document.getElementById("temperature").value);
    if (isNaN(temperature)) {
        document.getElementById("result").textContent = "Please enter a valid temperature.";
        return;
    }

    // Interpolate carbonation pressure from carbonationData
    function calculatePressure(temperature, carbonationLevel) {
        const tempKeys = Object.keys(carbonationData).map(Number).sort((a, b) => a - b);

        // Find the nearest lower and upper temperatures for interpolation
        const lowerTemp = tempKeys.filter(t => t <= temperature).pop();
        const upperTemp = tempKeys.find(t => t >= temperature);

        if (lowerTemp === undefined || upperTemp === undefined) {
            return null; // Temperature out of range
        }

        // Get the corresponding pressures for the carbonation level
        const lowerPressure = carbonationData[lowerTemp]?.[carbonationLevel];
        const upperPressure = carbonationData[upperTemp]?.[carbonationLevel];

        if (lowerPressure === undefined || upperPressure === undefined) {
            return null; // Carbonation level out of range
        }

        // Linear interpolation
        const ratio = (temperature - lowerTemp) / (upperTemp - lowerTemp);
        return lowerPressure + ratio * (upperPressure - lowerPressure);
    }

    const carbonationPressure = calculatePressure(temperature, targetCarbonationLevel);
    if (carbonationPressure === null) {
        document.getElementById("result").textContent = "Temperature or carbonation level is out of range.";
        return;
    }

    // Get dispensing parameters if enabled
    const includeDispensing = document.getElementById("includeDispensing").checked;
    let dispensingPressure = null;

    if (includeDispensing) {
        const rise = parseFloat(document.getElementById("rise").value) || 0;
        const run = parseFloat(document.getElementById("run").value) || 0;
        const draftLineType = document.getElementById("draftLineType").value;
        const draftLineSize = document.getElementById("draftLineSize").value;

        // Resistance per foot for the selected draft line type and size
        const draftLineResistance = {
            "vinyl": { "3/16": 2.7, "1/4": 0.85, "5/16": 0.40 },
            "stainless_steel": { "3/16": 0.7, "1/4": 0.4, "5/16": 0.2 },
            "polyethylene": { "3/16": 1.0, "1/4": 0.5, "5/16": 0.25 }
        };

        const resistancePerFoot = draftLineResistance[draftLineType]?.[draftLineSize];
        if (resistancePerFoot === undefined) {
            document.getElementById("result").textContent = "Invalid draft line type or size.";
            return;
        }

        // Calculate dispensing pressure
        dispensingPressure = (rise * 0.5) + (run * resistancePerFoot / 12) + carbonationPressure;
    }

    // Display the results
    let resultHtml = `<h3>Results:</h3>
        <p>Carbonation Pressure: <strong>${carbonationPressure.toFixed(2)} PSI</strong></p>`;
    if (includeDispensing && dispensingPressure !== null) {
        resultHtml += `<p>Dispensing Pressure: <strong>${dispensingPressure.toFixed(2)} PSI</strong></p>`;
    }
    document.getElementById("result").innerHTML = resultHtml;
});
