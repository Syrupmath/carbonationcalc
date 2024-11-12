document.addEventListener("DOMContentLoaded", async () => {
    let carbonationData;

    // Load JSON data
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
            const carbonationPressurePSI = pressureBAR * 14.5038; // Convert BAR to PSI
            document.getElementById("result").textContent = `Calculated Carbonation Pressure: ${pressureBAR.toFixed(2)} BAR / ${carbonationPressurePSI.toFixed(2)} PSI`;
        }
    });

    async function calculatePressure(targetTemperature, targetCarbonationLevel, isFahrenheit = false) {
        if (isFahrenheit) {
            targetTemperature = (targetTemperature - 32) * (5 / 9);
        }

        targetTemperature = Math.round(targetTemperature);

        const temperatures = Object.keys(carbonationData).map(Number).sort((a, b) => a - b);

        let lowerTemp = null;
        let upperTemp = null;

        for (let i = 0; i < temperatures.length; i++) {
            if (temperatures[i] <= targetTemperature) lowerTemp = temperatures[i];
            if (temperatures[i] >= targetTemperature) {
                upperTemp = temperatures[i];
                break;
            }
        }

        if (lowerTemp === null || upperTemp === null) {
            console.log("Invalid temperature range detected");
            return "Invalid temperature range";
        }

        const lowerPressure = getPressureAtLevel(carbonationData[lowerTemp], targetCarbonationLevel);
        const upperPressure = getPressureAtLevel(carbonationData[upperTemp], targetCarbonationLevel);

        if (lowerPressure === null || upperPressure === null) {
            console.log("Invalid carbonation level detected");
            return "Invalid carbonation level";
        }

        const interpolatedPressure = lowerPressure + ((targetTemperature - lowerTemp) / (upperTemp - lowerTemp)) * (upperPressure - lowerPressure);
        console.log(`Interpolated Pressure: ${interpolatedPressure}`);
        return interpolatedPressure;
    }

    function getPressureAtLevel(pressureData, targetLevel) {
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

        if (lowerLevel === null || upperLevel === null) {
            console.log("Out of range for carbonation level");
            return null;
        }

        const lowerPressure = pressureData[lowerLevel];
        const upperPressure = pressureData[upperLevel];

        if (lowerLevel !== upperLevel) {
            return lowerPressure + ((targetLevel - lowerLevel) / (upperLevel - lowerLevel)) * (upperPressure - lowerPressure);
        }

        return lowerPressure;
    }
});
