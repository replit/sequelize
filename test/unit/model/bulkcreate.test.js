'use strict';

const chai = require('chai'),
  expect = chai.expect,
  sinon = require('sinon'),
  Support = require('../support'),
  DataTypes = require('../../../lib/data-types'),
  current = Support.sequelize;

describe(Support.getTestDialectTeaser('Model'), () => {
  describe('bulkCreate', () => {
    const Model = current.define(
      'model',
      {
        accountId: {
          type: DataTypes.INTEGER(11).UNSIGNED,
          allowNull: false,
          field: 'account_id'
        }
      },
      { timestamps: false }
    );

    const stub = sinon
      .stub(current.getQueryInterface(), 'bulkInsert')
      .resolves([]);

    beforeEach(async () => {
      await Model.sync({ force: true });
    });

    afterEach(() => {
      stub.resetHistory();
    });

    after(() => {
      stub.restore();
    });

    describe('validations', () => {
      it('should not fail for renamed fields', async () => {
        await Model.bulkCreate([{ accountId: 42 }], { validate: true });

        expect(stub.getCall(0).args[1]).to.deep.equal([
          { account_id: 42, id: null }
        ]);
      });

      if (current.dialect.supports.inserts.updateOnDuplicate) {
        it('should pass conflictFields directly as upsertKeys', async () => {
          // Note that the model also has an id key as its primary key.
          await Model.bulkCreate([{ accountId: 42 }], {
            conflictFields: ['a', 'b', 'c'],
            updateOnDuplicate: ['accountId'] // needed for conflictFields to be looked at.
          }).catch(() => {});

          expect(
            // Not worth checking that the reference of the array matches - just the contents.
            stub.getCall(0).args[2].upsertKeys
          ).to.deep.equal(['a', 'b', 'c']);
        });
      }
    });
  });
});
