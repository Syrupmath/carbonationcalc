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

            // Calculate dispense pressure if line run, rise, and type are provided
            if (lineRun && lineRise && lineType) {
                const dispensePressure = calculateDispensePressure(carbonationPressurePSI, lineRun, lineRise, lineType, lineRunUnit, lineRiseUnit);
                document.getElementById("dispenseResult").textContent = `Calculated Dispense Pressure: ${dispensePressure.toFixed(2)} PSI`;
            } else {
                document.getElementById("dispenseResult").textContent = ""; // Clear if not all fields are filled
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

        if (lowerTemp === upperTemp && lowerPressure === upperPressure) {
            console.log("Exact match found. Returning exact pressure:", lowerPressure);
            return lowerPressure;
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

    function calculateDispensePressure(carbonationPressurePSI, lineRun, lineRise, lineType, lineRunUnit, lineRiseUnit) {
        // Placeholder values for line resistance based on line type
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
        const runInFeet = lineRunUnit === "m" ? lineRun / 0.305 : lineRun;
        const riseInFeet = lineRiseUnit === "m" ? lineRise / 0.305 : lineRise;

        const dispensePressure = carbonationPressurePSI + (resistance * runInFeet) + (riseInFeet / 2) + 1;
        console.log("Calculated Dispense Pressure:", dispensePressure);
        return dispensePressure;
    }
});
