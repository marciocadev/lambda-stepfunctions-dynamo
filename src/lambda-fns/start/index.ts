import { SFNClient, StartExecutionCommand, StartExecutionCommandInput } from "@aws-sdk/client-sfn";

const client = new SFNClient({
  region: process.env.AWS_REGION,
});

export const handler = async(event:any) => {
  console.log(event);
  const input:StartExecutionCommandInput = {
    stateMachineArn: process.env.SM,
    input: JSON.stringify(event),
  };
  const command = new StartExecutionCommand(input);
  await client.send(command);
}