import { atomWithStorage } from "jotai/utils";
import { User } from "src/types/user";

export const userAtom = atomWithStorage<User | null>("user", null);
