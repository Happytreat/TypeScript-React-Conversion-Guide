import * as React from "react"
import { CellValue, GameState, playerCell, aiCell } from "./constants"

interface BoardState {
    gameState: GameState;
    cells: CellValue[];
}

export class Board extends React.Component<{}, BoardState> {

    constructor(props: {}) {
        super(props);        
        this.state = this.getInitState();
    } 
    
    getInitState() { 
        const cells: CellValue[] = Array.apply(null, Array(9)).map(() => "");
        return {cells, gameState: "" as GameState}
    }

    resetState() {
        this.setState(this.getInitState());
    }
     
    componentDidMount() {
        window.addEventListener("restart", () => this.resetState());
    }

    componentWillUnmount() {
        window.removeEventListener("restart", () => this.resetState());
    }
    
    // Fire a global event notifying GameState changes
    handleGameStateChange(newState: String) {
        var event = new CustomEvent("gameStateChange", { "detail": this.state.gameState });
        event.initEvent("gameStateChange", false, true); 
        window.dispatchEvent(event);
    }   
    
    // check the game state - use the latest move
    checkGameState(cells: CellValue[], latestPos: number, latestVal: CellValue): GameState {
        if (this.state.gameState !== "") {
            return this.state.gameState;
        }
        
        // check row
        let result = this.check3Cells(cells, 3 * Math.floor(latestPos / 3), 
            3 * Math.floor(latestPos / 3) + 1, 3 * Math.floor(latestPos/3) + 2);
        if (result) {
            return result; 
        }
        
        // check col
        result = this.check3Cells(cells, latestPos % 3, latestPos % 3 + 3, latestPos % 3 + 6);
        if (result) {
            return result;
        }
        
        // check diag
        result = this.check3Cells(cells, 0, 4, 8);
        if (result) {
            return result;
        }
        result = this.check3Cells(cells, 2, 4, 6);
        if (result) {
            return result;
        }
        
        // check draw - if all cells are filled
        if (this.findAllEmptyCells(cells).length === 0) {
            return "Draw";          
        }
                
        return "";
    }
    
    // check if 3 cells have same non-empty val - return the winner state; otherwise undefined 
    check3Cells(cells: CellValue[], pos0: number, pos1: number, pos2: number): GameState {
        if (cells[pos0] === cells[pos1] &&
            cells[pos1] === cells[pos2] &&
            cells[pos0] !== "") {
            if (cells[pos0] === "X") {
                return "X Wins!";
            }
            return "O Wins!";
        }
        else {
            return "";
        }
    }
    
    // list all empty cell positions
    findAllEmptyCells(cells: CellValue[]): number[] {
        return cells.map((v, i) => { 
            if (v === "") {
                return i;
            }
            else { 
                return -1;
            }
        }).filter(v => { return v !== -1 });        
    }
    
    // make a move
    move(pos: number, val: CellValue, callback?: () => void) {
        if (this.state.gameState === "" &&
            this.state.cells[pos] === "") {
            let newCells = this.state.cells.slice();
            newCells[pos] = val;
            let oldState = this.state.gameState;
            this.setState({cells: newCells, gameState: this.checkGameState(newCells, pos, val)}, () => {
                if (this.state.gameState !== oldState) {
                    this.handleGameStateChange(this.state.gameState);
                }
                if (callback) {        
                    callback.call(this);
                }
            });                 
        }
    }

    // handle a new move from player
    handleNewPlayerMove(pos: number) {
        this.move(pos, playerCell, () => {
            // AI make a random move following player's move
            let emptyCells = this.findAllEmptyCells(this.state.cells);
            let pos = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.move(pos, aiCell);
        });
    }
   
    render() {
        var cells = this.state.cells.map((v, i) => {
            return (
                <Cell key={i} pos={i} val={v} handleMove={() => this.handleNewPlayerMove(i)} />
            )           
        } );
        
        return ( 
            <div className="board"> 
                {cells}
            </div> 
        )
    }
}

interface CellProps extends React.Props<any> {
    pos: number;
    val: CellValue;   
    handleMove: () => void;
}

class Cell extends React.Component<CellProps, {}> {

    // position of cell to className
    posToClassName(pos: number) {
        let className = "cell";
        switch (Math.floor(pos / 3)) {
            case 0: 
                className += " top";
                break;
            case 2: 
                className += " bottom";
                break;
            default: break;             
        }
        switch (pos % 3) {    
            case 0: 
                className += " left";
                break;
            case 2: 
                className += " right";
                break;
            default: 
                break;             
        }
        return className;
    }

    handleClick(e: React.MouseEvent<HTMLDivElement>) {
        this.props.handleMove();
    }

    render() {
        let name = this.props.val;
        if (this.props.val === "") {
            name = "";
        }
        return <div className={this.posToClassName(this.props.pos)} onClick={e => this.handleClick(e)}> 
            <div className={name}> {this.props.val} </div>
        </div>
    }
}
