document.addEventListener("DOMContentLoaded", async () => {
    let carbonationData;

    // Load JSON data (assumes data.json is in the same directory)
    async function loadCarbonationData() {
        try {
            const response = await fetch("data.json");
            carbonationData = await response.json();
            console.log("Carbonation data loaded successfully:", carbonationData);
        } catch (error) {
            console.error("Error loading carbonation data:", error);
        }
    }

    // Call the function to load data when the page loads
    await loadCarbonationData();

    let carbonationPressurePSI = 0; // Placeholder for calculated carbonation pressure in PSI

    const temperatureInput = document.getElementById("temperature");
    const temperatureUnit = document.getElementById("temperatureUnit");
    const carbonationForm = document.getElementById("carbonationForm");
    const customValue = document.getElementById("customValue");

    let targetTemperature = null;
    let isFahrenheit = false;
    let targetCarbonationLevel = null;

    carbonationForm.addEventListener("change", () => {
        const selectedOption = carbonationForm.querySelector('input[name="carbonation"]:checked');
        if (selectedOption) {
            targetCarbonationLevel = selectedOption.value === "custom" ? parseFloat(customValue.value) || null : parseFloat(selectedOption.value);
            customValue.disabled = selectedOption.value !== "custom";
            if (selectedOption.value !== "custom") customValue.value = "";
            console.log("Carbonation Level Selected:", targetCarbonationLevel);
        }
    });

    customValue.addEventListener("input", () => {
        targetCarbonationLevel = parseFloat(customValue.value) || null;
        console.log("Custom Carbonation Level Entered:", targetCarbonationLevel);
    });

    temperatureInput.addEventListener("input", () => {
        targetTemperature = temperatureInput.value ? parseFloat(temperatureInput.value) : null;
        console.log("Temperature Entered:", targetTemperature);
    });

    temperatureUnit.addEventListener("change", () => {
        isFahrenheit = temperatureUnit.value === "F";
        console.log("Temperature Unit Selected:", isFahrenheit ? "Fahrenheit" : "Celsius");
    });

    document.getElementById("calculateButton").addEventListener("click", async () => {
        if (targetTemperature === null || targetCarbonationLevel === null) {
            document.getElementById("result").textContent = "Please enter all required values.";
            return;
        }

        const pressureBAR = await calculatePressure(targetTemperature, targetCarbonationLevel, isFahrenheit);
        if (pressureBAR === "Invalid temperature range" || pressureBAR === "Invalid carbonation level") {
            document.getElementById("result").textContent = pressureBAR;
        } else {
            carbonationPressurePSI = pressureBAR * 14.5038; // Convert BAR to PSI
            document.getElementById("result").textContent = `Calculated Carbonation Pressure: ${pressureBAR.toFixed(2)} BAR / ${carbonationPressurePSI.toFixed(2)} PSI`;
        }
    });

    // Function to calculate pressure based on temperature and carbonation level
    async function calculatePressure(targetTemperature, targetCarbonationLevel, isFahrenheit = false) {
        // Convert Fahrenheit to Celsius if needed
        if (isFahrenheit) {
            targetTemperature = (targetTemperature - 32) * (5 / 9);
        }

        // Round the target temperature to an integer for lookup
        targetTemperature = Math.round(targetTemperature);

        // Get available temperature keys from the data and sort them
        const temperatures = Object.keys(carbonationData).map(Number).sort((a, b) => a - b);

        // Find the closest temperatures around the target temperature
        let lowerTemp = null;
        let upperTemp = null;

        for (let i = 0; i < temperatures.length; i++) {
            if (temperatures[i] <= targetTemperature) lowerTemp = temperatures[i];
            if (temperatures[i] >= targetTemperature) {
                upperTemp = temperatures[i];
                break;
            }
        }

        // If target temperature is out of range
        if (lowerTemp === null || upperTemp === null) {
            return "Invalid temperature range";
        }

        // Get pressure data for the lower and upper temperatures at the target carbonation level
        const lowerPressure = getPressureAtLevel(carbonationData[lowerTemp], targetCarbonationLevel);
        const upperPressure = getPressureAtLevel(carbonationData[upperTemp], targetCarbonationLevel);

        // If the carbonation level is out of range
        if (lowerPressure === null || upperPressure === null) {
            return "Invalid carbonation level";
        }

        // Perform linear interpolation between the two temperatures
        const interpolatedPressure = lowerPressure + ((targetTemperature - lowerTemp) / (upperTemp - lowerTemp)) * (upperPressure - lowerPressure);
        
        return interpolatedPressure;
    }

    // Helper function to get the pressure at a specific carbonation level, using linear interpolation if needed
    function getPressureAtLevel(pressureData, targetLevel) {
        // Convert carbonation levels to numbers and sort them
        const levels = Object.keys(pressureData).map(Number).sort((a, b) => a - b);

        let lowerLevel = null;
        let upperLevel = null;

        for (let i = 0; i < levels.length; i++) {
            if (levels[i] <= targetLevel) lowerLevel = levels[i];
            if (levels[i] >= targetLevel) {
                upperLevel = levels[i];
                break;
            }
        }

        // If target level is out of range
        if (lowerLevel === null || upperLevel === null) {
            return null;
        }

        // Get pressures for the lower and upper carbonation levels
        const lowerPressure = pressureData[lowerLevel];
        const upperPressure = pressureData[upperLevel];

        // Perform linear interpolation if the target level is between two levels
        if (lowerLevel !== upperLevel) {
            return lowerPressure + ((targetLevel - lowerLevel) / (upperLevel - lowerLevel)) * (upperPressure - lowerPressure);
        }

        // If exact level found
        return lowerPressure;
    }
});
