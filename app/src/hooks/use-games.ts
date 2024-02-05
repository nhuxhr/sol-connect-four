import useSWR from "swr";
import useSolConnectFourProgram from "./use-sol-connect-four-program";

export default function useGames() {
  const program = useSolConnectFourProgram();
  const swr = useSWR("games", async () => {
    return await program.account.game.all();
  });
  return { ...swr, data: swr.data || [] };
}
