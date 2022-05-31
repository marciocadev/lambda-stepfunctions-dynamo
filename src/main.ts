import { App, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Chain, JsonPath, Pass, StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { DynamoAttributeValue, DynamoPutItem } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { join } from 'path';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    const dynamo = new Table(this, 'Dynamo', {
      tableName: 'LambdaStepfunctionsDynamo',
      partitionKey: {
        name: 'pk',
        type: AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const pass = new Pass(this, 'Pass', {
      parameters: {
        'pk.$': '$.pk',
        'str.$': '$.str',
        'num.$': '$.num',
        'map.$': '$.map',
        'strLst.$': '$.strLst',
        'numLst.$': '$.numLst',
      },
    });

    const putItem = new DynamoPutItem(this, 'DynamoPutItem', {
      item: {
        pk: DynamoAttributeValue.fromString(JsonPath.stringAt('$.pk')),
        str: DynamoAttributeValue.fromString(JsonPath.stringAt('$.str')),
        num: DynamoAttributeValue.numberFromString(JsonPath.stringAt('States.JsonToString($.num)')),
        map: DynamoAttributeValue.fromMap({
          'strMap': DynamoAttributeValue.fromString(JsonPath.stringAt('$.map.strMap')),
          'numMap': DynamoAttributeValue.numberFromString(JsonPath.stringAt('States.JsonToString($.map.numMap)')),
        }),
        strLst: DynamoAttributeValue.listFromJsonPath(JsonPath.stringAt('$.strLst')),
        strSet: DynamoAttributeValue.fromStringSet(JsonPath.listAt('$.strLst')),
        // numSet: DynamoAttributeValue.numberSetFromStrings(Array.from(JsonPath.listAt('$.numLst'), x => `${x}` )),
        // numLst: DynamoAttributeValue.fromStringSet(JsonPath.listAt('States.JsonToString($.numLst)')),
      },
      table: dynamo,
      resultPath: JsonPath.DISCARD,
    });

    const chain = Chain.start(pass).next(putItem);
    const sm = new StateMachine(this, 'StateMachine', {
      stateMachineName: 'LambdaStepfunctionsDynamo',
      definition: chain,
    });

    const lambda = new NodejsFunction(this, 'Lambda', {
      functionName: 'LambdaStepfunctionsDynamo',
      entry: join(__dirname, 'lambda-fns/index.ts'),
      handler: 'handler',
      environment: {
        SM: sm.stateMachineArn,
      },
    });
    sm.grantStartExecution(lambda);
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'lambda-stepfunctions-dynamo-dev', { env: devEnv });
// new MyStack(app, 'lambda-stepfunctions-dynamo-prod', { env: prodEnv });

app.synth();