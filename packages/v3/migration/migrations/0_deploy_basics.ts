import { engine } from '../../migration/engine';
import { deployedContract, Migration } from '../../migration/engine/types';

const { signer, deploy, contracts } = engine;

export type InitialState = {};

export type NextState = InitialState & {
    BNT: { token: deployedContract; governance: deployedContract };
    vBNT: { token: deployedContract; governance: deployedContract };
};

const migration: Migration = {
    up: async (initialState: InitialState): Promise<NextState> => {
        const BNTToken = await deploy(
            contracts.TestERC20Token,
            'Bancor Network Token',
            'BNT',
            '100000000000000000000000000'
        );

        const vBNTToken = await deploy(
            contracts.TestERC20Token,
            'Bancor Governance Token',
            'vBNT',
            '100000000000000000000000000'
        );

        const BNTGovernance = await deploy(contracts.TokenGovernance, BNTToken.address);
        const vBNTGovernance = await deploy(contracts.TokenGovernance, vBNTToken.address);

        return {
            ...initialState,

            BNT: {
                token: BNTToken.address,
                governance: BNTGovernance.address
            },
            vBNT: {
                token: vBNTToken.address,
                governance: vBNTGovernance.address
            }
        };
    },

    healthCheck: async (initialState: InitialState, state: NextState) => {
        const BNTGovernance = await contracts.TokenGovernance.attach(state.BNT.governance);
        const vBNTGovernance = await contracts.TokenGovernance.attach(state.vBNT.governance);
        if (!(await BNTGovernance.hasRole(await BNTGovernance.ROLE_SUPERVISOR(), await signer.getAddress())))
            throw new Error('Invalid Role');
        if (!(await vBNTGovernance.hasRole(await BNTGovernance.ROLE_SUPERVISOR(), await signer.getAddress())))
            throw new Error('Invalid Role');
    },

    down: async (initialState: InitialState, newState: NextState): Promise<InitialState> => {
        return initialState;
    }
};
export default migration;
