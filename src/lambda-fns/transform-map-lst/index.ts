export const handler = async(event:any) => {
  console.log(event);
  return { 
    'M': {
      'num': { 'N': (event.input.num).toString() },
      'str': { 'S': event.input.str},
    },
  };
}