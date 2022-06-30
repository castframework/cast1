# Dump mock data

Simple script to dump mock data via the CAST framework.

## How to use

Create a `data.json` file in the `mock-data-dump` folder (where this README sits 😉 ), with the following:

```json
[
    {"symbol":"US8", "isinCode": "US8", "couponRateInBips": 350},
    {"symbol":"US9", "isinCode": "US9"}
]
```

One object will create one bond. 

> `symbol` and `isinCode` are mandatory, but you can also add other attributes, which will replace the base ones in [bond.json](./mocks/bond.json)

Launch `npm start` to execute the script !