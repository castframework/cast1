# How to update smartpy-cli

- download the smartpy-cli version you want
- in `package.json`
    - change `name` to `@forgecapitalmarkets/smartpy-cli`
    - replace the script section with
    ```
    "scripts": {
      "preinstall": "python3 --version",
      "test": "echo 'nothing to do'",
      "build": "echo 'nothing to do'"
    }
    ```
    - add `bin` section : 
    ```
    "bin": {
      "smp": "./SmartPy.sh"
    }
    ```
- in `SmartPy.sh` replace `install_path=$(dirname $0)` with `install_path=$(dirname $(python -c "import os,sys; print(os.path.realpath(os.path.expanduser(sys.argv[1])))" "$0"))
`