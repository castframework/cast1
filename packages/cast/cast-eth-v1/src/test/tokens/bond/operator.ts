import { ForgeBondInstance } from '../../../../dist/types';
import { buildForgeBond } from '../../utils/builders';
import * as constants from '../../constants';

contract('ForgeBond', (accounts) => {
  let forgeBond: ForgeBondInstance;
  context('operators', async function () {
    beforeEach(async function () {
      forgeBond = await buildForgeBond(constants.owner);
    });

    it('should fail when authorizeOperator() not called by owner', async function () {
      let res = false;
      await forgeBond
        .authorizeOperator('0x143', accounts[1], {
          from: accounts[1],
        })
        .then(() => (res = true))
        .catch((err) => {
          res = false;
          assert.equal(err.reason, 'Only issuer can perform this action');
        });
      assert.isNotOk(res, 'Call should fail when not owner');
    });

    it('should name a new operator with his role', async function () {
      await forgeBond
        .authorizeOperator('0x143', accounts[1], {
          from: accounts[0],
        })
        .then(() =>
          forgeBond.isOperatorWithRoleAuthorized(accounts[1], '0x143'),
        )
        .then((res) => assert.isOk(res, 'New Operation with role created'));
    });

    it('should revoke operator authorization', async function () {
      await forgeBond
        .authorizeOperator('0x143', accounts[1], {
          from: accounts[0],
        })
        .then(() => forgeBond.revokeOperatorAuthorization(accounts[1], '0x143'))
        .then(() =>
          forgeBond.isOperatorWithRoleAuthorized(accounts[1], '0x143'),
        )
        .then((res) =>
          assert.isOk(!res, 'revoke performed on operator authorization'),
        );
    });
  });
});
