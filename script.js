// Load carbonation data from data.json
let carbonationData = {};
fetch("data.json")
    .then(response => response.json())
    .then(data => {
        carbonationData = data;
        console.log("Carbonation data loaded:", carbonationData);
    })
    .catch(error => console.error("Error loading carbonation data:", error));

// Automatically select the "Custom" radio button when the custom input field gains focus
document.getElementById("customValue").addEventListener("focus", function () {
    const customRadio = document.querySelector('input[name="carbonation"][value="custom"]');
    customRadio.checked = true;
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

    // Validate the carbonation level
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

    // Display the results
    const resultHtml = `<h3>Results:</h3>
        <p>Carbonation Pressure: <strong>${carbonationPressure.toFixed(2)} PSI</strong></p>`;
    document.getElementById("result").innerHTML = resultHtml;
});
