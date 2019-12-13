```
+---------------------------------------------------------------+
|                         EPT emulator                          |
|      Concert Protocole, aka "Protocole Caisse" in french.     |
| © 2016 Libre Informatique [http://www.libre-informatique.fr/] |
+---------------------------------------------------------------+

Emulated EPT: iCT250, iWL220
```

Introduction
=============

The EPTs (Electronic Payment Terminals) provided for some trade marks like Ingenico must be tested in some kind of real conditions, and no development environments are available (like fake bank cards, fake bank accounts, etc.). So if you want to interconnect your software with their hardware, you'll need a real account, real bank cards, etc.

This project aims to replace a real EPT, real bank cards, etc. substituting the physical USB or Serial connection with a Websocket one. Things may be a bit different but this emulator will save you dozens of real transactions with your own credit card. We just hope that you'll be able to work with WebSockets easily in your own software.

Note that this project is provided "AS-IS" and if your software works out with it, this is not a proof that it will work with real EPTs...

First of all
=============

Using NPM:

```
$ npm install ept-emulator
```

Using Git, if you did that...

```
$ git clone https://github.com/libre-informatique/EPTEmulator .
$ npm update
```

The server side tests
======================

Low-layer
----------

Launch the physical-server.js script in the terminal:

```
$ node physical-server.js
```

Middle-layer
-------------

Launch the logical-server.js script in the terminal

```
$ node logical-server.js
```

Within the logical server, you will be able to answer "0" (success) or "1" (error) at the ```stat``` prompt, to emulate a failed or a successfull payment.

The client side tests
======================

Web tests
----------

You can do all your tests and Proof of Concepts using the URL http://localhost:8001/.

You also can do lots of low level experiments usign the URL http://localhost:8001/physical-tests.html, but this is not advised.

Low-layer
----------

Launch the physical-client.js script in the terminal:

```
$ node physical-client.js
```

Middle-layer
-------------

Launch the logical-client.js script in the terminal

```
$ node logical-client.js
```

Application-layer
------------------

Launch the application-client.console.js script in the terminal if you want to be "interactive" with the server.

```
$ node application-client.console.js
```

Launch the application-client.event.js script in the terminal if you want to see asynchronous automated exchanges with the server.

```
$ node application-client.console.js
```

Do not hesitate to edit and modify the ```application-client.*.js``` files to fit your own environments & tests

Integrating those libraries into your own web-app
==================================================

Refer to this the [index.html](index.html) webpage for your own integration.
Note that our libraries are compatible with nodejs & browsers for the client side, and with nodejs only for the server side.
