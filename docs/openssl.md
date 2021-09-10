# OpenSSL Windows

## Install

Install [vcpkg](https://github.com/Microsoft/vcpkg#quick-start-windows), and install the OpenSSL port like this:
```
vcpkg install openssl:x64-windows
```

Set OPENSSL environment variables:
```
OPENSSL_INCLUDE_DIR=C:\<path>\vcpkg\installed\x64-windows\include
OPENSSL_LIB_DIR=C:\<path>\vcpkg\installed\x64-windows\lib
OPENSSL_STATIC=yes
```

