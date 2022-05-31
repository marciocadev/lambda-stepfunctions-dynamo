import { awscdk } from 'projen';
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.26.0',
  defaultReleaseBranch: 'main',
  name: 'lambda-stepfunctions-dynamo',
  projenrcTs: true,

  deps: ['@aws-sdk/client-sfn'],
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();