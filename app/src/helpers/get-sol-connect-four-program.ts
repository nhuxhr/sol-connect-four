import { AnchorWallet } from "@solana/wallet-adapter-react";
import * as anchor from "@project-serum/anchor";

import idl from "@/programs/idl/sol-connect-four.json";
import { SolConnectFour } from "@/programs/types/sol-connect-four";
import { programId } from "@/hooks/use-sol-connect-four-program";

import { getMockWallet } from "./get-mock-wallet";
import { getAnchorProvider } from "./get-anchor-provider";

export function getSolConnectFourProgram(
  wallet: AnchorWallet = getMockWallet()
): anchor.Program<SolConnectFour> {
  const provider = getAnchorProvider(wallet);
  return new anchor.Program(idl as any, programId, provider);
}
