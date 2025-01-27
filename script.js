// Load carbonation data from data.json
let carbonationData = {};
fetch("data.json")
    .then(response => response.json())
    .then(data => {
        carbonationData = data;
        console.log("Carbonation data loaded:", carbonationData);
    })
    .catch(error => console.error("Error loading carbonation data:", error));

// Main calculation logic
document.getElementById("calculateButton").addEventListener("click", () => {
    const selectedCarbonationOption = document.querySelector('input[name="carbonation"]:checked')?.value;

    // Parse carbonation level (no custom logic)
    const targetCarbonationLevel = parseFloat(selectedCarbonationOption);
    console.log("Target Carbonation Level:", targetCarbonationLevel);

    // Validate the carbonation level
    if (isNaN(targetCarbonationLevel) || targetCarbonationLevel <= 0) {
        document.getElementById("result").textContent = "Invalid carbonation level. Please select a valid value.";
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

        console.log("Temperature keys:", tempKeys);
        console.log("Lower temperature:", lowerTemp, "Upper temperature:", upperTemp);

        if (lowerTemp === undefined || upperTemp === undefined) {
            console.error("Temperature is out of range!");
            return null; // Temperature out of range
        }

        // Get the corresponding pressures for the carbonation level
        const lowerPressure = carbonationData[lowerTemp]?.[carbonationLevel];
        const upperPressure = carbonationData[upperTemp]?.[carbonationLevel];

        console.log("Lower pressure:", lowerPressure, "Upper pressure:", upperPressure);

        if (lowerPressure === undefined || upperPressure === undefined) {
            console.error("Carbonation level is out of range!");
            return null; // Carbonation level out of range
        }

        // Linear interpolation
        const ratio = (temperature - lowerTemp) / (upperTemp - lowerTemp);
        const interpolatedPressure = lowerPressure + ratio * (upperPressure - lowerPressure);

        console.log("Interpolated pressure:", interpolatedPressure);

        return interpolatedPressure;
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
