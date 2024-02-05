"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { Gamepad2, RefreshCw } from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import useGames from "@/hooks/use-games";
import useReference from "@/hooks/use-reference";
import { UserNav } from "@/components/user-nav";
import { Button } from "@/components/ui/button";
import GameCard from "@/components/cards/game";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import useSolConnectFourProgram from "@/hooks/use-sol-connect-four-program";

export default function Home() {
  const gameRef = useReference();
  const { mutate } = useSWRConfig();
  const { data: games } = useGames();
  const program = useSolConnectFourProgram();
  const { connection } = useConnection();
  const { connected, sendTransaction } = useWallet();

  const [loading, setLoading] = useState(false);
  const [createGameDialog, setCreateGameDialog] = useState(false);
  const [price, setPrice] = useState("");

  const handleCreateGameDialog = () => {
    if (!connected) return toast.error("Connect your wallet to create a game.");
    setCreateGameDialog(true);
  };

  const handleCreateGame = async () => {
    if (loading) return;
    setLoading(true);
    const toastId = toast.loading("Creating game...", {
      id: "create-game",
      duration: Infinity,
    });

    try {
      let amount = parseFloat(price);
      if (!connected) throw new Error("Please connect your wallet first.");
      if (!price) throw new Error("Please specify a price for the game.");
      if (isNaN(amount)) throw new Error("Invalid price.");
      if (amount <= 0) throw new Error("Price must be greater than 0.");

      const [gamePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("game"), Buffer.from(gameRef.reference.toBytes())],
        program.programId
      );

      const game = await program.account.game.fetchNullable(gamePda);
      if (game) throw new Error("Game already exists.");

      const ix = await program.methods
        .newGame(gameRef.reference, new anchor.BN(amount * LAMPORTS_PER_SOL))
        .accounts({
          game: gamePda,
        })
        .instruction();

      const tx = new Transaction().add(ix);
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature);

      setCreateGameDialog(false);
      setPrice("");

      toast.success("Game created successfully.", {
        id: toastId,
        duration: 4000,
      });

      // Revalidate games
      await mutate("games");
    } catch (error) {
      console.error(error);
      const err = error as Error;
      const message = err.message || "Failed to create game.";
      toast.error(message, { id: toastId, duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex h-full flex-1 flex-col space-y-8 p-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
            <p className="text-muted-foreground">
              The best place to play Connect Four on Solana.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <UserNav />
          </div>
        </div>

        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Games</h2>
          <div className="flex items-center space-x-2">
            <Button type="button" size="sm" onClick={handleCreateGameDialog}>
              Create Game
            </Button>
          </div>
        </div>

        {games.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
            {games.map((game) => (
              <GameCard key={game.publicKey.toBase58()} game={game} />
            ))}
          </div>
        ) : (
          <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <Gamepad2 className="h-10 w-10 text-muted-foreground" />

              <h3 className="mt-4 text-lg font-semibold">No games</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                Create a game to get started. You can create multiple games.
              </p>
            </div>
          </div>
        )}
      </div>

      <Dialog open={createGameDialog} onOpenChange={setCreateGameDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create a game</DialogTitle>
            <DialogDescription>
              Create a new game and invite someone to play with you or wait for
              someone to join.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reference" className="text-right">
                Reference
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Input
                  id="reference"
                  value={gameRef.reference.toBase58()}
                  readOnly
                />
                <Button
                  type="button"
                  size="sm"
                  className="px-3"
                  onClick={() => gameRef.generate()}
                >
                  <span className="sr-only">Copy</span>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <Input
                type="number"
                id="price"
                className="col-span-3"
                value={price}
                min={0}
                step={0.01}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <Alert>
              <AlertTitle>Heads up!</AlertTitle>
              <AlertDescription>
                The price indicates the SOL you plan to stake for the game.
                Participants must stake an equal amount of SOL to join you. The
                specified stake will be doubled, and the victor claims the full
                prize pool. In the event of a tie, the prize pool is divided
                equally among players.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              type="button"
              disabled={
                loading ||
                !price ||
                isNaN(parseFloat(price)) ||
                parseFloat(price) < 0
              }
              onClick={handleCreateGame}
            >
              Create Game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
