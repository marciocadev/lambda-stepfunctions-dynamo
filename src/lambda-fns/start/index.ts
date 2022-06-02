import { SFNClient, StartExecutionCommand, StartExecutionCommandInput } from "@aws-sdk/client-sfn";

const client = new SFNClient({
  region: process.env.AWS_REGION,
});

export const handler = async(event:any) => {
  console.log(event);

  const inputData = {
    pk: event.pk,
    str: event.str,
    num: event.num,
    map: event.map,
    strLst: event.strLst,  
    numLst: event.numLst,
    mapLst: event.mapLst,
  };
  const input:StartExecutionCommandInput = {
    stateMachineArn: process.env.SM,
    input: JSON.stringify(inputData),
  };
  const command = new StartExecutionCommand(input);
  await client.send(command);
}