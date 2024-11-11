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

    // Capture carbonation level
    const carbonationForm = document.getElementById("carbonationForm");
    const customValue = document.getElementById("customValue");
    let carbonationLevel = null;

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
    let temperature = null;
    let temperatureScale = "C";

    temperatureInput.addEventListener("input", () => {
        temperature = temperatureInput.value ? parseFloat(temperatureInput.value) : null;
        console.log("Temperature Entered:", temperature);
    });

    temperatureUnit.addEventListener("change", () => {
        temperatureScale = temperatureUnit.value;
        console.log("Temperature Unit Selected:", temperatureScale);
    });

    // Function to convert Fahrenheit to Celsius
    function convertFahrenheitToCelsius(fahrenheit) {
        return (fahrenheit - 32) * (5 / 9);
    }

    // Calculate and display pressure on button click
    document.getElementById("calculateButton").addEventListener("click", () => {
        calculateAndDisplayPressure();
    });

    // Lookup and calculate pressure based on temperature and carbonation level
    function calculateAndDisplayPressure() {
        console.log("Starting calculation with values:", {
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
            const pressurePSI = pressureBAR * 14.5038; // Convert BAR to PSI
            document.getElementById("result").textContent = `Calculated Pressure: ${pressureBAR.toFixed(2)} BAR / ${pressurePSI.toFixed(2)} PSI`;
            console.log("Calculated Pressure in BAR:", pressureBAR, "and in PSI:", pressurePSI);
        } else {
            document.getElementById("result").textContent = "Pressure not found for entered values.";
            console.log("Pressure not found for the entered values.");
        }
    }

    // Lookup function
    function getPressureForCarbonationLevel(temp, carbonationLevel) {
        console.log("Looking up pressure for temperature:", temp, "and carbonation level:", carbonationLevel);

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
});
