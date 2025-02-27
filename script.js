document.addEventListener("DOMContentLoaded", async () => {
    let carbonationData;

    // Load carbonation data from JSON
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

    // Automatically select "Custom" radio on custom input focus
    document.getElementById("customValue").addEventListener("focus", () => {
        document.getElementById("customRadio").checked = true;
    });

    // Calculate button handler
    document.getElementById("calculateButton").addEventListener("click", (event) => {
        event.preventDefault(); // Prevent form submission refreshing the page
        clearResult("resultContainer");

        let isValid = validateForm();

        if (isValid) {
            performCalculations();
        }
    });

    // Form validation function
    function validateForm() {
        let valid = true;

        // Step 1: Validate Carbonation Level
        const carbonationSelection = document.querySelector('input[name="carbonation"]:checked');
        if (!carbonationSelection) {
            showError("carbonationError", "Please select a carbonation level.");
            valid = false;
        } else {
            hideError("carbonationError");
        }

        const targetCarbonation = carbonationSelection && carbonationSelection.value === "custom"
            ? parseFloat(document.getElementById("customValue").value)
            : parseFloat(carbonationSelection?.value);

        if (carbonationSelection?.value === "custom" && isNaN(targetCarbonation)) {
            showError("carbonationError", "Please enter a valid carbonation level.");
            valid = false;
        }

        // Step 2: Validate Temperature
        const temperatureInput = parseFloat(document.getElementById("temperature").value);
        const temperatureUnit = document.getElementById("temperatureUnit").value;
        const convertedTemperature = temperatureUnit === "F"
            ? (temperatureInput - 32) * (5 / 9)
            : temperatureInput;

        if (isNaN(convertedTemperature) || convertedTemperature < 0 || convertedTemperature > 30) {
            showError("temperatureError", "Temperature must be between 0°C and 30°C.");
            valid = false;
        } else {
            hideError("temperatureError");
        }

        // Step 3: Validate Dispensing Pressure (if any fields are filled)
        if (step3HasInput()) {
            const lineType = document.getElementById("lineType").value;
            const lineRun = parseFloat(document.getElementById("lineRun").value);
            const lineRise = parseFloat(document.getElementById("lineRise").value);
            const lineRunUnit = document.getElementById("lineRunUnit").value;
            const lineRiseUnit = document.getElementById("lineRiseUnit").value;

if (!lineType || isNaN(lineRun) || isNaN(lineRise) || !lineRunUnit || !lineRiseUnit) {
    showError("lineError", "Please complete all fields for dispensing pressure.");
    hideError("riseError"); // Hide rise error when general error appears
    valid = false;
} else {
    // Convert meters to feet for comparison if necessary
    const runInFeet = lineRunUnit === "m" ? lineRun / 0.3048 : lineRun;
    const riseInFeet = lineRiseUnit === "m" ? lineRise / 0.3048 : lineRise;

    if (Math.abs(riseInFeet) > runInFeet) {
        showError("riseError", "Total run must be longer than rise/drop.");
        hideError("lineError"); // Hide general error if specific rise error is triggered
        valid = false;
    } else {
        hideError("riseError");
        hideError("lineError"); // Clear both errors if everything is valid
    }
}

    // Function to check if Step 3 has input
    function step3HasInput() {
        return document.getElementById("lineType").value ||
               document.getElementById("lineRun").value ||
               document.getElementById("lineRise").value;
    }

    // Bootstrap error visibility functions
    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove("d-none");
            errorElement.style.display = "block";
        }
    }

    function hideError(elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.classList.add("d-none");
            errorElement.style.display = "none";
        }
    }
});
