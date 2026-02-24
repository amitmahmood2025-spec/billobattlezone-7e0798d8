// Common helper functions for the application

/**
 * Formats the current date and time to YYYY-MM-DD HH:MM:SS
 * @returns {string} Formatted date string
 */
function getCurrentDateTime() {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Example helper function to check if a value is empty
 * @param {*} value - The value to check
 * @returns {boolean} True if empty, false otherwise
 */
function isEmpty(value) {
    return value === null || value === undefined || value === '';
}

// Exporting functions
module.exports = {
    getCurrentDateTime,
    isEmpty
};