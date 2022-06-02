import { App, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Chain, JsonPath, Map, Parallel, Pass, StateMachine, TaskInput } from 'aws-cdk-lib/aws-stepfunctions';
import { DynamoAttributeValue, DynamoGetItem, DynamoPutItem, DynamoUpdateItem, LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
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
        'mapLst.$': '$.mapLst',
        'bool.$': '$.bool',
        'binary.$': '$.convertToBinary',
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
        bool: DynamoAttributeValue.booleanFromJsonPath(JsonPath.stringAt('$.bool')),
        binary: DynamoAttributeValue.fromBinary(JsonPath.stringAt('$.binary')),
      },
      table: dynamo,
      resultPath: JsonPath.DISCARD,
    });

    const transformNumLst = new NodejsFunction(this, 'TransformNumLst', {
      functionName: 'TransformNumLst',
      entry: join(__dirname, 'lambda-fns/transform-num-lst/index.ts'),
      handler: 'handler',
    });
    const transformNumLstStep = new LambdaInvoke(this, 'TransformNumLstStep', {
      payload: TaskInput.fromObject({
        input: JsonPath.stringAt('$'),
      }),
      lambdaFunction: transformNumLst,
      outputPath: '$.Payload',
    });
    const mapNumLst = new Map(this, 'MapNumLst', {
      inputPath: '$.numLst',
      maxConcurrency: 0,
      resultPath: '$.numLstProcess',
    });
    const transformNumLstChain = Chain.start(transformNumLstStep);
    mapNumLst.iterator(transformNumLstChain);
    const updateItemNumLst = new DynamoUpdateItem(this, 'DynamoUpdateItemNumLst', {
      key: { pk: DynamoAttributeValue.fromString(JsonPath.stringAt('$.pk')) },
      updateExpression: 'set #numLst=:numLst',
      expressionAttributeNames: {
        '#numLst': 'numLst',
      },
      expressionAttributeValues: {
        ':numLst': DynamoAttributeValue.listFromJsonPath(JsonPath.stringAt('$.numLstProcess')),
      },
      table: dynamo,
      resultPath: JsonPath.DISCARD,
    });
    mapNumLst.next(updateItemNumLst);

    const transformMapLst = new NodejsFunction(this, 'TransformMapLst', {
      functionName: 'TransformMapLst',
      entry: join(__dirname, 'lambda-fns/transform-map-lst/index.ts'),
      handler: 'handler',
    });
    const transformMapLstStep = new LambdaInvoke(this, 'TransformMapLstStep', {
      payload: TaskInput.fromObject({
        input: JsonPath.stringAt('$'),
      }),
      lambdaFunction: transformMapLst,
      outputPath: '$.Payload',
    });
    const mapMapLst = new Map(this, 'MapMapLst', {
      inputPath: '$',
      itemsPath: '$.mapLst',
      maxConcurrency: 0,
      resultPath: '$.mapLstProcess',
    });
    const transformMapLstChain = Chain.start(transformMapLstStep);
    mapMapLst.iterator(transformMapLstChain);
    const updateItemMapLst = new DynamoUpdateItem(this, 'DynamoUpdateItemMapLst', {
      key: { pk: DynamoAttributeValue.fromString(JsonPath.stringAt('$.pk')) },
      updateExpression: 'set #mapLst=:mapLst',
      expressionAttributeNames: {
        '#mapLst': 'mapLst',
      },
      expressionAttributeValues: {
        ':mapLst': DynamoAttributeValue.listFromJsonPath(JsonPath.stringAt('$.mapLstProcess')),
      },
      table: dynamo,
      resultPath: JsonPath.DISCARD,
    });
    mapMapLst.next(updateItemMapLst);

    const parallel = new Parallel(this, 'Parallel', {
      resultPath: JsonPath.DISCARD,
    });
    parallel.branch(mapMapLst).branch(mapNumLst);

    const getItem = new DynamoGetItem(this, 'DynamoGetItem', {
      key: { pk: DynamoAttributeValue.fromString(JsonPath.stringAt('$.pk')) },
      table: dynamo,
      outputPath: '$',
    });

    const chain = Chain.start(pass)
      .next(putItem)
      .next(parallel)
      .next(getItem);
    const sm = new StateMachine(this, 'StateMachine', {
      stateMachineName: 'LambdaStepfunctionsDynamo',
      definition: chain,
    });

    const lambda = new NodejsFunction(this, 'Start', {
      functionName: 'StartLambdaStepfunctionsDynamo',
      entry: join(__dirname, 'lambda-fns/start/index.ts'),
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