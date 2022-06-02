export const handler = async(event:any) => {
  console.log(event);
  event.input.num = (event.input.num).toString();
  return event;
}