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

    $('#open').on('click',async function () {
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

    $('#save').on('click',async function () {
        let sdb = await dialog.showSaveDialog();
        let jsonData = JSON.stringify(data);
        await fsp.writeFile(sdb.filePath, jsonData)
    })

    $('#grid .cell').on('keyup', function () {

        let rowId = parseInt($(this).attr('row-id'));
        let colId = parseInt($(this).attr('col-id'));

        data[rowId][colId] = $(this).html();
    })

    function init() {
        $('#new').click();
    }

    init();
})