## Setting up Mumble

Download mumble server from https://mumble.info and extract it somewhere

```
wget https://dl.mumble.info/murmur-static_x86-1.3.0-rc2.tar.bz2
tar xjf murmur-static_x86-1.3.0-rc2.tar.bz2
cd murmur-static_x86-1.3.0-rc2
```

Edit `murmur.ini` change these settings:

| Original                          | New                                      |
|:---------------------------------:|:----------------------------------------:|
| ice="tcp -h 127.0.0.1 -p 6502"    | ice="tcp -h 127.0.0.1 -p `10000`"          |
| icesecretwrite=                   | icesecretwrite=`a_random_password_here`    |
| serverpassword=                   | serverpassword=`another_random_password`   |


With murmur.ini edited we can now start the mumble server with `./murmur.x86`

## Setting up the Bot

Install node with `sudo apt install node`  
Install ICE runtimes with `sudo apt install zeroc-ice-all-runtime`  
Install node modules with `npm i`  
Copy the `.env.example` to `.env` with `cp .env.example .env`  
Edit `.env` with the correct details  
Start the bot with `node bot.js`  
if everything went well you should see an output similiar to:

```
[AUTH] HTTP Server started
[MUMBLE] Server available: NO_NAME
[DISCORD] Bot connected
```


## Setting up the python authenticator

Install python and pip with `sudo apt install python3 python3-pip`  
Install python dependencies manually with `pip3 install requests redis python-dotenv`  
Install ICE with `sudo apt install python3-zeroc-ice`
start auth.py with `python3 auth.py`  
If all went well you should see somthing similar to:  

```
Setting the authenticator for server s/1 -t -e 1.0:tcp -h 127.0.0.1 -p 10000 -t infinite
```
