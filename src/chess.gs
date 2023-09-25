//TODO: checkmate check, castling
//CHECKMATE IDEA: trace which piece is attacking the king, then check if any white piece is capable of stopping the path/taking the attacker

const COLOUR = {
  NONE: 0,
  WHITE: 1,
  BLACK: 2
};

const RED = "#ff5252";
const INVERTED_SHADE = {
  "#eeeed5": "#bebeaa",
  "#7d945d": "#64764a",
  "#bebeaa": "#eeeed5",
  "#64764a": "#7d945d"
};

const getColour = id => id !== 0 ? (id >= 7 ? COLOUR.WHITE : COLOUR.BLACK) : COLOUR.NONE;


class Chess {
  constructor() {
    this.properties = PropertiesService.getDocumentProperties();
    this.sheet = SpreadsheetApp.getActive().getSheetByName("game");

    this.getProps();

    if (this.board === null) {
      this.board = [...Array(8)].map(() => [...Array(8)].map(() => 0));

      this.board[0] = [1,2,3,4,5,3,2,1];
      this.board[1] = [6,6,6,6,6,6,6,6];

      this.board[6] = [7,7,7,7,7,7,7,7];
      this.board[7] = [8,9,10,11,12,10,9,8];


      this.kings = {
        1: [7, 4, true, true],
        2: [0, 4, true, true]
      };

      this.active = COLOUR.WHITE;

      this.source = null;
      this.dest = null;
    }

    this.updateProps();
    return this;
  }

  selected(tile) {
    console.log(tile)
    let piece = this.board[tile[0] - 1]?.[tile[1] - 2],
        colour = getColour(piece);
    if (piece === null) return;


    if (this.source === null && this.dest === null && piece !== 0) {
      if (colour !== this.active) return void this.flashCell(tile);

      this.shadeCell(tile);
      this.source = tile;
    } else if (this.source !== null && this.dest === null) {
      if (colour === getColour(this.board[this.source[0] - 1][this.source[1] - 2])) {
        this.shadeCell(this.source);
        this.shadeCell(tile);
        
        this.source = tile;
        return;
      }

      this.dest = tile;
      this.shadeCell(this.source);


      if(this.movePiece()) {
        this.active = (this.active - 1 ^ 1) + 1;
      }

      this.source = null;
      this.dest = null;
    }
  }

  getPiece(position) {
    let id = this.board[position[0]][position[1]];

    let piece = {
      colour: getColour(id),
      id,
      position,
    };

    return piece;
  }

  movePiece() {
    let source = this.getPiece([this.source[0] - 1, this.source[1] - 2]),
        dest = this.getPiece([this.dest[0] - 1, this.dest[1] - 2]);

    if(!this.checkMove(source, dest)) return false;


    this.board[this.dest[0] - 1][this.dest[1] - 2] = source.id;
    this.board[this.source[0] - 1][this.source[1] - 2] = 0;

    if(source.id === 5 || source.id === 12) this.kings[source.colour] = dest.position;

    this.moveCell(this.source, this.dest);

    return true;
  }


  /*
    Movement checks
  */

  checkMove(source, dest) {
    if (source.colour === dest.colour) return false;
    
    let diff_v = source.position[0] - dest.position[0],
        diff_h = source.position[1] - dest.position[1];

    switch (source.id) {
      case 0: return false;
      case 6:
      case 7:
        let start = 6;
        if (source.id === 6) diff_v = -diff_v, diff_h = -diff_h, start = 1;

        if (!((diff_v === 1 && diff_h === 0 && dest.id === 0) ||
              (diff_v === 1 && Math.abs(diff_h) === 1 && dest.id !== 0) ||
              (diff_v === 2 && diff_h === 0 && dest.id === 0 && this.board[start === 1 ? 2 : 5][dest.position[1]] === 0 && source.position[0] === start))) return false;

        break;
      case 1:
      case 8:
        if (!this.checkPathStraight(source, dest)) return false;

        break;
      case 3:
      case 10:
        if (!this.checkPathDiagonal(source, dest)) return false;
      
        break;
      case 2:
      case 9:
        if (!((Math.abs(diff_v) === 2 && Math.abs(diff_h) === 1) || (Math.abs(diff_v) === 1 && Math.abs(diff_h) === 2))) return false;

        break;
      case 4:
      case 11:
        if (!this.checkPathDiagonal(source, dest) && !this.checkPathStraight(source, dest)) return false;

        break;
      case 5:
      case 12:
        if (Math.abs(diff_v) > 1 || Math.abs(diff_h) > 1) return false;
        this.checkSafe(dest, source.colour);

        break;
    }

    return true;
  }

  checkSafe(piece, colour = piece.colour) {
    const is_black = colour === COLOUR.BLACK;
    const OPPONENT = {
      PAWN: is_black ? 7 : 6,
      QUEEN: is_black ? 11 : 4,
      ROOK: is_black ? 8 : 1,
      BISHOP: is_black ? 10 : 3,
      KNIGHT: is_black ? 9 : 2,
      KING: is_black ? 12 : 5
    };


    // 6, 7
    if (this.board[piece.position[0] + (is_black ? 1 : -1)][piece.position[1] + 1] === OPPONENT.PAWN ||
        this.board[piece.position[0] + (is_black ? 1 : -1)][piece.position[1] - 1] === OPPONENT.PAWN) return false;


    // 1, 8 + 4, 11
    for (let x = 0; x < 8; x++) {
      let piece_v = this.board[x][piece.position[1]],
          piece_h = this.board[piece.position[0]][x];

      if ((piece_v === OPPONENT.ROOK || piece_v === OPPONENT.QUEEN) && this.checkPathStraight(this.getPiece([x, piece.position[1]]), piece)) return false; 
      if ((piece_h === OPPONENT.ROOK || piece_h === OPPONENT.QUEEN) && this.checkPathStraight(this.getPiece([piece.position[0], x]), piece)) return false;
    }


    // 3, 10 + 4, 11
    for (let o = 1; o <= (piece.position[0] < piece.position[1] ? piece.position[0] : piece.position[1]); o++) {
      let diag = this.board[piece.position[0] - o][piece.position[1] - o];
      if ((diag === OPPONENT.BISHOP || diag === OPPONENT.QUEEN) && this.checkPathDiagonal(this.getPiece([piece.position[0] - o, piece.position[1] - o]), piece)) return false;
    }

    for (let o = 1; o <= (7 - piece.position[0] < 7 - piece.position[1] ? 7 - piece.position[0] : 7 - piece.position[1]); o++) {
      let diag = this.board[piece.position[0] + o][piece.position[1] + o];
      if ((diag === OPPONENT.BISHOP || diag === OPPONENT.QUEEN) && this.checkPathDiagonal(this.getPiece([piece.position[0] + o, piece.position[1] + o]), piece)) return false;
    }

    for (let o = 1; o <= (7 - piece.position[0] < piece.position[1] ? 7 - piece.position[0] : piece.position[1]); o++) {
      let diag = this.board[piece.position[0] + o][piece.position[1] - o];
      if ((diag === OPPONENT.BISHOP || diag === OPPONENT.QUEEN) && this.checkPathDiagonal(this.getPiece([piece.position[0] + o, piece.position[1] - o]), piece)) return false; 
    }

    for (let o = 1; o <= (piece.position[0] < 7 - piece.position[1] ? piece.position[0] : 7 - piece.position[1]); o++) {
      let diag = this.board[piece.position[0] - o][piece.position[1] + o];
      if ((diag === OPPONENT.BISHOP || diag === OPPONENT.QUEEN) && this.checkPathDiagonal(this.getPiece([piece.position[0] - o, piece.position[1] + o]), piece)) return false; 
    }


    // 2, 9
    for (let x of [2, -2]) {
      for (let y of [1, -1]) {
        if (this.board[piece.position[0] + x]?.[piece.position[1] + y] === OPPONENT.KNIGHT) return false;
        if (this.board[piece.position[0] + y]?.[piece.position[1] + x] === OPPONENT.KNIGHT) return false;
      }
    }


    // 5, 12
    for (let x of [1, -1]) {
      for (let y of [1, -1]) {
        if (this.board[piece.position[0] + x]?.[piece.position[1] + y] === OPPONENT.KING) return false;
        if (this.board[piece.position[0] + y]?.[piece.position[1] + x] === OPPONENT.KING) return false;
      }
    }


    // console.time("unefficient");
    // let return_ = true;
    // let source = piece;
    // for (let x = 0; x < 8; x++) {
    //   for (let y = 0; y < 8; y++) {
    //     let piece = this.getPiece([x, y]);

    //     if (piece.colour === source.colour) continue;

    //     if (this.checkMove(piece, source)) {
    //       let cell = this.sheet.getRange(piece.position[0] + 1, piece.position[1] + 2),
    //           bg = cell.getBackground();

    //       cell.setBackground("red");
    //       SpreadsheetApp.flush();
    //       cell.setBackground(bg);

    //       return_=false//return false;
    //     }
    //   }
    // }
    // return return_;
    // console.timeEnd("unefficient");

    return true;
  }

  checkLegalMoves(piece) {
    this.board[piece.position[0]][piece.position[1]] = 0; //TODO: verify this actually works like this lmao
    let check = this.checkSafe(this.getPiece(this.kings[piece.colour]), piece.colour);
    this.board[piece.position[0]][piece.position[1]] = piece.id;

    if (!check) return false;


    switch (piece.id) {
      case 0: return false;
      case 6:
      case 7:
        let front_row = this.board[piece.position[0] + (source.id === 6 ? 1 : -1)],
            opponent = (piece.colour - 1 ^ 1) + 1;

        if (!(front_row[piece.position[1]] === 0 || getColour(front_row[piece.position[1] - 1]) === opponent || getColour(front_row[piece.position[1] + 1])) === opponent) return false;

        break;
      case 5:
      case 12:
        for (let x of [1, -1]) {
          for (let y of [1, -1]) {
            let check_piece = this.board[piece.position[0] + y]?.[piece.position[1] + x];
            if (check_piece === null) continue;
            else if (getColour(check_piece) === piece.colour) continue;
            else if (this.checkSafe(this.getPiece([piece.position[0] + y, piece.position[1] + x]))) return true;
          }
        }

        break;
    }

    return true;
  }


  /*
    Path methods
  */

  checkPathStraight(piece1, piece2) {
    let axis = 0, startpos = 0, endpos = 0;
  
    if (piece1.position[0] === piece2.position[0]) axis = 1;
    else if (piece1.position[1] === piece2.position[1]) axis = 0
    else return false;

    if (piece1.position[axis] > piece2.position[axis]) startpos = piece2.position[axis], endpos = piece1.position[axis];
    else startpos = piece1.position[axis], endpos = piece2.position[axis];


    if (axis === 0) {
      for (let c = startpos + 1; c < endpos; c++) if(this.board[c][piece1.position[axis ^ 1]] !== 0) return false;
    } else {
      for (let c = startpos + 1; c < endpos; c++) if(this.board[piece1.position[axis ^ 1]][c] !== 0) return false;
    }

    return true;
  }

  checkPathDiagonal(piece1, piece2) {
    let diff_v = piece1.position[0] - piece2.position[0],
        diff_h = piece1.position[1] - piece2.position[1];

    if (Math.abs(diff_v) !== Math.abs(diff_h)) return false;

    let v_inc = piece1.position[0] > piece2.position[0] ? -1 : 1,
        h_inc = piece1.position[1] > piece2.position[1] ? -1 : 1;

    let check_pos = [piece1.position[0] + v_inc, piece1.position[1] + h_inc];
    while (check_pos[0] !== piece2.position[0] && check_pos[1] !== piece2.position[1]) {
      if(this.board[check_pos[0]][check_pos[1]] !== 0) return false;

      check_pos[0] += v_inc;
      check_pos[1] += h_inc;
    }

    return true;
  }


  /*
    Cell methods
  */

  shadeCell(cell) {
    let range = this.sheet.getRange(...cell);
        range.setBackground(INVERTED_SHADE[range.getBackground()]);
        
    SpreadsheetApp.flush();
  }

  flashKing(colour) {
    this.flashCell([this.kings[colour][0] + 1, this.kings[colour][1] + 2]);
  }

  flashCell(cell) {
    let range = this.sheet.getRange(...cell),
        bg = range.getBackground();
    
    range.setBackground(RED);
    SpreadsheetApp.flush();
    Utilities.sleep(500);
    range.setBackground(bg);
    SpreadsheetApp.flush();
  }

  moveCell(source, dest) {
    let range = this.sheet.getRange(source[0], source[1]);
    range.copyTo(this.sheet.getRange(dest[0], dest[1]), { contentsOnly: true });
    range.clearContent();

    SpreadsheetApp.flush();
  }


  /*
    Property methods
  */

  updateProps() {
    this.properties.setProperty("board", JSON.stringify(this.board));
    this.properties.setProperty("source", JSON.stringify(this.source));
    this.properties.setProperty("dest", JSON.stringify(this.dest));
    this.properties.setProperty("kings", JSON.stringify(this.kings));

    this.properties.setProperty("active", JSON.stringify(this.active));
  }

  getProps() {
    this.board = JSON.parse(this.properties.getProperty("board"));
    this.source = JSON.parse(this.properties.getProperty("source"));
    this.dest = JSON.parse(this.properties.getProperty("dest"));
    this.kings = JSON.parse(this.properties.getProperty("kings"));

    this.active = JSON.parse(this.properties.getProperty("active"));
  }

  clearProps() {
    this.properties.deleteAllProperties();
  }
}