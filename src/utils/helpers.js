function formatDate(date) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Intl.DateTimeFormat('en-US', options).format(date);
}

function calculatePoints(attendanceCount) {
    if (attendanceCount === 0) return 0;
    if (attendanceCount === 1) return 1;
    return 2;
}

function isValidAge(age) {
    return Number.isInteger(age) && age > 0 && age < 120;
}

function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.classList.toggle('show');
}

export { formatDate, calculatePoints, isValidAge, toggleDropdown };