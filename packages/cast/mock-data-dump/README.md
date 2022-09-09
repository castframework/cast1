# Dump mock data

Simple script to dump mock data via the CAST framework.

## How to use

Update the `mock-bonds.json` and `mock-investors.json` files in the `mock-data-dump` folder (where this README sits 😉 ), following the interface definition you can overide all the field you want:

```json
[
    {"symbol":"US8", "isinCode": "US8", "issuerId": "INR2EJN1ERAN0W5ZP974", "couponRateInBips": 350},
    {"symbol":"US9", "isinCode": "US9"}
]
```

One object will create one bond.

> `symbol` and `isinCode` are mandatory, but you can also add other attributes, which will replace the base ones in [bond.json](./queries-variables/createBondInput.json)

Launch `npm start` to execute the script !