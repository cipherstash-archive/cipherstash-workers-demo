# cipherstash-workers-demo

This repo demonstrates how to use CipherStash QX with on Cloudflare Workers.

The demo is a secure form submission service, that is made of two parts:

1. A simple site to submit forms containing sensitive data. It also has an admin section (&pi;) to query the forms.
1. A Worker the site POSTs to, encrypts the forms, and stores them in CipherStash.

## How to use

There are a couple of steps we're going to walk through to build this:

1. Set up a CipherStash workspace
1. Set up a Cloudflare Worker
1. Configure keys and credentials, so the Worker can talk to CipherStash
1. Set up the collection to store your data
1. Publish the worker and site

We're going to assume you already have Node.js and npm installed, but in case you don't, check out [the Node.js installation docs](https://nodejs.org/en/download/package-manager/) for your platform.

Let's get started.

Clone the repo with all the code we're going to use, and install the dependencies:

``` bash
git clone https://github.com/cipherstash/cipherstash-workers-demo
cd cipherstash-workers-demo
npm install
```

This will install `stash-cli` and a few other dependencies. If you have any problems installing dependencies, we have [some docs to help you out](https://docs.cipherstash.com/reference/stash-cli/stash-install-cli.html#step-1-install-dependencies).

### Set up a CipherStash workspace

To store data using CipherStash, you'll need a workspace. You can get one by creating an account:

``` bash
npx stash signup
# This will launch a browser, follow the steps.
# Note the Workspace ID you're issued at the end.
# Use the Workspace ID here:
npx stash login --workspace <WORKSPACE_ID>
```

If your workspace is not in `us-east-1` you will need to change the `CIPHERSTASH_HOST` value in `wrangler.toml`.
It's of the form `https://<region>.aws.stashdata.net`.

Note that only `us-east-1` and `ap-southeast-2` are currently available while CipherStash QX is in technology preview.

### Set up a Cloudflare Worker

If you don't already have Cloudflare account, [sign up](https://dash.cloudflare.com/sign-up), and login to Wrangler:

``` bash
npx wrangler login
```

### Configure keys and credentials

If you want to speed run this section, you can just run:

``` bash
npm run setup
```

This will do all the setup steps for you, and you can skip to the next section.

Continue reading if you want to step through each step individually.

---

First up, we need to generate an encryption key used by the Worker, and store it as a secret:

``` bash
npm run setup:create-source-key
```

This generates a unique encryption key, and stores it as a Worker secret called `CIPHERSTASH_KEY`.

Next, we need to create an access key for the Worker to talk to CipherStash QX, and store it as another secret:

``` bash
npm run setup:create-access-key
```

Finally, let's set a password for basic auth on the Worker

``` bash
npm run setup:admin-password
```

Now when you run `npx wrangler secret list`, you should see three secrets:

``` json
[
  {
    "name": "CIPHERSTASH_KEY",
    "type": "secret_text"
  },
  {
    "name": "CIPHERSTASH_CLIENT_SECRET",
    "type": "secret_text"
  },
  {
    "name": "ADMIN_AUTH_PASSWORD",
    "type": "secret_text"
  }
]
```

### Set up the Collection to Store your Data

Coming into the home stretch now.

We need to create a collection to store the submitted forms:

``` bash
npx stash create-collection patients --schema ./patients.schema.json
```

### Publish the Worker and app

Almost there! Let's publish the Worker:

``` bash
npm run publish:worker
```

And publish the app to interact with the Worker:

``` bash
npm run publish:app $WORKER_APP_URL
```

And follow the steps to create the project.

That’s it!

Now visit your pages domain and test out the app and worker.
This last step creates a new Pages project, so it might take a few minutes for the DNS records to propagate.

Don’t forget to visit `/admin` to query the encrypted forms.
