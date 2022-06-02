export const handler = async(event:any) => {
  console.log(event);
  return (event.input).toString();
}