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

    // Function to capture all input values on button click
    document.getElementById("calculateButton").addEventListener("click", async () => {
        // Capture temperature, carbonation level, line rise/run values, and units
        const temperatureInput = document.getElementById("temperature").value;
        const temperatureUnit = document.getElementById("temperatureUnit").value;
        const carbonationLevelInput = document.querySelector('input[name="carbonation"]:checked')?.value || document.getElementById("customValue").value;

        const lineRun = parseFloat(document.getElementById("lineRun").value) || null;
        const lineRunUnit = document.getElementById("lineRunUnit").value;
        const lineRise = parseFloat(document.getElementById("lineRise").value) || null;
        const lineRiseUnit = document.getElementById("lineRiseUnit").value;

        console.log("Temperature:", temperatureInput, temperatureUnit);
        console.log("Carbonation Level:", carbonationLevelInput);
        console.log("Line Run:", lineRun, lineRunUnit);
        console.log("Line Rise:", lineRise, lineRiseUnit);

        // Parse temperature and carbonation level as needed
        const targetTemperature = temperatureUnit === "F" ? (parseFloat(temperatureInput) - 32) * (5 / 9) : parseFloat(temperatureInput);
        const targetCarbonationLevel = parseFloat(carbonationLevelInput);

        // Perform the calculation only if all required fields are valid
        if (!isNaN(targetTemperature) && !isNaN(targetCarbonationLevel)) {
            const pressureBAR = await calculatePressure(targetTemperature, targetCarbonationLevel);
            const carbonationPressurePSI = pressureBAR * 14.5038;

            if (pressureBAR === "Invalid temperature range" || pressureBAR === "Invalid carbonation level") {
                document.getElementById("result").textContent = pressureBAR;
            } else {
                document.getElementById("result").textContent = `Calculated Carbonation Pressure: ${pressureBAR.toFixed(2)} BAR / ${carbonationPressurePSI.toFixed(2)} PSI`;
            }
        } else {
            document.getElementById("result").textContent = "Please enter all required values.";
        }
    });

    async function calculatePressure(targetTemperature, targetCarbonationLevel) {
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
            return "Invalid temperature range";
        }

        const lowerPressure = getPressureAtLevel(carbonationData[lowerTemp], targetCarbonationLevel);
        const upperPressure = getPressureAtLevel(carbonationData[upperTemp], targetCarbonationLevel);

        if (lowerPressure === null || upperPressure === null) {
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
