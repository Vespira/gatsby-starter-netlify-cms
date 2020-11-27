---
title: Linux Commands & Tricks reminder
date: 2020-11-27T13:37:13.000Z
description: A simple reminder to record here some Linux related knowledge
---
Store your scripts so they can be used globally into :
> /usr/local/bin

Launch a background process to run even after the user log out :

\#nohup <command> &

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

\#kill -9 <PID>

Create a symlink :

\#ln -s <source> <target>

List cron tasks for a given user :

\# crontab -l -u www-data

Convert a file with DOS-like linefeeds into Linux-like linefeeds :

\#sed -i -e 's/\r$//' <filename>

Configure a key/password into SSH agent :

\#eval \`ssh-agent\`

\#ssh-add <path/to/key> (by default, add the id_rsa key)

Display current directory:

\#pwd

Display file content in real-time :

\#tail -f /path/to/file

Search for a keyword recursivly in directory files :

\# grep -r "word"