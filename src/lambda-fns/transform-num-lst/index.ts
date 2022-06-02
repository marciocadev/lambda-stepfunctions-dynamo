export const handler = async(event:any) => {
  console.log(event);
  return { 'N': (event.input).toString() };
}