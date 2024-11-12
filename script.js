let carbonationData;

document.addEventListener("DOMContentLoaded", async () => {
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

    document.getElementById("calculateButton").addEventListener("click", async () => {
        const temperatureInput = parseFloat(document.getElementById("temperature").value);
        const temperatureUnit = document.getElementById("temperatureUnit").value;
        const carbonationLevelInput = document.querySelector('input[name="carbonation"]:checked')?.value;
        const targetCarbonationLevel = carbonationLevelInput === "custom" ? parseFloat(document.getElementById("customValue").value) : parseFloat(carbonationLevelInput);

        const lineRun = parseFloat(document.getElementById("lineRun").value) || null;
        const lineRunUnit = document.getElementById("lineRunUnit").value;
        const lineRise = parseFloat(document.getElementById("lineRise").value) || null;
        const lineRiseUnit = document.getElementById("lineRiseUnit").value;
        const lineType = document.getElementById("lineType").value;

        console.log("Temperature:", temperatureInput, temperatureUnit);
        console.log("Carbonation Level:", targetCarbonationLevel);
        console.log("Line Run:", lineRun, lineRunUnit);
        console.log("Line Rise:", lineRise, lineRiseUnit);
        console.log("Line Type:", lineType);

        const targetTemperature = temperatureUnit === "F" ? (temperatureInput - 32) * (5 / 9) : temperatureInput;

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
        console.log("Target Temperature (Celsius):", targetTemperature);
        console.log("Target Carbonation Level:", targetCarbonationLevel);

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

        console.log("Lower Temperature:", lowerTemp);
        console.log("Upper Temperature:", upperTemp);

        if (lowerTemp === null || upperTemp === null) {
            console.log("Invalid temperature range detected.");
            return "Invalid temperature range";
        }

        const lowerPressure = getPressureAtLevel(carbonationData[lowerTemp], targetCarbonationLevel);
        const upperPressure = getPressureAtLevel(carbonationData[upperTemp], targetCarbonationLevel);

        console.log("Lower Pressure:", lowerPressure);
        console.log("Upper Pressure:", upperPressure);

        if (lowerPressure === null || upperPressure === null) {
            console.log("Invalid carbonation level detected.");
            return "Invalid carbonation level";
        }

        // Direct return if no interpolation is needed
        if (lowerTemp === upperTemp && lowerPressure === upperPressure) {
            console.log("Exact match found. Returning exact pressure:", lowerPressure);
            return lowerPressure; // No interpolation needed
        }

        const interpolatedPressure = lowerPressure + ((targetTemperature - lowerTemp) / (upperTemp - lowerTemp)) * (upperPressure - lowerPressure);
        console.log("Final Interpolated Pressure:", interpolatedPressure);
        return interpolatedPressure;
    }

    function getPressureAtLevel(pressureData, targetLevel) {
        const levels = Object.keys(pressureData).map(Number).sort((a, b) => a - b);
        console.log("Available Carbonation Levels for Current Temperature:", levels);

        let lowerLevel = null;
        let upperLevel = null;

        for (let i = 0; i < levels.length; i++) {
            if (levels[i] <= targetLevel) lowerLevel = levels[i];
            if (levels[i] >= targetLevel) {
                upperLevel = levels[i];
                break;
            }
        }

        console.log("Lower Carbonation Level:", lowerLevel);
        console.log("Upper Carbonation Level:", upperLevel);

        if (lowerLevel === null || upperLevel === null) {
            console.log("Out of range for carbonation level");
            return null;
        }

        const lowerPressure = pressureData[lowerLevel];
        const upperPressure = pressureData[upperLevel];
        console.log("Lower Pressure for Level:", lowerPressure);
        console.log("Upper Pressure for Level:", upperPressure);

        if (lowerLevel !== upperLevel) {
            const interpolatedPressure = lowerPressure + ((targetLevel - lowerLevel) / (upperLevel - lowerLevel)) * (upperPressure - lowerPressure);
            console.log("Interpolated Pressure for Carbonation Level:", interpolatedPressure);
            return interpolatedPressure;
        }

        return lowerPressure;
    }
});
