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

    // Base pressure for dispense calculation (this is now dynamic based on carbonation pressure in PSI)
    let carbonationPressurePSI = 0; // This will be set after carbonation pressure is calculated

    // Line types and resistance values based on provided data
    const lineTypes = ["3/16\" Vinyl", "1/4\" Vinyl", "5/16\" Vinyl", "3/8\" Vinyl", "1/2\" Vinyl", "3/16\" Polyethylene", "1/4\" Polyethylene", "3/8\" Stainless Steel", "5/16\" Stainless Steel", "1/4\" Stainless Steel"];
    const resistanceFactors = [3, 0.85, 0.4, 0.13, 0.025, 2.2, 0.5, 0.2, 0.5, 2];
    const unitForFeet = "ft";

    // Capture user inputs for carbonation level, temperature, line type, run, rise, and unit
    let carbonationLevel = null;
    let temperature = null;
    let temperatureScale = "C";
    let lineType = null;
    let lineRun = null;
    let lineRise = null;
    let unit = unitForFeet;

    // Capture carbonation level selection
    const carbonationForm = document.getElementById("carbonationForm");
    const customValue = document.getElementById("customValue");

    carbonationForm.addEventListener("change", () => {
        const selectedOption = carbonationForm.querySelector('input[name="carbonation"]:checked');
        if (selectedOption) {
            if (selectedOption.value === "custom") {
                carbonationLevel = parseFloat(customValue.value) || null;
                customValue.disabled = false;
            } else {
                carbonationLevel = parseFloat(selectedOption.value);
                customValue.disabled = true;
                customValue.value = ""; // Clear custom field if not used
            }
            console.log("Carbonation Level Selected:", carbonationLevel);
        }
    });

    customValue.addEventListener("input", () => {
        carbonationLevel = parseFloat(customValue.value) || null;
        console.log("Custom Carbonation Level Entered:", carbonationLevel);
    });

    // Capture temperature and unit
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

    // Capture line type, run, rise, and unit
    document.getElementById("lineTypeForm").addEventListener("change", (event) => {
        lineType = event.target.value;
        console.log("Selected Line Type:", lineType);
    });

    document.getElementById("lineForm").addEventListener("input", (event) => {
        if (event.target.id === "lineRun") {
            lineRun = parseFloat(event.target.value) || null;
            console.log("Line Run (A5):", lineRun);
        }
        if (event.target.id === "lineRise") {
            lineRise = parseFloat(event.target.value) || null;
            console.log("Line Rise (B5):", lineRise);
        }
    });

    document.getElementById("lineRunUnit").addEventListener("change", (event) => {
        unit = event.target.value;
        console.log("Unit for Rise and Run (C5):", unit);
    });

    // Function to convert Fahrenheit to Celsius
    function convertFahrenheitToCelsius(fahrenheit) {
        return (fahrenheit - 32) * (5 / 9);
    }

    // Lookup and calculate carbonation pressure based on temperature and carbonation level
    function calculateAndDisplayPressure() {
        console.log("Starting carbonation pressure calculation with values:", {
            carbonationLevel,
            temperature,
            temperatureScale,
            carbonationDataLoaded: !!carbonationData,
        });

        if (carbonationLevel === null || temperature === null || !carbonationData) {
            document.getElementById("result").textContent = "Please enter all required values.";
            return;
        }

        // Convert temperature to Celsius if necessary
        let tempCelsius = temperatureScale === "F" ? convertFahrenheitToCelsius(temperature) : temperature;

        // Round temperature to nearest integer for lookup
        const roundedTemp = Math.round(tempCelsius);

        // Get pressure from JSON data
        const pressureBAR = getPressureForCarbonationLevel(roundedTemp, carbonationLevel);

        if (pressureBAR !== null) {
            carbonationPressurePSI = pressureBAR * 14.5038; // Convert BAR to PSI and store as carbonationPressurePSI
            document.getElementById("result").textContent = `Calculated Carbonation Pressure: ${pressureBAR.toFixed(2)} BAR / ${carbonationPressurePSI.toFixed(2)} PSI`;
            console.log("Calculated Carbonation Pressure in BAR:", pressureBAR, "and in PSI:", carbonationPressurePSI);
        } else {
            document.getElementById("result").textContent = "Carbonation pressure not found for entered values.";
            console.log("Carbonation pressure not found for the entered values.");
        }
    }

    // Function to get carbonation pressure based on temperature and carbonation level
    function getPressureForCarbonationLevel(temp, carbonationLevel) {
        console.log("Looking up carbonation pressure for temperature:", temp, "and carbonation level:", carbonationLevel);

        const tempData = carbonationData[temp];
        if (!tempData) {
            console.error("Temperature out of range.");
            return null;
        }

        const pressure = tempData[carbonationLevel];
        if (pressure === undefined) {
            console.error("Carbonation level out of range.");
            return null;
        }

        return pressure;
    }

    // Function to calculate dispense pressure
    function calculateDispensePressure() {
        // Ensure all required fields for dispense pressure are filled
        if (!lineType || lineRun === null || lineRise === null) {
            console.log("Dispense pressure calculation skipped due to incomplete input fields.");
            return;  // Exit the function if any fields are missing
        }

        // Lookup resistance factor based on line type (D5)
        const resistanceFactor = lineTypes.includes(lineType) ? resistanceFactors[lineTypes.indexOf(lineType)] : 0;

        // Adjust run and rise based on unit (A13 for meters, A14 for feet)
        const adjustedRun = (unit === "ft") ? lineRun / 0.305 : lineRun;
        const adjustedRise = (unit === "ft") ? lineRise / 0.305 : lineRise;

        // Use calculated carbonation pressure in PSI as E5
        const dispensePressure = carbonationPressurePSI + (resistanceFactor * adjustedRun) + (adjustedRise / 2) + 1;

        console.log("Calculated Dispense Pressure:", dispensePressure);
        document.getElementById("result").textContent += ` | Dispense Pressure: ${dispensePressure.toFixed(2)} PSI`;
    }

    // Calculate and display both carbonation and dispense pressures on button click
    document.getElementById("calculateButton").addEventListener("click", () => {
        calculateAndDisplayPressure();  // Carbonation Pressure Calculation
        calculateDispensePressure();    // Dispense Pressure Calculation
    });
});
