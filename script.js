document.addEventListener("DOMContentLoaded", async () => {
    let carbonationData;

    // Load JSON data
    async function loadCarbonationData() {
        try {
            const response = await fetch("data.json"); // Ensure "data.json" is in the same directory
            carbonationData = await response.json();
            console.log("Carbonation data loaded successfully:", carbonationData);
        } catch (error) {
            console.error("Error loading carbonation data:", error);
        }
    }

    // Call the function to load data when the page loads
    await loadCarbonationData();

    let carbonationPressurePSI = 0; // Placeholder for calculated carbonation pressure in PSI

    // Line types and resistance values based on provided data
    const lineTypes = ["3/16\" Vinyl", "1/4\" Vinyl", "5/16\" Vinyl", "3/8\" Vinyl", "1/2\" Vinyl", "3/16\" Polyethylene", "1/4\" Polyethylene", "3/8\" Stainless Steel", "5/16\" Stainless Steel", "1/4\" Stainless Steel"];
    const resistanceFactors = [3, 0.85, 0.4, 0.13, 0.025, 2.2, 0.5, 0.2, 0.5, 2];
    const unitForFeet = "ft";

    let carbonationLevel = null;
    let temperature = null;
    let temperatureScale = "C";
    let lineRun = null;
    let lineRise = null;
    let unit = unitForFeet;

    // Capture carbonation level selection
    const carbonationForm = document.getElementById("carbonationForm");
    const customValue = document.getElementById("customValue");

    carbonationForm.addEventListener("change", () => {
        const selectedOption = carbonationForm.querySelector('input[name="carbonation"]:checked');
        if (selectedOption) {
            carbonationLevel = selectedOption.value === "custom" ? parseFloat(customValue.value) || null : parseFloat(selectedOption.value);
            customValue.disabled = selectedOption.value !== "custom";
            if (selectedOption.value !== "custom") customValue.value = "";
            console.log("Carbonation Level Selected:", carbonationLevel);
        }
    });

    customValue.addEventListener("input", () => {
        carbonationLevel = parseFloat(customValue.value) || null;
        console.log("Custom Carbonation Level Entered:", carbonationLevel);
    });

    const temperatureInput = document.getElementById("temperature");
    const temperatureUnit = document.getElementById("temperatureUnit");

    temperatureInput.addEventListener("input", () => {
        temperature = temperatureInput.value ? parseFloat(temperatureInput.value) : null;
        console.log("Temperature Entered:", temperature);
    });

    temperatureUnit.addEventListener("change", () => {
        temperatureScale = temperatureUnit.value;
        console.log("Temperature Unit Selected:", temperatureScale);
    });

    // Capture line run and rise inputs
    document.getElementById("lineForm").addEventListener("input", (event) => {
        if (event.target.id === "lineRun") lineRun = parseFloat(event.target.value) || null;
        if (event.target.id === "lineRise") lineRise = parseFloat(event.target.value) || null;
        console.log("Line Run (A5):", lineRun, "| Line Rise (B5):", lineRise);
    });

    // Capture unit for line run and rise
    document.getElementById("lineRunUnit").addEventListener("change", (event) => {
        unit = event.target.value;
        console.log("Unit for Rise and Run (C5):", unit);
    });

    function convertFahrenheitToCelsius(fahrenheit) {
        return (fahrenheit - 32) * (5 / 9);
    }

    function calculateAndDisplayPressure() {
        if (carbonationLevel === null || temperature === null || !carbonationData) {
            document.getElementById("result").textContent = "Please enter all required values.";
            return;
        }

        let tempCelsius = temperatureScale === "F" ? convertFahrenheitToCelsius(temperature) : temperature;
        const roundedTemp = Math.round(tempCelsius);
        const pressureBAR = getPressureForCarbonationLevel(roundedTemp, carbonationLevel);

        if (pressureBAR !== null) {
            carbonationPressurePSI = pressureBAR * 14.5038;
            document.getElementById("result").textContent = `Calculated Carbonation Pressure: ${pressureBAR.toFixed(2)} BAR / ${carbonationPressurePSI.toFixed(2)} PSI`;
            console.log("Carbonation Pressure Calculated in PSI:", carbonationPressurePSI);
        } else {
            document.getElementById("result").textContent = "Carbonation pressure not found for entered values.";
        }
    }

    function getPressureForCarbonationLevel(temp, carbonationLevel) {
        const tempData = carbonationData[temp];
        return tempData ? tempData[carbonationLevel] : null;
    }

    function calculateDispensePressure() {
        // Reference lineType directly from the form
        const lineTypeForm = document.getElementById("lineTypeForm");
        const lineType = lineTypeForm.value;
        console.log("Using Line Type:", lineType);  // Log to confirm value

        // Log all input values to verify they are captured correctly
        console.log("Dispense Pressure Calculation Inputs:", {
            lineType: lineType,  // Ensure lineType is logged here
            lineRun: lineRun,
            lineRise: lineRise,
            carbonationPressurePSI: carbonationPressurePSI,
            unit: unit
        });

        // Ensure all required fields for dispense pressure are filled
        if (!lineType || lineRun === null || lineRise === null || carbonationPressurePSI === 0) {
            console.log("Dispense pressure calculation skipped due to missing or incomplete input fields.");
            return;  // Exit the function if any fields are missing
        }

        // Lookup resistance factor based on line type (D5)
        const resistanceFactor = lineTypes.includes(lineType) ? resistanceFactors[lineTypes.indexOf(lineType)] : 0;

        // Adjust run and rise based on unit (meters or feet)
        const adjustedRun = (unit === "ft") ? lineRun / 0.305 : lineRun;
        const adjustedRise = (unit === "ft") ? lineRise / 0.305 : lineRise;

        // Use calculated carbonation pressure in PSI as E5
        const dispensePressure = carbonationPressurePSI + (resistanceFactor * adjustedRun) + (adjustedRise / 2) + 1;

        console.log("Calculated Dispense Pressure:", dispensePressure);
        document.getElementById("result").textContent += ` | Dispense Pressure: ${dispensePressure.toFixed(2)} PSI`;
    }

    document.getElementById("calculateButton").addEventListener("click", () => {
        calculateAndDisplayPressure();  // Carbonation Pressure Calculation
        setTimeout(calculateDispensePressure, 100);  // Delay to ensure carbonationPressurePSI is set
    });
});
