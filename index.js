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
                    formula: '',
                    upstream: [],
                    downstream: []
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

    $('#grid .cell').on('click', function (e) {

        // catch last clicked element
        lsc = this;
        let cellAddress = getCellAddress(this);

        //update formula bar values
        $('#text-input').val(cellAddress);
        $('#formula-input').val(getCell(this).formula);

        // multiple cells selected
        if (!e.ctrlKey)
            $('#grid .cell').removeClass('selected');
        $(this).addClass('selected');
    })

    $('#grid .cell').on('blur', function () {

        let cell = getCell(this);

        //if cell value not changed do nothing
        if (cell.value == $(this).html())
            return;

        let { rid, cid } = getIndices(this);

        // delete formula if content changed
        if (cell.formula)
            deleteFormula(this);

        //update value and downstream values
        updateCell(rid, cid, $(this).html(), false);
    })

    $('#formula-input').on('blur', function () {
        let cell = getCell(lsc);
        cell.formula = $(this).val();
        let { rid, cid } = getIndices(lsc);
        
        //delete formula if formula deleted
        if (!cell.formula) {
            deleteFormula(cell);
        }

        //set formula
        setFormula(lsc, $(this).val());
        //evaluate value
        let nval = evaluate(cell);
        // update cell  
        updateCell(rid, cid, nval, true);
    })

    function init() {
        $('#new').click();
    }

    function deleteFormula(cellObject) {

        //get cell details
        let cell = getCell(cellObject);
        let {rid, cid} = getIndices(cellObject);

        //empty cell formula
        cell.formula = '';
        $('#formula-input').val('');

        //clean upstream objects
        for (let i = 0; i < cell.upstream.length; i++) {
            let cuso = cell.upstream[i];
            let uso = data[cuso.rid][cuso.cid];

            //get index in upstream's downstream
            let idx = uso.downstream.findIndex(function (v) {
                return v.rid == rid && v.cid == cid;
            })

            uso.downstream.splice(idx, 1);
        }

        //clean myself
        cell.upstream = [];

    }

    function evaluate(cell) {

        let formula = cell.formula;

        for (let i = 0; i < cell.upstream.length; i++) {
            let cuso = cell.upstream[i];
            let uso = data[cuso.rid][cuso.cid];

            //get cell address
            let colAddress = String.fromCharCode(cuso.cid + 65);
            let cellAddress = colAddress + (cuso.rid + 1);

            //replace cell formula
            formula = formula.replace(cellAddress, uso.value);
        }

        return eval(formula);
    }

    function setFormula(cellObject, formula) {

        //clean string
        formula.replace('(', '').replace(')', '');
        let formulaComponents = formula.split(' ');
        let cell = getCell(cellObject);

        for (let i = 0; i < formulaComponents.length; i++) {
            let charCodeAt0 = formulaComponents[i].charCodeAt(0);

            //if object is a valid address
            if (charCodeAt0 >= 65 && charCodeAt0 <= 90) {
                let upstreamObjAddress = getIndicesFromAddress(formulaComponents[i]);
                let myAddress = getIndices(cellObject);

                //set my upstream
                cell.upstream.push({
                    rid: upstreamObjAddress.rid,
                    cid: upstreamObjAddress.cid
                })

                //set upstream's downstream
                data[upstreamObjAddress.rid][upstreamObjAddress.cid].downstream.push({
                    rid: myAddress.rid,
                    cid: myAddress.cid
                })
            }
        }
    }

    function updateCell(rid, cid, nval, render) {

        //update my value
        let cell = data[rid][cid];
        cell.value = nval;

        //update cell value in UI
        if (render == true) {
            $(`#grid .cell[row-id=${rid}][col-id=${cid}]`).html(nval);
        }

        //recursive calls
        for (let i = 0; i < cell.downstream.length; i++) {
            let cdso = cell.downstream[i];
            let dso = data[cdso.rid][cdso.cid];

            let dsonVal = evaluate(dso);
            updateCell(cdso.rid, cdso.cid, dsonVal, true);
        }
    }

    //get indices from jquery object
    function getIndices(cellObject) {
        let rid = parseInt($(cellObject).attr('row-id'));
        let cid = parseInt($(cellObject).attr('col-id'));

        return {
            rid: rid,
            cid: cid
        }
    }

    //get address from jquery object
    function getCellAddress(cellObject) {

        let { rid, cid } = getIndices(cellObject);
        let colAddress = String.fromCharCode(cid + 65);
        let rv = colAddress + (rid + 1);
        return rv;
    }

    //get cell object from jquery object
    function getCell(cellObject) {
        let { rid, cid } = getIndices(cellObject);
        return data[rid][cid];
    }

    //get indices from cell address string
    function getIndicesFromAddress(cellAddress) {
        let rid = parseInt(cellAddress.substr(1));
        let cid = cellAddress.charCodeAt(0) - 65;

        return {
            rid: rid - 1,
            cid: cid
        }
    }

    init();
})