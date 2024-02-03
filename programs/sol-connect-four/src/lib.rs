use anchor_lang::prelude::*;

declare_id!("CfWyF5tC289SxRsAqzU3jThoFnyWeQPRR5ZCkHF83T7S");

#[program]
pub mod sol_connect_four {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
