"use client";

import { useCallback, useEffect, useState } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import * as anchor from "@project-serum/anchor";

import idl from "@/programs/idl/sol-connect-four.json";
import { SolConnectFour } from "@/programs/types/sol-connect-four";

import { getSolConnectFourProgram } from "@/helpers/get-sol-connect-four-program";

export const programId = new anchor.web3.PublicKey(idl.metadata.address);

export default function useSolConnectFourProgram(): anchor.Program<SolConnectFour> {
  const wallet = useAnchorWallet();
  const [program, setProgram] = useState<anchor.Program<SolConnectFour>>(
    getSolConnectFourProgram()
  );

  const sync = useCallback(
    () => setProgram(getSolConnectFourProgram(wallet)),
    [wallet]
  );

  useEffect(() => {
    sync();
  }, [sync]);

  return program;
}
