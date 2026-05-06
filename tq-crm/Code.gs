// ── THIRD QUOTE EXTERIORS CRM — Google Apps Script Backend ──
// Paste this entire file into Google Apps Script and deploy as a Web App
// Instructions: Extensions → Apps Script → paste → Save → Deploy → New deployment
// Type: Web App, Execute as: Me, Who has access: Anyone

const SPREADSHEET_ID = '1RX0OnPif17popjx9dL2ybXndO4XFiJN-lKbwKFAMqk4';
const SHEET_NAMES = ['Contacts', 'Estimates', 'Tasks', 'Activity'];

const HEADERS = {
  Contacts:  ['id','first','last','phone','email','city','address','stage','services','source','assign','followup','notes','created'],
  Estimates: ['id','contactId','title','service','amount','status','date','notes','created'],
  Tasks:     ['id','title','contactId','contactName','due','assign','done','created'],
  Activity:  ['id','type','contactId','contactName','date','assign','notes','created'],
};

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const params = e.parameter || {};
    const body = e.postData ? JSON.parse(e.postData.contents || '{}') : {};
    const action = params.action || body.action;
    const sheet = params.sheet || body.sheet;

    let result;
    switch (action) {
      case 'getAll':    result = getAll(sheet); break;
      case 'upsert':    result = upsert(sheet, body.record); break;
      case 'delete':    result = deleteRecord(sheet, body.id); break;
      case 'sync':      result = syncAll(body.data); break;
      case 'ping':      result = { ok: true, ts: new Date().toISOString() }; break;
      default:          result = { error: 'Unknown action: ' + action };
    }
    return jsonResponse(result);
  } catch(err) {
    return jsonResponse({ error: err.message });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheet(name) {
  const ss = getSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    // Write headers
    const headers = HEADERS[name];
    if (headers) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sh;
}

function ensureHeaders(sh, name) {
  const headers = HEADERS[name];
  if (!headers) return;
  const firstRow = sh.getRange(1, 1, 1, headers.length).getValues()[0];
  const isEmpty = firstRow.every(v => v === '' || v === null || v === undefined);
  if (isEmpty) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

// Read all rows from a sheet, return as array of objects
function getAll(sheetName) {
  if (!SHEET_NAMES.includes(sheetName)) return { error: 'Invalid sheet: ' + sheetName };
  const sh = getSheet(sheetName);
  ensureHeaders(sh, sheetName);
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return { records: [] };
  const headers = data[0].map(h => h.toString().trim());
  const records = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      // Parse services array
      if (h === 'services' && typeof val === 'string') {
        try { val = JSON.parse(val); } catch(e) { val = val ? val.split(';').map(s => s.trim()).filter(Boolean) : []; }
      }
      // Parse done boolean
      if (h === 'done') val = val === true || val === 'true' || val === 'TRUE';
      obj[h] = val === null || val === undefined ? '' : val;
    });
    return obj;
  }).filter(r => r.id); // skip empty rows
  return { records };
}

// Insert or update a record
function upsert(sheetName, record) {
  if (!SHEET_NAMES.includes(sheetName)) return { error: 'Invalid sheet' };
  if (!record || !record.id) return { error: 'Missing record or id' };
  const sh = getSheet(sheetName);
  ensureHeaders(sh, sheetName);
  const headers = HEADERS[sheetName];
  const data = sh.getDataRange().getValues();

  // Serialize services array
  const row = headers.map(h => {
    let val = record[h];
    if (h === 'services' && Array.isArray(val)) val = JSON.stringify(val);
    if (val === null || val === undefined) val = '';
    return val;
  });

  // Find existing row by id
  let found = false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === record.id) {
      sh.getRange(i + 1, 1, 1, row.length).setValues([row]);
      found = true;
      break;
    }
  }
  if (!found) {
    sh.appendRow(row);
  }
  return { ok: true, id: record.id };
}

// Delete a record by id
function deleteRecord(sheetName, id) {
  if (!SHEET_NAMES.includes(sheetName)) return { error: 'Invalid sheet' };
  if (!id) return { error: 'Missing id' };
  const sh = getSheet(sheetName);
  const data = sh.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === id) {
      sh.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { ok: false, message: 'Record not found' };
}

// Full sync — replace all data in all sheets
function syncAll(data) {
  if (!data) return { error: 'No data provided' };
  const results = {};
  SHEET_NAMES.forEach(name => {
    if (!data[name]) return;
    const sh = getSheet(name);
    const headers = HEADERS[name];
    // Clear existing data (keep header row)
    const lastRow = sh.getLastRow();
    if (lastRow > 1) sh.deleteRows(2, lastRow - 1);
    // Write headers
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    // Write records
    const records = data[name];
    if (records.length > 0) {
      const rows = records.map(r => headers.map(h => {
        let val = r[h];
        if (h === 'services' && Array.isArray(val)) val = JSON.stringify(val);
        if (h === 'done') val = val ? 'true' : 'false';
        return val === null || val === undefined ? '' : val;
      }));
      sh.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
    results[name] = records.length;
  });
  return { ok: true, counts: results };
}
