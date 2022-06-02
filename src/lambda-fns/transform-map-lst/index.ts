export const handler = async(event:any) => {
  console.log(event);
  return { 
    'M': {
      'N': (event.input.num).toString(),
      'S': event.input.str,  
    },
  };
}