import { useContext, useEffect, useState } from "react";

import { EthersContext } from "../context/EthersContext";
import { GlobalContext } from "../context/GlobalContext";
import LPToken from "../types/LPToken";
import useLiquidityState, { LiquidityState } from "./useLiquidityState";
import useSDK from "./useSDK";

export interface LPTokensState extends LiquidityState {
    lastTimeRefreshed: number;
    updateLastTimeRefreshed: () => void;
    lpTokens: LPToken[];
    selectedLPToken?: LPToken;
    setSelectedLPToken: (token?: LPToken) => void;
    selectedLPTokenAllowed: boolean;
    setSelectedLPTokenAllowed: (allowed: boolean) => void;
    amount: string;
    setAmount: (amount: string) => void;
}

type Mode = "pools" | "my-lp-tokens" | "my-uniswap-lp-tokens";

// tslint:disable-next-line:max-func-body-length
const useLPTokensState: (mode: Mode) => LPTokensState = mode => {
    const state = useLiquidityState();
    const { provider, signer, address, addOnBlockListener, removeOnBlockListener } = useContext(EthersContext);
    const { tokens } = useContext(GlobalContext);
    const { getPools, getMyLPTokens, getMyUniswapLPTokens } = useSDK();
    const [lastTimeRefreshed, setLastTimeRefreshed] = useState(0);
    const [loading, setLoading] = useState(true);
    const [lpTokens, setLPTokens] = useState<LPToken[]>([]);
    const [selectedLPToken, setSelectedLPToken] = useState<LPToken>();
    const [selectedLPTokenAllowed, setSelectedLPTokenAllowed] = useState(false);
    const [amount, setAmount] = useState("");

    const updateLPTokens = async () => {
        try {
            const method = mode === "pools" ? getPools : mode === "my-lp-tokens" ? getMyLPTokens : getMyUniswapLPTokens;
            const data = await method();
            if (data) {
                setLPTokens(data);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!selectedLPToken) {
            setAmount("");
        }
    }, [selectedLPToken]);

    useEffect(() => {
        if (provider && signer && (mode === "pools" || tokens.length > 0)) {
            setLoading(true);
            updateLPTokens();

            const name = "updateLPTokens()";
            addOnBlockListener(name, updateLPTokens);
            return () => {
                removeOnBlockListener(name);
            };
        }
    }, [provider, signer, tokens.length, address, lastTimeRefreshed]);

    return {
        ...state,
        loading: state.loading || loading,
        lastTimeRefreshed,
        updateLastTimeRefreshed: () => {
            setLastTimeRefreshed(Date.now());
        },
        lpTokens,
        selectedLPToken,
        setSelectedLPToken,
        selectedLPTokenAllowed,
        setSelectedLPTokenAllowed,
        amount,
        setAmount
    };
};

export default useLPTokensState;
