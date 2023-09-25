function onOpen() {
  new Chess();
  // chess.clearProps();

  // SpreadsheetApp.getActive().getSheetByName("layout").getRange("A1:I8").copyTo(SpreadsheetApp.getActive().getSheetByName("game").getRange("A1:I8"));
  // SpreadsheetApp.flush();

  SpreadsheetApp.getUi()
    .createMenu('chess')
    .addItem('new game', 'newGame')
    .addItem('tests', 'tests')
    .addToUi();
}

function newGame() {
  const chess = new Chess();
  chess.clearProps();

  SpreadsheetApp.getActive().getSheetByName("layout").getRange("A1:I8").copyTo(SpreadsheetApp.getActive().getSheetByName("game").getRange("A1:I8"));
  SpreadsheetApp.flush();
}


function tests() {
  let tests = SpreadsheetApp.getActive().getSheets().map(s => s.getName()).filter(s => s.startsWith("test"));
  let template = HtmlService.createTemplate(`${tests.map(v => `<button onclick="google.script.run.test('${v}')">${v}</button>`).join("</br>")}`);
  SpreadsheetApp.getUi().showSidebar(template.evaluate());
}

function test(test) {
  const chess = new Chess();
  chess.clearProps();

  SpreadsheetApp.getActive().getSheetByName(test).getRange("A1:I8").copyTo(SpreadsheetApp.getActive().getSheetByName("game").getRange("A1:I8"));
  SpreadsheetApp.flush();
}


function onSelectionChange(e) {
  if (e.range.getColumn() === 1) return;
  else if (SpreadsheetApp.getActiveSheet().getName() !== "game") return;
  
  const chess = new Chess();
  chess.selected([e.range.getRow(), e.range.getColumn()]);
  chess.updateProps();
}