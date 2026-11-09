
const STORAGE_KEY = 'data-laporan';

let reports = [];
let activeFilter = 'all';

// 1. LOAD DATA
document.addEventListener('DOMContentLoaded', () => {
    loadData();

    // Make filter buttons clickable
    const filterButtons = document.querySelectorAll('.filter-button');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            activeFilter = button.dataset.filter;

            // Move the active class to the selected filter
            filterButtons.forEach(item => {
                item.classList.remove('active');
            });

            button.classList.add('active');

            displayReportsTable();
        });
    });
});

function loadData() {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (savedData !== null) {
        reports = JSON.parse(savedData);
    } else {
        reports = typeof dataAwalLaporan !== 'undefined'
            ? dataAwalLaporan.map(report => ({
                id: report.id,
                reporter: report.reporter || report.pelapor || '',
                category: report.category || report.kategori || '',
                description: report.description || report.deskripsi || '',
                status: convertStatus(report.status)
            }))
            : [];
    }

    // Make sure old saved data uses the correct property names
    reports = reports.map(report => ({
        id: report.id,
        reporter: report.reporter || report.pelapor || '',
        category: report.category || report.kategori || '',
        description: report.description || report.deskripsi || '',
        status: convertStatus(report.status)
    }));

    saveData();
    displayReportsTable();
}

// Convert old status values into the correct English status
function convertStatus(status) {
    if (status === 'Menunggu' || status === 'Waiting' || status === 'Pending') {
        return 'waiting';
    }

    if (status === 'Diterima' || status === 'Accepted') {
        return 'accepted';
    }

    if (status === 'Selesai' || status === 'Finished' || status === 'Completed') {
        return 'completed';
    }

    return status || 'waiting';
}

// 2. SAVE DATA
function saveData() {
    // Convert the array into JSON text and save it in the browser
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(reports)
    );
}

// 3. SUBMIT REPORT FORM
function handleFormSubmit(event) {
    event.preventDefault();

    const form = document.getElementById('facility-report-form');

    if (!form) return;

    const reporter = document.getElementById('reporter').value.trim();
    const category = document.getElementById('select-category').value;
    const description = document.getElementById('textarea-description').value.trim();

    const newReport = {
        id: `rep-${Date.now()}`,
        reporter: reporter,
        category: category,
        description: description,
        status: 'waiting'
    };

    // Add the new report to the top of the list
    reports.unshift(newReport);

    saveData();
    displayReportsTable();

    form.reset();
}

// 4. DISPLAY DATA IN THE TABLE
function displayReportsTable() {
    const tableBody = document.getElementById('reports-table-body');

    // The form page does not have the dashboard table
    if (!tableBody) return;

    tableBody.innerHTML = '';

    // Filter reports based on the selected filter
    const displayedReports = reports.filter(report => {
        if (activeFilter === 'all') {
            return true;
        }

        if (activeFilter === 'waiting') {
            return report.status === 'waiting' ||
                report.status === 'accepted';
        }

        if (activeFilter === 'completed') {
            return report.status === 'completed';
        }

        return true;
    });

    if (displayedReports.length === 0) {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');

        emptyCell.colSpan = 5;
        emptyCell.className = 'empty-state';
        emptyCell.textContent = 'No reports yet.';

        emptyRow.appendChild(emptyCell);
        tableBody.appendChild(emptyRow);
    } else {
        displayedReports.forEach(report => {
            tableBody.appendChild(createReportRow(report));
        });
    }

    updateStatistics();
}

// 5. CREATE A REPORT TABLE ROW
function createReportRow(report) {
    const row = document.createElement('tr');

    const reporterCell = document.createElement('td');
    const categoryCell = document.createElement('td');
    const descriptionCell = document.createElement('td');
    const statusCell = document.createElement('td');
    const actionsCell = document.createElement('td');

    // Display report information
    reporterCell.textContent = report.reporter;
    categoryCell.textContent = report.category;
    descriptionCell.textContent = report.description;

    // Create a status badge with the correct color
    const statusBadge = document.createElement('span');
    statusBadge.classList.add('status-badge');

    if (report.status === 'waiting') {
        statusBadge.classList.add('status-waiting');
        statusBadge.textContent = 'Waiting';
    } else if (report.status === 'accepted') {
        statusBadge.classList.add('status-accepted');
        statusBadge.textContent = 'Accepted';
    } else if (report.status === 'completed') {
        statusBadge.classList.add('status-completed');
        statusBadge.textContent = 'Completed';
    }

    statusCell.appendChild(statusBadge);

    // Create action buttons based on the report status
    if (report.status === 'waiting') {
        const acceptButton = document.createElement('button');

        acceptButton.type = 'button';
        acceptButton.className = 'action-button accept-button';
        acceptButton.textContent = 'Accept';

        acceptButton.addEventListener('click', () => {
            updateReportStatus(report.id, 'accepted');
        });

        actionsCell.appendChild(acceptButton);

    } else if (report.status === 'accepted') {
        const finishButton = document.createElement('button');

        finishButton.type = 'button';
        finishButton.className = 'action-button complete-button';
        finishButton.textContent = 'Finish';

        finishButton.addEventListener('click', () => {
            updateReportStatus(report.id, 'completed');
        });

        actionsCell.appendChild(finishButton);

    } else {
        actionsCell.textContent = '-';
    }

    // Create the Delete button
    const deleteButton = document.createElement('button');

    deleteButton.type = 'button';
    deleteButton.className = 'action-button delete-button';
    deleteButton.textContent = 'Delete';

    // Run the deleteReport() function when clicked
    deleteButton.addEventListener('click', () => {
        deleteReport(report.id);
    });

    // Add the Delete button to the Actions column
    actionsCell.appendChild(deleteButton);

    row.append(
        reporterCell,
        categoryCell,
        descriptionCell,
        statusCell,
        actionsCell
    );

    return row;
}

// 6. UPDATE REPORT STATUS
function updateReportStatus(id, newStatus) {
    // Find the report with the matching ID
    const report = reports.find(item => item.id === id);

    if (!report) return;

    report.status = newStatus;

    saveData();
    displayReportsTable();
}

// DELETE REPORT
function deleteReport(id) {
    // Ask for confirmation before deleting the report
    const confirmation = confirm(
        'Are you sure you want to delete this report?'
    );

    // Stop the deletion if the user clicks Cancel
    if (!confirmation) return;

    // Remove the report with the matching ID
    reports = reports.filter(report => report.id !== id);

    // Save the updated data and refresh the table
    saveData();
    displayReportsTable();
}

// 7. UPDATE DASHBOARD STATISTICS
function updateStatistics() {
    const total = reports.length;

    // Waiting and Accepted reports are not completed yet
    const waiting = reports.filter(report =>
        report.status === 'waiting' ||
        report.status === 'accepted'
    ).length;

    const completed = reports.filter(report =>
        report.status === 'completed'
    ).length;

    // Main statistics
    const totalCount = document.getElementById('total-count');
    const waitingCount = document.getElementById('waiting-count');
    const completedCount = document.getElementById('completed-count');

    if (totalCount) totalCount.textContent = total;
    if (waitingCount) waitingCount.textContent = waiting;
    if (completedCount) completedCount.textContent = completed;

    // Numbers on the filter buttons
    const allFilterCount = document.getElementById('all-filter-count');
    const pendingFilterCount = document.getElementById('pending-filter-count');
    const doneFilterCount = document.getElementById('done-filter-count');

    if (allFilterCount) allFilterCount.textContent = `(${total})`;
    if (pendingFilterCount) pendingFilterCount.textContent = `(${waiting})`;
    if (doneFilterCount) doneFilterCount.textContent = `(${completed})`;

    // Number of reports in the navbar
    const navCount = document.getElementById('nav-count');

    if (navCount) {
        navCount.textContent = String(total).padStart(2, '0');
    }
}
