# feathers-rules

A [FeathersJS](https://feathersjs.com) plugin for rule based authorization.
The concept is loosely based on [Firebase Firestore Rules](https://firebase.google.com/docs/firestore/security/get-started). 


## How does it work?

The plugin forbids every request by default unless there is a rule allowing access.
Rules are plain javascript functions that ether return true or false.
If a rule returns true the access is granted and no other rule returning false can revoke the access.
If no rule returns true a Forbidden-Exception is thrown.
So feathers-rules follows an "allow access if any of the rules is followed" approach.


## Advantages
* You **can't forget to protect a service**.
All services will automatically be protected.
* You can **define multiple rules** per service.
For example: You could split your rules by role and therefore keep your rules clean.
* Plain javascript functions as **rules are mighty**.
You can perform any operation in your rules.
Only want to grant access if its full moon and its the first of the month?
No problem, just implement it ;)


## Getting started

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

## Advanced configuration

## FAQ

> I need to disallow access in a certain rule. Returning false does not help because another rule keeps granting access. What can I do?

You can always throw an Forbidden-Exception in your rules. This breaks the whole hook chain in feathers and denies the access.

---

* Show default options (omitServices ignores authentication)