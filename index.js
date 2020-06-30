const $ = require('jquery');
const fsp = require('fs').promises
const dialog = require('electron').remote.dialog

$(document).ready(function () {

    let data = [];

    $('.menu-bar-item').on('click', function () {
        $('.menu-bar-item').removeClass('selected');
        $(this).addClass('selected');
    })

    $('#new').click(function () {

        data = [];
        $('#grid').find('.row').each(function () {
            let row = [];
            $(this).find('.cell').each(function () {
                let cell = '';

                $(this).html('');
                row.push(cell);
            })
            data.push(row);
        })
    })

    $('#open').on('click', async function () {
        let odb = await dialog.showOpenDialog();
        let jsonData = await fsp.readFile(odb.filePaths[0]);
        data = JSON.parse(jsonData);

        $('#grid').find('.row').each(function () {
            $(this).find('.cell').each(function () {

                let rowId = parseInt($(this).attr('row-id'));
                let colId = parseInt($(this).attr('col-id'));

                $(this).html(data[rowId][colId]);
            })
        })

    })

    $('#save').on('click', async function () {
        let sdb = await dialog.showSaveDialog();
        let jsonData = JSON.stringify(data);
        await fsp.writeFile(sdb.filePath, jsonData)
    })

    $('#grid .cell').on('keyup', function () {

        let { rowId, colId } = getIndices(this);
        data[rowId][colId] = $(this).html();
    })

    function getIndices(cell) {
        let rowId = parseInt($(cell).attr('row-id'));
        let colId = parseInt($(cell).attr('col-id'));

        return {
            rowId: rowId,
            colId: colId
        }
    }

    function init() {
        $('#new').click();
    }

    $('#grid .cell').on('click', function () {

        let cellAddress = getCellAddress(this);
        $('#text-input').val(cellAddress);

    })

    function getCellAddress(cell) {

        let { rowId, colId } = getIndices(cell);
        let colAddress = String.fromCharCode(colId + 65);
        return colAddress + (rowId + 1);
    }

    init();
})