import { AccessControlEnumerable } from '../../components/Contracts';
import { NetworkToken, TokenGovernance } from '../../components/LegacyContracts';
import { ContractName, DeployedContracts, isMainnet } from '../../utils/Deploy';
import { TokenData, TokenSymbol } from '../../utils/TokenData';
import { toWei } from '../../utils/Types';
import { expectRoleMembers, Roles } from '../helpers/AccessControl';
import { describeDeployment } from '../helpers/Deploy';
import { expect } from 'chai';
import { getNamedAccounts } from 'hardhat';

describeDeployment('1640637513-network-token', ContractName.NetworkToken, async () => {
    let deployer: string;
    let foundationMultisig: string;
    let liquidityProtection: string;
    let stakingRewards: string;
    let networkToken: NetworkToken;
    let networkTokenGovernance: TokenGovernance;

    const INITIAL_SUPPLY = toWei(1_000_000_000);
    const networkTokenData = new TokenData(TokenSymbol.BNT);

    before(async () => {
        ({ deployer, foundationMultisig, liquidityProtection, stakingRewards } = await getNamedAccounts());
    });

    beforeEach(async () => {
        networkToken = await DeployedContracts.NetworkToken.deployed();
        networkTokenGovernance = await DeployedContracts.NetworkTokenGovernance.deployed();
    });

    it('should deploy the network token', async () => {
        expect(await networkToken.name()).to.equal(networkTokenData.name());
        expect(await networkToken.symbol()).to.equal(networkTokenData.symbol());
        expect(await networkToken.decimals()).to.equal(networkTokenData.decimals());
    });

    it('should deploy and configure the network token governance', async () => {
        expect(await networkTokenGovernance.token()).to.equal(networkToken.address);

        expect(await networkToken.owner()).to.equal(networkTokenGovernance.address);

        await expectRoleMembers(
            networkTokenGovernance as any as AccessControlEnumerable,
            Roles.TokenGovernance.ROLE_SUPERVISOR,
            [foundationMultisig]
        );
        await expectRoleMembers(
            networkTokenGovernance as any as AccessControlEnumerable,
            Roles.TokenGovernance.ROLE_GOVERNOR,
            [deployer]
        );
        await expectRoleMembers(
            networkTokenGovernance as any as AccessControlEnumerable,
            Roles.TokenGovernance.ROLE_MINTER,
            isMainnet() ? [liquidityProtection, stakingRewards] : []
        );
    });

    if (!isMainnet()) {
        it('should mint the initial total supply', async () => {
            expect(await networkToken.balanceOf(deployer)).to.equal(INITIAL_SUPPLY);
        });
    }
});