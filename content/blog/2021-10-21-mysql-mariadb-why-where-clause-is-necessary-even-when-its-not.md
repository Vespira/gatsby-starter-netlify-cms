---
title: MySQL/MariaDB why WHERE clause is necessary even when it's not
date: 2021-10-21T07:30:15.600Z
description: Short article to explain differences of what's going on in InnoDB
  engine when you put a WHERE clause or not
---
I had to do a query to get the most recent records of a table where we store `varbinary` objects, depending on a filter on a foreign key.
This table was in our preproduction environment, and had like 11 million records.

Here is a simplified tables schema

![](/img/transmissions_exampl_schema.drawio.png "database tables schema")

So, let's say I want from this schema, the 10 latest RawTransmission records for a given type of device.

First, I did a query like so:

```
SELECT rt.raw_data FROM transmission
JOIN device_type dt ON transmission.device_type_id = dt.device_type_id = 1
JOIN raw_transmission rt ON transmission.transmission_id = rt.transmission_id
ORDER BY transmission.transmission_id DESC
LIMIT 10;
```

And then I noticed that the query was wayyyyy too long to execute (Reminder, 11 millions records on the raw_transmission table). It even occured to abort the query, because the temporary table used to process results was full.

Then I started to wonder, why is the engine was scanning through all the records from `raw_transmission` table, as I only asked for the 10 most recent results (sorted on a primary key) ?

So I decided to explain the query with `EXPLAIN` keyword, to see what was going on:

```
EXPLAIN SELECT rt.raw_data FROM transmission
JOIN device_type dt ON transmission.device_type_id = dt.device_type_id = 1
JOIN raw_transmission rt ON transmission.transmission_id = rt.transmission_id
ORDER BY transmission.transmission_id DESC
LIMIT 10;
```

The following table resulted:

|     |             |              |            |        |                                        |         |         |                                           |          |          |                                 |
| --- | ----------- | ------------ | ---------- | ------ | -------------------------------------- | ------- | ------- | ----------------------------------------- | -------- | -------- | ------------------------------- |
| id  | select_type | table        | partitions | type   | possible_keys                          | key     | key_len | ref                                       | rows     | filtered | Extra                           |
| 1   | SIMPLE      | rt           |            | ALL    | i_raw_transmission_transmission_id     |         |         |                                           | 11256729 | 100      | Using temporary; Using filesort |
| 1   | SIMPLE      | transmission |            | eq_ref | PRIMARY, i_transmission_device_type_id | PRIMARY | 4       | database_name.rt.transmission_id          | 1        | 100      |                                 |
| 1   | SIMPLE      | dt           |            | eq_ref | PRIMARY                                | PRIMARY | 4       | database_name.transmission.device_type_id | 1        | 34,46    | Using where                     |

We can clearly see 2 things out of this:

* The whole `raw_transmission` table is scanned, as there's 11 256 729 rows processed
* There's a type ALL and no key, meaning that the `ORDER BY` and `LIMIT` clauses weren't smart enough to make use of index or scan in the right way the table.

So, I just tryed the thing differently.

We also have a `creation_date` field in the `transmission` table, that is set to the recorded transmission datetime from the device.

So I just decided to add a `WHERE` clause to filter only on the last 2 months worth of transmissions for the given device type.

And it executed blazing fast ! (approx. 200 ms)

I wanted to know the difference, so I asked to MySQL to also explain this query:

```
EXPLAIN SELECT rt.raw_data FROM transmission
JOIN device_type dt ON transmission.device_type_id = dt.device_type_id = 1
JOIN raw_transmission rt ON transmission.transmission_id = rt.transmission_id
WHERE transmission.creation_date > '2021-08-10'
ORDER BY transmission.transmission_id DESC
LIMIT 10;
```

Resulted as:

|     |             |              |            |        |                                        |                                    |         |                                            |      |          |             |
| --- | ----------- | ------------ | ---------- | ------ | -------------------------------------- | ---------------------------------- | ------- | ------------------------------------------ | ---- | -------- | ----------- |
| id  | select_type | table        | partitions | type   | possible_keys                          | key                                | key_len | ref                                        | rows | filtered | Extra       |
| 1   | SIMPLE      | transmission |            | index  | PRIMARY, i_transmission_device_type_id | PRIMARY                            | 4       |                                            | 29   | 33,33    | Using where |
| 1   | SIMPLE      | dt           |            | eq_ref | PRIMARY                                | PRIMARY                            | 4       | database_name.transmission.device_type_id  | 1    | 34,46    | Using where |
| 1   | SIMPLE      | rt           |            | ref    | i_raw_transmission_transmission_id     | i_raw_transmission_transmission_id | 4       | database_name.transmission.transmission_id | 1    | 100      |             |

To be noted from above:

* Now, a key is used for every table
* Only 29 rows are kept to process through the transmission table
* ALL type has disappeared, and **index, eq_ref or ref** are used to link results.



That's after this little experiment, we can conclude than when doing queries on low size tables, it's pretty difficult to see when you are doing something wrong.

It's always cool to understand what you are doing, and this experiment added an extra to my MySQL/MariaDB comprehension :)

Thanks for reading,