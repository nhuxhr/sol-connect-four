use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Eq, PartialEq, Clone, Copy, Debug)]
pub enum GameState {
    NotStarted,
    InProgress,
    Player0Won,
    Player1Won,
    Draw,
}

#[account]
pub struct Game {
    pub reference: Pubkey,           // The reference to the game
    pub player0: Pubkey,             // Player 0 is the creator of the game
    pub player1: Option<Pubkey>,     // Player 1 is the joiner of the game
    pub winner: Option<Pubkey>,      // The winner of the game
    pub board: [[Option<u8>; 7]; 6], // None = empty, Some(0) = player 0, Some(1) = player 1
    pub state: GameState,            // The current state of the game
    pub prize: u64,                  // The prize for the winner
    pub turn: u8,                    // The current turn
    pub bump: u8,                    // The bump seed
}

impl Game {
    pub const ROWS: usize = 6;
    pub const COLS: usize = 7;
    pub const SIZE: usize = 8 + // Anchor account discriminator
        32 + // reference
        32 + // player0
        (1 + 32) + // player1
        (1 + 32) + // winner
        (((1 + 1) * 7) * 6) + // board
        1 + // state
        8 + // prize
        1 + // turn
        1; // bump

    pub fn check_winner(&self, row: usize, col: usize) -> bool {
        // Get the player index
        let player: u8 = self.board[row][col].unwrap();

        // Check for a horizontal win
        if self.check_horizontal_win(player, row) {
            return true;
        }

        // Check for a vertical win
        if self.check_vertical_win(player, col) {
            return true;
        }

        // Check for a diagonal win (both directions)
        if self.check_diagonal_win(row, col) || self.check_diagonal_win(row, col) {
            return true;
        }

        false
    }

    fn check_horizontal_win(&self, player: u8, row: usize) -> bool {
        for col in 0..Self::COLS - 3 {
            if (0..4).all(|i: usize| self.board[row][col + i] == Some(player)) {
                return true;
            }
        }

        false
    }

    fn check_vertical_win(&self, player: u8, column: usize) -> bool {
        for row in 0..Self::ROWS - 3 {
            if (0..4).all(|i: usize| self.board[row + i][column] == Some(player)) {
                return true;
            }
        }

        false
    }

    fn check_diagonal_win(&self, row: usize, col: usize) -> bool {
        let mut result = false;
        let player: Option<u8> = self.board[row][col];
        let board: &[[Option<u8>; 7]; 6] = &self.board;

        // Check top right direction
        if row >= 3 && col + 3 < board[0].len() {
            result = player == board[row - 1][col + 1]
                && player == board[row - 2][col + 2]
                && player == board[row - 3][col + 3];
        }
        // Check bottom right direction
        if row + 3 < board.len() && col + 3 < board[0].len() {
            result = player == board[row + 1][col + 1]
                && player == board[row + 2][col + 2]
                && player == board[row + 3][col + 3];
        }
        // Check bottom left direction
        if row + 3 < board.len() && col >= 3 {
            result = player == board[row + 1][col - 1]
                && player == board[row + 2][col - 2]
                && player == board[row + 3][col - 3];
        }
        // Check top left direction
        if row >= 3 && col >= 3 {
            result = player == board[row - 1][col - 1]
                && player == board[row - 2][col - 2]
                && player == board[row - 3][col - 3];
        }

        result
    }

    pub fn check_draw(&self) -> bool {
        // Check if the entire board is filled
        self.board
            .iter()
            .all(|row: &[Option<u8>; 7]| row.iter().all(|cell: &Option<u8>| cell.is_some()))
    }
}
