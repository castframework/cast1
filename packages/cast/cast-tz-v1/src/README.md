### Convention

type naming : `T_typeDescription`

lambda typing : `T_methodNameInput` and `T_methodNameOutput`

local variable : `M_varName` (M_ for mutable)

#### Should I use a string literal as arguments for X ?
Most likely no, unless it's an error message then yes (eg. first argument of sp.local, second of sp.verify)

#### Can't We use `enum.Enum` for all constant ?
Maybe, feel free to look into it

### Libs 

```
MyLibs
|- blocks.py
|- lambda.py
|- types.py
```

#### Blocks 
Cannot import other libs
#### Lambda
Can import blocks from other libs
#### Types

### Boilerplate contract file

filepath : `src/myContract/myContract_contract.py`

```python
import sys
import os
sys.path.append(os.getcwd()) 
# The above need to be the first thing loaded for import to work

import smartpy as sp

from src.myContract.types import *

class MyContract(sp.Contract )
    def __init__(self):
        self.init_type(T_myContractStorage)

    @sp.entry_point
    def myEntryPoint(self, params):
        # Logic here

contract = ForgeBond()
```

### Boilerplate for a lambda 

```python
    from src.caller.types import T_Input, T_Output

    def method(self, params):
        # Set Input type
        sp.set_type(
            params,
            T_Input
        )

        #[Logic here]

        # Set Output type and return
        result = ...
        sp.set_type(result, T_Output)
        sp.result(result)
```

#### But Why ? Doesn't Smartpy duck type everything and pass it to smartML, so it should already be type safe ? And Michelson type check everything anyway !

Everything is safe as long as you are in the same contract, but when 
calling another contract or executing a lambda this does not hold.

In smartpy you set yourself the expected IO types of the callee in the caller. This mean that if the callee has not the right IO types smartpy will not emit an error. This will only be catch just before runtime by the michelson type check.

To catch that kind of errors as soon as possible we need to share the IO types
between the caller and callee.

### TODOs

- Remove seller from initiateSubscription
- Rename owner to issuer
- Regine operator error message (`undefined operator` is ugly)
- Find a lib or make one to generate contract typing for test
- Name clean up in test
- Do more testing on inter dependent lambda
- Test if using enum on lambdaName can simplify sendCreateAndPlay step

### Notes

- With taquito when accessing a Number -> X mapping you need to convert the number to a string (base 10)
