use anchor_lang::prelude::*;

#[error_code]
pub enum SolConnectFourError {
    #[msg("Game started")]
    GameStarted,
    #[msg("Game is full")]
    GameFull,
    #[msg("Invalid player")]
    InvalidPlayer,
    #[msg("Game not started")]
    GameNotStarted,
    #[msg("Game in progress")]
    GameInProgress,
    #[msg("Game over")]
    GameOver,
    #[msg("Not your turn")]
    NotYourTurn,
    #[msg("Invalid row")]
    InvalidRow,
    #[msg("Invalid column")]
    InvalidColumn,
    #[msg("Cell is not empty")]
    CellNotEmpty,
}
