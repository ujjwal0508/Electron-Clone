const $ = require('jquery');
const fsp = require('fs').promises
const dialog = require('electron').remote.dialog

$(document).ready(function () {

    let data = [];
    let lsc;

    $('.menu-bar-item').on('click', function () {
        $('.menu-bar-item').removeClass('selected');
        $(this).addClass('selected');
    })

    $('#new').click(function () {

        data = [];
        $('#grid').find('.row').each(function () {
            let row = [];
            $(this).find('.cell').each(function () {
                let cell = {
                    value: '',
                    formula: ''
                };

                $(this).html(cell.value);
                row.push(cell);
            })
            data.push(row);
        })

        $('#grid .cell').eq(0).click();
    })

    $('#open').on('click', async function () {
        let odb = await dialog.showOpenDialog();
        let jsonData = await fsp.readFile(odb.filePaths[0]);
        data = JSON.parse(jsonData);

        $('#grid').find('.row').each(function () {
            $(this).find('.cell').each(function () {

                let cell = getCell(this);
                $(this).html(cell.value);
            })
        })

    })

    $('#save').on('click', async function () {
        let sdb = await dialog.showSaveDialog();
        let jsonData = JSON.stringify(data);
        await fsp.writeFile(sdb.filePath, jsonData)
    })

    $('#grid .cell').on('keyup', function () {

        let cell = getCell(this);
        cell.value = $(this).html();
    })

    function getIndices(cellObject) {
        let rowId = parseInt($(cellObject).attr('row-id'));
        let colId = parseInt($(cellObject).attr('col-id'));

        return {
            rowId: rowId,
            colId: colId
        }
    }

    function getCellAddress(cellObject) {

        let { rowId, colId } = getIndices(cellObject);
        let colAddress = String.fromCharCode(colId + 65);
        return colAddress + (rowId + 1);
    }

    function getCell(cellObject) {
        let { rowId, colId } = getIndices(cellObject);
        return data[rowId][colId];
    }

    function init() {
        $('#new').click();
    }

    $('#grid .cell').on('click', function (e) {

        lsc = this;
        let cellAddress = getCellAddress(this);
        $('#text-input').val(cellAddress);

        $('#formula-input').val(getCell(this).formula);

        if (!e.ctrlKey)
            $('#grid .cell').removeClass('selected');
        $(this).addClass('selected');
    })

    $('#formula-input').on('blur', function(){
        let cell = getCell(lsc);
        cell.formula = $(this).val();
    })

    init();
})