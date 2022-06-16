# replace this
cdk deploy --notification-arns arn:aws:sns:us-east-1:549672552044:cdk-deploying-stacks


https://goessner.net/articles/JsonPath/index.html#e3

https://aws.amazon.com/pt/blogs/compute/using-jsonpath-effectively-in-aws-step-functions/

https://docs.aws.amazon.com/step-functions/latest/dg/amazon-states-language-intrinsic-functions.html

https://github.com/json-path/JsonPath

# Lambda Test
```
{
  "str": "str",
  "num": 1,
  "strLst": ["str1","str2"],
  "pk": "pk",
  "map": {
    "strMap": "str",
    "numMap": 2
  },
  "numLst": [1,2],
  "mapLst": [
    { "str": "str1", "num": 1 },
    { "str": "str2", "num": 2 }
  ],
  "bool": true,
  "convertToBinary": "Converte para binario"
}
```

# Parameters
```
{
  "pk.$": "$.pk",
  "str.$": "$.str",
  "num.$": "$.num",
  "map.$": "$.map",
  "strLst.$": "$.strLst",
  "numLst.$": "$.numLst",
  "mapLst.$": "$.mapLst",
  "mapLstNum.$": "$.mapLst..num",
  "mapLstStr.$": "$.mapLst..str"
}
```
```
{
  "pk": "pk",
  "str": "str",
  "num": 1,
  "map": { "strMap": "str", "numMap": 2 },
  "strLst": ["str1","str2"],
  "numLst": [1,2],
  "mapLst": [
    { "str": "str1", "num": 1 },
    { "str": "str2", "num": 2 }
  ],
  "mapLstNum": [1,2],
  "mapLstStr": ["str1","str2"]
}
```