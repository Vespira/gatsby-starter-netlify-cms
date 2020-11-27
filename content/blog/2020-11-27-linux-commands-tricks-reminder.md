---
title: Linux Commands & Tricks reminder
date: 2020-11-27T13:37:13.000Z
description: A simple reminder to record here some Linux related knowledge
---
Store your scripts so they can be used globally into :
> /usr/local/bin

Launch a background process to run even after the user log out :
```shell
nohup <command> &
```

List running processes : 
```shell
# Simple list
ps -ax
# Built in advanced tool
top
# External tool, very powerful, you can sort by uptime, cpu or ram usage, etc ...
htop 
```

Kill a process by it's PID : 
```shell
kill -9 <PID>
```

Create a symlink :
```shell
ln -s /path/to/source/ /path/to/target
```

List cron tasks for a given user :
```shell
crontab -l -u <USERNAME>
```

Convert a file with DOS-like linefeeds into Linux-like linefeeds :
```shell
sed -i -e 's/\r$//' ./file
```

Configure a key/password into SSH agent :
```shell
eval \`ssh-agent\`
# By default, add the id_rsa key
ssh-add /path/to/key
```

Display current directory:
```shell
pwd
```

Display file content in real-time :
```shell
tail -f ./file
```

Search for a keyword recursivly in directory files :
```shell
grep -r "word"
```