---
title: Work with Jobs & Queues with Lumen  ^5.7
date: 2020-03-27T15:11:51.700Z
description: >-
  A small article explaining Queues and Jobs with Lumen. As some things are not
  as straightforward at it should be for existing Lumen project, let's see how
  we can avoid potential pitfalls.
---
I recently tackled down a subject that is intended to work out-of-the-box : I'm speaking about Queues/Jobs with Laravel (more specifically with LUMEN framework)

So, for those who don't know (but I guess if you are reading this you already know) : Lumen is a micro-framework based on Laravel. Exactly the same spirit as Spring Boot is based on Spring. Lightweight, for the best, but not perfect.

But, there's slight differences that can be a pain to spot. Documentation is, to my mind, missing a lot of point on explaining well how to configure queues, and how these queues works. (no schemas or little diagrams, although it can worth a thousand words)

So be it, I will try to summarize here fundamentals steps to understand and use these Laravel features :)

**Queues** : they can use multiple ways to store their content, depending of the driver you use to handle these. For example, you can store these in-memory, on a database you manage, on remote services like Amazon SQS, on Redis, etc ...

**Jobs** : jobs are queuable. They are elements that can be stored into the queues, and then, you need a trigger to execute the job, once they are stored in queue and ready to be picked up !

**Task scheduler** : there is a set of commands with PHP Artisan, allowing us to manage the task scheduling. If you register a task to be executed on a daily basis into your Kernel scheduler, you can then execute regulary a daemon which push the tasks and another that have the role of firing queued jobs that needs to be fired. This depends on what regularity you configured for your job. We'll cover that later.

### We can draw something that define what I was saying before :

![queues and jobs schema](/img/laravel_queue.png "Queues & jobs in Laravel")

What we can note about the schema :

* Jobs can be dispatched in queue(s), either programmatically (in a method) or via a cron task regularly running against the scheduled task in the Kernel.php file, that verify if it need to executes an action.

* The step 1 and 2 can be ignored it's juste business action who are retrieved in the Job executed.

* Note that the Job and tasks are asynchronous. They are totally detached from the programm lifecycle, and are executed when the daemon decides to process it.