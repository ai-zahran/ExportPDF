'use strict';

// Wrap everything in an anonymous function to avoid polluting the global namespace
(function() {
    // Use the jQuery document ready signal to know when everything has been initialized
    $(document).ready(function() {
        // Tell Tableau we'd like to initialize our extension
        tableau.extensions.initializeAsync().then(function() {
            showChooseSheetDialog();
        });
    });

    /**
     * Shows the choose sheet UI. Once a sheet is selected, the data table for the sheet is shown
     */
    function showChooseSheetDialog() {
        // Clear out the existing list of sheets
        $('#choose_sheet_buttons').empty();

        // Set the dashboard's name in the title
        const dashboardName = tableau.extensions.dashboardContent.dashboard.name;
        $('#choose_sheet_title').text(dashboardName);

        // The first step in choosing a sheet will be asking Tableau what sheets are available
        const worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;

        // Next, we loop through all of these worksheets and add buttons for each one
        worksheets.forEach(function(worksheet) {
            // Declare our new button which contains the sheet name
            const button = createButton(worksheet.name);

            // Create an event handler for when this button is clicked
            button.click(function() {
                // Get the worksheet name and save it to settings.
                const worksheetName = worksheet.name;
                loadSelectedMarks(worksheetName);
                $('#choose_sheet_dialog').modal('toggle')
            });

            // Add our button to the list of worksheets to choose from
            $('#choose_sheet_buttons').append(button);
        });

    }

    function createButton(buttonTitle) {
        const button =
            $(`<button type='button' class='btn btn-secondary btn-lg btn-block'>${buttonTitle}</button>`);
        return button;
    }

    // This variable will save off the function we can call to unregister listening to marks-selected events
    let unregisterEventHandlerFunction;
    
    function loadSelectedMarks(worksheetName) {
        // Remove any existing event listeners
        if (unregisterEventHandlerFunction) {
            unregisterEventHandlerFunction();
        }
        
        // Get the worksheet object we want to get the selected marks for
        const worksheet = getSelectedSheet(worksheetName);

        worksheet.getSummaryDataAsync().then(function(sumData){

            // Get the first DataTable for our selected marks (usually there is just one)
            const worksheetData = sumData;

            const doc = new jsPDF();

            const columns = [worksheetData.columns.map(function(column) {
                return {
                    title: column.fieldName
                };
            })];

            // Map our data into the format which the data table component expects it
            const body = worksheetData.data.map(function(row, index) {
                const rowData = row.map(function(cell) {
                    return cell.formattedValue;
                });

                return rowData;
            });

            doc.autoTable({
                head: columns,
                body: body,
            });

            doc.save(worksheetName + '.pdf');
        });
    }

    function getSelectedSheet(worksheetName) {
        if (!worksheetName) {
            worksheetName = tableau.extensions.settings.get('sheet');
        }

        // Go through all the worksheets in the dashboard and find the one we want
        return tableau.extensions.dashboardContent.dashboard.worksheets.find(function(sheet) {
            return sheet.name === worksheetName;
        });
    }
})();