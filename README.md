# feathers-rules

A [FeathersJS](https://feathersjs.com) plugin for rule based authorization.
The concept is loosely based on [Firebase Firestore Rules](https://firebase.google.com/docs/firestore/security/get-started). 


## How does it work?

The plugin forbids every request by default unless there is a rule allowing access.
Rules are plain JavaScript functions that ether return true or false.
If a rule returns true the access is granted and no other rule returning false can revoke the access.
If no rule returns true a Forbidden-Exception is thrown.
So feathers-rules follows an "allow access if any of the rules is followed" approach.


## Advantages
* You **can't forget to protect a service**.
All services will automatically be protected.
* You can **define multiple rules** per service.
For example: You could split your rules by role and therefore keep your rules clean.
* Plain JavaScript functions as **rules are mighty**.
You can perform any operation in your rules.
Only want to grant access if its full moon and its the first of the month?
No problem, just implement it ;)


## Getting started


### Setup

Import the proctedServices function:

```js
import { protectServices } from 'feathers-rules'
```

Add the following code **after** you defined all your hooks:

```js
app.configure(protectServices())
```

If you created your app with the default feathers generator, a good place is **after** the service & channel configuration:

```js
app.configure(services)
app.configure(channels)

app.configure(protectServices())
```


### Add allow hook

To grant access to your services you add the `allow(rules)` hook to your app / service hooks:

```js
service.hooks({
  before: {
    all: [
      allow(rules),
    ],
  },
})
```


## Writing rules

A simple `rules` object could look like this:

```js
export const rules = {
  find: (context) => {
    // Only allow querying for the users documents
    return context.params.query && context.params.query.userId === context.params.user
  },
  create: (context) => {
    // Only allow creating a document if user creates a document for him-/herself
    return context.data && context.data.userId === context.params.user
  },
}
```

The property names are equal to the service methods (`find | get | create | update | patch | remove`) and the values are functions that get the `HookContext` as input and return a `boolean`.


### Special keywords

Also you can use the following special keywords as property names:
* `all`: Is checked for every method
* `read`: Is checked for `find` & `get`
* `write`: Is checked for `create`, `update`, `patch` & `remove`


### Single letter rules

Another way to run one rule for multiple service methods is to use single letter rules:

```js
export const rules = {
  // Runs only for create, update & patch
  cup: (context) => {
    return context.params.query && context.params.query.userId === context.params.user
  },
}
```

Single letter rules support the following mapping:

```
c --> create
f --> find
g --> get
p --> patch
r --> remove
u --> update
```

You can combine them as you like. `cup` & `upc` both work.

## What happens if your request is forbidden?

As described above a Forbidden-Exception is thrown.

The exceptions message gives insights what went wrong.
But because all rules have returned false there is no single rule that forbid access.
Hence we can't say something like "Your query has not your userId in it".

Therefore the exception message contains the service name, method, id, data & query of the request.
This helps when you are sending many requests and want to know which one failed (especially helpful when debugging websockets).

To add an additional layer of protection the data properties `password`, `newPassword`, `oldPassword` are replaced with a placeholder.
You can add additional `protectedFields`. See Advanced configuration.


## Good practices

### Don't check results in find or get

You should not run the users query in your `find` or `get` rule and check if the user has access to the returned documents.
This can lead to side channel attacks like measuring the time how long the request took and figuring out if and how many documents the rule has checked.
Always check the query directly: It the userId in the query, etc.


## Advanced configuration

## protectServices

The `protectServices(options)` function is preconfigured with the following options. 
You can overwrite them.

```js
{
  // Services that should not be protected
  omitServices: ['authentication'],
  // function that checks if params.allow is true, else throws exception
  allowedChecker: allowedChecker(),
}
```

### allowChecker

The allowChecker can be configured with the following options.

```js
{
  // The word that is printed instead of the fields value
  protectWord: '[HIDDEN]',
  // Fields in context.data that should not be printed in the exception message
  protectedFields: ['password', 'newPassword', 'oldPassword'],
}
```

To add those options you must configure `protectServices()` with your own allowChecker:

```js
protectServices({
  allowedChecker: allowedChecker({
    protectWord: 'NOTHING-TO-SEE-HERE'
  })
})
```

## FAQ

> I need to disallow access in a certain rule.
Returning false does not help because another rule keeps granting access.
What can I do?

You can always throw an Forbidden-Exception in your rules.
This breaks the whole hook chain in feathers and denies the access.