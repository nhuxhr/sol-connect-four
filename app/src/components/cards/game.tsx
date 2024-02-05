"use client";

import React, { useLayoutEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { Transaction } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { cn } from "@/lib/utils";
import getSOL from "@/helpers/get-sol";
import { SolConnectFour } from "@/programs/types/sol-connect-four";
import { getExplorerLink } from "@/helpers/get-explorer-link";
import useSolConnectFourProgram from "@/hooks/use-sol-connect-four-program";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";

type Props = {
  game: {
    publicKey: anchor.web3.PublicKey;
    account: anchor.IdlAccounts<SolConnectFour>["game"];
  };
};

type Cell = 0 | 1 | null;
type Board = [
  [Cell, Cell, Cell, Cell, Cell, Cell, Cell],
  [Cell, Cell, Cell, Cell, Cell, Cell, Cell],
  [Cell, Cell, Cell, Cell, Cell, Cell, Cell],
  [Cell, Cell, Cell, Cell, Cell, Cell, Cell],
  [Cell, Cell, Cell, Cell, Cell, Cell, Cell],
  [Cell, Cell, Cell, Cell, Cell, Cell, Cell]
];

export default function GameCard({ game: data }: Props) {
  const wallet = useWallet();
  const { mutate } = useSWRConfig();
  const { connection } = useConnection();
  const program = useSolConnectFourProgram();
  const [publicKey] = useState(data.publicKey);
  const [account, setAccount] = useState(data.account);
  const [dialog, setDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const { player0, player1 } = account;
  const board = account.board as Board;
  const address = publicKey.toBase58();
  const prize = getSOL(account.prize.toString());
  const turn = account.turn === 0 ? player0.toBase58() : player1!.toBase58();
  const isTurn =
    wallet.connected &&
    wallet.publicKey &&
    new anchor.web3.PublicKey(turn).equals(wallet.publicKey);

  let state: string;
  if (account.state.notStarted) {
    state = "Not Started";
  } else if (account.state.inProgress) {
    state = "In Progress";
  } else if (account.state.player0Won || account.state.player1Won) {
    state = "Finished";
  } else if (account.state.draw) {
    state = "Draw";
  } else {
    state = "Unknown";
  }

  const handleCancelGame = async () => {
    if (loading) return;
    setLoading(true);
    const toastId = toast.loading("Cancelling game...", {
      id: "cancel-game",
      duration: Infinity,
    });

    try {
      const ix = await program.methods
        .cancelGame()
        .accounts({ game: publicKey })
        .instruction();

      const tx = new Transaction().add(ix);
      const signature = await wallet.sendTransaction(tx, connection);
      await connection.confirmTransaction(signature);

      toast.success("Game cancelled successfully.", {
        id: toastId,
        duration: 4000,
      });

      setDialog(false);

      // Revalidate games
      await mutate("games");
    } catch (error) {
      console.error(error);
      const err = error as Error;
      const message = err.message || "Failed to cancel game.";
      toast.error(message, { id: toastId, duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (loading) return;
    setLoading(true);
    const toastId = toast.loading("Joining game...", {
      id: "join-game",
      duration: Infinity,
    });

    try {
      const ix = await program.methods
        .joinGame()
        .accounts({ game: publicKey })
        .instruction();

      const tx = new Transaction().add(ix);
      const signature = await wallet.sendTransaction(tx, connection);
      await connection.confirmTransaction(signature);

      toast.success("Game joined successfully.", {
        id: toastId,
        duration: 4000,
      });
    } catch (error) {
      console.error(error);
      const err = error as Error;
      const message = err.message || "Failed to join game.";
      toast.error(message, { id: toastId, duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const handleColumnClick = async (col: number) => {
    if (loading) return;
    setLoading(true);
    const toastId = toast.loading("Playing move...", {
      id: "play-move",
      duration: Infinity,
    });

    try {
      let opponent: anchor.web3.PublicKey = player1!;
      if (player0.equals(wallet.publicKey!)) {
        opponent = player1!;
      } else if (player1!.equals(wallet.publicKey!)) {
        opponent = player0;
      }

      const ix = await program.methods
        .play(col)
        .accounts({ game: publicKey, opponent })
        .instruction();

      const tx = new Transaction().add(ix);
      const signature = await wallet.sendTransaction(tx, connection);
      await connection.confirmTransaction(signature);

      toast.success("Move played successfully.", {
        id: toastId,
        duration: 4000,
      });
    } catch (error) {
      console.error(error);
      const err = error as Error;
      const message = err.message || "Failed to play move.";
      toast.error(message, { id: toastId, duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  useLayoutEffect(() => {
    const event = program.account.game.subscribe(publicKey, "confirmed");
    if (!dialog) {
      return () => {
        event.removeAllListeners("change");
      };
    }

    console.log("subscribing to game");
    event.addListener("change", (account) => {
      setAccount(account);
    });

    return () => {
      event.removeAllListeners("change");
    };
  }, [dialog, program.account.game, publicKey]);

  return (
    <div>
      <Card
        className="cursor-pointer hover:border-primary transition-all duration-200 ease-in-out"
        role="button"
        tabIndex={0}
        onClick={() => setDialog(true)}
      >
        <CardHeader>
          <CardTitle>
            Game{" "}
            <span className="text-primary">
              {address.slice(0, 4)}...{address.slice(-4)}
            </span>
          </CardTitle>
          <CardDescription>
            Created by{" "}
            <span className="text-primary">
              {player0.toBase58().slice(0, 4)}...
              {player0.toBase58().slice(-4)}
            </span>
            . Join the game and compete for the grand prize of{" "}
            <strong>{prize}</strong> SOL!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="mt-4 text-xs font-medium flex items-center row-start-2 sm:mt-1 sm:row-start-3 md:mt-2.5 lg:row-start-2">
            <dt className="sr-only">State</dt>
            <dd className="flex items-center">{state}</dd>
            <dt className="sr-only">Prize</dt>
            <dd className="flex items-center">
              <svg
                width={2}
                height={2}
                aria-hidden="true"
                fill="currentColor"
                className="mx-3"
              >
                <circle cx={1} cy={1} r={1} />
              </svg>
              {prize} SOL
            </dd>
            <dt className="sr-only">Turn</dt>
            <dd className="flex items-center">
              <svg
                width={2}
                height={2}
                aria-hidden="true"
                fill="currentColor"
                className="mx-3"
              >
                <circle cx={1} cy={1} r={1} />
              </svg>
              {turn.slice(0, 4)}
            </dd>
          </dl>
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="p-0">
          <ScrollArea className="h-[90dvh] md:h-min">
            <div className="space-y-4 p-4">
              <DialogHeader className="text-left">
                <DialogTitle>
                  Game{" "}
                  <Link
                    href={getExplorerLink("address", address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary"
                  >
                    {address.slice(0, 4)}...{address.slice(-4)}
                  </Link>
                </DialogTitle>
                <DialogDescription>
                  <div className="space-y-2">
                    <p>
                      Immerse yourself in the strategic world of Connect Four
                      with this intense showdown! Created by{" "}
                      {
                        <Link
                          href={getExplorerLink("address", player0.toBase58())}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary"
                        >
                          {player0.toBase58().slice(0, 4)}...
                          {player0.toBase58().slice(-4)}
                        </Link>
                      }
                      , this game awaits a challenger to join as{" "}
                      {player1 ? (
                        <Link
                          href={getExplorerLink("address", player1.toBase58())}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary"
                        >
                          {player1.toBase58().slice(0, 4)}...
                          {player1.toBase58().slice(-4)}
                        </Link>
                      ) : (
                        "Player 1"
                      )}
                      . Keep an eye on the ever-changing board as players
                      strategically drop their tokens, aiming to connect four in
                      a row vertically, horizontally, or diagonally.
                    </p>
                    <p>
                      The battle is on, and victory comes to those who outwit
                      their opponents. Will you be the triumphant{" "}
                      {account.winner ? (
                        <Link
                          href={getExplorerLink(
                            "address",
                            account.winner.toBase58()
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary"
                        >
                          {account.winner.toBase58().slice(0, 4)}...
                          {account.winner.toBase58().slice(-4)}
                        </Link>
                      ) : (
                        "Winner"
                      )}
                      , or can{" "}
                      {player1 ? (
                        <Link
                          href={getExplorerLink("address", player1.toBase58())}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary"
                        >
                          {player1.toBase58().slice(0, 4)}...
                          {player1.toBase58().slice(-4)}
                        </Link>
                      ) : (
                        "Player 1"
                      )}{" "}
                      turn the tides? Take turns wisely, navigate the twists of
                      the game, and claim your victory in this classic Connect
                      Four showdown!
                    </p>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-7 gap-2 md:gap-4">
                {board.map((row, rIdx) =>
                  row.map((cell, cIdx) => {
                    const empty = cell === null;
                    const inProgress = !!account.state.inProgress;
                    const canPlay = inProgress && isTurn;
                    const emptyCanPlay = empty && canPlay;
                    const notAllowed = loading || !empty || !canPlay;
                    const belowCell = rIdx === 5 ? null : board[rIdx + 1][cIdx];
                    const validMove = rIdx === 5 || belowCell !== null;
                    const isTurn0 = account.turn === 0;
                    const isTurn1 = account.turn === 1;

                    return (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        className={cn(
                          `size-8 md:size-10 lg:size-12 border border-gray-500 rounded-full`,
                          emptyCanPlay && {
                            "cursor-pointer": true,
                            "hover:bg-red-500": isTurn0 && validMove,
                            "hover:bg-yellow-500": isTurn1 && validMove,
                          },
                          {
                            "bg-red-500": cell === 0,
                            "bg-yellow-500": cell === 1,
                            "cursor-not-allowed": notAllowed || !validMove,
                          }
                        )}
                        onClick={() => {
                          if (notAllowed || !validMove) return;
                          handleColumnClick(cIdx);
                        }}
                      />
                    );
                  })
                )}
              </div>

              {wallet.connected &&
                player0.equals(wallet.publicKey!) &&
                !player1 && (
                  <Button
                    className="w-full mt-4"
                    disabled={loading}
                    onClick={handleCancelGame}
                  >
                    Cancel Game
                  </Button>
                )}

              {wallet.connected &&
                !player0.equals(wallet.publicKey!) &&
                !player1 && (
                  <Button
                    className="w-full mt-4"
                    disabled={loading}
                    onClick={handleJoinGame}
                  >
                    Join Game
                  </Button>
                )}

              <div className="bg-gray-200 p-4 rounded-lg shadow-md max-w-2xl mx-auto">
                <div className="mb-4">
                  <h2 className="text-xl font-bold mb-2">
                    🎮 Game Information:
                  </h2>
                  <ul>
                    <li>
                      <strong>Creator:</strong>{" "}
                      <Link
                        href={getExplorerLink("address", player0.toBase58())}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary"
                      >
                        {player0.toBase58().slice(0, 4)}...
                        {player0.toBase58().slice(-4)}
                      </Link>
                    </li>
                    <li>
                      <strong>Joiner:</strong>{" "}
                      {player1 ? (
                        <Link
                          href={getExplorerLink("address", player1.toBase58())}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary"
                        >
                          {player1.toBase58().slice(0, 4)}...
                          {player1.toBase58().slice(-4)}
                        </Link>
                      ) : (
                        "Waiting for player to join"
                      )}
                    </li>
                    <li>
                      <strong>Winner:</strong>{" "}
                      {account.winner ? (
                        <Link
                          href={getExplorerLink(
                            "address",
                            account.winner.toBase58()
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary"
                        >
                          {account.winner.toBase58().slice(0, 4)}...
                          {account.winner.toBase58().slice(-4)}
                        </Link>
                      ) : (
                        "Not determined yet"
                      )}
                    </li>
                    <li>
                      <strong>Prize:</strong> {prize} SOL
                    </li>
                  </ul>
                </div>

                <div className="mb-4">
                  <h2 className="text-xl font-bold mb-2">🔢 Game Stats:</h2>
                  <ul>
                    <li>
                      <strong>State:</strong> {state}
                    </li>
                    <li>
                      <strong>Turn:</strong>{" "}
                      <Link
                        href={getExplorerLink("address", turn)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary"
                      >
                        {turn.slice(0, 4)}...{turn.slice(-4)}
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-xl font-bold mb-2">🏆 Prize:</h2>
                  <p>
                    The ultimate victor will seize a prize of {prize} SOL. May
                    the best strategist prevail!
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
