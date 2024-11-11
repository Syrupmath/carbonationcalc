document.addEventListener("DOMContentLoaded", async () => {
    let carbonationData;

    // Load JSON data
    async function loadCarbonationData() {
        try {
            const response = await fetch("data.json"); // Path to the data.json file in the same directory
            carbonationData = await response.json();
        } catch (error) {
            console.error("Error loading carbonation data:", error);
        }
    }

    // Call the function to load data when page loads
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
        }
    });

    customValue.addEventListener("input", () => {
        carbonationLevel = parseFloat(customValue.value) || null;
    });

    // Capture temperature and unit
    const temperatureInput = document.getElementById("temperature");
    const temperatureUnit = document.getElementById("temperatureUnit");
    let temperature = null;
    let temperatureScale = "C";

    temperatureInput.addEventListener("input", () => {
        temperature = temperatureInput.value ? parseFloat(temperatureInput.value) : null;
    });

    temperatureUnit.addEventListener("change", () => {
        temperatureScale = temperatureUnit.value;
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
        if (carbonationLevel === null || temperature === null || !carbonationData) {
            document.getElementById("result").textContent = "Please enter all required values.";
            return;
        }

        // Convert temperature to Celsius if necessary
        let tempCelsius = temperatureScale === "F" ? convertFahrenheitToCelsius(temperature) : temperature;

        // Round temperature to nearest integer for lookup
        const roundedTemp = Math.round(tempCelsius);

        // Get pressure from JSON data
        const pressure = getPressureForCarbonationLevel(roundedTemp, carbonationLevel);

        if (pressure !== null) {
            document.getElementById("result").textContent = `Calculated Pressure: ${pressure.toFixed(2)} BAR or PSI`;
        } else {
            document.getElementById("result").textContent = "Pressure not found for entered values.";
        }
    }

    // Lookup function
    function getPressureForCarbonationLevel(temp, carbonationLevel) {
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
