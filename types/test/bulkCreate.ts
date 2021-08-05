import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './connection';

interface ITestModel {
  id: number;
  testString: string;
  testEnum: 'd' | 'e' | 'f' | null;
}

interface ITestModelCreationArgs extends Omit<Optional<ITestModel, 'testString' | 'testEnum' | 'id'>, 'id'>{}

class TestModel extends Model<
  ITestModel,
  ITestModelCreationArgs
> {}

TestModel.init(
  {
    id: { type: DataTypes.NUMBER },
    testString: { type: DataTypes.STRING },
    testEnum: { type: DataTypes.STRING },
  },
  { sequelize }
);

sequelize.transaction(async (trx) => {
  const badItems: Array<ITestModelCreationArgs> = [{
    // @ts-expect-error this isn't an enum value
    testEnum: 'eafe'
  }, {
    // @ts-expect-error id isn't a creation arg (in this case, we assume that its set by the db and not here.)
    id: 123
  }, {
    // @ts-expect-error testString should be a string or null
    testString: 324
  }]

  const newItems: Array<ITestModelCreationArgs> = [{
    testEnum: 'e',
    testString: 'abc'
  }, {
    testEnum: null,
    testString: undefined,
  }]

  const res1: Array<TestModel> = await TestModel.bulkCreate(
    newItems,
    {
      benchmark: true,
      fields: ['testEnum'],
      hooks: true,
      logging: true,
      returning: true,
      transaction: trx,
      validate: true,
      ignoreDuplicates: true,
    }
  );

  const res2: Array<TestModel> = await TestModel.bulkCreate(
    newItems,
    {
      benchmark: true,
      fields: ['testEnum'],
      hooks: true,
      logging: true,
      returning: false,
      transaction: trx,
      validate: true,
      updateOnDuplicate: ['testEnum', 'testString']
    }
  );


  const res3: Array<TestModel> = await TestModel.bulkCreate(
    newItems,
    {
      conflictFields: ['testEnum', 'testString'],
    }
  );
});
