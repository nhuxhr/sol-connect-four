import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolConnectFour } from "../target/types/sol_connect_four";

describe("sol-connect-four", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const web3 = anchor.web3;
  const payer = provider.wallet as anchor.Wallet;
  const program = anchor.workspace.SolConnectFour as Program<SolConnectFour>;

  // Dummy Accounts
  const accounts = {
    foo: anchor.web3.Keypair.fromSecretKey(
      new Uint8Array([
        183, 46, 91, 78, 229, 160, 184, 191, 128, 13, 249, 120, 76, 41, 241,
        179, 154, 229, 80, 110, 3, 188, 15, 170, 8, 240, 162, 79, 157, 158, 45,
        24, 173, 225, 4, 181, 211, 144, 167, 217, 0, 216, 101, 244, 185, 141,
        84, 143, 19, 119, 74, 253, 120, 7, 230, 165, 234, 253, 78, 205, 66, 87,
        77, 243,
      ])
    ),
    bar: anchor.web3.Keypair.fromSecretKey(
      new Uint8Array([
        28, 218, 246, 248, 86, 90, 242, 165, 19, 151, 2, 221, 101, 18, 125, 88,
        88, 4, 161, 135, 163, 52, 170, 71, 39, 192, 200, 149, 110, 41, 90, 216,
        125, 136, 153, 251, 3, 177, 195, 54, 222, 234, 31, 106, 247, 247, 62,
        60, 179, 116, 105, 234, 142, 98, 52, 30, 52, 11, 124, 183, 154, 255,
        109, 246,
      ])
    ),
  };

  // Game Constants
  class Game {
    static ROWS = 6;
    static COLS = 7;
    reference = web3.Keypair.generate().publicKey;

    get address() {
      return web3.PublicKey.findProgramAddressSync(
        [Buffer.from("game"), this.reference.toBytes()],
        program.programId
      )[0];
    }

    async play(
      col: number,
      signer: anchor.web3.Keypair,
      opponent?: anchor.web3.PublicKey
    ) {
      const { foo, bar } = accounts;
      const isFoo = signer.publicKey.equals(foo.publicKey);
      if (!opponent) opponent = isFoo ? bar.publicKey : foo.publicKey;
      await program.methods
        .play(col)
        .accounts({
          signer: signer.publicKey,
          opponent,
          game: this.address,
        })
        .signers([signer])
        .rpc();
      return program.account.game.fetch(this.address);
    }
  }

  beforeAll(async () => {
    const amount = 100 * web3.LAMPORTS_PER_SOL;
    const txns = await Promise.all(
      Object.values(accounts).map(async (account) => {
        const balance = await provider.connection.getBalance(account.publicKey);
        if (balance > amount) return;
        const topUp = amount - balance;
        return provider.connection.requestAirdrop(account.publicKey, topUp);
      })
    );

    await Promise.all(
      txns.map((txn) => txn && provider.connection.confirmTransaction(txn))
    );

    const balances = await Promise.all([
      provider.connection.getBalance(payer.publicKey),
      provider.connection.getBalance(program.programId),
      ...Object.values(accounts).map((account) =>
        provider.connection.getBalance(account.publicKey)
      ),
    ]);

    // Log out addresses and balances for debugging purposes
    console.table({
      Payer: {
        Address: payer.publicKey.toBase58(),
        Balance: balances[0] / web3.LAMPORTS_PER_SOL,
      },
      Program: {
        Address: program.programId.toBase58(),
        Balance: balances[1] / web3.LAMPORTS_PER_SOL,
      },
      "Account (foo)": {
        Address: accounts.foo.publicKey.toBase58(),
        Balance: balances[2] / web3.LAMPORTS_PER_SOL,
      },
      "Account (bar)": {
        Address: accounts.bar.publicKey.toBase58(),
        Balance: balances[3] / web3.LAMPORTS_PER_SOL,
      },
    });
  });

  describe("Default Game (Vertical Win)", () => {
    const g = new Game();

    it("Create a new game", async () => {
      await program.methods
        .newGame(g.reference, new anchor.BN(web3.LAMPORTS_PER_SOL))
        .accounts({
          signer: accounts.foo.publicKey,
          game: g.address,
        })
        .signers([accounts.foo])
        .rpc();
      const game = await program.account.game.fetch(g.address);
      expect(game.reference).toEqual(g.reference);
    });

    describe("Join the game", () => {
      it("Should fail if player0 tries to join the game", async () => {
        await expect(
          program.methods
            .joinGame()
            .accounts({
              signer: accounts.foo.publicKey,
              game: g.address,
            })
            .signers([accounts.foo])
            .rpc()
        ).rejects.toThrow("Invalid player");
      });

      it("Player1 joins the game", async () => {
        await program.methods
          .joinGame()
          .accounts({
            signer: accounts.bar.publicKey,
            game: g.address,
          })
          .signers([accounts.bar])
          .rpc();
        const game = await program.account.game.fetch(g.address);
        expect(game.player1).toEqual(accounts.bar.publicKey);
      });

      it("Should fail when game already has 2 players", async () => {
        await expect(
          program.methods
            .joinGame()
            .accounts({
              game: g.address,
            })
            .signers([payer.payer])
            .rpc()
        ).rejects.toThrow("Game is full");
      });
    });

    describe("Play", () => {
      it("Should fail if signer is not a player", async () => {
        await expect(g.play(2, payer.payer)).rejects.toThrow("Invalid player");
      });

      it("Should fail if opponent is not a player", async () => {
        await expect(g.play(2, accounts.foo, payer.publicKey)).rejects.toThrow(
          "Invalid player"
        );
      });

      it("Should fail if player1 tries to play first", async () => {
        await expect(g.play(0, accounts.bar)).rejects.toThrow("Not your turn");
      });

      it("Player0 plays", async () => {
        const game = await g.play(0, accounts.foo);
        expect(game.board[Game.ROWS - 1][0]).toEqual(0);
      });

      it("Player1 plays", async () => {
        const game = await g.play(0, accounts.bar);
        expect(game.board[Game.ROWS - 2][0]).toEqual(1);
      });

      it("Player0 plays", async () => {
        const game = await g.play(0, accounts.foo);
        expect(game.board[Game.ROWS - 3][0]).toEqual(0);
      });

      it("Player1 plays", async () => {
        const game = await g.play(0, accounts.bar);
        expect(game.board[Game.ROWS - 4][0]).toEqual(1);
      });

      it("Player0 plays", async () => {
        const game = await g.play(0, accounts.foo);
        expect(game.board[Game.ROWS - 5][0]).toEqual(0);
      });

      it("Player1 plays", async () => {
        const game = await g.play(0, accounts.bar);
        expect(game.board[Game.ROWS - 6][0]).toEqual(1);
      });

      it("Should fail if the row is invalid", async () => {
        await expect(g.play(0, accounts.foo)).rejects.toThrow("Invalid row");
      });

      it("Should fail if the column is invalid", async () => {
        await expect(g.play(7, accounts.foo)).rejects.toThrow("Invalid column");
      });

      it("Player0 plays", async () => {
        const game = await g.play(1, accounts.foo);
        expect(game.board[Game.ROWS - 1][1]).toEqual(0);
      });

      it("Player1 plays", async () => {
        const game = await g.play(2, accounts.bar);
        expect(game.board[Game.ROWS - 1][2]).toEqual(1);
      });

      it("Player0 plays", async () => {
        const game = await g.play(1, accounts.foo);
        expect(game.board[Game.ROWS - 2][1]).toEqual(0);
      });

      it("Player1 plays", async () => {
        const game = await g.play(2, accounts.bar);
        expect(game.board[Game.ROWS - 2][2]).toEqual(1);
      });

      it("Player0 plays", async () => {
        const game = await g.play(1, accounts.foo);
        expect(game.board[Game.ROWS - 3][1]).toEqual(0);
      });

      it("Player1 plays", async () => {
        const game = await g.play(2, accounts.bar);
        expect(game.board[Game.ROWS - 3][2]).toEqual(1);
      });

      it("Player0 plays", async () => {
        const game = await g.play(1, accounts.foo);

        // Log the board for debugging purposes
        console.table(game.board);

        expect(game.board[Game.ROWS - 4][1]).toEqual(0);
      });

      it("Should fail because game is over", async () => {
        await expect(g.play(2, accounts.bar)).rejects.toThrow("Game over");
      });
    });
  });

  describe("Horizontal Win", () => {
    const g = new Game();

    it("Create a new game", async () => {
      await program.methods
        .newGame(g.reference, new anchor.BN(web3.LAMPORTS_PER_SOL))
        .accounts({
          signer: accounts.foo.publicKey,
          game: g.address,
        })
        .signers([accounts.foo])
        .rpc();
      const game = await program.account.game.fetch(g.address);
      expect(game.reference).toEqual(g.reference);
    });

    it("Join the game", async () => {
      await program.methods
        .joinGame()
        .accounts({
          signer: accounts.bar.publicKey,
          game: g.address,
        })
        .signers([accounts.bar])
        .rpc();
      const game = await program.account.game.fetch(g.address);
      expect(game.player1).toEqual(accounts.bar.publicKey);
    });

    it("Play", async () => {
      await g.play(0, accounts.foo);
      await g.play(0, accounts.bar);
      await g.play(1, accounts.foo);
      await g.play(1, accounts.bar);
      await g.play(2, accounts.foo);
      await g.play(2, accounts.bar);
      const game = await g.play(3, accounts.foo);

      // Log the board for debugging purposes
      console.table(game.board);

      expect(game.winner).toEqual(accounts.foo.publicKey);
    });

    it("Should fail because game is over", async () => {
      await expect(g.play(3, accounts.bar)).rejects.toThrow("Game over");
    });
  });

  describe("Diagonal Win", () => {
    const g = new Game();

    it("Create a new game", async () => {
      await program.methods
        .newGame(g.reference, new anchor.BN(web3.LAMPORTS_PER_SOL))
        .accounts({
          signer: accounts.foo.publicKey,
          game: g.address,
        })
        .signers([accounts.foo])
        .rpc();
      const game = await program.account.game.fetch(g.address);
      expect(game.reference).toEqual(g.reference);
    });

    it("Join the game", async () => {
      await program.methods
        .joinGame()
        .accounts({
          signer: accounts.bar.publicKey,
          game: g.address,
        })
        .signers([accounts.bar])
        .rpc();
      const game = await program.account.game.fetch(g.address);
      expect(game.player1).toEqual(accounts.bar.publicKey);
    });

    it("Play", async () => {
      await g.play(0, accounts.foo);
      await g.play(1, accounts.bar);
      await g.play(1, accounts.foo);
      await g.play(4, accounts.bar);
      await g.play(2, accounts.foo);
      await g.play(2, accounts.bar);
      await g.play(2, accounts.foo);
      await g.play(3, accounts.bar);
      await g.play(3, accounts.foo);
      await g.play(3, accounts.bar);
      const game = await g.play(3, accounts.foo);

      // Log the board for debugging purposes
      console.table(game.board);

      expect(game.winner).toEqual(accounts.foo.publicKey);
    });

    it("Should fail because game is over", async () => {
      await expect(g.play(3, accounts.bar)).rejects.toThrow("Game over");
    });
  });
});
