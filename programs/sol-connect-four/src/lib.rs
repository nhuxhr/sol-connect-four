use anchor_lang::{prelude::*, system_program};
use std::ops::{Div, Mul};

use account::*;
use errors::*;
use state::*;

pub mod account;
pub mod errors;
pub mod state;

declare_id!("CfWyF5tC289SxRsAqzU3jThoFnyWeQPRR5ZCkHF83T7S");

#[program]
pub mod sol_connect_four {
    use super::*;

    pub fn new_game(ctx: Context<NewGame>, reference: Pubkey, lamports: u64) -> Result<()> {
        let signer: &Signer<'_> = &ctx.accounts.signer;
        let game: &mut Account<'_, Game> = &mut ctx.accounts.game;

        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: signer.to_account_info(),
                    to: game.to_account_info(),
                },
            ),
            lamports,
        )?;

        game.reference = reference;
        game.player0 = *signer.key;
        game.player1 = None;
        game.winner = None;
        game.board = [[None; 7]; 6];
        game.state = GameState::NotStarted;
        game.prize = lamports.mul(2);
        game.turn = 0;
        game.bump = ctx.bumps.game;

        Ok(())
    }

    pub fn cancel_game(ctx: Context<CancelGame>) -> Result<()> {
        let game: &mut Account<'_, Game> = &mut ctx.accounts.game;

        // Check if the game has not started
        require!(
            game.state == GameState::NotStarted,
            SolConnectFourError::GameStarted
        );

        Ok(())
    }

    pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
        let signer: &Signer<'_> = &ctx.accounts.signer;
        let game: &mut Account<'_, Game> = &mut ctx.accounts.game;

        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: signer.to_account_info(),
                    to: game.to_account_info(),
                },
            ),
            game.prize.div(2),
        )?;

        game.player1 = Some(*signer.key);
        game.state = GameState::InProgress;

        Ok(())
    }

    pub fn play(ctx: Context<Play>, col: u8) -> Result<()> {
        let signer: &Signer<'_> = &ctx.accounts.signer;
        let opponent: &UncheckedAccount<'_> = &ctx.accounts.opponent;
        let game: &mut Account<'_, Game> = &mut ctx.accounts.game;

        // Check if the game is not over
        require!(
            ![
                GameState::Player0Won,
                GameState::Player1Won,
                GameState::Draw
            ]
            .contains(&game.state),
            SolConnectFourError::GameOver
        );

        // Check if the game is in progress
        require!(
            game.state == GameState::InProgress,
            SolConnectFourError::GameNotStarted
        );

        let players: [Pubkey; 2] = [game.player0, game.player1.unwrap()];
        let opponent_player: Pubkey = if game.player0 == *signer.key {
            game.player1.unwrap()
        } else {
            game.player0
        };

        // Check if signer is a player
        require!(
            players.contains(signer.key) && players.contains(opponent.key),
            SolConnectFourError::InvalidPlayer
        );

        // Check if the opponent is a player
        require_keys_eq!(
            *opponent.key,
            opponent_player,
            SolConnectFourError::InvalidPlayer
        );

        // Check if it's the player's turn
        let turn: u8 = if game.player0 == *signer.key { 0 } else { 1 };
        require_eq!(game.turn, turn, SolConnectFourError::NotYourTurn);

        // Check if col is valid
        require_gt!(Game::COLS as u8, col, SolConnectFourError::InvalidColumn);

        // Find the empty row in the selected column
        let mut row: Option<usize> = None;
        for (i, r) in game.board.iter().rev().enumerate() {
            if r[col as usize].is_none() {
                row = Some(Game::ROWS - 1 - i);
                break;
            }
        }

        // Check if the row is valid
        require!(row.is_some(), SolConnectFourError::InvalidRow);

        // Get the row
        let row: usize = row.unwrap();

        // Check if the cell is empty
        require!(
            game.board[row][col as usize].is_none(),
            SolConnectFourError::CellNotEmpty
        );

        // Set the cell
        game.board[row][col as usize] = Some(game.turn);

        // Check for a winning condition
        if game.check_winner(row, col as usize) {
            // Winner
            game.winner = Some(*signer.key);
            game.state = match *signer.key {
                player0 if player0 == game.player0 => GameState::Player0Won,
                player1 if player1 == game.player1.unwrap() => GameState::Player1Won,
                _ => unreachable!(),
            };

            // Transfer the prize to the winner
            game.sub_lamports(game.prize)?;
            signer.add_lamports(game.prize)?;
        } else if game.check_draw() {
            // Draw
            game.state = GameState::Draw;

            // Transfer the prize to both players
            let prize: u64 = game.prize.div(2);
            game.sub_lamports(game.prize)?;
            signer.add_lamports(prize)?;
            opponent.add_lamports(prize)?;
        } else {
            // Change the turn
            game.turn = match game.turn {
                0 => 1,
                1 => 0,
                _ => unreachable!(),
            };
        }

        Ok(())
    }
}
