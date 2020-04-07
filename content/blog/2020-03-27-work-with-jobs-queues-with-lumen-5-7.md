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

### Step #1 : Prepare a battle plan (Queue configuration)

You have to wire first all the configuration before getting started. If like me, you already had a project, without queue configured, you don't have any example file to use. The docs at this stage, are really poor, and information is scattered through the net.

If you are using Lumen >= 5.7 like me, in your **.env** file, add the following key :

```
QUEUE_CONNECTION=driver_name
```

where driver_name is the way you want to store your queued elements. Personnaly, I went for 'database' so the key is \`QUEUE_CONNECTION=database\`

For **Lumen < 5.7,** just replace the \`QUEUE_CONNECTION\` with \`QUEUE_DRIVER\` key.

Then, you need to create (if not present) a **queue.php** configuration file under the config directory of project. As the file wasn't created, I read bit of information on differents website (official Laravel docs doesn't even mention that) and I had an incomplete file, not understanding what could go wrong : no errors are shown up if your conf file return unexpected elements !

```php
<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Queue Connection Name
    |--------------------------------------------------------------------------
    |
    | Laravel's queue API supports an assortment of back-ends via a single
    | API, giving you convenient access to each back-end using the same
    | syntax for every one. Here you may define a default connection.
    |
    */

    'default' => env('QUEUE_CONNECTION', 'sync'),

    /*
    |--------------------------------------------------------------------------
    | Queue Connections
    |--------------------------------------------------------------------------
    |
    | Here you may configure the connection information for each server that
    | is used by your application. A default configuration has been added
    | for each back-end shipped with Laravel. You are free to add more.
    |
    | Drivers: "sync", "database", "beanstalkd", "sqs", "redis", "null"
    |
    */

    'connections' => [

        'sync' => [
            'driver' => 'sync',
        ],
        'database' => [
            'connection' => 'database_name',
            'driver' => 'database',
            'table' => 'jobs',
            'queue' => 'default',
            'retry_after' => 90
        ],
    ],
    'failed' => [
        'driver' => env('QUEUE_FAILED_DRIVER', 'database'),
        'database' => env('DB_CONNECTION', 'mysql'),
        'table' => 'failed_jobs',
    ]
];
```

Don't forget to link this configuration file into your **boostrap/app.php** file, and add this line :

```
$app->configure('queue');
```

Let's go to the next part.



### Step #2 : Prepare your weapons (Creates technical tables, for database driver)

With database driver, need to create tables that will be used by Lumen when processing jobs. In many ressources or tutorial, it's mainly mentionned that we need "jobs" table and that's all. True thing is that it CAN work with only this table BUT, it's very valuable to also save jobs that went nuts, into a jobs failure table. To debug, and even after, in production, the exception generated is stored in a full text field.

You can create Laravel migrations files easily, with PHP Artisan commands :

`php artisan queue:table`

`php artisan queue:failed-table`

migrations file will be created under the **migrations** directory.

> Note : with my Lumen version (5.8) and probably others, the failed jobs table migration file is created unnamed.

Hence, you should :

* rename file suffix to "create_failed_jobs_tables"
* rename **CreateFailedJobsTable**
* put table name 'failed_jobs' in the **create** and **dropIfExists** functions

Then you can type the following command to execute all the migrations files :

`php artisan migrate`

Now checks if your "jobs" and "failed-jobs" tables were created, if yes, everything should be set up to go on and create now your functional code !

### Step #3 : Get ready for the assault ! (Create your queueable class)

Now, depending on what you need to do, you can extend **Job** class, or implements directly **ShouldQueue** if you need a simple queuable element.

I'll create a Job; a job to send report email daily ! (I dare you to find a simpler task !)

> Note: if you see Laravel examples; note that the **Dispatchable** trait is not available under Lumen, but doesn't prevent you to dispatch the job. I'll explain that later, keep that in mind.

So, my SendReportEmailJob class looks like this :

```php
<?php

namespace App\Jobs;

use App\Mails\ImportDeliveryOrderSuccessReport;
use App\Models\DeliveryOrderHistory;
use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;

class SendReportEmailJob extends Job
{
    private $currentDate;
    /**
     * Create a new job instance.
     *
     * @param Carbon $currentDate
     */
    public function __construct(Carbon $currentDate)
    {
         $this->currentDate = $currentDate;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $deliveryOrders = DeliveryOrder::query()
            ->whereBetween('createdAt', [$this->currentDate->hour(0), $this->currentDate->addDay(1)->hour(0)])
            ->get();

        $mail = Mail::to(config('supervision.emails'));
        // pass objects to mail template
        $mail->send(
            new ImportDeliveryOrderSuccessReport([
                'deliveryOrders' => $deliveryOrders
            ])
        );
    }
}
```

Ok here : two simple functions

* __construct : This one is called each time your daemon is checking if task should be executed, even if your task isn't planned for now. I'm pretty sure it's due to the Kernel configuration (another part covered later) : try to keep it dry then. If you do too heavy treatment here, it will impact performance of your server if you are continuously listening to new jobs to be executed.
* handle : this one is not tricky, it's simply called when the job is processed.

Now if you like me, need to trigger this task to test it from server, you will have to configure Kernel scheduler, and learn some PHP Artisan commands !

### Step #4 : Let's fight ! (Kernel configuration)

In your Kernel.php file under app/console, you can define commands, calls, jobs etc to execute. See that as an event calendar, that will be read by daemons which needs to know what it have to execute. So, I add a line like this one :

```php
$schedule->job(new SendReportEmailJob)
            ->description('Task to periodically send a delivery mailing report')
            ->everyMinute() // for test purposes
            ->withoutOverlapping()
            ->then(function() {
                // we clean old data from the delivery order history table
                DeliveryOrderHistory::where(
                  'createdAt',
                  '<',
                  Carbon::now()->subMonth(3)
                )->delete();
            });
```

Here, I define a job from the class created in step 3, and to test it, I want to execute it every minutes. To be more specific, another thing that the documentation does not clearly indicate :

there is a frame between which the event can be executed. It mean that, for example, if you decide to execute a job every 5 minutes : after a 5 minutes waiting, you will have a frame of 1 minute during which you can execute the job. Don't miss it, or you can't execute it afterwards. Don't call the job dispatch more than once in that minute, or it will be stored several times in queue.

Now that this thing is clear, you have to add a cron that executes every minut an event that dispatch jobs that are valid to be executed. Edit the cron with `crontab -e` and save this line :

```shell
* * * * * cd /var/www/my-super-lumen-project && php artisan schedule:run >> /dev/null 2>&1
```

After waiting a minute, you can check into your jobs table, you should see your first job inserted, congratulations ! This command's only goal is to elect valid scheduled tasks that need to be run, but no action will be done until something take care of reading these elected tasks.

So we will set up a listener. It can be called either by doing `php artisan queue:listen` or php `artisan queue:work`.

You can run as a background task one of these with : `nohup php artisan queue:work &`

Some options can be passed to specify queues to be listened to, max retries, if the process have to stop when queue is empty, etc ...

`php artisan queue:work --queue=queue_name --stop-when-empty --tries=3`

You can either run the listener manually when you only need to execute sometimes queued jobs : in this case, it will catch up and executes every jobs waiting in queue(s) or you can keep a background task that handle it as it come.

> If you make changes to your queue configuration, don't forget to run `php artisan queue:restart` to reset queues !

I think that's all folks ! I struggled to understand all the concepts clearly, and had to play with it.