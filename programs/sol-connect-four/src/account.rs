use anchor_lang::prelude::*;

use crate::errors::*;
use crate::state::Game;

#[derive(Accounts)]
#[instruction(reference: Pubkey)]
pub struct NewGame<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        space = Game::SIZE,
        seeds = [b"game", reference.as_ref()],
        bump,
    )]
    pub game: Account<'info, Game>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelGame<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        mut,
        constraint = game.player0 == *signer.key @ SolConnectFourError::InvalidPlayer,
        close = signer
    )]
    pub game: Account<'info, Game>,
}

#[derive(Accounts)]
pub struct JoinGame<'info> {
    #[account(
        mut,
        constraint = game.player1.is_none() @ SolConnectFourError::GameFull,
        constraint = game.player0 != *signer.key @ SolConnectFourError::InvalidPlayer,
    )]
    pub signer: Signer<'info>,
    #[account(mut)]
    pub game: Account<'info, Game>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Play<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(mut)]
    /// CHECK: This account will be checked manually
    pub opponent: UncheckedAccount<'info>,
    #[account(mut)]
    pub game: Account<'info, Game>,
}
