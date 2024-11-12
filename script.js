async function calculatePressure(targetTemperature, targetCarbonationLevel) {
    // Check if target temperature and carbonation level are valid numbers
    console.log("Target Temperature (Celsius):", targetTemperature);
    console.log("Target Carbonation Level:", targetCarbonationLevel);

    if (isNaN(targetTemperature) || isNaN(targetCarbonationLevel)) {
        console.log("Invalid temperature or carbonation level input.");
        return "Invalid temperature or carbonation level";
    }

    // Get available temperature keys from the data and sort them
    const temperatures = Object.keys(carbonationData).map(Number).sort((a, b) => a - b);
    console.log("Available Temperatures:", temperatures);

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

    console.log("Lower Temperature:", lowerTemp);
    console.log("Upper Temperature:", upperTemp);

    // If target temperature is out of range
    if (lowerTemp === null || upperTemp === null) {
        console.log("Temperature out of range in data.json");
        return "Invalid temperature range";
    }

    // Get pressure data for the lower and upper temperatures at the target carbonation level
    const lowerPressure = getPressureAtLevel(carbonationData[lowerTemp], targetCarbonationLevel);
    const upperPressure = getPressureAtLevel(carbonationData[upperTemp], targetCarbonationLevel);

    console.log("Lower Pressure:", lowerPressure);
    console.log("Upper Pressure:", upperPressure);

    // If the carbonation level is out of range
    if (lowerPressure === null || upperPressure === null) {
        console.log("Carbonation level out of range in data.json");
        return "Invalid carbonation level";
    }

    // Perform linear interpolation between the two temperatures
    const interpolatedPressure = lowerPressure + ((targetTemperature - lowerTemp) / (upperTemp - lowerTemp)) * (upperPressure - lowerPressure);
    console.log("Interpolated Pressure:", interpolatedPressure);
    return interpolatedPressure;
}

function getPressureAtLevel(pressureData, targetLevel) {
    // Convert carbonation levels to numbers and sort them
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

    // If target level is out of range
    if (lowerLevel === null || upperLevel === null) {
        console.log("Out of range for carbonation level");
        return null;
    }

    // Get pressures for the lower and upper carbonation levels
    const lowerPressure = pressureData[lowerLevel];
    const upperPressure = pressureData[upperLevel];
    console.log("Lower Pressure for Level:", lowerPressure);
    console.log("Upper Pressure for Level:", upperPressure);

    // Perform linear interpolation if the target level is between two levels
    if (lowerLevel !== upperLevel) {
        const interpolatedPressure = lowerPressure + ((targetLevel - lowerLevel) / (upperLevel - lowerLevel)) * (upperPressure - lowerPressure);
        console.log("Interpolated Pressure for Carbonation Level:", interpolatedPressure);
        return interpolatedPressure;
    }

    // If exact level found
    return lowerPressure;
}
